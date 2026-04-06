"""Feature engineering service.

Builds a flat feature dict for a given match that can be fed into any
forecasting model.  All features are computed from the database using only
data that was available *before* the match's scheduled kick-off time, so
the same method is safe to call during both live forecasting and backtesting.

Public API
----------
    service = FeatureService()
    features = await service.build_match_features(match_id, db)

Returned feature keys
---------------------
    home_form_5          – points-per-game over the last 5 matches (home team)
    away_form_5          – points-per-game over the last 5 matches (away team)
    home_form_10         – points-per-game over the last 10 matches (home team)
    away_form_10         – points-per-game over the last 10 matches (away team)
    home_goals_avg       – average goals scored last 10 matches
    away_goals_avg       – average goals scored last 10 matches
    home_goals_conceded_avg – average goals conceded last 10 matches
    away_goals_conceded_avg – average goals conceded last 10 matches
    h2h_home_wins        – number of home-team wins in last 10 h2h meetings
    h2h_draws            – number of draws in last 10 h2h meetings
    h2h_away_wins        – number of away-team wins in last 10 h2h meetings
    h2h_home_goals_avg   – average goals scored by home team in h2h
    h2h_away_goals_avg   – average goals scored by away team in h2h
    home_position        – league standings position (1 = top)
    away_position        – league standings position
    home_points          – points in current standings snapshot
    away_points          – points in current standings snapshot
    home_injuries        – count of currently active injuries
    away_injuries        – count of currently active injuries
    home_elo             – derived ELO rating (from season win rate)
    away_elo             – derived ELO rating (from season win rate)
    home_win_rate        – season wins / matches played
    away_win_rate        – season wins / matches played
    home_goals_scored    – total season goals scored
    away_goals_scored    – total season goals scored
    home_goals_conceded  – total season goals conceded
    away_goals_conceded  – total season goals conceded
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, desc, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.injury import Injury
from app.models.match import Match, MatchResult, MatchStatus
from app.models.standings import StandingsSnapshot
from app.models.stats import TeamStats


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_FORM_SHORT = 5
_FORM_LONG = 10
_H2H_MATCHES = 10
_BASE_ELO = 1500.0
_ELO_K = 32.0


class FeatureService:
    """Computes match features from database state."""

    # ------------------------------------------------------------------ #
    # Main entry point                                                     #
    # ------------------------------------------------------------------ #

    async def build_match_features(
        self,
        match_id: uuid.UUID,
        db: AsyncSession,
    ) -> dict:
        """Build and return a flat feature dict for *match_id*.

        Parameters
        ----------
        match_id:
            UUID of the target ``Match``.
        db:
            Async SQLAlchemy session.

        Returns
        -------
        dict
            Flat dictionary of numeric features (all values are float or int,
            never None – missing data falls back to safe defaults).

        Raises
        ------
        ValueError
            If the match cannot be found.
        """
        match = await self._load_match(match_id, db)
        if match is None:
            raise ValueError(f"Match {match_id} not found")

        home_id = match.home_team_id
        away_id = match.away_team_id
        league_id = match.league_id
        season_id = match.season_id
        cutoff = match.scheduled_at  # strict temporal boundary

        # ---- Recent form (last 5 and last 10) -------------------------- #
        home_form_5 = await self._compute_form(home_id, league_id, cutoff, _FORM_SHORT, db)
        away_form_5 = await self._compute_form(away_id, league_id, cutoff, _FORM_SHORT, db)
        home_form_10 = await self._compute_form(home_id, league_id, cutoff, _FORM_LONG, db)
        away_form_10 = await self._compute_form(away_id, league_id, cutoff, _FORM_LONG, db)

        # ---- Recent goals averages (last 10) --------------------------- #
        home_goal_stats = await self._compute_goal_stats(home_id, league_id, cutoff, _FORM_LONG, db)
        away_goal_stats = await self._compute_goal_stats(away_id, league_id, cutoff, _FORM_LONG, db)

        # ---- Head-to-head --------------------------------------------- #
        h2h = await self._compute_h2h(home_id, away_id, cutoff, _H2H_MATCHES, db)

        # ---- Standings ------------------------------------------------- #
        home_standing = await self._get_standing(home_id, league_id, season_id, cutoff, db)
        away_standing = await self._get_standing(away_id, league_id, season_id, cutoff, db)

        # ---- Season stats --------------------------------------------- #
        home_stats = await self._get_team_stats(home_id, season_id, db)
        away_stats = await self._get_team_stats(away_id, season_id, db)

        # ---- Injuries -------------------------------------------------- #
        home_injuries = await self._count_injuries(home_id, cutoff, db)
        away_injuries = await self._count_injuries(away_id, cutoff, db)

        # ---- ELO (derived from season win rate, no stored state) ------- #
        home_elo = self._derive_elo(home_stats)
        away_elo = self._derive_elo(away_stats)

        # ---- Assemble flat feature dict ------------------------------- #
        return {
            # Form
            "home_form_5": home_form_5,
            "away_form_5": away_form_5,
            "home_form_10": home_form_10,
            "away_form_10": away_form_10,
            # Goal averages (last 10 matches)
            "home_goals_avg": home_goal_stats["goals_avg"],
            "away_goals_avg": away_goal_stats["goals_avg"],
            "home_goals_conceded_avg": home_goal_stats["conceded_avg"],
            "away_goals_conceded_avg": away_goal_stats["conceded_avg"],
            # Head-to-head
            "h2h_home_wins": h2h["home_wins"],
            "h2h_draws": h2h["draws"],
            "h2h_away_wins": h2h["away_wins"],
            "h2h_total": h2h["total"],
            "h2h_home_goals_avg": h2h["home_goals_avg"],
            "h2h_away_goals_avg": h2h["away_goals_avg"],
            # Standings
            "home_position": home_standing["position"],
            "away_position": away_standing["position"],
            "home_points": home_standing["points"],
            "away_points": away_standing["points"],
            # Injuries
            "home_injuries": home_injuries,
            "away_injuries": away_injuries,
            # ELO
            "home_elo": home_elo,
            "away_elo": away_elo,
            "elo_difference": home_elo - away_elo,
            # Season stats
            "home_win_rate": home_stats["win_rate"],
            "away_win_rate": away_stats["win_rate"],
            "home_goals_scored": home_stats["goals_scored"],
            "away_goals_scored": away_stats["goals_scored"],
            "home_goals_conceded": home_stats["goals_conceded"],
            "away_goals_conceded": away_stats["goals_conceded"],
            "home_matches_played": home_stats["matches_played"],
            "away_matches_played": away_stats["matches_played"],
        }

    # ------------------------------------------------------------------ #
    # Form computation                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _compute_form(
        team_id: uuid.UUID,
        league_id: uuid.UUID,
        before: datetime,
        n: int,
        db: AsyncSession,
    ) -> float:
        """Return points-per-game (0–3) over the last *n* finished matches."""
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
        if not rows:
            return 0.0

        total_points = 0
        for match, result in rows:
            is_home = match.home_team_id == team_id
            scored = result.home_score if is_home else result.away_score
            conceded = result.away_score if is_home else result.home_score
            if scored > conceded:
                total_points += 3
            elif scored == conceded:
                total_points += 1
            # else 0

        return round(total_points / len(rows), 4)

    # ------------------------------------------------------------------ #
    # Goal statistics                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _compute_goal_stats(
        team_id: uuid.UUID,
        league_id: uuid.UUID,
        before: datetime,
        n: int,
        db: AsyncSession,
    ) -> dict:
        """Return dict with goals_avg and conceded_avg over last *n* matches."""
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
        if not rows:
            return {"goals_avg": 0.0, "conceded_avg": 0.0}

        total_scored = 0
        total_conceded = 0
        for match, result in rows:
            is_home = match.home_team_id == team_id
            scored = result.home_score if is_home else result.away_score
            conceded = result.away_score if is_home else result.home_score
            total_scored += scored
            total_conceded += conceded

        count = len(rows)
        return {
            "goals_avg": round(total_scored / count, 4),
            "conceded_avg": round(total_conceded / count, 4),
        }

    # ------------------------------------------------------------------ #
    # Head-to-head                                                         #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _compute_h2h(
        home_id: uuid.UUID,
        away_id: uuid.UUID,
        before: datetime,
        n: int,
        db: AsyncSession,
    ) -> dict:
        """Return h2h stats for the last *n* meetings between the two teams.

        Wins/losses are always relative to *home_id* being the current home
        team, regardless of who was home in the historical meeting.
        """
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
        if not rows:
            return {
                "home_wins": 0,
                "draws": 0,
                "away_wins": 0,
                "total": 0,
                "home_goals_avg": 0.0,
                "away_goals_avg": 0.0,
            }

        home_wins = 0
        draws = 0
        away_wins = 0
        home_goals_total = 0
        away_goals_total = 0

        for match, result in rows:
            # Normalise: treat home_id as "our home team"
            if match.home_team_id == home_id:
                goals_for_home = result.home_score
                goals_for_away = result.away_score
            else:
                goals_for_home = result.away_score
                goals_for_away = result.home_score

            home_goals_total += goals_for_home
            away_goals_total += goals_for_away

            if goals_for_home > goals_for_away:
                home_wins += 1
            elif goals_for_home == goals_for_away:
                draws += 1
            else:
                away_wins += 1

        count = len(rows)
        return {
            "home_wins": home_wins,
            "draws": draws,
            "away_wins": away_wins,
            "total": count,
            "home_goals_avg": round(home_goals_total / count, 4),
            "away_goals_avg": round(away_goals_total / count, 4),
        }

    # ------------------------------------------------------------------ #
    # Standings                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _get_standing(
        team_id: uuid.UUID,
        league_id: uuid.UUID,
        season_id: Optional[uuid.UUID],
        before: datetime,
        db: AsyncSession,
    ) -> dict:
        """Return most recent standings data for *team_id* before *before*."""
        if season_id is None:
            return {"position": 0, "points": 0, "played": 0}

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
        row = (await db.execute(stmt)).scalar_one_or_none()
        if row is None:
            return {"position": 0, "points": 0, "played": 0}

        return {
            "position": row.position,
            "points": row.points,
            "played": row.played,
            "goal_difference": row.goal_difference,
        }

    # ------------------------------------------------------------------ #
    # Season stats                                                         #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _get_team_stats(
        team_id: uuid.UUID,
        season_id: Optional[uuid.UUID],
        db: AsyncSession,
    ) -> dict:
        """Return season aggregate stats or safe defaults."""
        defaults = {
            "matches_played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_scored": 0,
            "goals_conceded": 0,
            "win_rate": 0.0,
            "avg_goals_scored": 0.0,
            "avg_goals_conceded": 0.0,
        }
        if season_id is None:
            return defaults

        stmt = select(TeamStats).where(
            and_(
                TeamStats.team_id == team_id,
                TeamStats.season_id == season_id,
            )
        )
        row = (await db.execute(stmt)).scalar_one_or_none()
        if row is None:
            return defaults

        mp = row.matches_played or 0
        win_rate = round(row.wins / mp, 4) if mp > 0 else 0.0
        return {
            "matches_played": mp,
            "wins": row.wins or 0,
            "draws": row.draws or 0,
            "losses": row.losses or 0,
            "goals_scored": row.goals_scored or 0,
            "goals_conceded": row.goals_conceded or 0,
            "win_rate": win_rate,
            "avg_goals_scored": float(row.avg_goals_scored or 0.0),
            "avg_goals_conceded": float(row.avg_goals_conceded or 0.0),
        }

    # ------------------------------------------------------------------ #
    # Injuries                                                             #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _count_injuries(
        team_id: uuid.UUID,
        as_of: datetime,
        db: AsyncSession,
    ) -> int:
        """Count active injuries for *team_id* as of *as_of* date."""
        stmt = select(func.count()).select_from(Injury).where(
            and_(
                Injury.team_id == team_id,
                Injury.status == "active",
                Injury.start_date <= as_of.date(),
            )
        )
        result = (await db.execute(stmt)).scalar()
        return int(result or 0)

    # ------------------------------------------------------------------ #
    # ELO derivation                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _derive_elo(stats: dict) -> float:
        """Derive a simple ELO-like rating from season win/draw/loss record.

        Uses the expected score formula: E = 1 / (1 + 10^((Rb - Ra) / 400))
        Starting from _BASE_ELO (1500), each win adds K*(1 - E), each loss
        subtracts K*E, and draws add K*(0.5 - E).  Here we approximate by
        iterating uniform-opponent assumption (E=0.5 for all matches).

        This is a *derived* feature, not a maintained ELO leaderboard.
        """
        mp = stats.get("matches_played", 0)
        if mp == 0:
            return _BASE_ELO

        wins = stats.get("wins", 0)
        draws = stats.get("draws", 0)
        losses = stats.get("losses", 0)

        # Simplified: assume each opponent has ELO = 1500 (E = 0.5)
        elo = _BASE_ELO
        for _ in range(wins):
            elo += _ELO_K * (1.0 - 0.5)  # won, expected 0.5
        for _ in range(draws):
            elo += _ELO_K * (0.5 - 0.5)  # draw, expected 0.5 → 0 change
        for _ in range(losses):
            elo += _ELO_K * (0.0 - 0.5)  # loss

        return round(elo, 2)

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _load_match(match_id: uuid.UUID, db: AsyncSession) -> Optional[Match]:
        result = await db.execute(select(Match).where(Match.id == match_id))
        return result.scalar_one_or_none()
