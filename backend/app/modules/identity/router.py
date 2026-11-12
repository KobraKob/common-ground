from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_id
from app.core.permissions import check_users_not_blocked
from app.modules.identity.models import User, StudentProfile, AffiliationClaim, VerificationRecord, UserBlock, UserMute
from app.modules.identity.schemas import (
    OnboardingRequest,
    ProfileUpdateRequest,
    VerificationClaimRequest,
    BlockUserRequest,
    MuteTargetRequest,
    StudentProfileResponse,
)
from app.modules.colleges.models import College
from app.modules.communities.models import Community, CommunityMembership

router = APIRouter(prefix="/profiles", tags=["Identity & Profiles"])


@router.post("/onboarding", response_model=StudentProfileResponse)
async def complete_onboarding(
    payload: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify handle uniqueness
    existing_handle = await db.execute(
        select(StudentProfile).where(
            and_(StudentProfile.handle == payload.handle, StudentProfile.user_id != user.id)
        )
    )
    if existing_handle.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Handle is already taken")

    # Fetch or create student profile
    res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    profile = res.scalar_one_or_none()

    if not profile:
        profile = StudentProfile(
            user_id=user.id,
            handle=payload.handle,
            display_name=payload.display_name,
            bio=payload.bio,
            college_id=payload.college_id,
            verification_stage="STAGE_1_PROVISIONAL",  # Strictly provisional on open onboarding
            course_branch=payload.course_branch,
            graduation_year=payload.graduation_year,
            skills=payload.skills,
            interests=payload.interests,
            collaboration_goals=payload.collaboration_goals,
            profile_visibility=payload.profile_visibility,
            dm_permission=payload.dm_permission,
            onboarding_completed=True,
        )
        db.add(profile)
    else:
        profile.handle = payload.handle
        profile.display_name = payload.display_name
        profile.bio = payload.bio
        profile.college_id = payload.college_id
        profile.course_branch = payload.course_branch
        profile.graduation_year = payload.graduation_year
        profile.skills = payload.skills
        profile.interests = payload.interests
        profile.collaboration_goals = payload.collaboration_goals
        profile.profile_visibility = payload.profile_visibility
        profile.dm_permission = payload.dm_permission
        profile.onboarding_completed = True

    # Auto-join the selected college's default CAMPUS_HUB community if college_id provided
    if payload.college_id:
        comm_res = await db.execute(
            select(Community).where(
                and_(
                    Community.college_id == payload.college_id,
                    Community.community_type == "CAMPUS_HUB",
                )
            )
        )
        hub = comm_res.scalar_one_or_none()
        if hub:
            existing_mem = await db.execute(
                select(CommunityMembership).where(
                    and_(
                        CommunityMembership.community_id == hub.id,
                        CommunityMembership.user_id == user.id,
                    )
                )
            )
            if not existing_mem.scalar_one_or_none():
                membership = CommunityMembership(
                    community_id=hub.id,
                    user_id=user.id,
                    role="MEMBER",
                )
                db.add(membership)
                hub.member_count += 1

    await db.commit()
    await db.refresh(profile)

    college_name = None
    if profile.college_id:
        c_res = await db.execute(select(College).where(College.id == profile.college_id))
        college = c_res.scalar_one_or_none()
        if college:
            college_name = college.name

    return StudentProfileResponse(
        user_id=profile.user_id,
        handle=profile.handle,
        display_name=profile.display_name,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        college_id=profile.college_id,
        college_name=college_name,
        verification_stage=profile.verification_stage,
        course_branch=profile.course_branch,
        graduation_year=profile.graduation_year,
        skills=profile.skills,
        interests=profile.interests,
        collaboration_goals=profile.collaboration_goals,
        profile_visibility=profile.profile_visibility,
        show_course_year=profile.show_course_year,
        dm_permission=profile.dm_permission,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
    )


@router.get("/me", response_model=StudentProfileResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not yet created")

    college_name = None
    if profile.college_id:
        c_res = await db.execute(select(College).where(College.id == profile.college_id))
        college = c_res.scalar_one_or_none()
        if college:
            college_name = college.name

    return StudentProfileResponse(
        user_id=profile.user_id,
        handle=profile.handle,
        display_name=profile.display_name,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        college_id=profile.college_id,
        college_name=college_name,
        verification_stage=profile.verification_stage,
        course_branch=profile.course_branch,
        graduation_year=profile.graduation_year,
        skills=profile.skills,
        interests=profile.interests,
        collaboration_goals=profile.collaboration_goals,
        profile_visibility=profile.profile_visibility,
        show_course_year=profile.show_course_year,
        dm_permission=profile.dm_permission,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
    )


@router.patch("/me", response_model=StudentProfileResponse)
async def update_my_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)

    college_name = None
    if profile.college_id:
        c_res = await db.execute(select(College).where(College.id == profile.college_id))
        college = c_res.scalar_one_or_none()
        if college:
            college_name = college.name

    return StudentProfileResponse(
        user_id=profile.user_id,
        handle=profile.handle,
        display_name=profile.display_name,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        college_id=profile.college_id,
        college_name=college_name,
        verification_stage=profile.verification_stage,
        course_branch=profile.course_branch,
        graduation_year=profile.graduation_year,
        skills=profile.skills,
        interests=profile.interests,
        collaboration_goals=profile.collaboration_goals,
        profile_visibility=profile.profile_visibility,
        show_course_year=profile.show_course_year,
        dm_permission=profile.dm_permission,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
    )


@router.get("/{handle}", response_model=StudentProfileResponse)
async def get_profile_by_handle(
    handle: str,
    current_user_id: Optional[str] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(StudentProfile).where(StudentProfile.handle == handle))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # If current user is checking another profile, enforce block and privacy rules
    if current_user_id and current_user_id != profile.user_id:
        # Check blocks
        block_query = select(UserBlock).where(
            or_(
                and_(UserBlock.blocker_id == current_user_id, UserBlock.blocked_id == profile.user_id),
                and_(UserBlock.blocker_id == profile.user_id, UserBlock.blocked_id == current_user_id),
            )
        )
        b_res = await db.execute(block_query)
        if b_res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Student profile not found")

        # Check visibility
        if profile.profile_visibility == "CAMPUS_ONLY":
            curr_prof_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user_id))
            curr_prof = curr_prof_res.scalar_one_or_none()
            if not curr_prof or curr_prof.college_id != profile.college_id:
                raise HTTPException(status_code=403, detail="Profile is only visible to campus peers")

        elif profile.profile_visibility == "SHARED_COMMUNITIES_ONLY":
            mem1 = await db.execute(select(CommunityMembership.community_id).where(CommunityMembership.user_id == current_user_id))
            mem2 = await db.execute(select(CommunityMembership.community_id).where(CommunityMembership.user_id == profile.user_id))
            s1 = set(mem1.scalars().all())
            s2 = set(mem2.scalars().all())
            if not s1.intersection(s2):
                raise HTTPException(status_code=403, detail="Profile is only visible to members of shared communities")

    college_name = None
    if profile.college_id:
        c_res = await db.execute(select(College).where(College.id == profile.college_id))
        college = c_res.scalar_one_or_none()
        if college:
            college_name = college.name

    return StudentProfileResponse(
        user_id=profile.user_id,
        handle=profile.handle,
        display_name=profile.display_name,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        college_id=profile.college_id,
        college_name=college_name,
        verification_stage=profile.verification_stage,
        course_branch=profile.course_branch if profile.show_course_year else None,
        graduation_year=profile.graduation_year if profile.show_course_year else None,
        skills=profile.skills,
        interests=profile.interests,
        collaboration_goals=profile.collaboration_goals,
        profile_visibility=profile.profile_visibility,
        show_course_year=profile.show_course_year,
        dm_permission=profile.dm_permission,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
    )


@router.post("/verify/request")
async def request_verification(
    payload: VerificationClaimRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    claim = AffiliationClaim(
        user_id=user.id,
        college_id=payload.college_id,
        claimed_stage=payload.claimed_stage,
        institutional_email=payload.institutional_email,
        status="PENDING",
    )
    db.add(claim)
    await db.commit()
    return {"message": "Verification request submitted successfully", "claim_id": claim.id}


@router.post("/{target_user_id}/block")
async def block_user(
    target_user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    existing = await db.execute(
        select(UserBlock).where(
            and_(UserBlock.blocker_id == user.id, UserBlock.blocked_id == target_user_id)
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "User is already blocked"}

    block = UserBlock(blocker_id=user.id, blocked_id=target_user_id)
    db.add(block)
    await db.commit()
    return {"message": "User blocked successfully"}


@router.delete("/{target_user_id}/block")
async def unblock_user(
    target_user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(UserBlock).where(
            and_(UserBlock.blocker_id == user.id, UserBlock.blocked_id == target_user_id)
        )
    )
    await db.commit()
    return {"message": "User unblocked successfully"}


@router.post("/mutes")
async def mute_target(
    payload: MuteTargetRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mute = UserMute(
        user_id=user.id,
        muted_target_type=payload.target_type,
        muted_target_value=payload.target_value,
    )
    db.add(mute)
    await db.commit()
    return {"message": f"Muted {payload.target_type}: {payload.target_value}"}
