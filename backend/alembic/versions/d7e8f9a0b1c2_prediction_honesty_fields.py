"""Add honesty fields to predictions: source, locked_at, lead_time, odds snapshot

Revision ID: d7e8f9a0b1c2
Revises: c6e8f1a2b3c4
Create Date: 2026-04-13 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, None] = "c6e8f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {c["name"] for c in inspector.get_columns("predictions")}

    if "prediction_source" not in existing:
        op.add_column(
            "predictions",
            sa.Column("prediction_source", sa.String(20), nullable=True, server_default="backtest"),
        )
    if "locked_at" not in existing:
        op.add_column(
            "predictions",
            sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "match_scheduled_at" not in existing:
        op.add_column(
            "predictions",
            sa.Column("match_scheduled_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "lead_time_hours" not in existing:
        op.add_column(
            "predictions",
            sa.Column("lead_time_hours", sa.Float(), nullable=True),
        )
    if "closing_odds_snapshot" not in existing:
        op.add_column(
            "predictions",
            sa.Column("closing_odds_snapshot", postgresql.JSONB(), nullable=True),
        )

    # Label all existing predictions as backtest
    op.execute(
        sa.text(
            "UPDATE predictions SET prediction_source = 'backtest' WHERE prediction_source IS NULL"
        )
    )

    # Populate match_scheduled_at from joined matches
    op.execute(
        sa.text(
            "UPDATE predictions p SET match_scheduled_at = m.scheduled_at "
            "FROM matches m WHERE m.id = p.match_id AND p.match_scheduled_at IS NULL"
        )
    )

    # Compute lead_time_hours
    op.execute(
        sa.text(
            "UPDATE predictions SET lead_time_hours = "
            "EXTRACT(EPOCH FROM (match_scheduled_at - predicted_at)) / 3600.0 "
            "WHERE lead_time_hours IS NULL AND match_scheduled_at IS NOT NULL AND predicted_at IS NOT NULL"
        )
    )

    # Create index
    existing_indexes = {idx["name"] for idx in inspector.get_indexes("predictions")}
    if "ix_predictions_source" not in existing_indexes:
        op.create_index("ix_predictions_source", "predictions", ["prediction_source"])


def downgrade() -> None:
    op.drop_index("ix_predictions_source", table_name="predictions")
    op.drop_column("predictions", "closing_odds_snapshot")
    op.drop_column("predictions", "lead_time_hours")
    op.drop_column("predictions", "match_scheduled_at")
    op.drop_column("predictions", "locked_at")
    op.drop_column("predictions", "prediction_source")
