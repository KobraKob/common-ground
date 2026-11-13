import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy import select

from app.modules.analytics.models import AnalyticsEvent
from app.modules.events.models import Event, EventRSVP
from app.modules.identity.models import User


@pytest.mark.asyncio
async def test_authenticated_page_view_is_recorded(client: AsyncClient, db_session):
    db_session.add(User(id="analytics-student", email="analytics@student.test", platform_role="USER"))
    await db_session.commit()

    response = await client.post(
        "/api/v1/analytics/events",
        json={"event_name": "page_view", "surface": "discover"},
        headers={"X-User-Id": "analytics-student"},
    )

    assert response.status_code == 202
    event = (await db_session.execute(
        select(AnalyticsEvent).where(AnalyticsEvent.user_id == "analytics-student")
    )).scalar_one()
    assert event.event_name == "page_view"
    assert event.event_metadata == {"surface": "discover"}

    feed_response = await client.post(
        "/api/v1/analytics/events",
        json={"event_name": "feed_load_completed", "surface": "city", "duration_ms": 123.4},
        headers={"X-User-Id": "analytics-student"},
    )
    assert feed_response.status_code == 202
    feed_event = (await db_session.execute(
        select(AnalyticsEvent).where(AnalyticsEvent.event_name == "feed_load_completed")
    )).scalar_one()
    assert feed_event.event_metadata["duration_ms"] == 123.4


@pytest.mark.asyncio
async def test_analytics_summary_is_moderator_only(client: AsyncClient, db_session):
    db_session.add(User(id="ordinary-student", email="ordinary@student.test", platform_role="USER"))
    await db_session.commit()

    response = await client.get(
        "/api/v1/analytics/summary",
        headers={"X-User-Id": "ordinary-student"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_moderator_can_read_aggregated_summary(client: AsyncClient, db_session):
    now = datetime.now(timezone.utc)
    moderator = User(id="moderator-user", email="moderator@student.test", platform_role="MODERATOR")
    student = User(id="retained-student", email="retained@student.test", platform_role="USER")
    db_session.add_all([moderator, student])
    db_session.add_all([
        AnalyticsEvent(
            user_id=student.id,
            event_name="search_performed",
            created_at=now - timedelta(days=10),
            event_metadata={"surface": "discover"},
        ),
        AnalyticsEvent(
            user_id=student.id,
            event_name="connection_created",
            created_at=now - timedelta(days=3),
            event_metadata={"surface": "discover"},
        ),
        AnalyticsEvent(
            user_id=student.id,
            event_name="feed_load_completed",
            created_at=now - timedelta(days=1),
            event_metadata={"surface": "city", "duration_ms": 420.0},
        ),
    ])
    event = Event(
        id="analytics-rsvp-event",
        organizer_id=moderator.id,
        title="Analytics RSVP event",
        description="Event registration metric fixture.",
        starts_at=now + timedelta(days=1),
        ends_at=now + timedelta(days=1, hours=1),
        is_online=True,
        venue_or_link="https://example.test/event",
        is_cross_campus=True,
    )
    db_session.add(event)
    await db_session.flush()
    db_session.add(EventRSVP(event_id=event.id, user_id=student.id, status="GOING"))
    await db_session.commit()

    response = await client.get(
        "/api/v1/analytics/summary?days=30",
        headers={"X-User-Id": "moderator-user"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["period_days"] == 30
    assert "active_students_24h" in body
    assert body["event_registrations"] == 1
    assert body["weekly_retention_rate"] == 100.0
    assert body["search_to_connection_rate"] == 100.0
    assert body["feed_load_p75_ms"] == 420.0
    assert body["feed_load_samples"] == 1
    assert "measurement_note" in body


@pytest.mark.asyncio
async def test_feed_performance_event_accepts_bounded_duration_and_surface(client: AsyncClient, db_session):
    db_session.add(User(id="analytics-perf-student", email="analytics-perf@student.test", platform_role="USER"))
    await db_session.commit()

    response = await client.post(
        "/api/v1/analytics/events",
        json={"event_name": "feed_load_completed", "surface": "mentorship", "duration_ms": 423.456},
        headers={"X-User-Id": "analytics-perf-student"},
    )

    assert response.status_code == 202
    event = (await db_session.execute(
        select(AnalyticsEvent).where(AnalyticsEvent.user_id == "analytics-perf-student")
    )).scalar_one()
    assert event.event_name == "feed_load_completed"
    assert event.event_metadata == {"surface": "mentorship", "duration_ms": 423.46}
