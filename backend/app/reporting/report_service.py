"""Report generation service.

Generates weekly and monthly performance reports with accuracy metrics,
calibration analysis, and segment breakdowns.  All outputs include a
mandatory simulation/educational disclaimer.

IMPORTANT: All forecasts produced by this platform are SIMULATIONS ONLY.
They are for educational and research purposes.  They are NOT financial
advice and should NOT be used to place real-money bets.

Supported output formats
------------------------
* PDF  – via reportlab
* CSV  – via Python's csv module
* JSON – via json module

Public API
----------
    svc = ReportService()
    report = await svc.generate_weekly_report(db)
    report = await svc.generate_monthly_report(db)
"""

from __future__ import annotations

import csv
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.evaluation.evaluation_service import EvaluationService
from app.models.report import GeneratedReport, ReportJob


# ---------------------------------------------------------------------------
# Disclaimer (must appear in all report outputs)
# ---------------------------------------------------------------------------

DISCLAIMER = (
    "SIMULATION ONLY - HYPOTHETICAL - NOT FINANCIAL ADVICE\n"
    "All forecasts are simulations produced for educational and research "
    "purposes only.  Past simulated performance does not guarantee future "
    "results.  This platform does NOT provide financial, betting, or "
    "investment advice.  DO NOT use these forecasts to place real-money bets."
)

DISCLAIMER_SHORT = (
    "SIMULATION ONLY - HYPOTHETICAL - NOT FINANCIAL ADVICE"
)


class ReportService:
    """Generates and persists performance reports."""

    def __init__(self) -> None:
        self._evaluation_service = EvaluationService()
        self._settings = get_settings()
        self._output_dir = Path(self._settings.reports_output_dir)

    # ------------------------------------------------------------------ #
    # Weekly report                                                        #
    # ------------------------------------------------------------------ #

    async def generate_weekly_report(
        self,
        db: AsyncSession,
        reference_date: Optional[datetime] = None,
    ) -> GeneratedReport:
        """Generate a report covering the last 7 days.

        Parameters
        ----------
        db:
            Async SQLAlchemy session.
        reference_date:
            Report end date (defaults to UTC now).

        Returns
        -------
        GeneratedReport
            The newly created report row (PDF, CSV, and JSON variants
            are all generated; only the PDF row is returned as the primary).
        """
        now = reference_date or datetime.now(timezone.utc)
        start = now - timedelta(days=7)

        job = await self._create_job("weekly", db)

        data = await self._collect_report_data(
            db=db,
            start_date=start,
            end_date=now,
            report_type="weekly",
            period_label=f"Week ending {now.strftime('%Y-%m-%d')}",
        )

        return await self._write_all_formats(data=data, job=job, db=db)

    # ------------------------------------------------------------------ #
    # Monthly report                                                       #
    # ------------------------------------------------------------------ #

    async def generate_monthly_report(
        self,
        db: AsyncSession,
        reference_date: Optional[datetime] = None,
    ) -> GeneratedReport:
        """Generate a report covering the last 30 days.

        Parameters
        ----------
        db:
            Async SQLAlchemy session.
        reference_date:
            Report end date (defaults to UTC now).

        Returns
        -------
        GeneratedReport
            The PDF variant of the generated report.
        """
        now = reference_date or datetime.now(timezone.utc)
        start = now - timedelta(days=30)

        job = await self._create_job("monthly", db)

        data = await self._collect_report_data(
            db=db,
            start_date=start,
            end_date=now,
            report_type="monthly",
            period_label=f"Month ending {now.strftime('%Y-%m-%d')}",
        )

        return await self._write_all_formats(data=data, job=job, db=db)

    # ------------------------------------------------------------------ #
    # Data collection                                                      #
    # ------------------------------------------------------------------ #

    async def _collect_report_data(
        self,
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime,
        report_type: str,
        period_label: str,
    ) -> dict:
        """Gather all metrics needed for a report."""
        ev = self._evaluation_service

        # Overall summary
        summary = await ev.get_trackrecord_summary(
            db, start_date=start_date, end_date=end_date
        )

        # Per-sport performance
        sport_performance = await ev.get_segment_performance(
            "sport", db, start_date=start_date, end_date=end_date
        )

        # Per-league performance
        league_performance = await ev.get_segment_performance(
            "league", db, start_date=start_date, end_date=end_date
        )

        # Calibration data
        calibration = await ev.get_calibration_data(
            db, start_date=start_date, end_date=end_date
        )

        # Per-confidence-bucket performance
        confidence_performance = await ev.get_segment_performance(
            "confidence_bucket", db, start_date=start_date, end_date=end_date
        )

        # Best and worst league segments
        sorted_leagues = sorted(
            [s for s in league_performance if s["total"] >= 5],
            key=lambda x: x["accuracy"],
            reverse=True,
        )
        best_segments = sorted_leagues[:3]
        worst_segments = sorted_leagues[-3:] if len(sorted_leagues) >= 3 else sorted_leagues

        # Simulated performance summary (no betting lines; educational only)
        simulated_summary = _build_simulated_summary(summary)

        return {
            "disclaimer": DISCLAIMER,
            "report_type": report_type,
            "period_label": period_label,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "summary": summary,
            "sport_performance": sport_performance,
            "league_performance": league_performance,
            "confidence_performance": confidence_performance,
            "calibration": calibration,
            "best_segments": best_segments,
            "worst_segments": worst_segments,
            "simulated_performance": simulated_summary,
        }

    # ------------------------------------------------------------------ #
    # Format writers                                                       #
    # ------------------------------------------------------------------ #

    def generate_pdf(self, data: dict, output_path: str) -> str:
        """Generate a PDF report at *output_path* and return the path.

        Uses reportlab.  The disclaimer appears as the first element on
        every page via a page template footer.
        """
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.platypus import (
                Paragraph,
                SimpleDocTemplate,
                Spacer,
                Table,
                TableStyle,
            )
            from reportlab.platypus.flowables import HRFlowable
        except ImportError as exc:
            raise RuntimeError(
                "reportlab is required for PDF generation. "
                "Install it with: pip install reportlab"
            ) from exc

        _ensure_dir(output_path)
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            topMargin=2 * cm,
            bottomMargin=2.5 * cm,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            fontSize=7,
            textColor=colors.red,
            spaceAfter=4,
        )
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontSize=18,
            spaceAfter=12,
        )
        heading_style = ParagraphStyle(
            "Heading2",
            parent=styles["Heading2"],
            fontSize=13,
            spaceAfter=6,
        )
        body_style = styles["Normal"]

        story = []

        # ---- Disclaimer banner ---------------------------------------- #
        story.append(Paragraph(DISCLAIMER.replace("\n", "<br/>"), disclaimer_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.red))
        story.append(Spacer(1, 0.3 * cm))

        # ---- Title ---------------------------------------------------- #
        report_type = data.get("report_type", "").title()
        period = data.get("period_label", "")
        story.append(Paragraph(f"Sports Intelligence Platform — {report_type} Report", title_style))
        story.append(Paragraph(period, body_style))
        story.append(Paragraph(f"Generated: {data.get('generated_at', '')}", body_style))
        story.append(Spacer(1, 0.5 * cm))

        # ---- Summary -------------------------------------------------- #
        story.append(Paragraph("Overall Performance Summary", heading_style))
        summary = data.get("summary", {})
        summary_rows = [
            ["Metric", "Value"],
            ["Total Predictions", str(summary.get("total", 0))],
            ["Correct Predictions", str(summary.get("correct", 0))],
            ["Accuracy", f"{summary.get('accuracy', 0):.1%}"],
            ["Avg. Brier Score", f"{summary.get('avg_brier_score', 0):.4f}"],
            ["Avg. Log Loss", f"{summary.get('avg_log_loss', 0):.4f}"],
            ["Avg. Confidence", f"{summary.get('avg_confidence', 0):.1%}"],
            ["Calibration Error (ECE)", f"{summary.get('calibration_error', 0):.4f}"],
        ]
        t = Table(summary_rows, colWidths=[9 * cm, 7 * cm])
        t.setStyle(_table_style())
        story.append(t)
        story.append(Spacer(1, 0.5 * cm))

        # ---- Sport performance ---------------------------------------- #
        sport_data = data.get("sport_performance", [])
        if sport_data:
            story.append(Paragraph("Performance by Sport", heading_style))
            rows = [["Sport", "Total", "Accuracy", "Avg. Brier"]]
            for s in sport_data:
                rows.append([
                    s["segment"],
                    str(s["total"]),
                    f"{s['accuracy']:.1%}",
                    f"{s['avg_brier_score']:.4f}",
                ])
            t = Table(rows, colWidths=[5 * cm, 4 * cm, 4 * cm, 4 * cm])
            t.setStyle(_table_style())
            story.append(t)
            story.append(Spacer(1, 0.5 * cm))

        # ---- League performance --------------------------------------- #
        league_data = data.get("league_performance", [])
        if league_data:
            story.append(Paragraph("Performance by League", heading_style))
            rows = [["League", "Total", "Accuracy", "Avg. Brier"]]
            for s in league_data:
                rows.append([
                    s["segment"],
                    str(s["total"]),
                    f"{s['accuracy']:.1%}",
                    f"{s['avg_brier_score']:.4f}",
                ])
            t = Table(rows, colWidths=[5 * cm, 4 * cm, 4 * cm, 4 * cm])
            t.setStyle(_table_style())
            story.append(t)
            story.append(Spacer(1, 0.5 * cm))

        # ---- Best / worst segments ------------------------------------ #
        best = data.get("best_segments", [])
        worst = data.get("worst_segments", [])
        if best:
            story.append(Paragraph("Best Performing Leagues (min. 5 predictions)", heading_style))
            rows = [["League", "Accuracy", "Total"]]
            for s in best:
                rows.append([s["segment"], f"{s['accuracy']:.1%}", str(s["total"])])
            t = Table(rows, colWidths=[8 * cm, 5 * cm, 4 * cm])
            t.setStyle(_table_style())
            story.append(t)
            story.append(Spacer(1, 0.3 * cm))

        if worst:
            story.append(Paragraph("Worst Performing Leagues (min. 5 predictions)", heading_style))
            rows = [["League", "Accuracy", "Total"]]
            for s in worst:
                rows.append([s["segment"], f"{s['accuracy']:.1%}", str(s["total"])])
            t = Table(rows, colWidths=[8 * cm, 5 * cm, 4 * cm])
            t.setStyle(_table_style())
            story.append(t)
            story.append(Spacer(1, 0.5 * cm))

        # ---- Calibration --------------------------------------------- #
        cal_data = data.get("calibration", [])
        if cal_data:
            story.append(Paragraph("Calibration Analysis", heading_style))
            rows = [["Bucket", "Predicted Prob.", "Actual Freq.", "Count"]]
            for c in cal_data:
                rows.append([
                    f"{c['bucket_lower']:.1f}–{c['bucket_upper']:.1f}",
                    f"{c['predicted_prob']:.3f}",
                    f"{c['actual_freq']:.3f}",
                    str(c["count"]),
                ])
            t = Table(rows, colWidths=[4 * cm, 5 * cm, 5 * cm, 3 * cm])
            t.setStyle(_table_style())
            story.append(t)
            story.append(Spacer(1, 0.5 * cm))

        # ---- Simulated performance ------------------------------------ #
        sim = data.get("simulated_performance", {})
        story.append(Paragraph("Simulated Performance (Hypothetical Only)", heading_style))
        story.append(Paragraph(DISCLAIMER_SHORT, disclaimer_style))
        sim_rows = [["Metric", "Value"]]
        for k, v in sim.items():
            sim_rows.append([k.replace("_", " ").title(), str(v)])
        t = Table(sim_rows, colWidths=[9 * cm, 7 * cm])
        t.setStyle(_table_style())
        story.append(t)

        # ---- Footer disclaimer ---------------------------------------- #
        story.append(Spacer(1, 1 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
        story.append(Paragraph(DISCLAIMER.replace("\n", "<br/>"), disclaimer_style))

        doc.build(story)
        return output_path

    def generate_csv(self, data: dict, output_path: str) -> str:
        """Write a multi-section CSV report at *output_path*."""
        _ensure_dir(output_path)

        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)

            # Disclaimer header
            writer.writerow([DISCLAIMER_SHORT])
            writer.writerow([])

            # Report metadata
            writer.writerow(["report_type", data.get("report_type", "")])
            writer.writerow(["period", data.get("period_label", "")])
            writer.writerow(["generated_at", data.get("generated_at", "")])
            writer.writerow(["start_date", data.get("start_date", "")])
            writer.writerow(["end_date", data.get("end_date", "")])
            writer.writerow([])

            # Overall summary
            writer.writerow(["## OVERALL SUMMARY"])
            summary = data.get("summary", {})
            for k, v in summary.items():
                writer.writerow([k, v])
            writer.writerow([])

            # Sport performance
            sport_data = data.get("sport_performance", [])
            if sport_data:
                writer.writerow(["## PERFORMANCE BY SPORT"])
                writer.writerow(["sport", "total", "correct", "accuracy", "avg_brier_score"])
                for row in sport_data:
                    writer.writerow([
                        row["segment"], row["total"], row.get("correct", ""),
                        row["accuracy"], row["avg_brier_score"],
                    ])
                writer.writerow([])

            # League performance
            league_data = data.get("league_performance", [])
            if league_data:
                writer.writerow(["## PERFORMANCE BY LEAGUE"])
                writer.writerow(["league", "total", "correct", "accuracy", "avg_brier_score"])
                for row in league_data:
                    writer.writerow([
                        row["segment"], row["total"], row.get("correct", ""),
                        row["accuracy"], row["avg_brier_score"],
                    ])
                writer.writerow([])

            # Calibration
            cal_data = data.get("calibration", [])
            if cal_data:
                writer.writerow(["## CALIBRATION DATA"])
                writer.writerow(["bucket_lower", "bucket_upper", "predicted_prob",
                                  "actual_freq", "count"])
                for row in cal_data:
                    writer.writerow([
                        row["bucket_lower"], row["bucket_upper"],
                        row["predicted_prob"], row["actual_freq"], row["count"],
                    ])
                writer.writerow([])

            # Simulated performance
            sim = data.get("simulated_performance", {})
            if sim:
                writer.writerow(["## SIMULATED PERFORMANCE (HYPOTHETICAL ONLY)"])
                writer.writerow([DISCLAIMER_SHORT])
                for k, v in sim.items():
                    writer.writerow([k, v])
                writer.writerow([])

            # Full disclaimer footer
            writer.writerow([DISCLAIMER])

        return output_path

    def generate_json(self, data: dict, output_path: str) -> str:
        """Write a JSON report at *output_path*."""
        _ensure_dir(output_path)
        output = {
            "disclaimer": DISCLAIMER,
            "metadata": {
                "report_type": data.get("report_type"),
                "period_label": data.get("period_label"),
                "generated_at": data.get("generated_at"),
                "start_date": data.get("start_date"),
                "end_date": data.get("end_date"),
            },
            "summary": data.get("summary", {}),
            "sport_performance": data.get("sport_performance", []),
            "league_performance": data.get("league_performance", []),
            "confidence_performance": data.get("confidence_performance", []),
            "calibration": data.get("calibration", []),
            "best_segments": data.get("best_segments", []),
            "worst_segments": data.get("worst_segments", []),
            "simulated_performance": data.get("simulated_performance", {}),
            "disclaimer_footer": DISCLAIMER,
        }
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, default=str)
        return output_path

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    async def _create_job(self, report_type: str, db: AsyncSession) -> ReportJob:
        """Create and flush a ReportJob row."""
        job = ReportJob(
            id=uuid.uuid4(),
            report_type=report_type,
            status="running",
            started_at=datetime.now(timezone.utc),
        )
        db.add(job)
        await db.flush()
        return job

    async def _write_all_formats(
        self,
        data: dict,
        job: ReportJob,
        db: AsyncSession,
    ) -> GeneratedReport:
        """Write PDF, CSV, and JSON; persist GeneratedReport rows; return the PDF row."""
        now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        report_type = data["report_type"]
        base_name = f"{report_type}_{now_str}"

        self._output_dir.mkdir(parents=True, exist_ok=True)

        pdf_path = str(self._output_dir / f"{base_name}.pdf")
        csv_path = str(self._output_dir / f"{base_name}.csv")
        json_path = str(self._output_dir / f"{base_name}.json")

        # Generate all formats; tolerate PDF failure (reportlab may not be installed)
        try:
            self.generate_pdf(data, pdf_path)
        except Exception as exc:
            # Log but do not abort the report job
            pdf_path = f"FAILED: {exc}"

        self.generate_csv(data, csv_path)
        self.generate_json(data, json_path)

        # Persist GeneratedReport rows
        title = f"{report_type.title()} Report – {data.get('period_label', now_str)}"

        pdf_report = GeneratedReport(
            id=uuid.uuid4(),
            job_id=job.id,
            title=title,
            file_path=pdf_path,
            file_format="pdf",
            file_size_bytes=_file_size(pdf_path),
            summary=DISCLAIMER_SHORT,
        )
        csv_report = GeneratedReport(
            id=uuid.uuid4(),
            job_id=job.id,
            title=f"{title} (CSV)",
            file_path=csv_path,
            file_format="csv",
            file_size_bytes=_file_size(csv_path),
            summary=DISCLAIMER_SHORT,
        )
        json_report = GeneratedReport(
            id=uuid.uuid4(),
            job_id=job.id,
            title=f"{title} (JSON)",
            file_path=json_path,
            file_format="json",
            file_size_bytes=_file_size(json_path),
            summary=DISCLAIMER_SHORT,
        )
        db.add(pdf_report)
        db.add(csv_report)
        db.add(json_report)

        # Mark job complete
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)

        await db.flush()
        return pdf_report


# ---------------------------------------------------------------------------
# Module-level helpers
# ---------------------------------------------------------------------------


def _build_simulated_summary(summary: dict) -> dict:
    """Build a simulated performance section (purely hypothetical)."""
    total = summary.get("total", 0)
    accuracy = summary.get("accuracy", 0.0)
    avg_confidence = summary.get("avg_confidence", 0.0)

    # Hypothetical flat-stake simulation: £10 per prediction at implied fair odds
    # This is entirely HYPOTHETICAL and for illustrative purposes only.
    hypothetical_stake_per_prediction = 10.0
    hypothetical_total_staked = total * hypothetical_stake_per_prediction

    # Implied fair odds = 1 / predicted_probability (using confidence as proxy)
    # Gross return if correct: stake * fair_odds; net: gross - stake
    # This ignores bookmaker margin – purely educational
    implied_odds = (1.0 / avg_confidence) if avg_confidence > 0 else 0.0
    correct = summary.get("correct", 0)
    hypothetical_gross_return = correct * hypothetical_stake_per_prediction * implied_odds
    hypothetical_net = hypothetical_gross_return - hypothetical_total_staked
    hypothetical_roi = (
        (hypothetical_net / hypothetical_total_staked * 100)
        if hypothetical_total_staked > 0
        else 0.0
    )

    return {
        "disclaimer": DISCLAIMER_SHORT,
        "hypothetical_stake_per_prediction_gbp": hypothetical_stake_per_prediction,
        "hypothetical_total_staked_gbp": round(hypothetical_total_staked, 2),
        "hypothetical_gross_return_gbp": round(hypothetical_gross_return, 2),
        "hypothetical_net_return_gbp": round(hypothetical_net, 2),
        "hypothetical_roi_pct": round(hypothetical_roi, 2),
        "implied_odds_used": round(implied_odds, 3),
        "note": (
            "These figures are ENTIRELY HYPOTHETICAL, assume perfect fair odds "
            "(no bookmaker margin), and are for educational illustration only. "
            "Real betting involves significant financial risk."
        ),
    }


def _table_style():
    """Return a standard TableStyle for reportlab tables."""
    try:
        from reportlab.lib import colors
        from reportlab.platypus import TableStyle
    except ImportError:
        return None

    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#ECF0F1")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ])


def _ensure_dir(file_path: str) -> None:
    """Create parent directory of *file_path* if it does not exist."""
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)


def _file_size(path: str) -> Optional[int]:
    """Return file size in bytes, or None if file doesn't exist."""
    try:
        return os.path.getsize(path)
    except OSError:
        return None
