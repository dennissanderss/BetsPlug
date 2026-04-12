"""Predictions routes.

Reverted to the proven working version (commit 6dad0ac) with one
addition: the list endpoint wraps results in {"items": [...], "total": N}
so the frontend's `response.items` access works.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.schemas.prediction import ForecastOutput, PredictionResponse

router = APIRouter()


@router.get(
    "/",
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
):
    """Return predictions ordered by predicted_at descending."""
    from app.models.league import League
    from app.models.sport import Sport

    # Use the EXACT same query strategy as the original working version:
    # selectinload ALL relationships so model_validate works cleanly.
    q = select(Prediction).options(
        selectinload(Prediction.match),
        selectinload(Prediction.explanation),
        selectinload(Prediction.evaluation),
        selectinload(Prediction.model_version),
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
    predictions = result.scalars().unique().all()

    # Count total for pagination info
    count_q = select(func.count(Prediction.id))
    total = int((await db.execute(count_q)).scalar() or 0)

    # Build response items — try model_validate first, fallback to manual
    items = []
    for p in predictions:
        try:
            resp = PredictionResponse.model_validate(p)
            # Add pick + reasoning that aren't on the ORM model
            probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
            resp.pick = max(probs, key=lambda k: probs[k])
            if p.explanation:
                resp.reasoning = p.explanation.summary
            items.append(resp.model_dump(mode="json"))
        except Exception:
            # Fallback: build minimal dict manually
            probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
            items.append({
                "id": str(p.id),
                "match_id": str(p.match_id),
                "model_version_id": str(p.model_version_id),
                "predicted_at": p.predicted_at.isoformat() if p.predicted_at else None,
                "prediction_type": p.prediction_type,
                "home_win_prob": p.home_win_prob,
                "draw_prob": p.draw_prob,
                "away_win_prob": p.away_win_prob,
                "confidence": p.confidence,
                "is_simulation": p.is_simulation,
                "pick": max(probs, key=lambda k: probs[k]),
                "reasoning": p.explanation.summary if p.explanation else None,
                "explanation": None,
                "evaluation": None,
                "match": None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            })

    # Return as JSONResponse to completely bypass FastAPI's response_model
    # serialization. The shape matches PaginatedResponse for the frontend.
    return JSONResponse(content={
        "items": items,
        "total": total,
        "page": 1,
        "page_size": limit,
        "pages": max(1, -(-total // limit)) if total else 1,
    })


@router.get(
    "/{prediction_id}",
    summary="Get a single prediction with explanation",
)
async def get_prediction(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
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

    try:
        resp = PredictionResponse.model_validate(pred)
        return JSONResponse(content=resp.model_dump(mode="json"))
    except Exception:
        # Minimal fallback
        return JSONResponse(content={
            "id": str(pred.id),
            "match_id": str(pred.match_id),
            "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else None,
            "home_win_prob": pred.home_win_prob,
            "draw_prob": pred.draw_prob,
            "away_win_prob": pred.away_win_prob,
            "confidence": pred.confidence,
        })


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
    """Enqueue and immediately execute a forecast for the given match."""
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
