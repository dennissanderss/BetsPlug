"""v5 followup: force-add the over/under/btts columns to odds_history

Revision ID: c6e8f1a2b3c4
Revises: c5d6e7f8a9b0
Create Date: 2026-04-11 17:20:00.000000

The c5d6e7f8a9b0 migration tried to add these columns guarded by an
``inspector.get_columns`` check, but on the production database the
ADD COLUMN statements did not actually run (production still has
the original v1 odds_history schema). The symptom: ``backfill-odds``
crashes with ``column "over_odds" of relation "odds_history" does
not exist``.

This migration uses raw ``ALTER TABLE ... ADD COLUMN IF NOT EXISTS``
statements so we don't depend on the alembic inspector. Idempotent —
safe to re-run anywhere.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "c6e8f1a2b3c4"
down_revision: Union[str, None] = "c5d6e7f8a9b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE odds_history
          ADD COLUMN IF NOT EXISTS over_odds      DOUBLE PRECISION,
          ADD COLUMN IF NOT EXISTS under_odds     DOUBLE PRECISION,
          ADD COLUMN IF NOT EXISTS total_line     DOUBLE PRECISION,
          ADD COLUMN IF NOT EXISTS btts_yes_odds  DOUBLE PRECISION,
          ADD COLUMN IF NOT EXISTS btts_no_odds   DOUBLE PRECISION
        """
    )
    # home_odds / away_odds were NOT NULL in the v1 schema — relax to
    # nullable so rows for over/under and btts markets don't need
    # dummy values.
    op.execute("ALTER TABLE odds_history ALTER COLUMN home_odds DROP NOT NULL")
    op.execute("ALTER TABLE odds_history ALTER COLUMN away_odds DROP NOT NULL")

    # Composite index on (match_id, market) for the ROI-lookup hot path.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_odds_match_market ON odds_history (match_id, market)"
    )


def downgrade() -> None:
    pass
