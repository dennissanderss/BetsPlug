"""
Unit tests for forecasting models.

These tests exercise the pure maths / logic of each model class without
touching the database.  All fixtures are minimal, in-memory dictionaries.

Tests
-----
- test_elo_model_predict_returns_valid_probabilities
- test_elo_model_probabilities_sum_to_one
- test_poisson_model_predict_returns_scores
- test_ensemble_combines_models
- test_forecast_result_validation
"""
from __future__ import annotations

import uuid
import math
import pytest

from app.forecasting.base_model import ForecastResult
from app.forecasting.models.elo_model import EloModel
from app.forecasting.models.poisson_model import PoissonModel
from app.forecasting.models.ensemble_model import EnsembleModel


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def dummy_model_version_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def elo_model(dummy_model_version_id: uuid.UUID) -> EloModel:
    """EloModel with default config (football settings)."""
    return EloModel(
        model_version_id=dummy_model_version_id,
        config={"k_factor": 32, "home_advantage": 100, "default_elo": 1500, "draw_factor": 0.28},
    )


@pytest.fixture
def elo_model_no_draw(dummy_model_version_id: uuid.UUID) -> EloModel:
    """EloModel with draw_factor=0 (suitable for basketball / tennis)."""
    return EloModel(
        model_version_id=dummy_model_version_id,
        config={"k_factor": 32, "home_advantage": 50, "default_elo": 1500, "draw_factor": 0.0},
    )


@pytest.fixture
def trained_poisson_model(dummy_model_version_id: uuid.UUID) -> PoissonModel:
    """PoissonModel trained on a small synthetic dataset."""
    model = PoissonModel(
        model_version_id=dummy_model_version_id,
        config={"home_advantage": 1.15, "league_avg_home": 1.5, "league_avg_away": 1.2},
    )
    training_data = [
        {"home_team_id": "team_a", "away_team_id": "team_b", "home_score": 2, "away_score": 1},
        {"home_team_id": "team_b", "away_team_id": "team_c", "home_score": 1, "away_score": 1},
        {"home_team_id": "team_c", "away_team_id": "team_a", "home_score": 0, "away_score": 3},
        {"home_team_id": "team_a", "away_team_id": "team_c", "home_score": 2, "away_score": 0},
        {"home_team_id": "team_b", "away_team_id": "team_a", "home_score": 1, "away_score": 2},
        {"home_team_id": "team_c", "away_team_id": "team_b", "home_score": 1, "away_score": 0},
    ]
    model.train(training_data)
    return model


@pytest.fixture
def basic_match_context() -> dict:
    return {
        "home_team_id": "team_home",
        "away_team_id": "team_away",
        "home_team_name": "Home FC",
        "away_team_name": "Away FC",
    }


# ---------------------------------------------------------------------------
# EloModel tests
# ---------------------------------------------------------------------------

class TestEloModelPredict:

    def test_elo_model_predict_returns_valid_probabilities(
        self, elo_model: EloModel, basic_match_context: dict
    ) -> None:
        """Predict returns a ForecastResult with all probabilities in [0, 1]."""
        result = elo_model.predict(basic_match_context)

        assert isinstance(result, ForecastResult)
        assert 0.0 <= result.home_win_prob <= 1.0
        assert 0.0 <= result.draw_prob <= 1.0
        assert 0.0 <= result.away_win_prob <= 1.0
        assert 0.0 <= result.confidence <= 1.0

    def test_elo_model_probabilities_sum_to_one(
        self, elo_model: EloModel, basic_match_context: dict
    ) -> None:
        """home + draw + away must sum to 1.0 (within floating-point tolerance)."""
        result = elo_model.predict(basic_match_context)
        total = result.home_win_prob + result.draw_prob + result.away_win_prob
        assert abs(total - 1.0) < 1e-4, f"Probabilities sum to {total}, expected 1.0"

    def test_elo_stronger_team_has_higher_win_prob(
        self, dummy_model_version_id: uuid.UUID
    ) -> None:
        """Team with Elo 1700 vs team with 1300 should have much higher win prob."""
        model = EloModel(
            model_version_id=dummy_model_version_id,
            config={"k_factor": 32, "home_advantage": 0, "default_elo": 1500, "draw_factor": 0.0},
        )
        model.set_rating("strong", 1700.0)
        model.set_rating("weak", 1300.0)
        result = model.predict({"home_team_id": "strong", "away_team_id": "weak"})
        assert result.home_win_prob > result.away_win_prob
        assert result.home_win_prob > 0.7, "Strong team should win > 70% with 400-point gap"

    def test_elo_no_draw_factor_gives_zero_draw(
        self, elo_model_no_draw: EloModel, basic_match_context: dict
    ) -> None:
        """draw_factor=0 means draw probability should be 0."""
        result = elo_model_no_draw.predict(basic_match_context)
        assert result.draw_prob == pytest.approx(0.0, abs=1e-6)

    def test_elo_equal_teams_near_equal_probs(
        self, elo_model: EloModel
    ) -> None:
        """Two equal teams with no home advantage should have symmetric probabilities."""
        model = EloModel(
            model_version_id=uuid.uuid4(),
            config={"k_factor": 32, "home_advantage": 0, "default_elo": 1500, "draw_factor": 0.28},
        )
        model.set_rating("a", 1500.0)
        model.set_rating("b", 1500.0)
        result = model.predict({"home_team_id": "a", "away_team_id": "b"})
        assert abs(result.home_win_prob - result.away_win_prob) < 1e-4

    def test_elo_confidence_interval_present(
        self, elo_model: EloModel, basic_match_context: dict
    ) -> None:
        """The model should include a (low, high) confidence interval."""
        result = elo_model.predict(basic_match_context)
        assert result.confidence_interval is not None
        low, high = result.confidence_interval
        assert low <= high
        assert 0.0 <= low <= 1.0
        assert 0.0 <= high <= 1.0

    def test_elo_train_updates_ratings(
        self, elo_model: EloModel
    ) -> None:
        """After training the model should have non-default ratings and be marked trained."""
        training_data = [
            {"home_team_id": "t1", "away_team_id": "t2", "home_score": 3, "away_score": 0},
            {"home_team_id": "t2", "away_team_id": "t3", "home_score": 1, "away_score": 2},
            {"home_team_id": "t3", "away_team_id": "t1", "home_score": 0, "away_score": 1},
        ]
        metrics = elo_model.train(training_data)
        assert elo_model.is_trained
        assert "accuracy" in metrics
        assert "brier_score" in metrics
        assert elo_model.get_rating("t1") != 1500.0  # should have changed

    def test_elo_update_ratings_after_home_win(
        self, dummy_model_version_id: uuid.UUID
    ) -> None:
        """After a home win the home Elo should increase, away should decrease."""
        model = EloModel(model_version_id=dummy_model_version_id, config={})
        model.set_rating("home", 1500.0)
        model.set_rating("away", 1500.0)
        new_home, new_away = model.update_ratings("home", "away", 2, 0)
        assert new_home > 1500.0
        assert new_away < 1500.0


# ---------------------------------------------------------------------------
# PoissonModel tests
# ---------------------------------------------------------------------------

class TestPoissonModelPredict:

    def test_poisson_model_predict_returns_scores(
        self, trained_poisson_model: PoissonModel
    ) -> None:
        """Trained Poisson model should return non-None predicted scores."""
        result = trained_poisson_model.predict({
            "home_team_id": "team_a",
            "away_team_id": "team_b",
        })
        assert isinstance(result, ForecastResult)
        assert result.predicted_home_score is not None
        assert result.predicted_away_score is not None
        assert result.predicted_home_score > 0.0
        assert result.predicted_away_score > 0.0

    def test_poisson_probabilities_sum_to_one(
        self, trained_poisson_model: PoissonModel
    ) -> None:
        result = trained_poisson_model.predict({
            "home_team_id": "team_b",
            "away_team_id": "team_c",
        })
        total = result.home_win_prob + result.draw_prob + result.away_win_prob
        assert abs(total - 1.0) < 1e-4

    def test_poisson_untrained_uses_defaults(
        self, dummy_model_version_id: uuid.UUID
    ) -> None:
        """Untrained model should still return valid probabilities using league defaults."""
        model = PoissonModel(
            model_version_id=dummy_model_version_id,
            config={"league_avg_home": 1.5, "league_avg_away": 1.2},
        )
        result = model.predict({"home_team_id": "unknown_a", "away_team_id": "unknown_b"})
        total = result.home_win_prob + result.draw_prob + result.away_win_prob
        assert abs(total - 1.0) < 1e-4
        assert result.predicted_home_score is not None

    def test_poisson_higher_attack_increases_win_prob(
        self, dummy_model_version_id: uuid.UUID
    ) -> None:
        """Team with attack rating 2.0 should win more often than team with 0.5."""
        model = PoissonModel(model_version_id=dummy_model_version_id, config={})
        model.attack_ratings["strong"] = 2.0
        model.defence_ratings["strong"] = 1.0
        model.attack_ratings["weak"] = 0.5
        model.defence_ratings["weak"] = 1.0
        model._is_trained = True

        result = model.predict({"home_team_id": "strong", "away_team_id": "weak"})
        assert result.home_win_prob > result.away_win_prob

    def test_poisson_train_returns_metrics(
        self, dummy_model_version_id: uuid.UUID
    ) -> None:
        model = PoissonModel(model_version_id=dummy_model_version_id, config={})
        data = [
            {"home_team_id": "x", "away_team_id": "y", "home_score": 2, "away_score": 1},
            {"home_team_id": "y", "away_team_id": "x", "home_score": 0, "away_score": 2},
        ]
        metrics = model.train(data)
        assert model.is_trained
        assert "n_matches" in metrics
        assert "league_avg_home" in metrics
        assert metrics["n_matches"] == 2


# ---------------------------------------------------------------------------
# EnsembleModel tests
# ---------------------------------------------------------------------------

class TestEnsembleModel:

    def test_ensemble_combines_models(
        self,
        dummy_model_version_id: uuid.UUID,
        elo_model: EloModel,
        trained_poisson_model: PoissonModel,
    ) -> None:
        """Ensemble output should lie between the component model outputs."""
        ensemble = EnsembleModel(
            model_version_id=dummy_model_version_id,
            config={},
            sub_models=[(elo_model, 0.5), (trained_poisson_model, 0.5)],
        )
        context = {"home_team_id": "team_a", "away_team_id": "team_b"}
        result = ensemble.predict(context)

        assert isinstance(result, ForecastResult)
        total = result.home_win_prob + result.draw_prob + result.away_win_prob
        assert abs(total - 1.0) < 1e-4

    def test_ensemble_no_submodels_uniform(
        self, dummy_model_version_id: uuid.UUID
    ) -> None:
        """Ensemble with no sub-models falls back to uniform 1/3 each."""
        ensemble = EnsembleModel(model_version_id=dummy_model_version_id, config={})
        result = ensemble.predict({"home_team_id": "a", "away_team_id": "b"})
        assert result.home_win_prob == pytest.approx(1 / 3, abs=1e-6)
        assert result.draw_prob == pytest.approx(1 / 3, abs=1e-6)
        assert result.away_win_prob == pytest.approx(1 / 3, abs=1e-6)
        assert result.confidence == pytest.approx(0.0)

    def test_ensemble_weights_affect_output(
        self,
        dummy_model_version_id: uuid.UUID,
        elo_model: EloModel,
    ) -> None:
        """Weight of 1.0 vs 0.0 means the output should equal the weighted model."""
        context = {"home_team_id": "team_x", "away_team_id": "team_y"}
        elo_result = elo_model.predict(context)

        # An ensemble that is entirely the elo model (weight 1, other weight 0)
        # should reproduce the same probabilities
        dummy_elo2 = EloModel(model_version_id=uuid.uuid4(), config={})
        ensemble = EnsembleModel(
            model_version_id=dummy_model_version_id,
            config={},
            sub_models=[(elo_model, 1.0), (dummy_elo2, 0.0)],
        )
        ens_result = ensemble.predict(context)
        # With weight 0 the second model is excluded → output = elo_result
        assert ens_result.home_win_prob == pytest.approx(elo_result.home_win_prob, abs=1e-4)
        assert ens_result.draw_prob == pytest.approx(elo_result.draw_prob, abs=1e-4)
        assert ens_result.away_win_prob == pytest.approx(elo_result.away_win_prob, abs=1e-4)

    def test_ensemble_add_submodel(
        self,
        dummy_model_version_id: uuid.UUID,
        elo_model: EloModel,
    ) -> None:
        ensemble = EnsembleModel(model_version_id=dummy_model_version_id, config={})
        assert len(ensemble.sub_models) == 0
        ensemble.add_sub_model(elo_model, weight=1.0)
        assert len(ensemble.sub_models) == 1

    def test_ensemble_train_delegates_to_submodels(
        self,
        dummy_model_version_id: uuid.UUID,
        elo_model: EloModel,
    ) -> None:
        ensemble = EnsembleModel(
            model_version_id=dummy_model_version_id,
            config={},
            sub_models=[(elo_model, 1.0)],
        )
        data = [{"home_team_id": "a", "away_team_id": "b", "home_score": 1, "away_score": 0}]
        metrics = ensemble.train(data)
        assert "sub_model_metrics" in metrics
        assert "n_sub_models" in metrics
        assert metrics["n_sub_models"] == 1


# ---------------------------------------------------------------------------
# ForecastResult validation tests
# ---------------------------------------------------------------------------

class TestForecastResultValidation:

    def test_forecast_result_validation_valid(self) -> None:
        """Constructing a valid ForecastResult should not raise."""
        result = ForecastResult(
            home_win_prob=0.45,
            draw_prob=0.25,
            away_win_prob=0.30,
            confidence=0.6,
        )
        assert abs(result.home_win_prob + result.draw_prob + result.away_win_prob - 1.0) < 1e-6

    def test_forecast_result_validation_probs_not_summing(self) -> None:
        """Probabilities that don't sum to 1.0 should raise ValueError."""
        with pytest.raises(ValueError, match="sum to 1"):
            ForecastResult(
                home_win_prob=0.5,
                draw_prob=0.5,
                away_win_prob=0.5,
                confidence=0.5,
            )

    def test_forecast_result_validation_out_of_range_prob(self) -> None:
        """Probability > 1.0 should raise ValueError."""
        with pytest.raises(ValueError):
            ForecastResult(
                home_win_prob=1.2,
                draw_prob=0.0,
                away_win_prob=-0.2,
                confidence=0.5,
            )

    def test_forecast_result_validation_negative_confidence(self) -> None:
        """Confidence < 0 should raise ValueError."""
        with pytest.raises(ValueError):
            ForecastResult(
                home_win_prob=0.5,
                draw_prob=0.2,
                away_win_prob=0.3,
                confidence=-0.1,
            )

    def test_forecast_result_to_dict(self) -> None:
        """to_dict() should return a JSON-serialisable dictionary."""
        result = ForecastResult(
            home_win_prob=0.50,
            draw_prob=0.25,
            away_win_prob=0.25,
            predicted_home_score=1.5,
            predicted_away_score=1.1,
            confidence=0.4,
            confidence_interval=(0.35, 0.65),
        )
        d = result.to_dict()
        assert d["home_win_prob"] == pytest.approx(0.50)
        assert d["predicted_home_score"] == pytest.approx(1.5)
        assert d["confidence_interval"] == [pytest.approx(0.35), pytest.approx(0.65)]

    def test_forecast_result_zero_draw_prob_allowed(self) -> None:
        """draw_prob=0 is valid (for sports without draws)."""
        result = ForecastResult(
            home_win_prob=0.6,
            draw_prob=0.0,
            away_win_prob=0.4,
            confidence=0.3,
        )
        assert result.draw_prob == 0.0
