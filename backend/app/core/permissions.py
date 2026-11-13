from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_


def require_platform_role(user, allowed_roles: List[str]):
    """Ensure user has one of the allowed platform roles."""
    if user.platform_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action requires one of platform roles: {', '.join(allowed_roles)}",
        )


async def check_users_not_blocked(user_a_id: str, user_b_id: str, db: AsyncSession):
    """
    Ensure neither user has blocked the other.
    Raises 403 Forbidden if a block exists.
    """
    from app.modules.identity.models import UserBlock

    query = select(UserBlock).where(
        or_(
            and_(UserBlock.blocker_id == user_a_id, UserBlock.blocked_id == user_b_id),
            and_(UserBlock.blocker_id == user_b_id, UserBlock.blocked_id == user_a_id),
        )
    )
    result = await db.execute(query)
    block = result.scalar_one_or_none()

    if block:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Interaction restricted due to user privacy and block settings",
        )


async def verify_can_dm(sender_id: str, recipient_id: str, db: AsyncSession):
    """
    Enforce recipient messaging preferences, profile visibility and mutual block rules.
    """
    await check_users_not_blocked(sender_id, recipient_id, db)

    from app.modules.identity.models import StudentProfile
    from app.modules.communities.models import CommunityMembership

    profiles_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id.in_([sender_id, recipient_id]))
    )
    profiles = {profile.user_id: profile for profile in profiles_result.scalars().all()}
    recipient = profiles.get(recipient_id)
    sender = profiles.get(sender_id)
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient profile not found")

    same_campus = bool(
        sender
        and sender.college_id
        and recipient.college_id
        and sender.college_id == recipient.college_id
    )
    needs_shared_community = (
        recipient.profile_visibility == "SHARED_COMMUNITIES_ONLY"
        or recipient.dm_permission == "SAME_CAMPUS_OR_COMMUNITY"
    )
    shared_community = False
    if needs_shared_community and not same_campus:
        sender_communities_result = await db.execute(
            select(CommunityMembership.community_id).where(CommunityMembership.user_id == sender_id)
        )
        sender_communities = set(sender_communities_result.scalars().all())
        if sender_communities:
            recipient_communities_result = await db.execute(
                select(CommunityMembership.community_id).where(
                    CommunityMembership.user_id == recipient_id,
                    CommunityMembership.community_id.in_(sender_communities),
                ).limit(1)
            )
            shared_community = recipient_communities_result.scalar_one_or_none() is not None

    if recipient.profile_visibility == "CAMPUS_ONLY" and not same_campus:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recipient profile is visible only to students from the same campus",
        )
    if recipient.profile_visibility == "SHARED_COMMUNITIES_ONLY" and not shared_community:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recipient profile is visible only to shared community members",
        )
    if recipient.profile_visibility not in {"PUBLIC", "CAMPUS_ONLY", "SHARED_COMMUNITIES_ONLY"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recipient profile is not available for new contact",
        )

    if recipient.dm_permission == "EVERYONE":
        return True
    if recipient.dm_permission == "NONE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recipient has disabled incoming direct messages",
        )
    if recipient.dm_permission == "SAME_CAMPUS_OR_COMMUNITY" and (same_campus or shared_community):
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Recipient only accepts DMs from students at the same campus or shared communities",
    )

async def require_community_member_role(
    community_id: str,
    user_id: str,
    allowed_roles: List[str],
    db: AsyncSession,
):
    """Ensure member belongs to community and holds one of allowed roles."""
    from app.modules.communities.models import CommunityMembership

    query = select(CommunityMembership).where(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == user_id,
    )
    result = await db.execute(query)
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this community",
        )

    if membership.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Community action requires role: {', '.join(allowed_roles)}",
        )

    return membership
