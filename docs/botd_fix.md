---
title: Pick-of-the-Day fix — Modelvalidatie + Live meting split
date: 2026-04-18
scope: route + display layer, NO engine/model changes
---

# Pick-of-the-Day fix — model-validation + live-measurement split

## Diagnose (wat was er stuk)

`/bet-of-the-day` toonde niets voor recent afgelopen wedstrijden omdat
alle 69 afgelopen wedstrijden van de laatste 2 dagen **alleen
post-kickoff predicties** hebben (source `backtest`, gegenereerd door
de 5-minuten `job_generate_historical_predictions` cron nadat de
match al was gespeeld). De pre-match `job_generate_predictions` cron
draaide te traag (10-min interval) en miste het window vóór aftrap.

De publieke endpoints filteren backtest-rijen met `predicted_at >
scheduled_at` strikt uit via `trackrecord_filter()` — terecht, want
dat zijn geen echte pre-match picks — maar dat betekent dat er voor
afgelopen matches netto **0** zichtbare picks waren.

Zie `docs/pipeline_gap_report.md` voor de oorspronkelijke diagnose.

## Oplossing — 3 delen

### Deel 1 — Backend: twee nieuwe endpoints

Bestand: `backend/app/api/routes/betoftheday.py`

- `GET /api/bet-of-the-day/model-validation?limit=30`
  - Retourneert `{summary, picks}` met per dag 1 hoogst-confident pick
  - Filter: `v81_predictions_filter()` (v8.1 pipeline vanaf 2026-04-16)
  - Geen pre-match guard — backtest-picks op afgelopen wedstrijden
    zijn toegestaan en komen door
  - Tier-aware: user tier bepaalt welke picks gereturned worden

- `GET /api/bet-of-the-day/live-tracking?limit=30`
  - Zelfde shape
  - Strikt: `prediction_source = 'live'` AND `predicted_at <
    scheduled_at` AND `created_at >= 2026-04-18`
  - Initieel (bijna) leeg — groeit dagelijks

Gedeelde helper `_build_botd_section(...)` doet het werk voor allebei.
De twee endpoints verschillen alleen in drie flags:
`require_pre_match`, `require_live_source`, `created_from`.

**Geen engine-wijzigingen:** `v81_predictions_filter` is ongewijzigd,
geen nieuwe model-logica, geen wijzigingen aan `forecast_service.py`
of de Prediction-model.

### Deel 2 — Celery scheduler: 10 min → 3 min

Bestand: `backend/app/tasks/celery_app.py`

```
- "generate-predictions-every-10m": crontab(minute="*/10")
+ "generate-predictions-every-3m":  crontab(minute="*/3")
```

De taak (`task_generate_predictions`) was en is idempotent: hij
selecteert alleen `SCHEDULED` matches binnen 72u die **nog geen**
prediction hebben (`~exists(...)` guard in
`generate_predictions_for_upcoming`). Frequentie verhogen kan dus
geen dubbele rijen maken, alleen het window verkleinen waarin een
ingeste fixture nog geen pre-match pick heeft.

**Geen engine-wijzigingen:** alleen de schedule-string.

### Deel 3 — Frontend: `/bet-of-the-day` en `/trackrecord` herstructureren

Bestand: `frontend/src/app/(app)/bet-of-the-day/page.tsx`

- **Nieuw** component `BotdPicksSection` (~220 regels): neemt
  `endpoint`, `title`, `description`, `accentColor`, `emptyCopy` en
  optioneel een `lowSampleThreshold + lowSampleCopy` disclaimer.
  Rendert 4 KPI-boxjes (accuracy / picks / reeks / avg. conf.) en
  daaronder de picks-tabel met ✅/❌/wacht.
- `<BOTDTrackRecordCard />` en `<BOTDHistoryList />` vervangen door:
  ```tsx
  <BotdPicksSection
    endpoint="model-validation"
    title="Modelvalidatie — verzamelde data"
    description="Onze BOTD-methode toegepast op recent afgelopen ..."
    ...
  />
  <BotdPicksSection
    endpoint="live-tracking"
    title="Live meting sinds 18 april 2026"
    description="Alleen picks die strikt vóór de aftrap zijn ..."
    lowSampleThreshold={10}
    lowSampleCopy="Klein sample — de meting loopt nog. Eerlijke ..."
  />
  ```
- De twee oude functies `_LegacyBOTDTrackRecordCard` en
  `BOTDHistoryList` en hun in-file imports zijn verwijderd — netto
  **-115 regels**.

Bestand: `frontend/src/components/ui/botd-track-record-section.tsx`

- Haalt nu `/bet-of-the-day/model-validation?limit=15` i.p.v. de twee
  oude endpoints. Shape-mapping: `summary` → aggregate KPIs,
  `picks` → history rows. Zo blijft deze component werken op
  `/trackrecord` en `/track-record` zonder eigen herindeling.

## Terminologie (Deel 3 — integriteit-sprint check)

- **"Verzamelde data"** voor de model-validatie sectie ✅
- **"Live meting sinds 18 april 2026"** voor de echte pre-match sectie ✅
- Geen publieke mentions van "backtest" op `/bet-of-the-day` of
  `/trackrecord` ✅ (pricing, homepage, sidebar al schoon uit
  eerdere integriteit-commits)

## Verificatie

- `git diff backend/app/forecasting/` — leeg ✅
- `git diff backend/app/models/` — leeg ✅
- `git diff backend/app/features/` — leeg ✅
- `npx tsc --noEmit` — EXIT=0 ✅
- `python -c "import ast; ..."` voor gewijzigde backend-files — OK ✅

## Wat de gebruiker straks ziet

1. `/bet-of-the-day` bovenin: vandaag's pick (ongewijzigd).
2. Daaronder: **"Modelvalidatie — verzamelde data"** met gevulde
   KPIs en een tabel met 30 recente daily-picks inclusief uitslagen
   en ✅/❌. Dit is zichtbaar binnen ~5 minuten na deploy.
3. Daaronder: **"Live meting sinds 18 april 2026"** — initieel
   leeg of met 1-2 rijen. Groeit elke dag dat de verkorte 3-min
   cron vóór aftrap picks produceert.

## Wat dit NIET oplost

- De bestaande backfill-rijen met `predicted_at > scheduled_at`
  blijven in de DB staan; ze komen nu zichtbaar via
  `model-validation` met juist label. We gooien geen data weg.
- Als de `forecasting`-queue op Railway geen worker heeft draait
  geen enkele cron — dat moet apart geverifieerd (admin Pipeline
  Health kaart zou straks `live` meer dan 169/24u moeten tonen bij
  gezonde worker + 3-min cadans).

## Wat nog kan volgen (backlog)

- Relabel `/trackrecord` kopij om de BOTD-sectie expliciet te
  splitsen (nu toont `BotdTrackRecordSection` alleen de
  model-validation helft zonder de live-meting counterpart — dat
  is functioneel correct maar kan explicieter).
- Na een week data in `live-tracking`: verwijder de low-sample
  disclaimer automatisch zodra `total_picks >= 10`.
