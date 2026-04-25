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
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.models.subscription import (
    Payment,
    PaymentStatus,
    PlanType,
    Subscription,
    SubscriptionStatus,
)
from app.services.email import (
    send_subscription_cancelled_email,
    send_welcome_email,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Schemas ─────────────────────────────────────────────────────────────────

class CreateCheckoutRequest(BaseModel):
    plan: str  # bronze, silver, gold, platinum (legacy: basic, standard, premium, lifetime)
    billing: str = "monthly"  # "monthly" or "yearly"
    addons: list[str] = []    # ["telegram", "tipOfDay"]
    # When True we wrap the subscription in a 7-day Stripe-native trial:
    # the customer enters a payment method but is charged €0,00 today,
    # then the full plan price kicks in on day 8. Only valid for the
    # recurring plans (silver/gold). Bronze/Platinum are one-time so a
    # trial makes no sense for them.
    with_trial: bool = False
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
    current_user: User = Depends(get_current_user),
):
    """
    Create a Stripe Checkout Session for the selected plan.

    Requires an authenticated user AND a verified email — users can
    register + browse without verifying, but they must verify before
    they can pay for a subscription. Unverified users get a 403 with
    ``detail="email_not_verified"`` which the frontend matches on to
    show a "verify your email" banner + resend button.

    The user's id and email are attached to the Stripe session via
    ``client_reference_id`` and metadata so the webhook can upsert
    the subscription against the correct account.

    When Stripe is not configured, returns a mock session for development.
    In production, this creates a real Stripe checkout URL.
    """
    settings = get_settings()

    # ── Email verification gate ───────────────────────────────────────────
    # We intentionally block at *checkout* creation time rather than at
    # login so users can explore the app before verifying, but can't
    # reach Stripe without a confirmed email.
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="email_not_verified",
        )

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

    # Trial flag is only valid for recurring plans (silver/gold). Bronze
    # is already a €0,01 one-time charge and Platinum is a one-time
    # lifetime purchase, neither has any meaningful "trial" concept.
    with_trial = bool(body.with_trial) and mode == "subscription"

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
                "user_id": str(current_user.id),
                "user_email": current_user.email,
                "with_trial": "1" if with_trial else "0",
            }

            # Explicit list so the customer always sees a real choice on the
            # hosted Stripe Checkout page. Without this, Stripe's "dynamic
            # payment methods" picks just one option for NL/EUR customers
            # (iDEAL) and the card option disappears.
            #
            # `card` automatically also surfaces Apple Pay, Google Pay and
            # Link on supported devices — they don't need separate entries.
            #
            # `revolut_pay` only supports one-time payments, not recurring,
            # so we add it for `mode="payment"` (Platinum lifetime) but
            # not for `mode="subscription"` (Silver / Gold).
            #
            # Each method MUST be enabled in the Stripe Dashboard under
            # Settings → Payments → Payment methods, otherwise Stripe will
            # reject the session with `Invalid payment_method_type`.
            payment_method_types = ["card", "ideal", "paypal"]
            if mode == "payment":
                payment_method_types.append("revolut_pay")

            session_kwargs: dict = {
                "line_items": line_items,
                "mode": mode,
                "success_url": body.success_url,
                "cancel_url": body.cancel_url,
                "metadata": metadata,
                "client_reference_id": str(current_user.id),
                "customer_email": current_user.email,
                "payment_method_types": payment_method_types,
            }

            # Stripe-native 7-day trial. The customer enters a payment
            # method but is charged €0,00 today; Stripe verifies the card
            # via SetupIntent (so fake / declined cards are still rejected
            # — same fraud protection as the old €0,01 Bronze workaround,
            # but now Card / PayPal / Apple Pay all work because the
            # amount-minimum filter doesn't kick in).
            if with_trial:
                session_kwargs["subscription_data"] = {
                    "trial_period_days": 7,
                    "metadata": {
                        "plan": plan,
                        "billing": billing,
                        "user_id": str(current_user.id),
                    },
                }
                # Force collection of a payment method even though nothing
                # is charged today — without this Stripe could allow the
                # trial without a card on file, which defeats the
                # anti-fraud purpose.
                session_kwargs["payment_method_collection"] = "always"

            session = stripe.checkout.Session.create(**session_kwargs)

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
        try:
            metadata = data.get("metadata") or {}
            plan = metadata.get("plan", "unknown")
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")
            checkout_session_id = data.get("id")
            payment_intent_id = data.get("payment_intent")
            amount_total = data.get("amount_total") or 0
            currency = (data.get("currency") or "eur").lower()
            customer_email = (
                data.get("customer_details", {}).get("email")
                or data.get("customer_email")
                or metadata.get("user_email")
            )

            # Prefer explicit user_id (client_reference_id or metadata) so
            # the checkout is always pinned to the account that initiated
            # it, even when Stripe strips the email on the way back.
            user_id_str = (
                data.get("client_reference_id")
                or metadata.get("user_id")
            )

            logger.info(
                "Checkout completed: plan=%s, customer=%s, subscription=%s, "
                "email=%s, user_id=%s",
                plan, customer_id, subscription_id, customer_email, user_id_str,
            )

            user: User | None = None
            if user_id_str:
                try:
                    user_uuid = uuid.UUID(user_id_str)
                    result = await db.execute(
                        select(User).where(User.id == user_uuid)
                    )
                    user = result.scalar_one_or_none()
                except ValueError:
                    logger.warning(
                        "Stripe webhook sent invalid user_id=%r, falling back to email",
                        user_id_str,
                    )

            if user is None and customer_email:
                result = await db.execute(
                    select(User).where(User.email == customer_email)
                )
                user = result.scalar_one_or_none()

            if user is None and customer_email:
                # Legacy path — create a shell user if we really can't find one.
                user = User(
                    email=customer_email,
                    username=customer_email.split("@")[0],
                    hashed_password="stripe_managed",
                    is_active=True,
                    email_verified=True,
                )
                db.add(user)
                await db.flush()
                logger.info("Created new user for Stripe customer: %s", customer_email)

            if user is None:
                logger.error(
                    "Could not resolve user for Stripe session %s — skipping upsert",
                    checkout_session_id,
                )
                return {"status": "ok"}

            # Map plan string to PlanType enum
            plan_map = {
                "basic": PlanType.BASIC, "bronze": PlanType.BASIC,
                "standard": PlanType.STANDARD, "silver": PlanType.STANDARD,
                "premium": PlanType.PREMIUM, "gold": PlanType.PREMIUM,
                "lifetime": PlanType.LIFETIME, "platinum": PlanType.LIFETIME,
            }
            plan_type = plan_map.get(str(plan).lower(), PlanType.BASIC)
            is_lifetime = plan_type == PlanType.LIFETIME

            # Bronze is a one-time €0,01 payment that unlocks Gold-tier
            # access for exactly 7 days. Stripe does not manage the
            # expiry (it's a `mode=payment`, not a subscription), so we
            # set the end-date ourselves and flag the sub as TRIALING.
            now_utc = datetime.now(timezone.utc)
            is_bronze_trial = plan_type == PlanType.BASIC
            if is_bronze_trial:
                period_end = now_utc + timedelta(days=7)
                initial_status = SubscriptionStatus.TRIALING
            else:
                period_end = None  # recurring plans: Stripe sets this via invoice webhooks
                initial_status = SubscriptionStatus.ACTIVE

            # Upsert subscription for the resolved user
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == user.id)
            )
            existing_sub = result.scalar_one_or_none()

            if existing_sub:
                # Upgrading from a recurring plan (Silver/Gold) to lifetime
                # Platinum kills the new subscription_id (one-time payments
                # have none) and orphans the old Stripe subscription, which
                # would otherwise keep billing the customer monthly. Cancel
                # the old subscription on Stripe before we overwrite the
                # column.
                if (
                    is_lifetime
                    and existing_sub.stripe_subscription_id
                    and existing_sub.stripe_subscription_id != subscription_id
                ):
                    stripe_key = getattr(settings, "stripe_secret_key", None)
                    if stripe_key and stripe_key != "sk_test_placeholder":
                        try:
                            import stripe

                            stripe.api_key = stripe_key
                            stripe.Subscription.cancel(
                                existing_sub.stripe_subscription_id
                            )
                            logger.info(
                                "Cancelled prior Stripe subscription %s for "
                                "user=%s upgrading to lifetime Platinum",
                                existing_sub.stripe_subscription_id, user.id,
                            )
                        except Exception as cancel_exc:  # noqa: BLE001
                            logger.error(
                                "Failed to cancel prior Stripe sub %s on "
                                "Platinum upgrade for user=%s: %s",
                                existing_sub.stripe_subscription_id,
                                user.id, cancel_exc,
                            )

                existing_sub.plan_type = plan_type
                existing_sub.status = initial_status
                existing_sub.stripe_customer_id = customer_id
                existing_sub.stripe_subscription_id = subscription_id
                existing_sub.is_lifetime = is_lifetime
                existing_sub.current_period_start = now_utc
                existing_sub.cancel_at_period_end = False
                if period_end is not None:
                    existing_sub.current_period_end = period_end
            else:
                new_sub = Subscription(
                    user_id=user.id,
                    plan_type=plan_type,
                    status=initial_status,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    is_lifetime=is_lifetime,
                    current_period_start=now_utc,
                    current_period_end=period_end,
                )
                db.add(new_sub)

            # Record the payment for the finance dashboard / user invoices.
            try:
                amount_eur = float(amount_total) / 100.0
                payment_row = Payment(
                    user_id=user.id,
                    stripe_payment_intent_id=payment_intent_id,
                    stripe_checkout_session_id=checkout_session_id,
                    amount=amount_eur,
                    currency=currency,
                    status=PaymentStatus.SUCCEEDED,
                    plan_type=plan_type,
                    description=f"{plan_type.value.title()} plan subscription",
                )
                db.add(payment_row)
            except Exception as payment_exc:  # noqa: BLE001
                logger.error(
                    "Failed to record payment for user=%s session=%s err=%s",
                    user.id, checkout_session_id, payment_exc,
                )

            await db.commit()
            logger.info(
                "Subscription activated: user=%s, plan=%s, payment=%s",
                user.email, plan, checkout_session_id,
            )

            # Fire-and-forget notification email. Any failure is swallowed
            # so the webhook still returns 200.
            #
            # We send a single branded "subscription activated" email that
            # combines the welcome + plan summary + manage-subscription link.
            # Stripe sends its own PDF invoice receipt for the actual charge,
            # so a second receipt mail from us would just be duplicate noise.
            try:
                next_billing_str = (
                    period_end.strftime("%d %B %Y") if period_end else None
                )
                await send_welcome_email(
                    to=user.email,
                    username=user.username,
                    plan=plan_type.value,
                    amount=float(amount_total) / 100.0 if amount_total else None,
                    currency=currency,
                    next_billing_date=next_billing_str,
                    is_lifetime=is_lifetime,
                )
            except Exception as email_exc:  # noqa: BLE001
                logger.error("Welcome email failed: %s", email_exc)
        except Exception as outer_exc:  # noqa: BLE001
            logger.error(
                "checkout.session.completed handler failed: %s",
                outer_exc,
                exc_info=True,
            )

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


# ─── Authenticated /me endpoints ────────────────────────────────────────────


class MySubscriptionResponse(BaseModel):
    """Detailed subscription view for the logged-in user.

    Returned by ``GET /subscriptions/me`` — used by the frontend to render
    the billing / account page.
    """

    has_subscription: bool
    plan: str | None = None
    status: str | None = None
    is_lifetime: bool = False
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False
    stripe_customer_id: str | None = None


@router.get("/me", response_model=MySubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MySubscriptionResponse:
    """Return the authenticated user's subscription status."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalar_one_or_none()

    if sub is None:
        return MySubscriptionResponse(has_subscription=False)

    return MySubscriptionResponse(
        has_subscription=sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING)
        or sub.is_lifetime,
        plan=sub.plan_type.value,
        status=sub.status.value,
        is_lifetime=sub.is_lifetime,
        current_period_end=sub.current_period_end,
        cancel_at_period_end=sub.cancel_at_period_end,
        stripe_customer_id=sub.stripe_customer_id,
    )


@router.post("/me/cancel", response_model=MySubscriptionResponse)
async def cancel_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MySubscriptionResponse:
    """Schedule the user's active subscription for cancellation at period end.

    Does NOT cancel immediately — the user keeps access until the current
    billing period ends. Mirrors the change to Stripe via
    ``Subscription.modify(sub_id, cancel_at_period_end=True)``.
    """
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalar_one_or_none()

    if sub is None:
        raise HTTPException(
            status_code=404, detail="No subscription found for this account"
        )

    if sub.is_lifetime:
        raise HTTPException(
            status_code=400, detail="Lifetime plans cannot be cancelled"
        )

    # Mirror to Stripe if we have a subscription id. Don't fail the whole
    # call on Stripe errors — we still flag the local row and the webhook
    # will converge eventually.
    settings = get_settings()
    stripe_key = getattr(settings, "stripe_secret_key", None)
    if stripe_key and stripe_key != "sk_test_placeholder" and sub.stripe_subscription_id:
        try:
            import stripe

            stripe.api_key = stripe_key
            stripe.Subscription.modify(
                sub.stripe_subscription_id,
                cancel_at_period_end=True,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "Failed to cancel Stripe subscription %s: %s",
                sub.stripe_subscription_id, exc,
            )

    sub.cancel_at_period_end = True
    await db.flush()

    try:
        access_until = (
            sub.current_period_end.strftime("%d %B %Y")
            if sub.current_period_end
            else None
        )
        await send_subscription_cancelled_email(
            to=current_user.email,
            username=current_user.username or current_user.email.split("@")[0],
            plan=sub.plan_type.value,
            access_until=access_until,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to send cancel-confirmation email to %s: %s",
            current_user.email, exc,
        )

    return MySubscriptionResponse(
        has_subscription=sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING)
        or sub.is_lifetime,
        plan=sub.plan_type.value,
        status=sub.status.value,
        is_lifetime=sub.is_lifetime,
        current_period_end=sub.current_period_end,
        cancel_at_period_end=sub.cancel_at_period_end,
        stripe_customer_id=sub.stripe_customer_id,
    )


# ─── Billing Portal ────────────────────────────────────────────────────────


class BillingPortalResponse(BaseModel):
    """Stripe-hosted self-service URL the frontend should redirect to."""

    url: str


@router.post("/billing-portal", response_model=BillingPortalResponse)
async def create_billing_portal_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BillingPortalResponse:
    """Create a Stripe Billing Portal session for the current user.

    The portal lets customers update their payment method, change plan,
    download past invoices, and cancel — all on a Stripe-hosted page.
    The frontend should redirect the browser to the returned URL.

    Stripe redirects the user back to ``{frontend_url}/subscription``
    when they're done in the portal.
    """
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if sub is None or not sub.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "No Stripe customer on file. Subscribe to a paid plan first "
                "before opening the billing portal."
            ),
        )

    settings = get_settings()
    stripe_key = getattr(settings, "stripe_secret_key", None)
    if not stripe_key or stripe_key == "sk_test_placeholder":
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured on the server.",
        )

    return_url = (
        (settings.frontend_url or "https://betsplug.com").rstrip("/")
        + "/subscription"
    )

    try:
        import stripe

        stripe.api_key = stripe_key
        portal_session = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=return_url,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to create Stripe billing portal session for user=%s: %s",
            current_user.id, exc,
        )
        raise HTTPException(
            status_code=502,
            detail="Could not open the Stripe billing portal. Please try again.",
        ) from exc

    return BillingPortalResponse(url=portal_session.url)
