from datetime import datetime, timezone
import re
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.identity.models import User, StudentProfile, UserBlock
from app.modules.communities.models import CommunityMembership
from app.modules.colleges.models import College
from app.modules.mentorship.models import MentorshipProfile, MentorshipRequest

router = APIRouter(prefix="/mentorship", tags=["Peer mentorship"])


class MentorshipProfileUpdate(BaseModel):
    is_available: bool
    topics: List[str] = Field(default_factory=list, max_length=12)
    bio: str = Field(default="", max_length=500)
    availability_note: str = Field(default="", max_length=160)
    format: Literal["ONLINE", "IN_PERSON", "BOTH"] = "ONLINE"


class MentorshipProfileResponse(BaseModel):
    is_available: bool
    topics: List[str]
    bio: str
    availability_note: str
    format: Literal["ONLINE", "IN_PERSON", "BOTH"]


class MentorshipRequestCreate(BaseModel):
    mentor_id: str
    note: str = Field(..., min_length=10, max_length=500)


class MentorshipRequestStatusUpdate(BaseModel):
    status: Literal["ACCEPTED", "DECLINED", "CANCELLED"]


def profile_response(profile: Optional[MentorshipProfile]) -> dict:
    return {
        "is_available": bool(profile and profile.is_available),
        "topics": profile.topics if profile else [],
        "bio": profile.bio if profile else "",
        "availability_note": profile.availability_note if profile else "",
        "format": profile.format if profile else "ONLINE",
    }


@router.get("/profile/me", response_model=MentorshipProfileResponse)
async def get_my_mentorship_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MentorshipProfile).where(MentorshipProfile.user_id == user.id)
    )
    return profile_response(result.scalar_one_or_none())


@router.put("/profile/me", response_model=MentorshipProfileResponse)
async def update_my_mentorship_profile(
    payload: MentorshipProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user.id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=409, detail="Complete your student profile before opting into mentorship")
    if payload.is_available and student.profile_visibility != "PUBLIC":
        raise HTTPException(status_code=409, detail="Set your student profile visibility to Public before appearing in mentor discovery")
    public_text = f"{payload.bio} {payload.availability_note}"
    if re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", public_text, re.IGNORECASE):
        raise HTTPException(status_code=422, detail="Do not publish personal email addresses in a mentor profile")
    if re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", public_text):
        raise HTTPException(status_code=422, detail="Do not publish phone numbers in a mentor profile")

    result = await db.execute(
        select(MentorshipProfile).where(MentorshipProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = MentorshipProfile(user_id=user.id)
        db.add(profile)

    topics = []
    for topic in payload.topics:
        clean = topic.strip()
        if clean:
            normalised = clean[:40]
            if normalised.casefold() not in {item.casefold() for item in topics}:
                topics.append(normalised)
    profile.is_available = payload.is_available
    profile.topics = topics[:12]
    profile.bio = payload.bio.strip()
    profile.availability_note = payload.availability_note.strip()
    profile.format = payload.format
    profile.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(profile)
    return profile_response(profile)


@router.get("/mentors")
async def list_opt_in_mentors(
    topic: Optional[str] = None,
    limit: int = Query(30, ge=1, le=60),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    blocked_ids = select(UserBlock.blocked_id).where(UserBlock.blocker_id == user.id)
    blocked_by_ids = select(UserBlock.blocker_id).where(UserBlock.blocked_id == user.id)
    requester_profile_result = await db.execute(
        select(StudentProfile.college_id).where(StudentProfile.user_id == user.id)
    )
    requester_college_id = requester_profile_result.scalar_one_or_none()
    requester_community_ids = select(CommunityMembership.community_id).where(
        CommunityMembership.user_id == user.id
    )
    shared_community_users = select(CommunityMembership.user_id).where(
        CommunityMembership.community_id.in_(requester_community_ids)
    )
    same_campus_or_community = [StudentProfile.user_id.in_(shared_community_users)]
    if requester_college_id:
        same_campus_or_community.append(StudentProfile.college_id == requester_college_id)

    query = (
        select(MentorshipProfile, StudentProfile, College.name)
        .join(StudentProfile, StudentProfile.user_id == MentorshipProfile.user_id)
        .outerjoin(College, College.id == StudentProfile.college_id)
        .where(
            MentorshipProfile.is_available.is_(True),
            StudentProfile.profile_visibility == "PUBLIC",
            or_(\n                StudentProfile.dm_permission == "EVERYONE",\n                and_(StudentProfile.dm_permission == "SAME_CAMPUS_OR_COMMUNITY", or_(*same_campus_or_community)),\n            ),
            MentorshipProfile.user_id != user.id,
            StudentProfile.user_id.notin_(blocked_ids),
            StudentProfile.user_id.notin_(blocked_by_ids),
        )
        .order_by(MentorshipProfile.updated_at.desc())
        .limit(300)
    )
    result = await db.execute(query)
    rows = result.all()
    clean_topic = topic.strip().casefold() if topic else None
    mentors = []
    for profile, student, college_name in rows:
        if clean_topic and not any(clean_topic in item.casefold() for item in (profile.topics or [])):
            continue
        mentors.append({
            "user_id": student.user_id,
            "display_name": student.display_name,
            "handle": student.handle,
            "college_name": college_name,
            "skills": student.skills or [],
            "topics": profile.topics or [],
            "bio": profile.bio,
            "availability_note": profile.availability_note,
            "format": profile.format,
        })
    return mentors[offset:offset + limit]


@router.post("/requests", status_code=201)
async def create_mentorship_request(
    payload: MentorshipRequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.mentor_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot request mentorship from yourself")

    mentor_result = await db.execute(
        select(MentorshipProfile, StudentProfile)
        .join(StudentProfile, StudentProfile.user_id == MentorshipProfile.user_id)
        .where(
            MentorshipProfile.user_id == payload.mentor_id,
            MentorshipProfile.is_available.is_(True),
            StudentProfile.profile_visibility == "PUBLIC",
        )
    )
    mentor_row = mentor_result.one_or_none()
    if not mentor_row:
        raise HTTPException(status_code=404, detail="This student is not currently listed as an available mentor")
    mentor_profile, mentor_student = mentor_row

    block_result = await db.execute(
        select(UserBlock.id).where(
            or_(
                and_(UserBlock.blocker_id == user.id, UserBlock.blocked_id == payload.mentor_id),
                and_(UserBlock.blocker_id == payload.mentor_id, UserBlock.blocked_id == user.id),
            )
        )
    )
    if block_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mentor not found")

    requester_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user.id)
    )
    requester_profile = requester_profile_result.scalar_one_or_none()
    if not requester_profile:
        raise HTTPException(status_code=409, detail="Complete your student profile before requesting mentorship")
    if mentor_student.dm_permission == "NONE":
        raise HTTPException(status_code=403, detail="This student does not accept new contact requests")
    if mentor_student.dm_permission == "SAME_CAMPUS_OR_COMMUNITY":
        same_campus = bool(
            requester_profile
            and requester_profile.college_id
            and requester_profile.college_id == mentor_student.college_id
        )
        requester_communities = await db.execute(
            select(CommunityMembership.community_id).where(CommunityMembership.user_id == user.id)
        )
        mentor_communities = await db.execute(
            select(CommunityMembership.community_id).where(CommunityMembership.user_id == payload.mentor_id)
        )
        shared_communities = set(requester_communities.scalars().all()).intersection(
            mentor_communities.scalars().all()
        )
        if not same_campus and not shared_communities:
            raise HTTPException(status_code=403, detail="Mentorship requests are limited by this student's contact settings")

    pending_count_result = await db.execute(
        select(MentorshipRequest.id).where(
            MentorshipRequest.requester_id == user.id,
            MentorshipRequest.status == "PENDING",
        ).limit(5)
    )
    if len(pending_count_result.scalars().all()) >= 5:
        raise HTTPException(status_code=429, detail="You can have up to five pending mentorship requests at a time")

    existing_result = await db.execute(
        select(MentorshipRequest).where(
            MentorshipRequest.requester_id == user.id,
            MentorshipRequest.mentor_id == payload.mentor_id,
        )
    )
    request = existing_result.scalar_one_or_none()
    if request and request.status in {"PENDING", "ACCEPTED"}:
        raise HTTPException(status_code=409, detail="You already have an active request with this mentor")
    if request:
        request.note = payload.note.strip()
        request.status = "PENDING"
        request.created_at = datetime.now(timezone.utc)
        request.updated_at = datetime.now(timezone.utc)
    else:
        request = MentorshipRequest(
            requester_id=user.id,
            mentor_id=payload.mentor_id,
            note=payload.note.strip(),
            status="PENDING",
        )
        db.add(request)
    await db.commit()
    await db.refresh(request)
    return {"id": request.id, "status": request.status, "created_at": request.created_at}


@router.get("/requests/mine")
async def list_my_mentorship_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    incoming_result = await db.execute(
        select(MentorshipRequest, StudentProfile.display_name, StudentProfile.handle)
        .join(StudentProfile, StudentProfile.user_id == MentorshipRequest.requester_id)
        .where(MentorshipRequest.mentor_id == user.id)
        .order_by(MentorshipRequest.created_at.desc())
        .limit(50)
    )
    outgoing_result = await db.execute(
        select(MentorshipRequest, StudentProfile.display_name, StudentProfile.handle)
        .join(StudentProfile, StudentProfile.user_id == MentorshipRequest.mentor_id)
        .where(MentorshipRequest.requester_id == user.id)
        .order_by(MentorshipRequest.created_at.desc())
        .limit(50)
    )
    return {
        "incoming": [
            {"id": item.id, "user_id": item.requester_id, "display_name": name, "handle": handle, "note": item.note, "status": item.status, "created_at": item.created_at}
            for item, name, handle in incoming_result.all()
        ],
        "outgoing": [
            {"id": item.id, "user_id": item.mentor_id, "display_name": name, "handle": handle, "note": item.note, "status": item.status, "created_at": item.created_at}
            for item, name, handle in outgoing_result.all()
        ],
    }


@router.patch("/requests/{request_id}")
async def update_mentorship_request(
    request_id: str,
    payload: MentorshipRequestStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MentorshipRequest).where(MentorshipRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Mentorship request not found")
    if request.status != "PENDING":
        raise HTTPException(status_code=409, detail="Only pending requests can be updated")

    if payload.status == "CANCELLED":
        if request.requester_id != user.id:
            raise HTTPException(status_code=403, detail="Only the requester can cancel this request")
    elif request.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Only the selected mentor can accept or decline this request")

    request.status = payload.status
    request.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"id": request.id, "status": request.status}
