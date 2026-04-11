"""Predictions routes."""

import math
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.schemas.common import PaginatedResponse
from app.schemas.prediction import (
    ForecastOutput,
    PredictionMatchResult,
    PredictionMatchSummary,
    PredictionModelSummary,
    PredictionResponse,
)

router = APIRouter()


@router.get(
    "/",
    response_model=PaginatedResponse[PredictionResponse],
    summary="List predictions with optional filters (paginated)",
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
    # v6.1: both limit/offset (legacy) and page/page_size (new) are accepted.
    # If page is supplied, it takes precedence over offset.
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    page: Optional[int] = Query(default=None, ge=1),
    page_size: Optional[int] = Query(default=None, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PredictionResponse]:
    """
    Return predictions ordered by predicted_at descending, wrapped in a
    PaginatedResponse envelope. Includes a lightweight `match` summary so
    feed / list UIs can render team names without a follow-up fetch.

    # TODO: delegate complex filter logic to a service/repository layer
    """
    from app.models.league import League
    from app.models.sport import Sport

    # Resolve pagination. page/page_size override limit/offset when supplied.
    size = page_size or limit
    if page is not None:
        current_page = page
        current_offset = (page - 1) * size
    else:
        current_page = (offset // size) + 1 if size > 0 else 1
        current_offset = offset

    # Load the match + model_version relationships eagerly so the inline
    # match and model summaries can be built without triggering extra
    # queries. home_team, away_team, league and result are all
    # `lazy="selectin"` on the Match model, so they cascade automatically
    # once Prediction.match is loaded.
    # v6.2: model_version now IS part of the response (transparency),
    # so it's loaded instead of nullified.
    q = select(Prediction).options(
        selectinload(Prediction.match),
        selectinload(Prediction.model_version),
    )
    count_q = select(func.count(Prediction.id))

    if sport is not None or league_id is not None or date_from is not None or date_to is not None:
        q = q.join(Match, Match.id == Prediction.match_id)
        count_q = count_q.join(Match, Match.id == Prediction.match_id)
        if sport is not None:
            q = q.join(League, League.id == Match.league_id).join(Sport, Sport.id == League.sport_id)
            count_q = count_q.join(League, League.id == Match.league_id).join(
                Sport, Sport.id == League.sport_id
            )
            q = q.where(Sport.slug == sport)
            count_q = count_q.where(Sport.slug == sport)
        if league_id is not None:
            q = q.where(Match.league_id == league_id)
            count_q = count_q.where(Match.league_id == league_id)
        if date_from is not None:
            q = q.where(Match.scheduled_at >= date_from)
            count_q = count_q.where(Match.scheduled_at >= date_from)
        if date_to is not None:
            q = q.where(Match.scheduled_at <= date_to)
            count_q = count_q.where(Match.scheduled_at <= date_to)

    if model_version_id is not None:
        q = q.where(Prediction.model_version_id == model_version_id)
        count_q = count_q.where(Prediction.model_version_id == model_version_id)

    q = q.order_by(Prediction.predicted_at.desc()).offset(current_offset).limit(size)

    total = int((await db.execute(count_q)).scalar() or 0)
    result = await db.execute(q)
    predictions = result.scalars().unique().all()

    items: List[PredictionResponse] = []
    for p in predictions:
        # Determine pick
        probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
        pick = max(probs, key=lambda k: probs[k])

        # Natural language reasoning (when an explanation row exists)
        reasoning = p.explanation.summary if p.explanation else None

        # Inline match summary — tolerate missing relationships defensively.
        match_summary: Optional[PredictionMatchSummary] = None
        if p.match is not None:
            m = p.match
            match_result = None
            if m.result is not None:
                match_result = PredictionMatchResult(
                    home_score=m.result.home_score,
                    away_score=m.result.away_score,
                    winner=m.result.winner,
                )
            match_summary = PredictionMatchSummary(
                id=m.id,
                home_team_name=(m.home_team.name if m.home_team else "Unknown"),
                away_team_name=(m.away_team.name if m.away_team else "Unknown"),
                scheduled_at=m.scheduled_at,
                status=(m.status.value if hasattr(m.status, "value") else str(m.status)),
                league_name=(m.league.name if m.league else None),
                result=match_result,
            )

        # v6.2: Inline model summary so the frontend can show model
        # name/version on each prediction without a separate /models fetch.
        model_summary: Optional[PredictionModelSummary] = None
        if p.model_version is not None:
            mv = p.model_version
            model_summary = PredictionModelSummary(
                id=mv.id,
                name=mv.name,
                version=mv.version,
                model_type=mv.model_type,
            )

        # Construct the response explicitly. We avoid
        # `PredictionResponse.model_validate(p)` because pydantic would try
        # to coerce the ORM `match` relationship (which has the Team objects
        # on it, not `home_team_name`) into PredictionMatchSummary and fail.
        resp = PredictionResponse(
            id=p.id,
            match_id=p.match_id,
            model_version_id=p.model_version_id,
            predicted_at=p.predicted_at,
            prediction_type=p.prediction_type,
            home_win_prob=p.home_win_prob,
            draw_prob=p.draw_prob,
            away_win_prob=p.away_win_prob,
            predicted_home_score=p.predicted_home_score,
            predicted_away_score=p.predicted_away_score,
            confidence=p.confidence,
            confidence_interval_low=p.confidence_interval_low,
            confidence_interval_high=p.confidence_interval_high,
            is_simulation=p.is_simulation,
            pick=pick,
            reasoning=reasoning,
            explanation=(
                {
                    "id": p.explanation.id,
                    "summary": p.explanation.summary,
                    "top_factors_for": p.explanation.top_factors_for,
                    "top_factors_against": p.explanation.top_factors_against,
                    "similar_historical": p.explanation.similar_historical,
                    "feature_importances": p.explanation.feature_importances,
                }
                if p.explanation
                else None
            ),
            evaluation=(
                {
                    "id": p.evaluation.id,
                    "actual_outcome": p.evaluation.actual_outcome,
                    "actual_home_score": p.evaluation.actual_home_score,
                    "actual_away_score": p.evaluation.actual_away_score,
                    "is_correct": p.evaluation.is_correct,
                    "brier_score": p.evaluation.brier_score,
                    "log_loss": p.evaluation.log_loss,
                    "evaluated_at": p.evaluation.evaluated_at,
                }
                if p.evaluation
                else None
            ),
            match=match_summary,
            model=model_summary,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        items.append(resp)

    total_pages = math.ceil(total / size) if size > 0 else 1
    return PaginatedResponse[PredictionResponse](
        items=items,
        total=total,
        page=current_page,
        page_size=size,
        pages=max(total_pages, 1),
    )


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
        select(Prediction)
        .options(
            selectinload(Prediction.match),
            selectinload(Prediction.model_version),
        )
        .where(Prediction.id == prediction_id)
    )
    p = result.scalar_one_or_none()
    if p is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction {prediction_id} not found.",
        )

    probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
    pick = max(probs, key=lambda k: probs[k])
    reasoning = p.explanation.summary if p.explanation else None

    match_summary: Optional[PredictionMatchSummary] = None
    if p.match is not None:
        m = p.match
        match_result = None
        if m.result is not None:
            match_result = PredictionMatchResult(
                home_score=m.result.home_score,
                away_score=m.result.away_score,
                winner=m.result.winner,
            )
        match_summary = PredictionMatchSummary(
            id=m.id,
            home_team_name=(m.home_team.name if m.home_team else "Unknown"),
            away_team_name=(m.away_team.name if m.away_team else "Unknown"),
            scheduled_at=m.scheduled_at,
            status=(m.status.value if hasattr(m.status, "value") else str(m.status)),
            league_name=(m.league.name if m.league else None),
            result=match_result,
        )

    model_summary: Optional[PredictionModelSummary] = None
    if p.model_version is not None:
        mv = p.model_version
        model_summary = PredictionModelSummary(
            id=mv.id,
            name=mv.name,
            version=mv.version,
            model_type=mv.model_type,
        )

    return PredictionResponse(
        id=p.id,
        match_id=p.match_id,
        model_version_id=p.model_version_id,
        predicted_at=p.predicted_at,
        prediction_type=p.prediction_type,
        home_win_prob=p.home_win_prob,
        draw_prob=p.draw_prob,
        away_win_prob=p.away_win_prob,
        predicted_home_score=p.predicted_home_score,
        predicted_away_score=p.predicted_away_score,
        confidence=p.confidence,
        confidence_interval_low=p.confidence_interval_low,
        confidence_interval_high=p.confidence_interval_high,
        is_simulation=p.is_simulation,
        pick=pick,
        reasoning=reasoning,
        explanation=(
            {
                "id": p.explanation.id,
                "summary": p.explanation.summary,
                "top_factors_for": p.explanation.top_factors_for,
                "top_factors_against": p.explanation.top_factors_against,
                "similar_historical": p.explanation.similar_historical,
                "feature_importances": p.explanation.feature_importances,
            }
            if p.explanation
            else None
        ),
        evaluation=(
            {
                "id": p.evaluation.id,
                "actual_outcome": p.evaluation.actual_outcome,
                "actual_home_score": p.evaluation.actual_home_score,
                "actual_away_score": p.evaluation.actual_away_score,
                "is_correct": p.evaluation.is_correct,
                "brier_score": p.evaluation.brier_score,
                "log_loss": p.evaluation.log_loss,
                "evaluated_at": p.evaluation.evaluated_at,
            }
            if p.evaluation
            else None
        ),
        match=match_summary,
        model=model_summary,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


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
