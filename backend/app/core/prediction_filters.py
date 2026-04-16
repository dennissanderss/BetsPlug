"""V8.1 prediction filtering helpers.

The v8.1 engine went live on 2026-04-16 around 11:00 UTC. Predictions made
before that used a broken feature pipeline (22/39 features wrong — see
docs/feature_pipeline_verification.md) and must NOT be used for user-facing
accuracy displays.

Use :func:`v81_predictions_filter` in any SQLAlchemy query that aggregates
is_correct / winrate / accuracy for users.

Example::

    from app.core.prediction_filters import v81_predictions_filter

    q = (
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .where(v81_predictions_filter())
    )
"""
from datetime import datetime, timezone
from sqlalchemy.sql import ColumnElement
from sqlalchemy import and_

from app.models.prediction import Prediction


# ---------------------------------------------------------------------------
# Deploy cut-off
# ---------------------------------------------------------------------------
# First clean v8.1 commit (b7270b9) was pushed at 11:07 UTC on 2026-04-16;
# Railway finished deploying around 11:10 UTC. 11:00 UTC is a conservative
# lower bound with room for clock skew between Railway and local clocks.
V81_DEPLOYMENT_CUTOFF = datetime(2026, 4, 16, 11, 0, 0, tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Valid prediction_source values produced by the v8.1 pipeline
# ---------------------------------------------------------------------------
# - 'batch_local_fill' : one-shot local-ensemble run (19,151 preds)
# - 'backtest'         : APScheduler job_generate_historical_predictions
#                        (ongoing every 5 min, gefixte pipeline)
# - 'live'             : Celery-beat generate-predictions-every-10m for
#                        upcoming matches (gefixte pipeline post-deploy)
V81_VALID_SOURCES: tuple[str, ...] = ("batch_local_fill", "backtest", "live")


def v81_predictions_filter() -> ColumnElement:
    """Return SQLAlchemy WHERE expression that restricts to v8.1 predictions.

    Combine with any other filters using ``.where(v81_predictions_filter())``.

    Filter logic:
        prediction_source IN V81_VALID_SOURCES
        AND created_at >= V81_DEPLOYMENT_CUTOFF
    """
    return and_(
        Prediction.prediction_source.in_(V81_VALID_SOURCES),
        Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
    )


# ---------------------------------------------------------------------------
# Cache keys affected by this filter — used by startup flush + admin endpoint
# ---------------------------------------------------------------------------
# When the filter is first enabled (or redefined), these cache entries hold
# stale aggregates computed against the un-filtered prediction set. Flush
# them so the next request recomputes against filtered data.
V81_FILTER_CACHE_PATTERNS: tuple[str, ...] = (
    "dashboard:*",
    "strategy:metrics:*",
    "strategy:today:*",
)
