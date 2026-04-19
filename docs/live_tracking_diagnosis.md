# Live-meting Diagnose — Deep Audit Fase 5

**Datum:** 2026-04-19
**Symptoom:** Live-meting sectie (`/trackrecord` live-tab + dashboard live-kaart + BOTD live-tracking) toont 0/0 of blijft leeg — óók per tier.

## 5.1 Wat de endpoint belooft

`backend/app/api/routes/trackrecord.py:224-297` (`/trackrecord/live-measurement`):

```python
.where(Prediction.prediction_source == "live")
.where(Prediction.predicted_at < Match.scheduled_at)          # strikt < !
.where(Prediction.created_at >= LIVE_MEASUREMENT_START)        # 2026-04-16 11:00 UTC
# PLUS: JOIN op prediction_evaluations (INNER join → match MOET geëvalueerd zijn)
```

Alleen rijen die alle drie passeren **én** een `prediction_evaluations`-entry hebben tellen mee. Voor `source="live"` met downgrade-logica uit `forecast_service.py:672-676`: als `scheduled_at <= now` tijdens de generation stap, wordt source automatisch "backtest" → rij komt nóóit in de live-meting.

## 5.2 Drie samenwerkende oorzaken

### A. Generation-cadence

APScheduler `job_generate_predictions` runs **elke 6 uur** (scheduler.py:843-850). In productie is dat het enige mechanisme dat nieuwe rijen met `source="live"` aanmaakt. Celery `task_generate_predictions` (commit c69460b: "cron 10m → 3m") staat wel in `celery_app.py` maar **er draait geen Celery Beat worker in Railway** (Procfile = `web: python start.py`, zie Fase 3).

### B. Idempotent skip door batch_local_fill

Op 2026-04-17 werd `batch_local_fill` uitgevoerd — 19.151 predictions bulkmatig ingevoegd voor bestaande matches in de komende weken. `job_generate_predictions` (scheduler.py:131-140) filtert:

```python
existing_ids = ...matches die al een prediction hebben
ids_to_predict = [mid for mid in all_match_ids if mid not in existing_ids]
```

Gevolg: élke match die in die batch zat → nooit een tweede `source="live"`-rij. Alleen **nieuwe** matches (geïmporteerd na 2026-04-17) krijgen live-picks. Dat is een kleine subset per dag.

### C. Evaluator-lag

`job_evaluate_predictions` draait elke 6 uur. Een match die om 20:00 UTC eindigt wordt pas tot 02:00 UTC evalueert. Tot dan mist de rij zijn `PredictionEvaluation` entry → valt buiten de live-meting ondanks dat hij wél pre-match `source="live"` kreeg.

### D. Strikte `<` versus `<=` boundary

`trackrecord.py:258`: `predicted_at < scheduled_at` (harde strikte ongelijkheid). Andere endpoints gebruiken `predicted_at <= scheduled_at` (trackrecord_filter). Als `predicted_at` exact gelijk aan `scheduled_at` (geen cycling-skew, precies die fraction-of-second), valt de rij buiten live-meting. Zeldzaam maar mogelijk.

## 5.3 Wat we zouden moeten zien

Vanaf 2026-04-16 11:00 UTC:
- 72 uur ≈ 12× `job_generate_predictions` run-cycles
- Per cycle alleen NIEUW-geïmporteerde matches in window 7d
- Fixture-ingest draait elke 6h (samenvalt met prediction-cycle), rotation over 7 competitions
- Geschat: **paar honderd nieuwe matches** over 3 dagen (Europese leagues spelen in dit venster)
- Daarvan **moeten afgespeeld+geëvalueerd zijn om in live-meting te verschijnen**. Realistisch in 3 dagen: waarschijnlijk **laag dubbele cijfers** tot enkele tientallen rijen.

Als query 5.1 in `database_inventory.md` "0" teruggeeft voor live-with-evaluation rijen, is dat consistent met de hypothese dat `job_generate_predictions` niet frequent genoeg draait om veel live-rijen op te bouwen vóór de batch_local_fill bestaande fixtures claimde.

## 5.4 Timestamp-logica (geverifieerd)

Elke code-path die `predicted_at` zet:

| Bestand:regel | Waarde | Scenario |
|---|---|---|
| `forecast_service.py:690` | `now = datetime.now(timezone.utc)` | Elke productie-call |
| `seed/seed_data.py:736,814` | `match.scheduled_at - timedelta(hours=24/36)` | Seed-data lokale dev |
| `tests/conftest.py:359` | hardcoded 2025-08-31 | Test-fixture |

Geen productie-pad dat `predicted_at` overschrijft of gelijk zet aan `scheduled_at`. **Geen timestamp-bug.** Eventuele gelijke timestamps kwamen uit historische batch-ingest, niet uit live code.

## 5.5 Data-verificatie (draai tegen Railway DB)

```sql
-- Ruw volume live-predictions met pre-match lock sinds deploy-cut
SELECT
  COUNT(*) FILTER (WHERE p.predicted_at < m.scheduled_at) AS strict_pre,
  COUNT(*) FILTER (WHERE p.prediction_source = 'live')    AS source_live,
  COUNT(*) FILTER (
     WHERE p.predicted_at < m.scheduled_at
       AND p.prediction_source = 'live'
       AND p.created_at >= '2026-04-16 11:00:00+00'
  ) AS live_measurement_candidates,
  COUNT(*) FILTER (
     WHERE p.predicted_at < m.scheduled_at
       AND p.prediction_source = 'live'
       AND p.created_at >= '2026-04-16 11:00:00+00'
       AND EXISTS (SELECT 1 FROM prediction_evaluations pe WHERE pe.prediction_id = p.id)
  ) AS live_meting_with_eval
FROM predictions p
JOIN matches m ON m.id = p.match_id;
```

De laatste kolom is het actuele "Live meting" getal.

```sql
-- Laatste "live" run volgen
SELECT MAX(created_at) AS last_live_pred FROM predictions WHERE prediction_source='live';
SELECT MAX(evaluated_at) AS last_eval FROM prediction_evaluations;
```

## 5.6 Aanbevolen interventies (niet uitvoeren tot goedkeuring)

| Fix | Locatie | Effect |
|---|---|---|
| `IntervalTrigger(hours=6)` → `IntervalTrigger(minutes=10)` voor generate_predictions | `scheduler.py:843-850` | Live-cadence terug naar wat CLAUDE.md beweert. Geen model-wijziging. |
| `IntervalTrigger(hours=6)` → `IntervalTrigger(minutes=20)` voor evaluate_predictions | `scheduler.py:853-860` | Evaluator-lag van 6u naar 20 min. |
| Na `job_sync_data` direct `generate_predictions_for_upcoming()` chainen | `scheduler.py` | Nieuwe matches krijgen meteen een pick. |
| Cache-key `pricing:comparison` en `dashboard:metrics:*` flush na elke live-run | admin-endpoint of hook | Voorkomt dat live-cijfers 5 min achter lopen. |
| Secundaire filter "predicted at most 7d before kickoff" in live-measurement | `trackrecord.py:258-259` | Sluit rand-rijen uit (nu niet urgent). |

**Opmerking:** de combinatie van A+B betekent dat zelfs ná de scheduler-fixes de `source="live"`-count laag blijft **totdat matches die *ná* 2026-04-17 geïmporteerd zijn** daadwerkelijk gespeeld en geëvalueerd zijn. Live-meting blijft "groeit dag-per-dag" de eerste weken — niet onmiddellijk rijk. Zet een duidelijke UI-fallback-tekst ("Live meting groeit — voor model-validatie zie trackrecord").
