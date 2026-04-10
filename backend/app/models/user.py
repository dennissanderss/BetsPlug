from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class Role(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role: Mapped[Role] = mapped_column(SAEnum(Role), default=Role.VIEWER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Email verification
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default="false"
    )
    email_verification_token: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    email_verification_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Password reset
    reset_password_token: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    reset_password_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Activity
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
