# BetsPlug UI Audit — Volledige Bevindingen

## 1. Rode Draad (User Journey)

### Huidige flow (gebroken)
Login -> Dashboard (sports hub) -> ??? gebruiker weet niet waar te beginnen

### Voorgestelde flow (duidelijk)
```
Login
  |
  v
Dashboard (Sports Hub)
  |-- Snelle pills: BOTD | Predictions | Live | Results | Strategy Lab
  |
  +-> Tip van de Dag (/bet-of-the-day)
  |     "Onze beste dagelijkse pick met track record"
  |     MISSING: backtest stats sectie, confidence breakdown, league performance
  |
  +-> Alle Voorspellingen (/predictions)
  |     "Alle wedstrijden vandaag + komend met onze voorspelling"
  |     STATUS: Meest complete pagina, goed gebouwd
  |
  +-> Resultaten (/results)
  |     "Hoe ging het? Won/verloren + bewijs"
  |     STATUS: Goed, heeft weekly summary + streak tracking
  |
  +-> Strategy Lab (/strategy)
  |     "Bewezen winstgevende strategieen + backtests"
  |     STATUS: Goed, heeft ROI, win rate, walk-forward
  |
  +-> Trackrecord (/trackrecord)
        "Volledige transparantie over al onze voorspellingen"
        STATUS: Goed, KPIs + segmenten + rolling accuracy
```

## 2. Kritieke Bugs (Onmiddellijk fixen)

### BUG 1: Win Rate op Dashboard toont "0.4533%" (sidebar)
- **Locatie**: SportsHubSidebar.tsx -> WeeklySummary.win_rate
- **Probleem**: Backend geeft win_rate als 0-1 decimal (0.4533), frontend toont het als `{summary.win_rate}%` = "0.4533%"
- **Fix**: `Math.round(summary.win_rate * 100)` OF backend geeft het al als percentage (check)

### BUG 2: Ontbrekende team logos op sommige wedstrijden
- **Locatie**: Dashboard TodayMatchesList, YesterdayResultsStrip
- **Probleem**: Niet alle Fixture objecten hebben home_team_logo/away_team_logo gevuld
- **Oorzaak**: Logo's moeten eerst gebackfilled worden via `/admin/v5/backfill-team-logos`
- **Fix**: Fallback placeholder tonen wanneer logo ontbreekt (initiaal van team naam)

### BUG 3: Champions League wedstrijden tonen geen confidence %
- **Locatie**: Dashboard screenshot: Liverpool vs PSG en Atletico vs Barcelona tonen geen badge
- **Probleem**: Deze wedstrijden hebben geen prediction (null)
- **Gedrag**: Correct — geen prediction = geen badge. Maar zou "Analyseren..." moeten tonen

## 3. Ontbrekende Features per Pagina

### Dashboard (/dashboard)
- [ ] Logo fallback (initialen) voor teams zonder logo
- [ ] "Analyseren..." tekst voor wedstrijden zonder prediction
- [ ] Win rate fix (0.45 -> 45%)

### Tip van de Dag (/bet-of-the-day)
- [ ] **Backtest statistieken sectie** (GROOT — user vroeg hier specifiek om):
  - Brier score, log loss, calibration error
  - Accuracy per confidence bracket (>80%, >70%, >60%)
  - Accuracy per competitie
  - ROI simulatie ("had je elke pick gevolgd...")
  - Equity curve
- [ ] Backend endpoints bestaan al maar worden niet gebruikt:
  - `/trackrecord/calibration` — confidence buckets
  - `/trackrecord/segments?group_by=league` — per-league accuracy
  - `/trackrecord/summary` — overall metrics

### Alle Voorspellingen (/predictions)
- [x] Feature-compleet (68KB page, meest uitgebreide)
- [ ] Deprecated MatchCard component opruimen
- [ ] Edge berekeningen prominenter tonen

### Resultaten (/results)
- [x] Goed gebouwd met weekly summary + streaks
- [ ] Geen significante issues gevonden

### Strategy Lab (/strategy)
- [x] ROI, win rate, max drawdown, sample size — alles aanwezig
- [ ] Walk-forward data beschikbaar in backend maar niet getoond op hoofdpagina
- [ ] Nested queries optimaliseren voor veel strategies

### Trackrecord (/trackrecord)
- [x] KPIs, rolling accuracy chart, segment tables — compleet
- [ ] Calibration chart was verwijderd ("too technical") — zou optioneel terug moeten

### Rapporten (/reports)
- [x] Simpel en effectief

### Live (/live)
- [x] Excellente implementatie met auto-refresh

## 4. Ongebruikte Backend Endpoints (potentieel waardevol)

| Endpoint | Wat het doet | Waar te gebruiken |
|----------|-------------|-------------------|
| `/trackrecord/calibration` | Confidence buckets met ECE | BOTD page, Trackrecord |
| `/trackrecord/export.csv` | Download alle predictions | Trackrecord (transparantie) |
| `/strategies/{id}/walk-forward` | Walk-forward validation | Strategy detail page |
| `/live/standings/{league}` | Competitie stand | Live page, Dashboard |
| `/odds/match` | Odds per wedstrijd | Predictions, BOTD |
| `/dashboard/metrics` | Dashboard KPIs | Was in oude dashboard, nu ongebruikt |

## 5. Prioriteit Fix Volgorde

### Sprint 1: Kritieke fixes (deze sessie)
1. Win rate bug fixen (Dashboard sidebar)
2. Logo fallback toevoegen (alle match componenten)
3. "Analyseren..." tekst voor wedstrijden zonder prediction

### Sprint 2: BOTD Verbetering (volgende sessie)
1. Backtest statistics sectie toevoegen
2. Confidence breakdown chart
3. Per-league performance tabel
4. ROI simulatie

### Sprint 3: Consistentie & Polish (sessie 3)
1. Alle pagina's visual consistency check
2. Deprecated code opruimen
3. Walk-forward data op strategy pages
4. Calibration chart optioneel terug
5. League standings op live page

### Sprint 4: User Journey (sessie 4)
1. Onboarding flow verbeteren
2. Dashboard als "start here" pagina optimaliseren
3. Cross-links tussen pagina's (van BOTD naar Trackrecord, etc.)
4. Tooltips/uitleg bij technische termen
