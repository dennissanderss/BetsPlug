"""Admin finance dashboard routes.

Provides the month/week/day revenue-vs-expenses timeline for the admin UI
plus CRUD for manually-recorded expenses. Revenue is aggregated from the
``payments`` table (status = SUCCEEDED). Expenses are aggregated from the
``manual_expenses`` table.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.db.session import get_db
from app.models.manual_expense import ManualExpense
from app.models.prediction import Prediction
from app.models.subscription import Payment, PaymentStatus
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


Granularity = Literal["day", "week", "month", "year"]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ExpenseIn(BaseModel):
    amount: float = Field(gt=0)
    currency: str = Field(default="eur", min_length=3, max_length=3)
    description: str = Field(min_length=1, max_length=2000)
    category: str = Field(default="other", min_length=1, max_length=50)
    expense_date: date
    notes: str | None = None


class ExpenseOut(ExpenseIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class FinancePoint(BaseModel):
    period: str  # "2026" / "2026-04" / "2026-W15" / "2026-04-10"
    revenue: float
    expenses: float
    profit: float
    payments_count: int
    subscribers: int  # distinct paying users in this period
    new_subscribers: int  # users whose first-ever paid payment falls in this period


class FinanceOverview(BaseModel):
    range_start: date
    range_end: date
    granularity: Granularity
    total_revenue: float
    total_expenses: float
    total_profit: float
    currency: str
    # Subscriber tallies — "subscriber" = distinct user with at least one
    # SUCCEEDED payment. `total_subscribers` is all-time and ignores the
    # selected range; `subscribers_in_range` and `new_subscribers_in_range`
    # respect it.
    total_subscribers: int
    subscribers_in_range: int
    new_subscribers_in_range: int
    timeline: list[FinancePoint]
    by_plan: dict[str, float]
    expenses_by_category: dict[str, float]


# ---------------------------------------------------------------------------
# Helpers — period bucketing
# ---------------------------------------------------------------------------


def _bucket_key(dt: date, granularity: Granularity) -> str:
    """Return a canonical period string for a date, matching `FinancePoint.period`."""
    if granularity == "day":
        return dt.isoformat()
    if granularity == "week":
        iso = dt.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    if granularity == "year":
        return f"{dt.year:04d}"
    # month
    return f"{dt.year:04d}-{dt.month:02d}"


def _bucket_key_dt(dt: datetime, granularity: Granularity) -> str:
    as_date = dt.date() if isinstance(dt, datetime) else dt
    return _bucket_key(as_date, granularity)


def _enumerate_periods(
    start: date, end: date, granularity: Granularity
) -> list[str]:
    """All period keys between ``start`` and ``end`` inclusive."""
    out: list[str] = []
    if granularity == "day":
        cur = start
        while cur <= end:
            out.append(_bucket_key(cur, "day"))
            cur += timedelta(days=1)
        return out

    if granularity == "week":
        # Walk week by week — align to ISO week
        cur = start - timedelta(days=start.isoweekday() - 1)
        while cur <= end:
            out.append(_bucket_key(cur, "week"))
            cur += timedelta(days=7)
        return out

    if granularity == "year":
        for y in range(start.year, end.year + 1):
            out.append(f"{y:04d}")
        return out

    # month
    y, m = start.year, start.month
    ey, em = end.year, end.month
    while (y, m) <= (ey, em):
        out.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out


def _period_range_for_months(months: int, today: date) -> tuple[date, date]:
    """Return (start, end) covering the last ``months`` months inclusive."""
    months = max(1, min(months, 120))
    end = today
    # Start at the first day of the month ``months - 1`` behind today
    y = today.year
    m = today.month - (months - 1)
    while m <= 0:
        m += 12
        y -= 1
    start = date(y, m, 1)
    return start, end


# ---------------------------------------------------------------------------
# GET /admin/finance/overview
# ---------------------------------------------------------------------------


@router.get("/overview", response_model=FinanceOverview)
async def get_finance_overview(
    period: Granularity = Query(
        default="month", description="Time bucket for the timeline"
    ),
    months: int = Query(
        default=12, ge=1, le=120, description="How many months back to include"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> FinanceOverview:
    """Return revenue vs expenses grouped by day/week/month."""

    today = datetime.now(timezone.utc).date()
    range_start, range_end = _period_range_for_months(months, today)

    # Use timezone-aware datetime bounds for the payment query — avoids
    # needing func.date() which is PG-specific and a bit slower.
    range_start_dt = datetime.combine(
        range_start, datetime.min.time(), tzinfo=timezone.utc
    )
    # +1 day so the comparison includes all of range_end's 24h window.
    range_end_dt = datetime.combine(
        range_end + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc
    )

    # ── Payments (revenue) ───────────────────────────────────────────────
    payments_stmt = (
        select(Payment)
        .where(Payment.status == PaymentStatus.SUCCEEDED)
        .where(Payment.created_at >= range_start_dt)
        .where(Payment.created_at < range_end_dt)
    )
    payments_result = await db.execute(payments_stmt)
    payments = payments_result.scalars().all()

    # ── First-payment-per-user (all-time) — used for `new_subscribers`
    # and `total_subscribers`. Keep as a single grouped query so the
    # cost stays bounded as the payments table grows.
    first_paid_stmt = (
        select(Payment.user_id, func.min(Payment.created_at).label("first_at"))
        .where(Payment.status == PaymentStatus.SUCCEEDED)
        .group_by(Payment.user_id)
    )
    first_paid_rows = (await db.execute(first_paid_stmt)).all()
    first_paid_at: dict[uuid.UUID, datetime] = {
        row.user_id: row.first_at for row in first_paid_rows
    }
    total_subscribers = len(first_paid_at)

    # ── Expenses ────────────────────────────────────────────────────────
    exp_stmt = (
        select(ManualExpense)
        .where(ManualExpense.expense_date >= range_start)
        .where(ManualExpense.expense_date <= range_end)
    )
    exp_result = await db.execute(exp_stmt)
    expenses = exp_result.scalars().all()

    # ── Aggregate ───────────────────────────────────────────────────────
    periods = _enumerate_periods(range_start, range_end, period)

    def _empty_bucket() -> dict:
        return {
            "revenue": 0.0,
            "expenses": 0.0,
            "payments_count": 0,
            "subscriber_ids": set(),
            "new_subscriber_ids": set(),
        }

    timeline_map: dict[str, dict] = {p: _empty_bucket() for p in periods}
    by_plan: dict[str, float] = {}
    by_category: dict[str, float] = {}
    total_revenue = 0.0
    total_expenses = 0.0
    currency_votes: dict[str, int] = {}
    subscribers_in_range: set[uuid.UUID] = set()
    new_subscribers_in_range: set[uuid.UUID] = set()

    for p in payments:
        key = _bucket_key_dt(p.created_at, period)
        bucket = timeline_map.setdefault(key, _empty_bucket())
        amount = float(p.amount or 0)
        bucket["revenue"] += amount
        bucket["payments_count"] += 1
        bucket["subscriber_ids"].add(p.user_id)
        subscribers_in_range.add(p.user_id)
        total_revenue += amount

        # First-ever payment for this user falls in this period?
        first_at = first_paid_at.get(p.user_id)
        if first_at is not None and _bucket_key_dt(first_at, period) == key:
            # Only count if the first-payment also falls within the selected
            # range; otherwise it's a returning subscriber from before.
            if range_start_dt <= first_at < range_end_dt:
                bucket["new_subscriber_ids"].add(p.user_id)
                new_subscribers_in_range.add(p.user_id)

        plan_name = p.plan_type.value if p.plan_type else "unknown"
        by_plan[plan_name] = by_plan.get(plan_name, 0.0) + amount

        currency_votes[p.currency or "eur"] = currency_votes.get(p.currency or "eur", 0) + 1

    for e in expenses:
        key = _bucket_key(e.expense_date, period)
        bucket = timeline_map.setdefault(key, _empty_bucket())
        amount = float(e.amount or 0)
        bucket["expenses"] += amount
        total_expenses += amount

        cat = e.category or "other"
        by_category[cat] = by_category.get(cat, 0.0) + amount

    # Preserve period ordering
    ordered = [
        FinancePoint(
            period=p,
            revenue=round(timeline_map[p]["revenue"], 2),
            expenses=round(timeline_map[p]["expenses"], 2),
            profit=round(timeline_map[p]["revenue"] - timeline_map[p]["expenses"], 2),
            payments_count=int(timeline_map[p]["payments_count"]),
            subscribers=len(timeline_map[p]["subscriber_ids"]),
            new_subscribers=len(timeline_map[p]["new_subscriber_ids"]),
        )
        for p in sorted(timeline_map.keys())
    ]

    # Pick the most common currency, default to EUR
    currency = (
        max(currency_votes, key=currency_votes.get) if currency_votes else "eur"
    )

    return FinanceOverview(
        range_start=range_start,
        range_end=range_end,
        granularity=period,
        total_revenue=round(total_revenue, 2),
        total_expenses=round(total_expenses, 2),
        total_profit=round(total_revenue - total_expenses, 2),
        currency=currency.lower(),
        total_subscribers=total_subscribers,
        subscribers_in_range=len(subscribers_in_range),
        new_subscribers_in_range=len(new_subscribers_in_range),
        timeline=ordered,
        by_plan={k: round(v, 2) for k, v in by_plan.items()},
        expenses_by_category={k: round(v, 2) for k, v in by_category.items()},
    )


# ---------------------------------------------------------------------------
# GET /admin/finance/today — at-a-glance daily snapshot
# ---------------------------------------------------------------------------


class TodayOverview(BaseModel):
    date: date
    new_users: int
    new_subscribers: int  # users whose first-ever SUCCEEDED payment is today
    revenue: float
    payments: int
    predictions_published: int
    currency: str


@router.get("/today", response_model=TodayOverview)
async def get_today_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> TodayOverview:
    """Return a small at-a-glance snapshot for today (UTC)."""

    today = datetime.now(timezone.utc).date()
    start_dt = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=1)

    # New users today
    new_users = (
        await db.execute(
            select(func.count(User.id))
            .where(User.created_at >= start_dt)
            .where(User.created_at < end_dt)
        )
    ).scalar_one()

    # Today's payments — sum + count + currency vote
    todays_pay_rows = (
        await db.execute(
            select(Payment.amount, Payment.currency, Payment.user_id)
            .where(Payment.status == PaymentStatus.SUCCEEDED)
            .where(Payment.created_at >= start_dt)
            .where(Payment.created_at < end_dt)
        )
    ).all()

    revenue = sum(float(r.amount or 0) for r in todays_pay_rows)
    payments_count = len(todays_pay_rows)
    todays_payer_ids = {r.user_id for r in todays_pay_rows}
    currency_votes: dict[str, int] = {}
    for r in todays_pay_rows:
        cur = (r.currency or "eur").lower()
        currency_votes[cur] = currency_votes.get(cur, 0) + 1
    currency = max(currency_votes, key=currency_votes.get) if currency_votes else "eur"

    # New subscribers today: distinct users whose first-ever SUCCEEDED payment is today
    new_subscribers = 0
    if todays_payer_ids:
        first_pay_rows = (
            await db.execute(
                select(Payment.user_id, func.min(Payment.created_at).label("first_at"))
                .where(Payment.status == PaymentStatus.SUCCEEDED)
                .where(Payment.user_id.in_(todays_payer_ids))
                .group_by(Payment.user_id)
            )
        ).all()
        new_subscribers = sum(
            1 for row in first_pay_rows if start_dt <= row.first_at < end_dt
        )

    # Predictions created today
    predictions_published = (
        await db.execute(
            select(func.count(Prediction.id))
            .where(Prediction.created_at >= start_dt)
            .where(Prediction.created_at < end_dt)
        )
    ).scalar_one()

    return TodayOverview(
        date=today,
        new_users=int(new_users or 0),
        new_subscribers=int(new_subscribers),
        revenue=round(revenue, 2),
        payments=int(payments_count),
        predictions_published=int(predictions_published or 0),
        currency=currency,
    )


# ---------------------------------------------------------------------------
# Expenses CRUD
# ---------------------------------------------------------------------------


@router.get("/expenses", response_model=list[ExpenseOut])
async def list_expenses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[ExpenseOut]:
    """List all manual expenses, newest first."""
    result = await db.execute(
        select(ManualExpense).order_by(ManualExpense.expense_date.desc(), ManualExpense.created_at.desc())
    )
    rows = result.scalars().all()
    return [ExpenseOut.model_validate(row) for row in rows]


@router.post(
    "/expenses",
    response_model=ExpenseOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_expense(
    payload: ExpenseIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ExpenseOut:
    """Create a new manual expense."""
    row = ManualExpense(
        amount=payload.amount,
        currency=payload.currency.lower(),
        description=payload.description,
        category=payload.category,
        expense_date=payload.expense_date,
        notes=payload.notes,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return ExpenseOut.model_validate(row)


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: uuid.UUID,
    payload: ExpenseIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ExpenseOut:
    """Update an existing manual expense."""
    result = await db.execute(
        select(ManualExpense).where(ManualExpense.id == expense_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    row.amount = payload.amount
    row.currency = payload.currency.lower()
    row.description = payload.description
    row.category = payload.category
    row.expense_date = payload.expense_date
    row.notes = payload.notes
    await db.flush()
    await db.refresh(row)
    return ExpenseOut.model_validate(row)


@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Delete a manual expense.

    Returns a small JSON body instead of 204 No Content because newer
    FastAPI versions refuse to create a route with ``status_code=204`` and
    a non-``None`` return annotation — the assertion fires at import time
    and brings the whole app down.
    """
    result = await db.execute(
        select(ManualExpense).where(ManualExpense.id == expense_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(row)
    await db.flush()
    return {"status": "deleted", "id": str(expense_id)}
