from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.league import League


class Sport(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "sports"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    leagues: Mapped[List[League]] = relationship(
        "League",
        back_populates="sport",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_sports_slug", "slug"),
        Index("ix_sports_name", "name"),
        Index("ix_sports_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Sport id={self.id!r} name={self.name!r} slug={self.slug!r}>"
