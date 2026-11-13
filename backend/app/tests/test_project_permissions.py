import pytest
from httpx import AsyncClient

from app.modules.identity.models import StudentProfile, User
from app.modules.colleges.models import College
from app.modules.projects.models import Project


@pytest.mark.asyncio
async def test_non_member_cannot_read_or_write_project_tasks(client: AsyncClient, db_session):
    owner = User(id="project-owner", email="owner@project.test", platform_role="USER")
    stranger = User(id="project-stranger", email="stranger@project.test", platform_role="USER")
    db_session.add_all([owner, stranger])
    db_session.add(Project(
        id="private-workspace",
        creator_id=owner.id,
        title="Workspace access test",
        pitch="A project for checking task permissions",
        description="This project verifies that task access requires membership.",
        stage="RECRUITING",
        skills_needed=[],
        open_roles=["Developer"],
        is_cross_campus_open=True,
    ))
    await db_session.commit()

    headers = {"X-User-Id": stranger.id}
    read_response = await client.get(
        "/api/v1/projects/private-workspace/tasks",
        headers=headers,
    )
    write_response = await client.post(
        "/api/v1/projects/private-workspace/tasks",
        json={"title": "Unauthorized task"},
        headers=headers,
    )

    assert read_response.status_code == 403
    assert write_response.status_code == 403


@pytest.mark.asyncio
async def test_cross_campus_closed_project_rejects_external_join(client: AsyncClient, db_session):
    owner = User(id="campus-owner", email="owner@campus.test", platform_role="USER")
    applicant = User(id="campus-applicant", email="applicant@campus.test", platform_role="USER")
    db_session.add_all([owner, applicant])
    db_session.add_all([
        StudentProfile(user_id=owner.id, handle="campusowner", display_name="Campus Owner", college_id="college-a"),
        StudentProfile(user_id=applicant.id, handle="campusapplicant", display_name="Campus Applicant", college_id="college-b"),
    ])
    db_session.add(Project(
        id="campus-locked-project",
        creator_id=owner.id,
        college_id="college-a",
        title="Campus locked project",
        pitch="Only students at this college should join",
        description="This project is restricted to one college.",
        stage="RECRUITING",
        skills_needed=[],
        open_roles=["Developer"],
        is_cross_campus_open=False,
    ))
    await db_session.commit()

    response = await client.post(
        "/api/v1/projects/campus-locked-project/join-request",
        json={"pitch_note": "I would like to help build this project.", "role_title": "Developer"},
        headers={"X-User-Id": applicant.id},
    )

    assert response.status_code == 403
