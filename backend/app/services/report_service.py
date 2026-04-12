"""Report generation service — renders performance reports from prediction
data.

Supports report types:
- weekly: Last 7 days performance summary
- monthly: Last 30 days performance summary
- custom: Date range specified in config

Supports output formats (v6.2.2):
- pdf: reportlab-rendered A4 document with tables
- csv: one row per evaluated prediction, easy to open in Excel / Sheets
- json: structured machine-readable payload with summary + rows

Previously only PDF was supported — the format dropdown on the frontend
was silently ignored because the ReportJobCreate schema dropped the field.
"""

import csv as csv_mod
import io
import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.match import Match, MatchResult, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.report import GeneratedReport, ReportJob

logger = logging.getLogger(__name__)


class ReportService:
    """Generates performance reports (PDF / CSV / JSON) from prediction data."""

    async def generate(
        self,
        job: ReportJob,
        db: AsyncSession,
        fmt: str = "pdf",
    ) -> GeneratedReport:
        """Generate a report for the given job in the requested format.

        ``fmt`` is one of ``'pdf' | 'csv' | 'json'``. Raises ValueError on
        unknown format. The caller is expected to catch + translate to a
        404/500 response — we let the exception bubble so the route handler
        can mark the job as failed.
        """
        fmt = (fmt or "pdf").lower()
        if fmt not in {"pdf", "csv", "json"}:
            raise ValueError(f"Unsupported report format: {fmt!r}")

        config = job.config or {}
        report_type = job.report_type

        if report_type == "weekly":
            days = 7
        elif report_type == "monthly":
            days = 30
        else:
            days = config.get("days", 7)

        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        # Gather data — include raw rows for CSV/JSON output
        data = await self._gather_performance_data(start_date, end_date, db)

        # Resolve a writable output dir. On Railway the default
        # /app/reports is writable within a container instance; if for
        # any reason it isn't (permission, mount issue, local dev), we
        # fall back to /tmp which is always writable.
        settings = get_settings()
        output_dir = settings.reports_output_dir
        try:
            os.makedirs(output_dir, exist_ok=True)
            # Probe writability by creating a tiny test file
            probe_path = os.path.join(output_dir, ".write_probe")
            with open(probe_path, "w") as f:
                f.write("ok")
            os.remove(probe_path)
        except OSError as exc:
            fallback = "/tmp/betsplug-reports"
            logger.warning(
                "reports_output_dir %s not writable (%s); falling back to %s",
                output_dir,
                exc,
                fallback,
            )
            output_dir = fallback
            os.makedirs(output_dir, exist_ok=True)

        ext = fmt  # file extension always matches format
        filename = (
            f"betsplug-{report_type}-{end_date.strftime('%Y%m%d')}-"
            f"{uuid.uuid4().hex[:8]}.{ext}"
        )
        file_path = os.path.join(output_dir, filename)

        # Dispatch to the right renderer
        if fmt == "pdf":
            self._render_pdf(file_path, report_type, data, start_date, end_date)
        elif fmt == "csv":
            self._render_csv(file_path, report_type, data, start_date, end_date)
        elif fmt == "json":
            self._render_json(file_path, report_type, data, start_date, end_date)

        file_size = os.path.getsize(file_path)

        report = GeneratedReport(
            id=uuid.uuid4(),
            job_id=job.id,
            title=(
                f"Betsplug {report_type.capitalize()} Report "
                f"— {end_date.strftime('%d %b %Y')}"
            ),
            file_path=file_path,
            file_format=fmt,
            file_size_bytes=file_size,
            summary=(
                f"{data['total_predictions']} predictions, "
                f"{data['accuracy']:.1%} accuracy, "
                f"Brier {data['avg_brier']:.4f}"
            ),
        )
        db.add(report)
        return report

    async def _gather_performance_data(
        self, start: datetime, end: datetime, db: AsyncSession
    ) -> dict:
        """Gather prediction performance metrics for the date range."""
        # v6.2.2: eager-load match + teams + league so CSV / JSON rows can
        # render human-readable team names without firing N extra queries.
        stmt = (
            select(Prediction, PredictionEvaluation)
            .join(Match, Match.id == Prediction.match_id)
            .outerjoin(
                PredictionEvaluation,
                PredictionEvaluation.prediction_id == Prediction.id,
            )
            .options(
                selectinload(Prediction.match).selectinload(Match.home_team),
                selectinload(Prediction.match).selectinload(Match.away_team),
                selectinload(Prediction.match).selectinload(Match.league),
                selectinload(Prediction.match).selectinload(Match.result),
                selectinload(Prediction.model_version),
            )
            .where(
                and_(
                    Match.scheduled_at >= start,
                    Match.scheduled_at <= end,
                )
            )
            .order_by(Match.scheduled_at)
        )
        rows = (await db.execute(stmt)).all()

        total = len(rows)
        evaluated = [r for r in rows if r[1] is not None]
        correct = sum(1 for _, ev in evaluated if ev.is_correct)
        brier_scores = [ev.brier_score for _, ev in evaluated if ev.brier_score is not None]

        # Get top predictions (highest confidence that were correct)
        top_correct = sorted(
            [(p, ev) for p, ev in evaluated if ev.is_correct],
            key=lambda x: x[0].confidence,
            reverse=True,
        )[:10]

        # Confidence distribution
        confidence_buckets = {
            "high (>0.7)": 0,
            "medium (0.4-0.7)": 0,
            "low (<0.4)": 0,
        }
        for pred, _ in rows:
            if pred.confidence > 0.7:
                confidence_buckets["high (>0.7)"] += 1
            elif pred.confidence > 0.4:
                confidence_buckets["medium (0.4-0.7)"] += 1
            else:
                confidence_buckets["low (<0.4)"] += 1

        return {
            "total_predictions": total,
            "total_evaluated": len(evaluated),
            "correct": correct,
            "accuracy": correct / len(evaluated) if evaluated else 0.0,
            "avg_brier": sum(brier_scores) / len(brier_scores) if brier_scores else 0.0,
            "confidence_buckets": confidence_buckets,
            "top_correct": top_correct,
            # Full rows so CSV / JSON renderers have the complete dataset.
            "rows": rows,
        }

    def _render_pdf(
        self,
        file_path: str,
        report_type: str,
        data: dict,
        start: datetime,
        end: datetime,
    ):
        """Render the PDF report to disk."""
        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Title"],
            fontSize=22,
            textColor=colors.HexColor("#10b981"),
            spaceAfter=12,
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=8,
        )

        elements = []

        # Title
        elements.append(Paragraph(f"Betsplug {report_type.capitalize()} Report", title_style))
        elements.append(Paragraph(
            f"{start.strftime('%d %b %Y')} — {end.strftime('%d %b %Y')}",
            styles["Normal"],
        ))
        elements.append(Spacer(1, 12))

        # Summary metrics
        elements.append(Paragraph("Performance Summary", heading_style))
        summary_data = [
            ["Metric", "Value"],
            ["Total Predictions", str(data["total_predictions"])],
            ["Evaluated", str(data["total_evaluated"])],
            ["Correct", str(data["correct"])],
            ["Accuracy", f"{data['accuracy']:.1%}"],
            ["Avg Brier Score", f"{data['avg_brier']:.4f}"],
        ]
        t = Table(summary_data, colWidths=[120 * mm, 50 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10b981")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0fdf4")]),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 16))

        # Confidence distribution
        elements.append(Paragraph("Confidence Distribution", heading_style))
        conf_data = [["Confidence Level", "Count"]]
        for level, count in data["confidence_buckets"].items():
            conf_data.append([level, str(count)])
        t2 = Table(conf_data, colWidths=[120 * mm, 50 * mm])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 16))

        # Disclaimer
        elements.append(Paragraph("Disclaimer", heading_style))
        elements.append(Paragraph(
            "SIMULATION / EDUCATIONAL USE ONLY. All probability estimates are generated "
            "by a statistical model for research and educational purposes. They do NOT "
            "constitute financial, betting, or investment advice.",
            styles["Normal"],
        ))

        doc.build(elements)

    # ───────────────────────── CSV renderer (v6.2.2) ─────────────────────────

    _CSV_COLUMNS = [
        "prediction_id",
        "predicted_at_utc",
        "match_scheduled_at_utc",
        "league_name",
        "home_team",
        "away_team",
        "model_name",
        "model_version",
        "home_win_prob",
        "draw_prob",
        "away_win_prob",
        "confidence",
        "predicted_pick",
        "actual_outcome",
        "is_correct",
        "home_score",
        "away_score",
        "brier_score",
        "log_loss",
    ]

    def _render_csv(
        self,
        file_path: str,
        report_type: str,
        data: dict,
        start: datetime,
        end: datetime,
    ) -> None:
        """Write the report's prediction rows as CSV.

        Format mirrors the /api/trackrecord/export.csv shape so downstream
        tools (Excel / BI) can reuse the same column mapping.
        """
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv_mod.writer(f)
            # Header block: metadata comment-style rows on the top, then
            # the actual CSV header. Excel + Sheets treat the first row
            # as the header, so we put the metadata in a separate
            # "meta" column pair that's easy to skip.
            writer.writerow(["# betsplug report", f"{report_type.capitalize()}"])
            writer.writerow(
                [
                    "# period",
                    f"{start.date().isoformat()} to {end.date().isoformat()}",
                ]
            )
            writer.writerow(
                [
                    "# total_predictions",
                    str(data["total_predictions"]),
                ]
            )
            writer.writerow(
                [
                    "# accuracy",
                    f"{data['accuracy']:.4f}",
                ]
            )
            writer.writerow(
                [
                    "# avg_brier",
                    f"{data['avg_brier']:.4f}",
                ]
            )
            writer.writerow([])  # blank row separating metadata from data

            writer.writerow(self._CSV_COLUMNS)

            for pred, evaluation in data.get("rows", []):
                m = pred.match
                mv = getattr(pred, "model_version", None)

                if pred.draw_prob is not None:
                    probs = {
                        "home": pred.home_win_prob,
                        "draw": pred.draw_prob,
                        "away": pred.away_win_prob,
                    }
                else:
                    probs = {"home": pred.home_win_prob, "away": pred.away_win_prob}
                pick = max(probs, key=lambda k: probs[k])

                home_score = m.result.home_score if m and m.result else None
                away_score = m.result.away_score if m and m.result else None

                writer.writerow(
                    [
                        str(pred.id),
                        pred.predicted_at.isoformat() if pred.predicted_at else "",
                        m.scheduled_at.isoformat() if m and m.scheduled_at else "",
                        (m.league.name if m and m.league else ""),
                        (m.home_team.name if m and m.home_team else ""),
                        (m.away_team.name if m and m.away_team else ""),
                        (mv.name if mv else ""),
                        (mv.version if mv else ""),
                        f"{pred.home_win_prob:.6f}",
                        f"{pred.draw_prob:.6f}" if pred.draw_prob is not None else "",
                        f"{pred.away_win_prob:.6f}",
                        f"{pred.confidence:.6f}",
                        pick,
                        (evaluation.actual_outcome if evaluation else ""),
                        ("1" if evaluation and evaluation.is_correct else "0")
                        if evaluation
                        else "",
                        str(home_score) if home_score is not None else "",
                        str(away_score) if away_score is not None else "",
                        f"{evaluation.brier_score:.6f}"
                        if evaluation and evaluation.brier_score is not None
                        else "",
                        f"{evaluation.log_loss:.6f}"
                        if evaluation and evaluation.log_loss is not None
                        else "",
                    ]
                )

    # ───────────────────────── JSON renderer (v6.2.2) ────────────────────────

    def _render_json(
        self,
        file_path: str,
        report_type: str,
        data: dict,
        start: datetime,
        end: datetime,
    ) -> None:
        """Write the full report as a structured JSON document.

        Shape:
            {
              "report_type": "weekly",
              "period": {"start": ..., "end": ...},
              "summary": {total_predictions, evaluated, correct, accuracy, avg_brier, confidence_buckets},
              "predictions": [ { ... per prediction ... } ],
              "disclaimer": "..."
            }
        """
        predictions_out: list[dict] = []
        for pred, evaluation in data.get("rows", []):
            m = pred.match
            mv = getattr(pred, "model_version", None)

            if pred.draw_prob is not None:
                probs = {
                    "home": pred.home_win_prob,
                    "draw": pred.draw_prob,
                    "away": pred.away_win_prob,
                }
            else:
                probs = {"home": pred.home_win_prob, "away": pred.away_win_prob}
            pick = max(probs, key=lambda k: probs[k])

            predictions_out.append(
                {
                    "prediction_id": str(pred.id),
                    "predicted_at_utc": pred.predicted_at.isoformat()
                    if pred.predicted_at
                    else None,
                    "match_scheduled_at_utc": m.scheduled_at.isoformat()
                    if m and m.scheduled_at
                    else None,
                    "league_name": (m.league.name if m and m.league else None),
                    "home_team": (m.home_team.name if m and m.home_team else None),
                    "away_team": (m.away_team.name if m and m.away_team else None),
                    "model": {
                        "name": (mv.name if mv else None),
                        "version": (mv.version if mv else None),
                        "model_type": (mv.model_type if mv else None),
                    },
                    "probabilities": {
                        "home": pred.home_win_prob,
                        "draw": pred.draw_prob,
                        "away": pred.away_win_prob,
                    },
                    "confidence": pred.confidence,
                    "predicted_pick": pick,
                    "result": {
                        "actual_outcome": evaluation.actual_outcome if evaluation else None,
                        "is_correct": bool(evaluation.is_correct) if evaluation else None,
                        "home_score": (
                            m.result.home_score if m and m.result else None
                        ),
                        "away_score": (
                            m.result.away_score if m and m.result else None
                        ),
                        "brier_score": (evaluation.brier_score if evaluation else None),
                        "log_loss": (evaluation.log_loss if evaluation else None),
                    },
                }
            )

        payload = {
            "report_type": report_type,
            "period": {
                "start": start.isoformat(),
                "end": end.isoformat(),
            },
            "summary": {
                "total_predictions": data["total_predictions"],
                "total_evaluated": data["total_evaluated"],
                "correct": data["correct"],
                "accuracy": data["accuracy"],
                "avg_brier": data["avg_brier"],
                "confidence_buckets": data["confidence_buckets"],
            },
            "predictions": predictions_out,
            "disclaimer": (
                "SIMULATION / EDUCATIONAL USE ONLY. All probability estimates "
                "are generated by a statistical model for research and "
                "educational purposes. They do NOT constitute financial, "
                "betting, or investment advice."
            ),
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2, default=str)
