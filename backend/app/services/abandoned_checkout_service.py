"""Abandoned checkout service - core business logic.

Responsibilities
----------------
1. Create & update checkout sessions (called from API routes)
2. Find abandoned sessions ready for a reminder email
3. Generate a coupon, render the email, and send it
4. Validate recovery tokens for the recovery link

Everything is async-first (SQLAlchemy async sessions).  The Celery
task wrapper calls ``process_abandoned_checkouts_sync()`` which
bootstraps its own synchronous session.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.abandoned_checkout import (
    AbandonedCheckout,
    CheckoutStatus,
    Coupon,
    CouponStatus,
    _generate_coupon_code,
)
from app.services.email_service import send_email, send_email_sync
from app.services.email_templates.abandoned_checkout import (
    render_html,
    render_text,
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Plan names for the email template
PLAN_NAMES = {
    "bronze": "Bronze",
    "basic": "Bronze",
    "silver": "Silver",
    "standard": "Silver",
    "gold": "Gold",
    "premium": "Gold",
    "platinum": "Platinum",
    "lifetime": "Platinum",
}


# --------------------------------------------------------------------------- #
# Session management (async - called from FastAPI routes)
# --------------------------------------------------------------------------- #

async def create_checkout_session(
    db: AsyncSession,
    *,
    email: str,
    first_name: str | None,
    plan_id: str,
    billing_cycle: str,
    with_trial: bool,
    locale: str | None = None,
) -> AbandonedCheckout:
    """Create or update a checkout session.

    If the same email already has an open (STARTED) session for the
    same plan, we update it instead of creating a duplicate.  This
    handles the case where a user refreshes or re-enters step 1.
    """
    # Check for existing open session with same email + plan
    stmt = select(AbandonedCheckout).where(
        and_(
            AbandonedCheckout.email == email.lower().strip(),
            AbandonedCheckout.plan_id == plan_id,
            AbandonedCheckout.status == CheckoutStatus.STARTED,
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        existing.first_name = first_name
        existing.billing_cycle = billing_cycle
        existing.with_trial = with_trial
        existing.locale = locale
        existing.checkout_started_at = datetime.now(timezone.utc)
        await db.flush()
        logger.info("Updated existing checkout session %s for %s", existing.id, email)
        return existing

    session = AbandonedCheckout(
        email=email.lower().strip(),
        first_name=first_name,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        with_trial=with_trial,
        locale=locale,
    )
    db.add(session)
    await db.flush()
    logger.info("Created checkout session %s for %s (plan=%s)", session.id, email, plan_id)
    return session


async def update_checkout_step(
    db: AsyncSession,
    *,
    session_id: str,
    step: int,
) -> bool:
    """Update the last step reached in an active checkout session."""
    stmt = (
        update(AbandonedCheckout)
        .where(
            and_(
                AbandonedCheckout.id == session_id,
                AbandonedCheckout.status == CheckoutStatus.STARTED,
            )
        )
        .values(last_step=step)
    )
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount > 0


async def complete_checkout_session(
    db: AsyncSession,
    *,
    session_id: str | None = None,
    email: str | None = None,
) -> bool:
    """Mark a checkout session as completed.

    Can be called by session_id (from frontend) or by email
    (from Stripe webhook when we don't have the session_id).
    """
    if session_id:
        stmt = (
            update(AbandonedCheckout)
            .where(
                and_(
                    AbandonedCheckout.id == session_id,
                    AbandonedCheckout.status == CheckoutStatus.STARTED,
                )
            )
            .values(
                status=CheckoutStatus.COMPLETED,
                completed_at=datetime.now(timezone.utc),
            )
        )
    elif email:
        # Mark ALL open sessions for this email as completed
        stmt = (
            update(AbandonedCheckout)
            .where(
                and_(
                    AbandonedCheckout.email == email.lower().strip(),
                    AbandonedCheckout.status == CheckoutStatus.STARTED,
                )
            )
            .values(
                status=CheckoutStatus.COMPLETED,
                completed_at=datetime.now(timezone.utc),
            )
        )
    else:
        return False

    result = await db.execute(stmt)
    await db.flush()
    if result.rowcount > 0:
        logger.info("Completed checkout session (id=%s, email=%s)", session_id, email)
    return result.rowcount > 0


# --------------------------------------------------------------------------- #
# Recovery token validation (async)
# --------------------------------------------------------------------------- #

async def validate_recovery_token(
    db: AsyncSession,
    token: str,
) -> AbandonedCheckout | None:
    """Look up a checkout session by its recovery token.

    Returns the session if the token is valid and not expired,
    None otherwise.
    """
    stmt = select(AbandonedCheckout).where(
        AbandonedCheckout.recovery_token == token
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        return None

    # Check token expiry
    expiry = session.checkout_started_at + timedelta(
        hours=settings.recovery_token_expiry_hours
    )
    if datetime.now(timezone.utc) > expiry:
        logger.info("Recovery token expired for session %s", session.id)
        return None

    return session


# --------------------------------------------------------------------------- #
# Coupon validation (async)
# --------------------------------------------------------------------------- #

async def validate_coupon(
    db: AsyncSession,
    code: str,
) -> Coupon | None:
    """Look up and validate a coupon code.

    Returns the Coupon if valid, None if not found / expired / used.
    """
    stmt = select(Coupon).where(Coupon.code == code.upper().strip())
    result = await db.execute(stmt)
    coupon = result.scalar_one_or_none()

    if coupon and coupon.is_valid:
        return coupon
    return None


async def redeem_coupon(
    db: AsyncSession,
    code: str,
) -> Coupon | None:
    """Redeem a coupon (increment times_used, set status if maxed)."""
    coupon = await validate_coupon(db, code)
    if not coupon:
        return None

    coupon.times_used += 1
    if coupon.times_used >= coupon.max_uses:
        coupon.status = CouponStatus.REDEEMED
    await db.flush()
    logger.info("Coupon %s redeemed (uses: %d/%d)", code, coupon.times_used, coupon.max_uses)
    return coupon


# --------------------------------------------------------------------------- #
# Abandoned checkout processing (the main scheduled job)
# --------------------------------------------------------------------------- #

def process_abandoned_checkouts_sync() -> dict:
    """Find abandoned checkouts and send reminder emails.

    Called from the Celery task.  Uses a synchronous DB session
    because Celery workers are synchronous.

    Returns a dict with counts for logging/monitoring.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(
        settings.database_url_sync,
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=1,
    )
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    stats = {"found": 0, "sent": 0, "failed": 0, "skipped": 0}

    with SessionLocal() as db:
        try:
            # Find sessions that are:
            # 1. Still in STARTED status (not completed)
            # 2. Started more than X minutes ago
            # 3. Haven't received an email yet
            cutoff = datetime.now(timezone.utc) - timedelta(
                minutes=settings.abandoned_checkout_delay_minutes
            )

            stmt = select(AbandonedCheckout).where(
                and_(
                    AbandonedCheckout.status == CheckoutStatus.STARTED,
                    AbandonedCheckout.checkout_started_at <= cutoff,
                    AbandonedCheckout.abandoned_email_sent_at.is_(None),
                )
            )
            sessions = db.execute(stmt).scalars().all()
            stats["found"] = len(sessions)

            if not sessions:
                logger.info("No abandoned checkouts to process")
                return stats

            logger.info("Found %d abandoned checkout(s) to process", len(sessions))

            for session in sessions:
                try:
                    _process_single_session(db, session)
                    stats["sent"] += 1
                except Exception as exc:
                    logger.error(
                        "Failed to process abandoned checkout %s: %s",
                        session.id, exc,
                    )
                    stats["failed"] += 1

            db.commit()

        except Exception as exc:
            logger.error("Abandoned checkout processing failed: %s", exc)
            db.rollback()
            raise

    engine.dispose()
    logger.info("Abandoned checkout processing complete: %s", stats)
    return stats


def _process_single_session(db, session: AbandonedCheckout) -> None:
    """Generate coupon + send email for one abandoned checkout."""
    from app.models.user import User

    # 1. Mark as abandoned
    session.status = CheckoutStatus.ABANDONED

    # 2. Create a unique coupon
    coupon = Coupon(
        code=_generate_coupon_code(),
        discount_percent=settings.coupon_discount_percent,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.coupon_expiry_days),
        max_uses=1,
        checkout_session_id=session.id,
    )
    db.add(coupon)
    db.flush()

    # 3. Link coupon to session
    session.coupon_id = coupon.id
    session.coupon_code = coupon.code

    # 4. Build recovery URL — /checkout lives on app.betsplug.com
    # after the marketing/app split, NOT on the marketing site.
    recovery_url = f"{settings.app_base_url}/checkout?plan={session.plan_id}&billing={session.billing_cycle}&recovery={session.recovery_token}&coupon={coupon.code}"

    # 5. Look up username from registered users (if they have an account)
    display_name = None
    try:
        user_row = db.execute(
            select(User.username).where(User.email == session.email.lower().strip())
        ).scalar_one_or_none()
        if user_row:
            display_name = user_row
    except Exception:
        pass

    # Fallback chain: username -> first_name -> locale default
    if not display_name:
        display_name = session.first_name or None

    # 6. Render email (locale-aware)
    locale = session.locale
    plan_name = PLAN_NAMES.get(
        (session.plan_id or "").strip().lower(),
        (session.plan_id or "").title(),
    )
    discount_pct = str(int(settings.coupon_discount_percent))
    expiry_date = coupon.expires_at.strftime("%-d %B %Y")

    support_email = settings.mail_from_address or "support@betsplug.com"

    template_params = dict(
        first_name=display_name or "",
        plan_name=plan_name,
        coupon_code=coupon.code,
        discount_pct=discount_pct,
        expiry_date=expiry_date,
        recovery_url=recovery_url,
        site_url=settings.site_url,
        support_email=support_email,
        locale=locale,
    )

    html_body = render_html(**template_params)
    text_body = render_text(**template_params)

    # 7. Send email (subject also locale-aware)
    from app.services.email_templates.abandoned_checkout import _get_copy
    copy = _get_copy(locale)
    subject = copy["subject"].format(first_name=display_name or copy["fallback_name"])

    success = send_email_sync(
        to=session.email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
    )

    if success:
        session.abandoned_email_sent_at = datetime.now(timezone.utc)
        logger.info(
            "Abandoned checkout email sent to %s (session=%s, coupon=%s)",
            session.email, session.id, coupon.code,
        )
    else:
        # Don't mark as sent so the next run can retry
        session.status = CheckoutStatus.STARTED
        raise RuntimeError(f"Failed to send email to {session.email}")
