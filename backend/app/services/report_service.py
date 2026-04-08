"""Report generation service — renders PDF reports from prediction data.

Supports report types:
- weekly: Last 7 days performance summary
- monthly: Last 30 days performance summary
- custom: Date range specified in config
"""

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

from app.core.config import get_settings
from app.models.match import Match, MatchResult, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.report import GeneratedReport, ReportJob


class ReportService:
    """Generates PDF reports from prediction performance data."""

    async def generate(self, job: ReportJob, db: AsyncSession) -> GeneratedReport:
        """Generate a report for the given job and return the GeneratedReport row."""
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

        # Gather data
        data = await self._gather_performance_data(start_date, end_date, db)

        # Render PDF
        settings = get_settings()
        output_dir = settings.reports_output_dir
        os.makedirs(output_dir, exist_ok=True)

        filename = f"betsplug-{report_type}-{end_date.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}.pdf"
        file_path = os.path.join(output_dir, filename)

        self._render_pdf(file_path, report_type, data, start_date, end_date)

        file_size = os.path.getsize(file_path)

        report = GeneratedReport(
            id=uuid.uuid4(),
            job_id=job.id,
            title=f"Betsplug {report_type.capitalize()} Report — {end_date.strftime('%d %b %Y')}",
            file_path=file_path,
            file_format="pdf",
            file_size_bytes=file_size,
            summary=f"{data['total_predictions']} predictions, {data['accuracy']:.1%} accuracy, Brier {data['avg_brier']:.4f}",
        )
        db.add(report)
        return report

    async def _gather_performance_data(
        self, start: datetime, end: datetime, db: AsyncSession
    ) -> dict:
        """Gather prediction performance metrics for the date range."""
        # Get all predictions with evaluations in range
        stmt = (
            select(Prediction, PredictionEvaluation)
            .join(Match, Match.id == Prediction.match_id)
            .outerjoin(
                PredictionEvaluation,
                PredictionEvaluation.prediction_id == Prediction.id,
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
        brier_scores = [ev.brier_score for _, ev in evaluated]

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
