import pytest
from httpx import AsyncClient

from app.modules.identity.models import StudentProfile, User
from app.modules.mentorship.models import MentorshipProfile


@pytest.mark.asyncio
async def test_opt_in_mentor_can_receive_and_accept_a_request(client: AsyncClient, db_session):
    mentor = User(id="mentor-user", email="mentor@mentorship.test")
    requester = User(id="requester-user", email="requester@mentorship.test")
    db_session.add_all([mentor, requester])
    db_session.add_all([
        StudentProfile(
            user_id=mentor.id,
            handle="mentoruser",
            display_name="Mentor User",
            profile_visibility="PUBLIC",
            dm_permission="EVERYONE",
            skills=["Python"],
        ),
        StudentProfile(
            user_id=requester.id,
            handle="requesteruser",
            display_name="Requester User",
            profile_visibility="PUBLIC",
        ),
    ])
    db_session.add(MentorshipProfile(
        user_id=mentor.id,
        is_available=True,
        topics=["Python", "Project planning"],
        bio="Happy to help with beginner projects.",
        availability_note="Weekday evenings",
        format="ONLINE",
    ))
    await db_session.commit()

    directory = await client.get(
        "/api/v1/mentorship/mentors",
        headers={"X-User-Id": requester.id},
    )
    assert directory.status_code == 200
    assert len(directory.json()) == 1
    assert directory.json()[0]["user_id"] == mentor.id
    assert "email" not in directory.json()[0]

    created = await client.post(
        "/api/v1/mentorship/requests",
        json={"mentor_id": mentor.id, "note": "Could you review my first Python project?"},
        headers={"X-User-Id": requester.id},
    )
    assert created.status_code == 201
    request_id = created.json()["id"]

    requester_cannot_accept = await client.patch(
        f"/api/v1/mentorship/requests/{request_id}",
        json={"status": "ACCEPTED"},
        headers={"X-User-Id": requester.id},
    )
    assert requester_cannot_accept.status_code == 403

    accepted = await client.patch(
        f"/api/v1/mentorship/requests/{request_id}",
        json={"status": "ACCEPTED"},
        headers={"X-User-Id": mentor.id},
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "ACCEPTED"


@pytest.mark.asyncio
async def test_mentorship_respects_mentor_contact_permissions(client: AsyncClient, db_session):
    mentor = User(id="restricted-mentor", email="restricted@mentorship.test")
    requester = User(id="external-requester", email="external@mentorship.test")
    db_session.add_all([mentor, requester])
    db_session.add_all([
        StudentProfile(
            user_id=mentor.id,
            handle="restrictedmentor",
            display_name="Restricted Mentor",
            profile_visibility="PUBLIC",
            dm_permission="SAME_CAMPUS_OR_COMMUNITY",
        ),
        StudentProfile(
            user_id=requester.id,
            handle="externalrequester",
            display_name="External Requester",
            profile_visibility="PUBLIC",
        ),
    ])
    db_session.add(MentorshipProfile(user_id=mentor.id, is_available=True, topics=["Design"]))
    await db_session.commit()

    directory = await client.get(
        "/api/v1/mentorship/mentors",
        headers={"X-User-Id": requester.id},
    )
    assert directory.status_code == 200
    assert directory.json() == []

    response = await client.post(
        "/api/v1/mentorship/requests",
        json={"mentor_id": mentor.id, "note": "I would appreciate advice on my portfolio."},
        headers={"X-User-Id": requester.id},
    )
    assert response.status_code == 403
