/**
 * Predictions hub API endpoint.
 *
 * Returns mock data shaped to match the future production API at
 * `app.betsplug.com/api/predictions/hub?date=YYYY-MM-DD`.
 *
 * Mock characteristics:
 *   - 47 total predictions today (matches "5 of 47" hub paywall copy)
 *   - 5 free, all from top-3 leagues (Premier League / La Liga / Bundesliga)
 *   - Mix-strategy:
 *       Card 1-2: highest confidence (Premier League / La Liga)
 *       Card 3:   different league (Bundesliga)
 *       Card 4:   most popular match (Premier League — derby)
 *       Card 5:   bet-type variety (BTTS)
 *   - Tomorrow: 1 teaser-locked + 12 totalCount
 *   - Week:     7-day daily counts
 *
 * TODO: Replace mock data generation with live fetch to:
 *   https://app.betsplug.com/api/predictions/hub?date=YYYY-MM-DD
 */
import type { APIRoute } from "astro";

export const prerender = true;

interface Prediction {
  id: string;
  league: { name: string; slug: string; logo: string; country: string };
  kickoff: string;
  homeTeam: { name: string; logo: string; slug: string };
  awayTeam: { name: string; logo: string; slug: string };
  prediction: string;
  market: string;
  confidence: number;
  locked: boolean;
  lockedAt: string;
  matchUrl: string;
}

const NOW = new Date("2026-05-02T18:00:00Z").toISOString();

const FREE_TODAY: Prediction[] = [
  {
    id: "p-mci-ars",
    league: { name: "Premier League", slug: "premier-league", logo: "/leagues/premier-league.svg", country: "England" },
    kickoff: "Sat 17:30",
    homeTeam: { name: "Manchester City", logo: "/teams/man-city.svg", slug: "manchester-city" },
    awayTeam: { name: "Arsenal",         logo: "/teams/arsenal.svg",  slug: "arsenal" },
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
    homeTeam: { name: "Real Madrid", logo: "/teams/real-madrid.svg", slug: "real-madrid" },
    awayTeam: { name: "Sevilla",     logo: "/teams/sevilla.svg",     slug: "sevilla" },
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
    homeTeam: { name: "Bayern Munich",    logo: "/teams/bayern.svg",     slug: "bayern-munich" },
    awayTeam: { name: "Bayer Leverkusen", logo: "/teams/leverkusen.svg", slug: "bayer-leverkusen" },
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
    homeTeam: { name: "Liverpool",         logo: "/teams/liverpool.svg",  slug: "liverpool" },
    awayTeam: { name: "Manchester United", logo: "/teams/man-utd.svg",    slug: "manchester-united" },
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
    homeTeam: { name: "Barcelona",       logo: "/teams/barcelona.svg",       slug: "barcelona" },
    awayTeam: { name: "Atlético Madrid", logo: "/teams/atletico-madrid.svg", slug: "atletico-madrid" },
    prediction: "Both Teams to Score",
    market: "btts",
    confidence: 64,
    locked: true,
    lockedAt: "2026-05-03T18:00:00Z",
    matchUrl: "https://app.betsplug.com/predictions/barcelona-atletico-madrid",
  },
];

const TOMORROW_TEASER: Prediction = {
  id: "p-tom-1",
  league: { name: "Premier League", slug: "premier-league", logo: "/leagues/premier-league.svg", country: "England" },
  kickoff: "Mon 20:00",
  homeTeam: { name: "Tottenham", logo: "/teams/tottenham.svg", slug: "tottenham" },
  awayTeam: { name: "Chelsea",   logo: "/teams/chelsea.svg",   slug: "chelsea" },
  prediction: "—",
  market: "—",
  confidence: 0,
  locked: false,
  lockedAt: NOW,
  matchUrl: "https://app.betsplug.com/predictions/tottenham-chelsea",
};

interface HubResponse {
  today: { freeCount: number; totalCount: number; predictions: Prediction[] };
  tomorrow: { teaser: Prediction; totalCount: number };
  week: { dailyCounts: { date: string; count: number }[] };
  lastUpdated: string;
}

const RESPONSE: HubResponse = {
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

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(RESPONSE), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // ISR target — 60s cache, 5min stale-while-revalidate
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
};
