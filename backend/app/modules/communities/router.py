import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_id
from app.core.permissions import verify_can_dm, require_community_member_role
from app.modules.identity.models import User, StudentProfile, UserBlock
from app.modules.communities.models import Community, CommunityMembership
from app.modules.messaging.models import Conversation, ConversationMember, Message
from app.modules.communities.schemas import (
    CommunityCreateRequest,
    CommunityResponse,
    DirectConversationRequest,
    ConversationResponse,
    MessageCreateRequest,
    MessageResponse,
)

router = APIRouter(tags=["Communities & Messaging"])


# ----------------------------------------------------
# Communities Endpoints
# ----------------------------------------------------

@router.post("/communities", response_model=CommunityResponse)
async def create_community(
    payload: CommunityCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check slug uniqueness
    existing = await db.execute(select(Community).where(Community.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Community slug already exists")

    # Only ADMIN can create official endorsed communities
    is_endorsed = False
    if payload.is_official_endorsed:
        if user.platform_role in ["ADMIN"]:
            is_endorsed = True
        else:
            is_endorsed = False  # Student created cannot endorse themselves

    invite_code = uuid.uuid4().hex[:8].upper()
    community = Community(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        community_type=payload.community_type,
        visibility=payload.visibility,
        college_id=payload.college_id,
        is_official_endorsed=is_endorsed,
        invite_code=invite_code,
        created_by=user.id,
        member_count=1,
    )
    db.add(community)
    await db.flush()

    # Add creator as OWNER membership
    membership = CommunityMembership(
        community_id=community.id,
        user_id=user.id,
        role="OWNER",
    )
    db.add(membership)

    # Automatically provision 2 linked conversations:
    # 1. ANNOUNCEMENT_CHANNEL (admin/mod only post)
    announcement_conv = Conversation(
        conversation_type="ANNOUNCEMENT_CHANNEL",
        community_id=community.id,
        title=f"{community.name} Announcements",
        description="Official updates and pinned alerts",
    )
    db.add(announcement_conv)
    await db.flush()

    # 2. GROUP_CHAT (open discussion with threads)
    chat_conv = Conversation(
        conversation_type="GROUP_CHAT",
        community_id=community.id,
        title=f"{community.name} Chat",
        description="General discussion and member threads",
    )
    db.add(chat_conv)
    await db.flush()

    # Add creator to both conversation members
    db.add(ConversationMember(conversation_id=announcement_conv.id, user_id=user.id, role="OWNER"))
    db.add(ConversationMember(conversation_id=chat_conv.id, user_id=user.id, role="OWNER"))

    await db.commit()
    await db.refresh(community)
    return community


@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(
    response: Response,
    college_id: Optional[str] = None,
    community_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Community).where(Community.visibility != "PRIVATE_INVITE_ONLY")
    if college_id:
        query = query.where(Community.college_id == college_id)
    if community_type:
        query = query.where(Community.community_type == community_type)
    if search:
        query = query.where(Community.name.ilike(f"%{search}%"))

    count_subq = query.order_by(None).subquery()
    count_res = await db.execute(select(func.count()).select_from(count_subq))
    total_count = count_res.scalar() or 0

    result = await db.execute(query.order_by(desc(Community.member_count)).offset(offset).limit(limit))
    communities = result.scalars().all()

    has_more = (offset + len(communities)) < total_count
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Has-More"] = "true" if has_more else "false"
    response.headers["X-Offset"] = str(offset)
    response.headers["X-Limit"] = str(limit)

    return communities


@router.post("/communities/{community_id}/join")
async def join_community(
    community_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c_res = await db.execute(select(Community).where(Community.id == community_id))
    community = c_res.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # If CAMPUS_RESTRICTED, ensure student belongs to this campus
    if community.visibility == "CAMPUS_RESTRICTED":
        p_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
        prof = p_res.scalar_one_or_none()
        if not prof or prof.college_id != community.college_id:
            raise HTTPException(
                status_code=403,
                detail="This community is restricted to students of its campus",
            )

    # Check already member
    m_res = await db.execute(
        select(CommunityMembership).where(
            and_(CommunityMembership.community_id == community.id, CommunityMembership.user_id == user.id)
        )
    )
    if m_res.scalar_one_or_none():
        return {"message": "Already a member of this community"}

    membership = CommunityMembership(
        community_id=community.id,
        user_id=user.id,
        role="MEMBER",
    )
    db.add(membership)
    community.member_count += 1

    # Add user to linked conversations
    convs_res = await db.execute(select(Conversation).where(Conversation.community_id == community.id))
    for conv in convs_res.scalars().all():
        db.add(ConversationMember(conversation_id=conv.id, user_id=user.id, role="MEMBER"))

    await db.commit()
    return {"message": "Joined community successfully", "community_id": community.id}


@router.post("/communities/join-by-code/{invite_code}")
async def join_by_invite_code(
    invite_code: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c_res = await db.execute(select(Community).where(Community.invite_code == invite_code.upper()))
    community = c_res.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    m_res = await db.execute(
        select(CommunityMembership).where(
            and_(CommunityMembership.community_id == community.id, CommunityMembership.user_id == user.id)
        )
    )
    if m_res.scalar_one_or_none():
        return {"message": "Already a member", "community_id": community.id}

    membership = CommunityMembership(
        community_id=community.id,
        user_id=user.id,
        role="MEMBER",
    )
    db.add(membership)
    community.member_count += 1

    # Add to conversations
    convs_res = await db.execute(select(Conversation).where(Conversation.community_id == community.id))
    for conv in convs_res.scalars().all():
        db.add(ConversationMember(conversation_id=conv.id, user_id=user.id, role="MEMBER"))

    await db.commit()
    return {"message": "Joined community via invite link", "community_id": community.id}


# ----------------------------------------------------
# Conversations & Messaging Endpoints
# ----------------------------------------------------

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_user_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .where(ConversationMember.user_id == user.id)
        .order_by(desc(Conversation.last_message_at))
    )
    conversations = result.scalars().unique().all()
    if not conversations:
        return []

    conversation_ids = [conversation.id for conversation in conversations]
    direct_ids = [
        conversation.id for conversation in conversations
        if conversation.conversation_type == "DIRECT"
    ]

    latest_messages = (
        select(
            Message.conversation_id.label("conversation_id"),
            Message.body.label("body"),
            func.row_number().over(
                partition_by=Message.conversation_id,
                order_by=Message.created_at.desc(),
            ).label("row_number"),
        )
        .where(
            Message.conversation_id.in_(conversation_ids),
            Message.is_deleted.is_(False),
        )
        .subquery()
    )
    previews_result = await db.execute(
        select(latest_messages.c.conversation_id, latest_messages.c.body)
        .where(latest_messages.c.row_number == 1)
    )
    previews = {
        conversation_id: body[:140]
        for conversation_id, body in previews_result.all()
    }

    counterpart_rows = await db.execute(
        select(
            ConversationMember.conversation_id,
            ConversationMember.user_id,
            StudentProfile.display_name,
            StudentProfile.dm_permission,
            StudentProfile.profile_visibility,
            StudentProfile.college_id,
        )
        .join(StudentProfile, StudentProfile.user_id == ConversationMember.user_id)
        .where(
            ConversationMember.conversation_id.in_(direct_ids),
            ConversationMember.user_id != user.id,
        )
    ) if direct_ids else None
    counterparts = {
        conversation_id: {
            "user_id": other_user_id,
            "display_name": display_name,
            "dm_permission": dm_permission,
            "profile_visibility": profile_visibility,
            "college_id": college_id,
        }
        for conversation_id, other_user_id, display_name, dm_permission, profile_visibility, college_id
        in (counterpart_rows.all() if counterpart_rows else [])
    }

    member_roles_result = await db.execute(
        select(ConversationMember.conversation_id, ConversationMember.role).where(
            ConversationMember.user_id == user.id,
            ConversationMember.conversation_id.in_(conversation_ids),
        )
    )
    member_roles = {conversation_id: role for conversation_id, role in member_roles_result.all()}

    current_profile_result = await db.execute(
        select(StudentProfile.college_id).where(StudentProfile.user_id == user.id)
    )
    current_college_id = current_profile_result.scalar_one_or_none()
    current_community_result = await db.execute(
        select(CommunityMembership.community_id).where(CommunityMembership.user_id == user.id)
    )
    current_community_ids = set(current_community_result.scalars().all())

    outgoing_blocks = await db.execute(
        select(UserBlock.blocked_id).where(UserBlock.blocker_id == user.id)
    )
    incoming_blocks = await db.execute(
        select(UserBlock.blocker_id).where(UserBlock.blocked_id == user.id)
    )
    blocked_user_ids = set(outgoing_blocks.scalars().all()) | set(incoming_blocks.scalars().all())

    shared_users = set()
    if current_community_ids and counterparts:
        shared_rows = await db.execute(
            select(CommunityMembership.user_id).where(
                CommunityMembership.user_id.in_([item["user_id"] for item in counterparts.values()]),
                CommunityMembership.community_id.in_(current_community_ids),
            ).distinct()
        )
        shared_users = set(shared_rows.scalars().all())

    responses = []
    for conversation in conversations:
        title = conversation.title
        if conversation.conversation_type == "DIRECT":
            counterpart = counterparts.get(conversation.id)
            if not counterpart:
                continue
            counterpart_id = counterpart["user_id"]
            same_campus = bool(current_college_id and counterpart["college_id"] == current_college_id)
            shares_community = counterpart_id in shared_users
            if counterpart_id in blocked_user_ids or counterpart["dm_permission"] not in {"EVERYONE", "SAME_CAMPUS_OR_COMMUNITY"}:
                continue
            if counterpart["profile_visibility"] == "CAMPUS_ONLY" and not same_campus:
                continue
            if counterpart["profile_visibility"] == "SHARED_COMMUNITIES_ONLY" and not shares_community:
                continue
            if counterpart["profile_visibility"] not in {"PUBLIC", "CAMPUS_ONLY", "SHARED_COMMUNITIES_ONLY"}:
                continue
            if counterpart["dm_permission"] == "SAME_CAMPUS_OR_COMMUNITY" and not (same_campus or shares_community):
                continue
            title = counterpart["display_name"] or "Student"

        responses.append(ConversationResponse(
            id=conversation.id,
            conversation_type=conversation.conversation_type,
            community_id=conversation.community_id,
            title=title,
            description=conversation.description,
            created_at=conversation.created_at,
            last_message_at=conversation.last_message_at,
            last_message=previews.get(conversation.id),
            member_role=member_roles.get(conversation.id),
        ))
    return responses

@router.post("/conversations/direct", response_model=ConversationResponse)
async def get_or_create_direct_conversation(
    payload: DirectConversationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.id == payload.recipient_user_id:
        raise HTTPException(status_code=400, detail="Cannot start a direct message with yourself")

    # Strictly verify DM permissions and user block lists
    await verify_can_dm(user.id, payload.recipient_user_id, db)

    # Check existing DM
    q = (
        select(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .where(
            Conversation.conversation_type == "DIRECT",
            ConversationMember.user_id.in_([user.id, payload.recipient_user_id]),
        )
        .group_by(Conversation.id)
    )
    res = await db.execute(q)
    existing_convs = res.scalars().all()

    for conv in existing_convs:
        # Check members count and members
        m_res = await db.execute(
            select(ConversationMember.user_id).where(ConversationMember.conversation_id == conv.id)
        )
        members = set(m_res.scalars().all())
        if members == {user.id, payload.recipient_user_id}:
            return ConversationResponse(
                id=conv.id,
                conversation_type=conv.conversation_type,
                community_id=conv.community_id,
                title=conv.title,
                description=conv.description,
                created_at=conv.created_at,
                last_message_at=conv.last_message_at,
            )

    # Get recipient profile name for title
    p_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == payload.recipient_user_id))
    recip_prof = p_res.scalar_one_or_none()
    title = recip_prof.display_name if recip_prof else "Direct Message"

    new_conv = Conversation(
        conversation_type="DIRECT",
        title=title,
        description="Private 1-to-1 conversation",
    )
    db.add(new_conv)
    await db.flush()

    db.add(ConversationMember(conversation_id=new_conv.id, user_id=user.id, role="MEMBER"))
    db.add(ConversationMember(conversation_id=new_conv.id, user_id=payload.recipient_user_id, role="MEMBER"))
    await db.commit()
    await db.refresh(new_conv)

    return ConversationResponse(
        id=new_conv.id,
        conversation_type=new_conv.conversation_type,
        community_id=new_conv.community_id,
        title=new_conv.title,
        description=new_conv.description,
        created_at=new_conv.created_at,
        last_message_at=new_conv.last_message_at,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_conversation_messages(
    conversation_id: str,
    response: Response,
    q: Optional[str] = Query(None, max_length=100),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify user is a member of the conversation
    mem_res = await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == user.id)
        )
    )
    member = mem_res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="You do not have access to this conversation")

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
        if other_user_id:
            await verify_can_dm(user.id, other_user_id, db)

    query = (
        select(Message, StudentProfile.display_name, StudentProfile.handle)
        .join(StudentProfile, Message.sender_id == StudentProfile.user_id, isouter=True)
        .where(and_(Message.conversation_id == conversation_id, Message.is_deleted == False))
    )
    if q:
        query = query.where(Message.body.ilike(f"%{q}%"))

    count_subq = select(func.count(Message.id)).where(
        and_(Message.conversation_id == conversation_id, Message.is_deleted == False)
    )
    if q:
        count_subq = count_subq.where(Message.body.ilike(f"%{q}%"))
    count_res = await db.execute(count_subq)
    total_count = count_res.scalar() or 0

    query = query.order_by(Message.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    rows = list(result.all())
    rows.reverse()

    from datetime import datetime, timezone
    member.last_read_at = datetime.now(timezone.utc)
    await db.commit()

    has_more = (offset + len(rows)) < total_count
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Has-More"] = "true" if has_more else "false"
    response.headers["X-Offset"] = str(offset)
    response.headers["X-Limit"] = str(limit)

    resp = []
    for msg, d_name, handle in rows:
        resp.append(
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender_id=msg.sender_id,
                sender_name=d_name or "Student",
                sender_handle=handle or "anonymous",
                reply_to_message_id=msg.reply_to_message_id,
                body=msg.body,
                attachments=msg.attachments or [],
                is_announcement=msg.is_announcement,
                is_pinned=msg.is_pinned,
                created_at=msg.created_at,
            )
        )
    return resp


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    payload: MessageCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Suspended accounts cannot send messages")

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Message cannot be empty")
    if len(body) > 5000:
        raise HTTPException(status_code=422, detail="Message exceeds the 5000 character limit")

    # Verify membership
    mem_res = await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == user.id)
        )
    )
    member = mem_res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this conversation")

    # Fetch conversation details
    conv_res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # If ANNOUNCEMENT_CHANNEL, enforce that only OWNER or MODERATOR can post!
    is_announcement = False
    if conv.conversation_type == "ANNOUNCEMENT_CHANNEL":
        if member.role not in ["OWNER", "MODERATOR"]:
            raise HTTPException(
                status_code=403,
                detail="Only community moderators and owners can post to the announcement channel",
            )
        is_announcement = True

    # If DIRECT message, verify neither user blocked the other
    if conv.conversation_type == "DIRECT":
        other_res = await db.execute(
            select(ConversationMember.user_id).where(
                and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id != user.id)
            )
        )
        other_user_id = other_res.scalar_one_or_none()
        if other_user_id:
            await verify_can_dm(user.id, other_user_id, db)

    recent_since = datetime.now(timezone.utc) - timedelta(minutes=1)
    recent_count_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.sender_id == user.id,
            Message.created_at >= recent_since,
        )
    )
    if int(recent_count_result.scalar() or 0) >= 30:
        raise HTTPException(status_code=429, detail="Message rate limit reached. Try again shortly.")

    now = datetime.now(timezone.utc)
    member.last_read_at = now
    msg = Message(
        conversation_id=conversation_id,
        sender_id=user.id,
        reply_to_message_id=payload.reply_to_message_id,
        body=body,
        attachments=payload.attachments,
        is_announcement=is_announcement,
        created_at=now,
    )
    db.add(msg)
    conv.last_message_at = now
    await db.commit()
    await db.refresh(msg)

    # Fetch sender profile for display
    p_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    prof = p_res.scalar_one_or_none()

    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=prof.display_name if prof else "Student",
        sender_handle=prof.handle if prof else "student",
        reply_to_message_id=msg.reply_to_message_id,
        body=msg.body,
        attachments=msg.attachments or [],
        is_announcement=msg.is_announcement,
        is_pinned=msg.is_pinned,
        created_at=msg.created_at,
    )
