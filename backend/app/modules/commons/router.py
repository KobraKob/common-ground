import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_id
from app.modules.identity.models import User, StudentProfile, UserBlock, UserMute
from app.modules.colleges.models import College
from app.modules.communities.models import Community, CommunityMembership
from app.modules.commons.models import Post, Poll, PollVote, Comment, Reaction, Resource
from app.modules.messaging.models import Conversation, ConversationMember, Message
from app.modules.commons.schemas import (
    PostCreateRequest,
    PostResponse,
    CommentCreateRequest,
    CommentResponse,
    PollVoteRequest,
    ResourceCreateRequest,
    ResourceResponse,
    UnifiedSearchResponse,
)

router = APIRouter(tags=["Commons, Feeds & Search"])


@router.get("/posts", response_model=List[PostResponse])
async def list_posts(
    scope: str = Query("city", pattern="^(campus|city|commons|opportunities)$"),
    tag: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user_id: Optional[str] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    blocked_user_ids = set()
    muted_tags = set()
    user_college_id = None

    if current_user_id:
        # Get blocks
        b_res = await db.execute(
            select(UserBlock).where(
                or_(UserBlock.blocker_id == current_user_id, UserBlock.blocked_id == current_user_id)
            )
        )
        for b in b_res.scalars().all():
            blocked_user_ids.add(b.blocker_id if b.blocker_id != current_user_id else b.blocked_id)

        # Get mutes
        m_res = await db.execute(select(UserMute).where(UserMute.user_id == current_user_id))
        for m in m_res.scalars().all():
            if m.muted_target_type == "USER":
                blocked_user_ids.add(m.muted_target_value)
            elif m.muted_target_type == "TAG":
                muted_tags.add(m.muted_target_value.lower())

        # Get current user's college
        p_res = await db.execute(select(StudentProfile.college_id).where(StudentProfile.user_id == current_user_id))
        user_college_id = p_res.scalar_one_or_none()

    query = select(Post).where(Post.is_hidden_by_mod == False)

    # Filter out blocked users
    if blocked_user_ids:
        query = query.where(~Post.author_id.in_(blocked_user_ids))

    if scope == "campus":
        if user_college_id:
            query = query.where(Post.college_id == user_college_id)
    elif scope == "city":
        query = query.where(
            or_(
                Post.is_cross_campus == True,
                Post.category.in_(["DISCUSSION", "HANGOUT_MEME"]),
            )
        )
    elif scope == "commons":
        query = query.where(Post.category.in_(["QUESTION_QA", "DISCUSSION"]))
    elif scope == "opportunities":
        query = query.where(Post.category == "OPPORTUNITY")

    if tag:
        # Check tag filtering
        query = query.where(Post.tags.ilike(f"%{tag}%"))

    query = query.order_by(Post.is_pinned.desc(), desc(Post.created_at)).limit(limit)
    result = await db.execute(query.options(selectinload(Post.poll)))
    posts = result.scalars().all()

    # Resolve related display data in bounded batch queries instead of N+1 lookups.
    author_ids = {post.author_id for post in posts}
    community_ids = {post.community_id for post in posts if post.community_id}
    college_ids = {post.college_id for post in posts if post.college_id}

    authors_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id.in_(author_ids))
    ) if author_ids else None
    authors_by_id = {
        profile.user_id: profile for profile in authors_result.scalars().all()
    } if authors_result else {}

    communities_result = await db.execute(
        select(Community.id, Community.name).where(Community.id.in_(community_ids))
    ) if community_ids else None
    community_names = dict(communities_result.all()) if communities_result else {}

    colleges_result = await db.execute(
        select(College.id, College.name).where(College.id.in_(college_ids))
    ) if college_ids else None
    college_names = dict(colleges_result.all()) if colleges_result else {}

    response = []
    for p in posts:
        # Skip if post contains muted tags
        post_tags = [t.lower() for t in (p.tags or [])]
        if any(t in muted_tags for t in post_tags):
            continue

        author = authors_by_id.get(p.author_id)
        comm_name = community_names.get(p.community_id)
        col_name = college_names.get(p.college_id)

        # Get poll data if any
        poll_dict = None
        if p.poll:
            poll_dict = {
                "id": p.poll.id,
                "question": p.poll.question,
                "options": p.poll.options,
                "expires_at": p.poll.expires_at.isoformat() if p.poll.expires_at else None,
            }

        response.append(
            PostResponse(
                id=p.id,
                author_id=p.author_id,
                author_name=author.display_name if author else "Student",
                author_handle=author.handle if author else "student",
                author_avatar=author.avatar_url if author else None,
                author_verification=author.verification_stage if author else "STAGE_1_PROVISIONAL",
                community_id=p.community_id,
                community_name=comm_name,
                college_id=p.college_id,
                college_name=col_name,
                category=p.category,
                title=p.title,
                body=p.body,
                tags=p.tags or [],
                is_cross_campus=p.is_cross_campus,
                is_pinned=p.is_pinned,
                accepted_answer_comment_id=p.accepted_answer_comment_id,
                opportunity_meta=p.opportunity_meta,
                poll=poll_dict,
                upvotes_count=p.upvotes_count,
                comments_count=p.comments_count,
                created_at=p.created_at,
            )
        )

    return response


@router.post("/posts", response_model=PostResponse)
async def create_post(
    payload: PostCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch author profile
    p_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    prof = p_res.scalar_one_or_none()

    college_id = payload.college_id or (prof.college_id if prof else None)

    post = Post(
        author_id=user.id,
        community_id=payload.community_id,
        college_id=college_id,
        category=payload.category,
        title=payload.title,
        body=payload.body,
        tags=payload.tags,
        is_cross_campus=payload.is_cross_campus,
        is_pinned=payload.is_pinned if user.platform_role in ["ADMIN", "MODERATOR"] else False,
        opportunity_meta=payload.opportunity_meta,
    )
    db.add(post)
    await db.flush()

    # Create poll if poll details provided
    poll_dict = None
    if payload.poll_question and payload.poll_options:
        options_data = [{"id": f"opt_{i+1}", "text": opt, "votes": 0} for i, opt in enumerate(payload.poll_options)]
        poll = Poll(
            post_id=post.id,
            question=payload.poll_question,
            options=options_data,
        )
        db.add(poll)
        await db.flush()
        poll_dict = {
            "id": poll.id,
            "question": poll.question,
            "options": poll.options,
            "expires_at": None,
        }

    await db.commit()
    await db.refresh(post)

    comm_name = None
    if post.community_id:
        c_res = await db.execute(select(Community.name).where(Community.id == post.community_id))
        comm_name = c_res.scalar_one_or_none()

    col_name = None
    if post.college_id:
        col_res = await db.execute(select(College.name).where(College.id == post.college_id))
        col_name = col_res.scalar_one_or_none()

    return PostResponse(
        id=post.id,
        author_id=post.author_id,
        author_name=prof.display_name if prof else "Student",
        author_handle=prof.handle if prof else "student",
        author_avatar=prof.avatar_url if prof else None,
        author_verification=prof.verification_stage if prof else "STAGE_1_PROVISIONAL",
        community_id=post.community_id,
        community_name=comm_name,
        college_id=post.college_id,
        college_name=col_name,
        category=post.category,
        title=post.title,
        body=post.body,
        tags=post.tags or [],
        is_cross_campus=post.is_cross_campus,
        is_pinned=post.is_pinned,
        accepted_answer_comment_id=post.accepted_answer_comment_id,
        opportunity_meta=post.opportunity_meta,
        poll=poll_dict,
        upvotes_count=post.upvotes_count,
        comments_count=post.comments_count,
        created_at=post.created_at,
    )


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def list_post_comments(
    post_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Comment, StudentProfile.display_name, StudentProfile.handle, StudentProfile.avatar_url)
        .join(StudentProfile, Comment.author_id == StudentProfile.user_id, isouter=True)
        .where(and_(Comment.post_id == post_id, Comment.is_hidden_by_mod == False))
        .order_by(Comment.is_useful_answer.desc(), Comment.created_at.asc())
    )
    result = await db.execute(query)
    rows = result.all()

    resp = []
    for c, d_name, handle, avatar in rows:
        resp.append(
            CommentResponse(
                id=c.id,
                post_id=c.post_id,
                author_id=c.author_id,
                author_name=d_name or "Student",
                author_handle=handle or "student",
                author_avatar=avatar,
                parent_comment_id=c.parent_comment_id,
                body=c.body,
                is_useful_answer=c.is_useful_answer,
                upvotes_count=c.upvotes_count,
                created_at=c.created_at,
            )
        )
    return resp


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def add_post_comment(
    post_id: str,
    payload: CommentCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p_res = await db.execute(select(Post).where(Post.id == post_id))
    post = p_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        author_id=user.id,
        parent_comment_id=payload.parent_comment_id,
        body=payload.body,
    )
    db.add(comment)
    post.comments_count += 1
    await db.commit()
    await db.refresh(comment)

    prof_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    prof = prof_res.scalar_one_or_none()

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        author_id=comment.author_id,
        author_name=prof.display_name if prof else "Student",
        author_handle=prof.handle if prof else "student",
        author_avatar=prof.avatar_url if prof else None,
        parent_comment_id=comment.parent_comment_id,
        body=comment.body,
        is_useful_answer=comment.is_useful_answer,
        upvotes_count=comment.upvotes_count,
        created_at=comment.created_at,
    )


@router.post("/posts/{post_id}/accept-answer/{comment_id}")
async def accept_answer(
    post_id: str,
    comment_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p_res = await db.execute(select(Post).where(Post.id == post_id))
    post = p_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Author of post or platform moderator can accept answer
    if post.author_id != user.id and user.platform_role not in ["MODERATOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only post author can accept an answer")

    c_res = await db.execute(select(Comment).where(and_(Comment.id == comment_id, Comment.post_id == post_id)))
    comment = c_res.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found for this post")

    # Unmark previous accepted comment if any
    if post.accepted_answer_comment_id:
        prev_res = await db.execute(select(Comment).where(Comment.id == post.accepted_answer_comment_id))
        prev_comm = prev_res.scalar_one_or_none()
        if prev_comm:
            prev_comm.is_useful_answer = False

    post.accepted_answer_comment_id = comment.id
    comment.is_useful_answer = True
    await db.commit()
    return {"message": "Answer marked as accepted/useful successfully"}


@router.post("/posts/{post_id}/vote-poll")
async def vote_poll(
    post_id: str,
    payload: PollVoteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    poll_res = await db.execute(select(Poll).where(Poll.post_id == post_id))
    poll = poll_res.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="No poll found on this post")

    existing_vote = await db.execute(
        select(PollVote).where(and_(PollVote.poll_id == poll.id, PollVote.user_id == user.id))
    )
    if existing_vote.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already voted in this poll")

    vote = PollVote(poll_id=poll.id, user_id=user.id, option_id=payload.option_id)
    db.add(vote)

    # Increment option vote count in json
    options = list(poll.options)
    for opt in options:
        if opt.get("id") == payload.option_id:
            opt["votes"] = opt.get("votes", 0) + 1
    poll.options = options

    await db.commit()
    return {"message": "Vote recorded successfully", "options": poll.options}


# ----------------------------------------------------
# Resources Endpoints
# ----------------------------------------------------

@router.get("/resources", response_model=List[ResourceResponse])
async def list_resources(
    subject: Optional[str] = None,
    community_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource).where(Resource.is_public_commons == True)
    if community_id:
        query = query.where(Resource.community_id == community_id)
    if subject:
        query = query.where(Resource.subject_tags.ilike(f"%{subject}%"))

    result = await db.execute(query.order_by(Resource.is_pinned.desc(), desc(Resource.created_at)).limit(limit))
    resources = result.scalars().all()

    uploader_ids = {resource.uploader_id for resource in resources}
    uploader_result = await db.execute(
        select(StudentProfile.user_id, StudentProfile.display_name).where(
            StudentProfile.user_id.in_(uploader_ids)
        )
    ) if uploader_ids else None
    uploader_names = dict(uploader_result.all()) if uploader_result else {}

    resp = []
    for r in resources:
        uploader_name = uploader_names.get(r.uploader_id, "Student")
        resp.append(
            ResourceResponse(
                id=r.id,
                uploader_id=r.uploader_id,
                uploader_name=uploader_name,
                title=r.title,
                description=r.description,
                file_url=r.file_url,
                external_link=r.external_link,
                subject_tags=r.subject_tags or [],
                is_pinned=r.is_pinned,
                is_public_commons=r.is_public_commons,
                created_at=r.created_at,
            )
        )
    return resp


@router.post("/resources", response_model=ResourceResponse)
async def create_resource(
    payload: ResourceCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resource = Resource(
        uploader_id=user.id,
        community_id=payload.community_id,
        college_id=payload.college_id,
        title=payload.title,
        description=payload.description,
        file_url=payload.file_url,
        external_link=payload.external_link,
        subject_tags=payload.subject_tags,
        is_pinned=payload.is_pinned,
        is_public_commons=payload.is_public_commons,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)

    up_res = await db.execute(select(StudentProfile.display_name).where(StudentProfile.user_id == user.id))
    uploader_name = up_res.scalar_one_or_none() or "Student"

    return ResourceResponse(
        id=resource.id,
        uploader_id=resource.uploader_id,
        uploader_name=uploader_name,
        title=resource.title,
        description=resource.description,
        file_url=resource.file_url,
        external_link=resource.external_link,
        subject_tags=resource.subject_tags or [],
        is_pinned=resource.is_pinned,
        is_public_commons=resource.is_public_commons,
        created_at=resource.created_at,
    )


# ----------------------------------------------------
# Unified Search Endpoint
# ----------------------------------------------------

@router.get("/search", response_model=UnifiedSearchResponse)
async def unified_search(
    q: str = Query(..., min_length=2),
    current_user_id: Optional[str] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query_str = f"%{q.lower()}%"

    # 1. Students (respecting profile visibility)
    stud_res = await db.execute(
        select(StudentProfile).where(
            and_(
                StudentProfile.profile_visibility == "PUBLIC",
                or_(
                    StudentProfile.handle.ilike(query_str),
                    StudentProfile.display_name.ilike(query_str),
                    StudentProfile.skills.ilike(query_str),
                ),
            )
        ).limit(10)
    )
    students = [
        {"id": s.user_id, "handle": s.handle, "name": s.display_name, "skills": s.skills, "stage": s.verification_stage}
        for s in stud_res.scalars().all()
    ]

    # 2. Communities (public or campus)
    comm_res = await db.execute(
        select(Community).where(
            and_(
                Community.visibility != "PRIVATE_INVITE_ONLY",
                or_(Community.name.ilike(query_str), Community.description.ilike(query_str)),
            )
        ).limit(10)
    )
    communities = [
        {"id": c.id, "name": c.name, "slug": c.slug, "type": c.community_type, "member_count": c.member_count}
        for c in comm_res.scalars().all()
    ]

    # 3. Commons posts (public posts)
    post_res = await db.execute(
        select(Post).where(
            and_(
                Post.is_hidden_by_mod == False,
                or_(Post.title.ilike(query_str), Post.body.ilike(query_str)),
            )
        ).limit(10)
    )
    commons_posts = [
        {"id": p.id, "title": p.title, "body": p.body[:150], "category": p.category, "upvotes": p.upvotes_count}
        for p in post_res.scalars().all()
    ]

    # 4. Resources
    res_res = await db.execute(
        select(Resource).where(
            and_(
                Resource.is_public_commons == True,
                or_(Resource.title.ilike(query_str), Resource.subject_tags.ilike(query_str)),
            )
        ).limit(10)
    )
    resources = [
        {"id": r.id, "title": r.title, "tags": r.subject_tags, "file_url": r.file_url, "link": r.external_link}
        for r in res_res.scalars().all()
    ]

    # 5. Authorized Messages (ONLY from conversations where current user is a member)
    messages = []
    if current_user_id:
        user_convs = await db.execute(
            select(ConversationMember.conversation_id).where(ConversationMember.user_id == current_user_id)
        )
        allowed_conv_ids = user_convs.scalars().all()
        if allowed_conv_ids:
            msg_res = await db.execute(
                select(Message).where(
                    and_(
                        Message.conversation_id.in_(allowed_conv_ids),
                        Message.is_deleted == False,
                        Message.body.ilike(query_str),
                    )
                ).limit(10)
            )
            messages = [
                {"id": m.id, "conversation_id": m.conversation_id, "body": m.body[:150], "created_at": m.created_at.isoformat()}
                for m in msg_res.scalars().all()
            ]

    return UnifiedSearchResponse(
        students=students,
        communities=communities,
        commons_posts=commons_posts,
        resources=resources,
        messages=messages,
    )
