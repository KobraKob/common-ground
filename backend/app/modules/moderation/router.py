from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_platform_role
from app.modules.identity.models import User
from app.modules.commons.models import Post, Comment
from app.modules.messaging.models import Message
from app.modules.moderation.models import Report, ModerationAction
from app.modules.notifications.models import Notification
from app.modules.moderation.schemas import (
    ReportCreateRequest,
    ReportResponse,
    ModerationActionRequest,
    ModerationActionResponse,
    NotificationResponse,
)

router = APIRouter(tags=["Trust, Safety & Moderation"])


@router.post("/moderation/reports", response_model=ReportResponse)
async def submit_report(
    payload: ReportCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = Report(
        reporter_id=user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
        details=payload.details,
        status="PENDING",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/moderation/queue", response_model=List[ReportResponse])
async def get_moderation_queue(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Only MODERATOR or ADMIN can view moderation queue
    require_platform_role(user, ["MODERATOR", "ADMIN"])

    query = (
        select(Report)
        .where(Report.status.in_(["PENDING", "UNDER_REVIEW"]))
        .order_by(desc(Report.created_at))
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/moderation/actions", response_model=ModerationActionResponse)
async def execute_moderation_action(
    payload: ModerationActionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_platform_role(user, ["MODERATOR", "ADMIN"])

    # Perform action on target
    if payload.action_type == "HIDE_CONTENT":
        if payload.target_type == "POST":
            p = await db.execute(select(Post).where(Post.id == payload.target_id))
            post = p.scalar_one_or_none()
            if post:
                post.is_hidden_by_mod = True
        elif payload.target_type == "COMMENT":
            c = await db.execute(select(Comment).where(Comment.id == payload.target_id))
            comm = c.scalar_one_or_none()
            if comm:
                comm.is_hidden_by_mod = True
        elif payload.target_type == "MESSAGE":
            m = await db.execute(select(Message).where(Message.id == payload.target_id))
            msg = m.scalar_one_or_none()
            if msg:
                msg.is_deleted = True

    elif payload.action_type == "RESTORE_CONTENT":
        if payload.target_type == "POST":
            p = await db.execute(select(Post).where(Post.id == payload.target_id))
            post = p.scalar_one_or_none()
            if post:
                post.is_hidden_by_mod = False
        elif payload.target_type == "COMMENT":
            c = await db.execute(select(Comment).where(Comment.id == payload.target_id))
            comm = c.scalar_one_or_none()
            if comm:
                comm.is_hidden_by_mod = False

    elif payload.action_type == "SUSPEND_USER":
        u = await db.execute(select(User).where(User.id == payload.target_id))
        target_user = u.scalar_one_or_none()
        if target_user:
            target_user.is_suspended = True

    # Update report status if report_id given
    if payload.report_id:
        r = await db.execute(select(Report).where(Report.id == payload.report_id))
        report = r.scalar_one_or_none()
        if report:
            report.status = "DISMISSED" if payload.action_type == "DISMISS_REPORT" else "RESOLVED_ACTION_TAKEN"
            report.resolved_by = user.id
            report.resolved_at = datetime.now(timezone.utc)

    # Append immutable audit log entry
    action = ModerationAction(
        actor_id=user.id,
        report_id=payload.report_id,
        action_type=payload.action_type,
        target_type=payload.target_type,
        target_id=payload.target_id,
        notes=payload.notes,
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return action


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_my_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(desc(Notification.created_at))
        .limit(20)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).where(
        and_(Notification.id == notification_id, Notification.user_id == user.id)
    )
    res = await db.execute(q)
    n = res.scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"message": "Notification marked read"}
