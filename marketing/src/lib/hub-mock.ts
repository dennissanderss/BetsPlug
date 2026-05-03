/**
 * Predictions hub mock data — source of truth shared between the
 * /api/predictions/hub.json endpoint and the SSG-time loader. Direct
 * import avoids the build-time fetch dance that used to silently pull
 * the previous deploy's shape from Astro.site.
 *
 * TODO: replace with real fetch to
 *   https://app.betsplug.com/api/predictions/hub?date=YYYY-MM-DD
 */

export interface HubPrediction {
  id: string;
  league: { name: string; slug: string; logo: string; country: string };
  kickoff: string;
  homeTeam: { name: string; slug: string; logoUrl?: string };
  awayTeam: { name: string; slug: string; logoUrl?: string };
  prediction: string;
  market: string;
  confidence: number;
  locked: boolean;
  lockedAt: string;
  matchUrl: string;
}

export interface HubResponse {
  today: { freeCount: number; totalCount: number; predictions: HubPrediction[] };
  tomorrow: { teaser: HubPrediction; totalCount: number };
  week: { dailyCounts: { date: string; count: number }[] };
  lastUpdated: string;
}

const NOW = new Date("2026-05-02T18:00:00Z").toISOString();

const FREE_TODAY: HubPrediction[] = [
  {
    id: "p-mci-ars",
    league: { name: "Premier League", slug: "premier-league", logo: "/leagues/premier-league.svg", country: "England" },
    kickoff: "Sat 17:30",
    homeTeam: { name: "Manchester City", slug: "manchester-city" },
    awayTeam: { name: "Arsenal",         slug: "arsenal" },
    prediction: "Over 2.5 Goals",
    market: "totals",
    confidence: 78,
    locked: true,
    lockedAt: "2026-05-02T15:30:00Z",
    matchUrl: "https://app.betsplug.com/predictions/man-city-arsenal",
  },
  {
    id: "p-rma-sev",
    league: { name: "La Liga", slug: "la-liga", logo: "/leagues/la-liga.svg", country: "Spain" },
    kickoff: "Sat 21:00",
    homeTeam: { name: "Real Madrid", slug: "real-madrid" },
    awayTeam: { name: "Sevilla",     slug: "sevilla" },
    prediction: "Home Win",
    market: "1x2",
    confidence: 74,
    locked: true,
    lockedAt: "2026-05-02T19:00:00Z",
    matchUrl: "https://app.betsplug.com/predictions/real-madrid-sevilla",
  },
  {
    id: "p-bay-lev",
    league: { name: "Bundesliga", slug: "bundesliga", logo: "/leagues/bundesliga.svg", country: "Germany" },
    kickoff: "Sun 15:30",
    homeTeam: { name: "Bayern Munich",    slug: "bayern-munich" },
    awayTeam: { name: "Bayer Leverkusen", slug: "bayer-leverkusen" },
    prediction: "Both Teams to Score",
    market: "btts",
    confidence: 71,
    locked: true,
    lockedAt: "2026-05-03T13:30:00Z",
    matchUrl: "https://app.betsplug.com/predictions/bayern-leverkusen",
  },
  {
    id: "p-liv-mun",
    league: { name: "Premier League", slug: "premier-league", logo: "/leagues/premier-league.svg", country: "England" },
    kickoff: "Sun 17:30",
    homeTeam: { name: "Liverpool",         slug: "liverpool" },
    awayTeam: { name: "Manchester United", slug: "manchester-united" },
    prediction: "Home Win",
    market: "1x2",
    confidence: 67,
    locked: true,
    lockedAt: "2026-05-03T15:30:00Z",
    matchUrl: "https://app.betsplug.com/predictions/liverpool-man-utd",
  },
  {
    id: "p-bar-atm",
    league: { name: "La Liga", slug: "la-liga", logo: "/leagues/la-liga.svg", country: "Spain" },
    kickoff: "Sun 20:00",
    homeTeam: { name: "Barcelona",       slug: "barcelona" },
    awayTeam: { name: "Atlético Madrid", slug: "atletico-madrid" },
    prediction: "Both Teams to Score",
    market: "btts",
    confidence: 64,
    locked: true,
    lockedAt: "2026-05-03T18:00:00Z",
    matchUrl: "https://app.betsplug.com/predictions/barcelona-atletico-madrid",
  },
];

const TOMORROW_TEASER: HubPrediction = {
  id: "p-tom-1",
  league: { name: "Premier League", slug: "premier-league", logo: "/leagues/premier-league.svg", country: "England" },
  kickoff: "Mon 20:00",
  homeTeam: { name: "Tottenham", slug: "tottenham" },
  awayTeam: { name: "Chelsea",   slug: "chelsea" },
  prediction: "—",
  market: "—",
  confidence: 0,
  locked: false,
  lockedAt: NOW,
  matchUrl: "https://app.betsplug.com/predictions/tottenham-chelsea",
};

export const HUB_RESPONSE: HubResponse = {
  today: {
    freeCount: 5,
    totalCount: 47,
    predictions: FREE_TODAY,
  },
  tomorrow: {
    teaser: TOMORROW_TEASER,
    totalCount: 12,
  },
  week: {
    dailyCounts: [
      { date: "2026-05-02", count: 47 },
      { date: "2026-05-03", count: 12 },
      { date: "2026-05-04", count: 38 },
      { date: "2026-05-05", count: 22 },
      { date: "2026-05-06", count: 18 },
      { date: "2026-05-07", count: 41 },
      { date: "2026-05-08", count: 33 },
    ],
  },
  lastUpdated: NOW,
};
