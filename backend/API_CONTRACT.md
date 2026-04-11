# API Contract — Backend ↔ Frontend

## Status: 0 breaking mismatches found

All backend endpoints return shapes that match the frontend TypeScript types.

---

## Strategy Lab — 2026-04-11 contract additions

The `GET /api/strategies/{id}/metrics` response grew **new fields** as part
of the v4 audit session. All new fields are additive — existing code that
reads `winrate` and `roi` keeps working, but the values of those two fields
are now **clamped to 0.0 for strategies flagged as `under_investigation`**
so that the current frontend's "Profitable / Unprofitable" badge logic
(`metrics.has_data && metrics.roi > 0`) naturally stops labelling leaky
strategies as profitable.

### New fields on `/strategies/{id}/metrics`

```jsonc
{
  // … existing fields (strategy_id, strategy_name, sample_size, max_drawdown,
  // profit_factor, avg_brier, correct, incorrect, has_data) …

  "winrate":  0.0,         // CLAMPED to 0.0 when validation_status is "under_investigation"
  "roi":      0.0,         // CLAMPED to 0.0 when validation_status is "under_investigation"

  "raw_winrate": 0.7262,   // NEW. Always the unadjusted computed number.
  "raw_roi":     0.3798,   // NEW. Always the unadjusted computed number.

  "validation_status": "under_investigation",  // NEW. See enum below.
  "validation_notes":  "Strike rate of 72.6% exceeds the 58% plausibility ceiling …"
}
```

### `validation_status` enum

| Value                  | Meaning                                                                 | Recommended frontend treatment                             |
|------------------------|-------------------------------------------------------------------------|------------------------------------------------------------|
| `validated`            | ROI > 2%, winrate ≤ 58%, ROI ≤ 8%, sample ≥ 30                          | Show "Validated" badge. OK to display ROI and winrate.     |
| `break_even`           | Sample ≥ 30 but ROI within ±2%                                          | Show "Break-even" badge. Display numbers in neutral color. |
| `rejected`             | Sample ≥ 30, ROI < −2%                                                  | Show "Unprofitable" badge (existing archived-strategies section). |
| `insufficient_data`    | Sample < 30                                                             | Hide or show "Not enough picks yet".                        |
| `under_investigation`  | Winrate > 58% OR ROI > 8% — implausible, flagged for leakage review.    | Show **"Under Investigation"** badge in amber. DO NOT label as Profitable. Display `validation_notes` as a tooltip. Optionally surface `raw_winrate` / `raw_roi` behind a "raw (disputed)" label. |

### New admin endpoint: `POST /api/strategies/validation-refresh`

Walks every strategy in the DB, recomputes metrics against every evaluated
prediction, applies the plausibility gates above, and sets
`strategies.is_active` to `true` only where `validation_status ==
"validated"`. Also busts the relevant Redis cache keys.

Response shape:

```jsonc
{
  "total_strategies": 12,
  "validated":        1,
  "under_investigation": 5,
  "rejected":         0,
  "break_even":       0,
  "insufficient_data": 6,
  "results": [
    {
      "id": "…",
      "name": "Low Draw High Home",
      "sample_size": 420,
      "raw_winrate": 0.7262,
      "raw_roi":     0.3798,
      "validation_status": "under_investigation",
      "validation_notes": "…",
      "was_active": true,
      "is_active":  false,
      "flipped":    true
    },
    …
  ]
}
```

Use case: Dennis hits this endpoint once after every deploy that touches
the forecasting model or the ingestion pipeline, to re-validate every
strategy against the latest data and flip `is_active` automatically.

### Behaviour of `GET /api/strategies/` (list)

**Unchanged** — still returns all strategies regardless of `is_active`
unless `?active_only=true` is passed. If the frontend wants to show only
validated strategies on the main Strategy Lab page, pass
`?active_only=true` (the query param already exists and is wired through
the SQL). After `validation-refresh` runs, that filter naturally excludes
the under-investigation strategies.

---


## Endpoint Contracts

### GET /api/fixtures/upcoming?days=7
**Frontend expects**: `FixturesResponse { count, disclaimer, fixtures: Fixture[] }`
**Backend returns**: `UpcomingFixturesResponse { count, disclaimer, fixtures: FixtureItem[] }`
**Match**: YES

**Fixture.prediction shape**:
- Frontend: `FixturePrediction { home_win_prob, draw_prob, away_win_prob, confidence, model_name, predicted_at? }`
- Backend: `PredictionSummary { id, home_win_prob, draw_prob, away_win_prob, confidence, model_name, predicted_at, ... }`
- **Match**: YES (backend has extra fields which are ignored by frontend)

### GET /api/fixtures/today
**Frontend expects**: `FixturesResponse { date, count, disclaimer, fixtures[] }`
**Backend returns**: `TodayFixturesResponse { date, count, disclaimer, fixtures[] }`
**Match**: YES

### GET /api/fixtures/results?days=7
**Frontend expects**: `FixturesResponse { days, count, disclaimer, fixtures[] }`
**Backend returns**: `ResultsResponse { days, count, disclaimer, fixtures[] }`
**Match**: YES

### GET /api/predictions/
**Frontend expects**: `Prediction[]` (array)
**Backend returns**: `List[PredictionResponse]` (array)
**Match**: YES

### GET /api/predictions/{id}
**Frontend expects**: `Prediction { id, match_id, home_win_prob, ..., explanation?, evaluation? }`
**Backend returns**: `PredictionResponse` with same fields
**Match**: YES

### POST /api/predictions/run
**Frontend expects**: `ForecastOutput { match_id, home_win_prob, ..., explanation, disclaimer }`
**Backend returns**: `ForecastOutput` with same fields
**Match**: YES

### GET /api/bet-of-the-day/
**Frontend expects**: `{ available, match_id, home_team, away_team, league, confidence, ... }`
**Backend returns**: Same shape with `available: false` when no candidate
**Match**: YES

### GET /api/trackrecord/summary
**Frontend expects**: `TrackrecordSummary { total_predictions, accuracy, avg_brier_score, ... }`
**Backend returns**: Same shape (all nulls/zeros when no data)
**Match**: YES

### GET /api/leagues/
**Frontend expects**: `League[]`
**Backend returns**: `List[LeagueResponse]`
**Match**: YES

### GET /api/live/today
**Frontend expects**: `{ status, count, matches: LiveMatch[] }`
**Backend returns**: Same shape
**Match**: YES

### GET /api/health
**Frontend expects**: `{ status, checks: {...} }`
**Backend returns**: `{ status, checks, version, timestamp }`
**Match**: YES (extra fields ignored)

---

## Notes

- Backend returns `is_simulation: true` and `disclaimer` string on all prediction-related endpoints
- Frontend should always display disclaimer when showing predictions
- Empty states: Backend returns `count: 0` with empty arrays, never errors. Frontend should check `count` or array length.
- Pick of the Day: when `available: false`, all other fields are null. Frontend should show "No pick today" message.
- Dashboard metrics: when no data exists, backend returns zeros with the response structure intact.
