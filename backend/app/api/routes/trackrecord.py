"""Track-record routes: accuracy, calibration and segment performance."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.league import League
from app.models.match import Match
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.sport import Sport
from app.schemas.trackrecord import (
    CalibrationBucket,
    CalibrationReport,
    SegmentPerformance,
    TrackrecordSummary,
)

router = APIRouter()

_NUM_CALIBRATION_BUCKETS = 10


@router.get(
    "/summary",
    response_model=TrackrecordSummary,
    summary="Overall track-record metrics",
)
async def get_trackrecord_summary(
    model_version_id: Optional[uuid.UUID] = Query(
        default=None, description="Restrict to a specific model version"
    ),
    db: AsyncSession = Depends(get_db),
) -> TrackrecordSummary:
    """
    Compute aggregate performance metrics over all evaluated predictions.

    Metrics include accuracy, mean Brier score, mean log-loss, and average confidence.
    """
    q = (
        select(
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(
                func.cast(PredictionEvaluation.is_correct, Integer)
            ).label("correct"),
            func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
            func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
            func.avg(Prediction.confidence).label("avg_confidence"),
            func.min(Prediction.predicted_at).label("period_start"),
            func.max(Prediction.predicted_at).label("period_end"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    )
    if model_version_id is not None:
        q = q.where(Prediction.model_version_id == model_version_id)

    row = (await db.execute(q)).one()

    total = row.total or 0
    correct = int(row.correct or 0)
    accuracy = correct / total if total > 0 else 0.0
    avg_brier = float(row.avg_brier or 0.0)
    avg_log_loss = float(row.avg_log_loss) if row.avg_log_loss is not None else None
    avg_confidence = float(row.avg_confidence or 0.0)

    return TrackrecordSummary(
        model_version_id=model_version_id,
        total_predictions=total,
        correct_predictions=correct,
        accuracy=accuracy,
        brier_score=avg_brier,
        log_loss=avg_log_loss,
        avg_confidence=avg_confidence,
        period_start=row.period_start,
        period_end=row.period_end,
    )


@router.get(
    "/segments",
    response_model=List[SegmentPerformance],
    summary="Performance breakdown by sport, league, period or confidence bucket",
)
async def get_trackrecord_segments(
    segment_type: str = Query(
        default="league",
        description="Dimension to slice on: 'sport', 'league', or 'month'",
    ),
    db: AsyncSession = Depends(get_db),
) -> List[SegmentPerformance]:
    """
    Return per-segment accuracy and Brier scores.

    Supported segment_type values: ``sport``, ``league``, ``month``.

    # TODO: delegate heavy aggregation to analytics service layer
    """
    if segment_type == "sport":
        q = (
            select(
                Sport.name.label("segment_value"),
                func.count(PredictionEvaluation.id).label("total"),
                func.avg(
                    func.cast(PredictionEvaluation.is_correct, Integer)
                ).label("accuracy"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .join(League, League.id == Match.league_id)
            .join(Sport, Sport.id == League.sport_id)
            .group_by(Sport.name)
            .order_by(Sport.name)
        )
    elif segment_type == "month":
        q = (
            select(
                func.to_char(Prediction.predicted_at, "YYYY-MM").label("segment_value"),
                func.count(PredictionEvaluation.id).label("total"),
                func.avg(
                    func.cast(PredictionEvaluation.is_correct, Integer)
                ).label("accuracy"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .group_by(func.to_char(Prediction.predicted_at, "YYYY-MM"))
            .order_by(func.to_char(Prediction.predicted_at, "YYYY-MM"))
        )
    else:
        # Default: league
        q = (
            select(
                League.name.label("segment_value"),
                func.count(PredictionEvaluation.id).label("total"),
                func.avg(
                    func.cast(PredictionEvaluation.is_correct, Integer)
                ).label("accuracy"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .join(League, League.id == Match.league_id)
            .group_by(League.name)
            .order_by(League.name)
        )

    rows = (await db.execute(q)).all()

    return [
        SegmentPerformance(
            segment_type=segment_type,
            segment_value=row.segment_value or "Unknown",
            total_predictions=row.total or 0,
            accuracy=float(row.accuracy or 0.0),
            brier_score=float(row.avg_brier or 0.0),
            log_loss=float(row.avg_log_loss) if row.avg_log_loss is not None else None,
            avg_confidence=float(row.avg_confidence or 0.0),
        )
        for row in rows
    ]


@router.get(
    "/calibration",
    response_model=CalibrationReport,
    summary="Calibration buckets (reliability diagram data)",
)
async def get_calibration(
    model_version_id: uuid.UUID = Query(..., description="Model version to analyse"),
    num_buckets: int = Query(
        default=_NUM_CALIBRATION_BUCKETS, ge=2, le=20, description="Number of probability bins"
    ),
    db: AsyncSession = Depends(get_db),
) -> CalibrationReport:
    """
    Compute a reliability diagram for a model version.

    Predictions are binned by their home_win_prob into ``num_buckets`` equal-width
    buckets. For each bucket the observed win frequency is computed.

    # TODO: delegate binning + ECE computation to analytics service layer
    """
    # Load all evaluated predictions for this model version
    result = await db.execute(
        select(Prediction, PredictionEvaluation)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(Prediction.model_version_id == model_version_id)
    )
    rows = result.all()

    # Build buckets
    bucket_size = 1.0 / num_buckets
    buckets_data: list[dict] = [
        {
            "predicted_probs": [],
            "outcomes": [],
        }
        for _ in range(num_buckets)
    ]

    for pred, evaluation in rows:
        idx = min(int(pred.home_win_prob / bucket_size), num_buckets - 1)
        buckets_data[idx]["predicted_probs"].append(pred.home_win_prob)
        buckets_data[idx]["outcomes"].append(
            1 if evaluation.actual_outcome == "home" else 0
        )

    calibration_buckets: list[CalibrationBucket] = []
    ece_numerator = 0.0
    total_samples = sum(len(b["predicted_probs"]) for b in buckets_data)

    for i, bucket in enumerate(buckets_data):
        lower = i * bucket_size
        upper = (i + 1) * bucket_size
        count = len(bucket["predicted_probs"])
        if count == 0:
            pred_avg = (lower + upper) / 2
            obs_freq = 0.0
        else:
            pred_avg = sum(bucket["predicted_probs"]) / count
            obs_freq = sum(bucket["outcomes"]) / count

        gap = pred_avg - obs_freq
        ece_numerator += count * abs(gap)

        calibration_buckets.append(
            CalibrationBucket(
                bucket_index=i,
                lower_bound=round(lower, 4),
                upper_bound=round(upper, 4),
                predicted_avg=round(pred_avg, 4),
                observed_freq=round(obs_freq, 4),
                count=count,
                calibration_gap=round(gap, 4),
            )
        )

    overall_ece = ece_numerator / total_samples if total_samples > 0 else 0.0

    # Retrieve model version label
    from app.models.model_version import ModelVersion

    mv_result = await db.execute(
        select(ModelVersion).where(ModelVersion.id == model_version_id)
    )
    mv = mv_result.scalar_one_or_none()
    mv_label = f"{mv.name} v{mv.version}" if mv else None

    return CalibrationReport(
        model_version_id=model_version_id,
        model_version_label=mv_label,
        num_buckets=num_buckets,
        buckets=calibration_buckets,
        overall_ece=round(overall_ece, 6),
        generated_at=datetime.now(timezone.utc),
    )
