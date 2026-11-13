from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.analytics.models import AnalyticsEvent
from app.modules.colleges.models import College
from app.modules.communities.models import Community, CommunityMembership
from app.modules.commons.models import Post
from app.modules.events.models import Event, EventRSVP
from app.modules.identity.models import User
from app.modules.projects.models import Project

router = APIRouter(prefix="/analytics", tags=["Platform analytics"])


def _privacy_safe_count(value: int) -> int | None:
    return value if value >= 5 else None


@router.get("/overview")
async def analytics_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.platform_role not in {"ADMIN", "MODERATOR"}:
        raise HTTPException(status_code=404, detail="Not found")

    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    async def scalar_count(query) -> int:
        return int((await db.execute(query)).scalar() or 0)

    daily_active = await scalar_count(
        select(func.count(func.distinct(AnalyticsEvent.user_id))).where(
            AnalyticsEvent.user_id.is_not(None), AnalyticsEvent.created_at >= day_ago
        )
    )
    weekly_active = await scalar_count(
        select(func.count(func.distinct(AnalyticsEvent.user_id))).where(
            AnalyticsEvent.user_id.is_not(None), AnalyticsEvent.created_at >= week_ago
        )
    )
    posts_created = await scalar_count(select(func.count(Post.id)).where(Post.created_at >= month_ago, Post.is_hidden_by_mod.is_(False)))
    projects_created = await scalar_count(select(func.count(Project.id)).where(Project.created_at >= month_ago))
    events_created = await scalar_count(select(func.count(Event.id)).where(Event.created_at >= month_ago))
    event_rsvps = await scalar_count(select(func.count(EventRSVP.id)).where(EventRSVP.created_at >= month_ago))
    cross_campus_connections = await scalar_count(
        select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.event_name == "cross_campus_project_connection",
            AnalyticsEvent.created_at >= month_ago,
            AnalyticsEvent.is_cross_campus_interaction.is_(True),
        )
    )

    previous_week_users = set((await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.user_id.is_not(None),
            AnalyticsEvent.created_at >= now - timedelta(days=14),
            AnalyticsEvent.created_at < week_ago,
        ).distinct()
    )).scalars().all())
    current_week_users = set((await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.user_id.is_not(None),
            AnalyticsEvent.created_at >= week_ago,
        ).distinct()
    )).scalars().all())
    weekly_retention = (
        round(len(previous_week_users & current_week_users) / len(previous_week_users) * 100, 1)
        if len(previous_week_users) >= 5 else None
    )

    activity_rows = (await db.execute(
        select(AnalyticsEvent.user_id, AnalyticsEvent.event_name, AnalyticsEvent.created_at)
        .where(
            AnalyticsEvent.user_id.is_not(None),
            AnalyticsEvent.created_at >= month_ago,
            AnalyticsEvent.event_name.in_([
                "search_performed", "project_member_accepted",
                "cross_campus_project_connection", "community_joined", "event_rsvp",
            ]),
        )
        .order_by(AnalyticsEvent.user_id, AnalyticsEvent.created_at)
    )).all()
    first_search_by_user = {}
    connected_after_search = set()
    connection_events = {
        "project_member_accepted", "cross_campus_project_connection", "community_joined", "event_rsvp"
    }
    for user_id, event_name, created_at in activity_rows:
        if event_name == "search_performed":
            first_search_by_user.setdefault(user_id, created_at)
        elif event_name in connection_events and user_id in first_search_by_user:
            if created_at > first_search_by_user[user_id]:
                connected_after_search.add(user_id)
    search_to_connection_rate = (
        round(len(connected_after_search) / len(first_search_by_user) * 100, 1)
        if len(first_search_by_user) >= 5 else None
    )

    active_communities = await scalar_count(
        select(func.count(func.distinct(CommunityMembership.community_id)))
        .join(Community, Community.id == CommunityMembership.community_id)
        .where(
            CommunityMembership.joined_at >= month_ago,
            Community.community_type == "CROSS_CAMPUS_INTEREST",
        )
    )
    upcoming_events = await scalar_count(select(func.count(Event.id)).where(Event.starts_at >= now))

    post_by_college = dict((await db.execute(
        select(Post.college_id, func.count(Post.id))
        .where(Post.created_at >= month_ago, Post.college_id.is_not(None), Post.is_hidden_by_mod.is_(False))
        .group_by(Post.college_id)
    )).all())
    project_by_college = dict((await db.execute(
        select(Project.college_id, func.count(Project.id))
        .where(Project.created_at >= month_ago, Project.college_id.is_not(None))
        .group_by(Project.college_id)
    )).all())
    event_by_college = dict((await db.execute(
        select(Event.college_id, func.count(Event.id))
        .where(Event.created_at >= month_ago, Event.college_id.is_not(None))
        .group_by(Event.college_id)
    )).all())

    college_ids = set(post_by_college) | set(project_by_college) | set(event_by_college)
    college_names = {}
    if college_ids:
        college_names = dict((await db.execute(
            select(College.id, College.name).where(College.id.in_(college_ids))
        )).all())

    campus_activity = []
    for college_id in college_ids:
        posts = post_by_college.get(college_id, 0)
        projects = project_by_college.get(college_id, 0)
        events = event_by_college.get(college_id, 0)
        if posts + projects + events >= 5:
            campus_activity.append({
                "college": college_names.get(college_id, "Campus"),
                "posts": _privacy_safe_count(posts),
                "projects": _privacy_safe_count(projects),
                "events": _privacy_safe_count(events),
            })
    campus_activity.sort(key=lambda item: item["college"])

    return {
        "generated_at": now.isoformat(),
        "window": "30 days",
        "daily_active_students": _privacy_safe_count(daily_active),
        "weekly_active_students": _privacy_safe_count(weekly_active),
        "posts_created_30d": _privacy_safe_count(posts_created),
        "projects_created_30d": _privacy_safe_count(projects_created),
        "events_created_30d": _privacy_safe_count(events_created),
        "event_rsvps_30d": _privacy_safe_count(event_rsvps),
        "cross_campus_connections_30d": _privacy_safe_count(cross_campus_connections),
        "weekly_retention_pct": weekly_retention,
        "search_to_connection_rate_pct": search_to_connection_rate,
        "active_interest_communities_30d": _privacy_safe_count(active_communities),
        "upcoming_events": _privacy_safe_count(upcoming_events),
        "campus_activity": campus_activity,
        "note": "Counts below five are suppressed. Search conversion is a same-user, same-window proxy, not campaign attribution. Historical activity is not backfilled.",
    }
