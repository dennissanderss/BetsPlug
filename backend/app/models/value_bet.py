"""Value-bet persistence model.

A row per selected value-bet. Two populations distinguished by ``is_live``:
- ``False`` = backfilled from historical populated ``closing_odds_snapshot``
  rows (see ``backend/scripts/backfill_value_bets.py``).
- ``True``  = live daily pipeline selection.

The ``(prediction_id, is_live)`` uniqueness prevents double-inserting the
same prediction in either population — but allows a backfill row AND a
live row to coexist when the backfill window overlaps with the first
live days.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class ValueBet(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "value_bets"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
    )
    bet_date: Mapped[date] = mapped_column(Date, nullable=False)
    picked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    our_pick: Mapped[str] = mapped_column(String(10), nullable=False)
    our_probability: Mapped[float] = mapped_column(Float, nullable=False)
    our_probability_home: Mapped[float] = mapped_column(Float, nullable=False)
    our_probability_draw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    our_probability_away: Mapped[float] = mapped_column(Float, nullable=False)
    our_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    prediction_tier: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    odds_source: Mapped[str] = mapped_column(String(100), nullable=False)
    odds_home: Mapped[float] = mapped_column(Float, nullable=False)
    odds_draw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    odds_away: Mapped[float] = mapped_column(Float, nullable=False)
    odds_snapshot_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    best_odds_for_pick: Mapped[float] = mapped_column(Float, nullable=False)

    bookmaker_implied_home: Mapped[float] = mapped_column(Float, nullable=False)
    bookmaker_implied_draw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bookmaker_implied_away: Mapped[float] = mapped_column(Float, nullable=False)
    overround: Mapped[float] = mapped_column(Float, nullable=False)
    margin: Mapped[float] = mapped_column(Float, nullable=False)
    fair_implied_home: Mapped[float] = mapped_column(Float, nullable=False)
    fair_implied_draw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fair_implied_away: Mapped[float] = mapped_column(Float, nullable=False)
    normalization_method: Mapped[str] = mapped_column(
        String(20), nullable=False, default="proportional"
    )

    edge: Mapped[float] = mapped_column(Float, nullable=False)
    expected_value: Mapped[float] = mapped_column(Float, nullable=False)
    kelly_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    is_live: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_evaluated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    actual_outcome: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    profit_loss_units: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    evaluated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        Index("ix_value_bets_prediction_id", "prediction_id"),
        Index("ix_value_bets_match_id", "match_id"),
        Index("ix_value_bets_bet_date", "bet_date"),
        Index("ix_value_bets_picked_at", "picked_at"),
        Index("ix_value_bets_date_live", "bet_date", "is_live"),
        Index("ix_value_bets_eval_live", "is_evaluated", "is_live"),
        UniqueConstraint(
            "prediction_id", "is_live", name="uq_value_bets_prediction_live"
        ),
    )
