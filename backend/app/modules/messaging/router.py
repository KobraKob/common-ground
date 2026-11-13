from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import verify_can_dm
from app.core.security import get_current_user
from app.modules.identity.models import StudentProfile, User
from app.modules.messaging.models import Conversation, ConversationMember, Message

router = APIRouter(prefix="/conversations", tags=["Messaging"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def direct_conversation_key(user_a: str, user_b: str) -> str:
    pair = ":".join(sorted((str(user_a), str(user_b))))
    return hashlib.sha256(pair.encode("utf-8")).hexdigest()


class DirectConversationInput(BaseModel):
    recipient_user_id: str = Field(min_length=1, max_length=64)


class MessageInput(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


async def require_conversation_member(
    conversation_id: str,
    user_id: str,
    db: AsyncSession,
) -> tuple[Conversation, ConversationMember]:
    result = await db.execute(
        select(Conversation, ConversationMember)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(
            Conversation.id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=403, detail="You do not have access to this conversation")
    return row[0], row[1]


@router.post("/direct")
async def create_direct_conversation(
    payload: DirectConversationInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipient_id = payload.recipient_user_id
    if recipient_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot start a conversation with yourself")

    await verify_can_dm(user.id, recipient_id, db)
    key = direct_conversation_key(user.id, recipient_id)

    existing_result = await db.execute(
        select(Conversation).where(
            Conversation.conversation_type == "DIRECT",
            Conversation.direct_key == key,
        )
    )
    existing = existing_result.scalar_one_or_none()
    recipient_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == recipient_id)
    )
    recipient_profile = recipient_profile_result.scalar_one_or_none()
    if not recipient_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    recipient_name = recipient_name

    if existing:
        return {
            "id": existing.id,
            "title": recipient_profile.display_name,
            "description": existing.description,
            "conversation_type": existing.conversation_type,
            "last_message": None,
            "last_message_at": existing.last_message_at,
        }

    conversation = Conversation(
        conversation_type="DIRECT",
        direct_key=key,
        last_message_at=utc_now(),
    )
    db.add(conversation)
    await db.flush()
    db.add_all([
        ConversationMember(conversation_id=conversation.id, user_id=user.id, role="MEMBER"),
        ConversationMember(conversation_id=conversation.id, user_id=recipient_id, role="MEMBER"),
    ])

    try:
        await db.commit()
    except IntegrityError:
        # A concurrent request may have created the same direct thread.
        await db.rollback()
        concurrent_result = await db.execute(
            select(Conversation).where(
                Conversation.conversation_type == "DIRECT",
                Conversation.direct_key == key,
            )
        )
        concurrent = concurrent_result.scalar_one_or_none()
        if not concurrent:
            raise
        conversation = concurrent

    return {
        "id": conversation.id,
        "title": recipient_profile.display_name,
        "description": conversation.description,
        "conversation_type": conversation.conversation_type,
        "last_message": None,
        "last_message_at": conversation.last_message_at,
    }


@router.get("")
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    other_name = (
        select(StudentProfile.display_name)
        .join(ConversationMember, ConversationMember.user_id == StudentProfile.user_id)
        .where(
            ConversationMember.conversation_id == Conversation.id,
            ConversationMember.user_id != user.id,
        )
        .limit(1)
        .scalar_subquery()
    )
    latest_message = (
        select(Message.body)
        .where(
            Message.conversation_id == Conversation.id,
            Message.is_deleted.is_(False),
        )
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(1)
        .scalar_subquery()
    )
    latest_message_at = (
        select(Message.created_at)
        .where(
            Message.conversation_id == Conversation.id,
            Message.is_deleted.is_(False),
        )
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(1)
        .scalar_subquery()
    )
    result = await db.execute(
        select(Conversation, latest_message, latest_message_at, other_name)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(ConversationMember.user_id == user.id)
        .order_by(func.coalesce(latest_message_at, Conversation.last_message_at).desc())
        .limit(100)
    )

    conversations = []
    for conversation, last_message, message_at, peer_name in result.all():
        is_direct = conversation.conversation_type == "DIRECT"
        conversations.append({
            "id": conversation.id,
            "title": (peer_name or "Student") if is_direct else (conversation.title or "Group conversation"),
            "description": conversation.description,
            "conversation_type": conversation.conversation_type,
            "last_message": last_message,
            "last_message_at": message_at or conversation.last_message_at,
        })
    return conversations


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    response: Response,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    q: Optional[str] = Query(None, max_length=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_conversation_member(conversation_id, user.id, db)

    filters = [
        Message.conversation_id == conversation_id,
        Message.is_deleted.is_(False),
    ]
    if q and q.strip():
        filters.append(Message.body.ilike(f"%{q.strip()}%"))

    total_result = await db.execute(
        select(func.count(Message.id)).where(*filters)
    )
    total_count = int(total_result.scalar() or 0)

    result = await db.execute(
        select(Message, StudentProfile.display_name)
        .outerjoin(StudentProfile, StudentProfile.user_id == Message.sender_id)
        .where(*filters)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .offset(offset)
        .limit(limit)
    )

    messages = []
    for message, sender_name in result.all():
        messages.append({
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "sender_name": sender_name or "Student",
            "body": message.body,
            "attachments": message.attachments or [],
            "is_announcement": message.is_announcement,
            "is_pinned": message.is_pinned,
            "created_at": message.created_at,
        })

    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Has-More"] = "true" if offset + len(messages) < total_count else "false"
    return messages


@router.post("/{conversation_id}/messages")
async def send_conversation_message(
    conversation_id: str,
    payload: MessageInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation, membership = await require_conversation_member(conversation_id, user.id, db)
    clean_body = payload.body.strip()
    if not clean_body:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    is_announcement = conversation.conversation_type == "ANNOUNCEMENT_CHANNEL"
    if conversation.conversation_type == "DIRECT":
        member_result = await db.execute(
            select(ConversationMember.user_id).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != user.id,
            )
        )
        recipient_ids = member_result.scalars().all()
        if len(recipient_ids) != 1:
            raise HTTPException(status_code=403, detail="This direct conversation is unavailable")
        await verify_can_dm(user.id, recipient_ids[0], db)
    elif is_announcement:
        if membership.role not in {"MODERATOR", "OWNER"} and user.platform_role not in {"MODERATOR", "ADMIN"}:
            raise HTTPException(status_code=403, detail="Only community moderators can post announcements")

    message = Message(
        conversation_id=conversation_id,
        sender_id=user.id,
        body=clean_body,
        is_announcement=is_announcement,
    )
    conversation.last_message_at = utc_now()
    db.add(message)
    await db.commit()
    await db.refresh(message)

    profile_result = await db.execute(
        select(StudentProfile.display_name).where(StudentProfile.user_id == user.id)
    )
    sender_name = profile_result.scalar_one_or_none() or "Student"
    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "sender_name": sender_name,
        "body": message.body,
        "attachments": message.attachments or [],
        "is_announcement": message.is_announcement,
        "is_pinned": message.is_pinned,
        "created_at": message.created_at,
    }
