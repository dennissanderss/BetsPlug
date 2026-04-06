"""Health-check module for the Sports Intelligence Platform.

Provides lightweight probes for:
* Database connectivity (PostgreSQL via SQLAlchemy)
* Cache / broker connectivity (Redis)
* Celery worker availability

Public API
----------
    checker = HealthChecker()
    ok = await checker.check_db()
    ok = await checker.check_redis()
    ok = checker.check_celery()
    status = await checker.get_system_status()
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class HealthChecker:
    """Runs health probes for all platform dependencies."""

    # ------------------------------------------------------------------ #
    # Database probe                                                       #
    # ------------------------------------------------------------------ #

    async def check_db(self) -> bool:
        """Return True if the database accepts a simple SELECT 1 query.

        Uses a *short-lived* async session to avoid holding connections.
        Any exception (connection refused, auth failure, timeout) returns
        False rather than propagating.
        """
        try:
            from sqlalchemy import text
            from app.db.session import async_session_factory

            async with async_session_factory() as session:
                result = await session.execute(text("SELECT 1"))
                row = result.scalar()
                return row == 1

        except Exception as exc:
            logger.warning("DB health check failed: %s", exc)
            return False

    # ------------------------------------------------------------------ #
    # Redis probe                                                          #
    # ------------------------------------------------------------------ #

    async def check_redis(self) -> bool:
        """Return True if Redis accepts a PING command.

        Uses the synchronous redis-py client in a thread pool executor so
        we do not need aioredis as an extra dependency.
        """
        try:
            import asyncio
            import redis as sync_redis
            from app.core.config import get_settings

            settings = get_settings()

            def _ping() -> bool:
                client = sync_redis.Redis(
                    host=settings.redis_host,
                    port=settings.redis_port,
                    db=settings.redis_db,
                    socket_connect_timeout=3,
                    socket_timeout=3,
                )
                try:
                    return client.ping()
                finally:
                    client.close()

            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, _ping)

        except Exception as exc:
            logger.warning("Redis health check failed: %s", exc)
            return False

    # ------------------------------------------------------------------ #
    # Celery probe                                                         #
    # ------------------------------------------------------------------ #

    def check_celery(self) -> bool:
        """Return True if at least one Celery worker responds to a ping.

        This is a *synchronous* probe.  It broadcasts a ``ping`` control
        command and waits up to 2 seconds for any reply.
        """
        try:
            from app.tasks.celery_app import celery_app

            inspector = celery_app.control.inspect(timeout=2.0)
            pings = inspector.ping()
            # pings is a dict {worker_name: [{ok: pong}]} or None if no workers
            return bool(pings)

        except Exception as exc:
            logger.warning("Celery health check failed: %s", exc)
            return False

    # ------------------------------------------------------------------ #
    # Aggregate status                                                     #
    # ------------------------------------------------------------------ #

    async def get_system_status(self) -> dict[str, Any]:
        """Run all probes and return a consolidated status dict.

        Returns
        -------
        dict with structure::

            {
                "status": "healthy" | "degraded" | "unhealthy",
                "timestamp": "<ISO-8601>",
                "checks": {
                    "database": {"ok": bool, "latency_ms": float | None},
                    "redis":    {"ok": bool, "latency_ms": float | None},
                    "celery":   {"ok": bool},
                }
            }

        ``"healthy"``   – all checks pass.
        ``"degraded"``  – Redis or Celery down, but DB is up.
        ``"unhealthy"`` – Database is down.
        """
        import asyncio
        import time

        # Run DB and Redis probes concurrently
        t0_db = time.perf_counter()
        t0_redis = time.perf_counter()

        db_ok, redis_ok = await asyncio.gather(
            self.check_db(),
            self.check_redis(),
            return_exceptions=False,
        )

        db_latency = round((time.perf_counter() - t0_db) * 1000, 1)
        redis_latency = round((time.perf_counter() - t0_redis) * 1000, 1)

        # Celery probe is synchronous – run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        celery_ok = await loop.run_in_executor(None, self.check_celery)

        checks = {
            "database": {"ok": db_ok, "latency_ms": db_latency if db_ok else None},
            "redis": {"ok": redis_ok, "latency_ms": redis_latency if redis_ok else None},
            "celery": {"ok": celery_ok},
        }

        if not db_ok:
            overall = "unhealthy"
        elif not redis_ok or not celery_ok:
            overall = "degraded"
        else:
            overall = "healthy"

        return {
            "status": overall,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": checks,
        }


# ---------------------------------------------------------------------------
# FastAPI route helper (convenience function for routers)
# ---------------------------------------------------------------------------


async def get_health_status() -> dict:
    """Convenience wrapper for use in FastAPI route handlers."""
    checker = HealthChecker()
    return await checker.get_system_status()
