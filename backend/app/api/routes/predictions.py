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

    q = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .join(League, League.id == Match.league_id)
        .join(Sport, Sport.id == League.sport_id)
    )

    if sport is not None:
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
    return [PredictionResponse.model_validate(p) for p in predictions]


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

    # TODO: call forecasting_service.run(match, db) and persist the result
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Forecasting service is not yet wired in. "
            "Implement app.services.forecasting and call it here."
        ),
    )
