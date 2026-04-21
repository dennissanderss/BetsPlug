"""Add value_bets table — persistence for value-bet engine

Revision ID: e1f2a3b4c5d6
Revises: d7e8f9a0b1c2
Create Date: 2026-04-21 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "value_bets" in existing_tables:
        return

    op.create_table(
        "value_bets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "prediction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("predictions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "match_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("matches.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("bet_date", sa.Date(), nullable=False),
        sa.Column("picked_at", sa.DateTime(timezone=True), nullable=False),
        # Our pick
        sa.Column("our_pick", sa.String(10), nullable=False),  # home/draw/away
        sa.Column("our_probability", sa.Float(), nullable=False),
        sa.Column("our_probability_home", sa.Float(), nullable=False),
        sa.Column("our_probability_draw", sa.Float(), nullable=True),
        sa.Column("our_probability_away", sa.Float(), nullable=False),
        sa.Column("our_confidence", sa.Float(), nullable=False),
        sa.Column("prediction_tier", sa.String(10), nullable=True),
        # Odds snapshot
        sa.Column("odds_source", sa.String(100), nullable=False),
        sa.Column("odds_home", sa.Float(), nullable=False),
        sa.Column("odds_draw", sa.Float(), nullable=True),
        sa.Column("odds_away", sa.Float(), nullable=False),
        sa.Column("odds_snapshot_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("best_odds_for_pick", sa.Float(), nullable=False),
        # Implied
        sa.Column("bookmaker_implied_home", sa.Float(), nullable=False),
        sa.Column("bookmaker_implied_draw", sa.Float(), nullable=True),
        sa.Column("bookmaker_implied_away", sa.Float(), nullable=False),
        sa.Column("overround", sa.Float(), nullable=False),
        sa.Column("margin", sa.Float(), nullable=False),
        sa.Column("fair_implied_home", sa.Float(), nullable=False),
        sa.Column("fair_implied_draw", sa.Float(), nullable=True),
        sa.Column("fair_implied_away", sa.Float(), nullable=False),
        sa.Column(
            "normalization_method",
            sa.String(20),
            nullable=False,
            server_default="proportional",
        ),
        # Value metrics
        sa.Column("edge", sa.Float(), nullable=False),
        sa.Column("expected_value", sa.Float(), nullable=False),
        sa.Column("kelly_fraction", sa.Float(), nullable=True),
        # Lifecycle
        sa.Column(
            "is_live",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "is_evaluated",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("actual_outcome", sa.String(10), nullable=True),
        sa.Column("profit_loss_units", sa.Float(), nullable=True),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_value_bets_prediction_id", "value_bets", ["prediction_id"])
    op.create_index("ix_value_bets_match_id", "value_bets", ["match_id"])
    op.create_index("ix_value_bets_bet_date", "value_bets", ["bet_date"])
    op.create_index("ix_value_bets_picked_at", "value_bets", ["picked_at"])
    op.create_index(
        "ix_value_bets_date_live", "value_bets", ["bet_date", "is_live"]
    )
    op.create_index(
        "ix_value_bets_eval_live", "value_bets", ["is_evaluated", "is_live"]
    )
    # One value-bet per (prediction, is_live) — prevents double backfill + double live
    op.create_unique_constraint(
        "uq_value_bets_prediction_live",
        "value_bets",
        ["prediction_id", "is_live"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_value_bets_prediction_live", "value_bets", type_="unique")
    op.drop_index("ix_value_bets_eval_live", table_name="value_bets")
    op.drop_index("ix_value_bets_date_live", table_name="value_bets")
    op.drop_index("ix_value_bets_picked_at", table_name="value_bets")
    op.drop_index("ix_value_bets_bet_date", table_name="value_bets")
    op.drop_index("ix_value_bets_match_id", table_name="value_bets")
    op.drop_index("ix_value_bets_prediction_id", table_name="value_bets")
    op.drop_table("value_bets")
