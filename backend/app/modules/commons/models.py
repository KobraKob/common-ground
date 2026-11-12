import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, JSONList


def utc_now():
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    community_id: Mapped[str] = mapped_column(GUID, ForeignKey("communities.id", ondelete="CASCADE"), nullable=True)
    college_id: Mapped[str] = mapped_column(GUID, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list] = mapped_column(JSONList, default=list)
    is_cross_campus: Mapped[bool] = mapped_column(Boolean, default=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    accepted_answer_comment_id: Mapped[str] = mapped_column(GUID, nullable=True)
    opportunity_meta: Mapped[dict] = mapped_column(JSON, nullable=True)
    upvotes_count: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    is_hidden_by_mod: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    author = relationship("User", foreign_keys=[author_id])
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    poll = relationship("Poll", back_populates="post", uselist=False, cascade="all, delete-orphan")


class Poll(Base):
    __tablename__ = "polls"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id: Mapped[str] = mapped_column(GUID, ForeignKey("posts.id", ondelete="CASCADE"), unique=True, nullable=False)
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    options: Mapped[list] = mapped_column(JSON, default=list)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    post = relationship("Post", back_populates="poll")


class PollVote(Base):
    __tablename__ = "poll_votes"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    poll_id: Mapped[str] = mapped_column(GUID, ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    option_id: Mapped[str] = mapped_column(String(50), nullable=False)

    __table_args__ = (
        UniqueConstraint("poll_id", "user_id", name="uq_poll_user"),
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id: Mapped[str] = mapped_column(GUID, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_comment_id: Mapped[str] = mapped_column(GUID, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_useful_answer: Mapped[bool] = mapped_column(Boolean, default=False)
    upvotes_count: Mapped[int] = mapped_column(Integer, default=0)
    is_hidden_by_mod: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    post = relationship("Post", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


class Reaction(Base):
    __tablename__ = "reactions"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type: Mapped[str] = mapped_column(String(32), nullable=False)
    target_id: Mapped[str] = mapped_column(GUID, nullable=False)
    reaction_type: Mapped[str] = mapped_column(String(32), default="UPVOTE")

    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_reaction"),
    )


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    uploader_id: Mapped[str] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    community_id: Mapped[str] = mapped_column(GUID, ForeignKey("communities.id", ondelete="CASCADE"), nullable=True)
    college_id: Mapped[str] = mapped_column(GUID, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    file_url: Mapped[str] = mapped_column(Text, nullable=True)
    external_link: Mapped[str] = mapped_column(Text, nullable=True)
    subject_tags: Mapped[list] = mapped_column(JSONList, default=list)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public_commons: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
