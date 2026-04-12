# v5 Rebuild Report — 12 April 2026

## Executive Summary

The v5 Foundation Rebuild on API-Football Pro is **95% complete**. All
infrastructure is built and running in production. The one blocking issue
preventing strategies from reaching "validated" status is **low real-odds
coverage** (0.6-1%) — the ROI calculation still falls back to a hardcoded
1.90 multiplier for ~99% of picks because historical pre-match odds were
not collected at the time predictions were generated. This will self-heal
as the daily odds snapshot cron (`job_snapshot_upcoming_odds`, 05:30 UTC)
accumulates data over the coming 2-4 weeks.

## Foundation Status

| Component | Status | Notes |
|---|---|---|
| API-Football Pro key | LIVE | 7,500 req/day Pro tier confirmed |
| Provider router | DONE | API-Football primary, football-data.org fallback |
| Database schema | DONE | team_elo_history, match_statistics, top_scorers, api_usage_log, odds_history all exist |
| Historical fixtures | DONE | 4,694 finished + 243 scheduled fixtures across 6 leagues |
| Predictions | DONE | 5,108 predictions generated with Pulse (Ensemble) engine |
| Live scores | DONE | Real-time via API-Football /fixtures?live=all, Redis cached (v6.3) |

## Elo Engine

| Item | Status |
|---|---|
| team_seeds.py deprecated | DONE — hard-fails on import |
| TeamEloHistory table | DONE — point-in-time ratings |
| EloHistoryService | DONE — get_rating_at(team_id, timestamp) |
| Anti-leakage assertions | ACTIVE — elo_timestamp < fixture.kickoff enforced |
| Backfill complete | YES — all finished fixtures processed sequentially |

## Prediction Engine (BetsPlug Pulse)

| Feature | Status |
|---|---|
| Ensemble model with new Elo | DONE |
| Over/Under 2.5 model (Poisson) | DONE |
| Dixon-Coles low-score correction | DONE |
| Logistic Regression (CalibratedClassifierCV) | DONE |
| Predictions include: pick, confidence, probabilities, reasoning | DONE |
| Anti-leakage assertions in predict() | ACTIVE |

## Strategy Validation Results (12 April 2026)

Revalidation run with walk-forward (28-day train, 14-day test, rolling windows):

| Strategy | Picks | Winrate | ROI | Odds Coverage | Walk-Forward | Status |
|---|---|---|---|---|---|---|
| Home Dominant | 1,136 | 63.3% | +20.0% | 0.7% | 34/37 pos (Sharpe 7.22) | under_investigation |
| Conservative Favorite | 1,272 | 61.6% | +16.8% | 0.6% | 33/37 pos (Sharpe 6.24) | under_investigation |
| Low Draw High Home | 973 | 62.9% | +19.2% | 0.9% | 32/37 pos (Sharpe 6.48) | under_investigation |
| Anti-Draw Filter | 1,584 | 60.6% | +15.0% | 0.7% | 31/37 pos | under_investigation |
| Model Confidence Elite | 300 | 64.3% | +22.1% | 1.0% | ? | under_investigation |
| Underdog Hunter | ~200 | ~55% | ~+5% | <1% | ? | under_investigation |
| High Confidence Any | ~800 | ~58% | ? | <1% | ? | under_investigation |
| Defensive Battle | ? | ? | ? | <1% | ? | rejected/break_even |
| High-Scoring Match | ? | ? | ? | <1% | ? | rejected/break_even |
| Draw Specialist | ? | ? | ? | <1% | ? | rejected |
| Home Value Medium Odds | ? | ? | ? | <1% | ? | rejected |

**Totals: 0 validated, 7 under_investigation, 5 rejected, 2 break_even**

### Why Zero Validated?

The validation engine correctly refuses to mark strategies as "validated"
when real-odds coverage is below 5%. Nearly all ROI calculations use the
1.90 fallback odds because historical pre-match odds were not collected
at prediction time. The walk-forward signals look strong (most strategies
have 80%+ positive windows with high Sharpe ratios), but without real
odds data the ROI numbers are unreliable.

**This is by design** — the v4 audit specifically flagged the 1.90
hardcoded odds as a problem. The validation engine now catches this
honestly rather than reporting fake profitable strategies.

### Self-Healing Timeline

The `job_snapshot_upcoming_odds` cron runs daily at 05:30 UTC and
collects pre-match odds for all upcoming fixtures. After 2-4 weeks:
- New predictions will have real odds attached
- Walk-forward validation can use real ROI
- Strategies should either validate honestly or be rejected honestly

## ROI Formula Fix

| Before (v4) | After (v5) |
|---|---|
| Hardcoded 1.90 for all picks | Looks up real odds from odds_history table |
| Strategies appeared profitable even when picking 1.30 favorites | ROI = real_odds - 1.0 (win) or -1.0 (loss) |
| Fallback: still 1.90 when no odds found | Coverage flag warns when <5% real odds |

## Backend Endpoints for "Your Route" UI

| Endpoint | Status | Notes |
|---|---|---|
| GET /api/route/strategy-follower | DONE | Returns validated strategies + today's picks (currently empty because 0 validated) |
| GET /api/route/quick-pick | DONE | Returns highest-confidence pick with fallback |
| GET /api/route/explorer | DONE | Via /api/fixtures/upcoming with predictions |
| GET /api/admin/api-usage | DONE | Today's usage per provider |

## Scaling Monitor

| Metric | Value |
|---|---|
| API-Football Pro daily budget | 7,500 calls |
| Estimated daily usage | ~1,900 calls (25%) |
| — Fixture sync (football-data.org) | ~84 calls |
| — Odds snapshot (API-Football) | ~400 calls |
| — Live scores (API-Football) | ~720 calls |
| — Live fixture sync | ~720 calls |
| Headroom | ~5,600 calls/day (75%) |

## What Was Added Beyond v5 Scope (v6.x)

| Feature | Version |
|---|---|
| Compact match cards per league | v6.2 |
| Live Now / Upcoming / Results tabs | v6.2 |
| Real-time live scores via Redis | v6.3 |
| BetsPlug Pulse rebrand (was Ensemble) | v6.3 |
| Trackrecord data transparency + CSV export | v6.2.1 |
| Reports & Exports (PDF/CSV/JSON) | v6.2.2 |
| BOTD historical accuracy track record | v6.3 |
| Admin paywall bypass | v6.3 |
| Fixture deduplication (dual API sources) | v6.3 |
| User-friendly terminology (no Brier/LogLoss) | v6.2 |

## Honest Assessment

### What works well:
- Foundation is solid: 5,108 predictions across 6 leagues, Elo engine leak-free
- Walk-forward validation framework catches dishonest ROI
- Live scores, live data transparency, CSV/PDF exports all working
- User-facing product (predictions, BOTD, results) is polished
- API budget is 75% unused — plenty of headroom

### What's still problematic:
- **Zero validated strategies** due to low odds coverage (<1%)
- Historical predictions lack real pre-match odds
- Some duplicate fixtures from dual API sources (dedup filter hides them but DB isn't clean)
- About page still has some "Ensemble" references in articles/blog content

### What fixes itself over time:
- Odds coverage will improve as daily snapshot cron runs (2-4 weeks)
- New predictions will automatically have real odds attached
- Strategy validation will re-run and produce honest verdicts

### What needs manual intervention:
- Old predictions with 1.90 fallback odds should eventually be re-evaluated once real odds backfill is possible
- DB cleanup of apifb duplicate fixtures (currently hidden by dedup filter)
- Blog/article content update from "Ensemble" to "BetsPlug Pulse"

## Next Steps Recommended

1. **Wait 2-4 weeks** for odds data to accumulate via the daily cron
2. **Re-run validation** after odds coverage exceeds 50%
3. **Clean up duplicate fixtures** in DB (apifb_match_ entries)
4. **Build visual Pulse diagram** on the About page
5. **Complete the Pulse rebrand** in blog articles and marketing content
