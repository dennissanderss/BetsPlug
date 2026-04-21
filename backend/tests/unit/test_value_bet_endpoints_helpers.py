"""Unit tests for pure helpers inside the value_bets router.

A full FastAPI TestClient integration test is deferred — these tests
cover the math helpers (Wilson CI, drawdown, Sharpe) that the /stats
endpoint composes so we don't accidentally break aggregation under
empty or single-row inputs.
"""
from __future__ import annotations

import pytest

from app.services.stats_math import max_drawdown, sharpe, wilson_ci


class TestWilsonCI:
    def test_empty_returns_zero_interval(self):
        lo, hi = wilson_ci(0, 0)
        assert lo == 0.0 and hi == 0.0

    def test_contains_point_estimate(self):
        lo, hi = wilson_ci(50, 100)
        assert lo < 0.50 < hi

    def test_tight_interval_at_large_n(self):
        lo_small, hi_small = wilson_ci(7, 10)
        lo_large, hi_large = wilson_ci(700, 1000)
        # CI narrows as n grows
        assert (hi_small - lo_small) > (hi_large - lo_large)


class TestMaxDrawdown:
    def test_zero_when_empty(self):
        assert max_drawdown([]) == 0.0

    def test_zero_when_monotonic_up(self):
        assert max_drawdown([1.0, 2.0, 3.0]) == 0.0

    def test_negative_when_drawdown_happens(self):
        # Cum = 5, 5-1=4, 4-3=1 -> peak 5, trough 1, drawdown -4
        assert max_drawdown([5.0, -1.0, -3.0]) == pytest.approx(-4.0)


class TestSharpe:
    def test_none_when_too_few_samples(self):
        assert sharpe([]) is None
        assert sharpe([1.0]) is None

    def test_none_when_zero_variance(self):
        assert sharpe([1.0, 1.0, 1.0]) is None

    def test_positive_when_mean_positive(self):
        s = sharpe([0.2, 0.4, 0.3, 0.5, 0.1])
        assert s is not None and s > 0

    def test_negative_when_mean_negative(self):
        s = sharpe([-0.2, -0.4, -0.3, -0.5, -0.1])
        assert s is not None and s < 0
