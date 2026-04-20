"""Add telegram_posts table for @BetsPlug auto-poster

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
Create Date: 2026-04-20 15:00:00.000000

Tracks every message the BetsPlug Telegram auto-poster publishes so the
scheduler can be idempotent (never double-post the same pick, can find
the original message_id when a fixture resolves and we need to edit the
post with the final score).

Nothing in the model/ORM layer depends on Prediction — we link by
prediction_id with ON DELETE SET NULL so a deleted prediction doesn't
cascade into lost post history.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Idempotent: boot reconciliation may have already created the table
    # via Base.metadata.create_all, in which case we skip the column DDL.
    if "telegram_posts" in inspector.get_table_names():
        return

    op.create_table(
        "telegram_posts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "prediction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("predictions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("channel", sa.String(length=128), nullable=False),
        sa.Column("telegram_message_id", sa.BigInteger(), nullable=False),
        sa.Column("post_type", sa.String(length=32), nullable=False),
        sa.Column(
            "posted_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "result_posted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint(
            "prediction_id",
            "post_type",
            "channel",
            name="uq_tgpost_pred_type_channel",
        ),
    )
    op.create_index(
        "ix_telegram_posts_prediction_id",
        "telegram_posts",
        ["prediction_id"],
    )
    op.create_index(
        "ix_tgpost_channel_posted_at",
        "telegram_posts",
        ["channel", "posted_at"],
    )
    op.create_index(
        "ix_tgpost_post_type",
        "telegram_posts",
        ["post_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_tgpost_post_type", table_name="telegram_posts")
    op.drop_index("ix_tgpost_channel_posted_at", table_name="telegram_posts")
    op.drop_index(
        "ix_telegram_posts_prediction_id", table_name="telegram_posts"
    )
    op.drop_table("telegram_posts")
