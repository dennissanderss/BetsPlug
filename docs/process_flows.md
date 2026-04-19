# Process Flows — Deep Audit Fase 3

**Datum:** 2026-04-19
**Doel:** de onderliggende processen blootleggen — wie zet wat op welk moment? Waar ontstaan race-conditions of stilstand?

Kern-observatie vooraf: **in productie draait ALLEEN APScheduler** (`app/services/scheduler.py`, gestart vanuit `main.py:273-279`). Celery Beat (`app/tasks/celery_app.py`) is dode code in Railway — er is geen `celery beat` worker in `Procfile` / `railway.toml` / `start.py`. Dat verandert de cadence-verwachtingen ten opzichte van wat CLAUDE.md commit-log suggereert.

## 3.1 Fixture-ingestion flow

- **Bron:** Football-Data.org (free-tier, 10 req/min) + API-Football (pro-tier).
- **APScheduler job:** `job_sync_data` (scheduler.py:?) — elke **6 uur** via `IntervalTrigger(hours=6)` + daily cron 06:00 UTC (`scheduler.py:896-902`).
- **Live fixtures:** `job_sync_live_fixtures` — elke **60 sec** (scheduler.py:863-870), maar alleen statusupdates tijdens matches, géén nieuwe predictions.
- **Rotation:** één competitie per cycle (PL→PD→BL1→SA→FL1→CL→DED) om binnen rate-limits te blijven.
- **Wat gebeurt bij import:** nieuwe `Match`-rij met `status=SCHEDULED`. **Géén** onmiddellijke prediction trigger — er is geen post-insert hook.
- **Risico:** tussen import en volgende `job_generate_predictions` zit tot **6 uur** gap. Matches die binnen 6 uur worden geïmporteerd én gespeeld missen hun pre-match prediction.
- **Data-sync task** heeft ook een `sync_recent_results` tegenhanger die scores invult wanneer matches afgelopen zijn.

## 3.2 Prediction-generation flow (upcoming / live)

- **APScheduler job:** `job_generate_predictions` (`scheduler.py:78-171`, schedule op regel 843-850).
- **Frequentie:** **elke 6 uur** via `IntervalTrigger(hours=6)`.
- **Match-selectie:** `status IN (SCHEDULED, LIVE) AND scheduled_at BETWEEN now AND now+7d` (line 121-128), geëxclueerd rijen die al een prediction hebben (line 131-140).
- **Idempotent:** zodra een match één keer voorspeld is, slaat de job hem over (`ids_to_predict = all_match_ids - existing_ids`).
- **Call:** `ForecastService().generate_forecast(match_id, db, source="live")` (line 156).
- **Timestamps:** `_persist()` in `forecast_service.py:657-735` zet `predicted_at = now`, `locked_at = now if source=='live'`, `match_scheduled_at = match.scheduled_at`. Als `scheduled_at <= now` → auto-downgrade `source → 'backtest'`, `locked_at = None` (line 672-676). Géén andere plek schrijft `predicted_at`.
- **Race-risico:** job draait elke 6u, match-start gaps tot 6u zonder pre-match-lock. Celery `task_generate_predictions` (elke 3 min) zou dit dichten maar **draait niet in prod**.
- **Historical generator:** `job_generate_historical_predictions` (scheduler.py:460-570) — elke 5 min, **source="backtest"** (line 521), alleen `Match.status == FINISHED AND no prediction exists`. Evalueert daarna direct binnen dezelfde task (line 530-570). Dit is de enige plek in prod die actief *backtest*-rijen aanmaakt.

## 3.3 Evaluation flow

Twee paden die evalueren:

1. **`job_evaluate_predictions`** (scheduler.py:174+, schedule 853-860) — elke **6 uur**.
2. **Inline evaluator in `job_generate_historical_predictions`** (scheduler.py:530-570) — direct na backtest-generatie, max 200 rijen per cyclus, elke 5 min.

**Trigger:** `Match.status == FINISHED AND PredictionEvaluation IS NULL`. Geen event-driven trigger — pure polling.

**Lag:** zodra een match `FINISHED` wordt (via `sync_recent_results`), duurt het max 5 min (historical-pad) tot 6 uur (regulier pad) voor de evaluation entry erin staat. BOTD-track-record, dashboard-accuracy en pricing-comparison reflecteren alleen geëvalueerde rijen.

**Risico:** evaluator die rijen zonder `match.result` skipt (ontbrekende score-sync) → permanent zonder evaluation.

## 3.4 BOTD selection flow

- **Geen BOTD-tabel.** Elk request berekent opnieuw (`betoftheday.py`).
- **Selectie-logica** (`betoftheday.py:627-811`):
  1. Filter: `confidence >= 0.60`, matches in `[now, now+72h]`, `trackrecord_filter()`, `access_filter(user_tier)`.
  2. Voorkeur voor `prediction_source == 'live'`; fallback naar alle v8.1-sources als geen live rij.
  3. `ORDER BY confidence DESC LIMIT 1`.
  4. Tier-label via `pick_tier_expression()` daarna gecomputed.
- **Stabiliteit:** dezelfde dag, meerdere requests → zelfde rij (op één uitzondering na: nieuwe matches binnen 72u kunnen tijdens de dag binnenkomen en een hogere confidence hebben → BOTD kan verspringen).
- **Conflicten (zelfde confidence):** `ORDER BY` met één key → DB-determinisme niet gegarandeerd. Voeg secundaire sort toe (bv. `Prediction.id`) als we stabiele BOTD willen.
- **BOTD voor dag zonder picks:** endpoint geeft `404` terug (zie `betoftheday.py` rond regel 752+, `HTTPException` bij geen match).
- **Geschiedenis:** `/history` endpoint retourneert per dag één BOTD door `DISTINCT ON (match_day)` patroon.

## 3.5 Tier-classification flow

- **Backend:** `pick_tier_expression()` (`core/tier_system.py:125-179`). Klassificatie gebeurt **per SELECT** — niet gecached, niet als kolom opgeslagen.
- **Frontend mirror:** `frontend/src/lib/pick-tier.ts:84-106`. UUIDs + threshold hard-gecodeerd. Gebruikt in `/predictions` om rows zelf te labelen (P2.2 in QA-rapport).
- **Drift-risico:** als `tier_leagues.py` wijzigt moet ook `pick-tier.ts` bijgewerkt. Geen automatisch kanaal.
- **Predictions < 0.55 confidence:** `pick_tier_expression` geeft NULL → aggregate GROUP BY toont een NULL-bucket. Alle endpoint-queries filteren deze correct weg (óf via `trackrecord_filter` baseline, óf via `if tier_int is None: continue` in Python). Pricing regel 151: `WHERE p.confidence >= 0.55` extra, dus NULL-bucket wordt daar niet eens gegenereerd.
- **LEAGUES_FREE == LEAGUES_SILVER** (top-14, `tier_leagues.py:56`). Elke pick in een league buiten top-14 krijgt NULL en valt uit elke aggregate.

## Knelpunten & aanbevelingen

| Knelpunt | Effect | Aanbeveling (voor Fase 8) |
|---|---|---|
| `job_generate_predictions` om de 6 uur | Matches die binnen 6u na ingestion gespeeld worden missen pre-match lock | Verlaag naar `IntervalTrigger(minutes=10)` of draai direct na elke `job_sync_data` cyclus. Dit is scheduler-config, niet engine. |
| `job_evaluate_predictions` om de 6 uur | Verse finished matches wachten tot 6u voor evaluation → dashboards lopen achter | Verlaag naar `IntervalTrigger(minutes=15)`. |
| Celery Beat dode code | Verwarring voor toekomstige dev (CLAUDE.md commit-log suggereert 3m cron) | Óf Celery Beat worker toevoegen aan Railway (Procfile `worker: celery beat …`), óf `app/tasks/celery_app.py` schedule-dict verwijderen. |
| BOTD conflict-deterministisch | Dezelfde-confidence picks kunnen van request-naar-request verspringen | Secundaire sort in `betoftheday.py` selectie (e.g. `.order_by(Prediction.confidence.desc(), Prediction.id)`). |
| Match-import triggert geen prediction | Tot 6u gap tussen fixture-insert en eerste pred | Na `sync_upcoming_matches` in `job_sync_data` direct `generate_predictions_for_upcoming` aanroepen (zelfde session). Regel-level wijziging in scheduler.py. |
| Frontend pick-tier mirror | Drift-risico | Gebruik `tier_info()` backend-response op `/predictions` (P2.2). |
| Geen monitoring van scheduler-runs | Stille faal mogelijk | Admin endpoint `/api/admin/scheduler-status` die `scheduler.get_jobs()` en laatste run-time per job retourneert. |

## Openstaande vragen

1. Draait APScheduler daadwerkelijk in prod? `main.py:275-279` is wrapped in try/except — een ImportError bij `apscheduler`-lib zou de boot *niet* breken maar het hele scheduler-systeem silently uitschakelen. Controle: is `apscheduler` in `backend/requirements.txt`? → te verifiëren met Railway logs (`CRON: Scheduler started with N jobs.`).
2. Is er Stripe-webhook / e-mail-service achter een Celery worker? Zo ja, hoe draait die? (buiten scope van deze audit maar relevant voor totaalbeeld.)
