from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class ManualExpense(UUIDPrimaryKey, TimestampMixin, Base):
    """Manually-recorded business expense used by the admin finance view.

    Expenses are paired against the payments table to produce the monthly
    revenue / expenses / profit timeline for the finance dashboard.
    """

    __tablename__ = "manual_expenses"

    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="eur", nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), default="other", nullable=False, index=True
    )
    expense_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
