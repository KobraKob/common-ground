import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.modules.analytics.models import AnalyticsEvent
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
    db_session.add(User(id="moderator-user", email="moderator@student.test", platform_role="MODERATOR"))
    await db_session.commit()

    response = await client.get(
        "/api/v1/analytics/summary?days=30",
        headers={"X-User-Id": "moderator-user"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["period_days"] == 30
    assert "active_students_24h" in body
    assert "measurement_note" in body
