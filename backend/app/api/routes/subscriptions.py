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

    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")

    plan = PLANS[body.plan]
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
            price_id = price_id_map.get(body.plan, "")

            if not price_id:
                raise HTTPException(
                    status_code=500,
                    detail=f"Stripe price not configured for plan: {body.plan}",
                )

            mode = "payment" if body.plan == "lifetime" else "subscription"

            session = stripe.checkout.Session.create(
                payment_method_types=["card", "ideal"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
                success_url=body.success_url,
                cancel_url=body.cancel_url,
                metadata={"plan": body.plan},
            )

            return CheckoutResponse(
                checkout_url=session.url,
                session_id=session.id,
            )

        except ImportError:
            logger.warning("stripe package not installed, falling back to dev mode")
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            raise HTTPException(status_code=500, detail="Payment service error")

    # ── Development: Mock checkout ───────────────────────────────────────
    logger.info(f"[DEV MODE] Mock checkout for plan={body.plan}, total={plan.price_total}€")
    return CheckoutResponse(
        checkout_url=f"{body.success_url}&plan={body.plan}&mock=true",
        session_id="mock_session_dev",
    )


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
        logger.info(
            f"Checkout completed: plan={plan}, customer={customer_id}, "
            f"subscription={subscription_id}"
        )
        # TODO: Create/update Subscription record in DB
        # TODO: Activate user's premium access

    elif event_type == "customer.subscription.updated":
        status = data.get("status")
        logger.info(f"Subscription updated: status={status}")
        # TODO: Update subscription status in DB

    elif event_type == "customer.subscription.deleted":
        logger.info("Subscription deleted/cancelled")
        # TODO: Mark subscription as expired

    elif event_type == "invoice.payment_failed":
        logger.info("Payment failed")
        # TODO: Mark subscription as past_due

    return {"status": "ok"}


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current user's subscription status.
    Returns whether user has active subscription and plan details.
    """
    # TODO: Get actual user from JWT token and query subscription
    # For now, return free tier (no subscription)
    return SubscriptionStatusResponse(
        has_subscription=False,
        plan=None,
        status=None,
        is_lifetime=False,
        current_period_end=None,
    )
