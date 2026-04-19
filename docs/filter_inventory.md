# Filter Inventory — Deep Audit Fase 2

**Datum:** 2026-04-19
**Doel:** alle actieve SQL-filters in de backend mappen, per-endpoint matrix, inconsistenties blootleggen.

## 1. De 5 canonieke filters

| Filter | Locatie | SQL (kern) | Vereist JOIN | Semantiek |
|---|---|---|---|---|
| `v81_predictions_filter()` | `core/prediction_filters.py:49-66` | `prediction_source IN {batch_local_fill, backtest, live} AND created_at >= 2026-04-16 11:00 UTC` | nee | Sluit pre-v8.1 vuile predictions uit. Pure Prediction-predicate. |
| `trackrecord_filter()` | `core/prediction_filters.py:69-92` | v8.1-filter **+** `predicted_at <= scheduled_at` | **ja** (Match) | V8.1 + "geen post-kickoff backfill". Default-filter voor alle user-facing aggregaties. |
| `access_filter(user_tier)` | `core/tier_system.py:185-244` | Baseline: `league_id IN LEAGUES_FREE AND confidence >= 0.55`. Exclusie: rijen die als hogere tier zouden classificeren dan user. | **ja** (Match) | Bepaalt wat een user mag ZIEN. Altijd Free-baseline. |
| `pick_tier_expression()` | `core/tier_system.py:125-179` | CASE → int 0-3 of NULL | **ja** (Match) | Klassificeert elke rij als exact één tier. Niet een WHERE-clause, maar een SELECT-uitdrukking voor GROUP BY. |
| `LIVE_MEASUREMENT` inline | `api/routes/trackrecord.py:257-259` | `prediction_source='live' AND predicted_at < scheduled_at AND created_at >= 2026-04-16 11:00` | **ja** (Match) | Stricte "live meting" — géén batch/backtest, strikt `<` (niet `<=`). |

Géén "BOTD-filter" als losse functie. BOTD inline-combinatie in `betoftheday.py`: confidence ≥ `BOTD_MIN_CONFIDENCE` (0.60) + `v81_predictions_filter` / `trackrecord_filter` + optioneel `source='live'`. Zie Fase 3.

## 2. Endpoint × Filter-matrix

Legenda: ✓ = toegepast; ✗ = niet toegepast; `pt=` = public `?pick_tier=` override (tier-query bypasst access_filter); `af(t)` = access_filter voor caller's tier; `pte` = pick_tier_expression (SELECT/GROUP BY, geen WHERE tenzij gezegd).

| Endpoint | Bron | v81 | track | af(t) | pte | Live-only | Bijzonderheden |
|---|---|---|---|---|---|---|---|
| `GET /api/dashboard/metrics` (overall) | `dashboard.py:108-131` | via `track` | ✓ | ✓ | ✗ | ✗ | Overall accuracy voor caller's scope. |
| `GET /api/dashboard/metrics` (per_tier) | `dashboard.py:172-208` | ✗ (**BUG**: `_v81` undefined) | ✗ (**BUG**) | ✗ | ✓ (SELECT+GROUP BY) | ✗ | **Crasht met NameError.** Zie Fase 4. |
| `GET /api/trackrecord/summary` (overall) | `trackrecord.py:110-148` | via `track` | ✓ | ✓ (`af`) *of* `pt=` override | ✗ | optional `source=` | Publieke `?pick_tier=` zet tier-filter via `pte == value`. |
| `GET /api/trackrecord/summary.per_tier` | `trackrecord.py:168-208` | via `track` | ✓ | ✗ | ✓ (SELECT+GROUP BY) | ✗ | Geen access_filter — transparancy (alle tiers voor iedereen). |
| `GET /api/trackrecord/live-measurement` | `trackrecord.py:224-297` | ✗ (eigen inline) | ✗ (eigen inline) | ✗ | ✓ (optional GROUP BY) | ✓ **strikt `<`** | Enige endpoint met harde live-strict filter. |
| `GET /api/trackrecord/segments` | `trackrecord.py:300-481` | via `track` | ✓ | ✓ of `pt=` | ✗ | optional `source=` | Per sport/league/month break-down. |
| `GET /api/trackrecord/calibration` | `trackrecord.py:484-619` | via `track` | ✓ | ✓ of `pt=` | ✗ | ✗ | — |
| `GET /api/trackrecord/export.csv` | `trackrecord.py:637-950` | via `track` | ✓ | ✓ of `pt=` (met 402-gate) | ✗ | ✗ | `?pick_tier=` hoger dan subscription → 402. |
| `GET /api/pricing/comparison` | `pricing.py:98-224` | via `track` | ✓ | ✗ | ✓ (SELECT+GROUP BY) | ✗ | **Agg-query identiek aan trackrecord.per_tier → moet matchen.** Plus picks-per-day via 4× `af()` in FILTER-clauses over 60d window. |
| `GET /api/bet-of-the-day/` (vandaag) | `betoftheday.py:627-811` | via `track` (fallback `v81`) | ✓ | ✓ | `pte` voor label | optional `source='live'` first | Selecteert top-1 `confidence`. |
| `GET /api/bet-of-the-day/history` | `betoftheday.py:190-?` | via `track` | ✓ | ✓ | pte | optional `source='live'` | — |
| `GET /api/bet-of-the-day/model-validation` | `betoftheday.py:?` | ✓ (`v81` direct) | ✗ | ✗ | pte | ✗ | Bypassed pre-match lock (bewust: model-validatie). |
| `GET /api/bet-of-the-day/live-tracking` | `betoftheday.py:426-451` | ✗ (inline) | ✗ | ✗ | pte | ✓ **strikt `<`** + source='live' | Cutoff 2026-04-18. |
| `GET /api/bet-of-the-day/track-record` | `betoftheday.py:466-567` | via `track` | ✓ | ✓ | — | ✓ (source='live') met fallback | BOTD-eigen accuracy-KPI. Bestaat dus al in backend! |
| `GET /api/predictions` (list) | `predictions.py` | via `track` | ✓ | ✓ | — | ✗ | List-endpoint → `af(t)` filtert per caller. |

## 3. Inconsistentie-mapping

### 3.1 Dashboard tier card ≠ Trackrecord summary per_tier

**Zouden identiek moeten zijn** (beide gebruiken `trackrecord_filter + pick_tier_expression GROUP BY, geen access_filter`). Ze zijn het niet omdat dashboard `per_tier_q` op regel 187 van `dashboard.py` `_v81` gebruikt ipv `_track` → `NameError` → endpoint 500 → frontend laat card leeg / 0-0.

### 3.2 Trackrecord summary per_tier ≈ Pricing comparison accuracy_pct

Identieke agg-query (verschillende response-velden). Mogen nooit afwijken. Test:
```
/api/trackrecord/summary.per_tier.gold.accuracy * 100 == /api/pricing/comparison[gold].accuracy_pct
```

### 3.3 Picks-per-day (`ppd_inclusive`) uses `access_filter`, not `pick_tier_expression`

`pricing.py:170-189`. Het gebruikt vier filter-COUNTs:
```python
func.count(...).filter(access_filter(PickTier.FREE))
func.count(...).filter(access_filter(PickTier.SILVER))
…
```
Maar `access_filter(FREE)` telt rijen die qualificeren voor FREE en NIET hoger — wat pick_tier_expression als "free" classificeert. Voor SILVER telt het silver+free. Voor PLATINUM telt het alles in baseline.

Hier valt op dat `access_filter(FREE)` de user-visible scope is — NIET de som van alleen-free classified picks. Door Bug 1 fix (`cf23773`) klopt dat bewust: het label "picks per day" in het pricing-card betekent wat de user écht per dag te zien krijgt (inclusief Free).

Geen inconsistentie, maar dit is NIET 1:1 mappable naar per_tier.total uit dezelfde endpoint.

### 3.4 BOTD endpoints gebruiken verschillende filters

- `/bet-of-the-day/` → `track_filter` (default) + `af`
- `/bet-of-the-day/model-validation` → pure `v81_predictions_filter` (géén trackrecord_filter, géén access_filter)
- `/bet-of-the-day/live-tracking` → strikt `<` + source='live' + eigen cutoff
- `/bet-of-the-day/track-record` → `track` + `af` + `source='live'` met fallback

De eigen `/track-record`-BOTD endpoint **bestaat al**. Frontend gebruikt hem niet (zie Fase 3.5). Inconsistentie ontstaat doordat "Pick of the Day" dashboard-kaart en "/bet-of-the-day" public-route verschillende filter-compositions hebben.

### 3.5 Frontend pick-tier.ts ≠ backend pick_tier_expression()

`frontend/src/lib/pick-tier.ts:84-106` mirror van `pick_tier_expression()`. Gebruikt op `/predictions` (P2.2 in QA-rapport). Risico: league-UUID set raakt uit sync met backend als `tier_leagues.py` verandert. Momenteel 0.55 / 0.65 / 0.70 / 0.75 drempels matchen — consistent.

## 4. Vereiste harmonisatie (advies voor Fase 8)

1. **Dashboard bug fix**: `_v81` → `_track` in `dashboard.py:187`. Meest urgent (P0).
2. **Één canonieke helper** voor "model-validatie" aggregate: een functie `validation_filter()` = `trackrecord_filter()`, en `live_filter()` voor strikt-pre-match live. Elk aggregate-endpoint (dashboard, trackrecord summary+per_tier, pricing) deelt dezelfde samenstelling. Nu staat dezelfde combinatie 4× herhaald als losse `.where()`-stapels.
3. **Dashboard per_tier query** zou letterlijk `trackrecord_filter()` + `pick_tier_expression()` GROUP BY moeten zijn — identiek aan `trackrecord.summary.per_tier`. Die twee moeten via een shared helper uit dezelfde SQL rollen.
4. **BOTD track-record**: frontend `/trackrecord` heeft nu geen BOTD-tab terwijl backend `/bet-of-the-day/track-record` al bestaat. Koppel de frontend-tab op dat endpoint (Fase 8.4).
5. **Frontend `/predictions` tier-classifier**: vervang door tier-velden die backend al in response meestuurt (`tier_info()`), zodat de frontend stop is met lokaal herclassificeren (P2.2).
