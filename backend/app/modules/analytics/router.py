from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.analytics.models import AnalyticsEvent
from app.modules.communities.models import Community
from app.modules.events.models import Event
from app.modules.identity.models import StudentProfile, User
from app.modules.projects.models import Project

router = APIRouter(prefix="/analytics", tags=["Product analytics"])

Surface = Literal["landing", "city", "campus", "commons", "build", "discover", "messages", "profile", "passport"]


class AnalyticsEventInput(BaseModel):
    event_name: Literal[
        "page_view", "search_performed", "post_created", "project_created",
        "event_rsvp", "community_joined", "circle_created",
    ]
    surface: Optional[Surface] = None


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
    event = AnalyticsEvent(
        user_id=user.id,
        event_name=payload.event_name,
        college_id=college_id,
        is_cross_campus_interaction=False,
        event_metadata={"surface": payload.surface} if payload.surface else {},
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
    communities_total = await scalar(select(func.count(Community.id)).where(Community.visibility != "PRIVATE_INVITE_ONLY"))

    return {
        "period_days": days,
        "generated_at": now.isoformat(),
        "active_students_24h": active_24h,
        "active_students_7d": active_7d,
        "tracked_events": tracked_events,
        "cross_campus_interactions": cross_campus,
        "projects_created": projects_created,
        "events_created": events_created,
        "public_communities": communities_total,
        "measurement_note": "Active-student counts include authenticated users with recorded analytics events. Historical activity before page-view instrumentation is not backfilled.",
    }
