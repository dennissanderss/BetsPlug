"""v5 rebuild: elo history, match statistics, odds extension, top scorers, api usage

Revision ID: c5d6e7f8a9b0
Revises: b2c3d4e5f6a7, b3c4d5e6f7g8
Create Date: 2026-04-11 14:00:00.000000

This migration is also a merge commit — the previous two heads
(``b2c3d4e5f6a7`` auth/expenses and ``b3c4d5e6f7g8`` abandoned checkout)
are merged here so that going forward we have a single linear history.

Every ``op.create_table`` / ``op.add_column`` is guarded with an
inspector check so the migration is idempotent. Production may have
been created via ``Base.metadata.create_all`` which would have already
added some of these tables during lifespan on a previous deploy — the
guard means the upgrade is a no-op in that case instead of crashing.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


revision: str = "c5d6e7f8a9b0"
down_revision: Union[str, Sequence[str], None] = ("b2c3d4e5f6a7", "b3c4d5e6f7g8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(inspector, name: str) -> bool:
    return name in inspector.get_table_names()


def _has_column(inspector, table: str, column: str) -> bool:
    if not _has_table(inspector, table):
        return False
    return column in {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    # ── team_elo_history ────────────────────────────────────────────────
    if not _has_table(inspector, "team_elo_history"):
        op.create_table(
            "team_elo_history",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("team_id", postgresql.UUID(as_uuid=True),
                      sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
            sa.Column("rating", sa.Float(), nullable=False),
            sa.Column("k_factor", sa.Float(), nullable=False, server_default="20.0"),
            sa.Column("effective_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("source_match_id", postgresql.UUID(as_uuid=True),
                      sa.ForeignKey("matches.id", ondelete="SET NULL"), nullable=True),
            sa.Column("source_kind", sa.String(32), nullable=False, server_default="match_update"),
        )
        op.create_index(
            "ix_elo_history_team_effective",
            "team_elo_history",
            ["team_id", "effective_at"],
        )
        op.create_index(
            "ix_elo_history_source_match",
            "team_elo_history",
            ["source_match_id"],
        )

    # ── match_statistics ────────────────────────────────────────────────
    if not _has_table(inspector, "match_statistics"):
        op.create_table(
            "match_statistics",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("match_id", postgresql.UUID(as_uuid=True),
                      sa.ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False),
            sa.Column("home_shots_total", sa.Integer(), nullable=True),
            sa.Column("home_shots_on_target", sa.Integer(), nullable=True),
            sa.Column("home_possession_pct", sa.Float(), nullable=True),
            sa.Column("home_corners", sa.Integer(), nullable=True),
            sa.Column("home_yellow_cards", sa.Integer(), nullable=True),
            sa.Column("home_red_cards", sa.Integer(), nullable=True),
            sa.Column("home_fouls", sa.Integer(), nullable=True),
            sa.Column("home_offsides", sa.Integer(), nullable=True),
            sa.Column("home_passes_accurate", sa.Integer(), nullable=True),
            sa.Column("away_shots_total", sa.Integer(), nullable=True),
            sa.Column("away_shots_on_target", sa.Integer(), nullable=True),
            sa.Column("away_possession_pct", sa.Float(), nullable=True),
            sa.Column("away_corners", sa.Integer(), nullable=True),
            sa.Column("away_yellow_cards", sa.Integer(), nullable=True),
            sa.Column("away_red_cards", sa.Integer(), nullable=True),
            sa.Column("away_fouls", sa.Integer(), nullable=True),
            sa.Column("away_offsides", sa.Integer(), nullable=True),
            sa.Column("away_passes_accurate", sa.Integer(), nullable=True),
            sa.Column("source_provider", sa.String(64), nullable=False, server_default="api_football"),
        )
        op.create_index(
            "ix_match_statistics_match_id",
            "match_statistics",
            ["match_id"],
        )

    # ── odds_history: add Over/Under + BTTS columns ─────────────────────
    for col_name, col_type in [
        ("over_odds", sa.Float()),
        ("under_odds", sa.Float()),
        ("total_line", sa.Float()),
        ("btts_yes_odds", sa.Float()),
        ("btts_no_odds", sa.Float()),
    ]:
        if not _has_column(inspector, "odds_history", col_name):
            op.add_column(
                "odds_history",
                sa.Column(col_name, col_type, nullable=True),
            )

    # Also make home_odds/draw_odds/away_odds nullable for non-1X2 rows.
    # These were NOT NULL in the initial schema. Only alter if currently
    # non-null.
    if _has_table(inspector, "odds_history"):
        cols = {c["name"]: c for c in inspector.get_columns("odds_history")}
        for col_name in ("home_odds", "away_odds"):
            col = cols.get(col_name)
            if col is not None and not col.get("nullable", True):
                op.alter_column("odds_history", col_name, nullable=True)

    # Composite index for (match, market) lookups.
    if _has_table(inspector, "odds_history"):
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("odds_history")}
        if "ix_odds_match_market" not in existing_indexes:
            op.create_index(
                "ix_odds_match_market",
                "odds_history",
                ["match_id", "market"],
            )

    # ── top_scorers ─────────────────────────────────────────────────────
    if not _has_table(inspector, "top_scorers"):
        op.create_table(
            "top_scorers",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("league_id", postgresql.UUID(as_uuid=True),
                      sa.ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False),
            sa.Column("season_name", sa.String(32), nullable=False),
            sa.Column("rank", sa.Integer(), nullable=False),
            sa.Column("player_external_id", sa.String(64), nullable=True),
            sa.Column("player_name", sa.String(200), nullable=False),
            sa.Column("team_name", sa.String(200), nullable=True),
            sa.Column("team_external_id", sa.String(64), nullable=True),
            sa.Column("nationality", sa.String(100), nullable=True),
            sa.Column("photo_url", sa.String(500), nullable=True),
            sa.Column("goals", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("assists", sa.Integer(), nullable=True),
            sa.Column("appearances", sa.Integer(), nullable=True),
            sa.Column("minutes_played", sa.Integer(), nullable=True),
            sa.Column("source_provider", sa.String(64), nullable=False, server_default="api_football"),
            sa.UniqueConstraint(
                "league_id",
                "season_name",
                "player_external_id",
                name="uq_top_scorer_league_season_player",
            ),
        )
        op.create_index(
            "ix_top_scorer_league_season",
            "top_scorers",
            ["league_id", "season_name"],
        )

    # ── api_usage_log ───────────────────────────────────────────────────
    if not _has_table(inspector, "api_usage_log"):
        op.create_table(
            "api_usage_log",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("provider", sa.String(64), nullable=False),
            sa.Column("endpoint", sa.String(200), nullable=False),
            sa.Column("status_code", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("call_at", sa.DateTime(timezone=True),
                      server_default=sa.func.now(), nullable=False),
        )
        op.create_index(
            "ix_api_usage_provider_call_at",
            "api_usage_log",
            ["provider", "call_at"],
        )


def downgrade() -> None:
    # Downgrade is not supported — the v5 tables store foundational
    # data that we do not want to drop in a rollback scenario. If you
    # really need to unwind, do it manually with SQL.
    pass
