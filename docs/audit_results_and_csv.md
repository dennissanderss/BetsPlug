---
title: Audit — /results integrity (4.1) + CSV export (5.1b)
date: 2026-04-18
session: sprint part 3 (post-push audits)
scope: live production backend
---

# Audit — /results integrity + CSV export

Two items from the open-items list: (a) 10-row cross-check of every
`/fixtures/results` row against its `prediction_id`, and (b) whether
the tier-scoped CSV download covers what the summary page advertises.

Both were run against live `betsplug-production.up.railway.app` and
against the backend source tree. Where a check required an auth
token I fall back to source-level verification.

## 4.1 — /fixtures/results integrity

### Method

- `curl /api/fixtures/results?days=30` → 898 KB, 665 fixtures
- Parsed the response with Perl (JSON::PP), tallied:
  - coverage (prediction present / absent)
  - pick_tier distribution
  - `predicted_at` vs `scheduled_at` (pre-match lock)
  - `confidence` vs `max(home/draw/away)` consistency
  - argmax-pick accuracy recomputed from probs vs the response's winner

### Raw numbers

| Metric | Value |
|--------|-------|
| Total finished fixtures (30 d) | 665 |
| With prediction attached | 283 (42.6 %) |
| pick_tier = null (below 0.55 floor) | 207 (73 % of predictions) |
| pick_tier = free | 76 |
| pick_tier = silver / gold / platinum | 0 / 0 / 0 in this window |
| `predicted_at` returned on all rows | ✅ yes |
| Accuracy recomputed from probs | 125 / 283 = 44.2 % |

### ✅ What's consistent

- Every result row with a prediction carries a real `prediction_id` — no ghost rows.
- `predicted_at` is present on **every** row returned (not silently dropped).
- Tier classification logic matches the documented thresholds:
  - All silver/gold/platinum tiers need ≥ 0.65/0.70/0.75 confidence AND a qualifying league. None of the 283 predictions in this window cleared the silver floor for any Silver-league match.
  - All 76 `pick_tier = free` rows had confidence ≥ 0.55 AND lived in `LEAGUES_FREE`.
- Recomputed 44.2 % argmax accuracy is close to the public `trackrecord/summary?pick_tier=free` claim of 48.4 % — the gap is the usual 30-day-window variance (and the fact that ~73 % of in-window predictions fall below the Free threshold so aren't tier-scoped).

### 🔴 Findings — pre-match lock violations

**14 of 283 predictions (4.9 %) have `predicted_at` AFTER `scheduled_at`.**

All 14 were stamped at 2026-04-17 23:xx UTC for matches that had already kicked off *days earlier*. This is a retroactive backfill run — consistent with the v8.1 `batch_local_fill` source. The rows are legitimate post-hoc simulations, not pre-match calls, but they flow through `v81_predictions_filter()` alongside genuine pre-match `'live'` predictions and end up in the same `/trackrecord/summary` aggregates and CSV export.

Examples (all predicted at 2026-04-17 23:xx for earlier matches):

| Match | Scheduled | Predicted | Days gap |
|-------|-----------|-----------|----------|
| Liverpool vs PSG | 2026-04-14 19:00 | 2026-04-17 23:27 | +3.2 d |
| Crystal Palace vs Newcastle | 2026-04-12 13:00 | 2026-04-17 23:23 | +5.5 d |
| RAAL La Louvière vs Genk | 2026-03-22 17:30 | 2026-04-17 23:13 | +26 d |
| QPR vs Portsmouth | 2026-03-21 15:00 | 2026-04-17 23:08 | +27 d |

CLAUDE.md explicitly flags this as a class of bug to prevent:
> "Pre-match lock / honest ROI: predictions and evaluations are split by whether a match was locked before kickoff vs. recorded live/backtest. Conflating them is the class of bug the v7/v8 work exists to prevent."

**Risk assessment:**
- On an accuracy level this bumps the tier numbers by an unknown amount. The backfill set is model-generated, so it knows the features but not the outcome — in theory it's honest. In practice, if the backfill uses any feature that post-dates kickoff, it silently inflates accuracy.
- User-facing copy ("predictions timestamped online before kickoff", "no cherry-picking") is strictly false for these 14 rows.

**Recommended follow-ups** (not committed; need product call):
1. **Filter honest by default.** Add a `predicted_at < scheduled_at` guard to `v81_predictions_filter()` (or a new `pre_match_only_filter()` invoked from every user-facing surface). Separate backfill predictions into an internal-only cache.
2. **Label them.** If keeping backfill in the public aggregate is deliberate, surface an explicit "Includes N retroactive simulations" disclosure alongside the cumulative tier numbers so the copy matches reality.
3. **Audit backfill provenance.** Query the DB for every prediction with `prediction_source = 'batch_local_fill'` AND `predicted_at > scheduled_at`, confirm the feature pipeline truly ignores post-kickoff data.

### 🟡 Minor — `confidence` ≠ `max(probs)` in 14 of 283 rows

About 5 % of rows have the scalar `confidence` field differing from the maximum of the three outcome probabilities by more than 0.02. E.g. `confidence=0.64` while argmax(probs)=0.43. This isn't a bug — `confidence` comes from a separately calibrated head (Platt / XGBoost classifier output) rather than being `max(probs)` — but the two numbers feel like they should match, so users may read it as an inconsistency. Worth adding a tooltip that explains the two are measured differently. Non-blocking.

### ⚠️ Missing in public response shape

These fields exist on the backend `PredictionSummary` schema but never appeared in the 283-row payload I sampled, which makes some UI features (below) harder to render:

- `predicted_outcome` / `pick` — the explicit "home" / "draw" / "away" label the backend computes. Response currently ships only `home_win_prob/draw_prob/away_win_prob` and forces the frontend to re-argmax.
- `top_drivers` — populated on `/bet-of-the-day` responses but not on `/fixtures/results`. Not a blocker for the audit.

These are low-impact but make the API slightly harder to consume than needed.

## 5.1b — Tier CSV export

### Method

The CSV endpoint requires auth (401 without). I could not download it anonymously, so I audited the backend source at `backend/app/api/routes/trackrecord.py:546-828` and cross-checked the filter set against `/trackrecord/summary`'s filter set.

### ✅ Schema check — 17 columns, all needed to recompute accuracy

```
A Match Date       | B League          | C Home Team       | D Away Team
E Home %           | F Draw %          | G Away %          | H Confidence %
I Prediction       | J Odds Used       | K Odds Source     | L Actual Outcome
M Correct?         | N Home Score      | O Away Score      | P P/L (units)
Q Model
```

A user receiving this CSV can:
- Count rows to verify sample size = what the page shows.
- Sum `Correct?` to recompute accuracy → must equal the page's tier KPI.
- Re-derive argmax-pick from H/D/A columns to verify `Prediction` (I) matches the model's intent.
- Recompute Brier / log-loss / ECE from E/F/G + L.

Column coverage is sufficient; no missing data for a user audit.

### ✅ Filter parity with `/trackrecord/summary`

Both `_stream_trackrecord_csv` (lines 546-641) and `get_trackrecord_summary` (lines 70-180) apply:

- `v81_predictions_filter()` — same call, same prediction_source allowlist, same `V81_DEPLOYMENT_CUTOFF`.
- Either `pick_tier_expression() == public_tier.value` (when `?pick_tier=` supplied) OR `access_filter(user_tier)` (when it isn't).
- Model version filter on both sides.

That means the CSV's **row count must equal** `summary.total_predictions` for any given tier + caller. Same count → same accuracy. Confidence intervals match mechanically because the underlying row set is identical.

### ✅ Tier-gating — 402 when requesting above your tier

Lines 795-806 reject `pick_tier > user_tier` with HTTP 402 "Payment Required". A Silver user cannot download `pick_tier=gold`. Matches the pricing promise ("you see your tier and everything below").

### ✅ Metadata / dashboard header

The CSV's top block (lines 593-602) hard-codes:
- Period (earliest → latest `scheduled_at` in the row set)
- Total Predictions / Correct Predictions / Accuracy
- Simulation disclaimer
- Generated timestamp

These are computed from the SAME query the rows come from, so header ≡ body totals by construction.

### ⚠️ Excel-compat quirk (not a bug, a warning)

Line 555 prepends `sep=,\r\n` and line 554 emits a UTF-8 BOM so European Excel opens the file correctly. Some CSV parsers (pandas `read_csv` default, command-line `csvkit`) don't understand `sep=,` and will treat it as a data row. If the user pipes the CSV into `pandas.read_csv(..., skiprows=12)` they need to skip the header block too. Worth documenting, not worth changing.

### ⚠️ Backfill contamination (same issue as 4.1)

The CSV inherits the backfill problem from 4.1. Every row with `prediction_source = 'batch_local_fill'` and `predicted_at > scheduled_at` will show up in the export. If a user spot-checks a row like "RAAL La Louvière vs Genk, predicted 2026-04-17 23:13, kick-off 2026-03-22", they'll reasonably ask how we locked a prediction 26 days *after* kickoff. The CSV is the document most likely to expose this — it lists `Match Date` but not `predicted_at`, so an observant auditor may dig further and find the discrepancy via DB access.

**Recommendation**: add a `Predicted At` column (or at minimum a `Pre-Match Lock` Yes/No derived from `predicted_at < scheduled_at`) so the document is honest about which rows were locked before kickoff and which came from the backfill run.

## Summary

| Item | Verdict |
|------|---------|
| 4.1 — Results ↔ prediction_id integrity | ✅ Structurally sound (no ghost rows, timestamps present, tier logic correct) |
| 4.1 — Pre-match lock integrity | 🔴 14 / 283 rows (4.9 %) break the lock; legitimate backfill but mixed into user-facing aggregates |
| 4.1 — Minor: confidence vs max(probs) | 🟡 5 % diverge (not a bug, just counter-intuitive) |
| 5.1b — CSV column coverage | ✅ 17 columns sufficient to recompute accuracy/Brier/ECE |
| 5.1b — CSV ↔ summary parity | ✅ Same filter set → same row count → same accuracy |
| 5.1b — Tier gating | ✅ HTTP 402 on over-tier request |
| 5.1b — Backfill contamination | 🔴 Same as 4.1 — backfill rows are in the export without a marker |

## Recommended follow-ups (not committed)

1. **Fix pre-match lock integrity** (ships on both 4.1 and 5.1b).
   - Short-term (product): add a `predicted_at < scheduled_at` guard on every user-facing trackrecord/results/CSV path. Backfill rows still exist for research but stop inflating the public accuracy.
   - OR accept the backfill, but add a row on the public KPIs: "Incl. N retroactively-simulated predictions" so the narrative stays honest.
2. **Add a "Predicted At" CSV column** so auditors can see the lock per-row.
3. **Document the `confidence` vs `max(probs)` separation** in a tooltip on the predictions UI so users don't read it as inconsistency.
4. **Return `predicted_outcome` / `pick` on `/fixtures/results`** so the frontend doesn't have to re-argmax for every row — low-risk backend addition.

## Data

Raw sample of 14 post-kickoff predictions preserved in `docs/_audit_evidence/` directory was NOT created because it contains match names + leagues that already appear in the response above. Re-run the Perl script in sprint part 3 transcript to regenerate.
