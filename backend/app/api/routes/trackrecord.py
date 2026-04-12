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
    db: AsyncSession = Depends(get_db),
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

    row = (await db.execute(q)).one()

    total = row.total or 0
    correct = int(row.correct or 0)
    accuracy = correct / total if total > 0 else 0.0
    avg_brier = float(row.avg_brier or 0.0)
    avg_log_loss = float(row.avg_log_loss) if row.avg_log_loss is not None else None
    avg_confidence = float(row.avg_confidence or 0.0)

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
    db: AsyncSession = Depends(get_db),
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
        rows = (await db.execute(
            select(
                Match.scheduled_at,
                PredictionEvaluation.is_correct,
                PredictionEvaluation.brier_score,
                PredictionEvaluation.log_loss,
                Prediction.confidence,
            )
            .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .join(Match, Match.id == Prediction.match_id)
        )).all()

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
) -> AsyncIterator[bytes]:
    """Yield CSV rows for every prediction, one at a time."""
    # UTF-8 BOM + Excel sep hint so European Excel opens correctly
    yield b"\xef\xbb\xbf"  # BOM
    yield b"sep=,\r\n"

    # ── Precompute period from Match.scheduled_at ────────────────────
    summary_q = (
        select(
            func.min(Match.scheduled_at).label("period_start"),
            func.max(Match.scheduled_at).label("period_end"),
            func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
    )
    if model_version_id is not None:
        summary_q = summary_q.where(Prediction.model_version_id == model_version_id)
    sr = (await db.execute(summary_q)).one()
    s_period_start = sr.period_start.strftime("%d %b %Y") if sr.period_start else "—"
    s_period_end = sr.period_end.strftime("%d %b %Y") if sr.period_end else "—"
    s_brier = float(sr.avg_brier or 0)

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    # ── Dashboard header with LIVE Excel formulas ────────────────────
    # Data starts at row 16 (0-indexed: row 15 in the file). The formulas
    # reference column K ("Correct?" = "Yes"/"No") so the user can verify
    # every number by clicking the formula cell. This is the transparency
    # Dennis asked for — nothing is hardcoded, everything computable.
    #
    # Row layout (1-indexed for Excel):
    # Excel treats "sep=," as a meta-directive, NOT as row 1.
    # So csv writer rows start counting from row 1 in Excel.
    #
    #   1: blank
    #   2: BETSPLUG TRACK RECORD
    #   3: blank
    #   4: Period
    #   5: Total Predictions (formula)
    #   6: Correct Predictions (formula)
    #   7: Accuracy % (formula)
    #   8: Generated
    #   9: blank
    #  10: Disclaimer
    #  11: blank
    #  12: blank
    #  13: Column headers
    #  14+: data rows
    writer.writerow([])                                          # row 1
    writer.writerow(["BETSPLUG — TRACK RECORD"])                 # row 2
    writer.writerow([])                                          # row 3
    writer.writerow(["Period", f"{s_period_start}  to  {s_period_end}"])  # row 4
    writer.writerow(["Total Predictions", '=COUNTA(A14:A99999)'])        # row 5
    writer.writerow(["Correct Predictions", '=COUNTIF(K14:K99999,"Yes")'])  # row 6
    writer.writerow(["Accuracy (%)", '=IF(B5>0,ROUND(B6/B5*100,1),0)'])    # row 7
    writer.writerow(["Generated", datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")])   # row 8
    writer.writerow([])                                          # row 9
    writer.writerow(["Disclaimer", "All data is for educational and simulation purposes only. Not financial or betting advice."])  # row 10
    writer.writerow([])                                          # row 11
    writer.writerow([])                                          # row 12

    # Column headers — English, clear, simple
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
            "Actual Outcome",   # J
            "Correct?",         # K  ← formulas reference this column
            "Home Score",       # L
            "Away Score",       # M
            "Model",            # N
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

            # User-friendly date
            match_date = (
                m.scheduled_at.strftime("%d %b %Y")
                if m and m.scheduled_at else ""
            )

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
                    outcome_labels.get(evaluation.actual_outcome, evaluation.actual_outcome or ""),
                    "Yes" if evaluation.is_correct else "No",
                    str(home_score) if home_score is not None else "",
                    str(away_score) if away_score is not None else "",
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
) -> StreamingResponse:
    """Stream all evaluated predictions as CSV.

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
        _stream_trackrecord_csv(db, model_version_id=model_version_id),
        media_type="text/csv; charset=utf-8",
        headers=headers,
    )
