"""Tier system core — pick-tier classification, user access filtering, metadata.

The v8.1 engine classifies every prediction into one of four quality tiers
based on the league and the model's confidence:

    🟢 Platinum : top  5 leagues + confidence >= 0.75  ~82% historical accuracy
    🔵 Gold     : top 10 leagues + confidence >= 0.70  ~70%
    ⚪ Silver   : top 14 leagues + confidence >= 0.65  ~61%
    ⬜ Free     : anything else  + confidence >= 0.55  ~48%

Users see picks from their subscription tier AND all lower tiers, each
rendered with a visual label (emoji) so they understand the quality hint
at a glance.

This module provides:
    - ``PickTier``            : enum for the four tiers (Int-ordered)
    - ``CONF_THRESHOLD``      : confidence minimums per tier
    - ``TIER_METADATA``       : display info (slug, emoji label, accuracy claim)
    - ``TIER_SYSTEM_ENABLED`` : feature flag (env var, default off)
    - ``pick_tier_expression()`` : SQLAlchemy CASE returning pick_tier as int
    - ``access_filter(user_tier)``: SQLAlchemy WHERE expression for user access
    - ``tier_info(tier)``     : Python-side metadata dict for API responses

Design constraints:
    - PostgreSQL cannot reference a SELECT alias (like ``pick_tier``) in the
      same query's WHERE clause. So ``access_filter`` repeats the tier
      conditions explicitly using AND/OR combinators.
    - Every SQL query using ``access_filter()`` must JOIN ``matches`` so
      ``Match.league_id`` is available. Add the JOIN where missing.
    - ``access_filter`` always enforces the Free baseline (confidence >= 0.55)
      so noise below that never leaks to any user.

See docs/tier_system_plan.md for the full product rationale and numbers.
"""
from __future__ import annotations

from enum import IntEnum
from os import getenv
from typing import Any

from sqlalchemy import and_, case, or_
from sqlalchemy.sql import ColumnElement

from app.core.tier_leagues import (
    LEAGUES_FREE,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)
from app.models.match import Match
from app.models.prediction import Prediction


# ---------------------------------------------------------------------------
# Feature flag
# ---------------------------------------------------------------------------
# Read once at import time. Toggling on Railway requires pod restart.
# When ``False``, endpoints that check this flag should fall back to their
# pre-tier-system behavior (no tier filter, no ``pick_tier`` fields in
# responses). This allows instant rollback without git revert.
#
# Default flipped to ON in v8.3 — the user-facing flow now depends on
# tier scoping (Free = top-14 leagues at conf≥0.55, Silver = same leagues
# at ≥0.65, etc.). Set ``TIER_SYSTEM_ENABLED=false`` on Railway only to
# roll back to the legacy "everyone sees everything" mode.
TIER_SYSTEM_ENABLED: bool = getenv("TIER_SYSTEM_ENABLED", "true").lower() == "true"


# ---------------------------------------------------------------------------
# Enum — ordered ints so we can do ``user_tier >= pick_tier`` checks
# ---------------------------------------------------------------------------
class PickTier(IntEnum):
    """Quality tier assigned to a single prediction.

    Also used as the user's access level (subscription tier). A user with
    ``PickTier.GOLD`` access sees any pick with ``pick_tier <= GOLD``.
    """
    FREE = 0
    SILVER = 1
    GOLD = 2
    PLATINUM = 3


# ---------------------------------------------------------------------------
# Confidence thresholds per pick tier
# ---------------------------------------------------------------------------
CONF_THRESHOLD: dict[PickTier, float] = {
    PickTier.PLATINUM: 0.75,
    PickTier.GOLD: 0.70,
    PickTier.SILVER: 0.65,
    PickTier.FREE: 0.55,
}


# ---------------------------------------------------------------------------
# Display metadata per tier (used in API response shape)
# ---------------------------------------------------------------------------
TIER_METADATA: dict[PickTier, dict[str, Any]] = {
    PickTier.PLATINUM: {
        "slug": "platinum",
        "label": "IV Platinum",
        "accuracy_claim": "80%+",
    },
    PickTier.GOLD: {
        "slug": "gold",
        "label": "III Gold",
        "accuracy_claim": "70%+",
    },
    PickTier.SILVER: {
        "slug": "silver",
        "label": "II Silver",
        "accuracy_claim": "60%+",
    },
    PickTier.FREE: {
        "slug": "free",
        "label": "I Bronze",
        "accuracy_claim": "45%+",
    },
}


# ---------------------------------------------------------------------------
# SQL expression: classify each prediction row as a PickTier integer
# ---------------------------------------------------------------------------
def pick_tier_expression() -> ColumnElement:
    """Return a SQLAlchemy CASE returning pick_tier as integer (0..3) or NULL.

    Classification order matters — Platinum is checked first, then Gold,
    Silver, Free. A Champions-League pick with confidence 0.80 qualifies
    for all four tiers; we want the *highest* applicable tier assigned.

    Predictions with ``confidence < 0.55`` (the Free baseline threshold)
    are deliberately returned as **NULL** — they don't belong in any tier
    and should not be counted in tier aggregates. Queries grouping by
    ``pick_tier`` should filter ``WHERE pick_tier IS NOT NULL`` (or filter
    on ``confidence >= 0.55`` upstream, which has the same effect).

    Usage::

        q = select(Prediction, pick_tier_expression())

    The result column is labeled ``pick_tier``. It is NOT a stored column
    — the classification happens in the SELECT list every query.
    """
    return case(
        (
            and_(
                Match.league_id.in_(LEAGUES_PLATINUM),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.PLATINUM],
            ),
            PickTier.PLATINUM.value,
        ),
        (
            and_(
                Match.league_id.in_(LEAGUES_GOLD),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.GOLD],
            ),
            PickTier.GOLD.value,
        ),
        (
            and_(
                Match.league_id.in_(LEAGUES_SILVER),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.SILVER],
            ),
            PickTier.SILVER.value,
        ),
        (
            # Explicit Free branch: picks in LEAGUES_FREE with conf >= 0.55.
            # Below that (or outside the whitelist) we fall through to
            # else_=NULL so conf<0.55 rows and off-scope leagues are
            # excluded from every tier query automatically.
            and_(
                Match.league_id.in_(LEAGUES_FREE),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.FREE],
            ),
            PickTier.FREE.value,
        ),
        else_=None,
    ).label("pick_tier")


# ---------------------------------------------------------------------------
# SQL expression: user access filter (WHERE clause)
# ---------------------------------------------------------------------------
def access_filter(user_tier: PickTier) -> ColumnElement:
    """Return a SQLAlchemy WHERE expression restricting rows to picks this user can see.

    Access semantics (inclusive):
        PLATINUM user: sees all tiers
        GOLD user    : excludes Platinum-only picks
        SILVER user  : excludes Gold-only and Platinum-only picks
        FREE user    : excludes Silver/Gold/Platinum picks (sees only Free)

    Free baseline (confidence >= 0.55) is always enforced — even Platinum
    users never see noise below 0.55.

    PostgreSQL note: we cannot reference the pick_tier_expression() alias
    in the same query's WHERE (SQL evaluation order: FROM -> WHERE -> SELECT).
    So we repeat the tier-qualifying conditions explicitly as AND/OR clauses.

    Every query using this must JOIN matches (``Match.league_id`` required).

    Example::

        q = (
            select(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .where(access_filter(PickTier.SILVER))
        )
    """
    # v8.3 — enforce the Free-tier league whitelist as a baseline for every
    # user. This makes the tier set a strict funnel: every pick visible to
    # anyone must live in LEAGUES_FREE (which by default equals
    # LEAGUES_SILVER, the top-14 set). Narrow LEAGUES_FREE in
    # tier_leagues.py to tighten the funnel further.
    free_whitelist = Match.league_id.in_(LEAGUES_FREE)
    min_conf = Prediction.confidence >= CONF_THRESHOLD[PickTier.FREE]
    baseline = and_(free_whitelist, min_conf)

    if user_tier == PickTier.PLATINUM:
        # Platinum sees everything that passes the Free baseline.
        return baseline

    # Build "qualifies as a higher tier than user's" exclusions
    exclusions: list[ColumnElement] = []
    if user_tier < PickTier.PLATINUM:
        exclusions.append(and_(
            Match.league_id.in_(LEAGUES_PLATINUM),
            Prediction.confidence >= CONF_THRESHOLD[PickTier.PLATINUM],
        ))
    if user_tier < PickTier.GOLD:
        exclusions.append(and_(
            Match.league_id.in_(LEAGUES_GOLD),
            Prediction.confidence >= CONF_THRESHOLD[PickTier.GOLD],
        ))
    if user_tier < PickTier.SILVER:
        exclusions.append(and_(
            Match.league_id.in_(LEAGUES_SILVER),
            Prediction.confidence >= CONF_THRESHOLD[PickTier.SILVER],
        ))

    # NOT (qualifies as higher tier)
    return and_(baseline, ~or_(*exclusions))


# ---------------------------------------------------------------------------
# Python helper — response shape metadata
# ---------------------------------------------------------------------------
def tier_info(tier: PickTier | int) -> dict[str, Any]:
    """Return the 3-field metadata block used in API responses.

    Accepts either a ``PickTier`` enum or the raw int returned by
    ``pick_tier_expression()`` from the SQL side.

    Returns::

        {
            "pick_tier": "platinum",        # slug (stable API key)
            "pick_tier_label": "🟢 Platinum", # UI-ready string
            "pick_tier_accuracy": "80%+"    # historical accuracy claim
        }
    """
    if isinstance(tier, int) and not isinstance(tier, PickTier):
        tier = PickTier(tier)
    meta = TIER_METADATA[tier]
    return {
        "pick_tier": meta["slug"],
        "pick_tier_label": meta["label"],
        "pick_tier_accuracy": meta["accuracy_claim"],
    }


__all__ = [
    "TIER_SYSTEM_ENABLED",
    "PickTier",
    "CONF_THRESHOLD",
    "TIER_METADATA",
    "pick_tier_expression",
    "access_filter",
    "tier_info",
]
