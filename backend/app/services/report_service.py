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
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
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

    # ───────────────────────── PDF renderer (v6.2.3 polished) ──────────────
    #
    # Rewrite of the original bare-bones PDF. v6.2.2 just had two grey
    # tables and a disclaimer — Dennis asked for a real presentation
    # artefact, so this version has:
    #   - Branded green header bar on every page
    #   - Cover block with report type, period and generated-at
    #   - Four hero-stat cards (Predictions / Accuracy / Brier / Confidence)
    #   - Styled performance table with coloured accuracy badge
    #   - Confidence distribution table with coloured banding
    #   - Top correct picks list (up to 10)
    #   - Per-page footer with page number + domain + disclaimer snippet
    #
    # Everything is reportlab-only — no matplotlib, no external images —
    # so the Docker image footprint on Railway stays identical.

    # Brand colours
    _COLOR_PRIMARY = colors.HexColor("#10b981")   # emerald
    _COLOR_PRIMARY_SOFT = colors.HexColor("#ecfdf5")
    _COLOR_ACCENT = colors.HexColor("#3b82f6")    # blue
    _COLOR_ACCENT_SOFT = colors.HexColor("#eff6ff")
    _COLOR_DARK = colors.HexColor("#0f172a")      # slate-900
    _COLOR_MID = colors.HexColor("#64748b")       # slate-500
    _COLOR_BORDER = colors.HexColor("#e2e8f0")    # slate-200
    _COLOR_LIGHT_BG = colors.HexColor("#f8fafc")  # slate-50
    _COLOR_AMBER = colors.HexColor("#f59e0b")
    _COLOR_RED = colors.HexColor("#ef4444")

    def _accuracy_color(self, accuracy: float):
        if accuracy >= 0.55:
            return self._COLOR_PRIMARY
        if accuracy >= 0.50:
            return self._COLOR_AMBER
        return self._COLOR_RED

    def _draw_page_chrome(self, canvas, doc, report_type: str) -> None:
        """Draw the green brand header bar and footer on every page."""
        canvas.saveState()

        page_w, page_h = A4
        # Top brand bar
        canvas.setFillColor(self._COLOR_PRIMARY)
        canvas.rect(0, page_h - 12 * mm, page_w, 12 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(20 * mm, page_h - 8 * mm, "BetsPlug")
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(
            page_w - 20 * mm,
            page_h - 8 * mm,
            f"{report_type.capitalize()} Performance Report",
        )

        # Footer divider
        canvas.setStrokeColor(self._COLOR_BORDER)
        canvas.setLineWidth(0.4)
        canvas.line(20 * mm, 15 * mm, page_w - 20 * mm, 15 * mm)

        # Footer text: left = domain, center = disclaimer, right = page no.
        canvas.setFillColor(self._COLOR_MID)
        canvas.setFont("Helvetica", 7)
        canvas.drawString(20 * mm, 11 * mm, "betsplug.com")
        canvas.drawCentredString(
            page_w / 2,
            11 * mm,
            "Simulation / educational use only — not financial advice.",
        )
        canvas.drawRightString(
            page_w - 20 * mm,
            11 * mm,
            f"Page {doc.page}",
        )
        canvas.drawString(
            20 * mm,
            7 * mm,
            f"Generated {datetime.now(timezone.utc).strftime('%d %b %Y %H:%M UTC')}",
        )

        canvas.restoreState()

    def _hero_card(
        self,
        label: str,
        value: str,
        accent,
        *,
        subtitle: Optional[str] = None,
    ) -> Table:
        """A big stat card used on the cover page — 4 of these in a 2x2 grid."""
        inner_style = ParagraphStyle(
            "HeroLabel",
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=self._COLOR_MID,
            leading=10,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
        value_style = ParagraphStyle(
            "HeroValue",
            fontName="Helvetica-Bold",
            fontSize=28,
            textColor=accent,
            leading=30,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
        sub_style = ParagraphStyle(
            "HeroSub",
            fontName="Helvetica",
            fontSize=7,
            textColor=self._COLOR_MID,
            leading=9,
            alignment=TA_LEFT,
        )

        content = [[Paragraph(label.upper(), inner_style)], [Paragraph(value, value_style)]]
        if subtitle:
            content.append([Paragraph(subtitle, sub_style)])

        t = Table(content, colWidths=[80 * mm])
        style_cmds = [
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.5, self._COLOR_BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            # Left-hand colored accent bar
            ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ]
        t.setStyle(TableStyle(style_cmds))
        return t

    def _section_header(self, text: str, styles) -> list:
        """Return a [Paragraph, HRFlowable, Spacer] section header block."""
        style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=self._COLOR_DARK,
            spaceAfter=4,
            leading=16,
        )
        return [
            Paragraph(text, style),
            HRFlowable(
                width="100%",
                thickness=1.2,
                color=self._COLOR_PRIMARY,
                spaceBefore=0,
                spaceAfter=8,
            ),
        ]

    def _render_pdf(
        self,
        file_path: str,
        report_type: str,
        data: dict,
        start: datetime,
        end: datetime,
    ):
        """Render a polished PDF report with cover stats, tables, and top picks."""
        # Leave room at the top for the green bar and at the bottom for
        # the footer when choosing margins.
        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=22 * mm,
            bottomMargin=22 * mm,
            title=f"Betsplug {report_type.capitalize()} Report",
            author="BetsPlug",
            subject="Model performance report",
        )

        styles = getSampleStyleSheet()
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=self._COLOR_DARK,
            leading=12,
        )
        muted_style = ParagraphStyle(
            "Muted",
            parent=body_style,
            textColor=self._COLOR_MID,
            fontSize=9,
        )
        title_style = ParagraphStyle(
            "Title",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            textColor=self._COLOR_DARK,
            leading=28,
            spaceAfter=4,
        )
        kicker_style = ParagraphStyle(
            "Kicker",
            parent=body_style,
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=self._COLOR_PRIMARY,
            spaceAfter=2,
        )

        elements: list = []

        # ── Cover block ──────────────────────────────────────────────
        elements.append(Paragraph(f"{report_type.upper()} REPORT", kicker_style))
        elements.append(Paragraph("Model Performance Summary", title_style))
        period_label = (
            f"{start.strftime('%d %b %Y')} — {end.strftime('%d %b %Y')} "
            f"({(end - start).days} days)"
        )
        elements.append(Paragraph(period_label, muted_style))
        elements.append(Spacer(1, 18))

        # ── Hero stat grid ───────────────────────────────────────────
        total_preds = data["total_predictions"]
        evaluated = data["total_evaluated"]
        pending = total_preds - evaluated
        correct = data["correct"]
        accuracy = float(data["accuracy"])
        brier = float(data["avg_brier"])

        acc_color = self._accuracy_color(accuracy) if evaluated else self._COLOR_MID
        acc_value = f"{accuracy:.1%}" if evaluated else "—"
        acc_subtitle = (
            f"{correct} / {evaluated} correct" if evaluated else "no evaluated picks yet"
        )

        hero_grid = Table(
            [
                [
                    self._hero_card(
                        "Total Predictions",
                        f"{total_preds:,}",
                        self._COLOR_ACCENT,
                        subtitle=f"{evaluated} evaluated · {pending} pending",
                    ),
                    self._hero_card(
                        "Accuracy",
                        acc_value,
                        acc_color,
                        subtitle=acc_subtitle,
                    ),
                ],
                [
                    self._hero_card(
                        "Avg Brier Score",
                        f"{brier:.4f}" if evaluated else "—",
                        self._COLOR_ACCENT,
                        subtitle="lower is better · perfect = 0.0",
                    ),
                    self._hero_card(
                        "Total Picks per Day",
                        f"{(total_preds / max((end - start).days, 1)):.1f}",
                        self._COLOR_PRIMARY,
                        subtitle=f"{(end - start).days}-day period",
                    ),
                ],
            ],
            colWidths=[85 * mm, 85 * mm],
            hAlign="LEFT",
        )
        hero_grid.setStyle(
            TableStyle(
                [
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(hero_grid)
        elements.append(Spacer(1, 22))

        # ── Performance summary table ────────────────────────────────
        elements.extend(self._section_header("Performance Details", styles))

        summary_rows = [
            ["Metric", "Value"],
            ["Total predictions", f"{total_preds:,}"],
            ["Evaluated predictions", f"{evaluated:,}"],
            ["Pending evaluation", f"{pending:,}"],
            ["Correct predictions", f"{correct:,}"],
            ["Accuracy", f"{accuracy:.2%}" if evaluated else "—"],
            ["Average Brier score", f"{brier:.4f}" if evaluated else "—"],
        ]
        perf_table = Table(summary_rows, colWidths=[110 * mm, 60 * mm])
        perf_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), self._COLOR_DARK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("ALIGN", (0, 0), (0, -1), "LEFT"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, self._COLOR_LIGHT_BG]),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.4, self._COLOR_BORDER),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        elements.append(perf_table)
        elements.append(Spacer(1, 18))

        # ── Confidence distribution ──────────────────────────────────
        elements.extend(self._section_header("Confidence Distribution", styles))

        conf_rows = [["Confidence level", "Predictions", "Share"]]
        cb = data["confidence_buckets"]
        total_for_share = max(total_preds, 1)
        bucket_labels_pretty = {
            "high (>0.7)": "High  (> 70%)",
            "medium (0.4-0.7)": "Medium  (40 – 70%)",
            "low (<0.4)": "Low  (< 40%)",
        }
        bucket_colors = {
            "high (>0.7)": self._COLOR_PRIMARY,
            "medium (0.4-0.7)": self._COLOR_AMBER,
            "low (<0.4)": self._COLOR_RED,
        }
        row_styles = []
        for bucket_key, (level, count) in enumerate(cb.items()):
            share = count / total_for_share
            conf_rows.append(
                [
                    bucket_labels_pretty.get(level, level),
                    f"{count:,}",
                    f"{share:.1%}",
                ]
            )
            row_styles.append(
                ("LINEBEFORE", (0, bucket_key + 1), (0, bucket_key + 1), 3, bucket_colors.get(level, self._COLOR_MID))
            )

        conf_table = Table(conf_rows, colWidths=[90 * mm, 40 * mm, 40 * mm])
        conf_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), self._COLOR_DARK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, self._COLOR_LIGHT_BG]),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.4, self._COLOR_BORDER),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    *row_styles,
                ]
            )
        )
        elements.append(conf_table)
        elements.append(Spacer(1, 18))

        # ── Top correct picks ────────────────────────────────────────
        top_correct = data.get("top_correct") or []
        if top_correct:
            elements.extend(self._section_header("Top Correct Picks", styles))

            top_rows = [["Date", "Match", "Pick", "Confidence"]]
            for pred, _ev in top_correct[:10]:
                m = getattr(pred, "match", None)
                date_str = (
                    m.scheduled_at.strftime("%d %b %Y")
                    if m and m.scheduled_at
                    else ""
                )
                home = m.home_team.name if m and m.home_team else "—"
                away = m.away_team.name if m and m.away_team else "—"
                # Match column can get wide so truncate
                match_label = f"{home} vs {away}"
                if len(match_label) > 42:
                    match_label = match_label[:40] + "…"

                probs = {
                    "HOME": pred.home_win_prob,
                    "DRAW": pred.draw_prob or 0,
                    "AWAY": pred.away_win_prob,
                }
                pick_label = max(probs, key=lambda k: probs[k])

                top_rows.append(
                    [
                        date_str,
                        match_label,
                        pick_label,
                        f"{pred.confidence * 100:.0f}%",
                    ]
                )

            top_table = Table(
                top_rows,
                colWidths=[26 * mm, 94 * mm, 22 * mm, 28 * mm],
            )
            top_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), self._COLOR_DARK),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                        ("ALIGN", (0, 0), (0, -1), "LEFT"),
                        ("ALIGN", (1, 0), (1, -1), "LEFT"),
                        ("ALIGN", (2, 0), (-1, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, self._COLOR_LIGHT_BG]),
                        ("LINEBELOW", (0, 0), (-1, -1), 0.4, self._COLOR_BORDER),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        # Green "correct" tick bar on the left of every data row
                        ("LINEBEFORE", (0, 1), (0, -1), 3, self._COLOR_PRIMARY),
                    ]
                )
            )
            elements.append(top_table)
            elements.append(Spacer(1, 16))
        else:
            elements.extend(self._section_header("Top Correct Picks", styles))
            elements.append(
                Paragraph(
                    "No correct picks were evaluated in this period yet.",
                    muted_style,
                )
            )
            elements.append(Spacer(1, 16))

        # ── Disclaimer (detailed) ────────────────────────────────────
        elements.extend(self._section_header("Disclaimer", styles))
        elements.append(
            Paragraph(
                "This report is a SIMULATION / EDUCATIONAL artefact. All probability "
                "estimates are generated by statistical models for research and "
                "educational purposes only. They do NOT constitute financial, betting, "
                "or investment advice. Past performance does not guarantee future "
                "results. Always gamble responsibly and within applicable laws.",
                muted_style,
            )
        )

        # Build with the branded page chrome on every page
        def _on_page(canvas, doc_ref, _report_type=report_type):
            self._draw_page_chrome(canvas, doc_ref, _report_type)

        doc.build(elements, onFirstPage=_on_page, onLaterPages=_on_page)

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
