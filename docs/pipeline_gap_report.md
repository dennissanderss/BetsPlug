---
title: Prediction-pipeline gap — waarom /resultaten & uitslagen leeg is
date: 2026-04-18
scope: backend only (diagnose + fix-voorstel, nog niet geïmplementeerd)
---

# Prediction-pipeline gap — waarom /resultaten & uitslagen leeg is

## Aanleiding

Op `/predictions` → tab "Resultaten & uitslagen" op datum 2026-04-18
zie je **0 resultaten**. Via `/api/fixtures/today` en
`/api/fixtures/results` heb ik live bevestigd dat dit geen render-bug is:

| Datum | Wedstrijden | Met voorspelling |
|---|---:|---:|
| vandaag (18-apr) | 60 (42 afgelopen + 9 live + 9 gepland) | **0** |
| gisteren (17-apr) | 19 | **0** |
| 30-dagen window | 665 | 283 (42.6 %) |

Historische dekking is dus normaal; de laatste ~2 dagen is droog.
`/api/trackrecord/summary` rapporteert `period_end = 2026-04-14T19:00:00Z`
— de laatste geëvalueerde voorspelling zit dus op 14 april, vier dagen
geleden.

## Hoe de pipeline zou moeten werken

Celery-beat (`backend/app/tasks/celery_app.py:123-127`):

```
generate-predictions-every-10m:
  task: app.tasks.sync_tasks.task_generate_predictions
  schedule: crontab(minute="*/10")
  options: { queue: "forecasting" }
```

Elke 10 minuten zou `DataSyncService.generate_predictions_for_upcoming()`
(`backend/app/services/data_sync_service.py:673-744`) alle `SCHEDULED`
wedstrijden binnen 72 uur oppakken die nog **geen** voorspelling hebben,
en voor elk `ForecastService.generate_forecast(match_id, db)` aanroepen.
Die default naar `source="live"` (signature
`backend/app/forecasting/forecast_service.py:64-70`).

In `_persist()` (`forecast_service.py:671-717`) worden de volgende
velden gezet:

```python
if source == "live" and scheduled and scheduled <= now:
    source = "backtest"             # ← downgrade na kickoff

Prediction(
    ...
    predicted_at = now,            # ← altijd "nu"
    prediction_source = source,    # ← "live" vóór kickoff, "backtest" erna
    match_scheduled_at = scheduled,
    ...
)
```

## Waarom die predictions dan niet zichtbaar zijn

Commit `447297e` (integrity/step1) heeft `trackrecord_filter()`
toegevoegd in `backend/app/core/prediction_filters.py:69-92`:

```python
return and_(
    Prediction.prediction_source.in_(("batch_local_fill", "backtest", "live")),
    Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,      # = 2026-04-16 11:00 UTC
    Prediction.predicted_at <= Match.scheduled_at,       # ← nieuw
)
```

Die filter draait nu in **elk** user-facing endpoint (fixtures,
trackrecord, dashboard, betoftheday, pricing, strategies, homepage,
report_service). Zodra een voorspelling `predicted_at > scheduled_at`
heeft valt hij uit het totaal.

**Combineer beide gedragingen en je krijgt precies wat we zien:**
elke wedstrijd die de Celery-job **na kickoff** oppakte → `predicted_at
= now > scheduled_at` → `source` wordt gedowngraded naar `"backtest"`
→ `trackrecord_filter()` gooit de rij eruit.

## Twee mogelijke scenario's

Zonder Railway DB/log-toegang kan ik niet 100 % bewijzen welk van
deze twee het is, maar één van beide moet het zijn:

**A. Cron draait niet (of niet vaak genoeg).**
Als Celery-beat niet actief is op Railway, of de `forecasting` queue
heeft geen worker, dan wordt `task_generate_predictions` nooit
uitgevoerd en zijn er voor recent ingeste wedstrijden simpelweg 0
voorspellingen in de DB.

**B. Cron draait wel, maar altijd ná kickoff.**
Als de job maar elke 10 min draait en de ingestion per 5 min nieuwe
fixtures ophaalt, moet iedere nieuwe fixture minimaal één succesvolle
10-minuten-cyclus vóór kickoff meemaken. Als dat window wordt gemist
(bv. door timeouts, worker-restart of rate-limiting op
`football-data.org`) dan wordt de pre-match voorspelling nooit
gemaakt — en komt er pas erna één in als "backtest" met een
timestamp ná kickoff, die direct door `trackrecord_filter()` wordt
weggefilterd.

## Wat er nodig is om dit te bevestigen

Drie dingen vereisen toegang die ik niet heb:

1. **Railway Celery-beat logs** — draaien de `generate-predictions-every-10m`
   fires überhaupt? Hoeveel keer per uur? Wat is het
   `forecasted`/`failed` counter-resultaat?
2. **DB-query** tegen Railway:
   ```sql
   SELECT prediction_source,
          COUNT(*) AS n,
          COUNT(*) FILTER (WHERE predicted_at <= match_scheduled_at) AS pre_match,
          COUNT(*) FILTER (WHERE predicted_at >  match_scheduled_at) AS post_match
   FROM predictions
   WHERE created_at >= '2026-04-16 11:00 UTC'
   GROUP BY prediction_source;
   ```
   Als hier `(backtest, n, 0, n)` staat → scenario B.
   Als hier `(live, 0, 0, 0)` staat → scenario A.
3. **Celery worker count per queue.** `forecasting` queue moet
   minstens 1 running worker hebben.

## Voorgestelde oplossingen (1 of meer combineren)

### Fix 1 — korte termijn: zorg dat de cron vaker draait én eerder inspringt

Pas `celery_app.py:123-127` aan naar elke 2-3 min i.p.v. 10, zodat de
kans kleiner is dat een fixture pas ná kickoff wordt opgepakt. Goed
genoeg voor dagelijks gebruik, lost het grondprobleem (worker mist
window) niet op.

### Fix 2 — structureel: voorspel zodra een match wordt geïngested

Verhuis de trigger van "elke 10 min polling op SCHEDULED matches"
naar "direct na ingestion van een nieuwe fixture". Dat kan simpel:
in `task_sync_matches` (nu elke 5 min) een
`task_generate_predictions.delay()` aanroepen zodra er
daadwerkelijk nieuwe rows zijn gemaakt. Zo ligt de forecast er
altijd kort na ingestion, lang voor kickoff.

### Fix 3 — honest backfill: maak backfill zichtbaar i.p.v. weggefilterd

Als scenario B waar is, hebben we wél voorspellingen voor de
afgelopen 2 dagen, ze worden alleen weggefilterd. Opties:

- **3a.** Laat `trackrecord_filter()` backtests met `predicted_at`
  binnen X uur ná kickoff toch toe, met een expliciet label
  "retroactive". Maakt track record vollediger, maar verzwakt de
  "elke pick locked vóór kickoff" claim.
- **3b.** Toon ze in `/predictions`-results-tab, niet in de track-record
  aggregates. Zo krijgt de gebruiker wel een ✅/❌ per wedstrijd
  maar pollueren ze de accuracy-cijfers niet.

### Fix 4 — UX-kant: eerlijk empty-state (zie apart rapport)

Onafhankelijk van de data-fix: de pagina moet de gebruiker vertellen
welk van de drie situaties speelt ("geen wedstrijden", "geen
voorspellingen", "wel voorspellingen, filters te streng"). Zie
`docs/predictions_empty_state_plan.md`.

## Aanbeveling

1. **Eerst diagnose:** draai de SQL van §"Wat er nodig is" tegen
   Railway. Dan weten we zeker of scenario A of B speelt.
2. **Daarna fix 2 + fix 4.** Fix 2 lost het grondprobleem op, fix 4
   maakt de UI eerlijk zolang de pipeline per ongeluk een match mist.
   Fix 1 is alleen nodig als we fix 2 niet willen/kunnen bouwen.
3. **Fix 3 overwegen** als we na scenario B ontdekken dat er WÉL
   backtests zijn gemaakt die nu onzichtbaar zijn. Dan is het
   zonde om die data weg te gooien.

## Geen code-wijziging

Dit rapport bevat enkel diagnose + voorstel. Geen commits of edits
totdat je akkoord geeft.
