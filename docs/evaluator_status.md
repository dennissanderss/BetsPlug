# Evaluator status — `prediction_evaluations` tabel

**Datum:** 16 april 2026
**Vraag:** Welk proces vult `prediction_evaluations`? Draait het? Hoe lang duurt 19,151 evals?

---

## Welk proces evalueert?

**Dezelfde APScheduler-job** die ook predictions genereert: `job_generate_historical_predictions` in `backend/app/services/scheduler.py`, regels 530-548.

Na het maken van nieuwe predictions (batch 100) doet dezelfde job een evaluatie-stap:

```python
# scheduler.py:531-539
eval_stmt = (
    select(Prediction, MatchResult)
    .join(Match, Match.id == Prediction.match_id)
    .join(MatchResult, MatchResult.match_id == Match.id)
    .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
    .where(and_(Match.status == MatchStatus.FINISHED, PredictionEvaluation.id.is_(None)))
    .limit(200)            # <-- max 200 per run
)
```

Max **200 evaluaties per run**, run-interval **5 minuten** → theoretisch **2,400/uur**.

Geen aparte Celery eval-taak. Er is ook geen reactive trigger "als match FINISHED wordt, evalueer meteen" — alles loopt via de 5-min heartbeat.

---

## Status: draait het?

**Ja — actief.** Meest recente evaluation-row created om `2026-04-16 12:18:44 UTC`, enkele minuten geleden.

Throughput vandaag:

| Uur (UTC) | Evaluaties geschreven |
|:--:|:--:|
| 00:00-07:00 | 1,200/uur (constant) |
| 08:00 | 8,100 (spike) |
| 09:00 | 14,300 |
| 10:00 | 16,100 |
| 11:00 | 7,910 |
| 12:00 (so far) | 200 |

De 08-11h spike is van mijn eigen backfill-scripts + de extra generatie. Normale cadans is **~1,200/uur** (= 20/min, of 100 per 5-min run).

**Run is dus werkend op ~50% van theoretische max** (200-per-run). Waarschijnlijk I/O-gebound op de eval-query (complex join over 3 tabellen) of bewust conservatief.

---

## Coverage op de v8.1 batch

| Source (post-deploy) | Preds | Evaluated | % |
|---|:--:|:--:|:--:|
| `batch_local_fill` (mijn 19,151) | 19,151 | 200 | **1.0%** |
| `backtest` (APScheduler 546) | 546 | 546 | **100%** |
| Totaal FINISHED-preds zonder eval | — | — | **18,951** |

De 546 `backtest`-preds zijn al geëvalueerd (de APScheduler-job doet generate + evaluate in dezelfde run). Mijn 19,151 bypassed de scheduler volledig, dus moet nog 18,951 opgewerkt worden.

---

## ETA voor alle 18,951

Afhankelijk van hoe de job presteert:

| Scenario | Rate | ETA |
|----------|:--:|:--:|
| Huidige normale cadans (1,200/uur) | 20/min | **~16 uur** |
| Theoretisch max (2,400/uur) | 40/min | **~8 uur** |
| Overige jobs zoals `daily-ingest-0600` vertragen eval | lager dan 1,200 | >16 uur |

Als je geen actie onderneemt loopt de evaluator uiteindelijk bij (na ~16 uur), tenzij er ondertussen nieuwe matches FINISHED worden (competing pool).

---

## Bevindingen (kort)

1. Evaluator is **niet stuck**, loopt rustig door op ~1,200/uur.
2. **De APScheduler-job combineert generatie + evaluatie** in dezelfde call — dat is waarom `backtest`-preds altijd 100% eval-coverage hebben en mijn `batch_local_fill` 1%.
3. Op huidige cadans duurt volledige eval van de 18,951 open rijen **~16 uur**. Als je het sneller wil gebeuren, kan een aparte eval-script / Celery task dezelfde logica bulk-runnen (analoog aan `fill_predictions_local.py`'s lokaal-pattern).
4. Zolang Railway draait komt het vanzelf goed; geen risico op blijvende gap.

**Geen aanbevolen fix.** Beslissing aan jou of je wil wachten (gratis) of een snelle bulk-eval wil bouwen (~1 uur werk voor een lokaal script).
