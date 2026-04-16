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

from app.api.deps import get_current_tier
from app.core.tier_system import (
    PickTier,
    TIER_SYSTEM_ENABLED,
    access_filter,
    pick_tier_expression,
    tier_info,
)
from app.db.session import get_db
from app.models.match import Match, MatchResult
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
    user_tier: PickTier = Depends(get_current_tier),
):
    """Return predictions ordered by predicted_at descending."""
    from app.models.league import League
    from app.models.sport import Sport

    # Use the EXACT same query strategy as the original working version:
    # selectinload ALL relationships so model_validate works cleanly.
    q = select(Prediction).options(
        selectinload(Prediction.match).selectinload(Match.home_team),
        selectinload(Prediction.match).selectinload(Match.away_team),
        selectinload(Prediction.match).selectinload(Match.league),
        selectinload(Prediction.match).selectinload(Match.result),
        selectinload(Prediction.explanation),
        selectinload(Prediction.evaluation),
        selectinload(Prediction.model_version),
    )
    count_q = select(func.count(Prediction.id))

    # v8.1 tier system — ensure Match JOIN so access_filter can reference
    # Match.league_id, and apply access filter + filter the count query too
    # so pagination reflects tier scope.
    needs_match_join = (
        sport is not None or league_id is not None
        or date_from is not None or date_to is not None
        or TIER_SYSTEM_ENABLED
    )
    if needs_match_join:
        q = q.join(Match, Match.id == Prediction.match_id)
        count_q = count_q.join(Match, Match.id == Prediction.match_id)
        if sport is not None:
            q = q.join(League, League.id == Match.league_id).join(Sport, Sport.id == League.sport_id)
            q = q.where(Sport.slug == sport)
            count_q = (
                count_q.join(League, League.id == Match.league_id)
                .join(Sport, Sport.id == League.sport_id)
                .where(Sport.slug == sport)
            )
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

    # Tier access filter — excludes picks above user's tier access
    if TIER_SYSTEM_ENABLED:
        tier_where = access_filter(user_tier)
        q = q.where(tier_where)
        count_q = count_q.where(tier_where)

    q = q.order_by(Prediction.predicted_at.desc()).offset(offset).limit(limit)

    result = await db.execute(q)
    predictions = result.scalars().unique().all()

    total = int((await db.execute(count_q)).scalar() or 0)

    # Build a lookup of pick_tier by prediction_id via a side query — avoids
    # tangling the CASE expression into the main selectinload query.
    pick_tier_by_id: dict[str, int] = {}
    if TIER_SYSTEM_ENABLED and predictions:
        pred_ids = [p.id for p in predictions]
        tier_q = (
            select(Prediction.id, pick_tier_expression())
            .join(Match, Match.id == Prediction.match_id)
            .where(Prediction.id.in_(pred_ids))
        )
        for pid, pt in (await db.execute(tier_q)).all():
            pick_tier_by_id[str(pid)] = int(pt)

    # Build response items — always use the safe manual builder so match
    # data is never silently dropped by a pydantic validation error.
    import logging
    _log = logging.getLogger("predictions.list")

    items = []
    for p in predictions:
        probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
        pick = max(probs, key=lambda k: probs[k])

        # ── Match data ──────────────────────────────────────────────
        match_data = None
        m = getattr(p, "match", None)
        if m is not None:
            try:
                match_data = {
                    "id": str(m.id),
                    "home_team_name": getattr(m.home_team, "name", None) or "Unknown" if m.home_team else "Unknown",
                    "away_team_name": getattr(m.away_team, "name", None) or "Unknown" if m.away_team else "Unknown",
                    "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
                    "status": m.status.value if hasattr(m.status, "value") else str(m.status),
                    "league_name": m.league.name if getattr(m, "league", None) else None,
                    "result": {
                        "home_score": m.result.home_score,
                        "away_score": m.result.away_score,
                        "winner": m.result.winner,
                    } if getattr(m, "result", None) else None,
                }
            except Exception as exc:
                _log.warning("Failed to build match_data for prediction %s: %s", p.id, exc)
        else:
            _log.warning("Prediction %s has match_id=%s but match is None (orphaned?)", p.id, p.match_id)

        # ── Evaluation data ─────────────────────────────────────────
        eval_data = None
        ev = getattr(p, "evaluation", None)
        if ev is not None:
            try:
                eval_data = {
                    "id": str(ev.id),
                    "actual_outcome": ev.actual_outcome,
                    "actual_home_score": ev.actual_home_score,
                    "actual_away_score": ev.actual_away_score,
                    "is_correct": ev.is_correct,
                    "brier_score": ev.brier_score,
                    "log_loss": ev.log_loss,
                    "evaluated_at": ev.evaluated_at.isoformat() if ev.evaluated_at else None,
                }
            except Exception as exc:
                _log.warning("Failed to build eval_data for prediction %s: %s", p.id, exc)

        # ── Reasoning ───────────────────────────────────────────────
        reasoning = None
        try:
            if p.explanation:
                reasoning = p.explanation.summary
        except Exception:
            pass

        item = {
            "id": str(p.id),
            "match_id": str(p.match_id),
            "model_version_id": str(p.model_version_id),
            "predicted_at": p.predicted_at.isoformat() if p.predicted_at else None,
            "prediction_type": getattr(p, "prediction_type", "match_result"),
            "home_win_prob": p.home_win_prob,
            "draw_prob": p.draw_prob,
            "away_win_prob": p.away_win_prob,
            "confidence": p.confidence,
            "is_simulation": getattr(p, "is_simulation", True),
            "pick": pick,
            "reasoning": reasoning,
            "explanation": None,
            "evaluation": eval_data,
            "match": match_data,
            "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
            "updated_at": p.updated_at.isoformat() if getattr(p, "updated_at", None) else None,
        }
        # v8.1 tier labelling — only when flag is on, for backward compat.
        if TIER_SYSTEM_ENABLED:
            pt_int = pick_tier_by_id.get(str(p.id))
            if pt_int is not None:
                item.update(tier_info(pt_int))
        items.append(item)

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
    user_tier: PickTier = Depends(get_current_tier),
):
    """Return a prediction record including its explanation and post-match evaluation."""
    result = await db.execute(
        select(Prediction)
        .options(
            selectinload(Prediction.match).selectinload(Match.home_team),
            selectinload(Prediction.match).selectinload(Match.away_team),
            selectinload(Prediction.match).selectinload(Match.league),
            selectinload(Prediction.match).selectinload(Match.result),
            selectinload(Prediction.explanation),
            selectinload(Prediction.evaluation),
            selectinload(Prediction.model_version),
        )
        .where(Prediction.id == prediction_id)
    )
    pred = result.scalar_one_or_none()
    if pred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction {prediction_id} not found.",
        )

    # v8.1 tier access check — compute pick_tier and ensure it's within user's tier.
    pick_tier_int: Optional[int] = None
    if TIER_SYSTEM_ENABLED:
        tier_row = await db.execute(
            select(pick_tier_expression())
            .select_from(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(Prediction.id == prediction_id)
        )
        pt = tier_row.scalar_one_or_none()
        pick_tier_int = int(pt) if pt is not None else PickTier.FREE.value
        if pick_tier_int > user_tier.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "tier_upgrade_required",
                    "required_tier": PickTier(pick_tier_int).name.lower(),
                    "current_tier": user_tier.name.lower(),
                    "message": (
                        f"This pick is {PickTier(pick_tier_int).name.title()} tier. "
                        f"Upgrade to view."
                    ),
                },
            )

    try:
        resp = PredictionResponse.model_validate(pred)
        payload = resp.model_dump(mode="json")
    except Exception:
        # Minimal fallback
        payload = {
            "id": str(pred.id),
            "match_id": str(pred.match_id),
            "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else None,
            "home_win_prob": pred.home_win_prob,
            "draw_prob": pred.draw_prob,
            "away_win_prob": pred.away_win_prob,
            "confidence": pred.confidence,
        }

    # Attach tier labelling (flag-gated)
    if TIER_SYSTEM_ENABLED and pick_tier_int is not None:
        payload.update(tier_info(pick_tier_int))

    return JSONResponse(content=payload)


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
