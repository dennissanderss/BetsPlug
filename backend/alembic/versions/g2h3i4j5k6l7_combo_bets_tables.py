"""Add combo_bets + combo_bet_legs tables — Combi van de Dag persistence

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2026-04-28 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "g2h3i4j5k6l7"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "combo_bets" not in existing_tables:
        op.create_table(
            "combo_bets",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("bet_date", sa.Date(), nullable=False),
            sa.Column("picked_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("is_live", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("leg_count", sa.Integer(), nullable=False, server_default=sa.text("3")),
            sa.Column("combined_odds", sa.Float(), nullable=False),
            sa.Column("combined_model_probability", sa.Float(), nullable=False),
            sa.Column("combined_bookmaker_implied", sa.Float(), nullable=False),
            sa.Column("combined_edge", sa.Float(), nullable=False),
            sa.Column("expected_value_per_unit", sa.Float(), nullable=False),
            sa.Column("is_evaluated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("is_correct", sa.Boolean(), nullable=True),
            sa.Column("profit_loss_units", sa.Float(), nullable=True),
            sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("bet_date", "is_live", name="uq_combo_bets_date_live"),
        )
        op.create_index("ix_combo_bets_bet_date", "combo_bets", ["bet_date"])
        op.create_index("ix_combo_bets_picked_at", "combo_bets", ["picked_at"])
        op.create_index("ix_combo_bets_date_live", "combo_bets", ["bet_date", "is_live"])
        op.create_index("ix_combo_bets_eval_live", "combo_bets", ["is_evaluated", "is_live"])

    if "combo_bet_legs" not in existing_tables:
        op.create_table(
            "combo_bet_legs",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column(
                "combo_bet_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("combo_bets.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("leg_index", sa.Integer(), nullable=False),
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
            sa.Column("our_pick", sa.String(10), nullable=False),
            sa.Column("our_probability", sa.Float(), nullable=False),
            sa.Column("confidence", sa.Float(), nullable=False),
            sa.Column("prediction_tier", sa.String(10), nullable=True),
            sa.Column("leg_odds", sa.Float(), nullable=False),
            sa.Column("bookmaker_implied", sa.Float(), nullable=False),
            sa.Column("fair_implied", sa.Float(), nullable=False),
            sa.Column("leg_edge", sa.Float(), nullable=False),
            sa.Column("is_evaluated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("is_correct", sa.Boolean(), nullable=True),
            sa.Column("actual_outcome", sa.String(10), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("combo_bet_id", "leg_index", name="uq_combo_legs_combo_index"),
        )
        op.create_index("ix_combo_legs_combo_id", "combo_bet_legs", ["combo_bet_id"])
        op.create_index("ix_combo_legs_prediction_id", "combo_bet_legs", ["prediction_id"])
        op.create_index("ix_combo_legs_match_id", "combo_bet_legs", ["match_id"])


def downgrade() -> None:
    op.drop_index("ix_combo_legs_match_id", table_name="combo_bet_legs")
    op.drop_index("ix_combo_legs_prediction_id", table_name="combo_bet_legs")
    op.drop_index("ix_combo_legs_combo_id", table_name="combo_bet_legs")
    op.drop_table("combo_bet_legs")
    op.drop_index("ix_combo_bets_eval_live", table_name="combo_bets")
    op.drop_index("ix_combo_bets_date_live", table_name="combo_bets")
    op.drop_index("ix_combo_bets_picked_at", table_name="combo_bets")
    op.drop_index("ix_combo_bets_bet_date", table_name="combo_bets")
    op.drop_table("combo_bets")
