═══════════════════════════════════════════════════════
PAGE TYPE: PER-LEAGUE PREDICTIONS PAGE TEMPLATE × 10
URL: /predictions/{league-slug}
═══════════════════════════════════════════════════════

DEZE TEMPLATE GENEREERT 10 PAGES × 6 LOCALES = 60 UNIEKE URLs:

1. /predictions/premier-league
2. /predictions/la-liga
3. /predictions/bundesliga
4. /predictions/serie-a
5. /predictions/ligue-1
6. /predictions/champions-league
7. /predictions/europa-league
8. /predictions/eredivisie
9. /predictions/primeira-liga
10. /predictions/championship

Per locale:
- NL: /nl/voorspellingen/{league-slug}
- DE: /de/vorhersagen/{league-slug}
- FR: /fr/pronostics/{league-slug}
- ES: /es/pronosticos/{league-slug}
- IT: /it/pronostici/{league-slug}

League namen blijven onvertaald (officiële merknamen).

PAGE PURPOSE

Primary: SEO-traffic per league + variants per locale
Secondary: locale-specific bezoekers converteren via gating
Tertiary: authority-content publiceren per league

KRITIEKE GATING-LOGICA

Top 3 leagues (Premier League, La Liga, Bundesliga):
- 2-3 free predictions zichtbaar
- Rest blurred met paywall

Overige 7 leagues (Serie A, Ligue 1, Champions League, Europa League, 
Eredivisie, Primeira Liga, Championship):
- 0 free predictions zichtbaar
- 1 teaser card volledig blurred met sterke conversie-CTA
- Hele upcoming fixtures lijst tonen (matches zonder predictions) 
  voor SEO-content
- Predictions zijn paid-only

═══════════════════════════════════════════════════════
SECTIE 1: HERO (Attention)
═══════════════════════════════════════════════════════

LAYOUT
- Compact, ~35vh
- Donkere achtergrond met league-specific accent kleur
- 60/40 split desktop, stacked mobiel

CONTENT

H1 (per league, per locale):

Premier League EN: "Premier League Predictions"
Premier League NL: "Premier League Voorspellingen"
Premier League DE: "Premier League Vorhersagen"
Premier League FR: "Pronostics Premier League"
Premier League ES: "Pronósticos Premier League"
Premier League IT: "Pronostici Premier League"

(Zelfde patroon voor alle 10 leagues)

Subheadline:
EN: "AI-powered predictions for every {LEAGUE} match. Generated 
     using Elo ratings, Poisson models and machine learning. 
     Locked before kickoff."

Trust strip:
- ✓ "{X} predictions this matchweek" (dynamisch)
- ✓ "Updated every minute"
- ✓ "Locked before kickoff"

CTA primary:
Voor top 3 leagues: "View Free Predictions" (anchor scroll)
Voor overige 7: "Unlock {LEAGUE} Predictions" → /pricing

CTA secondary: "How it works" → /methodology

VISUAL (rechts, 40% width desktop):
Per league een league-specifieke visualisatie:
- Groot league logo (placeholder shield)
- Onder logo: 3 mini-stats:
  - Aantal teams in league
  - Current matchweek
  - Aantal predictions deze week

═══════════════════════════════════════════════════════
SECTIE 2: PREDICTION CARDS — GATED PER LEAGUE
═══════════════════════════════════════════════════════

LAYOUT
- Date filter tabs bovenaan (Today | This Week | All Upcoming)
- Cards in grid (3-5 per rij desktop, stacked mobiel)
- Visueel onderscheid: free / blurred / fixture-only

CONTENT

DATE FILTER

EN: "Today" | "This Week" | "All Upcoming"
NL: "Vandaag" | "Deze Week" | "Alle Komende"
DE: "Heute" | "Diese Woche" | "Alle Kommenden"
FR: "Aujourd'hui" | "Cette Semaine" | "À Venir"
ES: "Hoy" | "Esta Semana" | "Próximos"
IT: "Oggi" | "Questa Settimana" | "Prossimi"

VOOR TOP 3 LEAGUES (Premier League, La Liga, Bundesliga):

Today tab:
- 2-3 free prediction cards zichtbaar
- "{X} more predictions today — paid only" message
- 1 blurred card als teaser
- Rest van today's matches: alleen fixture (teams + tijd)

This Week tab:
- 2-3 free cards (highest profile matches)
- Rest blurred met paywall

All Upcoming tab:
- Geen free cards
- Volledige fixture lijst (teams + datum + tijd)

VOOR OVERIGE 7 LEAGUES:

Today tab:
- 0 free cards
- 1 grote teaser card volledig blurred:
  - Werkelijke match vandaag
  - Teams + league + tijd zichtbaar
  - Prediction + confidence: BLURRED
  - Overlay: "🔒 Unlock {LEAGUE} Predictions"
  - CTA: "View Pricing" → /pricing
- Rest van today's matches: fixture lijst zonder predictions

This Week + All Upcoming tabs:
- Volledige fixture lijst (teams + datum + tijd)
- Geen predictions zichtbaar
- CTA boven en onder: "Unlock all {LEAGUE} predictions"

PREDICTION CARD COMPONENT

Free card (top 3 leagues only):
- League badge top-left
- Datum/tijd kickoff
- Home team logo + naam — Away team logo + naam
- Voorspelling (bold, large)
- Confidence: visual bar + percentage
- Status: 🔒 "Locked 2h before kickoff"
- "Free pick" badge
- "View match analysis →" link

Blurred card:
- Zelfde layout maar prediction + confidence blurred
- Overlay met lock-icon en CTA naar /pricing

Fixture-only card:
- Datum/tijd kickoff
- Home team logo + naam — Away team logo + naam
- League badge
- "Subscribe to view prediction" link
- Geen confidence, geen voorspelling

═══════════════════════════════════════════════════════
SECTIE 3: LEAGUE CONTEXT & STATS (SEO Content)
═══════════════════════════════════════════════════════

LAYOUT
- 2-column op desktop: tekst links, stats panel rechts
- Stacked op mobiel
- Lichtere achtergrond

CONTENT

H2 (per league):
EN: "About {LEAGUE} Predictions"
NL: "Over {LEAGUE} Voorspellingen"
DE: "Über {LEAGUE} Vorhersagen"
FR: "À propos des Pronostics {LEAGUE}"
ES: "Sobre los Pronósticos de {LEAGUE}"
IT: "Sui Pronostici di {LEAGUE}"

Body content (3 alinea's, UNIEK per league):

Per league moet content uniek zijn. Voorbeeld voor Premier League:

Alinea 1 — League overview:
"The Premier League is England's top football division, contested 
by 20 clubs over 38 matchdays. Known for its competitive 
unpredictability, top clubs like Manchester City, Arsenal, Liverpool 
and Chelsea regularly fight for the title alongside surprise 
challengers. Our AI engine analyzes every Premier League match 
using current form, head-to-head history, expected goals, and 
40+ other variables."

Alinea 2 — Prediction approach:
"Premier League predictions are particularly challenging due to 
the league's depth and inter-team competitiveness. Our model 
weighs recent form heavily — including the last 6-10 matches — 
combined with home/away splits and tactical matchup data."

Alinea 3 — Transparency reminder:
"Every Premier League prediction is locked with a public timestamp 
before kickoff. Wins and losses are both recorded in our public 
track record. Free users see 2-3 predictions daily; subscribers 
get all matches with full statistical breakdowns."

(Zelfde structuur per league, content uniek per league)

LEAGUE STATS PANEL (rechts, 40% width desktop)

Per league, dynamische cijfers:
- Teams: {N}
- Season: "{YYYY-YY}"
- Current matchweek: "{X}"
- Top scorer: "{Player Name} ({goals})"
- Predictions this season: "{X}"
- Updated: "{timestamp}"

CTA: "View {LEAGUE} on app" → app.betsplug.com/leagues/{league-slug}

═══════════════════════════════════════════════════════
SECTIE 4: TOP TEAMS IN LEAGUE
═══════════════════════════════════════════════════════

LAYOUT
- Grid van top 5-8 teams per league

CONTENT

H2:
EN: "Top {LEAGUE} Teams"
NL: "Top Teams in de {LEAGUE}"
DE: "Top {LEAGUE} Teams"
FR: "Équipes Phares de {LEAGUE}"
ES: "Mejores Equipos de {LEAGUE}"
IT: "Top Squadre di {LEAGUE}"

TEAM CARDS (top 5-8)

Per card:
- Team logo
- Team naam
- Current league position
- Recent form: "WWLDW"
- "View team →" link → app.betsplug.com

Implementatie:
- Top 5 voor kleinere leagues
- Top 8 voor grote leagues
- Order: by current league position (live data)

═══════════════════════════════════════════════════════
SECTIE 5: METHODOLOGY PREVIEW
═══════════════════════════════════════════════════════

H2:
EN: "How {LEAGUE} Predictions Are Made"

Body:
EN: "{LEAGUE} predictions use the same engine as all our football 
     predictions: Elo ratings for team strength, Poisson models 
     for goal probability, and machine learning for pattern 
     recognition. The model is trained on historical {LEAGUE} 
     data and updated continuously."

3 mini-icons:
🧮 Mathematical models (Elo + Poisson)
🤖 Machine learning trained on {LEAGUE} data
🔒 Locked & timestamped

CTA: "Read full methodology" → /methodology

═══════════════════════════════════════════════════════
SECTIE 6: FAQ — LEAGUE-SPECIFIC
═══════════════════════════════════════════════════════

H2:
EN: "{LEAGUE} Predictions FAQ"

QUESTIONS (5-6 — league-specifiek waar mogelijk)

Q1: "How accurate are AI predictions for {LEAGUE}?"
A: "Accuracy varies per matchday and prediction type. We publish 
   every {LEAGUE} prediction in our public track record."

Q2 (top 3 leagues): "Why do you offer free {LEAGUE} predictions?"
A: "{LEAGUE} is one of three top leagues where we publish 2-3 free 
   predictions daily."

Q2 (overige 7): "Why are {LEAGUE} predictions paid only?"
A: "Free predictions are limited to top 3 leagues. {LEAGUE} 
   predictions are part of our paid plans."

Q3: "What types of predictions do you publish for {LEAGUE}?"
A: "For every {LEAGUE} match we publish predictions across multiple 
   markets: 1X2, Over/Under goals, BTTS, double chance."

Q4: "How early are {LEAGUE} predictions available?"
A: "Subscribers see {LEAGUE} predictions up to 24 hours before 
   kickoff. Free users see them 2 hours before kickoff."

Q5: "Do you cover {LEAGUE} cup matches and European fixtures?"
A: "We cover all {LEAGUE} league matches. Cup matches and European 
   fixtures are covered separately under their own pages."

Q6: "Can I get {LEAGUE} predictions via Telegram?"
A: "Yes. Paid subscribers receive Telegram notifications for 
   high-confidence {LEAGUE} predictions."

CTA: "All FAQs" → /faq

═══════════════════════════════════════════════════════
SECTIE 7: FINAL CTA STRIP
═══════════════════════════════════════════════════════

Voor top 3 leagues:
H2: "Want All {LEAGUE} Predictions?"
Body: "Free users see 2-3 daily picks. Subscribers get all matches."
CTA primary: "View Plans" → /pricing
CTA secondary: "Get Free Account" → app.betsplug.com/register

Voor overige 7 leagues:
H2: "Unlock {LEAGUE} Predictions"
Body: "{LEAGUE} predictions are part of all paid plans."
CTA primary: "View Pricing" → /pricing
CTA secondary: "Try Free" → app.betsplug.com/register

═══════════════════════════════════════════════════════
TECHNISCHE VEREISTEN
═══════════════════════════════════════════════════════

PERFORMANCE
- Lighthouse Performance ≥95
- LCP <2.0s
- ISR cache: 60 seconds
- Client polling: 30 seconds (alleen prediction cards)

SEO META

Title (per league, per locale):
Premier League EN: "Premier League Predictions Today | AI-Powered | BetsPlug"
Premier League NL: "Premier League Voorspellingen Vandaag | BetsPlug"
(etc per league per locale)

Meta description:
EN: "AI-powered Premier League predictions for every match. Locked 
     before kickoff, public track record."

UNIQUE CONTENT REQUIREMENT

Elke league pagina UNIEK voor:
- H1 (league naam)
- Sectie 3 body (3 alinea's per league, UNIEK geschreven)
- Sectie 4 teams (top teams van die specifieke league)
- Sectie 5 methodology (1 alinea, league-context)
- FAQ vragen 2-3-5 (league-specifiek waar mogelijk)
- Meta titles/descriptions

Dit voorkomt thin-content/duplicate-content penalty.

SCHEMA.ORG

1. SportsLeague schema:
   - @type: SportsLeague
   - name: "Premier League"
   - sport: "Football"
   - numberOfTeams: 20
   - currentSeason: "2025-26"
2. SportsEvent schema voor elke prediction
3. BreadcrumbList: Home → Predictions → {League}
4. FAQPage voor sectie 6
5. ItemList voor top teams

LIVE DATA-FETCHING

Endpoint: /api/predictions/league/{slug}.json
- ISR met revalidate = 60s
- Returns: {
    league: { name, slug, logo, teams, currentMatchweek, ... },
    today: { freeCount, totalCount, predictions: [...] },
    week: { matches: [...], predictionsCount: number },
    upcoming: { matches: [...] }
  }

Per league logic:
- Top 3 leagues: 2-3 cards in today.predictions met full data
- Andere leagues: today.predictions[0] is teaser only

CONTENT DELIVERABLES PER LEAGUE

Voor 10 leagues × 6 locales = 60 pages × 4 content-types = 
~240 unieke content-blokken te schrijven.

Per league moet uniek geleverd worden:
1. Sectie 3 body: 3 alinea's per league × 6 locales = 60 stukjes
2. Sectie 4 team-data: live via API
3. Sectie 6 FAQ: vragen 2 + 3 + 5 league-specifiek × 6 locales
4. Meta titles/descriptions: 60 unieke meta-strings

Engelse content schrijven eerst, daarna AI-vertaling met menselijke 
review per locale.
