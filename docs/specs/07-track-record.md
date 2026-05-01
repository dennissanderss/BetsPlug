═══════════════════════════════════════════════════════
PAGE TYPE: TRACK RECORD
URL: /track-record (en) | /nl/track-record | /de/track-record | 
     /fr/track-record | /es/track-record | /it/track-record
═══════════════════════════════════════════════════════

Note: track-record blijft onvertaald in alle locales (internationale 
betting/analytics term). Alleen het pad-prefix verandert per locale.

PAGE PURPOSE

Primary: trust opbouwen via demonstratie van transparantie — 
         elke voorspelling publiek toegankelijk, ook verliezen
Secondary: SEO-traffic voor "football prediction track record",
           "AI predictions accuracy", "transparent prediction history"
Tertiary: differentiatie van tipster-sites die alleen winnaars tonen

POSITIONING

Deze pagina is je sterkste differentiator. Concurrenten verbergen 
verliezen of cherry-picken. Wij publiceren alles. De pagina moet 
dit niet alleen zeggen maar ook visueel demonstreren via een 
embedded widget die live data uit app.betsplug.com toont.

CONTENT FRAMEWORK

AIDA-aangepast voor trust-pagina:
- Attention: Hero met directe transparancy claim
- Interest: Visualisatie van complete track record
- Desire: Methodology link + niet-cherry-picking proof
- Action: CTA naar predictions/pricing

═══════════════════════════════════════════════════════
SECTIE 1: HERO (Attention + Differentiation)
═══════════════════════════════════════════════════════

LAYOUT
- Donker (deep-navy-900 met pitch-line pattern overlay)
- Compact, ~40vh
- Single column, max-width container-md

CONTENT

H1:
EN: "Every Prediction. Public. Forever."
NL: "Elke Voorspelling. Publiek. Voor Altijd."
DE: "Jede Vorhersage. Öffentlich. Für Immer."
FR: "Chaque Pronostic. Public. Pour Toujours."
ES: "Cada Pronóstico. Público. Para Siempre."
IT: "Ogni Pronostico. Pubblico. Per Sempre."

Subheadline (2 zinnen):
EN: "Most prediction sites only show their winners. We publish 
     everything — wins, losses, exact predictions, and timestamps. 
     Verify any prediction we've ever made."

Trust strip (3 micro-claims):
- ✓ "Locked before kickoff"
- ✓ "Cannot be edited"  
- ✓ "Wins and losses both"

CTA primary: "How It Works" → /methodology
CTA secondary: "View Predictions" → /predictions

═══════════════════════════════════════════════════════
SECTIE 2: TRACK RECORD WIDGET (Interest + Demonstration)
═══════════════════════════════════════════════════════

LAYOUT
- Lichte achtergrond (stadium-white-50)
- Full-width visualization, max-width container-lg
- Padding y-24 desktop, y-16 mobile

CONTENT

H2:
EN: "Live Track Record"
NL: "Live Track Record"
DE: "Live Track Record"
FR: "Track Record en Direct"
ES: "Track Record en Vivo"
IT: "Track Record in Diretto"

Sub-H2 (1 zin):
EN: "Updated automatically as matches conclude. Click any prediction 
     for full match details."

WIDGET COMPONENT

Layout:
- Calendar-style grid: laatste 90 dagen
- Per dag: cluster van kleine kleurcodeerde tiles (één per prediction)
- Groen = win, Rood = loss, Grijs = void/postponed
- Hover op tile: tooltip met match + prediction + result
- Click op tile: deep-link naar app.betsplug.com prediction page

Header van widget:
- Date range selector: "Last 30 days" | "Last 90 days" | "All time"
- Default: 90 days
- Filter dropdown: "All leagues" | per top-3 league

Stats bar (boven grid):
- Total predictions in period: "[X]"
- Wins: "[Y] ([Z]%)"
- Losses: "[A] ([B]%)"
- Void: "[C]"

Belangrijk: percentages tonen WAT DE DATA ZEGT, geen verzonnen claims. 
Als data uit api app.betsplug.com komt, gebruik die. Als API faalt, 
toon "Loading track record..." — geen fallback met fake numbers.

API endpoint: `app.betsplug.com/api/track-record/summary?days=90`
Returns: { 
  totalCount: number, 
  wins: number, 
  losses: number, 
  voids: number, 
  predictions: Array<{ 
    id, date, homeTeam, awayTeam, league, prediction, 
    confidence, result, lockedAt 
  }> 
}

ISR: revalidate = 300 (5 minuten — track record verandert na elke 
match, niet bij elke pageview)

EMPTY STATE
Als geen data beschikbaar:
"Track record loading. Refresh in a moment."
GEEN fake data tonen.

EXPLANATION TEKST onder widget:

H3:
EN: "How To Read This"
NL: "Hoe Lees Je Dit"
DE: "Wie Diese Daten Zu Lesen Sind"
FR: "Comment Lire Ces Données"
ES: "Cómo Leer Esto"
IT: "Come Leggere Questi Dati"

Body:
EN: "Each tile represents one published prediction. Color indicates 
     outcome: green for correct prediction, red for incorrect, gray 
     for void (postponed match or push). Click any tile to see the 
     full prediction details, including the lock timestamp proving 
     it was published before kickoff."

═══════════════════════════════════════════════════════
SECTIE 3: WHY WE PUBLISH EVERYTHING (Desire + Trust)
═══════════════════════════════════════════════════════

LAYOUT
- Donker (deep-navy-900)
- Two-column desktop: tekst links, key stats rechts
- Stacked mobiel

CONTENT

H2:
EN: "Why We Publish Losses Too"
NL: "Waarom We Ook Verliezen Publiceren"
DE: "Warum Wir Auch Verluste Veröffentlichen"
FR: "Pourquoi Nous Publions Aussi les Pertes"
ES: "Por Qué Publicamos También las Pérdidas"
IT: "Perché Pubblichiamo Anche le Perdite"

Body (3 paragraphs):

Alinea 1:
EN: "The prediction industry has an integrity problem. Most sites 
     selectively show winning predictions while quietly removing 
     losses, making their accuracy claims meaningless. We rejected 
     this approach from day one."

Alinea 2:
EN: "Every BetsPlug prediction is locked with a public timestamp 
     before kickoff. Once published, it cannot be edited, deleted, 
     or hidden. Win or lose, the prediction stays in our public 
     record forever. This is the only way to make accuracy claims 
     verifiable."

Alinea 3:
EN: "Our track record is the proof behind our methodology. If we 
     claimed 90% accuracy without showing every prediction, you'd 
     have no reason to believe us. By showing everything, our 
     real performance speaks for itself — better than any marketing 
     copy could."

KEY STATS PANEL (rechts, 40% width desktop):

Geen verzonnen cijfers. Live counts uit API:
- Total predictions ever published: "[X]"
- Days of continuous tracking: "[Y]"
- Leagues covered: "30+"
- Last prediction added: "[timestamp]"

Stats updaten via dezelfde ISR cycle als widget.

═══════════════════════════════════════════════════════
SECTIE 4: METHODOLOGY LINK (Authority Refresh)
═══════════════════════════════════════════════════════

LAYOUT
- Lichte achtergrond
- Centered, max-width container-md
- Icon + tekst + CTA

CONTENT

H2:
EN: "The Methodology Behind These Numbers"
NL: "De Methodologie Achter Deze Cijfers"
DE: "Die Methodik Hinter Diesen Zahlen"
FR: "La Méthodologie Derrière Ces Chiffres"
ES: "La Metodología Detrás de Estos Números"
IT: "La Metodologia Dietro Questi Numeri"

Body (2 zinnen):
EN: "Every prediction in our track record was generated by the same 
     AI engine: Elo ratings, Poisson goal models, and machine 
     learning combined. No editorial picks, no manual overrides."

CTA: "Read full methodology" → /methodology

═══════════════════════════════════════════════════════
SECTIE 5: FAQ — TRACK RECORD SPECIFIC
═══════════════════════════════════════════════════════

H2:
EN: "Track Record FAQ"
(vertaal per locale)

QUESTIONS (5)

Q1: "Can predictions be removed from the track record?"
A: "No. Every prediction is locked with an immutable timestamp 
   before kickoff. We have no mechanism to delete or hide 
   predictions after publication, even if we wanted to. This is 
   architectural, not policy — it can't be changed."

Q2: "What does 'void' mean in the track record?"
A: "Void status applies to predictions where the match was 
   postponed, cancelled, or otherwise didn't reach a normal 
   conclusion. We don't count these as wins or losses since the 
   prediction couldn't be evaluated."

Q3: "Why don't you show specific accuracy percentages prominently?"
A: "Accuracy varies dramatically by league, market type, and time 
   period. A single headline percentage hides this variance. We 
   prefer to show the raw data so you can see actual performance 
   in context — which competitions, which markets, which periods 
   we've performed best and worst."

Q4: "Can I download the track record data?"
A: "Track record data is available through our API for paid 
   subscribers. The visual track record on this page is publicly 
   accessible for verification purposes."

Q5: "How do I verify a specific prediction was locked before 
    kickoff?"
A: "Click any prediction in the track record. The detail page shows 
   the lock timestamp — the exact moment the prediction was 
   committed. Compare this with the actual match kickoff time 
   (also shown). Lock timestamp is always before kickoff."

═══════════════════════════════════════════════════════
SECTIE 6: FINAL CTA STRIP
═══════════════════════════════════════════════════════

LAYOUT: dark, full-width, centered

H2:
EN: "Ready to See Today's Predictions?"
(vertaal per locale)

Body:
EN: "Same engine, same transparency. Try our free predictions today."

CTA primary: "Get Free Picks" → app.betsplug.com/register
CTA secondary: "Compare Plans" → /pricing

═══════════════════════════════════════════════════════
TECHNISCHE VEREISTEN
═══════════════════════════════════════════════════════

PERFORMANCE
- Lighthouse Performance ≥95
- Track record widget: skeleton loading state tijdens API fetch
- ISR revalidate: 300s
- Client-side updates niet nodig (track record stabieler dan predictions)

SEO META TAGS

Title (per locale):
EN: "BetsPlug Track Record — Every Prediction Public | BetsPlug"
NL: "BetsPlug Track Record — Elke Voorspelling Publiek | BetsPlug"
DE: "BetsPlug Track Record — Jede Vorhersage Öffentlich | BetsPlug"
FR: "Track Record BetsPlug — Chaque Pronostic Public | BetsPlug"
ES: "Track Record BetsPlug — Cada Pronóstico Público | BetsPlug"
IT: "Track Record BetsPlug — Ogni Pronostico Pubblico | BetsPlug"

Meta description:
EN: "View every BetsPlug AI prediction ever published — wins and 
     losses both. Live track record updates daily. Locked timestamps 
     prove transparency."

SCHEMA.ORG

1. WebPage schema with "TrackRecord" naming
2. BreadcrumbList: Home → Track Record
3. Dataset schema (advanced):
   - @type: Dataset
   - name: "BetsPlug Prediction Track Record"
   - description: "Public record of all AI football predictions"
   - creator: BetsPlug Organization

INTERNAL LINKS
- Naar /methodology (3x)
- Naar /predictions (1x final CTA)
- Naar /pricing (1x final CTA)
- Naar /faq (1x onder FAQ sectie)

ACCESSIBILITY
- Track record grid: ARIA grid role
- Tooltips: aria-describedby
- Color is NOT only indicator (icons + text labels too)
- Date range selector: full keyboard support
- Skeleton state: aria-busy="true"
