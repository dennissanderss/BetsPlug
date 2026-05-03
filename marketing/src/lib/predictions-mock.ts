/**
 * Shared mock prediction data — single source of truth for the
 * homepage live grid and the predictions-hub static fallback.
 *
 * Importing this directly keeps the SSG build deterministic. We used
 * to fetch `/api/predictions/homepage-sample.json` from `Astro.site`
 * during render, which silently resolved to the *live* site and
 * returned whatever shape the previous deploy had — so a same-deploy
 * shape change wouldn't take effect for two cycles.
 *
 * TODO: replace with the real ISR-backed fetch once
 * app.betsplug.com/api/predictions/today is live.
 */

export interface MockTeam {
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface MockPrediction {
  id: string;
  league: { name: string; slug: string; logo: string };
  kickoff: string;
  homeTeam: MockTeam;
  awayTeam: MockTeam;
  prediction: string;
  market: string;
  confidence: number;
  locked: boolean;
  matchUrl: string;
}

export const HOMEPAGE_SAMPLE: MockPrediction[] = [
  {
    id: "mock-1",
    league: { name: "Premier League", slug: "premier-league", logo: "/leagues/premier-league.svg" },
    kickoff: "Sat 17:30",
    homeTeam: { name: "Manchester City", slug: "manchester-city" },
    awayTeam: { name: "Arsenal",         slug: "arsenal" },
    prediction: "Over 2.5 Goals",
    market: "Total Goals",
    confidence: 78,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/man-city-arsenal",
  },
  {
    id: "mock-2",
    league: { name: "La Liga", slug: "la-liga", logo: "/leagues/la-liga.svg" },
    kickoff: "Sat 21:00",
    homeTeam: { name: "Real Madrid", slug: "real-madrid" },
    awayTeam: { name: "Sevilla",     slug: "sevilla" },
    prediction: "Home Win",
    market: "Match Result",
    confidence: 71,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/real-madrid-sevilla",
  },
  {
    id: "mock-3",
    league: { name: "Bundesliga", slug: "bundesliga", logo: "/leagues/bundesliga.svg" },
    kickoff: "Sun 15:30",
    homeTeam: { name: "Bayern Munich",     slug: "bayern-munich" },
    awayTeam: { name: "Bayer Leverkusen",  slug: "bayer-leverkusen" },
    prediction: "Both Teams to Score",
    market: "BTTS",
    confidence: 74,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/bayern-leverkusen",
  },
  {
    id: "mock-4",
    league: { name: "Serie A", slug: "serie-a", logo: "/leagues/serie-a.svg" },
    kickoff: "Sun 18:00",
    homeTeam: { name: "Inter Milan", slug: "inter" },
    awayTeam: { name: "Juventus",    slug: "juventus" },
    prediction: "Under 2.5 Goals",
    market: "Total Goals",
    confidence: 65,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/inter-juventus",
  },
  {
    id: "mock-5",
    league: { name: "Eredivisie", slug: "eredivisie", logo: "/leagues/eredivisie.svg" },
    kickoff: "Sun 14:30",
    homeTeam: { name: "Ajax", slug: "ajax" },
    awayTeam: { name: "PSV",  slug: "psv" },
    prediction: "Draw",
    market: "Match Result",
    confidence: 58,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/ajax-psv",
  },
];
