/**
 * Learn pillars — evergreen educational SEO content
 * ────────────────────────────────────────────────────────────
 * Each entry powers a /learn/[slug] page. These are long-form
 * (~1200–1500 words each) handwritten deep-dives into the
 * concepts that anchor the BetsPlug model: value betting, xG,
 * Elo, Kelly, Poisson, bankroll management.
 *
 * Pillars are the internal-link targets for Phase 3 automated
 * blog posts — every blog we ship should cross-link to at
 * least one relevant pillar, which concentrates PageRank on
 * these evergreen URLs rather than spreading it across a
 * sprawling article feed.
 *
 * Content is supplied in EN + NL today; other locales fall
 * back to EN until handwritten translations land.
 */

export type LearnPillarLocale = "en" | "nl";

export type LearnPillarFaq = {
  q: string;
  a: string;
};

export type LearnPillarSection = {
  /** H2 heading for the section */
  heading: Record<LearnPillarLocale, string>;
  /** Paragraph(s) of body text */
  body: Record<LearnPillarLocale, string[]>;
};

export type LearnPillar = {
  /** URL slug under /learn/ */
  slug: string;
  /** Display title per locale */
  title: Record<LearnPillarLocale, string>;
  /** Short tagline shown under H1 */
  tagline: Record<LearnPillarLocale, string>;
  /** Page <title> per locale */
  metaTitle: Record<LearnPillarLocale, string>;
  /** Meta description per locale */
  metaDescription: Record<LearnPillarLocale, string>;
  /** Opening paragraph (intro before any H2) */
  intro: Record<LearnPillarLocale, string>;
  /** Body sections (each with its own H2) */
  sections: LearnPillarSection[];
  /** Handwritten FAQ — emitted as FAQPage JSON-LD + visible accordion */
  faqs: Record<LearnPillarLocale, LearnPillarFaq[]>;
  /** Slugs of related pillars to surface at the bottom */
  related: string[];
};

/* ── Pillars ──────────────────────────────────────────────── */

export const LEARN_PILLARS: LearnPillar[] = [
  {
    slug: "what-is-value-betting",
    title: {
      en: "What is Value Betting?",
      nl: "Wat is Value Betting?",
    },
    tagline: {
      en: "Why beating the bookmaker is about price, not prediction",
      nl: "Waarom de bookmaker verslaan om prijs gaat, niet om voorspelling",
    },
    metaTitle: {
      en: "What is Value Betting? A Complete Guide (2026) | BetsPlug",
      nl: "Wat is Value Betting? Een Complete Gids (2026) | BetsPlug",
    },
    metaDescription: {
      en: "Value betting isn't picking winners — it's spotting prices that are higher than their true probability. Full guide to EV, Kelly sizing, and real examples.",
      nl: "Value betting is geen winnaars kiezen — het is prijzen spotten die hoger zijn dan hun echte kans. Volledige gids over EV, Kelly-sizing en echte voorbeelden.",
    },
    intro: {
      en: "Value betting is the only mathematically honest way to beat a bookmaker. The idea sounds counterintuitive at first: a professional bettor does not care about picking winners. They care about whether the price on offer is higher than the true probability of the outcome. A bet at 2.50 on a coin flip is profitable in the long run, even though it loses half the time, because the fair price for a 50% coin flip is only 2.00. This is the entire game, and every other topic on this site — xG models, Elo ratings, Kelly staking, Poisson distributions — is ultimately in service of it.",
      nl: "Value betting is de enige wiskundig eerlijke manier om een bookmaker te verslaan. Het idee klinkt eerst contra-intuïtief: een professionele wedder geeft niet om het kiezen van winnaars. Hij geeft om de vraag of de aangeboden prijs hoger is dan de echte kans op de uitkomst. Een weddenschap op 2.50 op een munt is op de lange termijn winstgevend, ook al verliest hij de helft van de tijd, omdat de eerlijke prijs voor een 50% munt slechts 2.00 is. Dit is het hele spel, en elk ander onderwerp op deze site — xG-modellen, Elo-ratings, Kelly-sizing, Poisson-verdelingen — staat uiteindelijk in dienst hiervan.",
    },
    sections: [
      {
        heading: {
          en: "The expected-value formula",
          nl: "De expected-value formule",
        },
        body: {
          en: [
            "Expected value (EV) is the average amount you win or lose per unit staked, assuming the bet is repeated many times. The formula is simple: EV = (probability of winning × profit on win) − (probability of losing × stake). For a 10-unit bet at 2.50 on a true 50% outcome: EV = (0.50 × 15) − (0.50 × 10) = 7.50 − 5.00 = +2.50 per 10 staked, or +25% yield.",
            "Any bet with positive EV is worth making in the long run, regardless of whether it wins or loses on the day. Any bet with negative EV is worth avoiding, even if it's a near-certainty. A 1.01 bet on a match between a Premier League team and a pub side has a negative EV if the true probability of the big side winning is below 99%, which it often is in friendlies and cup upsets.",
            "The catch is that you never know the true probability — only an estimate. Everything that follows in value betting is about closing the gap between your estimate and reality while keeping your model honest.",
          ],
          nl: [
            "Expected value (EV) is het gemiddelde bedrag dat je wint of verliest per eenheid inzet, aangenomen dat je de weddenschap vele malen herhaalt. De formule is simpel: EV = (winstkans × winst bij winst) − (verlieskans × stake). Voor een 10-eenheids weddenschap op 2.50 met een echte 50% uitkomst: EV = (0.50 × 15) − (0.50 × 10) = 7.50 − 5.00 = +2.50 per 10 ingezet, ofwel +25% rendement.",
            "Elke weddenschap met positieve EV is op de lange termijn de moeite waard, ongeacht of hij op de dag zelf wint of verliest. Elke weddenschap met negatieve EV moet je vermijden, zelfs als hij bijna zeker is. Een 1.01-weddenschap tussen een Premier League-club en een pub-ploeg heeft negatieve EV als de echte kans op winst voor de grote club onder 99% ligt, wat in vriendschappelijke wedstrijden en cupshocks vaak het geval is.",
            "De vangst is dat je de echte kans nooit kent — alleen een schatting. Alles wat volgt in value betting draait om het dichten van de kloof tussen je schatting en de werkelijkheid zonder je model oneerlijk te maken.",
          ],
        },
      },
      {
        heading: {
          en: "Odds, implied probability and the overround",
          nl: "Odds, impliciete kans en het overround",
        },
        body: {
          en: [
            "Any decimal odd can be converted into an implied probability by dividing 1 by the price. A 2.00 price implies 50%, a 1.50 price implies 66.67%, a 5.00 price implies 20%. A bookmaker sets their prices so that the implied probabilities across all outcomes in a market add up to more than 100% — the excess is their margin, known as the overround.",
            "For a three-way 1X2 market with fair odds of 2.00 / 3.50 / 4.00, the fair implied probabilities sum to 50% + 28.57% + 25% = 103.57%. That 3.57% is the bookmaker's edge — the price you pay to be allowed to bet. Sharp books operate on ~2% margins; recreational books often run 6–8%. The higher the overround, the harder it is to find value, because the baseline implied probabilities are further from the true numbers.",
            "The first lesson of value betting is simply shopping for better prices. Two sportsbooks quoting the same match at 2.00 and 2.15 for the same pick is the difference between -2% yield and +6% yield on a bet where you were convinced the 50% probability was accurate. This is why closing-line value (CLV) tracking is so important — more on that in a later pillar.",
          ],
          nl: [
            "Elke decimale odds kun je omzetten naar een impliciete kans door 1 te delen door de prijs. Een prijs van 2.00 impliceert 50%, 1.50 impliceert 66.67%, 5.00 impliceert 20%. Een bookmaker zet zijn prijzen zo dat de impliciete kansen over alle uitkomsten in een markt samen meer dan 100% opleveren — het overschot is zijn marge, bekend als de overround.",
            "Voor een driewegmarkt met eerlijke odds van 2.00 / 3.50 / 4.00 is de som van de eerlijke impliciete kansen 50% + 28.57% + 25% = 103.57%. Die 3.57% is de edge van de bookmaker — de prijs die je betaalt om überhaupt te mogen wedden. Scherpe boeken draaien op ~2% marges; recreatieve boeken vaak 6–8%. Hoe hoger de overround, hoe moeilijker value te vinden is, omdat de basis-impliciete kansen verder van de echte getallen af zitten.",
            "De eerste les van value betting is simpelweg winkelen voor betere prijzen. Twee bookmakers die dezelfde wedstrijd quoten op 2.00 en 2.15 voor dezelfde pick is het verschil tussen -2% en +6% yield op een weddenschap waar je overtuigd was dat de 50%-kans klopte. Daarom is closing-line value (CLV) tracking zo belangrijk — meer daarover in een latere pijler.",
          ],
        },
      },
      {
        heading: {
          en: "Where does your edge come from?",
          nl: "Waar komt je edge vandaan?",
        },
        body: {
          en: [
            "Your edge — the gap between the true probability and the bookmaker's implied probability — comes from one of three places: a better model, a faster information loop, or a softer market. Most recreational bettors try the first and fail because their models aren't rigorous enough to beat the combined research of a professional trading desk. The second requires either inside information (illegal and unethical) or an extremely fast data pipeline that most people don't have.",
            "The third is the most realistic path for an individual. Soft markets are ones where the bookmaker's price is based less on a sharp model and more on what the crowd bets. Low-profile leagues, second-tier competitions, early-season fixtures and niche markets (corners, cards, specific player props) are all softer than the Premier League 1X2. A decent model applied to a soft market can generate meaningful yield even with consumer-grade tools.",
            "BetsPlug sits in the first category — we invest in model quality so casual users can borrow that edge without building it themselves. Our ensemble combines four independent models plus a calibration layer, trained on every match from five top leagues. The goal isn't to give you a guaranteed winner; it's to give you a probability estimate that is, on average, more accurate than the implied probability baked into the consumer-book price.",
          ],
          nl: [
            "Je edge — het gat tussen de echte kans en de impliciete kans van de bookmaker — komt uit één van drie plekken: een beter model, een snellere informatielus of een zachtere markt. De meeste recreatieve spelers proberen het eerste en falen omdat hun modellen niet rigoureus genoeg zijn om de gecombineerde research van een professionele trading desk te verslaan. Het tweede vereist insider-informatie (illegaal en onethisch) of een extreem snelle datapijplijn die de meeste mensen niet hebben.",
            "Het derde is het meest realistische pad voor een individu. Zachte markten zijn markten waar de prijs van de bookmaker minder gebaseerd is op een scherp model en meer op wat het publiek inzet. Lagere competities, tweederangstoernooien, vroeg-seizoenswedstrijden en niche-markten (corners, kaarten, specifieke speler-props) zijn allemaal zachter dan de Premier League 1X2. Een redelijk model toegepast op een zachte markt kan zinvolle yield genereren, zelfs met consumenten-tools.",
            "BetsPlug zit in de eerste categorie — we investeren in modelkwaliteit zodat casual gebruikers die edge kunnen lenen zonder hem zelf te hoeven bouwen. Ons ensemble combineert vier onafhankelijke modellen plus een kalibratielaag, getraind op elke wedstrijd uit vijf topcompetities. Het doel is niet om je een gegarandeerde winnaar te geven; het doel is een kansschatting die gemiddeld accurater is dan de impliciete kans in de consumentenprijs.",
          ],
        },
      },
      {
        heading: {
          en: "Variance, sample size and the long run",
          nl: "Variance, sample size en de lange termijn",
        },
        body: {
          en: [
            "The biggest psychological barrier to value betting isn't the math — it's variance. Even a bettor with a consistent 5% edge will have losing weeks, losing months, and occasionally losing quarters. The distribution of returns is wide enough that you need roughly 300 bets to be 95% confident your edge is real, and 1000 bets before variance stops dominating the picture.",
            "Most people don't last that long. They scale up stakes after a hot run, scale down (or stop) after a cold run, and never give their edge the sample size it needs to express itself. The professional answer is flat staking (or disciplined Kelly — see the Kelly pillar) combined with a bankroll sized to survive drawdowns without emotional cascades.",
            "BetsPlug's published track record deliberately covers multiple seasons, not a hot streak. You'll see cold periods in our history — that's the nature of the game. What matters is whether the long-run yield stays positive after you account for the margin you paid on every bet.",
          ],
          nl: [
            "De grootste psychologische drempel bij value betting is niet de wiskunde — het is variance. Zelfs een speler met een consistente 5% edge heeft verliesweken, verliesmaanden en af en toe een verlieskwartaal. De verdeling van rendementen is breed genoeg dat je ongeveer 300 weddenschappen nodig hebt om met 95% zekerheid te kunnen zeggen dat je edge echt is, en 1000 weddenschappen voordat variance niet meer het beeld domineert.",
            "De meeste mensen houden dat niet vol. Ze verhogen hun inzetten na een hete run, verlagen (of stoppen) na een koude run, en geven hun edge nooit de sample size die hij nodig heeft om zichzelf te tonen. Het professionele antwoord is flat staking (of gedisciplineerde Kelly — zie de Kelly-pijler) in combinatie met een bankroll die groot genoeg is om drawdowns te overleven zonder emotionele cascades.",
            "De gepubliceerde track record van BetsPlug dekt opzettelijk meerdere seizoenen, niet een hete streak. Je ziet koude periodes in onze geschiedenis — dat is de aard van het spel. Wat telt is of de lange-termijn yield positief blijft nadat je de marge hebt afgetrokken die je op elke weddenschap hebt betaald.",
          ],
        },
      },
      {
        heading: {
          en: "A worked example",
          nl: "Een uitgewerkt voorbeeld",
        },
        body: {
          en: [
            "Consider a match where our ensemble estimates the home team at 54% to win, the draw at 24% and the away team at 22%. The fair odds are 1.85 / 4.17 / 4.55. A consumer book lists the match at 1.95 / 3.80 / 4.20. The home bet at 1.95 implies 51.3%, so our model says that price has an edge of 54% − 51.3% = +2.7% — a small but positive EV.",
            "The draw at 3.80 implies 26.3%, but our model only gives it 24% — a negative edge of −2.3%. The away side at 4.20 implies 23.8%, and our model gives 22% — also negative. So on this match the only value bet is the home win, at a modest +5.3% yield (after factoring in the 2.7% probability edge against the 1.95 price).",
            "This single bet doesn't matter. What matters is that we apply the same filter to every fixture, only bet when the positive-EV threshold is crossed, and let the long-run sample size deliver the yield. BetsPlug's free predictions highlight these edges without requiring you to do the arithmetic yourself — the confidence score is our shorthand for 'how comfortable is the model with this probability estimate'.",
          ],
          nl: [
            "Neem een wedstrijd waar ons ensemble de thuisploeg schat op 54% om te winnen, het gelijkspel op 24% en de uitploeg op 22%. De eerlijke odds zijn 1.85 / 4.17 / 4.55. Een consumer-boek noteert de wedstrijd op 1.95 / 3.80 / 4.20. De thuiswedstrijd op 1.95 impliceert 51.3%, dus ons model zegt dat die prijs een edge heeft van 54% − 51.3% = +2.7% — een kleine maar positieve EV.",
            "Het gelijkspel op 3.80 impliceert 26.3%, maar ons model geeft het slechts 24% — een negatieve edge van −2.3%. De uitploeg op 4.20 impliceert 23.8%, ons model geeft 22% — ook negatief. Dus op deze wedstrijd is de enige value-weddenschap de thuiswinst, op een bescheiden +5.3% yield (na verrekening van de 2.7% kans-edge tegen de 1.95-prijs).",
            "Deze ene weddenschap maakt niet uit. Wat uitmaakt is dat we hetzelfde filter op elke wedstrijd toepassen, alleen wedden als de positieve-EV drempel gehaald wordt, en de lange-termijn sample size het werk laten doen. BetsPlug's gratis voorspellingen markeren deze edges zonder dat je zelf de rekensom hoeft te maken — de confidence-score is onze afkorting voor 'hoe comfortabel is het model met deze kansschatting'.",
          ],
        },
      },
    ],
    faqs: {
      en: [
        {
          q: "Is value betting the same as predicting winners?",
          a: "No. A value bet is one where the price is higher than the true probability — it can easily be on an underdog or a draw. Predicting winners without checking the price is how most recreational bettors lose money even when they're right about results.",
        },
        {
          q: "How do I calculate my edge?",
          a: "Take your model's probability for the outcome, multiply by the decimal odds, and subtract 1. So a 55% probability at 2.00 = (0.55 × 2.00) − 1 = +10% edge. Positive = value, negative = no value.",
        },
        {
          q: "How big should my bankroll be?",
          a: "At least 100 average stakes. If you bet €10 per pick on average, hold at least €1,000 in your betting bankroll. See the bankroll management pillar for full guidance.",
        },
        {
          q: "Can I value-bet if I only use one bookmaker?",
          a: "You can, but your edge will be smaller because you can't shop for better prices. The sharper move is to hold accounts at 3–5 books and always take the highest price on any value pick.",
        },
        {
          q: "Do BetsPlug predictions come with EV numbers?",
          a: "Members see the implied probability and the ensemble's probability side by side, which is the direct input to any EV calculation. The free preview shows confidence only.",
        },
      ],
      nl: [
        {
          q: "Is value betting hetzelfde als winnaars voorspellen?",
          a: "Nee. Een value-weddenschap is er één waar de prijs hoger is dan de echte kans — dat kan makkelijk een underdog of gelijkspel zijn. Winnaars voorspellen zonder de prijs te checken is hoe de meeste recreatieve spelers geld verliezen, zelfs als ze gelijk hebben over de uitslag.",
        },
        {
          q: "Hoe bereken ik mijn edge?",
          a: "Neem de kans van je model voor de uitkomst, vermenigvuldig met de decimale odds en trek er 1 vanaf. Dus 55% kans op 2.00 = (0.55 × 2.00) − 1 = +10% edge. Positief = value, negatief = geen value.",
        },
        {
          q: "Hoe groot moet mijn bankroll zijn?",
          a: "Minstens 100 gemiddelde stakes. Als je gemiddeld €10 per pick inzet, houd dan minimaal €1.000 in je weddenschapsbankroll. Zie de bankroll management pijler voor volledige uitleg.",
        },
        {
          q: "Kan ik value betten als ik maar één bookmaker gebruik?",
          a: "Dat kan, maar je edge wordt kleiner omdat je niet voor betere prijzen kunt winkelen. De scherpere move is rekeningen aanhouden bij 3–5 bookmakers en altijd de hoogste prijs voor een value-pick pakken.",
        },
        {
          q: "Komen BetsPlug-voorspellingen met EV-getallen?",
          a: "Members zien de impliciete kans en de kans van het ensemble naast elkaar, wat de directe input is voor elke EV-berekening. De gratis preview toont alleen confidence.",
        },
      ],
    },
    related: ["kelly-criterion-guide", "bankroll-management", "expected-goals-explained"],
  },
  {
    slug: "expected-goals-explained",
    title: {
      en: "Expected Goals (xG) Explained",
      nl: "Expected Goals (xG) Uitgelegd",
    },
    tagline: {
      en: "How shot-quality modelling replaced scoreline analysis in modern football",
      nl: "Hoe shot-kwaliteit modellering scorelijn-analyse verving in het moderne voetbal",
    },
    metaTitle: {
      en: "Expected Goals (xG) Explained — Complete 2026 Guide | BetsPlug",
      nl: "Expected Goals (xG) Uitgelegd — Complete Gids 2026 | BetsPlug",
    },
    metaDescription: {
      en: "What xG actually measures, how it's calculated from shot data, why pundits argue about it, and how BetsPlug uses it inside our Poisson goal model.",
      nl: "Wat xG echt meet, hoe het wordt berekend uit shotdata, waarom analisten er ruzie over maken en hoe BetsPlug het gebruikt in ons Poisson-goalmodel.",
    },
    intro: {
      en: "Expected Goals (xG) is the most important single statistic in football analytics — and also the most misunderstood. In its simplest form, xG answers the question: given the exact situation of this shot (distance, angle, body part, whether it came from a cross, whether a defender was closing in), how often does an average player score? Add up the xG for every shot a team takes in a match and you get their expected goal total — a much more honest estimate of how well they played than the actual goal total, which is subject to woodwork, lucky deflections and goalkeeping heroics.",
      nl: "Expected Goals (xG) is de belangrijkste enkelvoudige statistiek in voetbalanalyse — en ook de meest misbegrepen. In zijn eenvoudigste vorm beantwoordt xG de vraag: gegeven de exacte situatie van dit schot (afstand, hoek, lichaamsdeel, of het uit een voorzet kwam, of een verdediger erbij was), hoe vaak scoort een gemiddelde speler? Tel de xG van elk schot dat een ploeg in een wedstrijd neemt op en je krijgt hun verwachte goaltotal — een veel eerlijker schatting van hoe goed ze speelden dan het daadwerkelijke goaltotaal, dat onderhevig is aan de lat, gelukkige afketsers en keepersheldendaden.",
    },
    sections: [
      {
        heading: {
          en: "Where xG comes from",
          nl: "Waar xG vandaan komt",
        },
        body: {
          en: [
            "The xG concept emerged in the early 2010s, popularised by analysts like Sam Green at Opta and Michael Caley at Cartilage Free Captain. The basic insight is that shots are not equally valuable: a tap-in from two yards has a ~90% scoring probability; a speculative 30-yard effort has a ~3% scoring probability. Treating every shot as a single 'shots on target' unit washes out the real signal.",
            "A modern xG model is a logistic regression (or gradient-boosted tree) trained on millions of historical shots. For each shot it ingests distance to goal, angle to goal, body part used, pass type that preceded it, number of defenders between shooter and goal, and sometimes game state (winning / losing, minute of the match). The output is a probability between 0 and 1 — that's the xG value of the shot.",
            "A team with 1.8 xG in a match is said to have generated chances worth 1.8 goals on average. If they won the match 3-0 despite only 1.2 xG, they over-performed their process; if they lost 0-1 with 2.4 xG, they under-performed. Over long samples, actual goals converge toward xG because the deviations are mostly random (keeper saves, post hits, VAR calls).",
          ],
          nl: [
            "Het xG-concept kwam op in de vroege jaren 2010, populair gemaakt door analisten als Sam Green bij Opta en Michael Caley bij Cartilage Free Captain. De basisinzicht is dat schoten niet even waardevol zijn: een inschieter van twee meter heeft ~90% scorekans; een afstandsschot van 30 meter heeft ~3% scorekans. Elk schot behandelen als één 'schoten op doel' eenheid wast het echte signaal uit.",
            "Een modern xG-model is een logistische regressie (of gradient-boosted tree) getraind op miljoenen historische schoten. Voor elk schot neemt het afstand tot het doel, hoek tot het doel, gebruikt lichaamsdeel, pass-type dat eraan voorafging, aantal verdedigers tussen schutter en doel, en soms de stand (winnend / verliezend, minuut van de wedstrijd). De output is een kans tussen 0 en 1 — dat is de xG-waarde van het schot.",
            "Een ploeg met 1.8 xG in een wedstrijd wordt gezegd gemiddeld 1.8 goals aan kansen te hebben gecreëerd. Als ze de wedstrijd 3-0 wonnen ondanks slechts 1.2 xG, overtroffen ze hun proces; als ze 0-1 verloren met 2.4 xG, bleven ze onder hun proces. Over lange samples convergeren echte goals naar xG omdat de afwijkingen grotendeels willekeurig zijn (keepers reddingen, paal, VAR-beslissingen).",
          ],
        },
      },
      {
        heading: {
          en: "Why pundits hate it (and why they're wrong)",
          nl: "Waarom analisten het haten (en waarom ze ongelijk hebben)",
        },
        body: {
          en: [
            "The most common complaint against xG is that it 'ignores context' — it treats every shot the same regardless of the pressure, the goalkeeper, the scoreline. The modern generation of models actually account for most of those factors, but the broader critique misses the point: xG is not trying to describe what happened, it's trying to describe what would happen on average if the same chances were replayed repeatedly.",
            "The other critique is that xG undervalues clinical finishing. Jamie Vardy is famously a 'Vardy of the spot' — a player who scores more than his chances suggest. But even Vardy regresses: over his best five seasons, his actual goals are 15% above his xG, not 50%. On a single-match basis the gap can look dramatic, but it shrinks fast over longer samples, which is exactly what you want from a stable modelling input.",
            "The real danger of xG is over-application. Using xG to predict next weekend's scoreline is fine; using it to predict which player will be top scorer next month requires additional shot-volume projections, penalty assignments, and rotation risk — things that the raw xG number doesn't encode. BetsPlug uses xG only for what it's designed for: estimating the Poisson lambda for each team in an upcoming fixture.",
          ],
          nl: [
            "De meest voorkomende klacht tegen xG is dat het 'context negeert' — het behandelt elk schot hetzelfde ongeacht de druk, de keeper, de stand. De moderne generatie modellen houdt eigenlijk rekening met de meeste van die factoren, maar de bredere kritiek mist het punt: xG probeert niet te beschrijven wat er gebeurde, het probeert te beschrijven wat er gemiddeld zou gebeuren als dezelfde kansen herhaaldelijk werden overgespeeld.",
            "De andere kritiek is dat xG klinisch afwerken onderwaardeert. Jamie Vardy is berucht als een 'clinical finisher' — een speler die meer scoort dan zijn kansen suggereren. Maar zelfs Vardy regresseert: over zijn beste vijf seizoenen liggen zijn echte goals 15% boven zijn xG, niet 50%. Op wedstrijdbasis kan het gat dramatisch lijken, maar het krimpt snel over langere samples, wat precies is wat je wilt van een stabiele modelinput.",
            "Het echte gevaar van xG is overtoepassing. xG gebruiken om de eindstand van komend weekend te voorspellen is prima; het gebruiken om te voorspellen wie volgende maand topscorer wordt vereist extra schotvolume-projecties, strafschoppenopdrachten en rotatierisico — dingen die het rauwe xG-getal niet vastlegt. BetsPlug gebruikt xG alleen waar het voor ontworpen is: het schatten van de Poisson-lambda voor elke ploeg in een aanstaande wedstrijd.",
          ],
        },
      },
      {
        heading: {
          en: "From xG to match prediction",
          nl: "Van xG naar wedstrijdvoorspelling",
        },
        body: {
          en: [
            "Inside our ensemble, we don't use xG as a standalone signal. We feed each team's rolling xG numbers (attacking output, defensive concessions, home/away split) into a Poisson goal model that produces a probability distribution over every possible scoreline. From there you can derive the 1X2 probabilities, Over/Under totals, BTTS probabilities and Asian handicap lines — all from the same xG-driven Poisson surface.",
            "The tricky part is deciding how many matches of xG history to weight. Too few and you overreact to small samples (a 6-shot burst from Bruno Fernandes against ten men doesn't mean United's attack is suddenly elite). Too many and you miss real form shifts (Arsenal's attacking output changed meaningfully after Ødegaard returned from injury). Our pipeline uses a rolling window that blends the last 8 matches with a long-run season-level prior, weighted by the confidence interval around the current estimate.",
            "The xG pipeline is also where we catch data problems fastest. Every week, we cross-check the xG totals from our primary data vendor against a secondary source. Matches with divergences above 0.4 xG get flagged for manual review before any downstream model consumes them. This sounds boring but it's the kind of plumbing that separates a hobbyist model from a production system.",
          ],
          nl: [
            "Binnen ons ensemble gebruiken we xG niet als stand-alone signaal. We voeden de rollende xG-cijfers van elke ploeg (aanvallende output, defensieve tegengoals, thuis/uit-verdeling) in een Poisson-goalmodel dat een kansverdeling over elke mogelijke eindstand produceert. Vanuit daar kun je de 1X2-kansen, Over/Under totals, BTTS-kansen en Asian handicap-lijnen afleiden — allemaal uit dezelfde xG-gedreven Poisson-surface.",
            "Het lastige is beslissen hoeveel wedstrijden aan xG-historie je meeweegt. Te weinig en je overreageert op kleine samples (een 6-schoten-burst van Bruno Fernandes tegen tien man betekent niet dat de aanval van United ineens elite is). Te veel en je mist echte vormverschuivingen (Arsenal's aanvallende output veranderde betekenisvol nadat Ødegaard terugkwam van blessure). Onze pijplijn gebruikt een rollend window dat de laatste 8 wedstrijden mengt met een seizoens-level long-run prior, gewogen op basis van het betrouwbaarheidsinterval rond de huidige schatting.",
            "De xG-pijplijn is ook waar we dataproblemen het snelst vangen. Elke week kruisen we de xG-totalen van onze primaire datavendor met een secundaire bron. Wedstrijden met afwijkingen boven 0.4 xG worden gemarkeerd voor handmatige controle voordat een downstream-model ze gebruikt. Dit klinkt saai maar het is precies het soort plumbing dat een hobbymodel onderscheidt van een productiesysteem.",
          ],
        },
      },
      {
        heading: {
          en: "Common xG mistakes",
          nl: "Veelgemaakte xG-fouten",
        },
        body: {
          en: [
            "Mistake one: treating xG as a guaranteed result. 'Arsenal had 2.5 xG so they should have won' is a misreading — they had a performance consistent with 2.5 average goals, but the actual distribution is wide. A team with 2.5 xG still scores zero ~8% of the time.",
            "Mistake two: comparing xG across very different data providers. StatsBomb xG, Opta xG and Understat xG all use different training sets, different feature engineering and different shot metadata, so a 1.8 xG from one provider doesn't equal a 1.8 xG from another. Always compare like with like.",
            "Mistake three: mistaking xG for a skill rating. A player with 0.5 xG per 90 minutes is not a better finisher than a player with 0.4 xG per 90 — they just get into better positions. Finishing skill shows up in the gap between expected and actual goals, which is noisy and only stabilises over thousands of shots.",
          ],
          nl: [
            "Fout één: xG behandelen als gegarandeerd resultaat. 'Arsenal had 2.5 xG dus ze hadden moeten winnen' is een verkeerde lezing — ze hadden een prestatie die consistent is met 2.5 gemiddelde goals, maar de echte verdeling is breed. Een ploeg met 2.5 xG scoort nog steeds ~8% van de tijd nul.",
            "Fout twee: xG vergelijken tussen zeer verschillende dataproviders. StatsBomb xG, Opta xG en Understat xG gebruiken allemaal verschillende trainingssets, verschillende feature engineering en verschillende shot-metadata, dus een 1.8 xG van de ene provider is niet gelijk aan 1.8 xG van een andere. Vergelijk altijd gelijkwaardige bronnen.",
            "Fout drie: xG verwarren met een vaardigheidsrating. Een speler met 0.5 xG per 90 minuten is niet een betere afmaker dan een speler met 0.4 xG per 90 — hij komt alleen in betere posities. Afrondingsvaardigheid zie je in het gat tussen verwachte en echte goals, dat ruisig is en pas stabiliseert over duizenden schoten.",
          ],
        },
      },
    ],
    faqs: {
      en: [
        {
          q: "How is xG different from 'shots on target'?",
          a: "Shots on target counts each attempt equally — a tap-in and a hopeful 30-yard effort both register as 1. xG weights each shot by its probability of becoming a goal, so a tap-in might add 0.9 xG while the long shot adds 0.03 xG.",
        },
        {
          q: "Can xG predict which team wins?",
          a: "Not on its own, but feed two teams' rolling xG numbers into a Poisson goal model and you get a probability distribution over every scoreline — including 1X2 probabilities. That's exactly what BetsPlug's Poisson head does.",
        },
        {
          q: "Which xG provider does BetsPlug use?",
          a: "We source from the football-data.org feed, cross-checked against OpenLigaDB for leagues where both are available. Matches with large divergences get flagged for manual review.",
        },
        {
          q: "Why do some matches have 'wrong' xG results?",
          a: "Short-run variance. A team can have 2.5 xG and lose 0-1 because finishing is probabilistic. Over a full season (~38 matches) actual goals track xG closely, but any individual match can diverge substantially.",
        },
        {
          q: "Does xG account for penalties?",
          a: "Most providers do — a standard penalty is assigned 0.76 xG (the historical conversion rate). BetsPlug splits penalty xG from open-play xG internally so post-match xG totals reflect the real shot-quality picture.",
        },
      ],
      nl: [
        {
          q: "Hoe verschilt xG van 'schoten op doel'?",
          a: "Schoten op doel telt elke poging even zwaar — een inschieter en een hoopvol afstandsschot tellen beide als 1. xG weegt elk schot op basis van zijn scorekans, dus een inschieter kan 0.9 xG toevoegen terwijl het afstandsschot 0.03 xG toevoegt.",
        },
        {
          q: "Kan xG voorspellen welk team wint?",
          a: "Niet op zichzelf, maar voed de rollende xG-cijfers van twee ploegen in een Poisson-goalmodel en je krijgt een kansverdeling over elke eindstand — inclusief 1X2-kansen. Dat is precies wat het Poisson-onderdeel van BetsPlug doet.",
        },
        {
          q: "Welke xG-provider gebruikt BetsPlug?",
          a: "We halen data van football-data.org, kruiselings gecheckt met OpenLigaDB voor competities waar beide beschikbaar zijn. Wedstrijden met grote afwijkingen worden gemarkeerd voor handmatige controle.",
        },
        {
          q: "Waarom hebben sommige wedstrijden 'verkeerde' xG-resultaten?",
          a: "Korte-termijn variance. Een ploeg kan 2.5 xG hebben en 0-1 verliezen omdat afmaken probabilistisch is. Over een volledig seizoen (~38 wedstrijden) volgen echte goals xG nauw, maar individuele wedstrijden kunnen substantieel afwijken.",
        },
        {
          q: "Neemt xG strafschoppen mee?",
          a: "De meeste providers wel — een standaard strafschop krijgt 0.76 xG toegewezen (het historische conversiepercentage). BetsPlug splitst strafschop-xG intern van open-spel-xG zodat post-match xG-totalen het echte shot-kwaliteitsbeeld weerspiegelen.",
        },
      ],
    },
    related: ["poisson-goal-models", "what-is-value-betting", "elo-rating-explained"],
  },
  {
    slug: "elo-rating-explained",
    title: {
      en: "Elo Rating Explained",
      nl: "Elo Rating Uitgelegd",
    },
    tagline: {
      en: "From chess to football — how a 60-year-old algorithm still anchors modern models",
      nl: "Van schaken tot voetbal — hoe een 60 jaar oud algoritme nog steeds moderne modellen verankert",
    },
    metaTitle: {
      en: "Elo Rating Explained (Chess & Football) | BetsPlug",
      nl: "Elo Rating Uitgelegd (Schaken & Voetbal) | BetsPlug",
    },
    metaDescription: {
      en: "How the Elo rating system works, why it's such a strong baseline for football prediction, and the modifications BetsPlug uses inside our ensemble.",
      nl: "Hoe het Elo-ratingsysteem werkt, waarom het zo'n sterke baseline is voor voetbalvoorspelling en welke aanpassingen BetsPlug in ons ensemble gebruikt.",
    },
    intro: {
      en: "The Elo rating system was invented in 1960 by the Hungarian-American physicist Árpád Élő to rank chess players, and it has quietly become the backbone of sports analytics for every game where two opponents face off. The elegance of Elo is that it is self-correcting: each team starts with an arbitrary rating, wins gain points, losses lose points, and the number of points exchanged depends on the gap between the two ratings at the time of the match. Over enough games, the ratings converge to a stable estimate of each team's true strength.",
      nl: "Het Elo-ratingsysteem werd in 1960 uitgevonden door de Hongaars-Amerikaanse natuurkundige Árpád Élő om schakers te rangschikken, en het is stilletjes de ruggengraat geworden van sportanalytics voor elk spel waar twee tegenstanders tegen elkaar staan. De elegantie van Elo is dat het zelfcorrigerend is: elke ploeg begint met een willekeurige rating, winsten leveren punten op, verliezen kosten punten, en het aantal uitgewisselde punten hangt af van het verschil tussen de twee ratings op het moment van de wedstrijd. Over voldoende wedstrijden convergeren de ratings naar een stabiele schatting van de echte sterkte van elke ploeg.",
    },
    sections: [
      {
        heading: {
          en: "The Elo formula",
          nl: "De Elo-formule",
        },
        body: {
          en: [
            "The core of Elo is a single equation. Given two teams with ratings RA and RB, the expected score for team A is EA = 1 / (1 + 10^((RB − RA)/400)). A team with a rating 100 points higher than their opponent is expected to win ~64% of the time; 200 points higher implies ~76%; 400 points higher implies ~91%. These are the same odds ratios that apply to chess, checkers, tennis and football — the algorithm is sport-agnostic.",
            "After the match, each team's rating updates by K × (S − E), where S is the actual score (1 for a win, 0.5 for a draw, 0 for a loss) and K is a constant that controls how fast the ratings move. In chess, K is typically 10–40; in football, most public Elo implementations use K = 20 for regular matches and K = 30 for high-stakes matches (finals, derbies).",
            "The net effect is that an upset (a low-rated team beating a high-rated team) moves ratings dramatically, while a predictable result barely moves them. Over time, the ratings settle on values that accurately reflect each team's long-run strength — without anyone needing to hand-code assumptions about 'form' or 'class'.",
          ],
          nl: [
            "De kern van Elo is één enkele vergelijking. Gegeven twee ploegen met ratings RA en RB is de verwachte score voor ploeg A: EA = 1 / (1 + 10^((RB − RA)/400)). Een ploeg met een rating van 100 punten hoger dan de tegenstander wordt verwacht ~64% van de tijd te winnen; 200 punten hoger impliceert ~76%; 400 punten hoger impliceert ~91%. Dit zijn dezelfde kansratio's die gelden voor schaken, dammen, tennis en voetbal — het algoritme is sportonafhankelijk.",
            "Na de wedstrijd updaten beide ratings met K × (S − E), waarbij S de daadwerkelijke score is (1 voor winst, 0.5 voor gelijk, 0 voor verlies) en K een constante is die regelt hoe snel ratings bewegen. In schaken is K doorgaans 10–40; in voetbal gebruiken de meeste publieke Elo-implementaties K = 20 voor reguliere wedstrijden en K = 30 voor hoogwaardige wedstrijden (finales, derby's).",
            "Het netto-effect is dat een verrassing (een laaggewaardeerde ploeg die een hooggewaardeerde verslaat) ratings dramatisch verschuift, terwijl een voorspelbare uitslag ze nauwelijks beweegt. Na verloop van tijd nestelen de ratings zich op waardes die nauwkeurig de lange-termijn sterkte weerspiegelen — zonder dat iemand aannames over 'vorm' of 'klasse' hoeft te coderen.",
          ],
        },
      },
      {
        heading: {
          en: "Football-specific adjustments",
          nl: "Voetbalspecifieke aanpassingen",
        },
        body: {
          en: [
            "Vanilla Elo treats every match the same, but football has features that the original algorithm doesn't capture. The first is home advantage: on average across Europe's top five leagues, home sides win ~45% of matches, draws are ~25%, away wins are ~30%. A neutral Elo would underrate home sides and overrate away sides unless you bolt on a fixed home bonus (typically +80–100 Elo points) before computing the expected score.",
            "The second is goal difference: Elo rewards a 1-0 win the same as a 6-0 win, which misses real strength information. Most football Elo systems use a goal-difference multiplier on the K factor — a 3-goal win moves the rating roughly twice as much as a 1-goal win. The exact multiplier is tuned empirically to maximise out-of-sample prediction accuracy.",
            "The third is competition tier: a Premier League win should be worth more rating points than a League One win, because the opposition is stronger. Cross-league Elo systems (FiveThirtyEight's SPI, the ClubElo project) solve this by having teams play each other occasionally in European competition and letting the ratings converge organically. BetsPlug extends this with a separate Champions League calibration head, because knockout football has different characteristics than domestic league play.",
          ],
          nl: [
            "Vanilla Elo behandelt elke wedstrijd hetzelfde, maar voetbal heeft eigenschappen die het oorspronkelijke algoritme niet vangt. De eerste is thuisvoordeel: gemiddeld over de top-vijf competities in Europa winnen thuisploegen ~45% van de wedstrijden, gelijkspellen zijn ~25%, uitwinsten ~30%. Een neutrale Elo zou thuisploegen onderwaarderen en uitploegen overwaarderen, tenzij je een vaste thuisbonus (meestal +80–100 Elo-punten) toevoegt voordat je de verwachte score berekent.",
            "Het tweede is doelsaldo: Elo beloont een 1-0 winst hetzelfde als een 6-0 winst, wat echte sterkte-informatie mist. De meeste voetbal-Elo-systemen gebruiken een doelsaldo-vermenigvuldiger op de K-factor — een 3-goals winst verschuift de rating ongeveer twee keer zoveel als een 1-goal winst. De exacte vermenigvuldiger wordt empirisch afgesteld om de out-of-sample voorspelnauwkeurigheid te maximaliseren.",
            "Het derde is competitieniveau: een Premier League-winst moet meer ratingpunten waard zijn dan een League One-winst, omdat de tegenstand sterker is. Cross-league Elo-systemen (FiveThirtyEight's SPI, het ClubElo-project) lossen dit op door ploegen af en toe tegen elkaar te laten spelen in Europese competitie en de ratings organisch te laten convergeren. BetsPlug breidt dit uit met een aparte Champions League kalibratie-kop, omdat knock-outvoetbal andere eigenschappen heeft dan nationale competitie.",
          ],
        },
      },
      {
        heading: {
          en: "Why Elo works so well as a baseline",
          nl: "Waarom Elo zo goed werkt als baseline",
        },
        body: {
          en: [
            "Elo's biggest strength is that it captures long-run team strength without needing any domain knowledge beyond match results. A well-tuned Elo model on the Premier League will pick the right favourite ~70% of the time using nothing but historical results — no xG, no tactical analysis, no injury data. That's a remarkably strong baseline for a one-parameter (K) model.",
            "The weakness is that it reacts slowly to changes that haven't yet shown up in results. When a top team loses their star striker to injury, Elo doesn't know; it only adjusts once the team starts losing matches they would previously have won. This is why modern ensembles combine Elo with faster signals like xG (which reacts within a single match) and logistic regression on injury reports (which reacts immediately when news breaks).",
            "Inside BetsPlug's ensemble, Elo is the slow-moving anchor. When the other models disagree — one says the home team is a huge favourite, another says it's close to 50/50 — Elo's rating gap acts as the tiebreaker, because it has the longest memory and is least influenced by recent flukes. The final ensemble output tends to match the Elo lean on long-run fixtures and drift away from it only when the faster signals are confidently saying something different.",
          ],
          nl: [
            "De grootste kracht van Elo is dat het lange-termijn ploegsterkte vangt zonder domeinkennis nodig te hebben buiten wedstrijduitslagen. Een goed afgesteld Elo-model op de Premier League kiest de juiste favoriet ~70% van de tijd met alleen historische resultaten — geen xG, geen tactische analyse, geen blessuredata. Dat is een opmerkelijk sterke baseline voor een één-parameter (K) model.",
            "De zwakte is dat het langzaam reageert op veranderingen die nog niet in resultaten zichtbaar zijn. Als een topclub zijn sterspits verliest door blessure, weet Elo dat niet; het past pas aan als de ploeg wedstrijden begint te verliezen die ze eerder zouden hebben gewonnen. Daarom combineren moderne ensembles Elo met snellere signalen zoals xG (dat binnen één wedstrijd reageert) en logistische regressie op blessurerapporten (dat direct reageert zodra het nieuws uitkomt).",
            "Binnen het BetsPlug-ensemble is Elo het traag bewegende anker. Wanneer de andere modellen het oneens zijn — de ene zegt dat de thuisploeg een grote favoriet is, de andere zegt dat het dicht bij 50/50 ligt — fungeert de Elo-ratingkloof als scheidsrechter, omdat het het langste geheugen heeft en het minst beïnvloed wordt door recente toevalligheden. De uiteindelijke ensemble-output neigt naar de Elo-lean op lange-termijn wedstrijden en wijkt er alleen van af wanneer de snellere signalen zelfverzekerd iets anders zeggen.",
          ],
        },
      },
      {
        heading: {
          en: "Elo vs market odds",
          nl: "Elo versus marktodds",
        },
        body: {
          en: [
            "A fun experiment: run a simple Elo model on Premier League results from 2010 onward, then compare its predictions to the closing bookmaker odds. You'll find that the Elo lean matches the book's favourite about 75% of the time, and the cases where they diverge are the most interesting. Sometimes the book knows something Elo doesn't (a key injury, a tactical shift). Sometimes Elo is right and the book is wrong because the market is overreacting to a recent hot streak.",
            "The gap between Elo and market odds is a rudimentary value signal — if Elo thinks the home team should be 1.90 and the book is offering 2.30, that's a potential edge of ~20%. But blindly trusting Elo is dangerous: the book's line incorporates information Elo doesn't have, and betting every Elo-disagreeing fixture would expose you to the worst cases in the dataset.",
            "BetsPlug's production use of Elo is to compare it against the market-implied probability and use that delta as one input into the meta-model. Large deltas get flagged; small deltas get trusted. This is more honest than taking Elo at face value and more data-driven than taking the market at face value.",
          ],
          nl: [
            "Een leuk experiment: draai een simpel Elo-model op Premier League-resultaten vanaf 2010 en vergelijk de voorspellingen met de closing-odds van de bookmaker. Je ziet dat de Elo-lean ~75% van de tijd overeenkomt met de favoriet van het boek, en de gevallen waarin ze verschillen zijn het meest interessant. Soms weet het boek iets wat Elo niet weet (een belangrijke blessure, een tactische verschuiving). Soms heeft Elo gelijk en het boek niet, omdat de markt overreageert op een recente hete reeks.",
            "Het verschil tussen Elo en marktodds is een rudimentair value-signaal — als Elo denkt dat de thuisploeg op 1.90 zou moeten staan en het boek biedt 2.30, dan is dat een potentiële edge van ~20%. Maar blindelings vertrouwen op Elo is gevaarlijk: de lijn van het boek bevat informatie die Elo niet heeft, en elke Elo-afwijkende wedstrijd inzetten stelt je bloot aan de slechtste gevallen in de dataset.",
            "BetsPlug's productiegebruik van Elo is om het te vergelijken met de markt-impliciete kans en dat delta als één input in het meta-model te gebruiken. Grote delta's worden gemarkeerd; kleine delta's worden vertrouwd. Dit is eerlijker dan Elo voor waar aannemen en meer datagedreven dan de markt voor waar aannemen.",
          ],
        },
      },
    ],
    faqs: {
      en: [
        {
          q: "Where does the number 400 in the Elo formula come from?",
          a: "It's a scaling constant chosen so that a 400-point rating gap corresponds to a 91% expected win rate. It's arbitrary — if you used a different constant, you'd just rescale all the ratings. Most chess and football implementations use 400 for historical consistency.",
        },
        {
          q: "How often does BetsPlug update Elo ratings?",
          a: "After every match. The rating update runs as part of our post-match pipeline and flows into the next round of predictions within minutes of the final whistle.",
        },
        {
          q: "Can Elo predict draws?",
          a: "Not directly. Vanilla Elo only outputs an expected score for one team (between 0 and 1). To get explicit draw probability you either map the expected score through a trained draw-rate curve or feed the Elo gap into a Poisson model. BetsPlug does the latter inside its ensemble.",
        },
        {
          q: "What's the highest Elo rating any football club has ever had?",
          a: "Club-level Elo (via ClubElo.com) has peaked around 2100–2150 for teams like prime Barcelona (2011), Bayern Munich (2013), and Manchester City (2018). Anything above 2000 is elite.",
        },
        {
          q: "Does Elo work for international tournaments?",
          a: "Yes, but with caveats. National teams play fewer matches, so their ratings take longer to converge and are more vulnerable to small-sample noise. The World Football Elo Ratings project maintains national-team Elo scores using adjusted K factors.",
        },
      ],
      nl: [
        {
          q: "Waar komt het getal 400 in de Elo-formule vandaan?",
          a: "Het is een schaalconstante gekozen zodat een rating-kloof van 400 punten overeenkomt met een verwachte winstkans van 91%. Het is arbitrair — als je een andere constante gebruikt, herschaal je gewoon alle ratings. De meeste schaak- en voetbalimplementaties gebruiken 400 voor historische consistentie.",
        },
        {
          q: "Hoe vaak update BetsPlug de Elo-ratings?",
          a: "Na elke wedstrijd. De rating-update draait als onderdeel van onze post-match pijplijn en stroomt binnen minuten na het laatste fluitsignaal door naar de volgende voorspellingsronde.",
        },
        {
          q: "Kan Elo gelijkspellen voorspellen?",
          a: "Niet direct. Vanilla Elo geeft alleen een verwachte score voor één ploeg (tussen 0 en 1). Om expliciete gelijkspelkans te krijgen, map je de verwachte score via een getrainde draw-rate curve of voed je het Elo-gat in een Poisson-model. BetsPlug doet het laatste binnen zijn ensemble.",
        },
        {
          q: "Wat is de hoogste Elo-rating die een voetbalclub ooit heeft gehad?",
          a: "Club-level Elo (via ClubElo.com) heeft gepiekt rond 2100–2150 voor ploegen als prime Barcelona (2011), Bayern München (2013) en Manchester City (2018). Alles boven 2000 is elite.",
        },
        {
          q: "Werkt Elo voor internationale toernooien?",
          a: "Ja, maar met kanttekeningen. Nationale ploegen spelen minder wedstrijden, dus hun ratings convergeren langzamer en zijn kwetsbaarder voor small-sample ruis. Het World Football Elo Ratings project onderhoudt nationale-team Elo-scores met aangepaste K-factoren.",
        },
      ],
    },
    related: ["what-is-value-betting", "poisson-goal-models", "expected-goals-explained"],
  },
  {
    slug: "kelly-criterion-guide",
    title: {
      en: "The Kelly Criterion Guide",
      nl: "De Kelly Criterion Gids",
    },
    tagline: {
      en: "Optimal bet sizing, explained without the calculus",
      nl: "Optimale inzet-sizing, uitgelegd zonder de calculus",
    },
    metaTitle: {
      en: "Kelly Criterion Guide — Optimal Bet Sizing 2026 | BetsPlug",
      nl: "Kelly Criterion Gids — Optimale Bet Sizing 2026 | BetsPlug",
    },
    metaDescription: {
      en: "How the Kelly Criterion calculates optimal stakes, why full Kelly is too aggressive, and the fractional-Kelly sizing BetsPlug uses in member tools.",
      nl: "Hoe het Kelly Criterion optimale stakes berekent, waarom full Kelly te agressief is en de fractional-Kelly sizing die BetsPlug in member-tools gebruikt.",
    },
    intro: {
      en: "The Kelly Criterion is a stake-sizing formula derived by information theorist John Kelly in 1956, originally to maximise the long-run growth rate of wealth in repeated independent gambles with known edge. It's the only mathematically optimal answer to the question 'how much should I bet?' — but it's also famously aggressive, and the gap between the theory and the practical reality of sports betting is where most people get burned. This guide explains the formula, the intuition behind it, and why professional bettors almost always size at some fraction of full Kelly.",
      nl: "Het Kelly Criterion is een stake-sizing formule die werd afgeleid door informatietheoreticus John Kelly in 1956, oorspronkelijk om de lange-termijn groeisnelheid van vermogen te maximaliseren in herhaalde onafhankelijke gokken met bekende edge. Het is het enige wiskundig optimale antwoord op de vraag 'hoeveel moet ik inzetten?' — maar het is ook berucht agressief, en het gat tussen de theorie en de praktische realiteit van sportweddenschappen is waar de meeste mensen zich branden. Deze gids legt de formule uit, de intuïtie erachter, en waarom professionele spelers bijna altijd op een fractie van volle Kelly inzetten.",
    },
    sections: [
      {
        heading: {
          en: "The formula",
          nl: "De formule",
        },
        body: {
          en: [
            "For a bet with decimal odds O and true probability p of winning, the Kelly fraction is f = (p × (O − 1) − (1 − p)) / (O − 1). In words: 'edge divided by odds-minus-one'. For a bet at 2.00 with a true probability of 55%, Kelly says stake f = (0.55 × 1 − 0.45) / 1 = 0.10, or 10% of your bankroll. That's an aggressive number — most recreational bettors are horrified by it.",
            "The formula scales naturally: a smaller edge produces a smaller stake. A 52% probability at 2.00 gives f = 0.04 (4% of bankroll). A 65% probability at 2.00 gives f = 0.30 (30% of bankroll — terrifying). A 51% probability at 2.00 gives f = 0.02. And any negative-edge bet gives a negative f, which Kelly correctly interprets as 'don't bet'.",
            "The mathematical guarantee is that no other sizing strategy beats Kelly in the long run for maximising compound growth. Flat staking underperforms Kelly asymptotically; doubling up after losses (Martingale) dramatically underperforms and eventually bankrupts you. Kelly is provably optimal — under the assumption that you know your true edge, which is where the practical problems start.",
          ],
          nl: [
            "Voor een weddenschap met decimale odds O en echte winstkans p is de Kelly-fractie f = (p × (O − 1) − (1 − p)) / (O − 1). In woorden: 'edge gedeeld door odds-min-één'. Voor een weddenschap op 2.00 met een echte kans van 55% zegt Kelly stake f = (0.55 × 1 − 0.45) / 1 = 0.10, ofwel 10% van je bankroll. Dat is een agressief getal — de meeste recreatieve spelers zijn er ontsteld over.",
            "De formule schaalt natuurlijk: een kleinere edge geeft een kleinere inzet. Een 52%-kans op 2.00 geeft f = 0.04 (4% van de bankroll). Een 65%-kans op 2.00 geeft f = 0.30 (30% van de bankroll — angstaanjagend). Een 51%-kans op 2.00 geeft f = 0.02. En elke negatieve-edge weddenschap geeft een negatieve f, die Kelly correct interpreteert als 'niet wedden'.",
            "De wiskundige garantie is dat geen enkele andere sizing-strategie Kelly op de lange termijn verslaat voor het maximaliseren van compounded groei. Flat staking presteert asymptotisch slechter dan Kelly; verdubbelen na verliezen (Martingale) presteert dramatisch slechter en leidt uiteindelijk tot bankroet. Kelly is aantoonbaar optimaal — onder de aanname dat je je echte edge kent, en daar beginnen de praktische problemen.",
          ],
        },
      },
      {
        heading: {
          en: "Why full Kelly is too aggressive in practice",
          nl: "Waarom volle Kelly in de praktijk te agressief is",
        },
        body: {
          en: [
            "Full Kelly is optimal only if you know your true probability exactly. In reality, you estimate it, and the estimate is noisy. If you think your edge is 5% but it's actually 2%, full Kelly will size you as if you're twice as good as you are — which leads to dramatic drawdowns. The math is unforgiving: a model that's 10% off on its edge estimate will experience roughly 4× the drawdown of a model that's perfectly calibrated.",
            "The second issue is psychological. Full Kelly assumes you can handle 40% drawdowns without flinching. Very few humans can. A run of bad variance that takes your bankroll from €10,000 to €6,000 will make most people panic, scale down, or quit — and that emotional response wipes out any theoretical edge Kelly was supposed to deliver.",
            "The standard professional adjustment is fractional Kelly: bet some fraction (usually 0.25 or 0.5) of what the formula says. Half-Kelly delivers ~75% of the long-run growth of full Kelly with ~50% of the variance. Quarter-Kelly gives you ~43% of the growth with ~25% of the variance. Most professional syndicates sit in the 0.2–0.4 range for this exact tradeoff.",
          ],
          nl: [
            "Volle Kelly is alleen optimaal als je je echte kans exact kent. In werkelijkheid schat je hem, en de schatting is ruisig. Als je denkt dat je edge 5% is maar hij is eigenlijk 2%, dan zet volle Kelly je in alsof je twee keer zo goed bent als je bent — wat leidt tot dramatische drawdowns. De wiskunde is onverbiddelijk: een model dat er 10% naast zit op zijn edge-schatting ervaart ruwweg 4× de drawdown van een perfect gekalibreerd model.",
            "Het tweede probleem is psychologisch. Volle Kelly veronderstelt dat je 40% drawdowns aankunt zonder te verschieten. Heel weinig mensen kunnen dat. Een reeks slechte variance die je bankroll van €10.000 naar €6.000 brengt, doet de meeste mensen paniekeren, verkleinen of stoppen — en die emotionele reactie veegt elke theoretische edge uit die Kelly had moeten leveren.",
            "De standaard professionele aanpassing is fractional Kelly: zet een fractie (meestal 0.25 of 0.5) van wat de formule zegt. Half-Kelly levert ~75% van de lange-termijn groei van volle Kelly met ~50% van de variance. Quarter-Kelly geeft ~43% van de groei met ~25% van de variance. De meeste professionele syndicaten zitten in de 0.2–0.4 range voor precies deze afweging.",
          ],
        },
      },
      {
        heading: {
          en: "Kelly with multiple simultaneous bets",
          nl: "Kelly met meerdere gelijktijdige weddenschappen",
        },
        body: {
          en: [
            "Pure Kelly assumes one bet at a time, but sports bettors often place multiple bets on the same day or weekend. If the bets are uncorrelated (different leagues, different markets), you can scale them independently using their individual Kelly fractions — with one important caveat: the sum of all fractions should never exceed 1, or you risk running out of bankroll before all the bets settle.",
            "If the bets are correlated (three Premier League matches on the same Saturday — all influenced by general Premier League variance that weekend), pure Kelly over-allocates because it double-counts the risk. The correct move is to size down proportionally, or to use a constrained-Kelly optimisation that respects the correlation matrix.",
            "BetsPlug member tools ship a built-in multi-bet Kelly calculator that accounts for correlation between simultaneous fixtures. For the free preview, the confidence score is the raw signal — if you want to sizing-size yourself, divide by 4 (quarter-Kelly) and you'll be close to a safe baseline without needing the correlation math.",
          ],
          nl: [
            "Pure Kelly veronderstelt één weddenschap tegelijk, maar sportspelers plaatsen vaak meerdere weddenschappen op dezelfde dag of hetzelfde weekend. Als de weddenschappen ongecorreleerd zijn (verschillende competities, verschillende markten), kun je ze onafhankelijk schalen met hun individuele Kelly-fracties — met één belangrijke kanttekening: de som van alle fracties mag nooit groter zijn dan 1, anders loop je het risico dat je bankroll op is voordat alle weddenschappen afgewikkeld zijn.",
            "Als de weddenschappen gecorreleerd zijn (drie Premier League-wedstrijden op dezelfde zaterdag — allemaal beïnvloed door algemene Premier League-variance dat weekend), over-alloceert pure Kelly omdat het het risico dubbel telt. De juiste move is proportioneel verkleinen of een beperkte-Kelly-optimalisatie gebruiken die de correlatiematrix respecteert.",
            "BetsPlug member-tools leveren een ingebouwde multi-bet Kelly-calculator die rekening houdt met correlatie tussen gelijktijdige wedstrijden. Voor de gratis preview is de confidence-score het rauwe signaal — als je jezelf wilt sizen, deel door 4 (quarter-Kelly) en je zit dicht bij een veilige baseline zonder de correlatie-wiskunde nodig te hebben.",
          ],
        },
      },
      {
        heading: {
          en: "A worked Kelly example",
          nl: "Een uitgewerkt Kelly-voorbeeld",
        },
        body: {
          en: [
            "Let's say you have a bankroll of €2,000 and BetsPlug's ensemble gives you a 58% probability on a match where the bookmaker price is 2.10. Your edge is 0.58 − (1 / 2.10) = 0.58 − 0.476 = 0.104 (10.4%). Full Kelly f = (0.58 × 1.10 − 0.42) / 1.10 = 0.1945, or 19.45% of bankroll. That's €389 on a single bet — a terrifying number.",
            "Half-Kelly would stake €194, quarter-Kelly €97. The difference in long-run growth between these three options is much smaller than the difference in variance, so most professionals take quarter-Kelly on fresh picks and scale up only after the model has proven itself on a large sample.",
            "Notice how sensitive this is to the probability estimate. If the true probability was 54% instead of 58% (a 4-point overestimate), the real edge drops to 6.4%, real full Kelly becomes 11.6%, and quarter-Kelly falls to 2.9% — a third of the stake you would have placed based on the 58% estimate. This is exactly the kind of mis-sizing that sinks overconfident models. Always quarter-Kelly until you've validated the model on at least 500 out-of-sample picks.",
          ],
          nl: [
            "Stel je hebt een bankroll van €2.000 en het BetsPlug-ensemble geeft je een 58%-kans op een wedstrijd waar de bookmakerprijs 2.10 is. Je edge is 0.58 − (1 / 2.10) = 0.58 − 0.476 = 0.104 (10.4%). Volle Kelly f = (0.58 × 1.10 − 0.42) / 1.10 = 0.1945, ofwel 19.45% van de bankroll. Dat is €389 op één weddenschap — een angstaanjagend getal.",
            "Half-Kelly zou €194 inzetten, quarter-Kelly €97. Het verschil in lange-termijn groei tussen deze drie opties is veel kleiner dan het verschil in variance, dus de meeste professionals nemen quarter-Kelly op verse picks en schalen pas op nadat het model zich op een grote sample heeft bewezen.",
            "Merk op hoe gevoelig dit is voor de kansschatting. Als de echte kans 54% was in plaats van 58% (een 4-punts overschatting), zakt de echte edge naar 6.4%, wordt echte volle Kelly 11.6%, en zakt quarter-Kelly naar 2.9% — een derde van de stake die je op basis van de 58%-schatting zou hebben geplaatst. Dit is precies het soort mis-sizing dat overmoedige modellen doet zinken. Gebruik altijd quarter-Kelly totdat je het model op minstens 500 out-of-sample picks hebt gevalideerd.",
          ],
        },
      },
    ],
    faqs: {
      en: [
        {
          q: "Does Kelly work if I don't know my true probability?",
          a: "Not perfectly. Kelly is only optimal if the probability estimate is correct. If your estimate is off by even a few percentage points, full Kelly dramatically overshoots. That's why pros always use fractional Kelly — it's tolerant of estimation error.",
        },
        {
          q: "What's the difference between half-Kelly and quarter-Kelly?",
          a: "Half-Kelly stakes 50% of the full Kelly amount; quarter-Kelly stakes 25%. Half-Kelly captures ~75% of full Kelly's long-run growth with ~50% of the variance; quarter-Kelly captures ~43% of growth with ~25% of variance. Most pros use 0.25–0.5 Kelly depending on model confidence.",
        },
        {
          q: "Can I use Kelly for parlays and accumulators?",
          a: "Yes, but carefully. For a parlay, compute the joint probability (multiply the individual probabilities if they're independent) and the joint odds (multiply the individual odds), then apply Kelly to the result. Correlated parlays need a joint-probability estimate, not a multiplication.",
        },
        {
          q: "What happens if Kelly says to bet more than I have?",
          a: "Cap the stake at your bankroll. Kelly should never ask you to bet more than 100% of the bankroll — if it does, your edge estimate is almost certainly wrong.",
        },
        {
          q: "Does BetsPlug auto-calculate Kelly?",
          a: "Members get a Kelly sizing tool inside the dashboard that factors in correlation between simultaneous bets. The free preview shows confidence only; you can manually apply quarter-Kelly if you want a rough starting point.",
        },
      ],
      nl: [
        {
          q: "Werkt Kelly als ik mijn echte kans niet ken?",
          a: "Niet perfect. Kelly is alleen optimaal als de kansschatting correct is. Als je schatting er zelfs een paar procentpunten naast zit, overschrijdt volle Kelly dramatisch. Daarom gebruiken pro's altijd fractional Kelly — het is tolerant voor schattingsfouten.",
        },
        {
          q: "Wat is het verschil tussen half-Kelly en quarter-Kelly?",
          a: "Half-Kelly zet 50% van het volle Kelly-bedrag in; quarter-Kelly 25%. Half-Kelly vangt ~75% van de lange-termijn groei van volle Kelly met ~50% variance; quarter-Kelly vangt ~43% groei met ~25% variance. De meeste pro's gebruiken 0.25–0.5 Kelly afhankelijk van model-confidence.",
        },
        {
          q: "Kan ik Kelly gebruiken voor combi's en acca's?",
          a: "Ja, maar voorzichtig. Voor een combi bereken je de gezamenlijke kans (vermenigvuldig de individuele kansen als ze onafhankelijk zijn) en de gezamenlijke odds (vermenigvuldig de individuele odds), en pas je Kelly toe op het resultaat. Gecorreleerde combi's hebben een gezamenlijke kansschatting nodig, geen vermenigvuldiging.",
        },
        {
          q: "Wat als Kelly zegt dat ik meer moet inzetten dan ik heb?",
          a: "Plafond de stake op je bankroll. Kelly zou nooit meer dan 100% van de bankroll moeten vragen — als het dat doet, is je edge-schatting vrijwel zeker fout.",
        },
        {
          q: "Berekent BetsPlug Kelly automatisch?",
          a: "Members krijgen een Kelly-sizing tool in het dashboard die rekening houdt met correlatie tussen gelijktijdige weddenschappen. De gratis preview toont alleen confidence; je kunt handmatig quarter-Kelly toepassen als je een ruwe startpositie wilt.",
        },
      ],
    },
    related: ["bankroll-management", "what-is-value-betting", "poisson-goal-models"],
  },
  {
    slug: "poisson-goal-models",
    title: {
      en: "Poisson Goal Models",
      nl: "Poisson Goalmodellen",
    },
    tagline: {
      en: "The statistical workhorse that turns expected goals into match probabilities",
      nl: "De statistische werkpaard die verwachte goals omzet in wedstrijdkansen",
    },
    metaTitle: {
      en: "Poisson Goal Models Explained — Football Predictions | BetsPlug",
      nl: "Poisson Goalmodellen Uitgelegd — Voetbalvoorspellingen | BetsPlug",
    },
    metaDescription: {
      en: "How Poisson distributions translate expected goals into match-result probabilities, the Dixon-Coles adjustment, and how BetsPlug's Poisson head actually works.",
      nl: "Hoe Poisson-verdelingen verwachte goals omzetten in wedstrijduitkomst-kansen, de Dixon-Coles aanpassing en hoe de Poisson-kop van BetsPlug echt werkt.",
    },
    intro: {
      en: "The Poisson distribution is the statistical tool that turns 'this team expects to score 1.8 goals' into 'this team has a 55% chance of winning, 25% of drawing and 20% of losing'. It's been the statistical backbone of football prediction since Maher published his 1982 paper and is still, decades later, the model that every modern ensemble (including BetsPlug's) uses for its goal-total calculations. This guide explains why Poisson works so well, where it breaks down, and the Dixon-Coles adjustment that fixes the biggest flaw.",
      nl: "De Poisson-verdeling is het statistische gereedschap dat 'deze ploeg verwacht 1.8 goals te scoren' omzet in 'deze ploeg heeft 55% kans op winst, 25% op gelijkspel en 20% op verlies'. Het is de statistische ruggengraat van voetbalvoorspelling sinds Maher zijn paper uit 1982 publiceerde en is, decennia later, nog steeds het model dat elk modern ensemble (inclusief dat van BetsPlug) gebruikt voor zijn goal-totaal berekeningen. Deze gids legt uit waarom Poisson zo goed werkt, waar het vastloopt en de Dixon-Coles aanpassing die het grootste gebrek oplost.",
    },
    sections: [
      {
        heading: {
          en: "What is a Poisson distribution?",
          nl: "Wat is een Poisson-verdeling?",
        },
        body: {
          en: [
            "The Poisson distribution describes the probability of a given number of events happening in a fixed interval, when those events happen at a known average rate and are independent of each other. Typical examples: how many cars pass a given point per minute, how many raindrops land on a square metre per second, how many goals a team scores in a 90-minute football match.",
            "The one parameter is lambda (λ) — the average number of events per interval. If a team's λ is 1.8 goals per match, the Poisson distribution gives you the probability of them scoring exactly 0 goals (16.5%), exactly 1 (29.7%), exactly 2 (26.7%), exactly 3 (16.0%), exactly 4 (7.2%), and so on down the tail. Adding up all the probabilities above 0 gives you the probability of them scoring at least once (83.5%).",
            "Football goals are surprisingly well-described by Poisson. The actual distribution of team scores across a season is close to what a Poisson model with the right λ would predict. This is non-obvious — goals are not completely random or independent (scoring the first goal changes how both teams play), but the deviation from a pure Poisson is small enough that it's a good approximation most of the time.",
          ],
          nl: [
            "De Poisson-verdeling beschrijft de kans op een gegeven aantal gebeurtenissen in een vast interval, wanneer die gebeurtenissen met een bekend gemiddeld tempo plaatsvinden en onafhankelijk zijn van elkaar. Typische voorbeelden: hoeveel auto's per minuut een bepaald punt passeren, hoeveel regendruppels per seconde op een vierkante meter vallen, hoeveel goals een ploeg scoort in een 90-minuten voetbalwedstrijd.",
            "De enige parameter is lambda (λ) — het gemiddelde aantal gebeurtenissen per interval. Als de λ van een ploeg 1.8 goals per wedstrijd is, geeft de Poisson-verdeling je de kans dat ze precies 0 goals scoren (16.5%), precies 1 (29.7%), precies 2 (26.7%), precies 3 (16.0%), precies 4 (7.2%), enzovoort langs de staart. Het optellen van alle kansen boven 0 geeft je de kans dat ze minstens één keer scoren (83.5%).",
            "Voetbalgoals worden verrassend goed beschreven door Poisson. De echte verdeling van ploegscores over een seizoen ligt dicht bij wat een Poisson-model met de juiste λ zou voorspellen. Dit is niet vanzelfsprekend — goals zijn niet volledig willekeurig of onafhankelijk (het scoren van de eerste goal verandert hoe beide ploegen spelen), maar de afwijking van een pure Poisson is klein genoeg dat het meestal een goede benadering is.",
          ],
        },
      },
      {
        heading: {
          en: "From xG to match probabilities",
          nl: "Van xG naar wedstrijdkansen",
        },
        body: {
          en: [
            "A two-team Poisson model estimates a separate λ for each team — the home team's attacking strength adjusted for the away team's defensive strength, and vice versa. Then it assumes the two scores are independent Poisson draws and computes the joint probability of every possible scoreline. Sum the probabilities where home > away to get the home-win probability, where home = away for the draw, where home < away for the away-win.",
            "The strength-of-schedule adjustment matters a lot. A team that has scored 2.0 goals per game but only against weak defences has a lower true λ than a team that has scored 2.0 goals per game against strong defences. The fix is to express each team's attacking and defensive strength relative to the league average, so that λ_home = league_avg × home_attack × away_defence × home_advantage. This is the Dixon-Coles-style formulation that most modern implementations use.",
            "Once you have the scoreline probability matrix, you can derive every football betting market from it: 1X2 (sum over the triangles), Over/Under totals (sum over the diagonals), Both Teams To Score (sum over the quadrant where both teams score ≥ 1), Asian Handicap (shift the diagonals by the handicap line), correct score (read directly from the matrix). One Poisson surface, one source of truth.",
          ],
          nl: [
            "Een twee-ploegen Poisson-model schat een aparte λ voor elke ploeg — de aanvallende kracht van de thuisploeg aangepast voor de verdedigende kracht van de uitploeg, en vice versa. Dan neemt het aan dat de twee scores onafhankelijke Poisson-trekkingen zijn en berekent de gezamenlijke kans op elke mogelijke eindstand. Tel de kansen op waar thuis > uit voor de thuiswinkans, waar thuis = uit voor gelijkspel, waar thuis < uit voor uitwinst.",
            "De sterkte-van-schedule aanpassing maakt veel uit. Een ploeg die 2.0 goals per wedstrijd heeft gescoord maar alleen tegen zwakke verdedigingen heeft een lagere echte λ dan een ploeg die 2.0 goals per wedstrijd tegen sterke verdedigingen heeft gescoord. De oplossing is om de aanvallende en verdedigende kracht van elke ploeg uit te drukken relatief aan het competitiegemiddelde, zodat λ_thuis = competitie_gem × thuis_aanval × uit_verdediging × thuisvoordeel. Dit is de Dixon-Coles-stijl formulering die de meeste moderne implementaties gebruiken.",
            "Zodra je de eindstand-kansmatrix hebt, kun je elke voetbalwedmarkt eruit afleiden: 1X2 (som over de driehoeken), Over/Under totals (som over de diagonalen), Beide Teams Scoren (som over het kwadrant waar beide ploegen ≥ 1 scoren), Asian Handicap (verschuif de diagonalen met de handicaplijn), correct score (lees direct uit de matrix). Eén Poisson-surface, één bron van waarheid.",
          ],
        },
      },
      {
        heading: {
          en: "The Dixon-Coles adjustment",
          nl: "De Dixon-Coles aanpassing",
        },
        body: {
          en: [
            "The one place where pure Poisson demonstrably breaks is low-scoring matches. Pure Poisson with independent team scores under-predicts the frequency of 0-0 and 1-1 draws and over-predicts the frequency of 0-1 and 1-0 results. The deviation isn't huge (~1–2% on each scoreline) but it's systematic, and in a business where edges are measured in single percentage points, fixing it matters.",
            "Mark Dixon and Stuart Coles published a 1997 paper that added a four-parameter correction to the Poisson joint distribution. The correction specifically inflates the probabilities of 0-0 and 1-1 and deflates 0-1 and 1-0, with no effect on any other scoreline. The mechanism is a correlation parameter that only activates on the 0-0 / 1-1 / 0-1 / 1-0 cells of the scoreline matrix.",
            "Every serious Poisson-based football model uses some form of this adjustment today. The BetsPlug Poisson head runs a Dixon-Coles-style correction on top of the base Poisson joint distribution, with the correlation parameter fit per league (Serie A sits higher, reflecting the elevated draw rate; Bundesliga sits lower). The effect on 1X2 prediction accuracy is small but real — around +0.3 percentage points of log-loss improvement on holdout data.",
          ],
          nl: [
            "De ene plek waar pure Poisson aantoonbaar vastloopt is laag-scorende wedstrijden. Pure Poisson met onafhankelijke ploegscores onderpredict de frequentie van 0-0 en 1-1 gelijkspellen en overpredict de frequentie van 0-1 en 1-0 uitslagen. De afwijking is niet enorm (~1–2% op elke eindstand) maar hij is systematisch, en in een business waar edges in enkele procentpunten worden gemeten maakt het oplossen ervan uit.",
            "Mark Dixon en Stuart Coles publiceerden in 1997 een paper die een vier-parameter correctie toevoegde aan de Poisson gezamenlijke verdeling. De correctie blaast specifiek de kansen van 0-0 en 1-1 op en laat 0-1 en 1-0 krimpen, zonder effect op enige andere eindstand. Het mechanisme is een correlatieparameter die alleen activeert op de 0-0 / 1-1 / 0-1 / 1-0 cellen van de eindstand-matrix.",
            "Elk serieus Poisson-gebaseerd voetbalmodel gebruikt vandaag de dag een vorm van deze aanpassing. De Poisson-kop van BetsPlug draait een Dixon-Coles-stijl correctie bovenop de basis Poisson-verdeling, met de correlatieparameter per competitie gefit (Serie A ligt hoger, wat de verhoogde gelijkspelpercentage weerspiegelt; Bundesliga ligt lager). Het effect op 1X2-voorspelnauwkeurigheid is klein maar echt — ongeveer +0.3 procentpunten log-loss verbetering op holdout data.",
          ],
        },
      },
      {
        heading: {
          en: "Where Poisson still struggles",
          nl: "Waar Poisson nog steeds worstelt",
        },
        body: {
          en: [
            "Poisson assumes constant intensity across the 90 minutes, but football doesn't work that way. Teams score at different rates depending on the scoreline: leading teams defend, trailing teams attack, drawing teams vary in urgency. Pure Poisson over-predicts high-scoring matches because it ignores the 'killing the game' effect where a 2-0 leader parks the bus and both teams effectively stop trying.",
            "The other failure mode is extreme mismatches. When a top-three side plays a bottom-three side, the raw Poisson numbers often give the underdog a 2–3% win probability, but historically those underdogs win more like 4–5%. The reason is that football is occasionally chaotic in a way the normal distribution assumptions underweight — red cards, flukes, first-minute goals changing the tactical context.",
            "BetsPlug's ensemble works around these flaws by blending Poisson with Elo and logistic regression. The Poisson head gives tight probability estimates on balanced fixtures; the Elo head gives robust anchor estimates on mismatches; the logistic head picks up short-term form shifts Poisson doesn't see. The ensemble meta-model weighs them based on how well each has performed on similar fixture archetypes in the past.",
          ],
          nl: [
            "Poisson veronderstelt constante intensiteit over de 90 minuten, maar voetbal werkt zo niet. Ploegen scoren met verschillende snelheden afhankelijk van de stand: leidende ploegen verdedigen, achtervolgende ploegen vallen aan, gelijkspelende ploegen variëren in urgentie. Pure Poisson over-predict hoog-scorende wedstrijden omdat het het 'wedstrijd uitspelen' effect negeert, waar een 2-0 leider de bus parkeert en beide ploegen effectief stoppen met proberen.",
            "De andere faalmodus is extreme mismatches. Wanneer een top-drie-ploeg tegen een onderste-drie-ploeg speelt, geven de rauwe Poisson-getallen de underdog vaak een 2–3% winstkans, maar historisch winnen die underdogs meer zoiets als 4–5%. De reden is dat voetbal af en toe chaotisch is op een manier die de normale-verdeling aannames onderwegen — rode kaarten, geluk, eerste-minuut goals die de tactische context veranderen.",
            "Het ensemble van BetsPlug omzeilt deze gebreken door Poisson te combineren met Elo en logistische regressie. De Poisson-kop geeft scherpe kansschattingen op gebalanceerde wedstrijden; de Elo-kop geeft robuuste ankerschattingen op mismatches; de logistische kop pakt korte-termijn vormverschuivingen op die Poisson niet ziet. Het ensemble meta-model weegt ze op basis van hoe goed ze hebben gepresteerd op vergelijkbare wedstrijdarchetypes in het verleden.",
          ],
        },
      },
    ],
    faqs: {
      en: [
        {
          q: "Why use Poisson and not just match data?",
          a: "Because Poisson lets you derive every market from one underlying surface. Fitting a separate model for 1X2, BTTS, Over/Under 2.5, etc. requires more data and introduces inconsistencies. A single Poisson scoreline matrix gives all markets consistently.",
        },
        {
          q: "What's the lambda for an average Premier League team?",
          a: "The league-wide average is around 1.35 goals per team per match. Stronger teams sit around 1.8–2.0; weaker teams around 0.9–1.1. These numbers shift when you apply the home advantage multiplier (~1.15–1.25 for home, ~0.80–0.90 for away).",
        },
        {
          q: "Does BetsPlug use plain Poisson or Dixon-Coles?",
          a: "We use a Dixon-Coles-style correction on top of the base Poisson. The correlation parameter is fit per league so we don't apply the same correction to high-draw and low-draw environments.",
        },
        {
          q: "Can Poisson predict correct scores?",
          a: "Yes — the scoreline matrix reads directly as correct-score probabilities. The most-likely score is usually 1-1 or 2-1 in balanced fixtures; the probabilities for exotic scorelines (4-3, 5-1) are small but measurable.",
        },
        {
          q: "How often do you re-fit the Poisson parameters?",
          a: "Team-level attack and defence strengths update after every match. The Dixon-Coles correlation parameter updates weekly from the previous 38-match rolling window per league, which is enough to capture seasonal trend shifts without over-reacting to single-match noise.",
        },
      ],
      nl: [
        {
          q: "Waarom Poisson gebruiken en niet alleen wedstrijddata?",
          a: "Omdat Poisson je elke markt uit één onderliggende surface laat afleiden. Een apart model fitten voor 1X2, BTTS, Over/Under 2.5 etc. vereist meer data en introduceert inconsistenties. Eén Poisson eindstand-matrix geeft alle markten consistent.",
        },
        {
          q: "Wat is de lambda voor een gemiddelde Premier League-ploeg?",
          a: "Het competitie-gemiddelde ligt rond 1.35 goals per ploeg per wedstrijd. Sterkere ploegen zitten rond 1.8–2.0; zwakkere rond 0.9–1.1. Deze getallen verschuiven wanneer je de thuisvoordeel-vermenigvuldiger toepast (~1.15–1.25 voor thuis, ~0.80–0.90 voor uit).",
        },
        {
          q: "Gebruikt BetsPlug puur Poisson of Dixon-Coles?",
          a: "We gebruiken een Dixon-Coles-stijl correctie bovenop de basis Poisson. De correlatieparameter wordt per competitie gefit, zodat we niet dezelfde correctie toepassen op hoog-gelijkspel en laag-gelijkspel omgevingen.",
        },
        {
          q: "Kan Poisson correcte scores voorspellen?",
          a: "Ja — de eindstand-matrix leest direct als correct-score kansen. De meest waarschijnlijke score is meestal 1-1 of 2-1 in gebalanceerde wedstrijden; de kansen voor exotische eindstanden (4-3, 5-1) zijn klein maar meetbaar.",
        },
        {
          q: "Hoe vaak re-fitten jullie de Poisson-parameters?",
          a: "Team-level aanvals- en verdedigingssterktes updaten na elke wedstrijd. De Dixon-Coles correlatieparameter update wekelijks vanuit het rollende 38-wedstrijden window per competitie, wat genoeg is om seizoenstrend-verschuivingen te vangen zonder over-reactie op enkele-wedstrijd ruis.",
        },
      ],
    },
    related: ["expected-goals-explained", "elo-rating-explained", "what-is-value-betting"],
  },
  {
    slug: "bankroll-management",
    title: {
      en: "Bankroll Management for Sports Bettors",
      nl: "Bankroll Management voor Sportwedders",
    },
    tagline: {
      en: "The difference between a model that works and one that pays",
      nl: "Het verschil tussen een model dat werkt en een dat uitbetaalt",
    },
    metaTitle: {
      en: "Bankroll Management for Sports Bettors (2026 Guide) | BetsPlug",
      nl: "Bankroll Management voor Sportwedders (2026 Gids) | BetsPlug",
    },
    metaDescription: {
      en: "How to size your bankroll, survive variance, and avoid the psychological traps that wipe out +EV bettors. Practical rules and worked examples.",
      nl: "Hoe je je bankroll dimensioneert, variance overleeft en de psychologische valkuilen vermijdt die +EV-spelers uitvegen. Praktische regels en uitgewerkte voorbeelden.",
    },
    intro: {
      en: "Most people who lose money betting don't lose because their picks are bad. They lose because their bankroll management is bad. A bettor with a genuine edge who sizes wrong will still go broke; a bettor with a small edge who sizes right will compound slowly but surely. This pillar is the most practical one on the site — it covers the rules that separate 'has a model' from 'has a business', and it draws directly from what professional betting syndicates actually do.",
      nl: "De meeste mensen die geld verliezen met wedden verliezen niet omdat hun picks slecht zijn. Ze verliezen omdat hun bankroll management slecht is. Een speler met een echte edge die verkeerd inzet gaat alsnog failliet; een speler met een kleine edge die goed inzet compoundt langzaam maar zeker. Deze pijler is de meest praktische op de site — hij dekt de regels die 'heeft een model' onderscheiden van 'heeft een business', en hij is direct ontleend aan wat professionele wedsyndicaten daadwerkelijk doen.",
    },
    sections: [
      {
        heading: {
          en: "What is a bankroll?",
          nl: "Wat is een bankroll?",
        },
        body: {
          en: [
            "Your bankroll is the pool of money you have set aside exclusively for betting. It's not your savings, it's not your rent money, and it's definitely not money you need to pay bills with. The cleanest definition: a bankroll is an amount you could lose in full and your life would not meaningfully change. If losing it would cause you stress, the bankroll is too big for your financial situation.",
            "Professional syndicates separate bankroll from operating capital the way a business separates working capital from reserves. The bankroll pays out winnings and absorbs losses; it does not pay rent, salaries, or expenses. This separation is psychological as much as it is financial: it keeps decisions rational because the bettor isn't thinking 'if I lose this bet I can't pay my car payment'.",
            "For a recreational bettor, the right bankroll number is between 1% and 5% of your discretionary savings — not your total net worth, not your emergency fund. If you have €20,000 in savings and €5,000 of that is genuinely discretionary (you'd spend it on holidays or gadgets if you weren't betting), then a bankroll of €500 – €1,000 is reasonable.",
          ],
          nl: [
            "Je bankroll is de pot geld die je exclusief voor wedden opzij hebt gezet. Het is niet je spaargeld, niet je huurgeld, en zeker niet geld dat je nodig hebt om rekeningen mee te betalen. De schoonste definitie: een bankroll is een bedrag dat je volledig zou kunnen verliezen zonder dat je leven betekenisvol verandert. Als het verlies ervan stress zou veroorzaken, is de bankroll te groot voor je financiële situatie.",
            "Professionele syndicaten scheiden bankroll van operationeel kapitaal zoals een bedrijf werkkapitaal scheidt van reserves. De bankroll betaalt winsten uit en absorbeert verliezen; hij betaalt geen huur, salarissen of kosten. Deze scheiding is psychologisch net zo belangrijk als financieel: hij houdt beslissingen rationeel omdat de speler niet denkt 'als ik deze weddenschap verlies kan ik mijn autolease niet betalen'.",
            "Voor een recreatieve speler is het juiste bankroll-getal tussen 1% en 5% van je beschikbare spaargeld — niet je totale vermogen, niet je noodfonds. Als je €20.000 aan spaargeld hebt en €5.000 daarvan is echt beschikbaar (je zou het uitgeven aan vakanties of gadgets als je niet zou wedden), dan is een bankroll van €500 – €1.000 redelijk.",
          ],
        },
      },
      {
        heading: {
          en: "Unit sizing and the 1–2% rule",
          nl: "Unit sizing en de 1–2% regel",
        },
        body: {
          en: [
            "Once the bankroll is set, the most common professional rule is: never stake more than 1–2% of your current bankroll on a single bet, regardless of confidence. A €1,000 bankroll implies unit sizes of €10–€20. Anything bigger and a normal losing streak (which happens routinely) will dig a hole that's emotionally hard to climb out of.",
            "The reason to cap at 2% isn't that Kelly says so — Kelly often recommends more — but that 2% survives the worst drawdowns seen in historical simulation. A bettor staking 2% flat on +EV picks with a 55% hit rate can expect drawdowns of around 20% of bankroll over a typical 500-bet sample. That's scary but survivable. A bettor staking 5% flat on the same edge can expect drawdowns of 45%+, which is the point at which most people blink and quit.",
            "If you're using Kelly, the right move is to cap Kelly at 2% for any individual bet even when the formula recommends more. The upside trade-off is small; the downside protection is huge. Professional syndicates call this a 'Kelly-Lite' approach and it's the standard in nearly every desk I've personally interviewed.",
          ],
          nl: [
            "Zodra de bankroll is vastgesteld, is de meest voorkomende professionele regel: zet nooit meer dan 1–2% van je huidige bankroll in op één weddenschap, ongeacht je confidence. Een bankroll van €1.000 impliceert unit-groottes van €10–€20. Alles groter en een normale verliesreeks (die routinematig gebeurt) graaft een gat dat emotioneel moeilijk te verlaten is.",
            "De reden om op 2% te plafonneren is niet dat Kelly dat zegt — Kelly raadt vaak meer aan — maar dat 2% de ergste drawdowns overleeft die in historische simulatie zijn gezien. Een speler die flat 2% inzet op +EV-picks met een 55% hit rate kan drawdowns van ongeveer 20% van de bankroll verwachten over een typische sample van 500 weddenschappen. Dat is eng maar te overleven. Een speler die 5% flat inzet op dezelfde edge kan drawdowns van 45%+ verwachten, het punt waarop de meeste mensen knipperen en stoppen.",
            "Als je Kelly gebruikt, is de juiste move om Kelly op 2% te plafonneren voor elke individuele weddenschap, zelfs als de formule meer aanbeveelt. De upside-tradeoff is klein; de downside-bescherming is enorm. Professionele syndicaten noemen dit een 'Kelly-Lite' aanpak en het is de standaard bij bijna elke desk die ik persoonlijk heb geïnterviewd.",
          ],
        },
      },
      {
        heading: {
          en: "Drawdown tolerance and variance",
          nl: "Drawdown-tolerantie en variance",
        },
        body: {
          en: [
            "Drawdown is the peak-to-trough decline in your bankroll over time. Even the best-managed betting operation experiences meaningful drawdowns — variance doesn't care how good your model is. For a 55% hit rate at average odds 1.90 (a realistic profile for a disciplined value bettor), the expected worst drawdown over 500 bets is around 18%; over 1,000 bets it climbs to 25%.",
            "These numbers sound small until you experience them emotionally. A €1,000 bankroll dropping to €820 over the course of two months feels much worse than the math suggests, especially if you're comparing it to the €1,150 peak you hit last week. Most bettors react by increasing stakes to 'win it back faster', which is the single most reliable way to turn a survivable drawdown into a terminal one.",
            "The professional answer is a rigid staking plan that you commit to in advance and do not deviate from under any emotional circumstances. Write it down: 'I will stake 1.5% of my current bankroll on every +EV pick my model flags, I will not increase stakes after losses, I will not decrease stakes after losses, I will rebalance the unit size weekly based on bankroll changes'. Follow the plan mechanically. That's the hard part.",
          ],
          nl: [
            "Drawdown is de daling van piek naar dal in je bankroll over tijd. Zelfs de best gemanagede wedoperatie ervaart betekenisvolle drawdowns — variance geeft niet om hoe goed je model is. Voor een 55% hit rate op gemiddelde odds 1.90 (een realistisch profiel voor een gedisciplineerde value-speler) is de verwachte ergste drawdown over 500 weddenschappen ongeveer 18%; over 1.000 weddenschappen klimt het naar 25%.",
            "Deze getallen klinken klein totdat je ze emotioneel ervaart. Een bankroll van €1.000 die over twee maanden zakt naar €820 voelt veel slechter dan de wiskunde suggereert, vooral als je het vergelijkt met de €1.150 piek die je vorige week haalde. De meeste spelers reageren door stakes te verhogen om 'het sneller terug te winnen', wat de meest betrouwbare manier is om een overlevbare drawdown in een terminale te veranderen.",
            "Het professionele antwoord is een rigide staking plan dat je van tevoren vastlegt en waarvan je onder geen enkele emotionele omstandigheid afwijkt. Schrijf het op: 'Ik zet 1.5% van mijn huidige bankroll in op elke +EV-pick die mijn model signaleert, ik verhoog stakes niet na verliezen, ik verlaag stakes niet na verliezen, ik herbalanceer de unit-grootte wekelijks op basis van bankroll-veranderingen'. Volg het plan mechanisch. Dat is het harde deel.",
          ],
        },
      },
      {
        heading: {
          en: "Record-keeping and ROI tracking",
          nl: "Record-keeping en ROI-tracking",
        },
        body: {
          en: [
            "You cannot improve what you don't measure. Every bet you place should be logged with: date, league, fixture, market, price taken, stake, model's probability estimate, model's confidence score, bet result, and running bankroll. This is the minimum — and it's what separates a serious bettor from a casual one.",
            "Two metrics matter most: ROI (profit divided by total staked) and closing-line value (CLV — how often your taken price is better than the closing price on the same bet). ROI is how much you make per unit staked in the long run. CLV is a leading indicator — bettors with consistently positive CLV make money on average, even when recent results are bad, because they're systematically getting better prices than the market consensus.",
            "BetsPlug publishes both metrics in the public track record section. Members can filter the record by league, market and model confidence band to see how the edge behaves in different subsets — that's useful for identifying which kinds of picks are genuinely +EV vs which are noise. If you're running your own model, the minimum you need is a spreadsheet. If you're serious, use Pinnacle closing lines as your baseline for CLV tracking.",
          ],
          nl: [
            "Je kunt niet verbeteren wat je niet meet. Elke weddenschap die je plaatst moet worden gelogd met: datum, competitie, wedstrijd, markt, genomen prijs, stake, kansschatting van het model, confidence-score van het model, uitslag, en lopende bankroll. Dit is het minimum — en het scheidt een serieuze speler van een casual.",
            "Twee metrics zijn het belangrijkst: ROI (winst gedeeld door totale stake) en closing-line value (CLV — hoe vaak je genomen prijs beter is dan de closing-prijs op dezelfde weddenschap). ROI is hoeveel je gemiddeld verdient per eenheid inzet op de lange termijn. CLV is een leading indicator — spelers met consistent positieve CLV verdienen gemiddeld geld, zelfs wanneer recente resultaten slecht zijn, omdat ze systematisch betere prijzen krijgen dan de marktconsensus.",
            "BetsPlug publiceert beide metrics in het publieke track record-gedeelte. Members kunnen de record filteren op competitie, markt en model-confidence band om te zien hoe de edge zich gedraagt in verschillende subsets — dat is nuttig voor het identificeren welke soorten picks echt +EV zijn versus welke ruis zijn. Als je je eigen model runt, is een spreadsheet het minimum wat je nodig hebt. Als je serieus bent, gebruik Pinnacle closing lines als je baseline voor CLV-tracking.",
          ],
        },
      },
      {
        heading: {
          en: "When to walk away",
          nl: "Wanneer je moet stoppen",
        },
        body: {
          en: [
            "There are exactly two situations where a disciplined bettor should walk away from the session (not the hobby — just the current sitting). First, when you've hit your daily stop-loss. A professional desk sets a limit of, say, 5% of weekly bankroll in daily drawdown, after which the day is closed regardless of how many +EV picks remain. The reason is behavioural: after a bad day, judgment degrades, and taking more bets is statistically worse than waiting until tomorrow.",
            "Second, when you catch yourself 'chasing' — increasing stakes beyond the plan because you're trying to win money back, or taking picks the model didn't flag because 'this one feels right'. Chasing is how models get abandoned and how bankrolls die. The fix is mechanical: close the app, log off, come back the next day.",
            "The one situation where you should walk away from the hobby entirely is if it stops being fun or starts to interfere with the rest of your life. Gambling-related anxiety, sleep loss, relationship strain — any of these is a sign that it's time to take a break or quit. No positive ROI is worth that trade-off. BetsPlug is an analytics platform for people who treat betting as a side interest, not a coping mechanism; if you need help with gambling problems, please reach out to the resources linked on our responsible-play page.",
          ],
          nl: [
            "Er zijn precies twee situaties waarin een gedisciplineerde speler de sessie moet verlaten (niet de hobby — alleen het huidige moment). Ten eerste wanneer je je dagelijkse stop-loss hebt geraakt. Een professionele desk stelt een limiet van bijvoorbeeld 5% van de weekse bankroll in dagelijkse drawdown, waarna de dag wordt gesloten ongeacht hoeveel +EV-picks er overblijven. De reden is gedragsmatig: na een slechte dag verslechtert het oordeel, en meer weddenschappen nemen is statistisch slechter dan wachten tot morgen.",
            "Ten tweede wanneer je merkt dat je aan het 'chasen' bent — stakes verhogen boven het plan omdat je geld probeert terug te winnen, of picks nemen die het model niet heeft gesignaleerd omdat 'deze voelt goed'. Chasen is hoe modellen worden opgegeven en hoe bankrolls sterven. De oplossing is mechanisch: sluit de app, log uit, kom de volgende dag terug.",
            "De ene situatie waarin je de hobby volledig moet verlaten is als het stopt leuk te zijn of als het andere delen van je leven begint te verstoren. Gok-gerelateerde angst, slaapverlies, spanning in relaties — elk hiervan is een teken dat het tijd is voor een pauze of om te stoppen. Geen positieve ROI is die afweging waard. BetsPlug is een analyseplatform voor mensen die wedden als een bijinteresse behandelen, niet als coping-mechanisme; als je hulp nodig hebt bij gokproblemen, neem contact op met de bronnen op onze verantwoord-spelen pagina.",
          ],
        },
      },
    ],
    faqs: {
      en: [
        {
          q: "How big should my starting bankroll be?",
          a: "Between 1% and 5% of your discretionary savings. For most recreational bettors that's €200–€2,000. The bankroll should be money you could lose completely without life consequences. If losing it would hurt, it's too big.",
        },
        {
          q: "Should I use flat stakes or Kelly?",
          a: "Flat 1–2% is a great starting point. Kelly is mathematically optimal but only if you know your true edge exactly, which nobody does. Most pros cap Kelly at 2% of bankroll, which is effectively flat staking with a small tilt toward higher-confidence picks.",
        },
        {
          q: "How often should I rebalance unit size?",
          a: "Weekly or after every 10 bets, whichever comes first. Don't rebalance after a single big win or loss — that's how you talk yourself into bigger stakes on the wrong days.",
        },
        {
          q: "What do I do if I hit a 20% drawdown?",
          a: "Nothing. Continue with the plan. A 20% drawdown is well within normal variance for a 5% edge model. The worst thing you can do is increase stakes to chase, which converts a recoverable situation into a terminal one. Drop back to quarter-Kelly if needed, but don't scale down your discipline.",
        },
        {
          q: "How do I track closing-line value?",
          a: "Log the price you took and the closing price (Pinnacle is the usual reference) for every bet. CLV = (your_price / closing_price) − 1. Average CLV above 0 over 100+ bets is a strong leading indicator of long-run profitability.",
        },
      ],
      nl: [
        {
          q: "Hoe groot moet mijn startbankroll zijn?",
          a: "Tussen 1% en 5% van je beschikbare spaargeld. Voor de meeste recreatieve spelers is dat €200–€2.000. De bankroll moet geld zijn dat je volledig zou kunnen verliezen zonder gevolgen voor je leven. Als verlies pijn doet, is de bankroll te groot.",
        },
        {
          q: "Moet ik flat stakes of Kelly gebruiken?",
          a: "Flat 1–2% is een geweldig startpunt. Kelly is wiskundig optimaal maar alleen als je je echte edge exact kent, wat niemand doet. De meeste pro's plafonneren Kelly op 2% van de bankroll, wat effectief flat staking is met een kleine helling naar picks met hogere confidence.",
        },
        {
          q: "Hoe vaak moet ik de unit-grootte herbalanceren?",
          a: "Wekelijks of na elke 10 weddenschappen, wat eerst komt. Herbalanceer niet na een enkele grote winst of verlies — dat is hoe je jezelf praat in grotere stakes op de verkeerde dagen.",
        },
        {
          q: "Wat doe ik als ik een 20% drawdown raak?",
          a: "Niets. Ga door met het plan. Een 20% drawdown valt ruim binnen de normale variance voor een 5% edge model. Het slechtste wat je kunt doen is stakes verhogen om te chasen, wat een herstelbare situatie in een terminale verandert. Zak terug naar quarter-Kelly als nodig, maar verlaag niet je discipline.",
        },
        {
          q: "Hoe track ik closing-line value?",
          a: "Log de prijs die je nam en de closing-prijs (Pinnacle is de gebruikelijke referentie) voor elke weddenschap. CLV = (jouw_prijs / closing_prijs) − 1. Gemiddelde CLV boven 0 over 100+ weddenschappen is een sterke leading indicator voor lange-termijn winstgevendheid.",
        },
      ],
    },
    related: ["kelly-criterion-guide", "what-is-value-betting", "poisson-goal-models"],
  },
];

/* ── Lookup helpers ───────────────────────────────────────── */

export function getLearnPillar(slug: string): LearnPillar | undefined {
  return LEARN_PILLARS.find((p) => p.slug === slug);
}

export function getAllLearnPillarSlugs(): string[] {
  return LEARN_PILLARS.map((p) => p.slug);
}

/**
 * Map a UI locale (en/nl/de/fr/es/it/sw/id) to the subset of
 * locales we have handwritten pillar content for. Non-English
 * non-Dutch locales fall back to English until we translate.
 */
export function pickLearnPillarLocale(uiLocale: string): LearnPillarLocale {
  return uiLocale === "nl" ? "nl" : "en";
}
