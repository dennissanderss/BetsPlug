# Plan: v8.1 query-filter — user-facing accuracy cijfers

**Datum:** 16 april 2026
**Doel:** Alle user-facing accuracy / trackrecord / metrics queries tonen alleen v8.1 predictions (batch_local_fill + post-deploy backtest). De 75K oude predictions blijven in DB staan, worden alleen genegeerd in UI-cijfers.

**GEEN DELETE. GEEN backfill. Alleen WHERE filters.**

---

## 1. Shared helper (nieuw bestand)

Maak `backend/app/core/prediction_filters.py` met:

```python
"""V8.1 prediction filtering helpers.

The v8.1 engine went live on 2026-04-16 around 11:00 UTC. Predictions made
before that used a broken feature pipeline (22/39 features wrong) and must
not be used for user-facing accuracy displays.

Use ``v81_predictions_filter()`` in any SQLAlchemy query that aggregates
is_correct / winrate / accuracy for users.
"""
from datetime import datetime, timezone
from sqlalchemy import and_
from sqlalchemy.sql import ColumnElement

from app.models.prediction import Prediction

# Exact deploy cut-off — first clean v8.1 commit (b7270b9) was pushed at
# 11:07 UTC; Railway finished deploying around 11:10 UTC. 11:00 UTC is a
# conservative lower bound with room for clock skew.
V81_DEPLOYMENT_CUTOFF = datetime(2026, 4, 16, 11, 0, 0, tzinfo=timezone.utc)

# Sources produced by the v8.1 pipeline:
# - 'batch_local_fill' : the one-shot lokale ensemble run (19,151 preds)
# - 'backtest'          : APScheduler job_generate_historical_predictions
#                         (ongoing, every 5 min) — only post-cutoff rows
V81_VALID_SOURCES = ("batch_local_fill", "backtest")


def v81_predictions_filter() -> ColumnElement:
    """Return SQLAlchemy expression: only v8.1 predictions."""
    return and_(
        Prediction.prediction_source.in_(V81_VALID_SOURCES),
        Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
    )
```

Eén regel toevoegen in elk endpoint: `q = q.where(v81_predictions_filter())`.

---

## 2. Bestanden om te patchen

### 2.1 `backend/app/api/routes/trackrecord.py` — **4 endpoints**

| Functie | Regels | Wat te wijzigen |
|---------|:------:|-----------------|
| `get_trackrecord_summary` | ~55-73 | Voeg `.where(v81_predictions_filter())` toe aan `q` |
| `get_trackrecord_segments` | ~128-147 (sport), ~215-231 (league) | Voeg zelfde where toe aan beide GROUP BY queries |
| `get_calibration` | ~296-303 | Voeg where toe |
| `_stream_trackrecord_csv` | ~399-410, ~466-480 | Voeg where toe aan beide queries (summary + streaming) |

**Voorbeeld (regel 55-73):**
```python
# VOOR
q = (
    select(
        func.count(PredictionEvaluation.id).label("total"),
        func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
        ...
    )
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .join(Match, Match.id == Prediction.match_id)
)
if model_version_id is not None:
    q = q.where(Prediction.model_version_id == model_version_id)
if source is not None:
    q = q.where(Prediction.prediction_source == source)

# NA — een extra regel:
q = q.where(v81_predictions_filter())
```

### 2.2 `backend/app/api/routes/homepage.py` — **1 endpoint**

| Functie | Regels | Wat |
|---------|:------:|-----|
| `get_free_picks` (30-day winrate block) | 317-325 | Voeg where toe aan `stats_stmt` |

**Voor/na:**
```python
# VOOR
stats_stmt = (
    select(
        func.count(PredictionEvaluation.id).label("total"),
        func.sum(case((PredictionEvaluation.is_correct.is_(True), 1), else_=0)).label("correct"),
    )
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .join(Match, Match.id == Prediction.match_id)
    .where(Match.scheduled_at >= thirty_days_ago)
)

# NA
stats_stmt = (
    select(...)
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .join(Match, Match.id == Prediction.match_id)
    .where(Match.scheduled_at >= thirty_days_ago)
    .where(v81_predictions_filter())   # <-- toegevoegd
)
```

### 2.3 `backend/app/api/routes/dashboard.py` — **4 COUNT queries**

| Functie | Regels | Wat |
|---------|:------:|-----|
| `get_dashboard_metrics` | 66-91 | 4 losse queries — allemaal krijgen `.join(Prediction).where(v81_predictions_filter())` |

**Voor:**
```python
total_result = await db.execute(select(func.count(Prediction.id)))
eval_count_result = await db.execute(select(func.count(PredictionEvaluation.id)))
correct_result = await db.execute(
    select(func.count(PredictionEvaluation.id)).where(PredictionEvaluation.is_correct.is_(True))
)
avg_brier_result = await db.execute(select(func.avg(PredictionEvaluation.brier_score)))
avg_confidence_result = await db.execute(select(func.avg(Prediction.confidence)))
```

**Na:**
```python
# Total v8.1 predictions
total_result = await db.execute(
    select(func.count(Prediction.id)).where(v81_predictions_filter())
)
# Count of evals — JOIN to filter on source
eval_count_result = await db.execute(
    select(func.count(PredictionEvaluation.id))
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .where(v81_predictions_filter())
)
correct_result = await db.execute(
    select(func.count(PredictionEvaluation.id))
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .where(PredictionEvaluation.is_correct.is_(True))
    .where(v81_predictions_filter())
)
avg_brier_result = await db.execute(
    select(func.avg(PredictionEvaluation.brier_score))
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .where(v81_predictions_filter())
)
avg_confidence_result = await db.execute(
    select(func.avg(Prediction.confidence)).where(v81_predictions_filter())
)
```

### 2.4 `backend/app/api/routes/betoftheday.py` — **2 endpoints**

| Functie | Regels | Wat |
|---------|:------:|-----|
| `get_botd_history` | 69-88 | Voeg where toe; verwijder "live fallback"-pad óf verplaats filter ná fallback-branch |
| `get_botd_track_record` | 162-183 | Idem |

Beide endpoints hebben een `prediction_source == 'live'`-eerste-poging + fallback zonder filter. We laten de `live` filter staan waar hij zit en voegen de v8.1 filter TOE, zodat ook binnen 'live' pre-deploy rows worden uitgesloten:

```python
# Binnen de 'live'-branch:
q = q.where(Prediction.prediction_source == "live").where(v81_predictions_filter())

# Binnen de fallback:
q = q.where(v81_predictions_filter())
```

> Note: v8.1 sources zijn `batch_local_fill` + `backtest`. 'live' is formeel niet in die lijst. Ik moet checken of live-preds post-deploy bestaan — **zo ja moet `V81_VALID_SOURCES` uitgebreid worden met 'live'** (zie punt 5 hieronder).

### 2.5 `backend/app/api/routes/strategies.py` — **2 functies**

| Functie | Regels | Wat |
|---------|:------:|-----|
| `get_strategy_metrics` | 509-550 | Base SELECT krijgt where |
| `compute_walk_forward_validation` | 629-635 | Idem |

### 2.6 `backend/app/api/routes/admin_v5.py` — **2 functies (admin-only)**

| Functie | Regels | Wat |
|---------|:------:|-----|
| `engine_comparison` | 1921-1925 | Where toevoegen |
| `optimize_ensemble` | 1986-1991 | Where toevoegen |

Admin endpoints zijn niet user-facing maar user vroeg "admin panel queries" expliciet. Opnemen.

---

## 3. Samenvatting in tabel

| Bestand | Functies | Queries gewijzigd | Categorie |
|---------|:--:|:--:|-----------|
| `core/prediction_filters.py` | — | nieuwe file | Helper |
| `routes/trackrecord.py` | 4 | 5 | User-facing |
| `routes/homepage.py` | 1 | 1 | User-facing |
| `routes/dashboard.py` | 1 | 5 | User-facing |
| `routes/betoftheday.py` | 2 | 2+fallbacks | User-facing |
| `routes/strategies.py` | 2 | 2 | User-facing |
| `routes/admin_v5.py` | 2 | 2 | Admin |
| **Totaal** | **12** | **~17** | 7 files |

**Impact:** ~17 query-aanpassingen + 1 nieuwe helper file (~25 regels). Geschat 30-45 min werk incl. test.

---

## 4. Test plan

Na uitvoering: voor 3 endpoints voor/na cijfers tonen (jouw stap 5).

| Endpoint | Voor | Na (verwacht) |
|----------|------|---------------|
| `/api/dashboard/metrics` | accuracy ~48% (alle 76k evals gemixed) | ~50% (batch_local_fill only) |
| `/api/trackrecord/summary` (geen source filter) | accuracy ~48% | ~50% |
| `/api/homepage/free-picks` (stats block) | winrate laatste 30 dagen — gemengd | winrate alleen v8.1 — kleiner sample maar zuiver |

Verificatie dat filter correct werkt: eenvoudig DB-query `COUNT(*)` met/zonder filter, zelfde ratio als Python endpoint.

---

## 5. Open vragen — graag beslissing vóór uitvoer

**Vraag A: Post-deploy `live` source**

`betoftheday.py` filtert op `prediction_source='live'`. Celery beat heeft `generate-predictions-every-10m` dat predictions maakt voor aankomende matches met `source="live"` (zie `backend/app/tasks/sync_tasks.py`). Die zijn gemaakt NA de deploy → hebben wél de gefixte pipeline.

**Optie A1 (aanbevolen):** Voeg `'live'` toe aan `V81_VALID_SOURCES`. Dan omvat het filter alles wat post-deploy is gemaakt, ongeacht of het een upcoming-match prediction (live) of een historical fill (backtest) of mijn batch is.

**Optie A2:** Laat `live` eruit. Dan tonen BOTD endpoints geen cijfers voor echte upcoming-matches die al gespeeld zijn.

**Mijn aanbeveling: A1**, omdat elke post-deploy prediction via de gefixte pipeline loopt. Geen reden ze uit te sluiten.

**Vraag B: Admin endpoints (sectie 2.6)**

Wil je admin_v5.py endpoints óók filteren, of admin tonen we bewust ALLE data voor diagnose? Jij zei "Admin panel queries" dus ik neem aan: wel filteren. Bevestig gewoon.

**Vraag C: Cached dashboard**

`get_dashboard_metrics` heeft een `cache_get("dashboard:metrics")` — oude cijfers zitten in Redis. Na deploy moet die cache worden geflushed, anders ziet de UI nog steeds oude getallen voor TTL-duur.

**Wil je dat ik ook een `cache_delete("dashboard:metrics")` call doe bij startup, of ergens in een admin-endpoint als toggle?**

---

## 6. Verwachte cijfers na uitvoering

Voor referentie — wat de user-facing endpoints moeten gaan tonen:

| Metric | Huidig (gemixt) | Na filter (v8.1 only) |
|--------|:--:|:--:|
| Overall accuracy (alle confidences) | ~49% | ~49.9% |
| Platinum (≥75%) | ~73% | **~84.1%** |
| Gold+ (≥65%) | ~60% | **~74.7%** |
| BOTD (≥60%) | ~55% | **~70.1%** |
| Total evaluated | ~76k | ~746 (batch) + 546 (backtest) = 1,292; groeit naar 19,697 naarmate evaluator bijwerkt |

**Kleinere absolute sample size, maar wel kwalitatief zuiver = wat de klant hoort te zien.**

---

## Beslispunten

1. [ ] Optie A1 akkoord (include 'live' in V81_VALID_SOURCES)?
2. [ ] Admin endpoints (sectie 2.6) ook filteren?
3. [ ] Dashboard cache automatisch flushen of handmatig?
4. [ ] Plan goedkeuren → ik voer uit
