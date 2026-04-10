"""
Subscription & Payment API routes.

Stripe integration for handling subscriptions and one-time payments.
Stripe is free to set up — you only pay per transaction (1.5% + €0.25 in EU).

Setup:
  1. Create a Stripe account at https://stripe.com
  2. Get your API keys from the Stripe Dashboard
  3. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env
  4. Create Products + Prices in Stripe Dashboard matching PLAN_PRICES below
  5. Set STRIPE_PRICE_BASIC, STRIPE_PRICE_STANDARD, STRIPE_PRICE_PREMIUM,
     STRIPE_PRICE_LIFETIME in .env
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus, PlanType

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Schemas ─────────────────────────────────────────────────────────────────

class CreateCheckoutRequest(BaseModel):
    plan: str  # basic, standard, premium, lifetime
    success_url: str = "http://localhost:3000/subscriptions?success=true"
    cancel_url: str = "http://localhost:3000/subscriptions?cancelled=true"


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class SubscriptionStatusResponse(BaseModel):
    has_subscription: bool
    plan: str | None = None
    status: str | None = None
    is_lifetime: bool = False
    current_period_end: str | None = None


class PlanInfo(BaseModel):
    id: str
    name: str
    price_monthly: float
    price_total: float
    duration_months: int
    features: list[str]


# ─── Plan configuration ─────────────────────────────────────────────────────

PLANS = {
    "basic": PlanInfo(
        id="basic",
        name="Basic",
        price_monthly=15.99,
        price_total=15.99,
        duration_months=1,
        features=[
            "All daily predictions",
            "Win probability analysis",
            "Basic match insights",
            "Email support",
        ],
    ),
    "standard": PlanInfo(
        id="standard",
        name="Standard",
        price_monthly=11.99,
        price_total=35.97,
        duration_months=3,
        features=[
            "All daily predictions",
            "Win probability analysis",
            "Pick of the Day highlights",
            "Strategy backtesting",
            "Priority email support",
        ],
    ),
    "premium": PlanInfo(
        id="premium",
        name="Premium",
        price_monthly=9.49,
        price_total=56.94,
        duration_months=6,
        features=[
            "All daily predictions",
            "Win probability analysis",
            "Pick of the Day highlights",
            "Strategy backtesting",
            "Advanced analytics & API",
            "Priority support",
        ],
    ),
    "lifetime": PlanInfo(
        id="lifetime",
        name="Club Member (Lifetime)",
        price_monthly=0,
        price_total=199.99,
        duration_months=0,
        features=[
            "One-Time Payment",
            "Lifetime Access",
            "Dedicated Support",
            "Early Access to New Features",
        ],
    ),
}


# ─── Public endpoints ────────────────────────────────────────────────────────

@router.get("/plans", response_model=list[PlanInfo])
async def list_plans():
    """Return all available subscription plans."""
    return list(PLANS.values())


@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    body: CreateCheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a Stripe Checkout Session for the selected plan.

    When Stripe is not configured, returns a mock session for development.
    In production, this creates a real Stripe checkout URL.
    """
    settings = get_settings()

    # Map frontend plan names to backend plan names
    plan_name_map = {
        "bronze": "basic", "silver": "standard", "gold": "premium", "platinum": "lifetime",
        "basic": "basic", "standard": "standard", "premium": "premium", "lifetime": "lifetime",
    }
    mapped_plan = plan_name_map.get(body.plan.lower(), body.plan)

    if mapped_plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")

    plan = PLANS[mapped_plan]
    stripe_key = getattr(settings, "stripe_secret_key", None)

    # ── Production: Real Stripe checkout ─────────────────────────────────
    if stripe_key and stripe_key != "sk_test_placeholder":
        try:
            import stripe

            stripe.api_key = stripe_key

            price_id_map = {
                "basic": getattr(settings, "stripe_price_basic", ""),
                "standard": getattr(settings, "stripe_price_standard", ""),
                "premium": getattr(settings, "stripe_price_premium", ""),
                "lifetime": getattr(settings, "stripe_price_lifetime", ""),
            }
            price_id = price_id_map.get(mapped_plan, "")

            if not price_id:
                raise HTTPException(
                    status_code=500,
                    detail=f"Stripe price not configured for plan: {body.plan}",
                )

            mode = "payment" if mapped_plan in ("lifetime", "basic") else "subscription"

            mode = "payment" if mapped_plan in ("lifetime", "basic") else "subscription"

            # Let Stripe auto-select best payment methods per customer country
            session = stripe.checkout.Session.create(
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
                success_url=body.success_url,
                cancel_url=body.cancel_url,
                metadata={"plan": mapped_plan},
                automatic_payment_methods={"enabled": True},
            )

            return CheckoutResponse(
                checkout_url=session.url,
                session_id=session.id,
            )

        except ImportError:
            logger.warning("stripe package not installed, falling back to dev mode")
        except Exception as e:
            logger.error(f"Stripe error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Payment service error: {str(e)}")

    # ── Development: Mock checkout ───────────────────────────────────────
    logger.info(f"[DEV MODE] Mock checkout for plan={body.plan}, total={plan.price_total}€")
    return CheckoutResponse(
        checkout_url=f"{body.success_url}&plan={body.plan}&mock=true",
        session_id="mock_session_dev",
    )


# Webhook URL: https://betsplug-production.up.railway.app/api/subscriptions/webhook
# Configure in Stripe Dashboard → Developers → Webhooks
# Events to listen for: checkout.session.completed, customer.subscription.updated,
#                        customer.subscription.deleted, invoice.payment_failed


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.
    Events handled:
    - checkout.session.completed → activate subscription
    - customer.subscription.updated → sync status
    - customer.subscription.deleted → mark expired
    - invoice.payment_failed → mark past_due
    """
    settings = get_settings()
    webhook_secret = getattr(settings, "stripe_webhook_secret", None)

    if not webhook_secret:
        raise HTTPException(status_code=400, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        import stripe

        stripe.api_key = getattr(settings, "stripe_secret_key", "")
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ImportError:
        raise HTTPException(status_code=500, detail="stripe package not installed")
    except Exception as e:
        logger.error(f"Webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]

    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        plan = data.get("metadata", {}).get("plan", "unknown")
        customer_id = data.get("customer")
        subscription_id = data.get("subscription")
        customer_email = data.get("customer_details", {}).get("email") or data.get("customer_email")
        logger.info(
            f"Checkout completed: plan={plan}, customer={customer_id}, "
            f"subscription={subscription_id}, email={customer_email}"
        )

        if customer_email:
            # Find or create user by email
            result = await db.execute(select(User).where(User.email == customer_email))
            user = result.scalar_one_or_none()

            if not user:
                user = User(
                    email=customer_email,
                    username=customer_email.split("@")[0],
                    hashed_password="stripe_managed",
                    is_active=True,
                )
                db.add(user)
                await db.flush()
                logger.info(f"Created new user for Stripe customer: {customer_email}")

            # Map plan string to PlanType enum
            plan_map = {
                "basic": PlanType.BASIC, "bronze": PlanType.BASIC,
                "standard": PlanType.STANDARD, "silver": PlanType.STANDARD,
                "premium": PlanType.PREMIUM, "gold": PlanType.PREMIUM,
                "lifetime": PlanType.LIFETIME, "platinum": PlanType.LIFETIME,
            }
            plan_type = plan_map.get(plan.lower(), PlanType.BASIC)
            is_lifetime = plan_type == PlanType.LIFETIME

            # Check for existing subscription
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == user.id)
            )
            existing_sub = result.scalar_one_or_none()

            if existing_sub:
                existing_sub.plan_type = plan_type
                existing_sub.status = SubscriptionStatus.ACTIVE
                existing_sub.stripe_customer_id = customer_id
                existing_sub.stripe_subscription_id = subscription_id
                existing_sub.is_lifetime = is_lifetime
                existing_sub.current_period_start = datetime.now(timezone.utc)
            else:
                new_sub = Subscription(
                    user_id=user.id,
                    plan_type=plan_type,
                    status=SubscriptionStatus.ACTIVE,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    is_lifetime=is_lifetime,
                    current_period_start=datetime.now(timezone.utc),
                )
                db.add(new_sub)

            await db.commit()
            logger.info(f"Subscription activated: user={customer_email}, plan={plan}")

    elif event_type == "customer.subscription.updated":
        stripe_sub_id = data.get("id")
        status = data.get("status")
        logger.info(f"Subscription updated: id={stripe_sub_id}, status={status}")

        if stripe_sub_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == stripe_sub_id
                )
            )
            sub = result.scalar_one_or_none()

            if sub:
                status_map = {
                    "active": SubscriptionStatus.ACTIVE,
                    "past_due": SubscriptionStatus.PAST_DUE,
                    "canceled": SubscriptionStatus.CANCELLED,
                    "unpaid": SubscriptionStatus.PAST_DUE,
                    "trialing": SubscriptionStatus.TRIALING,
                }
                sub.status = status_map.get(status, SubscriptionStatus.ACTIVE)

                # Update period end from Stripe data
                period_end = data.get("current_period_end")
                if period_end:
                    sub.current_period_end = datetime.fromtimestamp(
                        period_end, tz=timezone.utc
                    )

                sub.cancel_at_period_end = data.get("cancel_at_period_end", False)
                await db.commit()
                logger.info(f"Subscription {stripe_sub_id} updated to status={status}")

    elif event_type == "customer.subscription.deleted":
        stripe_sub_id = data.get("id")
        logger.info(f"Subscription deleted/cancelled: id={stripe_sub_id}")

        if stripe_sub_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == stripe_sub_id
                )
            )
            sub = result.scalar_one_or_none()

            if sub:
                sub.status = SubscriptionStatus.EXPIRED
                sub.current_period_end = datetime.now(timezone.utc)
                await db.commit()
                logger.info(f"Subscription {stripe_sub_id} marked as expired")

    elif event_type == "invoice.payment_failed":
        stripe_sub_id = data.get("subscription")
        logger.info(f"Payment failed: subscription={stripe_sub_id}")

        if stripe_sub_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == stripe_sub_id
                )
            )
            sub = result.scalar_one_or_none()

            if sub:
                sub.status = SubscriptionStatus.PAST_DUE
                await db.commit()
                logger.info(f"Subscription {stripe_sub_id} marked as past_due")

    return {"status": "ok"}


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    email: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get subscription status for a user.
    Pass ?email=user@example.com to look up by email.
    Will switch to JWT-based lookup once full auth is wired up.
    """
    if not email:
        return SubscriptionStatusResponse(
            has_subscription=False,
            plan=None,
            status=None,
            is_lifetime=False,
            current_period_end=None,
        )

    # Find user by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        return SubscriptionStatusResponse(
            has_subscription=False,
            plan=None,
            status=None,
            is_lifetime=False,
            current_period_end=None,
        )

    # Find active subscription for user
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalar_one_or_none()

    if not sub:
        return SubscriptionStatusResponse(
            has_subscription=False,
            plan=None,
            status=None,
            is_lifetime=False,
            current_period_end=None,
        )

    return SubscriptionStatusResponse(
        has_subscription=sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING),
        plan=sub.plan_type.value,
        status=sub.status.value,
        is_lifetime=sub.is_lifetime,
        current_period_end=sub.current_period_end.isoformat() if sub.current_period_end else None,
    )
