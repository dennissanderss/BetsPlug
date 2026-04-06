"""Health check route."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/health", summary="Health check")
async def health_check() -> dict:
    """Return platform health status, version, and current UTC timestamp."""
    settings = get_settings()
    return {
        "status": "ok",
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
