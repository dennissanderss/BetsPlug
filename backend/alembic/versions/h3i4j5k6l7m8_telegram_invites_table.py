"""Add telegram_invites table — per-user single-use invite links.

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-04-29 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "h3i4j5k6l7m8"
down_revision: Union[str, None] = "g2h3i4j5k6l7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "telegram_invites" in existing_tables:
        # Idempotent: already-present table is treated as success so the
        # boot-time migration sweep can run safely on an upgraded DB.
        return

    op.create_table(
        "telegram_invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tier", sa.SmallInteger(), nullable=False),
        sa.Column("chat_id", sa.String(length=64), nullable=False),
        sa.Column("invite_link", sa.String(length=256), nullable=False),
        sa.Column("expire_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "tier", name="uq_tginvite_user_tier"),
    )
    op.create_index(
        "ix_telegram_invites_user_id", "telegram_invites", ["user_id"]
    )
    op.create_index(
        "ix_tginvite_used_at", "telegram_invites", ["used_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_tginvite_used_at", table_name="telegram_invites")
    op.drop_index("ix_telegram_invites_user_id", table_name="telegram_invites")
    op.drop_table("telegram_invites")
