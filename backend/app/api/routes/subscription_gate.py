"""Subscription gating endpoints."""

from fastapi import APIRouter, Query
from app.core.subscription_tiers import TIER_CONFIG, get_tier_config, has_feature

router = APIRouter()

@router.get("/tier-access", summary="Check what a tier can access")
async def get_tier_access(tier: str = Query(default="free")):
    """Return features and strategy access for a given tier."""
    config = get_tier_config(tier)
    return {
        "tier": tier,
        "name": config["name"],
        "predictions_per_week": config["predictions_per_week"],
        "strategies": config["strategies"],
        "features": config["features"],
        "description": config["description"],
    }

@router.get("/check-feature", summary="Check if a tier has access to a feature")
async def check_feature(tier: str = Query(default="free"), feature: str = Query(...)):
    """Return whether the tier has access to the feature."""
    return {"tier": tier, "feature": feature, "has_access": has_feature(tier, feature)}
