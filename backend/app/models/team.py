from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.league import League
    from app.models.player import Player
    from app.models.stats import TeamStats


class Team(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "teams"

    league_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    short_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    venue: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    league: Mapped[League] = relationship(back_populates="teams", lazy="selectin")
    players: Mapped[list[Player]] = relationship(
        back_populates="team", cascade="all, delete-orphan", lazy="selectin"
    )
    stats: Mapped[list[TeamStats]] = relationship(
        back_populates="team", cascade="all, delete-orphan", lazy="noload"
    )

    __table_args__ = (
        Index("ix_teams_league_id", "league_id"),
        Index("ix_teams_slug", "slug"),
        Index("ix_teams_name", "name"),
    )
