"""Async helper that writes one row to ``api_usage_log`` per outbound
provider call. Used by the v5 backfill admin endpoints and optionally by
the adapters themselves.

All writes go through an independent session (``async_session_factory``)
so a log failure cannot poison the caller's transaction. If the insert
fails the error is logged and swallowed — the scaling monitor is
advisory, not critical path.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from app.db.session import async_session_factory
from app.models.api_usage import ApiUsageLog

log = logging.getLogger(__name__)


async def record_api_call(
    provider: str,
    endpoint: str,
    status_code: int = 200,
    latency_ms: int = 0,
) -> None:
    """Record one outbound call. Fire-and-forget semantics."""
    try:
        async with async_session_factory() as db:
            db.add(
                ApiUsageLog(
                    id=uuid.uuid4(),
                    provider=provider,
                    endpoint=endpoint,
                    status_code=status_code,
                    latency_ms=latency_ms,
                    call_at=datetime.now(timezone.utc),
                )
            )
            await db.commit()
    except Exception as exc:  # pragma: no cover — advisory, never crash
        log.warning("api_usage_log_write_failed provider=%s err=%s", provider, exc)
