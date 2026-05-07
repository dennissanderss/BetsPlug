# BetsPlug — Predictions Engine Rebuild Briefing

*This is a self-contained briefing for an external Claude chat (or engineer) who has not seen the codebase. Goal: explain the full system, the tools, the engines, what they do, how they're wired together, and the structural problem that requires us to rebuild the Predictions tool into a profit machine that actually matches what the user-facing tier system promises.*

**Context date:** 2026-05-07
**Repo:** monorepo with `backend/`, `frontend/`, `marketing/`
**Author of this brief:** internal Claude session that ran a 7-phase audit + several fixes/rollbacks.

---

## TL;DR — the problem in one paragraph

We sell a tier-laddered prediction product (Free → Silver → Gold → Platinum) where users expect Platinum to be the best signal. **In reality, Platinum picks have -11.55% ROI on the last 14 days, while Silver has +22.84%.** The tier funnel is structurally inverted for profit. The root cause: tier classification is based on `confidence`, but high confidence in football betting means heavy favorites with low odds, where the bookmaker's vig eats the entire payout. The model is *correct* but the *betting math* makes the high-tier picks unprofitable. We need to rebuild the Predictions tool so each tier delivers ROI consistent with its price (Platinum = highest ROI, not highest accuracy).

**Hard constraint:** the Combo of the Day engine (Engine v2) is **frozen** by user directive. Do not propose touching it.

---

## 1. The product surface (consumer-facing tools)

BetsPlug is a B2C subscription SaaS for football predictions (NL: voorspellingen). Three tools currently live:

### 1.1 Predictions — `/predictions`
The headline tool. Lists upcoming, live and recent fixtures with model-generated picks per match. Users can filter by league, by confidence band, by tier, and now (just shipped) hide low-odds picks (default ON, threshold 1.50). Each row shows: home/away teams, league, kickoff, model probabilities (home/draw/away), confidence %, predicted pick (HOME/DRAW/AWAY), and pick-tier badge. Authed; gated by tier (Free users see Free-tier picks, Silver users see Free+Silver, etc.).

**This is the tool that needs rebuilding.** It is the USP that brings users in, but per-tier ROI is currently inverted.

### 1.2 Combo of the Day — `/combi-of-the-day`
Multi-leg parlay product. Daily 2-leg combo built by a separate selector (Engine v2) from the same prediction pool. Hard-locked behind a "coming soon" gate for non-admins right now. **Frozen — do not touch this engine, its endpoints, its UI, or its DB tables.** User directive 2026-05-07: "Ik wil dat je van combo odds de engine niks meer aanpast." Lifetime backtest +27.48% ROI on 438 combos / live +36.28% on 62 — this product works and the user wants it stable.

### 1.3 Trackrecord — `/trackrecord`
Historical performance display. Two big tabs: "Backtest" (cumulative all-time per tier) and "Live" (forward-feed since v8.1 deploy on 2026-04-16). Shows accuracy, Brier score, log-loss, hit rate per tier with Wilson CI, calibration buckets. Has a CSV export of every evaluated prediction.

### 1.4 Removed tools
- **Bet of the Day / Pick of the Day (BOTD/POTD)** — single best pick per day, derivative of Engine v1. **Discontinued 2026-05-07** because Engine v1 single-pick ROI on Gold+ live was -10.9% on n=182. Code deleted; DB tables retained (no migration drop). Don't propose reviving it.

---

## 2. The engines

### 2.1 Engine v1 — Single-pick predictions

**This is what feeds the Predictions tool.** Lives in `backend/app/forecasting/`.

**Pipeline:**
1. `ForecastService` (`forecasting/forecast_service.py`) is the entry point. Selects the active `ModelVersion` row from DB and dispatches to the implementation.
2. Sub-models (each extends `forecasting/models/base_model.ForecastModel`):
   - `EloModel` — point-in-time Elo ratings
   - `PoissonModel` — goal-rate Poisson regression
   - `LogisticModel` — logistic regression on engineered features
   - `XGBoostModel` — gradient-boosted trees
3. **Ensemble**: weighted average of sub-model probabilities. Current weights are stored in `ModelVersion.config`. Ensemble weights are tunable via `/api/admin/v5/optimize-ensemble`.
4. Output: a `Prediction` row with:
   - `home_win_prob`, `draw_prob`, `away_win_prob` (sum to 1.0)
   - `confidence` = max(home, draw, away) — the model's strongest probability
   - `predicted_at`, `predicted_home_score`, `predicted_away_score`
   - `prediction_source` ∈ {`live`, `backtest`, `batch_local_fill`}
   - `closing_odds_snapshot` — JSONB blob with bookmaker odds captured at prediction time
   - `raw_output` — JSONB blob of sub-model contributions
5. Features: built by `features/feature_service.py` which reads from `matches`, `teams`, `match_results`, `odds_history`. Supports point-in-time isolation (no leakage from future data when backtesting).
6. Pre-trained ML artifacts live in `backend/models/`:
   - `xgboost_model.ubj`
   - `logistic_model.pkl`
   - `feature_scaler.pkl`
   - `feature_names.json`
   - `model_metadata.json`
   - Loaded at Railway boot.
7. Cron jobs (in `services/scheduler.py`):
   - **Live** prediction generation: every 10 min, predicts upcoming fixtures
   - **Backtest** sweep: every 5 min, retroactively predicts on the same v8.1 pipeline
   - **Evaluator**: every 20 min, grades finished predictions

**v8.1 deploy cutoff (2026-04-16 11:00 UTC):** before this date the feature pipeline was broken (leakage / wrong feature normalisation). Every aggregate query in production uses `trackrecord_filter()` from `core/prediction_filters.py` which restricts to:
```
prediction_source IN ('batch_local_fill','backtest','live')
AND created_at >= V81_DEPLOYMENT_CUTOFF
AND predicted_at <= scheduled_at
```

### 2.2 Engine v2 — Combo of the Day selector (FROZEN — DO NOT TOUCH)

**Where:** `backend/app/services/combo_bet_service.py`. Selector is "v5".

**How it works:**
1. Daily cron (`persist_daily_combo`) pulls all v8.1 predictions for matches in the next 48h with `closing_odds_snapshot` populated and `confidence >= COMBO_MIN_CONFIDENCE` (0.62).
2. For each prediction: takes the model's argmax pick, computes the bookmaker odds for that side, computes vig-removed implied probability, computes edge = `model_prob - vig_removed_implied`.
3. Filters legs that pass: leg_odds in [1.30, 4.50] AND tier in {silver, gold, platinum} AND edge >= 0.02.
4. Score each leg: `confidence × tier_bonus × (1 + leg_edge)`.
5. Pick top 2 legs from DIFFERENT leagues, return as a combo.
6. Store in `combo_bets` (header) + `combo_bet_legs` (one row per leg).
7. Evaluator runs daily, grades the combo (won iff ALL legs win).

**Why frozen:** combo backtest ROI is +27.48% on n=438 lifetime, live +36.28% on n=62. The product works. User explicitly forbid changes after the audit revealed the partial-window cherry-pick mistake (we initially claimed +40% on a 179-combo subset that was 2022-2023 only).

**Coupling to Engine v1:** Engine v2 reads from the same `predictions` table that Engine v1 writes to. If you change Engine v1's prediction generation logic, Engine v2's selector will see different inputs. Be careful — the prediction generation should remain stable. Filtering / display / tier classification can change freely, but the underlying probability outputs in `predictions.home_win_prob` / `draw_prob` / `away_win_prob` should not.

---

## 3. The tier system (how picks are classified)

**Where:** `backend/app/core/tier_system.py` + `backend/app/core/tier_leagues.py`.

### 3.1 Confidence thresholds
```
PickTier.PLATINUM = 0.78
PickTier.GOLD     = 0.70
PickTier.SILVER   = 0.62
PickTier.FREE     = 0.55
```
A prediction with `confidence < 0.55` is unranked (NULL tier) and excluded from every tier query.

### 3.2 League whitelists
Each tier also requires the match's league to be in a whitelist:
- `LEAGUES_PLATINUM` — top 5 European leagues only
- `LEAGUES_GOLD` — top 10
- `LEAGUES_SILVER` — top 14 (this also serves as `LEAGUES_FREE` baseline)
- Live-extras (Conference League etc.) are admitted only when `prediction_source='live'` and recent

### 3.3 Classifier (SQL expression)
`pick_tier_expression()` returns a CASE statement: a prediction is Platinum if it's in LEAGUES_PLATINUM AND conf >= 0.78, etc. Highest applicable tier wins (a Champions League pick at conf 0.80 qualifies for Platinum). Otherwise NULL (excluded).

### 3.4 Access filter
`access_filter(user_tier)` is a SQLAlchemy WHERE clause restricting query results based on the caller's subscription tier:
- Platinum user → sees all (free baseline + everything above)
- Gold user → excludes Platinum-only picks
- Silver user → excludes Gold + Platinum
- Free user → only sees Free-tier picks

This is applied on `/predictions` list, `/fixtures/upcoming`, and `/trackrecord/summary` (by default — there's a `?pick_tier=` override for transparency on trackrecord that bypasses access_filter so anyone can audit any tier's historical numbers).

### 3.5 Stripe / pricing coupling
Each subscription tier in Stripe is mapped to a `PickTier`:
- Free → no payment
- Silver → ~€9.99/mo
- Gold → ~€19.99/mo
- Platinum → ~€39.99/mo (approximate; check `/api/pricing` for current)

**Renaming or restructuring tiers requires a Stripe coordination, not just a code change.**

---

## 4. Backend architecture

### 4.1 Stack
- **FastAPI 0.115** + async SQLAlchemy 2 (asyncpg) + Alembic + Celery 5
- **PostgreSQL 16** + Redis 7
- **Python 3.12**
- **scikit-learn 1.8** + **XGBoost 2.1** for ML
- Deployed: Railway (backend + DB + Redis), Vercel (frontend)
- Locally: `docker-compose up`

### 4.2 Layout
```
backend/
├── app/
│   ├── api/routes/          (~40 router files, thin)
│   │   ├── fixtures.py      (the predictions browse data source)
│   │   ├── trackrecord.py   (aggregate metrics)
│   │   ├── value_bets.py    (Engine v2 endpoints — DON'T TOUCH combo-* routes)
│   │   ├── internal_ops.py  (env-var-key gated long-running ops + audit endpoints)
│   │   ├── admin*.py        (admin-only endpoints)
│   │   └── ...
│   ├── services/            (business logic)
│   │   ├── combo_bet_service.py  (FROZEN)
│   │   ├── scheduler.py     (Celery beat / APScheduler entry points)
│   │   └── ...
│   ├── repositories/        (async SQL helpers)
│   ├── models/              (SQLAlchemy ORM)
│   │   ├── prediction.py
│   │   ├── match.py
│   │   ├── combo_bet.py
│   │   └── ...
│   ├── schemas/             (Pydantic v2 request/response)
│   ├── forecasting/         (Engine v1 ML pipeline)
│   ├── features/            (feature engineering)
│   ├── ingestion/           (API-Football + football-data.co.uk adapters)
│   └── core/
│       ├── tier_system.py        (confidence thresholds + access_filter)
│       ├── tier_leagues.py       (per-tier league whitelists)
│       └── prediction_filters.py (v8.1 cutoff + trackrecord filter)
├── models/                  (pre-trained ML artifacts — loaded at boot)
└── start.py                 (Railway entry — bootstraps Alembic + seeds)
```

### 4.3 Routes that matter for the rebuild
- `GET /api/fixtures/upcoming` — main /predictions data feed
- `GET /api/fixtures/today`, `/live`, `/results` — variants
- `GET /api/trackrecord/summary` — per-tier accuracy + ROI display
- `GET /api/trackrecord/segments` — per-league/per-period drilldowns
- `GET /api/predictions/{id}` — single prediction detail
- `GET /api/internal-ops/audit/predictions-roi-scenarios` — sweep that found +EV stacks (used during diagnosis; not user-facing)
- `GET /api/internal-ops/audit/per-tier-windowed?days=14` — proves the tier inversion problem

### 4.4 Internal-ops auth
Long-running maintenance + audit endpoints under `/api/internal-ops/*` are gated by an `X-Internal-Ops-Key` header (server env var `INTERNAL_OPS_KEY`). They bypass JWT (so multi-hour batches don't break on token expiry). Useful for the rebuild because we can run scenario sweeps server-side without needing a logged-in admin session.

---

## 5. Database schema (key tables)

### 5.1 `predictions`
```
id (UUID PK)
match_id (FK matches)
model_version_id (FK model_versions)
home_win_prob FLOAT
draw_prob FLOAT
away_win_prob FLOAT
predicted_home_score FLOAT
predicted_away_score FLOAT
confidence FLOAT
predicted_at TIMESTAMP
locked_at TIMESTAMP
prediction_source TEXT  -- 'live' | 'backtest' | 'batch_local_fill'
closing_odds_snapshot JSONB  -- {bookmaker_odds: {home, draw, away}, timestamp, source}
raw_output JSONB  -- sub-model contributions
features_snapshot JSONB  -- features used at prediction time
created_at TIMESTAMP
```

**117k rows** as of audit. ~38k post-v8.1 evaluated. ~89% have `closing_odds_snapshot` populated.

### 5.2 `prediction_evaluations`
```
prediction_id (FK predictions, unique)
is_correct BOOLEAN
actual_outcome TEXT  -- 'home' | 'draw' | 'away'
brier_score FLOAT
log_loss FLOAT
evaluated_at TIMESTAMP
```
**99.8% coverage** — the evaluator cron is fully caught up.

### 5.3 `matches`
```
id, league_id, season_id, home_team_id, away_team_id
external_id, status (enum), scheduled_at, venue, round_name, matchday
created_at
```

### 5.4 `match_results`
```
match_id (FK, unique)
home_score INT, away_score INT
home_score_ht INT, away_score_ht INT
winner TEXT
```

### 5.5 `odds_history`
```
match_id (FK), market TEXT, source TEXT, recorded_at TIMESTAMP
home_odds, draw_odds, away_odds, over_2_5, under_2_5
```
30k rows. Sources: `bet365_closing` (football-data.co.uk import), `api_football_avg` (live cron). 100% pre-match.

### 5.6 `combo_bets` + `combo_bet_legs` (Engine v2 — DO NOT WRITE TO)
Header + per-leg breakdown for combo persistence.

### 5.7 Other
`teams`, `leagues`, `seasons`, `sports`, `users`, `subscriptions`, `model_versions`, `predictions_explanations`, plus admin/blog/SEO/email tables.

---

## 6. Data flow end-to-end

```
External APIs                      Database                          User-facing
─────────────                      ────────                          ───────────

API-Football  ────► fixtures + ─► matches, teams, leagues
                    odds + scores   match_results, odds_history
                                          │
                                          ▼
football-data ────► closing odds  ─► odds_history (Bet365 source)
.co.uk CSV          (historical)          │
                                          ▼
                    ┌─────────────────────┴────────────────┐
                    │                                       │
              ForecastService                        Combo selector
              (Engine v1)                            (Engine v2 — FROZEN)
                    │                                       │
                    ▼                                       ▼
              predictions                              combo_bets +
              (with closing_odds_snapshot)             combo_bet_legs
                    │                                       │
                    ▼                                       │
              prediction_evaluations                        │
              (after match finishes)                        │
                    │                                       │
        ┌───────────┴──────────────┐                ┌──────┴────────┐
        ▼                          ▼                ▼               ▼
    /api/fixtures/*          /api/trackrecord/*  /api/value-bets  /api/value-bets
    (FixtureItem with        (per-tier ROI,      /combo-today     /combo-history
     embedded                 segments, CSV)                       /combo-stats
     PredictionSummary)
        │                          │                ▼
        ▼                          ▼          /combi-of-the-day
    /predictions            /trackrecord       (frontend page —
    (frontend page)         (frontend page)     hard-locked)
```

**Critical link:** Engine v1 writes `predictions`. Engine v2 reads `predictions`. Predictions UI reads `predictions` via `/fixtures/*`. Trackrecord aggregates `predictions` × `prediction_evaluations`. **All four surfaces use the same table.** Any change to `predictions` schema cascades everywhere.

---

## 7. The current state of Engine v1 ROI (with numbers)

### 7.1 Last 14 days, all sources, per tier (from `/audit/per-tier-windowed`)

| Tier | n | Hit rate | Avg odds | ROI |
|---|---:|---:|---:|---:|
| Platinum | 27 | 62.96% | 1.44 | **-11.55%** |
| Gold | 50 | 62.00% | 1.73 | **+5.99%** |
| Silver | 231 | 64.50% | 2.02 | **+22.84%** |
| Free | 29 | 31.03% | 2.56 | **-25.33%** |

**The funnel is inverted.** Silver outperforms Platinum by 34 percentage points of ROI. Platinum's avg odds are 1.44 — meaning the bookmaker is offering €0.44 winst per €1 stake, which requires ~70% hit rate to break even after vig. The model hits 63% → loss.

### 7.2 Odds bucket distribution per tier (last 14d)

| Tier | <1.30 | 1.30-1.60 | 1.60-2.00 | 2.00-2.60 | ≥2.60 |
|---|---:|---:|---:|---:|---:|
| Platinum | 9 (33%) | 14 | 2 | 2 | 0 |
| Gold | 1 | 18 | 23 | 8 | 0 |
| Silver | 0 | 10 | 140 | 59 | 22 |
| Free | 0 | 1 | 5 | 9 | 14 |

Platinum has 33% of picks at <1.30 odds (extreme favorites — guaranteed losers long-term). Silver is in the sweet spot 1.60-2.00 where the model's true edge plays out.

### 7.3 Lifetime full-population (post-v8.1, 13,958 picks with snapshot odds)

| Filter | n | Hit | ROI |
|---|---:|---:|---:|
| Baseline (no filter) | 13,958 | 50.87% | **-2.31%** |
| conf ≥ 0.62 | 7,389 | 57.82% | +2.57% |
| conf ≥ 0.78 | 1,170 | 81.03% | +5.64% |
| edge ≥ 10% | 1,937 | 41.97% | +4.32% |
| **conf ≥ 0.62 AND edge ≥ 10%** | **1,114** | **50.18%** | **+13.26%** |
| conf ≥ 0.65 AND edge ≥ 10% | 860 | 53.7% | +14.21% |
| conf ≥ 0.70 AND edge ≥ 6% | 949 | 65.9% | +14.58% |

**The lifetime sample shows that confidence × edge stack does produce +13-15% ROI.** The 14-day live data shows the SAME pattern: edge filter helps, but high-confidence-only doesn't.

### 7.4 Source split (last 14d, lifetime)

| Source | n | ROI |
|---|---:|---:|
| live (since 2026-04-16) | 343 | +13.08% |
| backtest cron (since 2026-04-16) | 7,483 | -0.88% |
| batch_local_fill (one-shot 2026-04-17) | 6,132 | -4.91% |

`batch_local_fill` is the historical retroactive fill that drags the lifetime baseline down. Live is +13% but on a small sample.

---

## 8. What we already tried and rolled back

### 8.1 Edge-verified UI toggle (rolled back 2026-05-07)
We added a toggle on `/predictions` that filtered to "conf ≥ 62% AND edge ≥ 10%". User feedback: "ik snap er geen moer van" — the concept of "edge over vig-removed bookmaker price" was too technical. Removed the UI but kept the `edge_pct` field on the API response for future use.

### 8.2 Per-pick edge pill (rolled back)
Each pick card had a small green/yellow/red pill showing "+12% edge" etc. Removed for the same reason — too technical for the average user.

### 8.3 Edge-verified live tracking widget on /trackrecord (rolled back)
A widget that surfaced rolling live ROI on the recipe. Removed because the parent concept was already rolled back.

### 8.4 What's still live (just shipped, 2026-05-07)
- **Odds floor of 1.50** — picks with `bookmaker_odds_pick < 1.50` are flagged `below_odds_floor=true` and hidden by default on `/predictions`. User can toggle "Toon ook lage odds" to see all.
- **`edge_pct` + `bookmaker_odds_pick` + `below_odds_floor`** fields on `PredictionSummary` (Pydantic schema in `backend/app/api/routes/fixtures.py`) — server-side computation, used by the frontend filter.

---

## 9. The constraint table (what you can / can't change)

| Surface | Allowed change | Forbidden |
|---|---|---|
| `combo_bet_service.py` | NONE | All changes |
| `value_bets.py /combo-*` endpoints | NONE | All changes |
| Combo UI `/combi-of-the-day` | NONE (visual only with permission) | Logic changes |
| ML models in `backend/models/` | NONE | Retraining, replacing |
| `predictions.home_win_prob/draw_prob/away_win_prob` semantics | NONE | Values must remain truthful model output |
| `predictions` table schema | Add columns | Remove existing columns |
| Tier classification (`tier_system.py`) | Add new tier fields, add filters | Renaming tiers (Stripe coupling) |
| `/fixtures/*` response shape | Add fields, add filters | Remove existing fields used by combo/UI |
| `/predictions` UI | Free to redesign | Don't break tier-gating |
| Pricing tier names | Coordinate with Stripe | Solo rename |
| DB migrations | Forward-compatible only | Dropping non-empty tables |

---

## 10. The structural problem to solve

**The current tier ladder is built on `confidence`, but profitability is a function of `(confidence, odds, edge)`. Specifically:**

- High confidence picks tend to be heavy favorites with low odds. Bookmaker prices these accurately. Vig wins.
- Mid-confidence picks (0.62-0.70) on mid-odds (1.80-2.20) are where the model's true edge over the market lives. This is the historically +EV zone.
- Low confidence picks (< 0.55) are noise. Excluded.

**The marketing promise** ("Platinum is our highest-conviction signal") creates an expectation of "highest ROI". The math says "highest accuracy, lowest ROI". These are in conflict.

### 10.1 Three rebuild directions (any one or a combination)

**Direction A — Re-define what each tier promises.**
- Platinum becomes "elite confidence + edge + odds floor" (e.g. conf ≥ 0.78 AND edge ≥ 8% AND odds in [1.50, 3.00]). Smaller volume but truly +EV.
- Gold becomes "value plays" (conf ≥ 0.62 AND edge ≥ 10%) — the sweet spot from the historical data.
- Silver becomes "high confidence single-bets" (conf ≥ 0.70, no edge filter) — accuracy story but lower ROI.
- Free becomes a curated subset of Silver (1-2 picks/day) for top-of-funnel.
- **Risk**: marketing copy needs full rewrite; users need to understand the new shapes.

**Direction B — Add a second filter layer per tier.**
- Keep current confidence-based tier classification (so combo selector and existing API stay compatible).
- Add a per-tier *display* filter that's stricter for higher tiers:
  - Platinum tier display = picks classified as Platinum AND edge ≥ 8% AND odds ≥ 1.50
  - Gold tier display = Gold AND edge ≥ 6% AND odds ≥ 1.40
  - Silver tier display = Silver (current logic)
  - Free tier display = Free, top 3 by edge per day
- **Risk**: lower volume on Platinum; need to communicate the "fewer picks, better picks" tradeoff.

**Direction C — Decouple display from classification.**
- "Tier" stays as a marketing/billing concept but the predictions UI shows ALL accessible picks ranked by expected value (a server-computed score combining confidence × edge × odds_acceptance).
- User browses by sport / league / kickoff time; tier just controls "how many picks per day" and "depth of analysis shown".
- **Risk**: biggest UX departure from current product.

### 10.2 Side problems to also solve

- **Free tier ROI is -25%** in the last 14d. Even if we fix Platinum, Free needs a redesign so users don't lose money in the trial — this is a churn risk. Free could be limited to 1 pick/day with the highest edge, instead of the bottom-of-confidence noise that currently shows.
- **batch_local_fill drags lifetime numbers**. Should we deprecate that source on display? It's useful for backfill but contaminates the "headline" numbers.
- **Closing odds snapshot is null on ~11% of predictions.** Without it, edge can't be computed, so any rebuild that depends on edge will exclude those rows. Need to schedule snapshot population to run after every prediction batch instead of nightly.

---

## 11. What success looks like

A rebuilt Predictions tool where:

1. **Tier funnel respects ROI expectations.** On a rolling 14-30 day window, ROI ladder must be Platinum > Gold > Silver > Free (or at minimum, all tiers above break-even).
2. **Per-tier minimum sample size.** Each tier must surface at least N picks/week (e.g. Platinum 3-5, Gold 7-10, Silver 15-25). Less than that = users feel they're paying for nothing.
3. **Live-validated.** Whatever recipe lands must be validated on 4-8 weeks of live forward-feed data before scaling marketing claims. We've been burned twice (Phase 3 combo audit cherry-pick, Edge-verified premature claim) — third time we want to be conservative.
4. **No regression on combo.** Engine v2 must continue to read predictions and produce combos at the same rate. If the rebuild changes which predictions surface in the UI but not which predictions are stored, combo is unaffected.
5. **Honest UI.** Show the live n + ROI per tier in real-time so users (and we) can see when the recipe is or isn't working. Don't hide behind "lifetime backtest" numbers.

---

## 12. Open questions for the external review

1. **Is the right approach to keep `confidence` as the primary tier signal but add per-tier filters (Direction B), or should we fundamentally re-define what tier means (Direction A or C)?**
2. **How do we phase the rebuild so existing paying customers don't suddenly see fewer picks (which would feel like a downgrade) without context?**
3. **What's the right Stripe migration plan if tier semantics change (do we grandfather, or force re-onboarding)?**
4. **Is there an ML-side fix worth considering — e.g. training a calibration layer on top of the ensemble that specifically targets ROI on real odds, rather than accuracy?** (We have 13.9k labelled picks with snapshot odds and is_correct grades — enough for a small reranker.)
5. **The model currently picks home in 74% of cases (10,250 of 13,958), and home picks have -3.31% ROI vs away at -0.18%. Is there a structural home bias to correct, or is this a feature of the league sample?**

---

## 13. How to verify everything in this brief

The audit data behind this brief is reproducible via these endpoints (`X-Internal-Ops-Key: regen-key-9k2m4n7q8r3s5t1v` header):

```
GET /api/internal-ops/audit/per-tier-windowed?days=14
GET /api/internal-ops/audit/predictions-roi-scenarios
GET /api/internal-ops/audit/snapshot-coverage-per-month
GET /api/internal-ops/audit/phase4-dataflow
GET /api/internal-ops/audit/phase6-reproducibility
```

Backend production: `https://betsplug-production.up.railway.app/api/...`

Audit reports also live at:
- `docs/predictions_roi_optimization.md` — scenario sweep + recipe analysis
- `docs/integrity_audit_final.md` — 7-phase audit consolidated
- `docs/engine_v1_audit.md` — Engine v1 deep-dive
- `docs/engine_v2_audit.md` — Engine v2 (combo) deep-dive
- `docs/dataflow_audit.md` — ingestion → storage → display chain integrity

---

## 14. Memory rules already in place

(From `~/.claude/projects/.../memory/`):

- **Combo engine is locked** (`feedback_combo_engine_locked.md`) — no changes
- **BOTD is deleted** (`project_botd_deleted.md`) — don't propose reviving
- **Predictions ROI is the open problem** (`project_predictions_roi_negative.md`) — the rebuild scope
- **i18n constraint**: only EN + NL during dev, other 14 locales auto-fill via pre-commit hook
- **Plain language**: avoid jargon ("Wilson CI", "vig-removed", "edge" all confused users)
- **Push direct to main** — repo is shared between Dennis (frontend/backend) and Cas (marketing); always `git pull` first

---

**End of briefing.** Hand this to the external review with the question: *"Given this system, propose a rebuild of the Predictions tool such that the tier funnel (Free → Silver → Gold → Platinum) is structurally +EV at every paid level, without touching the Combo of the Day engine."*
