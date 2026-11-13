from datetime import datetime, timedelta, timezone
from math import ceil
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.analytics.models import AnalyticsEvent
from app.modules.communities.models import Community
from app.modules.events.models import Event, EventRSVP
from app.modules.identity.models import StudentProfile, User
from app.modules.projects.models import Project

router = APIRouter(prefix="/analytics", tags=["Product analytics"])

Surface = Literal["landing", "city", "campus", "commons", "build", "discover", "messages", "profile", "passport", "mentorship", "insights", "privacy", "terms"]


class AnalyticsEventInput(BaseModel):
    event_name: Literal[
        "page_view", "search_performed", "post_created", "project_created",
        "event_rsvp", "community_joined", "circle_created", "connection_created", "feed_load_completed",
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
    if payload.duration_ms is not None and payload.event_name != "feed_load_completed":
        raise HTTPException(status_code=422, detail="Duration is only accepted for feed-load events")
    profile_result = await db.execute(
        select(StudentProfile.college_id).where(StudentProfile.user_id == user.id)
    )
    college_id = profile_result.scalar_one_or_none()
    event = AnalyticsEvent(
        user_id=user.id,
        event_name=payload.event_name,
        college_id=college_id,
        is_cross_campus_interaction=False,
        event_metadata={key: value for key, value in {"surface": payload.surface, "duration_ms": payload.duration_ms}.items() if value is not None},
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
    previous_week_start = now - timedelta(days=14)

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
        select(func.count(EventRSVP.id)).where(
            EventRSVP.created_at >= since,
            EventRSVP.status == "GOING",
        )
    )
    communities_total = await scalar(select(func.count(Community.id)).where(Community.visibility == "PUBLIC"))

    previous_week_users = (
        select(AnalyticsEvent.user_id)
        .where(
            AnalyticsEvent.created_at >= previous_week_start,
            AnalyticsEvent.created_at < week_ago,
            AnalyticsEvent.user_id.is_not(None),
        )
        .distinct()
        .subquery()
    )
    previous_week_active = await scalar(select(func.count()).select_from(previous_week_users))
    returning_users = (
        select(AnalyticsEvent.user_id)
        .where(
            AnalyticsEvent.created_at >= week_ago,
            AnalyticsEvent.user_id.in_(select(previous_week_users.c.user_id)),
        )
        .distinct()
        .subquery()
    )
    retained_students = await scalar(select(func.count()).select_from(returning_users))
    weekly_retention_rate = round(retained_students / previous_week_active * 100, 1) if previous_week_active else 0.0

    search_event = aliased(AnalyticsEvent)
    connection_event = aliased(AnalyticsEvent)
    search_users = (
        select(search_event.user_id)
        .where(
            search_event.event_name == "search_performed",
            search_event.created_at >= since,
            search_event.user_id.is_not(None),
        )
        .distinct()
        .subquery()
    )
    searched_students = await scalar(select(func.count()).select_from(search_users))
    converted_users = (
        select(search_event.user_id)
        .select_from(search_event)
        .join(
            connection_event,
            and_(
                connection_event.user_id == search_event.user_id,
                connection_event.event_name == "connection_created",
                connection_event.created_at >= search_event.created_at,
            ),
        )
        .where(
            search_event.event_name == "search_performed",
            search_event.created_at >= since,
            search_event.user_id.is_not(None),
        )
        .distinct()
        .subquery()
    )
    connected_students = await scalar(select(func.count()).select_from(converted_users))
    search_to_connection_rate = round(connected_students / searched_students * 100, 1) if searched_students else 0.0

    feed_result = await db.execute(
        select(AnalyticsEvent.event_metadata)
        .where(
            AnalyticsEvent.event_name == "feed_load_completed",
            AnalyticsEvent.created_at >= since,
        )
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(10000)
    )
    feed_durations = sorted(
        float(metadata["duration_ms"])
        for metadata in feed_result.scalars().all()
        if isinstance(metadata, dict)
        and isinstance(metadata.get("duration_ms"), (int, float))
        and 0 <= float(metadata["duration_ms"]) <= 120000
    )
    feed_load_p75_ms = round(feed_durations[max(0, ceil(len(feed_durations) * 0.75) - 1)], 1) if feed_durations else None

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
        "feed_load_p75_ms": feed_load_p75_ms,
        "feed_load_samples": len(feed_durations),
        "public_communities": communities_total,
        "measurement_note": "Active-student and retention counts include authenticated users with recorded analytics events. Search conversion is user-level: a connection event after a search in the selected period. Feed p75 measures initial city-feed data load, not full page LCP. Historical activity before instrumentation is not backfilled.",
    }
