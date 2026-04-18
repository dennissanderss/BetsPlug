"""Admin endpoint for the v5 scaling monitor.

Aggregates ``api_usage_log`` rows into today/week/month-to-date counts
per provider. Not a dashboard, just the data the frontend widget reads.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.api_usage import ApiUsageLog
from app.models.user import User

router = APIRouter()


# Plan limits for the widget — update here when subscription changes.
PLAN_LIMITS: dict[str, int] = {
    "api_football": 7500,           # Pro plan = 7500/day
    "football_data": 14400,         # free tier 10 req/min = 14400/day
    "the_odds_api": 16,             # free tier 500/month ≈ 16/day
}

# Next paid tier (shown as "upgrade target" on the capacity-plan card).
PLAN_UPGRADE_TARGETS: dict[str, dict[str, Any]] = {
    "api_football": {
        "name": "Ultra",
        "daily_limit": 75000,
        "price_usd_month": 49,
    },
}

WARN_THRESHOLD_PCT = 66.0

# User-count scenarios the capacity card projects against. Tweak freely —
# these numbers flow straight through to the frontend.
CAPACITY_USER_SCENARIOS: list[int] = [50, 100, 250, 500, 1000, 2500]


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


# ─────────────────────────────────────────────────────────────────────────────
# Capacity plan — extends /api-usage with user-count projections and a
# top-endpoints breakdown so the admin can see "how far can we grow on
# today's plan?" at a glance.
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/capacity-plan",
    summary="Capacity planning — usage vs plan, per-endpoint top, user-count projections",
)
async def capacity_plan(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Returns everything the frontend Capacity card needs.

    The projection is a linear extrapolation: we measure calls-per-active-
    user over the last 7 days, then multiply by each scenario's user count.
    It ignores the cache-efficiency effect (more users hitting the same
    popular fixtures don't all trigger new API-Football calls because the
    TTL cache in ``fixtures.py`` absorbs them), so the numbers trend
    *pessimistic* — which is the right bias for capacity planning.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = now - timedelta(days=7)

    # ── Call counts ───────────────────────────────────────────────────────
    today_row = (
        await db.execute(
            select(func.count())
            .select_from(ApiUsageLog)
            .where(
                and_(
                    ApiUsageLog.provider == "api_football",
                    ApiUsageLog.call_at >= today_start,
                )
            )
        )
    ).scalar_one()
    today_calls = int(today_row)

    last_7d_row = (
        await db.execute(
            select(func.count())
            .select_from(ApiUsageLog)
            .where(
                and_(
                    ApiUsageLog.provider == "api_football",
                    ApiUsageLog.call_at >= seven_days_ago,
                )
            )
        )
    ).scalar_one()
    last_7d_calls = int(last_7d_row)

    # Rolling per-day calls for a 7-day spark-line.
    daily_rows = (
        await db.execute(
            select(
                func.date_trunc("day", ApiUsageLog.call_at).label("day"),
                func.count().label("n"),
            )
            .where(
                and_(
                    ApiUsageLog.provider == "api_football",
                    ApiUsageLog.call_at >= seven_days_ago,
                )
            )
            .group_by(func.date_trunc("day", ApiUsageLog.call_at))
            .order_by(func.date_trunc("day", ApiUsageLog.call_at))
        )
    ).all()
    daily_calls_7d: list[dict[str, Any]] = [
        {"day": d.date().isoformat(), "calls": int(n)} for d, n in daily_rows
    ]

    # Pad the series to exactly 7 entries so the frontend can draw an even
    # strip. Missing days → 0. Keeps UTC-day alignment.
    series_index = {r["day"]: r["calls"] for r in daily_calls_7d}
    padded_series: list[dict[str, Any]] = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date().isoformat()
        padded_series.append({"day": day, "calls": series_index.get(day, 0)})

    # ── Top endpoints (last 24h + last 7d) ────────────────────────────────
    one_day_ago = now - timedelta(hours=24)

    async def _top_endpoints(since: datetime, limit: int = 8) -> list[dict]:
        rows = (
            await db.execute(
                select(
                    ApiUsageLog.endpoint,
                    func.count().label("n"),
                )
                .where(
                    and_(
                        ApiUsageLog.provider == "api_football",
                        ApiUsageLog.call_at >= since,
                    )
                )
                .group_by(ApiUsageLog.endpoint)
                .order_by(func.count().desc())
                .limit(limit)
            )
        ).all()
        return [{"endpoint": ep, "calls": int(n)} for ep, n in rows]

    top_24h = await _top_endpoints(one_day_ago)
    top_7d = await _top_endpoints(seven_days_ago)

    # ── User base (active last 7d) ────────────────────────────────────────
    # Defensive: the users table has been reshaped a few times and on very
    # old deploys last_login_at or is_active may not exist. We don't want
    # the whole capacity endpoint to 500 just because a user-count query
    # failed. Fall back to 1 so the projection still runs (numbers will be
    # pessimistic until the column materialises).
    active_users_7d = 0
    total_active_users = 0
    try:
        active_users_7d = int(
            (
                await db.execute(
                    select(func.count(User.id)).where(
                        User.is_active.is_(True),
                        User.last_login_at.is_not(None),
                        User.last_login_at >= seven_days_ago,
                    )
                )
            ).scalar_one()
        )
    except Exception:  # pragma: no cover — column may be missing on old DBs
        await db.rollback()
        active_users_7d = 0

    try:
        total_active_users = int(
            (
                await db.execute(
                    select(func.count(User.id)).where(User.is_active.is_(True))
                )
            ).scalar_one()
        )
    except Exception:  # pragma: no cover
        await db.rollback()
        total_active_users = 0

    effective_user_base = active_users_7d or total_active_users or 1

    # ── Projection ────────────────────────────────────────────────────────
    # Average daily calls over the last 7 days (not today — today is
    # incomplete and would tilt the ratio low in the morning).
    avg_daily_7d = last_7d_calls / 7.0 if last_7d_calls else float(today_calls)
    calls_per_user_per_day = (
        avg_daily_7d / effective_user_base if effective_user_base > 0 else 0.0
    )

    limit_daily = PLAN_LIMITS["api_football"]
    scenarios: list[dict[str, Any]] = []
    for users in CAPACITY_USER_SCENARIOS:
        projected = int(round(calls_per_user_per_day * users))
        pct = round(100 * projected / limit_daily, 1) if limit_daily else 0.0
        if pct < 50:
            status = "safe"
        elif pct < 80:
            status = "watch"
        elif pct < 100:
            status = "tight"
        else:
            status = "over"
        scenarios.append(
            {
                "users": users,
                "projected_daily_calls": projected,
                "pct_of_limit": pct,
                "status": status,
            }
        )

    # Break-even user count: at what user count do we hit 100% of the plan?
    if calls_per_user_per_day > 0:
        break_even_users = int(limit_daily / calls_per_user_per_day)
    else:
        break_even_users = None

    # Headroom until upgrade is needed: how many *more* users before we
    # cross 80% (tight zone)?
    if calls_per_user_per_day > 0:
        headroom_users = max(
            0,
            int((limit_daily * 0.8 / calls_per_user_per_day) - effective_user_base),
        )
    else:
        headroom_users = None

    # ── Verdict ───────────────────────────────────────────────────────────
    pct_today = (
        round(100 * today_calls / limit_daily, 1) if limit_daily else 0.0
    )
    if pct_today < 50:
        verdict = "safe"
    elif pct_today < 80:
        verdict = "watch"
    elif pct_today < 100:
        verdict = "tight"
    else:
        verdict = "over"

    return {
        "as_of": now.isoformat(),
        "provider": "api_football",
        "plan": {
            "name": "Pro",
            "daily_limit": limit_daily,
            "upgrade_target": PLAN_UPGRADE_TARGETS.get("api_football"),
        },
        "usage": {
            "today_calls": today_calls,
            "pct_of_limit_today": pct_today,
            "last_7d_calls": last_7d_calls,
            "avg_daily_last_7d": round(avg_daily_7d, 1),
            "series_7d": padded_series,
        },
        "user_base": {
            "active_last_7d": active_users_7d,
            "total_active": total_active_users,
            "effective": effective_user_base,
            "calls_per_user_per_day": round(calls_per_user_per_day, 2),
        },
        "top_endpoints_24h": top_24h,
        "top_endpoints_7d": top_7d,
        "scenarios": scenarios,
        "projection": {
            "break_even_users": break_even_users,
            "headroom_users": headroom_users,
        },
        "verdict": verdict,
    }
