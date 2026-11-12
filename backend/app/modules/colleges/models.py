import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, GUID, JSONList


def utc_now():
    return datetime.now(timezone.utc)


class College(Base):
    __tablename__ = "colleges"

    id: Mapped[str] = mapped_column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    short_name: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Bengaluru", nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Karnataka", nullable=False)
    email_domains: Mapped[list] = mapped_column(JSONList, default=list)
    is_official_partner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active_cluster: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
