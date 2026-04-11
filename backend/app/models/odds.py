"""Odds history — per-match, per-bookmaker, per-market snapshot.

Supports 1X2, Over/Under (2.5 goals default), and BTTS markets. A row
is one (match, bookmaker, market, recorded_at) tuple. Predictions use
the ``1X2`` rows for the ROI calculation — see
``calculate_realised_roi`` in ``app/services/strategy_engine.py``.
"""
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
    market: Mapped[str] = mapped_column(String(100), nullable=False)  # 1x2, over_under_2_5, btts

    # 1X2 market columns (nullable so rows for other markets can ignore them)
    home_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    draw_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_odds: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Over/Under market columns (added v5)
    over_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    under_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_line: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Both Teams To Score columns (added v5)
    btts_yes_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    btts_no_odds: Mapped[float | None] = mapped_column(Float, nullable=True)

    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("ix_odds_match_id", "match_id"),
        Index("ix_odds_recorded_at", "recorded_at"),
        Index("ix_odds_match_market", "match_id", "market"),
    )
