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

    # --- Redis check (async, fast) ---
    try:
        from app.core.cache import redis_ping
        pong = await redis_ping()
        checks["redis"] = "ok" if pong else "error"
    except Exception:
        checks["redis"] = "error"

    # --- Sports API config check ---
    checks["api_football"] = "configured" if settings.api_football_key else "missing"
    checks["football_data"] = "disabled"  # free tier disabled 2026-04-14

    # --- DB row counts (single query instead of 3 separate round-trips) ---
    fixtures_count = 0
    predictions_count = 0
    finished_count = 0
    try:
        from app.db.session import async_session_factory as _sf
        from sqlalchemy import func, select as sel, case
        from app.models.match import Match, MatchStatus
        from app.models.prediction import Prediction

        async with _sf() as s:
            row = (await s.execute(
                sel(
                    func.count(case((Match.status == MatchStatus.SCHEDULED, 1))).label("scheduled"),
                    func.count(case((Match.status == MatchStatus.FINISHED, 1))).label("finished"),
                ).select_from(Match)
            )).one()
            fixtures_count = row.scheduled or 0
            finished_count = row.finished or 0
            predictions_count = (await s.execute(
                sel(func.count()).select_from(Prediction)
            )).scalar() or 0
    except Exception:
        pass

    checks["fixtures_scheduled"] = fixtures_count
    checks["fixtures_finished"] = finished_count
    checks["predictions_in_db"] = predictions_count

    # --- Overall status ---
    if checks["database"] == "error":
        status = "error"
    elif checks.get("redis") == "error":
        status = "degraded"
    else:
        status = "ok"

    return {
        "status": status,
        "checks": checks,
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
