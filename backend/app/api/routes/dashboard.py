"""Dashboard routes: aggregate prediction metrics."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.prediction_filters import v81_predictions_filter
from app.db.session import get_db
from app.models.prediction import Prediction, PredictionEvaluation

router = APIRouter()


# ---------------------------------------------------------------------------
# Response model
# ---------------------------------------------------------------------------


class DashboardMetrics(BaseModel):
    total_forecasts: int
    evaluated_count: int
    pending_count: int
    correct_predictions: int
    accuracy: float
    avg_brier_score: float
    avg_confidence: float
    has_data: bool
    generated_at: datetime


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
) -> DashboardMetrics:
    """
    Return high-level prediction accuracy and volume metrics.
    Cached in Redis for 5 minutes.

    - total_forecasts: total rows in the predictions table
    - evaluated_count: total rows in prediction_evaluations
    - pending_count: total_forecasts - evaluated_count
    - correct_predictions: evaluations where is_correct = True
    - accuracy: correct / evaluated (0.0 when no evaluations)
    - avg_brier_score: mean brier_score across evaluations (0.0 when none)
    - avg_confidence: mean confidence across predictions (0.0 when none)
    - has_data: whether any predictions exist
    """
    from app.core.cache import cache_get, cache_set

    cached = await cache_get("dashboard:metrics")
    if cached is not None:
        return DashboardMetrics(**cached)

    # v8.1 filter: restrict all aggregations to post-deploy predictions.
    # Pre-v8.1 preds used a broken feature pipeline — see
    # docs/production_validation_v2.md
    _v81 = v81_predictions_filter()

    # Total predictions
    total_result = await db.execute(
        select(func.count(Prediction.id)).where(_v81)
    )
    total_forecasts: int = total_result.scalar_one()

    # Evaluation counts — JOIN to Prediction so v8.1 filter can apply
    eval_count_result = await db.execute(
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .where(_v81)
    )
    evaluated_count: int = eval_count_result.scalar_one()

    correct_result = await db.execute(
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .where(PredictionEvaluation.is_correct.is_(True))
        .where(_v81)
    )
    correct_predictions: int = correct_result.scalar_one()

    # Averages
    avg_brier_result = await db.execute(
        select(func.avg(PredictionEvaluation.brier_score))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .where(_v81)
    )
    avg_brier_raw = avg_brier_result.scalar_one()

    avg_confidence_result = await db.execute(
        select(func.avg(Prediction.confidence)).where(_v81)
    )
    avg_confidence_raw = avg_confidence_result.scalar_one()

    pending_count = total_forecasts - evaluated_count
    accuracy = (
        round(correct_predictions / evaluated_count, 4)
        if evaluated_count > 0
        else 0.0
    )
    avg_brier_score = round(float(avg_brier_raw), 4) if avg_brier_raw is not None else 0.0
    avg_confidence = round(float(avg_confidence_raw), 2) if avg_confidence_raw is not None else 0.0

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
    )

    # Cache for 5 minutes
    await cache_set("dashboard:metrics", result.model_dump(), ttl=300)
    return result
