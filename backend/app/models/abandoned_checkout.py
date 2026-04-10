"""Abandoned checkout + coupon models.

These models power the abandoned-checkout email flow:

1. ``AbandonedCheckout`` records every checkout session that the
   frontend reports.  When the session is not completed within the
   configured delay, the Celery beat task picks it up, generates a
   unique coupon, and sends a single reminder email.

2. ``Coupon`` stores discount codes.  Each abandoned-checkout email
   includes a unique 5 %-off code that expires after 7 days and can
   only be redeemed once.

Privacy note
------------
We store only the email address and the plan/billing selections the
user chose in the checkout form.  No passwords, no card data, no
address details.  This keeps the table GDPR-friendly: it is a
*service communication* (the user initiated the checkout) rather
than unsolicited marketing.
"""

from __future__ import annotations

import enum
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    Enum as SAEnum,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _generate_coupon_code() -> str:
    """Generate a human-friendly 8-char uppercase coupon code.

    Format: ``BP-XXXXXX`` (letters + digits, no ambiguous chars).
    Example: ``BP-K7M4XR``
    """
    alphabet = string.ascii_uppercase + string.digits
    # Remove ambiguous characters: 0, O, I, 1, L
    alphabet = alphabet.replace("0", "").replace("O", "").replace("I", "").replace("1", "").replace("L", "")
    code = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"BP-{code}"


def _generate_recovery_token() -> str:
    """Generate a cryptographically secure URL-safe recovery token."""
    return secrets.token_urlsafe(32)


# --------------------------------------------------------------------------- #
# Coupon
# --------------------------------------------------------------------------- #

class CouponStatus(str, enum.Enum):
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"


class Coupon(UUIDPrimaryKey, TimestampMixin, Base):
    """A single-use discount coupon.

    Generated automatically for abandoned-checkout emails.  Can also be
    created manually (e.g. via an admin panel) for other promotional
    campaigns.
    """
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, default=_generate_coupon_code
    )
    discount_percent: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    status: Mapped[CouponStatus] = mapped_column(
        SAEnum(CouponStatus), default=CouponStatus.ACTIVE, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    max_uses: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    times_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Optional link to the checkout that spawned this coupon
    checkout_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("abandoned_checkouts.id"), nullable=True
    )

    @property
    def is_valid(self) -> bool:
        """Return True if the coupon can still be redeemed."""
        now = datetime.now(timezone.utc)
        return (
            self.status == CouponStatus.ACTIVE
            and self.times_used < self.max_uses
            and now < self.expires_at
        )


# --------------------------------------------------------------------------- #
# Abandoned Checkout
# --------------------------------------------------------------------------- #

class CheckoutStatus(str, enum.Enum):
    STARTED = "started"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class AbandonedCheckout(UUIDPrimaryKey, TimestampMixin, Base):
    """Tracks a checkout session from start to completion or abandonment.

    The frontend calls ``POST /api/checkout-sessions`` as soon as the
    user completes step 1 (account info with email).  If the session is
    not marked ``completed`` within ``ABANDONED_CHECKOUT_DELAY_MINUTES``
    (default 60), the Celery task picks it up and sends one reminder
    email.
    """
    __tablename__ = "abandoned_checkouts"

    # Contact info (from checkout step 1)
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # What the user was buying
    plan_id: Mapped[str] = mapped_column(String(50), nullable=False)          # bronze/silver/gold/platinum
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False)    # monthly/yearly
    with_trial: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Session lifecycle
    status: Mapped[CheckoutStatus] = mapped_column(
        SAEnum(CheckoutStatus), default=CheckoutStatus.STARTED, nullable=False
    )
    checkout_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Recovery
    recovery_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, default=_generate_recovery_token
    )

    # Email tracking (ensures we send at most 1 email per session)
    abandoned_email_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Linked coupon (set when the abandoned email is sent)
    coupon_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    coupon_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Last step the user reached (1, 2, or 3)
    last_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Locale for email language
    locale: Mapped[str | None] = mapped_column(String(5), nullable=True)
