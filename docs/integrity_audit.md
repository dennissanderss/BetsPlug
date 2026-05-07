# Predictions Rebuild — Phase 1: Data Integrity Audit

*Generated 2026-05-07 via `GET /api/internal-ops/audit/rebuild-phase1-integrity` + codebase scan.*

**Scope:** verify the underlying prediction data is leakage-free before building filters / running walk-forward / promoting any tier-level claim.

**Verdict: 🚨 LEAKAGE FOUND in two of three prediction sources.** Phase 2 cannot start cleanly until the rebuild explicitly handles this. Specific issues + remediation below.

---

## TL;DR

- **`live` source (911 picks):** ✅ clean. Every prediction strictly pre-match. Avg lead time 6.2 days. This is the only fully trustworthy source.
- **`backtest` source (28,767 picks):** 🚨 **35% post-kickoff** + 65% stamped-exactly-at-kickoff. Zero truly pre-match. The current `trackrecord_filter()` accepts the 65% via the `<=` boundary, but they were generated long after the match was played — they're retroactive simulation, not pre-match locks.
- **`batch_local_fill` source (19,151 picks):** 100% stamped-exactly-at-kickoff. Same structural issue as backtest's middle bucket.
- **Closing-odds snapshot timestamp:** 🚨 **inconclusive** — the snapshot blob has no `recorded_at` / `fetched_at` / `timestamp` field, so we can't verify whether odds were captured before kickoff or scraped post-hoc.
- **Feature pipeline isolation:** sample identified, but cannot be programmatically verified without re-running feature_service point-in-time. Manual reproduction needed.
- **V8.1 cutoff respect across endpoints:** 6 user-facing endpoints query predictions WITHOUT applying the v81 filter — needs review per endpoint.

---

## Check A — Pre-match lock per source

```sql
SELECT
  prediction_source,
  COUNT(*) FILTER (WHERE predicted_at > scheduled_at) AS post_kickoff,
  COUNT(*) FILTER (WHERE predicted_at = scheduled_at) AS exact_same,
  COUNT(*) FILTER (WHERE predicted_at < scheduled_at) AS pre_match_strict
FROM predictions p JOIN matches m ON m.id = p.match_id
WHERE p.created_at >= '2026-04-16 11:00:00+00'
GROUP BY prediction_source;
```

| Source | Total | Post-kickoff | Exact-at-kickoff | Strict pre-match | Avg lead (h) | Leakage flag |
|---|---:|---:|---:|---:|---:|---|
| `backtest` | 28,767 | **10,130 (35.2%)** | 18,637 (64.8%) | **0** | 0.0 | 🚨 YES |
| `batch_local_fill` | 19,151 | 0 | 19,151 (100%) | 0 | 0.0 | ⚠ partial |
| `live` | 911 | 0 | 0 | 911 (100%) | 149.88 (6.2 days) | ✅ NO |

**Reading:**

- **`live`** is the clean source. Every row generated strictly before kickoff. Avg 6.2 days of lead time. This is what we should validate against in a rebuild.
- **`backtest`** is structurally broken. 10,130 rows have `predicted_at > scheduled_at` (post-kickoff) — those are excluded by `trackrecord_filter()` (which uses `<=`) but their existence proves the cron is not enforcing pre-match locks. Of the rows that DO pass the filter, 18,637 have `predicted_at = scheduled_at` exactly — they were generated after the match was played and stamped at the kickoff time as a "pretend" lock.
- **`batch_local_fill`** is the one-shot retroactive batch from 2026-04-17. 100% stamped-exactly-at-kickoff. Same pretend-lock pattern as backtest's middle bucket.

**Implication for the rebuild:**
- A "live" baseline today = 911 picks. Per-tier this means roughly: Platinum ~50, Gold ~150, Silver ~500, Free ~150 (estimates from earlier audits). Only the live cohort is honest live measurement.
- The "+13% ROI" recipe found in earlier scenario sweep was computed across all three sources mixed. It's contaminated by the retroactive sources. **The recipe needs to be re-validated on live source only.**

### 🚨 Action 1 — Backtest cron must enforce strict pre-match lock

The `backtest` source cron (5-min APScheduler job) is supposed to "predict upcoming fixtures with the v8.1 fixed pipeline". Reality: it's also predicting past fixtures and stamping `predicted_at = scheduled_at`. Either:

(a) The cron has a bug that mis-stamps `predicted_at` when processing finished matches; or
(b) The cron deliberately stamps exact kickoff time for "as-if-live" simulation but this isn't documented; or
(c) Two different jobs share the `backtest` source label (one true backtest cron + one retroactive-fill helper).

Need to: trace the cron path that writes `prediction_source='backtest'` and confirm it only writes for matches where `now() < scheduled_at` at write time.

### 🚨 Action 2 — Re-baseline all marketing claims on `live` source only

Every audit / scenario / ROI number we've reported so far (incl. the "+13% ROI on the recipe" finding) was computed across all three sources. Those need re-running on `prediction_source='live'` only before any rebuild parameter is locked.

---

## Check B — Closing odds capture timing

Sample of 30 random predictions with `closing_odds_snapshot` populated:

```
Sampled: 30
Snapshot post-kickoff count: 0
Leakage flag: False
Snapshot keys seen: []   ← problem
```

**🚨 Problem:** all 30 sampled snapshots had `ts=None` for every timestamp field we looked for (`recorded_at`, `fetched_at`, `timestamp`, `captured_at`). The snapshot JSON apparently does NOT store a capture-time field, only the bookmaker odds themselves.

```json
// Typical closing_odds_snapshot:
{
  "bookmaker_odds": { "home": 1.91, "draw": 3.5, "away": 3.8 },
  // ...possibly more keys, but no timestamp seen in any sample
}
```

**Impact:** We can't verify whether the odds in the snapshot were captured pre-kickoff or scraped after the fact. For a full integrity gate, we need to either:

(a) Add a `captured_at` field to every new snapshot write (going forward) and trust historical snapshots conditionally.
(b) Cross-reference snapshot rows against `odds_history.recorded_at` to infer capture time.
(c) Document that the snapshot is captured at `predicted_at` time by convention and trust that.

The simplest is (a) + (b) for historical: we can join `predictions.match_id` to `odds_history.match_id` and find the closest `recorded_at` to confirm.

### ⚠ Action 3 — Snapshot capture-time field

Add a `captured_at` (or similar) timestamp to every new write of `closing_odds_snapshot`. Not invasive (adds one JSON key). Optionally: backfill historical rows by joining to `odds_history`.

---

## Check C — Feature pipeline isolation

20 random predictions sampled. Each row surfaces enough context (match_id, predicted_at, has_features_snapshot) to manually reproduce the feature vector via `feature_service.build_features(match_id, cutoff=predicted_at)` and compare to `predictions.features_snapshot`.

**Cannot verify in this endpoint** — would require running the feature pipeline server-side per row, which is heavy. Recommended: write a small standalone script `backend/scripts/verify_feature_isolation.py` that:

1. Pulls the same 20 sample predictions
2. Reproduces features at `predicted_at` cutoff
3. Diffs against stored `features_snapshot`
4. Flags any non-trivial mismatches

**Sample row that's particularly worth testing:**
```
PID 38b43ecd...
Match: Eintracht Frankfurt vs VfL Wolfsburg
scheduled_at: 2024-02-25T14:30:00
predicted_at: 2026-04-16T11:11:27   ← predicted 2 years AFTER the match
source: backtest
```

This is a `backtest` row that was generated 2 years after the match was played. The features SHOULD have been isolated to data ≤ 2024-02-25 (the match date). If the feature service used 2026-data (current Elo seeds, current team form, etc.), there's catastrophic leakage.

### ⚠ Action 4 — Run feature isolation verification script

Standalone Python script. 20 picks. Manual diff. If even 1 of 20 has a feature value that depends on post-kickoff data → confirms leakage class.

---

## Check D — V8.1 cutoff filter usage scan

Codebase scan: which route files query `predictions` and which apply `trackrecord_filter()` / `v81_predictions_filter()` / `V81_DEPLOYMENT_CUTOFF`?

| Route file | Queries `predictions` | Has v81 filter import | Risk level |
|---|:-:|:-:|---|
| `internal_ops.py` | ✅ | ✅ | OK (audit endpoints, own filters) |
| `homepage.py` | ✅ | ✅ | OK |
| `fixtures.py` | ✅ | ✅ | OK (predictions UI feed) |
| `trackrecord.py` | ✅ | ✅ | OK |
| `admin_v5.py` | ✅ | ✅ | OK (admin) |
| `admin.py` | ✅ | ✅ | OK |
| `strategies.py` | ✅ | ✅ | OK |
| `dashboard.py` | ✅ | ✅ | OK |
| `value_bets.py` | ✅ | ❌ | **⚠ AT RISK** — `/today`, `/stats`, `/backtest-proof` (combo paths excluded) |
| `predictions.py` | ✅ | ❌ | ⚠ list endpoint `/`, single `/{id}`, admin `/run` |
| `matches.py` | ✅ | ❌ | ⚠ match detail + analysis + forecast |
| `route.py` | ✅ | ❌ | ⚠ jouw-route widget queries |
| `admin_finance.py` | ✅ | ❌ | low risk (admin only) |
| `admin_backfill.py` | ✅ | ❌ | low risk (admin maintenance) |
| `admin_research.py` | ✅ | ❌ | low risk (admin only) |

**⚠ At-risk endpoints (user-facing):**
- `value_bets.py`:
  - `GET /today` (line 245) — single value-bet of the day. May mix pre-v81 picks.
  - `GET /stats` (lines 681-696) — stats funnel queries. May mix pre-v81 in totals.
  - `GET /backtest-proof` (line 937) — backtest proof page. **Expected to mix periods, but should not show pre-v81 broken-pipeline rows as "model performance".**
- `predictions.py`:
  - `GET /` (line 62) — paginated predictions list. May surface pre-v81 picks.
  - `GET /{prediction_id}` (line 245) — single prediction detail. OK if it just shows what was stored, but the model-name displayed could be pre-v81 leakage if any.
- `matches.py`:
  - `GET /{match_id}` (line 55) — fetches predictions for a single match.
  - `GET /{match_id}/analysis` (line 172) — analysis page.
  - `GET /{match_id}/forecast` (line 216) — forecast page.
- `route.py`:
  - `GET /quick-pick` (line 341) — likely pulls a featured prediction.

### ⚠ Action 5 — Apply v81 filter to user-facing prediction endpoints

For each at-risk endpoint, decide:
- "This shows aggregates → MUST add v81 filter" (e.g. `/value-bets/stats`, `/value-bets/backtest-proof`)
- "This shows single rows by ID → OK without filter, ID is the gate" (e.g. `/predictions/{id}`)
- "This shows current/upcoming picks → MUST add v81 filter so a pre-v81 stale row doesn't surface" (e.g. `/value-bets/today`, `/route/quick-pick`)

This is a per-endpoint review, not a blanket change.

---

## 1.2 — Data coverage report

### Population overview
- **Total predictions in DB:** 117,830
- **Pre-v8.1 cutoff:** 69,001 (broken feature pipeline; should never be in user-facing aggregates)
- **Post-v8.1 cutoff:** 48,829
- **Post-v8.1 evaluated:** 48,561 (99.45%)
- **Post-v8.1 with snapshot:** 35,810 (73.34% — lower than the previously reported 89% because this pass uses the `predicted_at <= scheduled_at` constraint as well)

### Per-tier coverage (post-v8.1, predicted_at ≤ scheduled_at, simple confidence ladder)

| Tier (conf-only) | Total | With snapshot | Evaluated | Snapshot % |
|---|---:|---:|---:|---:|
| **Platinum** (≥ 0.78) | 2,750 | 2,455 | 2,727 | 89.27% |
| **Gold** (0.70 – 0.78) | 4,946 | 4,424 | 4,896 | 89.45% |
| **Silver** (0.62 – 0.70) | 11,192 | 10,185 | 11,048 | 91.00% |
| **Free** (0.55 – 0.62) | 5,551 | 3,961 | 5,501 | 71.36% |
| Below floor (< 0.55) | 14,260 | 4,655 | 14,259 | 32.64% |

**Reading:**

- Snapshot coverage is healthy on all paid tiers (89-91%). Edge-based filters can be applied with reasonable confidence on these subsets.
- Free tier snapshot coverage drops to 71% — 1,590 free picks lack the data needed for edge filtering.
- Below-floor (sub-0.55) has only 33% snapshot coverage and is excluded from any tier query anyway.

### Live-only sub-coverage

| Cohort | Approx n | Notes |
|---|---:|---|
| All `live` source (post-v8.1) | 911 | Clean strict pre-match |
| Live with snapshot | ~835 | (~91% extrapolated from per-tier rates) |
| Live, evaluated | ~870 | (slightly less than total — recent fixtures still finishing) |
| **Live, evaluated, with snapshot** | **~800** | The TRULY clean validation set |

**This is the only sample we can use to validate parameters without leakage.** ~800 picks across ~3 weeks since deploy. **Per-tier this means ~50-150 per paid tier** — small but defendable.

---

## What this means for the rebuild

### The blockers (must address before Phase 2)

1. **🚨 P1 — Backtest cron doesn't enforce strict pre-match lock.** 35% of `backtest` rows have `predicted_at > scheduled_at`. Fix: trace + fix the cron, then drop the existing polluted rows OR re-stamp them with realistic lead times.

2. **🚨 P1 — Snapshot has no capture-time field.** Can't verify when bookmaker odds were captured. Fix: add `captured_at` field to new snapshot writes; cross-reference odds_history for historical rows.

3. **🚨 P1 — Walk-forward (Phase 2) on the polluted backtest source would compound leakage.** We CANNOT just "do walk-forward over the existing backtest data" because that data has timestamps that don't reflect when features were available. **Phase 2 must run a fresh point-in-time backtest, not query existing rows.**

### The conditional issues (worth fixing for hygiene)

4. **⚠ P2 — Feature isolation script needed.** Spot-check 20 picks via point-in-time feature reproduction. Manual.

5. **⚠ P2 — User-facing endpoints without v81 filter.** Per-endpoint review on `value_bets.py`, `predictions.py`, `matches.py`, `route.py`.

### What's clean

- **Live source: 911 picks, fully strict pre-match locks.** Avg 6.2 days lead time. Use this as the truth set.
- **Snapshot coverage on paid tiers 89-91%.** Edge-based filtering is viable.
- **V8.1 cutoff is enforced in 9 of 15 prediction-querying route files** — the major aggregate endpoints (trackrecord, fixtures, dashboard, homepage) are all covered.

---

## Recommendation: revised plan for Phase 2

The rebuild brief assumes Phase 2 = "walk-forward over existing data". Given the leakage findings, the revised Phase 2 must be:

**Phase 2A (new):** Fix backtest cron pre-match lock enforcement + snapshot capture-time field.

**Phase 2B (new):** **Re-generate** a clean walk-forward backtest from scratch:
- For each historical match between 2025-01-01 and 2026-04-15:
- Cutoff = `match.scheduled_at - 24h` (a real lead-time window)
- Re-run feature_service with strict cutoff
- Re-run forecast_service with the v8.1 model
- Write to a NEW `prediction_source='walk_forward_2026_05'` (don't pollute existing backtest source)
- Snapshot odds captured from `odds_history` rows where `recorded_at <= cutoff`
- Evaluate as match results land

This is heavier than the original brief envisaged but it's the only honest way. Doing walk-forward analysis on the existing polluted backtest data would just amplify the leakage into the parameter selection.

**Phase 2C (validation):** Re-run scenario sweep on the clean walk-forward output. The "+13% ROI on conf≥0.62, edge≥10% recipe" needs to be re-derived on data we can actually trust.

---

## Numbers to revise in earlier docs

These previously-reported numbers were computed on the polluted source mix and need re-running on `live`-only or clean walk-forward data:

| Doc | Number | Likely actual |
|---|---|---|
| `predictions_roi_optimization.md` "+13.26% on n=1,114" | mixed sources | re-run on live + clean walk-forward |
| `engine_v1_audit.md` "Platinum +6.75%, Gold +3.37%" (retroactive) | retroactive backfill | re-run on live |
| `engine_v1_audit.md` live forward-feed "-10.9% Gold+ on n=182" | live (small subset) | already clean (live-only) |
| `integrity_audit_final.md` Engine v1 baseline -2.31% | mixed sources | re-run on live |
| `engine_v2_audit.md` combo backtest +27.48% | partly retroactive (combo selector reads same predictions) | combo audit needs re-validation |

The combo numbers may also be affected — the combo selector reads from the same `predictions` table and the `backtest` source contributes to its inputs. **However, per user directive the combo engine itself is frozen.** What needs verifying is whether the combo audit numbers are honest, not the combo selector code.

---

**STOP. Phase 1 complete. Awaiting approval before Phase 2.**

The rebuild brief's Phase 2 needs revision (see "Recommendation" section above) — running walk-forward over existing data won't produce honest numbers. We need to either:

1. **Fix the backtest cron + regenerate from scratch** (heavy, ~hours of compute, ~weeks of clock time depending on Railway throughput)
2. **Limit ourselves to the 911-pick live cohort for parameter selection** (small but honest)
3. **Both** — use live for now, regenerate backtest as a parallel validation

Pick a path before I start Phase 2.
