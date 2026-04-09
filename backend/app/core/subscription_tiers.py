"""Subscription tier configuration.

Defines what each subscription level can access.
Used by frontend (via API) and backend (for gating).
"""

TIER_CONFIG = {
    "free": {
        "name": "Free",
        "predictions_per_week": 1,
        "strategies": [],
        "features": ["basic_predictions"],
        "description": "1 free prediction per week. Preview only.",
    },
    "silver": {
        "name": "Silver",
        "predictions_per_week": -1,
        "strategies": ["Anti-Draw Filter", "Strong Home Favorite"],
        "features": ["all_predictions", "strategy_lab_basic", "results_history"],
        "description": "All predictions + 2 proven strategies.",
    },
    "gold": {
        "name": "Gold",
        "predictions_per_week": -1,
        "strategies": "__all_validated__",
        "features": [
            "all_predictions", "strategy_lab_full", "backtest_history",
            "weekly_report", "live_updates",
        ],
        "description": "All strategies + full history + weekly reports.",
    },
    "platinum": {
        "name": "Platinum",
        "predictions_per_week": -1,
        "strategies": "__all_validated__",
        "features": [
            "all_predictions", "strategy_lab_full", "backtest_history",
            "weekly_report", "live_updates", "priority_support",
            "custom_alerts", "early_access",
        ],
        "description": "Everything Gold has + priority support + custom alerts.",
    },
}


def get_tier_config(tier: str) -> dict:
    """Get config for a subscription tier."""
    return TIER_CONFIG.get(tier, TIER_CONFIG["free"])


def get_strategies_for_tier(tier: str) -> list[str] | str:
    """Get allowed strategy names for a tier."""
    config = get_tier_config(tier)
    return config["strategies"]


def has_feature(tier: str, feature: str) -> bool:
    """Check if a tier has access to a specific feature."""
    config = get_tier_config(tier)
    return feature in config["features"]
