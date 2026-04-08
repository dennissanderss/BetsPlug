# API Contract — Backend ↔ Frontend

## Status: 0 breaking mismatches found

All backend endpoints return shapes that match the frontend TypeScript types.

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
- Bet of the Day: when `available: false`, all other fields are null. Frontend should show "No bet today" message.
- Dashboard metrics: when no data exists, backend returns zeros with the response structure intact.
