"""
conftest.py
===========
Shared pytest fixtures for the Sports Intelligence Platform test suite.

Scopes
------
session  – created once per test session (engine, tables)
function – created fresh for each test (db session, rollback)

The test database uses an in-memory SQLite instance so no running Postgres
is required.  Async tests are also supported via ``anyio`` (marked with
``pytest.mark.anyio``).

Usage in tests
--------------
    def test_something(db_session):
        db_session.add(...)
        db_session.commit()
        ...

    @pytest.mark.anyio
    async def test_async_something(async_db_session):
        result = await async_db_session.execute(select(Sport))
        ...
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Generator, AsyncGenerator

import pytest
import pytest_asyncio

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Import Base and all models so their tables are registered in metadata
from app.db.session import Base
import app.models.sport          # noqa: F401
import app.models.league         # noqa: F401
import app.models.season         # noqa: F401
import app.models.team           # noqa: F401
import app.models.player         # noqa: F401
import app.models.match          # noqa: F401
import app.models.standings      # noqa: F401
import app.models.prediction     # noqa: F401
import app.models.model_version  # noqa: F401
import app.models.user           # noqa: F401
import app.models.injury         # noqa: F401
import app.models.stats          # noqa: F401
import app.models.odds           # noqa: F401
import app.models.backtest       # noqa: F401
import app.models.audit          # noqa: F401
import app.models.ingestion      # noqa: F401
import app.models.report         # noqa: F401

from app.models.sport import Sport
from app.models.league import League
from app.models.season import Season
from app.models.team import Team
from app.models.player import Player
from app.models.match import Match, MatchResult, MatchStatus
from app.models.model_version import ModelVersion
from app.models.user import User, Role
from app.core.security import hash_password


# ---------------------------------------------------------------------------
# Database URL
# ---------------------------------------------------------------------------

# Use SQLite with aiosqlite for async, plain sqlite for sync.
# The ``?check_same_thread=False`` is required for SQLite in multi-thread contexts.
_SYNC_DB_URL = "sqlite:///./test_sip.db"
_ASYNC_DB_URL = "sqlite+aiosqlite:///./test_sip.db"

# ---------------------------------------------------------------------------
# Sync engine / session – used by non-async unit and integration tests
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def sync_engine():
    """Single engine for the whole test session."""
    engine = create_engine(
        _SYNC_DB_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    # Enable WAL mode for better concurrency with SQLite
    @event.listens_for(engine, "connect")
    def _enable_wal(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA journal_mode=WAL")
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="session")
def sync_session_factory(sync_engine):
    return sessionmaker(bind=sync_engine, expire_on_commit=False)


@pytest.fixture
def db_session(sync_session_factory) -> Generator[Session, None, None]:
    """
    Provide a transactional database session that is rolled back after each
    test.  This keeps tests isolated without re-creating the schema each time.
    """
    connection = sync_session_factory.kw["bind"].connect()
    transaction = connection.begin()
    session = sync_session_factory(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# Async engine / session – used by async integration tests
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def anyio_backend():
    """Tell anyio to use asyncio as the backend."""
    return "asyncio"


@pytest.fixture(scope="session")
async def async_engine():
    engine = create_async_engine(_ASYNC_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def async_db_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Async session wrapped in a SAVEPOINT for isolation."""
    async_session_factory = async_sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_factory() as session:
        async with session.begin():
            yield session
            await session.rollback()


# ---------------------------------------------------------------------------
# Common model fixtures (sync, function-scoped)
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_sport(db_session: Session) -> Sport:
    sport = Sport(
        id=uuid.uuid4(),
        name="Football",
        slug="football",
        icon="⚽",
        is_active=True,
    )
    db_session.add(sport)
    db_session.flush()
    return sport


@pytest.fixture
def sample_league(db_session: Session, sample_sport: Sport) -> League:
    league = League(
        id=uuid.uuid4(),
        sport_id=sample_sport.id,
        name="Premier League",
        slug="premier-league-test",
        country="England",
        tier=1,
        is_active=True,
    )
    db_session.add(league)
    db_session.flush()
    return league


@pytest.fixture
def sample_season(db_session: Session, sample_league: League) -> Season:
    from datetime import date
    season = Season(
        id=uuid.uuid4(),
        league_id=sample_league.id,
        name="2025-2026",
        start_date=date(2025, 8, 1),
        end_date=date(2026, 6, 30),
        is_current=True,
    )
    db_session.add(season)
    db_session.flush()
    return season


@pytest.fixture
def sample_home_team(db_session: Session, sample_league: League) -> Team:
    team = Team(
        id=uuid.uuid4(),
        league_id=sample_league.id,
        name="Arsenal Test",
        slug="arsenal-test",
        short_name="Arsenal",
        country="England",
        venue="Emirates Stadium",
        is_active=True,
    )
    db_session.add(team)
    db_session.flush()
    return team


@pytest.fixture
def sample_away_team(db_session: Session, sample_league: League) -> Team:
    team = Team(
        id=uuid.uuid4(),
        league_id=sample_league.id,
        name="Manchester City Test",
        slug="manchester-city-test",
        short_name="Man City",
        country="England",
        venue="Etihad Stadium",
        is_active=True,
    )
    db_session.add(team)
    db_session.flush()
    return team


@pytest.fixture
def sample_match(
    db_session: Session,
    sample_league: League,
    sample_season: Season,
    sample_home_team: Team,
    sample_away_team: Team,
) -> Match:
    match = Match(
        id=uuid.uuid4(),
        league_id=sample_league.id,
        season_id=sample_season.id,
        home_team_id=sample_home_team.id,
        away_team_id=sample_away_team.id,
        external_id="test-match-001",
        status=MatchStatus.FINISHED,
        scheduled_at=datetime(2025, 9, 1, 15, 0, 0, tzinfo=timezone.utc),
        venue="Emirates Stadium",
        round_name="Matchday 1",
        matchday=1,
    )
    db_session.add(match)
    db_session.flush()
    return match


@pytest.fixture
def sample_match_result(db_session: Session, sample_match: Match) -> MatchResult:
    result = MatchResult(
        id=uuid.uuid4(),
        match_id=sample_match.id,
        home_score=2,
        away_score=1,
        home_score_ht=1,
        away_score_ht=0,
        winner="home",
        extra_data={"home_xg": 1.9, "away_xg": 0.8},
    )
    db_session.add(result)
    db_session.flush()
    return result


@pytest.fixture
def sample_model_version(db_session: Session) -> ModelVersion:
    mv = ModelVersion(
        id=uuid.uuid4(),
        name="Elo Test v1",
        version="1.0.0",
        model_type="elo",
        sport_scope="football",
        description="Test Elo model",
        hyperparameters={"k_factor": 32},
        training_metrics={"accuracy": 0.51},
        trained_at=datetime.now(timezone.utc),
        is_active=True,
        accuracy=0.51,
        brier_score=0.21,
        sample_size=100,
    )
    db_session.add(mv)
    db_session.flush()
    return mv


@pytest.fixture
def sample_admin_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="test-admin@sip.local",
        username="test-admin",
        hashed_password=hash_password("testpass123"),
        full_name="Test Admin",
        role=Role.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture
def sample_viewer_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="test-viewer@sip.local",
        username="test-viewer",
        hashed_password=hash_password("testpass123"),
        full_name="Test Viewer",
        role=Role.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Prediction fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_prediction(
    db_session: Session,
    sample_match: Match,
    sample_model_version: ModelVersion,
) -> "app.models.prediction.Prediction":
    from app.models.prediction import Prediction
    pred = Prediction(
        id=uuid.uuid4(),
        match_id=sample_match.id,
        model_version_id=sample_model_version.id,
        predicted_at=datetime(2025, 8, 31, 12, 0, 0, tzinfo=timezone.utc),
        prediction_type="match_result",
        home_win_prob=0.50,
        draw_prob=0.25,
        away_win_prob=0.25,
        confidence=0.45,
        is_simulation=False,
    )
    db_session.add(pred)
    db_session.flush()
    return pred
