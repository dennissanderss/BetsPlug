# BetsPlug — Smart API Combination Plan

_Written 2026-04-11 during the v4 audit. Reflects the routing BetsPlug should
adopt after the Stap 2 fixes in this session, and the provider behaviour
verified against live API calls._

## TL;DR

```
football-data.org  =  primary for EVERYTHING that is free on TIER_ONE
                      (fixtures, results, standings, squads, 1X2 odds)
API-Football       =  OFF by default — its free tier can't serve the
                      current season. Enable only behind the env flag
                      FOOTBALL_DATA_FORCE_API_FOOTBALL=true, which you only
                      set once you have a paid API-Football plan.
The Odds API       =  future enrichment for Over/Under, BTTS, handicap odds.
                      Not wired up yet. Free tier 500 req/month ≈ 16/day.
OpenLigaDB         =  emergency fallback for German leagues only; not in
                      the primary rotation.
```

---

## 1. Data-type routing

| Data type                  | Primary          | Fallback         | Cache TTL    | Why                                       |
|----------------------------|------------------|------------------|-------------:|-------------------------------------------|
| Upcoming fixtures          | football-data    | OpenLigaDB (BL only) | 6 h       | Free, current season, covers all 7 leagues |
| Live scores (finished)     | football-data    | OpenLigaDB (BL)  | 60 s (only for in-play, else 2 h) | Same source gives goals + half-time |
| Historical results         | football-data    | —                | 24 h         | Stable, cache long                        |
| Standings / league table   | football-data    | —                | 12 h         | Updated daily                             |
| Team season stats          | football-data    | —                | 12 h         | Derived from standings                    |
| Squads / player lists      | football-data    | —                | 24 h         | Slow-changing                             |
| Pre-match 1X2 odds         | football-data    | The Odds API     | 2 h          | fd now ships odds per match; Odds API is richer |
| Over/Under 2.5 odds        | The Odds API     | —                | 2 h          | Not in fd free tier                       |
| BTTS odds                  | The Odds API paid | —                | 2 h          | Free tier limited                         |
| Live / in-play odds        | The Odds API paid | —                | 60 s         | Only if we decide to build live trading   |
| xG / shots / detailed stats | API-Football Pro | —                | 24 h         | Paid only; not used in free baseline      |

The Strap 2 changes in `data_sync_service.py` already implement the primary
column for everything except the Odds API rows (which are future work).

## 2. Request budget (per provider, under the new routing)

| Provider           | Calls per sync cycle | Sync frequency | Calls/day | Cap         | Headroom |
|--------------------|---------------------:|---------------:|----------:|------------:|---------:|
| football-data.org  | 2 (upcoming + results) × 7 leagues = 14 per 70-min cycle | every 5 min | **≈ 400**  | 14 400/day (10/min) | 36× |
| API-Football       | 0 (disabled)         | —              | 0         | 100/day     | —        |
| The Odds API       | ~14 per day (once per league per day) | daily | **≈ 14** | 16/day (=500/mo) | 12% |
| OpenLigaDB         | 0 (not in rotation)  | —              | 0         | unlimited   | —        |

The football-data.org number assumes the current `_COMPETITION_ROTATION` of
`["PL","PD","BL1","SA","FL1","CL","DED"]` and the Celery beat cadence that
runs `sync_upcoming_matches` + `sync_recent_results` every 5 minutes. We
churn through all 7 leagues in ~35 minutes. At 10 requests / 5-minute
window that's 2 requests / second peak, well inside the 10/min ceiling.

## 3. Caching policy (post-fix)

All caching is via Redis through `backend/app/core/cache.py`. Rules:

| Key prefix                 | TTL       | Invalidation trigger                |
|----------------------------|----------:|-------------------------------------|
| `strategy:metrics:{id}`    | 900 s     | Explicit bust on validation-refresh |
| `strategy:today:{id}`      | 600 s     | Explicit bust on validation-refresh |
| `fixtures:upcoming:{league}` | 21 600 s (6 h) | After sync job writes new rows |
| `fixtures:results:{league}`  | 1 800 s (30 m) | After sync job marks as finished |
| `standings:{league}:{season}` | 43 200 s (12 h) | sync_standings               |
| `odds:match:{match_id}`    | 7 200 s (2 h) | new odds row upserted              |

All of these exist in code today except the last three, which are
described in `api_coverage_audit.md` gap analysis.

## 4. Next implementation steps (post-session)

Concrete, in order, for the next working session. Nothing below is done yet.

1. **Verify production sync picks up Eredivisie.** After Railway redeploys
   this branch, hit
   ```
   POST https://betsplug-production.up.railway.app/api/admin/sync
   ```
   (admin-only; authenticate as Dennis) and then
   ```
   GET  https://betsplug-production.up.railway.app/api/fixtures/upcoming
   ```
   The `fixtures` array should now include both Eredivisie and Bundesliga
   upcoming matches.
2. **Run validation refresh once.**
   ```
   POST https://betsplug-production.up.railway.app/api/strategies/validation-refresh
   ```
   This walks every strategy, applies the new plausibility gates, and sets
   `is_active` accordingly. Expect 5 of 6 currently-active strategies to
   flip to `under_investigation`.
3. **Document the API contract change for the frontend dev.** See
   `backend/API_CONTRACT.md` — updated in this session.
4. **Fix the Elo leakage (separate session).** Design in
   `docs/session_audit_report.md` §"Honest path forward".
5. **Wire up The Odds API** once the Elo fix lands, starting with the
   `totals` (Over/Under) market. This is purely additive — existing 1X2 odds
   from football-data.org keep flowing.
6. **Only after steps 1-5** is it honest to talk about upgrading to
   API-Football Pro ($19/mo) for richer features. Without the Elo fix, any
   new features inherit the same leakage.
