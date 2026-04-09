"""Predictions routes."""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.schemas.prediction import ForecastOutput, PredictionResponse

router = APIRouter()


@router.get(
    "/",
    response_model=List[PredictionResponse],
    summary="List predictions with optional filters",
)
async def list_predictions(
    sport: Optional[str] = Query(default=None, description="Filter by sport slug"),
    league_id: Optional[uuid.UUID] = Query(default=None, description="Filter by league UUID"),
    date_from: Optional[datetime] = Query(
        default=None, description="Include predictions for matches on or after this date (UTC)"
    ),
    date_to: Optional[datetime] = Query(
        default=None, description="Include predictions for matches on or before this date (UTC)"
    ),
    model_version_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by model version UUID"
    ),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[PredictionResponse]:
    """
    Return predictions ordered by predicted_at descending.
    Filters can be combined freely.

    # TODO: delegate complex filter logic to a service/repository layer
    """
    from app.models.league import League
    from app.models.sport import Sport

    from sqlalchemy.orm import noload

    # Only load explanation and evaluation (needed for PredictionResponse).
    # Skip match (not in response schema) and model_version (not serialized)
    # to avoid unnecessary JOIN + deserialization of teams/league/result.
    q = select(Prediction).options(
        noload(Prediction.match),
        noload(Prediction.model_version),
    )

    if sport is not None or league_id is not None or date_from is not None or date_to is not None:
        q = q.join(Match, Match.id == Prediction.match_id)
        if sport is not None:
            q = q.join(League, League.id == Match.league_id).join(Sport, Sport.id == League.sport_id)
            q = q.where(Sport.slug == sport)
        if league_id is not None:
            q = q.where(Match.league_id == league_id)
        if date_from is not None:
            q = q.where(Match.scheduled_at >= date_from)
        if date_to is not None:
            q = q.where(Match.scheduled_at <= date_to)

    if model_version_id is not None:
        q = q.where(Prediction.model_version_id == model_version_id)

    q = q.order_by(Prediction.predicted_at.desc()).offset(offset).limit(limit)

    result = await db.execute(q)
    predictions = result.scalars().all()

    results = []
    for p in predictions:
        # Determine pick
        probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
        pick = max(probs, key=lambda k: probs[k])

        # Generate reasoning
        reasoning = None
        if p.explanation:
            reasoning = p.explanation.summary

        try:
            resp = PredictionResponse.model_validate(p)
            resp.pick = pick
            resp.reasoning = reasoning
        except Exception:
            resp = PredictionResponse(
                id=p.id,
                match_id=p.match_id,
                model_version_id=p.model_version_id,
                predicted_at=p.predicted_at,
                prediction_type=p.prediction_type,
                home_win_prob=p.home_win_prob,
                draw_prob=p.draw_prob,
                away_win_prob=p.away_win_prob,
                confidence=p.confidence,
                is_simulation=p.is_simulation,
                pick=pick,
                reasoning=reasoning,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        results.append(resp)
    return results


@router.get(
    "/{prediction_id}",
    response_model=PredictionResponse,
    summary="Get a single prediction with explanation",
)
async def get_prediction(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PredictionResponse:
    """Return a prediction record including its explanation and post-match evaluation."""
    result = await db.execute(
        select(Prediction).where(Prediction.id == prediction_id)
    )
    pred = result.scalar_one_or_none()
    if pred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction {prediction_id} not found.",
        )
    return PredictionResponse.model_validate(pred)


@router.post(
    "/run",
    response_model=ForecastOutput,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger forecast generation for a match",
)
async def run_forecast(
    match_id: uuid.UUID = Body(..., embed=True, description="UUID of the match to forecast"),
    db: AsyncSession = Depends(get_db),
) -> ForecastOutput:
    """
    Enqueue and immediately execute a forecast for the given match.

    Returns the generated ForecastOutput.  For finished matches the forecast
    is still generated (useful for evaluation / backtesting).

    # TODO: delegate to forecasting service (feature engineering, model inference,
    #        explanation generation, Prediction record persistence).
    """
    match_result = await db.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalar_one_or_none()
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found.",
        )

    from app.forecasting.forecast_service import ForecastService

    try:
        service = ForecastService()
        prediction = await service.generate_forecast(match_id, db)
        await db.commit()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast generation failed: {exc}",
        )

    return ForecastOutput(
        match_id=prediction.match_id,
        model_version_id=prediction.model_version_id,
        predicted_at=prediction.predicted_at,
        home_win_prob=prediction.home_win_prob,
        draw_prob=prediction.draw_prob,
        away_win_prob=prediction.away_win_prob,
        predicted_home_score=prediction.predicted_home_score,
        predicted_away_score=prediction.predicted_away_score,
        confidence=prediction.confidence,
        confidence_interval_low=prediction.confidence_interval_low,
        confidence_interval_high=prediction.confidence_interval_high,
        explanation=prediction.explanation.summary if prediction.explanation else None,
        features_snapshot=prediction.features_snapshot,
        raw_output=prediction.raw_output,
    )
