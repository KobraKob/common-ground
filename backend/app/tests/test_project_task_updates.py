import pytest
from httpx import AsyncClient

from app.modules.identity.models import StudentProfile, User
from app.modules.projects.models import Project, ProjectMember, Task


@pytest.mark.asyncio
async def test_project_lead_assigns_task_and_member_updates_own_status(client: AsyncClient, db_session):
    lead = User(id="task-lead", email="lead@tasks.test", platform_role="USER")
    member = User(id="task-member", email="member@tasks.test", platform_role="USER")
    stranger = User(id="task-stranger", email="stranger@tasks.test", platform_role="USER")
    db_session.add_all([lead, member, stranger])
    db_session.add_all([
        StudentProfile(user_id=lead.id, handle="tasklead", display_name="Task Lead"),
        StudentProfile(user_id=member.id, handle="taskmember", display_name="Task Member"),
        StudentProfile(user_id=stranger.id, handle="taskstranger", display_name="Task Stranger"),
    ])
    project = Project(
        id="task-project",
        creator_id=lead.id,
        title="Task permissions",
        pitch="A project for task assignment tests",
        description="Testing project lead and accepted member task permissions.",
        stage="RECRUITING",
    )
    db_session.add(project)
    db_session.add(ProjectMember(
        project_id=project.id, user_id=lead.id, role_title="Lead", status="ACCEPTED"
    ))
    db_session.add(ProjectMember(
        project_id=project.id, user_id=member.id, role_title="Developer", status="ACCEPTED"
    ))
    task = Task(project_id=project.id, title="Implement first milestone", status="TODO")
    db_session.add(task)
    await db_session.commit()

    assigned = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        json={"assignee_id": member.id},
        headers={"X-User-Id": lead.id},
    )
    assert assigned.status_code == 200
    assert assigned.json()["assignee_id"] == member.id

    updated = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        json={"status": "IN_PROGRESS"},
        headers={"X-User-Id": member.id},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "IN_PROGRESS"

    denied_assignment = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        json={"assignee_id": lead.id},
        headers={"X-User-Id": member.id},
    )
    assert denied_assignment.status_code == 403

    denied_stranger = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        json={"status": "DONE"},
        headers={"X-User-Id": stranger.id},
    )
    assert denied_stranger.status_code == 403

    completed = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        json={"status": "DONE"},
        headers={"X-User-Id": member.id},
    )
    assert completed.status_code == 200
    summary = await client.get(
        "/api/v1/profiles/me/contributions",
        headers={"X-User-Id": member.id},
    )
    assert summary.status_code == 200
    assert summary.json()["tasks_marked_done"] == 1
