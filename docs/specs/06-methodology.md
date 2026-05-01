═══════════════════════════════════════════════════════
PAGE TYPE: METHODOLOGY DEEP-DIVE
URL: /methodology (en) | /nl/methodologie | /de/methodik | 
     /fr/methodologie | /es/metodologia | /it/metodologia
═══════════════════════════════════════════════════════

PAGE PURPOSE

Primary: trust opbouwen voor evaluation-fase bezoekers
Secondary: SEO voor "how AI predicts football", "Elo rating football",
           "Poisson model football betting"
Tertiary: authority establishen — diepgaand differentieert van 
          concurrent-tipster sites

POSITIONING

Bewust technisch en gedetailleerd. Vertaal complexe statistiek naar 
leesbare uitleg zonder te dumben-down. Long-form (~3000-4000 woorden).

═══════════════════════════════════════════════════════
SECTIE 1: HERO (Attention + Authority)
═══════════════════════════════════════════════════════

LAYOUT
- Compact, ~40vh
- Donkere achtergrond met geometrische pattern
- Centered content, max-width 800px

CONTENT

H1:
EN: "The Methodology Behind BetsPlug Predictions"
NL: "De Methodologie Achter BetsPlug Voorspellingen"
DE: "Die Methodik Hinter BetsPlug Vorhersagen"
FR: "La Méthodologie Derrière les Pronostics BetsPlug"
ES: "La Metodología Detrás de los Pronósticos BetsPlug"
IT: "La Metodologia Dietro i Pronostici BetsPlug"

Subheadline:
EN: "How we combine Elo ratings, Poisson goal models and machine 
     learning into a single prediction engine. No secret algorithm. 
     No editorial picking. Just mathematics, transparently applied."

Trust strip:
- ✓ "Open methodology"
- ✓ "Reproducible logic"
- ✓ "Locked predictions"

CTA primary: "Get Predictions" → /pricing
CTA secondary: "View Track Record" → /track-record

═══════════════════════════════════════════════════════
SECTIE 2: TABLE OF CONTENTS
═══════════════════════════════════════════════════════

LAYOUT
- Sticky sidebar op desktop (rechts, 25% width)
- Inline boven content op mobiel

H2:
EN: "On This Page"
NL: "Op Deze Pagina"
DE: "Auf Dieser Seite"
FR: "Sur Cette Page"
ES: "En Esta Página"
IT: "In Questa Pagina"

Anchor links naar:
1. The three pillars
2. Elo rating system
3. Poisson goal models
4. Machine learning layer
5. Data sources & validation
6. The locking mechanism
7. What we don't do
8. Limitations & honesty

═══════════════════════════════════════════════════════
SECTIE 3: THE THREE PILLARS
═══════════════════════════════════════════════════════

H2:
EN: "The Three Pillars of Our Engine"

Intro paragraph:
EN: "BetsPlug doesn't rely on a single statistical method. Instead, 
     we combine three established approaches — each strong in 
     different aspects of football prediction — and let machine 
     learning weight their outputs based on what works for each 
     specific match context."

3 PILLARS PREVIEW

Pillar 1: Elo Ratings
- Tagline: "Team strength, dynamically updated"
- One-liner: "Each team has a numerical strength rating that adjusts 
  after every match based on result and opponent quality."

Pillar 2: Poisson Models
- Tagline: "Goal probability mathematics"
- One-liner: "Statistical distribution that calculates the likelihood 
  of specific score outcomes."

Pillar 3: Machine Learning
- Tagline: "Pattern recognition across thousands of matches"
- One-liner: "Algorithms that detect non-obvious correlations between 
  match variables and outcomes."

═══════════════════════════════════════════════════════
SECTIE 4: ELO RATING SYSTEM
═══════════════════════════════════════════════════════

H2: "Elo Rating System"

Body (4-5 paragraphs):

Alinea 1 — Origin & adaptation:
EN: "The Elo system was originally developed by Arpad Elo for chess 
     rankings in the 1950s. We adapted it for football, where teams 
     replace players and match results replace game outcomes."

Alinea 2 — How it works:
EN: "When two teams meet, the Elo system uses their current ratings 
     to calculate expected outcomes. After the match, ratings are 
     adjusted based on whether the result matched expectation."

Alinea 3 — Football-specific adjustments:
EN: "Football Elo differs from chess Elo in three key ways: we 
     account for goal difference, home advantage is built into 
     expected outcomes, and match importance multiplier."

Alinea 4 — Why it works for predictions:
EN: "Elo's strength is recency-weighted accuracy. A team in great 
     current form will have a higher rating than their historical 
     average suggests."

INLINE DIAGRAM:
- Two team boxes met current ratings
- Match result box
- Updated ratings na match
- Caption met formule

EXAMPLE BOX:
EN: "Real-world example: When Manchester City lost 2-1 to a 
     mid-table team in 2024, their Elo rating dropped by 18 points."

═══════════════════════════════════════════════════════
SECTIE 5: POISSON GOAL MODELS
═══════════════════════════════════════════════════════

H2: "Poisson Goal Models"

Body (4-5 paragraphs):

Alinea 1 — What is Poisson:
EN: "The Poisson distribution is a mathematical formula that 
     calculates the probability of events occurring within a fixed 
     interval. For football, the 'event' is a goal and the 'interval' 
     is 90 minutes."

Alinea 2 — Application to football:
EN: "We calculate two Poisson rates per match: the home team's 
     expected goals and the away team's expected goals. Both rates 
     feed into a probability matrix for every possible score."

Alinea 3 — What this gives us:
EN: "The Poisson layer outputs probabilities for: exact scores, 
     Over/Under goal totals, Both Teams to Score, and half-time/
     full-time correlations."

Alinea 4 — Why we adjust:
EN: "Pure Poisson tends to underestimate draws and high-scoring 
     matches. We apply the Dixon-Coles adjustment — a refinement 
     that corrects these biases."

INLINE DIAGRAM:
- Poisson distribution chart
- X-axis: goals, Y-axis: probability
- Two overlapping curves

EXAMPLE BOX:
EN: "Real-world example: For a Bayern vs Frankfurt match, our 
     Poisson model might calculate Bayern's expected goals at 2.4 
     and Frankfurt's at 0.9. From these we derive: Over 2.5 ~62%, 
     BTTS yes ~58%, most likely score 2-1 (~12%)."

═══════════════════════════════════════════════════════
SECTIE 6: MACHINE LEARNING LAYER
═══════════════════════════════════════════════════════

H2: "Machine Learning Layer"

Body (4-5 paragraphs):

Alinea 1 — What ML adds:
EN: "Elo and Poisson are powerful but mechanical. Machine learning 
     fills the gap by detecting patterns across thousands of 
     historical matches."

Alinea 2 — What our ML uses:
EN: "Our ML layer ingests 40+ variables per match: recent form, 
     home/away splits, head-to-head, expected goals trends, 
     possession statistics, lineup strength, days of rest, weather, 
     referee tendencies, and match stakes."

Alinea 3 — How it integrates:
EN: "The ML layer doesn't replace Elo or Poisson — it weights 
     their outputs based on context."

Alinea 4 — Training & validation:
EN: "Our model is trained on multiple seasons of historical match 
     data. We use a holdout methodology: the model never sees the 
     matches it's tested on during training."

Alinea 5 — Continuous learning:
EN: "After every match concludes, the result feeds back into the 
     model. Predictions that succeeded are reinforced; predictions 
     that failed flag patterns for re-evaluation."

INLINE DIAGRAM:
- Simplified neural network visualization
- Input layer: 40+ variables
- Hidden processing
- Output: weighted prediction

═══════════════════════════════════════════════════════
SECTIE 7: DATA SOURCES & VALIDATION
═══════════════════════════════════════════════════════

LAYOUT
- 2-column: tekst links, data-bronnen lijst rechts

H2:
EN: "Data Sources & Validation"

Body (3 paragraphs):

Alinea 1 — Where data comes from:
EN: "We aggregate match and team data from licensed sports data 
     providers — the same sources used by major sports media and 
     bookmakers."

Alinea 2 — Validation process:
EN: "Before any data enters our prediction engine, it passes through 
     a validation pipeline: format normalization, anomaly detection, 
     cross-referencing with multiple sources, and human review of 
     flagged exceptions."

Alinea 3 — Update frequency:
EN: "Match data updates in near-real-time during games. Team and 
     player statistics update post-match. Our prediction engine 
     recalculates continuously."

DATA SOURCES PANEL:
- Match results & live data (licensed providers)
- Historical match archives (multi-season database)
- Lineup & injury data (verified pre-match)
- Weather & venue conditions (third-party APIs)
- Player ratings & performance metrics (licensed providers)

═══════════════════════════════════════════════════════
SECTIE 8: THE LOCKING MECHANISM
═══════════════════════════════════════════════════════

H2:
EN: "The Locking Mechanism"

Body (3 paragraphs):

Alinea 1 — What locking means:
EN: "Every prediction we publish has a lock timestamp — the exact 
     moment it was generated and committed to our public track 
     record. After this timestamp, the prediction cannot be edited, 
     deleted, or replaced."

Alinea 2 — Why this matters:
EN: "Most prediction sites have an integrity problem: they can 
     quietly remove losing predictions or 'update' them after the 
     fact. We've eliminated this possibility by design."

Alinea 3 — Verification:
EN: "Every prediction in our public track record includes its lock 
     timestamp. You can verify that any specific prediction was 
     published before kickoff."

INLINE TIMELINE DIAGRAM:
- 24h before kickoff: Prediction generated (subscriber access)
- 2h before kickoff: Public lock + free user access
- Kickoff: Match begins
- Post-match: Result added to track record
- Forever: Prediction immutable

═══════════════════════════════════════════════════════
SECTIE 9: WHAT WE DON'T DO
═══════════════════════════════════════════════════════

H2:
EN: "What We Don't Do"
NL: "Wat We Niet Doen"
DE: "Was Wir Nicht Tun"
FR: "Ce Que Nous Ne Faisons Pas"
ES: "Lo Que No Hacemos"
IT: "Cosa Non Facciamo"

Intro:
EN: "Transparency works in both directions. Here are things some 
     prediction services do that we deliberately don't:"

LIST (7 items met X icons):

✗ "We don't sell or claim 'fixed matches'"
   We don't have inside information. Anyone claiming to sell fixed 
   matches is committing fraud.

✗ "We don't edit predictions after publication"
   Once locked, predictions cannot be modified.

✗ "We don't hide losses from our track record"
   Every prediction is published — wins, losses, and pushes alike.

✗ "We don't promise specific accuracy percentages"
   AI predictions have probabilistic accuracy that varies.

✗ "We don't use editorial bias"
   Predictions are generated by the engine without human override.

✗ "We don't operate as a bookmaker"
   We don't accept bets, hold money, or facilitate gambling.

✗ "We don't share user data with bookmakers"
   Your account information stays within BetsPlug.

═══════════════════════════════════════════════════════
SECTIE 10: LIMITATIONS & HONESTY
═══════════════════════════════════════════════════════

H2:
EN: "Limitations & Honesty"
NL: "Beperkingen en Eerlijkheid"
DE: "Grenzen und Ehrlichkeit"
FR: "Limites et Honnêteté"
ES: "Limitaciones y Honestidad"
IT: "Limiti e Onestà"

Body (4 paragraphs):

Alinea 1 — What AI can't do:
EN: "AI predictions are not magic. They're statistically informed 
     probabilities. A 78% confidence prediction is still 22% likely 
     to be wrong."

Alinea 2 — Where our model is strongest:
EN: "Our predictions perform best in: high-volume, well-documented 
     leagues; mid-range markets where statistical regression 
     dominates; and matches where teams have stable lineups."

Alinea 3 — Where our model is weakest:
EN: "Our predictions are less reliable in: low-data leagues; 
     unusual fixtures; matches with major lineup disruptions; 
     and extreme low-probability events."

Alinea 4 — Our commitment:
EN: "We don't claim to predict football perfectly. We claim to 
     predict it transparently and methodically. Use our predictions 
     as one input in your own analysis."

═══════════════════════════════════════════════════════
SECTIE 11: FAQ — METHODOLOGY-SPECIFIC
═══════════════════════════════════════════════════════

H2:
EN: "Methodology FAQ"

QUESTIONS (6)

Q1: "Can I see the actual model code?"
A: "We don't publish source code (it's our core IP), but we publish 
   detailed methodology — what models we use, what variables we 
   process, what data sources we use, and how predictions are locked."

Q2: "How do you handle unexpected events like red cards or injuries 
    during a match?"
A: "Our predictions are generated and locked before kickoff, so 
   they don't update during a match. In-game events affecting 
   accuracy is part of football's inherent uncertainty."

Q3: "Why use multiple models instead of one perfect model?"
A: "No single statistical method captures all football dynamics. 
   Combining them with weighted integration gives more robust 
   predictions than any one method alone."

Q4: "How accurate are your predictions compared to bookmaker odds?"
A: "We don't publish comparative accuracy versus bookmaker odds. 
   View our public track record for raw prediction performance."

Q5: "Do you account for player-specific data?"
A: "Yes, but at the team level. We factor in lineup strength based 
   on player ratings, key player presence/absence, and aggregate 
   form."

Q6: "How often is the model retrained?"
A: "Continuously, with major retraining cycles after each match 
   week. Elo ratings update after every match. Poisson parameters 
   adjust based on rolling form windows. ML layer is retrained 
   weekly."

CTA: "All FAQs" → /faq

═══════════════════════════════════════════════════════
SECTIE 12: FINAL CTA STRIP
═══════════════════════════════════════════════════════

H2:
EN: "See the Methodology in Action"
NL: "Zie de Methodologie in Actie"
DE: "Sehen Sie die Methodik in Aktion"
FR: "Voyez la Méthodologie en Action"
ES: "Mira la Metodología en Acción"
IT: "Vedi la Metodologia in Azione"

Body:
EN: "Now that you understand how our predictions work, see them 
     applied across 30+ leagues."

CTA primary: "View Today's Predictions" → /predictions
CTA secondary: "Compare Plans" → /pricing

═══════════════════════════════════════════════════════
TECHNISCHE VEREISTEN
═══════════════════════════════════════════════════════

PERFORMANCE
- Lighthouse Performance ≥95
- LCP <2.0s
- Static page (no live data)
- revalidate: false

SEO META

Title:
EN: "Methodology: How BetsPlug AI Predictions Work | BetsPlug"
NL: "Methodologie: Hoe BetsPlug AI-voorspellingen Werken | BetsPlug"
DE: "Methodik: Wie BetsPlug KI-Vorhersagen Funktionieren | BetsPlug"
FR: "Méthodologie : Comment Fonctionnent les Pronostics IA BetsPlug"
ES: "Metodología: Cómo Funcionan los Pronósticos IA BetsPlug"
IT: "Metodologia: Come Funzionano i Pronostici IA BetsPlug"

Description:
EN: "Detailed methodology behind BetsPlug AI football predictions. 
     Elo ratings, Poisson goal models, machine learning. Open, 
     reproducible, locked before kickoff."

SCHEMA.ORG

1. TechArticle schema:
   - headline: H1
   - author: BetsPlug Engineering Team
   - datePublished + dateModified
   - articleSection: "Methodology"
2. BreadcrumbList: Home → Methodology
3. FAQPage voor sectie 11
4. ItemList voor de 3 pillars

CONTENT LENGTH

~3000-4000 woorden total. Long-form authority content ranks better 
en overtuigt evaluation-fase bezoekers.

INTERNAL LINKS

Veel internal linking naar:
- /track-record (5x)
- /predictions (3x)
- /pricing (3x)
- /learn artikelen (5x contextueel — Elo links naar elo-rating-
  explained, Poisson links naar poisson-goal-models, etc.)
- /faq (1x)
- /about (1x)
