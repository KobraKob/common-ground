import pytest
from httpx import AsyncClient
from app.modules.identity.models import User, StudentProfile
from app.modules.colleges.models import College
from app.modules.communities.models import Community, CommunityMembership
from app.modules.messaging.models import Conversation, ConversationMember, Message


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["cluster"] == "Bengaluru Phase 1"


@pytest.mark.asyncio
async def test_onboarding_sets_stage1_provisional(client: AsyncClient, db_session):
    # Setup test college & user
    college = College(
        id="col-rvce-01",
        name="RV College of Engineering",
        slug="rvce-test",
        short_name="RVCE",
    )
    db_session.add(college)

    user = User(id="user-new-01", email="newstudent@rvce.edu.in", platform_role="USER")
    db_session.add(user)
    await db_session.commit()

    # Complete onboarding
    payload = {
        "handle": "rookie_builder",
        "display_name": "Rookie Student",
        "college_id": "col-rvce-01",
        "course_branch": "B.E. CSE",
        "graduation_year": 2028,
        "skills": ["Python", "FastAPI"],
        "interests": ["Robotics"],
        "collaboration_goals": ["Hackathons"],
        "profile_visibility": "PUBLIC",
        "dm_permission": "SAME_CAMPUS_OR_COMMUNITY",
    }
    response = await client.post(
        "/api/v1/profiles/onboarding",
        json=payload,
        headers={"X-User-Id": "user-new-01"},
    )
    assert response.status_code == 200
    data = response.json()
    # Must explicitly be provisional
    assert data["verification_stage"] == "STAGE_1_PROVISIONAL"
    assert data["handle"] == "rookie_builder"
    assert data["college_name"] == "RV College of Engineering"


@pytest.mark.asyncio
async def test_block_enforcement_prevents_dms_and_hides_profile(client: AsyncClient, db_session):
    # Setup two users
    u1 = User(id="user-a", email="usera@test.com", platform_role="USER")
    u2 = User(id="user-b", email="userb@test.com", platform_role="USER")
    db_session.add_all([u1, u2])

    p1 = StudentProfile(user_id="user-a", handle="user_a", display_name="User A", onboarding_completed=True)
    p2 = StudentProfile(user_id="user-b", handle="user_b", display_name="User B", onboarding_completed=True)
    db_session.add_all([p1, p2])
    await db_session.commit()

    # User A blocks User B
    block_res = await client.post(
        "/api/v1/profiles/user-b/block",
        headers={"X-User-Id": "user-a"},
    )
    assert block_res.status_code == 200

    # User B attempts to query User A's profile -> returns 404 (restricted)
    prof_res = await client.get(
        "/api/v1/profiles/user_a",
        headers={"X-User-Id": "user-b"},
    )
    assert prof_res.status_code == 404

    # User B attempts to start a direct message with User A -> returns 403 Forbidden
    dm_res = await client.post(
        "/api/v1/conversations/direct",
        json={"recipient_user_id": "user-a"},
        headers={"X-User-Id": "user-b"},
    )
    assert dm_res.status_code == 403


@pytest.mark.asyncio
async def test_announcement_channel_permission_guard(client: AsyncClient, db_session):
    # Setup owner and standard member
    owner = User(id="owner-01", email="owner@test.com", platform_role="USER")
    member = User(id="member-01", email="member@test.com", platform_role="USER")
    db_session.add_all([owner, member])

    p_owner = StudentProfile(user_id="owner-01", handle="lead_rep", display_name="Lead Rep", onboarding_completed=True)
    p_member = StudentProfile(user_id="member-01", handle="student_1", display_name="Student One", onboarding_completed=True)
    db_session.add_all([p_owner, p_member])

    # Community & Announcement channel
    comm = Community(id="comm-test", name="Class Cohort 2026", slug="cohort-2026", description="Class group", community_type="CLASS_COHORT")
    db_session.add(comm)

    announcement_conv = Conversation(
        id="conv-announcement",
        conversation_type="ANNOUNCEMENT_CHANNEL",
        community_id="comm-test",
        title="Class Announcements",
    )
    db_session.add(announcement_conv)

    cm_owner = ConversationMember(conversation_id="conv-announcement", user_id="owner-01", role="OWNER")
    cm_member = ConversationMember(conversation_id="conv-announcement", user_id="member-01", role="MEMBER")
    db_session.add_all([cm_owner, cm_member])
    await db_session.commit()

    # Member attempts to post to announcement channel -> 403 Forbidden
    bad_post_res = await client.post(
        "/api/v1/conversations/conv-announcement/messages",
        json={"body": "Unauthorized announcement!"},
        headers={"X-User-Id": "member-01"},
    )
    assert bad_post_res.status_code == 403

    # Owner posts announcement -> 200 OK
    ok_post_res = await client.post(
        "/api/v1/conversations/conv-announcement/messages",
        json={"body": "Official Midterm Schedule Released!"},
        headers={"X-User-Id": "owner-01"},
    )
    assert ok_post_res.status_code == 200
    assert ok_post_res.json()["is_announcement"] is True


@pytest.mark.asyncio
async def test_moderation_queue_restricted_to_moderators(client: AsyncClient, db_session):
    # Standard user
    std_user = User(id="std-user", email="student@test.com", platform_role="USER")
    # Moderator user
    mod_user = User(id="mod-user", email="mod@test.com", platform_role="MODERATOR")
    db_session.add_all([std_user, mod_user])
    await db_session.commit()

    # Standard user attempts to view queue -> 403
    std_res = await client.get("/api/v1/moderation/queue", headers={"X-User-Id": "std-user"})
    assert std_res.status_code == 403

    # Moderator views queue -> 200 OK
    mod_res = await client.get("/api/v1/moderation/queue", headers={"X-User-Id": "mod-user"})
    assert mod_res.status_code == 200
