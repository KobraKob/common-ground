import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_id
from app.core.permissions import verify_can_dm, require_community_member_role
from app.modules.identity.models import User, StudentProfile
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
    query = (
        select(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .where(ConversationMember.user_id == user.id)
        .order_by(desc(Conversation.last_message_at))
    )
    result = await db.execute(query)
    convs = result.scalars().all()

    resp = []
    for c in convs:
        # Get last message text if any
        lm_res = await db.execute(
            select(Message.body)
            .where(and_(Message.conversation_id == c.id, Message.is_deleted == False))
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_body = lm_res.scalar_one_or_none()
        resp.append(
            ConversationResponse(
                id=c.id,
                conversation_type=c.conversation_type,
                community_id=c.community_id,
                title=c.title,
                description=c.description,
                created_at=c.created_at,
                last_message_at=c.last_message_at,
                last_message=last_body,
            )
        )
    return resp


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
    q: Optional[str] = Query(None),
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
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You do not have access to this conversation")

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

    query = query.order_by(Message.created_at.asc()).offset(offset).limit(limit)
    result = await db.execute(query)
    rows = result.all()

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

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    msg = Message(
        conversation_id=conversation_id,
        sender_id=user.id,
        reply_to_message_id=payload.reply_to_message_id,
        body=payload.body,
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
