from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.team import Team
    from app.models.stats import PlayerStats


class Player(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "players"

    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    position: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    jersey_number: Mapped[Optional[int]] = mapped_column(nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    team: Mapped[Team] = relationship(back_populates="players", lazy="selectin")
    stats: Mapped[list[PlayerStats]] = relationship(
        back_populates="player", cascade="all, delete-orphan", lazy="noload"
    )

    __table_args__ = (
        Index("ix_players_team_id", "team_id"),
        Index("ix_players_slug", "slug"),
        Index("ix_players_name", "name"),
    )
