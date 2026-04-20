"""Compatibility shim — delegates to ``app.services.email``.

History
-------
This module used to be a second, synchronous SMTP implementation
(stdlib ``smtplib``) that disagreed with the async implementation in
``email.py`` on settings field names. Under the dual implementation
we had a silent production outage where every transactional email
was dropped. Resolved 2026-04-21 by moving to a single Resend HTTP
API sender (``email.py``) and reducing this module to a thin
forwarder.

This module exists only so ``abandoned_checkout_service.py`` and any
Celery task keep working without a sweeping rename. For new code,
import ``app.services.email.send_email`` directly.
"""

from __future__ import annotations

import asyncio
import logging

from app.services.email import send_email as _send_email_async

logger = logging.getLogger(__name__)


async def send_email(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str,
    reply_to: str | None = None,  # noqa: ARG001 — kept for API compat
) -> bool:
    """Forward to the canonical async sender.

    ``reply_to`` is ignored — the canonical sender doesn't support it.
    If we ever need it, add it as an optional kwarg to
    ``app.services.email.send_email`` instead of re-implementing SMTP
    here.
    """
    return await _send_email_async(
        to=to,
        subject=subject,
        html=html_body,
        text=text_body,
    )


def send_email_sync(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str,
    reply_to: str | None = None,  # noqa: ARG001 — kept for API compat
) -> bool:
    """Synchronous forwarder for Celery tasks.

    Runs the async ``send_email`` in a fresh event loop so the Celery
    worker (which has no running loop) can call it. Never raises —
    returns False on failure so the caller can decide whether to retry.
    """
    try:
        return asyncio.run(
            _send_email_async(
                to=to,
                subject=subject,
                html=html_body,
                text=text_body,
            )
        )
    except Exception as exc:  # noqa: BLE001 — Celery task must not crash
        logger.error(
            "send_email_sync failed: to=%s subject=%r err=%s", to, subject, exc
        )
        return False
