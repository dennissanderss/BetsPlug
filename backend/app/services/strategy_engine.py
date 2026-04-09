"""
Strategy evaluation engine.

Evaluates a Strategy's rules against a Prediction (and optional odds data).
All rules use AND logic: every rule must pass for the strategy to match.
Rules whose required feature is unavailable (returns None) are skipped (treated as pass).
"""
from __future__ import annotations

from typing import Any, Optional

from app.models.prediction import Prediction
from app.models.strategy import Strategy


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

def get_feature_value(
    feature_name: str,
    prediction: Prediction,
    odds: Optional[dict] = None,
) -> Optional[float]:
    """
    Extract a numeric feature value from a Prediction and optional odds dict.

    Parameters
    ----------
    feature_name : str
        One of the supported feature keys.
    prediction : Prediction
        The prediction ORM object.
    odds : dict | None
        Optional odds dict with keys: home_odds, draw_odds, away_odds.

    Returns
    -------
    float | None
        The feature value, or None if the data is not available.
    """
    # -- Prediction-derived features --
    if feature_name == "confidence":
        return prediction.confidence

    if feature_name == "home_win_prob":
        return prediction.home_win_prob

    if feature_name == "draw_prob":
        return prediction.draw_prob

    if feature_name == "away_win_prob":
        return prediction.away_win_prob

    # -- Edge features (probability minus implied probability from odds) --
    if feature_name == "edge_home":
        if odds and odds.get("home_odds"):
            implied = 1.0 / odds["home_odds"]
            return prediction.home_win_prob - implied
        return None

    if feature_name == "edge_draw":
        if odds and odds.get("draw_odds") and prediction.draw_prob is not None:
            implied = 1.0 / odds["draw_odds"]
            return prediction.draw_prob - implied
        return None

    if feature_name == "edge_away":
        if odds and odds.get("away_odds"):
            implied = 1.0 / odds["away_odds"]
            return prediction.away_win_prob - implied
        return None

    if feature_name == "edge_pick":
        # Edge for the predicted pick (highest probability outcome)
        probs = {
            "home": prediction.home_win_prob,
            "draw": prediction.draw_prob,
            "away": prediction.away_win_prob,
        }
        # Remove None values (draw may be None)
        probs = {k: v for k, v in probs.items() if v is not None}
        if not probs:
            return None
        pick = max(probs, key=probs.get)  # type: ignore[arg-type]
        odds_key_map = {"home": "home_odds", "draw": "draw_odds", "away": "away_odds"}
        if odds and odds.get(odds_key_map[pick]):
            implied = 1.0 / odds[odds_key_map[pick]]
            return probs[pick] - implied
        return None

    # -- Odds features (straight from odds dict) --
    if feature_name == "odds_home":
        if odds and odds.get("home_odds"):
            return odds["home_odds"]
        return None

    if feature_name == "odds_draw":
        if odds and odds.get("draw_odds"):
            return odds["draw_odds"]
        return None

    if feature_name == "odds_away":
        if odds and odds.get("away_odds"):
            return odds["away_odds"]
        return None

    if feature_name == "odds_pick":
        # Odds for the predicted pick
        probs = {
            "home": prediction.home_win_prob,
            "draw": prediction.draw_prob,
            "away": prediction.away_win_prob,
        }
        probs = {k: v for k, v in probs.items() if v is not None}
        if not probs:
            return None
        pick = max(probs, key=probs.get)  # type: ignore[arg-type]
        odds_key_map = {"home": "home_odds", "draw": "draw_odds", "away": "away_odds"}
        if odds and odds.get(odds_key_map[pick]):
            return odds[odds_key_map[pick]]
        return None

    # -- Form diff (not yet available) --
    if feature_name == "form_diff":
        return None

    return None


# ---------------------------------------------------------------------------
# Rule evaluation
# ---------------------------------------------------------------------------

def _evaluate_rule(feature_value: float, operator: str, value: Any) -> bool:
    """
    Evaluate a single rule: ``feature_value <operator> value``.

    For "between", value must be [min, max] (inclusive on both ends).
    """
    if operator == ">":
        return feature_value > value
    if operator == "<":
        return feature_value < value
    if operator == ">=":
        return feature_value >= value
    if operator == "<=":
        return feature_value <= value
    if operator == "==":
        return feature_value == value
    if operator == "between":
        if not isinstance(value, (list, tuple)) or len(value) != 2:
            raise ValueError(f"'between' operator requires [min, max], got {value}")
        return value[0] <= feature_value <= value[1]

    raise ValueError(f"Unknown operator: {operator}")


def evaluate_strategy(
    strategy: Strategy,
    prediction: Prediction,
    odds: Optional[dict] = None,
    strict: bool = True,
) -> bool:
    """
    Evaluate whether a prediction matches a strategy.

    All rules are combined with AND logic.

    Parameters
    ----------
    strategy : Strategy
        The strategy containing the rules list.
    prediction : Prediction
        The prediction to evaluate against.
    odds : dict | None
        Optional odds dict: {"home_odds": float, "draw_odds": float, "away_odds": float}.
    strict : bool
        If True (default), a missing feature value causes the strategy to NOT match.
        If False, missing features are skipped (legacy lenient mode).

    Returns
    -------
    bool
        True if the prediction satisfies all evaluable rules.
    """
    rules = strategy.rules
    if not isinstance(rules, list):
        raise ValueError(f"Strategy rules must be a list, got {type(rules).__name__}")

    evaluable_rules = 0
    for rule in rules:
        feature_name = rule.get("feature")
        operator = rule.get("operator")
        value = rule.get("value")

        if not feature_name or not operator:
            continue  # malformed rule, skip

        feature_value = get_feature_value(feature_name, prediction, odds)

        if feature_value is None:
            if strict:
                return False  # Missing data = no match
            continue  # lenient: skip unavailable features

        evaluable_rules += 1
        if not _evaluate_rule(feature_value, operator, value):
            return False

    # Must have at least 1 evaluable rule to match
    return evaluable_rules > 0
