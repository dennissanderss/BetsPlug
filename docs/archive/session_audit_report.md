# BetsPlug — Session Audit & Validation Report

_Session date: 2026-04-11. Scope: provider audit, Eredivisie gap fix,
strategy validation, market research, API combination plan. Master prompt:
v4 (Dennis)._

## Executive summary

Four hard findings, one hard fix, one hard relabelling:

1. **Five of the six "Profitable" strategies on the live Strategy Lab are
   fake.** Their numbers (e.g. Home Dominant at 74% / +40% ROI on 414
   picks) are impossible for any real 1X2 model. Root cause: the Elo
   sub-model seeds from a hardcoded `team_seeds.py` file that encodes
   present-day team strength, so backfilled historical predictions
   "know" the future. Combined with a hardcoded 1.90 odds assumption in
   the ROI formula, win rates and ROI are double-inflated. Fix in this
   session: new plausibility gates in `/api/strategies/{id}/metrics` that
   clamp suspicious numbers to 0 and add a `validation_status` field,
   plus a new `POST /api/strategies/validation-refresh` endpoint that
   flips `is_active` accordingly.
2. **football-data.org DOES serve Eredivisie on the free TIER_ONE plan.**
   The codebase claimed otherwise with a misleading comment and had
   actively removed Eredivisie from its rotation. Verified live: 38
   scheduled DED matches. Fixed in this session by adding DED to both
   `LEAGUE_SLUG_TO_CODE` in `football_data_org.py` and
   `_COMPETITION_ROTATION` in `data_sync_service.py`.
3. **API-Football free tier cannot serve 2025 or newer seasons.** Verified
   live: `{"plan": "Free plans do not have access to this season, try
   from 2022 to 2024."}`. The DataSyncService was preferring API-Football
   as the primary adapter whenever its key was set, which silently broke
   upcoming-fixture sync for several leagues. Fixed in this session by
   making football-data.org the default and putting API-Football behind
   an explicit `FOOTBALL_DATA_FORCE_API_FOOTBALL=true` env flag.
4. **The fake-numbers problem is NOT a bug in the metrics endpoint, it is
   a bug in the model.** Fixing it properly requires replacing the
   static team seeds with a persistent, walked-forward
   `team_ratings` table. That is a multi-week project, not a
   session-scoped fix. The fixes in this session stop the bleeding so
   the live site no longer shows impossible numbers, but they do not
   magically give BetsPlug a working strategy engine.

**Honest one-line**: BetsPlug's current Strategy Lab is a confident-looking
front-end on top of a model that doesn't work. This session made the
front-end honest. Rebuilding the model is the next project.

---

## Provider audit results (Stap 1)

Full live-test matrix: see `docs/api_coverage_audit.md`.

Key facts, verified with ≤ 4 total live API calls to stay inside the
session's 30-call API-Football budget:

- **Football-data.org free TIER_ONE** covers **all 7 target leagues**,
  including Eredivisie (DED). Verified: `GET
  /v4/competitions/DED/matches?status=SCHEDULED` → HTTP 200, 38 matches.
- **API-Football free** refuses 2025+ season data entirely. Works only
  for 2022-2024 (verified with date-range query on 2023-08-01..2023-08-15
  returning 9 results). The `last=N` convenience param is also blocked.
- **The Odds API** key not configured locally; adapter supports all 7
  target leagues per `LEAGUE_TO_SPORT_KEY`. Not wired up yet.
- **OpenLigaDB** is free/keyless but only covers German football.

Production DB state at session start:

| Metric               | Count |
|----------------------|------:|
| Scheduled fixtures   | 83    |
| Finished fixtures    | 3 739 |
| Predictions in DB    | 4 020 |

Upcoming-fixtures breakdown by league (production, 2026-04-11):

```
Premier League    : 9
La Liga           : 9
Serie A           : 11
Ligue 1           : 6
Champions League  : 4
Bundesliga        : 0   ← gap
Eredivisie        : 0   ← gap
```

Last-7-days finished fixtures (production, same query):

```
La Liga     : 9
Serie A     : 10
Ligue 1     : 8
Bundesliga  : 9
Eredivisie  : 9
Premier L   : 0
```

The Eredivisie + Bundesliga gaps are specifically in **upcoming** fixtures,
which is consistent with the `DataSyncService` bug diagnosed above: when
API-Football is the primary adapter, `sync_upcoming_matches` hits the
2025/26-season restriction and returns empty, so no new rows get written
for leagues that happen to rotate through the upcoming-sync slot. Recent
results seem to come through a different code path (e.g. manual
`admin_backfill` runs via football-data.org) which explains why historical
Bundesliga/Eredivisie data is present.

---

## Eredivisie fix (Stap 2)

### Diagnosis

Scenario **A** ("provider returns it but we don't sync it") combined with
a separate scenario **C** ("primary adapter can't serve the current
season"). Two small changes fix both:

1. `backend/app/ingestion/adapters/football_data_org.py` — added
   `"eredivisie": "DED"` to `LEAGUE_SLUG_TO_CODE` and a matching entry in
   `COMPETITION_META`.
2. `backend/app/services/data_sync_service.py`:
   - Added `"DED"` to `_COMPETITION_ROTATION`.
   - Reversed adapter preference: `football_data_org` is now the default
     primary; `api_football` only runs when the
     `FOOTBALL_DATA_FORCE_API_FOOTBALL` env var is set to a truthy value
     (for when Dennis upgrades to a paid API-Football plan in future).
   - Added an explicit `RuntimeError` when neither key is configured so
     we fail fast instead of silently no-opping.

### Post-deploy verification steps

1. Wait for Railway to finish redeploying.
2. Hit `POST https://betsplug-production.up.railway.app/api/admin/sync`
   (admin-authenticated) at least 3 times with 10s gaps, so the rotation
   visits DED.
3. Query `GET /api/fixtures/upcoming` — the `fixtures` array should now
   include Eredivisie matches.
4. Query `GET /api/search/?q=Feyenoord` — should return both a team hit
   and several upcoming-match hits (pre-fix it only returned historical
   matches).

---

## Strategy validation — the hard findings (Stap 3)

Full write-up with code excerpts: `docs/strategy_validation_report_v2.md`.

### Summary of verdicts (new plausibility gates)

| Strategy              | Sample | Raw winrate | Raw ROI | **New status**         |
|-----------------------|-------:|------------:|--------:|------------------------|
| Low Draw High Home    | 420    | 72.62%      | +37.98% | **under_investigation** |
| Home Dominant         | 414    | 74.15%      | +40.89% | **under_investigation** |
| Conservative Favorite | 425    | 70.35%      | +33.67% | **under_investigation** |
| Strong Home Favorite  | 754    | 68.30%      | +29.77% | **under_investigation** |
| Anti-Draw Filter      | 776    | 67.27%      | +27.81% | **under_investigation** |
| Underdog Hunter       | 649    | 55.62%      | +5.69%  | validated  *(see caveat)* |

Five of the six flipped from "Profitable" (displayed on the live site) to
`under_investigation`. Only Underdog Hunter survives the new gates, and
even that is provisional — the leakage in the underlying model biases
towards home favorites, so a strategy picking *away* teams sneaks under
the radar but is still sitting on the same leaky sample.

### Root cause (condensed)

```
forecast_service._run_model()          # instantiates fresh model per request
  → EloModel.__init__  sets  self.ratings = {}
  → predict()  finds team_id not in ratings
  → _seed_elo_from_context()  consults team_seeds.TEAM_SEED_ELO
  → returns hardcoded Manchester-City=1780, Feyenoord=1700, Sheffield-Utd=1460
  → those seeds were written with 2024/25 & 2025/26 knowledge
  → backfilled predictions for *historical* matches use them anyway
  → "predicted" outcomes correlate suspiciously well with actual outcomes
```

Plus the metric inflation layer:

```
/strategies/{id}/metrics computes ROI assuming flat 1.90 odds (0.9 profit/win).
The strategies it evaluates overwhelmingly pick home favorites whose real
market odds are more like 1.30-1.60. So the 40%+ ROI numbers are 2-3x
what the strategies would produce at true market prices, even if the
underlying winrate were real.
```

### Fixes shipped in this session

1. New `_compute_validation_status()` helper in
   `backend/app/api/routes/strategies.py` with blunt plausibility gates:
   - `winrate > 0.58 → under_investigation`
   - `roi > 0.08 → under_investigation`
   - `roi < -0.02 → rejected`
   - `roi > 0.02 → validated`
2. `/metrics` response now includes `validation_status`,
   `validation_notes`, `raw_winrate`, `raw_roi`. Display fields
   (`winrate`, `roi`) are **clamped to 0.0** when status is
   `under_investigation`, so the existing frontend's `roi > 0` badge
   logic naturally stops saying "Profitable".
3. New `POST /api/strategies/validation-refresh` admin endpoint that
   recomputes every strategy, applies the gates, flips `is_active`, and
   busts the Redis metric cache.
4. Frontend-contract documentation added to `backend/API_CONTRACT.md`.

### Post-deploy verification steps

1. Wait for Railway redeploy.
2. Call `POST https://betsplug-production.up.railway.app/api/strategies/validation-refresh`.
3. Expect response summary with:
   - `validated: 1`
   - `under_investigation: 5`
   - 5 strategies with `"flipped": true`
4. Reload the Strategy Lab page on betsplug.com. The five inflated
   strategies should no longer show "Profitable" badges (they'll show as
   having `roi = 0`, which the existing UI treats as neutral /
   archived).
5. The frontend developer then uses the `validation_status` field from
   `API_CONTRACT.md` to add a proper "Under Investigation" badge in the
   next frontend deploy.

---

## Data gap analysis (Stap 4)

See `docs/api_coverage_audit.md` §3. Top three gaps, ranked:

1. **Persistent historical Elo ratings** — not a provider gap, an internal
   gap. Blocks every honest validation.
2. **Real historical 1X2 odds** — The Odds API historical plan (~$30/mo)
   or self-built from daily snapshots of current odds.
3. **xG / detailed match stats** — API-Football Pro ($19/mo) or scraping
   from Understat/FBref.

No paid upgrades recommended **yet** — the Elo fix is a bigger lever and
any new feature built on top of the current model inherits the same
leakage.

---

## Market research (Stap 5)

See `docs/market_research.md`. Short version:

| Priority | Market           | Blocked by                      |
|---------:|------------------|---------------------------------|
| 1        | Over/Under 2.5   | Elo leakage fix                 |
| 2        | BTTS             | Elo leakage fix                 |
| 3        | Asian Handicap   | Worth doing after 1+2 land      |
| skip     | Half-time / Correct Score / Player Props | Too niche or data-heavy |

---

## Smart API combination plan (Stap 6)

See `docs/api_combination_plan.md`. Core routing after the Stap 2 fixes:

```
fixtures / results / standings / squads / 1X2 odds  →  football-data.org (free)
Over/Under odds   →  The Odds API free tier (future work)
Live odds + xG    →  API-Football Pro (future work, not in budget yet)
```

Request budget: ~400 fd calls/day (2.8% of the 14 400/day cap), 0
API-Football calls, future ~14 Odds API calls/day (free tier).

---

## Recommendations for Dennis

### Must happen NOW (before the next user sees the site)

1. **Merge and deploy this session's backend changes.**
   - Eredivisie fix.
   - Adapter preference reversal.
   - Strategy validation gates + refresh endpoint.
2. **After the deploy finishes**, run the validation-refresh endpoint:
   ```bash
   curl -X POST https://betsplug-production.up.railway.app/api/strategies/validation-refresh
   ```
   The response should show 5 strategies flipping to
   `under_investigation`. If it doesn't, something is wrong with the
   deploy — ping me again.
3. **Hit the admin sync endpoint** once Railway is up:
   ```bash
   curl -X POST -H "Authorization: Bearer $TOKEN" \
     https://betsplug-production.up.railway.app/api/admin/sync
   ```
   Repeat a few times so the rotation touches all 7 leagues. Verify
   Eredivisie fixtures show up in `/api/fixtures/upcoming`.

### Within 1-2 weeks

4. **Frontend change** (your frontend dev, not me): read the new
   `validation_status` field from `/metrics` and render a proper "Under
   Investigation" badge for non-`validated` strategies. Spec is in
   `backend/API_CONTRACT.md`. Until that ships, the fix in this session
   is what's keeping the fake "Profitable" labels off the site — but
   only via the roi-clamp trick, which is a little hacky.
5. **Start the Elo rebuild project.** See §"Honest path forward" below.

### Deferrable

6. **Upgrade to API-Football Pro** ($19/mo) only after the Elo rebuild is
   done and delivering honest numbers. Otherwise the extra data just
   inherits the leakage.
7. **Start the Over/Under 2.5 market** only after the Elo rebuild.
8. **Historical odds feed** ($30/mo) same — wait for the model fix.

---

## Honest path forward — fixing the Elo leakage for real

Rough sketch of the rebuild project (separate session, probably a week
of work):

1. **New table**: `team_ratings(team_id, as_of_date, elo_rating,
   points, goal_diff)`. Index on `(team_id, as_of_date desc)`.
2. **New service method** `EloTrainer.rebuild_all()` that walks every
   finished match in chronological order by league, updates Elo after
   each match using the current `update_ratings` logic, and writes a
   rating snapshot to the new table on each day that has at least one
   match. Runs as a one-off script, not in the hot path.
3. **Modify `EloModel.predict`** to call
   ```python
   rating = db.query(TeamRating).filter(
     TeamRating.team_id == home_id,
     TeamRating.as_of_date < match.scheduled_at.date(),
   ).order_by(TeamRating.as_of_date.desc()).first()
   ```
   and to **remove** the fallback to `team_seeds.py` entirely.
4. **Delete `backend/app/forecasting/team_seeds.py`.** It is the source
   of leakage. Document the deletion in the commit message.
5. **Wipe and regenerate all predictions**. This is destructive — confirm
   with Dennis before running. Scope: `predictions` +
   `prediction_evaluations` + `prediction_explanations` tables only.
   Do NOT touch `matches` / `match_results` / `standings_snapshots`.
6. **Re-run `/api/strategies/validation-refresh`** to recompute all
   strategy metrics against the new (non-leaky) predictions.
7. **Expect the numbers to collapse** to something much less flattering
   (winrates in the 48-54% range, ROIs close to zero or negative). That
   is the truth. Adjust the Strategy Lab copy to reflect it.
8. **Only after step 7**, consider re-enabling `is_active = true` for any
   strategy that still shows a genuinely positive ROI on 200+ samples.

## Honest assessment

**What's good about BetsPlug right now:**
- The ingestion pipeline, deduplication, adapter registry, and async
  SQLAlchemy setup are all solid and well-structured.
- The `strategy_engine.evaluate_strategy()` rule evaluator is correct.
- The API design (typed schemas, OpenAPI, Celery tasks, Redis caching)
  is professional.
- The fixture/search/teams data flow works and the Eredivisie gap is
  now small.

**What's broken:**
- The forecasting model has feature leakage baked into
  `team_seeds.py`.
- The strategy metrics inflate ROI with a wrong flat-odds assumption.
- The last `run-research` call silently upgraded strategies that the
  previous research report had explicitly rejected — there's no
  diff/journal on the `is_active` column to catch that.
- The frontend happily displayed those upgraded labels.

**What's urgent (in order):**
1. Deploy this session's backend fixes. (Today.)
2. Run `validation-refresh`. (Today, after deploy.)
3. Frontend "Under Investigation" badge. (This week.)
4. Elo rebuild project. (Start next week.)

**What can wait:**
- New markets (Over/Under, BTTS).
- Paid API plans.
- xG data.
- Additional leagues beyond the current 7.

**What you should NOT do:**
- Don't run `POST /api/admin/research/run-research` again while the
  leakage is unfixed — it will just re-validate the same leaky
  strategies against the same leaky data and defeat the honest gates we
  just put in place.
- Don't raise the `_LEAKAGE_WINRATE_CEILING` / `_LEAKAGE_ROI_CEILING`
  constants to let "almost-validated" strategies through. The ceilings
  are deliberately strict because every number in the database is
  compromised right now.
- Don't ship the Strategy Lab to new users with the current fake
  numbers in hope of getting retention signal. It's the fastest way to
  lose trust once someone notices the impossible ROIs.

---

## Metrics of this session

- Files changed: 4 code + 6 docs (this report + 4 docs files + API_CONTRACT)
- API budget used: 2 football-data.org calls, 2 API-Football calls (of 30)
- External DB access: none (used public HTTP endpoints only)
- Destructive DB operations: none
- Frontend changes: none (per the session rules)
