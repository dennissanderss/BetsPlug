"""Async email service for BetsPlug.

Uses aiosmtplib to send transactional emails (email verification, password
reset, welcome, payment receipts). When ``settings.smtp_host`` is empty the
emails are logged to stdout instead of being delivered, so developers can
copy the verification/reset links straight from the logs.

All templates are inline, simple responsive HTML with the BetsPlug brand
colours and a Dutch + English body so users on either language get a
readable email without a i18n round-trip.
"""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Low-level send
# ---------------------------------------------------------------------------


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
    action_url: str | None = None,
) -> bool:
    """Send an email via async SMTP.

    When SMTP is not configured (``smtp_host`` empty) the message is logged
    to stdout so developers can copy verification or reset links during
    local development. Always returns ``True`` on the dev path; returns
    ``False`` on SMTP failures (but never raises) so the calling endpoint
    can decide whether to surface the error to the user.

    Parameters
    ----------
    action_url:
        Optional canonical action URL (e.g. verification or reset link).
        When supplied and SMTP is in dev-mode, the URL is logged on its
        own highly-visible line so admins can ``grep '[ACTION URL]'``
        Railway logs and copy the link directly to the user.
    """
    settings = get_settings()

    if not settings.smtp_host:
        # Log a fat banner that's trivial to grep for in Railway logs.
        # Admin workflow: `railway logs | grep -A 3 "EMAIL DEV MODE"` or
        # just scroll once and copy the URL from the highlighted block.
        banner = "=" * 72
        logger.warning(
            "\n%s\n[EMAIL DEV MODE] SMTP not configured — NO real email sent\n%s",
            banner, banner,
        )
        logger.warning("  To:      %s", to)
        logger.warning("  Subject: %s", subject)
        if action_url:
            logger.warning("  [ACTION URL] %s", action_url)
        logger.warning(
            "  Configure SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD "
            "/ SMTP_FROM in Railway env to actually send emails."
        )
        logger.warning("%s", banner)
        if text:
            logger.info("Text body:\n%s", text)
        return True

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    if text:
        message.set_content(text)
        message.add_alternative(html, subtype="html")
    else:
        message.set_content(
            "This email requires an HTML-capable client to view."
        )
        message.add_alternative(html, subtype="html")

    # Port 465 uses *implicit* TLS (connection is SSL from byte 0), while
    # port 587 uses STARTTLS (upgrades a plaintext connection to TLS).
    # aiosmtplib exposes these as two different flags (``use_tls`` vs
    # ``start_tls``) that must not both be true at the same time, so we
    # pick based on the port. Providers that matter:
    #   - Hostinger / Gmail SSL:  465 → use_tls=True
    #   - SendGrid / Mailgun:     587 → start_tls=True
    # ``smtp_use_tls`` still gates whether we negotiate TLS at all, so
    # setting it to False disables encryption entirely (dev/loopback only).
    use_ssl = settings.smtp_port == 465 and settings.smtp_use_tls
    use_starttls = settings.smtp_port != 465 and settings.smtp_use_tls
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            start_tls=use_starttls,
            use_tls=use_ssl,
        )
        logger.info("Email sent to=%s subject=%r", to, subject)
        return True
    except Exception as exc:  # noqa: BLE001 — never break callers
        logger.error(
            "Email send failed to=%s subject=%r err=%s", to, subject, exc
        )
        if action_url:
            # Even when send fails, still log the URL so admin can
            # share it manually while the SMTP issue is being fixed.
            logger.warning(
                "[ACTION URL — SMTP failed, please share manually] %s",
                action_url,
            )
        return False


# ---------------------------------------------------------------------------
# Shared layout helper
# ---------------------------------------------------------------------------


def _layout(title: str, body_html: str) -> str:
    """Wrap a block of HTML in the responsive BetsPlug email shell."""
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
            <td style="padding:28px 32px 16px 32px;text-align:center;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);">
              <h1 style="margin:0;font-size:24px;line-height:1.2;color:#ffffff;">BetsPlug</h1>
              <p style="margin:4px 0 0 0;font-size:13px;color:#fff7ed;">Sports analytics, smarter picks</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#e5e7eb;font-size:15px;line-height:1.6;">
              {body_html}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;text-align:center;background:#0f172a;border-top:1px solid #1f2937;font-size:12px;color:#9ca3af;">
              &copy; BetsPlug &middot; <a href="https://betsplug.com" style="color:#fb923c;text-decoration:none;">betsplug.com</a>
              <br>You are receiving this email because of activity on your BetsPlug account.
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
        f'style="display:inline-block;padding:14px 28px;background:#f97316;color:#ffffff;'
        f'text-decoration:none;font-weight:600;border-radius:8px;margin:12px 0;">{label}</a>'
    )


# ---------------------------------------------------------------------------
# High-level templates
# ---------------------------------------------------------------------------


async def send_verification_email(to: str, token: str, username: str) -> bool:
    """Send the post-registration email verification message."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    verify_url = f"{base}/auth/verify-email?token={token}"

    subject = "Verify your BetsPlug account / Verifieer je BetsPlug-account"

    text = (
        f"Hi {username},\n\n"
        "Welcome to BetsPlug! Please verify your email address by opening "
        f"the link below:\n\n{verify_url}\n\n"
        "This link is valid for 24 hours.\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        "Welkom bij BetsPlug! Verifieer je e-mailadres door op onderstaande "
        f"link te klikken:\n\n{verify_url}\n\n"
        "Deze link is 24 uur geldig.\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:20px;">Welcome, {username}!</h2>
      <p>Thanks for signing up for BetsPlug. Please confirm your email address to activate your account.</p>
      <p style="text-align:center;">{_button("Verify email", verify_url)}</p>
      <p style="font-size:13px;color:#9ca3af;">Or copy this link into your browser:<br>
      <a href="{verify_url}" style="color:#fb923c;word-break:break-all;">{verify_url}</a></p>
      <p style="font-size:13px;color:#9ca3af;">This link is valid for 24 hours.</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">
      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;">Nederlands</h3>
      <p>Bedankt voor je aanmelding bij BetsPlug. Bevestig je e-mailadres om je account te activeren.</p>
      <p style="text-align:center;">{_button("E-mail bevestigen", verify_url)}</p>
      <p style="font-size:13px;color:#9ca3af;">Deze link is 24 uur geldig.</p>
    """
    return await send_email(
        to,
        subject,
        _layout("Verify your email", body),
        text,
        action_url=verify_url,
    )


async def send_password_reset_email(to: str, token: str, username: str) -> bool:
    """Send the forgot-password reset link."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    reset_url = f"{base}/auth/reset-password?token={token}"

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
      <a href="{reset_url}" style="color:#fb923c;word-break:break-all;">{reset_url}</a></p>
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


async def send_welcome_email(to: str, username: str, plan: str) -> bool:
    """Send a welcome email after a user successfully subscribes."""
    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    dashboard_url = f"{base}/dashboard"

    subject = f"Welcome to BetsPlug {plan.title()} / Welkom bij BetsPlug {plan.title()}"

    text = (
        f"Hi {username},\n\n"
        f"Your BetsPlug {plan.title()} plan is now active. "
        f"Head over to your dashboard to get started:\n\n{dashboard_url}\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        f"Je BetsPlug {plan.title()}-abonnement is nu actief. "
        f"Ga naar je dashboard om te beginnen:\n\n{dashboard_url}\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:20px;">You're in, {username}!</h2>
      <p>Your <strong>BetsPlug {plan.title()}</strong> plan is now active. Thanks for joining —
      we're excited to help you make smarter picks with data-driven predictions, strategy
      backtesting and daily insights.</p>
      <p style="text-align:center;">{_button("Go to dashboard", dashboard_url)}</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">
      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;">Nederlands</h3>
      <p>Je <strong>BetsPlug {plan.title()}</strong>-abonnement is nu actief. Bedankt voor je aanmelding!</p>
      <p style="text-align:center;">{_button("Naar dashboard", dashboard_url)}</p>
    """
    return await send_email(to, subject, _layout("Welcome to BetsPlug", body), text)


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
        f"We received your payment of {amount_str} for the BetsPlug {plan.title()} plan.\n\n"
        f"View your billing history: {billing_url}\n\n"
        "----\n\n"
        f"Hallo {username},\n\n"
        f"We hebben je betaling van {amount_str} ontvangen voor het BetsPlug {plan.title()}-abonnement.\n\n"
        f"Bekijk je betalingsgeschiedenis: {billing_url}\n\n"
        "- The BetsPlug team"
    )

    body = f"""
      <h2 style="margin:0 0 12px 0;color:#ffffff;font-size:20px;">Payment received</h2>
      <p>Hi {username}, thanks for your payment. Here are the details:</p>
      <table role="presentation" cellpadding="8" cellspacing="0" style="width:100%;background:#0f172a;border-radius:8px;margin:12px 0;">
        <tr><td style="color:#9ca3af;">Plan</td><td style="color:#ffffff;text-align:right;"><strong>{plan.title()}</strong></td></tr>
        <tr><td style="color:#9ca3af;">Amount</td><td style="color:#ffffff;text-align:right;"><strong>{amount_str}</strong></td></tr>
      </table>
      <p style="text-align:center;">{_button("View billing", billing_url)}</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">
      <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;">Nederlands</h3>
      <p>Bedankt voor je betaling van <strong>{amount_str}</strong> voor het BetsPlug {plan.title()}-abonnement.</p>
      <p style="text-align:center;">{_button("Betalingen bekijken", billing_url)}</p>
    """
    return await send_email(to, subject, _layout("Payment receipt", body), text)
