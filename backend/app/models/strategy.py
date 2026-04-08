"""Strategy and PredictionStrategy models."""
from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class Strategy(UUIDPrimaryKey, TimestampMixin, Base):
    """
    A named betting strategy defined by a set of filter rules and staking config.

    Rules are stored as a JSONB list of dicts, each with:
        {"feature": str, "operator": str, "value": number | [min, max]}

    Staking is a JSONB dict, e.g.:
        {"type": "flat", "amount": 1}
    """

    __tablename__ = "strategies"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rules: Mapped[dict] = mapped_column(JSONB, nullable=False)
    staking: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default={"type": "flat", "amount": 1}
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class PredictionStrategy(Base):
    """
    Junction table linking predictions to strategies.

    ``matched`` indicates whether the prediction satisfied the strategy's rules
    at evaluation time.
    """

    __tablename__ = "prediction_strategies"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    strategy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("strategies.id", ondelete="CASCADE"),
        primary_key=True,
    )
    matched: Mapped[bool] = mapped_column(Boolean, nullable=False)
