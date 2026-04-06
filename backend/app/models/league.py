from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.match import Match
    from app.models.season import Season
    from app.models.sport import Sport
    from app.models.team import Team


class League(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "leagues"

    sport_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sports.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tier: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    sport: Mapped[Sport] = relationship(
        "Sport",
        back_populates="leagues",
        lazy="selectin",
    )
    seasons: Mapped[List[Season]] = relationship(
        "Season",
        back_populates="league",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    matches: Mapped[List[Match]] = relationship(
        "Match",
        back_populates="league",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    teams: Mapped[List[Team]] = relationship(
        "Team",
        back_populates="league",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_leagues_sport_id", "sport_id"),
        Index("ix_leagues_slug", "slug"),
        Index("ix_leagues_is_active", "is_active"),
        Index("ix_leagues_country", "country"),
    )

    def __repr__(self) -> str:
        return (
            f"<League id={self.id!r} name={self.name!r} "
            f"slug={self.slug!r} sport_id={self.sport_id!r}>"
        )
