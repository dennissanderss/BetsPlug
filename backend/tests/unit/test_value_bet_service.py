"""Unit tests for the value-bet selector (pure math, no DB)."""
from __future__ import annotations

import uuid

import pytest

from app.services.value_bet_service import (
    ValueBetConfig,
    ValueBetSelector,
    compute_edge,
    compute_expected_value,
    extract_candidate_from_snapshot,
    kelly_fraction,
    normalize,
    normalize_proportional,
    overround,
    raw_implied,
)


# ---------------------------------------------------------------------------
# Pure math
# ---------------------------------------------------------------------------
class TestMath:
    def test_raw_implied_rejects_invalid_odds(self):
        with pytest.raises(ValueError):
            raw_implied(1.0)
        with pytest.raises(ValueError):
            raw_implied(0.5)

    def test_raw_implied_basic(self):
        assert raw_implied(2.0) == pytest.approx(0.5)

    def test_overround_contains_margin(self):
        # Typical bookmaker line: 2.00 / 3.40 / 3.80 → overround ~1.05
        ov = overround(2.00, 3.40, 3.80)
        assert 1.0 < ov < 1.10

    def test_normalize_proportional_sums_to_one(self):
        h, d, a = normalize_proportional(2.00, 3.40, 3.80)
        assert h + d + a == pytest.approx(1.0)

    def test_normalize_proportional_preserves_order(self):
        # Favourite should keep the largest implied prob after vig removal
        h, d, a = normalize_proportional(1.60, 4.00, 5.50)
        assert h > d > a

    def test_normalize_unknown_method_raises(self):
        with pytest.raises(ValueError):
            normalize(2.0, 3.4, 3.8, method="nonexistent")

    def test_compute_edge_positive_when_model_beats_fair(self):
        # Fair implied 0.50; our prob 0.60 ⇒ edge +0.10
        assert compute_edge(0.60, 0.50) == pytest.approx(0.10)

    def test_compute_edge_negative_when_worse(self):
        assert compute_edge(0.40, 0.50) == pytest.approx(-0.10)

    def test_expected_value_positive(self):
        # p=0.60, odds=2.00 → EV = 0.60*2 - 1 = +0.20
        assert compute_expected_value(0.60, 2.00) == pytest.approx(0.20)

    def test_expected_value_break_even(self):
        assert compute_expected_value(0.50, 2.00) == pytest.approx(0.0)

    def test_kelly_zero_when_no_edge(self):
        assert kelly_fraction(0.50, 2.00) == pytest.approx(0.0)

    def test_kelly_positive_with_edge(self):
        assert kelly_fraction(0.60, 2.00) > 0.0

    def test_kelly_clamps_negative_to_zero(self):
        assert kelly_fraction(0.30, 2.00) == 0.0


# ---------------------------------------------------------------------------
# Candidate building
# ---------------------------------------------------------------------------
def _make_selector(**cfg) -> ValueBetSelector:
    return ValueBetSelector(ValueBetConfig(**cfg))


class TestCandidateBuilding:
    def test_builds_candidate_with_best_edge_pick(self):
        selector = _make_selector()
        cand = selector.build_candidate(
            prediction_id=uuid.uuid4(),
            match_id=uuid.uuid4(),
            home_prob=0.70,  # strong favorite
            draw_prob=0.20,
            away_prob=0.10,
            confidence=0.80,
            tier="platinum",
            odds_home=1.80,
            odds_draw=3.60,
            odds_away=5.00,
            odds_source="api_football_avg",
        )
        assert cand is not None
        # Home is the highest-edge pick given our very home-skewed prob vs
        # the only-moderately-home-skewed implied line.
        assert cand.pick == "home"
        assert cand.edge > 0.10
        assert cand.best_odds_for_pick == 1.80
        assert cand.tier == "platinum"

    def test_returns_none_when_odds_missing(self):
        selector = _make_selector()
        cand = selector.build_candidate(
            prediction_id=uuid.uuid4(),
            match_id=uuid.uuid4(),
            home_prob=0.5, draw_prob=0.3, away_prob=0.2,
            confidence=0.7, tier="gold",
            odds_home=None, odds_draw=3.0, odds_away=5.0,  # type: ignore[arg-type]
            odds_source="x",
        )
        assert cand is None

    def test_returns_none_when_odds_are_below_one(self):
        selector = _make_selector()
        cand = selector.build_candidate(
            prediction_id=uuid.uuid4(),
            match_id=uuid.uuid4(),
            home_prob=0.5, draw_prob=0.3, away_prob=0.2,
            confidence=0.7, tier="gold",
            odds_home=0.9, odds_draw=3.0, odds_away=5.0,
            odds_source="x",
        )
        assert cand is None


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
class TestFilters:
    def _make(
        self,
        selector: ValueBetSelector,
        *,
        home_prob: float = 0.60,
        draw_prob: float | None = 0.25,
        away_prob: float = 0.15,
        odds_home: float = 1.80,
        odds_draw: float | None = 3.60,
        odds_away: float = 5.00,
        tier: str | None = "gold",
        confidence: float = 0.72,
    ):
        return selector.build_candidate(
            prediction_id=uuid.uuid4(),
            match_id=uuid.uuid4(),
            home_prob=home_prob,
            draw_prob=draw_prob,
            away_prob=away_prob,
            confidence=confidence,
            tier=tier,
            odds_home=odds_home,
            odds_draw=odds_draw,
            odds_away=odds_away,
            odds_source="api_football_avg",
        )

    def test_rejects_edge_below_threshold(self):
        selector = _make_selector(edge_threshold=0.10)
        c = self._make(selector, home_prob=0.52, draw_prob=0.25, away_prob=0.23)
        assert c is not None
        # Tiny edge vs. fair-implied at these odds
        assert not selector.passes_filters(c)

    def test_rejects_odds_out_of_range_low(self):
        """Heavy favourite with odds below 1.50 must be rejected even with edge."""
        selector = _make_selector()
        c = self._make(
            selector,
            home_prob=0.95, draw_prob=0.03, away_prob=0.02,
            odds_home=1.20, odds_draw=20.0, odds_away=30.0,
        )
        assert c is not None
        assert c.pick == "home"  # pick confirmation
        assert c.best_odds_for_pick == 1.20
        assert not selector.passes_filters(c)

    def test_rejects_odds_out_of_range_high(self):
        """Longshot with odds above 5.00 must be rejected even with edge."""
        selector = _make_selector()
        c = self._make(
            selector,
            home_prob=0.05, draw_prob=0.10, away_prob=0.85,
            odds_home=20.0, odds_draw=10.0, odds_away=6.00,
        )
        assert c is not None
        assert c.pick == "away"
        assert c.best_odds_for_pick == 6.00
        assert not selector.passes_filters(c)

    def test_rejects_tier_not_in_filter(self):
        selector = _make_selector(tier_filter=("platinum",))
        c = self._make(selector, tier="silver")
        assert c is not None
        assert not selector.passes_filters(c)

    def test_accepts_within_all_limits(self):
        selector = _make_selector()
        c = self._make(selector)  # gold, decent edge, odds=1.80
        assert c is not None
        assert selector.passes_filters(c)


# ---------------------------------------------------------------------------
# Scoring / selection
# ---------------------------------------------------------------------------
class TestSelection:
    def test_select_best_picks_highest_score(self):
        selector = _make_selector()
        c_gold = selector.build_candidate(
            prediction_id=uuid.uuid4(), match_id=uuid.uuid4(),
            home_prob=0.60, draw_prob=0.25, away_prob=0.15,
            confidence=0.70, tier="gold",
            odds_home=1.80, odds_draw=3.60, odds_away=5.00,
            odds_source="x",
        )
        c_platinum = selector.build_candidate(
            prediction_id=uuid.uuid4(), match_id=uuid.uuid4(),
            home_prob=0.60, draw_prob=0.25, away_prob=0.15,
            confidence=0.70, tier="platinum",
            odds_home=1.80, odds_draw=3.60, odds_away=5.00,
            odds_source="x",
        )
        assert c_gold and c_platinum
        best = selector.select_best([c_gold, c_platinum])
        assert best is c_platinum  # same edge, platinum tier_bonus=1.2 wins

    def test_select_best_returns_none_when_all_filtered_out(self):
        selector = _make_selector(edge_threshold=0.99)
        c = selector.build_candidate(
            prediction_id=uuid.uuid4(), match_id=uuid.uuid4(),
            home_prob=0.5, draw_prob=0.3, away_prob=0.2,
            confidence=0.65, tier="gold",
            odds_home=2.00, odds_draw=3.50, odds_away=5.00,
            odds_source="x",
        )
        assert c is not None
        assert selector.select_best([c]) is None


# ---------------------------------------------------------------------------
# Snapshot extraction (tests the on-disk JSONB shape path)
# ---------------------------------------------------------------------------
class TestSnapshotExtraction:
    def test_extract_from_populated_snapshot(self):
        selector = _make_selector()
        snap = {
            "pick": "HOME",
            "source": "api_football_avg",
            "bookmaker_odds": {"home": 1.80, "draw": 3.60, "away": 5.00},
        }
        c = extract_candidate_from_snapshot(
            prediction_id=uuid.uuid4(),
            match_id=uuid.uuid4(),
            home_prob=0.65, draw_prob=0.22, away_prob=0.13,
            confidence=0.74, tier="gold",
            snapshot=snap, selector=selector,
        )
        assert c is not None
        assert c.odds_source == "api_football_avg"
        assert c.pick == "home"

    def test_extract_returns_none_for_empty_snapshot(self):
        selector = _make_selector()
        assert extract_candidate_from_snapshot(
            prediction_id=uuid.uuid4(), match_id=uuid.uuid4(),
            home_prob=0.5, draw_prob=0.3, away_prob=0.2,
            confidence=0.6, tier="gold",
            snapshot=None, selector=selector,
        ) is None
        assert extract_candidate_from_snapshot(
            prediction_id=uuid.uuid4(), match_id=uuid.uuid4(),
            home_prob=0.5, draw_prob=0.3, away_prob=0.2,
            confidence=0.6, tier="gold",
            snapshot={}, selector=selector,
        ) is None
        assert extract_candidate_from_snapshot(
            prediction_id=uuid.uuid4(), match_id=uuid.uuid4(),
            home_prob=0.5, draw_prob=0.3, away_prob=0.2,
            confidence=0.6, tier="gold",
            snapshot={"bookmaker_odds": {}}, selector=selector,
        ) is None
