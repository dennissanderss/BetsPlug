/**
 * Mock predictions endpoint for the homepage live grid.
 *
 * Returns 5 sample predictions matching the Prediction shape used by
 * src/components/homepage/LivePredictionsPreview.astro.
 *
 * TODO: replace with real API call to
 *   https://app.betsplug.com/api/predictions/today
 * Targets: ISR with revalidate=60s, plus a 30s client-side polling
 * loop already wired up in LivePredictionsPreview.astro.
 */
import type { APIRoute } from "astro";

export const prerender = true;

interface Prediction {
  id: string;
  league: string;
  leagueLogo: string;
  kickoff: string;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  prediction: string;
  confidence: number;
  locked: boolean;
  matchUrl: string;
}

// Deterministic mock fixtures — kickoffs are formatted strings so the
// mock builds offline. Real impl would translate ISO timestamps via
// formatKickoffTime() per locale.
const MOCK: Prediction[] = [
  {
    id: "mock-1",
    league: "Premier League",
    leagueLogo: "/leagues/premier-league.svg",
    kickoff: "Sat 17:30",
    homeTeam: { name: "Manchester City", logo: "/teams/man-city.svg" },
    awayTeam: { name: "Arsenal",         logo: "/teams/arsenal.svg" },
    prediction: "Over 2.5 Goals",
    confidence: 78,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/man-city-arsenal",
  },
  {
    id: "mock-2",
    league: "La Liga",
    leagueLogo: "/leagues/la-liga.svg",
    kickoff: "Sat 21:00",
    homeTeam: { name: "Real Madrid", logo: "/teams/real-madrid.svg" },
    awayTeam: { name: "Sevilla",     logo: "/teams/sevilla.svg" },
    prediction: "Home Win",
    confidence: 71,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/real-madrid-sevilla",
  },
  {
    id: "mock-3",
    league: "Bundesliga",
    leagueLogo: "/leagues/bundesliga.svg",
    kickoff: "Sun 15:30",
    homeTeam: { name: "Bayern Munich",   logo: "/teams/bayern.svg" },
    awayTeam: { name: "Bayer Leverkusen", logo: "/teams/leverkusen.svg" },
    prediction: "Both Teams to Score",
    confidence: 74,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/bayern-leverkusen",
  },
  {
    id: "mock-4",
    league: "Serie A",
    leagueLogo: "/leagues/serie-a.svg",
    kickoff: "Sun 18:00",
    homeTeam: { name: "Inter Milan", logo: "/teams/inter.svg" },
    awayTeam: { name: "Juventus",   logo: "/teams/juventus.svg" },
    prediction: "Under 2.5 Goals",
    confidence: 65,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/inter-juventus",
  },
  {
    id: "mock-5",
    league: "Eredivisie",
    leagueLogo: "/leagues/eredivisie.svg",
    kickoff: "Sun 14:30",
    homeTeam: { name: "Ajax",  logo: "/teams/ajax.svg" },
    awayTeam: { name: "PSV",   logo: "/teams/psv.svg" },
    prediction: "Draw",
    confidence: 58,
    locked: true,
    matchUrl: "https://app.betsplug.com/predictions/ajax-psv",
  },
];

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(MOCK), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Cache aggressively at the edge while letting client-side
      // poll refresh the rendered DOM. See LivePredictionsPreview.
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
};
