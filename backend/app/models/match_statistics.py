"""Per-match fixture statistics — shots, possession, corners, cards.

Populated from API-Football Pro ``/fixtures/statistics`` endpoint, which
is only available on paid plans. One row per finished match.
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.match import Match


class MatchStatistics(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "match_statistics"

    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Home side
    home_shots_total: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_shots_on_target: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_possession_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    home_corners: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_yellow_cards: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_red_cards: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_fouls: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_offsides: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_passes_accurate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Away side
    away_shots_total: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_shots_on_target: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_possession_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    away_corners: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_yellow_cards: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_red_cards: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_fouls: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_offsides: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_passes_accurate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    source_provider: Mapped[str] = mapped_column(String(64), default="api_football")

    __table_args__ = (Index("ix_match_statistics_match_id", "match_id"),)
