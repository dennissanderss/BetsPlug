"""Regenerate historical predictions on the v8.1 fixed feature pipeline.

For every finished match in the chosen date range that doesn't yet have
a v8.1-clean prediction, we call ``ForecastService.generate_forecast``
(source="backtest") and then patch ``predicted_at`` to the match's
``scheduled_at`` so the row passes ``trackrecord_filter``.

Why this script exists:
  - Pre-deploy predictions used a broken feature pipeline (22/39
    features wrong) → leakage-flagged via validation_status.
  - We want a backtest body for both engines that runs on the gefixte
    pipeline. Generating new rows post-deploy gives us that.

Honest caveat (Pad B):
  - The forecast model uses ``team_seeds.py`` (current Elo ratings) at
    generation time. For matches in 2024/25, those seeds carry forward
    knowledge of how teams performed AFTER the match. That's softer
    leakage than the feature-pipeline bug, but still leakage.
  - Backtest body produced by this script is OK for INTERNAL evaluation
    of selector behaviour, but should NOT be the customer-facing track
    record. Live measurement (≥16 Apr 2026, prediction_source='live')
    remains the only fully-honest forward feed.

This script does NOT delete pre-deploy rows. New rows are added
alongside; the trackrecord_filter naturally picks the v8.1 ones.

Usage:
    python backend/scripts/regenerate_historical_predictions.py
    python backend/scripts/regenerate_historical_predictions.py --dry-run
    python backend/scripts/regenerate_historical_predictions.py --start 2024-08-01 --end 2026-04-15
    python backend/scripts/regenerate_historical_predictions.py --limit 500
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import and_, or_, select, update, exists  # noqa: E402
from app.db.session import async_session_factory  # noqa: E402
from app.core.prediction_filters import V81_DEPLOYMENT_CUTOFF  # noqa: E402
from app.models.match import Match, MatchResult, MatchStatus  # noqa: E402
from app.models.prediction import Prediction, PredictionEvaluation  # noqa: E402
from app.models.model_version import ModelVersion  # noqa: E402
from app.forecasting.forecast_service import ForecastService  # noqa: E402


DEFAULT_START = date(2024, 8, 1)


async def main(start: date, end: date, dry_run: bool, limit: int | None) -> None:
    print("=== v8.1 historical prediction regeneration ===")
    print(f"  Window  : {start} → {end} (match scheduled_at)")
    print(f"  Mode    : {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"  Limit   : {'no cap' if limit is None else f'{limit} matches max'}")
    print()

    start_dt = datetime.combine(start, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

    async with async_session_factory() as db:
        # Make sure an active model version exists (forecast_service requires one)
        mv = (await db.execute(
            select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
        )).scalar_one_or_none()
        if mv is None:
            print("! No active ModelVersion in DB. Aborting — train/activate one first.")
            return

        # Find finished matches in window without a v8.1-clean prediction.
        # "v8.1-clean" = a prediction row whose created_at >= deploy cutoff
        # AND predicted_at <= scheduled_at (the trackrecord_filter rule).
        v81_pred_exists = exists().where(
            and_(
                Prediction.match_id == Match.id,
                Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
                Prediction.predicted_at <= Match.scheduled_at,
            )
        )
        match_q = (
            select(Match.id, Match.scheduled_at)
            .where(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= start_dt,
                Match.scheduled_at <= end_dt,
                ~v81_pred_exists,
            )
            .order_by(Match.scheduled_at)
        )
        if limit:
            match_q = match_q.limit(limit)
        targets = (await db.execute(match_q)).all()
        print(f"Found {len(targets)} match(es) needing v8.1 regeneration")
        print()

        if not targets:
            print("Nothing to generate (all v8.1 predictions exist) — proceeding to evaluation step.")
        if dry_run:
            print("Dry run — would have generated for these matches. Exiting.")
            return
        # Skip the generate loop when there's nothing to do
        if not targets:
            generated = 0
            failed = 0

        svc = ForecastService()
        generated = 0
        failed = 0
        BATCH = 25

        for i, (match_id, scheduled_at) in enumerate(targets, start=1):
            try:
                pred = await svc.generate_forecast(
                    match_id, db, source="backtest"
                )
                # Patch predicted_at so trackrecord_filter accepts the row.
                # Using scheduled_at (the batch-simulation pipeline's default)
                # keeps the prediction strictly pre-kickoff per the <= filter.
                pred.predicted_at = scheduled_at
                pred.match_scheduled_at = scheduled_at
                pred.lead_time_hours = 0.0
                pred.locked_at = None
                generated += 1
            except Exception as exc:
                failed += 1
                if failed <= 5:
                    print(f"  ! match {match_id} failed: {exc}")

            if i % BATCH == 0:
                await db.commit()
                print(f"  [{i}/{len(targets)}] generated={generated} failed={failed}")

        await db.commit()
        print()
        print(f"Total generated : {generated}")
        print(f"Total failed    : {failed}")
        print()

        # Evaluate any new predictions whose match has a result
        print("Evaluating new predictions against match results...")
        eval_stmt = (
            select(Prediction, MatchResult)
            .join(Match, Match.id == Prediction.match_id)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .where(
                Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
                Prediction.predicted_at <= Match.scheduled_at,
                PredictionEvaluation.id.is_(None),
                Match.scheduled_at >= start_dt,
                Match.scheduled_at <= end_dt,
            )
        )
        eval_rows = (await db.execute(eval_stmt)).all()
        evaluated = 0
        for pred, result in eval_rows:
            try:
                hs, as_ = result.home_score, result.away_score
                if hs > as_:
                    actual = "home"
                elif as_ > hs:
                    actual = "away"
                else:
                    actual = "draw"
                # Pick = argmax of probs, matching the cron's evaluation logic
                probs = {
                    "home": pred.home_win_prob or 0.0,
                    "draw": pred.draw_prob or 0.0,
                    "away": pred.away_win_prob or 0.0,
                }
                pick = max(probs, key=probs.get)
                is_correct = pick == actual
                # Brier score on the 3-way distribution
                actual_vec = {"home": 0, "draw": 0, "away": 0, actual: 1}
                brier = sum(
                    (probs[k] - actual_vec[k]) ** 2 for k in ("home", "draw", "away")
                ) / 3
                db.add(PredictionEvaluation(
                    prediction_id=pred.id,
                    actual_outcome=actual,
                    is_correct=is_correct,
                    brier_score=brier,
                    evaluated_at=datetime.now(timezone.utc),
                ))
                evaluated += 1
            except Exception as exc:
                print(f"  ! evaluation failed for {pred.id}: {exc}")
        await db.commit()
        print(f"Evaluated {evaluated} new predictions.")


def parse_iso_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


if __name__ == "__main__":
    today = datetime.now(timezone.utc).date()
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--start", type=parse_iso_date, default=DEFAULT_START,
        help=f"Start date for match scheduled_at. Default: {DEFAULT_START}",
    )
    parser.add_argument(
        "--end", type=parse_iso_date, default=date(2026, 4, 15),
        help="End date (inclusive). Default: 2026-04-15 (day before deploy).",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Cap number of matches processed (for testing). Default: no cap.",
    )
    args = parser.parse_args()
    asyncio.run(main(args.start, args.end, args.dry_run, args.limit))
