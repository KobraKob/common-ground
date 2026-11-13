from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.analytics.models import AnalyticsEvent
from app.modules.commons.models import Post
from app.modules.communities.models import Community
from app.modules.events.models import Event, EventRSVP
from app.modules.identity.models import StudentProfile, User
from app.modules.projects.models import Project

router = APIRouter(prefix="/analytics", tags=["Product analytics"])

Surface = Literal["landing", "city", "campus", "commons", "build", "discover", "messages", "profile", "passport", "search", "mentorship", "insights", "privacy", "terms", "opportunities"]


class AnalyticsEventInput(BaseModel):
    event_name: Literal[
        "page_view", "search_performed", "profile_opened", "feed_load_completed", "connection_created",
        "post_created", "project_created",
        "event_rsvp", "community_joined", "circle_created",
    ]
    surface: Optional[Surface] = None
    duration_ms: Optional[float] = Field(default=None, ge=0, le=120000)


async def require_analyst(user: User = Depends(get_current_user)) -> User:
    if user.platform_role not in {"ADMIN", "MODERATOR"}:
        raise HTTPException(status_code=403, detail="Analytics access is restricted to moderators")
    return user


@router.post("/events", status_code=202)
async def record_event(
    payload: AnalyticsEventInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile_result = await db.execute(
        select(StudentProfile.college_id).where(StudentProfile.user_id == user.id)
    )
    college_id = profile_result.scalar_one_or_none()
    metadata = {}
    if payload.surface:
        metadata["surface"] = payload.surface
    if payload.duration_ms is not None:
        metadata["duration_ms"] = round(payload.duration_ms, 2)
    event = AnalyticsEvent(
        user_id=user.id,
        event_name=payload.event_name,
        college_id=college_id,
        is_cross_campus_interaction=False,
        event_metadata=metadata,
    )
    db.add(event)
    await db.commit()
    return {"accepted": True}


@router.get("/summary")
async def analytics_summary(
    days: int = 30,
    user: User = Depends(require_analyst),
    db: AsyncSession = Depends(get_db),
):
    days = min(max(days, 7), 90)
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    day_ago = now - timedelta(hours=24)
    week_ago = now - timedelta(days=7)
    minimum_cohort_size = 5

    async def scalar(query):
        result = await db.execute(query)
        return int(result.scalar() or 0)

    active_24h = await scalar(
        select(func.count(func.distinct(AnalyticsEvent.user_id))).where(
            AnalyticsEvent.created_at >= day_ago, AnalyticsEvent.user_id.is_not(None)
        )
    )
    active_7d = await scalar(
        select(func.count(func.distinct(AnalyticsEvent.user_id))).where(
            AnalyticsEvent.created_at >= week_ago, AnalyticsEvent.user_id.is_not(None)
        )
    )
    tracked_events = await scalar(
        select(func.count(AnalyticsEvent.id)).where(AnalyticsEvent.created_at >= since)
    )
    cross_campus = await scalar(
        select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.is_cross_campus_interaction.is_(True),
        )
    )
    projects_created = await scalar(select(func.count(Project.id)).where(Project.created_at >= since))
    events_created = await scalar(select(func.count(Event.id)).where(Event.created_at >= since))
    event_registrations = await scalar(
        select(func.count(EventRSVP.id)).where(EventRSVP.created_at >= since)
    )
    connections_created = await scalar(
        select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_name == "connection_created",
        )
    )
    public_communities = await scalar(
        select(func.count(Community.id)).where(Community.visibility == "PUBLIC")
    )
    searches = await scalar(
        select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_name == "search_performed",
        )
    )

    search_users_result = await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_name == "search_performed",
            AnalyticsEvent.user_id.is_not(None),
        ).distinct()
    )
    profile_open_users_result = await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_name == "profile_opened",
            AnalyticsEvent.user_id.is_not(None),
        ).distinct()
    )
    search_users = set(search_users_result.scalars().all())
    profile_open_users = set(profile_open_users_result.scalars().all())
    search_to_profile_open_rate = (
        round(len(search_users.intersection(profile_open_users)) / len(search_users) * 100, 1)
        if search_users else None
    )
    connection_users_result = await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_name == "connection_created",
            AnalyticsEvent.user_id.is_not(None),
        ).distinct()
    )
    connection_users = set(connection_users_result.scalars().all())
    search_to_connection_rate = (
        round(len(search_users.intersection(connection_users)) / len(search_users) * 100, 1)
        if search_users else None
    )

    retention_cohort_result = await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.created_at >= now - timedelta(days=14),
            AnalyticsEvent.created_at < week_ago,
            AnalyticsEvent.user_id.is_not(None),
        ).distinct()
    )
    recent_active_result = await db.execute(
        select(AnalyticsEvent.user_id).where(
            AnalyticsEvent.created_at >= week_ago,
            AnalyticsEvent.user_id.is_not(None),
        ).distinct()
    )
    retention_cohort = set(retention_cohort_result.scalars().all())
    recent_active = set(recent_active_result.scalars().all())
    weekly_retention_rate = (
        round(len(retention_cohort.intersection(recent_active)) / len(retention_cohort) * 100, 1)
        if retention_cohort else None
    )

    feed_samples_result = await db.execute(
        select(AnalyticsEvent.event_metadata).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_name.in_(["feed_loaded", "feed_load_completed"]),
        ).limit(5000)
    )
    feed_durations = [
        float(metadata.get("duration_ms"))
        for metadata in feed_samples_result.scalars().all()
        if isinstance(metadata, dict)
        and isinstance(metadata.get("duration_ms"), (int, float))
        and 0 <= float(metadata["duration_ms"]) <= 120000
    ]
    average_feed_load_ms = round(sum(feed_durations) / len(feed_durations), 1) if feed_durations else None
    feed_load_p75_ms = (
        sorted(feed_durations)[min(len(feed_durations) - 1, int((len(feed_durations) - 1) * 0.75))]
        if feed_durations else None
    )

    profiles_result = await db.execute(
        select(StudentProfile.skills, StudentProfile.interests).where(
            StudentProfile.profile_visibility == "PUBLIC"
        )
    )
    interest_counts = Counter()
    interest_labels = {}
    for skills, interests in profiles_result.all():
        for raw_interest in set((skills or []) + (interests or [])):
            label = str(raw_interest).strip()
            key = label.casefold()
            if label:
                interest_counts[key] += 1
                interest_labels.setdefault(key, label)
    top_interests = [
        {"topic": interest_labels[key], "students": count}
        for key, count in interest_counts.most_common(12)
        if count >= minimum_cohort_size
    ]

    active_communities_result = await db.execute(
        select(Community.id, Community.name, func.count(Post.id).label("post_count"))
        .join(Post, Post.community_id == Community.id)
        .where(
            Community.visibility == "PUBLIC",
            Post.created_at >= since,
            Post.is_hidden_by_mod.is_(False),
        )
        .group_by(Community.id, Community.name)
        .having(func.count(Post.id) >= minimum_cohort_size)
        .order_by(func.count(Post.id).desc())
        .limit(8)
    )
    active_communities = [
        {"id": community_id, "name": name, "posts_in_period": int(post_count)}
        for community_id, name, post_count in active_communities_result.all()
    ]

    return {
        "period_days": days,
        "generated_at": now.isoformat(),
        "active_students_24h": active_24h,
        "active_students_7d": active_7d,
        "tracked_events": tracked_events,
        "cross_campus_interactions": cross_campus,
        "projects_created": projects_created,
        "events_created": events_created,
        "event_registrations": event_registrations,
        "weekly_retention_rate": weekly_retention_rate,
        "search_to_connection_rate": search_to_connection_rate,
        "connections_created": connections_created,
        "public_communities": public_communities,
        "searches": searches,
        "search_to_profile_open_rate": search_to_profile_open_rate,
        "average_feed_load_ms": average_feed_load_ms,
        "feed_load_p75_ms": feed_load_p75_ms,
        "feed_load_samples": len(feed_durations),
        "top_interests": top_interests,
        "active_communities": active_communities,
        "minimum_cohort_size": minimum_cohort_size,
        "measurement_note": "Weekly retention is the overlap of users active 8–14 days ago and the last 7 days. Search-to-connection is a period-level user overlap, not causal attribution. Feed timing is browser-reported. Interest and community insights are suppressed below five students or posts. Historical activity before instrumentation is not backfilled.",
    }
