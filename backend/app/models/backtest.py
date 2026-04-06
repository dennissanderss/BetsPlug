from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class BacktestRun(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "backtest_runs"

    model_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sport_slug: Mapped[str] = mapped_column(String(50), nullable=False)
    league_slug: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_predictions: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    brier_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    log_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    calibration_error: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    summary_metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="running")  # running, completed, failed
    ran_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    results: Mapped[list[BacktestResult]] = relationship(
        back_populates="backtest_run", cascade="all, delete-orphan", lazy="noload"
    )

    __table_args__ = (
        Index("ix_backtest_runs_model_version", "model_version_id"),
        Index("ix_backtest_runs_status", "status"),
    )


class BacktestResult(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "backtest_results"

    backtest_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("backtest_runs.id", ondelete="CASCADE"), nullable=False
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    predicted_outcome: Mapped[str] = mapped_column(String(50), nullable=False)
    actual_outcome: Mapped[str] = mapped_column(String(50), nullable=False)
    home_win_prob: Mapped[float] = mapped_column(Float, nullable=False)
    draw_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    away_win_prob: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    brier_score: Mapped[float] = mapped_column(Float, nullable=False)

    backtest_run: Mapped[BacktestRun] = relationship(back_populates="results")

    __table_args__ = (
        Index("ix_backtest_results_run_id", "backtest_run_id"),
    )
