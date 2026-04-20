"""Thin httpx wrapper around the Telegram Bot HTTP API.

Used by the @BetsPlug auto-poster — no user-management flows, no bot
commands, just channel posting + message edits. The library choice is
deliberate: `python-telegram-bot` ships a full update dispatcher we
don't need for a publisher, and it pulls in ~20 transitive deps; our
use-case is three endpoints (`sendMessage`, `editMessageText`,
`getMe` for the health probe) which `httpx` (already a project dep)
handles cleanly.

All callers MUST await these coroutines from an async context (e.g.
a FastAPI route handler or a Celery task that spins up an event
loop). The returned `message_id` should be persisted in the
``telegram_posts`` table so follow-up edits (result updates) can
target the original post.

When ``settings.telegram_bot_token`` is empty the functions log the
rendered message at INFO level and return a synthetic ``-1`` message
id. This keeps local development — and the CI test suite — free of
external dependencies. Production requires the token to be set in
Railway env; a missing token is NOT a silent no-op there, we log a
single WARNING per process so the outage is obvious in Sentry.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_API_ROOT = "https://api.telegram.org"
_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


class TelegramError(RuntimeError):
    """Raised on a non-200 response from the Bot API.

    Callers that want a silent best-effort post (e.g. the scheduled
    picks task) should catch this and log — propagating would let one
    bad post kill the Celery worker cycle.
    """


def _token() -> str:
    settings = get_settings()
    return settings.telegram_bot_token


async def _post_api(method: str, payload: dict) -> dict:
    """POST to `https://api.telegram.org/bot<TOKEN>/<method>`.

    Returns the `result` block on success, raises TelegramError on
    failure. Keeps the HTTP client call local so a caller can't
    accidentally fire off requests with a bogus cached client.
    """
    token = _token()
    if not token:
        raise TelegramError(
            "TELEGRAM_BOT_TOKEN is not set; cannot call Telegram API."
        )

    url = f"{_API_ROOT}/bot{token}/{method}"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(url, json=payload)
    if resp.status_code != 200:
        raise TelegramError(
            f"Telegram {method} returned HTTP {resp.status_code}: "
            f"{resp.text[:400]}"
        )
    body = resp.json()
    if not body.get("ok"):
        raise TelegramError(
            f"Telegram {method} returned ok=false: "
            f"{body.get('description', '<no description>')}"
        )
    return body.get("result") or {}


async def post_to_channel(channel: str, message: str) -> int:
    """Post a plain-text message to the given channel.

    Returns the Telegram `message_id` (int). If the bot token is not
    configured, logs the would-be message and returns -1 so local
    dev / tests keep flowing without mocking.

    `channel` may be an `@handle` or a numeric chat id. The caller
    typically passes ``settings.telegram_channel_free`` (= @BetsPlug
    by default) or the optional test channel.
    """
    token = _token()
    if not token:
        logger.info(
            "telegram: dry-run (no token) channel=%s len=%d preview=%r",
            channel,
            len(message),
            message[:80],
        )
        return -1

    payload = {
        "chat_id": channel,
        "text": message,
        # `disable_web_page_preview` keeps the betsplug.com mention at
        # the bottom from ballooning into a big link card that buries
        # the pick itself.
        "disable_web_page_preview": True,
    }
    try:
        result = await _post_api("sendMessage", payload)
    except TelegramError as e:
        logger.error("telegram: sendMessage failed: %s", e)
        raise
    return int(result.get("message_id", -1))


async def update_message(
    channel: str, message_id: int, new_text: str
) -> None:
    """Edit an existing Telegram post in-place.

    Used by ``update_pick_with_result`` to append the final score to
    a pick that's already on the channel, so users don't have to hunt
    for a separate result post. Falls back to logging when the token
    is absent.
    """
    token = _token()
    if not token:
        logger.info(
            "telegram: dry-run edit (no token) channel=%s id=%d len=%d",
            channel,
            message_id,
            len(new_text),
        )
        return

    payload = {
        "chat_id": channel,
        "message_id": message_id,
        "text": new_text,
        "disable_web_page_preview": True,
    }
    try:
        await _post_api("editMessageText", payload)
    except TelegramError as e:
        # An "message is not modified" error means the text matches
        # exactly what is already on the channel; that's a no-op, not
        # a failure. Everything else bubbles up.
        if "message is not modified" in str(e).lower():
            return
        logger.error("telegram: editMessageText failed: %s", e)
        raise


async def health_probe() -> Optional[dict]:
    """Call `getMe` as a cheap auth/token health check.

    Useful for an admin endpoint that tells the operator whether the
    token configured in Railway actually works. Returns the bot's
    profile dict on success, or None when the token is absent.
    """
    token = _token()
    if not token:
        return None
    try:
        return await _post_api("getMe", {})
    except TelegramError as e:
        logger.error("telegram: health_probe failed: %s", e)
        return None


__all__ = [
    "TelegramError",
    "post_to_channel",
    "update_message",
    "health_probe",
]
