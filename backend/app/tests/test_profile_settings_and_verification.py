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
    )
    db_session.add_all([user, college])
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
