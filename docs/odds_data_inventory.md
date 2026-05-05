# Phase 1 — Odds + Predictions Data Inventory

*Generated 2026-05-06 via `GET /api/internal-ops/audit/phase1-odds-inventory`. Read-only audit, no mutations.*

---

## Executive summary

| Metric | Value | Verdict |
|---|---|---|
| Total odds rows | 30,187 | ✓ healthy volume |
| Matches with odds | 14,589 | ✓ broad |
| Date range | 2022-07-22 → 2026-05-05 | ✓ ~3.8 years |
| Bookmakers | 3 (Bet365, API-Football, Pinnacle×1) | ⚠ Pinnacle is 1 stray row |
| Unrealistic odds | 0 | ✓ |
| Post-kickoff rows | 0 | ✓ pure pre-match |
| Avg overround | 1.064 (~6.4% margin) | ✓ realistic |
| Predictions with pre-match odds | 34,798 / 117,751 = 30% | ⚠ moderate gap |
| Predictions with closing_odds_snapshot | 104,732 / 117,751 = 89% | ✓ |
| Predictions evaluated | 117,506 / 117,751 = 99.8% | ✓ |
| Duplicate odds groups | 5,427 | ✗ **false positive** (see below) |

---

## A — Total odds volume

```json
{
  "total_odds_rows": 30187,
  "matches_with_odds": 14589,
  "bookmakers": 3,
  "oldest_odds": "2022-07-22T00:00:00+00:00",
  "newest_odds": "2026-05-05T20:02:24+00:00"
}
```

**Reading:** healthy body covering July 2022 → today. 14,589 unique matches with at least one odds row.

---

## B — Per bookmaker

| Bookmaker | Rows | Unique matches | Avg sum-odds | First seen | Last seen |
|---|---:|---:|---:|---|---|
| **bet365_closing** | 13,901 | 13,901 | 10.53 | 2022-07-22 | 2026-05-04 |
| **api_football_avg** | 5,431 | 957 | 10.12 | 2026-04-15 | 2026-05-05 |
| **pinnacle_closing** | 1 | 1 | 9.62 | 2023-01-08 | 2023-01-08 |

**Reading:**
- **Bet365 closing** = football-data.co.uk import. 1 row per match, deepest history.
- **API-Football avg** = our paid live ingestion. 957 matches × 5.7 rows = price progression rows since deploy.
- **Pinnacle closing × 1** = stray. Single row from Jan 2023, likely test/manual insert. **Recommend: investigate or delete to clean up.**

---

## C — Per market

| Market | Rows | Unique matches |
|---|---:|---:|
| 1x2 | 19,333 | 14,589 |
| btts | 5,427 | 957 |
| over_under_2_5 | 5,427 | 957 |

**Reading:** btts + over_under_2_5 are populated only by the API-Football live feed (957 matches since deploy). Football-data.co.uk import only filled 1X2.

---

## D — Pre-match vs post-kickoff timing

```json
{ "pre_match": 30187, "post_kickoff": 0 }
```

**Reading:** ✓ **100% pre-match.** No row got recorded after kickoff. Trackrecord_filter and ROI calculator can trust the data.

---

## E — Window distribution (time-to-kickoff at recording)

| Bucket | Rows | Share |
|---|---:|---:|
| Ideal (4h–72h pre-KO) | 20,164 | 66.8% |
| Too old (>72h pre-KO) | 9,942 | 32.9% |
| Last minute (<4h pre-KO) | 81 | 0.3% |
| Post-kickoff | 0 | 0.0% |

**Reading:**
- 67% of odds are in the sweet spot for "honest closing line" use
- 33% are >72h before KO — these are the football-data.co.uk closing CSVs which list the price as of an early-week snapshot, not the actual closing line. Acceptable but worth noting in marketing claims (we use "real bookmaker odds" which is true; "closing line" is partially true).

---

## F — Predictions coverage with odds

| Metric | Count | % of total |
|---|---:|---:|
| Total predictions | 117,751 | 100% |
| With pre-match odds (via odds_history) | 34,798 | 29.6% |
| With closing_odds_snapshot (JSONB on prediction row) | 104,732 | 88.9% |
| Evaluated | 117,506 | 99.8% |

**Reading:**
- Engine 1 (`realised_pnl_1x2` reads odds_history): **29.6% real-odds coverage** on full historical body. Means ~70% of ROI-eligible picks fall back to model-fair odds (zero-EV).
- Engine 2 (combo selector reads closing_odds_snapshot): **88.9% coverage**. Much healthier because football-data.co.uk import patched the JSONB field directly.
- Evaluation completeness: 99.8% — all-but-200 picks have a result attached.

⚠ **Engine 1 ROI numbers will continue to look near-zero on the historical aggregate** because 70% of picks lack real odds. Combo backtest is on much firmer ground.

---

## G — Coverage per tier (post-deploy v8.1 only, created_at ≥ 2026-04-16)

| Tier | Total | With odds | Evaluated | Usable for ROI | Coverage |
|---|---:|---:|---:|---:|---:|
| Platinum | 1,891 | 1,074 | 1,884 | 1,067 | **56.8%** |
| Gold | 19,842 | 7,141 | 19,781 | 7,084 | 36.0% |
| Silver | 42,130 | 15,635 | 41,972 | 15,501 | 37.1% |
| Free | 24,181 | 7,930 | 24,162 | 7,916 | 32.8% |
| Below floor | 8,937 | 2,948 | 8,937 | 2,948 | 33.0% |

**Reading:**
- Higher tiers have higher odds coverage — Platinum 57% vs Free 33%. Reflects football-data.co.uk's better coverage on top-leagues where the high-confidence picks live.
- Engine 1 Pro Engine v2 page can claim ~57% real-odds-validated Platinum picks.

---

## H — Coverage per month (key gaps)

| Period | Coverage | Note |
|---|---:|---|
| 2026-05 | 93.2% | Recent, live odds-cron working |
| 2026-04 | 59.9% | Live cron started 16 Apr |
| 2026-03 → 2025-08 | ~30-50% | football-data.co.uk import |
| **2025-07** | **1.0%** | ⚠ Summer stop |
| **2025-06** | **4.2%** | ⚠ Summer stop |
| 2025-05 → 2024-08 | ~30-50% | Steady |
| **2024-07** | **1.2%** | ⚠ Summer stop |
| **2024-06** | **3.0%** | ⚠ Summer stop |
| 2024-05 → 2023-08 | ~30-50% | Steady |
| **2023-07** | **0.9%** | ⚠ Summer stop |
| **2023-06** | **8.9%** | ⚠ Summer stop |
| 2023-05 → 2022-08 | ~30-50% | Steady |
| **Pre-2022-07** | **0.0%** | ⚠ Outside football-data.co.uk import window |

**Reading:**
- Three identifiable gaps: summer stops (June/July) every year + pre-July 2022 (no data imported)
- Inside-season coverage is consistent at 30-50%
- 117k predictions extends back to Sep 2021, but only 35k of those (post-2022-07) have real odds attached
- Engine 1 long-window backtests (>3 years) will have fundamentally different coverage in early period

---

## I — Unrealistic odds

```json
{ "I_unrealistic_odds_count": 0 }
```

**Reading:** ✓ no garbage data. All odds in [1.01, 100].

---

## J — Overround stats

| Metric | Value |
|---|---:|
| Below fair (sum < 1.0, impossible) | 0 |
| Huge margin (sum > 1.20) | 0 |
| Average overround | 1.064 (≈6.4% margin) |
| Min overround | 1.014 (Pinnacle exchange-quality) |
| Max overround | 1.159 (still reasonable for retail bookies) |

**Reading:** ✓ healthy bookmaker margin distribution. No corruption, no rounding issues.

---

## K — Duplicate odds groups

```json
{ "K_duplicate_odds_groups": 5427 }
```

⚠ **FALSE POSITIVE — query bug, not a data bug.**

The query groups by `(match_id, source, recorded_at)` without `market`. The 957 API-Football live matches each have 3 rows (1X2 + btts + over_under_2_5) inserted at the same `recorded_at` timestamp per polling cycle. With ~5.7 polls per match, that's ~957 × 5.7 = 5,455 "groups" of 3 rows each → flagged by query K but legitimately distinct rows on the `market` axis.

**Recommend:** rerun query K with `market` in the GROUP BY; expect zero true duplicates.

---

## Conclusions for Phase 1

**Healthy:**
- ✓ Pure pre-match data (no kickoff contamination)
- ✓ No corrupt or unrealistic odds
- ✓ Healthy overround distribution
- ✓ Wide date range (3.8 years)
- ✓ Snapshot coverage at 89% (Engine 2 fed)

**Coverage gaps:**
- ⚠ Engine 1 odds-history coverage is 30% — ~70% of historical picks still lack real odds
- ⚠ Summer-stop months have <5% coverage by design (football calendar)
- ⚠ Pre-July 2022 has 0% odds (outside import window)
- ⚠ Tier-asymmetric: Free at 33% vs Platinum at 57%

**Anomalies:**
- 1 stray Pinnacle row from Jan 2023 (negligible but unclean)
- Query K false-positive due to missing `market` in GROUP BY (not a real duplicate issue)

**Recommendations (no fixes applied — diagnosis only):**

1. **Decide on `recorded_at >72h` rows** (33% of body): keep as "pre-match" or relabel to distinguish from true closing line?
2. **Investigate the 1 Pinnacle row** in Jan 2023; either clean up or backfill more Pinnacle history.
3. **Communicate Engine 1 coverage transparently**: "ROI computed on 30% of picks where real bookmaker odds were on file." Avoid headline claims like "+X% ROI on full backtest" without that caveat.
4. **Engine 2 is on solid ground**: 89% snapshot coverage, healthy quality, ready for marketing on combo backtest body.

---

**STOP. Phase 1 complete. Awaiting approval before Phase 2 (Engine v1 audit).**
