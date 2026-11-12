from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReportCreateRequest(BaseModel):
    target_type: str = Field(..., pattern="^(USER|POST|COMMENT|MESSAGE|COMMUNITY|EVENT|PROJECT|RESOURCE)$")
    target_id: str
    reason: str = Field(..., pattern="^(HARASSMENT|IMPERSONATION|SPAM|UNSAFE_MEETUP|MISINFORMATION|OTHER)$")
    details: Optional[str] = None


class ModerationActionRequest(BaseModel):
    report_id: Optional[str] = None
    action_type: str = Field(..., pattern="^(HIDE_CONTENT|RESTORE_CONTENT|REMOVE_FROM_GROUP|SUSPEND_USER|VERIFY_AFFILIATION|DISMISS_REPORT)$")
    target_type: str
    target_id: str
    notes: str = Field(..., min_length=3)


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    target_type: str
    target_id: str
    reason: str
    details: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ModerationActionResponse(BaseModel):
    id: str
    actor_id: str
    report_id: Optional[str] = None
    action_type: str
    target_type: str
    target_id: str
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    action_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
