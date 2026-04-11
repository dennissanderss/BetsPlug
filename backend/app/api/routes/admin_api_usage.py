"""Admin endpoint for the v5 scaling monitor.

Aggregates ``api_usage_log`` rows into today/week/month-to-date counts
per provider. Not a dashboard, just the data the frontend widget reads.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.api_usage import ApiUsageLog

router = APIRouter()


# Plan limits for the widget — update here when subscription changes.
PLAN_LIMITS: dict[str, int] = {
    "api_football": 7500,           # Pro plan = 7500/day
    "football_data": 14400,         # free tier 10 req/min = 14400/day
    "the_odds_api": 16,             # free tier 500/month ≈ 16/day
}

WARN_THRESHOLD_PCT = 66.0


@router.get(
    "/api-usage",
    summary="Aggregated external-API usage stats (today / week / projection)",
)
async def api_usage_stats(
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    async def _count_since(since: datetime) -> dict[str, int]:
        stmt = (
            select(ApiUsageLog.provider, func.count())
            .where(ApiUsageLog.call_at >= since)
            .group_by(ApiUsageLog.provider)
        )
        rows = (await db.execute(stmt)).all()
        return {provider: int(cnt) for provider, cnt in rows}

    today = await _count_since(today_start)
    this_week = await _count_since(week_start)
    this_month = await _count_since(month_start)

    def _for(provider: str) -> dict:
        limit = PLAN_LIMITS.get(provider, 0)
        today_calls = today.get(provider, 0)
        pct = round(100 * today_calls / limit, 1) if limit else 0.0
        return {
            "provider": provider,
            "today_calls": today_calls,
            "daily_limit": limit,
            "percentage_today": pct,
            "warning": pct >= WARN_THRESHOLD_PCT,
            "week_calls": this_week.get(provider, 0),
            "month_calls": this_month.get(provider, 0),
        }

    providers = ["api_football", "football_data", "the_odds_api"]

    # Simple linear month-end projection based on days elapsed so far.
    days_elapsed_this_month = max(1, (now - month_start).days + 1)
    days_in_month = (
        month_start.replace(day=28) + timedelta(days=4)
    ).replace(day=1) - month_start
    total_days_in_month = days_in_month.days
    month_projection = {
        p: int((this_month.get(p, 0) / days_elapsed_this_month) * total_days_in_month)
        for p in providers
    }

    return {
        "as_of": now.isoformat(),
        "providers": [_for(p) for p in providers],
        "totals": {
            "today": sum(today.values()),
            "this_week": sum(this_week.values()),
            "this_month": sum(this_month.values()),
        },
        "month_projection": month_projection,
        "warn_threshold_pct": WARN_THRESHOLD_PCT,
    }
