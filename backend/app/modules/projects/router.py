from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.identity.models import User, StudentProfile
from app.modules.colleges.models import College
from app.modules.projects.models import Project, ProjectMember, Task
from app.modules.events.models import Event, EventRSVP
from app.modules.analytics.models import AnalyticsEvent
from app.modules.projects.schemas import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectJoinRequest,
    MemberStatusUpdateRequest,
    TaskCreateRequest,
    TaskResponse,
    EventCreateRequest,
    EventResponse,
)

router = APIRouter(tags=["Projects, Tasks & Events"])


# ----------------------------------------------------
# Projects Endpoints
# ----------------------------------------------------

@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    stage: Optional[str] = None,
    skill: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).order_by(desc(Project.created_at))
    if stage:
        query = query.where(Project.stage == stage)
    if skill:
        query = query.where(Project.skills_needed.ilike(f"%{skill}%"))

    result = await db.execute(query)
    projects = result.scalars().all()

    resp = []
    for p in projects:
        # Creator profile
        c_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == p.creator_id))
        creator_prof = c_res.scalar_one_or_none()

        col_name = None
        if creator_prof and creator_prof.college_id:
            col_res = await db.execute(select(College.name).where(College.id == creator_prof.college_id))
            col_name = col_res.scalar_one_or_none()

        # Members count
        m_count_res = await db.execute(
            select(func.count(ProjectMember.id)).where(
                and_(ProjectMember.project_id == p.id, ProjectMember.status == "ACCEPTED")
            )
        )
        m_count = m_count_res.scalar() or 1

        resp.append(
            ProjectResponse(
                id=p.id,
                creator_id=p.creator_id,
                creator_name=creator_prof.display_name if creator_prof else "Student",
                creator_college_name=col_name,
                college_id=p.college_id,
                title=p.title,
                pitch=p.pitch,
                description=p.description,
                stage=p.stage,
                skills_needed=p.skills_needed or [],
                open_roles=p.open_roles or [],
                is_cross_campus_open=p.is_cross_campus_open,
                repo_or_demo_links=p.repo_or_demo_links or [],
                members_count=m_count,
                created_at=p.created_at,
            )
        )
    return resp


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
            event_name="cross_campus_project_connection",
            college_id=col1,
            is_cross_campus_interaction=is_cross,
            event_metadata={"project_id": project_id, "collaborator_id": member.user_id},
        )
        db.add(analytics)

    await db.commit()
    return {"message": f"Member status updated to {payload.status}"}


@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def list_project_tasks(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.project_id == project_id).order_by(Task.created_at.asc()))
    return result.scalars().all()


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
async def create_project_task(
    project_id: str,
    payload: TaskCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        project_id=project_id,
        title=payload.title,
        status=payload.status,
        assignee_id=payload.assignee_id or user.id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


# ----------------------------------------------------
# Events Endpoints
# ----------------------------------------------------

@router.get("/events", response_model=List[EventResponse])
async def list_events(
    college_id: Optional[str] = None,
    is_cross_campus: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Event).order_by(Event.starts_at.asc())
    if college_id:
        query = query.where(Event.college_id == college_id)
    if is_cross_campus is not None:
        query = query.where(Event.is_cross_campus == is_cross_campus)

    result = await db.execute(query)
    events = result.scalars().all()

    resp = []
    for e in events:
        o_res = await db.execute(select(StudentProfile.display_name).where(StudentProfile.user_id == e.organizer_id))
        org_name = o_res.scalar_one_or_none() or "Organizer"
        resp.append(
            EventResponse(
                id=e.id,
                organizer_id=e.organizer_id,
                organizer_name=org_name,
                community_id=e.community_id,
                college_id=e.college_id,
                title=e.title,
                description=e.description,
                starts_at=e.starts_at,
                ends_at=e.ends_at,
                is_online=e.is_online,
                venue_or_link=e.venue_or_link,
                is_cross_campus=e.is_cross_campus,
                safety_notes=e.safety_notes,
                rsvp_count=e.rsvp_count,
                created_at=e.created_at,
            )
        )
    return resp


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
