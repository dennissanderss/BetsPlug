"""Forecast service: orchestrates model loading, context building, and
prediction storage.

Public API
----------
    service = ForecastService()
    prediction = await service.generate_forecast(match_id, db)

The service:
1. Loads the match + related entities from the database.
2. Builds a rich ``match_context`` dict (form, h2h, stats, standings).
3. Looks up the active ``ModelVersion`` row(s) for the relevant sport.
4. Instantiates the appropriate ``ForecastModel`` and runs ``predict()``.
5. Persists a ``Prediction`` + ``PredictionExplanation`` row.
6. Returns the ``Prediction`` ORM object.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.forecasting.base_model import ForecastModel, ForecastResult
from app.forecasting.elo_history import EloHistoryService
from app.forecasting.models import MODEL_REGISTRY, EnsembleModel
from app.models.match import Match, MatchResult
from app.models.model_version import ModelVersion
from app.models.prediction import Prediction, PredictionExplanation
from app.models.standings import StandingsSnapshot
from app.models.stats import TeamStats


# ─────────────────────────────────────────────────────────────────────────────
# Constants / defaults
# ─────────────────────────────────────────────────────────────────────────────

_FORM_MATCHES = 5          # number of recent matches for form calculation
_H2H_MATCHES = 10          # number of h2h matches to fetch
_DEFAULT_LEAGUE_AVG = 2.7  # fallback league average goals per game


# ─────────────────────────────────────────────────────────────────────────────
# Service
# ─────────────────────────────────────────────────────────────────────────────


class ForecastService:
    """Generates, stores, and returns predictions for a given match.

    The service is stateless between calls; all state lives in the database
    or in the ``ForecastModel`` instances built transiently per request.
    """

    # ------------------------------------------------------------------ #
    # Main entry point                                                     #
    # ------------------------------------------------------------------ #

    async def generate_forecast(
        self,
        match_id: uuid.UUID,
        db: AsyncSession,
        model_version_id: Optional[uuid.UUID] = None,
        prediction_type: str = "match_result",
    ) -> Prediction:
        """Generate and persist a forecast for *match_id*.

        Parameters
        ----------
        match_id:
            UUID of the ``Match`` to forecast.
        db:
            Async SQLAlchemy session (caller-owned; not committed here).
        model_version_id:
            Force a specific ``ModelVersion``.  If ``None``, the most recent
            active model for the match's sport scope is used.
        prediction_type:
            Value stored in ``Prediction.prediction_type``
            (default ``"match_result"``).

        Returns
        -------
        Prediction
            The newly created (and flushed but not committed) ORM row.

        Raises
        ------
        ValueError
            If the match does not exist or no active model version is found.
        """
        # 1. Load match ------------------------------------------------- #
        match = await self._load_match(match_id, db)
        if match is None:
            raise ValueError(f"Match {match_id} not found")

        # 2. Build context ---------------------------------------------- #
        match_context = await self.build_match_context(match, db)

        # 3. Resolve model version -------------------------------------- #
        mv = await self._resolve_model_version(match, db, model_version_id)
        if mv is None:
            raise ValueError(
                f"No active ModelVersion found for match {match_id}. "
                "Please train and activate a model first."
            )

        # 4. Instantiate + run model ------------------------------------ #
        forecast_result = self._run_model(mv, match_context)

        # 4b. v5: also run the Over/Under 2.5 model and stuff its
        # output into match_context so it lands in features_snapshot
        # and is available to the strategy engine.
        try:
            from app.forecasting.models.over_under_model import predict_over_under_2_5
            ou = predict_over_under_2_5(match_context)
            # Compute market edge if odds are in context — right now
            # they aren't, so edge stays 0 until /odds lookups feed in.
            ou_market_over = float(match_context.get("market_over_odds") or 0)
            ou_market_under = float(match_context.get("market_under_odds") or 0)
            over_implied = 1.0 / ou_market_over if ou_market_over > 1.0 else None
            under_implied = 1.0 / ou_market_under if ou_market_under > 1.0 else None
            ou["over_2_5_edge"] = (
                ou["over_2_5_prob"] - over_implied if over_implied is not None else 0.0
            )
            ou["under_2_5_edge"] = (
                ou["under_2_5_prob"] - under_implied if under_implied is not None else 0.0
            )
            match_context["over_under_2_5"] = ou
        except Exception as exc:
            match_context["over_under_2_5"] = {"error": str(exc)}

        # 5. Persist ---------------------------------------------------- #
        prediction = await self._persist(
            match=match,
            model_version=mv,
            forecast_result=forecast_result,
            match_context=match_context,
            prediction_type=prediction_type,
            db=db,
        )

        return prediction

    # ------------------------------------------------------------------ #
    # Context builder                                                      #
    # ------------------------------------------------------------------ #

    async def build_match_context(self, match: Match, db: AsyncSession) -> dict:
        """Assemble all available context for *match* into a single dict.

        Returns a JSON-serialisable dict with keys:

        * ``match_id``, ``home_team_id``, ``away_team_id``
        * ``home_team_name``, ``away_team_name``
        * ``home_form``, ``away_form``         – last N match dicts
        * ``h2h_matches``                      – last M h2h match dicts
        * ``home_stats``, ``away_stats``       – season aggregates
        * ``home_standing``, ``away_standing`` – latest standings snapshot
        * ``league_avg_goals``                 – float
        * ``total_teams_in_league``            – int
        """
        home_id = match.home_team_id
        away_id = match.away_team_id
        league_id = match.league_id
        season_id = match.season_id
        scheduled_at = match.scheduled_at

        # --- Form: recent completed matches for each team -------------- #
        home_form = await self._get_team_form(
            team_id=home_id,
            before=scheduled_at,
            league_id=league_id,
            n=_FORM_MATCHES,
            db=db,
        )
        away_form = await self._get_team_form(
            team_id=away_id,
            before=scheduled_at,
            league_id=league_id,
            n=_FORM_MATCHES,
            db=db,
        )

        # --- Head-to-head ---------------------------------------------- #
        h2h = await self._get_h2h(
            home_id=home_id,
            away_id=away_id,
            before=scheduled_at,
            n=_H2H_MATCHES,
            db=db,
        )

        # --- Season stats ---------------------------------------------- #
        home_stats = await self._get_team_stats(home_id, season_id, db)
        away_stats = await self._get_team_stats(away_id, season_id, db)

        # --- Standings ------------------------------------------------- #
        home_standing = await self._get_standing(
            team_id=home_id,
            league_id=league_id,
            season_id=season_id,
            before=scheduled_at,
            db=db,
        )
        away_standing = await self._get_standing(
            team_id=away_id,
            league_id=league_id,
            season_id=season_id,
            before=scheduled_at,
            db=db,
        )

        # --- League averages ------------------------------------------- #
        league_avg_goals = await self._get_league_avg_goals(
            league_id=league_id,
            season_id=season_id,
            before=scheduled_at,
            db=db,
        )
        total_teams = await self._get_total_teams(league_id, season_id, db)

        # --- Point-in-time Elo (v5) ------------------------------------ #
        # Read the most recent rating for each team whose ``effective_at``
        # is strictly before kickoff. Also run the anti-leakage tripwire
        # — if somehow a rating with effective_at >= kickoff exists for
        # either team, this raises FeatureLeakageError and the whole
        # prediction path aborts instead of silently producing a leaky
        # forecast.
        elo_svc = EloHistoryService(db)
        await elo_svc.assert_rating_predates_kickoff(
            home_id, scheduled_at, label="home"
        )
        await elo_svc.assert_rating_predates_kickoff(
            away_id, scheduled_at, label="away"
        )
        home_elo_snap = await elo_svc.get_rating_at(home_id, scheduled_at)
        away_elo_snap = await elo_svc.get_rating_at(away_id, scheduled_at)

        return {
            "match_id": str(match.id),
            "home_team_id": str(home_id),
            "away_team_id": str(away_id),
            "home_team_name": match.home_team.name if match.home_team else str(home_id),
            "away_team_name": match.away_team.name if match.away_team else str(away_id),
            "league_id": str(league_id),
            "season_id": str(season_id) if season_id else None,
            "scheduled_at": scheduled_at.isoformat() if scheduled_at else None,
            "home_form": home_form,
            "away_form": away_form,
            "h2h_matches": h2h,
            "home_stats": home_stats,
            "away_stats": away_stats,
            "home_standing": home_standing,
            "away_standing": away_standing,
            "league_avg_goals": league_avg_goals,
            "total_teams_in_league": total_teams,
            # v5: point-in-time Elo ratings read from team_elo_history.
            # The model side reads these keys — see app/forecasting/models/
            # elo_model.py::predict.
            "home_elo_at_kickoff": home_elo_snap.rating,
            "away_elo_at_kickoff": away_elo_snap.rating,
            "home_elo_source": home_elo_snap.source,
            "away_elo_source": away_elo_snap.source,
            "home_elo_effective_at": home_elo_snap.effective_at.isoformat(),
            "away_elo_effective_at": away_elo_snap.effective_at.isoformat(),
        }

    # ------------------------------------------------------------------ #
    # Explanation builder                                                  #
    # ------------------------------------------------------------------ #

    def generate_explanation(
        self,
        forecast_result: ForecastResult,
        match_context: dict,
    ) -> dict:
        """Build the data dict for a ``PredictionExplanation`` row.

        Returns a dict with keys:
        * ``summary``           – natural-language summary string
        * ``top_factors_for``   – dict of factors favouring the predicted winner
        * ``top_factors_against`` – dict of factors working against them
        * ``feature_importances`` – full explanation_factors from the model
        """
        home_name = match_context.get("home_team_name", "Home")
        away_name = match_context.get("away_team_name", "Away")

        hp = forecast_result.home_win_prob
        dp = forecast_result.draw_prob
        ap = forecast_result.away_win_prob

        # Determine the most probable outcome
        outcomes = {"home": hp, "draw": dp, "away": ap}
        predicted_outcome = max(outcomes, key=lambda k: outcomes[k])
        outcome_prob = outcomes[predicted_outcome]

        # Natural language summary
        if predicted_outcome == "home":
            summary = (
                f"{home_name} are predicted to WIN with {hp:.1%} probability "
                f"(draw: {dp:.1%}, {away_name} win: {ap:.1%}). "
            )
        elif predicted_outcome == "away":
            summary = (
                f"{away_name} are predicted to WIN with {ap:.1%} probability "
                f"(draw: {dp:.1%}, {home_name} win: {hp:.1%}). "
            )
        else:
            summary = (
                f"A DRAW is the most likely result ({dp:.1%}), "
                f"ahead of {home_name} win ({hp:.1%}) and "
                f"{away_name} win ({ap:.1%}). "
            )

        # Append score prediction if available
        if (
            forecast_result.predicted_home_score is not None
            and forecast_result.predicted_away_score is not None
        ):
            summary += (
                f"Predicted score: {home_name} "
                f"{forecast_result.predicted_home_score:.1f} – "
                f"{forecast_result.predicted_away_score:.1f} {away_name}. "
            )

        # Confidence qualifier
        conf = forecast_result.confidence
        if conf >= 0.7:
            summary += "The model has HIGH confidence in this prediction."
        elif conf >= 0.4:
            summary += "The model has MODERATE confidence in this prediction."
        else:
            summary += "The model has LOW confidence — the match is highly uncertain."

        # Extract top factors from explanation_factors
        ef = forecast_result.explanation_factors or {}

        # Build factors_for (things favouring the predicted outcome)
        top_factors_for: dict = {}
        top_factors_against: dict = {}

        if predicted_outcome == "home":
            # Factors favouring home team
            if "home_elo" in ef and "away_elo" in ef:
                top_factors_for["home_elo"] = ef["home_elo"]
                top_factors_for["elo_difference"] = ef.get("elo_difference")
            if "home_attack_strength" in ef:
                top_factors_for["home_attack_strength"] = ef["home_attack_strength"]
            if "lambda_home" in ef:
                top_factors_for["expected_home_goals"] = ef["lambda_home"]
            if "features" in ef:
                feats = ef["features"]
                top_factors_for["home_form_pts"] = feats.get("home_form_pts")
                top_factors_for["home_win_rate"] = feats.get("home_win_rate")
                top_factors_against["away_form_pts"] = feats.get("away_form_pts")
                top_factors_against["away_attack_strength"] = ef.get("away_attack_strength")
        elif predicted_outcome == "away":
            if "away_elo" in ef:
                top_factors_for["away_elo"] = ef["away_elo"]
            if "away_attack_strength" in ef:
                top_factors_for["away_attack_strength"] = ef["away_attack_strength"]
            if "lambda_away" in ef:
                top_factors_for["expected_away_goals"] = ef["lambda_away"]
            if "features" in ef:
                feats = ef["features"]
                top_factors_for["away_form_pts"] = feats.get("away_form_pts")
                top_factors_for["away_win_rate"] = feats.get("away_win_rate")
                top_factors_against["home_form_pts"] = feats.get("home_form_pts")
        else:
            # Draw factors
            if "elo_difference" in ef:
                top_factors_for["small_elo_difference"] = abs(
                    float(ef.get("elo_difference", 0) or 0)
                )
            if "draw_factor" in ef.get("raw_output", {}):
                top_factors_for["draw_factor"] = ef.get("raw_output", {}).get("draw_factor")

        # Filter out None values
        top_factors_for = {k: v for k, v in top_factors_for.items() if v is not None}
        top_factors_against = {k: v for k, v in top_factors_against.items() if v is not None}

        return {
            "summary": summary,
            "top_factors_for": top_factors_for,
            "top_factors_against": top_factors_against,
            "feature_importances": ef,
        }

    # ------------------------------------------------------------------ #
    # Model instantiation / execution                                     #
    # ------------------------------------------------------------------ #

    def _run_model(self, mv: ModelVersion, match_context: dict) -> ForecastResult:
        """Instantiate a model from *mv* and run predict()."""
        model_type = mv.model_type.lower()
        config = mv.hyperparameters or {}

        if model_type not in MODEL_REGISTRY:
            raise ValueError(
                f"Unknown model_type '{model_type}'. "
                f"Available: {list(MODEL_REGISTRY.keys())}"
            )

        ModelClass = MODEL_REGISTRY[model_type]

        if model_type == "ensemble":
            # For ensemble, build default sub-models if none are pre-loaded
            model = self._build_default_ensemble(mv.id, config)
        else:
            model = ModelClass(model_version_id=mv.id, config=config)

        # If the model has persisted state (e.g. Elo ratings or sklearn
        # coefficients), it would be loaded here from a model artifact store.
        # For now we run stateless inference using fallback defaults.

        return model.predict(match_context)

    @staticmethod
    def _build_default_ensemble(
        model_version_id: uuid.UUID, config: dict
    ) -> EnsembleModel:
        """Build an ensemble with one instance of each base model type."""
        from app.forecasting.models.elo_model import EloModel
        from app.forecasting.models.poisson_model import PoissonModel
        from app.forecasting.models.logistic_model import LogisticModel

        sub_config = config.get("sub_model_config", {})
        weights = config.get("weights", {"elo": 1.0, "poisson": 1.5, "logistic": 1.0})

        sub_models = [
            (EloModel(model_version_id, sub_config.get("elo", {})), weights.get("elo", 1.0)),
            (PoissonModel(model_version_id, sub_config.get("poisson", {})), weights.get("poisson", 1.5)),
            (LogisticModel(model_version_id, sub_config.get("logistic", {})), weights.get("logistic", 1.0)),
        ]
        return EnsembleModel(
            model_version_id=model_version_id,
            config=config,
            sub_models=sub_models,
        )

    # ------------------------------------------------------------------ #
    # Persistence                                                          #
    # ------------------------------------------------------------------ #

    async def _persist(
        self,
        match: Match,
        model_version: ModelVersion,
        forecast_result: ForecastResult,
        match_context: dict,
        prediction_type: str,
        db: AsyncSession,
    ) -> Prediction:
        """Create Prediction + PredictionExplanation rows and flush to db."""
        now = datetime.now(timezone.utc)

        prediction = Prediction(
            id=uuid.uuid4(),
            match_id=match.id,
            model_version_id=model_version.id,
            predicted_at=now,
            prediction_type=prediction_type,
            home_win_prob=forecast_result.home_win_prob,
            draw_prob=forecast_result.draw_prob,
            away_win_prob=forecast_result.away_win_prob,
            predicted_home_score=forecast_result.predicted_home_score,
            predicted_away_score=forecast_result.predicted_away_score,
            confidence=forecast_result.confidence,
            confidence_interval_low=(
                forecast_result.confidence_interval[0]
                if forecast_result.confidence_interval
                else None
            ),
            confidence_interval_high=(
                forecast_result.confidence_interval[1]
                if forecast_result.confidence_interval
                else None
            ),
            features_snapshot=match_context,
            raw_output=forecast_result.raw_output,
            is_simulation=True,
        )
        db.add(prediction)
        await db.flush()  # get prediction.id without committing

        # Build and persist explanation
        explanation_data = self.generate_explanation(forecast_result, match_context)
        explanation = PredictionExplanation(
            id=uuid.uuid4(),
            prediction_id=prediction.id,
            summary=explanation_data["summary"],
            top_factors_for=explanation_data["top_factors_for"],
            top_factors_against=explanation_data["top_factors_against"],
            feature_importances=explanation_data.get("feature_importances"),
            similar_historical=None,
        )
        db.add(explanation)
        await db.flush()

        return prediction

    # ------------------------------------------------------------------ #
    # Database helpers                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _load_match(match_id: uuid.UUID, db: AsyncSession) -> Optional[Match]:
        from sqlalchemy.orm import selectinload
        from app.models.league import League

        result = await db.execute(
            select(Match)
            .options(
                selectinload(Match.league).selectinload(League.sport),
                selectinload(Match.home_team),
                selectinload(Match.away_team),
            )
            .where(Match.id == match_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def _resolve_model_version(
        match: Match,
        db: AsyncSession,
        model_version_id: Optional[uuid.UUID],
    ) -> Optional[ModelVersion]:
        if model_version_id is not None:
            result = await db.execute(
                select(ModelVersion).where(ModelVersion.id == model_version_id)
            )
            return result.scalar_one_or_none()

        # Find most recent active model for this sport or "all"
        sport_scope = (
            match.league.sport.slug
            if match.league and hasattr(match.league, "sport") and match.league.sport
            else "all"
        )
        result = await db.execute(
            select(ModelVersion)
            .where(
                and_(
                    ModelVersion.is_active.is_(True),
                    ModelVersion.sport_scope.in_([sport_scope, "all"]),
                )
            )
            .order_by(desc(ModelVersion.trained_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def _get_team_form(
        team_id: uuid.UUID,
        before: datetime,
        league_id: uuid.UUID,
        n: int,
        db: AsyncSession,
    ) -> list[dict]:
        """Fetch the last *n* completed matches for *team_id* before *before*."""
        from app.models.match import MatchStatus

        stmt = (
            select(Match, MatchResult)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .where(
                and_(
                    Match.league_id == league_id,
                    Match.status == MatchStatus.FINISHED,
                    Match.scheduled_at < before,
                    (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
                )
            )
            .order_by(desc(Match.scheduled_at))
            .limit(n)
        )
        rows = (await db.execute(stmt)).all()
        return [
            {
                "match_id": str(m.id),
                "home_team_id": str(m.home_team_id),
                "away_team_id": str(m.away_team_id),
                "home_score": r.home_score,
                "away_score": r.away_score,
                "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
            }
            for m, r in rows
        ]

    @staticmethod
    async def _get_h2h(
        home_id: uuid.UUID,
        away_id: uuid.UUID,
        before: datetime,
        n: int,
        db: AsyncSession,
    ) -> list[dict]:
        """Fetch the last *n* head-to-head matches between the two teams."""
        from app.models.match import MatchStatus

        stmt = (
            select(Match, MatchResult)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .where(
                and_(
                    Match.status == MatchStatus.FINISHED,
                    Match.scheduled_at < before,
                    (
                        (Match.home_team_id == home_id) & (Match.away_team_id == away_id)
                        | (Match.home_team_id == away_id) & (Match.away_team_id == home_id)
                    ),
                )
            )
            .order_by(desc(Match.scheduled_at))
            .limit(n)
        )
        rows = (await db.execute(stmt)).all()
        return [
            {
                "match_id": str(m.id),
                "home_team_id": str(m.home_team_id),
                "away_team_id": str(m.away_team_id),
                "home_score": r.home_score,
                "away_score": r.away_score,
                "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
            }
            for m, r in rows
        ]

    @staticmethod
    async def _get_team_stats(
        team_id: uuid.UUID,
        season_id: Optional[uuid.UUID],
        db: AsyncSession,
    ) -> Optional[dict]:
        """Fetch season-level stats for *team_id*."""
        if season_id is None:
            return None

        stmt = select(TeamStats).where(
            and_(
                TeamStats.team_id == team_id,
                TeamStats.season_id == season_id,
            )
        )
        result = (await db.execute(stmt)).scalar_one_or_none()
        if result is None:
            return None
        return {
            "matches_played": result.matches_played,
            "wins": result.wins,
            "draws": result.draws,
            "losses": result.losses,
            "goals_scored": result.goals_scored,
            "goals_conceded": result.goals_conceded,
            "home_wins": result.home_wins,
            "away_wins": result.away_wins,
            "avg_goals_scored": result.avg_goals_scored,
            "avg_goals_conceded": result.avg_goals_conceded,
        }

    @staticmethod
    async def _get_standing(
        team_id: uuid.UUID,
        league_id: uuid.UUID,
        season_id: Optional[uuid.UUID],
        before: datetime,
        db: AsyncSession,
    ) -> Optional[dict]:
        """Fetch the most recent standings snapshot before *before*."""
        if season_id is None:
            return None

        stmt = (
            select(StandingsSnapshot)
            .where(
                and_(
                    StandingsSnapshot.team_id == team_id,
                    StandingsSnapshot.league_id == league_id,
                    StandingsSnapshot.season_id == season_id,
                    StandingsSnapshot.snapshot_date < before.date(),
                )
            )
            .order_by(desc(StandingsSnapshot.snapshot_date))
            .limit(1)
        )
        result = (await db.execute(stmt)).scalar_one_or_none()
        if result is None:
            return None
        return {
            "position": result.position,
            "played": result.played,
            "won": result.won,
            "drawn": result.drawn,
            "lost": result.lost,
            "goals_for": result.goals_for,
            "goals_against": result.goals_against,
            "goal_difference": result.goal_difference,
            "points": result.points,
        }

    @staticmethod
    async def _get_league_avg_goals(
        league_id: uuid.UUID,
        season_id: Optional[uuid.UUID],
        before: datetime,
        db: AsyncSession,
    ) -> float:
        """Compute average goals per game across all finished matches in the league."""
        from app.models.match import MatchStatus
        from sqlalchemy import func

        stmt = (
            select(
                func.avg(MatchResult.home_score + MatchResult.away_score).label("avg_goals")
            )
            .join(Match, Match.id == MatchResult.match_id)
            .where(
                and_(
                    Match.league_id == league_id,
                    Match.status == MatchStatus.FINISHED,
                    Match.scheduled_at < before,
                    *(
                        [Match.season_id == season_id]
                        if season_id is not None
                        else []
                    ),
                )
            )
        )
        result = await db.execute(stmt)
        avg = result.scalar()
        return float(avg) if avg is not None else _DEFAULT_LEAGUE_AVG

    @staticmethod
    async def _get_total_teams(
        league_id: uuid.UUID,
        season_id: Optional[uuid.UUID],
        db: AsyncSession,
    ) -> int:
        """Return the number of distinct teams that have played in this season."""
        from app.models.match import MatchStatus
        from sqlalchemy import func, union

        home_q = (
            select(Match.home_team_id.label("team_id"))
            .where(
                and_(
                    Match.league_id == league_id,
                    *(
                        [Match.season_id == season_id]
                        if season_id is not None
                        else []
                    ),
                )
            )
        )
        away_q = (
            select(Match.away_team_id.label("team_id"))
            .where(
                and_(
                    Match.league_id == league_id,
                    *(
                        [Match.season_id == season_id]
                        if season_id is not None
                        else []
                    ),
                )
            )
        )
        combined = union(home_q, away_q).subquery()
        count_q = select(func.count()).select_from(combined)
        result = await db.execute(count_q)
        count = result.scalar()
        return int(count) if count else 20
