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

        # --- Recent-form match statistics averages (v5.2) -------------- #
        # For each team, average shots_on_target / possession / corners
        # over the same form window used above. All point-in-time.
        form_stats = {
            "home": await self._avg_form_match_stats(home_form, home_id, db),
            "away": await self._avg_form_match_stats(away_form, away_id, db),
        }

        # --- v3 derived features from existing data -------------------- #
        # All computed from form matches already loaded above. Zero API calls.
        def _clean_sheet_pct(form_matches, team_id):
            """% of form matches where team conceded 0 goals."""
            if not form_matches:
                return 0.0
            clean = 0
            for fm in form_matches:
                if not fm.result:
                    continue
                if str(fm.home_team_id) == str(team_id):
                    if fm.result.away_score == 0:
                        clean += 1
                else:
                    if fm.result.home_score == 0:
                        clean += 1
            return clean / len(form_matches) if form_matches else 0.0

        def _scoring_consistency(form_matches, team_id):
            """Std dev of goals scored — low = consistent, high = volatile."""
            goals = []
            for fm in form_matches:
                if not fm.result:
                    continue
                if str(fm.home_team_id) == str(team_id):
                    goals.append(fm.result.home_score)
                else:
                    goals.append(fm.result.away_score)
            if len(goals) < 2:
                return 0.0
            avg = sum(goals) / len(goals)
            variance = sum((g - avg) ** 2 for g in goals) / len(goals)
            return variance ** 0.5

        def _ht_goals_avg(form_matches, team_id):
            """Avg goals scored in the first half."""
            ht_goals = []
            for fm in form_matches:
                if not fm.result:
                    continue
                if str(fm.home_team_id) == str(team_id):
                    if fm.result.home_score_ht is not None:
                        ht_goals.append(fm.result.home_score_ht)
                else:
                    if fm.result.away_score_ht is not None:
                        ht_goals.append(fm.result.away_score_ht)
            return sum(ht_goals) / len(ht_goals) if ht_goals else 0.0

        def _ppg_last5(form_matches, team_id):
            """Points per game over last 5 form matches."""
            pts = 0
            counted = 0
            for fm in form_matches[:5]:
                if not fm.result:
                    continue
                counted += 1
                is_home = str(fm.home_team_id) == str(team_id)
                hs, as_ = fm.result.home_score, fm.result.away_score
                if is_home:
                    pts += 3 if hs > as_ else (1 if hs == as_ else 0)
                else:
                    pts += 3 if as_ > hs else (1 if hs == as_ else 0)
            return pts / counted if counted > 0 else 0.0

        home_clean_sheets_pct = _clean_sheet_pct(home_form, home_id)
        away_clean_sheets_pct = _clean_sheet_pct(away_form, away_id)
        home_scoring_consistency = _scoring_consistency(home_form, home_id)
        away_scoring_consistency = _scoring_consistency(away_form, away_id)
        home_goals_first_half = _ht_goals_avg(home_form, home_id)
        away_goals_first_half = _ht_goals_avg(away_form, away_id)
        home_ppg_last5 = _ppg_last5(home_form, home_id)
        away_ppg_last5 = _ppg_last5(away_form, away_id)

        # League position difference (home advantage in position)
        h_pos = home_standing.get("position", 10) if home_standing else 10
        a_pos = away_standing.get("position", 10) if away_standing else 10
        league_position_diff = a_pos - h_pos  # positive = home higher in table

        # Match importance: later in season = more important
        matchday_val = match.matchday or 19  # default mid-season
        total_matchdays = 34 if total_teams and total_teams >= 18 else 38
        match_importance = matchday_val / total_matchdays

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
            # v5: point-in-time Elo ratings
            "home_elo_at_kickoff": home_elo_snap.rating,
            "away_elo_at_kickoff": away_elo_snap.rating,
            "home_elo_source": home_elo_snap.source,
            "away_elo_source": away_elo_snap.source,
            "home_elo_effective_at": home_elo_snap.effective_at.isoformat(),
            "away_elo_effective_at": away_elo_snap.effective_at.isoformat(),
            # v5.2: per-side match statistics averages
            "form_stats": form_stats,
            # v3: derived features from form data (zero extra API calls)
            "home_clean_sheets_pct": home_clean_sheets_pct,
            "away_clean_sheets_pct": away_clean_sheets_pct,
            "home_scoring_consistency": home_scoring_consistency,
            "away_scoring_consistency": away_scoring_consistency,
            "home_goals_first_half": home_goals_first_half,
            "away_goals_first_half": away_goals_first_half,
            "home_ppg_last5": home_ppg_last5,
            "away_ppg_last5": away_ppg_last5,
            "league_position_diff": league_position_diff,
            "match_importance": match_importance,
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

    # Process-level cache for the trained Logistic model. Training is
    # expensive (scikit-learn fit over ~5000 samples + calibration) so
    # we cache the fitted instance per Python process. Re-populated via
    # ``POST /api/admin/v5/train-logistic`` on demand.
    _cached_logistic: "Optional[LogisticModel]" = None
    _cached_xgboost = None  # v3: XGBoost model cache slot

    @classmethod
    def set_cached_logistic(cls, model) -> None:
        cls._cached_logistic = model

    @classmethod
    def get_cached_logistic(cls):
        return cls._cached_logistic

    @classmethod
    def set_cached_xgboost(cls, model) -> None:
        """Cache a trained XGBoost model for the ensemble."""
        cls._cached_xgboost = model

    @classmethod
    def get_cached_xgboost(cls):
        return cls._cached_xgboost

    @classmethod
    def _build_default_ensemble(
        cls, model_version_id: uuid.UUID, config: dict
    ) -> EnsembleModel:
        """Build an ensemble with one instance of each base model type.

        If a trained LogisticModel has been cached via
        ``set_cached_logistic``, reuse it so it produces real
        (non-uniform) probabilities. Otherwise a fresh uniform-prior
        LogisticModel is instantiated.
        """
        from app.forecasting.models.elo_model import EloModel
        from app.forecasting.models.poisson_model import PoissonModel
        from app.forecasting.models.logistic_model import LogisticModel

        sub_config = config.get("sub_model_config", {})
        # v3: updated default weights — XGBoost gets the heaviest weight
        # when it's trained, otherwise falls back to the v2 3-model ensemble.
        weights = config.get("weights", {
            "elo": 0.8,
            "poisson": 1.2,
            "logistic": 0.8,
            "xgboost": 1.5,
        })

        logistic_model = cls._cached_logistic
        if logistic_model is None:
            logistic_model = LogisticModel(
                model_version_id, sub_config.get("logistic", {})
            )

        sub_models = [
            (EloModel(model_version_id, sub_config.get("elo", {})), weights.get("elo", 0.8)),
            (PoissonModel(model_version_id, sub_config.get("poisson", {})), weights.get("poisson", 1.2)),
            (logistic_model, weights.get("logistic", 0.8)),
        ]

        # v3: add XGBoost as 4th model if trained and cached
        xgb_model = cls._cached_xgboost if hasattr(cls, "_cached_xgboost") else None
        if xgb_model is not None:
            sub_models.append((xgb_model, weights.get("xgboost", 1.5)))
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
    async def _avg_form_match_stats(
        form: list[dict],
        team_id: uuid.UUID,
        db: AsyncSession,
    ) -> dict:
        """Average shots_on_target / possession / corners across the
        matches in *form*, from the team's perspective.

        ``form`` is the list returned by ``_get_team_form`` — dicts
        with ``match_id``, ``home_team_id``, ``away_team_id``. For
        each match_id we look up the ``match_statistics`` row and
        pick the side that matches *team_id*.

        Returns a dict with keys ``shots_on_target``,
        ``possession_pct``, ``corners``. Missing values default to
        None so the caller can fall through to LogisticModel's
        internal defaults.
        """
        from app.models.match_statistics import MatchStatistics

        if not form:
            return {}
        match_ids = [m["match_id"] for m in form if m.get("match_id")]
        if not match_ids:
            return {}
        team_id_str = str(team_id)

        # Convert to proper UUID list for the IN clause
        try:
            uuid_list = [uuid.UUID(m) for m in match_ids]
        except Exception:
            return {}

        stmt = select(MatchStatistics).where(
            MatchStatistics.match_id.in_(uuid_list)
        )
        stats_rows = list((await db.execute(stmt)).scalars().all())
        if not stats_rows:
            return {}

        # Index by match_id for fast lookup
        by_match = {str(row.match_id): row for row in stats_rows}

        sot_vals: list[float] = []
        pos_vals: list[float] = []
        cor_vals: list[float] = []
        for m in form:
            mid = m.get("match_id")
            if not mid or mid not in by_match:
                continue
            stats = by_match[mid]
            is_home = str(m.get("home_team_id", "")) == team_id_str
            if is_home:
                sot = stats.home_shots_on_target
                pos = stats.home_possession_pct
                cor = stats.home_corners
            else:
                sot = stats.away_shots_on_target
                pos = stats.away_possession_pct
                cor = stats.away_corners
            if sot is not None:
                sot_vals.append(float(sot))
            if pos is not None:
                pos_vals.append(float(pos))
            if cor is not None:
                cor_vals.append(float(cor))

        def _mean(xs: list[float]) -> float | None:
            return sum(xs) / len(xs) if xs else None

        return {
            "shots_on_target": _mean(sot_vals),
            "possession_pct": _mean(pos_vals),
            "corners": _mean(cor_vals),
        }

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
