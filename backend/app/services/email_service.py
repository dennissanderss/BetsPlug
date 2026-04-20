"""Compatibility shim — delegates to ``app.services.email``.

History
-------
``email_service.py`` was a second SMTP implementation (synchronous,
via stdlib ``smtplib``) that read from a different set of settings
fields (``settings.smtp_pass``) than the async implementation in
``email.py`` (``settings.smtp_password``). The duplication caused a
silent production outage: the config file had two ``smtp_*`` blocks,
the second one winning and leaving ``smtp_host`` empty, which tripped
the dev-mode fallback and ate every transactional email.

Resolution: there is now a single SMTP stack (``app.services.email``,
async, ``aiosmtplib``). This module is kept only to avoid breaking
``abandoned_checkout_service.py`` which still imports ``send_email``
and ``send_email_sync`` from here. Both names below forward to the
canonical implementation.

Do not add new senders here. Use ``app.services.email.send_email``
directly.
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
