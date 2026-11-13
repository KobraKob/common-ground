from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class CollegeResponse(BaseModel):
    id: str
    name: str
    slug: str
    short_name: str
    city: str
    state: str
    email_domains: List[str]
    is_official_partner: bool
    is_active_cluster: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    member_count: int = 0
    community_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CampusHubOverview(BaseModel):
    college: CollegeResponse
    student_created_communities: List[dict]
    official_spaces: List[dict]
    pinned_announcements: List[dict]
    upcoming_events: List[dict]
    active_discussions: List[dict]
