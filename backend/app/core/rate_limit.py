"""Redis-backed rate limiting middleware for FastAPI.

Uses a fixed-window counter per IP per route group.  Falls back to
"allow everything" when Redis is unreachable so a cache outage never
takes the API offline.

Route rules (evaluated top-to-bottom, first match wins):

    /api/auth/login        →  5 req / min
    /api/auth/register     →  5 req / min
    /api/admin/            → 10 req / min
    /api/predictions       → 30 req / min
    /api/                  → 60 req / min

Health / ping endpoints are always exempt.
"""

import logging
import time
from typing import List, Optional, Tuple

import redis.asyncio as aioredis
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings

log = logging.getLogger(__name__)

# ── Rules ──────────────────────────────────────────────────────────────────
# (path_prefix, max_requests, window_seconds)
RATE_LIMIT_RULES: List[Tuple[str, int, int]] = [
    ("/api/auth/login", 5, 60),
    ("/api/auth/register", 5, 60),
    ("/api/admin/", 10, 60),
    ("/api/predictions", 30, 60),
    ("/api/", 60, 60),
]

EXEMPT_PATHS = {"/api/ping", "/api/health"}

# ── Redis client (lazy, separate from the cache module) ────────────────────
_rl_client: Optional[aioredis.Redis] = None
_rl_init_failed: bool = False


def _get_rl_client() -> Optional[aioredis.Redis]:
    """Return a Redis client for rate-limiting, or None if unavailable."""
    global _rl_client, _rl_init_failed

    if _rl_client is not None:
        return _rl_client
    if _rl_init_failed:
        return None

    settings = get_settings()
    url = settings.redis_url
    if not url or "redis" not in url:
        _rl_init_failed = True
        return None

    try:
        _rl_client = aioredis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        log.info("Rate-limit Redis client initialised.")
        return _rl_client
    except Exception as exc:
        log.warning("Rate-limit Redis init failed: %s", exc)
        _rl_init_failed = True
        return None


# ── Helpers ────────────────────────────────────────────────────────────────

def _client_ip(request: Request) -> str:
    """Extract real client IP respecting proxy headers (Railway / Vercel)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


def _match_rule(path: str) -> Optional[Tuple[str, int, int]]:
    """Return the first matching rule for *path*, or None."""
    for prefix, limit, window in RATE_LIMIT_RULES:
        if path.startswith(prefix):
            return (prefix, limit, window)
    return None


# ── Middleware ─────────────────────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Fixed-window rate limiter backed by Redis INCR + EXPIRE."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Never throttle health probes
        if path in EXEMPT_PATHS:
            return await call_next(request)

        rule = _match_rule(path)
        if rule is None:
            return await call_next(request)

        prefix, limit, window = rule
        client = _get_rl_client()

        # Fail open: if Redis is down, let the request through
        if client is None:
            return await call_next(request)

        ip = _client_ip(request)
        bucket = int(time.time()) // window
        key = f"rl:{prefix}:{ip}:{bucket}"

        try:
            current = await client.incr(key)
            if current == 1:
                # First hit in this window — set expiry so the key auto-cleans
                await client.expire(key, window + 1)

            remaining = max(0, limit - current)
            reset_at = (bucket + 1) * window

            if current > limit:
                resp = JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Please try again later.",
                        "retry_after": window,
                    },
                )
            else:
                resp = await call_next(request)

            # Always attach informational headers
            resp.headers["X-RateLimit-Limit"] = str(limit)
            resp.headers["X-RateLimit-Remaining"] = str(remaining)
            resp.headers["X-RateLimit-Reset"] = str(reset_at)
            return resp

        except Exception as exc:
            # Redis hiccup → fail open
            log.debug("Rate-limit check failed (%s): %s", key, exc)
            return await call_next(request)
