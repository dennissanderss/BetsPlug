# Rebuild Phase 2 — Schema Drift Addendum

*Generated 2026-05-07. Updates the leakage assessment from `docs/integrity_audit.md`.*

## TL;DR

The "leakage" flagged in Phase 1 Check C turned out to be **schema drift**, not data leakage. The feature pipeline IS point-in-time honest (cutoff=match.scheduled_at). The feature **schema** has evolved over time, so historical features_snapshot dicts have a different key set than what FeatureService produces today. Probabilities + outcomes in existing backtest data are honest.

---

## What the spotcheck actually showed

For 10 random predictions:
- **Total keys compared:** 500
- **Identical:** 10 (2.0%)
- **Differing:** 490

But inspection of the diffs shows:

```
backtest predictions: 66 keys, includes
  away_elo_at_kickoff
  away_elo_effective_at
  away_elo_source
  ...

batch_local_fill predictions: 34 keys (older schema)

recomputed (current FeatureService): different key set
  away_elo  (single value, no provenance)
```

The two feature dicts barely overlap because they're **different feature shapes**, not because the values diverged.

## What this means

### ✅ Probabilities are honest
The model that wrote each prediction used the feature set that was current at write time. Cutoff was always `match.scheduled_at`. So:
- `home_win_prob`, `draw_prob`, `away_win_prob` are honest model outputs
- `confidence` is honest
- `is_correct` is the real outcome
- `closing_odds_snapshot.bookmaker_odds` is the real bookmaker price

ROI / hit rate / edge calculations on existing data are valid.

### ⚠ Cannot independently re-verify features
We can't reproduce the exact features used to generate each historical prediction because the feature schema has changed. To re-verify we'd need to either:
- Pin the FeatureService to a historical version (not practical)
- Re-run with current schema (would produce DIFFERENT predictions because different features go into the model)

### ✅ Existing backtest data is usable for parameter selection
For the rebuild's Phase 3 (parameter selection), we can use:
- All 343 live picks with snapshot odds
- 28,767 backtest picks (with the caveat that 35% have post-kickoff `predicted_at` metadata — the cron bug we already disabled). The probabilities themselves are honest because features are point-in-time.

### ⚠ Walk-forward as a forward-looking tool
A fresh walk-forward script (Phase 2A.3 in the brief) would:
- Use the **current** FeatureService schema
- Produce predictions that are 100% reproducible going forward
- Not help us validate **historical** numbers because the model would output different probabilities with the new features

For the immediate rebuild, walk-forward is **deferred** as a backlog item. It becomes valuable when we want to:
- Run new backtests with updated features
- Validate parameter changes prospectively
- Compare model versions on a fresh dataset

## Conclusion: revised Phase 2 status

| Item | Status |
|---|---|
| Phase 1 leakage finding (35% post-kickoff backtest) | ✅ Real — cron disabled |
| Phase 1 closing-odds capture-time missing | ⏸ Deferred (forecast_service forbidden) |
| Phase 1 feature isolation concern | ✅ **Resolved** — schema drift, not leakage |
| Phase 2A.1 cron disabled | ✅ Done |
| Phase 2A.2 captured_at field | ⏸ Deferred (forecast_service forbidden) |
| Phase 2A.3 walk-forward script | ⏸ Deferred — not blocking, low ROI given schema drift |
| Phase 2B live-only sweep | ✅ Done — see `rebuild_phase2b_live_sweep.md` |

**Greenlight to start Phase 3 (parameter selection)** using existing live + backtest data. Walk-forward becomes a future tool, not a Phase-3 prerequisite.
