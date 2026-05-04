# BetsPlug — Probleem-rapportage voor externe Claude-discussie

*Datum: 2026-05-04*
*Auteur: Dennis (eindgebruiker / mede-oprichter BetsPlug)*

---

## 1. Wat is BetsPlug

Een SaaS sports-forecasting platform (B2C, abonnementsmodel). Het product:

- Haalt elke dag voetbalwedstrijden op uit externe APIs (football-data.org, API-Football)
- Engineerd point-in-time features: Elo-ratings, recente vorm, head-to-head, standings
- Draait een ensemble van probabilistische modellen (Elo / Poisson / Logistic / XGBoost) op die features om winkansen te schatten voor elke wedstrijd
- Classificeert elke voorspelling in een tier op basis van model-confidence:
  - **Free Access**: 45-59% confidence
  - **Silver**: 60-69%
  - **Gold**: 70-84%
  - **Platinum**: 85%+
- Toont voorspellingen in een dashboard achter een Stripe-paywall
- Drie tier-prijspunten + cumulatieve toegang (Silver-abonnee ziet ook Free picks, Platinum ziet alles)

Alle output is gelabeld als "educational simulation". Geen wedadvies in juridische zin — maar gebruikers betalen wel om de picks te zien dus de cijfers moeten betekenisvol zijn.

Stack:
- Backend: FastAPI + Postgres + Redis + Celery (Railway)
- Frontend: Next.js 14 dashboard (Vercel)
- Marketing site: Astro (Vercel)

---

## 2. De huidige meet-situatie

Het model heeft op de afgelopen ~12 maanden 1741 voorspellingen gedaan. De track-record-accuracy per tier (puur "hoe vaak had het model gelijk", geen geld):

| Tier | Picks | Accuracy |
|---|---|---|
| Platinum (85%+ conf) | 298 | 85.2% |
| Gold (70-84%) | 633 | 75.8% |
| Silver (60-69%) | 900 | 69.6% |
| Free (45-59%) | ~laag |

Deze accuracy-cijfers zien er goed uit en zijn intern gevalideerd door een eigen audit (geen feature-leakage gevonden in v8.1 pipeline na deploy 2026-04-16).

**Het meet-probleem zit bij ROI/financiële simulatie**, niet bij accuracy.

---

## 3. Het kern-meet-probleem (technisch)

We willen de simulatie tonen: *"als je voor €25 had ingezet op elke Silver pick, wat zou je hebben overgehouden?"*

Per pick willen we de werkelijke pre-match 1X2 odds gebruiken (home/draw/away decimal odds) om payout te berekenen. Probleem: **wij hebben pas sinds 16 april 2026 (3 weken geleden) echte boekmaker-odds opgeslagen**. Voor de andere 11 maanden van data ontbreken odds.

De huidige fallback wanneer odds ontbreken:

```python
fair_odds = 1 / model_predicted_probability
# Voorbeeld: model zegt 65% kans → fair_odds = 1.538
```

Wiskundig probleem: bij model-fair odds × accurate model = 0 expected value per definitie:

```
EV_per_pick = p × (1/p − 1) − (1−p) × 1
            = 1 − p − 1 + p
            = 0
```

Plus 5% gesimuleerde bookmaker-margin → eindigt licht negatief. **Elk model**, ook een perfect model, zou onder deze fallback ~0% ROI tonen op 365d backtest.

Resultaat in productie:
- 1741 picks over 365 dagen (waarvan 1494 = 86% met 1/prob fallback, slechts 247 met echte odds)
- Win rate: 65%
- Gemiddelde odds: 1.60
- Net result: **−0.2% ROI / −€107 op €43.525 staked**

Dat cijfer is **niet** een verdict op het model. Het is een artefact van de odds-reconstructie. Maar voor een gebruiker die naar het scherm kijkt is het onleesbaar als zodanig — die ziet "verliesgevend systeem".

---

## 4. Het business-probleem

Mijn co-founder en ik hebben een product om te verkopen, met:

- **Goede accuracy-cijfers** (85% Platinum, 76% Gold) — die zijn defensibel en marketing-waardig
- **Geen werkbare ROI-cijfers** op de backtest, en die hebben gebruikers wel nodig om vertrouwen op te bouwen
- **Live measurement is nog te jong** (3 weken, ~244 picks) om statistisch betekenisvol te zijn

Drie wegen die ik tot nu toe heb overwogen:

### Optie A: Verberg ROI volledig tot Live measurement matuur is
- Betekent 60-90 dagen wachten voor we überhaupt iets kunnen claimen
- Risico: na 90 dagen blijkt de ROI negatief te zijn → 90 dagen marketing-tijd weggegooid
- Niet duurzaam: een betalend product dat alleen "accuracy" toont en geen ROI-context is moeilijk te verdedigen vs. concurrenten die wel ROI claimen

### Optie B: Koop historische odds-data
- Diensten zoals OddsAPI.io, Sportmonks, Betfair Historical Data leveren 1-2 jaar 1X2 historie voor €50-300/maand
- Met 80%+ coverage op de bestaande 1741 picks kunnen we **deze week** een echte backtest draaien
- Drie mogelijke uitkomsten:
  1. ROI komt positief uit (+5% tot +15%) → product is verkoopbaar, begin marketing
  2. Marginaal (0 tot +5%) → strategie-laag toevoegen, alleen "edge picks" tonen waar model > markt
  3. Negatief → snel weten, pivot naar accuracy-tracking platform i.p.v. ROI-product
- Kost een dag om een import-pijp te bouwen, daarna binnen 1-2 weken duidelijkheid

### Optie C: Reposition als pure accuracy/transparency platform
- "We laten elke pick zien, geen cherry-picking, oordeel zelf"
- Lead met accuracy: 85% Platinum, 76% Gold, 70% Silver
- Geen ROI-claims, geen "what would you have made"
- Lager prijspunt, wellicht andere abonnementsstructuur
- Risico: de meeste concurrenten in deze ruimte verkopen wel op ROI/winst-claims, dus een puur transparency-aanbod is een lastiger pitch

---

## 5. Specifieke vragen waarop ik feedback wil

1. **Is Optie B (historische odds kopen) inderdaad de hoogst-leverage move?** Ik kan zo de echte ROI berekenen op 1741 picks i.p.v. blind 90 dagen wachten op live data die misschien net zo goed/slecht zal zijn. Wat zijn de blinde vlekken hierbij — closing-line bias, market-move-effecten, line-shopping issues?

2. **Welke historische odds-provider voor voetbal Europa top-leagues?** Moet betrouwbaar zijn, decimal 1X2 markets, idealiter pre-match closing line. Heb je ervaring met OddsAPI.io vs Sportmonks vs Betfair Historical?

3. **Als de echte backtest negatief uitvalt**, welke richting voor pivot? Het model is wél accurate (geen leakage gevonden, 85% Platinum is echt) — maar accuracy zonder edge-vs-market is niet hetzelfde als profit. De *positive expected value* zit in picks waar model-prob > markt-implied prob. Voor die filter heb je odds nodig. Is een edge-filter strategie haalbaar?

4. **De Platinum-tier paradox**: hogere tier = strenger geselecteerd = hogere accuracy MAAR ook lagere odds (heavy favorites). Bij avg odds 1.45 en break-even 69% met 85% accuracy zou ik +EV moeten hebben. Waarom toont onze data dat niet? Is dit een artefact van model-fair odds, of zit er iets fundamenteels mis dat ik mis?

5. **Marketing-positionering tijdens deze onzekerheid**: kan ik defensibel "85% Platinum accuracy on 298 tracked predictions" als hero-metric gebruiken zonder ROI-claims, of is dat in deze markt onvoldoende differentiatie?

6. **Technische schuld vs nieuwe features**: ik heb de afgelopen 2 dagen ~10 audit-fixes doorgevoerd op de meting (None-guards, tier-filter directies, validation_status gates, walk-forward thresholds). De meting is nu wiskundig kloppend maar het verhaal blijft "ROI is near zero by construction". Heb ik nog steeds technische schuld of is het echt een data-acquisitie probleem?

---

## 6. Wat ik concreet zoek

Een eerlijke read of:
- Optie B (odds kopen) gewoon de move is, en welke provider
- Of er een derde weg is die ik over het hoofd zie
- Of het accuracy-only verhaal (Optie C) verkoopbaar genoeg is om ondertussen de marketing-engine warm te houden tot odds-data of live measurement uitkomst geeft

Tijdsframe: ik wil binnen 2 weken een richting kiezen om geen weken meer te verliezen aan onbeantwoordbare vraagstukken.

---

## Bijlage — relevante codebase paden

- `frontend/src/app/(app)/results/page.tsx` — simulator UI (nu admin-only Live mode)
- `frontend/src/app/(app)/trackrecord/page.tsx` — accuracy-display
- `backend/app/services/roi_calculator.py` — `realised_pnl_1x2` + `compute_strategy_metrics_with_real_odds`
- `backend/app/core/prediction_filters.py` — `trackrecord_filter` met v8.1 cutoff
- `backend/app/api/routes/strategies.py` — strategy metrics + walk-forward
- `backend/API_CONTRACT.md` — plausibility gate spec (validation_status enum)
- `backend/app/models/odds.py` — OddsHistory model (pas 3 weken oud)
