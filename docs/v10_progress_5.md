# V10 Progress — Step 5: 3 Product Structuur Voorstellen

Datum: 15 april 2026

---

## Voorstel A: Mode Toggle (Simpel ↔ Pro)

### Concept
Eén URL-structuur. Prominente toggle in de header: **Simpel / Pro**. Gebruikersvoorkeur wordt onthouden per account. Sommige pagina's hebben alleen relevant in één mode (zoals de "Transparency Hub" in Pro).

### Sidebar (beide modes dezelfde items)
```
Overview
├── Home (/dashboard)                  Was: "Dashboard"
└── Hoe het werkt (/how-it-works)      Was: "/jouw-route"

Picks
├── Tip van de Dag (/bet-of-the-day)
└── Alle Picks (/predictions)          Was: "Predictions"

Analyse
├── Resultaten (/results)
├── Track Record (/trackrecord)        + Transparency hub merged
└── Jouw Leagues (/leagues)            NIEUW — Feature #11

Instellingen
├── Abonnement (/subscription)
├── Account (/account)                 Merged: settings + myaccount
└── Verwijzen (/deals)                 Minder prominent

System
└── Admin (/admin)                     Admin-only
```

### Hoofdpagina's

#### Pagina 1: Home (`/dashboard`)

**Doel:** Eén pagina, snel overzicht, CTA naar deeper features.

**In Simpel mode:**
- Hero card: "Vandaag's Tip" (BOTD card groot)
  - Match + pick + confidence als sterrenregel ("4/5 stars")
  - Eén simpele reden ("Bayern wint 80% thuis tegen zwakkere teams")
  - CTA: "Zie waarom →"
- Live matches carousel
- Gisteren: ✅ 4/5 correct (subtiele streak badge als op 3+)
- Vrijdag-avond teaser: "Weekend preview donderdag" (Feature #10)
- Onderaan: 3 educatie-tiles (#13)

**In Pro mode:**
- Hero: Tabel van alle ≥65% picks vandaag, sorteerbaar
- Confidence distribution histogram (vandaag's picks)
- Per-league quick view (sparklines)
- Recent calibration alert: "Model was 3pp overconfident laatste 7 dagen"
- Live matches + recent odds movement

#### Pagina 2: Tip van de Dag (`/bet-of-the-day`)

**In Simpel mode:**
- Groot: match + pick + confidence als visueel element
- "Waarom deze pick?" — Feature #1, 3 redenen met icoontjes
- Historische accuracy: "Onze BOTDs raakten 77/100 deze maand"
- Verwante picks: "Ook sterk vandaag →" (link naar Alle Picks)

**In Pro mode:**
- Zelfde header, maar uitgebreider:
- 39 features tabel met importance scores
- Submodel breakdown: Elo 62% H, Logistic 71% H, XGBoost 69% H → Ensemble 72%
- Over/Under 2.5 + BTTS forecast (#2)
- Value bet indicator als odds beschikbaar (#3)
- Calibration context: "model is 94% gekalibreerd op 70%-bucket"

#### Pagina 3: Alle Picks (`/predictions`)

**In Simpel mode:**
- Tabs per tier: "Basis (40+)", "Silver (20+)", "Gold (5-10)", "Platinum (1-3)"
- Icons geen jargon ("🎯" voor Platinum ipv "≥75% confidence")
- Elke row: match + pick + sterren

**In Pro mode:**
- Full table met kolommen: Match, Time, Pick, Confidence, Edge, Odds, Submodels, Features
- Filters: league, date range, confidence slider, edge ≥ X%, markets (1X2, O/U, BTTS)
- Sort op alle kolommen
- Export CSV/JSON
- Save view (bookmark filter set)

#### Pagina 4: Resultaten (`/results`)

**In Simpel mode:**
- Week overview: 🟢🟢🔴🟢🟢 (vrijdag-donderdag)
- Stats: "78% correct deze week", "Streak: 5"
- Leaderboard: "Top picks deze week" met ✅/❌

**In Pro mode:**
- Filters: tier, league, market, date range
- Per-pick table: match, pick, confidence, outcome, correct, brier, odds, P/L (if odds)
- Drill-down per pick → Match Deep Dive
- Export CSV

#### Pagina 5: Track Record (`/trackrecord`)

**In Simpel mode:**
- Big number: "Premium picks zijn 78% correct (2,473 picks)"
- Simpel staafdiagram: per tier
- "Hoe weten we dit zeker? →" link naar Transparency Hub

**In Pro mode:**
- Multi-panel dashboard:
  - Overall table (alle tiers, metrics)
  - Calibration chart #4
  - Per-league heatmap
  - Rolling accuracy chart (30/60/90 days)
  - Brier score trend
  - Walk-forward validation summary #6
- Download full report CSV

#### Pagina 6: Jouw Leagues (`/leagues`)

**In Simpel mode:**
- Mijn favoriete league: picks, accuracy deze maand
- "Voeg meer leagues toe" (Silver+)

**In Pro mode:**
- Alle 30 leagues grid
- Per-league: accuracy, sample size, recent form
- Compare view: 3 leagues side-by-side
- Drill-down naar league page

### Tier mapping

| Feature | Free | Silver | Gold | Platinum |
|---------|:----:|:------:|:----:|:--------:|
| BOTD (Simpel) | ✅ | ✅ | ✅ | ✅ |
| BOTD reasoning (1 reden) | ✅ | — | — | — |
| BOTD reasoning (Top 3) | — | ✅ | — | — |
| BOTD reasoning (39 features) | — | — | ✅ | — |
| BOTD + submodels + calibration | — | — | — | ✅ |
| Alle Picks | ≥65% only | ≥55% | Alle | Alle |
| Over/Under & BTTS | — | — | ✅ | ✅ |
| Value Bet indicator | — | — | ✅ | ✅ |
| Calibration chart | — | — | ✅ | ✅ |
| Pro mode toggle | — | ✅ | ✅ | ✅ |
| Transparency Hub | ✅ | ✅ | ✅ | ✅ |
| Jouw Leagues | 1 league | 3 leagues | alle 30 | alle 30 |
| Custom Alerts | — | — | — | ✅ |
| API Access | — | — | — | ✅ |
| Export CSV | — | basis | volledig | volledig |

### Emotionele upgrade triggers

**Free → Silver (€9.95/mo):**
- Lock-screen op BOTD reasoning: "De Top 3 redenen zijn Silver-exclusive. **Start gratis 7-dagen trial**"
- Predictions lijst toont "17 meer picks beschikbaar bij Silver" onderaan
- Resultaten toont alleen "top 5" — "Bekijk alle 30 deze week met Silver"

**Silver → Gold (€19.95/mo):**
- Over/Under + BTTS markets "Ontgrendel met Gold"
- Calibration chart als blurred preview: "Zie exact hoe betrouwbaar ons model is"
- **Emotionele hook:** "Gold-users raakten afgelopen maand 71% van hun picks"

**Gold → Platinum (€39.95/mo):**
- "Submodel breakdown" op Match Deep Dive blurred
- "Custom Alerts" met demo: "Alert me bij PL ≥70% conf EN echte odds ≥1.85"
- API access lock: "Voor power users: programmeer je eigen bots"
- **Emotionele hook:** "Platinum = exclusieve data-analist tools"

### Voordelen van Voorstel A
1. **Simpelste conceptueel:** toggle werkt zoals email clients, slaat goed aan
2. **Geen content duplicatie:** één set pagina's, verschillende views
3. **Mark blijft in Simpel:** nooit per ongeluk in pro mode
4. **Laura blijft in Pro:** instelling is kleverig
5. **URL's blijven clean** — geen `/simpel/X` en `/pro/X`

### Nadelen van Voorstel A
1. **Toggle-moeheid:** als user vergeet te togglen, kan verkeerde view zien
2. **A/B testing moeilijker:** beide modes zitten in één codebase
3. **Performance:** moet beide modes bundled shippen
4. **Ambigue voor nieuwe user:** "In welke modus moet ik zijn?"

### Geschatte bouwwerk
**~60-80 uur Claude Code.** Componenten hebben een `mode` prop, render logica takt af. Toggle-state in user settings. Database migratie voor `user.preferred_mode`.

---

## Voorstel B: Aparte Routes (`/simpel`, `/pro`)

### Concept
Twee helemaal gescheiden URL-ruimtes met eigen navigatie. User kiest bij registratie of toggle. Elke route heeft zijn eigen layout en sidebar. Shared backend.

### URL-structuur
```
/dashboard                        → redirect op basis van user.mode

Simpel mode (default):
/simpel/home
/simpel/tip-van-de-dag
/simpel/picks
/simpel/resultaten
/simpel/leagues
/simpel/account

Pro mode (Silver+):
/pro/dashboard
/pro/picks                        (filterable table)
/pro/match/[id]                   (Match Deep Dive)
/pro/trackrecord                  (volledig)
/pro/transparency                 (Engine Hub)
/pro/api                          (API docs)
/pro/strategies                   (Strategy Lab, heropgezet)
/pro/account
```

### Sidebar

**Simpel sidebar:**
```
🏠 Home
🎯 Tip van de Dag
📋 Alle Picks
📊 Resultaten
⚽ Mijn Leagues
⚙️ Account
[Switch to Pro →]
```

**Pro sidebar:**
```
Dashboard
Picks (filterable)
Match Deep Dive
Track Record
Strategy Lab
Transparency Hub
API
Account
[Switch to Simpel →]
```

### Hoofdpagina's

Voor Simpel: identiek aan Voorstel A's Simpel mode pagina's.

Voor Pro: identiek aan Voorstel A's Pro mode pagina's, maar met eigen layout (breder, minder whitespace, grid-based).

### Tier mapping

Zelfde als Voorstel A. Mode toggle is echter **een feature zelf**:
- **Free:** Alleen Simpel mode
- **Silver:** Beide modes, kan wisselen
- **Gold/Platinum:** Beide modes, Pro is default

### Emotionele upgrade triggers
- Free → Silver prime trigger: **"Ontgrendel Pro mode"** als tagline

### Voordelen van Voorstel B
1. **Sterke positionering:** "Pro" is een product identiteit, niet een mode
2. **Upgrade-trigger zeer duidelijk:** Silver = toegang tot Pro
3. **Ontwerpvrijheid:** elke mode kan aparte design language hebben
4. **SEO voordeel:** `/simpel/` routes voor begin-vriendelijke SEO, `/pro/` voor serieuze content
5. **A/B testing:** elke route apart testbaar

### Nadelen van Voorstel B
1. **Meer code om te onderhouden:** ~2x zoveel pagina's
2. **Navigatie inconsistentie:** gebruiker kan verdwalen
3. **URL verdubbeling:** dezelfde match op 2 URLs = SEO kannibalisatie als niet goed canoniek gemarkeerd
4. **Mobile:** twee layouts = twee responsive sets

### Geschatte bouwwerk
**~100-140 uur.** Twee complete layout-sets + eigen componenten. Duur maar biedt design-vrijheid.

---

## Voorstel C: Progressive Disclosure (één interface, gelaagd)

### Concept
**Geen modes.** Eén interface werkt voor beiden door slim gebruik van:
- **Default minimaal** — toont eerst het belangrijkste
- **"Meer details" knoppen** — vouwen diepe data uit
- **Slimme defaults per tier** — Platinum user ziet meer uitgevouwen by default

Alles is zichtbaar voor wie ervoor betaalt, maar niet op-je-neus op pagina load. Analist krijgt snel wat hij nodig heeft via drill-down.

### Sidebar
```
Home (/dashboard)
Tip van de Dag (/bet-of-the-day)
Alle Picks (/predictions)
Wedstrijden (/matches)              NIEUW — browse all + deep dives
Resultaten (/results)
Track Record (/trackrecord)
Account (/account)
```

Minimale sidebar (6 items). Admin gated. Deals in footer.

### Hoofdpagina design-principe

**Elke pagina heeft 3 lagen:**
1. **Hero / glance:** simpele samenvatting (goed voor Mark)
2. **Details collapsible:** "📊 Zie details" → toont segments, grafieken
3. **Deep dive:** "🔬 Open deep dive" → toont features, submodels, calibration (Platinum)

### Voorbeeld: BOTD pagina

**Laag 1 (altijd zichtbaar):**
- Match + pick + confidence ster-rating
- 1 reden: "Bayern wint 80% thuis tegen lagere teams"

**Laag 2 (klik "Bekijk onderbouwing"):**
- Top 3 redenen uit features_snapshot
- Historische accuracy BOTD deze maand
- Pre-match odds (als beschikbaar)

**Laag 3 (klik "Deep dive", Platinum only):**
- Alle 39 features + importances
- Submodel breakdown (Elo/Logistic/XGBoost/Poisson)
- Calibration context: "70%-bucket is 74% correct historisch"
- Value bet check: edge vs market

### Voorbeeld: Match Detail

**Laag 1:** Teams, kickoff, pick, probability bars
**Laag 2:** Recent form, H2H, Elo diff (Silver+)
**Laag 3:** Match statistics, submodels, odds history (Gold/Platinum)

### Voorbeeld: Track Record

**Laag 1:** Big numbers: 2,473 picks @ 78%, 3,942 @ 71%, 8,951 @ 63%
**Laag 2:** Per-league tabel (Silver+), rolling accuracy chart
**Laag 3:** Calibration chart, Brier score trend, walk-forward details (Gold+)

### Tier mapping

| Feature / Laag | Free | Silver | Gold | Platinum |
|----------------|:----:|:------:|:----:|:--------:|
| BOTD Laag 1 | ✅ | ✅ | ✅ | ✅ |
| BOTD Laag 2 | 🔒 | ✅ | ✅ | ✅ |
| BOTD Laag 3 | 🔒 | 🔒 | ✅ | ✅ |
| Alle Picks Laag 1 | top 5/dag | ≥55% | Alle | Alle |
| Alle Picks Laag 2 (filters) | — | basic | ✅ | ✅ |
| Alle Picks Laag 3 (export) | — | — | ✅ | ✅ |
| Match detail L1 | ✅ | ✅ | ✅ | ✅ |
| Match detail L2 | — | ✅ | ✅ | ✅ |
| Match detail L3 | — | — | ✅ | ✅ |
| Track Record L3 | — | — | ✅ | ✅ |
| API access | — | — | — | ✅ |
| Custom alerts | — | — | — | ✅ |

### Emotionele upgrade triggers

**Progressive disclosure is zelf de trigger:**
- Free user klikt "Bekijk onderbouwing" → modal: "Silver-gebruikers zien de volledige onderbouwing. **Trial nu gratis 7 dagen**"
- Silver klikt "Deep dive" → modal: "Gold ontgrendelt submodel analyse"
- Gold klikt op blurred API docs → modal: "Platinum voor programmatische toegang"

### Voordelen van Voorstel C
1. **Geen cognitive load:** Mark ziet alleen wat relevant is, Laura drilt naar diepte
2. **Geen dubbele pagina's:** één URL per entity
3. **Upgrade triggers natuurlijk geplaatst:** bij het moment van verlangen
4. **Mobile-friendly:** collapsible works perfectly op small screens
5. **Minste code duplicatie:** componenten hebben max-depth prop

### Nadelen van Voorstel C
1. **Laura kan geïrriteerd raken:** altijd doorklikken voor diepte
2. **Ontdekbaarheid:** Laura weet niet altijd waar de "Deep dive" knop zit
3. **Niet zo sticky als Pro/Simpel mode:** geen duidelijke "analyst home"
4. **Design complexiteit:** veel states per component (L1/L2/L3/locked)

### Geschatte bouwwerk
**~50-70 uur.** Minste code totaal, maar slimme componenten vereist.

---

## Samenvattende structuur

| Aspect | Voorstel A (Toggle) | Voorstel B (Routes) | Voorstel C (Disclosure) |
|--------|:-------------------:|:-------------------:|:-----------------------:|
| **URL structuur** | Eén set | `/simpel/*` + `/pro/*` | Eén set |
| **Sidebar items** | 8-9 | 6-8 per mode | 6 |
| **Mode awareness** | Expliciet toggle | Route-based | Impliciet (per tier) |
| **Aantal pagina's** | ~10 | ~20 | ~10 |
| **Design flex** | Medium | Hoog | Laag |
| **Bouwwerk uren** | 60-80 | 100-140 | 50-70 |

Volgende stap: vergelijkingstabel, aanbeveling, eindrapport.
