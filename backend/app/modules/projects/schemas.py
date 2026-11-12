from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    pitch: str = Field(..., min_length=5, max_length=300)
    description: str = Field(..., min_length=10)
    stage: str = "IDEA"  # IDEA, RECRUITING, PROTOTYPING, LIVE, COMPLETED
    skills_needed: List[str] = []
    open_roles: List[str] = []
    is_cross_campus_open: bool = True
    repo_or_demo_links: List[dict] = []


class ProjectJoinRequest(BaseModel):
    pitch_note: str = Field(..., min_length=5)
    role_title: Optional[str] = "Collaborator"


class MemberStatusUpdateRequest(BaseModel):
    status: str  # ACCEPTED, DECLINED


class TaskCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    status: str = "TODO"  # TODO, IN_PROGRESS, DONE
    assignee_id: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    assignee_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: str
    creator_id: str
    creator_name: Optional[str] = None
    creator_college_name: Optional[str] = None
    college_id: Optional[str] = None
    title: str
    pitch: str
    description: str
    stage: str
    skills_needed: List[str] = []
    open_roles: List[str] = []
    is_cross_campus_open: bool
    repo_or_demo_links: List[dict] = []
    members_count: int = 1
    created_at: datetime

    class Config:
        from_attributes = True


class EventCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10)
    starts_at: datetime
    ends_at: datetime
    is_online: bool = False
    venue_or_link: str
    is_cross_campus: bool = True
    safety_notes: Optional[str] = None
    community_id: Optional[str] = None
    college_id: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    organizer_id: str
    organizer_name: Optional[str] = None
    community_id: Optional[str] = None
    college_id: Optional[str] = None
    title: str
    description: str
    starts_at: datetime
    ends_at: datetime
    is_online: bool
    venue_or_link: str
    is_cross_campus: bool
    safety_notes: Optional[str] = None
    rsvp_count: int
    created_at: datetime

    class Config:
        from_attributes = True
