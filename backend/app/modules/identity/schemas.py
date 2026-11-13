from typing import List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class OnboardingRequest(BaseModel):
    handle: str = Field(..., min_length=3, max_length=50)
    display_name: str = Field(..., min_length=2, max_length=100)
    college_id: Optional[str] = None
    course_branch: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    collaboration_goals: List[str] = []
    profile_visibility: Literal["PUBLIC", "CAMPUS_ONLY", "SHARED_COMMUNITIES_ONLY"] = "PUBLIC"
    dm_permission: Literal["EVERYONE", "SAME_CAMPUS_OR_COMMUNITY", "NONE"] = "SAME_CAMPUS_OR_COMMUNITY"


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    course_branch: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    collaboration_goals: Optional[List[str]] = None
    profile_visibility: Optional[Literal['PUBLIC', 'CAMPUS_ONLY', 'SHARED_COMMUNITIES_ONLY']] = None
    show_course_year: Optional[bool] = None
    dm_permission: Optional[Literal['EVERYONE', 'SAME_CAMPUS_OR_COMMUNITY', 'NONE']] = None


class VerificationClaimRequest(BaseModel):
    college_id: str
    claimed_stage: Literal["STAGE_3_INSTITUTIONAL_VERIFIED"] = "STAGE_3_INSTITUTIONAL_VERIFIED"
    institutional_email: Optional[EmailStr] = None
    invite_code: Optional[str] = None


class BlockUserRequest(BaseModel):
    target_user_id: str


class MuteTargetRequest(BaseModel):
    target_type: str  # USER, COMMUNITY, TAG
    target_value: str


class StudentProfileResponse(BaseModel):
    user_id: str
    platform_role: Optional[str] = None
    handle: str
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    college_id: Optional[str] = None
    college_name: Optional[str] = None
    verification_stage: str
    course_branch: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: List[str] = []
    interests: List[str] = []
    collaboration_goals: List[str] = []
    profile_visibility: str
    show_course_year: bool
    dm_permission: str
    onboarding_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    handle: str = Field(..., min_length=3, max_length=50)
    display_name: str = Field(..., min_length=2, max_length=100)
    college_id: Optional[str] = None
    course_branch: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []


class LoginRequest(BaseModel):
    login: str  # Email or handle
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str
    profile: StudentProfileResponse
