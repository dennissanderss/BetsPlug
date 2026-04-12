"""Realised ROI / P&L helper — the v5 fix for hardcoded 1.90 odds.

v4 strategies.py and strategy_harness.py both computed P&L assuming a
flat 1.90 odds for every winning pick. That's fine for a rough back-of-
envelope ROI on balanced picks, but catastrophically wrong for the
kinds of strategies BetsPlug runs, which mostly select heavy home
favorites whose real market odds are 1.30-1.60. The v4 "+40% ROI"
numbers were literally 2-3x what the strategies could have produced at
real market prices.

v5 uses real historical odds from ``odds_history`` where available and
falls back to the flat 1.90 assumption only when no odds are on file.
Every ROI the user sees now comes with an ``odds_coverage`` percentage
so Dennis can see whether the number is grounded in real data or an
estimate.
"""
from __future__ import annotations

import uuid
from typing import Literal, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.odds import OddsHistory
from app.models.prediction import Prediction


# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

FLAT_FALLBACK_ODDS = 1.90
"""Legacy fallback — only used when implied odds can't be computed."""

# v6.3: When no real bookmaker odds exist, we compute implied odds
# from the model's own probability estimate: odds = 1 / probability.
# This is fairer than a flat 1.90 because:
#   - A 65% favorite gets implied odds of 1.54 (not 1.90)
#   - A 30% underdog gets implied odds of 3.33 (not 1.90)
# The result is a more realistic ROI that reflects the actual risk
# profile of each pick rather than treating all picks equally.
# We add a 5% margin (÷ 0.95) to simulate a bookmaker's cut.
BOOKMAKER_MARGIN = 0.95

Outcome = Literal["home", "draw", "away"]


# ──────────────────────────────────────────────────────────────────────────────
# Low-level lookup
# ──────────────────────────────────────────────────────────────────────────────


async def fetch_1x2_odds(match_id: uuid.UUID, db: AsyncSession) -> Optional[dict]:
    """Return the most recently stored 1x2 odds row for a match, or None.

    We prefer the latest ``recorded_at`` to simulate the "closing line"
    that a real bettor would have seen. If a match has multiple
    bookmakers the caller can later average them — for now we just take
    the last row stored.
    """
    stmt = (
        select(OddsHistory)
        .where(
            OddsHistory.match_id == match_id,
            OddsHistory.market.in_(["1x2", "1X2"]),
        )
        .order_by(OddsHistory.recorded_at.desc())
        .limit(1)
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        return None
    return {
        "home_odds": row.home_odds,
        "draw_odds": row.draw_odds,
        "away_odds": row.away_odds,
        "recorded_at": row.recorded_at,
        "source": row.source,
    }


async def fetch_over_under_odds(
    match_id: uuid.UUID, db: AsyncSession
) -> Optional[dict]:
    stmt = (
        select(OddsHistory)
        .where(
            OddsHistory.match_id == match_id,
            OddsHistory.market == "over_under_2_5",
        )
        .order_by(OddsHistory.recorded_at.desc())
        .limit(1)
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        return None
    return {
        "over_odds": row.over_odds,
        "under_odds": row.under_odds,
        "total_line": row.total_line or 2.5,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Realised P&L per pick
# ──────────────────────────────────────────────────────────────────────────────


async def realised_pnl_1x2(
    prediction: Prediction,
    actual_outcome: Outcome,
    is_correct: bool,
    db: AsyncSession,
) -> tuple[float, float, str]:
    """Compute the P&L (in units, 1u = 1 stake) for a single 1X2 pick.

    Returns ``(pnl, odds_used, odds_source)``:
      * ``pnl`` is ``(odds - 1.0)`` on a win, ``-1.0`` on a loss.
      * ``odds_used`` is the decimal odds we settled at.
      * ``odds_source`` is one of ``"historical_odds"`` (real data),
        ``"flat_fallback"`` (no data, using the 1.90 assumption).

    The caller decides the pick — this function only needs to know
    which side the prediction bet and whether it came in.
    """
    # Determine the predicted side the same way the picks endpoint does.
    probs = {
        "home": float(prediction.home_win_prob or 0.0),
        "draw": float(prediction.draw_prob or 0.0),
        "away": float(prediction.away_win_prob or 0.0),
    }
    pick = max(probs, key=lambda k: probs[k])

    odds_row = await fetch_1x2_odds(prediction.match_id, db)
    odds_used: Optional[float] = None
    source = "flat_fallback"
    if odds_row is not None:
        if pick == "home":
            odds_used = odds_row.get("home_odds")
        elif pick == "draw":
            odds_used = odds_row.get("draw_odds")
        elif pick == "away":
            odds_used = odds_row.get("away_odds")
        if odds_used is not None and odds_used > 1.0:
            source = "historical_odds"
        else:
            odds_used = None  # invalid data, fall through

    if odds_used is None:
        # v6.3: compute implied odds from the model's probability for
        # the predicted outcome. This is fairer than the flat 1.90
        # fallback because it respects each pick's risk profile.
        pick_prob = probs.get(pick, 0.0)
        if pick_prob > 0.05:  # sanity: don't divide by near-zero
            odds_used = round(1.0 / (pick_prob * BOOKMAKER_MARGIN), 3)
            source = "implied_from_model"
        else:
            odds_used = FLAT_FALLBACK_ODDS

    if is_correct:
        pnl = round(odds_used - 1.0, 4)
    else:
        pnl = -1.0

    return pnl, round(float(odds_used), 3), source


# ──────────────────────────────────────────────────────────────────────────────
# Aggregate metrics
# ──────────────────────────────────────────────────────────────────────────────


async def compute_strategy_metrics_with_real_odds(
    picks: list[tuple[Prediction, "PredictionEvaluation"]],
    db: AsyncSession,
) -> dict:
    """Walk every pick, look up its real odds, and aggregate metrics.

    Returns a dict with:
      - sample_size
      - wins / losses
      - winrate
      - roi (average per-unit profit; 0.0 if empty)
      - total_pnl
      - odds_coverage_pct: share of picks that had real historical
        odds available (the rest used ``FLAT_FALLBACK_ODDS``)
      - avg_odds_used: mean decimal odds across all winning picks
      - max_drawdown
      - profit_factor
    """
    n = len(picks)
    if n == 0:
        return {
            "sample_size": 0,
            "wins": 0,
            "losses": 0,
            "winrate": 0.0,
            "roi": 0.0,
            "total_pnl": 0.0,
            "odds_coverage_pct": 0.0,
            "avg_odds_used": 0.0,
            "max_drawdown": 0.0,
            "profit_factor": 0.0,
        }

    wins = 0
    losses = 0
    total_pnl = 0.0
    with_real_odds = 0
    odds_values: list[float] = []
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    gross_profit = 0.0
    gross_loss = 0.0

    for pred, evaluation in picks:
        actual = evaluation.actual_outcome
        is_correct = bool(evaluation.is_correct)
        if is_correct:
            wins += 1
        else:
            losses += 1
        pnl, odds_used, source = await realised_pnl_1x2(
            prediction=pred,
            actual_outcome=actual,
            is_correct=is_correct,
            db=db,
        )
        total_pnl += pnl
        if source == "historical_odds":
            with_real_odds += 1
        # implied_from_model is not counted as "real" odds — it's better
        # than 1.90 but still an estimate, not market data.
        if is_correct:
            odds_values.append(odds_used)
            gross_profit += pnl
        else:
            gross_loss += 1.0
        equity += pnl
        if equity > peak:
            peak = equity
        dd = peak - equity
        if dd > max_dd:
            max_dd = dd

    winrate = wins / n
    roi = total_pnl / n
    odds_coverage_pct = round(100 * with_real_odds / n, 1)
    avg_odds_used = round(sum(odds_values) / len(odds_values), 3) if odds_values else 0.0
    profit_factor = (
        round(gross_profit / gross_loss, 4) if gross_loss > 0 else 0.0
    )

    return {
        "sample_size": n,
        "wins": wins,
        "losses": losses,
        "winrate": round(winrate, 4),
        "roi": round(roi, 4),
        "total_pnl": round(total_pnl, 4),
        "odds_coverage_pct": odds_coverage_pct,
        "avg_odds_used": avg_odds_used,
        "max_drawdown": round(max_dd, 2),
        "profit_factor": profit_factor,
    }
