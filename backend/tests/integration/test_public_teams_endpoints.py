"""Integration tests for /api/public/teams + /api/public/leagues.

These endpoints back the marketing site (betsplug.com / Astro). The tests
seed an in-memory SQLite DB with one supported league + one team, then
hit the FastAPI app via TestClient and assert:

* response shape matches the spec Cas wrote in the marketing brief
* logo / colour fields come from the static branding map
* unknown slug → 404 with the documented error envelope
* ``Cache-Control`` header is set to ``public, max-age=3600, s-maxage=86400``
"""
from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.session import Base, get_db
from app.main import app
from app.models.league import League
from app.models.sport import Sport
from app.models.team import Team


@pytest_asyncio.fixture
async def seeded_app(async_engine):
    """Override get_db to use the test async engine + seed sample rows."""
    factory = async_sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )

    # Seed once for the whole test
    async with factory() as session:
        sport = Sport(id=uuid.uuid4(), name="Football", slug="football", is_active=True)
        session.add(sport)
        await session.flush()

        league = League(
            id=uuid.uuid4(),
            sport_id=sport.id,
            name="Premier League",
            slug="premier-league",
            country="England",
            tier=1,
            is_active=True,
        )
        session.add(league)
        await session.flush()

        team = Team(
            id=uuid.uuid4(),
            league_id=league.id,
            name="Manchester City",
            slug="manchester-city",
            short_name="Man City",
            country="England",
            venue="Etihad Stadium",
            logo_url="https://media.api-sports.io/football/teams/50.png",
            is_active=True,
        )
        session.add(team)
        await session.commit()

    async def _override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield app
    finally:
        app.dependency_overrides.pop(get_db, None)
        # Clean up between modules — drop the rows we inserted so other test
        # files using the same async_engine session-scoped fixture see clean
        # tables.
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)


@pytest.mark.anyio
async def test_get_team_by_slug_returns_branded_payload(seeded_app):
    transport = ASGITransport(app=seeded_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/public/teams/manchester-city")

    assert resp.status_code == 200
    body = resp.json()
    assert body["slug"] == "manchester-city"
    assert body["name"] == "Manchester City"
    assert body["shortName"] == "Man City"
    assert body["country"] == "England"
    assert body["venue"] == "Etihad Stadium"
    assert body["logoUrl"].endswith("/teams/50.png")
    assert body["league"] == {"slug": "premier-league", "name": "Premier League"}
    assert body["colors"] == {"primary": "#6CABDD", "secondary": "#FFFFFF"}
    assert body["founded"] == 1880
    # Cache-Control per spec: 1h client / 24h CDN.
    assert resp.headers["cache-control"] == "public, max-age=3600, s-maxage=86400"


@pytest.mark.anyio
async def test_get_team_unknown_slug_returns_404(seeded_app):
    transport = ASGITransport(app=seeded_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/public/teams/nonexistent-team")

    assert resp.status_code == 404
    detail = resp.json()["detail"]
    assert detail["error"] == "team_not_found"
    assert "nonexistent-team" in detail["message"]


@pytest.mark.anyio
async def test_get_team_invalid_slug_pattern_returns_422(seeded_app):
    transport = ASGITransport(app=seeded_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Uppercase + spaces violate the slug regex → 422 before the DB hit.
        resp = await client.get("/api/public/teams/Bad%20Slug%21")
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_list_leagues_returns_ten_branded_leagues(seeded_app):
    transport = ASGITransport(app=seeded_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/public/leagues")

    assert resp.status_code == 200
    body = resp.json()
    leagues = body["leagues"]
    # 10 launch-supported leagues per the marketing brief.
    assert len(leagues) == 10
    slugs = [lg["slug"] for lg in leagues]
    assert "premier-league" in slugs
    assert "champions-league" in slugs

    pl = next(lg for lg in leagues if lg["slug"] == "premier-league")
    assert pl["name"] == "Premier League"
    assert pl["country"] == "England"
    assert pl["logoUrl"].endswith("/leagues/39.png")
    assert pl["colors"] == {"primary": "#3D195B", "secondary": "#FFFFFF"}
    assert pl["season"] == "2025-26"

    assert resp.headers["cache-control"] == "public, max-age=3600, s-maxage=86400"


@pytest.mark.anyio
async def test_list_league_teams_returns_envelope(seeded_app):
    transport = ASGITransport(app=seeded_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/public/leagues/premier-league/teams")

    assert resp.status_code == 200
    body = resp.json()
    assert body["league"]["slug"] == "premier-league"
    assert body["league"]["logoUrl"].endswith("/leagues/39.png")
    assert body["count"] == 1
    team = body["teams"][0]
    assert team["slug"] == "manchester-city"
    assert team["shortName"] == "Man City"
    assert team["colors"] == {"primary": "#6CABDD", "secondary": "#FFFFFF"}


@pytest.mark.anyio
async def test_list_league_teams_unknown_league_returns_404(seeded_app):
    transport = ASGITransport(app=seeded_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/public/leagues/eredivisie-2/teams")

    assert resp.status_code == 404
    detail = resp.json()["detail"]
    assert detail["error"] == "league_not_found"
