"""Combi van de Dag persistence model.

A combo bet is one daily 3-leg accumulator. Each leg references a
v8.1 prediction. Two populations distinguished by ``is_live``:
- ``False`` = backfilled from historical predictions via the replay
  script (used to seed the back-test panel with real data).
- ``True``  = live daily pipeline selection.

The ``(bet_date, is_live)`` uniqueness prevents writing two combos for
the same calendar day in the same population — exactly one live combo
per day, plus optionally one backfilled row per pre-launch day.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class ComboBet(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "combo_bets"

    bet_date: Mapped[date] = mapped_column(Date, nullable=False)
    picked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    is_live: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    leg_count: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    combined_odds: Mapped[float] = mapped_column(Float, nullable=False)
    combined_model_probability: Mapped[float] = mapped_column(Float, nullable=False)
    combined_bookmaker_implied: Mapped[float] = mapped_column(Float, nullable=False)
    combined_edge: Mapped[float] = mapped_column(Float, nullable=False)
    expected_value_per_unit: Mapped[float] = mapped_column(Float, nullable=False)

    is_evaluated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    profit_loss_units: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    evaluated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    legs: Mapped[list["ComboBetLeg"]] = relationship(
        "ComboBetLeg",
        back_populates="combo",
        cascade="all, delete-orphan",
        order_by="ComboBetLeg.leg_index",
    )

    __table_args__ = (
        Index("ix_combo_bets_bet_date", "bet_date"),
        Index("ix_combo_bets_picked_at", "picked_at"),
        Index("ix_combo_bets_date_live", "bet_date", "is_live"),
        Index("ix_combo_bets_eval_live", "is_evaluated", "is_live"),
        UniqueConstraint("bet_date", "is_live", name="uq_combo_bets_date_live"),
    )


class ComboBetLeg(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "combo_bet_legs"

    combo_bet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("combo_bets.id", ondelete="CASCADE"),
        nullable=False,
    )
    leg_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 0..N-1

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

    our_pick: Mapped[str] = mapped_column(String(10), nullable=False)
    our_probability: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    prediction_tier: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    leg_odds: Mapped[float] = mapped_column(Float, nullable=False)
    bookmaker_implied: Mapped[float] = mapped_column(Float, nullable=False)
    fair_implied: Mapped[float] = mapped_column(Float, nullable=False)
    leg_edge: Mapped[float] = mapped_column(Float, nullable=False)

    is_evaluated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    actual_outcome: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    combo: Mapped["ComboBet"] = relationship("ComboBet", back_populates="legs")

    __table_args__ = (
        Index("ix_combo_legs_combo_id", "combo_bet_id"),
        Index("ix_combo_legs_prediction_id", "prediction_id"),
        Index("ix_combo_legs_match_id", "match_id"),
        UniqueConstraint(
            "combo_bet_id", "leg_index", name="uq_combo_legs_combo_index"
        ),
    )
