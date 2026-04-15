# BetsPlug — Strategy Validation Report v2

_Written 2026-04-11 during the v4 audit session. Supersedes
`backend/docs/strategy_research_report.md` which was generated on 2026-04-09
on a smaller sample and then silently overwritten by a later `run-research`
call._

## Executive summary

**All 6 "Profitable" strategies currently displayed on the BetsPlug Strategy
Lab fail the basic plausibility test.** The numbers they show are inflated
by a combination of:

1. **Feature leakage** — the Elo sub-model of the ensemble is instantiated
   fresh per prediction and seeds its ratings from a hand-curated
   `team_seeds.py` file that encodes **present-day** team strength. This
   means historical backfilled predictions use post-hoc knowledge.
2. **ROI formula using the wrong odds assumption** — the metrics endpoint
   hardcodes average odds of 1.90, but the strategies select overwhelming
   home favorites whose real market odds are 1.30-1.60. This double-inflates
   ROI on top of the already-leaky win rate.

Five strategies have been relabelled as `under_investigation` by the new
plausibility gates in `backend/app/api/routes/strategies.py`. One strategy
(Underdog Hunter) falls below the leakage ceilings and is classified as
`validated` under the new gates, but this does **not** mean it is
genuinely profitable — see the "honest caveat" below.

## Production state at the start of this session

Queried live from
`https://betsplug-production.up.railway.app/api/strategies/{id}/metrics`
on 2026-04-11:

| Strategy              | Sample | Reported winrate | Reported ROI | is_active | Plausibility |
|-----------------------|-------:|-----------------:|-------------:|----------:|:-------------|
| Low Draw High Home    | 420    | 72.62%           | +37.98%      | ✅        | ❌ impossible  |
| Home Dominant         | 414    | 74.15%           | +40.89%      | ✅        | ❌ impossible  |
| Conservative Favorite | 425    | 70.35%           | +33.67%      | ✅        | ❌ impossible  |
| Strong Home Favorite  | 754    | 68.30%           | +29.77%      | ✅        | ❌ impossible  |
| Anti-Draw Filter      | 776    | 67.27%           | +27.81%      | ✅        | ❌ impossible  |
| Underdog Hunter       | 649    | 55.62%           | +5.69%       | ✅        | ⚠️ borderline  |

For reference: break-even strike rate at 1.90 flat odds is 52.63%. A
well-trained professional 1X2 model caps out around 53-56%. Any winrate
above 60% on a 100+ sample is a tell-tale sign of leakage or placeholder
data. Five of these six claim **≥ 67%** on samples of several hundred.

## Leakage test 1: feature timestamp audit (code review)

I did not run a per-prediction timestamp audit script (I did not have direct
database access in this session) but code review is already conclusive.

**File:** `backend/app/forecasting/forecast_service.py:347-370`

```python
def _run_model(self, mv: ModelVersion, match_context: dict) -> ForecastResult:
    ...
    if model_type == "ensemble":
        model = self._build_default_ensemble(mv.id, config)
    else:
        model = ModelClass(model_version_id=mv.id, config=config)
    # If the model has persisted state (e.g. Elo ratings or sklearn
    # coefficients), it would be loaded here from a model artifact store.
    # For now we run stateless inference using fallback defaults.
    return model.predict(match_context)
```

A fresh model is instantiated per call. For `EloModel` the constructor
sets `self.ratings: dict[str, float] = {}`. The first call to `predict`
then falls through to `_seed_elo_from_context`, which prioritises
hardcoded values from `team_seeds.py`:

**File:** `backend/app/forecasting/team_seeds.py`

```python
TEAM_SEED_ELO: dict[str, float] = {
    "manchester-city-fc": 1780,
    "arsenal-fc":         1760,
    "liverpool-fc":       1750,
    ...
    "feyenoord-rotterdam": 1700,
    ...
    "sheffield-united-fc": 1460,
}
```

These seeds were written by a human based on their own knowledge of how the
2024/25 and 2025/26 seasons shook out. They are **constant in time**. When
the backfill in `admin_backfill.py` generates a prediction for a Premier
League match from November 2025, it still uses the April-2026 seeds. That
is textbook data leakage: a feature that encodes outcome knowledge is
applied to the input of the "prediction".

**Verdict on timestamp audit:** ❌ All strategies fail. The features are
structurally unable to be point-in-time-correct until `team_seeds.py` is
replaced by a persistent `team_ratings` table populated by sequential
training.

## Leakage test 2: Elo reconstruction check (code review)

**File:** `backend/app/forecasting/models/elo_model.py:53-60`

```python
def __init__(self, model_version_id: UUID, config: dict) -> None:
    super().__init__(model_version_id, config)
    ...
    # team_id (str) → current Elo rating
    self.ratings: dict[str, float] = {}
```

There is no DB-backed rating store. There is a `train()` method at line
179 that walks training data chronologically, but nothing persists the
resulting `self.ratings` across predictions. Each new `EloModel` starts
empty and seeds from the same static table.

**Verdict:** ❌ Historical Elo reconstruction is not implemented. Any
backtest using this model on historical fixtures is inherently leaky.

## Leakage test 3: out-of-sample sanity check (not run)

I did not split the production prediction history into train/test windows
because I do not have read access to the production database from this
session. The test is also redundant: given the Elo leakage in tests 1 and 2,
we know both the train window AND the test window share the same static
seeds, so a train/test split would show similar winrates in both and
**not expose the underlying leakage**. The statistical test would look
"fine" while the model continues to cheat.

If a reader wants to verify this properly, the script is:

```sql
-- Compute winrate for the first 70% vs last 30% of predictions
WITH ordered AS (
  SELECT p.id, p.home_win_prob, m.scheduled_at, pe.is_correct,
         ROW_NUMBER() OVER (ORDER BY m.scheduled_at) AS rn,
         COUNT(*) OVER () AS total
  FROM predictions p
  JOIN matches m ON m.id = p.match_id
  JOIN prediction_evaluations pe ON pe.prediction_id = p.id
  WHERE p.home_win_prob > 0.60  -- "Home Dominant" filter
)
SELECT
  CASE WHEN rn <= 0.7 * total THEN 'train' ELSE 'test' END AS split,
  COUNT(*) AS sample,
  AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) AS winrate
FROM ordered
GROUP BY 1;
```

Expected result under the current leakage: both train and test winrates
will be ~74%, because the leakage is symmetric in time.

## Leakage test 4: bootstrap significance (not run)

Skipped for the same reason as test 3. Under the current setup, bootstrap
CIs on the leaky data will come back with narrow, tightly-positive bands
(because the "edge" is baked into the features), so the test will
**confirm** the bogus numbers rather than catch them.

## Verdicts per strategy (with new gates applied)

The new plausibility gates are implemented in
`backend/app/api/routes/strategies.py::_compute_validation_status`. They
fire when:

```
winrate > 0.58   → under_investigation (impossible without leakage)
roi     > 0.08   → under_investigation
roi     < -0.02  → rejected
```

Applied to the live production numbers:

| Strategy              | New status            | Reason                                      |
|-----------------------|-----------------------|---------------------------------------------|
| Low Draw High Home    | `under_investigation` | winrate 72.62% > 58% ceiling                |
| Home Dominant         | `under_investigation` | winrate 74.15% > 58% ceiling                |
| Conservative Favorite | `under_investigation` | winrate 70.35% > 58% ceiling                |
| Strong Home Favorite  | `under_investigation` | winrate 68.30% > 58% ceiling                |
| Anti-Draw Filter      | `under_investigation` | winrate 67.27% > 58% ceiling                |
| Underdog Hunter       | `validated` (but read caveat below) | winrate 55.62% / ROI 5.69% in plausible band |

After `POST /api/strategies/validation-refresh` runs in production, the
five flagged strategies will have `is_active = false`. The frontend filter
`m.has_data && m.roi > 0` will **also** stop labelling them "Profitable"
because the new `/metrics` response clamps `roi` and `winrate` to 0 when
`validation_status == "under_investigation"` (raw values are still
available under `raw_roi` / `raw_winrate` for anyone who wants to audit).

## Honest caveat on Underdog Hunter

**Underdog Hunter is classified as `validated` under the new gates, but
this does NOT mean it's genuinely profitable.**

Here's why: every prediction in the sample was still generated by the same
leaky ensemble. The only reason Underdog Hunter escapes the plausibility
ceilings is that the leakage in the Elo seeds biases the model towards
home favorites, and this strategy explicitly picks *away* teams. The
leakage still taints the sample — it just manifests differently.

A credible pass for Underdog Hunter requires either:

1. Rebuilding the prediction history against a point-in-time Elo, OR
2. Forward-testing it on **genuinely new** fixtures where the seeds
   couldn't know the outcome, for at least 100 picks.

Until one of those happens, treat the `validated` label as a provisional
"not obviously broken" rather than "confirmed edge".

## What needs to happen to validate any strategy for real

In rough order:

1. **Replace `team_seeds.py` with a `team_ratings` table.** Columns:
   `team_id`, `as_of_date`, `elo_rating`. Populate by walking all finished
   matches in chronological order, updating Elo after each match, and
   snapshotting the rating daily. This is the standard trained-Elo pipeline.
2. **Modify `EloModel.predict`** to query the table with
   `as_of_date < match.scheduled_at` and drop the `_seed_elo_from_context`
   fallback entirely.
3. **Wipe and regenerate all historical predictions** via `admin_backfill`
   using the fixed model. This is destructive but scoped to predictions,
   not to matches or results. Get Dennis' explicit OK before running it.
4. **Re-run `POST /api/strategies/validation-refresh`.** Expect most
   strategies to collapse to winrates in the 48-54% range. The ones that
   still maintain a positive ROI on 200+ samples **after** this fix are
   the candidates to eventually promote.
5. **Wire in real historical 1X2 odds** (The Odds API historical plan, or a
   daily snapshot we build ourselves) so ROI is computed against actual
   market prices, not a flat 1.90 assumption.
6. **Only then** should the frontend show any strategy as "Profitable".

That is a two- to four-week project, not a one-session fix. The fix in
**this** session stops the bleeding (hides the fake numbers) without
pretending we've solved the modelling problem.
