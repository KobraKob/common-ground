import hashlib
import secrets
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_id, get_optional_current_user_id, create_access_token
from app.core.permissions import check_users_not_blocked
from app.modules.identity.models import User, StudentProfile, AffiliationClaim, VerificationRecord, UserBlock, UserMute
from app.modules.identity.schemas import (
    OnboardingRequest,
    ProfileUpdateRequest,
    VerificationClaimRequest,
    BlockUserRequest,
    MuteTargetRequest,
    StudentProfileResponse,
    SignUpRequest,
    LoginRequest,
    AuthResponse,
)
from app.modules.colleges.models import College
from app.modules.communities.models import Community, CommunityMembership


def hash_password(password: str) -> str:
    """Hash passwords with PBKDF2-HMAC-SHA256 and a per-password random salt."""
    iterations = 310_000
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256\${iterations}\${salt.hex()}\${digest.hex()}"


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    if not hashed_password:
        return False

    parts = hashed_password.split("$")
    if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
        try:
            iterations = int(parts[1])
            if iterations < 100_000 or iterations > 2_000_000:
                return False
            salt = bytes.fromhex(parts[2])
            expected = parts[3]
            actual = hashlib.pbkdf2_hmac(
                "sha256", plain_password.encode("utf-8"), salt, iterations
            ).hex()
            return secrets.compare_digest(expected, actual)
        except (ValueError, TypeError):
            return False

    # Verify legacy salted SHA-256 hashes once, then upgrade them after login.
    if len(parts) == 2:
        salt, expected = parts
        actual = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
        return secrets.compare_digest(expected, actual)
    return False


auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/signup", response_model=AuthResponse)
async def signup(
    payload: SignUpRequest,
    db: AsyncSession = Depends(get_db),
):
    clean_email = payload.email.lower().strip()
    clean_handle = payload.handle.lower().strip().lstrip("@")

    # 1. Check if email already exists
    existing_email = await db.execute(select(User).where(User.email == clean_email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # 2. Check if handle already exists
    existing_handle = await db.execute(select(StudentProfile).where(StudentProfile.handle == clean_handle))
    if existing_handle.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This handle is already taken")

    # 3. Determine verification stage
    verification_stage = "STAGE_1_PROVISIONAL"
    college_name = None
    if payload.college_id:
        c_res = await db.execute(select(College).where(College.id == payload.college_id))
        college = c_res.scalar_one_or_none()
        if college:
            college_name = college.name
            user_domain = clean_email.split("@")[-1]
            if college.email_domains and any(
                user_domain == d.lower() or user_domain.endswith("." + d.lower())
                for d in college.email_domains
            ):
                verification_stage = "STAGE_3_INSTITUTIONAL_VERIFIED"

    # 4. Create user
    new_user = User(
        email=clean_email,
        password_hash=hash_password(payload.password),
        platform_role="USER",
        is_suspended=False,
    )
    db.add(new_user)
    await db.flush()

    # 5. Create student profile
    profile = StudentProfile(
        user_id=new_user.id,
        handle=clean_handle,
        display_name=payload.display_name.strip(),
        bio=payload.bio,
        college_id=payload.college_id,
        verification_stage=verification_stage,
        course_branch=payload.course_branch,
        graduation_year=payload.graduation_year,
        skills=payload.skills,
        interests=payload.interests,
        collaboration_goals=["Hackathons", "Side Projects"],
        profile_visibility="PUBLIC",
        dm_permission="SAME_CAMPUS_OR_COMMUNITY",
        onboarding_completed=True,
    )
    db.add(profile)

    # 6. Auto-join campus hub if college_id provided
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
            db.add(CommunityMembership(community_id=hub.id, user_id=new_user.id, role="MEMBER"))
            hub.member_count += 1

    await db.commit()
    await db.refresh(profile)

    token = create_access_token(new_user.id)
    prof_resp = StudentProfileResponse(
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

    return AuthResponse(
        token=token,
        user_id=new_user.id,
        email=new_user.email,
        profile=prof_resp,
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    login_term = payload.login.lower().strip().lstrip("@")
    u_res = await db.execute(
        select(User, StudentProfile)
        .join(StudentProfile, User.id == StudentProfile.user_id, isouter=True)
        .where(or_(User.email == login_term, StudentProfile.handle == login_term))
    )
    row = u_res.first()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user, profile = row
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="User account is suspended")

    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.password_hash.startswith("pbkdf2_sha256$"):
        user.password_hash = hash_password(payload.password)
        await db.commit()

    college_name = None
    if profile and profile.college_id:
        c_res = await db.execute(select(College.name).where(College.id == profile.college_id))
        college_name = c_res.scalar_one_or_none()

    token = create_access_token(user.id)
    prof_resp = StudentProfileResponse(
        user_id=profile.user_id if profile else user.id,
        handle=profile.handle if profile else user.email.split("@")[0],
        display_name=profile.display_name if profile else "Student",
        bio=profile.bio if profile else None,
        avatar_url=profile.avatar_url if profile else None,
        college_id=profile.college_id if profile else None,
        college_name=college_name,
        verification_stage=profile.verification_stage if profile else "STAGE_1_PROVISIONAL",
        course_branch=profile.course_branch if profile else None,
        graduation_year=profile.graduation_year if profile else None,
        skills=profile.skills if profile else [],
        interests=profile.interests if profile else [],
        collaboration_goals=profile.collaboration_goals if profile else [],
        profile_visibility=profile.profile_visibility if profile else "PUBLIC",
        show_course_year=profile.show_course_year if profile else True,
        dm_permission=profile.dm_permission if profile else "SAME_CAMPUS_OR_COMMUNITY",
        onboarding_completed=profile.onboarding_completed if profile else True,
        created_at=profile.created_at if profile else user.created_at,
    )

    return AuthResponse(
        token=token,
        user_id=user.id,
        email=user.email,
        profile=prof_resp,
    )


@auth_router.get("/me", response_model=StudentProfileResponse)
async def auth_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    college_name = None
    if profile.college_id:
        c_res = await db.execute(select(College.name).where(College.id == profile.college_id))
        college_name = c_res.scalar_one_or_none()

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


router = APIRouter(prefix="/profiles", tags=["Identity & Profiles"])


@router.get("", response_model=List[StudentProfileResponse])
async def list_profiles(
    skill: Optional[str] = None,
    college_id: Optional[str] = None,
    current_user_id: Optional[str] = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(StudentProfile).where(StudentProfile.profile_visibility == "PUBLIC")
    if college_id:
        query = query.where(StudentProfile.college_id == college_id)

    if current_user_id:
        block_query = select(UserBlock.blocked_id).where(UserBlock.blocker_id == current_user_id)
        blocked_by_query = select(UserBlock.blocker_id).where(UserBlock.blocked_id == current_user_id)
        query = query.where(
            and_(
                StudentProfile.user_id != current_user_id,
                StudentProfile.user_id.notin_(block_query),
                StudentProfile.user_id.notin_(blocked_by_query),
            )
        )

    result = await db.execute(query.order_by(StudentProfile.created_at.desc()).limit(60))
    profiles = result.scalars().all()

    response = []
    for p in profiles:
        if skill and skill.upper() != "ALL":
            if not any(skill.lower() == s.lower() for s in (p.skills or [])):
                continue
        college_name = None
        if p.college_id:
            c_res = await db.execute(select(College.name).where(College.id == p.college_id))
            college_name = c_res.scalar_one_or_none()
        response.append(
            StudentProfileResponse(
                user_id=p.user_id,
                handle=p.handle,
                display_name=p.display_name,
                bio=p.bio,
                avatar_url=p.avatar_url,
                college_id=p.college_id,
                college_name=college_name,
                verification_stage=p.verification_stage,
                course_branch=p.course_branch if p.show_course_year else None,
                graduation_year=p.graduation_year if p.show_course_year else None,
                skills=p.skills or [],
                interests=p.interests or [],
                collaboration_goals=p.collaboration_goals or [],
                profile_visibility=p.profile_visibility,
                show_course_year=p.show_course_year,
                dm_permission=p.dm_permission,
                onboarding_completed=p.onboarding_completed,
                created_at=p.created_at,
            )
        )
    return response


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
    current_user_id: Optional[str] = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(StudentProfile).where(StudentProfile.handle == handle))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # 1. Enforce block boundaries (returns 404 to avoid leaking existence of profile to blocked user)
    if current_user_id and current_user_id != profile.user_id:
        block_query = select(UserBlock).where(
            or_(
                and_(UserBlock.blocker_id == current_user_id, UserBlock.blocked_id == profile.user_id),
                and_(UserBlock.blocker_id == profile.user_id, UserBlock.blocked_id == current_user_id),
            )
        )
        b_res = await db.execute(block_query)
        if b_res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Student profile not found")

    # 2. Enforce profile visibility boundaries (guests must not bypass restricted visibility)
    if profile.profile_visibility != "PUBLIC":
        if not current_user_id:
            raise HTTPException(
                status_code=403,
                detail="Profile is restricted. Please sign in to view.",
            )
        if current_user_id != profile.user_id:
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
            elif profile.profile_visibility == "PRIVATE":
                raise HTTPException(status_code=403, detail="This profile is private")

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
