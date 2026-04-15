# V10 Progress — Step 3: Nieuwe Feature Voorstellen

Datum: 15 april 2026

Elk voorstel sluit aan op bestaande engine capabilities uit Stap 1. Prioriteit is gebaseerd op impact × (1 / bouwkosten).

---

## Feature #1 — Pick Reasoning ("Waarom deze pick?")

### Wat doet het?
Per prediction toont "Top 3 redenen waarom het model dit voorspelt", bijvoorbeeld:
- "FC Bayern's Elo (1732) overtreft tegenstander met 240 punten"
- "Bayern wint 80% van laatste 5 thuiswedstrijden"
- "Tegenstander heeft 2 goals/game tegen gekregen recent"

### Engine capability
`predictions.features_snapshot` (jsonb) — 39 features per prediction
`predictions.raw_output` (jsonb) — submodel outputs

### Waarde
- **Simpele gebruiker:** HOOG — "zwart doos" wordt wit, vertrouwen stijgt
- **Analist:** HOOG — begrijpt model logica

### Tier
- **Free:** 1 reden zichtbaar
- **Silver+:** Top 3 redenen
- **Gold+:** Alle 39 features met importances
- **Platinum:** Plus raw submodel probabilities (Elo zegt X, Logistic Y, XGBoost Z)

### Bouwwerk
**Middel.** Backend moet `prediction_explanations.top_factors_for` gaan vullen bij predict-time (nu leeg). Frontend moet feature-namen vertalen naar mensentaal.

### Prioriteit
**MUST HAVE.** Dit is wat het grootste verschil maakt tussen "zoveelste prediction site" en "ik begrijp nu waarom".

---

## Feature #2 — Over/Under 2.5 Goals & BTTS markten

### Wat doet het?
Naast 1X2 ook voorspelling voor:
- **Over/Under 2.5 goals** — waarschijnlijk op basis van Poisson lambdas
- **BTTS (Both Teams To Score)** — afgeleid van goal distributions

### Engine capability
`predictions.predicted_home_score` en `predicted_away_score` (Poisson lambda) bestaan al. Daaruit kunnen over/under en BTTS probabilities direct berekend worden:
```
P(Over 2.5) = 1 - P(Home goals + Away goals ≤ 2)
P(BTTS) = (1 - P(Home=0)) × (1 - P(Away=0))
```
`odds_history` heeft al over/under en BTTS odds voor de 843 matches met odds.

### Waarde
- **Simpele gebruiker:** MIDDEL — vergroot relevantie per match
- **Analist:** HOOG — meer markten = meer edge-zoekruimte

### Tier
- **Free:** Niet getoond
- **Silver:** 1X2 alleen
- **Gold+:** Over/Under 2.5 toegevoegd
- **Platinum:** + BTTS + Asian Handicap (toekomst)

### Bouwwerk
**Klein.** Backend formule toevoegen aan forecast_service. Frontend card uitbreiden.

### Prioriteit
**MUST HAVE.** Major selling point voor Gold+ tier.

---

## Feature #3 — Value Bet Indicator

### Wat doet het?
Wanneer er echte bookmaker odds zijn: toon of de markt-probability lager is dan model-probability. Als model zegt 70% maar de markt prijst 55% in, is dit een "value bet".

### Engine capability
`odds_history.home_odds / draw_odds / away_odds` — impliciete markt-probs
`predictions.home_win_prob` etc. — model-probs
Verschil = "edge". Er zijn 843 matches met odds. Voor live Upcoming matches kan odds gekoppeld worden.

### Waarde
- **Simpele gebruiker:** LAAG — concept is moeilijk
- **Analist:** HOOG — precies waarom hij abonneert

### Tier
- **Gold+:** Value bet badge op matches waar edge >5%
- **Platinum:** Expected value % + historische ROI van value bets

### Bouwwerk
**Klein-middel.** Backend endpoint `/predictions/value-bets`. Frontend filter.

### Prioriteit
**NICE TO HAVE.** Goed upgrade-trigger voor Platinum.

---

## Feature #4 — Calibration Chart (Uitgebreid)

### Wat doet het?
Visuele grafiek: wanneer model 70% zegt, hoe vaak klopt het? Perfect calibrated = 45°-lijn.

### Engine capability
`/api/trackrecord/calibration` endpoint bestaat al, met 10-bucket data.
`prediction_evaluations.brier_score` per prediction.

### Waarde
- **Simpele gebruiker:** LAAG — te technisch
- **Analist:** HOOG — bewijst model-kwaliteit

### Tier
- **Silver:** Niet zichtbaar (te complex)
- **Gold+:** Calibration chart + Brier score
- **Platinum:** Plus per-league calibration, per-tier calibration

### Bouwwerk
**Klein.** Endpoint bestaat. Frontend chart component (Chart.js / Recharts).

### Prioriteit
**MUST HAVE** voor analist-vertrouwen.

---

## Feature #5 — Streak & Milestone Notifications

### Wat doet het?
Emotionele triggers:
- "🔥 5 BOTDs op rij goed — beste streak in 3 maanden!"
- "🎯 Je favoriete team (Ajax) heeft morgen een Gold-tier pick"
- "⚠️ Engine heeft 3 losses op rij — normale variantie"
- "🏆 Je hebt 100 picks gevolgd deze maand"

### Engine capability
- `predictions` + `prediction_evaluations` voor streak detection
- `favorites` (te bouwen) voor team-specific alerts
- BOTD history endpoint bestaat

### Waarde
- **Simpele gebruiker:** **ZEER HOOG** — engagement en retentie
- **Analist:** LAAG — kan irritant zijn (user-controlled dus uit)

### Tier
- **Free:** Weekly digest per email
- **Silver+:** Daily BOTD notification
- **Gold+:** Favorite teams alerts
- **Platinum:** Custom threshold alerts ("alert me bij confidence >=75% in PL")

### Bouwwerk
**Middel.** Notification system + settings page. Email/push/in-app.

### Prioriteit
**HIGH** voor engagement. Kan later.

---

## Feature #6 — Engine Transparency Hub

### Wat doet het?
Eén pagina die alles over model-betrouwbaarheid toont:
- Walk-forward resultaten (uit `V8_ENGINE_REPORT.md`)
- Live vs Backtest scheiding
- "Last retrained" datum + aankomende retrain
- Leak detection test resultaten (als stamp)
- Audit log van major model changes

### Engine capability
- `model_versions` tabel
- Walk-forward rapport bestaat lokaal
- `prediction_source` ('live'/'backtest') per pick

### Waarde
- **Simpele gebruiker:** HOOG — vertrouwen, transparantie
- **Analist:** **ZEER HOOG** — dit is de "due diligence" pagina

### Tier
- **Alle tiers** — dit moet gratis/openbaar zijn voor vertrouwen

### Bouwwerk
**Middel.** Vooral front-end. Endpoint die rapport data serveert.

### Prioriteit
**MUST HAVE.** Zonder dit mis je de hele "eerlijke engine" positionering.

---

## Feature #7 — Personal Trackrecord ("Jouw volg-record")

### Wat doet het?
Per user: hoe vaak ze BOTD hebben gevolgd (of niet), en wat ze zouden hebben verdiend (unit-wise). Persoonlijke win streak.

### Engine capability
- Nieuwe tabel `user_pick_tracking` (elk bekeken/gevolgde pick)
- Bestaande prediction/evaluation koppeling

### Waarde
- **Simpele gebruiker:** HOOG — "mijn eigen score"
- **Analist:** MIDDEL — heeft eigen spreadsheet

### Tier
- **Silver+:** Basis tracking
- **Gold+:** Export + vergelijken met platform-gemiddelde
- **Platinum:** API-endpoint om eigen bets te syncen

### Bouwwerk
**Groot.** Nieuw database schema + user-input flow.

### Prioriteit
**NICE TO HAVE.** Sterke retentie feature, maar risico op gokken-promotie. Juridisch checken.

---

## Feature #8 — Data Analyst API Access

### Wat doet het?
Read-only REST API voor Platinum users. Zelfde data als UI maar programmatisch. Rate limit 100 req/uur.

### Engine capability
Endpoints bestaan al. Rate limiting middleware bestaat (`backend/app/core/rate_limit.py`). API keys implementeren.

### Waarde
- **Simpele gebruiker:** 0
- **Analist:** **ZEER HOOG** — killerfeature voor Platinum

### Tier
- **Platinum only** — exclusieve feature

### Bouwwerk
**Middel.** API key management + documentatie pagina.

### Prioriteit
**HIGH** voor Platinum differentiation.

---

## Feature #9 — Match Deep Dive (geüpgradede Match Detail)

### Wat doet het?
Huidige `/matches/[id]` uitbouwen met:
- Elo rating progression beide teams (uit `team_elo_history`)
- H2H historie (laatste 5)
- Recent form detail (goals for/against)
- Match statistics indien beschikbaar (shots, possession uit `match_statistics`)
- Submodel breakdown (Elo zegt X, Logistic Y, XGBoost Z)
- Pre-match odds (uit `odds_history`)

### Engine capability
Alles beschikbaar: `team_elo_history`, `matches`, `match_results`, `match_statistics`, `odds_history`, `predictions.raw_output`.

### Waarde
- **Simpele gebruiker:** MIDDEL
- **Analist:** **ZEER HOOG** — dit is zijn analysis tool

### Tier
- **Free:** Basis kaart met pick + confidence
- **Silver:** Plus form history, Elo diff
- **Gold:** Plus submodel breakdown, odds history
- **Platinum:** Plus match statistics, calibration context

### Bouwwerk
**Middel.** Veel data maar alle endpoints bestaan. Frontend visuals bouwen.

### Prioriteit
**HIGH.** Grootste impact per klik voor analist.

---

## Feature #10 — Weekend Preview

### Wat doet het?
Vrijdag om 18:00 automatisch: "Dit weekend's top 5 picks" als email/pagina. Alle ≥65% confidence + reasoning + odds.

### Engine capability
- Cron via Celery (bestaat)
- Predictions endpoint met filter
- Email service (bestaat)

### Waarde
- **Simpele gebruiker:** **HOOG** — weekend is prime time
- **Analist:** MIDDEL — heeft eigen workflow

### Tier
- **Silver+:** Email met top 3
- **Gold+:** Plus reasoning + ranked list
- **Platinum:** Plus odds + export link

### Bouwwerk
**Middel.** Celery task + email template.

### Prioriteit
**HIGH.** Retentie trigger.

---

## Feature #11 — League Specialist View

### Wat doet het?
Per league eigen dashboard met:
- Model accuracy in deze league (uit `/trackrecord/segments`)
- Alle picks deze week
- Top teams (Elo ranking)
- Standings-gap vs predictions

### Engine capability
- `leagues`, `teams`, `standings_snapshots`, `team_elo_history`, `predictions` — alles bestaat
- `/trackrecord/segments?dim=league` geeft per-league accuracy

### Waarde
- **Simpele gebruiker:** HOOG — ze houden van hun eigen league (Eredivisie, PL)
- **Analist:** MIDDEL

### Tier
- **Free:** Eén league kiezen (als favoriet)
- **Silver:** 3 leagues
- **Gold+:** Alle 30 leagues

### Bouwwerk
**Middel.** Nieuwe pagina template met data die grotendeels bestaat.

### Prioriteit
**MEDIUM.** Nice to have.

---

## Feature #12 — Custom Alert Builder

### Wat doet het?
Power user maakt eigen alert:
"Alerteer me als een Premier League wedstrijd ≥70% confidence heeft EN echte odds ≥1.85 beschikbaar zijn."

### Engine capability
Alle filter-logica bestaat al. Notification system nodig.

### Waarde
- **Simpele gebruiker:** LAAG — te complex
- **Analist:** **ZEER HOOG** — exact wat hij wil

### Tier
- **Platinum only**

### Bouwwerk
**Groot.** UI builder + criteria engine + scheduler.

### Prioriteit
**NICE TO HAVE — Experimenteel.** Test eerst met Feature #5.

---

## Feature #13 — Educational Content Library

### Wat doet het?
Korte artikelen over:
- "Hoe leest een confidence score?"
- "Wat is walk-forward validation?"
- "Waarom 48% overall accuracy goed is"
- "Verantwoord gokken met AI voorspellingen"

### Engine capability
Bestaande `/articles`, `/learn`, `/bet-types` pagina's in frontend.

### Waarde
- **Simpele gebruiker:** **HOOG** — wegwijs maken
- **Analist:** LAAG

### Tier
- **Alle tiers** — gratis educatief

### Bouwwerk
**Klein.** CMS pages bestaan (Sanity integration).

### Prioriteit
**MUST HAVE.** SEO + trust + onboarding.

---

## Samenvatting per prioriteit

### MUST HAVE (bouw eerst)
1. **#1 Pick Reasoning** — trust & begrip
2. **#2 Over/Under & BTTS** — nieuwe markten
3. **#4 Calibration Chart** — analist trust
4. **#6 Engine Transparency Hub** — model bewijs
5. **#13 Educational Content** — onboarding

### HIGH (bouw daarna)
6. **#5 Streak & Milestone Notifications** — engagement
7. **#8 API Access** — Platinum differentiation
8. **#9 Match Deep Dive** — analist analyse
9. **#10 Weekend Preview** — retentie

### NICE TO HAVE (later)
10. **#3 Value Bet Indicator** — Gold+ feature
11. **#11 League Specialist View** — personalisatie
12. **#7 Personal Trackrecord** — juridisch check
13. **#12 Custom Alert Builder** — Platinum experiment

---

## Tier mapping van alle nieuwe features

| Feature | Free | Silver | Gold | Platinum |
|---------|:----:|:------:|:----:|:--------:|
| #1 Pick Reasoning | 1 reden | Top 3 | 39 features | + submodels |
| #2 Over/Under & BTTS | — | 1X2 only | +Over/Under | +BTTS |
| #3 Value Bet | — | — | Badge | +EV% |
| #4 Calibration | — | — | Chart | +per-league |
| #5 Notifications | Weekly | Daily | +favorites | +custom |
| #6 Transparency Hub | ✅ full | ✅ full | ✅ full | ✅ full |
| #7 Personal TR | — | basis | +export | +API sync |
| #8 API Access | — | — | — | ✅ |
| #9 Match Deep Dive | basis | +form | +submodels | +stats |
| #10 Weekend Preview | — | Top 3 | +reasoning | +odds |
| #11 League View | 1 league | 3 leagues | alle 30 | alle 30 |
| #12 Alert Builder | — | — | — | ✅ |
| #13 Education | ✅ | ✅ | ✅ | ✅ |

---

## Dekking check: engine capabilities → features

| Engine capability | Gedekt door |
|-------------------|-------------|
| Confidence score | BOTD, Predictions, Match (bestaand) |
| 1X2 probabilities | Predictions, Match (bestaand) |
| Poisson goal forecasts | #2 Over/Under & BTTS (nieuw) |
| Features snapshot | #1 Reasoning, #9 Match Deep Dive (nieuw) |
| Raw submodel outputs | #9 Match Deep Dive (Platinum) |
| Elo history | #9 Match Deep Dive, #11 League View |
| Match statistics | #9 Match Deep Dive (Platinum) |
| Standings | #11 League View |
| Odds history | #3 Value Bet, #9 Match Deep Dive |
| Walk-forward report | #6 Transparency Hub |
| Calibration | #4 Calibration Chart |
| Prediction source (live/backtest) | #6 Transparency Hub |
| Track record | Trackrecord page (bestaand) + #7 Personal |

**Alle beschikbare engine capabilities zijn ergens gedekt.** Geen capability onbenut in voorstel.
