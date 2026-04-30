"""Leagues admitted into the tier system for live measurement only.

Some competitions are excluded from the canonical ``tier_leagues.py``
whitelist because we don't have enough graded backtest history to claim
a per-league accuracy number. We still want their predictions to show
up in the public predictions list and to count in the live-measurement
trackrecord — but only for picks the engine generated as ``live`` rows
on or after the v8.1 deploy cutoff. The ``backtest`` and
``batch_local_fill`` rows for these leagues stay invisible so historical
tier accuracy claims remain stable.

Membership is **name-based** (not UUID) so we don't need a DB roundtrip
to populate ``tier_leagues.py``. The helper below converts the names
into a SQLAlchemy scalar-subquery returning league IDs at query build
time, which lets ``pick_tier_expression()`` keep its current contract
(no extra JOIN required at call sites).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select as sa_select
from sqlalchemy.sql import ColumnElement

from app.models.league import League
from app.models.match import Match
from app.models.prediction import Prediction


# Names match ``leagues.name`` in the DB exactly. Keep this set tight —
# every league here counts toward the live-measurement accuracy display.
LIVE_ONLY_LEAGUE_NAMES: frozenset[str] = frozenset({
    "Conference League",
    "Europa League",
})

# Earliest predicted_at a live-only-extras row may carry. Aligns with the
# v8.1 deploy cutoff so we never count a pre-v8.1 prediction.
LIVE_EXTRAS_CUTOFF = datetime(2026, 4, 16, 0, 0, 0, tzinfo=timezone.utc)


def _live_extras_league_ids():
    """Scalar subquery returning the UUIDs of live-only-extras leagues.

    Embed inside another query — does NOT require the caller to JOIN
    League. PostgreSQL evaluates the subquery once per outer execution
    and caches the result for the WHERE clause.
    """
    return sa_select(League.id).where(
        League.name.in_(LIVE_ONLY_LEAGUE_NAMES)
    ).scalar_subquery()


def live_extras_predicate() -> ColumnElement:
    """SQLAlchemy WHERE clause that matches live-only-extras predictions.

    True iff:
      * Match league is in :data:`LIVE_ONLY_LEAGUE_NAMES`
      * ``Prediction.prediction_source == 'live'``
      * ``Prediction.predicted_at >= LIVE_EXTRAS_CUTOFF``

    Caller must have ``Match`` and ``Prediction`` in scope. League is
    resolved via the embedded scalar subquery above, so no extra JOIN
    is required.
    """
    from sqlalchemy import and_

    return and_(
        Match.league_id.in_(_live_extras_league_ids()),
        Prediction.prediction_source == "live",
        Prediction.predicted_at >= LIVE_EXTRAS_CUTOFF,
    )
