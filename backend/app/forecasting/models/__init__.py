"""Model registry mapping ``model_type`` strings to ``ForecastModel`` classes.

Usage
-----
    from app.forecasting.models import MODEL_REGISTRY

    ModelClass = MODEL_REGISTRY["elo"]
    instance = ModelClass(model_version_id=some_uuid, config={})

Supported model types
---------------------
* ``"elo"``       – Elo-rating model
* ``"poisson"``   – Poisson goal model
* ``"logistic"``  – Logistic regression model
* ``"ensemble"``  – Weighted ensemble of sub-models
"""

from __future__ import annotations

from app.forecasting.base_model import ForecastModel
from app.forecasting.models.elo_model import EloModel
from app.forecasting.models.ensemble_model import EnsembleModel
from app.forecasting.models.logistic_model import LogisticModel
from app.forecasting.models.poisson_model import PoissonModel

MODEL_REGISTRY: dict[str, type[ForecastModel]] = {
    "elo": EloModel,
    "poisson": PoissonModel,
    "logistic": LogisticModel,
    "ensemble": EnsembleModel,
}

__all__ = [
    "MODEL_REGISTRY",
    "EloModel",
    "PoissonModel",
    "LogisticModel",
    "EnsembleModel",
]
