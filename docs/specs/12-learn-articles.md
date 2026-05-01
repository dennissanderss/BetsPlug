═══════════════════════════════════════════════════════
LEARN ARTICLES — CONTENT BRIEFS
═══════════════════════════════════════════════════════

Dit document bevat de content briefs voor alle 7 learn artikelen.
Elk brief specificeert: target keyword, structuur, key points, 
internal linking, en SEO meta. 

Engelse content schrijven eerst, daarna vertalen naar 5 locales 
(zie 19-content-strategy.md voor vertaalworkflow).

═══════════════════════════════════════════════════════
ARTIKEL 1: EXPECTED GOALS (xG) EXPLAINED
═══════════════════════════════════════════════════════

URL: /learn/expected-goals-explained
Localized slugs:
- NL: /leren/expected-goals-uitgelegd
- DE: /lernen/expected-goals-erklaert
- FR: /apprendre/expected-goals-explique
- ES: /aprender/expected-goals-explicado
- IT: /imparare/expected-goals-spiegato

DIFFICULTY: Beginner
READING TIME: 8 minutes
WORD COUNT: ~1500 words

TARGET KEYWORDS
Primary: "expected goals explained" / "what is xG football"
Secondary: "xG meaning football", "expected goals statistics", 
           "xG vs goals difference"

ARTIKEL STRUCTUUR

H1: "Expected Goals (xG) Explained: How Quality Beats Quantity"

INTRO (~150 words):
- Probleem: traditional goal counts misleid lange termijn perspectief
- xG als oplossing: shot quality measure
- Wat lezer leert: hoe xG werkt, waarom belangrijk, waar zwak

H2: "What is Expected Goals?"
- Definitie: xG = probability dat shot een goal wordt
- Schaal 0.0 - 1.0
- Concreet voorbeeld: penalty xG ~0.78, shot van 30m xG ~0.03
- Diagram: voetbalveld met shot-locations en hun xG values

H2: "How is xG Calculated?"
- Variables: shot location, angle, body part, defender pressure, 
  through-ball assist, etc.
- Machine learning trained op miljoenen shots
- Output: probability score per shot
- Aggregation: total xG per team per match
- Voorbeeld berekening: team had 12 shots, totale xG = 1.4

H2: "Why xG Matters for Predictions"
- Goals = high-variance outcome, xG = underlying performance
- Team kan 1-0 verliezen maar 2.1 xG hebben (unlucky)
- Team kan 3-0 winnen met 0.8 xG (lucky)
- Long-term, xG voorspelt future goals beter dan past goals
- Football data analysts use xG voor regression-to-mean predictions

H2: "How BetsPlug Uses xG"
- xG is één van 40+ variabelen in onze engine
- Recent xG trend (last 5-10 matches) gewogen sterker dan season average
- xG difference per match (xG for - xG against)
- Combineert met Elo ratings en Poisson models
- Link: "Read full methodology" → /methodology

H2: "Limitations of xG"
- xG models verschillen per provider
- Doesn't capture defensive errors, refereeing, weather
- Less reliable in low-shot matches (small sample)
- Doesn't predict specific scorers, alleen team-level

H2: "Expected Goals FAQ"
Q1: "What's a 'good' xG per match?"
A: "Top teams average 1.5-2.0 xG per match. Bottom teams average 
   0.8-1.2. Specific number varies by league and tactical style."

Q2: "Is xG used by professional football clubs?"
A: "Yes. Most Premier League and major European clubs employ data 
   analysts who use xG and similar metrics for tactical analysis 
   and player recruitment."

Q3: "Can I use xG to predict matches myself?"
A: "Recent xG trends are useful inputs. But xG alone isn't sufficient — 
   combine with team form, head-to-head data, and contextual factors. 
   This is why prediction engines like ours blend multiple metrics."

KEY TAKEAWAYS:
- xG measures shot quality, not just shot quantity
- xG predicts future goal-scoring better than past goals
- BetsPlug uses xG as one of 40+ variables in prediction engine
- xG has limitations — combine with other metrics for accurate analysis

RELATED ARTICLES:
- Poisson Goal Models
- Elo Rating System
- AI vs Human Tipsters

═══════════════════════════════════════════════════════
ARTIKEL 2: ELO RATING SYSTEM FOR FOOTBALL
═══════════════════════════════════════════════════════

URL: /learn/elo-rating-explained

DIFFICULTY: Intermediate
READING TIME: 10 minutes
WORD COUNT: ~2000 words

TARGET KEYWORDS
Primary: "elo rating football" / "elo rating explained"
Secondary: "football elo ratings", "elo formula", "team strength 
           rating system"

H1: "The Elo Rating System: How Football Team Strength Is Measured"

INTRO:
- Elo origin: chess (Arpad Elo, 1950s)
- Adapted for football
- Why it matters voor predictions

H2: "What is Elo Rating?"
- Numerical strength rating per team
- Default starting rating (1500)
- Updates after every match
- Higher rating = stronger team

H2: "How Elo Ratings Update"
- Formula: New_Rating = Old_Rating + K * (Actual - Expected)
- K-factor: how much one match affects rating (volatility)
- Expected: predicted result based on rating difference
- Actual: 1 (win), 0.5 (draw), 0 (loss)
- Concreet voorbeeld berekening met cijfers

H2: "Football-Specific Elo Adjustments"
- Goal difference factor (4-0 win > 1-0 win)
- Home advantage built-in
- Match importance multiplier (cup final > friendly)
- Tournament boosts (World Cup, Champions League)

H2: "Why Elo Works for Predictions"
- Recency-weighted (recent form dominates)
- Self-correcting (over-rated teams lose points)
- Captures team strength shifts (transfers, manager changes)
- Mathematically sound (no arbitrary weighting)

H2: "How BetsPlug Uses Elo"
- Per-team Elo updated after every match
- Pre-match Elo difference = baseline expected outcome
- Combined with Poisson goal models for score predictions
- ML layer adjusts Elo influence per match context

H2: "Elo Limitations"
- Slow to react to sudden squad changes (key injury, manager firing)
- Doesn't account for tactical matchups
- Equal-K-factor assumption breaks for cup matches
- Different Elo implementations give different ratings

H2: "Elo Rating FAQ"
Q1: "What's the highest Elo rating ever in football?"
A: "Around 2200, achieved by historic Brazilian and Spanish national 
   teams. Top club teams typically peak around 2050-2100."

Q2: "How fast does an Elo rating change?"
A: "Depends on K-factor. Typical football K is 20-30, meaning a major 
   upset shifts ratings by 15-25 points. Sustained form moves ratings 
   100+ points over a season."

Q3: "Can I check Elo ratings for my team?"
A: "Several public sites publish football Elo ratings (clubelo.com, 
   eloratings.net). BetsPlug uses our own Elo implementation tuned 
   for prediction accuracy."

KEY TAKEAWAYS, RELATED ARTICLES, etc.

═══════════════════════════════════════════════════════
ARTIKEL 3: POISSON GOAL MODELS
═══════════════════════════════════════════════════════

URL: /learn/poisson-goal-models

DIFFICULTY: Intermediate
READING TIME: 12 minutes
WORD COUNT: ~2200 words

TARGET KEYWORDS
Primary: "poisson distribution football" / "poisson goal model"
Secondary: "football score probability", "goal expectancy formula", 
           "dixon coles model"

H1: "Poisson Goal Models: Predicting Football Scores Mathematically"

INTRO:
- Wat is Poisson distribution
- Football als Poisson process
- Wat lezer leert

H2: "What is the Poisson Distribution?"
- Mathematical definition (simplified)
- Use cases beyond football (call center calls, radioactive decay)
- Why it fits football: discrete events (goals) in fixed time (90 min)

H2: "Applying Poisson to Football"
- Each team has expected goal rate (lambda)
- Lambda derived from attacking strength × opponent defensive weakness
- Probability matrix: alle mogelijke scores en hun probability
- Voorbeeld: Bayern (lambda 2.4) vs Frankfurt (lambda 0.9)

H2: "Calculating Score Probabilities"
- Formule (vereenvoudigd voor leesbaarheid):
  P(home goals = h) = (e^-λh × λh^h) / h!
- Voor elke combinatie h-a, multiply probabilities
- Sum over outcomes for markets (Over 2.5, BTTS, etc.)
- Voorbeeld berekening met visualisatie

H2: "The Dixon-Coles Adjustment"
- Pure Poisson underestimates draws en low-scoring matches
- Dixon-Coles: adjusts probabilities for 0-0, 1-0, 0-1, 1-1
- Why: real football has more draws than pure Poisson suggests
- Most modern prediction engines use Dixon-Coles or similar

H2: "What Poisson Predicts Well"
- Over/Under markets (sterk)
- BTTS markets (sterk)
- Most likely scores (1X2 directly correlates)
- Long-term goal totals per team

H2: "What Poisson Doesn't Predict"
- Specific scorers
- Match events (red cards, penalties)
- Tactical patterns mid-match
- Extreme low-probability outcomes (specific 4-3 score)

H2: "How BetsPlug Uses Poisson"
- Lambda calculated from current Elo + recent xG + lineup strength
- Dixon-Coles adjusted probability matrix
- Output: probabilities for all major markets
- Combined with Elo and ML for final prediction

H2: "Poisson FAQ"
(3-4 vragen)

KEY TAKEAWAYS, RELATED ARTICLES

═══════════════════════════════════════════════════════
ARTIKEL 4: WHAT IS VALUE BETTING?
═══════════════════════════════════════════════════════

URL: /learn/what-is-value-betting

DIFFICULTY: Beginner
READING TIME: 9 minutes
WORD COUNT: ~1700 words

TARGET KEYWORDS
Primary: "value betting" / "what is value betting"
Secondary: "positive expected value betting", "EV betting", 
           "value bets football"

H1: "What is Value Betting? The Math of Long-Term Profit"

INTRO:
- Probleem: most bettors verliezen lang termijn
- Value betting als enige solution
- Waarom math, niet hunches

H2: "What is Value?"
- Definition: bet has positive expected value (EV)
- Formula: EV = (probability × payout) - stake
- Voorbeeld: 50% probability of winning at 2.20 odds = +0.10 EV per €1
- Negatief EV: 50% probability at 1.80 odds = -0.10 EV per €1

H2: "Why Value Beats Picking Winners"
- Picking winners alone isn't enough
- Need ODDS to be wrong in your favor
- Long-term, only positive EV bets profit
- Bookmaker margin (juice) makes most bets negative EV

H2: "How to Identify Value"
- Step 1: estimate true probability of outcome
- Step 2: compare to implied probability from odds
- Step 3: bet only when your estimate > implied
- Voorbeeld walkthrough

H2: "The Bookmaker's Edge"
- How bookmakers price odds
- Built-in margin (typically 5-10% on football)
- Why beating bookmakers requires consistent edge
- Why most bettors lose

H2: "Value Betting Mistakes"
- Confidence ≠ value (kan gelijk hebben en geen value)
- Over-confidence in own probability estimates
- Chasing big odds (long-shot value bets)
- Ignoring sample size

H2: "How BetsPlug Helps Find Value"
- AI-generated probability estimates (more rigorous than human)
- Compare to bookmaker odds for value identification
- Confidence percentage = our probability estimate
- Subscribers can see implied vs our probability

H2: "Value Betting FAQ"
(3-4 vragen)

KEY TAKEAWAYS, RELATED ARTICLES

═══════════════════════════════════════════════════════
ARTIKEL 5: THE KELLY CRITERION
═══════════════════════════════════════════════════════

URL: /learn/kelly-criterion

DIFFICULTY: Advanced
READING TIME: 11 minutes
WORD COUNT: ~2000 words

TARGET KEYWORDS
Primary: "kelly criterion" / "kelly formula betting"
Secondary: "optimal bet sizing", "kelly criterion calculator", 
           "fractional kelly"

H1: "The Kelly Criterion: Optimal Bet Sizing for Long-Term Growth"

INTRO:
- Probleem: de meeste bettors size bets verkeerd
- Kelly als wetenschappelijke oplossing
- Wat lezer leert

H2: "What is the Kelly Criterion?"
- Origin (John Kelly, 1956)
- Formule: f* = (bp - q) / b
- Variables uitgelegd
- Voorbeeld berekening

H2: "Why Kelly Maximizes Long-Term Growth"
- Mathematical proof (simplified)
- Compounding effects
- Comparison met flat-staking en martingale

H2: "Calculating Kelly Bet Size"
- Step-by-step walkthrough
- Voorbeeld met realistic odds
- Common mistakes in calculation

H2: "Full Kelly vs Fractional Kelly"
- Full Kelly: aggressive, hoge variance
- Half Kelly: lagere variance, slightly lower long-term return
- Quarter Kelly: most common in practice
- Trade-off explanation

H2: "When Kelly Fails"
- Inaccurate probability estimates → over-betting
- Small sample → high variance
- Closing odds different from entry odds
- Limited bankroll changes calculation

H2: "Practical Kelly Application"
- Stick to fractional Kelly (0.25-0.5)
- Update bankroll regularly
- Don't bet below ~1% of bankroll
- Track results vs predicted Kelly performance

H2: "Kelly Criterion FAQ"
(3-4 vragen)

KEY TAKEAWAYS, RELATED ARTICLES

═══════════════════════════════════════════════════════
ARTIKEL 6: BANKROLL MANAGEMENT
═══════════════════════════════════════════════════════

URL: /learn/bankroll-management

DIFFICULTY: Beginner
READING TIME: 8 minutes
WORD COUNT: ~1500 words

TARGET KEYWORDS
Primary: "bankroll management football betting" / "betting bankroll"
Secondary: "how to manage betting bankroll", "betting unit size", 
           "bankroll management strategy"

H1: "Bankroll Management: Don't Let Variance Destroy You"

INTRO:
- Probleem: variance kills bettors with poor bankroll management
- Wat goede bankroll management is
- Waarom matters

H2: "What is a Bankroll?"
- Definitie: dedicated capital voor predictions
- Separate from living expenses
- Set amount once, manage carefully

H2: "Why Variance Matters"
- Even +EV bettors hebben losing streaks
- Math van losing streaks (10 in a row gebeurt regelmatig)
- Visualization van bankroll trajectories met/zonder management

H2: "The Unit System"
- Define 1 unit as fixed % of bankroll
- Conservative: 1-2% per bet
- Standard: 2-3% per bet
- Aggressive: 3-5% per bet (alleen voor zeer high-EV bets)
- Rebalance unit size na grote moves

H2: "Common Bankroll Mistakes"
- Chasing losses (increasing bet size after losing)
- Going all-in on "sure things"
- Not separating bankroll from rest finances
- Withdrawing winnings too soon

H2: "Bankroll Management FAQ"
(3-4 vragen)

KEY TAKEAWAYS, RELATED ARTICLES

═══════════════════════════════════════════════════════
ARTIKEL 7: AI VS HUMAN TIPSTERS
═══════════════════════════════════════════════════════

URL: /learn/ai-vs-tipsters

DIFFICULTY: Intermediate
READING TIME: 10 minutes
WORD COUNT: ~1900 words

TARGET KEYWORDS
Primary: "AI vs human tipsters" / "AI football predictions accuracy"
Secondary: "are AI predictions better", "ai sports betting", 
           "machine learning football accuracy"

H1: "AI vs Human Tipsters: Where Each Excels"

INTRO:
- Wat dit artikel behandelt
- Niet "AI is altijd beter" — genuanceerd
- Wat lezer leert

H2: "Where Human Tipsters Excel"
- Insider information access (sometimes)
- Tactical match-up intuition
- Pattern recognition in unique situations
- Adaptation to ongoing events

H2: "Where Human Tipsters Fail"
- Emotional bias (fan-favorite teams)
- Cognitive biases (recency, confirmation)
- Inconsistency (good day, bad day)
- Inability to process volume

H2: "Where AI Excels"
- Consistency: same methodology every match
- Volume: process all matches, not selective coverage
- No emotional bias
- Continuous learning from data

H2: "Where AI Fails"
- Edge cases without historical precedent
- Black swan events (pandemic, major rule changes)
- Manager mid-season changes (slow adaptation)
- Local knowledge (referee tendencies, stadium issues)

H2: "The Hybrid Reality"
- Best AI systems incorporate human-engineered features
- Best human tipsters use data tools
- Pure AI vs pure human is false dichotomy
- Most modern prediction systems are hybrid

H2: "Why BetsPlug is AI-First"
- Volume requirement: 30+ leagues impossible voor humans
- Consistency requirement: same methodology every match
- Transparency requirement: deterministic, no human override
- Track record verifiability

H2: "AI Predictions FAQ"
(3-4 vragen)

KEY TAKEAWAYS, RELATED ARTICLES

═══════════════════════════════════════════════════════
CONTENT WRITING GUIDELINES
═══════════════════════════════════════════════════════

VOICE & TONE PER ARTIKEL

- Educational, not promotional
- Technical, not condescending  
- Honest about limitations
- Concrete examples > abstract concepts
- Schrijf zoals BetsPlug positioning: data-driven, transparent

SEO CONSIDERATIONS

- Target keywords in H1 + H2 (natural, not stuffed)
- Internal linking: 3-5 per artikel naar andere learn + product pages
- External linking: 1-2 naar autoritative sources (Wikipedia, 
  academic papers waar relevant)
- Image alt-text: descriptive (geen "image1.png")
- URL slugs: hyphen-separated, max 60 chars

VERTAAL OPMERKINGEN

- Engelse content schrijven eerst
- Specialistische termen (Poisson, Elo, xG, Kelly) blijven onvertaald 
  in alle locales
- Voorbeelden aanpassen naar locale context (Bundesliga voor Duitse, 
  Eredivisie voor Nederlandse, etc.)
- Math formulas universal (geen vertaling nodig)
- FAQ Q&A vertalen volledig
