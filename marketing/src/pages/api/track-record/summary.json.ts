/**
 * Track-record summary endpoint.
 * Returns ~250 mock predictions across last 90 days, with realistic
 * win/loss/void distribution (NOT 90% wins — credible mix).
 *
 * Shape matches future production endpoint:
 *   `app.betsplug.com/api/track-record/summary?days=90&league=…`
 *
 * TODO: Replace mock generator with live fetch.
 */
import type { APIRoute } from "astro";

export const prerender = true;

interface TrackRecordEntry {
  id: string;
  date: string;          // ISO date
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  market: string;
  confidence: number;
  result: "win" | "loss" | "void";
  lockedAt: string;      // ISO timestamp
  matchUrl: string;
}

interface TrackRecordSummary {
  totalCount: number;
  wins: number;
  losses: number;
  voids: number;
  predictions: TrackRecordEntry[];
  rangeStart: string;
  rangeEnd: string;
  daysOfTracking: number;
  lastAddedAt: string;
}

const NOW = new Date("2026-05-02T18:00:00Z");

const TOP_3 = [
  { league: "Premier League", teams: ["Manchester City", "Arsenal", "Liverpool", "Chelsea", "Manchester United", "Tottenham", "Newcastle", "Brighton"] },
  { league: "La Liga",        teams: ["Real Madrid", "Barcelona", "Atlético Madrid", "Athletic Bilbao", "Real Sociedad", "Villarreal", "Real Betis", "Valencia"] },
  { league: "Bundesliga",     teams: ["Bayern Munich", "Bayer Leverkusen", "RB Leipzig", "Borussia Dortmund", "VfB Stuttgart", "Eintracht Frankfurt"] },
];

const PREDICTIONS = ["Home Win", "Away Win", "Draw", "Over 2.5 Goals", "Under 2.5 Goals", "Both Teams to Score", "Double Chance 1X"];
const MARKETS     = ["1x2", "1x2", "1x2", "totals", "totals", "btts", "double-chance"];

// Simple seeded PRNG so output is reproducible across builds.
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260502);

const entries: TrackRecordEntry[] = [];

// Generate ~250 predictions over 90 days. Each day: 2-4 predictions.
for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
  const date = new Date(NOW.getTime() - dayOffset * 24 * 60 * 60 * 1000);
  const dateIso = date.toISOString().slice(0, 10);
  const todayCount = 2 + Math.floor(rand() * 3); // 2-4 per day

  for (let i = 0; i < todayCount; i++) {
    const leagueData = TOP_3[Math.floor(rand() * TOP_3.length)];
    const homeIdx = Math.floor(rand() * leagueData.teams.length);
    let awayIdx = Math.floor(rand() * leagueData.teams.length);
    while (awayIdx === homeIdx) awayIdx = Math.floor(rand() * leagueData.teams.length);

    const predIdx = Math.floor(rand() * PREDICTIONS.length);
    const confidence = 50 + Math.floor(rand() * 36); // 50-85
    // Result distribution — credible mix: ~52% win, ~40% loss, ~8% void.
    const r = rand();
    const result: TrackRecordEntry["result"] = r < 0.52 ? "win" : r < 0.92 ? "loss" : "void";

    const lockedAt = new Date(date.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const homeSlug = leagueData.teams[homeIdx].toLowerCase().replace(/\s+/g, "-");
    const awaySlug = leagueData.teams[awayIdx].toLowerCase().replace(/\s+/g, "-");

    entries.push({
      id: `tr-${dateIso}-${i}`,
      date: dateIso,
      homeTeam: leagueData.teams[homeIdx],
      awayTeam: leagueData.teams[awayIdx],
      league: leagueData.league,
      prediction: PREDICTIONS[predIdx],
      market: MARKETS[predIdx],
      confidence,
      result,
      lockedAt,
      matchUrl: `https://app.betsplug.com/predictions/${homeSlug}-${awaySlug}`,
    });
  }
}

const wins = entries.filter((e) => e.result === "win").length;
const losses = entries.filter((e) => e.result === "loss").length;
const voids = entries.filter((e) => e.result === "void").length;

const SUMMARY: TrackRecordSummary = {
  totalCount: entries.length,
  wins,
  losses,
  voids,
  predictions: entries,
  rangeStart: new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  rangeEnd: NOW.toISOString().slice(0, 10),
  daysOfTracking: 547, // ~1.5 years — for the "Why we publish losses" panel
  lastAddedAt: entries[entries.length - 1]?.lockedAt ?? NOW.toISOString(),
};

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(SUMMARY), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // ISR target: 5 minutes — track record changes after each match,
      // not on every pageview.
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
    },
  });
};
