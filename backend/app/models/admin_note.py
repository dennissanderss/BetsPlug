"""Admin notes and goals."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class AdminGoal(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "admin_goals"

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="todo", nullable=False
    )  # todo, in_progress, done
    priority: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )  # 0=low, 1=medium, 2=high
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class AdminNote(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "admin_notes"

    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), default="idea", nullable=False
    )  # idea, bug, feature, other
