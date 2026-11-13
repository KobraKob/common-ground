from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.communities.models import CommunityMembership
from app.modules.identity.models import StudentProfile, User, UserBlock
from app.modules.messaging.models import Conversation, ConversationMember, Message

router = APIRouter(tags=["Messaging"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DirectConversationCreate(BaseModel):
    target_user_id: str = Field(min_length=1, max_length=64)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class ConversationResponse(BaseModel):
    id: str
    conversation_type: str
    community_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    last_message_at: datetime
    last_message: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_handle: str
    reply_to_message_id: Optional[str] = None
    body: str
    attachments: list[dict] = Field(default_factory=list)
    is_announcement: bool
    is_pinned: bool
    created_at: datetime


async def _conversation_member(
    db: AsyncSession,
    conversation_id: str,
    user_id: str,
) -> ConversationMember:
    result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return member


async def _has_block_between(db: AsyncSession, first_user_id: str, second_user_id: str) -> bool:
    result = await db.execute(
        select(UserBlock.id).where(
            or_(
                and_(UserBlock.blocker_id == first_user_id, UserBlock.blocked_id == second_user_id),
                and_(UserBlock.blocker_id == second_user_id, UserBlock.blocked_id == first_user_id),
            )
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _shared_community(
    db: AsyncSession,
    first_user_id: str,
    second_user_id: str,
) -> bool:
    first_result = await db.execute(
        select(CommunityMembership.community_id).where(CommunityMembership.user_id == first_user_id)
    )
    first_ids = set(first_result.scalars().all())
    if not first_ids:
        return False
    second_result = await db.execute(
        select(CommunityMembership.community_id).where(
            CommunityMembership.user_id == second_user_id,
            CommunityMembership.community_id.in_(first_ids),
        ).limit(1)
    )
    return second_result.scalar_one_or_none() is not None


async def _conversation_response(
    db: AsyncSession,
    conversation: Conversation,
    viewer_id: str,
) -> ConversationResponse:
    last_message_result = await db.execute(
        select(Message.body).where(
            Message.conversation_id == conversation.id,
            Message.is_deleted.is_(False),
        ).order_by(Message.created_at.desc()).limit(1)
    )
    last_message = last_message_result.scalar_one_or_none()

    title = conversation.title
    if conversation.conversation_type == "DIRECT":
        other_result = await db.execute(
            select(StudentProfile.display_name)
            .join(ConversationMember, ConversationMember.user_id == StudentProfile.user_id)
            .where(
                ConversationMember.conversation_id == conversation.id,
                ConversationMember.user_id != viewer_id,
            )
            .limit(1)
        )
        title = other_result.scalar_one_or_none() or "Student"

    return ConversationResponse(
        id=conversation.id,
        conversation_type=conversation.conversation_type,
        community_id=conversation.community_id,
        title=title,
        description=conversation.description,
        created_at=conversation.created_at,
        last_message_at=conversation.last_message_at,
        last_message=last_message[:140] if last_message else None,
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(ConversationMember.user_id == user.id)
        .order_by(Conversation.last_message_at.desc())
    )
    conversations = result.scalars().unique().all()
    if not conversations:
        return []

    conversation_ids = [conversation.id for conversation in conversations]
    preview_result = await db.execute(
        select(Message.conversation_id, Message.body)
        .where(
            Message.conversation_id.in_(conversation_ids),
            Message.is_deleted.is_(False),
        )
        .order_by(Message.created_at.desc())
    )
    previews = {}
    for conversation_id, body in preview_result.all():
        previews.setdefault(conversation_id, body[:140])

    other_members_result = await db.execute(
        select(
            ConversationMember.conversation_id,
            ConversationMember.user_id,
            StudentProfile.display_name,
        )
        .outerjoin(StudentProfile, StudentProfile.user_id == ConversationMember.user_id)
        .where(
            ConversationMember.conversation_id.in_(conversation_ids),
            ConversationMember.user_id != user.id,
        )
    )
    other_members = {
        conversation_id: (other_user_id, display_name or "Student")
        for conversation_id, other_user_id, display_name in other_members_result.all()
    }

    outgoing_blocks = await db.execute(
        select(UserBlock.blocked_id).where(UserBlock.blocker_id == user.id)
    )
    incoming_blocks = await db.execute(
        select(UserBlock.blocker_id).where(UserBlock.blocked_id == user.id)
    )
    blocked_ids = set(outgoing_blocks.scalars().all()) | set(incoming_blocks.scalars().all())

    responses = []
    for conversation in conversations:
        title = conversation.title
        if conversation.conversation_type == "DIRECT":
            other_user_id, title = other_members.get(conversation.id, (None, "Student"))
            if other_user_id in blocked_ids:
                continue
        responses.append(ConversationResponse(
            id=conversation.id,
            conversation_type=conversation.conversation_type,
            community_id=conversation.community_id,
            title=title,
            description=conversation.description,
            created_at=conversation.created_at,
            last_message_at=conversation.last_message_at,
            last_message=previews.get(conversation.id),
        ))
    return responses


@router.post("/conversations/direct", response_model=ConversationResponse, status_code=201)
async def create_direct_conversation(
    payload: DirectConversationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.target_user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot start a conversation with yourself")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Suspended accounts cannot send messages")

    target_result = await db.execute(select(User).where(User.id == payload.target_user_id))
    target = target_result.scalar_one_or_none()
    if not target or target.is_suspended:
        raise HTTPException(status_code=404, detail="Student not found")

    requester_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user.id)
    )
    requester_profile = requester_profile_result.scalar_one_or_none()
    target_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == target.id)
    )
    target_profile = target_profile_result.scalar_one_or_none()
    if not requester_profile or not target_profile:
        raise HTTPException(status_code=409, detail="Both students need completed profiles before messaging")

    if await _has_block_between(db, user.id, target.id):
        raise HTTPException(status_code=403, detail="Messaging is unavailable between these accounts")

    same_campus = bool(
        requester_profile.college_id
        and target_profile.college_id
        and requester_profile.college_id == target_profile.college_id
    )
    shared_community = await _shared_community(db, user.id, target.id)

    if target_profile.profile_visibility == "CAMPUS_ONLY" and not same_campus:
        raise HTTPException(status_code=403, detail="This profile is visible only to students from the same campus")
    if target_profile.profile_visibility == "SHARED_COMMUNITIES_ONLY" and not shared_community:
        raise HTTPException(status_code=403, detail="This profile is visible only to shared community members")
    if target_profile.profile_visibility not in {"PUBLIC", "CAMPUS_ONLY", "SHARED_COMMUNITIES_ONLY"}:
        raise HTTPException(status_code=403, detail="This student does not accept new conversations")

    if target_profile.dm_permission == "NONE":
        raise HTTPException(status_code=403, detail="This student does not accept new direct messages")
    if target_profile.dm_permission == "SAME_CAMPUS_OR_COMMUNITY" and not (same_campus or shared_community):
        raise HTTPException(status_code=403, detail="This student accepts messages only from campus or community peers")

    requester_conversations = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == user.id
    )
    target_conversations = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == target.id
    )
    existing_result = await db.execute(
        select(Conversation).where(
            Conversation.conversation_type == "DIRECT",
            Conversation.id.in_(requester_conversations),
            Conversation.id.in_(target_conversations),
        ).limit(1)
    )
    conversation = existing_result.scalar_one_or_none()
    if conversation:
        return await _conversation_response(db, conversation, user.id)

    now = utc_now()
    conversation = Conversation(
        conversation_type="DIRECT",
        title=None,
        description=None,
        created_at=now,
        last_message_at=now,
    )
    db.add(conversation)
    await db.flush()
    db.add_all([
        ConversationMember(conversation_id=conversation.id, user_id=user.id, role="MEMBER", last_read_at=now),
        ConversationMember(conversation_id=conversation.id, user_id=target.id, role="MEMBER", last_read_at=now),
    ])
    await db.commit()
    await db.refresh(conversation)
    return await _conversation_response(db, conversation, user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: str,
    response: Response,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: Optional[str] = Query(default=None, min_length=1, max_length=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await _conversation_member(db, conversation_id, user.id)
    conversation_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = conversation_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.conversation_type == "DIRECT":
        other_result = await db.execute(
            select(ConversationMember.user_id).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != user.id,
            ).limit(1)
        )
        other_user_id = other_result.scalar_one_or_none()
        if other_user_id and await _has_block_between(db, user.id, other_user_id):
            raise HTTPException(status_code=403, detail="Messaging is unavailable between these accounts")

    filters = [Message.conversation_id == conversation_id, Message.is_deleted.is_(False)]
    if q:
        filters.append(Message.body.ilike(f"%{q.strip()}%"))
    total_result = await db.execute(select(func.count(Message.id)).where(*filters))
    total_count = int(total_result.scalar() or 0)

    result = await db.execute(
        select(Message, StudentProfile.display_name, StudentProfile.handle)
        .outerjoin(StudentProfile, StudentProfile.user_id == Message.sender_id)
        .where(*filters)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = list(result.all())
    rows.reverse()

    member.last_read_at = utc_now()
    await db.commit()
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Has-More"] = "true" if offset + len(rows) < total_count else "false"

    return [
        MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            sender_name=display_name or "Student",
            sender_handle=handle or "",
            reply_to_message_id=message.reply_to_message_id,
            body=message.body,
            attachments=message.attachments or [],
            is_announcement=message.is_announcement,
            is_pinned=message.is_pinned,
            created_at=message.created_at,
        )
        for message, display_name, handle in rows
    ]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Message cannot be empty")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Suspended accounts cannot send messages")

    member = await _conversation_member(db, conversation_id, user.id)
    conversation_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = conversation_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.conversation_type == "ANNOUNCEMENT_CHANNEL" and member.role not in {"OWNER", "MODERATOR"}:
        raise HTTPException(status_code=403, detail="Only channel moderators can publish announcements")

    if conversation.conversation_type == "DIRECT":
        other_result = await db.execute(
            select(ConversationMember.user_id).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != user.id,
            ).limit(1)
        )
        other_user_id = other_result.scalar_one_or_none()
        if other_user_id and await _has_block_between(db, user.id, other_user_id):
            raise HTTPException(status_code=403, detail="Messaging is unavailable between these accounts")

    since = utc_now() - timedelta(minutes=1)
    recent_count_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.sender_id == user.id,
            Message.created_at >= since,
        )
    )
    if int(recent_count_result.scalar() or 0) >= 30:
        raise HTTPException(status_code=429, detail="Message rate limit reached. Try again shortly.")

    now = utc_now()
    message = Message(
        conversation_id=conversation_id,
        sender_id=user.id,
        body=body,
        attachments=[],
        is_announcement=conversation.conversation_type == "ANNOUNCEMENT_CHANNEL",
        is_pinned=False,
        is_deleted=False,
        created_at=now,
    )
    conversation.last_message_at = now
    member.last_read_at = now
    db.add(message)
    await db.commit()
    await db.refresh(message)

    profile_result = await db.execute(
        select(StudentProfile.display_name, StudentProfile.handle).where(StudentProfile.user_id == user.id)
    )
    display_name, handle = profile_result.one_or_none() or ("Student", "")
    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        sender_name=display_name or "Student",
        sender_handle=handle or "",
        reply_to_message_id=message.reply_to_message_id,
        body=message.body,
        attachments=message.attachments or [],
        is_announcement=message.is_announcement,
        is_pinned=message.is_pinned,
        created_at=message.created_at,
    )
