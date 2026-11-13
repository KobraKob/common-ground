from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.cache import cache_response
from app.modules.colleges.models import College
from app.modules.colleges.schemas import CollegeResponse, CampusHubOverview
from app.modules.identity.models import StudentProfile
from app.modules.communities.models import Community
from app.modules.commons.models import Post
from app.modules.events.models import Event

router = APIRouter(prefix="/colleges", tags=["Campus & Colleges"])


@router.get("", response_model=List[CollegeResponse])
@cache_response(ttl_seconds=60, namespace="colleges_list")
async def list_colleges(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Aggregate counts in the database instead of issuing two extra queries per campus.
    member_counts = (
        select(StudentProfile.college_id, func.count(StudentProfile.user_id).label("member_count"))
        .group_by(StudentProfile.college_id)
        .subquery()
    )
    community_counts = (
        select(Community.college_id, func.count(Community.id).label("community_count"))
        .group_by(Community.college_id)
        .subquery()
    )
    query = (
        select(
            College,
            func.coalesce(member_counts.c.member_count, 0),
            func.coalesce(community_counts.c.community_count, 0),
        )
        .outerjoin(member_counts, member_counts.c.college_id == College.id)
        .outerjoin(community_counts, community_counts.c.college_id == College.id)
        .where(College.is_active_cluster.is_(True))
        .order_by(College.name)
    )
    result = await db.execute(query)
    return [
        CollegeResponse(
            id=college.id,
            name=college.name,
            slug=college.slug,
            short_name=college.short_name,
            city=college.city,
            state=college.state,
            email_domains=college.email_domains,
            is_official_partner=college.is_official_partner,
            is_active_cluster=college.is_active_cluster,
            member_count=member_count,
            community_count=community_count,
            created_at=college.created_at,
        )
        for college, member_count, community_count in result.all()
    ]

@router.get("/{slug}", response_model=CampusHubOverview)
@cache_response(ttl_seconds=60, namespace="colleges_slug")
async def get_campus_hub_overview(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    c_res = await db.execute(select(College).where(College.slug == slug))
    college = c_res.scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    # Member count
    m_res = await db.execute(
        select(func.count(StudentProfile.user_id)).where(StudentProfile.college_id == college.id)
    )
    member_count = m_res.scalar() or 0

    # Communities
    comms_res = await db.execute(
        select(Community).where(Community.college_id == college.id)
    )
    all_comms = comms_res.scalars().all()

    student_comms = [
        {"id": c.id, "name": c.name, "slug": c.slug, "description": c.description, "type": c.community_type, "member_count": c.member_count}
        for c in all_comms if not c.is_official_endorsed
    ]
    official_spaces = [
        {"id": c.id, "name": c.name, "slug": c.slug, "description": c.description, "type": c.community_type, "member_count": c.member_count}
        for c in all_comms if c.is_official_endorsed
    ]

    # Pinned announcements
    posts_res = await db.execute(
        select(Post).where(
            and_(Post.college_id == college.id, Post.category == "ANNOUNCEMENT")
        ).order_by(Post.is_pinned.desc(), Post.created_at.desc()).limit(5)
    )
    announcements = [
        {"id": p.id, "title": p.title, "body": p.body, "is_pinned": p.is_pinned, "created_at": p.created_at.isoformat()}
        for p in posts_res.scalars().all()
    ]

    # Events
    events_res = await db.execute(
        select(Event).where(Event.college_id == college.id).order_by(Event.starts_at.asc()).limit(5)
    )
    upcoming_events = [
        {"id": e.id, "title": e.title, "description": e.description, "starts_at": e.starts_at.isoformat(), "venue_or_link": e.venue_or_link, "rsvp_count": e.rsvp_count}
        for e in events_res.scalars().all()
    ]

    # Active discussions
    disc_res = await db.execute(
        select(Post).where(
            and_(Post.college_id == college.id, Post.category != "ANNOUNCEMENT")
        ).order_by(Post.created_at.desc()).limit(5)
    )
    active_discussions = [
        {"id": p.id, "title": p.title, "body": p.body, "category": p.category, "upvotes": p.upvotes_count, "comments": p.comments_count}
        for p in disc_res.scalars().all()
    ]

    college_resp = CollegeResponse(
        id=college.id,
        name=college.name,
        slug=college.slug,
        short_name=college.short_name,
        city=college.city,
        state=college.state,
        email_domains=college.email_domains,
        is_official_partner=college.is_official_partner,
        is_active_cluster=college.is_active_cluster,
        member_count=member_count,
        community_count=len(all_comms),
        created_at=college.created_at,
    )

    return CampusHubOverview(
        college=college_resp,
        student_created_communities=student_comms,
        official_spaces=official_spaces,
        pinned_announcements=announcements,
        upcoming_events=upcoming_events,
        active_discussions=active_discussions,
    )
