"""Matches routes."""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.match import Match, MatchResult, MatchStatus
from app.models.prediction import Prediction
from app.models.team import Team
from app.schemas.match import MatchAnalysis, MatchDetail, MatchKeyStats, MatchResponse
from app.schemas.prediction import ForecastOutput, PredictionResponse

router = APIRouter()


@router.get(
    "/{match_id}",
    response_model=MatchDetail,
    summary="Get match detail with result",
)
async def get_match(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MatchDetail:
    """Return a match record including its result (if finished) and all predictions."""
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found.",
        )

    # Load predictions via explicit query (lazy="noload" on relationship)
    preds_result = await db.execute(
        select(Prediction)
        .where(Prediction.match_id == match_id)
        .order_by(Prediction.predicted_at.desc())
    )
    predictions = preds_result.scalars().all()

    match_resp = MatchResponse.from_orm_match(match)

    return MatchDetail(
        **match_resp.model_dump(),
        result=match.result,
        predictions=[PredictionResponse.model_validate(p) for p in predictions],
    )


@router.get(
    "/{match_id}/analysis",
    response_model=MatchAnalysis,
    summary="Full match analysis (stats, head-to-head, form)",
)
async def get_match_analysis(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MatchAnalysis:
    """
    Return an analytical summary for the match.

    Includes pre-match key stats (recent form, goals average, H2H summary)
    and the latest prediction if available.

    # TODO: delegate deep H2H and xG computations to service layer
    """
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found.",
        )

    match_resp = MatchResponse.from_orm_match(match)

    # Compute simple form strings for home and away teams
    async def _team_form(team_id: uuid.UUID, n: int = 5) -> list[str]:
        form_result = await db.execute(
            select(Match)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .where(
                or_(Match.home_team_id == team_id, Match.away_team_id == team_id),
                Match.status == MatchStatus.FINISHED,
            )
            .order_by(Match.scheduled_at.desc())
            .limit(n)
        )
        recent = form_result.scalars().all()
        codes: list[str] = []
        for m in reversed(recent):
            if m.result is None:
                continue
            if m.home_team_id == team_id:
                code = "W" if m.result.winner == "home" else ("D" if m.result.winner == "draw" else "L")
            else:
                code = "W" if m.result.winner == "away" else ("D" if m.result.winner == "draw" else "L")
            codes.append(code)
        return codes

    home_form = await _team_form(match.home_team_id)
    away_form = await _team_form(match.away_team_id)

    # Head-to-head: last 5 meetings between the two teams
    h2h_result = await db.execute(
        select(Match)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .where(
            or_(
                (Match.home_team_id == match.home_team_id) & (Match.away_team_id == match.away_team_id),
                (Match.home_team_id == match.away_team_id) & (Match.away_team_id == match.home_team_id),
            ),
            Match.status == MatchStatus.FINISHED,
            Match.id != match_id,
        )
        .order_by(Match.scheduled_at.desc())
        .limit(5)
    )
    h2h_matches = h2h_result.scalars().all()
    home_wins_h2h = sum(
        1 for m in h2h_matches
        if m.result and (
            (m.home_team_id == match.home_team_id and m.result.winner == "home") or
            (m.away_team_id == match.home_team_id and m.result.winner == "away")
        )
    )
    away_wins_h2h = sum(
        1 for m in h2h_matches
        if m.result and (
            (m.home_team_id == match.away_team_id and m.result.winner == "home") or
            (m.away_team_id == match.away_team_id and m.result.winner == "away")
        )
    )
    draws_h2h = len(h2h_matches) - home_wins_h2h - away_wins_h2h
    h2h_summary: Optional[str] = None
    if h2h_matches:
        hn = match.home_team.name if match.home_team else "Home"
        an = match.away_team.name if match.away_team else "Away"
        h2h_summary = (
            f"Last {len(h2h_matches)} meetings: "
            f"{hn} {home_wins_h2h}W – {draws_h2h}D – {away_wins_h2h}W {an}"
        )

    key_stats = MatchKeyStats(
        home_form=home_form,
        away_form=away_form,
        head_to_head_summary=h2h_summary,
    )

    # Latest prediction
    latest_pred_result = await db.execute(
        select(Prediction)
        .where(Prediction.match_id == match_id)
        .order_by(Prediction.predicted_at.desc())
        .limit(1)
    )
    latest_pred_orm = latest_pred_result.scalar_one_or_none()
    latest_prediction = (
        PredictionResponse.model_validate(latest_pred_orm) if latest_pred_orm else None
    )

    return MatchAnalysis(
        match=match_resp,
        key_stats=key_stats,
        latest_prediction=latest_prediction,
        narrative=None,  # TODO: delegate narrative generation to LLM service
    )


@router.get(
    "/{match_id}/forecast",
    response_model=ForecastOutput,
    summary="Get or generate forecast for a match",
)
async def get_match_forecast(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ForecastOutput:
    """
    Return the most recent forecast for a match.

    If no prediction exists, raise 404.
    Use POST /predictions/run to trigger a new forecast.

    # TODO: delegate to forecasting service for on-demand generation
    """
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found.",
        )

    pred_result = await db.execute(
        select(Prediction)
        .where(Prediction.match_id == match_id)
        .order_by(Prediction.predicted_at.desc())
        .limit(1)
    )
    pred = pred_result.scalar_one_or_none()
    if pred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No forecast found for match {match_id}. "
                "Use POST /api/predictions/run to generate one."
            ),
        )

    explanation_text: Optional[str] = None
    if pred.explanation:
        explanation_text = pred.explanation.summary

    return ForecastOutput(
        match_id=pred.match_id,
        model_version_id=pred.model_version_id,
        predicted_at=pred.predicted_at,
        home_win_prob=pred.home_win_prob,
        draw_prob=pred.draw_prob,
        away_win_prob=pred.away_win_prob,
        predicted_home_score=pred.predicted_home_score,
        predicted_away_score=pred.predicted_away_score,
        confidence=pred.confidence,
        confidence_interval_low=pred.confidence_interval_low,
        confidence_interval_high=pred.confidence_interval_high,
        explanation=explanation_text,
        top_factors=(
            list(pred.explanation.top_factors_for.items()) if pred.explanation else None
        ),
        features_snapshot=pred.features_snapshot,
        raw_output=pred.raw_output,
    )
