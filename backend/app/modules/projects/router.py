from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.identity.models import User, StudentProfile
from app.modules.colleges.models import College
from app.modules.projects.models import Project, ProjectMember, Task
from app.modules.events.models import Event, EventRSVP, EventAttendance
from app.modules.analytics.models import AnalyticsEvent
from app.modules.projects.schemas import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectJoinRequest,
    MemberStatusUpdateRequest,
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskResponse,
    ProjectMemberResponse,
    ProjectJoinRequestResponse,
    EventCreateRequest,
    EventResponse,
)

router = APIRouter(tags=["Projects, Tasks & Events"])


# ----------------------------------------------------
# Projects Endpoints
# ----------------------------------------------------

@router.get("/projects/mine", response_model=List[ProjectResponse])
async def list_my_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    creator_profiles = (
        select(StudentProfile.user_id, StudentProfile.display_name, StudentProfile.college_id)
        .subquery()
    )
    member_counts = (
        select(ProjectMember.project_id, func.count(ProjectMember.id).label("members_count"))
        .where(ProjectMember.status == "ACCEPTED")
        .group_by(ProjectMember.project_id)
        .subquery()
    )
    query = (
        select(
            Project,
            ProjectMember.role_title,
            creator_profiles.c.display_name,
            College.name,
            func.coalesce(member_counts.c.members_count, 1),
        )
        .join(
            ProjectMember,
            and_(
                ProjectMember.project_id == Project.id,
                ProjectMember.user_id == user.id,
                ProjectMember.status == "ACCEPTED",
            ),
        )
        .outerjoin(creator_profiles, creator_profiles.c.user_id == Project.creator_id)
        .outerjoin(College, College.id == creator_profiles.c.college_id)
        .outerjoin(member_counts, member_counts.c.project_id == Project.id)
        .order_by(desc(Project.created_at))
        .limit(100)
    )
    result = await db.execute(query)
    return [
        ProjectResponse(
            id=project.id,
            creator_id=project.creator_id,
            creator_name=creator_name or "Student",
            creator_college_name=college_name,
            college_id=project.college_id,
            title=project.title,
            pitch=project.pitch,
            description=project.description,
            stage=project.stage,
            skills_needed=project.skills_needed or [],
            open_roles=project.open_roles or [],
            is_cross_campus_open=project.is_cross_campus_open,
            repo_or_demo_links=project.repo_or_demo_links or [],
            members_count=members_count,
            my_role=role_title,
            created_at=project.created_at,
        )
        for project, role_title, creator_name, college_name, members_count in result.all()
    ]


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    response: Response,
    stage: Optional[str] = None,
    skill: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    # Aggregate creator and member details in SQL instead of issuing extra queries per project.
    base_query = select(Project)
    if stage:
        base_query = base_query.where(Project.stage == stage)
    if skill:
        base_query = base_query.where(Project.skills_needed.ilike(f"%{skill}%"))

    count_result = await db.execute(
        select(func.count()).select_from(base_query.order_by(None).subquery())
    )
    total_count = count_result.scalar() or 0

    creator_profiles = (
        select(StudentProfile.user_id, StudentProfile.display_name, StudentProfile.college_id)
        .subquery()
    )
    member_counts = (
        select(
            ProjectMember.project_id,
            func.count(ProjectMember.id).label("members_count"),
        )
        .where(ProjectMember.status == "ACCEPTED")
        .group_by(ProjectMember.project_id)
        .subquery()
    )
    query = (
        select(
            Project,
            creator_profiles.c.display_name,
            College.name,
            func.coalesce(member_counts.c.members_count, 1),
        )
        .outerjoin(creator_profiles, creator_profiles.c.user_id == Project.creator_id)
        .outerjoin(College, College.id == creator_profiles.c.college_id)
        .outerjoin(member_counts, member_counts.c.project_id == Project.id)
    )
    if stage:
        query = query.where(Project.stage == stage)
    if skill:
        query = query.where(Project.skills_needed.ilike(f"%{skill}%"))

    result = await db.execute(
        query.order_by(desc(Project.created_at)).offset(offset).limit(limit)
    )
    rows = result.all()

    has_more = (offset + len(rows)) < total_count
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Has-More"] = "true" if has_more else "false"
    response.headers["X-Offset"] = str(offset)
    response.headers["X-Limit"] = str(limit)

    return [
        ProjectResponse(
            id=project.id,
            creator_id=project.creator_id,
            creator_name=creator_name or "Student",
            creator_college_name=college_name,
            college_id=project.college_id,
            title=project.title,
            pitch=project.pitch,
            description=project.description,
            stage=project.stage,
            skills_needed=project.skills_needed or [],
            open_roles=project.open_roles or [],
            is_cross_campus_open=project.is_cross_campus_open,
            repo_or_demo_links=project.repo_or_demo_links or [],
            members_count=members_count,
            created_at=project.created_at,
        )
        for project, creator_name, college_name, members_count in rows
    ]

@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    payload: ProjectCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    creator_prof = c_res.scalar_one_or_none()

    project = Project(
        creator_id=user.id,
        college_id=creator_prof.college_id if creator_prof else None,
        title=payload.title,
        pitch=payload.pitch,
        description=payload.description,
        stage=payload.stage,
        skills_needed=payload.skills_needed,
        open_roles=payload.open_roles,
        is_cross_campus_open=payload.is_cross_campus_open,
        repo_or_demo_links=payload.repo_or_demo_links,
    )
    db.add(project)
    await db.flush()

    # Add creator as ACCEPTED project member
    member = ProjectMember(
        project_id=project.id,
        user_id=user.id,
        role_title="Lead Architect / Creator",
        status="ACCEPTED",
    )
    db.add(member)
    await db.commit()
    await db.refresh(project)

    col_name = None
    if creator_prof and creator_prof.college_id:
        col_res = await db.execute(select(College.name).where(College.id == creator_prof.college_id))
        col_name = col_res.scalar_one_or_none()

    return ProjectResponse(
        id=project.id,
        creator_id=project.creator_id,
        creator_name=creator_prof.display_name if creator_prof else "Student",
        creator_college_name=col_name,
        college_id=project.college_id,
        title=project.title,
        pitch=project.pitch,
        description=project.description,
        stage=project.stage,
        skills_needed=project.skills_needed or [],
        open_roles=project.open_roles or [],
        is_cross_campus_open=project.is_cross_campus_open,
        repo_or_demo_links=project.repo_or_demo_links or [],
        members_count=1,
        created_at=project.created_at,
    )


@router.post("/projects/{project_id}/join-request")
async def request_to_join_project(
    project_id: str,
    payload: ProjectJoinRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p_res = await db.execute(select(Project).where(Project.id == project_id))
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Cross-campus visibility is enforced server-side, not only by the UI.
    if not project.is_cross_campus_open:
        profile_result = await db.execute(
            select(StudentProfile.college_id).where(StudentProfile.user_id == user.id)
        )
        applicant_college_id = profile_result.scalar_one_or_none()
        if applicant_college_id != project.college_id:
            raise HTTPException(status_code=403, detail="This project is limited to its own campus")

    if project.stage not in {"IDEA", "RECRUITING"}:
        raise HTTPException(status_code=409, detail="This project is not accepting new collaborators")

    # Check already member or pending
    m_res = await db.execute(
        select(ProjectMember).where(
            and_(ProjectMember.project_id == project_id, ProjectMember.user_id == user.id)
        )
    )
    existing = m_res.scalar_one_or_none()
    if existing:
        return {"message": f"Join request is currently {existing.status}"}

    member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role_title=payload.role_title,
        status="PENDING_REQUEST",
        pitch_note=payload.pitch_note,
    )
    db.add(member)
    await db.commit()
    return {"message": "Application submitted to project lead successfully"}


@router.patch("/projects/{project_id}/members/{member_id}")
async def update_project_member_status(
    project_id: str,
    member_id: str,
    payload: MemberStatusUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p_res = await db.execute(select(Project).where(Project.id == project_id))
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can accept/decline members")

    m_res = await db.execute(select(ProjectMember).where(ProjectMember.id == member_id))
    member = m_res.scalar_one_or_none()
    if not member or member.project_id != project_id:
        raise HTTPException(status_code=404, detail="Member record not found")
    if member.status != "PENDING_REQUEST":
        raise HTTPException(status_code=409, detail="Only pending join requests can be reviewed")

    member.status = payload.status

    # If accepted, track cross_campus_connection if colleges differ
    if payload.status == "ACCEPTED":
        c1 = await db.execute(select(StudentProfile.college_id).where(StudentProfile.user_id == project.creator_id))
        c2 = await db.execute(select(StudentProfile.college_id).where(StudentProfile.user_id == member.user_id))
        col1 = c1.scalar_one_or_none()
        col2 = c2.scalar_one_or_none()

        is_cross = bool(col1 and col2 and col1 != col2)
        analytics = AnalyticsEvent(
            user_id=user.id,
            event_name="connection_created",
            college_id=col1,
            is_cross_campus_interaction=is_cross,
            event_metadata={"surface": "build"},
        )
        db.add(analytics)

    await db.commit()
    return {"message": f"Member status updated to {payload.status}"}


async def require_project_member(project_id: str, user_id: str, db: AsyncSession) -> Project:
    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.creator_id == user_id:
        return project
    member_result = await db.execute(
        select(ProjectMember.id).where(
            and_(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
                ProjectMember.status == "ACCEPTED",
            )
        )
    )
    if member_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Only accepted project members can access this workspace")
    return project


@router.get("/projects/{project_id}/join-requests", response_model=List[ProjectJoinRequestResponse])
async def list_project_join_requests(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project lead can review join requests")

    result = await db.execute(
        select(ProjectMember, StudentProfile.display_name, StudentProfile.handle)
        .join(StudentProfile, StudentProfile.user_id == ProjectMember.user_id)
        .where(
            ProjectMember.project_id == project_id,
            ProjectMember.status == "PENDING_REQUEST",
        )
        .order_by(ProjectMember.joined_at.asc())
    )
    return [
        ProjectJoinRequestResponse(
            member_id=member.id,
            user_id=member.user_id,
            display_name=display_name,
            handle=handle,
            role_title=member.role_title or "Collaborator",
            pitch_note=member.pitch_note,
            requested_at=member.joined_at,
        )
        for member, display_name, handle in result.all()
    ]


@router.get("/projects/{project_id}/members", response_model=List[ProjectMemberResponse])
async def list_project_members(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await require_project_member(project_id, user.id, db)
    result = await db.execute(
        select(ProjectMember, StudentProfile.display_name, StudentProfile.handle)
        .join(StudentProfile, StudentProfile.user_id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project_id, ProjectMember.status == "ACCEPTED")
        .order_by(ProjectMember.joined_at.asc())
    )
    members = [
        ProjectMemberResponse(
            user_id=member.user_id,
            display_name=display_name,
            handle=handle,
            role_title=member.role_title or "Collaborator",
            is_creator=member.user_id == project.creator_id,
            joined_at=member.joined_at,
        )
        for member, display_name, handle in result.all()
    ]
    if not any(member.user_id == project.creator_id for member in members):
        creator_result = await db.execute(
            select(StudentProfile.display_name, StudentProfile.handle)
            .where(StudentProfile.user_id == project.creator_id)
        )
        creator = creator_result.one_or_none()
        if creator:
            members.insert(0, ProjectMemberResponse(
                user_id=project.creator_id,
                display_name=creator.display_name,
                handle=creator.handle,
                role_title="Project lead",
                is_creator=True,
                joined_at=project.created_at,
            ))
    return members


@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def list_project_tasks(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_project_member(project_id, user.id, db)
    result = await db.execute(select(Task).where(Task.project_id == project_id).order_by(Task.created_at.asc()))
    return result.scalars().all()


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
async def create_project_task(
    project_id: str,
    payload: TaskCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await require_project_member(project_id, user.id, db)
    assignee_id = payload.assignee_id or user.id
    if assignee_id != user.id and project.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project lead can assign tasks to another member")
    if assignee_id != project.creator_id:
        assignee_result = await db.execute(
            select(ProjectMember.id).where(
                and_(
                    ProjectMember.project_id == project_id,
                    ProjectMember.user_id == assignee_id,
                    ProjectMember.status == "ACCEPTED",
                )
            )
        )
        if assignee_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail="Tasks can only be assigned to accepted project members")

    task = Task(
        project_id=project_id,
        title=payload.title,
        status=payload.status,
        assignee_id=assignee_id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/projects/{project_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_project_task(
    project_id: str,
    task_id: str,
    payload: TaskUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await require_project_member(project_id, user.id, db)
    task_result = await db.execute(
        select(Task).where(Task.id == task_id, Task.project_id == project_id)
    )
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_lead = project.creator_id == user.id
    if not is_lead and task.assignee_id != user.id:
        raise HTTPException(status_code=403, detail="You can only update tasks assigned to you")

    changes = payload.model_dump(exclude_unset=True)
    if not is_lead and any(field in changes for field in ("title", "assignee_id")):
        raise HTTPException(status_code=403, detail="Only the project lead can edit task details or assignments")

    if "assignee_id" in changes:
        assignee_id = changes["assignee_id"]
        if assignee_id is not None and assignee_id != project.creator_id:
            assignee_result = await db.execute(
                select(ProjectMember.id).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.user_id == assignee_id,
                        ProjectMember.status == "ACCEPTED",
                    )
                )
            )
            if assignee_result.scalar_one_or_none() is None:
                raise HTTPException(status_code=400, detail="Tasks can only be assigned to accepted project members")

    for field, value in changes.items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


# ----------------------------------------------------
# Events Endpoints
# ----------------------------------------------------

@router.get("/events", response_model=List[EventResponse])
async def list_events(
    response: Response,
    college_id: Optional[str] = None,
    is_cross_campus: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    base_query = select(Event)
    if college_id:
        base_query = base_query.where(Event.college_id == college_id)
    if is_cross_campus is not None:
        base_query = base_query.where(Event.is_cross_campus == is_cross_campus)

    count_result = await db.execute(
        select(func.count()).select_from(base_query.order_by(None).subquery())
    )
    total_count = count_result.scalar() or 0

    query = select(Event, StudentProfile.display_name).outerjoin(
        StudentProfile, StudentProfile.user_id == Event.organizer_id
    )
    if college_id:
        query = query.where(Event.college_id == college_id)
    if is_cross_campus is not None:
        query = query.where(Event.is_cross_campus == is_cross_campus)

    result = await db.execute(
        query.order_by(Event.starts_at.asc()).offset(offset).limit(limit)
    )
    rows = result.all()
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Has-More"] = "true" if offset + len(rows) < total_count else "false"
    response.headers["X-Offset"] = str(offset)
    response.headers["X-Limit"] = str(limit)

    return [
        EventResponse(
            id=event.id,
            organizer_id=event.organizer_id,
            organizer_name=organizer_name or "Organizer",
            community_id=event.community_id,
            college_id=event.college_id,
            title=event.title,
            description=event.description,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            is_online=event.is_online,
            venue_or_link=event.venue_or_link,
            is_cross_campus=event.is_cross_campus,
            safety_notes=event.safety_notes,
            rsvp_count=event.rsvp_count,
            created_at=event.created_at,
        )
        for event, organizer_name in rows
    ]

@router.post("/events", response_model=EventResponse)
async def create_event(
    payload: EventCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = Event(
        organizer_id=user.id,
        community_id=payload.community_id,
        college_id=payload.college_id,
        title=payload.title,
        description=payload.description,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        is_online=payload.is_online,
        venue_or_link=payload.venue_or_link,
        is_cross_campus=payload.is_cross_campus,
        safety_notes=payload.safety_notes,
        rsvp_count=1,
    )
    db.add(event)
    await db.flush()

    # Auto RSVP organizer
    rsvp = EventRSVP(event_id=event.id, user_id=user.id, status="GOING")
    db.add(rsvp)

    await db.commit()
    await db.refresh(event)

    o_res = await db.execute(select(StudentProfile.display_name).where(StudentProfile.user_id == user.id))
    org_name = o_res.scalar_one_or_none() or "Organizer"

    return EventResponse(
        id=event.id,
        organizer_id=event.organizer_id,
        organizer_name=org_name,
        community_id=event.community_id,
        college_id=event.college_id,
        title=event.title,
        description=event.description,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        is_online=event.is_online,
        venue_or_link=event.venue_or_link,
        is_cross_campus=event.is_cross_campus,
        safety_notes=event.safety_notes,
        rsvp_count=event.rsvp_count,
        created_at=event.created_at,
    )


@router.get("/events/{event_id}/attendees")
async def list_event_attendees(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Only the event organizer can view the RSVP list")

    result = await db.execute(
        select(
            EventRSVP.user_id,
            StudentProfile.display_name,
            StudentProfile.handle,
            EventAttendance.id,
        )
        .outerjoin(StudentProfile, StudentProfile.user_id == EventRSVP.user_id)
        .outerjoin(
            EventAttendance,
            and_(
                EventAttendance.event_id == EventRSVP.event_id,
                EventAttendance.user_id == EventRSVP.user_id,
            ),
        )
        .where(EventRSVP.event_id == event_id, EventRSVP.status == "GOING")
        .order_by(EventRSVP.created_at.asc())
    )
    return [
        {
            "user_id": user_id,
            "display_name": display_name or "Student",
            "handle": handle or "",
            "attended": attendance_id is not None,
        }
        for user_id, display_name, handle, attendance_id in result.all()
    ]


@router.post("/events/{event_id}/attendance/{attendee_id}")
async def mark_event_attendance(
    event_id: str,
    attendee_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Only the event organizer can confirm attendance")

    event_end = event.ends_at
    if event_end.tzinfo is None:
        from datetime import timezone
        event_end = event_end.replace(tzinfo=timezone.utc)
    if event_end > datetime.now(event_end.tzinfo):
        raise HTTPException(status_code=409, detail="Attendance can only be confirmed after the event ends")

    rsvp_result = await db.execute(
        select(EventRSVP).where(
            and_(EventRSVP.event_id == event_id, EventRSVP.user_id == attendee_id, EventRSVP.status == "GOING")
        )
    )
    if not rsvp_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Only students with a GOING RSVP can be marked present")

    existing_result = await db.execute(
        select(EventAttendance).where(
            and_(EventAttendance.event_id == event_id, EventAttendance.user_id == attendee_id)
        )
    )
    attendance = existing_result.scalar_one_or_none()
    if attendance:
        return {"marked": True, "already_marked": True}

    db.add(EventAttendance(event_id=event_id, user_id=attendee_id, marked_by=user.id))
    await db.commit()
    return {"marked": True, "already_marked": False}


@router.get("/events/attendance/mine")
async def list_my_event_attendance(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventAttendance, Event)
        .join(Event, Event.id == EventAttendance.event_id)
        .where(EventAttendance.user_id == user.id)
        .order_by(EventAttendance.marked_at.desc())
        .limit(100)
    )
    return [
        {
            "id": attendance.id,
            "event_id": event.id,
            "title": event.title,
            "description": event.description,
            "starts_at": event.starts_at,
            "ends_at": event.ends_at,
            "venue_or_link": event.venue_or_link,
            "is_online": event.is_online,
            "attended_at": attendance.marked_at,
        }
        for attendance, event in result.all()
    ]


@router.post("/events/{event_id}/rsvp")
async def rsvp_event(
    event_id: str,
    status_choice: str = Query("GOING", pattern="^(GOING|INTERESTED)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e_res = await db.execute(select(Event).where(Event.id == event_id))
    event = e_res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    r_res = await db.execute(
        select(EventRSVP).where(and_(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id))
    )
    rsvp = r_res.scalar_one_or_none()
    if rsvp:
        rsvp.status = status_choice
    else:
        rsvp = EventRSVP(event_id=event_id, user_id=user.id, status=status_choice)
        db.add(rsvp)
        event.rsvp_count += 1

    await db.commit()
    return {"message": f"RSVP recorded as {status_choice}", "rsvp_count": event.rsvp_count}
