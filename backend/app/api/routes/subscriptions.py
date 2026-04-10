"""
Subscription & Payment API routes.

Stripe integration for handling subscriptions and one-time payments.
Stripe is free to set up — you only pay per transaction (1.5% + €0.25 in EU).

Setup:
  1. Create a Stripe account at https://stripe.com.
  2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in the env.
  3. Create Products + Prices in Stripe Dashboard.
  4. On every Price, set the "Lookup key" field to one of the values in
     PLAN_LOOKUP_KEYS / ADDON_LOOKUP_KEYS below (e.g. silver_monthly,
     addon_telegram_yearly). Prices are resolved by lookup key at runtime,
     not via env vars, so price changes don't require a redeploy — just
     create a new Price in Stripe and tick "Transfer lookup key from old
     price".
"""

from __future__ import annotations

import logging
import time
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
    plan: str  # bronze, silver, gold, platinum (legacy: basic, standard, premium, lifetime)
    billing: str = "monthly"  # "monthly" or "yearly"
    addons: list[str] = []    # ["telegram", "tipOfDay"]
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

# Prices here mirror the frontend PLANS in checkout-content.tsx so the
# /plans endpoint stays in sync. The dict key uses the *legacy* internal
# name (basic/standard/premium/lifetime) to keep PlanType-mapped code paths
# working, but the user-facing `name` and `id` use the new branding.
PLANS = {
    "basic": PlanInfo(
        id="bronze",
        name="Bronze Trial",
        price_monthly=0.01,
        price_total=0.01,
        duration_months=1,
        features=[
            "7-day trial access",
            "Daily predictions",
            "Card verification charge €0.01",
        ],
    ),
    "standard": PlanInfo(
        id="silver",
        name="Silver",
        price_monthly=9.99,
        price_total=9.99,
        duration_months=1,
        features=[
            "All daily predictions",
            "Win probability analysis",
            "Pick of the Day highlights",
            "Email support",
        ],
    ),
    "premium": PlanInfo(
        id="gold",
        name="Gold",
        price_monthly=14.99,
        price_total=14.99,
        duration_months=1,
        features=[
            "All daily predictions",
            "Win probability analysis",
            "Pick of the Day highlights",
            "Strategy backtesting",
            "Priority support",
        ],
    ),
    "lifetime": PlanInfo(
        id="platinum",
        name="Platinum (Lifetime)",
        price_monthly=0,
        price_total=199.0,
        duration_months=0,
        features=[
            "One-time payment",
            "Lifetime access",
            "Telegram alerts included",
            "Tip of the Day included",
            "Priority support",
        ],
    ),
}


# ─── Stripe price helpers (lookup-key based) ────────────────────────────────
#
# All Stripe price lookups go through Stripe's `lookup_key` feature instead
# of hard-coded price IDs in env vars. The keys live in Stripe Dashboard
# (Products → Price → Edit → "Zoeksleutel" / "Lookup key"), so prices can be
# changed without touching code or redeploying:
#
#   1. In Stripe, create the new price on the same product.
#   2. Tick "Transfer lookup key from old price" so the new price inherits
#      the key — the old one is automatically dropped from the lookup.
#   3. Wait up to PRICE_CACHE_TTL seconds (or restart) for the cache to
#      refresh, and the new price is live.
#
# The 10 keys below MUST exist in Stripe; if any is missing, checkout for
# that plan / add-on returns a 500 with a clear error message.

PLAN_LOOKUP_KEYS = {
    # plan_id → { billing_cadence → lookup_key }
    "bronze":   {"monthly": "bronze_trial", "yearly": "bronze_trial"},
    "silver":   {"monthly": "silver_monthly", "yearly": "silver_yearly"},
    "gold":     {"monthly": "gold_monthly", "yearly": "gold_yearly"},
    "platinum": {"monthly": "platinum_lifetime", "yearly": "platinum_lifetime"},
}

ADDON_LOOKUP_KEYS = {
    "telegram":  {"monthly": "addon_telegram_monthly", "yearly": "addon_telegram_yearly"},
    "tipOfDay":  {"monthly": "addon_tipofday_monthly", "yearly": "addon_tipofday_yearly"},
}

# Frontend plan names → canonical internal name. Both old (basic/standard/...)
# and new (bronze/silver/...) names are accepted so legacy clients still work.
PLAN_ALIASES = {
    "bronze": "bronze", "basic": "bronze",
    "silver": "silver", "standard": "silver",
    "gold": "gold", "premium": "gold",
    "platinum": "platinum", "lifetime": "platinum",
}

# How each plan is billed in Stripe. Bronze (€0.01 trial) and Platinum
# (€199 lifetime) are one-time. Silver and Gold are recurring subscriptions.
PLAN_MODES = {
    "bronze": "payment",
    "silver": "subscription",
    "gold": "subscription",
    "platinum": "payment",
}

VALID_BILLINGS = {"monthly", "yearly"}
VALID_ADDON_IDS = {"telegram", "tipOfDay"}

# In-memory cache: lookup_key → (price_id, fetched_at_unix).
# 5 min TTL keeps checkout fast without making price changes feel sticky;
# admins can also restart the service to flush the cache instantly.
PRICE_CACHE_TTL_SECONDS = 300
_price_cache: dict[str, tuple[str, float]] = {}


def _all_lookup_keys() -> list[str]:
    """Every lookup key the checkout flow can possibly need."""
    keys: set[str] = set()
    for cadence in PLAN_LOOKUP_KEYS.values():
        keys.update(cadence.values())
    for cadence in ADDON_LOOKUP_KEYS.values():
        keys.update(cadence.values())
    return sorted(keys)


def _refresh_price_cache(stripe_module) -> None:
    """
    Pull every active price for our lookup keys in a single Stripe call
    and (re)populate the in-memory cache. Cheaper than fetching one key
    at a time and keeps all entries in sync.
    """
    keys = _all_lookup_keys()
    # Stripe accepts up to 10 lookup_keys per request — we have exactly 10.
    result = stripe_module.Price.list(lookup_keys=keys, active=True, limit=100)
    now = time.time()
    fetched: dict[str, tuple[str, float]] = {}
    for price in result.auto_paging_iter():
        lk = getattr(price, "lookup_key", None)
        if lk:
            fetched[lk] = (price.id, now)
    _price_cache.update(fetched)
    logger.info(
        "Stripe price cache refreshed: %d/%d keys present (%s)",
        len(fetched), len(keys), ", ".join(sorted(fetched.keys())),
    )


def resolve_price_id(stripe_module, lookup_key: str) -> str:
    """
    Return the current Stripe price ID for a lookup key, refreshing the
    cache if the entry is missing or stale. Raises HTTPException(500) when
    Stripe has no active price with that key — surfaces config drift fast.
    """
    cached = _price_cache.get(lookup_key)
    now = time.time()
    if cached and now - cached[1] < PRICE_CACHE_TTL_SECONDS:
        return cached[0]

    # Cache miss or expired — refresh everything in one call.
    _refresh_price_cache(stripe_module)
    cached = _price_cache.get(lookup_key)
    if cached:
        return cached[0]

    raise HTTPException(
        status_code=500,
        detail=(
            f"Stripe price with lookup_key='{lookup_key}' not found. "
            "Check Stripe Dashboard → Products → Price → Lookup key."
        ),
    )


def get_plan_price_id(plan: str, billing: str, stripe_module) -> str:
    """Resolve the Stripe price ID for a plan at the given billing cadence."""
    cadence_map = PLAN_LOOKUP_KEYS.get(plan)
    if not cadence_map:
        return ""
    lookup_key = cadence_map.get(billing) or cadence_map.get("monthly")
    return resolve_price_id(stripe_module, lookup_key)


def get_addon_price_id(addon: str, billing: str, stripe_module) -> str:
    """Resolve the Stripe price ID for an add-on at the given billing cadence."""
    cadence_map = ADDON_LOOKUP_KEYS.get(addon)
    if not cadence_map:
        return ""
    lookup_key = cadence_map.get(billing) or cadence_map.get("monthly")
    return resolve_price_id(stripe_module, lookup_key)


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

    # ── Validate + normalise the request ─────────────────────────────────
    plan = PLAN_ALIASES.get(body.plan.lower())
    if plan is None:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")

    billing = (body.billing or "monthly").lower()
    if billing not in VALID_BILLINGS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid billing: {body.billing} (expected monthly or yearly)",
        )

    # Bronze (trial) and Platinum (lifetime) are always one-time, never yearly.
    mode = PLAN_MODES[plan]
    if mode == "payment":
        billing = "monthly"  # canonical value; mode=payment ignores cadence

    # De-duplicate and validate add-on IDs.
    requested_addons = list(dict.fromkeys(body.addons or []))
    unknown = [a for a in requested_addons if a not in VALID_ADDON_IDS]
    if unknown:
        raise HTTPException(
            status_code=400, detail=f"Unknown add-ons: {', '.join(unknown)}"
        )

    # Stripe forbids mixing one-time + recurring in a single checkout, and
    # the frontend already disables add-ons on Bronze/Platinum (Platinum
    # bundles them in for free). Reject anything that slips through.
    if requested_addons and mode == "payment":
        raise HTTPException(
            status_code=400,
            detail=(
                "Add-ons are not available on one-time plans "
                "(Bronze trial / Platinum lifetime)."
            ),
        )

    # Look up the plan info for legacy logging / dev-mode response.
    legacy_name_map = {"bronze": "basic", "silver": "standard", "gold": "premium", "platinum": "lifetime"}
    plan_info = PLANS.get(legacy_name_map[plan])

    stripe_key = getattr(settings, "stripe_secret_key", None)

    # ── Production: Real Stripe checkout ─────────────────────────────────
    if stripe_key and stripe_key != "sk_test_placeholder":
        try:
            import stripe

            stripe.api_key = stripe_key

            # Resolve every line item via Stripe lookup keys (cached). Any
            # missing key raises a clear 500 from resolve_price_id().
            plan_price_id = get_plan_price_id(plan, billing, stripe)
            line_items = [{"price": plan_price_id, "quantity": 1}]

            for addon in requested_addons:
                addon_price_id = get_addon_price_id(addon, billing, stripe)
                line_items.append({"price": addon_price_id, "quantity": 1})

            # Stash the choice on the session so the webhook can record it
            # against the user when checkout completes.
            metadata = {
                "plan": plan,
                "billing": billing,
                "addons": ",".join(requested_addons),
            }

            # Let Stripe auto-select best payment methods per customer country
            session = stripe.checkout.Session.create(
                line_items=line_items,
                mode=mode,
                success_url=body.success_url,
                cancel_url=body.cancel_url,
                metadata=metadata,
                automatic_payment_methods={"enabled": True},
            )

            return CheckoutResponse(
                checkout_url=session.url,
                session_id=session.id,
            )

        except ImportError:
            logger.warning("stripe package not installed, falling back to dev mode")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Stripe error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Payment service error: {str(e)}")

    # ── Development: Mock checkout ───────────────────────────────────────
    total = plan_info.price_total if plan_info else 0
    logger.info(
        f"[DEV MODE] Mock checkout for plan={plan}, billing={billing}, "
        f"addons={requested_addons}, total={total}€"
    )
    return CheckoutResponse(
        checkout_url=f"{body.success_url}&plan={plan}&mock=true",
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
