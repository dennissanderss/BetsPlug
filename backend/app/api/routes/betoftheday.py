"""
Pick of the Day route.

Selects the single highest-confidence prediction for today's matches.
This is the premium "killer feature" — the one prediction that stands out.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timezone
from typing import Optional

import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, noload

from datetime import timedelta

from app.api.deps import get_current_tier
from app.core.prediction_filters import (
    V81_DEPLOYMENT_CUTOFF,
    trackrecord_filter,
    v81_predictions_filter,
)
from app.core.tier_system import (
    PickTier,
    TIER_SYSTEM_ENABLED,
    access_filter,
    pick_tier_expression,
    tier_info,
)
from app.db.session import get_db
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction

# Live BOTD tracking starts from this date. Predictions earlier than this
# are legitimate model validation output but not part of the "live
# measurement" narrative — see docs/integrity_relabel_sprint.md.
LIVE_BOTD_START = datetime(2026, 4, 18, tzinfo=timezone.utc)

logger = logging.getLogger(__name__)

router = APIRouter()

# v8: Confidence tiering from walk-forward validation (28,838 test picks)
# Source: docs/V8_ENGINE_REPORT.md
# BOTD uses ≥60% (67.4% accuracy, ~6,060 qualifying picks historically).
# Premium tier uses ≥75% for the elite 78.2% accuracy tier.
BOTD_MIN_CONFIDENCE = 0.60       # BOTD threshold
CONFIDENCE_SILVER = 0.55         # Silver tier: 63.0% accuracy
CONFIDENCE_GOLD = 0.65           # Gold tier:   70.6% accuracy
CONFIDENCE_PLATINUM = 0.75       # Premium:     78.2% accuracy


# ─────────────────────────────────────────────────────────────────────────────
# v6.3: Historical accuracy endpoint for BOTD picks
# ─────────────────────────────────────────────────────────────────────────────


class BOTDHistoryItem(BaseModel):
    """A single past BOTD pick with its result."""
    date: str
    home_team: str
    away_team: str
    league: str
    prediction: str  # "Home" / "Draw" / "Away"
    confidence: float
    correct: bool | None = None  # None = pending
    home_score: int | None = None
    away_score: int | None = None
    odds_used: float | None = None


@router.get("/history", response_model=list[BOTDHistoryItem])
async def get_botd_history(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> list[BOTDHistoryItem]:
    """Return the last N BOTD picks with their results (filtered by user tier)."""
    from app.models.prediction import PredictionEvaluation
    from collections import defaultdict

    # Try live predictions first; fall back to all v8.1 predictions if none exist
    stmt = (
        select(Prediction, PredictionEvaluation)
        .join(Match, Match.id == Prediction.match_id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(
            Prediction.confidence >= BOTD_MIN_CONFIDENCE,
            Prediction.prediction_source == "live",
        )
        # v8.1 filter — applied inside 'live' branch too (old pipeline also had
        # prediction_source='live' from pre-fix v8.0 Celery runs)
        .where(trackrecord_filter())
        .order_by(Match.scheduled_at.desc())
    )
    if TIER_SYSTEM_ENABLED:
        stmt = stmt.where(access_filter(user_tier))
    rows = (await db.execute(stmt)).all()
    if not rows:
        stmt_fallback = (
            select(Prediction, PredictionEvaluation)
            .join(Match, Match.id == Prediction.match_id)
            .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .where(Prediction.confidence >= BOTD_MIN_CONFIDENCE)
            # v8.1 filter
            .where(trackrecord_filter())
            .order_by(Match.scheduled_at.desc())
        )
        if TIER_SYSTEM_ENABLED:
            stmt_fallback = stmt_fallback.where(access_filter(user_tier))
        rows = (await db.execute(stmt_fallback)).all()

    # Group by date, keep highest confidence per day
    by_date: dict[str, tuple] = {}
    for pred, evaluation in rows:
        if pred.match is None:
            continue
        date_key = pred.match.scheduled_at.strftime("%Y-%m-%d") if pred.match.scheduled_at else ""
        if not date_key:
            continue
        existing = by_date.get(date_key)
        if existing is None or pred.confidence > existing[0].confidence:
            by_date[date_key] = (pred, evaluation)

    # Sort by date descending, take last N
    sorted_picks = sorted(by_date.items(), key=lambda x: x[0], reverse=True)[:limit]

    pick_labels = {"home": "Home", "draw": "Draw", "away": "Away"}
    result = []
    for date_key, (pred, evaluation) in sorted_picks:
        probs = {"home": pred.home_win_prob, "draw": pred.draw_prob or 0, "away": pred.away_win_prob}
        pick = max(probs, key=lambda k: probs[k])

        m = pred.match
        home_name = m.home_team.name if m and m.home_team else "?"
        away_name = m.away_team.name if m and m.away_team else "?"
        league_name = m.league.name if m and m.league else ""

        home_score = m.result.home_score if m and m.result else None
        away_score = m.result.away_score if m and m.result else None

        # Implied odds for transparency
        pick_prob = probs.get(pick, 0.5)
        implied_odds = round(1.0 / (pick_prob * 0.95), 2) if pick_prob > 0.05 else None

        result.append(BOTDHistoryItem(
            date=date_key,
            home_team=home_name,
            away_team=away_name,
            league=league_name,
            prediction=pick_labels.get(pick, pick),
            confidence=round(pred.confidence * 100, 1),
            correct=bool(evaluation.is_correct) if evaluation else None,
            home_score=home_score,
            away_score=away_score,
            odds_used=implied_odds,
        ))

    return result


class BOTDSectionSummary(BaseModel):
    """Aggregate summary for one Pick-of-the-Day display section.

    Returned alongside the per-day pick list so the UI can show headline
    KPIs (n picks / accuracy / streak) without a second round-trip.
    """

    total_picks: int = 0
    evaluated: int = 0
    correct: int = 0
    accuracy_pct: float = 0.0
    avg_confidence: float = 0.0
    current_streak: int = 0
    best_streak: int = 0


class BOTDSectionResponse(BaseModel):
    """Pick-of-the-Day surface split by integrity source.

    The ``model-validation`` endpoint returns the model's one best pick
    per day applied to finished matches (post-kickoff timestamps are
    kept — this is model validation, not live measurement). The
    ``live-tracking`` endpoint returns ONLY picks that were timestamped
    strictly before kickoff and flagged ``prediction_source = 'live'``.
    Both reuse this envelope so the frontend renders them identically.
    """

    summary: BOTDSectionSummary
    picks: list[BOTDHistoryItem]


async def _build_botd_section(
    db: AsyncSession,
    user_tier: PickTier,
    *,
    require_pre_match: bool,
    require_live_source: bool,
    created_from: datetime,
    limit: int,
) -> BOTDSectionResponse:
    """Shared builder for /model-validation and /live-tracking.

    Parameters
    ----------
    require_pre_match:
        If True, only keep predictions with ``predicted_at < scheduled_at``.
        The display variant of ``trackrecord_filter``'s ``<=`` guard.
    require_live_source:
        If True, restrict to ``prediction_source = 'live'`` rows. Used by
        the live-tracking section to strip out backtest and batch fills.
    created_from:
        Lower bound on ``Prediction.created_at``. Always at least
        ``V81_DEPLOYMENT_CUTOFF``; model-validation uses the cutoff
        directly, live-tracking uses ``LIVE_BOTD_START``.
    limit:
        Maximum number of per-day picks to return (ordered newest first).
    """
    from app.models.prediction import PredictionEvaluation

    # Base filter: v8.1 pipeline + above BOTD confidence floor.
    stmt = (
        select(Prediction, PredictionEvaluation)
        .join(Match, Match.id == Prediction.match_id)
        .outerjoin(
            PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id
        )
        .where(
            Prediction.confidence >= BOTD_MIN_CONFIDENCE,
            v81_predictions_filter(),
            Prediction.created_at >= created_from,
        )
        .order_by(Match.scheduled_at.desc())
    )
    if require_live_source:
        stmt = stmt.where(Prediction.prediction_source == "live")
    if require_pre_match:
        stmt = stmt.where(Prediction.predicted_at < Match.scheduled_at)
    if TIER_SYSTEM_ENABLED:
        stmt = stmt.where(access_filter(user_tier))

    rows = (await db.execute(stmt)).all()

    # Group by kickoff date, keep the highest-confidence row per day.
    by_date: dict[str, tuple] = {}
    for pred, evaluation in rows:
        if pred.match is None or pred.match.scheduled_at is None:
            continue
        date_key = pred.match.scheduled_at.strftime("%Y-%m-%d")
        existing = by_date.get(date_key)
        if existing is None or pred.confidence > existing[0].confidence:
            by_date[date_key] = (pred, evaluation)

    # Oldest → newest for correct streak computation; slice to limit afterward.
    sorted_asc = sorted(by_date.items(), key=lambda x: x[0])

    pick_labels = {"home": "Home", "draw": "Draw", "away": "Away"}
    picks: list[BOTDHistoryItem] = []
    for _, (pred, evaluation) in sorted_asc:
        probs = {
            "home": pred.home_win_prob,
            "draw": pred.draw_prob or 0,
            "away": pred.away_win_prob,
        }
        pick = max(probs, key=lambda k: probs[k])
        m = pred.match
        home = m.home_team.name if m and m.home_team else "?"
        away = m.away_team.name if m and m.away_team else "?"
        league = m.league.name if m and m.league else ""
        home_score = m.result.home_score if m and m.result else None
        away_score = m.result.away_score if m and m.result else None
        pick_prob = probs.get(pick, 0.5)
        implied_odds = round(1.0 / (pick_prob * 0.95), 2) if pick_prob > 0.05 else None

        picks.append(
            BOTDHistoryItem(
                date=m.scheduled_at.strftime("%Y-%m-%d") if m.scheduled_at else "",
                home_team=home,
                away_team=away,
                league=league,
                prediction=pick_labels.get(pick, pick),
                confidence=round(pred.confidence * 100, 1),
                correct=bool(evaluation.is_correct) if evaluation else None,
                home_score=home_score,
                away_score=away_score,
                odds_used=implied_odds,
            )
        )

    # Summary (computed on the full sorted list before trimming).
    total = len(picks)
    evaluated_picks = [p for p in picks if p.correct is not None]
    evaluated = len(evaluated_picks)
    correct = sum(1 for p in evaluated_picks if p.correct)
    accuracy_pct = round((correct / evaluated * 100), 1) if evaluated else 0.0
    avg_conf = round(sum(p.confidence for p in picks) / total, 1) if total else 0.0

    best = temp = 0
    for p in evaluated_picks:
        if p.correct:
            temp += 1
            best = max(best, temp)
        else:
            temp = 0
    current = 0
    for p in reversed(evaluated_picks):
        if p.correct:
            current += 1
        else:
            break

    summary = BOTDSectionSummary(
        total_picks=total,
        evaluated=evaluated,
        correct=correct,
        accuracy_pct=accuracy_pct,
        avg_confidence=avg_conf,
        current_streak=current,
        best_streak=best,
    )

    # Return newest first, capped to limit.
    picks_display = list(reversed(picks))[:limit]
    return BOTDSectionResponse(summary=summary, picks=picks_display)


@router.get("/model-validation", response_model=BOTDSectionResponse)
async def get_botd_model_validation(
    limit: int = Query(default=30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> BOTDSectionResponse:
    """Return the model's one best pick per day on already-finished matches.

    This is model validation data: the pipeline's highest-confidence pick
    per day, restricted to v8.1 predictions (``created_at`` since the
    2026-04-16 v8.1 cutoff), regardless of whether the prediction was
    timestamped before kickoff. Used to fill the "Modelvalidatie" card on
    /bet-of-the-day while we build up enough strictly-pre-match data for
    the /live-tracking surface.
    """
    return await _build_botd_section(
        db,
        user_tier,
        require_pre_match=False,
        require_live_source=False,
        created_from=V81_DEPLOYMENT_CUTOFF,
        limit=limit,
    )


@router.get(
    "/export.csv",
    summary="Download Pick-of-the-Day model-validation picks as CSV",
)
async def export_botd_csv(
    limit: int = Query(default=365, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> StreamingResponse:
    """Stream the model-validation BOTD picks as a CSV.

    Mirrors the shape of /bet-of-the-day/model-validation but serialised
    so a Gold/Platinum subscriber can reconcile every daily pick offline.
    """
    section = await _build_botd_section(
        db,
        user_tier,
        require_pre_match=False,
        require_live_source=False,
        created_from=V81_DEPLOYMENT_CUTOFF,
        limit=limit,
    )

    # Only include graded rows — the inline table on /prestaties was
    # reworked to a stats-only layout precisely because mixing future
    # "Pending" picks into a "historical backtest" file is confusing.
    # Keeping the CSV consistent with the KPIs above it (which are
    # already derived from evaluated_picks only).
    graded_picks = [p for p in section.picks if p.correct is not None]

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "date",
            "league",
            "home_team",
            "away_team",
            "prediction",
            "confidence_pct",
            "implied_odds",
            "home_score",
            "away_score",
            "correct",
        ]
    )
    for p in graded_picks:
        writer.writerow(
            [
                p.date,
                p.league,
                p.home_team,
                p.away_team,
                p.prediction,
                f"{p.confidence:.1f}",
                f"{p.odds_used:.2f}" if p.odds_used is not None else "",
                p.home_score if p.home_score is not None else "",
                p.away_score if p.away_score is not None else "",
                "yes" if p.correct else "no",
            ]
        )

    # Prepend UTF-8 BOM + sep=, hint so European Excel (NL/DE/FR, where
    # the default list separator is ';') opens the file with columns
    # split correctly AND decodes accented team names ("Bayern München",
    # "Al Qādisiyah", "Süper Lig") as UTF-8 rather than CP-1252. Without
    # these two bytes the whole file renders in column A and "München"
    # shows up as "MÃ¼nchen".
    payload_body = buffer.getvalue().encode("utf-8")
    payload = b"\xef\xbb\xbf" + b"sep=,\r\n" + payload_body

    return StreamingResponse(
        iter([payload]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="betsplug-potd-validation.csv"',
        },
    )


@router.get("/live-tracking", response_model=BOTDSectionResponse)
async def get_botd_live_tracking(
    limit: int = Query(default=30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> BOTDSectionResponse:
    """Return the strict live-measurement BOTD stream.

    Only includes predictions that are:

    - ``prediction_source = 'live'`` (produced by the real-time cron, not
      a backtest or batch fill),
    - ``predicted_at < scheduled_at`` (timestamped strictly before
      kickoff — no retroactive rows), AND
    - ``created_at >= 2026-04-18`` (the live-measurement start date).

    Will be empty or near-empty initially and grow day by day.
    """
    return await _build_botd_section(
        db,
        user_tier,
        require_pre_match=True,
        require_live_source=True,
        created_from=LIVE_BOTD_START,
        limit=limit,
    )


class BOTDTrackRecord(BaseModel):
    """Historical accuracy of the Pick of the Day feature."""
    total_picks: int = 0
    evaluated: int = 0
    correct: int = 0
    accuracy_pct: float = 0.0
    current_streak: int = 0          # consecutive correct (positive) or wrong (negative)
    best_streak: int = 0
    avg_confidence: float = 0.0
    last_updated: str | None = None


@router.get("/track-record", response_model=BOTDTrackRecord)
async def get_botd_track_record(
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> BOTDTrackRecord:
    """Return historical accuracy for the highest-confidence daily pick.

    The BOTD is defined as the prediction with confidence >= BOTD_MIN_CONFIDENCE
    on any given day, restricted to live (pre-match) predictions only.
    Tier-aware: Free users see the Free-qualifying BOTD stream,
    Platinum users see the elite stream, etc.
    """
    from app.models.prediction import PredictionEvaluation

    stmt = (
        select(Prediction, PredictionEvaluation)
        .join(Match, Match.id == Prediction.match_id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(
            Prediction.confidence >= BOTD_MIN_CONFIDENCE,
            Prediction.prediction_source == "live",
        )
        # v8.1 filter
        .where(trackrecord_filter())
        .order_by(Match.scheduled_at)
    )
    if TIER_SYSTEM_ENABLED:
        stmt = stmt.where(access_filter(user_tier))
    rows = (await db.execute(stmt)).all()

    # Fallback: if no live predictions yet, use all v8.1 predictions
    if not rows:
        stmt_fallback = (
            select(Prediction, PredictionEvaluation)
            .join(Match, Match.id == Prediction.match_id)
            .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .where(Prediction.confidence >= BOTD_MIN_CONFIDENCE)
            # v8.1 filter
            .where(trackrecord_filter())
            .order_by(Match.scheduled_at)
        )
        if TIER_SYSTEM_ENABLED:
            stmt_fallback = stmt_fallback.where(access_filter(user_tier))
        rows = (await db.execute(stmt_fallback)).all()

    if not rows:
        return BOTDTrackRecord()

    # Group by date, keep highest confidence per day
    from collections import defaultdict
    by_date: dict[str, tuple] = {}  # date_key → (pred, eval) with highest conf
    for pred, evaluation in rows:
        if pred.match is None:
            continue
        date_key = pred.match.scheduled_at.strftime("%Y-%m-%d") if pred.match.scheduled_at else ""
        if not date_key:
            continue
        existing = by_date.get(date_key)
        if existing is None or pred.confidence > existing[0].confidence:
            by_date[date_key] = (pred, evaluation)

    picks = list(by_date.values())
    total = len(picks)
    evaluated_picks = [(p, e) for p, e in picks if e is not None]
    evaluated = len(evaluated_picks)
    correct = sum(1 for _, e in evaluated_picks if e.is_correct)
    accuracy = (correct / evaluated * 100) if evaluated > 0 else 0.0
    avg_conf = sum(p.confidence for p, _ in picks) / total if total > 0 else 0.0

    # Compute streaks
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    for _, e in evaluated_picks:
        if e.is_correct:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
    # Current streak: count from the end
    for _, e in reversed(evaluated_picks):
        if e.is_correct:
            current_streak += 1
        else:
            break

    last_date = None
    if picks:
        last_pred = picks[-1][0]
        if last_pred.match and last_pred.match.scheduled_at:
            last_date = last_pred.match.scheduled_at.isoformat()

    return BOTDTrackRecord(
        total_picks=total,
        evaluated=evaluated,
        correct=correct,
        accuracy_pct=round(accuracy, 1),
        current_streak=current_streak,
        best_streak=best_streak,
        avg_confidence=round(avg_conf * 100, 1),
        last_updated=last_date,
    )


class BOTDOdds(BaseModel):
    """Pre-match odds embedded in the BOTD response (v6.2).

    Mirrors the `OddsSummary` shape from fixtures.py. Duplicated as a
    separate type only to keep betoftheday.py self-contained — same
    field names so the frontend can reuse the OddsRow component.
    """

    home: float | None = None
    draw: float | None = None
    away: float | None = None
    over_2_5: float | None = None
    under_2_5: float | None = None
    bookmaker: str | None = None
    fetched_at: str | None = None


class BOTDDriver(BaseModel):
    """Inline shape for a top-driver entry — mirrors PredictionDriver."""

    feature: str
    label: str
    value: str
    impact: float
    direction: str | None = None


class BetOfTheDayResponse(BaseModel):
    available: bool
    match_id: str | None = None
    home_team: str | None = None
    away_team: str | None = None
    home_team_logo: str | None = None
    away_team_logo: str | None = None
    league: str | None = None
    scheduled_at: str | None = None
    home_win_prob: float | None = None
    draw_prob: float | None = None
    away_win_prob: float | None = None
    confidence: float | None = None
    predicted_outcome: str | None = None
    explanation_summary: str | None = None
    prediction_id: str | None = None
    # v6.2 transparency: expose the latest pre-match odds if available.
    odds: BOTDOdds | None = None
    # v8.1 tier labelling (populated only when TIER_SYSTEM_ENABLED)
    pick_tier: str | None = None
    pick_tier_label: str | None = None
    pick_tier_accuracy: str | None = None
    # v8.2 inline explainability — top-3 feature drivers (omitted when no
    # features_snapshot is on the prediction row).
    top_drivers: list[BOTDDriver] | None = None

    class Config:
        from_attributes = True


@router.get("/", response_model=BetOfTheDayResponse)
async def get_bet_of_the_day(
    target_date: Optional[date] = Query(
        default=None,
        description="Date to get BOTD for (defaults to today UTC)",
    ),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> BetOfTheDayResponse:
    """
    Returns the single highest-confidence prediction for the given date.

    Selection criteria:
    1. Match is scheduled for the target date
    2. Match has a prediction
    3. Prediction with highest confidence score wins
    4. Minimum confidence threshold: 0.65 (65%)

    This endpoint surfaces the single top-confidence analytical pick
    of the day for educational and informational purposes.
    """
    now = datetime.now(timezone.utc)

    # v6 fix: when no target_date is specified we want "the best
    # pick for the NEXT 72h", not "the best pick from the whole of
    # today even if it already kicked off". Otherwise the page shows
    # a match with a final score sitting under a "Pick of the Day"
    # header, which confuses users. When a target_date IS specified
    # (e.g. browse history), we keep the day-window behaviour.
    if target_date is None:
        window_start = now
        window_end = now + timedelta(hours=72)
        status_filter = Match.status == MatchStatus.SCHEDULED
    else:
        day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
        day_end = datetime.combine(target_date, time.max, tzinfo=timezone.utc)
        # For historical browsing, accept any status (finished included)
        # so the user can see what the pick WAS that day.
        if target_date >= now.date():
            window_start = max(day_start, now)
            status_filter = Match.status == MatchStatus.SCHEDULED
        else:
            window_start = day_start
            status_filter = None
        window_end = day_end

    base_clauses = [
        Match.scheduled_at >= window_start,
        Match.scheduled_at <= window_end,
        Prediction.confidence >= BOTD_MIN_CONFIDENCE,
    ]
    if status_filter is not None:
        base_clauses.append(status_filter)

    load_opts = [
        joinedload(Prediction.match).joinedload(Match.home_team),
        joinedload(Prediction.match).joinedload(Match.away_team),
        joinedload(Prediction.match).joinedload(Match.league),
        noload(Prediction.evaluation),
        noload(Prediction.model_version),
    ]

    # Try live predictions first; fall back to any prediction if no live picks exist yet
    stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .options(*load_opts)
        .where(and_(*base_clauses, Prediction.prediction_source == "live"))
        # Deterministic tie-break: if two picks share the top confidence,
        # always prefer the one with the smallest id so BOTD doesn't
        # flip between requests within the same day.
        .order_by(Prediction.confidence.desc(), Prediction.id)
        .limit(1)
    )
    if TIER_SYSTEM_ENABLED:
        stmt = stmt.where(access_filter(user_tier))

    result = await db.execute(stmt)
    prediction = result.unique().scalar_one_or_none()

    # Fallback: if no live predictions exist yet, serve backtest predictions
    if prediction is None:
        stmt_fallback = (
            select(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .options(*load_opts)
            .where(and_(*base_clauses))
            .order_by(Prediction.confidence.desc(), Prediction.id)
            .limit(1)
        )
        if TIER_SYSTEM_ENABLED:
            stmt_fallback = stmt_fallback.where(access_filter(user_tier))
        result = await db.execute(stmt_fallback)
        prediction = result.unique().scalar_one_or_none()

    if prediction is None:
        return BetOfTheDayResponse(available=False)

    # Determine the predicted outcome
    probs = {
        "Home Win": prediction.home_win_prob or 0,
        "Draw": prediction.draw_prob or 0,
        "Away Win": prediction.away_win_prob or 0,
    }
    predicted_outcome = max(probs, key=probs.get)  # type: ignore[arg-type]

    # Match and related objects already eager-loaded above
    match = prediction.match

    home_name = match.home_team.name if match and match.home_team else None
    away_name = match.away_team.name if match and match.away_team else None
    home_logo = match.home_team.logo_url if match and match.home_team else None
    away_logo = match.away_team.logo_url if match and match.away_team else None
    league_name = match.league.name if match and match.league else None

    # Explanation already eager-loaded via selectin default on model
    explanation = None
    if prediction.explanation:
        explanation = prediction.explanation.summary

    # v6.2: pull the latest pre-match odds for this match using the same
    # helper the fixtures endpoints use. Yields None when no odds row is
    # on file — the frontend renders nothing in that case (no placeholder).
    botd_odds: BOTDOdds | None = None
    try:
        from app.api.routes.fixtures import _load_latest_odds  # noqa: WPS433
        odds_map = await _load_latest_odds([prediction.match_id], db)
        summary = odds_map.get(prediction.match_id)
        if summary is not None:
            botd_odds = BOTDOdds(
                home=summary.home,
                draw=summary.draw,
                away=summary.away,
                over_2_5=summary.over_2_5,
                under_2_5=summary.under_2_5,
                bookmaker=summary.bookmaker,
                fetched_at=summary.fetched_at,
            )
    except Exception as exc:  # pragma: no cover — odds are nice-to-have
        logger.debug("BOTD odds fetch failed (non-fatal): %s", exc)

    # v8.1 tier labelling for the chosen pick
    pick_tier_slug = None
    pick_tier_label_str = None
    pick_tier_accuracy_str = None
    if TIER_SYSTEM_ENABLED:
        tier_row = await db.execute(
            select(pick_tier_expression())
            .select_from(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(Prediction.id == prediction.id)
        )
        pt = tier_row.scalar_one_or_none()
        if pt is not None:
            info = tier_info(int(pt))
            pick_tier_slug = info["pick_tier"]
            pick_tier_label_str = info["pick_tier_label"]
            pick_tier_accuracy_str = info["pick_tier_accuracy"]

    # v8.2 top-3 feature drivers — cheap dict scoring vs hand-picked priors.
    from app.services.pick_drivers import compute_top_drivers
    drivers_raw = compute_top_drivers(getattr(prediction, "features_snapshot", None))
    botd_drivers = (
        [BOTDDriver(**d) for d in drivers_raw] if drivers_raw else None
    )

    return BetOfTheDayResponse(
        available=True,
        match_id=str(prediction.match_id),
        home_team=home_name,
        away_team=away_name,
        home_team_logo=home_logo,
        away_team_logo=away_logo,
        league=league_name,
        scheduled_at=match.scheduled_at.isoformat() if match else None,
        home_win_prob=prediction.home_win_prob,
        draw_prob=prediction.draw_prob,
        away_win_prob=prediction.away_win_prob,
        confidence=prediction.confidence,
        predicted_outcome=predicted_outcome,
        explanation_summary=explanation,
        prediction_id=str(prediction.id),
        odds=botd_odds,
        pick_tier=pick_tier_slug,
        pick_tier_label=pick_tier_label_str,
        pick_tier_accuracy=pick_tier_accuracy_str,
        top_drivers=botd_drivers,
    )
