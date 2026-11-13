import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.modules.colleges.models import College
from app.modules.identity.models import AffiliationClaim, StudentProfile, User


@pytest.mark.asyncio
async def test_profile_privacy_settings_are_persisted(client: AsyncClient, db_session):
    user = User(id="privacy-student", email="privacy@student.test", platform_role="USER")
    profile = StudentProfile(
        user_id=user.id,
        handle="privacy_student",
        display_name="Privacy Student",
        profile_visibility="PUBLIC",
        dm_permission="SAME_CAMPUS_OR_COMMUNITY",
    )
    db_session.add_all([user, profile])
    await db_session.commit()

    response = await client.patch(
        "/api/v1/profiles/me",
        json={"profile_visibility": "CAMPUS_ONLY", "dm_permission": "NONE"},
        headers={"X-User-Id": user.id},
    )

    assert response.status_code == 200
    assert response.json()["profile_visibility"] == "CAMPUS_ONLY"
    assert response.json()["dm_permission"] == "NONE"

    await db_session.refresh(profile)
    assert profile.profile_visibility == "CAMPUS_ONLY"
    assert profile.dm_permission == "NONE"


@pytest.mark.asyncio
async def test_verification_request_creates_pending_claim(client: AsyncClient, db_session):
    user = User(id="verification-student", email="verify@student.test", platform_role="USER")
    college = College(
        id="verification-college",
        name="Verification College",
        slug="verification-college",
        short_name="VC",
        city="Bengaluru",
        state="Karnataka",
        email_domains=["college.edu.in"],
    )
    profile = StudentProfile(
        user_id=user.id,
        handle="verificationstudent",
        display_name="Verification Student",
        college_id=college.id,
    )
    db_session.add_all([user, college, profile])
    await db_session.commit()

    response = await client.post(
        "/api/v1/profiles/verify/request",
        json={"college_id": college.id, "institutional_email": "student@college.edu.in"},
        headers={"X-User-Id": user.id},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Verification request submitted successfully"
    claim = (await db_session.execute(
        select(AffiliationClaim).where(AffiliationClaim.user_id == user.id)
    )).scalar_one()
    assert claim.college_id == college.id
    assert claim.institutional_email == "student@college.edu.in"
    assert claim.status == "PENDING"


@pytest.mark.asyncio
async def test_verification_rejects_unlisted_institutional_email_domain(client: AsyncClient, db_session):
    user = User(id="verification-domain-student", email="domain@student.test", platform_role="USER")
    college = College(
        id="verification-domain-college",
        name="Domain Verification College",
        slug="verification-domain-college",
        short_name="DVC",
        city="Bengaluru",
        state="Karnataka",
        email_domains=["domaincollege.edu.in"],
    )
    profile = StudentProfile(
        user_id=user.id,
        handle="verificationdomainstudent",
        display_name="Domain Verification Student",
        college_id=college.id,
    )
    db_session.add_all([user, college, profile])
    await db_session.commit()

    response = await client.post(
        "/api/v1/profiles/verify/request",
        json={"college_id": college.id, "institutional_email": "student@gmail.com"},
        headers={"X-User-Id": user.id},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_campus_only_profiles_are_visible_only_to_same_campus(client: AsyncClient, db_session):
    campus_a = College(
        id="visibility-campus-a",
        name="Visibility Campus A",
        slug="visibility-campus-a",
        short_name="VCA",
        city="Bengaluru",
        state="Karnataka",
    )
    campus_b = College(
        id="visibility-campus-b",
        name="Visibility Campus B",
        slug="visibility-campus-b",
        short_name="VCB",
        city="Bengaluru",
        state="Karnataka",
    )
    viewer = User(id="visibility-viewer", email="viewer@visibility.test", platform_role="USER")
    same_campus = User(id="visibility-same", email="same@visibility.test", platform_role="USER")
    other_campus = User(id="visibility-other", email="other@visibility.test", platform_role="USER")
    db_session.add_all([campus_a, campus_b, viewer, same_campus, other_campus])
    db_session.add_all([
        StudentProfile(
            user_id=viewer.id,
            handle="visibilityviewer",
            display_name="Visibility Viewer",
            college_id=campus_a.id,
        ),
        StudentProfile(
            user_id=same_campus.id,
            handle="samecampusstudent",
            display_name="Same Campus Student",
            college_id=campus_a.id,
            profile_visibility="CAMPUS_ONLY",
        ),
        StudentProfile(
            user_id=other_campus.id,
            handle="othercampusstudent",
            display_name="Other Campus Student",
            college_id=campus_b.id,
            profile_visibility="CAMPUS_ONLY",
        ),
    ])
    await db_session.commit()

    same_profile = await client.get(
        "/api/v1/profiles/samecampusstudent",
        headers={"X-User-Id": viewer.id},
    )
    other_profile = await client.get(
        "/api/v1/profiles/othercampusstudent",
        headers={"X-User-Id": viewer.id},
    )
    directory = await client.get(
        "/api/v1/profiles",
        headers={"X-User-Id": viewer.id},
    )

    assert same_profile.status_code == 200
    assert other_profile.status_code == 403
    visible_handles = {profile["handle"] for profile in directory.json()}
    assert "samecampusstudent" in visible_handles
    assert "othercampusstudent" not in visible_handles
