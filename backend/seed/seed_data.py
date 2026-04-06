"""
seed_data.py
============
Standalone script that populates the Sports Intelligence Platform database
with representative development data.

Usage
-----
    python -m seed.seed_data

The script is fully idempotent: it checks for existing rows before inserting
and skips anything already present.  Re-running it is safe.

Data seeded
-----------
- 3 sports: Football, Basketball, Tennis
- 7 leagues (5 football + 1 NBA + 1 ATP tennis)
- ~42 teams with players
- Seasons for every league
- ~40 finished matches with results
- League standings snapshots
- 3 users: admin, analyst, viewer
- 4 model versions: elo, poisson, logistic, ensemble
- Predictions and evaluations for finished matches (track-record data)
"""
from __future__ import annotations

import math
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Make sure the backend root is on sys.path so app.* imports work whether
# this is run as  `python -m seed.seed_data`  or  `python seed/seed_data.py`
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import Base

# Import all models so their tables are known to SQLAlchemy metadata
from app.models.sport import Sport
from app.models.league import League
from app.models.season import Season
from app.models.team import Team
from app.models.player import Player
from app.models.match import Match, MatchResult, MatchStatus
from app.models.standings import StandingsSnapshot
from app.models.prediction import Prediction, PredictionEvaluation, PredictionExplanation
from app.models.model_version import ModelVersion
from app.models.user import User, Role

# ---------------------------------------------------------------------------
# Ingestion adapter data (re-use the static dicts from the sample adapters)
# ---------------------------------------------------------------------------
from app.ingestion.adapters.sample_football import (
    _SPORTS as _FB_SPORTS,
    _LEAGUES as _FB_LEAGUES,
    _TEAMS as _FB_TEAMS,
    _PLAYERS as _FB_PLAYERS,
    _MATCHES as _FB_MATCHES,
    _RESULTS as _FB_RESULTS,
    _STANDINGS_RAW as _FB_STANDINGS_RAW,
)
from app.ingestion.adapters.sample_basketball import (
    _SPORTS as _BB_SPORTS,
    _LEAGUES as _BB_LEAGUES,
    _TEAMS as _BB_TEAMS,
    _PLAYERS as _BB_PLAYERS,
    _MATCHES as _BB_MATCHES,
    _RESULTS as _BB_RESULTS,
    _STANDINGS as _BB_STANDINGS,
)

# ---------------------------------------------------------------------------
# Tennis seed data (not covered by existing adapters)
# ---------------------------------------------------------------------------

_TENNIS_SPORT = {
    "external_id": "sport_tennis",
    "name": "Tennis",
    "slug": "tennis",
    "icon": "🎾",
}

_TENNIS_LEAGUE = {
    "external_id": "league_atp_tour",
    "sport_slug": "tennis",
    "name": "ATP Tour",
    "slug": "atp-tour",
    "country": "International",
    "tier": 1,
}

_TENNIS_TEAMS = [
    # "Teams" in tennis represent individual players as solo entries
    {"external_id": "team_djokovic",   "league_slug": "atp-tour", "name": "Novak Djokovic",    "slug": "novak-djokovic",    "short_name": "Djokovic",  "country": "Serbia",      "venue": None, "logo_url": None},
    {"external_id": "team_alcaraz",    "league_slug": "atp-tour", "name": "Carlos Alcaraz",    "slug": "carlos-alcaraz",    "short_name": "Alcaraz",   "country": "Spain",       "venue": None, "logo_url": None},
    {"external_id": "team_sinner",     "league_slug": "atp-tour", "name": "Jannik Sinner",     "slug": "jannik-sinner",     "short_name": "Sinner",    "country": "Italy",       "venue": None, "logo_url": None},
    {"external_id": "team_zverev",     "league_slug": "atp-tour", "name": "Alexander Zverev",  "slug": "alexander-zverev",  "short_name": "Zverev",    "country": "Germany",     "venue": None, "logo_url": None},
    {"external_id": "team_medvedev",   "league_slug": "atp-tour", "name": "Daniil Medvedev",   "slug": "daniil-medvedev",   "short_name": "Medvedev",  "country": "Russia",      "venue": None, "logo_url": None},
    {"external_id": "team_ruud",       "league_slug": "atp-tour", "name": "Casper Ruud",       "slug": "casper-ruud",       "short_name": "Ruud",      "country": "Norway",      "venue": None, "logo_url": None},
]

_TENNIS_MATCHES_RAW = [
    # (ext_id, home_slug, away_slug, days_from_base, status)
    ("match_atp_001", "novak-djokovic",   "carlos-alcaraz",   5,  "finished"),
    ("match_atp_002", "jannik-sinner",    "daniil-medvedev",  5,  "finished"),
    ("match_atp_003", "alexander-zverev", "casper-ruud",      6,  "finished"),
    ("match_atp_004", "carlos-alcaraz",   "jannik-sinner",    12, "finished"),
    ("match_atp_005", "novak-djokovic",   "alexander-zverev", 19, "finished"),
    ("match_atp_006", "daniil-medvedev",  "casper-ruud",      19, "scheduled"),
    ("match_atp_007", "jannik-sinner",    "novak-djokovic",   26, "scheduled"),
]

_TENNIS_BASE_DATE = datetime(2025, 8, 25, 14, 0, 0, tzinfo=timezone.utc)

_TENNIS_MATCHES = [
    {
        "external_id": r[0],
        "league_slug": "atp-tour",
        "home_team_slug": r[1],
        "away_team_slug": r[2],
        "scheduled_at": (_TENNIS_BASE_DATE + timedelta(days=r[3])).isoformat(),
        "status": r[4],
        "venue": None,
        "round_name": "Round 1",
        "matchday": 1,
        "season_name": "2025-2026",
    }
    for r in _TENNIS_MATCHES_RAW
]

_TENNIS_RESULTS = {
    "match_atp_001": {"external_match_id": "match_atp_001", "home_score": 2, "away_score": 1, "home_score_ht": None, "away_score_ht": None, "winner": "home", "extra_data": {"sets": "6-4, 5-7, 6-3"}},
    "match_atp_002": {"external_match_id": "match_atp_002", "home_score": 2, "away_score": 0, "home_score_ht": None, "away_score_ht": None, "winner": "home", "extra_data": {"sets": "7-6, 6-4"}},
    "match_atp_003": {"external_match_id": "match_atp_003", "home_score": 1, "away_score": 2, "home_score_ht": None, "away_score_ht": None, "winner": "away", "extra_data": {"sets": "4-6, 6-3, 5-7"}},
    "match_atp_004": {"external_match_id": "match_atp_004", "home_score": 2, "away_score": 1, "home_score_ht": None, "away_score_ht": None, "winner": "home", "extra_data": {"sets": "6-3, 4-6, 6-2"}},
    "match_atp_005": {"external_match_id": "match_atp_005", "home_score": 0, "away_score": 2, "home_score_ht": None, "away_score_ht": None, "winner": "away", "extra_data": {"sets": "3-6, 4-6"}},
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_NOW = datetime.now(timezone.utc)


def _slug_to_status(status_str: str) -> MatchStatus:
    return {
        "finished":  MatchStatus.FINISHED,
        "scheduled": MatchStatus.SCHEDULED,
        "live":      MatchStatus.LIVE,
        "postponed": MatchStatus.POSTPONED,
        "cancelled": MatchStatus.CANCELLED,
    }.get(status_str, MatchStatus.SCHEDULED)


def _brier(probs: dict, actual: str) -> float:
    outcomes = ["home", "draw", "away"]
    bs = sum((probs.get(o, 0.0) - (1.0 if o == actual else 0.0)) ** 2 for o in outcomes)
    return round(bs / 3, 6)


def _log_loss_val(probs: dict, actual: str) -> float:
    p = max(probs.get(actual, 0.0), 1e-15)
    return round(-math.log(p), 6)


def _outcome(home: int, away: int) -> str:
    if home > away:
        return "home"
    if home < away:
        return "away"
    return "draw"


# ---------------------------------------------------------------------------
# Session factory (sync)
# ---------------------------------------------------------------------------

def _make_session() -> tuple:
    """Return (engine, Session class) using the sync database URL."""
    settings = get_settings()
    engine = create_engine(settings.database_url_sync, echo=False)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    return engine, SessionLocal


# ===========================================================================
# Seeding functions – each is idempotent
# ===========================================================================

def seed_sports(db: Session) -> dict[str, Sport]:
    """Insert Football, Basketball, Tennis. Return slug -> Sport mapping."""
    sports_data = _FB_SPORTS + _BB_SPORTS + [_TENNIS_SPORT]
    result: dict[str, Sport] = {}
    for sd in sports_data:
        existing = db.execute(select(Sport).where(Sport.slug == sd["slug"])).scalar_one_or_none()
        if existing:
            result[sd["slug"]] = existing
            continue
        sport = Sport(
            id=uuid.uuid4(),
            name=sd["name"],
            slug=sd["slug"],
            icon=sd.get("icon"),
            is_active=True,
        )
        db.add(sport)
        db.flush()
        result[sd["slug"]] = sport
        print(f"  [sport] created: {sport.name}")
    return result


def seed_leagues(db: Session, sports: dict[str, Sport]) -> dict[str, League]:
    """Insert leagues for all sports. Return slug -> League mapping."""
    leagues_data = _FB_LEAGUES + _BB_LEAGUES + [_TENNIS_LEAGUE]
    result: dict[str, League] = {}
    for ld in leagues_data:
        existing = db.execute(select(League).where(League.slug == ld["slug"])).scalar_one_or_none()
        if existing:
            result[ld["slug"]] = existing
            continue
        sport = sports.get(ld["sport_slug"])
        if sport is None:
            print(f"  [league] SKIP {ld['slug']}: sport {ld['sport_slug']} not found")
            continue
        league = League(
            id=uuid.uuid4(),
            sport_id=sport.id,
            name=ld["name"],
            slug=ld["slug"],
            country=ld.get("country"),
            tier=ld.get("tier"),
            is_active=True,
        )
        db.add(league)
        db.flush()
        result[ld["slug"]] = league
        print(f"  [league] created: {league.name}")
    return result


def seed_seasons(db: Session, leagues: dict[str, League]) -> dict[tuple, Season]:
    """Create one current season per league. Return (league_slug, season_name) -> Season."""
    result: dict[tuple, Season] = {}
    for league_slug, league in leagues.items():
        season_name = "2025-2026"
        existing = db.execute(
            select(Season).where(Season.league_id == league.id, Season.name == season_name)
        ).scalar_one_or_none()
        if existing:
            result[(league_slug, season_name)] = existing
            continue
        season = Season(
            id=uuid.uuid4(),
            league_id=league.id,
            name=season_name,
            start_date=date(2025, 8, 1),
            end_date=date(2026, 6, 30),
            is_current=True,
        )
        db.add(season)
        db.flush()
        result[(league_slug, season_name)] = season
        print(f"  [season] created: {league.name} {season_name}")
    return result


def seed_teams(db: Session, leagues: dict[str, League]) -> dict[str, Team]:
    """Insert teams for all leagues. Return slug -> Team."""
    all_teams_data: list[dict] = []
    for teams_list in _FB_TEAMS.values():
        all_teams_data.extend(teams_list)
    for teams_list in _BB_TEAMS.values():
        all_teams_data.extend(teams_list)
    all_teams_data.extend(_TENNIS_TEAMS)

    result: dict[str, Team] = {}
    for td in all_teams_data:
        existing = db.execute(select(Team).where(Team.slug == td["slug"])).scalar_one_or_none()
        if existing:
            result[td["slug"]] = existing
            continue
        league = leagues.get(td["league_slug"])
        if league is None:
            continue
        team = Team(
            id=uuid.uuid4(),
            league_id=league.id,
            name=td["name"],
            slug=td["slug"],
            short_name=td.get("short_name"),
            logo_url=td.get("logo_url"),
            country=td.get("country"),
            venue=td.get("venue"),
            is_active=True,
        )
        db.add(team)
        db.flush()
        result[td["slug"]] = team
    db.flush()
    print(f"  [teams] ensured {len(result)} teams")
    return result


def seed_players(db: Session, teams: dict[str, Team]) -> None:
    """Insert players for teams that have player data."""
    all_players_data: list[dict] = []
    for players_list in _FB_PLAYERS.values():
        all_players_data.extend(players_list)
    for players_list in _BB_PLAYERS.values():
        all_players_data.extend(players_list)

    count = 0
    for pd in all_players_data:
        existing = db.execute(select(Player).where(Player.slug == pd["slug"])).scalar_one_or_none()
        if existing:
            continue
        team = teams.get(pd["team_slug"])
        if team is None:
            continue
        dob = None
        if pd.get("date_of_birth"):
            dob = date.fromisoformat(pd["date_of_birth"])
        player = Player(
            id=uuid.uuid4(),
            team_id=team.id,
            name=pd["name"],
            slug=pd["slug"],
            position=pd.get("position"),
            nationality=pd.get("nationality"),
            date_of_birth=dob,
            jersey_number=pd.get("jersey_number"),
            photo_url=pd.get("photo_url"),
        )
        db.add(player)
        count += 1
    db.flush()
    print(f"  [players] created {count} new players")


def seed_matches(
    db: Session,
    leagues: dict[str, League],
    teams: dict[str, Team],
    seasons: dict[tuple, Season],
) -> dict[str, Match]:
    """Insert matches and their results. Return external_id -> Match."""
    all_matches_data = _FB_MATCHES + _BB_MATCHES + _TENNIS_MATCHES
    all_results_data = {**_FB_RESULTS, **_BB_RESULTS, **_TENNIS_RESULTS}

    result: dict[str, Match] = {}
    created = 0
    for md in all_matches_data:
        existing = db.execute(
            select(Match).where(Match.external_id == md["external_id"])
        ).scalar_one_or_none()
        if existing:
            result[md["external_id"]] = existing
            continue

        league = leagues.get(md["league_slug"])
        home_team = teams.get(md["home_team_slug"])
        away_team = teams.get(md["away_team_slug"])
        if not (league and home_team and away_team):
            continue

        season_key = (md["league_slug"], md.get("season_name", "2025-2026"))
        season = seasons.get(season_key)

        match = Match(
            id=uuid.uuid4(),
            league_id=league.id,
            season_id=season.id if season else None,
            home_team_id=home_team.id,
            away_team_id=away_team.id,
            external_id=md["external_id"],
            status=_slug_to_status(md["status"]),
            scheduled_at=datetime.fromisoformat(md["scheduled_at"]),
            venue=md.get("venue"),
            round_name=md.get("round_name"),
            matchday=md.get("matchday"),
        )
        db.add(match)
        db.flush()
        result[md["external_id"]] = match
        created += 1

        # Attach result if available
        if md["external_id"] in all_results_data and md["status"] == "finished":
            rd = all_results_data[md["external_id"]]
            match_result = MatchResult(
                id=uuid.uuid4(),
                match_id=match.id,
                home_score=rd["home_score"],
                away_score=rd["away_score"],
                home_score_ht=rd.get("home_score_ht"),
                away_score_ht=rd.get("away_score_ht"),
                winner=rd.get("winner"),
                extra_data=rd.get("extra_data"),
            )
            db.add(match_result)

    db.flush()
    print(f"  [matches] created {created} new matches")
    return result


def seed_standings(
    db: Session,
    leagues: dict[str, League],
    teams: dict[str, Team],
    seasons: dict[tuple, Season],
) -> None:
    """Insert current standings snapshots for all leagues."""
    today = date.today()
    created = 0

    # Football standings
    for league_slug, rows in _FB_STANDINGS_RAW.items():
        league = leagues.get(league_slug)
        if not league:
            continue
        season = seasons.get((league_slug, "2025-2026"))
        if not season:
            continue
        for row in rows:
            team_slug = row[0]
            team = teams.get(team_slug)
            if not team:
                continue
            existing = db.execute(
                select(StandingsSnapshot).where(
                    StandingsSnapshot.league_id == league.id,
                    StandingsSnapshot.team_id == team.id,
                    StandingsSnapshot.snapshot_date == today,
                )
            ).scalar_one_or_none()
            if existing:
                continue
            snap = StandingsSnapshot(
                id=uuid.uuid4(),
                league_id=league.id,
                season_id=season.id,
                team_id=team.id,
                snapshot_date=today,
                position=row[3],
                played=row[4],
                won=row[5],
                drawn=row[6],
                lost=row[7],
                goals_for=row[8],
                goals_against=row[9],
                goal_difference=row[10],
                points=row[11],
                extra_data={"form": row[12]},
            )
            db.add(snap)
            created += 1

    # Basketball standings
    for league_slug, rows in _BB_STANDINGS.items():
        league = leagues.get(league_slug)
        if not league:
            continue
        season = seasons.get((league_slug, "2025-2026"))
        if not season:
            continue
        for row in rows:
            team = teams.get(row["team_slug"])
            if not team:
                continue
            existing = db.execute(
                select(StandingsSnapshot).where(
                    StandingsSnapshot.league_id == league.id,
                    StandingsSnapshot.team_id == team.id,
                    StandingsSnapshot.snapshot_date == today,
                )
            ).scalar_one_or_none()
            if existing:
                continue
            snap = StandingsSnapshot(
                id=uuid.uuid4(),
                league_id=league.id,
                season_id=season.id,
                team_id=team.id,
                snapshot_date=today,
                position=row["position"],
                played=row["played"],
                won=row["won"],
                drawn=row["drawn"],
                lost=row["lost"],
                goals_for=row["goals_for"],
                goals_against=row["goals_against"],
                goal_difference=row["goal_difference"],
                points=row["points"],
                extra_data=row.get("extra_data"),
            )
            db.add(snap)
            created += 1

    db.flush()
    print(f"  [standings] created {created} new snapshots")


def seed_users(db: Session) -> dict[str, User]:
    """Create default admin, analyst and viewer accounts."""
    users_data = [
        {"email": "admin@sip.local",   "username": "admin",   "password": "admin123",   "full_name": "Admin User",   "role": Role.ADMIN},
        {"email": "analyst@sip.local", "username": "analyst", "password": "analyst123", "full_name": "Analyst User", "role": Role.ANALYST},
        {"email": "viewer@sip.local",  "username": "viewer",  "password": "viewer123",  "full_name": "Viewer User",  "role": Role.VIEWER},
    ]
    result: dict[str, User] = {}
    for ud in users_data:
        existing = db.execute(select(User).where(User.email == ud["email"])).scalar_one_or_none()
        if existing:
            result[ud["username"]] = existing
            continue
        user = User(
            id=uuid.uuid4(),
            email=ud["email"],
            username=ud["username"],
            hashed_password=hash_password(ud["password"]),
            full_name=ud["full_name"],
            role=ud["role"],
            is_active=True,
        )
        db.add(user)
        db.flush()
        result[ud["username"]] = user
        print(f"  [user] created: {user.email} (role={user.role.value})")
    return result


def seed_model_versions(db: Session) -> dict[str, ModelVersion]:
    """Create one active model version per model type."""
    models_data = [
        {
            "name": "Elo Football v1",
            "version": "1.0.0",
            "model_type": "elo",
            "sport_scope": "football",
            "description": "Classic Elo rating model with home advantage and draw factor calibrated for football.",
            "hyperparameters": {"k_factor": 32, "home_advantage": 100, "default_elo": 1500, "draw_factor": 0.28},
            "training_metrics": {"n_matches_processed": 340, "accuracy": 0.512, "brier_score": 0.213},
            "accuracy": 0.512,
            "brier_score": 0.213,
            "sample_size": 340,
        },
        {
            "name": "Poisson Goal Model v1",
            "version": "1.0.0",
            "model_type": "poisson",
            "sport_scope": "football",
            "description": "Dixon-Coles inspired Poisson model estimating expected goals per team.",
            "hyperparameters": {"home_advantage": 1.15, "league_avg_home": 1.5, "league_avg_away": 1.2, "max_goals": 7},
            "training_metrics": {"n_matches": 340, "accuracy": 0.521, "brier_score": 0.208},
            "accuracy": 0.521,
            "brier_score": 0.208,
            "sample_size": 340,
        },
        {
            "name": "Logistic Regression v1",
            "version": "1.0.0",
            "model_type": "logistic",
            "sport_scope": "all",
            "description": "Logistic regression on team-level features: Elo, form, home advantage, H2H record.",
            "hyperparameters": {"C": 1.0, "solver": "lbfgs", "max_iter": 200, "n_features": 12},
            "training_metrics": {"n_samples": 340, "accuracy": 0.535, "brier_score": 0.201},
            "accuracy": 0.535,
            "brier_score": 0.201,
            "sample_size": 340,
        },
        {
            "name": "Ensemble v1",
            "version": "1.0.0",
            "model_type": "ensemble",
            "sport_scope": "all",
            "description": "Weighted ensemble of Elo, Poisson and Logistic models (weights: 0.3, 0.4, 0.3).",
            "hyperparameters": {"weights": {"elo": 0.3, "poisson": 0.4, "logistic": 0.3}, "min_agreement_threshold": 0.7},
            "training_metrics": {"all_trained": True, "accuracy": 0.548, "brier_score": 0.196},
            "accuracy": 0.548,
            "brier_score": 0.196,
            "sample_size": 340,
        },
    ]
    result: dict[str, ModelVersion] = {}
    for md in models_data:
        existing = db.execute(
            select(ModelVersion).where(
                ModelVersion.model_type == md["model_type"],
                ModelVersion.version == md["version"],
                ModelVersion.sport_scope == md["sport_scope"],
            )
        ).scalar_one_or_none()
        if existing:
            result[md["model_type"]] = existing
            continue
        mv = ModelVersion(
            id=uuid.uuid4(),
            name=md["name"],
            version=md["version"],
            model_type=md["model_type"],
            sport_scope=md["sport_scope"],
            description=md["description"],
            hyperparameters=md["hyperparameters"],
            training_metrics=md["training_metrics"],
            trained_at=_NOW - timedelta(days=30),
            is_active=True,
            accuracy=md["accuracy"],
            brier_score=md["brier_score"],
            sample_size=md["sample_size"],
        )
        db.add(mv)
        db.flush()
        result[md["model_type"]] = mv
        print(f"  [model_version] created: {mv.name}")
    return result


def seed_predictions_and_evaluations(
    db: Session,
    matches: dict[str, Match],
    model_versions: dict[str, ModelVersion],
) -> None:
    """
    Create one prediction per finished match (using the ensemble model version)
    and the corresponding evaluation.  Pre-computed probabilities are realistic
    enough for track-record queries to be meaningful.
    """
    ensemble_mv = model_versions.get("ensemble")
    elo_mv = model_versions.get("elo")
    if not ensemble_mv:
        print("  [predictions] SKIP: ensemble model version not found")
        return

    # Finished football matches and their pre-baked probability distributions
    # (home_win_prob, draw_prob, away_win_prob) – rounded to sum to 1.0
    _PRED_PROBS: dict[str, tuple[float, float, float]] = {
        "match_epl_001": (0.34, 0.28, 0.38),  # Arsenal vs ManCity – draw
        "match_epl_002": (0.55, 0.23, 0.22),  # Liverpool vs Chelsea – home win
        "match_epl_003": (0.42, 0.27, 0.31),  # Spurs vs ManUtd – away win (upset)
        "match_epl_004": (0.38, 0.30, 0.32),  # ManCity vs Liverpool – draw
        "match_epl_005": (0.46, 0.26, 0.28),  # Chelsea vs Arsenal – home win
        "match_epl_006": (0.33, 0.28, 0.39),  # ManUtd vs Spurs – away win
        "match_epl_007": (0.37, 0.27, 0.36),  # Arsenal vs Liverpool – home win
        "match_epl_008": (0.50, 0.24, 0.26),  # ManCity vs Chelsea – home win
        "match_epl_009": (0.39, 0.28, 0.33),  # Liverpool vs ManUtd – draw
        "match_lla_001": (0.52, 0.24, 0.24),  # Real Madrid vs Barça – home win
        "match_lla_002": (0.48, 0.26, 0.26),  # Atlético vs Sevilla – home win
        "match_lla_003": (0.35, 0.30, 0.35),  # Villarreal vs Sociedad – draw
        "match_lla_004": (0.42, 0.28, 0.30),  # Barça vs Atlético – draw
        "match_lla_005": (0.36, 0.27, 0.37),  # Sevilla vs Real Madrid – away win
        "match_lla_006": (0.55, 0.23, 0.22),  # Real Madrid vs Villarreal – home win
        "match_bun_001": (0.62, 0.20, 0.18),  # Bayern vs Dortmund – home win
        "match_bun_002": (0.44, 0.27, 0.29),  # Leverkusen vs Leipzig – home win
        "match_bun_003": (0.38, 0.30, 0.32),  # Frankfurt vs Wolfsburg – draw
        "match_bun_004": (0.40, 0.27, 0.33),  # Dortmund vs Leverkusen – away win
        "match_bun_005": (0.33, 0.27, 0.40),  # Leipzig vs Bayern – away win
        "match_sea_001": (0.48, 0.26, 0.26),  # Inter vs Milan – home win
        "match_sea_002": (0.45, 0.27, 0.28),  # Juventus vs Napoli – away win (upset)
        "match_sea_003": (0.38, 0.30, 0.32),  # Roma vs Lazio – draw
        "match_sea_004": (0.46, 0.26, 0.28),  # Milan vs Juventus – home win
        "match_sea_005": (0.42, 0.27, 0.31),  # Napoli vs Inter – away win
        "match_l1_001":  (0.65, 0.19, 0.16),  # PSG vs Monaco – home win
        "match_l1_002":  (0.38, 0.28, 0.34),  # Marseille vs Lyon – away win
        "match_l1_003":  (0.44, 0.27, 0.29),  # Lille vs Rennes – home win
        "match_l1_004":  (0.37, 0.30, 0.33),  # Monaco vs Marseille – draw
        "match_l1_005":  (0.60, 0.21, 0.19),  # PSG vs Lille – home win
        # Basketball (no draws)
        "match_nba_001": (0.52, 0.0, 0.48),
        "match_nba_002": (0.48, 0.0, 0.52),
        "match_nba_003": (0.55, 0.0, 0.45),
        "match_nba_004": (0.44, 0.0, 0.56),
        "match_nba_005": (0.51, 0.0, 0.49),
        "match_nba_006": (0.46, 0.0, 0.54),
        "match_nba_007": (0.53, 0.0, 0.47),
        "match_nba_008": (0.54, 0.0, 0.46),
        "match_nba_009": (0.52, 0.0, 0.48),
        "match_nba_010": (0.47, 0.0, 0.53),
        "match_nba_011": (0.51, 0.0, 0.49),
        "match_nba_012": (0.45, 0.0, 0.55),
        # Tennis
        "match_atp_001": (0.58, 0.0, 0.42),
        "match_atp_002": (0.54, 0.0, 0.46),
        "match_atp_003": (0.47, 0.0, 0.53),
        "match_atp_004": (0.51, 0.0, 0.49),
        "match_atp_005": (0.60, 0.0, 0.40),
    }

    all_results = {**_FB_RESULTS, **_BB_RESULTS, **_TENNIS_RESULTS}
    pred_created = 0
    eval_created = 0

    for ext_id, match in matches.items():
        if match.status != MatchStatus.FINISHED:
            continue
        if ext_id not in _PRED_PROBS:
            continue

        # Skip if prediction already exists
        existing_pred = db.execute(
            select(Prediction).where(
                Prediction.match_id == match.id,
                Prediction.model_version_id == ensemble_mv.id,
            )
        ).scalar_one_or_none()
        if existing_pred:
            continue

        hw, dw, aw = _PRED_PROBS[ext_id]
        # Normalise to guarantee sum = 1
        total = hw + dw + aw
        hw, dw, aw = hw / total, dw / total, aw / total

        max_p = max(hw, dw, aw)
        confidence = min(1.0, max(0.0, (max_p - 1 / 3) / (2 / 3)))
        n_eff = 30
        sigma = math.sqrt(max_p * (1 - max_p) / n_eff)

        pred = Prediction(
            id=uuid.uuid4(),
            match_id=match.id,
            model_version_id=ensemble_mv.id,
            predicted_at=match.scheduled_at - timedelta(hours=24),
            prediction_type="match_result",
            home_win_prob=round(hw, 6),
            draw_prob=round(dw, 6),
            away_win_prob=round(aw, 6),
            predicted_home_score=None,
            predicted_away_score=None,
            confidence=round(confidence, 4),
            confidence_interval_low=round(max(0.0, max_p - 1.96 * sigma), 4),
            confidence_interval_high=round(min(1.0, max_p + 1.96 * sigma), 4),
            features_snapshot={"home_elo": 1550, "away_elo": 1490, "home_form": 0.67, "away_form": 0.53},
            raw_output={"model_type": "ensemble", "sub_models": ["elo", "poisson", "logistic"]},
            is_simulation=False,
        )
        db.add(pred)
        db.flush()
        pred_created += 1

        # Explanation
        explanation = PredictionExplanation(
            id=uuid.uuid4(),
            prediction_id=pred.id,
            summary=f"Ensemble of Elo + Poisson + Logistic gives home win probability {hw:.1%}.",
            top_factors_for={"home_elo_advantage": 60, "home_form": "WWDWW", "venue_advantage": "strong"},
            top_factors_against={"away_recent_form": "WDWLW", "head_to_head": "balanced"},
            feature_importances={"home_elo": 0.35, "away_elo": 0.30, "form_diff": 0.20, "h2h": 0.15},
        )
        db.add(explanation)

        # Evaluation
        if ext_id not in all_results:
            continue
        rd = all_results[ext_id]
        actual = _outcome(rd["home_score"], rd["away_score"])
        probs = {"home": hw, "draw": dw, "away": aw}
        predicted_class = max(probs, key=lambda k: probs[k])

        evaluation = PredictionEvaluation(
            id=uuid.uuid4(),
            prediction_id=pred.id,
            actual_outcome=actual,
            actual_home_score=rd["home_score"],
            actual_away_score=rd["away_score"],
            is_correct=(predicted_class == actual),
            brier_score=_brier(probs, actual),
            log_loss=_log_loss_val(probs, actual),
            evaluated_at=match.scheduled_at + timedelta(hours=2),
        )
        db.add(evaluation)
        eval_created += 1

    # Also create a second batch of predictions using the elo model so
    # per-model filtering in track-record queries works
    if elo_mv:
        for ext_id, match in list(matches.items())[:15]:
            if match.status != MatchStatus.FINISHED:
                continue
            if ext_id not in _PRED_PROBS:
                continue
            existing = db.execute(
                select(Prediction).where(
                    Prediction.match_id == match.id,
                    Prediction.model_version_id == elo_mv.id,
                )
            ).scalar_one_or_none()
            if existing:
                continue
            hw, dw, aw = _PRED_PROBS[ext_id]
            # Add slight noise relative to ensemble for variety
            hw = min(1.0, max(0.0, hw + 0.02))
            total = hw + dw + aw
            hw, dw, aw = hw / total, dw / total, aw / total
            max_p = max(hw, dw, aw)
            confidence = min(1.0, max(0.0, (max_p - 1 / 3) / (2 / 3)))
            pred_elo = Prediction(
                id=uuid.uuid4(),
                match_id=match.id,
                model_version_id=elo_mv.id,
                predicted_at=match.scheduled_at - timedelta(hours=36),
                prediction_type="match_result",
                home_win_prob=round(hw, 6),
                draw_prob=round(dw, 6),
                away_win_prob=round(aw, 6),
                confidence=round(confidence, 4),
                confidence_interval_low=None,
                confidence_interval_high=None,
                features_snapshot={"home_elo": 1550, "away_elo": 1490},
                raw_output={"model_type": "elo"},
                is_simulation=False,
            )
            db.add(pred_elo)
            db.flush()
            if ext_id in all_results:
                rd = all_results[ext_id]
                actual = _outcome(rd["home_score"], rd["away_score"])
                probs_elo = {"home": hw, "draw": dw, "away": aw}
                db.add(PredictionEvaluation(
                    id=uuid.uuid4(),
                    prediction_id=pred_elo.id,
                    actual_outcome=actual,
                    actual_home_score=rd["home_score"],
                    actual_away_score=rd["away_score"],
                    is_correct=(max(probs_elo, key=lambda k: probs_elo[k]) == actual),
                    brier_score=_brier(probs_elo, actual),
                    log_loss=_log_loss_val(probs_elo, actual),
                    evaluated_at=match.scheduled_at + timedelta(hours=2),
                ))

    db.flush()
    print(f"  [predictions] created {pred_created} predictions, {eval_created} evaluations")


# ===========================================================================
# Entry point
# ===========================================================================

def run() -> None:
    print("=" * 60)
    print("Sports Intelligence Platform – Seed Script")
    print("=" * 60)

    settings = get_settings()
    print(f"Connecting to: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")

    engine, SessionLocal = _make_session()

    # Quick connectivity test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Database connection OK.\n")

    with SessionLocal() as db:
        print("[1/9] Sports …")
        sports = seed_sports(db)
        db.commit()

        print("[2/9] Leagues …")
        leagues = seed_leagues(db, sports)
        db.commit()

        print("[3/9] Seasons …")
        seasons = seed_seasons(db, leagues)
        db.commit()

        print("[4/9] Teams …")
        teams = seed_teams(db, leagues)
        db.commit()

        print("[5/9] Players …")
        seed_players(db, teams)
        db.commit()

        print("[6/9] Matches + Results …")
        matches = seed_matches(db, leagues, teams, seasons)
        db.commit()

        print("[7/9] Standings …")
        seed_standings(db, leagues, teams, seasons)
        db.commit()

        print("[8/9] Users …")
        seed_users(db)
        db.commit()

        print("[9/9] Model versions + Predictions + Evaluations …")
        model_versions = seed_model_versions(db)
        db.commit()
        seed_predictions_and_evaluations(db, matches, model_versions)
        db.commit()

    print("\nSeed complete.")
    print("=" * 60)
    print("Default accounts:")
    print("  admin@sip.local   / admin123   (admin)")
    print("  analyst@sip.local / analyst123 (analyst)")
    print("  viewer@sip.local  / viewer123  (viewer)")
    print("=" * 60)


if __name__ == "__main__":
    run()
