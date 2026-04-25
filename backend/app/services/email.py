"""Transactional email service for BetsPlug — Resend HTTP API.

Why Resend (not SMTP)
---------------------
Previous implementation used Hostinger SMTP via ``aiosmtplib``. It
suffered from three classes of failure that cost us ~2 weeks of
missing password-reset + verification emails:
  1. Env var name mismatches (SMTP_PASS vs SMTP_PASSWORD, MAIL_FROM_*
     vs SMTP_FROM) silently dropped credentials.
  2. Duplicated Pydantic Settings fields made ``smtp_host`` empty in
     production, which tripped an implicit dev-mode fallback that
     returned True without sending anything.
  3. Even when correctly configured, Hostinger SMTP had poor
     deliverability for transactional email — many legitimate
     password-reset mails landed in spam.

Resend's HTTP API removes the entire TLS / port / handshake surface
area. One POST → one email. Deliverability is tuned for transactional
flows (DKIM + SPF + DMARC + ARC signed on every send, shared IPs with
good reputation).

Public API
----------
Public functions are UNCHANGED from the SMTP era so existing callers
(auth routes, subscription webhooks, abandoned checkout) keep working
without edits:

    await send_email(to, subject, html, text, action_url=..., raise_on_failure=...)
    await send_verification_email(to, token, username)
    await send_password_reset_email(to, token, username)
    await send_welcome_email(to, username, plan)
    await send_payment_receipt_email(to, username, plan, amount, currency)
    await send_subscription_cancelled_email(to, username, plan, access_until=...)

Dev mode
--------
Set ``EMAIL_DEV_MODE=1`` to skip the Resend API and log messages to
stdout (useful for local dev when you don't want to burn your Resend
free-tier budget). Missing ``RESEND_API_KEY`` on production triggers
a LOUD ``[EMAIL MISCONFIG]`` error, not a silent success.
"""

from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


RESEND_API_URL = "https://api.resend.com/emails"


# ---------------------------------------------------------------------------
# Low-level send
# ---------------------------------------------------------------------------


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
    action_url: str | None = None,
    *,
    raise_on_failure: bool = False,
) -> bool:
    """Send an email via the Resend HTTP API.

    Behaviour matrix
    ----------------
    - ``EMAIL_DEV_MODE=1``: log message + action URL to stdout, return
      True. Explicit opt-in only; production must NEVER trip this.
    - Missing ``RESEND_API_KEY``: log a loud ``[EMAIL MISCONFIG]`` with
      the action URL (so an admin can share the link manually) and
      return False. Never silent.
    - API returns a non-2xx: log the response body and return False.
    - API returns 2xx: log the Resend message ID and return True.

    Parameters
    ----------
    action_url:
        Optional canonical action URL (verification / reset link).
        Logged on its own highly-visible line in dev-mode OR when a
        send fails, so an admin can ``grep '[ACTION URL]'`` Railway
        logs and share the link with the affected user.
    raise_on_failure:
        When True, transport errors are re-raised instead of being
        swallowed. Used by the admin diagnostics endpoint
        (``POST /auth/admin/test-email``) so the real error reaches
        the browser rather than disappearing into logs.
    """
    settings = get_settings()

    # Explicit dev-mode opt-in — local dev only. Production leaving
    # EMAIL_DEV_MODE unset means real sends.
    if settings.email_dev_mode:
        banner = "=" * 72
        logger.warning(
            "\n%s\n[EMAIL DEV MODE] EMAIL_DEV_MODE=1 — NO real email sent\n%s",
            banner, banner,
        )
        logger.warning("  To:      %s", to)
        logger.warning("  Subject: %s", subject)
        if action_url:
            logger.warning("  [ACTION URL] %s", action_url)
        logger.warning("%s", banner)
        if text:
            logger.info("Text body:\n%s", text)
        return True

    # Production misconfig — loud error + no silent success.
    if not settings.resend_api_key:
        logger.error(
            "[EMAIL MISCONFIG] RESEND_API_KEY is not set. Email to=%s "
            "subject=%r NOT sent. Set RESEND_API_KEY in Railway env, or "
            "set EMAIL_DEV_MODE=1 to intentionally skip sends.",
            to, subject,
        )
        if action_url:
            logger.error(
                "[ACTION URL — email misconfigured, please share manually] %s",
                action_url,
            )
        if raise_on_failure:
            raise RuntimeError("RESEND_API_KEY not configured")
        return False

    payload: dict[str, object] = {
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text
    if settings.email_reply_to:
        payload["reply_to"] = settings.email_reply_to

    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Content-Type": "application/json",
    }

    logger.info(
        "[EMAIL RESEND] Sending from=%r to=%s subject=%r",
        settings.email_from, to, subject,
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(RESEND_API_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.error(
            "[EMAIL RESEND] ✗ Transport error to=%s subject=%r err_type=%s err=%s",
            to, subject, type(exc).__name__, exc,
        )
        if action_url:
            logger.error(
                "[ACTION URL — transport failed, please share manually] %s",
                action_url,
            )
        if raise_on_failure:
            raise
        return False

    if resp.status_code >= 400:
        logger.error(
            "[EMAIL RESEND] ✗ API error to=%s subject=%r status=%d body=%s",
            to, subject, resp.status_code, resp.text[:500],
        )
        if action_url:
            logger.error(
                "[ACTION URL — Resend rejected send, please share manually] %s",
                action_url,
            )
        if raise_on_failure:
            raise RuntimeError(
                f"Resend API returned {resp.status_code}: {resp.text[:200]}"
            )
        return False

    # Success path — Resend returns {"id": "<uuid>"} on 200.
    try:
        message_id = resp.json().get("id", "(no id)")
    except Exception:  # noqa: BLE001
        message_id = "(unparseable response)"
    logger.info(
        "[EMAIL RESEND] ✓ Sent OK to=%s subject=%r resend_id=%s",
        to, subject, message_id,
    )
    return True


# ---------------------------------------------------------------------------
# Shared layout helpers
# ---------------------------------------------------------------------------


_LOGO_URL = "https://betsplug.com/logo-email.png"


# Tier names in the database still use the legacy enum values
# (basic / standard / premium / lifetime) but every customer-facing
# touchpoint — pricing page, dashboard, checkout — uses the new names
# (Bronze / Silver / Gold / Platinum). Map them here so the mails
# stay consistent with the rest of the product.
_PLAN_DISPLAY = {
    "basic": "Bronze",
    "bronze": "Bronze",
    "standard": "Silver",
    "silver": "Silver",
    "premium": "Gold",
    "gold": "Gold",
    "lifetime": "Platinum",
    "platinum": "Platinum",
}


def _pretty_plan(plan: str | None) -> str:
    """Convert any internal plan key to the customer-facing tier name."""
    if not plan:
        return "BetsPlug"
    return _PLAN_DISPLAY.get(plan.strip().lower(), plan.title())


def _layout(title: str, body_html: str) -> str:
    """Wrap a block of HTML in the responsive BetsPlug email shell."""
    settings = get_settings()
    site = (settings.frontend_url or "https://betsplug.com").rstrip("/")
    return f"""\
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b1220;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;">
          <tr>
            <td style="padding:32px 32px 24px 32px;text-align:center;background:#0f172a;border-bottom:1px solid #1f2937;">
              <a href="{site}" style="text-decoration:none;">
                <img src="{_LOGO_URL}" width="180" alt="BetsPlug" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;max-width:180px;height:auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#e5e7eb;font-size:15px;line-height:1.6;">
              {body_html}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;text-align:center;background:#0f172a;border-top:1px solid #1f2937;font-size:12px;color:#9ca3af;">
              <a href="{site}" style="color:#4ade80;text-decoration:none;">betsplug.com</a>
              &nbsp;&middot;&nbsp;
              <a href="{site}/subscription" style="color:#4ade80;text-decoration:none;">Manage subscription</a>
              <br><br>
              &copy; BetsPlug &middot; You are receiving this email because of activity on your BetsPlug account.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _button(label: str, url: str) -> str:
    return (
        f'<a href="{url}" '
        f'style="display:inline-block;padding:14px 28px;background:#4ade80;color:#0b1220;'
        f'text-decoration:none;font-weight:600;border-radius:8px;margin:12px 0;">{label}</a>'
    )


# ---------------------------------------------------------------------------
# High-level templates
# ---------------------------------------------------------------------------


async def send_verification_email(to: str, token: str, username: str) -> bool:
    """Send the post-registration welcome + verification message."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    verify_url = f"{base}/verify-email?token={token}"
    site_url = base
    account_url = f"{base}/subscription"

    subject = f"Welcome to BetsPlug, {username} — verify your email"

    text = (
        f"Hi {username},\n\n"
        "Welcome to BetsPlug — AI-powered football predictions backed by data, "
        "not guesswork.\n\n"
        f"Please verify your email address to activate your account:\n\n{verify_url}\n\n"
        "This link is valid for 24 hours.\n\n"
        f"After verifying, you can browse predictions at {site_url} and "
        f"manage your account at {account_url}.\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        "Welkom bij BetsPlug — AI-voetbalvoorspellingen op basis van data, "
        "niet op gevoel.\n\n"
        f"Verifieer je e-mailadres om je account te activeren:\n\n{verify_url}\n\n"
        "Deze link is 24 uur geldig.\n\n"
        f"Daarna kun je voorspellingen bekijken op {site_url} en je account "
        f"beheren via {account_url}.\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:22px;">Welcome to BetsPlug, {username}!</h2>
      <p style="margin:0 0 16px 0;">Thanks for joining — you now have access to AI-powered football predictions, daily picks and our full track record.</p>
      <p style="margin:0 0 12px 0;">One last step: verify your email to unlock your full account and start receiving picks.</p>
      <p style="text-align:center;margin:24px 0;">{_button("Verify my email", verify_url)}</p>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 4px 0;">Or copy this link into your browser:</p>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 16px 0;word-break:break-all;">
        <a href="{verify_url}" style="color:#4ade80;word-break:break-all;">{verify_url}</a>
      </p>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 24px 0;">This link is valid for 24 hours.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#0f172a;border-radius:8px;border:1px solid #1f2937;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 8px 0;color:#ffffff;font-weight:600;">While you're here</p>
            <p style="margin:0 0 6px 0;font-size:14px;">
              &rarr; <a href="{site_url}" style="color:#4ade80;text-decoration:none;">Browse today's free predictions</a>
            </p>
            <p style="margin:0;font-size:14px;">
              &rarr; <a href="{account_url}" style="color:#4ade80;text-decoration:none;">Choose a plan or manage your account</a>
            </p>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #1f2937;margin:28px 0;">

      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:18px;">Nederlands</h3>
      <p style="margin:0 0 12px 0;">Welkom, {username}! Je hebt nu toegang tot AI-voetbalvoorspellingen, dagelijkse picks en ons volledige track record.</p>
      <p style="margin:0 0 12px 0;">Nog &eacute;&eacute;n stap: bevestig je e-mailadres om je account volledig te activeren.</p>
      <p style="text-align:center;margin:24px 0;">{_button("E-mail bevestigen", verify_url)}</p>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 12px 0;">Deze link is 24 uur geldig.</p>
      <p style="font-size:14px;margin:12px 0 4px 0;">
        &rarr; <a href="{site_url}" style="color:#4ade80;text-decoration:none;">Bekijk gratis voorspellingen</a>
      </p>
      <p style="font-size:14px;margin:0 0 4px 0;">
        &rarr; <a href="{account_url}" style="color:#4ade80;text-decoration:none;">Kies een abonnement of beheer je account</a>
      </p>
    """
    return await send_email(
        to,
        subject,
        _layout("Welcome to BetsPlug", body),
        text,
        action_url=verify_url,
    )


async def send_password_reset_email(to: str, token: str, username: str) -> bool:
    """Send the forgot-password reset link."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    reset_url = f"{base}/reset-password?token={token}"

    subject = "Reset your BetsPlug password / Reset je BetsPlug-wachtwoord"

    text = (
        f"Hi {username},\n\n"
        "We received a request to reset your BetsPlug password. "
        f"Open this link to set a new one:\n\n{reset_url}\n\n"
        "This link is valid for 1 hour. If you didn't request a reset, "
        "you can safely ignore this email.\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        "We hebben een verzoek ontvangen om je wachtwoord te resetten. "
        f"Open deze link om een nieuw wachtwoord in te stellen:\n\n{reset_url}\n\n"
        "Deze link is 1 uur geldig. Als je geen reset hebt aangevraagd, "
        "kun je deze e-mail negeren.\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:20px;">Password reset</h2>
      <p>Hi {username}, we received a request to reset your BetsPlug password.
      Click the button below to choose a new one.</p>
      <p style="text-align:center;">{_button("Reset password", reset_url)}</p>
      <p style="font-size:13px;color:#9ca3af;">Or copy this link into your browser:<br>
      <a href="{reset_url}" style="color:#4ade80;word-break:break-all;">{reset_url}</a></p>
      <p style="font-size:13px;color:#9ca3af;">This link is valid for 1 hour. If you didn't request a reset, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">
      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;">Nederlands</h3>
      <p>We hebben een verzoek ontvangen om je wachtwoord te resetten. Klik op de knop om een nieuw wachtwoord in te stellen.</p>
      <p style="text-align:center;">{_button("Wachtwoord resetten", reset_url)}</p>
      <p style="font-size:13px;color:#9ca3af;">Deze link is 1 uur geldig.</p>
    """
    return await send_email(
        to,
        subject,
        _layout("Reset your password", body),
        text,
        action_url=reset_url,
    )


async def send_welcome_email(
    to: str,
    username: str,
    plan: str,
    *,
    amount: float | None = None,
    currency: str = "eur",
    next_billing_date: str | None = None,
    is_lifetime: bool = False,
) -> bool:
    """Send a "subscription activated" email after a successful first payment.

    Combines the warm welcome + branded plan summary + manage-subscription
    link in a single mail. Stripe still sends its own PDF invoice for the
    actual charge — this mail covers the relational side (what you bought,
    when the next charge is, how to cancel).
    """
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    dashboard_url = f"{base}/dashboard"
    subscription_url = f"{base}/subscription"

    plan_title = _pretty_plan(plan)
    currency_upper = (currency or "EUR").upper()
    amount_str = f"{amount:.2f} {currency_upper}" if amount else None

    if is_lifetime:
        next_charge_en = "Lifetime access — no recurring charges."
        next_charge_nl = "Levenslange toegang — geen herhaalbetalingen."
    elif next_billing_date:
        next_charge_en = f"Next charge: {next_billing_date}"
        next_charge_nl = f"Volgende afschrijving: {next_billing_date}"
    else:
        next_charge_en = "Renews automatically each billing period."
        next_charge_nl = "Wordt automatisch elke factuurperiode verlengd."

    subject = f"Your BetsPlug {plan_title} plan is active"

    text = (
        f"Hi {username},\n\n"
        f"Your BetsPlug {plan_title} plan is active. {next_charge_en}\n\n"
        f"Dashboard: {dashboard_url}\n"
        f"Manage or cancel your subscription: {subscription_url}\n\n"
        "Stripe will email you a PDF invoice for every payment, separately.\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        f"Je BetsPlug {plan_title}-abonnement is actief. {next_charge_nl}\n\n"
        f"Dashboard: {dashboard_url}\n"
        f"Abonnement beheren of opzeggen: {subscription_url}\n\n"
        "Stripe stuurt je per betaling een PDF-factuur — apart van deze mail.\n\n"
        "- The BetsPlug team"
    )

    amount_row = (
        f"""
        <tr>
          <td style="padding:10px 12px;color:#9ca3af;border-top:1px solid #1f2937;">Amount paid</td>
          <td style="padding:10px 12px;color:#ffffff;text-align:right;border-top:1px solid #1f2937;"><strong>{amount_str}</strong></td>
        </tr>
        """
        if amount_str
        else ""
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:22px;">You're in, {username}!</h2>
      <p style="margin:0 0 16px 0;">Your <strong>BetsPlug {plan_title}</strong> plan is now active. Thanks for joining — let's make smarter picks together.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f172a;border-radius:8px;border:1px solid #1f2937;margin:20px 0;">
        <tr>
          <td style="padding:10px 12px;color:#9ca3af;">Plan</td>
          <td style="padding:10px 12px;color:#ffffff;text-align:right;"><strong>BetsPlug {plan_title}</strong></td>
        </tr>
        {amount_row}
        <tr>
          <td colspan="2" style="padding:12px;color:#9ca3af;border-top:1px solid #1f2937;font-size:13px;">{next_charge_en}</td>
        </tr>
      </table>

      <p style="text-align:center;margin:20px 0 8px 0;">{_button("Go to dashboard", dashboard_url)}</p>
      <p style="text-align:center;margin:0 0 20px 0;font-size:14px;">
        <a href="{subscription_url}" style="color:#4ade80;text-decoration:none;">Manage or cancel your subscription &rarr;</a>
      </p>

      <p style="font-size:13px;color:#9ca3af;margin:24px 0 0 0;">A separate PDF invoice for this payment will be emailed by Stripe.</p>

      <hr style="border:none;border-top:1px solid #1f2937;margin:28px 0;">

      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:18px;">Nederlands</h3>
      <p style="margin:0 0 12px 0;">Je <strong>BetsPlug {plan_title}</strong>-abonnement is actief. Bedankt voor je aanmelding!</p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#9ca3af;">{next_charge_nl}</p>
      <p style="text-align:center;margin:20px 0 8px 0;">{_button("Naar dashboard", dashboard_url)}</p>
      <p style="text-align:center;margin:0 0 12px 0;font-size:14px;">
        <a href="{subscription_url}" style="color:#4ade80;text-decoration:none;">Abonnement beheren of opzeggen &rarr;</a>
      </p>
      <p style="font-size:13px;color:#9ca3af;margin:16px 0 0 0;">Stripe stuurt je per betaling een PDF-factuur — apart van deze mail.</p>
    """
    return await send_email(to, subject, _layout("Subscription activated", body), text)


async def send_payment_receipt_email(
    to: str,
    username: str,
    plan: str,
    amount: float,
    currency: str,
) -> bool:
    """Send a payment receipt after a successful charge."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    billing_url = f"{base}/account/billing"

    currency_upper = (currency or "EUR").upper()
    amount_str = f"{amount:.2f} {currency_upper}"

    subject = f"BetsPlug payment receipt / Betalingsbewijs — {amount_str}"

    text = (
        f"Hi {username},\n\n"
        f"We received your payment of {amount_str} for the BetsPlug {_pretty_plan(plan)} plan.\n\n"
        f"View your billing history: {billing_url}\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        f"We hebben je betaling van {amount_str} ontvangen voor het BetsPlug {_pretty_plan(plan)}-abonnement.\n\n"
        f"Bekijk je betalingsgeschiedenis: {billing_url}\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:20px;">Payment received</h2>
      <p>Hi {username}, thanks for your payment. Here are the details:</p>
      <table role="presentation" cellpadding="8" cellspacing="0" style="width:100%;background:#0f172a;border-radius:8px;margin:12px 0;">
        <tr><td style="color:#9ca3af;">Plan</td><td style="color:#ffffff;text-align:right;"><strong>{_pretty_plan(plan)}</strong></td></tr>
        <tr><td style="color:#9ca3af;">Amount</td><td style="color:#ffffff;text-align:right;"><strong>{amount_str}</strong></td></tr>
      </table>
      <p style="text-align:center;">{_button("View billing", billing_url)}</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">
      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;">Nederlands</h3>
      <p>Bedankt voor je betaling van <strong>{amount_str}</strong> voor het BetsPlug {_pretty_plan(plan)}-abonnement.</p>
      <p style="text-align:center;">{_button("Betalingen bekijken", billing_url)}</p>
    """
    return await send_email(to, subject, _layout("Payment receipt", body), text)


async def send_subscription_cancelled_email(
    to: str,
    username: str,
    plan: str,
    access_until: str | None = None,
) -> bool:
    """Send a cancel-confirmation email when the user schedules a cancel."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    subscription_url = f"{base}/subscription"

    subject = "Your BetsPlug cancellation is scheduled / Je opzegging is verwerkt"

    until_en = (
        f" You keep full access until {access_until}."
        if access_until
        else " You keep full access until the end of your current billing period."
    )
    until_nl = (
        f" Je houdt volledige toegang tot {access_until}."
        if access_until
        else " Je houdt volledige toegang tot het einde van je huidige factuurperiode."
    )

    text = (
        f"Hi {username},\n\n"
        f"We've scheduled your BetsPlug {_pretty_plan(plan)} subscription for cancellation."
        f"{until_en} After that we won't charge you again — your card will not be debited.\n\n"
        f"Changed your mind? You can reactivate at any time before the end date:\n\n"
        f"{subscription_url}\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        f"Je opzegging van BetsPlug {_pretty_plan(plan)} is ingepland."
        f"{until_nl} Daarna wordt er niets meer automatisch afgeschreven.\n\n"
        f"Toch twijfel? Je kunt vóór de einddatum nog reactiveren:\n\n"
        f"{subscription_url}\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:20px;">Cancellation scheduled</h2>
      <p>Hi {username}, your <strong>BetsPlug {_pretty_plan(plan)}</strong> subscription has been scheduled for cancellation.{until_en} After that date no further automatic payments will be taken.</p>
      <p>Changed your mind? You can reactivate any time before the end date from your account:</p>
      <p style="text-align:center;">{_button("Manage subscription", subscription_url)}</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">
      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;">Nederlands</h3>
      <p>Je opzegging van <strong>BetsPlug {_pretty_plan(plan)}</strong> is ingepland.{until_nl} Daarna worden er geen automatische betalingen meer gedaan.</p>
      <p>Toch twijfel? Je kunt vóór de einddatum nog reactiveren in je account.</p>
      <p style="text-align:center;">{_button("Abonnement beheren", subscription_url)}</p>
    """
    return await send_email(to, subject, _layout("Cancellation scheduled", body), text)
