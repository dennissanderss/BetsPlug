"""Simple API-call log for the scaling monitor.

One row per outbound call to any external provider. Cheap to insert,
used only for aggregation. No foreign keys so we never block callers
on an integrity error.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import UUIDPrimaryKey


class ApiUsageLog(UUIDPrimaryKey, Base):
    __tablename__ = "api_usage_log"

    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(200), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    call_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_api_usage_provider_call_at", "provider", "call_at"),
    )
