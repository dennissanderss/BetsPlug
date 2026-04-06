"""Backtesting service: walk-forward simulation with strict temporal ordering.

Walk-forward methodology
------------------------
For each match in the specified date range (sorted oldest → newest):

1. Build match features using *only* data that existed before match kick-off.
2. Run the active model version to produce a probability forecast.
3. Compare the forecast against the known (post-match) result.
4. Persist a ``BacktestResult`` row for the match.

After all matches are processed the aggregate metrics are written back to
the ``BacktestRun`` row and its status is set to ``"completed"``.

No data leakage: the ``scheduled_at`` timestamp is used as the strict
temporal boundary in all DB queries, identical to production forecasting.

Public API
----------
    svc = BacktestService()
    run = await svc.run_backtest(config, db)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.feature_service import FeatureService
from app.forecasting.forecast_service import ForecastService
from app.models.backtest import BacktestResult, BacktestRun
from app.models.match import Match, MatchResult, MatchStatus
from app.models.model_version import ModelVersion


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _determine_outcome(home_score: int, away_score: int) -> str:
    if home_score > away_score:
        return "home"
    elif home_score == away_score:
        return "draw"
    else:
        return "away"


def _multi_brier(home_p: float, draw_p: float, away_p: float, actual: str) -> float:
    """Multi-class Brier score for 3 outcomes."""
    outcomes = {"home": home_p, "draw": draw_p, "away": away_p}
    bs = sum(
        (outcomes.get(o, 0.0) - (1.0 if o == actual else 0.0)) ** 2
        for o in outcomes
    )
    return round(bs / 3, 6)


def _predicted_class(home_p: float, draw_p: float, away_p: float) -> str:
    probs = {"home": home_p, "draw": draw_p, "away": away_p}
    return max(probs, key=lambda k: probs[k])


class BacktestService:
    """Executes walk-forward backtests and stores results."""

    def __init__(self) -> None:
        self._feature_service = FeatureService()
        self._forecast_service = ForecastService()

    # ------------------------------------------------------------------ #
    # Main entry point                                                     #
    # ------------------------------------------------------------------ #

    async def run_backtest(
        self,
        config: dict,
        db: AsyncSession,
    ) -> BacktestRun:
        """Execute a backtest and return the completed ``BacktestRun``.

        Config keys (all required unless marked optional)
        --------------------------------------------------
        model_version_id : str | UUID
            The model to evaluate.
        sport_slug : str
            Filter matches to this sport.
        league_slug : str, optional
            Further filter to a specific league.
        start_date : str (ISO-8601) | datetime
            Inclusive start of the evaluation window.
        end_date : str (ISO-8601) | datetime
            Inclusive end of the evaluation window.
        name : str, optional
            Human-readable label for the run.

        Returns
        -------
        BacktestRun
            Completed run with aggregate metrics populated.

        Raises
        ------
        ValueError
            If the model version cannot be found.
        """
        # --- Parse config ---------------------------------------------- #
        model_version_id = uuid.UUID(str(config["model_version_id"]))
        sport_slug = config["sport_slug"]
        league_slug = config.get("league_slug")
        start_date = _parse_date(config["start_date"])
        end_date = _parse_date(config["end_date"])
        run_name = config.get("name") or (
            f"backtest_{sport_slug}_{start_date.date()}_{end_date.date()}"
        )

        # --- Validate model version ------------------------------------ #
        mv_stmt = select(ModelVersion).where(ModelVersion.id == model_version_id)
        model_version = (await db.execute(mv_stmt)).scalar_one_or_none()
        if model_version is None:
            raise ValueError(f"ModelVersion {model_version_id} not found")

        # --- Create BacktestRun row ------------------------------------ #
        run = BacktestRun(
            id=uuid.uuid4(),
            model_version_id=model_version_id,
            name=run_name,
            sport_slug=sport_slug,
            league_slug=league_slug,
            start_date=start_date,
            end_date=end_date,
            status="running",
            ran_at=datetime.now(timezone.utc),
            config=config,
        )
        db.add(run)
        await db.flush()

        try:
            # --- Fetch matches in temporal order ----------------------- #
            matches = await self._fetch_matches(
                sport_slug=sport_slug,
                league_slug=league_slug,
                start_date=start_date,
                end_date=end_date,
                db=db,
            )

            # --- Walk-forward loop ------------------------------------- #
            results: list[BacktestResult] = []
            for match in matches:
                result = await self._evaluate_match(
                    match=match,
                    model_version=model_version,
                    run_id=run.id,
                    db=db,
                )
                if result is not None:
                    results.append(result)
                    db.add(result)

            await db.flush()

            # --- Aggregate metrics ------------------------------------- #
            aggregate = _aggregate_metrics(results)
            run.total_predictions = aggregate["total"]
            run.accuracy = aggregate["accuracy"]
            run.brier_score = aggregate["avg_brier_score"]
            run.log_loss = aggregate.get("avg_log_loss")
            run.calibration_error = aggregate.get("calibration_error")
            run.summary_metrics = aggregate
            run.status = "completed"

        except Exception as exc:
            run.status = "failed"
            run.summary_metrics = {"error": str(exc)}
            await db.flush()
            raise

        await db.flush()
        return run

    # ------------------------------------------------------------------ #
    # Match fetching                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _fetch_matches(
        sport_slug: str,
        league_slug: Optional[str],
        start_date: datetime,
        end_date: datetime,
        db: AsyncSession,
    ) -> list[Match]:
        """Return finished matches in chronological order."""
        from app.models.league import League
        from app.models.sport import Sport

        stmt = (
            select(Match)
            .join(League, League.id == Match.league_id)
            .join(Sport, Sport.id == League.sport_id)
            .where(
                and_(
                    Match.status == MatchStatus.FINISHED,
                    Match.scheduled_at >= start_date,
                    Match.scheduled_at <= end_date,
                    Sport.slug == sport_slug,
                )
            )
        )
        if league_slug is not None:
            stmt = stmt.where(League.slug == league_slug)

        stmt = stmt.order_by(Match.scheduled_at)

        rows = (await db.execute(stmt)).scalars().all()
        return list(rows)

    # ------------------------------------------------------------------ #
    # Single match evaluation                                              #
    # ------------------------------------------------------------------ #

    async def _evaluate_match(
        self,
        match: Match,
        model_version: ModelVersion,
        run_id: uuid.UUID,
        db: AsyncSession,
    ) -> Optional[BacktestResult]:
        """Predict outcome for *match* and compare against actual result.

        Data leakage guard: all feature queries use ``match.scheduled_at``
        as the strict temporal boundary, so no post-match data is used.

        Returns None if the match has no result yet (should not happen since
        we filter for FINISHED status, but guards against edge cases).
        """
        # Load actual result
        result_stmt = select(MatchResult).where(
            MatchResult.match_id == match.id
        )
        match_result = (await db.execute(result_stmt)).scalar_one_or_none()
        if match_result is None:
            return None

        # Generate forecast using temporal boundary at scheduled_at
        # (feature service respects this internally)
        try:
            features = await self._feature_service.build_match_features(
                match.id, db
            )
        except Exception:
            # If features can't be built (e.g., new team with no history),
            # skip this match
            return None

        # Build match context for the model (same structure as ForecastService)
        match_context = await self._forecast_service.build_match_context(match, db)

        # Run model
        try:
            forecast = self._forecast_service._run_model(model_version, match_context)
        except Exception:
            return None

        # Normalise probabilities
        home_p = float(forecast.home_win_prob)
        draw_p = float(forecast.draw_prob or 0.0)
        away_p = float(forecast.away_win_prob)
        total = home_p + draw_p + away_p
        if total > 0:
            home_p /= total
            draw_p /= total
            away_p /= total

        predicted_outcome = _predicted_class(home_p, draw_p, away_p)
        actual_outcome = _determine_outcome(
            match_result.home_score, match_result.away_score
        )
        is_correct = predicted_outcome == actual_outcome
        brier = _multi_brier(home_p, draw_p, away_p, actual_outcome)
        confidence = float(forecast.confidence)

        return BacktestResult(
            id=uuid.uuid4(),
            backtest_run_id=run_id,
            match_id=match.id,
            predicted_outcome=predicted_outcome,
            actual_outcome=actual_outcome,
            home_win_prob=home_p,
            draw_prob=draw_p,
            away_win_prob=away_p,
            confidence=confidence,
            is_correct=is_correct,
            brier_score=brier,
        )


# ---------------------------------------------------------------------------
# Aggregation helpers
# ---------------------------------------------------------------------------


def _aggregate_metrics(results: list[BacktestResult]) -> dict:
    """Compute aggregate performance metrics from a list of results."""
    import math

    n = len(results)
    if n == 0:
        return {
            "total": 0,
            "correct": 0,
            "accuracy": 0.0,
            "avg_brier_score": 0.0,
            "avg_log_loss": 0.0,
            "calibration_error": 0.0,
        }

    correct = sum(1 for r in results if r.is_correct)
    avg_brier = sum(r.brier_score for r in results) / n

    # Log loss: -log(p_predicted_class)
    _LOG_CLIP = 1e-15
    log_losses = []
    for r in results:
        probs = {
            "home": r.home_win_prob,
            "draw": r.draw_prob or 0.0,
            "away": r.away_win_prob,
        }
        p = max(probs.get(r.actual_outcome, _LOG_CLIP), _LOG_CLIP)
        log_losses.append(-math.log(p))
    avg_log_loss = sum(log_losses) / n

    # Calibration error (ECE) via confidence buckets
    calibration_error = _compute_ece(results)

    return {
        "total": n,
        "correct": correct,
        "accuracy": round(correct / n, 4),
        "avg_brier_score": round(avg_brier, 6),
        "avg_log_loss": round(avg_log_loss, 6),
        "calibration_error": round(calibration_error, 6),
    }


def _compute_ece(results: list[BacktestResult], n_buckets: int = 10) -> float:
    """Expected Calibration Error from BacktestResult list."""
    if not results:
        return 0.0

    bucket_width = 1.0 / n_buckets
    buckets: list[dict] = [
        {"sum_conf": 0.0, "correct": 0, "count": 0} for _ in range(n_buckets)
    ]

    for r in results:
        conf = float(r.confidence)
        idx = min(int(conf / bucket_width), n_buckets - 1)
        buckets[idx]["sum_conf"] += conf
        buckets[idx]["count"] += 1
        if r.is_correct:
            buckets[idx]["correct"] += 1

    total = len(results)
    ece = 0.0
    for b in buckets:
        if b["count"] == 0:
            continue
        avg_conf = b["sum_conf"] / b["count"]
        acc = b["correct"] / b["count"]
        ece += (b["count"] / total) * abs(avg_conf - acc)

    return ece


def _parse_date(value) -> datetime:
    """Accept datetime or ISO-8601 string."""
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value)).replace(tzinfo=timezone.utc)
