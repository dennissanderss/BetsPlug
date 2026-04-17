"""Track-record routes: accuracy, calibration and segment performance."""

import csv
import io
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator, List, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_tier
from app.core.prediction_filters import v81_predictions_filter
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
from app.schemas.trackrecord import (
    CalibrationBucket,
    CalibrationReport,
    SegmentPerformance,
    TrackrecordSummary,
)

router = APIRouter()

_NUM_CALIBRATION_BUCKETS = 10


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
    q = q.where(v81_predictions_filter())
    # v8.1 tier access filter
    if TIER_SYSTEM_ENABLED:
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
        # Evaluate pick_tier_expression() once — see dashboard.py for rationale.
        # Two separate calls create non-equivalent CASE-nodes on PostgreSQL.
        tier_expr = pick_tier_expression()
        per_tier_q = (
            select(
                tier_expr,
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            # NOTE: intentionally no access_filter here — see comment above.
            .group_by(tier_expr)
        )
        if model_version_id is not None:
            per_tier_q = per_tier_q.where(Prediction.model_version_id == model_version_id)
        if source is not None:
            per_tier_q = per_tier_q.where(Prediction.prediction_source == source)

        tier_rows = (await db.execute(per_tier_q)).all()
        per_tier = {}
        for tier_int, t_total, t_correct in tier_rows:
            # Cast everything explicitly — COUNT/SUM on PG return bigint/Decimal
            # which Pydantic v2 rejects for int/float fields in TierBreakdown.
            total_int = int(t_total or 0)
            if not total_int:
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
        q = q.where(v81_predictions_filter())
        # v8.1 tier access filter
        if TIER_SYSTEM_ENABLED:
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
            .where(v81_predictions_filter())
        )
        if TIER_SYSTEM_ENABLED:
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
        q = q.where(v81_predictions_filter())
        # v8.1 tier access filter
        if TIER_SYSTEM_ENABLED:
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
    base_q = base_q.where(v81_predictions_filter())
    # v8.1 tier access filter — requires JOIN on matches
    if TIER_SYSTEM_ENABLED:
        base_q = base_q.join(Match, Match.id == Prediction.match_id).where(
            access_filter(user_tier)
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
    summary_q = summary_q.where(v81_predictions_filter())
    # v8.1 tier access filter
    if TIER_SYSTEM_ENABLED:
        summary_q = summary_q.where(access_filter(user_tier))
    sr = (await db.execute(summary_q)).one()
    s_total = sr.total or 0
    s_correct = int(sr.correct or 0)
    s_accuracy = (s_correct / s_total * 100) if s_total > 0 else 0.0
    s_period_start = sr.period_start.strftime("%d %b %Y") if sr.period_start else "-"
    s_period_end = sr.period_end.strftime("%d %b %Y") if sr.period_end else "-"

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    # ── Dashboard header — hardcoded values (no Excel formulas) ──────
    # Formulas like =COUNTA / =COUNTIF break on non-English Excel
    # because function names are locale-specific (COUNTA = AANTALARG
    # in Dutch). Hardcoded values are always readable everywhere.
    # Users can still verify by filtering the Correct? column.
    writer.writerow([])
    writer.writerow(["BETSPLUG TRACK RECORD"])
    writer.writerow([])
    writer.writerow(["Period", f"{s_period_start} to {s_period_end}"])
    writer.writerow(["Total Predictions", s_total])
    writer.writerow(["Correct Predictions", s_correct])
    writer.writerow(["Accuracy", f"{s_accuracy:.1f}%"])
    writer.writerow(["Generated", datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")])
    writer.writerow([])
    writer.writerow(["All data is for educational and simulation purposes only. Not financial or betting advice."])
    writer.writerow([])
    writer.writerow([])

    # Column headers — English, clear, simple, with odds for transparency
    writer.writerow(
        [
            "Match Date",       # A
            "League",           # B
            "Home Team",        # C
            "Away Team",        # D
            "Home %",           # E
            "Draw %",           # F
            "Away %",           # G
            "Confidence %",     # H
            "Prediction",       # I
            "Odds Used",        # J  ← NEW: implied or real odds
            "Odds Source",      # K  ← NEW: "real" / "implied" / "estimated"
            "Actual Outcome",   # L
            "Correct?",         # M
            "Home Score",       # N
            "Away Score",       # O
            "P/L (units)",      # P  ← NEW: profit/loss per pick
            "Model",            # Q
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
    q = q.where(v81_predictions_filter())
    # v8.1 tier access filter
    if TIER_SYSTEM_ENABLED:
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

            writer.writerow(
                [
                    match_date,
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
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> StreamingResponse:
    """Stream all evaluated predictions as CSV — scoped to the user's tier.

    One row per prediction/evaluation pair; columns cover enough data
    for a user to recompute accuracy, Brier, log-loss and calibration
    ECE themselves. This is the primary transparency artefact for the
    Track Record page.
    """
    filename = f"betsplug-trackrecord-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-store",
    }
    return StreamingResponse(
        _stream_trackrecord_csv(
            db,
            model_version_id=model_version_id,
            user_tier=user_tier,
        ),
        media_type="text/csv; charset=utf-8",
        headers=headers,
    )
