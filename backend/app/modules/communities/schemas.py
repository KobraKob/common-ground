from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CommunityCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=150)
    description: str
    community_type: str = "CLUB"  # CAMPUS_HUB, DEPARTMENT, CLASS_COHORT, CLUB, CROSS_CAMPUS_INTEREST, PROJECT_GROUP
    visibility: str = "PUBLIC"  # PUBLIC, CAMPUS_RESTRICTED, PRIVATE_INVITE_ONLY
    college_id: Optional[str] = None
    is_official_endorsed: bool = False  # Checked on backend; only admin can set true


class CommunityResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    community_type: str
    visibility: str
    college_id: Optional[str] = None
    is_official_endorsed: bool
    invite_code: Optional[str] = None
    member_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreateRequest(BaseModel):
    body: str = Field(..., min_length=1)
    reply_to_message_id: Optional[str] = None
    attachments: List[dict] = []


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None
    sender_handle: Optional[str] = None
    reply_to_message_id: Optional[str] = None
    body: str
    attachments: List[dict] = []
    is_announcement: bool
    is_pinned: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DirectConversationRequest(BaseModel):
    recipient_user_id: str


class ConversationResponse(BaseModel):
    id: str
    conversation_type: str
    community_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    last_message_at: datetime
    last_message: Optional[str] = None
    member_role: Optional[str] = None

    class Config:
        from_attributes = True
