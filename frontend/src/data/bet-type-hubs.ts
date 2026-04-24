/**
 * Bet-type hubs - public SEO landing pages for betting markets
 * ────────────────────────────────────────────────────────────
 * Each entry powers a /bet-types/[slug] page with handwritten
 * editorial content (explainer + FAQ) plus the top 3 most
 * confident upcoming matches derived from the 1X2 ensemble
 * output. The backend doesn't yet expose per-market
 * probabilities (BTTS, over/under), so the "matches today"
 * section is a proxy derived from overall confidence - it
 * gives readers a sense of the model's sharpness without
 * promising market-specific probabilities we can't verify.
 *
 * Content is supplied in EN + NL today; other locales fall
 * back to EN until handwritten translations land.
 */

import { isLocale, type Locale } from "@/i18n/config";
import { expandStringLocales, expandArrayLocales } from "@/i18n/expand";

// Phase 3: widened from `"en" | "nl"` to full 16-locale.
export type BetTypeHubLocale = Locale;

export type BetTypeHubFaq = {
  q: string;
  a: string;
};

type SeedLocalizedString = Partial<Record<Locale, string>>;
type SeedLocalizedFaqs = Partial<Record<Locale, BetTypeHubFaq[]>>;

type SeedBetTypeHub = {
  slug: string;
  shortCode: string;
  name: SeedLocalizedString;
  tagline: SeedLocalizedString;
  explainer: SeedLocalizedString;
  strategy: SeedLocalizedString;
  matchesHeading: SeedLocalizedString;
  matchesSub: SeedLocalizedString;
  metaTitle: SeedLocalizedString;
  metaDescription: SeedLocalizedString;
  faqs: SeedLocalizedFaqs;
};

export type BetTypeHub = {
  slug: string;
  name: Record<BetTypeHubLocale, string>;
  shortCode: string;
  tagline: Record<BetTypeHubLocale, string>;
  explainer: Record<BetTypeHubLocale, string>;
  strategy: Record<BetTypeHubLocale, string>;
  matchesHeading: Record<BetTypeHubLocale, string>;
  matchesSub: Record<BetTypeHubLocale, string>;
  metaTitle: Record<BetTypeHubLocale, string>;
  metaDescription: Record<BetTypeHubLocale, string>;
  faqs: Record<BetTypeHubLocale, BetTypeHubFaq[]>;
};

/* ── Hubs ─────────────────────────────────────────────────── */

const _SEED_BET_TYPE_HUBS: SeedBetTypeHub[] = [
  {
    slug: "both-teams-to-score",
    shortCode: "BTTS",
    name: {
      en: "Both Teams To Score",
      nl: "Beide Teams Scoren",
    },
    tagline: {
      en: "How BTTS odds are priced and how our model reads them",
      nl: "Hoe BTTS-odds geprijsd worden en hoe ons model ze leest",
    },
    explainer: {
      en: "Both Teams To Score (BTTS) is one of the cleanest binary markets in football: you bet Yes if you expect both sides to find the net, and No if you expect at least one clean sheet. The market is priced off the joint probability that each team scores at least once, which in turn comes from two independent Poisson distributions - one for the home team's expected goals (xG) and one for the away team's. A match between two sides with xG numbers of 1.6 and 1.4 typically prices BTTS Yes around 1.62 / BTTS No around 2.30 in a balanced market. The attraction of BTTS is that it strips out the difficulty of predicting the winner: whether the home side wins 3-1 or the away side wins 2-1 is irrelevant - both outcomes settle BTTS Yes. The downside is correlation: leagues where one side often dominates possession and scores early (then manages the game) tend to under-deliver BTTS Yes relative to what independent Poisson would suggest.",
      nl: "Beide Teams Scoren (BTTS) is een van de schoonste binaire markten in het voetbal: je wedt Ja als je verwacht dat beide ploegen het net vinden, en Nee als je minstens één clean sheet verwacht. De markt wordt geprijsd via de gezamenlijke kans dat elke ploeg minstens één keer scoort, wat volgt uit twee onafhankelijke Poisson-verdelingen - één voor de verwachte goals (xG) van de thuisploeg en één voor de uitploeg. Een wedstrijd tussen twee ploegen met xG-cijfers van 1.6 en 1.4 prijst BTTS Ja meestal rond 1.62 en BTTS Nee rond 2.30 in een gebalanceerde markt. De aantrekkelijkheid van BTTS is dat het het voorspellen van de winnaar omzeilt: of de thuisploeg 3-1 wint of de uitploeg 2-1 is irrelevant - beide uitkomsten settlen BTTS Ja. Het nadeel is correlatie: competities waarin één ploeg vaak domineert en vroeg scoort (en daarna de wedstrijd beheerst) leveren relatief minder BTTS Ja op dan onafhankelijke Poisson zou suggereren.",
    },
    strategy: {
      en: "BTTS value tends to hide in matches where public perception skews heavily toward one side's attack. When a mid-table team hosts a top-three side, casual users jump on BTTS Yes because the big side will obviously score - and forget that the home side might not. The opposite is true for matches between two defensively organised mid-table clubs: books often price BTTS No around 1.80 because the casual market remembers the 0-0 narrative, but the independent-goals math says both sides still have a >60% chance of finding the net. Look for BTTS edge in fixtures where one team's expected goals (xG) is above 1.0 and the other is between 0.9 and 1.3 - that's the range where independent Poisson gives BTTS Yes a 58–68% implied probability, and the market often prices it at 55% or lower. BetsPlug flags these matches automatically when the underlying 1X2 confidence is high enough that we trust the xG inputs.",
      nl: "BTTS-value ligt vaak verborgen in wedstrijden waarin het publiek sterk leunt op de aanval van één ploeg. Wanneer een middenmoter een topclub ontvangt, springt het casual publiek op BTTS Ja omdat die topclub natuurlijk scoort - en vergeet dat de thuisploeg dat misschien niet doet. Het omgekeerde geldt voor wedstrijden tussen twee defensief georganiseerde middenmoters: bookmakers prijzen BTTS Nee vaak rond 1.80 omdat het publiek de 0-0 verhaallijn onthoudt, terwijl de onafhankelijke-goalsmath zegt dat beide ploegen nog altijd >60% kans hebben om te scoren. Zoek BTTS-edge in wedstrijden waarin de verwachte goals (xG) van één ploeg boven 1.0 zit en die van de ander tussen 0.9 en 1.3 - in die range geeft onafhankelijke Poisson BTTS Ja een 58–68% impliciete kans, terwijl de markt vaak op 55% of lager prijst. BetsPlug flagt deze wedstrijden automatisch wanneer de onderliggende 1X2-confidence hoog genoeg is om de xG-inputs te vertrouwen.",
    },
    matchesHeading: {
      en: "Today's most confident fixtures",
      nl: "De meest zekere wedstrijden van vandaag",
    },
    matchesSub: {
      en: "Top 3 matches where our ensemble has the highest overall confidence - a useful shortlist for BTTS research.",
      nl: "Top 3 wedstrijden waar ons ensemble de hoogste confidence heeft - een nuttige shortlist voor BTTS-research.",
    },
    metaTitle: {
      en: "Both Teams To Score Predictions & BTTS Tips · BetsPlug",
      nl: "Beide Teams Scoren Voorspellingen & BTTS Tips · BetsPlug",
    },
    metaDescription: {
      en: "Free BTTS predictions, model reasoning and a shortlist of today's most confident fixtures. How Both Teams To Score is priced and when the market overreacts.",
      nl: "Gratis BTTS-voorspellingen, model-uitleg en een shortlist van de meest zekere wedstrijden van vandaag. Hoe Beide Teams Scoren wordt geprijsd en wanneer de markt overreageert.",
    },
    faqs: {
      en: [
        {
          q: "What does BTTS stand for?",
          a: "BTTS stands for Both Teams To Score - a yes/no market where you win if both teams find the net at least once during the match (or lose if at least one team fails to score).",
        },
        {
          q: "How is BTTS pricing calculated?",
          a: "Books derive BTTS Yes as 1 − P(home clean sheet) − P(away clean sheet) + P(both clean sheets). With independent Poisson inputs that collapses to (1 − exp(−λH)) × (1 − exp(−λA)), where λ is each side's expected goals. So two teams with xG 1.4 and 1.2 imply ~54% BTTS Yes.",
        },
        {
          q: "Does BetsPlug publish BTTS-specific probabilities?",
          a: "Not yet as a headline number - the current pipeline publishes 1X2 confidence. We use that confidence to shortlist matches where the underlying xG is reliable, which is a good proxy for BTTS-worthy fixtures. A dedicated BTTS head is on the roadmap.",
        },
        {
          q: "Which leagues have the highest BTTS hit rate?",
          a: "Eredivisie and Bundesliga sit at the top with around 60% BTTS Yes over a full season, driven by open attacking football and high league averages (~3.0+ goals per game). Serie A and La Liga typically run around 50% because of tighter defensive structures.",
        },
        {
          q: "Is BTTS a +EV market for casual users?",
          a: "It can be, if you focus on the mid-pricing zone (1.75 – 2.00) in leagues where the market overvalues defensive narratives. BTTS favourites below 1.60 usually offer no value after the bookmaker's margin; very long BTTS No prices above 2.40 are signalling real one-sided-attack risk that the market has already priced in.",
        },
        {
          q: "Can I combine BTTS with other markets?",
          a: "Yes - BTTS + Over 2.5 goals is a popular combo because the two events are strongly positively correlated. But remember: correlated parlays get priced differently than independent parlays, so don't assume you can multiply the two probabilities together. Member tools inside the BetsPlug dashboard show the correlated implied odds.",
        },
      ],
      nl: [
        {
          q: "Waar staat BTTS voor?",
          a: "BTTS staat voor Beide Teams Scoren (Both Teams To Score) - een ja/nee-markt waarbij je wint als beide ploegen minstens één keer scoren tijdens de wedstrijd (of verliest als minstens één ploeg niet scoort).",
        },
        {
          q: "Hoe wordt BTTS-pricing berekend?",
          a: "Bookmakers leiden BTTS Ja af als 1 − P(thuis clean sheet) − P(uit clean sheet) + P(beide clean sheets). Met onafhankelijke Poisson-inputs wordt dat (1 − exp(−λH)) × (1 − exp(−λA)), waarbij λ de verwachte goals van elke ploeg is. Twee ploegen met xG 1.4 en 1.2 impliceren dus ~54% BTTS Ja.",
        },
        {
          q: "Publiceert BetsPlug BTTS-specifieke kansen?",
          a: "Nog niet als headline-nummer - de huidige pipeline publiceert 1X2-confidence. Die confidence gebruiken we om wedstrijden te shortlisten waar de onderliggende xG betrouwbaar is, wat een goede proxy is voor BTTS-waardige wedstrijden. Een speciale BTTS-kop staat op de roadmap.",
        },
        {
          q: "Welke competities hebben het hoogste BTTS-hitpercentage?",
          a: "De Eredivisie en Bundesliga zitten aan de top met ongeveer 60% BTTS Ja over een volledig seizoen, gedreven door open aanvallend voetbal en een hoog competitiegemiddelde (~3.0+ goals per wedstrijd). Serie A en La Liga draaien meestal rond de 50% door strakkere defensieve structuren.",
        },
        {
          q: "Is BTTS een +EV-markt voor gelegenheidsspelers?",
          a: "Dat kan, als je focust op de mid-pricing zone (1.75 – 2.00) in competities waar de markt defensieve verhalen overwaardeert. BTTS-favorieten onder 1.60 bieden meestal geen value na de marge; hele lange BTTS Nee prijzen boven 2.40 signaleren echte eenzijdige-aanval risico dat de markt al heeft ingeprijsd.",
        },
        {
          q: "Kan ik BTTS combineren met andere markten?",
          a: "Ja - BTTS + Over 2.5 goals is een populaire combi omdat de twee events sterk positief gecorreleerd zijn. Onthoud wel: gecorreleerde parlays worden anders geprijsd dan onafhankelijke parlays, dus je kunt de twee kansen niet zomaar vermenigvuldigen. De member-tools in het BetsPlug-dashboard tonen de gecorreleerde impliciete odds.",
        },
      ],
    },
  },
  {
    slug: "over-2-5-goals",
    shortCode: "O2.5",
    name: {
      en: "Over 2.5 Goals",
      nl: "Over 2.5 Goals",
    },
    tagline: {
      en: "When the goals market is priced higher than the Poisson distribution suggests",
      nl: "Wanneer de goalsmarkt hoger geprijsd staat dan de Poisson-verdeling aangeeft",
    },
    explainer: {
      en: "Over 2.5 goals is the anchor of the total-goals market in football. You win the bet if the final combined score is 3 or more - any 3-0, 2-1, 4-2, 3-3 settles Over 2.5 Yes. The underlying math is cleaner than 1X2: you only need the total number of goals, and the joint Poisson distribution of home xG + away xG gives you the exact probability for every possible total. A match with combined expected goals (xG) of 2.7 typically prices Over 2.5 around 1.75 / Under 2.5 around 2.05 in a balanced market. What makes this market interesting is that the goal-total distribution is fat-tailed: around 33% of matches finish with exactly 2 goals (the border case), so small changes to the xG inputs move the implied odds dramatically. A swing from 2.5 combined xG to 2.9 combined xG moves Over 2.5 from 52% to 62% - a 20% relative shift in implied value.",
      nl: "Over 2.5 goals is het anker van de totale-goalsmarkt in het voetbal. Je wint de voorspelling als de eindstand gezamenlijk 3 of meer is - elke 3-0, 2-1, 4-2, 3-3 settlet Over 2.5 Ja. De onderliggende wiskunde is schoner dan 1X2: je hebt alleen het totale aantal goals nodig, en de gezamenlijke Poisson-verdeling van thuis-xG + uit-xG geeft je de exacte kans voor elke mogelijke totaal. Een wedstrijd met een gezamenlijke xG van 2.7 prijst Over 2.5 meestal rond 1.75 en Under 2.5 rond 2.05 in een gebalanceerde markt. Wat deze markt interessant maakt is dat de goals-totaal verdeling fat-tailed is: ongeveer 33% van de wedstrijden eindigt met precies 2 goals (de grenswaarde), dus kleine veranderingen in de xG-inputs verplaatsen de impliciete odds dramatisch. Een verschuiving van 2.5 gezamenlijke xG naar 2.9 gezamenlijke xG tilt Over 2.5 van 52% naar 62% - een relatieve verschuiving van 20% in impliciete waarde.",
    },
    strategy: {
      en: "The Over 2.5 market is most profitable when you've identified a mismatch between the combined xG estimate and the market's implied probability. Good spots to look: matches between two top-six sides (books often price Over 2.5 as a near-coinflip because both defences are organised, but the attacking talent on both sides skews the true Poisson distribution higher), and mid-table fixtures following a high-scoring midweek round (public perception drags the price down because people remember low-scoring matches disproportionately). Bad spots: derby matches where referees are historically cautious and both sides park the bus, and matches involving promoted sides in the opening five gameweeks where the xG inputs are noisy. The simplest value filter: if combined xG is above 2.8 and the Over 2.5 price is above 1.85, that's typically a small but consistent edge.",
      nl: "De Over 2.5 markt is het meest winstgevend wanneer je een mismatch hebt gevonden tussen de gezamenlijke xG-schatting en de impliciete kans van de markt. Goede plekken om te zoeken: wedstrijden tussen twee topclubs (bookmakers prijzen Over 2.5 vaak bijna als coinflip omdat beide verdedigingen georganiseerd zijn, terwijl het aanvallende talent aan beide kanten de echte Poisson-verdeling naar boven trekt), en middenmoter-wedstrijden na een doordeweekse speelronde met veel goals (het publiek trekt de prijs omlaag omdat mensen wedstrijden met weinig goals disproportioneel onthouden). Slechte plekken: derby-wedstrijden waar scheidsrechters historisch voorzichtig zijn en beide kanten de bus parkeren, en wedstrijden met promovendi in de eerste vijf speelrondes waar de xG-inputs ruisig zijn. De simpelste value-filter: als gezamenlijke xG boven 2.8 zit en de Over 2.5 prijs boven 1.85, dan is dat meestal een kleine maar consistente edge.",
    },
    matchesHeading: {
      en: "Today's high-confidence fixtures",
      nl: "De wedstrijden met hoogste confidence vandaag",
    },
    matchesSub: {
      en: "Top 3 matches where our ensemble has the highest overall confidence - a useful shortlist for totals-market research.",
      nl: "Top 3 wedstrijden waar ons ensemble de hoogste confidence heeft - een nuttige shortlist voor totals-markt research.",
    },
    metaTitle: {
      en: "Over 2.5 Goals Predictions & Tips Today · BetsPlug",
      nl: "Over 2.5 Goals Voorspellingen & Tips Vandaag · BetsPlug",
    },
    metaDescription: {
      en: "Free Over 2.5 goals predictions and model reasoning. How Poisson-based totals pricing works and when the market overreacts to low-scoring narratives.",
      nl: "Gratis Over 2.5 goals voorspellingen en model-uitleg. Hoe Poisson-gebaseerde totals-pricing werkt en wanneer de markt overreageert op low-scoring verhalen.",
    },
    faqs: {
      en: [
        {
          q: "Does 2.5 mean 3 goals or 2 goals?",
          a: "Over 2.5 wins if the final total is 3 or more. Under 2.5 wins if the final total is 2 or fewer. The half-goal is a bookmaker convention to guarantee there's never a push - the result is always either Over or Under.",
        },
        {
          q: "How is Over 2.5 pricing calculated?",
          a: "Books start with the joint Poisson distribution of home expected goals (xG) + away xG and integrate the tail from 3 goals upward. In practice they use correlated goal models that slightly reduce the upper-tail probability vs independent Poisson, because in real matches a losing side often goes chasing goals late and inflates the tail.",
        },
        {
          q: "Why do Eredivisie matches price so high on Over 2.5?",
          a: "The Eredivisie averages ~3.2 goals per match - the highest of the top ten European leagues - so the Poisson distribution starts with more mass above 2.5. Books reflect that by pricing Over 2.5 as the favourite in ~65% of Eredivisie fixtures versus ~50% in Serie A.",
        },
        {
          q: "Are late-goal swings a problem for Over 2.5 subscribers?",
          a: "They help, actually. The 90th-minute 'garbage goal' effect means the Over 2.5 market wins more often than independent Poisson would suggest, because losing sides take risks late and the winning side often gets a counter-attacking goal. This is one of the small edges experienced subscribers exploit in the closing-line-value game.",
        },
        {
          q: "Which BetsPlug markets do you expose for totals?",
          a: "The free preview shows 1X2 confidence. Members get Over/Under 2.5 and Over/Under 3.5 implied probabilities derived from the Poisson head of our ensemble. Direct per-fixture probabilities for the goals market are on the roadmap.",
        },
        {
          q: "Is Over 2.5 a good market for accumulators?",
          a: "Yes - it's popular for accas because the prices cluster around 1.70–1.90 and the events are only weakly correlated. A four-leg Over 2.5 acca at average price 1.80 gives ~10.5 odds for four independent picks that each hit 55% - an implied return around 1.70× stake, which is actually a fair long-run expectation on well-chosen legs.",
        },
      ],
      nl: [
        {
          q: "Betekent 2.5 dan 3 goals of 2 goals?",
          a: "Over 2.5 wint als de eindtotaal 3 of meer is. Under 2.5 wint als de eindtotaal 2 of minder is. De halve goal is een bookmakerconventie om te garanderen dat er nooit een push komt - het resultaat is altijd ofwel Over ofwel Under.",
        },
        {
          q: "Hoe wordt Over 2.5-pricing berekend?",
          a: "Bookmakers starten met de gezamenlijke Poisson-verdeling van thuis xG + uit xG en integreren de staart vanaf 3 goals en hoger. In de praktijk gebruiken ze gecorreleerde goalmodellen die de bovenstaart licht verlagen vergeleken met onafhankelijke Poisson, omdat in echte wedstrijden de verliezende ploeg vaak laat op jacht gaat naar goals en de staart opblaast.",
        },
        {
          q: "Waarom prijzen Eredivisie-wedstrijden zo hoog op Over 2.5?",
          a: "De Eredivisie scoort gemiddeld ~3.2 goals per wedstrijd - het hoogste van de top-tien competities in Europa - dus de Poisson-verdeling start met meer massa boven 2.5. Bookmakers weerspiegelen dat door Over 2.5 in ~65% van de Eredivisie-wedstrijden als favoriet te prijzen, versus ~50% in de Serie A.",
        },
        {
          q: "Zijn late goals een probleem voor Over 2.5 spelers?",
          a: "Ze helpen juist. Het 90e-minuut 'garbage goal' effect betekent dat de Over 2.5 markt vaker wint dan onafhankelijke Poisson zou suggereren, omdat verliezende ploegen laat risico nemen en de winnende ploeg vaak een counter-goal maakt. Dit is een van de kleine edges die ervaren spelers uitbuiten in het closing-line-value spel.",
        },
        {
          q: "Welke BetsPlug-markten tonen jullie voor totals?",
          a: "De gratis preview toont 1X2-confidence. Members krijgen Over/Under 2.5 en Over/Under 3.5 impliciete kansen afgeleid uit de Poisson-kop van ons ensemble. Directe per-wedstrijd kansen voor de goalsmarkt staan op de roadmap.",
        },
        {
          q: "Is Over 2.5 een goede markt voor combi's?",
          a: "Ja - het is populair voor acca's omdat de prijzen rond 1.70–1.90 clusteren en de events slechts zwak gecorreleerd zijn. Een 4-leg Over 2.5 acca aan gemiddelde prijs 1.80 geeft ~10.5 odds voor vier onafhankelijke picks die elk 55% raken - een impliciete return rond 1.70× inzet, wat eigenlijk een eerlijke lange-termijn verwachting is op goed gekozen legs.",
        },
      ],
    },
  },
  {
    slug: "double-chance",
    shortCode: "DC",
    name: {
      en: "Double Chance",
      nl: "Double Chance",
    },
    tagline: {
      en: "A lower-variance way to back the favourite without fearing a draw",
      nl: "Een variantiearme manier om op de favoriet te voorspellen zonder angst voor een gelijkspel",
    },
    explainer: {
      en: "Double Chance lets you bet on two of the three possible 1X2 outcomes with a single stake. The three variants are 1X (home win or draw), X2 (away win or draw), and 12 (home win or away win - effectively 'no draw'). You're collapsing variance: instead of needing a specific outcome, you need two out of three. The trade-off is price. If the home team has a 55% implied chance to win and the draw is 25%, then 1X implies 80% - and fair odds land around 1.25. Books add their margin on top, so you usually see 1X prices in the 1.15 – 1.30 range. The market is popular with recreational users who want to 'lock in' a favourite but don't trust the 1X2 price. It's also the safest way to back an underdog: X2 on an away trip to a top-three side typically prices around 1.40 when the raw away-win market sits at 5.50+.",
      nl: "Double Chance laat je met één inzet op twee van de drie mogelijke 1X2-uitkomsten wedden. De drie varianten zijn 1X (thuiswinst of gelijkspel), X2 (uitwinst of gelijkspel) en 12 (thuiswinst of uitwinst - effectief 'geen gelijkspel'). Je reduceert variance: in plaats van een specifieke uitkomst, heb je twee uit drie nodig. De afweging is de prijs. Als de thuisploeg een 55% impliciete winstkans heeft en gelijkspel 25%, dan impliceert 1X 80% - en eerlijke odds liggen rond 1.25. Bookmakers doen hun marge erbovenop, dus je ziet 1X-prijzen meestal in de 1.15 – 1.30 range. De markt is populair bij recreatieve spelers die een favoriet willen 'vastzetten' maar de 1X2-prijs niet vertrouwen. Het is ook de veiligste manier om op een underdog te voorspellen: X2 op een uitwedstrijd bij een topclub prijst meestal rond 1.40 terwijl de rauwe uitwin-markt op 5.50+ staat.",
    },
    strategy: {
      en: "Double Chance is most useful when the raw 1X2 prices misprice the draw. Leagues with high draw rates (Serie A sits around 27%, La Liga around 25%) make X2 and 1X bets structurally attractive because the draw chunk gets fatter. But the draw is also where recreational money piles onto the favourite to win, which depresses the 1X price toward no-value territory. The sharper play is backing X2 on under-estimated away sides: books know the public hates away favourites because of the perceived travel disadvantage, so X2 prices often sit 3–5% above what pure Poisson suggests. For BetsPlug subscribers, the confidence score is a useful filter - only take Double Chance when the 1X2 confidence for the leg you're 'adding' to the bet is above 70%. That prevents the anti-pattern of taking 1X on a match where the draw is the real favourite.",
      nl: "Double Chance is het meest bruikbaar wanneer de rauwe 1X2-prijzen het gelijkspel verkeerd prijzen. Competities met hoge gelijkspelpercentages (Serie A rond 27%, La Liga rond 25%) maken X2- en 1X-voorspellingen structureel aantrekkelijk omdat het gelijkspel-blok dikker wordt. Maar het gelijkspel is ook waar recreatief geld op de favoriet stapelt, wat de 1X-prijs richting geen-value drukt. De scherpere play is X2 inzetten op onderschatte uitploegen: bookmakers weten dat het publiek uit-favorieten haat vanwege het gepercipieerde reisdeel, dus X2-prijzen staan vaak 3–5% boven wat pure Poisson suggereert. Voor BetsPlug-members is de confidence-score een nuttige filter - neem Double Chance alleen wanneer de 1X2-confidence voor het been dat je 'toevoegt' aan de wedstrijd boven 70% ligt. Dat voorkomt het anti-patroon van 1X pakken op een wedstrijd waar het gelijkspel de echte favoriet is.",
    },
    matchesHeading: {
      en: "Highest-confidence fixtures today",
      nl: "Wedstrijden met hoogste confidence vandaag",
    },
    matchesSub: {
      en: "Top 3 matches where our ensemble's 1X2 confidence is highest - a reliable starting point for Double Chance value research.",
      nl: "Top 3 wedstrijden waar onze ensemble 1X2-confidence het hoogst is - een betrouwbare startplek voor Double Chance value research.",
    },
    metaTitle: {
      en: "Double Chance Predictions Explained (1X, X2, 12) · BetsPlug",
      nl: "Double Chance Voorspellingen Uitgelegd (1X, X2, 12) · BetsPlug",
    },
    metaDescription: {
      en: "How Double Chance betting works, why 1X and X2 prices look the way they do, and when the market misprices the draw. Plus today's highest-confidence fixtures.",
      nl: "Hoe Double Chance wedden werkt, waarom 1X- en X2-prijzen eruit zien zoals ze zijn, en wanneer de markt het gelijkspel verkeerd prijst. Plus de wedstrijden met hoogste confidence vandaag.",
    },
    faqs: {
      en: [
        {
          q: "What do 1X, X2 and 12 mean?",
          a: "1 = home win, X = draw, 2 = away win. 1X means 'home win or draw - the away side must not win for you to collect'. X2 means 'away win or draw - the home side must not win'. 12 means 'home or away - the match must not be a draw'.",
        },
        {
          q: "Is Double Chance safer than 1X2?",
          a: "Yes - but 'safer' usually means 'lower return'. Double Chance compresses the win rate but also compresses the price. Long-term yield for a disciplined DC user is usually similar to a disciplined 1X2 user, but the variance is much lower. That makes DC popular with bankroll-conscious players.",
        },
        {
          q: "When does Double Chance outperform 1X2?",
          a: "When you have strong conviction on who will NOT win but weaker conviction on the draw vs the favourite. Example: if you're certain the away side at Anfield will not win, 1X at 1.18 is often better than trying to pick between 1 (at 1.60) and X (at 4.20). The long-run expected value is similar, but the hit rate shoots up to 85%+.",
        },
        {
          q: "What's the downside of Double Chance?",
          a: "You can't 'run up' stakes the way you can with straight 1X2. A 1X bet at 1.20 puts 83% of your stake at risk to win 17% - which means you need ~85% hit rate just to break even after the margin. One bad week of surprising results can wipe out a full month of steady DC profits.",
        },
        {
          q: "Does BetsPlug publish a Double Chance confidence score?",
          a: "Not as a separate number. You can derive it directly from our 1X2 output: 1X confidence = P(home) + P(draw), X2 = P(away) + P(draw), 12 = 1 − P(draw). The free preview shows only the top-outcome confidence, but members can see the full probability triple.",
        },
        {
          q: "Which leagues offer the most Double Chance value?",
          a: "Serie A and La Liga because of their higher draw rates (~27% and ~25% respectively). The extra draw mass means X-inclusive variants price more attractively than in the Premier League or Bundesliga, where draw rates sit closer to 22%.",
        },
      ],
      nl: [
        {
          q: "Wat betekenen 1X, X2 en 12?",
          a: "1 = thuiswinst, X = gelijkspel, 2 = uitwinst. 1X betekent 'thuiswinst of gelijkspel - de uitploeg mag niet winnen'. X2 betekent 'uitwinst of gelijkspel - de thuisploeg mag niet winnen'. 12 betekent 'thuis of uit - de wedstrijd mag niet in een gelijkspel eindigen'.",
        },
        {
          q: "Is Double Chance veiliger dan 1X2?",
          a: "Ja - maar 'veiliger' betekent meestal 'lager rendement'. Double Chance comprimeert het winstpercentage maar comprimeert ook de prijs. Lange-termijn yield voor een gedisciplineerde DC-speler lijkt meestal op die van een gedisciplineerde 1X2-speler, maar de variance is veel lager. Daarom is DC populair bij bankroll-bewuste spelers.",
        },
        {
          q: "Wanneer presteert Double Chance beter dan 1X2?",
          a: "Wanneer je sterk overtuigd bent wie NIET wint maar zwakkere overtuiging hebt over gelijkspel versus favoriet. Voorbeeld: als je zeker weet dat de uitploeg op Anfield niet wint, is 1X op 1.18 vaak beter dan kiezen tussen 1 (op 1.60) en X (op 4.20). De lange-termijn expected value lijkt op elkaar, maar het hitpercentage schiet omhoog naar 85%+.",
        },
        {
          q: "Wat is het nadeel van Double Chance?",
          a: "Je kunt geen grote inzetten 'opbouwen' zoals bij rauwe 1X2. Een 1X-voorspelling op 1.20 zet 83% van je stake op het spel om 17% te winnen - dat betekent dat je ~85% hitpercentage nodig hebt om na marge break-even te zijn. Eén slechte week met verrassende uitslagen kan een volle maand stabiele DC-winsten uitvegen.",
        },
        {
          q: "Publiceert BetsPlug een Double Chance confidence-score?",
          a: "Niet als apart nummer. Je kunt het direct afleiden uit onze 1X2-output: 1X-confidence = P(thuis) + P(gelijk), X2 = P(uit) + P(gelijk), 12 = 1 − P(gelijk). De gratis preview toont alleen de top-uitkomst confidence, maar members zien de volledige kansen-triple.",
        },
        {
          q: "Welke competities bieden de meeste Double Chance value?",
          a: "Serie A en La Liga, vanwege hun hogere gelijkspelpercentages (~27% en ~25% respectievelijk). De extra gelijkspel-massa betekent dat X-inclusieve varianten aantrekkelijker prijzen dan in de Premier League of Bundesliga, waar gelijkspelpercentages dichter bij 22% liggen.",
        },
      ],
    },
  },
  {
    slug: "draw-no-bet",
    shortCode: "DNB",
    name: {
      en: "Draw No Bet",
      nl: "Draw No Bet",
    },
    tagline: {
      en: "Insurance on the draw, priced between 1X2 and Double Chance",
      nl: "Verzekering op het gelijkspel, geprijsd tussen 1X2 en Double Chance",
    },
    explainer: {
      en: "Draw No Bet (DNB) refunds your stake if the match ends in a draw. You pick either home or away; if that team wins you collect the payout, if they lose you lose your stake, and if the match is drawn you get your money back. The price sits structurally between raw 1X2 and Double Chance. If the home team is priced at 2.00 to win and X at 3.40, DNB Home typically prices around 1.55 - slightly lower than 1X (1.30) but meaningfully higher than the raw 1 price (2.00). Mathematically, DNB Home = 1 / (P(home) / (1 − P(draw))). It's a conditional bet: you're paid as if the draw never existed. The market is most useful when you have conviction on which side is better but can't rule out a cagey 0-0 or 1-1 - common in knockout ties, title-deciding matches, and fixtures involving defensively organised mid-table sides.",
      nl: "Draw No Bet (DNB) betaalt je stake terug als de wedstrijd in gelijkspel eindigt. Je kiest thuis of uit; als die ploeg wint krijg je de uitbetaling, als ze verliezen verlies je je stake, en als het gelijkspel wordt krijg je je geld terug. De prijs ligt structureel tussen rauwe 1X2 en Double Chance. Als de thuisploeg op 2.00 geprijsd staat en X op 3.40, dan prijst DNB Thuis meestal rond 1.55 - iets lager dan 1X (1.30) maar beduidend hoger dan de rauwe 1-prijs (2.00). Wiskundig geldt DNB Thuis = 1 / (P(thuis) / (1 − P(gelijk))). Het is een voorwaardelijke wedstrijd: je wordt betaald alsof het gelijkspel nooit bestond. De markt is het nuttigst wanneer je overtuigd bent welke kant beter is maar een behoedzame 0-0 of 1-1 niet kunt uitsluiten - gebruikelijk in knock-outduels, titelbeslissende wedstrijden en duels met defensief georganiseerde middenmoters.",
    },
    strategy: {
      en: "DNB shines in two specific situations. First, knockout matches where the losing side might shut up shop for extra time or penalties - books price the 90-minute draw correctly, but public sentiment on the raw 1 or 2 market is usually wrong about how often cagey football actually delivers a winner. Second, mid-table domestic fixtures where the favourite is a defensively suspect attacking side (Leverkusen, Atalanta, Brighton). If you think they'll create chances and win but worry about a 1-1 on a bad xG night, DNB is safer than 1X (which also collects when the draw happens) and cheaper than a straight 1 bet. Avoid DNB in matches where the draw is the real model favourite - you're paying a premium for insurance on an outcome you couldn't predict anyway. Check the 1X2 confidence first: if the home win probability is below 40%, the draw insurance is not cheap enough.",
      nl: "DNB schittert in twee specifieke situaties. Ten eerste knock-outwedstrijden waar de verliezende ploeg zich mogelijk ingraaft voor verlenging of strafschoppen - bookmakers prijzen het 90-minuten gelijkspel correct, maar de publieke perceptie op de rauwe 1- of 2-markt heeft het meestal mis over hoe vaak behoedzaam voetbal daadwerkelijk een winnaar oplevert. Ten tweede middenmoter-duels waar de favoriet een defensief kwetsbare aanvallende ploeg is (Leverkusen, Atalanta, Brighton). Als je denkt dat ze kansen creëren en winnen maar je zorgen hebt over een 1-1 op een slechte xG-avond, is DNB veiliger dan 1X (die ook uitbetaalt bij gelijkspel) en goedkoper dan een rauwe 1-voorspelling. Vermijd DNB in wedstrijden waar het gelijkspel de echte modelfavoriet is - dan betaal je premie voor verzekering op een uitkomst die je sowieso niet kon voorspellen. Check eerst de 1X2-confidence: als de thuiswinstkans onder 40% ligt, is de gelijkspelverzekering niet goedkoop genoeg.",
    },
    matchesHeading: {
      en: "Today's highest-confidence fixtures",
      nl: "Wedstrijden met hoogste confidence vandaag",
    },
    matchesSub: {
      en: "Top 3 matches where our ensemble has the highest overall confidence - the best candidates for Draw No Bet value plays.",
      nl: "Top 3 wedstrijden waar ons ensemble de hoogste confidence heeft - de beste kandidaten voor Draw No Bet value-plays.",
    },
    metaTitle: {
      en: "Draw No Bet Explained · DNB Tips Today · BetsPlug",
      nl: "Draw No Bet Uitgelegd · DNB Tips Vandaag · BetsPlug",
    },
    metaDescription: {
      en: "What Draw No Bet means, how it's priced versus 1X2 and Double Chance, and when the market gives DNB value. Plus today's most confident fixtures.",
      nl: "Wat Draw No Bet betekent, hoe het wordt geprijsd versus 1X2 en Double Chance, en wanneer de markt DNB-value geeft. Plus de wedstrijden met hoogste confidence vandaag.",
    },
    faqs: {
      en: [
        {
          q: "What happens to my DNB bet if the match is a draw?",
          a: "Your stake is refunded in full. You neither win nor lose - the bet is voided and your money goes back to your account. This is the 'insurance' that differentiates DNB from a straight 1X2 bet.",
        },
        {
          q: "How is DNB pricing calculated?",
          a: "DNB Home = 1 / (P(home win) / (1 − P(draw))). In words: take the home-win probability, divide by the non-draw mass, and invert. Books add their margin on top. For a match with P(home) = 50%, P(draw) = 25%, fair DNB Home is 1 / (0.50 / 0.75) = 1.50.",
        },
        {
          q: "Is DNB the same as the Asian Handicap 0 line?",
          a: "Yes - AH 0 and DNB settle identically. Asian bookmakers often offer slightly better margins on AH 0 because of tighter competition in Asian markets, so if you're comfortable with handicap terminology it's worth price-comparing both.",
        },
        {
          q: "When is DNB worse than Double Chance?",
          a: "When you want to collect on the draw itself. DC 1X pays you if the draw happens; DNB refunds only. If your edge is coming from the draw being underpriced (which happens in Serie A and La Liga), DC is the sharper play.",
        },
        {
          q: "When is DNB better than a raw 1X2 bet?",
          a: "When the favourite's price is short enough that a single unlucky draw wipes out your run. If you like the home team at 1.90 but the league draw rate is 25%, DNB Home at 1.55 has a 62% hit rate vs the 1.90 price at 50% - a smoother equity curve with only modestly lower expected return.",
        },
        {
          q: "Does BetsPlug surface DNB-specific probabilities?",
          a: "Not as a direct number yet. You can derive it from the raw 1X2 triple our model exposes to members. DNB-specific odds on every upcoming match are on the roadmap alongside Asian handicap and over/under surfaces.",
        },
      ],
      nl: [
        {
          q: "Wat gebeurt er met mijn DNB-voorspelling bij gelijkspel?",
          a: "Je stake wordt volledig terugbetaald. Je wint noch verliest - de voorspelling wordt ongedaan gemaakt en je geld gaat terug naar je account. Dit is de 'verzekering' die DNB onderscheidt van een rauwe 1X2-voorspelling.",
        },
        {
          q: "Hoe wordt DNB-pricing berekend?",
          a: "DNB Thuis = 1 / (P(thuiswinst) / (1 − P(gelijk))). In woorden: neem de thuiswin-kans, deel door de niet-gelijkspel massa, en keer om. Bookmakers doen hun marge erbovenop. Voor een wedstrijd met P(thuis) = 50% en P(gelijk) = 25% is eerlijke DNB Thuis 1 / (0.50 / 0.75) = 1.50.",
        },
        {
          q: "Is DNB hetzelfde als de Asian Handicap 0-lijn?",
          a: "Ja - AH 0 en DNB settlen identiek. Aziatische bookmakers bieden vaak iets betere marges op AH 0 door strakkere concurrentie in Aziatische markten, dus als je vertrouwd bent met handicap-terminologie loont het om beide te vergelijken.",
        },
        {
          q: "Wanneer is DNB slechter dan Double Chance?",
          a: "Wanneer je wilt uitbetalen op het gelijkspel zelf. DC 1X betaalt je als het gelijkspel gebeurt; DNB geeft alleen refund. Als jouw edge komt van een onderprijsd gelijkspel (wat gebeurt in Serie A en La Liga), is DC de scherpere play.",
        },
        {
          q: "Wanneer is DNB beter dan een rauwe 1X2-voorspelling?",
          a: "Wanneer de favoriet-prijs zo kort is dat één pechgelijkspel je reeks uitveegt. Als je de thuisploeg ziet op 1.90 maar het competitie-gelijkspelpercentage is 25%, dan heeft DNB Thuis op 1.55 een 62% hitpercentage versus de 1.90-prijs op 50% - een gladdere equity-curve met slechts marginaal lager verwacht rendement.",
        },
        {
          q: "Toont BetsPlug DNB-specifieke kansen?",
          a: "Nog niet als directe nummer. Je kunt het afleiden uit de rauwe 1X2-triple die ons model aan members toont. DNB-specifieke odds op elke aanstaande wedstrijd staan op de roadmap naast Asian handicap en over/under surfaces.",
        },
      ],
    },
  },
];

function expandSeedBetType(seed: SeedBetTypeHub): BetTypeHub {
  return {
    slug: seed.slug,
    shortCode: seed.shortCode,
    name: expandStringLocales(seed.name),
    tagline: expandStringLocales(seed.tagline),
    explainer: expandStringLocales(seed.explainer),
    strategy: expandStringLocales(seed.strategy),
    matchesHeading: expandStringLocales(seed.matchesHeading),
    matchesSub: expandStringLocales(seed.matchesSub),
    metaTitle: expandStringLocales(seed.metaTitle),
    metaDescription: expandStringLocales(seed.metaDescription),
    faqs: expandArrayLocales(seed.faqs),
  };
}

export const BET_TYPE_HUBS: BetTypeHub[] =
  _SEED_BET_TYPE_HUBS.map(expandSeedBetType);

/* ── Lookup helpers ───────────────────────────────────────── */

export function getBetTypeHub(slug: string): BetTypeHub | undefined {
  return BET_TYPE_HUBS.find((h) => h.slug === slug);
}

export function getAllBetTypeHubSlugs(): string[] {
  return BET_TYPE_HUBS.map((h) => h.slug);
}

/**
 * Editorial locale pass-through. All 16 locales resolve via EN
 * fallback now that bet-type seed data is expanded at init.
 */
export function pickBetTypeHubLocale(uiLocale: string): BetTypeHubLocale {
  return isLocale(uiLocale) ? uiLocale : "en";
}
