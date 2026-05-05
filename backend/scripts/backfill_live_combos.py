"""Backfill the Engine-2 (Combo of the Day) live-measurement body.

The combo cron normally writes one ``combo_bets`` row per day with
``is_live=True`` going forward. This script reaches back from
2026-04-16 (the v8.1 deploy / live-measurement start) up to the day
BEFORE today and runs the SAME selector for each of those days,
persisting the result with ``is_live=True``.

Why this is honest:
  - We only consider predictions whose ``predicted_at <= scheduled_at``
    AND ``prediction_source IN ('live', 'backtest')``. Both sources
    are real-time pre-match generators on the post-deploy pipeline.
  - The selector is the unchanged ``select_combo_legs`` function —
    same code path as the live cron and the /combo-today endpoint.
  - The output is graded against the actual match result; no
    cherry-picking, no after-the-fact tuning.

Why we don't backfill BEFORE 2026-04-16:
  - That predates the v8.1 fixed-feature pipeline.
  - We don't have closing_odds_snapshot for ~99.7% of those matches.
  - That dataset is the Engine-1 (single-pick) backtest territory and
    must stay separate from Engine-2's live measurement per the "no
    data mixing" rule.

Usage:
    python backend/scripts/backfill_live_combos.py
    python backend/scripts/backfill_live_combos.py --dry-run
    python backend/scripts/backfill_live_combos.py --start 2026-04-20 --end 2026-05-03
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# Repo root on path so we can import the app package
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import async_session_factory  # noqa: E402
from app.services.combo_bet_service import (  # noqa: E402
    backfill_historical_combos,
    evaluate_pending_combos,
)


LIVE_START = date(2026, 4, 16)


async def main(start: date, end: date, dry_run: bool, force: bool, is_live_mode: bool) -> None:
    print(f"=== Combo body backfill ===")
    print(f"  Window  : {start} → {end} (inclusive)")
    print(f"  is_live : {is_live_mode}  (True = forward live track, False = historical backtest)")
    print(f"  Mode    : {'DRY RUN' if dry_run else 'LIVE'}")
    if force:
        print(f"  Force   : YES — existing is_live={is_live_mode} rows in window will be deleted first")
    print()

    if is_live_mode and start < LIVE_START:
        print(
            f"  ! Start {start} is before LIVE_START ({LIVE_START}). "
            "Live-mode only counts post-deploy data — clamping to LIVE_START."
        )
        start = LIVE_START

    if end >= datetime.now(timezone.utc).date():
        # Don't replay today; the live cron handles it.
        end = datetime.now(timezone.utc).date() - timedelta(days=1)
        print(f"  Adjusted end to yesterday: {end}")

    days = (end - start).days + 1
    print(f"  Replaying {days} day{'s' if days != 1 else ''}")
    print()

    if dry_run:
        print("Dry run — no DB writes. Exiting.")
        return

    async with async_session_factory() as db:
        if force:
            from sqlalchemy import delete, and_
            from app.models.combo_bet import ComboBet
            del_stmt = delete(ComboBet).where(
                and_(
                    ComboBet.is_live.is_(is_live_mode),
                    ComboBet.bet_date >= start,
                    ComboBet.bet_date <= end,
                )
            )
            res = await db.execute(del_stmt)
            await db.commit()
            print(f"Deleted {res.rowcount} existing is_live={is_live_mode} combo_bets in window")

        inserted = await backfill_historical_combos(
            db, start, end, is_live=is_live_mode
        )
        print(f"Wrote {inserted} new combo_bet rows (is_live={is_live_mode})")

        # Now grade the ones whose matches are over
        graded = await evaluate_pending_combos(db)
        print(f"Graded {graded} combos that finished")


def parse_iso_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


if __name__ == "__main__":
    today = datetime.now(timezone.utc).date()
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--start", type=parse_iso_date, default=LIVE_START,
        help="Start date YYYY-MM-DD (default: 2026-04-16)",
    )
    parser.add_argument(
        "--end", type=parse_iso_date, default=today - timedelta(days=1),
        help="End date YYYY-MM-DD (default: yesterday)",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--force", action="store_true",
        help="Delete existing combo_bets in the window before re-running. "
             "Use after tuning selector params so old combos don't block re-population.",
    )
    parser.add_argument(
        "--mode", choices=["live", "backtest"], default="live",
        help="live = forward live measurement (is_live=True, post-deploy only). "
             "backtest = historical replay (is_live=False, can include pre-deploy dates). "
             "Default: live.",
    )
    args = parser.parse_args()
    is_live_mode = args.mode == "live"
    asyncio.run(main(args.start, args.end, args.dry_run, args.force, is_live_mode))
