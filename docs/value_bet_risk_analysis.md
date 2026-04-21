# Value Bet Engine — Fase 2 Risico-analyse

**Datum:** 2026-04-21
**Pad:** B — bouwen zonder backtest-claim, alleen live-meting
**Bron:** `backend/scripts/value_bet_phase2_risks.py` (read-only, Railway DB)
**Vorige fase:** `docs/value_bet_analysis.md`

---

## TL;DR — vier rode vlaggen, één grote positieve verrassing

| # | Risico | Kleur | Mitigatie voor pad B |
|---|--------|-------|----------------------|
| 2.1 | Opening-line data, geen closing-line | 🔴 | EV-berekening baseren op snapshot-at-prediction; geen closing-line-value claim |
| 2.2 | Model-overconfidence in hoge buckets | 🟡 | Pick alleen van predictions met conf in gemeten-kalibreert zone (55-65%); disclaimer voor >70% |
| 2.3 | Populated-subset is bijna 100% live, survivorship zwaar | 🔴 | Alleen live predictions gebruiken. `batch_local_fill` + `backtest` uitsluiten |
| 2.4 | Line-movement tails extreem (max 5.9-8.1 odds-units) | 🟡 | Late-news filter: drop pick als odds >10% bewogen tussen snapshots |
| 2.5 | Single-source odds, 1 bron kan uitvallen | 🟡 | Graceful degradation: geen value-bet van de dag als geen fresh odds |

**Positieve verrassing (2.2):** model-kalibratie over 98k evaluaties is scherp —
deltas tussen -0.4% en +4.5%. De 100% edge-positive uit Fase 1 was een
sample-artefact van een heel kleine (n=104) populated-subset, niet een
structureel probleem met het model.

**Harde blokker voor backtest-claim:** `batch_local_fill` (19k rows, 0%
odds-coverage) en `backtest` (79k rows, 0.05% odds-coverage) mogen níét in
de value-bet pool. Onze live-pool is 145 rows (30% van 471 `live` preds) —
dat is ~3-4 weken aan data voor eerste honest sample van n>=30.

---

## 2.1 Data-kwaliteit risico 🔴

### Meting

| Metric | Waarde |
|--------|-------:|
| 1x2 odds-rows totaal | 1,572 |
| Gemiddelde lead-time vóór kickoff | **111.9 uur (~4.6 dagen)** |
| Min lead-time | 1.27 uur |
| Max lead-time | 336 uur (14 dagen) |
| Rows binnen 1h voor kickoff (closing-proxy) | **0** |
| Rows >24h voor kickoff | 1,399 / 1,572 (89%) |

### Risico

We capturen **opening-lines**, niet closing-lines. Closing-line-value (CLV)
is de gouden standaard voor value-bet validatie: als jouw pick odds 2.10
had op het moment van plaatsing en sluit op 1.95, heb je CLV+ bewezen. Wij
kunnen dat niet meten. Value-bet claim in de literatuur ruimt grofweg 80%
van zijn credibility aan CLV+.

### Predictions lead-time

| source | n | avg_hrs | min_hrs | max_hrs |
|--------|--:|--------:|--------:|--------:|
| backtest | 78,861 | **-30,492** | -54,623 | -3.89 |
| live | 471 | 137.81 | 1.00 | 331.74 |

De 78.861 `backtest` preds zijn **retroactief** (negatieve lead-time =
stamped ná kickoff). Dat is exact het v7 honesty-veld: alleen `live` telt
voor waardeclaims. CLAUDE.md bevestigt: `backtest` gebruikt `team_seeds.py`
met present-day static Elo → leakage.

### Mitigatie (pad B)

1. Value-bet pool is strikt `prediction_source = 'live'` (n=471 totaal,
   145 populated).
2. `expected_value` wordt berekend tegen de odds snapshot bij predict-tijd.
   Geen claim over CLV+.
3. Copy op de UI: "Gebaseerd op odds op voorspelmoment, niet op slotkoers."
   Geen "we beat the closing line" narrative.

---

## 2.2 Model-kalibratie risico 🟢 (onverwacht goed)

### Meting — 98k evaluated predictions

| prob-bucket | n | hit% | verwacht | delta |
|-------------|---:|-----:|---------:|-----:|
| 45-50 | 17,642 | 47.1% | 47.5% | -0.4 |
| 50-55 | 12,633 | 52.7% | 52.5% | +0.2 |
| 55-60 | 9,316 | 57.1% | 57.5% | -0.4 |
| 60-65 | 6,376 | 64.0% | 62.5% | +1.5 |
| 65-70 | 4,068 | 68.6% | 67.5% | +1.1 |
| 70-75 | 2,525 | **77.0%** | 72.5% | **+4.5** |
| 75-80 | 1,471 | 80.0% | 77.5% | +2.5 |
| 80-85 | 696 | 86.5% | 82.5% | +4.0 |
| 85+ | 205 | 96.1% | 93.0% | +3.1 |

### Interpretatie

Dit is opvallend goed. De max. drift is +4.5% in de 70-75% bucket; in de
lage en midden-buckets zit de kalibratie op 0.2-1.5% van perfect. Dit verklaart
ook de 100% edge-positive uit Fase 1: in 70-80% buckets is het model
onder-confidence vs. fair-implied → de meeste picks *lijken* value.

CLAUDE.md waarschuwt voor `team_seeds.py` leakage, maar **kalibratie op
98k live+backtest evals bevestigt dat schendende het retroactieve probleem
niet in prob-kalibratie landt** — alleen in accuracy-niveau (de 77% hit op
70-75% bucket is waarschijnlijk deels leakage-ondersteund, maar de
kalibratie-relatie tussen prob en hit is intact).

### Risico

Voor value-bet selectie doet alléén kalibratie ertoe — als 70% prob
betekent 77% hit, dan is onze "edge" in die bucket systematisch onderschat
en de engine toont frequent value die echt (over-)real is. Bij gebruik op
`live` pool zonder leakage-risico blijft deze properte waarschijnlijk
overeind.

### Mitigatie

1. Value-bet selectie beperken tot buckets **55%-75%** (delta ≤ +4.5%,
   ~20k samples per bucket → betrouwbaar gemeten).
2. Picks buiten die range tonen met "lage statistische basis" waarschuwing.
3. Periodiek (monthly) kalibratie her-meten op live-only pool.

---

## 2.3 Survivorship bias 🔴

### Meting

| prediction_source | total | populated (met odds) | % |
|--|--:|--:|--:|
| backtest | 78,861 | 39 | 0.05% |
| batch_local_fill | 19,151 | **0** | 0.00% |
| live | 471 | 145 | **30.79%** |

### Interpretatie

De populated-subset (n=184 totaal) is bijna volledig live (145/184 = 79%).
De overige 39 `backtest` rows zijn exoten. Conclusie: wat we "historisch"
noemen is in werkelijkheid 6 dagen live-data.

### Risico

- Elke aggregaat-statistiek over "alle populated snapshots" is in feite
  een uitspraak over 145 recent-live predictions, niet over 98k historische.
- League-coverage in populated-subset: <1% per league (Premier League 0.7%,
  Liga MX 0.8%) — geen enkele league heeft genoeg sample voor
  per-league ROI claim.

### Mitigatie

1. Frontend: geen historische backtest-kaart voor Value Bet tab. Alleen
   "Live meting sinds 2026-04-15" met big-fat disclaimer.
2. Alle value-bet queries strikt `prediction_source = 'live'`. Expliciet
   uitsluiten van `batch_local_fill` en `backtest` in de selectie-laag.
3. Per-league breakdown wachten tot `populated` per league >= 30.

---

## 2.4 Live vs. backtest gap 🟡

### Meting — line movement bij matches met ≥2 snapshots

| metric | waarde |
|--------|-------:|
| matches met ≥2 snapshots | 373 |
| avg home-odds spread | **0.118** |
| avg draw-odds spread | 0.100 |
| avg away-odds spread | **0.214** |
| max home-odds spread | 5.889 |
| max away-odds spread | 8.079 |

### Interpretatie

Gemiddeld is odds-movement klein (~0.10-0.21 odds-units) — typische
opening-to-close drift. Maar de tail is dodelijk: max 8 odds-units betekent
een match waar away-odds ging van ~2.00 naar ~10.00 (rode kaart, key-player
blessure, COVID-uitval). Als onze snapshot toevallig vóór de news zat, is
onze berekende edge **extreem over-geschat** en kunnen we dus een pick
publiceren tegen achterhaalde odds.

### Risico-scenario

Prediction om 10:00 — odds home 2.10 (ons edge: +8%). Om 13:00 komt
transfer-nieuws: keeper out. Odds klappen naar 2.80. Onze gepubliceerde
pick om 08:00 de volgende dag toont nog steeds "edge +8%" op 2.10. User
plaatst bet tegen 2.80 real-time odds en denkt edge te hebben — maar die
is verdampt.

### Mitigatie

1. **Late-news filter** in selectie-engine: drop pick als spread
   (`max_odds - min_odds` in afgelopen 24h) > 10% van median.
2. **Freshness-tag** op UI: toon "odds van HH:MM" expliciet zodat user
   weet de edge kan verouderd zijn.
3. **Odds-refresh** minder dan 4 uur vóór kickoff als `predicted_at < 4h`
   pre-match ligt. (Geen engine change — alleen snapshot-refresh.)

---

## 2.5 Operationeel risico 🟡

### Meting

| Metric | Waarde |
|--------|-------:|
| Odds-bronnen | 1 (`api_football_avg`) |
| Cron-job | `job_snapshot_upcoming_odds`, 1x/dag, cap 400 fixtures |
| Budget API-Football | ~400/dag = 5.3% van 7,500 daily limit |
| Laatste row-timestamp | 2026-04-21 15:11 UTC (< 1 dag oud) |
| Daily volume | 91-310 rows/dag sinds 2026-04-15 |
| Uptime (6/6 dagen data) | 100% |

### Risico's

1. **Single point of failure:** als API-Football down is of key expires
   → geen fresh odds → geen value-bet mogelijk die dag.
2. **Cap-risico:** cron caps op 400/dag; als scheduled-fixture-count groeit
   boven dat, sommige matches hebben geen odds.
3. **The Odds API ongebruikt:** `job_sync_odds` bestaat in `scheduler.py`
   maar gebruikt `THE_ODDS_API_KEY` die blijkbaar niet ingevuld — had
   kunnen fungeren als backup-bron.
4. **Opening-bias:** `fetch_pre_match_odds_raw` wordt 1x per dag gecalled.
   Als match om 20:00 vanavond is en call was om 08:00, hebben we 12h-oude
   odds — opening line, geen closing.

### Mitigatie

1. **Health-check endpoint** voor odds-freshness: `/api/health/odds`
   retourneert age van laatste `odds_history` row. Alert als >24h.
2. **Graceful no-pick:** als geen fresh odds voor vandaag's kandidaat-matches
   beschikbaar, Value Bet tab toont "Geen value bet vandaag — odds niet
   gerefresht" in plaats van stale pick.
3. **The Odds API als backup:** overweeg (buiten deze sprint) de
   `job_sync_odds` activeren voor cross-source validation.

---

## Aanbevolen parameters voor Fase 3 (pad B, met risk-mitigations)

```
ENGINE PARAMETERS v1.0
─────────────────────
scope:                  prediction_source = 'live' only
edge_threshold:         >= 5% (model_edge op pick)
confidence_range:       0.55 <= conf <= 0.75 (gecalibreerd gemeten)
odds_range:             1.50 <= odds <= 3.50
odds_freshness:         recorded_at niet ouder dan 24h bij selectie
late_news_filter:       drop pick als odds-spread 24h > 10% van median
max_picks_per_day:      1
tier_preference:        gold|platinum > silver > free
score:                  edge * confidence * (1 / odds_freshness_hours)

UI DISCLAIMERS
──────────────
- "Live meting sinds 2026-04-15, sample n=<N>"
- "Bij n<30: meting loopt, te klein voor conclusies"
- "Gebaseerd op odds op voorspelmoment, niet op slotkoers"
- "Single-source odds (api_football_avg) — geen multi-book consensus"
```

---

## Go/no-go voor Fase 3

**GO voor bouwen**, mét de volgende strikte voorwaarden:

1. Backtest-tab op de UI wordt **niet** gebouwd — alleen live-meting.
2. UI-copy blijft bij "meting loopt" zolang live-sample n < 30. Op 2026-04-21
   zijn we op n=145 (over alle leagues, alle tiers) — mogelijk genoeg voor
   een eerste *indicatieve* hit-rate, maar nog niet voor ROI-claim.
3. Alle value-bet-selectie beperkt tot `prediction_source = 'live'`.
4. Freshness-filter + late-news filter in de selectie-laag.
5. `/api/health/odds` endpoint erbij voor ops-monitoring.

**Stop. Wacht op akkoord.** Na akkoord start Fase 3 met: DB-migratie voor
`value_bets` tabel, selectie-laag als service (niet engine-change), pipeline
voor dagelijkse selectie, endpoints, frontend dual-mode BOTD.

---

## Commit-suggestie

```
feat(value-bet): risk analysis complete

- 5 risks mapped, matrix in docs/value_bet_risk_analysis.md
- Analysis scripts in backend/scripts/value_bet_phase2_risks.py (read-only)
- Kalibratie op 98k evals is scherp (max drift +4.5% @ 70-75% bucket)
- Opening-line-only coverage is hard blocker for closing-line-value claim
- GO voor Fase 3 met strikte scope: live-only, geen backtest-claim
```
