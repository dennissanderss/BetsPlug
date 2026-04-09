from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.match import Match
    from app.models.model_version import ModelVersion


class Prediction(UUIDPrimaryKey, TimestampMixin, Base):
    """Immutable prediction record. Never update after creation."""

    __tablename__ = "predictions"

    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    model_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False
    )
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    prediction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # match_result, score, etc.

    home_win_prob: Mapped[float] = mapped_column(Float, nullable=False)
    draw_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    away_win_prob: Mapped[float] = mapped_column(Float, nullable=False)

    predicted_home_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_away_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_interval_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    features_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_output: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    is_simulation: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    match: Mapped[Match] = relationship(back_populates="predictions", lazy="selectin")
    model_version: Mapped[ModelVersion] = relationship(lazy="selectin")
    explanation: Mapped[Optional[PredictionExplanation]] = relationship(
        back_populates="prediction", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    evaluation: Mapped[Optional[PredictionEvaluation]] = relationship(
        back_populates="prediction", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_predictions_match_id", "match_id"),
        Index("ix_predictions_model_version_id", "model_version_id"),
        Index("ix_predictions_predicted_at", "predicted_at"),
        Index("ix_predictions_type", "prediction_type"),
        # Composite index for fast "latest prediction per match" subquery
        Index("ix_predictions_match_predicted_at", "match_id", "predicted_at"),
        # Composite index for bet-of-the-day: confidence DESC scan filtered by match date
        Index("ix_predictions_confidence", "confidence"),
    )


class PredictionExplanation(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "prediction_explanations"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("predictions.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    top_factors_for: Mapped[dict] = mapped_column(JSONB, nullable=False)
    top_factors_against: Mapped[dict] = mapped_column(JSONB, nullable=False)
    similar_historical: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    feature_importances: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    prediction: Mapped[Prediction] = relationship(back_populates="explanation")


class PredictionEvaluation(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "prediction_evaluations"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("predictions.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    actual_outcome: Mapped[str] = mapped_column(String(50), nullable=False)  # home/draw/away
    actual_home_score: Mapped[Optional[int]] = mapped_column(nullable=True)
    actual_away_score: Mapped[Optional[int]] = mapped_column(nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    brier_score: Mapped[float] = mapped_column(Float, nullable=False)
    log_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    prediction: Mapped[Prediction] = relationship(back_populates="evaluation")

    __table_args__ = (
        Index("ix_pred_eval_prediction_id", "prediction_id"),
        Index("ix_pred_eval_evaluated_at", "evaluated_at"),
    )
