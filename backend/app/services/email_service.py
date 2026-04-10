"""Email service - sends transactional emails via Hostinger SMTP.

Uses Python's built-in ``smtplib`` + ``email`` stdlib modules.
No external dependencies required.

Usage::

    from app.services.email_service import send_email

    await send_email(
        to="user@example.com",
        subject="Your checkout is waiting",
        html_body="<h1>Hello</h1>",
        text_body="Hello",
    )

The function is async-safe: it runs the blocking SMTP call in a
thread-pool executor so it never blocks the event loop.

For Celery workers (synchronous context), use ``send_email_sync()``
which calls SMTP directly without asyncio.
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import partial

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_email_sync(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str,
    reply_to: str | None = None,
) -> bool:
    """Send an email synchronously via Hostinger SMTP (SSL on port 465).

    Returns True on success, False on failure (logs the error).
    """
    settings = get_settings()

    if not settings.smtp_user or not settings.smtp_pass:
        logger.error("SMTP credentials not configured - skipping email to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.mail_from_name} <{settings.mail_from_address}>"
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to

    # Attach plain text first, then HTML (email clients prefer the last part)
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(
            settings.smtp_host,
            settings.smtp_port,
            context=context,
            timeout=30,
        ) as server:
            server.login(settings.smtp_user, settings.smtp_pass)
            server.send_message(msg)

        logger.info("Email sent successfully to %s (subject: %s)", to, subject)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed - check SMTP_USER / SMTP_PASS")
        return False
    except smtplib.SMTPRecipientsRefused:
        logger.error("Recipient refused by SMTP server: %s", to)
        return False
    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending to %s: %s", to, exc)
        return False
    except Exception as exc:
        logger.error("Unexpected error sending email to %s: %s", to, exc)
        return False


async def send_email(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str,
    reply_to: str | None = None,
) -> bool:
    """Async wrapper around ``send_email_sync``.

    Runs the blocking SMTP call in a thread-pool executor so it
    doesn't block the event loop (safe for FastAPI route handlers).
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(
            send_email_sync,
            to=to,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            reply_to=reply_to,
        ),
    )
