"""Per-league top scorer snapshots — rebuilt on sync.

Populated from API-Football Pro ``/players/topscorers``. One row per
player per league per season. Latest snapshot wins (upsert on unique
constraint).
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class TopScorer(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "top_scorers"

    league_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leagues.id", ondelete="CASCADE"),
        nullable=False,
    )
    season_name: Mapped[str] = mapped_column(String(32), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    player_external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    player_name: Mapped[str] = mapped_column(String(200), nullable=False)
    team_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    team_external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    goals: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assists: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    appearances: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    minutes_played: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    source_provider: Mapped[str] = mapped_column(String(64), default="api_football")

    __table_args__ = (
        UniqueConstraint(
            "league_id",
            "season_name",
            "player_external_id",
            name="uq_top_scorer_league_season_player",
        ),
        Index("ix_top_scorer_league_season", "league_id", "season_name"),
    )
