"""Strategy API routes."""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.db.session import get_db
from app.models.league import League
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.strategy import Strategy
from app.models.team import Team
from app.schemas.strategy import (
    StrategyPickPrediction,
    StrategyPicksResponse,
    StrategyResponse,
)
from app.services.strategy_engine import evaluate_strategy

router = APIRouter()


@router.get(
    "/",
    response_model=List[StrategyResponse],
    summary="List all strategies",
)
async def list_strategies(
    active_only: bool = Query(default=False, description="Return only active strategies"),
    db: AsyncSession = Depends(get_db),
) -> List[StrategyResponse]:
    """Return all strategies ordered by creation date."""
    q = select(Strategy).order_by(Strategy.created_at.desc())
    if active_only:
        q = q.where(Strategy.is_active.is_(True))

    result = await db.execute(q)
    strategies = result.scalars().all()
    return [StrategyResponse.model_validate(s) for s in strategies]


@router.get(
    "/{strategy_id}",
    response_model=StrategyResponse,
    summary="Get a single strategy",
)
async def get_strategy(
    strategy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StrategyResponse:
    """Return a single strategy by ID."""
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id)
    )
    strategy = result.scalar_one_or_none()
    if strategy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy {strategy_id} not found.",
        )
    return StrategyResponse.model_validate(strategy)


@router.get(
    "/{strategy_id}/picks",
    response_model=StrategyPicksResponse,
    summary="Get predictions matching a strategy",
)
async def get_strategy_picks(
    strategy_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=200, description="Max picks to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    db: AsyncSession = Depends(get_db),
) -> StrategyPicksResponse:
    """
    Evaluate all recent predictions against the strategy and return matching picks.

    Predictions are evaluated in-memory against the strategy rules. Odds-based
    rules are skipped when odds data is not available.
    """
    # Fetch the strategy
    strat_result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id)
    )
    strategy = strat_result.scalar_one_or_none()
    if strategy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy {strategy_id} not found.",
        )

    # Fetch predictions with match context + evaluation
    from app.models.prediction import PredictionEvaluation
    from app.models.match import MatchResult, MatchStatus as MS

    HomeTeam = aliased(Team)
    AwayTeam = aliased(Team)

    q = (
        select(
            Prediction,
            Match.scheduled_at,
            Match.status.label("match_status"),
            HomeTeam.name.label("home_team_name"),
            AwayTeam.name.label("away_team_name"),
            League.name.label("league_name"),
            PredictionEvaluation.actual_outcome,
            PredictionEvaluation.is_correct,
            MatchResult.home_score,
            MatchResult.away_score,
        )
        .join(Match, Match.id == Prediction.match_id)
        .join(HomeTeam, HomeTeam.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.id == Match.away_team_id)
        .join(League, League.id == Match.league_id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .outerjoin(MatchResult, MatchResult.match_id == Match.id)
        .order_by(Match.scheduled_at.desc())
    )

    result = await db.execute(q)
    rows = result.all()

    # Evaluate each prediction against strategy rules
    matched_picks: list[StrategyPickPrediction] = []
    for row in rows:
        prediction = row[0]
        scheduled_at = row[1]
        match_status = row[2]
        home_team_name = row[3]
        away_team_name = row[4]
        league_name = row[5]
        actual_outcome = row[6]
        is_correct = row[7]
        home_score = row[8]
        away_score = row[9]

        odds = None
        if evaluate_strategy(strategy, prediction, odds):
            # Determine pick
            probs = {"HOME": prediction.home_win_prob, "DRAW": prediction.draw_prob or 0, "AWAY": prediction.away_win_prob}
            pick = max(probs, key=lambda k: probs[k])

            # Calculate P/L (flat 1u stake, assume avg odds ~1.9)
            pnl = None
            if is_correct is not None:
                pnl = 0.9 if is_correct else -1.0

            status_str = match_status.value if hasattr(match_status, "value") else str(match_status)

            matched_picks.append(
                StrategyPickPrediction(
                    id=prediction.id,
                    match_id=prediction.match_id,
                    predicted_at=prediction.predicted_at,
                    home_win_prob=prediction.home_win_prob,
                    draw_prob=prediction.draw_prob,
                    away_win_prob=prediction.away_win_prob,
                    confidence=prediction.confidence,
                    prediction_type=prediction.prediction_type,
                    pick=pick,
                    home_team_name=home_team_name,
                    away_team_name=away_team_name,
                    scheduled_at=scheduled_at,
                    league_name=league_name,
                    match_status=status_str,
                    actual_outcome=actual_outcome,
                    is_correct=is_correct,
                    home_score=home_score,
                    away_score=away_score,
                    pnl=pnl,
                )
            )

    total = len(matched_picks)
    paginated = matched_picks[offset : offset + limit]

    return StrategyPicksResponse(
        strategy=StrategyResponse.model_validate(strategy),
        total=total,
        picks=paginated,
    )


@router.get(
    "/{strategy_id}/metrics",
    summary="Get performance metrics for a strategy",
)
async def get_strategy_metrics(
    strategy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Calculate performance metrics for a strategy based on evaluated predictions.
    Results are cached in Redis for 15 minutes.
    Returns: sample_size, winrate, roi, max_drawdown, profit_factor.
    """
    from app.core.cache import cache_get, cache_set
    from app.models.prediction import PredictionEvaluation

    # Check cache first
    cache_key = f"strategy:metrics:{strategy_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    # Fetch strategy
    strat_result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    strategy = strat_result.scalar_one_or_none()
    if strategy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")

    # Get all evaluated predictions
    HomeTeam = aliased(Team)
    AwayTeam = aliased(Team)

    q = (
        select(Prediction, PredictionEvaluation)
        .join(Match, Match.id == Prediction.match_id)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(HomeTeam, HomeTeam.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.id == Match.away_team_id)
        .join(League, League.id == Match.league_id)
        .order_by(Match.scheduled_at)
    )
    rows = (await db.execute(q)).all()

    # Filter for strategy matches
    matched_and_evaluated = []
    for pred, evaluation in rows:
        if evaluate_strategy(strategy, pred, odds=None):
            matched_and_evaluated.append((pred, evaluation))

    sample_size = len(matched_and_evaluated)
    if sample_size == 0:
        return {
            "strategy_id": str(strategy_id),
            "strategy_name": strategy.name,
            "sample_size": 0,
            "winrate": 0.0,
            "roi": 0.0,
            "max_drawdown": 0.0,
            "profit_factor": 0.0,
            "avg_brier": 0.0,
            "has_data": False,
        }

    # Calculate metrics
    correct = sum(1 for _, ev in matched_and_evaluated if ev.is_correct)
    winrate = correct / sample_size

    # ROI: flat staking 1 unit, assume avg odds ~1.9 for correct picks
    wins_profit = correct * 0.9  # win 0.9 units per correct (avg odds 1.9 - 1.0 stake)
    losses = sample_size - correct
    roi = (wins_profit - losses) / sample_size if sample_size > 0 else 0.0

    # Max drawdown from equity curve
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    for _, ev in matched_and_evaluated:
        if ev.is_correct:
            equity += 0.9
        else:
            equity -= 1.0
        if equity > peak:
            peak = equity
        dd = peak - equity
        if dd > max_dd:
            max_dd = dd

    # Profit factor
    gross_profit = wins_profit
    gross_loss = losses * 1.0
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0.0

    avg_brier = sum(ev.brier_score for _, ev in matched_and_evaluated) / sample_size

    result = {
        "strategy_id": str(strategy_id),
        "strategy_name": strategy.name,
        "sample_size": sample_size,
        "winrate": round(winrate, 4),
        "roi": round(roi, 4),
        "max_drawdown": round(max_dd, 2),
        "profit_factor": round(profit_factor, 4),
        "avg_brier": round(avg_brier, 6),
        "correct": correct,
        "incorrect": losses,
        "has_data": True,
    }

    # Cache for 15 minutes
    await cache_set(cache_key, result, ttl=900)
    return result
