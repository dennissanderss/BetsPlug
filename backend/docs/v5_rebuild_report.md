# BetsPlug Platform — Volledige Status Rapportage
**Datum:** 12 april 2026
**Versie:** v5 Foundation + v6.x UX verbeteringen

---

## 1. Executive Summary

Het BetsPlug platform is **operationeel in productie** op Railway (backend) + Vercel (frontend). De AI engine "BetsPlug Pulse" genereert voorspellingen, live scores werken, gebruikers kunnen predictions bekijken, resultaten volgen en rapporten downloaden.

**Het kritieke openstaande probleem:** de Strategy Lab toont strategieën als "Profitable" terwijl de backend ze als "Under Investigation" classificeert. De ROI-cijfers zijn **onbetrouwbaar** omdat ze berekend zijn met nep-odds (1.90 fallback) in plaats van echte marktodds. Dit moet gefixt worden voordat het platform naar echte gebruikers gaat.

---

## 2. Wat Werkt (Productie)

### Platform Infrastructure
| Component | Status |
|---|---|
| Backend (FastAPI op Railway) | Live, stabiel |
| Frontend (Next.js op Vercel) | Live, 8 talen |
| Database (PostgreSQL) | 4.699 wedstrijden, 5.108 voorspellingen |
| Redis cache | Live (live scores, API cache) |
| API-Football Pro (7.500 req/dag) | Geconfigureerd, ~25% gebruikt |
| football-data.org (gratis) | Dagelijkse fixture sync |

### BetsPlug Pulse AI Engine
| Feature | Status |
|---|---|
| Elo Rating Model | Werkend, leak-vrij (point-in-time history) |
| Poisson Goal Model | Werkend (Dixon-Coles correctie) |
| Logistic Regression | Werkend (CalibratedClassifierCV) |
| Ensemble (Pulse) | Combineert alle 3 modellen |
| Over/Under 2.5 voorspellingen | Werkend |
| Anti-leakage assertions | Actief (hard fail) |

### Frontend Features
| Pagina | Status |
|---|---|
| Jouw Route (3 paden) | Werkend |
| Dashboard (KPI's + charts) | Werkend, live data |
| Voorspellingen (compact per league) | Werkend, 3 tabs (Upcoming/Live/Results) |
| Live Scores | Werkend (60s refresh via API-Football) |
| Tip van de Dag | Werkend + track record stats |
| Resultaten & uitslagen | Werkend + strategie context uitleg |
| Weekrapport | Werkend |
| Trackrecord | Werkend + CSV download + Models panel |
| Rapporten & exports (PDF/CSV/JSON) | Werkend + auto-cleanup 12u |
| Strategie Lab | **Problematisch** (zie sectie 3) |
| Instellingen | Werkend |

---

## 3. Wat NIET Klopt — Strategy Lab (KRITIEK)

### Het Probleem
De Strategy Lab toont op dit moment:

```
"High Confidence Any"    → "Profitable" badge, 55.6% WR, +5.6% ROI
"Model Confidence Elite" → "Profitable" badge, 54.8% WR, +4.0% ROI
```

**Dit is misleidend.** De backend classificeert ALLE 14 strategieën als:
- 0 validated
- 7 under_investigation
- 5 rejected
- 2 break_even

### Waarom de ROI Cijfers Onbetrouwbaar Zijn

De ROI wordt berekend als: `(winrate × odds) - 1.0`

Het probleem zit in de **odds**:
- 99% van de voorspellingen heeft GEEN echte pre-match odds
- Het systeem valt terug op een **hardcoded 1.90** als nep-odds
- Bij favorites (echte odds ~1.50) is de werkelijke ROI NEGATIEF

**Rekenvoorbeeld:**
```
Strategy "High Confidence Any" — 55.6% winrate

Met nep-odds 1.90:  55.6% × 1.90 = 1.056 → ROI = +5.6% (WINST)
Met echte odds 1.55: 55.6% × 1.55 = 0.862 → ROI = -13.8% (VERLIES)
Met echte odds 1.70: 55.6% × 1.70 = 0.945 → ROI = -5.5% (VERLIES)
Met echte odds 1.90: 55.6% × 1.90 = 1.056 → ROI = +5.6% (WINST)

De ROI hangt VOLLEDIG af van welke odds je gebruikt.
Zonder echte odds is het getal betekenisloos.
```

### Waarom Er Geen Echte Odds Zijn

1. De 5.108 voorspellingen zijn gegenereerd in een **bulk backfill** op basis van historische wedstrijden (aug 2024 - apr 2026)
2. Op het moment van generatie werden er geen pre-match odds opgeslagen
3. De dagelijkse odds cron (`job_snapshot_upcoming_odds`) was nog niet actief toen deze wedstrijden plaatsvonden
4. Een poging om historische odds via API-Football te backfillen leverde slechts **27 rijen op uit 300 pogingen** — de API bewaart geen oude odds

### Frontend vs Backend Disconnect

| Wat de gebruiker ziet | Wat het backend zegt |
|---|---|
| "Profitable" groene badge | "under_investigation" |
| ROI: +5.6% | ROI: onbetrouwbaar (nep-odds) |
| 2 strategieën zichtbaar | 0 gevalideerde strategieën |

**De frontend Strategy Lab pagina gebruikt een simpelere logica** (ROI > 0 = Profitable) dan de backend validatie engine (die echte odds coverage eist).

---

## 4. Strategie Hervalidatie Resultaten (12 april 2026)

Walk-forward validatie: 28 dagen training, 14 dagen test, rollende windows.

| Strategie | Picks | Winrate | ROI (nep) | Odds Coverage | Walk-Forward | Backend Status |
|---|---|---|---|---|---|---|
| Home Dominant | 1.136 | 63.3% | +20.0% | 1.1% | 34/37 positief, Sharpe 7.22 | under_investigation |
| Conservative Favorite | 1.272 | 61.6% | +16.7% | 1.0% | 33/37 positief, Sharpe 6.24 | under_investigation |
| Low Draw High Home | 973 | 62.9% | +19.2% | 1.3% | 32/37 positief, Sharpe 6.48 | under_investigation |
| Anti-Draw Filter | 1.584 | 60.6% | +14.9% | 1.1% | 31/37 positief | under_investigation |
| Strong Home Favorite | ~800 | 59.6% | +13.1% | 1.0% | ? | under_investigation |
| High Confidence Any | ~2.719 | 55.6% | +5.6% | 0.9% | ? | under_investigation |
| Model Confidence Elite | ~3.054 | 54.8% | +3.9% | 0.9% | ? | under_investigation |
| High-Scoring Match | ? | 51.1% | -2.8% | 1.3% | ? | break_even |
| Away Upset Value | ? | 51.8% | -1.7% | 1.3% | ? | break_even |
| Underdog Hunter | ? | 48.5% | -7.9% | 1.5% | ? | rejected |
| Defensive Battle | ? | 48.3% | -8.1% | 0.7% | ? | rejected |
| Home Value Medium Odds | ? | 46.5% | -11.5% | 1.1% | ? | rejected |
| Draw Specialist | ? | 44.1% | -16.0% | 1.1% | ? | rejected |
| Balanced Match Away | ? | 44.9% | -14.7% | 1.3% | ? | rejected |

**Observatie:** De winrates zijn BETROUWBAAR (gebaseerd op echte uitslagen). De ROI is NIET betrouwbaar (gebaseerd op nep-odds). De walk-forward signalen zijn HOOPVOL maar niet verifieerbaar zonder echte odds.

---

## 5. Trackrecord Cijfers (Betrouwbaar)

Deze cijfers zijn WEL betrouwbaar — ze zijn gebaseerd op echte wedstrijduitslagen, niet op odds:

| Metriek | Waarde |
|---|---|
| Totaal voorspellingen | 5.108 |
| Geëvalueerd | 4.983 |
| Correct | 2.472 |
| Nauwkeurigheid | 49.6% |
| Periode | aug 2024 — apr 2026 |
| Competities | Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie |
| Model | BetsPlug Pulse (Elo + Poisson + Logistic ensemble) |

**49.6% nauwkeurigheid** is realistisch voor een 3-way football prediction model. Een model dat boven 52-53% consistent uitkomt op 1X2 voorspellingen is al uitzonderlijk in de academische literatuur.

---

## 6. API Budget Status

| API | Limiet | Gebruikt/dag | Percentage |
|---|---|---|---|
| API-Football Pro | 7.500/dag | ~1.900 | 25% |
| football-data.org | Gratis (10/min) | ~84 | N/A |
| The Odds API | 500/maand | ~16 | 3% |

**Ruim binnen budget.** Live scores kosten ~720 calls/dag. Schaalbaar naar 1000+ gebruikers zonder extra API kosten (alle users lezen uit dezelfde Redis cache).

---

## 7. Bekende Issues & Notities

### Moet gefixt worden (blokkend):
1. **Strategy Lab badges tonen "Profitable" terwijl backend "under_investigation" zegt** — frontend badges moeten de echte validation_status gebruiken
2. **ROI berekening op nep-odds** — strategieën kunnen pas eerlijk gevalideerd worden als echte odds beschikbaar zijn

### Moet gefixt worden (niet-blokkend):
3. "Brier Score" label nog hardcoded op Strategie Lab pagina (moet "Voorspellingskwaliteit" zijn)
4. Trackrecord transparency tekst vermeldt nog "Brier score"
5. Dubbele wedstrijden in DB van twee API sources (verborgen via dedup filter, DB niet opgeschoond)
6. Blog/articles bevatten nog "Ensemble" referenties (moet "BetsPlug Pulse" zijn)

### Nice-to-have:
7. Visueel diagram van BetsPlug Pulse op de About pagina (hoe de 3 modellen samenwerken)
8. DB cleanup van oude `apifb_match_` duplicate fixtures

---

## 8. Wat Lost Zichzelf Op

De dagelijkse odds cron (`job_snapshot_upcoming_odds`, 05:30 UTC) verzamelt elke dag pre-match odds voor aankomende wedstrijden. Over 2-4 weken:
- Elke nieuwe voorspelling heeft echte odds erbij
- Walk-forward validatie kan echte ROI berekenen
- Strategieën valideren eerlijk OF worden eerlijk afgewezen

---

## 9. Aanbevolen Volgende Stappen

### Prioriteit 1 — Eerlijkheid (nu)
- Fix Strategy Lab frontend: badges moeten backend `validation_status` tonen
- ROI kolom tonen met disclaimer "op basis van geschatte odds" zolang coverage < 50%
- OF: Strategy Lab tijdelijk verbergen totdat er eerlijke data is

### Prioriteit 2 — Data Accumulatie (2-4 weken wachten)
- Odds cron laten draaien
- Na 2 weken: hervalidatie triggeren
- Strategieën die dan validated zijn → activeren
- Strategieën die rejected worden → eerlijk communiceren

### Prioriteit 3 — Polish (daarna)
- Pulse diagram op About pagina
- Blog content updaten
- DB cleanup duplicaten
- Overige label fixes

---

## 10. Technische Referenties

| Bestand | Beschrijving |
|---|---|
| `backend/app/forecasting/elo_history.py` | Point-in-time Elo engine |
| `backend/app/forecasting/forecast_service.py` | Pulse prediction pipeline |
| `backend/app/services/scheduler.py` | Alle cron jobs (odds, live scores, sync) |
| `backend/app/api/routes/strategies.py` | Validatie engine (walk-forward + bootstrap) |
| `backend/app/services/research/strategy_harness.py` | Walk-forward + bootstrap CI |
| `backend/app/api/routes/fixtures.py` | Dedup filter + fixtures endpoints |
| `backend/app/api/routes/predictions.py` | Predictions API (JSONResponse) |
