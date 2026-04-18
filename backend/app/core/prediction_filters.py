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

from app.models.match import Match
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

    Pure Prediction-level predicate — safe to use inside subqueries that
    haven't joined the Match table. Callers that HAVE joined Match and
    want honest "no post-kickoff rows" semantics should combine with
    :func:`trackrecord_filter` instead.
    """
    return and_(
        Prediction.prediction_source.in_(V81_VALID_SOURCES),
        Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
    )


def trackrecord_filter() -> ColumnElement:
    """v8.1 filter + "no post-kickoff backfill" guard.

    The batch_local_fill run on 2026-04-17 stamped 14 predictions with
    ``predicted_at`` 3–27 days *after* their match kicked off. They are
    legitimate model outputs but conflict with the product claim that
    every prediction is locked before kickoff, so we exclude them from
    every user-facing aggregate (summary, segments, CSV export, tier
    breakdown, results API, BOTD track-record).

    The ``<=`` boundary keeps rows whose ``predicted_at`` is stamped at
    exactly the scheduled kickoff — those are the majority of v8.1
    predictions and represent the batch-simulation pipeline's default
    behaviour (``predicted_at := match.scheduled_at``). They remain
    defensible under "historical model validation" but would be
    flagged separately by a live-only feed (see /live-tracking).

    Requires the caller to have ``Match`` joined to ``Prediction``.
    """
    return and_(
        Prediction.prediction_source.in_(V81_VALID_SOURCES),
        Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
        Prediction.predicted_at <= Match.scheduled_at,
    )


# ---------------------------------------------------------------------------
# Cache keys affected by this filter — used by startup flush + admin endpoint
# ---------------------------------------------------------------------------
# When the filter is first enabled (or redefined), these cache entries hold
# stale aggregates computed against the un-filtered prediction set. Flush
# them so the next request recomputes against filtered data.
#
# v8.1 tier system: cache keys now include tier suffix (e.g.
# ``dashboard:metrics:platinum``, ``strategy:metrics:<uuid>:gold``).
# The glob patterns below cover both the old flat keys and the new
# tier-suffixed variants so a single flush wipes everything stale.
V81_FILTER_CACHE_PATTERNS: tuple[str, ...] = (
    "dashboard:*",          # dashboard:metrics, dashboard:metrics:{tier}
    "strategy:metrics:*",   # strategy:metrics:{uuid}, strategy:metrics:{uuid}:{tier}
    "strategy:today:*",     # strategy:today:{uuid}, strategy:today:{uuid}:{tier}
    "pricing:*",            # pricing:comparison — new in v8.1
)
