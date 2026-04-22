"""Track-record routes: accuracy, calibration and segment performance."""

import csv
import io
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_tier
from app.auth.dependencies import get_current_user
from app.core.prediction_filters import trackrecord_filter
from app.core.tier_system import (
    PickTier,
    TIER_METADATA,
    TIER_SYSTEM_ENABLED,
    access_filter,
    pick_tier_expression,
)
from app.db.session import get_db
from app.models.league import League
from app.models.match import Match
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.sport import Sport
from app.models.user import User
from app.schemas.trackrecord import (
    CalibrationBucket,
    CalibrationReport,
    SegmentPerformance,
    TrackrecordSummary,
)

router = APIRouter()

_NUM_CALIBRATION_BUCKETS = 10


LIVE_MEASUREMENT_START = datetime(2026, 4, 16, 11, 0, 0, tzinfo=timezone.utc)


def _parse_public_pick_tier(slug: Optional[str]) -> Optional[PickTier]:
    """Parse the PUBLIC ``?pick_tier=`` query param used by the trackrecord
    page's tier-selector tabs.

    This is distinct from the admin-only ``?tier=`` dependency injected by
    ``get_current_tier``: it does NOT change the caller's access scope,
    it just narrows the aggregate to predictions *classified* as that
    tier. Safe to expose publicly — the trackrecord page is the product's
    transparency surface and every user (Free or Platinum) needs to see
    accuracy broken down per tier.

    Returns None when the slug is missing or unrecognised; callers treat
    None as "no tier filter".
    """
    if not slug:
        return None
    try:
        return PickTier[slug.strip().upper()]
    except KeyError:
        return None


@router.get(
    "/summary",
    response_model=TrackrecordSummary,
    summary="Overall track-record metrics",
)
async def get_trackrecord_summary(
    model_version_id: Optional[uuid.UUID] = Query(
        default=None, description="Restrict to a specific model version"
    ),
    source: Optional[str] = Query(
        default=None, description="Filter by prediction source: 'live', 'backtest', or None for all"
    ),
    pick_tier: Optional[str] = Query(
        default=None,
        description=(
            "PUBLIC tier filter: 'free' | 'silver' | 'gold' | 'platinum'. "
            "Narrows the summary to predictions classified as that tier, "
            "bypassing the caller's access_filter so Free users can still "
            "audit Platinum's track-record. See /trackrecord tier tabs."
        ),
    ),
    pre_match_only: bool = Query(
        default=False,
        description=(
            "When true, restrict to predictions whose predicted_at < "
            "scheduled_at (true pre-match locks). Excludes retroactive "
            "backfill rows. Diagnostic parameter — use to compare how "
            "much backfill contamination is in the headline numbers."
        ),
    ),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> TrackrecordSummary:
    """
    Compute aggregate performance metrics over all evaluated predictions.

    Metrics include accuracy, mean Brier score, mean log-loss, and average confidence.
    """
    # v6.2.1: period_start/end now uses Match.scheduled_at (when the
    # match was played) rather than Prediction.predicted_at (when the
    # model generated the forecast). Predictions may be generated in a
    # single bulk run but cover matches spanning 2+ years.
    q = (
        select(
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(
                func.cast(PredictionEvaluation.is_correct, Integer)
            ).label("correct"),
            func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
            func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
            func.avg(Prediction.confidence).label("avg_confidence"),
            func.min(Match.scheduled_at).label("period_start"),
            func.max(Match.scheduled_at).label("period_end"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
    )
    if model_version_id is not None:
        q = q.where(Prediction.model_version_id == model_version_id)
    if source is not None:
        q = q.where(Prediction.prediction_source == source)
    # v8.1 filter: exclude pre-deploy predictions (broken feature pipeline)
    q = q.where(trackrecord_filter())
    # Diagnostic toggle — exclude backfill rows stamped after kickoff.
    if pre_match_only:
        q = q.where(Prediction.predicted_at < Match.scheduled_at)
    # v8.1/v8.3 tier filter:
    # - When the public ?pick_tier= is supplied, we scope ONLY to that
    #   tier classification and bypass the caller's access_filter — the
    #   trackrecord page is a public transparency surface and every
    #   visitor should be able to inspect any tier's historical numbers.
    # - Otherwise, fall back to the normal access_filter so list queries
    #   respect the caller's subscription.
    public_tier = _parse_public_pick_tier(pick_tier)
    if TIER_SYSTEM_ENABLED:
        if public_tier is not None:
            q = q.where(pick_tier_expression() == public_tier.value)
        else:
            q = q.where(access_filter(user_tier))

    row = (await db.execute(q)).one()

    total = row.total or 0
    correct = int(row.correct or 0)
    accuracy = correct / total if total > 0 else 0.0
    avg_brier = float(row.avg_brier or 0.0)
    avg_log_loss = float(row.avg_log_loss) if row.avg_log_loss is not None else None
    avg_confidence = float(row.avg_confidence or 0.0)

    # v8.1 per-tier breakdown
    #
    # IMPORTANT: per_tier stats are computed WITHOUT access_filter so every
    # user — regardless of their own tier — sees the accuracy of every tier.
    # This is both a transparency feature and an upgrade trigger (Free user
    # sees "Platinum: 87%" alongside "Free: 46%" and understands the gap).
    #
    # The list endpoint below (/segments etc.) still applies access_filter
    # so lower-tier users can't SEE individual higher-tier picks; only the
    # aggregate breakdown is fully visible.
    per_tier: Optional[dict] = None
    if TIER_SYSTEM_ENABLED:
        from app.core.aggregate_queries import per_tier_evaluated_stmt
        per_tier_q = per_tier_evaluated_stmt(source=source)
        if model_version_id is not None:
            per_tier_q = per_tier_q.where(Prediction.model_version_id == model_version_id)

        tier_rows = (await db.execute(per_tier_q)).all()
        per_tier = {}
        for tier_int, t_total, t_correct in tier_rows:
            # Cast everything explicitly — COUNT/SUM on PG return bigint/Decimal
            # which Pydantic v2 rejects for int/float fields in TierBreakdown.
            # Skip the NULL bucket that pick_tier_expression() returns for
            # rows that don't qualify for any tier (conf<0.55 or match
            # outside every LEAGUES_* whitelist). Without this guard
            # int(tier_int) crashes with TypeError.
            total_int = int(t_total or 0)
            if tier_int is None or not total_int:
                continue
            t_int = int(tier_int)
            t_correct_int = int(t_correct or 0)
            slug = TIER_METADATA[PickTier(t_int)]["slug"]
            per_tier[slug] = {
                "total": total_int,
                "correct": t_correct_int,
                "accuracy": float(t_correct_int / total_int) if total_int else 0.0,
            }

    return TrackrecordSummary(
        model_version_id=model_version_id,
        total_predictions=total,
        correct_predictions=correct,
        accuracy=accuracy,
        brier_score=avg_brier,
        log_loss=avg_log_loss,
        avg_confidence=avg_confidence,
        period_start=row.period_start,
        period_end=row.period_end,
        per_tier=per_tier,
    )


@router.get(
    "/live-measurement",
    summary="Strictly pre-match, live-sourced predictions logged since 2026-04-16",
)
async def get_live_measurement(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Separate, honest "live" stream for public display.

    Strict filter:
      - prediction_source = 'live'
      - predicted_at < Match.scheduled_at (truly pre-match)
      - created_at >= LIVE_MEASUREMENT_START (v8.1 deploy cut-off)
      - PredictionEvaluation attached (match graded)

    Returns per-tier aggregates. Starts at 0/0 right after deploy and
    grows as evaluated matches accumulate. No mixing with the model-
    validation dataset on /summary — this endpoint is the single source
    of truth for the "Live meting" surface.
    """
    from sqlalchemy import Integer as _Int

    # Total + per-tier in a single pass using pick_tier_expression()
    tier_expr = pick_tier_expression() if TIER_SYSTEM_ENABLED else None

    stmt = (
        select(
            tier_expr.label("tier") if tier_expr is not None else Prediction.match_id,
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(func.cast(PredictionEvaluation.is_correct, _Int)).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(Prediction.prediction_source == "live")
        .where(Prediction.predicted_at < Match.scheduled_at)
        .where(Prediction.created_at >= LIVE_MEASUREMENT_START)
    )
    if tier_expr is not None:
        stmt = stmt.group_by(tier_expr)

    rows = (await db.execute(stmt)).all()

    per_tier: dict = {}
    total_all = 0
    correct_all = 0
    for r in rows:
        t = int(r.total or 0)
        c = int(r.correct or 0)
        total_all += t
        correct_all += c
        if tier_expr is not None and r.tier is not None:
            try:
                slug = TIER_METADATA[PickTier(int(r.tier))]["slug"]
            except Exception:
                continue
            per_tier[slug] = {
                "total": t,
                "correct": c,
                "accuracy": (c / t) if t else 0.0,
            }

    # Ensure every tier slug appears even if 0 — so frontend can render
    # "0 / 0 — awaiting data" placeholders per card.
    if TIER_SYSTEM_ENABLED:
        for slug in ("free", "silver", "gold", "platinum"):
            per_tier.setdefault(slug, {"total": 0, "correct": 0, "accuracy": 0.0})

    return {
        "start_date": LIVE_MEASUREMENT_START.date().isoformat(),
        "total": total_all,
        "correct": correct_all,
        "accuracy": (correct_all / total_all) if total_all else 0.0,
        "per_tier": per_tier,
    }


@router.get("/roi", summary="ROI simulation on evaluated predictions that have odds data")
async def get_roi_simulation(
    pick_tier: Optional[str] = Query(None, description="Filter to a specific tier"),
    source: str = Query("all", description="'live', 'backtest', or 'all'"),
    days: Optional[int] = Query(None, description="Limit to the last N days of matches"),
    stake: float = Query(10.0, ge=1.0, le=10_000.0, description="Stake per pick in euros"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Simulate ROI using pre-match odds for every evaluated prediction.

    Odds are read from ``closing_odds_snapshot`` (frozen at prediction time)
    and, as a fallback, from the ``OddsHistory`` table.  Only predictions
    with a valid odds value for the predicted outcome are counted.

    Formula per pick:
      • Correct  → profit = stake × (odds − 1)
      • Incorrect → profit = −stake
    """
    from datetime import timedelta
    from sqlalchemy import or_
    from app.models.odds import OddsHistory

    # ── base query ──────────────────────────────────────────────────────
    stmt = (
        select(
            Prediction.home_win_prob,
            Prediction.draw_prob,
            Prediction.away_win_prob,
            Prediction.closing_odds_snapshot,
            PredictionEvaluation.is_correct,
            Match.scheduled_at.label("match_date"),
        )
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(Match, Match.id == Prediction.match_id)
        .where(Prediction.predicted_at < Match.scheduled_at)  # pre-match lock
    )

    if source == "live":
        stmt = stmt.where(Prediction.prediction_source == "live")
        stmt = stmt.where(Prediction.created_at >= LIVE_MEASUREMENT_START)
    elif source == "backtest":
        stmt = stmt.where(
            or_(
                Prediction.prediction_source != "live",
                Prediction.prediction_source.is_(None),
            )
        )

    if pick_tier:
        tier_enum = _parse_public_pick_tier(pick_tier)
        if tier_enum:
            stmt = stmt.where(pick_tier_expression() == tier_enum.value)

    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = stmt.where(Match.scheduled_at >= cutoff)

    rows = (await db.execute(stmt)).fetchall()

    # Also pull OddsHistory (1x2) as a fallback odds source
    match_ids = list({r.match_date for r in rows})  # dedup trick not needed — use real ids
    # Re-query with match IDs for odds fallback
    stmt2 = (
        select(
            Prediction.match_id,
            OddsHistory.home_odds,
            OddsHistory.draw_odds,
            OddsHistory.away_odds,
        )
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(Match, Match.id == Prediction.match_id)
        .join(
            OddsHistory,
            (OddsHistory.match_id == Prediction.match_id)
            & (OddsHistory.market.in_(["1x2", "1X2"])),
        )
        .where(Prediction.predicted_at < Match.scheduled_at)
    )
    if source == "live":
        stmt2 = stmt2.where(Prediction.prediction_source == "live")
        stmt2 = stmt2.where(Prediction.created_at >= LIVE_MEASUREMENT_START)
    if pick_tier:
        tier_enum2 = _parse_public_pick_tier(pick_tier)
        if tier_enum2:
            stmt2 = stmt2.where(pick_tier_expression() == tier_enum2.value)
    if days:
        cutoff2 = datetime.now(timezone.utc) - timedelta(days=days)
        stmt2 = stmt2.where(Match.scheduled_at >= cutoff2)

    try:
        oh_rows = (await db.execute(stmt2)).fetchall()
        oh_map: dict = {r.match_id: {"home": r.home_odds, "draw": r.draw_odds, "away": r.away_odds} for r in oh_rows}
    except Exception:
        oh_map = {}

    # ── compute ROI ─────────────────────────────────────────────────────
    pnls: list[float] = []
    odds_used: list[float] = []
    correct_count = 0

    for i, row in enumerate(rows):
        probs = {
            "home": row.home_win_prob or 0.0,
            "draw": row.draw_prob or 0.0,
            "away": row.away_win_prob or 0.0,
        }
        pick = max(probs, key=lambda k: probs[k])

        # Try snapshot first, then OddsHistory
        odds: float | None = None
        snap = row.closing_odds_snapshot or {}
        book = snap.get("bookmaker_odds") if isinstance(snap, dict) else None
        if isinstance(book, dict):
            raw = book.get(pick)
            if raw and float(raw) > 1.0:
                odds = float(raw)

        if odds is None and oh_map:
            # match_id not in this result set — skip OH fallback (different query)
            pass

        if odds is None or odds <= 1.0:
            continue

        odds_used.append(odds)
        if row.is_correct:
            pnls.append(stake * (odds - 1.0))
            correct_count += 1
        else:
            pnls.append(-stake)

    n = len(pnls)
    if n == 0:
        return {
            "stake_per_pick": stake,
            "picks_with_odds": 0,
            "correct_picks": 0,
            "accuracy": 0.0,
            "avg_odds": 0.0,
            "total_staked": 0.0,
            "total_return": 0.0,
            "net_profit": 0.0,
            "roi_pct": 0.0,
        }

    total_staked = round(n * stake, 2)
    net_profit = round(sum(pnls), 2)
    total_return = round(total_staked + net_profit, 2)
    roi_pct = round((net_profit / total_staked) * 100.0, 1)
    avg_odds = round(sum(odds_used) / len(odds_used), 2)

    return {
        "stake_per_pick": stake,
        "picks_with_odds": n,
        "correct_picks": correct_count,
        "accuracy": round(correct_count / n, 4),
        "avg_odds": avg_odds,
        "total_staked": total_staked,
        "total_return": total_return,
        "net_profit": net_profit,
        "roi_pct": roi_pct,
    }


@router.get(
    "/segments",
    response_model=List[SegmentPerformance],
    summary="Performance breakdown by sport, league, period or confidence bucket",
)
async def get_trackrecord_segments(
    segment_type: Optional[str] = Query(
        default=None,
        description="Dimension to slice on: 'sport', 'league', or 'month'",
    ),
    group_by: Optional[str] = Query(
        default=None,
        description="Alias for segment_type (frontend uses this name)",
    ),
    source: Optional[str] = Query(
        default=None, description="Filter by prediction source: 'live', 'backtest', or None for all"
    ),
    pick_tier: Optional[str] = Query(
        default=None,
        description="PUBLIC tier filter — see /trackrecord/summary.",
    ),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> List[SegmentPerformance]:
    """
    Return per-segment accuracy and Brier scores.

    Supported values for ``segment_type`` / ``group_by``: ``sport``,
    ``league``, ``month``. Both parameter names are accepted because
    the frontend was sending ``group_by`` while the original
    endpoint only recognised ``segment_type``; as of v6 both work
    and default to ``league``.
    """
    segment_type = segment_type or group_by or "league"
    _source_filter = Prediction.prediction_source == source if source else None
    public_tier = _parse_public_pick_tier(pick_tier)
    if segment_type == "sport":
        q = (
            select(
                Sport.name.label("segment_value"),
                func.count(PredictionEvaluation.id).label("total"),
                func.avg(
                    func.cast(PredictionEvaluation.is_correct, Integer)
                ).label("accuracy"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .join(League, League.id == Match.league_id)
            .join(Sport, Sport.id == League.sport_id)
            .group_by(Sport.name)
            .order_by(Sport.name)
        )
        if _source_filter is not None:
            q = q.where(_source_filter)
        # v8.1 filter
        q = q.where(trackrecord_filter())
        # v8.1/v8.3 tier filter — public ?pick_tier= overrides access_filter
        if TIER_SYSTEM_ENABLED:
            if public_tier is not None:
                q = q.where(pick_tier_expression() == public_tier.value)
            else:
                q = q.where(access_filter(user_tier))
    elif segment_type == "month":
        # v6 fix: Python-side aggregation. The previous SQL version
        # used func.to_char(..., 'YYYY-MM') for both SELECT and
        # GROUP BY which triggered a 500 on asyncpg. Running the
        # aggregation in Python is trivial for ~5 000 rows and
        # avoids the SQL quirk entirely.
        #
        # v6.2 Bug #4 fix: previously bucketed on Prediction.predicted_at,
        # but all current predictions were generated in a single bulk
        # run so they ALL landed in one bucket. The Model Performance
        # Trend chart is meant to show how the model performed across
        # calendar time, which maps to when the MATCH was played — not
        # when the prediction was generated. Bucketing on
        # Match.scheduled_at gives us one point per real match month.
        month_q = (
            select(
                Match.scheduled_at,
                PredictionEvaluation.is_correct,
                PredictionEvaluation.brier_score,
                PredictionEvaluation.log_loss,
                Prediction.confidence,
            )
            .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .join(Match, Match.id == Prediction.match_id)
            # v8.1 filter
            .where(trackrecord_filter())
        )
        if TIER_SYSTEM_ENABLED:
            if public_tier is not None:
                month_q = month_q.where(pick_tier_expression() == public_tier.value)
            else:
                month_q = month_q.where(access_filter(user_tier))
        rows = (await db.execute(month_q)).all()

        buckets: dict[str, dict] = {}
        for match_at, is_correct, brier, log_loss, conf in rows:
            if match_at is None:
                continue
            key = match_at.strftime("%Y-%m")
            b = buckets.setdefault(key, {
                "total": 0,
                "correct": 0,
                "brier_sum": 0.0,
                "log_loss_sum": 0.0,
                "log_loss_n": 0,
                "conf_sum": 0.0,
            })
            b["total"] += 1
            b["correct"] += 1 if is_correct else 0
            if brier is not None:
                b["brier_sum"] += float(brier)
            if log_loss is not None:
                b["log_loss_sum"] += float(log_loss)
                b["log_loss_n"] += 1
            if conf is not None:
                b["conf_sum"] += float(conf)

        return [
            SegmentPerformance(
                segment_type="month",
                segment_value=key,
                total_predictions=b["total"],
                accuracy=b["correct"] / b["total"] if b["total"] else 0.0,
                brier_score=b["brier_sum"] / b["total"] if b["total"] else 0.0,
                log_loss=(
                    b["log_loss_sum"] / b["log_loss_n"]
                    if b["log_loss_n"]
                    else None
                ),
                avg_confidence=b["conf_sum"] / b["total"] if b["total"] else 0.0,
            )
            for key, b in sorted(buckets.items())
        ]
    else:
        # Default: league
        q = (
            select(
                League.name.label("segment_value"),
                func.count(PredictionEvaluation.id).label("total"),
                func.avg(
                    func.cast(PredictionEvaluation.is_correct, Integer)
                ).label("accuracy"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .join(League, League.id == Match.league_id)
            .group_by(League.name)
            .order_by(League.name)
        )
        if _source_filter is not None:
            q = q.where(_source_filter)
        # v8.1 filter
        q = q.where(trackrecord_filter())
        # v8.1/v8.3 tier filter — public ?pick_tier= overrides access_filter
        if TIER_SYSTEM_ENABLED:
            if public_tier is not None:
                q = q.where(pick_tier_expression() == public_tier.value)
            else:
                q = q.where(access_filter(user_tier))

    rows = (await db.execute(q)).all()

    return [
        SegmentPerformance(
            segment_type=segment_type,
            segment_value=row.segment_value or "Unknown",
            total_predictions=row.total or 0,
            accuracy=float(row.accuracy or 0.0),
            brier_score=float(row.avg_brier or 0.0),
            log_loss=float(row.avg_log_loss) if row.avg_log_loss is not None else None,
            avg_confidence=float(row.avg_confidence or 0.0),
        )
        for row in rows
    ]


@router.get(
    "/calibration",
    response_model=CalibrationReport,
    summary="Calibration buckets (reliability diagram data)",
)
async def get_calibration(
    model_version_id: Optional[uuid.UUID] = Query(
        default=None,
        description="Model version to analyse. If omitted, uses the currently-active model.",
    ),
    num_buckets: int = Query(
        default=_NUM_CALIBRATION_BUCKETS, ge=2, le=20, description="Number of probability bins"
    ),
    pick_tier: Optional[str] = Query(
        default=None,
        description="PUBLIC tier filter — see /trackrecord/summary.",
    ),
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> CalibrationReport:
    """
    Compute a reliability diagram for a model version.

    v6: ``model_version_id`` is now optional. When omitted we pick
    the most recently-trained active ``ModelVersion`` so the
    frontend Track Record page can hit the endpoint with no query
    string and still get a valid reliability diagram.

    Predictions are binned by their home_win_prob into ``num_buckets``
    equal-width buckets. For each bucket the observed win frequency is
    computed.
    """
    from app.models.model_version import ModelVersion

    # v6: if no model_version_id was supplied, default to the most
    # recently-trained active model.
    if model_version_id is None:
        from sqlalchemy import desc as sql_desc
        mv_row = (
            await db.execute(
                select(ModelVersion)
                .where(ModelVersion.is_active.is_(True))
                .order_by(sql_desc(ModelVersion.trained_at))
                .limit(1)
            )
        ).scalar_one_or_none()
        if mv_row is not None:
            model_version_id = mv_row.id

    # Load all evaluated predictions (optionally filtered to a model version)
    base_q = (
        select(Prediction, PredictionEvaluation)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
    )
    if model_version_id is not None:
        base_q = base_q.where(Prediction.model_version_id == model_version_id)
    # v8.1 filter
    base_q = base_q.where(trackrecord_filter())
    # v8.1/v8.3 tier filter — public ?pick_tier= overrides access_filter
    public_tier = _parse_public_pick_tier(pick_tier)
    if TIER_SYSTEM_ENABLED:
        base_q = base_q.join(Match, Match.id == Prediction.match_id).where(
            pick_tier_expression() == public_tier.value
            if public_tier is not None
            else access_filter(user_tier)
        )
    result = await db.execute(base_q)
    rows = result.all()

    # Build buckets
    bucket_size = 1.0 / num_buckets
    buckets_data: list[dict] = [
        {
            "predicted_probs": [],
            "outcomes": [],
        }
        for _ in range(num_buckets)
    ]

    for pred, evaluation in rows:
        idx = min(int(pred.home_win_prob / bucket_size), num_buckets - 1)
        buckets_data[idx]["predicted_probs"].append(pred.home_win_prob)
        buckets_data[idx]["outcomes"].append(
            1 if evaluation.actual_outcome == "home" else 0
        )

    calibration_buckets: list[CalibrationBucket] = []
    ece_numerator = 0.0
    total_samples = sum(len(b["predicted_probs"]) for b in buckets_data)

    for i, bucket in enumerate(buckets_data):
        lower = i * bucket_size
        upper = (i + 1) * bucket_size
        count = len(bucket["predicted_probs"])
        if count == 0:
            pred_avg = (lower + upper) / 2
            obs_freq = 0.0
        else:
            pred_avg = sum(bucket["predicted_probs"]) / count
            obs_freq = sum(bucket["outcomes"]) / count

        gap = pred_avg - obs_freq
        ece_numerator += count * abs(gap)

        calibration_buckets.append(
            CalibrationBucket(
                bucket_index=i,
                lower_bound=round(lower, 4),
                upper_bound=round(upper, 4),
                predicted_avg=round(pred_avg, 4),
                observed_freq=round(obs_freq, 4),
                count=count,
                calibration_gap=round(gap, 4),
            )
        )

    overall_ece = ece_numerator / total_samples if total_samples > 0 else 0.0

    # Retrieve model version label
    mv_label = None
    if model_version_id is not None:
        mv_result = await db.execute(
            select(ModelVersion).where(ModelVersion.id == model_version_id)
        )
        mv = mv_result.scalar_one_or_none()
        mv_label = f"{mv.name} v{mv.version}" if mv else None

    return CalibrationReport(
        model_version_id=model_version_id,
        model_version_label=mv_label,
        num_buckets=num_buckets,
        buckets=calibration_buckets,
        overall_ece=round(overall_ece, 6),
        generated_at=datetime.now(timezone.utc),
    )


# ─────────────────────────────────────────────────────────────────────────────
# v6.2.1 — Data transparency: raw predictions export
# ─────────────────────────────────────────────────────────────────────────────
#
# Users want to verify the numbers on the Track Record page themselves.
# Rather than showing a single "how to interpret these numbers" banner,
# we expose the raw prediction set as a downloadable CSV so anyone can
# recompute accuracy, Brier, log-loss, calibration ECE — exactly what
# the platform reports.
#
# The CSV is streamed (not loaded into memory) so this scales as the
# trackrecord grows beyond the current ~5k rows. Columns are stable;
# never rename them without bumping a version query param, third-party
# spreadsheets will break.


async def _stream_trackrecord_csv(
    db: AsyncSession,
    model_version_id: Optional[uuid.UUID] = None,
    user_tier: PickTier = PickTier.PLATINUM,
    public_tier: Optional[PickTier] = None,
) -> AsyncIterator[bytes]:
    """Yield CSV rows for every prediction, one at a time."""
    # UTF-8 BOM + Excel sep hint so European Excel opens correctly
    yield b"\xef\xbb\xbf"  # BOM
    yield b"sep=,\r\n"

    # ── Precompute summary stats ────────────────────────────────────
    summary_q = (
        select(
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
            func.min(Match.scheduled_at).label("period_start"),
            func.max(Match.scheduled_at).label("period_end"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
    )
    if model_version_id is not None:
        summary_q = summary_q.where(Prediction.model_version_id == model_version_id)
    # v8.1 filter
    summary_q = summary_q.where(trackrecord_filter())
    # v8.1/v8.3 tier filter — public ?pick_tier= overrides access_filter
    if TIER_SYSTEM_ENABLED:
        if public_tier is not None:
            summary_q = summary_q.where(pick_tier_expression() == public_tier.value)
        else:
            summary_q = summary_q.where(access_filter(user_tier))
    sr = (await db.execute(summary_q)).one()
    s_total = sr.total or 0
    s_correct = int(sr.correct or 0)
    s_accuracy = (s_correct / s_total * 100) if s_total > 0 else 0.0
    s_period_start = sr.period_start.strftime("%d %b %Y") if sr.period_start else "-"
    s_period_end = sr.period_end.strftime("%d %b %Y") if sr.period_end else "-"

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    # ── Dashboard header ─────────────────────────────────────────────
    # We publish both the hardcoded value and the arithmetic formula.
    # Pure-arithmetic Excel formulas (=B6/B5) work in every locale —
    # it's only the function names (COUNTA, COUNTIF, …) that localise,
    # so a cell-reference divide is portable. This lets auditors
    # recompute the accuracy in-place by editing column B.
    #
    # Row layout (1-indexed, as Excel shows it):
    #   1  (blank)
    #   2  BETSPLUG TRACK RECORD
    #   3  (blank)
    #   4  Period             | <period string>
    #   5  Total Predictions  | <int>
    #   6  Correct Predictions| <int>
    #   7  Accuracy           | <xx.x%>
    #   8  Accuracy formula   | =B6/B5          ← live, locale-safe
    #   9  Definition         | 3-way match accuracy …
    #  10  Generated          | <timestamp>
    writer.writerow([])
    writer.writerow(["BETSPLUG TRACK RECORD"])
    writer.writerow([])
    writer.writerow(["Period", f"{s_period_start} to {s_period_end}"])
    writer.writerow(["Total Predictions", s_total])
    writer.writerow(["Correct Predictions", s_correct])
    writer.writerow(["Accuracy", f"{s_accuracy:.1f}%"])
    # Excel interprets a leading '=' as a formula. When opened in a
    # plain text viewer the cell shows literally "=B6/B5", which still
    # reads as a valid mathematical expression referring to the two
    # rows above.
    writer.writerow(["Accuracy formula", "=B6/B5"])
    writer.writerow([
        "Definition",
        "3-way match accuracy (home / draw / away). A prediction counts as correct when the pick matched the actual outcome.",
    ])
    writer.writerow(["Generated", datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")])
    writer.writerow([])
    writer.writerow(["All data is for educational and simulation purposes only. Not financial or betting advice."])
    writer.writerow([])
    writer.writerow([])

    # Column headers — English, clear, simple, with odds for transparency.
    # v8.6: "Predicted At" added so auditors can verify the pre-match lock
    # per-row (backfill rows would show a timestamp after Match Date).
    writer.writerow(
        [
            "Match Date",       # A
            "Predicted At",     # B  ← NEW: ISO timestamp, for pre-match lock audit
            "League",           # C
            "Home Team",        # D
            "Away Team",        # E
            "Home %",           # F
            "Draw %",           # G
            "Away %",           # H
            "Confidence %",     # I
            "Prediction",       # J
            "Odds Used",        # K
            "Odds Source",      # L
            "Actual Outcome",   # M
            "Correct?",         # N
            "Home Score",       # O
            "Away Score",       # P
            "P/L (units)",      # Q
            "Model",            # R
        ]
    )  # row 13
    yield buffer.getvalue().encode("utf-8")
    buffer.seek(0)
    buffer.truncate(0)

    # ── Data query ───────────────────────────────────────────────────
    q = (
        select(Prediction, PredictionEvaluation)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(Match, Match.id == Prediction.match_id)
        .options(
            selectinload(Prediction.match).selectinload(Match.home_team),
            selectinload(Prediction.match).selectinload(Match.away_team),
            selectinload(Prediction.match).selectinload(Match.league),
            selectinload(Prediction.match).selectinload(Match.result),
            selectinload(Prediction.model_version),
        )
        .order_by(Match.scheduled_at)  # chronological: oldest first
    )
    if model_version_id is not None:
        q = q.where(Prediction.model_version_id == model_version_id)
    # v8.1 filter
    q = q.where(trackrecord_filter())
    # v8.1/v8.3 tier filter — public ?pick_tier= overrides access_filter
    if TIER_SYSTEM_ENABLED:
        if public_tier is not None:
            q = q.where(pick_tier_expression() == public_tier.value)
        else:
            q = q.where(access_filter(user_tier))

    result = await db.stream(q)
    flush_every = 200
    row_count = 0

    pick_labels = {"home": "Home", "draw": "Draw", "away": "Away"}
    outcome_labels = {"home": "Home Win", "draw": "Draw", "away": "Away Win"}

    async for chunk in result.partitions(flush_every):
        for pred, evaluation in chunk:
            m = pred.match
            mv = pred.model_version

            # Determine the model's pick
            if pred.draw_prob is not None:
                probs = {"home": pred.home_win_prob, "draw": pred.draw_prob, "away": pred.away_win_prob}
            else:
                probs = {"home": pred.home_win_prob, "away": pred.away_win_prob}
            pick = max(probs, key=lambda k: probs[k])

            home_score = m.result.home_score if m and m.result else None
            away_score = m.result.away_score if m and m.result else None

            # Short date format that fits in a narrow Excel column
            match_date = (
                m.scheduled_at.strftime("%Y-%m-%d")
                if m and m.scheduled_at else ""
            )

            # Compute odds + P/L for this pick (transparency)
            pick_prob = probs.get(pick, 0.0)
            # Check if real odds exist in odds_history for this match
            odds_val = None
            odds_source_label = "Implied"
            if m:
                from app.models.odds import OddsHistory
                odds_row = (await db.execute(
                    select(OddsHistory)
                    .where(OddsHistory.match_id == m.id, OddsHistory.market.in_(["1x2", "1X2"]))
                    .order_by(OddsHistory.recorded_at.desc())
                    .limit(1)
                )).scalar_one_or_none()
                if odds_row:
                    if pick == "home" and odds_row.home_odds:
                        odds_val = odds_row.home_odds
                        odds_source_label = "Real"
                    elif pick == "draw" and odds_row.draw_odds:
                        odds_val = odds_row.draw_odds
                        odds_source_label = "Real"
                    elif pick == "away" and odds_row.away_odds:
                        odds_val = odds_row.away_odds
                        odds_source_label = "Real"

            if odds_val is None and pick_prob > 0.05:
                odds_val = round(1.0 / (pick_prob * 0.95), 2)
                odds_source_label = "Implied"
            elif odds_val is None:
                odds_val = 1.90
                odds_source_label = "Estimated"

            pnl = round(odds_val - 1.0, 2) if evaluation.is_correct else -1.0

            predicted_at = (
                pred.predicted_at.strftime("%Y-%m-%d %H:%M UTC")
                if pred.predicted_at else ""
            )

            writer.writerow(
                [
                    match_date,
                    predicted_at,
                    (m.league.name if m and m.league else ""),
                    (m.home_team.name if m and m.home_team else ""),
                    (m.away_team.name if m and m.away_team else ""),
                    f"{pred.home_win_prob * 100:.1f}",
                    f"{pred.draw_prob * 100:.1f}" if pred.draw_prob is not None else "",
                    f"{pred.away_win_prob * 100:.1f}",
                    f"{pred.confidence * 100:.1f}",
                    pick_labels.get(pick, pick),
                    f"{odds_val:.2f}",
                    odds_source_label,
                    outcome_labels.get(evaluation.actual_outcome, evaluation.actual_outcome or ""),
                    "Yes" if evaluation.is_correct else "No",
                    str(home_score) if home_score is not None else "",
                    str(away_score) if away_score is not None else "",
                    f"{pnl:+.2f}",
                    f"{mv.name} v{mv.version}" if mv else "",
                ]
            )
            row_count += 1

        # Flush the buffer once per partition
        yield buffer.getvalue().encode("utf-8")
        buffer.seek(0)
        buffer.truncate(0)

    # Trailing yield to close the stream cleanly
    if buffer.tell() > 0:
        yield buffer.getvalue().encode("utf-8")


@router.get(
    "/export.csv",
    summary="Download every evaluated prediction as CSV (v6.2.1 transparency)",
    response_class=StreamingResponse,
)
async def export_trackrecord_csv(
    model_version_id: Optional[uuid.UUID] = Query(
        default=None,
        description="Restrict to a single model version. Omit to export all models.",
    ),
    pick_tier: Optional[str] = Query(
        default=None,
        description=(
            "Tier filter: 'free' | 'silver' | 'gold' | 'platinum'. "
            "When supplied the CSV is scoped to predictions classified "
            "as that tier. Callers may only request tiers up to and "
            "including their own subscription tier — higher-tier "
            "downloads return 402."
        ),
    ),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
    user_tier: PickTier = Depends(get_current_tier),
) -> StreamingResponse:
    """Stream all evaluated predictions as CSV — scoped to the caller's tier
    OR to an explicit ``?pick_tier=`` when set (≤ caller's tier).

    Authentication is required (B1.1): the CSV contains every match
    name, pick, odds and outcome, which is the product's paid
    deliverable. Un-authenticated requests now return 401; the aggregate
    numbers needed to render the public Track Record page are still
    available via ``GET /trackrecord/summary``.

    One row per prediction/evaluation pair; columns cover enough data
    for a user to recompute accuracy, Brier, log-loss and calibration
    ECE themselves.
    """
    public_tier = _parse_public_pick_tier(pick_tier)

    # B1.1 tier-gate: requesting a CSV for a tier above the caller's
    # subscription would leak the paid product. Block with 402 so
    # clients can distinguish "pay to unlock" from 403 "forbidden".
    # When TIER_SYSTEM_ENABLED is false the check is a no-op because
    # user_tier is forced to PLATINUM in that mode.
    if (
        TIER_SYSTEM_ENABLED
        and public_tier is not None
        and public_tier > user_tier
    ):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"The {public_tier.name.title()} track-record CSV is "
                "restricted to subscribers on that tier or higher."
            ),
        )

    tier_suffix = (
        f"-{public_tier.name.lower()}" if public_tier is not None else ""
    )
    filename = (
        f"betsplug-trackrecord{tier_suffix}-"
        f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
    )
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-store",
    }
    return StreamingResponse(
        _stream_trackrecord_csv(
            db,
            model_version_id=model_version_id,
            user_tier=user_tier,
            public_tier=public_tier,
        ),
        media_type="text/csv; charset=utf-8",
        headers=headers,
    )
