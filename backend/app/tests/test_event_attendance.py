from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from httpx import AsyncClient

from app.modules.events.models import Event, EventAttendance, EventRSVP
from app.modules.identity.models import User


@pytest.mark.asyncio
async def test_organizer_confirms_attendance_after_event_and_student_can_view_it(client: AsyncClient, db_session):
    organizer = User(id="attendance-organizer", email="organizer@attendance.test")
    attendee = User(id="attendance-student", email="student@attendance.test")
    outsider = User(id="attendance-outsider", email="outsider@attendance.test")
    db_session.add_all([organizer, attendee, outsider])

    now = datetime.now(timezone.utc)
    event = Event(
        id="attendance-event",
        organizer_id=organizer.id,
        title="Campus collaboration day",
        description="A completed event for attendance history tests.",
        starts_at=now - timedelta(hours=3),
        ends_at=now - timedelta(hours=2),
        is_online=True,
        venue_or_link="Online",
        is_cross_campus=True,
    )
    db_session.add(event)
    db_session.add(EventRSVP(event_id=event.id, user_id=attendee.id, status="GOING"))
    await db_session.commit()

    forbidden = await client.post(
        f"/api/v1/events/{event.id}/attendance/{attendee.id}",
        headers={"X-User-Id": outsider.id},
    )
    assert forbidden.status_code == 403

    marked = await client.post(
        f"/api/v1/events/{event.id}/attendance/{attendee.id}",
        headers={"X-User-Id": organizer.id},
    )
    assert marked.status_code == 200
    assert marked.json()["marked"] is True
    assert marked.json()["already_marked"] is False

    repeated = await client.post(
        f"/api/v1/events/{event.id}/attendance/{attendee.id}",
        headers={"X-User-Id": organizer.id},
    )
    assert repeated.status_code == 200
    assert repeated.json()["already_marked"] is True

    history = await client.get(
        "/api/v1/events/attendance/mine",
        headers={"X-User-Id": attendee.id},
    )
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["title"] == event.title

    contribution_summary = await client.get(
        "/api/v1/profiles/me/contributions",
        headers={"X-User-Id": attendee.id},
    )
    assert contribution_summary.status_code == 200
    assert len(contribution_summary.json()["events_attended"]) == 1
    record = (await db_session.execute(
        select(EventAttendance).where(EventAttendance.user_id == attendee.id)
    )).scalar_one()
    assert record.marked_by == organizer.id


@pytest.mark.asyncio
async def test_attendance_requires_a_going_rsvp(client: AsyncClient, db_session):
    organizer = User(id="attendance-owner-2", email="owner2@attendance.test")
    attendee = User(id="attendance-student-2", email="student2@attendance.test")
    db_session.add_all([organizer, attendee])
    now = datetime.now(timezone.utc)
    event = Event(
        id="attendance-event-2",
        organizer_id=organizer.id,
        title="No RSVP event",
        description="Attendance must not be self-awarded.",
        starts_at=now - timedelta(hours=3),
        ends_at=now - timedelta(hours=2),
        is_online=True,
        venue_or_link="Online",
    )
    db_session.add(event)
    await db_session.commit()

    response = await client.post(
        f"/api/v1/events/{event.id}/attendance/{attendee.id}",
        headers={"X-User-Id": organizer.id},
    )
    assert response.status_code == 409
