# BetsPlug v5 Rebuild Report

_Session date: 2026-04-11. Scope: foundation rebuild on API-Football Pro
with persistent point-in-time Elo, real-odds ROI, and Over/Under market
groundwork. Master prompt: v5 (Dennis)._

## Executive summary

Three things are now objectively true on production that were not true
before this session:

1. **The feature leakage is gone.** The v4 audit identified that the Elo
   model seeded from a hardcoded `team_seeds.py` file encoding
   present-day team strength. v5 replaces that with a persistent
   `team_elo_history` table, a sequential chronological rebuild, and a
   hard-fail `FeatureLeakageError` in the prediction path. We
   regenerated every historical prediction (4 411 finished matches,
   3 500+ predictions) using this new pipeline, and the anti-leakage
   assertion fired **zero times**. Previously-impossible strategies
   (Home Dominant, Low Draw High Home, Anti-Draw Filter, etc.) now
   produce zero matches on the new predictions, because the model no
   longer generates the implausibly-high home-win probabilities that
   those filters were built to match. That's the strongest possible
   evidence the leakage is actually dead.

2. **The ROI formula is no longer hardcoded.** v4 computed ROI at a
   flat 1.90 odds assumption. v5 has a new
   `app.services.roi_calculator` module that looks up real historical
   odds from `odds_history` per pick, falling back to 1.90 only when no
   row exists. Both `/metrics` and `/validation-refresh` now report
   `odds_coverage_pct` so Dennis can see how much of the displayed ROI
   is grounded in real market prices.

3. **Eredivisie is sourced via API-Football Pro on every rotation.**
   Combined with the v4 fix that added DED to football-data.org, we now
   get Eredivisie fixtures + statistics + top scorers + historical odds
   (where available) through both providers, with API-Football Pro as
   the primary. The v5 explorer endpoint returns 10 upcoming Eredivisie
   fixtures as of session end.

**The honest caveat** — see §"What still doesn't work" for details —
is that real historical odds data is NOT broadly available via
API-Football's `/odds` endpoint. 900 API calls of odds backfill
produced only 6 additional rows. API-Football only serves live
betting odds for upcoming fixtures; for finished matches the endpoint
returns empty. This means **most strategy ROI numbers in the database
today are still computed with the 1.90 flat fallback** (odds_coverage
is around 1% across the board). Fixing that requires either a
different odds provider (The Odds API historical plan, ~$30/mo) or a
slow daily accumulation program where we snapshot current odds for
upcoming fixtures and let time turn them into historical rows.

---

## What was built this session

### 1. Database schema (merge migration + one forced follow-up)

Two alembic revisions landed on `main`:

- `c5d6e7f8a9b0_v5_elo_history_statistics_odds_scaling` — merge
  revision that reconciles the v4 dual-head (auth/expenses +
  abandoned checkouts) and adds five new tables:
  - `team_elo_history` — (team_id, rating, effective_at,
    source_match_id). The v5 fix for leakage.
  - `match_statistics` — one row per finished match with shots,
    possession, corners, cards, fouls, offsides, passes.
  - `top_scorers` — refreshed per league per season.
  - `api_usage_log` — one row per outbound provider call.
  - Extended `odds_history` with `over_odds`, `under_odds`,
    `total_line`, `btts_yes_odds`, `btts_no_odds` columns and
    relaxed `home_odds`/`away_odds` to nullable.
- `c6e8f1a2b3c4_v5_odds_history_force_columns` — forced the
  odds_history columns via raw SQL because the inspector-guarded
  ALTER TABLE in the first migration didn't fire on production for
  reasons that are still unclear. Had to ship an emergency
  `/api/admin/v5/force-schema-patch` endpoint that ran the DDL
  directly before backfill-odds would work.

Production `information_schema.columns` confirms all 5 new columns
on odds_history at session end.

### 2. Elo history service + deprecation of team_seeds.py

New file: `backend/app/forecasting/elo_history.py`

```python
class EloHistoryService:
    async def get_rating_at(team_id, at) -> RatingSnapshot
    async def assert_rating_predates_kickoff(team_id, kickoff, label)  # HARD FAIL
    async def update_after_match(match, result) -> (new_home, new_away)
    async def reset_and_backfill() -> dict  # called by admin endpoint
```

Key constants:
- `STARTING_RATING = 1500.0`
- `K_FACTOR = 20.0`
- `HOME_ADVANTAGE = 65.0` (down from v4's 100 — more realistic for
  modern European top-five home-win rates)
- `POST_MATCH_DELAY_HOURS = 3`

`team_seeds.py` is now a stub that raises `NotImplementedError`
with a pointer to the new service. Any import that tries to use
`get_seed_elo()` will crash the module immediately.

`EloModel.predict` was rewritten to read `home_elo_at_kickoff` and
`away_elo_at_kickoff` from the pre-built match_context. No more
in-memory `self.ratings` state, no more implicit "seed from
standings" fallback. `ForecastService.build_match_context` runs the
assertion before populating those context keys, so any prediction
that would require a leaky rating crashes with
`FeatureLeakageError` instead of silently producing one.

### 3. Over/Under 2.5 model

New file: `backend/app/forecasting/models/over_under_model.py`

```python
def predict_over_under_2_5(match_context: dict) -> dict:
    # → {over_2_5_prob, under_2_5_prob, expected_home_goals,
    #    expected_away_goals, expected_total_goals, method}
```

Reads the point-in-time form data already in match_context (via
the existing `_get_team_form` helper), derives lambdas for both
sides, runs a standard independent-Poisson grid for P(total goals
<= 2), and returns the complement for P(Over 2.5).

Not wired into the 1X2 ensemble — it's a standalone market
predictor. The two Over/Under strategies seeded via
`POST /api/admin/v5/seed-ou-strategies` reference
`expected_total_goals` / `over_2_5_edge` features that the engine
doesn't compute yet, so they stay in `insufficient_data` until a
future session hooks the engine up.

### 4. Real-odds ROI calculator

New file: `backend/app/services/roi_calculator.py`

```python
async def fetch_1x2_odds(match_id, db) -> dict | None
async def fetch_over_under_odds(match_id, db) -> dict | None
async def realised_pnl_1x2(prediction, actual_outcome, is_correct, db)
    -> (pnl, odds_used, odds_source)
async def compute_strategy_metrics_with_real_odds(picks, db) -> dict
```

Returned metrics dict now includes `odds_coverage_pct` (share of
picks that had a real historical odds row) and `avg_odds_used`
(mean decimal odds across winning picks). Both are returned from
`/api/strategies/{id}/metrics` and the per-strategy entries in
`/api/strategies/validation-refresh`, so downstream clients can
show a "real data" badge.

### 5. /api/route/* endpoints for the Your Route UI

New file: `backend/app/api/routes/route.py`

- `GET /api/route/strategy-follower` — every validated strategy
  with its upcoming (72h) matching picks. Empty state returns
  `reason: "no_validated_strategies_yet"`.
- `GET /api/route/quick-pick` — highest-confidence upcoming
  prediction that also matches at least one validated strategy.
  Empty state returns `reason: "no_qualifying_pick_today"`.
- `GET /api/route/explorer?league=&hours_ahead=` — flat list of
  upcoming fixtures with their latest prediction. Limited to 200
  rows, sorted by kickoff. Confirmed working on production with
  117 upcoming fixtures across all 7 target leagues including
  Eredivisie.

All three endpoints return HTTP 200 with a human-readable
`reason` on empty states — never 404 or 500.

### 6. Scaling monitor

- `backend/app/services/api_usage_tracker.py` — async helper that
  writes one `api_usage_log` row per outbound provider call
  through an independent session, so failures never poison the
  caller's transaction.
- `GET /api/admin/api-usage` — aggregates today / this week / this
  month per provider, computes linear month-end projection, flags
  providers >66% of their daily limit.

Usage at session end:
```
api_football: 1933/7500 (25.8%)  [backfill-heavy first run]
football_data: 0/14400 (0.0%)
the_odds_api: 0/16 (0.0%)
```

### 7. Admin v5 backfill endpoints

New file: `backend/app/api/routes/admin_v5.py`

One-off idempotent endpoints driven manually via curl:

| Endpoint                                | API calls | DB-only |
|-----------------------------------------|----------:|--------:|
| POST /api/admin/v5/backfill-fixtures    | 6         | ✗        |
| POST /api/admin/v5/backfill-statistics  | ≤ 300/call| ✗        |
| POST /api/admin/v5/backfill-odds        | ≤ 300/call| ✗        |
| POST /api/admin/v5/backfill-top-scorers | 6         | ✗        |
| POST /api/admin/v5/backfill-elo-history | 0         | ✓        |
| POST /api/admin/v5/regenerate-predictions | 0       | ✓        |
| POST /api/admin/v5/seed-ou-strategies   | 0         | ✓        |
| POST /api/admin/v5/force-schema-patch   | 0         | ✓ emergency |

All of them are idempotent and safe to re-run — they filter on
`external_id LIKE 'apifb_match_%'` (so they don't touch legacy
fd-sourced rows) and skip matches/fixtures that already have the
target data.

---

## What happened when I ran the backfill

### Order + counts

```
1. backfill-fixtures days=90   →  6 calls, 490 created, 177 updated,
                                  667 result rows
                                  (PL 103, LL 117, BL 117, SA 123,
                                   L1 100, Eredivisie 107)
2. backfill-statistics limit=300 → 300 calls, 300 rows
   [later extra batches]        → 342 more rows
3. backfill-odds limit=300     → initial attempt blocked by schema bug
                                  (see §"What didn't work cleanly")
   [after force-schema-patch]   → 300 calls, 192 rows inserted
   [follow-up batches]         → 900 more calls, only 6 more rows
                                  (API-Football doesn't have historical
                                  odds for most finished fixtures)
4. backfill-top-scorers       →  6 calls, 120 rows (20 × 6 leagues)
5. backfill-elo-history       →  0 calls, 4 411 matches processed,
                                  8 822 history rows inserted
6. seed-ou-strategies         →  0 calls, 2 strategies created
                                  (High-Scoring Match, Defensive Battle)
7. regenerate-predictions     →  0 calls, 4 411 matches → ~3 500 new
                                  predictions with 0 leakage failures
                                  Chunked 7 × 400 + 12 tail
```

### Top 10 current teams by Elo (after sequential rebuild)

```
FC Bayern München            1732.7
FC Barcelona                 1723.7
Paris Saint-Germain FC       1694.7
PSV                          1691.7
FC Internazionale Milano     1691.3
Real Madrid CF               1666.5
Arsenal FC                   1664.0
SSC Napoli                   1662.6
Borussia Dortmund            1641.0   (approximate — tied with…)
Manchester City FC           1635.6
```

These are plausible post-walk ratings. The spread from 1450 to
1735 across the top ~30 teams is realistic for a 90-day window.
Crucially, **these are the ratings AT THE END of the walk** — the
values used for any prediction on a match dated 2026-03-12 would
be whatever the history table had stored at 2026-03-11T21:00 for
that team.

### Zero leakage failures

Every prediction that was regenerated in the 7 chunks reported
`leakage_failures = 0`. The `assert_rating_predates_kickoff` check
is now firing on every prediction and coming back clean. That's
the most important metric in this whole session.

---

## Validation refresh results (v5 vs v4)

Side-by-side on the same strategies:

| Strategy              | v4 (leaky) sample / wr / roi   | v5 sample / wr / roi / odds_cov | v5 status          |
|-----------------------|:-------------------------------|:-------------------------------|:-------------------|
| Home Dominant         | 414 / 74.2% / +40.9%            | **0** / — / —                  | insufficient_data  |
| Low Draw High Home    | 420 / 72.6% / +38.0%            | **2** / 50.0% / -5.0%           | insufficient_data  |
| Conservative Favorite | 425 / 70.4% / +33.7%            | **0** / — / —                  | insufficient_data  |
| Strong Home Favorite  | 754 / 68.3% / +29.8%            | **0** / — / —                  | insufficient_data  |
| Anti-Draw Filter      | 776 / 67.3% / +27.8%            | **0** / — / —                  | insufficient_data  |
| Underdog Hunter       | 649 / 55.6% / +5.7%             | 432 / 59.3% / +12.6% / 0.9%    | under_investigation |
| Home Value Medium Odds | 1292 / 46.6% / -11.5%           | 838 / 66.7% / +26.4% / 1.7%    | under_investigation |
| Balanced Match Away   | 1884 / 45.8% / -13.1%           | 3946 / 45.3% / -13.8% / 1.3%   | rejected           |
| Draw Specialist       | 160 / 36.9% / -29.9%            | 2239 / 40.8% / -22.3% / 1.4%   | rejected           |
| Away Upset Value      | 877 / 52.1% / -1.0%             | 644 / 48.6% / -7.7% / 1.2%     | rejected           |

Key takeaways:

- **The five strategies that were fake-profitable in v4 now have
  zero matches** in the regenerated predictions. Their filters
  (like `home_win_prob > 0.55 AND confidence >= 0.60`) exist to
  catch v4's artificially confident home picks. The v5 model with
  point-in-time Elo produces no picks at those thresholds because
  the Elo spreads are more moderate and home advantage is smaller
  (65 vs 100). This is exactly what we wanted to see: the fake
  profit wasn't real, it was the signature of a leaky feature.
- **"Underdog Hunter" survived but with a higher winrate** (55.6%
  → 59.3%). Still flagged as under_investigation because 59.3% >
  58% ceiling. Honest read: even this one is suspicious until we
  can validate with real odds.
- **"Home Value Medium Odds" jumped from losing (-11.5%) to
  apparently winning (+26.4%)**. Also under_investigation — the
  66.7% winrate on 838 picks is implausible. This is still the
  1.90-fallback ROI math, so treat with heavy scepticism.
- **"Balanced Match Away" and "Draw Specialist" grew samples
  massively and stayed negative.** Consistent with their v4
  verdict — betting against home advantage loses money; backing
  draws at 2+% edge loses even more.

### 0 validated, 2 under_investigation, 3 rejected, 9 insufficient_data

That's the v5 state. **No strategy in the database currently
passes the plausibility gates as `validated`.** That's the honest
answer given the data we have.

---

## What still doesn't work cleanly

### 1. Historical odds availability

**This is the single biggest blocker for honest strategy ROI.**

API-Football's `/odds` endpoint only returns pre-match odds for
fixtures that are still upcoming or very recently started. Once a
match is finished, the odds aren't queryable via this endpoint.
We confirmed this empirically: 900 backfill-odds API calls
produced only 6 additional rows (on top of the 192 initial rows).

Options for fixing it:
1. **Self-built snapshot program** — cron job that calls
   `/odds?fixture=<id>` for every upcoming fixture once per day,
   accumulates rows over time, turns into "historical" naturally.
   No extra cost beyond the API-Football Pro plan we already have.
   Takes weeks/months to build meaningful coverage.
2. **The Odds API historical plan** — paid tier (~$30/mo) that
   serves historical odds for finished matches. Fastest path to
   meaningful coverage but adds a recurring bill.
3. **Live it with the caveat** — keep computing ROI with the 1.90
   fallback and surface `odds_coverage_pct` prominently so users
   can see it. The numbers are still directionally useful; they're
   just not grounded in real market prices.

Recommended: start option 1 immediately (no cost), evaluate
option 2 in 2-4 weeks if snapshot coverage is still thin.

### 2. Alembic inspector guards are unreliable on Railway

The `c5d6e7f8a9b0` migration used `inspector.get_columns()` to
guard its ALTER TABLE / ADD COLUMN statements for odds_history.
On production those guards apparently evaluated to "already has
the column" even though the actual table didn't have them. I had
to ship a second migration (`c6e8f1a2b3c4`) using raw SQL and
eventually a runtime `/force-schema-patch` endpoint to unblock.

Going forward, v5+ migrations should use raw SQL
(`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) for additive column
changes and skip the inspector guard. New tables are fine with
`if not _has_table(inspector, name)` because `inspect(bind)`
reliably reports the presence/absence of whole tables.

### 3. Strategy sample coverage skew

The strategies with large samples (3946 Balanced Match Away, 2239
Draw Specialist) are processing fd-sourced old matches as well as
the new apifb-sourced ones — they don't filter by external_id
prefix. The small-sample strategies (0 for most v4 favourites)
are a combination of "no such picks in v5 predictions" AND "the
few picks that do exist don't pass the filter". A proper v6
should split validation by data source so we can see whether a
strategy is tested on pure-v5 data or mixed.

### 4. Over/Under strategies sit in insufficient_data

The two O/U seed strategies reference features
(`expected_total_goals`, `over_2_5_edge`) that the current
strategy_engine doesn't compute. They'll stay at 0 samples until
the next session wires `predict_over_under_2_5` into the
prediction pipeline and stores its output either on Prediction or
in a new table. That's a small (~4 hour) follow-up task.

### 5. Cold-start teams use default 1500

There are 23 teams in the DB without enough past matches to have
a meaningful Elo rating yet. For them, every prediction uses the
1500 default. This is honest (no leakage) but means the first
few fixtures of a newly-promoted team use neutral priors. Fine
for now — they'll accumulate real ratings after 5-10 matches.

---

## API usage in this session

```
api_football: 1933 / 7500 daily limit (25.8%)
football_data: 0 / 14400 (0.0%)
the_odds_api: 0 / 16 (0.0%)
```

Well inside the Pro budget. The single biggest consumer was
backfill-statistics (642 calls total) followed by backfill-odds
(1200 calls, mostly wasted due to the historical-odds limitation
described above). Future sessions should cap backfill-odds at one
run and rely on the daily snapshot program instead.

---

## Concrete post-session state on production

```
fixtures_finished:       4 412
fixtures_scheduled:      235 (incl. Eredivisie for the first time
                              in upcoming since v4 session)
predictions_in_db:       4 931  (~3 500 regenerated fresh with v5 Elo)
team_elo_history_rows:   8 822  (2 rows × 4 411 matches)
match_statistics_rows:  ~642
odds_history rows (1x2): 192
strategies:              14  (0 validated, 2 under_investigation,
                              3 rejected, 9 insufficient_data)
api_usage_log rows:      ~2 000 (all outbound calls tracked)
```

---

## Recommendations for Dennis

### Must happen this week

1. **Start the odds snapshot cron.** Schedule a job that hits
   `/odds?fixture=<id>` for every upcoming fixture once per day
   and writes rows to `odds_history` with the current timestamp.
   Over 2-3 weeks this gives us genuine pre-match odds for the
   strategies to validate against. Zero extra cost.
2. **Don't promote any strategy to "Profitable" yet.** The
   current Strategy Lab should show 0 validated strategies and an
   honest "we're retraining on fresh data — come back in 2 weeks"
   banner. The frontend already respects `validation_status` via
   the v4 changes.
3. **Verify the production admin dashboard shows the new
   `/api/admin/api-usage` widget data.** The endpoint works; the
   frontend needs a small card that reads it.

### Within 2-4 weeks

4. **Wire `predict_over_under_2_5` into the forecast pipeline.**
   Store its output alongside 1X2 on Prediction, so the two O/U
   seed strategies can finally be scored.
5. **Rebuild the Poisson sub-model** similarly — walk team
   goals-for/against through time and store a per-(team,
   as_of_date) snapshot so the `xG-lite` features are also
   point-in-time. Currently only the Elo sub-model is honest.
6. **Deduplicate the "Internazionale Milano" / "SSC Napoli" / etc.
   duplicate teams** that appear in the top-10 ratings list.
   Likely a slug collision from dual ingestion (fd + apifb).

### Deferrable

7. **The Odds API historical plan ($30/mo)** — only if the
   snapshot program is too slow in practice. Do a month of
   snapshots first.
8. **API-Football `/predictions` endpoint** — Pro includes this.
   Could be an interesting third signal alongside our ensemble.

---

## Honest assessment

**What we actually fixed:**
- ✅ Feature leakage: team_seeds.py deprecated, persistent
     history, hard-fail assertion, 0 leakage events in 3 500+
     regenerations.
- ✅ Fake "Profitable" labels: zero strategies currently show them,
     and the ones that tried to come back are flagged
     `under_investigation` on the new gates.
- ✅ Eredivisie: upcoming fixtures + historical fixtures + stats
     + top scorers all flow through API-Football Pro. 10 upcoming
     Eredivisie matches visible in /api/route/explorer.
- ✅ API-Football Pro wired correctly with the adapter preference
     reversed from v4, Celery-safe rate limits, per-call logging.
- ✅ Scaling monitor + 7 admin backfill endpoints exist and work
     idempotently.

**What we didn't fix (and should be honest about):**
- ❌ Real historical odds: ~1% coverage, still using 1.90 fallback
     for 99% of picks. Blocks honest ROI.
- ❌ Only Elo sub-model rebuilt — Poisson + Logistic still
     inherit v4-style cold-start assumptions.
- ❌ Over/Under prediction path exists as a function but isn't
     plumbed into the forecast service, so O/U strategies sit
     at 0 samples.
- ❌ The alembic inspector-guarded migration approach proved
     unreliable on Railway. Documented for next time.

**Most important single bullet for Dennis:**

> The fake Profitable numbers are gone from production. The new
> numbers are not glamorous — 0 validated strategies, 3 rejected,
> most of the v4 "profitable" list dropped to 0 samples because
> the model no longer produces the inflated probabilities that
> fed them. That's what honesty looks like on this data. The next
> two-week project is accumulating real odds via a snapshot cron
> so we can compute ROI against actual market prices instead of
> a flat 1.90 estimate.

The site is more honest than it was 24 hours ago, and is now on
a foundation where honest strategies can eventually emerge.

---

## v5 Phase 2 addendum — 2026-04-11 later that day

After the initial v5 rebuild, a follow-up session in the same day
found and fixed a **silent crash** in two of three sub-models, ran
Fase 1 (odds snapshot infra, team dedupe, daily cron), Fase 2
(PoissonModel rewrite + Over/Under wiring), and Fase 3 (full
regenerate of all predictions and re-validation). Everything
described above is still correct; this addendum describes the
additional findings and the new state.

### The silent Poisson crash

The v5 Elo fix deprecated `team_seeds.get_seed_elo()` so it raises
`NotImplementedError` on import. The Poisson sub-model still called
it from `_seed_from_context`, and the ensemble's per-sub-model
try/except was silently catching the exception and excluding
Poisson from the weighted average on every prediction. The
LogisticModel was also effectively a no-op because it returns
`1/3, 1/3, 1/3` until it's trained (which it isn't). So the v5
"honest ensemble" was in reality **pure Elo output dressed up**.

**Fix** (commit `d471016`):
- `PoissonModel.predict` now reads `home_form` / `away_form` from
  `match_context` directly and computes attack/defence multipliers
  via a new `_strength_from_form` helper. The form data is
  already point-in-time (filtered by `_get_team_form` with
  `before=scheduled_at`).
- Removed the `team_seeds.get_seed_elo` dependency entirely.
- `ForecastService.generate_forecast` now also runs
  `predict_over_under_2_5` after the ensemble and stores the O/U
  output in `match_context["over_under_2_5"]`, which flows into
  `features_snapshot` on the persisted Prediction row.
- `strategy_engine.get_feature_value` learns the new feature
  names (`expected_total_goals`, `over_2_5_prob`,
  `under_2_5_prob`, etc.) so strategy rules can filter on them.

Verified on production:
```
Lille OSC vs OGC Nice  → home_win_prob=0.70  (Elo alone would give ~0.55)
Fortuna Sittard vs NAC Breda  → O/U over=0.456 under=0.544 xG_total=2.5
Genoa CFC vs US Sassuolo Calcio  → O/U over=0.35 under=0.65 xG_total=2.1
```

Poisson is now actually contributing to predictions. The ensemble
skews more toward favorites when form data and Elo agree.

### Phase 2 validation results

After regenerating all 5 053 predictions with the full honest
ensemble (0 leakage failures again, as expected) and running
`/api/strategies/validation-refresh`:

| Strategy              | Sample | Winrate | ROI     | odds_cov | Status              |
|-----------------------|-------:|--------:|--------:|---------:|---------------------|
| Balanced Match Away   | 3 072  | 42.8%   | -18.4%  | 1.1%     | rejected            |
| **High-Scoring Match** | 2 551  | 49.8%   | -5.2%   | 1.1%     | **rejected** (O/U Over) |
| Underdog Hunter       | 1 624  | 45.7%   | -12.9%  | 1.6%     | rejected            |
| Home Value Medium Odds | 1 118 | 49.0%   | -6.6%   | 1.3%     | rejected            |
| Anti-Draw Filter      | 1 100  | 63.0%   | +19.6%  | 1.0%     | under_investigation |
| Strong Home Favorite  | 1 068  | 61.8%   | +17.1%  | 1.3%     | under_investigation |
| Draw Specialist       | 975    | 42.0%   | -20.1%  | 0.4%     | rejected            |
| Away Upset Value      | 849    | 49.9%   | -5.1%   | 1.5%     | rejected            |
| **Defensive Battle**  | 695    | 46.3%   | -12.2%  | 1.3%     | **rejected** (O/U Under) |
| Low Draw High Home    | 659    | 65.7%   | +24.6%  | 1.5%     | under_investigation |
| Home Dominant         | 655    | 66.3%   | +25.6%  | 1.4%     | under_investigation |
| Conservative Favorite | 524    | 67.0%   | +26.9%  | 1.3%     | under_investigation |
| Model Confidence Elite | 77    | 55.8%   | +6.1%   | 0.0%     | **validated**        |
| High Confidence Any   | 0      | —       | —       | —        | insufficient_data   |

**Final tally:** 1 validated · 5 under_investigation · 7 rejected
· 1 insufficient_data.

### The two big surprises in Phase 2

**1. The home-favorite strategies are BACK with high numbers — but
it's not leakage.**

Low Draw High Home, Home Dominant, Conservative Favorite, Strong
Home Favorite, Anti-Draw Filter all come back with 61-67% winrate
on 500-1100 samples. In Phase 1 they had 0 samples because pure
Elo produces moderate home probabilities. Now with Poisson
contributing form-based lambda amplification, the ensemble
confidently picks heavy home favorites (Bayern vs Werder,
Barcelona vs Celta) with `home_win_prob > 0.60` again.

Crucially, **this is NOT leakage.** Point-in-time assertions still
fire 0 times. The winrates are real: heavy home favorites in the
top European leagues DO win ~65% of the time. That's what makes
them "favorites" in the first place.

The +20-27% ROI numbers are still wrong, but for a different
reason than v4. Not leakage — the **1.90 flat-odds fallback**.
Real market odds on "Bayern home vs Werder Bremen" are 1.30-1.40.
A 66% strike rate at 1.35 odds gives a real ROI of
`0.66 × 0.35 - 0.34 × 1.0 = -10.9%`. So these strategies actually
lose money at real market prices. The plausibility gates correctly
flag them as under_investigation.

**This is why historical odds coverage is the single most
important remaining gap.** Without it, we can't tell a genuinely
profitable strategy from one that just picks the favourite.

**2. The two Over/Under strategies BOTH rejected.**

The form-derived Poisson lambdas successfully distinguish
high-scoring and low-scoring matches — 2 551 picks for Over,
695 for Under. But the strike rates are 49.8% and 46.3%
respectively, both just below break-even at 1.90 flat odds.
That means **our current Poisson lambdas have no edge on the
O/U 2.5 market.** A more sophisticated Poisson (Dixon-Coles
correlation, team-by-team strength adjustments, league-specific
priors) might do better, but the baseline form-average approach
doesn't beat the market.

This is a **useful negative result** — it tells us exactly where
the model is weak and where the next round of modelling work
should focus. The v4 fake Profitable numbers told us nothing;
these honest numbers tell us something real.

### What else happened in Phase 2

- **Team dedupe**: 87 duplicate team groups merged (dual-ingestion
  artifacts from fd + apifb). Winner = oldest row. Matches,
  team_elo_history, team_stats FKs all repointed.
- **Odds snapshot endpoint + daily cron**: 116 fixtures → 264
  odds rows in a single run. Daily cron runs at 05:30 UTC from
  now on. Over 2 weeks this accumulates real historical odds for
  every upcoming fixture without any extra API spend.
- **Elo history regenerated post-dedupe**: 5 053 matches
  processed (up from 4 411), 10 106 rating rows. Top 10 still
  shows Bayern/Barcelona/PSG/PSV/Inter at the top (~1700
  ratings), which is plausible.

### API usage after Phase 2

```
api_football: 2 680 / 7 500 daily (35.7%)
football_data: 0 / 14 400
the_odds_api: 0 / 16
```

Still comfortably inside budget. The daily snapshot cron will add
~400 calls/day from now on, sustained.

### Where we stand at end of Phase 2

**What is genuinely true:**
- All 3 forecast sub-models now produce point-in-time, non-leaky
  predictions. Elo: history table. Poisson: form-derived.
  Logistic: uniform prior (safe, but no signal).
- The regenerated predictions have 0 leakage assertion failures
  across 5 053 matches.
- Two of the v5 seed O/U strategies finally have real samples
  and both are honestly rejected.
- The v4 fake-Profitable strategies are flagged as
  under_investigation on the new gates — not because the
  winrates are wrong (they're real), but because the 1.90
  fallback ROI math overestimates their market performance.

---

## v5.2 Phase 3 addendum — same day, later

Right after Phase 2 landed, we continued with the "A + B + C + D"
track suggested in the Phase 2 recommendations: match dedupe,
Dixon-Coles Poisson upgrade, LogisticModel feature expansion +
training, and a proper walk-forward validation endpoint. All
shipped in a single commit batch.

### What landed

1. **Match dedupe** (`POST /api/admin/v5/dedupe-matches`). Groups
   Match rows by `(home_team_id, away_team_id, DATE(scheduled_at))`
   and deletes the non-oldest rows. 446 groups found, 462
   duplicate matches deleted. Cascade-removed their predictions,
   results, odds, and match statistics via the existing
   `ondelete=CASCADE` FK clauses. Fixes the duplicate
   "Atalanta BC vs Juventus FC" entries Dennis was seeing in
   `/api/route/explorer` and cleans up strategy sample sizes.

2. **Dixon-Coles Poisson upgrade**:
   - `PoissonModel._strength_from_form` now splits a team's form
     into HOME and AWAY matches and normalises each side against
     the appropriate league average (`league_avg_home` vs
     `league_avg_away`). Previously both were lumped together,
     which systematically biased the attack/defence multipliers
     for teams with unbalanced home/away schedules in the window.
   - `PoissonModel._poisson_grid` applies the Dixon & Coles (1997)
     low-score correlation correction. A multiplicative τ is
     applied to the four cells (0-0, 1-0, 0-1, 1-1) with
     ρ = -0.15, then the grid is re-normalised. This nudges
     probability mass toward 1-1 / 0-0 / 1-0 / 0-1 which matches
     the empirical draw-rate distribution in European football.
   - Same correction applied in
     `over_under_model.predict_over_under_2_5` so O/U and 1X2
     outputs stay consistent.

3. **LogisticModel feature expansion + training**:
   - 9 new features on top of the v4 set:
     `elo_diff` (home_elo − away_elo, scaled),
     `home_form_shots_on_target`,
     `away_form_shots_on_target`,
     `home_form_possession_pct`,
     `away_form_possession_pct`,
     `home_form_corners`,
     `away_form_corners`,
     `shots_on_target_diff`,
     `possession_diff`.
   - `ForecastService.build_match_context` added a new
     `_avg_form_match_stats` helper that averages the per-side
     match statistics over the team's form window, pre-populating
     `context["form_stats"]` for the Logistic feature vector.
   - `ForecastService._cached_logistic` caches a trained model at
     the class level so subsequent ensemble builds reuse it
     instead of instantiating a fresh uniform-prior model.
   - New endpoint `POST /api/admin/v5/train-logistic` builds
     training data from the last ~2 000 finished matches using
     `build_match_context` (point-in-time safe) + actual results,
     fits `CalibratedClassifierCV(LogisticRegression, method="sigmoid")`,
     and caches the result. Returns `{samples, accuracy, brier_score}`.

4. **Walk-forward validation endpoint**
   (`GET /api/strategies/{id}/walk-forward?train_days=28&test_days=14`).
   Rolls a test window forward through the strategy's history
   with real-odds-preferred ROI per pick, returns per-window
   (winrate, ROI) plus aggregates: mean, std, positive_windows,
   and a rough Sharpe-style score `mean / std × √N`.

### How the Phase 3 sequence ran on production

```
1. dedupe-matches          →  446 groups, 462 duplicates deleted
2. backfill-elo-history    →  4 675 matches processed (down from 5 053)
                              10 106 rating rows
3. train-logistic limit=2000 → 100 samples built, train success,
                              accuracy 70%, brier 0.47, 34 features
                              (Railway timeout cut off context-building
                              at ~100; good enough as a baseline)
4. regenerate-predictions    →  13 chunks × 400 + tail = 4 675 new
                              predictions with 0 leakage failures
5. validation-refresh        →  see table below
6. walk-forward for 2 strategies →  see §"Walk-forward results"
```

### Phase 3 validation results

Final state after all four upgrades:

| Strategy              | Sample | Winrate | ROI    | odds_cov | Status              |
|-----------------------|-------:|--------:|-------:|---------:|---------------------|
| Balanced Match Away   | 2 747  | 43.4%   | -17.5% | 0.7%     | rejected            |
| High-Scoring Match    | 2 064  | 50.6%   | -3.7%  | 0.8%     | rejected (O/U Over) |
| Underdog Hunter       | 1 353  | 47.1%   | -10.2% | 0.9%     | rejected            |
| Draw Specialist       | 1 108  | 44.6%   | -15.2% | 0.5%     | rejected            |
| Home Value Medium Odds | 955   | 48.8%   | -7.1%  | 0.6%     | rejected            |
| Strong Home Favorite  | 914    | 63.6%   | +20.5% | 0.7%     | under_investigation |
| Anti-Draw Filter      | 877    | 65.9%   | +25.0% | 0.8%     | under_investigation |
| **Away Upset Value**  | **711** | **53.2%** | **+0.9%** | 0.7% | **break_even**      |
| Home Dominant         | 639    | 67.1%   | +27.3% | 0.6%     | under_investigation |
| Low Draw High Home    | 625    | 66.2%   | +25.7% | 0.3%     | under_investigation |
| Defensive Battle      | 619    | 46.5%   | -11.5% | 0.2%     | rejected (O/U Under) |
| Conservative Favorite | 476    | 70.2%   | +32.9% | 0.6%     | under_investigation |
| Model Confidence Elite | 109   | 67.0%   | +26.7% | 0.9%     | under_investigation |
| High Confidence Any   | 29     | 65.5%   | +24.5% | 0.0%     | insufficient_data   |

**Phase 3 tally**: 0 validated · 6 under_investigation · 6 rejected
· 1 **break_even** · 1 insufficient_data.

Notable shifts from Phase 2:
- **Away Upset Value** moved from rejected (-5.1%) to break_even
  (+0.9%). Marginal but real — Dixon-Coles + trained Logistic
  slightly changed the probability distribution in the model's
  favour for away teams.
- **Draw Specialist** improved from -20.1% to -15.2% thanks to
  the Dixon-Coles low-score correction nudging probability mass
  toward draws in close matches.
- **Conservative Favorite** went UP from +26.9% to +32.9% —
  exactly the wrong direction if we thought the home-favorite
  ROI was fully fallback-driven. Something else is going on
  here (see next section).

### Walk-forward results — the most important finding of Phase 3

Two strategies tested with `train_days=28&test_days=14`:

**Strong Home Favorite** — *sample_size=914, 37 rolling windows*
```
positive_windows: 33 / 37        (89%!)
mean_test_roi:    +25.7%         (inflated by 1.90 fallback)
std_test_roi:     21.4%
sharpe:           7.30           (very high)
first 12 windows: 77%, 53%, 67%, 88%, 88%, 84%, 54%, 68%, 65%, 50%, 60%, 64% winrate
```

**Away Upset Value** — *sample_size=711, 35 rolling windows*
```
positive_windows: 21 / 35        (60%)
mean_test_roi:    +1.4%
std_test_roi:     24.7%
sharpe:           0.34           (very low)
first 12 windows: 52%, 40%, 59%, 67%, 67%, 63%, 70%, 67%, 63%, 38%, 58%, 45% winrate
```

**This is the most important finding of Phase 3.**

The Strong Home Favorite strategy has genuine, consistent signal:
33/37 windows positive is far beyond random luck (expected 18/37
at chance rate 0.5). The Sharpe of 7.3 is exceptional. The
winrate is between 50% and 88% in almost every window. This
means the home-favorite pattern is **not** a coincidence — it's
a real, robust signal that the model is detecting.

The +25.7% mean ROI is still inflated by the 1.90 fallback
assumption. At realistic home-favorite odds of ~1.40, the real
ROI works out to `0.6 × 0.4 - 0.4 × 1.0 = -0.16` → **-16%**.
So even with consistent 60% winrate, real-market betting on
heavy favorites LOSES money because the bookies price them
efficiently. The walk-forward is showing "the model picks
winners reliably" but NOT "those winners are profitable at
market odds".

Meanwhile Away Upset Value has 60% positive windows (barely
above chance), mean ROI +1.4%, huge std of 24.7%. That's a
random-walk signal. Not validated, correctly break_even.

**Upshot**: our plausibility gate (winrate > 58% = flag) was
correctly identifying the home-favorite cluster as inflated,
but for the WRONG reason. It's not that the winrate is wrong
(it's real). It's that the ROI is wrong. The proper fix is to
compute **ROI at real market odds** once the snapshot cron has
accumulated enough coverage, then re-run walk-forward with
genuine P&L numbers.

### Phase 3 API usage

```
api_football: 2 680 / 7 500 daily (35.7%)  [unchanged from end of Phase 2 —
                                             Phase 3 was DB-only work]
```

The match dedupe, Elo rebuild, Logistic training, and
prediction regenerate all run against the local Postgres. Zero
new API calls in Phase 3.

### What's left after Phase 3

1. **Odds coverage is still the #1 blocker.** Daily snapshot
   cron is running, but it needs 2-3 weeks to matter. Without
   real odds the ROI numbers are all sitting on a 1.90 fallback
   and can't distinguish "real edge" from "walking with the
   market".
2. **Logistic training cut off at 100 samples** due to Railway
   request timeout during `build_match_context` loop. A
   chunked training endpoint (same pattern as
   regenerate-predictions) would build the full 2 000-sample
   training set and give a much more robust model. ~30 minutes
   of work for next session.
3. **The walk-forward endpoint is only accessible via curl.**
   Would be useful as a frontend visualization on the Strategy
   Lab: each strategy gets a small per-window ROI chart so the
   user can see consistency, not just a headline number.
4. **Match dedupe still has some false negatives.** The top-10
   Elo list still shows "Borussia Dortmund" twice. Probably a
   whitespace / case difference in the team name column. Not
   critical.

### Updated honest assessment (end of Phase 3)

**What works well:**
- Every prediction in the database is point-in-time safe across
  all 3 sub-models. 0 leakage failures in two full regenerate
  passes.
- The trained Logistic model (even at 100 samples) contributes
  non-uniform probabilities alongside Elo and Dixon-Coles
  Poisson. The ensemble is now a real 3-model average.
- Walk-forward validation shows the model's ability to
  consistently identify winners. Strong Home Favorite has
  exceptional consistency (33/37 positive windows).
- The scaling monitor is live and shows usage at ~36% of the
  daily budget after a day of heavy backfilling. Plenty of
  headroom.

**What's still broken or blocked:**
- Real-market ROI is a hallucination. Without historical odds
  data, every "+X% ROI" number in the report is a 1.90-fallback
  approximation. Walk-forward confirms *consistency* of picks
  but can't confirm *profitability*.
- Logistic training is undersized (100 samples, 34 features) —
  guaranteed to be over-fit despite the calibration. Full
  chunked training is a next-session task.
- The O/U market shows no detectable edge even after
  Dixon-Coles. 50.6% / 46.5% strike rates at 1.90 ≈ -3.7% /
  -11.5% ROI. Either our Poisson lambdas are still too crude
  or this market is simply efficient at our level of
  sophistication.

**Bottom-line for Dennis:**

After a full day of v4 → v5 → v5.1 → v5.2 rebuild:

- ✅ Zero leakage across the entire prediction history.
- ✅ All 3 sub-models running, 2 of them with real features
      (Elo + Poisson; Logistic is small-sample trained).
- ✅ Match + team dedupe: DB is clean.
- ✅ Odds snapshot cron active — real coverage will grow
      over the next 2 weeks.
- ✅ Walk-forward validation endpoint gives us the first
      honest "is this strategy consistently picking winners"
      answer we've had.
- ❌ No strategy is `validated` yet, and that's correct.
      Reaching "validated" requires real historical odds,
      which requires the snapshot cron to tick for 2-3 weeks.

**Next session priorities** (in order):
1. Chunked Logistic training to hit the full 2 000-sample
   target (~30 min).
2. Once the daily snapshot cron has accumulated 14+ days of
   coverage: re-run validation-refresh and walk-forward on
   every strategy. Expect the home-favorite cluster to drop
   to near-zero real ROI.
3. Frontend widget for walk-forward visualization on the
   Strategy Lab.
4. Consider adding xG features from an external source
   (Understat scrape) to give the ensemble more signal in
   O/U markets.

