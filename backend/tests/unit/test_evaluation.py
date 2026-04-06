"""
Unit tests for evaluation metrics.

Pure maths tests – no database or model instances required.
All functions under test are the module-level helpers in
``app.evaluation.evaluation_service``.

Tests
-----
- test_brier_score_perfect_prediction
- test_brier_score_worst_prediction
- test_log_loss_computation
- test_calibration_buckets
"""
from __future__ import annotations

import math
import pytest

from app.evaluation.evaluation_service import (
    _brier_score,
    _log_loss,
    _determine_outcome,
    _build_prob_vector,
    _predicted_class,
)


# ---------------------------------------------------------------------------
# _determine_outcome helpers
# ---------------------------------------------------------------------------

class TestDetermineOutcome:

    def test_home_win(self) -> None:
        assert _determine_outcome(3, 1) == "home"

    def test_away_win(self) -> None:
        assert _determine_outcome(0, 2) == "away"

    def test_draw(self) -> None:
        assert _determine_outcome(1, 1) == "draw"

    def test_large_home_win(self) -> None:
        assert _determine_outcome(7, 0) == "home"

    def test_zero_zero_draw(self) -> None:
        assert _determine_outcome(0, 0) == "draw"


# ---------------------------------------------------------------------------
# _brier_score
# ---------------------------------------------------------------------------

class TestBrierScore:

    def test_brier_score_perfect_prediction(self) -> None:
        """
        When the model assigns 100 % to the correct outcome the Brier score
        should be 0.0.

        For a 3-class multi-class Brier score:
          BS = (1/3) * [(1-1)^2 + (0-0)^2 + (0-0)^2] = 0.0
        """
        probs = {"home": 1.0, "draw": 0.0, "away": 0.0}
        bs = _brier_score(probs, "home")
        assert bs == pytest.approx(0.0, abs=1e-9)

    def test_brier_score_worst_prediction(self) -> None:
        """
        When the model assigns 100 % to the WRONG outcome the Brier score is
        at its maximum for a single correct outcome:

          BS = (1/3) * [(0-1)^2 + (0-0)^2 + (1-0)^2] = (1/3) * (1 + 0 + 1) = 2/3
        Note: the outcome that happened is 'home' (p=0), predicted was 'away' (p=1).
        BS = (1/3) * [(0-1)^2 + (0-0)^2 + (1-0)^2]
           = (1/3) * [1 + 0 + 1] = 2/3 ≈ 0.6667
        """
        probs = {"home": 0.0, "draw": 0.0, "away": 1.0}
        bs = _brier_score(probs, "home")
        expected = 2 / 3
        assert bs == pytest.approx(expected, abs=1e-5)

    def test_brier_score_uniform_prediction(self) -> None:
        """
        Uniform 1/3 each is the baseline.

        BS = (1/3) * [(1/3 - 1)^2 + (1/3 - 0)^2 + (1/3 - 0)^2]
           = (1/3) * [(−2/3)^2 + (1/3)^2 + (1/3)^2]
           = (1/3) * [4/9 + 1/9 + 1/9]
           = (1/3) * (6/9) = 2/9 ≈ 0.2222
        """
        probs = {"home": 1 / 3, "draw": 1 / 3, "away": 1 / 3}
        bs = _brier_score(probs, "home")
        expected = 2 / 9
        assert bs == pytest.approx(expected, abs=1e-5)

    def test_brier_score_draw_correct(self) -> None:
        """Correct prediction of a draw."""
        probs = {"home": 0.0, "draw": 1.0, "away": 0.0}
        bs = _brier_score(probs, "draw")
        assert bs == pytest.approx(0.0, abs=1e-9)

    def test_brier_score_typical_prediction(self) -> None:
        """
        A typical football prediction where home wins and was correctly
        favoured.

        probs = {home: 0.55, draw: 0.25, away: 0.20}, actual = home
        BS = (1/3) * [(0.55 - 1)^2 + (0.25 - 0)^2 + (0.20 - 0)^2]
           = (1/3) * [0.2025 + 0.0625 + 0.04]
           = (1/3) * 0.305
           ≈ 0.10167
        """
        probs = {"home": 0.55, "draw": 0.25, "away": 0.20}
        bs = _brier_score(probs, "home")
        expected = (0.2025 + 0.0625 + 0.04) / 3
        assert bs == pytest.approx(expected, abs=1e-5)

    def test_brier_score_is_bounded(self) -> None:
        """Brier score must always be in [0, 2/3] for 3-class problems."""
        import random
        rng = random.Random(42)
        for _ in range(100):
            p1, p2 = rng.random(), rng.random()
            remaining = 1.0 - p1 - p2
            if remaining < 0:
                p1, p2 = p1 / (p1 + p2 + abs(remaining)), p2 / (p1 + p2 + abs(remaining))
                remaining = max(0.0, 1.0 - p1 - p2)
            probs = {"home": p1, "draw": p2, "away": remaining}
            for outcome in ("home", "draw", "away"):
                bs = _brier_score(probs, outcome)
                assert 0.0 <= bs <= 2 / 3 + 1e-6


# ---------------------------------------------------------------------------
# _log_loss
# ---------------------------------------------------------------------------

class TestLogLoss:

    def test_log_loss_computation_perfect(self) -> None:
        """log_loss(-log(1.0)) = 0."""
        probs = {"home": 1.0, "draw": 0.0, "away": 0.0}
        ll = _log_loss(probs, "home")
        assert ll == pytest.approx(0.0, abs=1e-6)

    def test_log_loss_computation_50_percent(self) -> None:
        """log_loss at p=0.5 should equal log(2) ≈ 0.6931."""
        probs = {"home": 0.5, "draw": 0.25, "away": 0.25}
        ll = _log_loss(probs, "home")
        assert ll == pytest.approx(math.log(2), abs=1e-5)

    def test_log_loss_computation_wrong_prediction(self) -> None:
        """Very low assigned probability → large log loss."""
        probs = {"home": 0.01, "draw": 0.5, "away": 0.49}
        ll = _log_loss(probs, "home")
        assert ll == pytest.approx(-math.log(0.01), abs=1e-5)
        assert ll > 4.0  # log loss should be large when actual outcome had low prob

    def test_log_loss_avoids_log_zero(self) -> None:
        """p=0 should be clipped to 1e-15, not produce -inf."""
        probs = {"home": 0.0, "draw": 0.5, "away": 0.5}
        ll = _log_loss(probs, "home")
        assert math.isfinite(ll)
        assert ll > 0.0

    def test_log_loss_away_correct(self) -> None:
        probs = {"home": 0.2, "draw": 0.3, "away": 0.5}
        ll = _log_loss(probs, "away")
        assert ll == pytest.approx(-math.log(0.5), abs=1e-5)

    def test_log_loss_is_non_negative(self) -> None:
        """Log loss must always be >= 0."""
        test_cases = [
            ({"home": 0.8, "draw": 0.1, "away": 0.1}, "home"),
            ({"home": 0.3, "draw": 0.4, "away": 0.3}, "draw"),
            ({"home": 0.1, "draw": 0.1, "away": 0.8}, "away"),
        ]
        for probs, actual in test_cases:
            assert _log_loss(probs, actual) >= 0.0


# ---------------------------------------------------------------------------
# _predicted_class
# ---------------------------------------------------------------------------

class TestPredictedClass:

    def test_predicted_class_home(self) -> None:
        probs = {"home": 0.6, "draw": 0.2, "away": 0.2}
        assert _predicted_class(probs) == "home"

    def test_predicted_class_draw(self) -> None:
        probs = {"home": 0.3, "draw": 0.4, "away": 0.3}
        assert _predicted_class(probs) == "draw"

    def test_predicted_class_away(self) -> None:
        probs = {"home": 0.2, "draw": 0.3, "away": 0.5}
        assert _predicted_class(probs) == "away"


# ---------------------------------------------------------------------------
# Calibration bucket logic (unit version, no DB)
# ---------------------------------------------------------------------------

class TestCalibrationBuckets:

    def test_calibration_buckets_perfect_model(self) -> None:
        """
        When every prediction is 100 % confident and correct, each bucket
        should have actual_freq == 1.0.
        """
        n_buckets = 10
        bucket_width = 1.0 / n_buckets
        # Simulate: 10 predictions all at confidence 0.95 (bucket 9), all correct
        buckets: dict[int, dict] = {i: {"sum_prob": 0.0, "correct": 0, "count": 0} for i in range(n_buckets)}
        for _ in range(10):
            conf = 0.95
            idx = min(int(conf / bucket_width), n_buckets - 1)
            buckets[idx]["sum_prob"] += conf
            buckets[idx]["count"] += 1
            buckets[idx]["correct"] += 1  # all correct

        result = []
        for i in range(n_buckets):
            b = buckets[i]
            if b["count"] == 0:
                continue
            result.append({
                "bucket_lower": round(i * bucket_width, 2),
                "bucket_upper": round((i + 1) * bucket_width, 2),
                "predicted_prob": round(b["sum_prob"] / b["count"], 4),
                "actual_freq": round(b["correct"] / b["count"], 4),
                "count": b["count"],
            })

        assert len(result) == 1
        assert result[0]["actual_freq"] == pytest.approx(1.0)
        assert result[0]["count"] == 10

    def test_calibration_buckets_worst_model(self) -> None:
        """
        When a model predicts 95 % for outcome X but it never happens,
        actual_freq should be 0.0.
        """
        n_buckets = 10
        bucket_width = 1.0 / n_buckets
        buckets: dict[int, dict] = {i: {"sum_prob": 0.0, "correct": 0, "count": 0} for i in range(n_buckets)}
        for _ in range(10):
            conf = 0.95
            idx = min(int(conf / bucket_width), n_buckets - 1)
            buckets[idx]["sum_prob"] += conf
            buckets[idx]["count"] += 1
            # correct stays 0 – all predictions wrong

        result = []
        for i in range(n_buckets):
            b = buckets[i]
            if b["count"] == 0:
                continue
            result.append({
                "actual_freq": round(b["correct"] / b["count"], 4),
            })

        assert len(result) == 1
        assert result[0]["actual_freq"] == pytest.approx(0.0)

    def test_calibration_buckets_spread_across_buckets(self) -> None:
        """
        Predictions uniformly distributed across confidence levels should
        populate multiple buckets.
        """
        n_buckets = 10
        bucket_width = 1.0 / n_buckets
        buckets: dict[int, dict] = {i: {"sum_prob": 0.0, "correct": 0, "count": 0} for i in range(n_buckets)}

        # One prediction per bucket (confidence at the centre of each bucket)
        for i in range(n_buckets):
            conf = i * bucket_width + bucket_width / 2
            idx = min(int(conf / bucket_width), n_buckets - 1)
            buckets[idx]["sum_prob"] += conf
            buckets[idx]["count"] += 1
            buckets[idx]["correct"] += 1

        non_empty = [b for b in buckets.values() if b["count"] > 0]
        assert len(non_empty) == n_buckets

    def test_calibration_ece_computation(self) -> None:
        """
        Expected Calibration Error (ECE) for a perfectly calibrated model
        should be close to zero.
        """
        # Simulate 100 predictions with well-calibrated confidence levels
        # Bucket 5 (0.5-0.6): 50 predictions at conf=0.55, 55% correct
        # Bucket 9 (0.9-1.0): 50 predictions at conf=0.95, 95% correct
        cal_data = [
            {"bucket_lower": 0.5, "bucket_upper": 0.6, "predicted_prob": 0.55, "actual_freq": 0.55, "count": 50},
            {"bucket_lower": 0.9, "bucket_upper": 1.0, "predicted_prob": 0.95, "actual_freq": 0.95, "count": 50},
        ]
        total = sum(b["count"] for b in cal_data)
        ece = sum(
            (b["count"] / total) * abs(b["predicted_prob"] - b["actual_freq"])
            for b in cal_data
        )
        assert ece == pytest.approx(0.0, abs=1e-9)

    def test_calibration_ece_miscalibrated(self) -> None:
        """
        A model that always predicts 90 % confidence but is only correct 50 %
        of the time should have high ECE.
        """
        cal_data = [
            {"bucket_lower": 0.9, "bucket_upper": 1.0, "predicted_prob": 0.90, "actual_freq": 0.50, "count": 100},
        ]
        total = sum(b["count"] for b in cal_data)
        ece = sum(
            (b["count"] / total) * abs(b["predicted_prob"] - b["actual_freq"])
            for b in cal_data
        )
        assert ece == pytest.approx(0.40, abs=1e-6)
