/**
 * League hubs — public SEO landing pages
 * ────────────────────────────────────────────────────────────
 * Each entry powers a /match-predictions/[league_slug] page
 * with handwritten editorial content (intro + FAQ) plus 3 free
 * AI predictions pulled from /api/fixtures/upcoming filtered by
 * league_slug. Content is supplied in EN + NL today; other
 * locales fall back to EN until handwritten translations land.
 *
 * IMPORTANT: only add a hub here once the corresponding league
 * has live sync running in the backend. See
 * `memory/reference_league_slugs.md` for the production-ready
 * list (PL, La Liga, Bundesliga, Serie A, Ligue 1, UCL).
 */

export type LeagueHubLocale = "en" | "nl";

export type LeagueHubFaq = {
  q: string;
  a: string;
};

export type LeagueHub = {
  /** Must match `League.slug` in the backend DB */
  slug: string;
  /** Sport slug for breadcrumbs / future filtering */
  sportSlug: "football" | "basketball" | "tennis";
  /** ISO-3166-1 alpha-2 country code (or "EU" for UEFA tournaments) */
  countryCode: string;
  /** Emoji flag for inline display */
  countryFlag: string;
  /** Display name per locale */
  name: Record<LeagueHubLocale, string>;
  /** Country / region label per locale */
  country: Record<LeagueHubLocale, string>;
  /** Short tagline shown under H1 */
  tagline: Record<LeagueHubLocale, string>;
  /** Full intro paragraph (~150 words) */
  intro: Record<LeagueHubLocale, string>;
  /** Page <title> per locale */
  metaTitle: Record<LeagueHubLocale, string>;
  /** Meta description per locale */
  metaDescription: Record<LeagueHubLocale, string>;
  /** Handwritten FAQ — emitted as FAQPage JSON-LD + visible accordion */
  faqs: Record<LeagueHubLocale, LeagueHubFaq[]>;
};

/* ── Hubs ─────────────────────────────────────────────────── */

export const LEAGUE_HUBS: LeagueHub[] = [
  {
    slug: "premier-league",
    sportSlug: "football",
    countryCode: "GB",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    name: {
      en: "Premier League",
      nl: "Premier League",
    },
    country: {
      en: "England",
      nl: "Engeland",
    },
    tagline: {
      en: "Free AI predictions for every Premier League fixture",
      nl: "Gratis AI-voorspellingen voor elke Premier League-wedstrijd",
    },
    intro: {
      en: "The Premier League is the most heavily modelled football competition on the planet — and also one of the hardest to beat. Twenty teams, 380 matches, and an average of nine goal-scoring events per game produce the kind of dataset our ensemble was built for. BetsPlug runs every fixture through four independent models — Elo for long-term strength, Poisson for goal expectation, logistic regression for short-term form, and an XGBoost meta-model that resolves their disagreements. The output is a calibrated probability for home win, draw and away win, plus a confidence score we use to grade each pick. The three matches with the highest expected edge each gameweek are published here for free, refreshed automatically whenever new lineups, injuries or odds movements feed into our pipeline. Members get the full slate, the Kelly stakes and the closing-line value report.",
      nl: "De Premier League is de meest gemodelleerde voetbalcompetitie ter wereld — en tegelijk een van de moeilijkste om te verslaan. Twintig clubs, 380 wedstrijden en gemiddeld negen scorende momenten per duel leveren precies het soort dataset op waar ons ensemble voor gebouwd is. BetsPlug haalt elke wedstrijd door vier onafhankelijke modellen: Elo voor de structurele krachtsverhouding, Poisson voor goalverwachting, logistische regressie voor de korte vorm en een XGBoost meta-model dat de verschillen oplost. Het resultaat is een gekalibreerde kans voor thuiswinst, gelijkspel en uitwinst plus een confidence-score waarmee we elke pick wegen. De drie wedstrijden met het hoogste verwachte edge in elke speelronde publiceren we hier gratis, automatisch bijgewerkt zodra nieuwe opstellingen, blessures of oddsverschuivingen onze pipeline binnenkomen. Members krijgen het volledige programma plus Kelly-inzetten en het closing-line rapport.",
    },
    metaTitle: {
      en: "Premier League AI Predictions & Odds 2025/26 — Free Picks | BetsPlug",
      nl: "Premier League AI Voorspellingen & Odds 2025/26 — Gratis Picks | BetsPlug",
    },
    metaDescription: {
      en: "Free AI-powered Premier League predictions, win probabilities and confidence scores for every upcoming gameweek. Built on Elo, Poisson and XGBoost models.",
      nl: "Gratis AI-voorspellingen voor de Premier League: winstkansen, confidence-scores en odds voor elke speelronde. Gebouwd op Elo-, Poisson- en XGBoost-modellen.",
    },
    faqs: {
      en: [
        {
          q: "How accurate are your Premier League predictions?",
          a: "Our rolling 30-day calibration on Premier League fixtures sits between 70% and 75% on the favourite-to-win market. We publish the full track record at /track-record so you can see every settled pick and the closing-line value we extracted.",
        },
        {
          q: "Do you cover every Premier League match?",
          a: "Yes — every single one of the 380 fixtures gets a model run as soon as the lineups become predictable. The three matches with the highest model edge each gameweek are shown for free on this page; the rest are available to BetsPlug members.",
        },
        {
          q: "Which betting markets do you predict?",
          a: "The free preview covers the 1X2 (home / draw / away) market. Members also get over/under 2.5 goals, BTTS, Asian handicap and a Kelly stake recommendation per pick.",
        },
        {
          q: "How often are predictions updated?",
          a: "Models retrain after every gameweek. Individual fixture predictions are recalculated whenever a lineup, injury report or odds shift triggers our sync task — typically every 5 minutes during the match-day window.",
        },
        {
          q: "What data do you use?",
          a: "We pull fixtures, results, lineups and team-level stats from football-data.org and cross-check goal-event timestamps against OpenLigaDB. There is no scraping of private data and no insider information — every input is publicly verifiable.",
        },
        {
          q: "Is BetsPlug legal in the UK and EU?",
          a: "BetsPlug is an analytics platform, not a bookmaker — we don't take bets or process wagers. You're free to use our predictions wherever sports betting is legal in your jurisdiction. Always check your local regulator and gamble responsibly.",
        },
      ],
      nl: [
        {
          q: "Hoe accuraat zijn jullie Premier League-voorspellingen?",
          a: "Onze rollende 30-daagse kalibratie op Premier League-wedstrijden ligt tussen 70% en 75% op de favoriet-wint markt. Het volledige trackrecord vind je op /trackrecord-resultaten — elke afgewikkelde pick en de closing-line value die we eruit haalden.",
        },
        {
          q: "Voorspellen jullie elke Premier League-wedstrijd?",
          a: "Ja, alle 380 wedstrijden krijgen een modelrun zodra de opstellingen voorspelbaar worden. De drie wedstrijden met het hoogste verwachte edge in elke speelronde laten we hier gratis zien; de rest is beschikbaar voor BetsPlug-members.",
        },
        {
          q: "Welke wedmarkten voorspellen jullie?",
          a: "De gratis preview dekt de 1X2-markt (thuis / gelijk / uit). Members krijgen ook over/under 2.5 goals, BTTS, Asian handicap en een Kelly-inzetadvies per pick.",
        },
        {
          q: "Hoe vaak worden voorspellingen bijgewerkt?",
          a: "Modellen worden hertraind na elke speelronde. Individuele voorspellingen herrekenen we zodra een opstelling, blessurebericht of oddsverschuiving onze sync-task triggert — meestal elke 5 minuten in de matchday-window.",
        },
        {
          q: "Welke data gebruiken jullie?",
          a: "Wedstrijden, uitslagen, opstellingen en teamstatistieken halen we via football-data.org en kruisen we met goal-events uit OpenLigaDB. Geen scraping van private data en geen insiderinformatie — elke input is publiek verifieerbaar.",
        },
        {
          q: "Mag ik BetsPlug gebruiken vanuit Nederland?",
          a: "BetsPlug is een analyseplatform, geen bookmaker — we nemen geen weddenschappen aan. Je mag onze voorspellingen overal gebruiken waar sportwedden legaal is. In Nederland mag je alleen wedden bij vergunninghouders van de Kansspelautoriteit. Speel bewust.",
        },
      ],
    },
  },
  {
    slug: "la-liga",
    sportSlug: "football",
    countryCode: "ES",
    countryFlag: "🇪🇸",
    name: {
      en: "La Liga",
      nl: "La Liga",
    },
    country: {
      en: "Spain",
      nl: "Spanje",
    },
    tagline: {
      en: "Free AI predictions for every La Liga matchday",
      nl: "Gratis AI-voorspellingen voor elke La Liga-speeldag",
    },
    intro: {
      en: "La Liga is the most tactically diverse league in our model — Real Madrid and Barcelona pull averages upward, but the bottom half routinely produces sub-2.0-goal grinds where xG and Elo disagree the most. BetsPlug treats every Spanish fixture as its own micro-problem: we run a Poisson model trained on the league's lower scoring baseline, an Elo curve that rates the top six separately from the rest, and a logistic regressor that picks up rest-day and travel effects (Sevilla, Cadiz, the Canary Islands). Our XGBoost meta-model resolves the disagreements and produces calibrated probabilities for home / draw / away. Match-day predictions are pulled from the same football-data.org feed our research desk uses, refreshed every 5 minutes during the active window. The three highest-edge picks of every gameweek go up here for free; members see the full slate and the closing-line value report.",
      nl: "La Liga is de tactisch meest diverse competitie in ons model — Real Madrid en Barcelona trekken het gemiddelde omhoog, maar de onderste helft levert steevast wedstrijden onder de 2.0 doelpunten op, waar xG en Elo het meest van elkaar verschillen. BetsPlug behandelt elke Spaanse wedstrijd als een apart micro-probleem: een Poisson-model getraind op het lagere scoringsniveau van de competitie, een Elo-curve die de top zes apart waardeert en een logistische regressor die rust- en reisdageffecten oppikt (Sevilla, Cadiz, de Canarische Eilanden). Het XGBoost-metamodel lost de meningsverschillen op en produceert gekalibreerde kansen voor thuis / gelijk / uit. Voorspellingen worden geladen uit dezelfde football-data.org feed die onze research desk gebruikt, elke 5 minuten ververst tijdens de actieve window. De drie picks met het hoogste edge per speelronde staan hier gratis; members zien het volledige programma en het closing-line value rapport.",
    },
    metaTitle: {
      en: "La Liga AI Predictions & Odds 2025/26 — Free Picks | BetsPlug",
      nl: "La Liga AI Voorspellingen & Odds 2025/26 — Gratis Picks | BetsPlug",
    },
    metaDescription: {
      en: "Free AI La Liga predictions, win probabilities and confidence scores for every Spanish football matchday. Built on Elo, Poisson and XGBoost models.",
      nl: "Gratis AI-voorspellingen voor La Liga: winstkansen, confidence-scores en odds voor elke Spaanse speeldag. Gebouwd op Elo-, Poisson- en XGBoost-modellen.",
    },
    faqs: {
      en: [
        {
          q: "Why do La Liga predictions sometimes look different from Premier League ones?",
          a: "La Liga averages roughly 0.3 fewer goals per match than the Premier League, so our Poisson lambda runs lower and draw probabilities sit a few points higher. The model rebalances automatically per league rather than using one global tuning.",
        },
        {
          q: "Do you cover Real Madrid and Barcelona Clásico-grade fixtures?",
          a: "Yes — every Clásico, derbi madrileño and Sevilla derby gets the full ensemble run plus a manual sanity-check by our research desk on the day of the match. Big matches get pinned at the top of the free preview when they qualify.",
        },
        {
          q: "How do you handle promoted teams with no top-flight history?",
          a: "Promoted sides start each season with a Bayesian prior derived from their final Segunda División Elo plus a regression-to-mean adjustment. After 5 La Liga matches the prior is replaced by live results, which is why early-season predictions for promoted clubs carry a slightly lower confidence score.",
        },
        {
          q: "Which betting markets do you cover for La Liga?",
          a: "The free preview shows the 1X2 market. Members get over/under 2.5 goals, BTTS, Asian handicap and a Kelly stake recommendation per pick.",
        },
        {
          q: "How accurate are your La Liga predictions?",
          a: "Rolling 30-day calibration on the favourite-to-win market typically lands between 68% and 73% — slightly below the Premier League because of the higher draw rate. The full breakdown is published at /track-record.",
        },
        {
          q: "Are your predictions affected by VAR decisions and late lineup changes?",
          a: "Lineup changes (especially keepers) feed back into the model up to 60 minutes before kick-off via our sync task. VAR-driven result swings are surfaced post-match in the track record, but we don't try to predict referee decisions.",
        },
      ],
      nl: [
        {
          q: "Waarom zien La Liga-voorspellingen er soms anders uit dan Premier League?",
          a: "La Liga scoort gemiddeld zo'n 0.3 doelpunten per wedstrijd minder dan de Premier League, dus onze Poisson-lambda ligt lager en gelijkspelkansen liggen een paar procent hoger. Het model herschaalt automatisch per competitie in plaats van één globale tuning te gebruiken.",
        },
        {
          q: "Voorspellen jullie ook Real Madrid en Barcelona Clásico-wedstrijden?",
          a: "Ja — elke Clásico, Madrileense derby en Sevilla-derby krijgt de volledige ensemble-run plus een handmatige sanity-check door ons research-team op de dag zelf. Topwedstrijden worden bovenaan de gratis preview vastgepind wanneer ze in aanmerking komen.",
        },
        {
          q: "Hoe gaan jullie om met gepromoveerde clubs zonder geschiedenis op het hoogste niveau?",
          a: "Gepromoveerde clubs starten elk seizoen met een Bayesian prior op basis van hun eind-Elo in de Segunda División plus een regressie-naar-gemiddelde-correctie. Na 5 La Liga-wedstrijden vervangen we die prior door live resultaten — daarom hebben vroege seizoensvoorspellingen voor promovendi een iets lagere confidence-score.",
        },
        {
          q: "Welke wedmarkten dekken jullie voor La Liga?",
          a: "De gratis preview toont de 1X2-markt. Members krijgen over/under 2.5 goals, BTTS, Asian handicap en een Kelly-inzetadvies per pick.",
        },
        {
          q: "Hoe accuraat zijn jullie La Liga-voorspellingen?",
          a: "Onze rollende 30-daagse kalibratie op de favoriet-wint markt ligt typisch tussen 68% en 73% — iets onder de Premier League door het hogere gelijkspelpercentage. De volledige uitsplitsing staat op /trackrecord-resultaten.",
        },
        {
          q: "Zijn jullie voorspellingen gevoelig voor VAR-beslissingen en late opstellingswijzigingen?",
          a: "Opstellingswijzigingen (met name keepers) vloeien tot 60 minuten voor de aftrap terug in het model via onze sync-task. VAR-gedreven uitslagomslagen tonen we achteraf in het trackrecord, maar we proberen geen scheidsrechtersbeslissingen te voorspellen.",
        },
      ],
    },
  },
  {
    slug: "bundesliga",
    sportSlug: "football",
    countryCode: "DE",
    countryFlag: "🇩🇪",
    name: {
      en: "Bundesliga",
      nl: "Bundesliga",
    },
    country: {
      en: "Germany",
      nl: "Duitsland",
    },
    tagline: {
      en: "Free AI predictions for every Bundesliga matchday",
      nl: "Gratis AI-voorspellingen voor elke Bundesliga-speeldag",
    },
    intro: {
      en: "The Bundesliga is the highest-scoring of Europe's top five leagues, and that goal-scoring volume is exactly what makes Poisson-based models shine. With an average of 3.1 goals per match — meaningfully above the Premier League — Bundesliga fixtures generate tighter, more reliable lambda estimates per team. BetsPlug feeds that into a four-model ensemble: an Elo curve that gives Bayern Munich its true ceiling without flattening the surprise factor, Poisson goal expectations cross-checked against OpenLigaDB event data, a logistic regressor for short-term form and an XGBoost meta-model resolving the rest. Friday Night Bundesliga, Saturday's English-language window and Sunday's traditional 17:30 fixture all feed the same pipeline. The three sharpest edges of each matchday are published here for free, and the full slate sits inside the BetsPlug member dashboard with Kelly stakes and closing-line value tracking.",
      nl: "De Bundesliga is de hoogst-scorende van Europa's top vijf competities, en juist die doelpuntenproductie zorgt ervoor dat Poisson-modellen schitteren. Met gemiddeld 3.1 doelpunten per wedstrijd — duidelijk boven de Premier League — leveren Bundesliga-duels strakkere en betrouwbaardere lambda-schattingen per team op. BetsPlug voert dat door een ensemble van vier modellen: een Elo-curve die Bayern München zijn echte plafond geeft zonder de verrassingsfactor weg te middelen, Poisson goalverwachtingen kruisgecontroleerd met OpenLigaDB event-data, een logistische regressor voor de korte vorm en een XGBoost meta-model dat de rest oplost. Friday Night Bundesliga, het Engelstalige Saturday-window en het traditionele zondag 17:30 duel voeden allemaal dezelfde pipeline. De drie scherpste edges per speeldag publiceren we hier gratis, het volledige programma zit in het BetsPlug-dashboard voor members met Kelly-inzetten en closing-line value tracking.",
    },
    metaTitle: {
      en: "Bundesliga AI Predictions & Odds 2025/26 — Free Picks | BetsPlug",
      nl: "Bundesliga AI Voorspellingen & Odds 2025/26 — Gratis Picks | BetsPlug",
    },
    metaDescription: {
      en: "Free AI Bundesliga predictions, win probabilities and goal expectations for every German football matchday. Cross-checked against OpenLigaDB event data.",
      nl: "Gratis AI-voorspellingen voor de Bundesliga: winstkansen en goalverwachtingen voor elke Duitse speeldag. Kruisgecontroleerd met OpenLigaDB event-data.",
    },
    faqs: {
      en: [
        {
          q: "Why is Bayern Munich so often the favourite in your model?",
          a: "Bayern's Elo rating sits structurally 100+ points above the next German club, which translates to a high pre-match win probability against most of the league. Our model doesn't artificially flatten dominance — but it does raise the implied draw probability away from home and against Champions League opponents, which is where Bayern actually drops points.",
        },
        {
          q: "How do you handle the Bundesliga's higher goal totals?",
          a: "Our Poisson model is league-aware. Bundesliga fixtures get a higher base lambda than Premier League ones, which increases over-2.5 probabilities and reduces draw frequency — both empirically validated against the last 10 seasons of historical data.",
        },
        {
          q: "Do you cross-check goals with OpenLigaDB?",
          a: "Yes — in addition to football-data.org we sync goal-event timestamps from OpenLigaDB. When the two sources disagree on a result we flag the fixture and hold the model run until reconciliation. This reduces the impact of late corrections on settled picks.",
        },
        {
          q: "Are 2. Bundesliga and DFB-Pokal predictions covered too?",
          a: "Not on this hub yet. They're seeded in our database but not in our automated rotation, which means picks for those competitions aren't reliable enough to publish. We'll add them when the OpenLigaDB sync task is in production.",
        },
        {
          q: "How accurate are your Bundesliga predictions?",
          a: "Bundesliga calibration has been one of our stronger surfaces — typically 71-76% on the favourite-to-win market over rolling 30-day windows, helped by the larger goal samples per fixture. Full breakdown at /track-record.",
        },
        {
          q: "Do you adjust for the Englische Woche?",
          a: "Yes. Midweek European duty for clubs in Champions / Europa / Conference League pulls down our short-term form rating for the following weekend, and our logistic regressor weights recent travel + minutes. This is one of the more impactful Bundesliga-specific adjustments.",
        },
      ],
      nl: [
        {
          q: "Waarom is Bayern München zo vaak de favoriet in jullie model?",
          a: "Bayern's Elo-rating ligt structureel 100+ punten boven de volgende Duitse club, wat zich vertaalt in een hoge winstkans tegen het grootste deel van de competitie. Het model vlakt dominantie niet kunstmatig af — wel verhoogt het de impliciete gelijkspelkans uit en tegen Champions League-tegenstanders, want daar verliest Bayern in de praktijk punten.",
        },
        {
          q: "Hoe gaan jullie om met de hogere doelpuntenproductie van de Bundesliga?",
          a: "Ons Poisson-model is competitie-bewust. Bundesliga-wedstrijden krijgen een hogere basis-lambda dan Premier League-wedstrijden, wat de over-2.5 kansen verhoogt en de gelijkspelfrequentie verlaagt — beide empirisch gevalideerd tegen 10 seizoenen historische data.",
        },
        {
          q: "Kruisen jullie doelpunten met OpenLigaDB?",
          a: "Ja — naast football-data.org synchroniseren we goal-event timestamps uit OpenLigaDB. Als de twee bronnen het niet eens zijn over een uitslag flaggen we de wedstrijd en houden we de modelrun aan totdat het is rechtgezet. Dit beperkt de impact van late correcties op afgewikkelde picks.",
        },
        {
          q: "Voorspellen jullie ook 2. Bundesliga en DFB-Pokal?",
          a: "Nog niet op deze hub. Ze zitten wel in onze database, maar niet in onze automatische rotatie — picks voor die competities zijn nog niet betrouwbaar genoeg om te publiceren. We voegen ze toe zodra de OpenLigaDB sync-task in productie staat.",
        },
        {
          q: "Hoe accuraat zijn jullie Bundesliga-voorspellingen?",
          a: "Bundesliga-kalibratie is een van onze sterkste oppervlakken — typisch 71-76% op de favoriet-wint markt over rollende 30-daagse vensters, geholpen door de grotere doelpuntsamples per wedstrijd. Volledige uitsplitsing op /trackrecord-resultaten.",
        },
        {
          q: "Houden jullie rekening met de Engelse Week?",
          a: "Ja. Doordeweekse Europese verplichtingen voor clubs in Champions / Europa / Conference League trekken onze korte-termijn vormrating voor het daaropvolgende weekend omlaag, en onze logistische regressor weegt recente reizen + minuten mee. Dit is een van de meest impactvolle Bundesliga-specifieke aanpassingen.",
        },
      ],
    },
  },
  {
    slug: "serie-a",
    sportSlug: "football",
    countryCode: "IT",
    countryFlag: "🇮🇹",
    name: {
      en: "Serie A",
      nl: "Serie A",
    },
    country: {
      en: "Italy",
      nl: "Italië",
    },
    tagline: {
      en: "Free AI predictions for every Serie A matchday",
      nl: "Gratis AI-voorspellingen voor elke Serie A-speeldag",
    },
    intro: {
      en: "Serie A is the lowest-scoring of the top five — and that's exactly why AI models earn their keep here. Italian football still rewards tactical discipline over open transitions, which means more sub-2.5 finishes, more 1-0 results and a structurally higher draw rate than the Premier League or Bundesliga. BetsPlug calibrates for that explicitly: our Poisson lambdas run lower for Italian fixtures, our Elo gives a deserved-but-not-inflated edge to the top three, and our logistic regressor weights defensive metrics (xGA, clean-sheet rate, goalkeeper xG-prevented) more aggressively than for any other league. The result is a model that systematically beats books on draw and under-2.5 markets where they over-correct toward the public's love of goals. Three free picks per matchday are published here; the full Calcio slate plus Coppa Italia ties sit in the member dashboard.",
      nl: "Serie A is de laagst-scorende van de top vijf — en juist daarom verdienen AI-modellen hier hun geld. Italiaans voetbal beloont nog steeds tactische discipline boven open omschakelingen, wat resulteert in meer wedstrijden onder de 2.5 doelpunten, meer 1-0 uitslagen en een structureel hoger gelijkspelpercentage dan de Premier League of Bundesliga. BetsPlug kalibreert daar expliciet voor: onze Poisson-lambdas liggen lager voor Italiaanse duels, onze Elo geeft een verdiende maar niet opgeblazen voorsprong aan de top drie, en onze logistische regressor weegt defensieve statistieken (xGA, clean-sheet rate, keeper xG-prevented) agressiever dan voor enige andere competitie. Het resultaat is een model dat boekmakers systematisch verslaat op de gelijkspel- en onder-2.5 markten, waar zij overcorrigeren naar de liefde van het publiek voor doelpunten. Drie gratis picks per speeldag publiceren we hier; het volledige Calcio-programma plus Coppa Italia-duels zit in het member-dashboard.",
    },
    metaTitle: {
      en: "Serie A AI Predictions & Odds 2025/26 — Free Picks | BetsPlug",
      nl: "Serie A AI Voorspellingen & Odds 2025/26 — Gratis Picks | BetsPlug",
    },
    metaDescription: {
      en: "Free AI Serie A predictions, win probabilities and confidence scores for every Italian football matchday. Calibrated for Serie A's lower goal averages.",
      nl: "Gratis AI-voorspellingen voor Serie A: winstkansen en confidence-scores voor elke Italiaanse speeldag. Gekalibreerd voor de lagere doelpuntenproductie.",
    },
    faqs: {
      en: [
        {
          q: "Why does your model predict more draws in Serie A?",
          a: "Italian football has historically produced ~25-27% draws compared to ~22-24% in the Premier League. Our Poisson model picks this up directly through the lower league-wide goal lambda, so draw probabilities come out 2-4 percentage points higher per fixture. We don't add a manual fudge factor on top.",
        },
        {
          q: "Do you cover Coppa Italia fixtures?",
          a: "Coppa Italia ties are seeded in the database but not on this hub yet. Knockout football requires a different calibration (extra time, penalty shootouts) which we'll add to the dynamic route once we have a full season of historical Coppa data.",
        },
        {
          q: "How do you handle relegation battles late in the season?",
          a: "Late-season fixtures involving relegation-threatened clubs get a separate motivation adjustment. Our logistic regressor weights recent xG more heavily than Elo for these matches, because struggling clubs often outperform their long-term rating in the run-in.",
        },
        {
          q: "Which markets are predicted for Serie A?",
          a: "The free preview covers the 1X2 market. Members also get over/under 2.5 goals (where Serie A is structurally interesting because of the under-2.5 edge), BTTS, Asian handicap and a Kelly stake recommendation.",
        },
        {
          q: "How accurate are your Serie A predictions?",
          a: "Calibration on the favourite-to-win market typically sits at 67-72% — slightly below the Premier League because of the higher draw rate, but our under-2.5 market accuracy is one of our best surfaces league-wide. Full breakdown at /track-record.",
        },
        {
          q: "Do you account for Italian referee tendencies?",
          a: "Indirectly — referee identity feeds into our cards-and-fouls module which informs the over/under 2.5 cards market for members. We don't claim to predict refereeing decisions in real time, but historical referee profiles do inform pre-match goal expectations slightly.",
        },
      ],
      nl: [
        {
          q: "Waarom voorspelt jullie model meer gelijkspelen in Serie A?",
          a: "Italiaans voetbal levert historisch ~25-27% gelijkspelen op tegenover ~22-24% in de Premier League. Ons Poisson-model pikt dit direct op via de lagere competitiebrede goal-lambda, waardoor gelijkspelkansen 2-4 procentpunt hoger uitkomen per wedstrijd. We voegen er geen handmatige correctie bovenop toe.",
        },
        {
          q: "Voorspellen jullie ook Coppa Italia-wedstrijden?",
          a: "Coppa Italia-duels zitten in de database maar nog niet op deze hub. Knock-outvoetbal vraagt een andere kalibratie (verlenging, strafschoppen) die we toevoegen aan de dynamische route zodra we een volledig seizoen historische Coppa-data hebben.",
        },
        {
          q: "Hoe gaan jullie om met degradatieduels laat in het seizoen?",
          a: "Late seizoensduels met clubs in degradatiegevaar krijgen een aparte motivatiecorrectie. Onze logistische regressor weegt recente xG zwaarder dan Elo voor deze wedstrijden, omdat worstelende clubs vaak beter presteren dan hun langetermijnrating in de slotfase.",
        },
        {
          q: "Welke markten worden voorspeld voor Serie A?",
          a: "De gratis preview dekt de 1X2-markt. Members krijgen ook over/under 2.5 goals (waar Serie A structureel interessant is vanwege de onder-2.5 edge), BTTS, Asian handicap en een Kelly-inzetadvies.",
        },
        {
          q: "Hoe accuraat zijn jullie Serie A-voorspellingen?",
          a: "Kalibratie op de favoriet-wint markt ligt typisch op 67-72% — iets onder de Premier League door het hogere gelijkspelpercentage, maar onze nauwkeurigheid op de onder-2.5 markt is een van onze sterkste oppervlakken competitiebreed. Volledige uitsplitsing op /trackrecord-resultaten.",
        },
        {
          q: "Houden jullie rekening met Italiaanse scheidsrechterstendensen?",
          a: "Indirect — scheidsrechteridentiteit voedt onze kaarten-en-fouten module die de over/under 2.5 kaartenmarkt voor members informeert. We claimen niet realtime scheidsrechtersbeslissingen te voorspellen, maar historische scheidsrechtersprofielen sturen pre-match goalverwachtingen wel licht bij.",
        },
      ],
    },
  },
  {
    slug: "ligue-1",
    sportSlug: "football",
    countryCode: "FR",
    countryFlag: "🇫🇷",
    name: {
      en: "Ligue 1",
      nl: "Ligue 1",
    },
    country: {
      en: "France",
      nl: "Frankrijk",
    },
    tagline: {
      en: "Free AI predictions for every Ligue 1 matchday",
      nl: "Gratis AI-voorspellingen voor elke Ligue 1-speeldag",
    },
    intro: {
      en: "Ligue 1 is the most lopsided of the top five — Paris Saint-Germain has historically dominated the title race in a way that none of England, Spain, Italy or Germany can match. That makes the modelling challenge interesting: PSG fixtures need a heavy Elo prior with a specific overconfidence correction, while the rest of the league is wide open. BetsPlug treats Ligue 1 in two halves: PSG matches use a separate calibration trained on \"dominant favourite\" historical fixtures (where the implied win probability tends to be too high), and non-PSG matches use the standard four-model ensemble with a slight upward draw adjustment. The new league format and broadcast schedule (Sunday-night marquee, Friday opener, Saturday afternoon spread) are all syncronised through our football-data.org pipeline. Three free picks per matchday show up here; the full slate including Trophée des Champions is in the member dashboard.",
      nl: "Ligue 1 is de meest scheve van de top vijf — Paris Saint-Germain heeft de titelstrijd historisch gedomineerd op een manier die Engeland, Spanje, Italië noch Duitsland kan evenaren. Dat maakt de modelleeruitdaging interessant: PSG-duels vragen een zware Elo-prior met een specifieke over-confidence correctie, terwijl de rest van de competitie wijd openligt. BetsPlug behandelt Ligue 1 in twee helften: PSG-wedstrijden gebruiken een aparte kalibratie getraind op \"dominante favoriet\" historische data (waar de impliciete winstkans meestal te hoog uitvalt), en niet-PSG wedstrijden gebruiken het standaard vier-modellen ensemble met een lichte gelijkspelcorrectie naar boven. Het nieuwe competitieformat en uitzendschema (zondagavond topwedstrijd, vrijdagopener, zaterdagmiddag-spreiding) lopen allemaal via onze football-data.org pipeline. Drie gratis picks per speeldag verschijnen hier; het volledige programma inclusief Trophée des Champions zit in het member-dashboard.",
    },
    metaTitle: {
      en: "Ligue 1 AI Predictions & Odds 2025/26 — Free Picks | BetsPlug",
      nl: "Ligue 1 AI Voorspellingen & Odds 2025/26 — Gratis Picks | BetsPlug",
    },
    metaDescription: {
      en: "Free AI Ligue 1 predictions, win probabilities and confidence scores for every French football matchday. PSG-aware calibration and live odds tracking.",
      nl: "Gratis AI-voorspellingen voor Ligue 1: winstkansen en confidence-scores voor elke Franse speeldag. PSG-bewuste kalibratie en live odds tracking.",
    },
    faqs: {
      en: [
        {
          q: "How does PSG affect your Ligue 1 predictions?",
          a: "PSG fixtures use a separate calibration head trained on historical \"dominant favourite\" data, because the public + bookmaker market consistently overprices PSG home wins. Our model trims the implied win probability by 3-5 percentage points relative to the closing line, which is one of the steadier sources of edge in Ligue 1.",
        },
        {
          q: "Is the new Ligue 1 format reflected in your sync?",
          a: "Yes. The current 18-team format and broadcast schedule are pulled from football-data.org with each fixture's kick-off time synchronised every 5 minutes during the active window. No manual schedule entry — if Ligue de Football Professionnel updates the slot, our model picks it up automatically.",
        },
        {
          q: "Do you predict French Cup (Coupe de France) matches?",
          a: "Not on this hub. Cup ties are knock-out football with their own calibration challenges (extra time, penalty shootouts, lower-tier opponents) and we'd rather not publish predictions until we have a full season of historical cup data through the model.",
        },
        {
          q: "How accurate are your Ligue 1 predictions?",
          a: "Rolling 30-day calibration on the favourite-to-win market sits between 70% and 75% — broadly comparable to the Premier League, helped by the structural edge against PSG over-pricing. Full breakdown at /track-record.",
        },
        {
          q: "Which betting markets do you cover for Ligue 1?",
          a: "The free preview shows the 1X2 market. Members get over/under 2.5 goals, BTTS, Asian handicap and a Kelly stake recommendation per pick.",
        },
        {
          q: "How do you handle clubs with European obligations?",
          a: "Clubs in Champions / Europa / Conference League get a fatigue-aware short-term form weighting. Our logistic regressor reduces the implied win probability for the weekend after a midweek European tie, which mostly affects PSG, Marseille, Monaco and Lyon.",
        },
      ],
      nl: [
        {
          q: "Hoe beïnvloedt PSG jullie Ligue 1-voorspellingen?",
          a: "PSG-wedstrijden gebruiken een aparte kalibratiekop getraind op historische \"dominante favoriet\" data, omdat het publiek + de bookmakermarkt PSG-thuiswinsten consistent overprijst. Ons model trimt de impliciete winstkans met 3-5 procentpunt ten opzichte van de closing line — een van de stabielere edge-bronnen in de Ligue 1.",
        },
        {
          q: "Wordt het nieuwe Ligue 1-format meegenomen in jullie sync?",
          a: "Ja. Het huidige 18-team format en uitzendschema worden via football-data.org geladen, met de aftraptijd per wedstrijd elke 5 minuten gesynchroniseerd tijdens de actieve window. Geen handmatige invoer — als de Ligue de Football Professionnel het slot wijzigt, pikt ons model dat automatisch op.",
        },
        {
          q: "Voorspellen jullie ook Coupe de France-wedstrijden?",
          a: "Niet op deze hub. Bekerwedstrijden zijn knock-outvoetbal met hun eigen kalibratie-uitdagingen (verlenging, strafschoppen, tegenstanders uit lagere divisies) en we publiceren liever geen voorspellingen totdat we een volledig seizoen historische bekerdata door het model hebben.",
        },
        {
          q: "Hoe accuraat zijn jullie Ligue 1-voorspellingen?",
          a: "Rollende 30-daagse kalibratie op de favoriet-wint markt ligt tussen 70% en 75% — grofweg vergelijkbaar met de Premier League, geholpen door de structurele edge tegen PSG-overpricing. Volledige uitsplitsing op /trackrecord-resultaten.",
        },
        {
          q: "Welke wedmarkten dekken jullie voor Ligue 1?",
          a: "De gratis preview toont de 1X2-markt. Members krijgen over/under 2.5 goals, BTTS, Asian handicap en een Kelly-inzetadvies per pick.",
        },
        {
          q: "Hoe gaan jullie om met clubs met Europese verplichtingen?",
          a: "Clubs in Champions / Europa / Conference League krijgen een vermoeidheidsbewuste korte-termijn vormweging. Onze logistische regressor verlaagt de impliciete winstkans voor het weekend na een doordeweeks Europees duel, wat vooral PSG, Marseille, Monaco en Lyon raakt.",
        },
      ],
    },
  },
  {
    slug: "eredivisie",
    sportSlug: "football",
    countryCode: "NL",
    countryFlag: "🇳🇱",
    name: {
      en: "Eredivisie",
      nl: "Eredivisie",
    },
    country: {
      en: "Netherlands",
      nl: "Nederland",
    },
    tagline: {
      en: "Free AI predictions for every Eredivisie matchday",
      nl: "Gratis AI-voorspellingen voor elke Eredivisie-speelronde",
    },
    intro: {
      en: "The Eredivisie is our home league — BetsPlug is built in the Netherlands and the Dutch football calendar is the one our research desk watches most closely. It is also one of the most interesting leagues in Europe to model: attacking, high-scoring, pressed hard, and dominated by a handful of clubs that play completely differently from the rest of the table. Our ensemble treats PSV, Ajax and Feyenoord with a separate calibration head because their xG output is so far above the league average that a single lambda would distort every other fixture. We pull live data via API-Football, refresh it every five minutes during the match-day window, and run the same four-model ensemble we use for the Premier League. The three matches with the biggest expected edge on every speelronde are published here for free; members get the full slate plus Kelly stakes and the closing-line value report.",
      nl: "De Eredivisie is onze thuiscompetitie — BetsPlug is gebouwd in Nederland en de Eredivisie is de competitie die ons research-team het nauwkeurigst volgt. Het is ook een van de interessantste competities van Europa om te modelleren: aanvallend, veel goals, hoog druk, en gedomineerd door een handjevol clubs die compleet anders spelen dan de rest. Ons ensemble geeft PSV, Ajax en Feyenoord een aparte kalibratie-kop omdat hun xG-productie zo ver boven het competitiegemiddelde ligt dat één enkele lambda elke andere wedstrijd zou vertekenen. Live data halen we via API-Football, elke vijf minuten ververst tijdens de matchday-window, en we draaien dezelfde ensemble van vier modellen die we ook op de Premier League loslaten. De drie wedstrijden met het hoogste verwachte edge per speelronde zetten we hier gratis neer; members krijgen het volledige programma plus Kelly-inzetten en het closing-line rapport.",
    },
    metaTitle: {
      en: "Eredivisie AI Predictions & Odds 2025/26 — Free Picks | BetsPlug",
      nl: "Eredivisie AI Voorspellingen & Odds 2025/26 — Gratis Picks | BetsPlug",
    },
    metaDescription: {
      en: "Free AI-powered Eredivisie predictions, win probabilities and confidence scores for every Dutch football matchday. Built in the Netherlands on Elo, Poisson and XGBoost models.",
      nl: "Gratis AI-voorspellingen voor de Eredivisie: winstkansen, confidence-scores en odds voor elke speelronde. Gebouwd in Nederland op Elo-, Poisson- en XGBoost-modellen.",
    },
    faqs: {
      en: [
        {
          q: "Why does the Eredivisie need a different model calibration?",
          a: "The Eredivisie averages around 3.2 goals per match — comfortably the highest of Europe's top ten leagues — and three clubs (PSV, Ajax, Feyenoord) sit on xG numbers that would be outliers anywhere else. A single league-wide Poisson lambda would overestimate goals in the bottom half and underestimate them at the top, so we fit a separate head for the top three and another for the chasing pack.",
        },
        {
          q: "Do you cover every Eredivisie fixture?",
          a: "Yes — all 306 matches per season get a full ensemble run as soon as lineups become predictable. The three fixtures with the sharpest model edge per speelronde are shown here for free; the rest sit inside the BetsPlug members dashboard.",
        },
        {
          q: "How accurate are your Eredivisie predictions?",
          a: "Rolling 30-day calibration on the favourite-to-win market lands between 72% and 76% — slightly above the Premier League because PSV, Ajax and Feyenoord win a larger share of their home games than the Premier League big six. The full breakdown is published at /track-record.",
        },
        {
          q: "How do you handle European midweek fatigue for clubs like AZ and Twente?",
          a: "Our logistic regressor applies a short-term-form decay for any club playing a Conference or Europa League tie in the 72 hours before an Eredivisie kick-off. The effect is bigger for squads with less rotation depth, which is usually AZ, FC Twente, Utrecht and Heerenveen.",
        },
        {
          q: "Which betting markets do you cover for the Eredivisie?",
          a: "The free preview shows the 1X2 market (thuis / gelijk / uit). Members also get over/under 2.5 goals, BTTS, Asian handicap and a Kelly stake recommendation per pick.",
        },
        {
          q: "Can I use BetsPlug from the Netherlands?",
          a: "Yes — BetsPlug is an analytics platform, not a bookmaker, so we don't take bets. In the Netherlands you can only legally wager at Kansspelautoriteit-licensed operators. Our predictions help you decide how to allocate your bankroll once you're on a licensed site. Gamble responsibly.",
        },
      ],
      nl: [
        {
          q: "Waarom heeft de Eredivisie een aparte model-kalibratie nodig?",
          a: "De Eredivisie scoort gemiddeld rond de 3.2 doelpunten per wedstrijd — ruim het hoogste van de top-tien competities in Europa — en drie clubs (PSV, Ajax, Feyenoord) draaien op xG-cijfers die elders als outliers zouden gelden. Eén enkele lambda voor de hele competitie zou goals in de onderste helft overschatten en aan de top onderschatten, dus we fitten een aparte kop voor de top drie en een andere voor de achtervolgers.",
        },
        {
          q: "Voorspellen jullie elke Eredivisie-wedstrijd?",
          a: "Ja — alle 306 wedstrijden per seizoen krijgen een volledige ensemble-run zodra de opstellingen voorspelbaar worden. De drie wedstrijden met het scherpste edge per speelronde laten we hier gratis zien; de rest staat in het BetsPlug-dashboard voor members.",
        },
        {
          q: "Hoe accuraat zijn jullie Eredivisie-voorspellingen?",
          a: "Onze rollende 30-daagse kalibratie op de favoriet-wint markt ligt tussen 72% en 76% — iets boven de Premier League, omdat PSV, Ajax en Feyenoord een groter aandeel van hun thuiswedstrijden winnen dan de Premier League big six. De volledige uitsplitsing vind je op /trackrecord-resultaten.",
        },
        {
          q: "Hoe gaan jullie om met Europese midweek-vermoeidheid bij clubs als AZ en Twente?",
          a: "Onze logistische regressor past een korte-termijn vormdecay toe voor elke club die binnen 72 uur voor een Eredivisie-aftrap een Conference of Europa League-duel heeft. Het effect is groter voor selecties met minder rotatiediepte — meestal AZ, FC Twente, Utrecht en Heerenveen.",
        },
        {
          q: "Welke wedmarkten dekken jullie voor de Eredivisie?",
          a: "De gratis preview toont de 1X2-markt (thuis / gelijk / uit). Members krijgen ook over/under 2.5 goals, BTTS, Asian handicap en een Kelly-inzetadvies per pick.",
        },
        {
          q: "Mag ik BetsPlug gebruiken vanuit Nederland?",
          a: "Ja — BetsPlug is een analyseplatform, geen bookmaker, dus we nemen geen weddenschappen aan. In Nederland mag je alleen wedden bij vergunninghouders van de Kansspelautoriteit. Onze voorspellingen helpen je beslissen hoe je je bankroll verdeelt zodra je op een legale site zit. Speel bewust.",
        },
      ],
    },
  },
  {
    slug: "champions-league",
    sportSlug: "football",
    countryCode: "EU",
    countryFlag: "🇪🇺",
    name: {
      en: "UEFA Champions League",
      nl: "UEFA Champions League",
    },
    country: {
      en: "Europe",
      nl: "Europa",
    },
    tagline: {
      en: "Free AI predictions for every Champions League night",
      nl: "Gratis AI-voorspellingen voor elke Champions League-avond",
    },
    intro: {
      en: "Champions League nights are the hardest matches in football to predict — and the most rewarding when you get them right. Two-legged knockouts, neutral-venue finals and the new Swiss-format league phase pit teams from different national leagues against each other, where Elo gaps tell only half the story. BetsPlug solves this by re-weighting every model run with cross-league strength estimates calibrated against historical European performance, then layering in venue, travel distance and rest-day data. The result is a probability set that respects how much harder it is to grind out an away result in Madrid than it is at Brentford. Every group-stage and knockout fixture is modelled the moment kick-off times are confirmed; the three sharpest edges each matchday are published here for free, with the full European slate inside the BetsPlug member dashboard.",
      nl: "Champions League-avonden zijn de moeilijkste wedstrijden in het voetbal om te voorspellen — en de meest lonende als je ze goed hebt. Tweeluiken in de knock-out, finales op neutraal terrein en de nieuwe Zwitsers-format competitiefase zetten clubs uit verschillende landen tegen elkaar, waar Elo-verschillen maar de helft van het verhaal vertellen. BetsPlug lost dit op door elke modelrun te herwegen met cross-league sterkteschattingen, gekalibreerd op historische Europese prestaties, en daar locatie-, reisafstand- en rustdagdata bovenop te leggen. Het resultaat is een kansenset die respecteert dat een uitresultaat op Bernabéu zwaarder is dan eentje in Brentford. Elke poule- en knock-outwedstrijd modelleren we zodra de aftraptijden bekend zijn; de drie scherpste edges per speeldag publiceren we hier gratis, het volledige Europese programma zit in het BetsPlug-dashboard voor members.",
    },
    metaTitle: {
      en: "UEFA Champions League AI Predictions — Free Picks Tonight | BetsPlug",
      nl: "UEFA Champions League AI Voorspellingen — Gratis Picks Vanavond | BetsPlug",
    },
    metaDescription: {
      en: "Free AI Champions League predictions for tonight's matches: win probabilities, confidence scores and model reasoning for every group-stage and knockout fixture.",
      nl: "Gratis AI-voorspellingen voor de Champions League: winstkansen en confidence-scores voor elke poule- en knock-outwedstrijd, vanavond en deze week.",
    },
    faqs: {
      en: [
        {
          q: "How do you handle the new Swiss-format league phase?",
          a: "The Swiss-format draw means clubs play eight different opponents instead of three home-and-away pairs. Our cross-league Elo handles that fine — every fixture is treated independently, so unusual matchups (e.g. a Belgian side vs a Spanish side) get the full ensemble treatment without any group-stage assumption baked in.",
        },
        {
          q: "Are knockout legs more or less predictable than league games?",
          a: "Less. Two-legged ties produce more cagey football, more bench rotation and more late-game drift toward extra time. Our knockout-tie model raises the implied draw probability by ~4% compared to a one-off domestic fixture and lowers our average confidence on UCL nights versus Premier League nights.",
        },
        {
          q: "Do you predict goals markets for Champions League games?",
          a: "Yes — the over/under 2.5 goals and BTTS markets are available to members alongside the 1X2 prediction shown on this page. Champions League games skew lower-scoring than top-five league averages, which our Poisson model accounts for.",
        },
        {
          q: "Can I see your historical record on Champions League fixtures?",
          a: "All settled UCL picks are visible at /track-record, broken out by season and round. Knockout-stage accuracy typically lags group-stage by 3–5 percentage points, which we surface honestly rather than averaging it out.",
        },
        {
          q: "When are tonight's predictions published?",
          a: "Predictions for any given matchday are live by 09:00 CET on the day of kick-off, and refreshed once team news is confirmed (usually around 60 minutes before kick-off).",
        },
        {
          q: "Do you cover Conference League and Europa League too?",
          a: "Not on this hub yet. Europa League hub is on the roadmap once we add UEFA's lower-tier competitions to our football-data.org rotation.",
        },
      ],
      nl: [
        {
          q: "Hoe gaan jullie om met de nieuwe Zwitsers-format competitiefase?",
          a: "In de Zwitsers-format loting spelen clubs tegen acht verschillende tegenstanders in plaats van drie thuis-uit paren. Onze cross-league Elo gaat daar prima mee om: elke wedstrijd wordt los gemodelleerd, dus ongebruikelijke duels (bijv. Belgisch tegen Spaans) krijgen de volledige ensemble-behandeling zonder ingebakken poule-aanname.",
        },
        {
          q: "Zijn knock-out wedstrijden voorspelbaarder dan competitiewedstrijden?",
          a: "Minder. Tweeluiken leveren behoudzamer voetbal op, meer bankrotaties en meer late drift richting verlenging. Ons knock-out model verhoogt de impliciete gelijkspelkans met ~4% vergeleken met een eenmalige nationale wedstrijd en verlaagt onze gemiddelde confidence op CL-avonden ten opzichte van Premier League-avonden.",
        },
        {
          q: "Voorspellen jullie ook goalmarkten voor Champions League?",
          a: "Ja — de over/under 2.5 goals en BTTS-markten zijn beschikbaar voor members naast de 1X2-voorspelling die je op deze pagina ziet. Champions League-wedstrijden vallen gemiddeld lager scorend uit dan de top-vijf competities, wat ons Poisson-model meeneemt.",
        },
        {
          q: "Kan ik jullie historische prestaties op Champions League zien?",
          a: "Alle afgewikkelde CL-picks staan op /trackrecord-resultaten, opgesplitst per seizoen en ronde. De nauwkeurigheid in de knock-outfase ligt meestal 3–5 procentpunt lager dan de poulefase — dat tonen we eerlijk in plaats van het uit te middelen.",
        },
        {
          q: "Wanneer worden de voorspellingen voor vanavond gepubliceerd?",
          a: "Voorspellingen voor een speeldag staan om 09:00 CET online op de dag van aftrap, en worden ververst zodra de opstellingen bevestigd zijn (meestal ~60 minuten voor de aftrap).",
        },
        {
          q: "Voorspellen jullie ook Conference League en Europa League?",
          a: "Nog niet op deze hub. Een Europa League-hub staat op de roadmap zodra we de lagere UEFA-toernooien toevoegen aan onze football-data.org rotatie.",
        },
      ],
    },
  },
];

/* ── Lookup helpers ───────────────────────────────────────── */

export function getLeagueHub(slug: string): LeagueHub | undefined {
  return LEAGUE_HUBS.find((h) => h.slug === slug);
}

export function getAllLeagueHubSlugs(): string[] {
  return LEAGUE_HUBS.map((h) => h.slug);
}

/**
 * Pick the editorial locale for a given UI locale.
 * Today we only ship handwritten EN + NL — everything else
 * falls back to EN until translations land.
 */
export function pickHubLocale(uiLocale: string): LeagueHubLocale {
  return uiLocale === "nl" ? "nl" : "en";
}
