from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.search import router as search_router
from app.api.routes.sports import router as sports_router
from app.api.routes.leagues import router as leagues_router
from app.api.routes.teams import router as teams_router
from app.api.routes.matches import router as matches_router
from app.api.routes.predictions import router as predictions_router
from app.api.routes.trackrecord import router as trackrecord_router
from app.api.routes.backtests import router as backtests_router
from app.api.routes.reports import router as reports_router
from app.api.routes.admin import router as admin_router
from app.api.routes.live import router as live_router

router = APIRouter()

router.include_router(health_router, tags=["health"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(search_router, prefix="/search", tags=["search"])
router.include_router(sports_router, prefix="/sports", tags=["sports"])
router.include_router(leagues_router, prefix="/leagues", tags=["leagues"])
router.include_router(teams_router, prefix="/teams", tags=["teams"])
router.include_router(matches_router, prefix="/matches", tags=["matches"])
router.include_router(predictions_router, prefix="/predictions", tags=["predictions"])
router.include_router(trackrecord_router, prefix="/trackrecord", tags=["trackrecord"])
router.include_router(backtests_router, prefix="/backtests", tags=["backtests"])
router.include_router(reports_router, prefix="/reports", tags=["reports"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])
router.include_router(live_router, prefix="/live", tags=["live"])
