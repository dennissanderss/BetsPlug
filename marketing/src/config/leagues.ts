/**
 * League configuration — single source of truth for the 10 leagues
 * BetsPlug covers. Used by:
 *   - /predictions hub (LeagueGrid, hub API)
 *   - /predictions/{league} per-league pages
 *   - league-specific schema.org SportsLeague markup
 *
 * `isTopThree` controls the gating logic:
 *   - top-3 leagues: 2-3 free predictions per day visible
 *   - other 7:      0 free predictions, blurred teaser only
 *
 * `topTeams` are slugs (universal — never localized) used to render
 * the Top Teams grid on the per-league page. Up to 8 per league.
 *
 * `featuredLocale` flags the league as "Featured" for visitors of a
 * specific locale (UX nudge, not a hard rule). Only one league per
 * locale should be featured.
 */

export type LeagueSlug =
  | "premier-league"
  | "la-liga"
  | "bundesliga"
  | "serie-a"
  | "ligue-1"
  | "champions-league"
  | "europa-league"
  | "eredivisie"
  | "primeira-liga"
  | "championship";

export type Locale = "en" | "nl" | "de" | "fr" | "es" | "it";

export interface LeagueConfig {
  slug: LeagueSlug;
  name: string;
  country: string;
  countryCode: string;
  /** Tailwind-safe HEX for hero accent. */
  primaryColor: string;
  /** SVG asset under /public/leagues/. TODO: add real assets. */
  logo: string;
  teams: number;
  isTopThree: boolean;
  topTeams: string[];
  season: string;
  /** Locales that should display the "Featured" badge for this league. */
  featuredFor: Locale[];
}

export const leagues: Record<LeagueSlug, LeagueConfig> = {
  "premier-league": {
    slug: "premier-league",
    name: "Premier League",
    country: "England",
    countryCode: "GB",
    primaryColor: "#3D195B",
    logo: "/leagues/premier-league.svg",
    teams: 20,
    isTopThree: true,
    topTeams: [
      "manchester-city",
      "arsenal",
      "liverpool",
      "chelsea",
      "manchester-united",
      "tottenham",
      "newcastle",
      "brighton",
    ],
    season: "2025-26",
    featuredFor: ["en"],
  },
  "la-liga": {
    slug: "la-liga",
    name: "La Liga",
    country: "Spain",
    countryCode: "ES",
    primaryColor: "#FF4B44",
    logo: "/leagues/la-liga.svg",
    teams: 20,
    isTopThree: true,
    topTeams: [
      "real-madrid",
      "barcelona",
      "atletico-madrid",
      "athletic-bilbao",
      "real-sociedad",
      "villarreal",
      "real-betis",
      "valencia",
    ],
    season: "2025-26",
    featuredFor: ["es"],
  },
  "bundesliga": {
    slug: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    countryCode: "DE",
    primaryColor: "#D20515",
    logo: "/leagues/bundesliga.svg",
    teams: 18,
    isTopThree: true,
    topTeams: [
      "bayern-munich",
      "bayer-leverkusen",
      "rb-leipzig",
      "borussia-dortmund",
      "vfb-stuttgart",
      "eintracht-frankfurt",
      "borussia-monchengladbach",
      "vfl-wolfsburg",
    ],
    season: "2025-26",
    featuredFor: ["de"],
  },
  "serie-a": {
    slug: "serie-a",
    name: "Serie A",
    country: "Italy",
    countryCode: "IT",
    primaryColor: "#008FD7",
    logo: "/leagues/serie-a.svg",
    teams: 20,
    isTopThree: false,
    topTeams: [
      "inter",
      "juventus",
      "ac-milan",
      "napoli",
      "atalanta",
      "as-roma",
      "lazio",
      "fiorentina",
    ],
    season: "2025-26",
    featuredFor: ["it"],
  },
  "ligue-1": {
    slug: "ligue-1",
    name: "Ligue 1",
    country: "France",
    countryCode: "FR",
    primaryColor: "#091C3E",
    logo: "/leagues/ligue-1.svg",
    teams: 18,
    isTopThree: false,
    topTeams: [
      "paris-saint-germain",
      "monaco",
      "lyon",
      "marseille",
      "lille",
      "nice",
      "rennes",
      "lens",
    ],
    season: "2025-26",
    featuredFor: ["fr"],
  },
  "champions-league": {
    slug: "champions-league",
    name: "Champions League",
    country: "Europe",
    countryCode: "EU",
    primaryColor: "#0E1E5B",
    logo: "/leagues/champions-league.svg",
    teams: 36,
    isTopThree: false,
    topTeams: [
      "real-madrid",
      "manchester-city",
      "bayern-munich",
      "paris-saint-germain",
      "barcelona",
      "inter",
      "borussia-dortmund",
      "arsenal",
    ],
    season: "2025-26",
    featuredFor: [],
  },
  "europa-league": {
    slug: "europa-league",
    name: "Europa League",
    country: "Europe",
    countryCode: "EU",
    primaryColor: "#FF6700",
    logo: "/leagues/europa-league.svg",
    teams: 36,
    isTopThree: false,
    topTeams: [
      "ajax",
      "as-roma",
      "lazio",
      "atalanta",
      "rangers",
      "olympiakos",
      "tottenham",
      "leverkusen",
    ],
    season: "2025-26",
    featuredFor: [],
  },
  "eredivisie": {
    slug: "eredivisie",
    name: "Eredivisie",
    country: "Netherlands",
    countryCode: "NL",
    primaryColor: "#FF6900",
    logo: "/leagues/eredivisie.svg",
    teams: 18,
    isTopThree: false,
    topTeams: [
      "psv",
      "feyenoord",
      "ajax",
      "az-alkmaar",
      "twente",
      "utrecht",
    ],
    season: "2025-26",
    featuredFor: ["nl"],
  },
  "primeira-liga": {
    slug: "primeira-liga",
    name: "Primeira Liga",
    country: "Portugal",
    countryCode: "PT",
    primaryColor: "#006B3F",
    logo: "/leagues/primeira-liga.svg",
    teams: 18,
    isTopThree: false,
    topTeams: [
      "benfica",
      "porto",
      "sporting-cp",
      "braga",
      "vitoria-guimaraes",
      "boavista",
    ],
    season: "2025-26",
    featuredFor: [],
  },
  "championship": {
    slug: "championship",
    name: "Championship",
    country: "England",
    countryCode: "GB",
    primaryColor: "#003B71",
    logo: "/leagues/championship.svg",
    teams: 24,
    isTopThree: false,
    topTeams: [
      "leeds-united",
      "leicester-city",
      "ipswich-town",
      "southampton",
      "norwich-city",
      "west-bromwich",
    ],
    season: "2025-26",
    featuredFor: [],
  },
};

/** Display order on /predictions hub league grid. */
export const leagueOrder: LeagueSlug[] = [
  "premier-league",
  "la-liga",
  "bundesliga",
  "serie-a",
  "ligue-1",
  "champions-league",
  "europa-league",
  "eredivisie",
  "primeira-liga",
  "championship",
];

export function getLeague(slug: LeagueSlug): LeagueConfig {
  return leagues[slug];
}

export function isLeagueSlug(value: string): value is LeagueSlug {
  return value in leagues;
}

export function getFeaturedLeagueForLocale(locale: Locale): LeagueSlug | null {
  for (const slug of leagueOrder) {
    if (leagues[slug].featuredFor.includes(locale)) return slug;
  }
  return null;
}
