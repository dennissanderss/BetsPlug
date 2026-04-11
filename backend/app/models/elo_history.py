"""Point-in-time Elo rating history — the v5 fix for feature leakage.

Every finished match emits two rows (one per team) recording the new Elo
rating that takes effect **after** the match. Predictions query this
table with ``effective_at < match.scheduled_at`` so the model can only
see ratings that were already known at kickoff.

This replaces ``app/forecasting/team_seeds.py`` which hardcoded current
team strength and caused systematic leakage in every historical backfill.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.team import Team
    from app.models.match import Match


class TeamEloHistory(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "team_elo_history"

    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    k_factor: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)
    # The instant at which this rating becomes the "current" rating for the
    # team. For post-match updates we set this to ``match.scheduled_at +
    # timedelta(hours=3)`` (match ended, result known). For the initial
    # seed row we use the timestamp of the team's first known match.
    effective_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # Link back to the match that produced this rating (null for initial
    # seed rows).
    source_match_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="SET NULL"),
        nullable=True,
    )
    # What kind of event produced this row: "initial_seed", "match_update",
    # "manual_correction". Handy when debugging or resetting.
    source_kind: Mapped[str] = mapped_column(
        String(32), nullable=False, default="match_update"
    )

    __table_args__ = (
        # The hot query: "latest rating for team X before timestamp Y".
        Index(
            "ix_elo_history_team_effective",
            "team_id",
            "effective_at",
        ),
        Index("ix_elo_history_source_match", "source_match_id"),
    )
