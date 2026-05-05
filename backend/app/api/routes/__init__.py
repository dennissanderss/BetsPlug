from fastapi import APIRouter, Depends

from app.auth.dependencies import require_admin
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.search import router as search_router
from app.api.routes.sports import router as sports_router
from app.api.routes.leagues import router as leagues_router
from app.api.routes.teams import router as teams_router
from app.api.routes.matches import router as matches_router
from app.api.routes.predictions import router as predictions_router
from app.api.routes.models import router as models_router
from app.api.routes.trackrecord import router as trackrecord_router
from app.api.routes.backtests import router as backtests_router
from app.api.routes.reports import router as reports_router
from app.api.routes.admin import router as admin_router
from app.api.routes.internal_ops import router as internal_ops_router
from app.api.routes.live import router as live_router
from app.api.routes.subscriptions import router as subscriptions_router
from app.api.routes.betoftheday import router as betoftheday_router
from app.api.routes.fixtures import router as fixtures_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.strategies import router as strategies_router
from app.api.routes.admin_blog import router as admin_blog_router
from app.api.routes.admin_users import router as admin_users_router
from app.api.routes.admin_settings import router as admin_settings_router
from app.api.routes.admin_seo import router as admin_seo_router
from app.api.routes.admin_backfill import router as admin_backfill_router
from app.api.routes.homepage import router as homepage_router
from app.api.routes.pricing import router as pricing_router
from app.api.routes.odds import router as odds_router
from app.api.routes.admin_research import router as admin_research_router
from app.api.routes.admin_cleanup import router as admin_cleanup_router
from app.api.routes.admin_notes import router as admin_notes_router
from app.api.routes.admin_finance import router as admin_finance_router
from app.api.routes.subscription_gate import router as subscription_gate_router
from app.api.routes.checkout_sessions import router as checkout_sessions_router
# v5
from app.api.routes.route import router as route_router
from app.api.routes.admin_api_usage import router as admin_api_usage_router
from app.api.routes.admin_v5 import router as admin_v5_router
from app.api.routes.admin_telegram import router as admin_telegram_router
from app.api.routes.telegram import router as telegram_router
# Value-bet engine (v9)
from app.api.routes.value_bets import router as value_bets_router, admin_router as value_bets_admin_router
# Public marketing-site endpoints (slug-keyed teams + leagues)
from app.api.routes.public_teams import router as public_teams_router

router = APIRouter()

router.include_router(health_router, tags=["health"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(search_router, prefix="/search", tags=["search"])
router.include_router(sports_router, prefix="/sports", tags=["sports"])
router.include_router(leagues_router, prefix="/leagues", tags=["leagues"])
router.include_router(teams_router, prefix="/teams", tags=["teams"])
router.include_router(matches_router, prefix="/matches", tags=["matches"])
router.include_router(predictions_router, prefix="/predictions", tags=["predictions"])
router.include_router(models_router, prefix="/models", tags=["models"])
router.include_router(trackrecord_router, prefix="/trackrecord", tags=["trackrecord"])
router.include_router(backtests_router, prefix="/backtests", tags=["backtests"])
router.include_router(reports_router, prefix="/reports", tags=["reports"])
# ── Admin routers — all gated behind require_admin at the router level.
# Individual route functions do not need to repeat the dependency. This
# closes the gap where /api/admin/users etc. were reachable unauth (see
# docs/final_launch_readiness_v2.md §10 for the original discovery).
_ADMIN_AUTH = [Depends(require_admin)]

router.include_router(admin_router, prefix="/admin", tags=["admin"], dependencies=_ADMIN_AUTH)
# internal_ops uses its own X-Internal-Ops-Key header auth, NOT _ADMIN_AUTH,
# so long-running maintenance loops don't break on JWT expiry.
router.include_router(internal_ops_router, prefix="/internal-ops", tags=["internal-ops"])
router.include_router(live_router, prefix="/live", tags=["live"])
router.include_router(subscriptions_router, prefix="/subscriptions", tags=["subscriptions"])
router.include_router(betoftheday_router, prefix="/bet-of-the-day", tags=["bet-of-the-day"])
router.include_router(fixtures_router, prefix="/fixtures", tags=["fixtures"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(strategies_router, prefix="/strategies", tags=["strategies"])
router.include_router(admin_blog_router, prefix="/admin/blog", tags=["admin-blog"], dependencies=_ADMIN_AUTH)
router.include_router(admin_users_router, prefix="/admin/users", tags=["admin-users"], dependencies=_ADMIN_AUTH)
router.include_router(admin_settings_router, prefix="/admin/settings", tags=["admin-settings"], dependencies=_ADMIN_AUTH)
router.include_router(admin_seo_router, prefix="/admin/seo", tags=["admin-seo"], dependencies=_ADMIN_AUTH)
router.include_router(admin_backfill_router, prefix="/admin", tags=["admin-backfill"], dependencies=_ADMIN_AUTH)
router.include_router(homepage_router, prefix="/homepage", tags=["homepage"])
router.include_router(pricing_router, prefix="/pricing", tags=["pricing"])
router.include_router(odds_router, prefix="/odds", tags=["odds"])
router.include_router(admin_research_router, prefix="/admin/research", tags=["admin-research"], dependencies=_ADMIN_AUTH)
router.include_router(admin_cleanup_router, prefix="/admin", tags=["admin-cleanup"], dependencies=_ADMIN_AUTH)
router.include_router(admin_notes_router, prefix="/admin", tags=["admin-notes"], dependencies=_ADMIN_AUTH)
router.include_router(admin_finance_router, prefix="/admin/finance", tags=["admin-finance"], dependencies=_ADMIN_AUTH)
router.include_router(subscription_gate_router, prefix="/subscription", tags=["subscription"])
router.include_router(checkout_sessions_router, tags=["checkout"])
# v5
router.include_router(route_router, prefix="/route", tags=["route"])
router.include_router(admin_api_usage_router, prefix="/admin", tags=["admin-api-usage"], dependencies=_ADMIN_AUTH)
router.include_router(admin_v5_router, prefix="/admin/v5", tags=["admin-v5"], dependencies=_ADMIN_AUTH)
router.include_router(admin_telegram_router, prefix="/admin/telegram", tags=["admin-telegram"], dependencies=_ADMIN_AUTH)
router.include_router(telegram_router, prefix="/telegram", tags=["telegram"])
# Value-bet engine (v9)
router.include_router(value_bets_router, prefix="/value-bets", tags=["value-bets"])
router.include_router(value_bets_admin_router, prefix="/admin/value-bets", tags=["admin-value-bets"], dependencies=_ADMIN_AUTH)
# Public marketing-site endpoints — slug-keyed, no API-Football key exposure,
# CORS-allowed for betsplug.com + localhost:4321 (see app/main.py).
router.include_router(public_teams_router, prefix="/public", tags=["public"])
