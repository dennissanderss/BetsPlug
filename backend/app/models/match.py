from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

import enum

if TYPE_CHECKING:
    from app.models.league import League
    from app.models.team import Team
    from app.models.prediction import Prediction


class MatchStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    FINISHED = "finished"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"


class Match(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "matches"

    league_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False
    )
    season_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("seasons.id", ondelete="SET NULL"), nullable=True
    )
    home_team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    away_team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[MatchStatus] = mapped_column(
        SAEnum(MatchStatus), default=MatchStatus.SCHEDULED, nullable=False
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    venue: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    round_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    matchday: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    league: Mapped[League] = relationship(back_populates="matches", lazy="selectin")
    home_team: Mapped[Team] = relationship(foreign_keys=[home_team_id], lazy="selectin")
    away_team: Mapped[Team] = relationship(foreign_keys=[away_team_id], lazy="selectin")
    result: Mapped[Optional[MatchResult]] = relationship(
        back_populates="match", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    predictions: Mapped[list[Prediction]] = relationship(
        back_populates="match", cascade="all, delete-orphan", lazy="noload"
    )

    __table_args__ = (
        Index("ix_matches_league_id", "league_id"),
        Index("ix_matches_home_team_id", "home_team_id"),
        Index("ix_matches_away_team_id", "away_team_id"),
        Index("ix_matches_scheduled_at", "scheduled_at"),
        Index("ix_matches_status", "status"),
        Index("ix_matches_external_id", "external_id"),
    )


class MatchResult(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "match_results"

    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    home_score: Mapped[int] = mapped_column(Integer, nullable=False)
    away_score: Mapped[int] = mapped_column(Integer, nullable=False)
    home_score_ht: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_score_ht: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    winner: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # home/away/draw
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    match: Mapped[Match] = relationship(back_populates="result")

    __table_args__ = (Index("ix_match_results_match_id", "match_id"),)
