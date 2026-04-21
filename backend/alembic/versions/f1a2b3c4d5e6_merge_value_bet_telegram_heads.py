"""Merge value_bet + telegram heads

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6, e8f9a0b1c2d3
Create Date: 2026-04-21 23:15:00.000000

Two branches both declared ``down_revision = 'd7e8f9a0b1c2'``:
  - e1f2a3b4c5d6 (value_bets table)
  - e8f9a0b1c2d3 (telegram_posts table)

Without this merge node ``alembic upgrade head`` fails with "Multiple
heads detected". This is a no-op migration — both parent branches
already created their respective tables; we only unify the graph.

On production the ``value_bets`` table was created by FastAPI's
``Base.metadata.create_all`` safety net (see app/main.py lifespan) and
alembic was stamped at the telegram head. This merge keeps both intact
without re-running either upgrade.
"""
from typing import Sequence, Union

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = ("e1f2a3b4c5d6", "e8f9a0b1c2d3")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op — both parent branches already applied."""
    pass


def downgrade() -> None:
    """No-op — splitting the graph back into two heads is meaningless here."""
    pass
