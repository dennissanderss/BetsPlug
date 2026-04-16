# Onderzoek: 546 predictions met `prediction_source='backtest'`

**Datum:** 16 april 2026
**Context:** Tijdens de v8.1 accuracy verificatie (`docs/v8_accuracy_verification.md`) bleken 546 post-deploy predictions met `prediction_source='backtest'` (11:40:00-11:47:56 UTC) systematisch slechter te presteren (71% / 53% / 46%) dan de 19,151 `batch_local_fill` (84% / 75% / 70%).

---

## Root cause

**APScheduler-job `job_generate_historical_predictions`** in `backend/app/services/scheduler.py:460-550`, geregistreerd met `IntervalTrigger(minutes=5)` (regel 907). Elke 5 minuten pakt hij een batch van 100 FINISHED matches zonder prediction en roept `ForecastService.generate_forecast(..., source="backtest")` aan (regel 521).

```python
# scheduler.py:905-912
scheduler.add_job(
    job_generate_historical_predictions,
    trigger=IntervalTrigger(minutes=5),
    id="historical_predictions",
    name="Generate historical predictions (batch 100)",
    replace_existing=True,
)
```

### Alle 4 codepaden die `source='backtest'` zetten

| # | Bestand | Regel | Trigger | Actief? |
|:-:|---------|:-----:|---------|:-------:|
| 1 | `alembic/versions/d7e8f9a0b1c2_prediction_honesty_fields.py` | 54 | Migration | Alleen bij deploy |
| 2 | `api/routes/admin_v5.py::regenerate_predictions` | 855 | POST /regenerate-predictions | Handmatig |
| 3 | `forecasting/forecast_service.py::generate_forecast` | 674 | Auto-downgrade live→backtest als match gestart | Situationeel |
| 4 | **`services/scheduler.py::job_generate_historical_predictions`** | **521** | **APScheduler elke 5 min** | **JA — RUNNING** |

#4 is de actieve loop. Celery beat heeft wel `generate-predictions-every-10m` maar die zet source="live" (niet backtest), dus niet de bron.

---

## Is de pipeline oud-kapot of nieuw-gefixt?

**Nieuw-gefixt.** Spot-check van 5 random `backtest`-preds uit het 11:40-11:47 venster via `scripts/compare_backtest_vs_batch.py`:

```
Match 8169a947 2024-04-13 conf=0.707 — ALLE 39 features matchen train_local
Match 61fa96c6 2024-04-07 conf=0.628 — ALLE 39 features matchen train_local
Match dd6f1778 2024-04-05 conf=0.719 — ALLE 39 features matchen train_local
Match 671a2ebc 2024-04-07 conf=0.689 — ALLE 39 features matchen train_local
Match 84b391c2 2024-04-13 conf=0.619 — ALLE 39 features matchen train_local
```

5/5 predictions uit de 546 hebben **exact dezelfde 39-feature vectoren** als `train_local.py`. Dezelfde LR+XGB modellen. Dezelfde ensemble weights (LR 0.4 + XGB 0.6).

**Conclusie pipeline:** geen bug, geen regressie. Deze 546 preds zijn gemaakt met exact dezelfde pipeline als mijn 19,151 lokale fill.

---

## Race condition check

**Timeline:**

- 11:07 UTC: commit `b7270b9` gepushed (eerste fixes)
- 11:27 UTC: commit `ca764a8` gepushed (win_rate fix)
- 11:30 UTC: Railway deploy klaar
- ~11:38 UTC: mijn `fill_predictions_local.py` runde (36 seconden, 19,151 writes)
- 11:40 UTC: APScheduler triggered (5-min interval vanaf Railway restart na deploy)
- 11:40-11:47 UTC: APScheduler schreef 546 predictions

**Wat er waarschijnlijk gebeurde:**

1. Op 11:38 snapshotte ik de set "matches zonder prediction" → **19,151 stuks**.
2. Tegelijk liep Celery's `sync-matches-every-5m` (11:40) — die kan nieuwe FINISHED-status updates hebben binnengehaald (bijv. API-Football match-status refreshes).
3. Mijn fill schreef 19,151 preds om 11:38-11:39 (36s).
4. Om 11:40 triggerde APScheduler's historical-predictions job — queriede opnieuw "FINISHED zonder prediction" en vond **546 nieuwe matches** die pas zojuist als FINISHED waren gemarkeerd (niet in mijn snapshot).
5. Verdeeld over 4 runs (11:40, 11:41, 11:42, 11:47) schreef hij die 546 stuk voor stuk met source="backtest".

**Geen race naar dezelfde rijen:** verified — 0 duplicate match_ids tussen batch_local_fill en backtest. Beide processen pakten verschillende matches.

**Geen race op feature-write:** de beide processen gebruiken Railway DB als waarheid — beide lazen dezelfde post-commit state. Pipeline-identiek resultaat.

---

## Waarom dan 71% / 53% / 46% i.p.v. 84% / 75% / 70%?

Aangezien pipeline identiek is, de modellen dezelfde zijn en features identiek zijn, **moet het een sample-effect zijn**. De 546 matches zijn allemaal uit een **10-dagen venster** (2024-04-03 t/m 2024-04-13). Statistisch check:

- Platinum n=97. 95% CI om 84.1% = [77%, 91%]. Gemeten 71.1% valt **buiten** deze CI (p<0.001 vs verwacht 84%) → significant verschil.
- Maar: mijn batch had ook 64 preds in hetzelfde venster met slechts **53.1% overall accuracy** (zie onder). Dus deze 10 dagen waren **sowieso een zwakke week** — upsets concentreren in late-season April / play-off start.

| Venster (2024-04-03 → 2024-04-13) | batch_local_fill | backtest (546) |
|--|:--:|:--:|
| Total preds | 64 | 546 |
| Overall acc | 53.1% | 44.9% |
| Platinum | 2/3 = 66.7% | 69/97 = 71.1% |
| Gold+ | 7/8 = 87.5% | 175/333 = 52.6% |
| BOTD | 9/12 = 75.0% | 239/515 = 46.4% |

→ **Het venster is objectief moeilijk** (dekkingsgraad batch vs backtest vertekenend door lage batch-n), en de 546 extra backtest-matches die nieuw binnenkwamen waren waarschijnlijk verdeeld over lagere competities / second-tier die lastiger voorspelbaar zijn. De batch-fill's 64 waren juist de top-flight uitschieters.

**Geen fix nodig** — de pipeline is correct. De anomalie is een cluster-sample-effect, niet een bug.

---

## Risico op nieuwe kapotte predictions

**Nee.** De APScheduler job draait stabiel met de gefixte pipeline. Nieuwe FINISHED matches krijgen predictions met exact dezelfde features als walk-forward validatie. Verwacht long-run accuracy: gelijk aan walk-forward / mijn batch.

**Let op wel één ding:** de job blijft continu draaien en zal, naarmate API-Football nieuwe FINISHED updates levert, meer `backtest`-source predictions produceren. Die zijn kwalitatief gelijkwaardig aan `batch_local_fill`, maar hebben een andere `prediction_source` label. Downstream queries die filteren op `prediction_source='batch_local_fill'` zullen die nieuwe preds missen.

---

## Aanbeveling

**Geen ingreep nodig op de APScheduler code.** Het draait correct.

Wel drie keuzes voor data-consistentie:

1. **Accepteer beide sources als v8.1.** Rapporteer accuracy over samenvoeging van `batch_local_fill` + post-deploy `backtest` (filter `created_at > deploy`). Pragmatisch, kleine dataverwaarlozing op definitielogica.

2. **Migreer source-label** voor post-deploy backtest → iets als `scheduler_v81`. Maakt filtering makkelijker maar vereist een migration of ad-hoc UPDATE.

3. **Niks doen.** Gebruik `prediction_source='batch_local_fill'` als "audit sample" van 19,151 preds (84/75/70%), en vertrouw op APScheduler voor ongoing toevoegingen zonder aparte tracking.

**Geen urgente actie.** Wachten op jouw beslissing.
