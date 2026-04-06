from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class OddsHistory(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "odds_history"

    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    market: Mapped[str] = mapped_column(String(100), nullable=False)  # 1x2, over_under, etc.
    home_odds: Mapped[float] = mapped_column(Float, nullable=False)
    draw_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_odds: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("ix_odds_match_id", "match_id"),
        Index("ix_odds_recorded_at", "recorded_at"),
    )
