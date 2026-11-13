import pytest
from httpx import AsyncClient

from app.modules.identity.models import StudentProfile, User
from app.modules.colleges.models import College
from app.modules.projects.models import Project, ProjectMember, Task


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


@pytest.mark.asyncio
async def test_task_assignment_and_status_permissions(client: AsyncClient, db_session):
    owner = User(id="task-owner", email="task-owner@project.test", platform_role="USER")
    assignee = User(id="task-assignee", email="task-assignee@project.test", platform_role="USER")
    other_member = User(id="task-other", email="task-other@project.test", platform_role="USER")
    db_session.add_all([owner, assignee, other_member])
    db_session.add(Project(
        id="task-permissions-project",
        creator_id=owner.id,
        title="Task permissions",
        pitch="Verify project task ownership",
        description="Check who can assign and update project tasks.",
        stage="RECRUITING",
        skills_needed=[],
        open_roles=[],
        is_cross_campus_open=True,
    ))
    db_session.add_all([
        ProjectMember(project_id="task-permissions-project", user_id=assignee.id, role_title="Developer", status="ACCEPTED"),
        ProjectMember(project_id="task-permissions-project", user_id=other_member.id, role_title="Designer", status="ACCEPTED"),
    ])
    db_session.add(Task(
        id="assigned-task",
        project_id="task-permissions-project",
        title="Implement a feature",
        status="TODO",
        assignee_id=assignee.id,
    ))
    await db_session.commit()

    forbidden_assignment = await client.post(
        "/api/v1/projects/task-permissions-project/tasks",
        json={"title": "Assign someone else's task", "assignee_id": other_member.id},
        headers={"X-User-Id": assignee.id},
    )
    forbidden_update = await client.patch(
        "/api/v1/projects/task-permissions-project/tasks/assigned-task",
        json={"status": "DONE"},
        headers={"X-User-Id": other_member.id},
    )
    allowed_update = await client.patch(
        "/api/v1/projects/task-permissions-project/tasks/assigned-task",
        json={"status": "IN_PROGRESS"},
        headers={"X-User-Id": assignee.id},
    )
    lead_assignment = await client.patch(
        "/api/v1/projects/task-permissions-project/tasks/assigned-task",
        json={"assignee_id": other_member.id},
        headers={"X-User-Id": owner.id},
    )

    assert forbidden_assignment.status_code == 403
    assert forbidden_update.status_code == 403
    assert allowed_update.status_code == 200
    assert lead_assignment.status_code == 200
    assert lead_assignment.json()["assignee_id"] == other_member.id


@pytest.mark.asyncio
async def test_only_project_lead_can_review_pending_join_requests(client: AsyncClient, db_session):
    owner = User(id="join-review-owner", email="join-owner@project.test", platform_role="USER")
    applicant = User(id="join-review-applicant", email="join-applicant@project.test", platform_role="USER")
    db_session.add_all([owner, applicant])
    db_session.add_all([
        StudentProfile(user_id=owner.id, handle="joinowner", display_name="Project Lead"),
        StudentProfile(user_id=applicant.id, handle="joinapplicant", display_name="Applicant"),
    ])
    db_session.add(Project(
        id="join-requests-project",
        creator_id=owner.id,
        title="Join request review",
        pitch="Review collaborator applications",
        description="The project lead should be able to accept or decline applicants.",
        stage="RECRUITING",
        skills_needed=[],
        open_roles=["Developer"],
        is_cross_campus_open=True,
    ))
    db_session.add(ProjectMember(
        id="pending-application",
        project_id="join-requests-project",
        user_id=applicant.id,
        role_title="Developer",
        status="PENDING_REQUEST",
        pitch_note="I can contribute frontend development and accessibility testing.",
    ))
    await db_session.commit()

    owner_response = await client.get(
        "/api/v1/projects/join-requests-project/join-requests",
        headers={"X-User-Id": owner.id},
    )
    applicant_response = await client.get(
        "/api/v1/projects/join-requests-project/join-requests",
        headers={"X-User-Id": applicant.id},
    )
    assert owner_response.status_code == 200
    assert owner_response.json()[0]["member_id"] == "pending-application"
    assert owner_response.json()[0]["pitch_note"].startswith("I can contribute")
    assert applicant_response.status_code == 403

    accepted = await client.patch(
        "/api/v1/projects/join-requests-project/members/pending-application",
        json={"status": "ACCEPTED"},
        headers={"X-User-Id": owner.id},
    )
    assert accepted.status_code == 200
    cannot_review_twice = await client.patch(
        "/api/v1/projects/join-requests-project/members/pending-application",
        json={"status": "DECLINED"},
        headers={"X-User-Id": owner.id},
    )
    assert cannot_review_twice.status_code == 409

    empty_queue = await client.get(
        "/api/v1/projects/join-requests-project/join-requests",
        headers={"X-User-Id": owner.id},
    )
    assert empty_queue.status_code == 200
    assert empty_queue.json() == []
