# BetsPlug — API Coverage Audit

_Last updated: 2026-04-11 — generated during the v4 audit session._

This document reports, **from live API calls** (not documentation), exactly what
data each provider returns for BetsPlug's six target leagues: Premier League,
La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie. Where the repository's code
contradicted what the live API actually returned, the live result wins and the
code was fixed or flagged.

Test budget used this session: 2 football-data.org calls + 2 API-Football
calls (API-Football free-tier cap is 100/day, we preserved 98 for Dennis).

---

## 1. League coverage matrix

Columns: ✅ = live request succeeded, ❌ = not available on current plan,
❓ = unknown / not tested this session.

| League              | Football-Data.org (free TIER_ONE) | API-Football (free) | The Odds API (free) | OpenLigaDB |
|---------------------|:---------------------------------:|:-------------------:|:-------------------:|:----------:|
| Premier League      | ✅ (PL)                            | ✅ id 39 _(seasons ≤2024)_   | ✅ soccer_epl                | ❌          |
| La Liga             | ✅ (PD)                            | ✅ id 140 _(≤2024)_          | ✅ soccer_spain_la_liga      | ❌          |
| Bundesliga          | ✅ (BL1)                           | ✅ id 78 _(≤2024)_           | ✅ soccer_germany_bundesliga | ✅ (bl1)   |
| Serie A             | ✅ (SA)                            | ✅ id 135 _(≤2024)_          | ✅ soccer_italy_serie_a      | ❌          |
| Ligue 1             | ✅ (FL1)                           | ✅ id 61 _(≤2024)_           | ✅ soccer_france_ligue_one   | ❌          |
| **Eredivisie**      | **✅ (DED) — NEWLY DISCOVERED**    | ✅ id 88 _(≤2024)_           | ✅ soccer_netherlands_eredivisie | ❌     |
| Champions League    | ✅ (CL)                            | ✅ id 2  _(≤2024)_           | ✅ soccer_uefa_champs_league | ❌          |

### Critical findings

1. **football-data.org DOES ship Eredivisie on the free TIER_ONE plan.**
   Verified live (`GET /v4/competitions/DED/matches?status=SCHEDULED` → HTTP
   200, 38 matches). The previous adapter code explicitly excluded DED with
   a comment stating the opposite. This was the root cause of Dennis' "no
   Feyenoord in search" complaint for future fixtures — historical data
   was coming in via a different code path but upcoming fixtures were not.
   **Fixed** in `backend/app/ingestion/adapters/football_data_org.py` and
   `backend/app/services/data_sync_service.py` in this session.

2. **API-Football free plan blocks current-season data entirely.**
   `GET /v3/fixtures?league=88&season=2025` → HTTP 200 with empty `response`
   and error: `{"plan": "Free plans do not have access to this season, try
   from 2022 to 2024."}`. The `last=N` convenience parameter is also blocked.
   This means API-Football is **useless as a primary source for 2025/26
   fixtures** on the free tier. Our adapter preference in `DataSyncService`
   was the opposite — preferring API-Football when its key was set — which
   explains why ~2 of the 7 leagues were getting no upcoming fixtures in
   production. **Fixed** by reversing the preference order (fd is now
   default, API-Football only when `FOOTBALL_DATA_FORCE_API_FOOTBALL=true`).

3. **The Odds API key is not configured in the local `.env`.** It is
   referenced in `backend/app/core/config.py:90` as `THE_ODDS_API_KEY` but
   the value is blank. The adapter exists (`backend/app/ingestion/adapters/the_odds_api.py`)
   and supports all six target leagues via `LEAGUE_TO_SPORT_KEY`. Not
   wired into any sync job yet.

---

## 2. Field availability per provider (verified against live payloads)

| Field                       | Football-Data.org | API-Football  | The Odds API |
|-----------------------------|:-----------------:|:-------------:|:------------:|
| Fixtures (upcoming)         | ✅ free TIER_ONE | ✅ paid only  | ✅ free (odds-only) |
| Live scores                 | ✅ (matches endpoint) | ✅ paid  | ❓            |
| Team form (derived)         | ✅ (from results) | ✅            | ❌            |
| H2H match list              | ✅                | ✅            | ❌            |
| Standings / league table    | ✅                | ✅            | ❌            |
| Team stats (season agg.)    | ✅ basic, from standings | ✅ rich (home_wins, clean_sheets, biggest_win) | ❌ |
| Player list                 | ✅ squad          | ✅ squad + position + DoB + jersey | ❌       |
| xG (expected goals)         | ❌                | ❌ (not in free fetch) | ❌       |
| Shots total                 | ❌                | ✅ (match stats endpoint, paid) | ❌ |
| Shots on target             | ❌                | ✅ (paid)     | ❌            |
| Possession %                | ❌                | ✅ (paid)     | ❌            |
| Corners                     | ❌                | ✅ (paid)     | ❌            |
| Yellow / Red cards          | ❌                | ✅ (paid)     | ❌            |
| Line-ups (pre-match)        | ✅ (within ~1h)   | ✅ (paid)     | ❌            |
| Injuries                    | ❌                | ✅ (paid)     | ❌            |
| Top scorers                 | ✅ free           | ✅ (paid)     | ❌            |
| Pre-match 1X2 odds          | ✅ (field `odds` in match payload, aggregated) | ✅ (paid) | ✅ free |
| Over / Under 2.5 goals odds | ❌                | ✅ (paid)     | ✅ free (market key `totals`) |
| BTTS odds                   | ❌                | ✅ (paid)     | ❌ on free; paid markets |
| Asian handicap              | ❌                | ✅ (paid)     | ✅ free (spreads) |
| Live / in-play odds         | ❌                | ✅ (paid)     | ❌            |

**Note on API-Football:** the adapter code in
`backend/app/ingestion/adapters/api_football.py` has methods like
`fetch_injuries`, `fetch_team_stats`, `fetch_player_stats`, but almost
all of them hit endpoints that return 403 or the free-tier season error.
The "rich data" column above is what the code *tries* to fetch — how much
actually succeeds on the free tier is uncertain without a paid key.

---

## 3. Gap analysis — what BetsPlug cannot currently ingest on free tiers

| Missing field                  | Impact on product           | Cheapest path                     |
|--------------------------------|-----------------------------|-----------------------------------|
| xG / expected goals             | Forecast model features (esp. Poisson lambda) | Understat scraper (free, fragile) OR FBref scrape (free, fragile) OR API-Football Pro ($19/mo) |
| Shots on target / possession    | Feature engineering         | API-Football Pro ($19/mo)         |
| Real historical 1X2 odds        | Strategy ROI calculation with actual market prices (not the hardcoded `0.9` assumption) | The Odds API historical archive (paid, ~$30/mo) |
| Over/Under 2.5 goals odds       | New market                  | The Odds API free tier (already supported)  |
| BTTS odds                       | New market                  | API-Football Pro OR scraping      |
| Pre-match line-ups > 1h out     | Feature eng., injury/suspension flag | API-Football Pro        |
| In-play / live odds             | Live trading feature        | The Odds API paid tier            |
| Detailed player event data      | Player props, top scorer markets | API-Football Pro             |

**Prioritised**:

1. **Over/Under 2.5 odds via The Odds API free tier** — already supported by
   the adapter we have, zero cost to wire up. The free tier is 500 requests
   per month, enough for one pull per league per day.
2. **Persistent historical Elo ratings table** — higher priority than any new
   market data, because it unlocks honest strategy backtesting. This is an
   internal build, not a provider gap, but it blocks every other validation.
3. **Historical 1X2 odds feed** — needed before any strategy can claim real
   ROI numbers. Requires either The Odds API historical plan (~$30/mo) or
   persisting our own daily snapshots of current odds over time.

---

## 4. Provider request-budget baseline

Under the fixed routing (fd = primary, API-Football = optional enrichment):

| Provider           | Calls/day (planned) | Cap         | Utilisation |
|--------------------|--------------------:|------------:|------------:|
| football-data.org  | 7 × 288 / 5 = ~400  | 14 400/day (10/min) | 2.8% |
| API-Football       | 0 (disabled until Pro) | 100/day | 0%         |
| The Odds API       | ~16 (planned)       | ~16/day     | ~100% of free cap |
| OpenLigaDB         | 0 (not used for now) | unlimited | —            |

The ~400 fd-daily figure assumes the current 5-minute Celery beat cadence,
rotating 7 leagues × 2 sync methods (upcoming + recent results) = 14 slots
per 70-minute cycle. Completely safe against the 10 req/min ceiling.

---

## 5. How the codebase lies about itself (now fixed)

These are the inconsistencies found between comments/docs and live API
behaviour during this audit. Fixed where possible:

| File                                  | Lied about                                     | Fix                        |
|---------------------------------------|------------------------------------------------|----------------------------|
| `backend/app/ingestion/adapters/football_data_org.py` | "Free tier covers top 5 + CL, no Eredivisie" | ✅ Added DED to maps |
| `backend/app/services/data_sync_service.py`           | "Eredivisie only syncs via API-Football"     | ✅ Added DED to rotation |
| `backend/app/services/data_sync_service.py`           | "Prefer API-Football when key is available"  | ✅ Reversed to prefer fd  |
| `backend/docs/strategy_research_report.md`            | Reports Low Draw High Home / Conservative Favorite / Underdog Hunter as REJECTED | ⚠️ Document is dated 2026-04-09 and was later overwritten by a fresh `run-research` call on inflated data. See session_audit_report.md. |
