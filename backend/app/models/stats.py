from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.team import Team
    from app.models.player import Player


class TeamStats(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "team_stats"

    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    season_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False
    )
    matches_played: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    goals_scored: Mapped[int] = mapped_column(Integer, default=0)
    goals_conceded: Mapped[int] = mapped_column(Integer, default=0)
    home_wins: Mapped[int] = mapped_column(Integer, default=0)
    away_wins: Mapped[int] = mapped_column(Integer, default=0)
    avg_goals_scored: Mapped[Optional[float]] = mapped_column(nullable=True)
    avg_goals_conceded: Mapped[Optional[float]] = mapped_column(nullable=True)
    extra_stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    team: Mapped[Team] = relationship(back_populates="stats")

    __table_args__ = (
        Index("ix_team_stats_team_season", "team_id", "season_id"),
    )


class PlayerStats(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "player_stats"

    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id", ondelete="CASCADE"), nullable=False
    )
    season_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False
    )
    appearances: Mapped[int] = mapped_column(Integer, default=0)
    goals: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    minutes_played: Mapped[int] = mapped_column(Integer, default=0)
    stat_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    extra_stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    player: Mapped[Player] = relationship(back_populates="stats")

    __table_args__ = (
        Index("ix_player_stats_player_season", "player_id", "season_id"),
    )
