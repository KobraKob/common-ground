import pytest
from httpx import AsyncClient
from app.modules.identity.models import User, StudentProfile
from app.modules.colleges.models import College
from app.modules.communities.models import Community, CommunityMembership
from app.modules.messaging.models import Conversation, ConversationMember, Message
from app.modules.commons.models import Post


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


@pytest.mark.asyncio
async def test_auth_signup_and_login_flow(client: AsyncClient, db_session):
    college = College(
        id="col-pesu-auth-test",
        name="PES University",
        slug="pesu-auth-test",
        short_name="PESU",
        email_domains=["pes.edu"],
    )
    db_session.add(college)
    await db_session.commit()

    # 1. Signup with personal email -> Stage 1 Provisional
    signup_payload_provisional = {
        "email": "ankit.dev@gmail.com",
        "password": "strongPassword123!",
        "handle": "ankit_builds",
        "display_name": "Ankit Sharma",
        "college_id": "col-pesu-auth-test",
        "course_branch": "B.Tech AI & Data",
        "graduation_year": 2027,
        "skills": ["Python", "PyTorch"],
        "interests": ["LLMs", "Hackathons"],
    }
    res1 = await client.post("/api/v1/auth/signup", json=signup_payload_provisional)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["profile"]["handle"] == "ankit_builds"
    assert data1["profile"]["verification_stage"] == "STAGE_1_PROVISIONAL"
    assert data1["token"].startswith("cg-user_")

    # 2. Signup with institutional domain -> Stage 3 Verified
    signup_payload_verified = {
        "email": "riya@pes.edu",
        "password": "collegeSecure999!",
        "handle": "riya_pes",
        "display_name": "Riya V",
        "college_id": "col-pesu-auth-test",
        "course_branch": "B.E. Computer Science",
        "graduation_year": 2026,
    }
    res2 = await client.post("/api/v1/auth/signup", json=signup_payload_verified)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["profile"]["verification_stage"] == "STAGE_3_INSTITUTIONAL_VERIFIED"

    # 3. Login with email
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"login": "ankit.dev@gmail.com", "password": "strongPassword123!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["profile"]["handle"] == "ankit_builds"

    # 4. Login with handle
    login_handle_res = await client.post(
        "/api/v1/auth/login",
        json={"login": "ankit_builds", "password": "strongPassword123!"},
    )
    assert login_handle_res.status_code == 200

    # 5. Invalid password -> 401
    bad_login_res = await client.post(
        "/api/v1/auth/login",
        json={"login": "ankit_builds", "password": "wrongPassword"},
    )
    assert bad_login_res.status_code == 401


@pytest.mark.asyncio
async def test_city_pulse_media_and_interactions(client: AsyncClient, db_session):
    # Setup author
    author = User(id="pulse-author-01", email="pulseauthor@rvce.edu.in", platform_role="USER")
    db_session.add(author)
    p_author = StudentProfile(
        user_id="pulse-author-01",
        handle="pulse_creator",
        display_name="Pulse Creator",
        verification_stage="STAGE_3_INSTITUTIONAL_VERIFIED",
        onboarding_completed=True,
    )
    db_session.add(p_author)
    await db_session.commit()

    # 1. Create a post with photo media
    post_payload = {
        "category": "HANGOUT_MEME",
        "title": "8th Mile Fest RVCE 2026 Stage Lights!",
        "body": "Night vibes at the cultural amphitheater! Drop your best snapshots.",
        "tags": ["RVCE", "CampusLife", "BangaloreNight"],
        "media_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
        "media_type": "IMAGE",
        "is_cross_campus": True,
    }
    create_res = await client.post(
        "/api/v1/posts",
        json=post_payload,
        headers={"X-User-Id": "pulse-author-01"},
    )
    assert create_res.status_code == 200
    post_data = create_res.json()
    post_id = post_data["id"]
    assert post_data["media_type"] == "IMAGE"
    assert post_data["media_url"] == post_payload["media_url"]
    assert post_data["upvotes_count"] == 0

    # 2. Like/react to post
    react_res = await client.post(
        f"/api/v1/posts/{post_id}/react",
        json={"reaction_type": "UPVOTE"},
        headers={"X-User-Id": "pulse-author-01"},
    )
    assert react_res.status_code == 200
    assert react_res.json()["liked_by_me"] is True
    assert react_res.json()["upvotes_count"] == 1

    # 3. Add comment
    comment_res = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"body": "Insane lighting! Was that during the Battle of the Bands?"},
        headers={"X-User-Id": "pulse-author-01"},
    )
    assert comment_res.status_code == 200
    assert comment_res.json()["body"] == "Insane lighting! Was that during the Battle of the Bands?"

    # 4. Share post
    share_res = await client.post(f"/api/v1/posts/{post_id}/share")
    assert share_res.status_code == 200
    assert share_res.json()["shares_count"] == 1

    # 5. Verify in list_posts
    feed_res = await client.get("/api/v1/posts?scope=city", headers={"X-User-Id": "pulse-author-01"})
    assert feed_res.status_code == 200
    feed_posts = feed_res.json()
    matched = next((p for p in feed_posts if p["id"] == post_id), None)
    assert matched is not None
    assert matched["media_type"] == "IMAGE"
    assert matched["liked_by_me"] is True
    assert matched["upvotes_count"] == 1
    assert matched["comments_count"] == 1
    assert matched["shares_count"] == 1


@pytest.mark.asyncio
async def test_unauthenticated_public_access_and_subdomain_verification(client: AsyncClient, db_session):
    # Setup test college with domain
    college = College(
        id="col-rvce-public-test",
        name="RV College of Engineering",
        slug="rvce-public-test",
        short_name="RVCE",
        email_domains=["rvce.edu.in"],
    )
    db_session.add(college)

    # Setup public student profile and post
    user = User(id="user-pub-01", email="author@rvce.edu.in", platform_role="USER")
    db_session.add(user)
    prof = StudentProfile(
        user_id="user-pub-01",
        handle="public_star",
        display_name="Public Star",
        college_id="col-rvce-public-test",
        verification_stage="STAGE_3_INSTITUTIONAL_VERIFIED",
        profile_visibility="PUBLIC",
        onboarding_completed=True,
    )
    db_session.add(prof)

    post = Post(
        id="post-public-01",
        author_id="user-pub-01",
        category="DISCUSSION",
        title="Public Bengaluru Hackathon Kickoff",
        body="Open to all campuses across the city!",
        tags=["Bengaluru", "Hackathon"],
        is_cross_campus=True,
    )
    db_session.add(post)
    await db_session.commit()

    # 1. Unauthenticated visitor calls GET /api/v1/posts?scope=city -> 200 OK (liked_by_me=False)
    unauth_feed_res = await client.get("/api/v1/posts?scope=city")
    assert unauth_feed_res.status_code == 200
    posts = unauth_feed_res.json()
    matched = next((p for p in posts if p["id"] == "post-public-01"), None)
    assert matched is not None
    assert matched["liked_by_me"] is False

    # 2. Unauthenticated visitor searches -> 200 OK
    unauth_search_res = await client.get("/api/v1/search?q=public")
    assert unauth_search_res.status_code == 200
    search_data = unauth_search_res.json()
    assert any(s["handle"] == "public_star" for s in search_data.get("students", []))

    # 3. Unauthenticated visitor views public profile by handle -> 200 OK
    unauth_prof_res = await client.get("/api/v1/profiles/public_star")
    assert unauth_prof_res.status_code == 200
    assert unauth_prof_res.json()["handle"] == "public_star"

    # 4. Signup with institutional subdomain (e.g. student.rvce.edu.in) -> STAGE_3_INSTITUTIONAL_VERIFIED
    subdomain_signup = {
        "email": "student123@cse.rvce.edu.in",
        "password": "campusSecret123!",
        "handle": "subdomain_builder",
        "display_name": "Subdomain Student",
        "college_id": "col-rvce-public-test",
        "course_branch": "B.E. CSE",
        "graduation_year": 2027,
    }
    signup_res = await client.post("/api/v1/auth/signup", json=subdomain_signup)
    assert signup_res.status_code == 200
    assert signup_res.json()["profile"]["verification_stage"] == "STAGE_3_INSTITUTIONAL_VERIFIED"


@pytest.mark.asyncio
async def test_private_group_isolation_and_search_block_filtering(client: AsyncClient, db_session):
    # Setup users
    user_alice = User(id="user-alice", email="alice@test.com", platform_role="USER")
    user_bob = User(id="user-bob", email="bob@test.com", platform_role="USER")
    db_session.add_all([user_alice, user_bob])

    prof_alice = StudentProfile(
        user_id="user-alice",
        handle="alice_blr",
        display_name="Alice",
        profile_visibility="CAMPUS_ONLY",
        onboarding_completed=True,
    )
    prof_bob = StudentProfile(
        user_id="user-bob",
        handle="bob_blr",
        display_name="Bob",
        profile_visibility="PUBLIC",
        onboarding_completed=True,
    )
    db_session.add_all([prof_alice, prof_bob])

    # Setup a private community
    priv_comm = Community(
        id="comm-secret-vault",
        name="Secret Robotics Lab",
        slug="secret-robotics",
        description="Private invite only research team",
        community_type="STUDENT_ORGANIZATION",
        visibility="PRIVATE_INVITE_ONLY",
    )
    db_session.add(priv_comm)
    await db_session.commit()

    # Create post inside private community by Alice
    priv_post = Post(
        id="post-secret-01",
        author_id="user-alice",
        community_id="comm-secret-vault",
        category="DISCUSSION",
        title="Classified Drone Schematics",
        body="Do not share outside the private robotics lab.",
        is_cross_campus=True,
    )
    db_session.add(priv_post)
    await db_session.commit()

    # 1. Unauthenticated guest and non-member Bob cannot see the private post in city feed
    feed_res = await client.get("/api/v1/posts?scope=city")
    assert not any(p["id"] == "post-secret-01" for p in feed_res.json())

    feed_bob_res = await client.get("/api/v1/posts?scope=city", headers={"X-User-Id": "user-bob"})
    assert not any(p["id"] == "post-secret-01" for p in feed_bob_res.json())

    # 2. Search for "Classified" does not leak the private post
    search_res = await client.get("/api/v1/search?q=classified")
    assert not any(p["id"] == "post-secret-01" for p in search_res.json().get("commons_posts", []))

    # 3. Unauthenticated guest cannot view Alice's CAMPUS_ONLY profile -> 403 Forbidden
    guest_prof_res = await client.get("/api/v1/profiles/alice_blr")
    assert guest_prof_res.status_code == 403

    # 4. Alice blocks Bob
    await client.post("/api/v1/profiles/user-bob/block", headers={"X-User-Id": "user-alice"})

    # Bob searches for "Alice" -> Alice is filtered out of students search results
    bob_search_res = await client.get("/api/v1/search?q=alice", headers={"X-User-Id": "user-bob"})
    assert not any(s["handle"] == "alice_blr" for s in bob_search_res.json().get("students", []))

    # Bob attempts to react or comment on Alice's post -> 403 Forbidden
    pub_post = Post(
        id="post-alice-pub",
        author_id="user-alice",
        category="DISCUSSION",
        title="Alice Public Post",
        body="Public discussion.",
        is_cross_campus=True,
    )
    db_session.add(pub_post)
    await db_session.commit()

    react_res = await client.post("/api/v1/posts/post-alice-pub/react", headers={"X-User-Id": "user-bob"})
    assert react_res.status_code == 403

    comment_res = await client.post(
        "/api/v1/posts/post-alice-pub/comments",
        json={"body": "Trying to comment while blocked"},
        headers={"X-User-Id": "user-bob"},
    )
    assert comment_res.status_code == 403


@pytest.mark.asyncio
async def test_list_profiles_and_skill_filtering(client: AsyncClient, db_session):
    u1 = User(id="user-peer-1", email="peer1@test.com", platform_role="USER")
    u2 = User(id="user-peer-2", email="peer2@test.com", platform_role="USER")
    db_session.add_all([u1, u2])

    p1 = StudentProfile(
        user_id="user-peer-1",
        handle="rust_dev",
        display_name="Rust Dev",
        skills=["Rust", "Systems"],
        profile_visibility="PUBLIC",
        onboarding_completed=True,
    )
    p2 = StudentProfile(
        user_id="user-peer-2",
        handle="figma_lead",
        display_name="Figma Lead",
        skills=["Figma", "UI/UX"],
        profile_visibility="PUBLIC",
        onboarding_completed=True,
    )
    db_session.add_all([p1, p2])
    await db_session.commit()

    # List all profiles
    all_res = await client.get("/api/v1/profiles")
    assert all_res.status_code == 200
    all_profiles = all_res.json()
    assert len(all_profiles) == 2

    # Filter by skill
    rust_res = await client.get("/api/v1/profiles?skill=Rust")
    assert rust_res.status_code == 200
    rust_profiles = rust_res.json()
    assert len(rust_profiles) == 1
    assert rust_profiles[0]["handle"] == "rust_dev"


