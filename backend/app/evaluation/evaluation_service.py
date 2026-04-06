"""Evaluation service: scores predictions against actual match results.

Metrics implemented
-------------------
Brier score
    BS = (1/N) * Σ (p_i - o_i)^2  summed over all outcome classes.
    For a 3-class problem (home/draw/away) this is the multi-class Brier
    score.  Lower is better; 0.0 is perfect; 1.0 is maximally wrong.

Log loss (cross-entropy)
    LL = -log(p_actual)  where p_actual is the predicted probability of
    the outcome that actually occurred.  Clipped to avoid log(0).

Calibration error (ECE)
    |mean_predicted_prob_in_bucket - fraction_positive_in_bucket|
    averaged over probability buckets.

Public API
----------
    svc = EvaluationService()
    evaluation = await svc.evaluate_prediction(prediction_id, db)
    summary   = await svc.get_trackrecord_summary(filters, db)
    segments  = await svc.get_segment_performance("sport", filters, db)
    calibration = await svc.get_calibration_data(filters, db)
"""

from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.match import Match, MatchResult
from app.models.model_version import ModelVersion
from app.models.prediction import Prediction, PredictionEvaluation


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_LOG_CLIP = 1e-15          # minimum probability before log() to avoid -inf
_CALIBRATION_BUCKETS = 10  # number of equal-width buckets for calibration


class EvaluationService:
    """Score predictions against known match outcomes."""

    # ------------------------------------------------------------------ #
    # Single prediction evaluation                                        #
    # ------------------------------------------------------------------ #

    async def evaluate_prediction(
        self,
        prediction_id: uuid.UUID,
        db: AsyncSession,
    ) -> PredictionEvaluation:
        """Evaluate a single prediction and persist the result.

        Parameters
        ----------
        prediction_id:
            UUID of the ``Prediction`` to evaluate.
        db:
            Async SQLAlchemy session.

        Returns
        -------
        PredictionEvaluation
            The newly created (flushed, not committed) evaluation row.

        Raises
        ------
        ValueError
            If the prediction or its match result cannot be found, or if the
            prediction has already been evaluated.
        """
        # Load prediction with match result
        stmt = (
            select(Prediction)
            .where(Prediction.id == prediction_id)
        )
        prediction = (await db.execute(stmt)).scalar_one_or_none()
        if prediction is None:
            raise ValueError(f"Prediction {prediction_id} not found")

        # Guard: already evaluated?
        existing_stmt = select(PredictionEvaluation).where(
            PredictionEvaluation.prediction_id == prediction_id
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()
        if existing is not None:
            return existing  # idempotent

        # Load match result
        match_result_stmt = (
            select(MatchResult)
            .where(MatchResult.match_id == prediction.match_id)
        )
        match_result = (await db.execute(match_result_stmt)).scalar_one_or_none()
        if match_result is None:
            raise ValueError(
                f"No MatchResult for match {prediction.match_id} – "
                "cannot evaluate before result is recorded"
            )

        # Determine actual outcome
        actual_outcome = _determine_outcome(
            match_result.home_score, match_result.away_score
        )

        # Build probability vector [home, draw, away]
        probs = _build_prob_vector(prediction)

        # Compute metrics
        is_correct = _predicted_class(probs) == actual_outcome
        brier = _brier_score(probs, actual_outcome)
        log_loss_val = _log_loss(probs, actual_outcome)

        evaluation = PredictionEvaluation(
            id=uuid.uuid4(),
            prediction_id=prediction.id,
            actual_outcome=actual_outcome,
            actual_home_score=match_result.home_score,
            actual_away_score=match_result.away_score,
            is_correct=is_correct,
            brier_score=brier,
            log_loss=log_loss_val,
            evaluated_at=datetime.now(timezone.utc),
        )
        db.add(evaluation)
        await db.flush()
        return evaluation

    # ------------------------------------------------------------------ #
    # Batch evaluation                                                     #
    # ------------------------------------------------------------------ #

    async def evaluate_batch(
        self,
        prediction_ids: list[uuid.UUID],
        db: AsyncSession,
    ) -> list[PredictionEvaluation]:
        """Evaluate multiple predictions in a single session.

        Predictions that have already been evaluated are returned as-is.
        Predictions whose match result is not yet available are skipped
        (no exception is raised).

        Returns
        -------
        list[PredictionEvaluation]
            Evaluations in the same order as *prediction_ids*; entries for
            predictions that could not be evaluated are omitted.
        """
        results: list[PredictionEvaluation] = []
        for pred_id in prediction_ids:
            try:
                ev = await self.evaluate_prediction(pred_id, db)
                results.append(ev)
            except ValueError:
                # Match result missing – skip silently
                continue
        return results

    # ------------------------------------------------------------------ #
    # Track-record summary                                                 #
    # ------------------------------------------------------------------ #

    async def get_trackrecord_summary(
        self,
        db: AsyncSession,
        *,
        sport_slug: Optional[str] = None,
        league_slug: Optional[str] = None,
        model_version_id: Optional[uuid.UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """Aggregate accuracy, brier, log_loss over all evaluated predictions.

        All parameters are optional filters.

        Returns
        -------
        dict with keys:
            total, correct, accuracy, avg_brier_score, avg_log_loss,
            avg_confidence, calibration_error
        """
        stmt = (
            select(
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(
                    case((PredictionEvaluation.is_correct.is_(True), 1), else_=0)
                ).label("correct"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
        )
        stmt = _apply_common_filters(
            stmt,
            sport_slug=sport_slug,
            league_slug=league_slug,
            model_version_id=model_version_id,
            start_date=start_date,
            end_date=end_date,
        )

        row = (await db.execute(stmt)).one()
        total = int(row.total or 0)
        correct = int(row.correct or 0)
        avg_brier = float(row.avg_brier or 0.0)
        avg_log_loss = float(row.avg_log_loss or 0.0)
        avg_confidence = float(row.avg_confidence or 0.0)

        # Calibration error
        calibration_error = await self._compute_calibration_error(
            db,
            sport_slug=sport_slug,
            league_slug=league_slug,
            model_version_id=model_version_id,
            start_date=start_date,
            end_date=end_date,
        )

        return {
            "total": total,
            "correct": correct,
            "accuracy": round(correct / total, 4) if total > 0 else 0.0,
            "avg_brier_score": round(avg_brier, 6),
            "avg_log_loss": round(avg_log_loss, 6),
            "avg_confidence": round(avg_confidence, 4),
            "calibration_error": round(calibration_error, 6),
        }

    # ------------------------------------------------------------------ #
    # Segment performance                                                  #
    # ------------------------------------------------------------------ #

    async def get_segment_performance(
        self,
        group_by: str,
        db: AsyncSession,
        *,
        sport_slug: Optional[str] = None,
        league_slug: Optional[str] = None,
        model_version_id: Optional[uuid.UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> list[dict]:
        """Return per-segment accuracy/brier metrics.

        Parameters
        ----------
        group_by:
            One of: ``"sport"``, ``"league"``, ``"month"``,
            ``"confidence_bucket"``, ``"prediction_type"``.

        Returns
        -------
        list[dict]
            Each entry: {segment, total, accuracy, avg_brier_score}
        """
        from app.models.league import League
        from app.models.sport import Sport

        valid_groups = {"sport", "league", "month", "confidence_bucket", "prediction_type"}
        if group_by not in valid_groups:
            raise ValueError(
                f"group_by must be one of {valid_groups}, got '{group_by}'"
            )

        # Build grouping expression
        if group_by == "sport":
            group_expr = Sport.slug
            join_extra = [
                (Match, Match.id == Prediction.match_id),
                (League, League.id == Match.league_id),
                (Sport, Sport.id == League.sport_id),
            ]
        elif group_by == "league":
            group_expr = League.slug
            join_extra = [
                (Match, Match.id == Prediction.match_id),
                (League, League.id == Match.league_id),
            ]
        elif group_by == "month":
            group_expr = func.to_char(PredictionEvaluation.evaluated_at, "YYYY-MM")
            join_extra = [
                (Match, Match.id == Prediction.match_id),
            ]
        elif group_by == "confidence_bucket":
            # 10 buckets: 0.0-0.1, 0.1-0.2, …, 0.9-1.0
            group_expr = func.floor(Prediction.confidence * 10) / 10
            join_extra = [
                (Match, Match.id == Prediction.match_id),
            ]
        elif group_by == "prediction_type":
            group_expr = Prediction.prediction_type
            join_extra = [
                (Match, Match.id == Prediction.match_id),
            ]

        stmt = (
            select(
                group_expr.label("segment"),
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(
                    case((PredictionEvaluation.is_correct.is_(True), 1), else_=0)
                ).label("correct"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        )
        for model, condition in join_extra:
            stmt = stmt.join(model, condition)

        stmt = _apply_common_filters(
            stmt,
            sport_slug=sport_slug,
            league_slug=league_slug,
            model_version_id=model_version_id,
            start_date=start_date,
            end_date=end_date,
        )
        stmt = stmt.group_by(group_expr).order_by(group_expr)

        rows = (await db.execute(stmt)).all()
        output = []
        for row in rows:
            total = int(row.total or 0)
            correct = int(row.correct or 0)
            output.append(
                {
                    "segment": str(row.segment),
                    "total": total,
                    "correct": correct,
                    "accuracy": round(correct / total, 4) if total > 0 else 0.0,
                    "avg_brier_score": round(float(row.avg_brier or 0.0), 6),
                }
            )
        return output

    # ------------------------------------------------------------------ #
    # Calibration data                                                     #
    # ------------------------------------------------------------------ #

    async def get_calibration_data(
        self,
        db: AsyncSession,
        *,
        sport_slug: Optional[str] = None,
        league_slug: Optional[str] = None,
        model_version_id: Optional[uuid.UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        n_buckets: int = _CALIBRATION_BUCKETS,
    ) -> list[dict]:
        """Return calibration data grouped into probability buckets.

        Each bucket contains the mean predicted probability (of the predicted
        class) vs the actual win frequency.

        Returns
        -------
        list[dict]
            Sorted by bucket lower bound.
            Keys: bucket_lower, bucket_upper, predicted_prob, actual_freq, count
        """
        # We bucket on the max probability (predicted class confidence)
        # Build raw data: for each evaluated prediction, (max_prob, is_correct)
        stmt = (
            select(
                Prediction.confidence.label("confidence"),
                PredictionEvaluation.is_correct.label("is_correct"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
        )
        stmt = _apply_common_filters(
            stmt,
            sport_slug=sport_slug,
            league_slug=league_slug,
            model_version_id=model_version_id,
            start_date=start_date,
            end_date=end_date,
        )

        rows = (await db.execute(stmt)).all()
        if not rows:
            return []

        # Build buckets manually (n_buckets equal-width from 0.0 to 1.0)
        bucket_width = 1.0 / n_buckets
        buckets: dict[int, dict[str, Any]] = {}
        for i in range(n_buckets):
            buckets[i] = {"sum_prob": 0.0, "correct": 0, "count": 0}

        for row in rows:
            conf = float(row.confidence or 0.0)
            bucket_idx = min(int(conf / bucket_width), n_buckets - 1)
            buckets[bucket_idx]["sum_prob"] += conf
            buckets[bucket_idx]["count"] += 1
            if row.is_correct:
                buckets[bucket_idx]["correct"] += 1

        result = []
        for i in range(n_buckets):
            b = buckets[i]
            count = b["count"]
            if count == 0:
                continue
            lower = round(i * bucket_width, 2)
            upper = round((i + 1) * bucket_width, 2)
            predicted_prob = round(b["sum_prob"] / count, 4)
            actual_freq = round(b["correct"] / count, 4)
            result.append(
                {
                    "bucket_lower": lower,
                    "bucket_upper": upper,
                    "predicted_prob": predicted_prob,
                    "actual_freq": actual_freq,
                    "count": count,
                }
            )
        return result

    # ------------------------------------------------------------------ #
    # Internal: calibration error                                         #
    # ------------------------------------------------------------------ #

    async def _compute_calibration_error(
        self,
        db: AsyncSession,
        **filter_kwargs,
    ) -> float:
        """Compute Expected Calibration Error (ECE) from calibration buckets."""
        cal_data = await self.get_calibration_data(db, **filter_kwargs)
        if not cal_data:
            return 0.0

        total_count = sum(b["count"] for b in cal_data)
        if total_count == 0:
            return 0.0

        ece = sum(
            (b["count"] / total_count) * abs(b["predicted_prob"] - b["actual_freq"])
            for b in cal_data
        )
        return ece


# ---------------------------------------------------------------------------
# Module-level helpers
# ---------------------------------------------------------------------------


def _determine_outcome(home_score: int, away_score: int) -> str:
    """Return 'home', 'draw', or 'away' based on scores."""
    if home_score > away_score:
        return "home"
    elif home_score == away_score:
        return "draw"
    else:
        return "away"


def _build_prob_vector(prediction: Prediction) -> dict[str, float]:
    """Return normalised probability dict for the three outcomes."""
    home = float(prediction.home_win_prob or 0.0)
    draw = float(prediction.draw_prob or 0.0)
    away = float(prediction.away_win_prob or 0.0)

    total = home + draw + away
    if total <= 0:
        return {"home": 1 / 3, "draw": 1 / 3, "away": 1 / 3}

    return {
        "home": home / total,
        "draw": draw / total,
        "away": away / total,
    }


def _predicted_class(probs: dict[str, float]) -> str:
    """Return the outcome class with the highest probability."""
    return max(probs, key=lambda k: probs[k])


def _brier_score(probs: dict[str, float], actual_outcome: str) -> float:
    """Multi-class Brier score: (1/N) * Σ (p_i - o_i)^2.

    N=3 outcomes.  o_i is 1 for the actual outcome, 0 otherwise.
    """
    outcomes = ["home", "draw", "away"]
    bs = sum(
        (probs.get(o, 0.0) - (1.0 if o == actual_outcome else 0.0)) ** 2
        for o in outcomes
    )
    return round(bs / len(outcomes), 6)


def _log_loss(probs: dict[str, float], actual_outcome: str) -> float:
    """Log loss: -log(p_actual), clipped to avoid -inf."""
    p = max(probs.get(actual_outcome, 0.0), _LOG_CLIP)
    return round(-math.log(p), 6)


def _apply_common_filters(
    stmt,
    *,
    sport_slug: Optional[str],
    league_slug: Optional[str],
    model_version_id: Optional[uuid.UUID],
    start_date: Optional[datetime],
    end_date: Optional[datetime],
):
    """Apply shared WHERE clauses to an existing select statement."""
    from app.models.league import League
    from app.models.sport import Sport

    conditions = []

    if sport_slug is not None:
        # Require League and Sport already joined by caller
        conditions.append(Sport.slug == sport_slug)

    if league_slug is not None:
        conditions.append(League.slug == league_slug)

    if model_version_id is not None:
        conditions.append(Prediction.model_version_id == model_version_id)

    if start_date is not None:
        conditions.append(PredictionEvaluation.evaluated_at >= start_date)

    if end_date is not None:
        conditions.append(PredictionEvaluation.evaluated_at <= end_date)

    if conditions:
        stmt = stmt.where(and_(*conditions))

    return stmt
