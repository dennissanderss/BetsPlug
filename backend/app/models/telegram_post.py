"""ORM row for an individual Telegram post published by the auto-poster.

One row per *action* on the channel — a pick announcement, an in-place
result update, or a daily-summary post. The row is the single source of
truth for "did we already post X?", so the scheduled tasks can remain
idempotent by consulting this table before they hit the Bot API.

Columns mirror what we actually need downstream:

* ``prediction_id``       — links back to the pick we posted. Nullable
                            because the daily-summary post isn't tied to
                            a single prediction.
* ``channel``             — the `@handle` we posted to. Stored verbatim
                            so multi-channel expansion later (Silver,
                            Gold, Platinum) doesn't require a schema
                            change — new rows just carry new handles.
* ``telegram_message_id`` — the numeric id the Bot API returns from
                            ``sendMessage``. Required for in-place edits
                            (result updates).
* ``post_type``           — discriminator. Small enum kept as plain
                            string so we can add new types later without
                            an Alembic migration dance.
* ``posted_at``           — when we hit sendMessage.
* ``result_posted_at``    — when we edited the post to append the final
                            score (null until the fixture resolves).

The ``(prediction_id, post_type, channel)`` unique constraint makes the
idempotency rule explicit at the DB level — the scheduler can try to
insert with ``ON CONFLICT DO NOTHING`` and trust that the DB refuses to
double-post even if two worker processes race.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class TelegramPost(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "telegram_posts"

    prediction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    channel: Mapped[str] = mapped_column(String(128), nullable=False)
    telegram_message_id: Mapped[int] = mapped_column(nullable=False)

    # One of: 'pick', 'result_update', 'daily_summary'.
    # Kept as a plain varchar rather than a Postgres ENUM so adding a
    # future post_type (e.g. 'weekly_recap') doesn't require an Alembic
    # migration to widen the enum.
    post_type: Mapped[str] = mapped_column(String(32), nullable=False)

    posted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )
    result_posted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    # Relationship for the admin endpoint — lets us eager-load the
    # prediction + fixture on the history view without a second query.
    prediction = relationship(
        "Prediction",
        lazy="selectin",
        foreign_keys=[prediction_id],
    )

    __table_args__ = (
        # A given (prediction, post_type) pair can only exist once per
        # channel. That's the "did we already post X?" guard.
        UniqueConstraint(
            "prediction_id",
            "post_type",
            "channel",
            name="uq_tgpost_pred_type_channel",
        ),
        Index("ix_tgpost_channel_posted_at", "channel", "posted_at"),
        Index("ix_tgpost_post_type", "post_type"),
    )
