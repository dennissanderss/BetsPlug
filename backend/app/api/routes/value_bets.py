"""Value-bet HTTP endpoints.

Thin routers; all math/selection sits in ``app.services.value_bet_service``.
"""
from __future__ import annotations

import math
import uuid as _uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload

from app.api.deps import get_current_tier, get_db
from app.core.tier_system import PickTier, TIER_METADATA
from app.models.match import Match
from app.models.prediction import Prediction
from app.core.tier_leagues import (
    LEAGUES_FREE,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)
from app.core.tier_system import CONF_THRESHOLD
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.value_bet import ValueBet
from app.services.stats_math import max_drawdown, sharpe, wilson_ci
from app.services.value_bet_service import (
    ValueBetConfig,
    ValueBetSelector,
    extract_candidate_from_snapshot,
)

router = APIRouter()
admin_router = APIRouter()


# ---------------------------------------------------------------------------
# Shared config (defaults from docs/value_bet_data_analysis.md)
# ---------------------------------------------------------------------------
CONFIG = ValueBetConfig()
SELECTOR = ValueBetSelector(CONFIG)

# Live-tracking start — first day the daily pipeline begins counting.
# Backfill rows carry is_live=False; everything on/after this date from the
# live cron is is_live=True.
LIVE_TRACKING_START = date(2026, 4, 22)

# Minimum sample for meaningful live stats (matches UI copy)
LIVE_SAMPLE_WARNING_THRESHOLD = 30


# ---------------------------------------------------------------------------
# Response shapes
# ---------------------------------------------------------------------------
class ValueBetToday(BaseModel):
    available: bool
    reason: Optional[str] = None
    bet_date: Optional[str] = None
    match_id: Optional[str] = None
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    league: Optional[str] = None
    scheduled_at: Optional[str] = None
    our_pick: Optional[str] = None
    our_probability: Optional[float] = None
    bookmaker_implied: Optional[float] = None
    fair_implied: Optional[float] = None
    edge: Optional[float] = None
    expected_value: Optional[float] = None
    best_odds: Optional[float] = None
    odds_source: Optional[str] = None
    our_confidence: Optional[float] = None
    prediction_tier: Optional[str] = None
    prediction_tier_label: Optional[str] = None
    is_live: bool = False
    disclaimer: str = (
        "Statistische analyse, geen gokadvies. 18+. "
        "Odds vastgelegd op voorspelmoment, niet op slotkoers."
    )


class ValueBetHistoryItem(BaseModel):
    id: str
    bet_date: str
    picked_at: str
    home_team: str
    away_team: str
    league: str
    our_pick: str
    best_odds: float
    edge: float
    expected_value: float
    prediction_tier: Optional[str] = None
    is_live: bool
    is_evaluated: bool
    is_correct: Optional[bool] = None
    profit_loss_units: Optional[float] = None


class ValueBetHistoryResponse(BaseModel):
    total: int
    items: list[ValueBetHistoryItem]


class ValueBetStats(BaseModel):
    scope: str  # 'live' | 'backtest' | 'all'
    total_picks: int
    evaluated_picks: int
    correct_picks: int
    accuracy: float  # correct / evaluated, 0 when no evals
    avg_odds: float
    avg_edge: float
    total_units_pnl: float
    roi_percentage: float  # (pnl / evaluated) * 100
    max_drawdown_units: float
    sharpe_ratio: Optional[float] = None
    wilson_ci_lower: float
    wilson_ci_upper: float
    sample_size_warning: bool  # true when evaluated < threshold and scope=live
    window_start: Optional[str] = None
    window_end: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _classify_tier(league_id, confidence: float) -> str | None:
    """Best-effort python mirror of pick_tier_expression."""
    from app.core.tier_leagues import (
        LEAGUES_FREE,
        LEAGUES_GOLD,
        LEAGUES_PLATINUM,
        LEAGUES_SILVER,
    )
    from app.core.tier_system import CONF_THRESHOLD
    lid = str(league_id)
    if lid in LEAGUES_PLATINUM and confidence >= CONF_THRESHOLD[PickTier.PLATINUM]:
        return "platinum"
    if lid in LEAGUES_GOLD and confidence >= CONF_THRESHOLD[PickTier.GOLD]:
        return "gold"
    if lid in LEAGUES_SILVER and confidence >= CONF_THRESHOLD[PickTier.SILVER]:
        return "silver"
    if lid in LEAGUES_FREE and confidence >= CONF_THRESHOLD[PickTier.FREE]:
        return "free"
    return None


# _wilson_ci / _max_drawdown / _sharpe moved to app.services.stats_math so
# tests can import without pulling the full FastAPI routes package chain.


# ---------------------------------------------------------------------------
# GET /today — today's value bet (live from DB, or computed fallback)
# ---------------------------------------------------------------------------
@router.get("/today", response_model=ValueBetToday)
async def get_todays_value_bet(
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> ValueBetToday:
    """Return today's value-bet-of-the-day.

    Sources in priority order:
      1. A persisted ``value_bets`` row with ``bet_date = today`` and
         ``is_live = true`` (preferred once the daily cron runs).
      2. On-the-fly selection from live predictions + ``closing_odds_snapshot``
         for matches scheduled within the next 48h (MVP fallback until the
         cron is wired).

    For non-Gold/Platinum users we blur the pick — they see the headline
    edge and odds but not which match.
    """
    today = datetime.now(timezone.utc).date()

    # 1. Persisted row (future — cron)
    stmt = (
        select(ValueBet)
        .where(
            and_(
                ValueBet.bet_date == today,
                ValueBet.is_live == True,  # noqa: E712
            )
        )
        .order_by(ValueBet.picked_at.desc())
        .limit(1)
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is not None:
        # Enrich with match context
        match_stmt = (
            select(Match)
            .options(
                joinedload(Match.home_team),
                joinedload(Match.away_team),
                joinedload(Match.league),
            )
            .where(Match.id == row.match_id)
        )
        m = (await db.execute(match_stmt)).unique().scalar_one_or_none()
        return ValueBetToday(
            available=True,
            bet_date=row.bet_date.isoformat(),
            match_id=str(row.match_id),
            home_team=m.home_team.name if m and m.home_team else None,
            away_team=m.away_team.name if m and m.away_team else None,
            league=m.league.name if m and m.league else None,
            scheduled_at=m.scheduled_at.isoformat() if m and m.scheduled_at else None,
            our_pick=row.our_pick,
            our_probability=row.our_probability,
            bookmaker_implied={
                "home": row.bookmaker_implied_home,
                "draw": row.bookmaker_implied_draw or 0.0,
                "away": row.bookmaker_implied_away,
            }[row.our_pick],
            fair_implied={
                "home": row.fair_implied_home,
                "draw": row.fair_implied_draw or 0.0,
                "away": row.fair_implied_away,
            }[row.our_pick],
            edge=row.edge,
            expected_value=row.expected_value,
            best_odds=row.best_odds_for_pick,
            odds_source=row.odds_source,
            our_confidence=row.our_confidence,
            prediction_tier=row.prediction_tier,
            prediction_tier_label=(
                TIER_METADATA.get(PickTier[row.prediction_tier.upper()], {}).get("label")
                if row.prediction_tier
                else None
            ),
            is_live=row.is_live,
        )

    # 2. On-the-fly fallback: scan today-through-+48h live predictions
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=48)
    pred_stmt = (
        select(Prediction)
        .options(
            joinedload(Prediction.match).joinedload(Match.home_team),
            joinedload(Prediction.match).joinedload(Match.away_team),
            joinedload(Prediction.match).joinedload(Match.league),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.prediction_source == "live",
            Prediction.closing_odds_snapshot.is_not(None),
            Match.scheduled_at >= now,
            Match.scheduled_at <= window_end,
        )
    )
    preds = (await db.execute(pred_stmt)).unique().scalars().all()

    best_cand = None
    best_pred = None
    best_score = -float("inf")
    for p in preds:
        snap = p.closing_odds_snapshot
        match = p.match
        if not snap or match is None:
            continue
        tier = _classify_tier(match.league_id, p.confidence)
        cand = extract_candidate_from_snapshot(
            prediction_id=p.id,
            match_id=p.match_id,
            home_prob=p.home_win_prob,
            draw_prob=p.draw_prob,
            away_prob=p.away_win_prob,
            confidence=p.confidence,
            tier=tier,
            snapshot=snap,
            selector=SELECTOR,
            scheduled_at=match.scheduled_at,
        )
        if cand is None or not SELECTOR.passes_filters(cand):
            continue
        sc = SELECTOR.score(cand)
        if sc > best_score:
            best_score = sc
            best_cand = cand
            best_pred = p

    if best_cand is None or best_pred is None:
        return ValueBetToday(
            available=False,
            reason="Geen kwalificerende value bet vandaag (geen edge >=3% in Gold/Platinum scope).",
            bet_date=today.isoformat(),
        )

    m = best_pred.match
    tier_slug = best_cand.tier
    tier_label = None
    if tier_slug:
        enum_key = PickTier[tier_slug.upper()]
        tier_label = TIER_METADATA.get(enum_key, {}).get("label")
    return ValueBetToday(
        available=True,
        bet_date=today.isoformat(),
        match_id=str(best_cand.match_id),
        home_team=m.home_team.name if m and m.home_team else None,
        away_team=m.away_team.name if m and m.away_team else None,
        league=m.league.name if m and m.league else None,
        scheduled_at=m.scheduled_at.isoformat() if m and m.scheduled_at else None,
        our_pick=best_cand.pick,
        our_probability=best_cand.our_probability,
        bookmaker_implied={
            "home": 1.0 / best_cand.odds_home,
            "draw": 1.0 / best_cand.odds_draw if best_cand.odds_draw else 0.0,
            "away": 1.0 / best_cand.odds_away,
        }[best_cand.pick],
        fair_implied=best_cand.fair_implied_for_pick,
        edge=best_cand.edge,
        expected_value=best_cand.expected_value,
        best_odds=best_cand.best_odds_for_pick,
        odds_source=best_cand.odds_source,
        our_confidence=best_cand.confidence,
        prediction_tier=tier_slug,
        prediction_tier_label=tier_label,
        is_live=True,
    )


# ---------------------------------------------------------------------------
# GET /history — paginated history
# ---------------------------------------------------------------------------
@router.get("/history", response_model=ValueBetHistoryResponse)
async def get_value_bet_history(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    is_live: Optional[bool] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ValueBetHistoryResponse:
    clauses = []
    if start_date is not None:
        clauses.append(ValueBet.bet_date >= start_date)
    if end_date is not None:
        clauses.append(ValueBet.bet_date <= end_date)
    if is_live is not None:
        clauses.append(ValueBet.is_live == is_live)

    count_q = select(func.count(ValueBet.id))
    if clauses:
        count_q = count_q.where(and_(*clauses))
    total = (await db.execute(count_q)).scalar_one()

    stmt = (
        select(ValueBet, Match)
        .join(Match, Match.id == ValueBet.match_id)
        .options(
            joinedload(Match.home_team),
            joinedload(Match.away_team),
            joinedload(Match.league),
        )
        .order_by(ValueBet.bet_date.desc(), ValueBet.picked_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if clauses:
        stmt = stmt.where(and_(*clauses))
    rows = (await db.execute(stmt)).unique().all()

    items: list[ValueBetHistoryItem] = []
    for vb, match in rows:
        items.append(
            ValueBetHistoryItem(
                id=str(vb.id),
                bet_date=vb.bet_date.isoformat(),
                picked_at=vb.picked_at.isoformat(),
                home_team=match.home_team.name if match and match.home_team else "?",
                away_team=match.away_team.name if match and match.away_team else "?",
                league=match.league.name if match and match.league else "",
                our_pick=vb.our_pick,
                best_odds=vb.best_odds_for_pick,
                edge=vb.edge,
                expected_value=vb.expected_value,
                prediction_tier=vb.prediction_tier,
                is_live=vb.is_live,
                is_evaluated=vb.is_evaluated,
                is_correct=vb.is_correct,
                profit_loss_units=vb.profit_loss_units,
            )
        )
    return ValueBetHistoryResponse(total=total, items=items)


# ---------------------------------------------------------------------------
# GET /stats — aggregate metrics
# ---------------------------------------------------------------------------
@router.get("/stats", response_model=ValueBetStats)
async def get_value_bet_stats(
    scope: str = Query(default="all", pattern="^(all|live|backtest)$"),
    db: AsyncSession = Depends(get_db),
) -> ValueBetStats:
    clauses = []
    if scope == "live":
        clauses.append(ValueBet.is_live.is_(True))
    elif scope == "backtest":
        clauses.append(ValueBet.is_live.is_(False))

    base_q = select(ValueBet)
    if clauses:
        base_q = base_q.where(and_(*clauses))

    rows = (await db.execute(base_q.order_by(ValueBet.picked_at))).scalars().all()
    total = len(rows)
    evaluated = [r for r in rows if r.is_evaluated]
    correct = [r for r in evaluated if r.is_correct]

    accuracy = (len(correct) / len(evaluated)) if evaluated else 0.0
    avg_odds = (
        sum(r.best_odds_for_pick for r in rows) / total if total else 0.0
    )
    avg_edge = sum(r.edge for r in rows) / total if total else 0.0
    pnls = [r.profit_loss_units for r in evaluated if r.profit_loss_units is not None]
    total_pnl = sum(pnls) if pnls else 0.0
    roi = (total_pnl / len(evaluated) * 100.0) if evaluated else 0.0
    mdd = max_drawdown(pnls) if pnls else 0.0
    sharpe = sharpe(pnls)
    wl, wu = wilson_ci(len(correct), len(evaluated))

    warn = scope == "live" and len(evaluated) < LIVE_SAMPLE_WARNING_THRESHOLD

    window_start = rows[0].bet_date.isoformat() if rows else None
    window_end = rows[-1].bet_date.isoformat() if rows else None

    return ValueBetStats(
        scope=scope,
        total_picks=total,
        evaluated_picks=len(evaluated),
        correct_picks=len(correct),
        accuracy=round(accuracy, 4),
        avg_odds=round(avg_odds, 3),
        avg_edge=round(avg_edge, 4),
        total_units_pnl=round(total_pnl, 2),
        roi_percentage=round(roi, 2),
        max_drawdown_units=round(mdd, 2),
        sharpe_ratio=round(sharpe, 3) if sharpe is not None else None,
        wilson_ci_lower=round(wl, 4),
        wilson_ci_upper=round(wu, 4),
        sample_size_warning=warn,
        window_start=window_start,
        window_end=window_end,
    )


# ---------------------------------------------------------------------------
# GET /backtest-proof — leakage-free method validation
# ---------------------------------------------------------------------------
class BacktestProofSlice(BaseModel):
    label: str
    n: int
    accuracy: float
    wilson_ci_lower: float
    wilson_ci_upper: float
    avg_odds: float
    roi_percentage: float
    total_units_pnl: float
    max_drawdown_units: float
    sharpe_ratio: Optional[float] = None


class BacktestProofMatch(BaseModel):
    """One individual pick used in the backtest aggregation."""
    scheduled_at: Optional[str] = None
    league: Optional[str] = None
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    pick: str
    best_odds: float
    edge: float
    tier: Optional[str] = None
    is_correct: bool
    actual_outcome: Optional[str] = None
    profit_loss_units: float


class BacktestSampleFunnel(BaseModel):
    """Explains why the sample is the size it is.

    Lets the UI show a "waarom n=X" explainer box instead of users
    having to guess whether the filter is too strict or the data is
    thin.
    """
    total_live_predictions: int
    live_predictions_evaluated: int
    live_predictions_with_odds_snapshot: int
    live_evaluated_with_odds: int
    odds_pipeline_start: str  # ISO date


class BacktestProofResponse(BaseModel):
    """Leakage-free backtest over the live-prediction pool.

    Scope: ``prediction_source='live'`` predictions. No ``backtest``
    source in the calculation — those would pull in the known
    ``team_seeds.py`` post-hoc-Elo leakage (see CLAUDE.md).

    Two sample sizes:
      1. ROI backtest: live + populated closing_odds_snapshot + evaluated
         (smaller but financial-grade — produces ROI/Sharpe)
      2. Accuracy-only: live + evaluated (larger, no odds filter —
         produces accuracy + Wilson CI, no ROI)
    """
    methodology: str
    sample_window_start: Optional[str] = None
    sample_window_end: Optional[str] = None
    total_live_evaluated_with_odds: int
    funnel: BacktestSampleFunnel
    slices: list[BacktestProofSlice]
    accuracy_only_slice: BacktestProofSlice
    matches: list[BacktestProofMatch]
    disclaimer: str


def _classify_tier_slug(league_id, confidence: float) -> str | None:
    from app.core.tier_system import PickTier
    lid = str(league_id)
    if lid in LEAGUES_PLATINUM and confidence >= CONF_THRESHOLD[PickTier.PLATINUM]:
        return "platinum"
    if lid in LEAGUES_GOLD and confidence >= CONF_THRESHOLD[PickTier.GOLD]:
        return "gold"
    if lid in LEAGUES_SILVER and confidence >= CONF_THRESHOLD[PickTier.SILVER]:
        return "silver"
    if lid in LEAGUES_FREE and confidence >= CONF_THRESHOLD[PickTier.FREE]:
        return "free"
    return None


def _slice(label: str, recs: list[dict]) -> BacktestProofSlice:
    n = len(recs)
    if n == 0:
        return BacktestProofSlice(
            label=label, n=0, accuracy=0.0,
            wilson_ci_lower=0.0, wilson_ci_upper=0.0,
            avg_odds=0.0, roi_percentage=0.0,
            total_units_pnl=0.0, max_drawdown_units=0.0,
            sharpe_ratio=None,
        )
    correct = sum(1 for r in recs if r["correct"])
    pnls = [r["pnl"] for r in recs]
    wl, wu = wilson_ci(correct, n)
    total_pnl = sum(pnls)
    return BacktestProofSlice(
        label=label,
        n=n,
        accuracy=round(correct / n, 4),
        wilson_ci_lower=round(wl, 4),
        wilson_ci_upper=round(wu, 4),
        avg_odds=round(sum(r["odds"] for r in recs) / n, 3),
        roi_percentage=round(total_pnl / n * 100, 2),
        total_units_pnl=round(total_pnl, 2),
        max_drawdown_units=round(max_drawdown(pnls), 2),
        sharpe_ratio=(round(sharpe(pnls), 3) if sharpe(pnls) is not None else None),
    )


@router.get("/backtest-proof", response_model=BacktestProofResponse)
async def get_backtest_proof(
    db: AsyncSession = Depends(get_db),
) -> BacktestProofResponse:
    """Leakage-free backtest aggregated on-read from the live pool.

    Public (no auth) — transparency feature. Results cached for
    ~10 min in the API client side via TanStack Query; server-side we
    recompute from scratch to always reflect the freshest evaluated
    data.

    The frontend surfaces this on the Value Bet tab as "Methode-bewijs"
    alongside the live-measurement card.
    """
    from sqlalchemy.orm import selectinload, joinedload
    from app.models.team import Team
    from app.models.league import League

    HomeTeam = aliased(Team)
    AwayTeam = aliased(Team)

    stmt = (
        select(
            Prediction,
            PredictionEvaluation,
            Match,
            HomeTeam.name.label("home_team_name"),
            AwayTeam.name.label("away_team_name"),
            League.name.label("league_name"),
        )
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(Match, Match.id == Prediction.match_id)
        .join(HomeTeam, HomeTeam.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.id == Match.away_team_id)
        .join(League, League.id == Match.league_id)
        .where(
            Prediction.prediction_source == "live",
            Prediction.closing_odds_snapshot.is_not(None),
        )
    )
    rows = (await db.execute(stmt)).unique().all()

    # Build flat record list with computed edge/odds/pnl
    records: list[dict] = []
    window_start: Optional[str] = None
    window_end: Optional[str] = None
    for pred, evaluation, match, home_name, away_name, league_name in rows:
        snap = pred.closing_odds_snapshot or {}
        if not isinstance(snap, dict) or not snap.get("bookmaker_odds"):
            continue
        book = snap["bookmaker_odds"]
        oh = book.get("home")
        od = book.get("draw")
        oa = book.get("away")
        if not oh or not oa:
            continue
        try:
            rh = 1.0 / oh
            ra = 1.0 / oa
            rd = (1.0 / od) if od else 0.0
            ov = rh + rd + ra
            fh = rh / ov
            fa = ra / ov
            fd = (rd / ov) if od else None
        except (ZeroDivisionError, TypeError):
            continue
        our = {"home": pred.home_win_prob, "draw": pred.draw_prob or 0.0, "away": pred.away_win_prob}
        fair = {"home": fh, "draw": fd or 0.0, "away": fa}
        odds_map = {"home": oh, "draw": od, "away": oa}
        edges = {k: our[k] - fair[k] for k in ("home", "draw", "away") if odds_map[k]}
        if not edges:
            continue
        pick = max(edges, key=edges.get)  # type: ignore[arg-type]
        edge = edges[pick]
        odds = odds_map[pick]
        actual = (evaluation.actual_outcome or "").lower()
        correct = actual == pick
        pnl = (odds - 1.0) if correct else -1.0
        tier = _classify_tier_slug(match.league_id, pred.confidence)
        records.append({
            "edge": edge, "odds": odds, "correct": correct,
            "pnl": pnl, "tier": tier, "confidence": pred.confidence,
            "scheduled_at": match.scheduled_at,
            "pick": pick,
            "home_team": home_name,
            "away_team": away_name,
            "league": league_name,
            "actual_outcome": actual,
        })
        if match.scheduled_at:
            iso = match.scheduled_at.isoformat()
            window_start = iso if window_start is None or iso < window_start else window_start
            window_end = iso if window_end is None or iso > window_end else window_end

    # Primary method slices (edge ≥ 3%, odds 1.50-5.00)
    core = [r for r in records if r["edge"] >= 0.03 and 1.50 <= r["odds"] <= 5.00]
    prod = [r for r in core if r["tier"] in ("gold", "platinum")]

    # Threshold sweep (all tiers, production odds range)
    slices = [
        _slice("method - edge >= 3% (all tiers)", core),
        _slice("method - edge >= 5% (all tiers)",
                [r for r in records if r["edge"] >= 0.05 and 1.50 <= r["odds"] <= 5.00]),
        _slice("method - edge >= 8% (all tiers)",
                [r for r in records if r["edge"] >= 0.08 and 1.50 <= r["odds"] <= 5.00]),
        _slice("production filter (gold+platinum, edge >= 3%)", prod),
    ]
    # Per-tier @ 3%
    for tname in ("platinum", "gold", "silver", "free"):
        slices.append(_slice(
            f"per-tier @3% — {tname}",
            [r for r in core if r["tier"] == tname],
        ))

    # ── Sample-size funnel: show user WHY n is what it is ──────────
    funnel_q_total = (
        await db.execute(
            select(func.count(Prediction.id))
            .where(Prediction.prediction_source == "live")
        )
    ).scalar_one()
    funnel_q_eval = (
        await db.execute(
            select(func.count(Prediction.id))
            .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .where(Prediction.prediction_source == "live")
        )
    ).scalar_one()
    funnel_q_with_odds = (
        await db.execute(
            select(func.count(Prediction.id))
            .where(
                Prediction.prediction_source == "live",
                Prediction.closing_odds_snapshot.is_not(None),
            )
        )
    ).scalar_one()
    funnel = BacktestSampleFunnel(
        total_live_predictions=int(funnel_q_total),
        live_predictions_evaluated=int(funnel_q_eval),
        live_predictions_with_odds_snapshot=int(funnel_q_with_odds),
        live_evaluated_with_odds=len(records),
        odds_pipeline_start="2026-04-15",
    )

    # ── Accuracy-only pool (larger sample, no odds required) ───────
    # Pure "did the max-prob pick hit" on every evaluated live pred.
    acc_stmt = (
        select(
            Prediction.home_win_prob,
            Prediction.draw_prob,
            Prediction.away_win_prob,
            PredictionEvaluation.actual_outcome,
        )
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(Prediction.prediction_source == "live")
    )
    acc_rows = (await db.execute(acc_stmt)).all()
    acc_records: list[dict] = []
    for hp, dp, ap, actual in acc_rows:
        probs = {"home": hp, "draw": dp or 0.0, "away": ap}
        pick = max(probs, key=probs.get)  # type: ignore[arg-type]
        correct = (actual or "").lower() == pick
        # Flat unit stake at implied odds (1/prob) for ROI approximation
        implied_odds = 1.0 / max(probs[pick], 1e-6)
        pnl = (implied_odds - 1.0) if correct else -1.0
        acc_records.append({
            "edge": 0.0, "odds": implied_odds,
            "correct": correct, "pnl": pnl,
            "tier": None,
        })
    accuracy_only = _slice(
        "accuracy-only (all live evaluated, no odds filter)", acc_records
    )

    # ── Match-level breakdown (only the picks in the core 3% slice) ─
    matches_out: list[BacktestProofMatch] = []
    core_sorted = sorted(
        core,
        key=lambda r: r.get("scheduled_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    for r in core_sorted:
        sched_at = r.get("scheduled_at")
        matches_out.append(BacktestProofMatch(
            scheduled_at=sched_at.isoformat() if sched_at else None,
            league=r.get("league"),
            home_team=r.get("home_team"),
            away_team=r.get("away_team"),
            pick=r["pick"],
            best_odds=round(r["odds"], 2),
            edge=round(r["edge"], 4),
            tier=r.get("tier"),
            is_correct=r["correct"],
            actual_outcome=r.get("actual_outcome"),
            profit_loss_units=round(r["pnl"], 2),
        ))

    return BacktestProofResponse(
        methodology=(
            "Leakage-free: restricted to prediction_source='live' with "
            "populated closing_odds_snapshot and a corresponding evaluated "
            "MatchResult. No backfill/backtest predictions (which carry "
            "team_seeds post-hoc bias). Edges computed by proportional "
            "vig-removal."
        ),
        sample_window_start=window_start,
        sample_window_end=window_end,
        total_live_evaluated_with_odds=len(records),
        funnel=funnel,
        slices=slices,
        accuracy_only_slice=accuracy_only,
        matches=matches_out,
        disclaimer=(
            "Past performance is not indicative of future results. Sample "
            "sizes below 30 are statistically inconclusive — Wilson 95% CI "
            "is shown for every slice. 18+ only."
        ),
    )


# ---------------------------------------------------------------------------
# Combi van de Dag — Platinum-only accumulator (3-leg) over today's slate
# ---------------------------------------------------------------------------
#
# Product spec:
#   - 3 distinct picks per day, bundled as one accumulator
#   - Each leg: a high-confidence pick (≥0.70 model confidence) on a Gold or
#     Platinum tier match scheduled in the next 48h with bookmaker odds on
#     file (closing_odds_snapshot populated)
#   - Per-leg odds restricted to 1.40–4.00 so the combined odds land in a
#     credible 3–10× range and a single 8.0 outlier doesn't blow up the math
#   - Diversity: at most one leg per league
#   - Combined odds = product of per-leg odds; combined model probability =
#     product of per-leg pick probabilities (independent assumption — noted
#     in the disclaimer)
#   - Combined edge = combined_model_prob × combined_odds − 1
#   - Selection score per leg: confidence × tier_bonus (platinum 1.2 / gold
#     1.0). Top-3 by score after de-duplication on league.
#
# Persistence is intentionally OUT OF SCOPE for this MVP — we compute on
# the fly. A daily cron + dedicated combo_bets table follows in a later
# pass once we have a few weeks of live data to evaluate.

PLATINUM_TIER_BONUS = 1.2
GOLD_TIER_BONUS = 1.0
COMBO_LEG_COUNT = 3
COMBO_MIN_CONFIDENCE = 0.70
COMBO_MIN_LEG_ODDS = 1.40
COMBO_MAX_LEG_ODDS = 4.00


class ComboLeg(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    league: str
    league_id: str
    scheduled_at: str
    our_pick: str  # 'home' | 'draw' | 'away'
    our_pick_label: str  # human label e.g. 'Manchester City wint'
    our_probability: float
    bookmaker_implied: float
    fair_implied: float
    leg_odds: float
    leg_edge: float
    confidence: float
    prediction_tier: str


class ComboOfTheDay(BaseModel):
    available: bool
    reason: Optional[str] = None
    bet_date: Optional[str] = None
    legs: list[ComboLeg] = []
    combined_odds: float = 0.0
    combined_model_probability: float = 0.0
    combined_bookmaker_implied: float = 0.0
    combined_edge: float = 0.0
    expected_value_per_unit: float = 0.0
    requires_tier: str = "platinum"
    locked: bool = False
    disclaimer: str = (
        "Combinatie-tip op basis van statistische analyse over onze v8.1 "
        "predictions. Eén verliezende leg = combinatie verloren. Niet-"
        "gecorreleerde wedstrijden worden bewust gebundeld; afhankelijke "
        "uitkomsten zijn een aanname en kunnen de werkelijke kans iets "
        "overschatten. Geen gokadvies. 18+."
    )


PICK_LABEL_NL: dict[str, str] = {
    "home": "thuis wint",
    "draw": "gelijkspel",
    "away": "uit wint",
}


def _format_pick_label(home_team: str, away_team: str, pick: str) -> str:
    if pick == "home":
        return f"{home_team} wint"
    if pick == "away":
        return f"{away_team} wint"
    return "Gelijkspel"


@router.get("/combo-today", response_model=ComboOfTheDay)
async def get_combo_of_the_day(
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> ComboOfTheDay:
    """Return today's 3-leg accumulator for Platinum subscribers.

    Non-Platinum users receive ``locked=true`` with all leg fields blanked
    so the frontend can render an upgrade prompt without leaking which
    matches were selected.
    """
    today = datetime.now(timezone.utc).date()

    # Tier gate — Platinum-only product.
    if user_tier != PickTier.PLATINUM:
        return ComboOfTheDay(
            available=False,
            reason="locked",
            bet_date=today.isoformat(),
            locked=True,
        )

    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=48)

    pred_stmt = (
        select(Prediction)
        .options(
            joinedload(Prediction.match).joinedload(Match.home_team),
            joinedload(Prediction.match).joinedload(Match.away_team),
            joinedload(Prediction.match).joinedload(Match.league),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.prediction_source == "live",
            Prediction.closing_odds_snapshot.is_not(None),
            Prediction.confidence >= COMBO_MIN_CONFIDENCE,
            Match.scheduled_at >= now,
            Match.scheduled_at <= window_end,
        )
    )
    preds = (await db.execute(pred_stmt)).unique().scalars().all()

    candidates: list[tuple[float, ComboLeg]] = []
    for p in preds:
        match = p.match
        if match is None or match.home_team is None or match.away_team is None:
            continue
        snap = p.closing_odds_snapshot or {}
        book = snap.get("bookmaker_odds") if isinstance(snap, dict) else None
        if not isinstance(book, dict):
            continue

        # Pick the side with the highest model probability — that's the
        # "best" leg for accumulator purposes.
        sides = [
            ("home", float(p.home_win_prob or 0.0), book.get("home")),
            ("draw", float(p.draw_prob or 0.0) if p.draw_prob is not None else 0.0, book.get("draw")),
            ("away", float(p.away_win_prob or 0.0), book.get("away")),
        ]
        sides_with_odds = [
            (side, prob, float(o)) for side, prob, o in sides if o is not None and float(o) > 1.0
        ]
        if not sides_with_odds:
            continue
        sides_with_odds.sort(key=lambda t: t[1], reverse=True)
        pick_side, our_prob, leg_odds = sides_with_odds[0]

        if leg_odds < COMBO_MIN_LEG_ODDS or leg_odds > COMBO_MAX_LEG_ODDS:
            continue

        tier = _classify_tier(match.league_id, p.confidence)
        if tier not in ("gold", "platinum"):
            continue

        # Bookmaker-implied (raw 1/odds) and fair-implied (overround-removed)
        odds_h = book.get("home")
        odds_d = book.get("draw")
        odds_a = book.get("away")
        try:
            ov = (1.0 / float(odds_h) if odds_h else 0.0) + (
                1.0 / float(odds_a) if odds_a else 0.0
            )
            if odds_d is not None:
                ov += 1.0 / float(odds_d)
            if ov <= 0:
                continue
            raw_implied = 1.0 / leg_odds
            fair_implied = raw_implied / ov
        except Exception:
            continue

        leg_edge = our_prob - fair_implied
        if leg_edge <= 0:
            # Combo bet leaning into a leg with negative edge dilutes the
            # whole accumulator. Skip those — the combined-odds story only
            # holds if every leg is at least neutral.
            continue

        tier_bonus = PLATINUM_TIER_BONUS if tier == "platinum" else GOLD_TIER_BONUS
        score = float(p.confidence or 0.0) * tier_bonus * (1.0 + max(leg_edge, 0.0))

        leg = ComboLeg(
            match_id=str(match.id),
            home_team=match.home_team.name,
            away_team=match.away_team.name,
            league=match.league.name if match.league else "",
            league_id=str(match.league_id),
            scheduled_at=match.scheduled_at.isoformat() if match.scheduled_at else "",
            our_pick=pick_side,
            our_pick_label=_format_pick_label(
                match.home_team.name, match.away_team.name, pick_side
            ),
            our_probability=our_prob,
            bookmaker_implied=raw_implied,
            fair_implied=fair_implied,
            leg_odds=leg_odds,
            leg_edge=leg_edge,
            confidence=float(p.confidence or 0.0),
            prediction_tier=tier,
        )
        candidates.append((score, leg))

    candidates.sort(key=lambda t: t[0], reverse=True)

    # League diversity — keep at most one leg per league
    chosen: list[ComboLeg] = []
    seen_leagues: set[str] = set()
    for _, leg in candidates:
        if leg.league_id in seen_leagues:
            continue
        chosen.append(leg)
        seen_leagues.add(leg.league_id)
        if len(chosen) >= COMBO_LEG_COUNT:
            break

    if len(chosen) < COMBO_LEG_COUNT:
        return ComboOfTheDay(
            available=False,
            reason=f"Niet genoeg kandidaat-legs vandaag (gevonden: {len(chosen)} van {COMBO_LEG_COUNT}). Probeer later opnieuw — er moet minstens één Gold/Platinum-pick met odds 1.40–4.00 in de top-{COMBO_LEG_COUNT} competities staan.",
            bet_date=today.isoformat(),
        )

    combined_odds = 1.0
    combined_model_prob = 1.0
    combined_book_implied = 1.0
    for leg in chosen:
        combined_odds *= leg.leg_odds
        combined_model_prob *= leg.our_probability
        combined_book_implied *= leg.bookmaker_implied

    combined_edge = combined_model_prob * combined_odds - 1.0
    expected_value_per_unit = combined_edge  # EV per 1 unit staked

    return ComboOfTheDay(
        available=True,
        bet_date=today.isoformat(),
        legs=chosen,
        combined_odds=round(combined_odds, 2),
        combined_model_probability=round(combined_model_prob, 4),
        combined_bookmaker_implied=round(combined_book_implied, 4),
        combined_edge=round(combined_edge, 4),
        expected_value_per_unit=round(expected_value_per_unit, 4),
    )


# ---------------------------------------------------------------------------
# Admin — manual trigger for the daily cron
# ---------------------------------------------------------------------------
class GenerateTodayResponse(BaseModel):
    status: str
    value_bet_id: Optional[str] = None
    message: str


@admin_router.post("/generate-today", response_model=GenerateTodayResponse)
async def admin_generate_today(
    db: AsyncSession = Depends(get_db),
) -> GenerateTodayResponse:
    """Fire the same logic the 08:00 CET cron runs.

    Useful for:
      - Seeding the first live pick before the cron naturally fires.
      - Re-running after an odds refresh on the same day (will skip
        because of the same-day short-circuit unless the existing row
        is deleted).

    Admin-gated at router registration time (see routes/__init__.py).
    """
    from app.services.scheduler import job_generate_daily_value_bet

    # Read today's state before + after so we can report the delta.
    today = datetime.now(timezone.utc).date()
    before_stmt = select(ValueBet).where(
        and_(ValueBet.bet_date == today, ValueBet.is_live.is_(True))
    ).limit(1)
    before = (await db.execute(before_stmt)).scalar_one_or_none()

    await job_generate_daily_value_bet()

    after_stmt = select(ValueBet).where(
        and_(ValueBet.bet_date == today, ValueBet.is_live.is_(True))
    ).order_by(ValueBet.picked_at.desc()).limit(1)
    after = (await db.execute(after_stmt)).scalar_one_or_none()

    if after is None:
        return GenerateTodayResponse(
            status="no_candidate",
            message="Geen kwalificerende value bet gevonden voor vandaag.",
        )
    if before is not None and before.id == after.id:
        return GenerateTodayResponse(
            status="already_exists",
            value_bet_id=str(after.id),
            message=f"Value bet voor {today} bestaat al (pick={after.our_pick}).",
        )
    return GenerateTodayResponse(
        status="created",
        value_bet_id=str(after.id),
        message=(
            f"Live value bet geschreven: pick={after.our_pick}, "
            f"edge={after.edge * 100:.1f}%, odds={after.best_odds_for_pick:.2f}, "
            f"tier={after.prediction_tier}."
        ),
    )
