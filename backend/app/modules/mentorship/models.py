import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, GUID, JSONList


def utc_now():
    return datetime.now(timezone.utc)


class MentorshipProfile(Base):
    __tablename__ = "mentorship_profiles"

    user_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    topics: Mapped[list] = mapped_column(JSONList, default=list, nullable=False)
    bio: Mapped[str] = mapped_column(Text, default="", nullable=False)
    availability_note: Mapped[str] = mapped_column(String(160), default="", nullable=False)
    format: Mapped[str] = mapped_column(String(20), default="ONLINE", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mentor_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("requester_id", "mentor_id", name="uq_mentorship_request_pair"),
        Index("ix_mentorship_requests_mentor_status", "mentor_id", "status"),
        Index("ix_mentorship_requests_requester_status", "requester_id", "status"),
    )
