"""Health check route with dependency checks."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health", summary="Health check")
async def health_check() -> dict:
    """Return platform health status with dependency checks."""
    settings = get_settings()
    checks: dict[str, str] = {}

    # --- Database check ---
    try:
        from app.db.session import async_session_factory

        async with async_session_factory() as session:
            result = await session.execute(text("SELECT 1"))
            row = result.scalar()
            checks["database"] = "ok" if row == 1 else "error"
    except Exception as exc:
        logger.warning("Health: DB check failed: %s", exc)
        checks["database"] = "error"

    # --- Redis check ---
    try:
        import asyncio
        import redis as sync_redis

        def _ping() -> bool:
            client = sync_redis.from_url(
                settings.redis_url,
                socket_connect_timeout=3,
                socket_timeout=3,
            )
            try:
                return client.ping()
            finally:
                client.close()

        loop = asyncio.get_event_loop()
        pong = await loop.run_in_executor(None, _ping)
        checks["redis"] = "ok" if pong else "error"
    except Exception as exc:
        logger.warning("Health: Redis check failed: %s", exc)
        checks["redis"] = "error"

    # --- Sports API config check ---
    checks["api_football"] = "configured" if settings.api_football_key else "missing"
    checks["football_data"] = "configured" if settings.football_data_api_key else "missing"

    # --- DB row counts ---
    fixtures_count = 0
    predictions_count = 0
    finished_count = 0
    try:
        from app.db.session import async_session_factory as _sf
        from sqlalchemy import func, select as sel
        from app.models.match import Match, MatchStatus
        from app.models.prediction import Prediction

        async with _sf() as s:
            fixtures_count = (await s.execute(
                sel(func.count()).select_from(Match).where(Match.status == MatchStatus.SCHEDULED)
            )).scalar() or 0
            predictions_count = (await s.execute(
                sel(func.count()).select_from(Prediction)
            )).scalar() or 0
            finished_count = (await s.execute(
                sel(func.count()).select_from(Match).where(Match.status == MatchStatus.FINISHED)
            )).scalar() or 0
    except Exception:
        pass

    checks["fixtures_scheduled"] = fixtures_count
    checks["fixtures_finished"] = finished_count
    checks["predictions_in_db"] = predictions_count

    # --- Overall status ---
    if checks["database"] == "error":
        status = "error"
    elif checks["redis"] == "error":
        status = "degraded"
    else:
        status = "ok"

    return {
        "status": status,
        "checks": checks,
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
