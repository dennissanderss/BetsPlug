# V10 Progress — Step 2: Huidige Features Audit

Datum: 15 april 2026

---

## Huidige navigatiestructuur

### Sidebar (van frontend/src/app/(app)/_components/sidebar)
```
Overview
├── How It Works (/jouw-route)         [START badge]
└── Dashboard (/dashboard)

Predictions
├── Pick of the Day (/bet-of-the-day)  [Daily pick]
└── All Predictions (/predictions)

Results
├── Results & Analysis (/results)
├── Track Record (/trackrecord)
└── Reports (/reports)

System
└── Admin (/admin)                     [Restricted]
```

### Pagina's niet in sidebar (wel bereikbaar)
Strategy Lab, Strategy Detail, Favorites, Live, Match Detail, Team Detail, About, Settings, Subscription, My Account, Search, Deals, Weekly Report.

---

## 2A — Per-feature audit

### 1. Dashboard (`/dashboard`)
**Wat doet het?** Hub-pagina. Hero card met BOTD, live matches strip, today's matches, yesterday's results met weekly summary sidebar.
**Engine data:** `getBetOfTheDay()`, `getFixturesLive()` (60s refetch), `getFixturesToday()`, `getFixtureResults(1)`, `getWeeklySummary(7)`.
**Waarde simpele gebruiker:** **HOOG** — eerste pagina na login, geeft snel overzicht.
**Waarde analist:** LAAG — te oppervlakkig.
**Waarde score:** 7/10
**Aanbeveling:** 🔄 **Behouden maar aanpassen**. Meer personalisatie (favoriete leagues/teams). Confidence tier badge op BOTD card.

### 2. Bet of the Day (`/bet-of-the-day`) — Silver+ paywall
**Wat doet het?** Toont één BOTD pick vandaag + track record card (accuracy %, totaal picks).
**Engine data:** `getBetOfTheDay()`, `/bet-of-the-day/track-record`, confidence, probabilities.
**Waarde simpele gebruiker:** **HOOG** — vlaggeschip-feature, duidelijk nut.
**Waarde analist:** MIDDEL — mist diepe uitleg/features/reasoning.
**Waarde score:** 9/10
**Aanbeveling:** ✅ **Behouden**. De killerfeature. Uitbreiden met "waarom deze pick?" (top 3 redenen uit features_snapshot).

### 3. All Predictions (`/predictions`) — Silver+ paywall
**Wat doet het?** Filterbare lijst van alle predictions met confidence badges (High/Medium/Low), league filters, sorting.
**Engine data:** Alle predictions via `/api/fixtures`.
**Waarde simpele gebruiker:** **MIDDEL** — overweldigend zonder filter.
**Waarde analist:** **HOOG** — dit is zijn werkplek.
**Waarde score:** 8/10
**Aanbeveling:** 🔄 **Behouden + herstructureren**. Confidence tier filter zichtbaar maken (Silver/Gold/Platinum toggle). Default filter = "show only ≥60%". Meer filters voor analist (market, confidence range, date range).

### 4. Results & Analysis (`/results`) — Silver+ paywall
**Wat doet het?** Historische results met weekly summary, streaks, P/L met real odds fallback.
**Engine data:** `getFixtureResults(period)`, `getWeeklySummary(period)`.
**Waarde simpele gebruiker:** **HOOG** — bewijs dat het werkt.
**Waarde analist:** MIDDEL — wil meer filters en drill-down.
**Waarde score:** 8/10
**Aanbeveling:** ✅ **Behouden**. P/L niet meer tonen zonder echte odds (96.8% van picks hebben geen odds). Streaks zijn emotioneel sterk — behouden.

### 5. Track Record (`/trackrecord`)
**Wat doet het?** Accuracy over tijd, segment performance (league/sport/confidence), rolling 30-day chart, CSV export.
**Engine data:** `/trackrecord/summary`, `/segments`, `/calibration`, `/export.csv`.
**Waarde simpele gebruiker:** LAAG — jargon, te veel getallen.
**Waarde analist:** **HOOG** — dit is waar hij vertrouwen opbouwt.
**Waarde score:** 7/10
**Aanbeveling:** 🔄 **Behouden + uitbreiden**. Simpele gebruiker: één grote headline (95% accuracy op premium picks, 2.473 picks). Analist: confidence calibration plot, per-league performance tabel, Brier score.

### 6. Reports (`/reports`) — Gold+ paywall
**Wat doet het?** Lijst van gegenereerde PDF/Excel rapporten + formulier voor nieuwe.
**Engine data:** `getGeneratedReports()`, `generateReport()`. 13 rapporten in productie.
**Waarde simpele gebruiker:** LAAG — wie wil PDFs?
**Waarde analist:** MIDDEL — offline analyse.
**Waarde score:** 4/10
**Aanbeveling:** 🔀 **Samenvoegen met Track Record**. Maak het een "Export" sub-sectie. PDF genereren is overkill — CSV/JSON is voldoende. Optioneel behouden voor B2B.

### 7. Weekly Report (`/weekly-report`)
**Wat doet het?** Redirect naar `/results`.
**Waarde:** 0 — dode route.
**Aanbeveling:** ❌ **Schrappen**. Link direct naar `/results?period=7`.

### 8. Strategy Lab (`/strategy`) — Silver+ paywall
**Wat doet het?** Gallery van 14 strategieën met backtest readiness meter.
**Engine data:** `/strategies/*`, walk-forward validatie. **ALLE 14 strategieën zijn `is_active=false`**.
**Waarde simpele gebruiker:** LAAG — concept is verwarrend naast "confidence tiers".
**Waarde analist:** **HOOG** — power user feature.
**Waarde score:** 5/10 (hoog potentieel, slecht uitgevoerd)
**Aanbeveling:** 🔄 **Behouden MAAR grondig herontwerpen**. Keuze:
- **Optie A**: Samenvoegen met confidence tiers (tier = vooraf gedefinieerde "strategie")
- **Optie B**: "Custom strategies" als separate Platinum-only feature voor analist (overlap met tiers duidelijk maken)

**Vraag aan eigenaar:** Wat is conceptueel verschil tussen "Strategy" en "Confidence Tier"?

### 9. Strategy Detail (`/strategy/[id]`) — Silver+ paywall
**Wat doet het?** Deep dive per strategie: backtest metrics, walk-forward, today's picks, chart.
**Engine data:** `/strategies/{id}/*`.
**Waarde:** Hangt af van Strategy Lab beslissing.
**Aanbeveling:** Volgt Strategy Lab.

### 10. Favorites (`/favorites`)
**Wat doet het?** LocalStorage favorites, nog niet backend-gekoppeld. Empty state.
**Engine data:** Geen.
**Waarde simpele gebruiker:** MIDDEL — personalisatie.
**Waarde analist:** LAAG.
**Waarde score:** 3/10 (niet af)
**Aanbeveling:** 🔄 **Uitbouwen**. Backend-koppeling + notifications: "Je favoriete Ajax heeft morgen een Gold-tier pick!".

### 11. Live (`/live`)
**Wat doet het?** Live matches met score + pick + confidence badge.
**Engine data:** `getFixtures()` filtered by live.
**Waarde simpele gebruiker:** **HOOG** — spannend om te volgen.
**Waarde analist:** LAAG — geen real-time calibration tracking.
**Waarde score:** 7/10
**Aanbeveling:** ✅ **Behouden**. Kan naar Dashboard als widget.

### 12. Match Detail (`/matches/[id]`)
**Wat doet het?** Match analysis card: teams, tijd, probability bars, team form history.
**Engine data:** `getMatch()`, `getMatchAnalysis()`, `getTeamForm()`.
**Waarde simpele gebruiker:** MIDDEL.
**Waarde analist:** **HOOG** — drill-down.
**Waarde score:** 7/10
**Aanbeveling:** 🔄 **Behouden + uitbouwen**. Toon Elo-ratings van beide teams, H2H history, "top 3 redenen" uit features_snapshot.

### 13. Team Detail (`/teams/[id]`)
**Wat doet het?** Team stats, recent form, matches tabel.
**Engine data:** `getTeam()`, `getTeamStats()`.
**Waarde simpele gebruiker:** MIDDEL.
**Waarde analist:** MIDDEL.
**Waarde score:** 6/10
**Aanbeveling:** ✅ **Behouden**. Voeg Elo-history grafiek toe.

### 14. About (`/about`)
**Wat doet het?** Model-uitleg, transparency, trust pillars.
**Engine data:** `getModelOverview()` optioneel.
**Waarde simpele gebruiker:** **HOOG** — vertrouwen opbouwen.
**Waarde analist:** MIDDEL.
**Waarde score:** 8/10
**Aanbeveling:** 🔄 **Behouden + updaten naar v8**. Walk-forward resultaten tonen (74% op 2.473 premium picks).

### 15. How It Works (`/jouw-route`)
**Wat doet het?** Onboarding flow: 3-stappen uitleg, CTA naar predictions/strategy.
**Waarde simpele gebruiker:** **HOOG** — onboarding.
**Waarde analist:** LAAG — slaat over.
**Waarde score:** 7/10
**Aanbeveling:** ✅ **Behouden**. URL fixen: `/how-it-works` is duidelijker dan `/jouw-route`.

### 16. Settings (`/settings`)
**Wat doet het?** League/sport filters, timezone, notification toggles. Alleen local (geen backend calls).
**Waarde:** Infrastructureel.
**Aanbeveling:** 🔀 **Samenvoegen met My Account**. Eén "Account" pagina met tabs.

### 17. Subscription (`/subscription`)
**Wat doet het?** Tier display met renewal/card/cancel.
**Waarde:** **HOOG** voor conversie.
**Engine data:** `/subscriptions/me`.
**Waarde score:** 8/10
**Aanbeveling:** ✅ **Behouden**. Kan prominenter.

### 18. My Account (`/myaccount`)
**Wat doet het?** Profile, language, odds format, security.
**Aanbeveling:** 🔀 **Samenvoegen met Settings** (zie #16).

### 19. Search (`/search`)
**Wat doet het?** Global search voor sports/leagues/teams/matches.
**Waarde simpele gebruiker:** LAAG — weinig content om te zoeken.
**Waarde analist:** MIDDEL — navigatie.
**Waarde score:** 5/10
**Aanbeveling:** 🔄 **Behouden maar de-prominent**. Alleen als top-bar icon, geen sidebar entry.

### 20. Deals (`/deals`)
**Wat doet het?** Affiliate/referral page met pricing tier cards.
**Waarde:** LAAG — alleen als user wil sharen.
**Aanbeveling:** 🔄 **Behouden als footer-link**. Niet in sidebar.

### 21. Admin (`/admin`)
**Wat doet het?** Admin dashboard met data health, users, SEO, finance tabs.
**Waarde:** Alleen voor admin.
**Aanbeveling:** ✅ **Behouden** (admin-only).

---

## 2B — Samenvattende tabel

| Feature | Engine data | Waarde simpel | Waarde analist | Aanbeveling |
|---------|-------------|:-------------:|:--------------:|:------------|
| Dashboard | BOTD, live, today, results | **HOOG** | LAAG | 🔄 Personaliseren |
| Bet of the Day | confidence, tracking | **HOOG** | MIDDEL | ✅ Behouden + reasoning |
| All Predictions | alle probs, confidence | MIDDEL | **HOOG** | 🔄 Tier-filter |
| Results & Analysis | accuracy, streaks, P/L | **HOOG** | MIDDEL | ✅ Behouden |
| Track Record | accuracy, segments, calib | LAAG | **HOOG** | 🔄 2-modus uitbreiden |
| Reports | aggregate metrics | LAAG | MIDDEL | 🔀 Samenvoegen trackrecord |
| Weekly Report | redirect | - | - | ❌ Schrappen |
| Strategy Lab | strategy perf | LAAG | **HOOG** | 🔄 Heroverwegen |
| Strategy Detail | walk-forward, picks | LAAG | **HOOG** | 🔄 Volgt Lab |
| Favorites | geen | MIDDEL | LAAG | 🔄 Uitbouwen |
| Live | confidence, scores | **HOOG** | LAAG | ✅ Behouden |
| Match Detail | probs, form, odds | MIDDEL | **HOOG** | 🔄 Reasoning toevoegen |
| Team Detail | stats, form | MIDDEL | MIDDEL | ✅ Behouden |
| About | model info | **HOOG** | MIDDEL | 🔄 v8 updaten |
| How It Works | - | **HOOG** | LAAG | ✅ Behouden (URL fixen) |
| Settings | - | - | - | 🔀 Samenvoegen |
| Subscription | tier | **HOOG** | **HOOG** | ✅ Behouden |
| My Account | user | LAAG | LAAG | 🔀 Samenvoegen settings |
| Search | search | LAAG | MIDDEL | 🔄 De-prominent |
| Deals | - | LAAG | LAAG | 🔄 Footer-link |
| Admin | admin | - | - | ✅ Behouden |

---

## Samenvatting

### Tellingen
- ✅ **Behouden zoals het is**: 7 (BOTD, Results, Live, Team, Sub, How It Works, Admin)
- 🔄 **Behouden maar aanpassen**: 9 (Dashboard, Predictions, TrackRecord, Strategy, StrategyDetail, Favorites, Match, About, Search, Deals)
- 🔀 **Samenvoegen**: 3 (Reports→TrackRecord, Settings+MyAccount)
- ❌ **Schrappen**: 1 (Weekly Report redirect)

### Kritische observaties

1. **Strategies vs Tiers is verwarrend.** 14 strategieën bestaan, alle inactief. Confidence tiers doen deels hetzelfde. Dit moet opgelost.

2. **Reasoning is geïmplementeerd maar leeg.** `prediction_explanations.top_factors_for: {}` — alle 26k rijen leeg. De UI kan geen "waarom deze pick?" tonen. Engine-fix nodig.

3. **Match Detail mist diepte.** De engine heeft per-match: Elo-ratings, 39 features, submodel outputs. Geen daarvan zichtbaar.

4. **Twee user experiences ontbreken.** Geen modus-toggle; huidige UI is gemiddelde tussen simpel en analyst — beiden suboptimaal.

5. **Confidence tier filtering niet zichtbaar.** Silver/Gold/Platinum constanten staan in code maar niet gebruikt in endpoints of UI. Er zijn ook geen picks ≥65% in productie (zie stap 1).

6. **Backend heeft rijke data die niet gebruikt wordt:**
   - `features_snapshot` (jsonb) per prediction
   - `raw_output` (jsonb) met submodel breakdown
   - `team_elo_history` met 12,418 Elo snapshots
   - `match_statistics` met shots/possession
   - `standings_snapshots`

7. **Missing features vanuit engine:**
   - Over/Under 2.5 (Poisson data is er)
   - BTTS (Poisson data is er)
   - Elo-rating chart per team
   - Per-match "waarom" uitleg
   - Notifications op favoriete teams
   - Value bets (echte odds vs model prob)

### Vragen aan eigenaar
1. Strategies vs Confidence Tiers — één concept houden of beide?
2. Reports feature blijft (B2B)? Of wegsnijden?
3. Backtest "run" endpoint (`/backtests/run`) wordt gebruikt? Zit lege tabel.
4. Search feature: hoeveel gebruikers zoeken? (Analytics nodig)
