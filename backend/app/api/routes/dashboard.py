"""Dashboard routes: aggregate prediction metrics."""

from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tier
from app.core.prediction_filters import v81_predictions_filter
from app.core.tier_system import (
    PickTier,
    TIER_METADATA,
    TIER_SYSTEM_ENABLED,
    access_filter,
    pick_tier_expression,
)
from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction, PredictionEvaluation

router = APIRouter()


# ---------------------------------------------------------------------------
# Response model
# ---------------------------------------------------------------------------


class DashboardTierBreakdown(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total: int
    correct: int
    accuracy: float


class DashboardMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_forecasts: int
    evaluated_count: int
    pending_count: int
    correct_predictions: int
    accuracy: float
    avg_brier_score: float
    avg_confidence: float
    has_data: bool
    generated_at: datetime
    # v8.1 tier breakdown — only populated when TIER_SYSTEM_ENABLED
    per_tier: Optional[Dict[str, DashboardTierBreakdown]] = None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/metrics",
    response_model=DashboardMetrics,
    summary="Aggregated prediction metrics for the dashboard",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> DashboardMetrics:
    """
    Return high-level prediction accuracy and volume metrics.
    Cached in Redis for 5 minutes (per-tier).

    - total_forecasts: total rows in the predictions table (within tier scope)
    - evaluated_count: total rows in prediction_evaluations (within tier scope)
    - pending_count: total_forecasts - evaluated_count
    - correct_predictions: evaluations where is_correct = True
    - accuracy: correct / evaluated (0.0 when no evaluations)
    - avg_brier_score: mean brier_score across evaluations (0.0 when none)
    - avg_confidence: mean confidence across predictions (0.0 when none)
    - has_data: whether any predictions exist
    - per_tier: breakdown by pick_tier (only when TIER_SYSTEM_ENABLED)
    """
    from app.core.cache import cache_get, cache_set

    # Cache key is tier-aware so each tier sees its own numbers
    cache_key = f"dashboard:metrics:{user_tier.name.lower()}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return DashboardMetrics(**cached)

    # v8.1 filter: restrict all aggregations to post-deploy predictions.
    # Pre-v8.1 preds used a broken feature pipeline — see
    # docs/production_validation_v2.md
    _v81 = v81_predictions_filter()

    # Tier access filter — requires Match JOIN when enabled
    _tier = access_filter(user_tier) if TIER_SYSTEM_ENABLED else None

    def _add_tier_filter(q):
        """Apply v8.1 + tier filters; add Match JOIN when tier system is active."""
        q = q.where(_v81)
        if _tier is not None:
            q = q.join(Match, Match.id == Prediction.match_id).where(_tier)
        return q

    # Total predictions
    total_q = select(func.count(Prediction.id))
    total_q = _add_tier_filter(total_q)
    total_result = await db.execute(total_q)
    total_forecasts: int = total_result.scalar_one()

    # Evaluation counts — JOIN to Prediction so v8.1 filter can apply
    eval_count_q = (
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    )
    eval_count_q = _add_tier_filter(eval_count_q)
    eval_count_result = await db.execute(eval_count_q)
    evaluated_count: int = eval_count_result.scalar_one()

    correct_q = (
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .where(PredictionEvaluation.is_correct.is_(True))
    )
    correct_q = _add_tier_filter(correct_q)
    correct_result = await db.execute(correct_q)
    correct_predictions: int = correct_result.scalar_one()

    # Averages
    avg_brier_q = (
        select(func.avg(PredictionEvaluation.brier_score))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    )
    avg_brier_q = _add_tier_filter(avg_brier_q)
    avg_brier_result = await db.execute(avg_brier_q)
    avg_brier_raw = avg_brier_result.scalar_one()

    avg_conf_q = select(func.avg(Prediction.confidence))
    avg_conf_q = _add_tier_filter(avg_conf_q)
    avg_confidence_result = await db.execute(avg_conf_q)
    avg_confidence_raw = avg_confidence_result.scalar_one()

    pending_count = total_forecasts - evaluated_count
    accuracy = (
        round(correct_predictions / evaluated_count, 4)
        if evaluated_count > 0
        else 0.0
    )
    avg_brier_score = round(float(avg_brier_raw), 4) if avg_brier_raw is not None else 0.0
    avg_confidence = round(float(avg_confidence_raw), 2) if avg_confidence_raw is not None else 0.0

    # v8.1 per-tier breakdown
    per_tier: Optional[Dict[str, DashboardTierBreakdown]] = None
    if TIER_SYSTEM_ENABLED:
        from sqlalchemy import Integer
        # Evaluate pick_tier_expression() ONCE and reuse the same element in
        # SELECT and GROUP BY. Two separate calls produce two CASE expressions
        # with different bind parameter IDs, which PostgreSQL treats as
        # non-equivalent and rejects with "must appear in GROUP BY clause".
        tier_expr = pick_tier_expression()
        per_tier_q = (
            select(
                tier_expr,
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .where(_v81)
            .where(_tier)
            .group_by(tier_expr)
        )
        rows = (await db.execute(per_tier_q)).all()
        per_tier = {}
        for tier_int, t_total, t_correct in rows:
            if not t_total:
                continue
            t_int = int(tier_int)
            c = int(t_correct or 0)
            total_int = int(t_total)
            slug = TIER_METADATA[PickTier(t_int)]["slug"]
            per_tier[slug] = DashboardTierBreakdown(
                total=total_int,
                correct=c,
                accuracy=round(c / total_int, 4) if total_int else 0.0,
            )

    result = DashboardMetrics(
        total_forecasts=total_forecasts,
        evaluated_count=evaluated_count,
        pending_count=pending_count,
        correct_predictions=correct_predictions,
        accuracy=accuracy,
        avg_brier_score=avg_brier_score,
        avg_confidence=avg_confidence,
        has_data=total_forecasts > 0,
        generated_at=datetime.now(timezone.utc),
        per_tier=per_tier,
    )

    # Cache for 5 minutes (tier-aware key)
    await cache_set(cache_key, result.model_dump(mode="json"), ttl=300)
    return result
