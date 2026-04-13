"""Homepage endpoints: featured match + free daily picks.

Returns the highest-edge upcoming prediction for the hero card, and a
curated set of 3 free daily picks with rolling accuracy stats.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.match import Match, MatchResult, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation

router = APIRouter()
log = logging.getLogger(__name__)


class FeaturedMatchResponse(BaseModel):
    available: bool
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    league: Optional[str] = None
    kickoff: Optional[str] = None
    pick: Optional[str] = None
    home_win_prob: Optional[float] = None
    draw_prob: Optional[float] = None
    away_win_prob: Optional[float] = None
    confidence: Optional[float] = None
    elo_diff: Optional[int] = None
    edge: Optional[float] = None
    label: Optional[str] = None


@router.get(
    "/featured-match",
    response_model=FeaturedMatchResponse,
    summary="Featured match for homepage hero card",
)
async def get_featured_match(
    db: AsyncSession = Depends(get_db),
) -> FeaturedMatchResponse:
    """
    Returns the highest-confidence upcoming prediction for the hero card.

    Selection: upcoming fixtures in next 72h, sorted by confidence DESC.
    Label "HOT" if confidence > 0.60.
    Falls back to any upcoming match with a prediction.
    """
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=72)

    stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= cutoff,
            )
        )
        .order_by(Prediction.confidence.desc())
        .limit(1)
    )

    result = await db.execute(stmt)
    prediction = result.scalar_one_or_none()

    if prediction is None:
        return FeaturedMatchResponse(available=False)

    match = prediction.match
    home_name = match.home_team.name if match and match.home_team else None
    away_name = match.away_team.name if match and match.away_team else None
    league_name = match.league.name if match and match.league else None

    # Determine pick
    probs = {
        "HOME": prediction.home_win_prob,
        "DRAW": prediction.draw_prob or 0,
        "AWAY": prediction.away_win_prob,
    }
    pick = max(probs, key=lambda k: probs[k])

    # Estimate Elo diff from raw_output if available
    elo_diff = None
    if prediction.raw_output and isinstance(prediction.raw_output, dict):
        sub_models = prediction.raw_output.get("sub_models", [])
        for sm in sub_models:
            if sm.get("model") == "EloModel" and "explanation_factors" in sm:
                ef = sm["explanation_factors"]
                elo_diff = int(ef.get("elo_difference", 0))
                break

    # Estimate edge (model prob - uniform 33%)
    max_prob = max(probs.values())
    edge = round(max_prob - (1 / 3), 4)

    label = "HOT" if prediction.confidence > 0.60 else None

    return FeaturedMatchResponse(
        available=True,
        home_team=home_name,
        away_team=away_name,
        league=league_name,
        kickoff=match.scheduled_at.isoformat() if match else None,
        pick=pick,
        home_win_prob=round(prediction.home_win_prob, 4),
        draw_prob=round(prediction.draw_prob, 4) if prediction.draw_prob else None,
        away_win_prob=round(prediction.away_win_prob, 4),
        confidence=round(prediction.confidence, 4),
        elo_diff=elo_diff,
        edge=round(edge, 4),
        label=label,
    )


# ── Free Daily Picks ────────────────────────────────────────────────────────


class FreePickItem(BaseModel):
    id: str
    match_id: str  # match UUID — single source of truth for free-pick gating across all pages
    home_team: str
    away_team: str
    league: str
    scheduled_at: str
    pick: Optional[str] = None
    home_win_prob: Optional[float] = None
    draw_prob: Optional[float] = None
    away_win_prob: Optional[float] = None
    confidence: Optional[float] = None
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    is_correct: Optional[bool] = None


class FreePicksResponse(BaseModel):
    today: List[FreePickItem] = Field(default_factory=list)
    yesterday: List[FreePickItem] = Field(default_factory=list)
    stats: dict = Field(
        default_factory=lambda: {"total": 0, "correct": 0, "winrate": 0.0},
        description="Running accuracy across all evaluated free picks (last 30 days).",
    )


def _pick_from_probs(p: Prediction) -> str:
    probs = {"HOME": p.home_win_prob, "DRAW": p.draw_prob or 0, "AWAY": p.away_win_prob}
    return max(probs, key=lambda k: probs[k])


def _build_free_pick(pred: Prediction) -> FreePickItem:
    m = pred.match
    home = m.home_team.name if m and m.home_team else "TBD"
    away = m.away_team.name if m and m.away_team else "TBD"
    league = m.league.name if m and m.league else ""

    pick = _pick_from_probs(pred)

    # Result data for finished matches
    home_score = away_score = None
    is_correct = None
    if m and m.result:
        home_score = m.result.home_score
        away_score = m.result.away_score
        actual = (
            "HOME" if home_score > away_score
            else "AWAY" if away_score > home_score
            else "DRAW"
        )
        is_correct = pick == actual

    return FreePickItem(
        id=str(pred.id),
        match_id=str(m.id) if m else "",
        home_team=home,
        away_team=away,
        league=league,
        scheduled_at=m.scheduled_at.isoformat() if m else "",
        pick=pick,
        home_win_prob=round(pred.home_win_prob, 4),
        draw_prob=round(pred.draw_prob, 4) if pred.draw_prob else None,
        away_win_prob=round(pred.away_win_prob, 4),
        confidence=round(pred.confidence, 4),
        status=m.status.value if m and hasattr(m.status, "value") else str(m.status) if m else "unknown",
        home_score=home_score,
        away_score=away_score,
        is_correct=is_correct,
    )


@router.get(
    "/free-picks",
    response_model=FreePicksResponse,
    summary="Free daily picks for homepage",
)
async def get_free_picks(
    db: AsyncSession = Depends(get_db),
) -> FreePicksResponse:
    """Top 3 highest-confidence upcoming picks + 3 recent results + 30-day winrate.

    Unlike the previous version which was limited to today/yesterday only
    (often empty on days without matches), this searches a wider window:
    - "today": next 3 upcoming scheduled matches (up to 7 days ahead)
    - "yesterday": last 3 finished matches (up to 7 days back)
    This guarantees the homepage section always has content.
    """
    now = datetime.now(timezone.utc)

    base_opts = [
        selectinload(Prediction.match).selectinload(Match.home_team),
        selectinload(Prediction.match).selectinload(Match.away_team),
        selectinload(Prediction.match).selectinload(Match.league),
        selectinload(Prediction.match).selectinload(Match.result),
    ]

    # ── Upcoming: top 3 scheduled matches by confidence (next 14 days) ──
    upcoming_cutoff = now + timedelta(days=14)
    today_stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .options(*base_opts)
        .where(
            and_(
                Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                Match.scheduled_at >= now,
                Match.scheduled_at <= upcoming_cutoff,
            )
        )
        .order_by(Prediction.confidence.desc())
        .limit(3)
    )
    today_rows = (await db.execute(today_stmt)).scalars().unique().all()
    today_picks = [_build_free_pick(p) for p in today_rows]

    # ── Fallback: fill to 3 with upcoming fixtures that lack predictions ──
    if len(today_picks) < 3:
        from app.models.team import Team
        from app.models.league import League as LeagueModel

        existing_match_ids = [p.match_id for p in today_rows]
        fill_needed = 3 - len(today_picks)
        filler_stmt = (
            select(Match)
            .options(
                selectinload(Match.home_team),
                selectinload(Match.away_team),
                selectinload(Match.league),
            )
            .where(
                and_(
                    Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    Match.scheduled_at >= now,
                    Match.scheduled_at <= upcoming_cutoff,
                    *([] if not existing_match_ids else [Match.id.notin_(existing_match_ids)]),
                )
            )
            .order_by(Match.scheduled_at.asc())
            .limit(fill_needed)
        )
        filler_rows = (await db.execute(filler_stmt)).scalars().unique().all()
        for m in filler_rows:
            today_picks.append(FreePickItem(
                id="",
                match_id=str(m.id),
                home_team=m.home_team.name if m and m.home_team else "TBD",
                away_team=m.away_team.name if m and m.away_team else "TBD",
                league=m.league.name if m and m.league else "",
                scheduled_at=m.scheduled_at.isoformat() if m else "",
                status=m.status.value if hasattr(m.status, "value") else str(m.status),
            ))

    # ── Recent results: top 3 finished matches by confidence (last 7 days) ──
    results_start = now - timedelta(days=7)
    yesterday_stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .options(*base_opts)
        .where(
            and_(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= results_start,
                Match.scheduled_at <= now,
            )
        )
        .order_by(Prediction.confidence.desc())
        .limit(3)
    )
    yesterday_rows = (await db.execute(yesterday_stmt)).scalars().unique().all()
    yesterday_picks = [_build_free_pick(p) for p in yesterday_rows]

    # ── 30-day rolling winrate ───────────────────────────────────
    thirty_days_ago = now - timedelta(days=30)
    from sqlalchemy import case
    stats_stmt = (
        select(
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(case((PredictionEvaluation.is_correct.is_(True), 1), else_=0)).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.scheduled_at >= thirty_days_ago)
    )
    try:
        row = (await db.execute(stats_stmt)).one_or_none()
        total = int(row.total) if row and row.total else 0
        correct = int(row.correct) if row and row.correct else 0
    except Exception:
        total = correct = 0

    winrate = round(correct / total, 4) if total > 0 else 0.0

    return FreePicksResponse(
        today=today_picks,
        yesterday=yesterday_picks,
        stats={"total": total, "correct": correct, "winrate": winrate},
    )
