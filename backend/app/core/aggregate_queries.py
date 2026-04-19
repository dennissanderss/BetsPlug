"""Shared aggregate-query builders.

Deduplicates the per-tier accuracy GROUP BY that was copy-pasted across
``dashboard.py``, ``trackrecord.py`` and ``pricing.py``. A regression
(`_v81` undefined in dashboard.py after a rename that only updated two
of three call sites) made clear that the drift-risk is real.

Design rules:
    - Every aggregate over user-facing accuracy uses ``trackrecord_filter()``
      — v8.1 deploy-cutoff + ``predicted_at <= scheduled_at``.
    - Per-tier aggregates never apply ``access_filter`` (transparency: Free
      users see Platinum's accuracy on the pricing card).
    - ``pick_tier_expression()`` MUST be evaluated once and reused in SELECT
      + GROUP BY — two calls produce non-equivalent CASE nodes that PG rejects.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, func, select
from sqlalchemy.sql import Select

from app.core.prediction_filters import trackrecord_filter
from app.core.tier_system import pick_tier_expression
from app.models.match import Match
from app.models.prediction import Prediction, PredictionEvaluation


def per_tier_evaluated_stmt(source: Optional[str] = None) -> Select:
    """Return the canonical per-tier evaluated-accuracy GROUP BY statement.

    Columns in order: ``tier_int``, ``total``, ``correct``.

    The caller must iterate, skip NULL-tier rows (rows below the Free
    baseline or outside every LEAGUES_* whitelist), and cast to Python
    ints — COUNT/SUM return bigint/Decimal which Pydantic v2 rejects on
    int/float response fields.

    ``source`` optionally restricts to ``Prediction.prediction_source``
    (e.g. ``'live'`` for the live-meting surface).
    """
    tier_expr = pick_tier_expression()
    stmt = (
        select(
            tier_expr,
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(
                func.cast(PredictionEvaluation.is_correct, Integer)
            ).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(trackrecord_filter())
        .group_by(tier_expr)
    )
    if source is not None:
        stmt = stmt.where(Prediction.prediction_source == source)
    return stmt


__all__ = ["per_tier_evaluated_stmt"]
