"""Predictions display filter — Phase 4 of the rebuild.

Each tier has a hardcoded recipe of (confidence threshold, edge floor,
odds range). A prediction is shown to a user only if it passes the
recipe of the lowest tier in their access scope (free for free user,
silver for silver user, etc.) — the user sees picks across all tiers
they have access to, but only the picks meeting each tier's quality
gate.

Recipes were derived from `docs/parameter_optimization.md` (rolling
14-day window analysis on 1,374 days of v8.1 data, all sources):

  - Free:     conf ≥ 0.60       (lifetime ROI +0.75%, ~95 picks/14d)
  - Silver:   conf ≥ 0.62, edge ≥ 0%, odds ≥ 1.60   (+7.31%, ~39/14d)
  - Gold:     conf ≥ 0.65, edge ≥ 6%, odds ≥ 1.80   (+10.89%, ~18/14d)
  - Platinum: conf ≥ 0.78, edge ≥ 8%, odds ∈ [1.50, 3.00] (+18.86%, ~3/14d)

Recent 4-month data shows the lifetime numbers may overstate live ROI
(see `docs/rebuild_phase3_recipe_caveat.md`). Phase 9 shadow mode is
the validation gate before any number ships to marketing copy.

NOT touched by this module:
  - Engine v1 (`forecast_service`) — predictions still generated as before
  - Engine v2 (`combo_bet_service`) — combo selector reads `predictions`
    table directly, NOT through this filter
  - Tier classification (`tier_system.py`) — league + confidence logic
    unchanged for combo / Stripe / billing
"""
from __future__ import annotations

from typing import Optional


class DisplayRecipe:
    """A tier's quality gate. Pass = the pick is shown."""

    __slots__ = ("min_confidence", "min_edge", "min_odds", "max_odds")

    def __init__(
        self,
        min_confidence: float,
        min_edge: float = -1.0,
        min_odds: float = 1.0,
        max_odds: float = 100.0,
    ):
        self.min_confidence = min_confidence
        self.min_edge = min_edge
        self.min_odds = min_odds
        self.max_odds = max_odds

    def passes(
        self,
        confidence: Optional[float],
        edge_pct: Optional[float],
        odds: Optional[float],
    ) -> bool:
        """True iff the pick meets every constraint of this recipe.

        Picks without snapshot odds (edge_pct/odds None) only pass the
        Free recipe (which has no edge/odds constraint).
        """
        if confidence is None or confidence < self.min_confidence:
            return False
        if self.min_edge > -0.99:
            if edge_pct is None or edge_pct < self.min_edge:
                return False
        if self.min_odds > 1.0 or self.max_odds < 100.0:
            if odds is None or not (self.min_odds <= odds <= self.max_odds):
                return False
        return True


# Hardcoded recipe set per tier.
DISPLAY_RECIPES: dict[str, DisplayRecipe] = {
    "free": DisplayRecipe(
        min_confidence=0.60,
        # No edge/odds floor for Free — gives volume, mediocre ROI is
        # the funnel signal that motivates upgrade.
    ),
    "silver": DisplayRecipe(
        min_confidence=0.62,
        min_edge=0.0,
        min_odds=1.60,
    ),
    "gold": DisplayRecipe(
        min_confidence=0.65,
        min_edge=0.06,
        min_odds=1.80,
    ),
    "platinum": DisplayRecipe(
        min_confidence=0.78,
        min_edge=0.08,
        min_odds=1.50,
        max_odds=3.00,
    ),
}


# Tier rank used for "highest applicable display tier"
_TIER_RANK = {"free": 0, "silver": 1, "gold": 2, "platinum": 3}


def classify_display_tier(
    confidence: Optional[float],
    edge_pct: Optional[float],
    odds: Optional[float],
) -> Optional[str]:
    """Return the highest tier whose recipe this pick passes, or None.

    Used to override the league-based tier_system classification for
    DISPLAY purposes only. Combo selector + trackrecord aggregates
    still use the existing tier_system unchanged.
    """
    for tier in ("platinum", "gold", "silver", "free"):
        if DISPLAY_RECIPES[tier].passes(confidence, edge_pct, odds):
            return tier
    return None


def picks_visible_to_user_tier(
    user_tier: str,
    pick_display_tier: Optional[str],
) -> bool:
    """True iff a user with `user_tier` subscription sees a pick whose
    display tier is `pick_display_tier`.

    Access semantics (inclusive):
      - Platinum user → sees free + silver + gold + platinum
      - Gold user    → sees free + silver + gold
      - Silver user  → sees free + silver
      - Free user    → sees free

    Picks with display tier = None (didn't pass any recipe) are hidden.
    """
    if pick_display_tier is None:
        return False
    user_rank = _TIER_RANK.get(user_tier, 0)
    pick_rank = _TIER_RANK.get(pick_display_tier, 99)
    return pick_rank <= user_rank
