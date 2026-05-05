"""Pure-unit tests for public_teams response builders + branding lookup.

These don't spin up the FastAPI app or hit the DB — they exercise the
shape/contract of the helpers that the marketing endpoints rely on, so
coverage stays meaningful even in environments without aiosqlite/structlog.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace

import pytest

# Load public_teams.py without going through app.api.routes.__init__ — that
# import chain pulls in auth.py which needs python-multipart and isn't
# relevant to these helpers.
_HERE = Path(__file__).resolve().parents[2]  # backend/
_MOD_PATH = _HERE / "app" / "api" / "routes" / "public_teams.py"
_spec = importlib.util.spec_from_file_location("public_teams", _MOD_PATH)
public_teams = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(public_teams)

from app.core.team_branding import (  # noqa: E402
    LEAGUE_BRANDING,
    LEAGUE_DISPLAY_ORDER,
    TEAM_BRANDING,
    get_league_branding,
    get_team_branding,
)


class TestBrandingMap:
    def test_ten_supported_leagues(self):
        assert len(LEAGUE_BRANDING) == 10
        assert len(LEAGUE_DISPLAY_ORDER) == 10
        assert set(LEAGUE_DISPLAY_ORDER) == set(LEAGUE_BRANDING.keys())

    def test_every_league_has_required_fields(self):
        for slug, br in LEAGUE_BRANDING.items():
            assert "logo_url" in br
            assert "colors" in br
            assert "season" in br
            assert br["logo_url"].startswith("https://media.api-sports.io/")
            assert br["colors"]["primary"].startswith("#")
            assert br["colors"]["secondary"].startswith("#")

    def test_team_branding_has_known_clubs(self):
        # Sanity: we shipped colours for every team listed in Cas's brief
        # for the marquee leagues.
        for slug in ("manchester-city", "real-madrid", "bayern-munich",
                     "inter-milan", "psg", "ajax", "benfica"):
            br = get_team_branding(slug)
            assert br is not None, f"Missing team branding for {slug}"
            assert "colors" in br

    def test_unknown_team_returns_none(self):
        assert get_team_branding("not-a-real-team-zzz") is None

    def test_unknown_league_returns_none(self):
        assert get_league_branding("not-a-real-league-zzz") is None


class TestResponseBuilders:
    def _team(self, slug, name, league=None):
        return SimpleNamespace(
            slug=slug,
            name=name,
            short_name="Short",
            country="England",
            venue="Test Ground",
            logo_url=f"https://media.api-sports.io/football/teams/1.png",
            league=league,
        )

    def _league(self, slug, name):
        return SimpleNamespace(slug=slug, name=name, country="England")

    def test_team_payload_pulls_colors_and_founded_from_branding(self):
        league = self._league("premier-league", "Premier League")
        team = self._team("manchester-city", "Manchester City", league)
        payload = public_teams._build_team_payload(team)
        assert payload.slug == "manchester-city"
        assert payload.colors is not None
        assert payload.colors.primary == "#6CABDD"
        assert payload.founded == 1880
        assert payload.league.slug == "premier-league"

    def test_team_payload_unknown_branding_returns_null_color_and_founded(self):
        league = self._league("premier-league", "Premier League")
        team = self._team("some-obscure-club", "Some Obscure Club", league)
        payload = public_teams._build_team_payload(team)
        assert payload.colors is None
        assert payload.founded is None
        # Other DB fields still populated.
        assert payload.short_name == "Short"
        assert payload.venue == "Test Ground"

    def test_team_summary_omits_league_and_venue(self):
        team = self._team("liverpool", "Liverpool", self._league("premier-league", "Premier League"))
        summary = public_teams._build_team_summary(team)
        assert summary.slug == "liverpool"
        assert summary.colors.primary == "#C8102E"
        # The compact shape used by /api/public/leagues/{slug}/teams
        # explicitly does NOT include league/founded/country/venue.
        assert not hasattr(summary, "league")
        assert not hasattr(summary, "founded")

    def test_league_payload_uses_branding_for_logo_and_colors(self):
        league = self._league("premier-league", "Premier League")
        payload = public_teams._build_league_payload(league)
        assert payload.logo_url.endswith("/leagues/39.png")
        assert payload.colors.primary == "#3D195B"
        assert payload.season == "2025-26"

    def test_league_payload_unbranded_league_returns_none_logo(self):
        # League exists in DB but isn't in our 10-league branding map.
        league = self._league("brasileirao-serie-a", "Brasileirão Serie A")
        payload = public_teams._build_league_payload(league)
        assert payload.logo_url is None
        assert payload.colors is None
        assert payload.season is None


class TestSlugPattern:
    @pytest.fixture
    def regex(self):
        import re
        return re.compile(public_teams.SLUG_PATTERN)

    def test_accepts_valid_slugs(self, regex):
        for s in ("manchester-city", "psg", "rb-leipzig", "go-ahead-eagles",
                  "premier-league", "fc-twente", "ac-milan"):
            assert regex.fullmatch(s), s

    def test_rejects_invalid_slugs(self, regex):
        # Single-char slugs are allowed (no business reason to require ≥2);
        # the guard's job is to reject characters that aren't valid in a slug.
        for bad in ("Manchester-City", "manchester city", "-leading", "trailing-",
                    "two--hyphens", "with_underscore", "with.dot", ""):
            assert not regex.fullmatch(bad), bad


class TestInMemoryCache:
    def test_set_then_get_round_trip(self):
        public_teams._cache.clear()
        public_teams._cache_set("k1", {"value": 1})
        assert public_teams._cache_get("k1") == {"value": 1}

    def test_miss_returns_none(self):
        public_teams._cache.clear()
        assert public_teams._cache_get("missing") is None

    def test_expired_entry_is_evicted(self, monkeypatch):
        public_teams._cache.clear()
        # Fake time so the entry is already expired on next read.
        public_teams._cache_set("k2", "v")
        # Push the cache key's expiry into the past.
        ts, val = public_teams._cache["k2"]
        public_teams._cache["k2"] = (ts - public_teams._TTL_SECONDS - 1, val)
        assert public_teams._cache_get("k2") is None
        assert "k2" not in public_teams._cache  # auto-evicted on miss
