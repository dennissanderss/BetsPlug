from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.league import League


class Season(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "seasons"

    league_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leagues.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "2024-2025"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    league: Mapped[League] = relationship(
        "League",
        back_populates="seasons",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_seasons_league_id", "league_id"),
        Index("ix_seasons_is_current", "is_current"),
        Index("ix_seasons_start_date", "start_date"),
        Index("ix_seasons_end_date", "end_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<Season id={self.id!r} name={self.name!r} "
            f"league_id={self.league_id!r} is_current={self.is_current!r}>"
        )
