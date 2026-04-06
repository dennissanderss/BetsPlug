from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class ModelVersion(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "model_versions"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)  # elo, poisson, logistic, ensemble
    sport_scope: Mapped[str] = mapped_column(String(50), nullable=False)  # sport slug or "all"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    hyperparameters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    training_metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    brier_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    sample_size: Mapped[int | None] = mapped_column(Integer, nullable=True)


class FeatureSnapshot(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "feature_snapshots"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    feature_set: Mapped[dict] = mapped_column(JSONB, nullable=False)
    feature_version: Mapped[str] = mapped_column(String(50), nullable=False)
