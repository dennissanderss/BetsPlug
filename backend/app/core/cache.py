"""Redis caching layer for BetsPlug.

Provides simple get/set with JSON serialization and TTL.
Falls back gracefully when Redis is unavailable.

Usage:
    from app.core.cache import cache_get, cache_set

    data = await cache_get("strategy:metrics:abc123")
    if data is None:
        data = expensive_calculation()
        await cache_set("strategy:metrics:abc123", data, ttl=900)
"""

import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.core.config import get_settings

log = logging.getLogger(__name__)

_client: Optional[aioredis.Redis] = None


def _get_client() -> Optional[aioredis.Redis]:
    """Lazy-initialize the async Redis client."""
    global _client
    if _client is not None:
        return _client

    settings = get_settings()
    url = settings.redis_url
    if not url or "redis" not in url:
        return None

    try:
        _client = aioredis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
        )
        return _client
    except Exception as exc:
        log.warning("Redis client init failed: %s", exc)
        return None


async def cache_get(key: str) -> Optional[Any]:
    """Get a cached value. Returns None if not found or Redis unavailable."""
    client = _get_client()
    if client is None:
        return None

    try:
        raw = await client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        log.debug("Cache get failed for %s: %s", key, exc)
        return None


async def cache_set(key: str, value: Any, ttl: int = 900) -> bool:
    """Set a cached value with TTL in seconds. Returns True if successful."""
    client = _get_client()
    if client is None:
        return False

    try:
        raw = json.dumps(value, default=str)
        await client.set(key, raw, ex=ttl)
        return True
    except Exception as exc:
        log.debug("Cache set failed for %s: %s", key, exc)
        return False


async def cache_delete(pattern: str) -> int:
    """Delete all keys matching pattern. Returns count deleted."""
    client = _get_client()
    if client is None:
        return 0

    try:
        keys = []
        async for key in client.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            return await client.delete(*keys)
        return 0
    except Exception:
        return 0


async def redis_ping() -> bool:
    """Check if Redis is reachable."""
    client = _get_client()
    if client is None:
        return False

    try:
        return await client.ping()
    except Exception:
        return False
