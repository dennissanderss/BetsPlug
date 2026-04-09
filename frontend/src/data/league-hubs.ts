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
