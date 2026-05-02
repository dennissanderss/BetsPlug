/**
 * Per-league predictions API endpoint.
 * Returns mock data shaped to match the future production endpoint:
 *   `app.betsplug.com/api/predictions/league/{slug}?date=...`
 *
 * Generates data for each of the 10 leagues. Top-3 leagues
 * (premier-league, la-liga, bundesliga) include 2-3 free predictions
 * + locked teasers. Other 7 leagues include 0 free + locked teasers
 * + fixture-only entries for SEO content.
 *
 * TODO: Replace mock generation with live fetch.
 */
import type { APIRoute } from "astro";
import { leagues, leagueOrder, type LeagueSlug } from "@/config/leagues";

export const prerender = true;

export function getStaticPaths() {
  return leagueOrder.map((slug) => ({ params: { slug } }));
}

interface Match {
  id: string;
  league: { name: string; slug: string; logo: string };
  kickoff: string;
  homeTeam: { name: string; logo: string; slug: string };
  awayTeam: { name: string; logo: string; slug: string };
  prediction?: string;
  market?: string;
  confidence?: number;
  matchUrl: string;
}

interface TopTeam {
  slug: string;
  name: string;
  logo?: string;
  currentPosition?: number;
  recentForm?: string;
}

interface LeagueResponse {
  league: {
    slug: string;
    name: string;
    country: string;
    currentMatchweek: number;
    season: string;
    teams: number;
  };
  today: { freeCount: number; totalCount: number; freeMatches: Match[]; lockedMatches: Match[]; fixtures: Match[] };
  week: { matches: Match[]; predictionsCount: number };
  upcoming: { matches: Match[] };
  topTeams: TopTeam[];
  topScorer?: { name: string; goals: number };
  predictionsThisSeason: number;
  predictionsThisWeek: number;
  lastUpdated: string;
}

const NOW = "2026-05-02T18:00:00Z";

// Helper: humanize a slug ("manchester-city" → "Manchester City")
function unslug(s: string): string {
  return s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function buildMatch(slug: LeagueSlug, idx: number, homeSlug: string, awaySlug: string, opts: {
  kickoff: string;
  prediction?: string;
  market?: string;
  confidence?: number;
}): Match {
  const cfg = leagues[slug];
  return {
    id: `${slug}-${idx}`,
    league: { name: cfg.name, slug, logo: cfg.logo },
    kickoff: opts.kickoff,
    homeTeam: { name: unslug(homeSlug), logo: `/teams/${homeSlug}.svg`, slug: homeSlug },
    awayTeam: { name: unslug(awaySlug), logo: `/teams/${awaySlug}.svg`, slug: awaySlug },
    prediction: opts.prediction,
    market: opts.market,
    confidence: opts.confidence,
    matchUrl: `https://app.betsplug.com/predictions/${homeSlug}-${awaySlug}`,
  };
}

const PREDICTIONS_BY_LEAGUE: Record<LeagueSlug, {
  free: Match[];
  locked: Match[];
  fixtures: Match[];
  matchweekCount: number;
  topTeams: TopTeam[];
  topScorer?: { name: string; goals: number };
}> = {
  "premier-league": {
    free: [
      buildMatch("premier-league", 1, "manchester-city", "arsenal",  { kickoff: "Sat 17:30", prediction: "Over 2.5 Goals", market: "totals", confidence: 78 }),
      buildMatch("premier-league", 2, "liverpool",       "manchester-united", { kickoff: "Sun 17:30", prediction: "Home Win", market: "1x2", confidence: 67 }),
    ],
    locked: [
      buildMatch("premier-league", 3, "chelsea", "tottenham",  { kickoff: "Sat 12:30" }),
      buildMatch("premier-league", 4, "newcastle", "brighton", { kickoff: "Sun 14:00" }),
    ],
    fixtures: [
      buildMatch("premier-league", 5, "everton", "fulham",          { kickoff: "Mon 20:00" }),
      buildMatch("premier-league", 6, "aston-villa", "wolves",      { kickoff: "Mon 20:00" }),
      buildMatch("premier-league", 7, "crystal-palace", "brentford", { kickoff: "Mon 20:00" }),
    ],
    matchweekCount: 7,
    topTeams: [
      { slug: "manchester-city",   name: "Manchester City",   currentPosition: 1, recentForm: "WWWDW" },
      { slug: "arsenal",           name: "Arsenal",           currentPosition: 2, recentForm: "WWLWW" },
      { slug: "liverpool",         name: "Liverpool",         currentPosition: 3, recentForm: "WDWWL" },
      { slug: "chelsea",           name: "Chelsea",           currentPosition: 4, recentForm: "WLWLD" },
      { slug: "manchester-united", name: "Manchester United", currentPosition: 5, recentForm: "LDWWD" },
      { slug: "tottenham",         name: "Tottenham",         currentPosition: 6, recentForm: "WLLWW" },
      { slug: "newcastle",         name: "Newcastle",         currentPosition: 7, recentForm: "DDWLD" },
      { slug: "brighton",          name: "Brighton",          currentPosition: 8, recentForm: "WLDWL" },
    ],
    topScorer: { name: "Erling Haaland", goals: 24 },
  },
  "la-liga": {
    free: [
      buildMatch("la-liga", 1, "real-madrid", "sevilla", { kickoff: "Sat 21:00", prediction: "Home Win", market: "1x2", confidence: 74 }),
      buildMatch("la-liga", 2, "barcelona", "atletico-madrid", { kickoff: "Sun 20:00", prediction: "Both Teams to Score", market: "btts", confidence: 64 }),
    ],
    locked: [
      buildMatch("la-liga", 3, "athletic-bilbao", "real-sociedad", { kickoff: "Sat 18:30" }),
      buildMatch("la-liga", 4, "villarreal", "real-betis", { kickoff: "Sun 16:15" }),
    ],
    fixtures: [
      buildMatch("la-liga", 5, "valencia", "celta-vigo", { kickoff: "Mon 21:00" }),
      buildMatch("la-liga", 6, "getafe", "rayo-vallecano", { kickoff: "Mon 21:00" }),
    ],
    matchweekCount: 6,
    topTeams: [
      { slug: "real-madrid",    name: "Real Madrid",    currentPosition: 1, recentForm: "WWWWD" },
      { slug: "barcelona",      name: "Barcelona",      currentPosition: 2, recentForm: "WWLWW" },
      { slug: "atletico-madrid", name: "Atlético Madrid", currentPosition: 3, recentForm: "WDWWL" },
      { slug: "athletic-bilbao", name: "Athletic Bilbao", currentPosition: 4, recentForm: "DWWLW" },
      { slug: "real-sociedad", name: "Real Sociedad", currentPosition: 5, recentForm: "LDWLW" },
      { slug: "villarreal", name: "Villarreal", currentPosition: 6, recentForm: "WLDWL" },
      { slug: "real-betis",  name: "Real Betis",  currentPosition: 7, recentForm: "DWLWD" },
      { slug: "valencia",     name: "Valencia",     currentPosition: 8, recentForm: "LWLDW" },
    ],
    topScorer: { name: "Robert Lewandowski", goals: 19 },
  },
  "bundesliga": {
    free: [
      buildMatch("bundesliga", 1, "bayern-munich", "bayer-leverkusen", { kickoff: "Sun 15:30", prediction: "Both Teams to Score", market: "btts", confidence: 71 }),
      buildMatch("bundesliga", 2, "rb-leipzig", "borussia-dortmund",   { kickoff: "Sat 18:30", prediction: "Over 2.5 Goals", market: "totals", confidence: 69 }),
    ],
    locked: [
      buildMatch("bundesliga", 3, "vfb-stuttgart", "eintracht-frankfurt", { kickoff: "Sat 15:30" }),
      buildMatch("bundesliga", 4, "borussia-monchengladbach", "vfl-wolfsburg", { kickoff: "Sun 17:30" }),
    ],
    fixtures: [],
    matchweekCount: 5,
    topTeams: [
      { slug: "bayern-munich",    name: "Bayern Munich",    currentPosition: 1, recentForm: "WWWLW" },
      { slug: "bayer-leverkusen", name: "Bayer Leverkusen", currentPosition: 2, recentForm: "WDWWW" },
      { slug: "rb-leipzig",       name: "RB Leipzig",       currentPosition: 3, recentForm: "WWWLD" },
      { slug: "borussia-dortmund", name: "Borussia Dortmund", currentPosition: 4, recentForm: "DWLWW" },
      { slug: "vfb-stuttgart",    name: "VfB Stuttgart",    currentPosition: 5, recentForm: "WDWLW" },
      { slug: "eintracht-frankfurt", name: "Eintracht Frankfurt", currentPosition: 6, recentForm: "LWDWL" },
      { slug: "borussia-monchengladbach", name: "Borussia Mönchengladbach", currentPosition: 7, recentForm: "DDWLD" },
      { slug: "vfl-wolfsburg",    name: "VfL Wolfsburg",    currentPosition: 8, recentForm: "LDWLD" },
    ],
    topScorer: { name: "Harry Kane", goals: 21 },
  },
  "serie-a": {
    free: [],
    locked: [
      buildMatch("serie-a", 1, "inter", "juventus",  { kickoff: "Sun 18:00" }),
      buildMatch("serie-a", 2, "ac-milan", "napoli",  { kickoff: "Sat 20:45" }),
    ],
    fixtures: [
      buildMatch("serie-a", 3, "atalanta", "as-roma", { kickoff: "Sun 12:30" }),
      buildMatch("serie-a", 4, "lazio", "fiorentina", { kickoff: "Sun 15:00" }),
      buildMatch("serie-a", 5, "torino", "bologna",   { kickoff: "Mon 20:45" }),
    ],
    matchweekCount: 6,
    topTeams: [
      { slug: "inter",     name: "Inter",     currentPosition: 1, recentForm: "WWWWL" },
      { slug: "juventus",  name: "Juventus",  currentPosition: 2, recentForm: "DWWLW" },
      { slug: "ac-milan",  name: "AC Milan",  currentPosition: 3, recentForm: "WLWDW" },
      { slug: "napoli",    name: "Napoli",    currentPosition: 4, recentForm: "WDWWL" },
      { slug: "atalanta",  name: "Atalanta",  currentPosition: 5, recentForm: "WWLWD" },
      { slug: "as-roma",   name: "AS Roma",   currentPosition: 6, recentForm: "DLWWD" },
      { slug: "lazio",     name: "Lazio",     currentPosition: 7, recentForm: "LWDWL" },
      { slug: "fiorentina", name: "Fiorentina", currentPosition: 8, recentForm: "DLLWW" },
    ],
    topScorer: { name: "Lautaro Martínez", goals: 20 },
  },
  "ligue-1": {
    free: [],
    locked: [ buildMatch("ligue-1", 1, "paris-saint-germain", "monaco", { kickoff: "Sun 20:45" }) ],
    fixtures: [
      buildMatch("ligue-1", 2, "lyon", "marseille",     { kickoff: "Sat 21:00" }),
      buildMatch("ligue-1", 3, "lille", "nice",         { kickoff: "Sun 15:00" }),
      buildMatch("ligue-1", 4, "rennes", "lens",        { kickoff: "Sun 17:05" }),
    ],
    matchweekCount: 5,
    topTeams: [
      { slug: "paris-saint-germain", name: "Paris Saint-Germain", currentPosition: 1, recentForm: "WWWWW" },
      { slug: "monaco",              name: "Monaco",              currentPosition: 2, recentForm: "WDWWL" },
      { slug: "lyon",                name: "Lyon",                currentPosition: 3, recentForm: "WLWWD" },
      { slug: "marseille",           name: "Marseille",           currentPosition: 4, recentForm: "DWWLW" },
      { slug: "lille",               name: "Lille",               currentPosition: 5, recentForm: "WLDWL" },
    ],
    topScorer: { name: "Ousmane Dembélé", goals: 14 },
  },
  "champions-league": {
    free: [],
    locked: [ buildMatch("champions-league", 1, "real-madrid", "manchester-city", { kickoff: "Wed 21:00" }) ],
    fixtures: [
      buildMatch("champions-league", 2, "bayern-munich", "paris-saint-germain", { kickoff: "Wed 21:00" }),
      buildMatch("champions-league", 3, "arsenal", "barcelona", { kickoff: "Tue 21:00" }),
    ],
    matchweekCount: 6,
    topTeams: [
      { slug: "real-madrid",    name: "Real Madrid",    currentPosition: 1, recentForm: "WWWDW" },
      { slug: "manchester-city", name: "Manchester City", currentPosition: 2, recentForm: "WWLWW" },
      { slug: "bayern-munich",   name: "Bayern Munich",   currentPosition: 3, recentForm: "WDWWL" },
      { slug: "paris-saint-germain", name: "Paris Saint-Germain", currentPosition: 4, recentForm: "WWWWD" },
      { slug: "barcelona",      name: "Barcelona",      currentPosition: 5, recentForm: "WWWLW" },
    ],
  },
  "europa-league": {
    free: [],
    locked: [ buildMatch("europa-league", 1, "as-roma", "lazio", { kickoff: "Thu 21:00" }) ],
    fixtures: [
      buildMatch("europa-league", 2, "ajax", "rangers",   { kickoff: "Thu 18:45" }),
      buildMatch("europa-league", 3, "olympiakos", "tottenham", { kickoff: "Thu 18:45" }),
    ],
    matchweekCount: 5,
    topTeams: [
      { slug: "ajax",         name: "Ajax",         currentPosition: 1, recentForm: "WWWLW" },
      { slug: "as-roma",      name: "AS Roma",      currentPosition: 2, recentForm: "WDWWL" },
      { slug: "lazio",        name: "Lazio",        currentPosition: 3, recentForm: "WLWWD" },
      { slug: "atalanta",     name: "Atalanta",     currentPosition: 4, recentForm: "DWWLW" },
      { slug: "rangers",      name: "Rangers",      currentPosition: 5, recentForm: "WLDWL" },
    ],
  },
  "eredivisie": {
    free: [],
    locked: [ buildMatch("eredivisie", 1, "ajax", "psv", { kickoff: "Sun 14:30" }) ],
    fixtures: [
      buildMatch("eredivisie", 2, "feyenoord", "az-alkmaar", { kickoff: "Sun 16:45" }),
      buildMatch("eredivisie", 3, "twente", "utrecht",       { kickoff: "Sat 20:00" }),
    ],
    matchweekCount: 6,
    topTeams: [
      { slug: "psv",         name: "PSV",         currentPosition: 1, recentForm: "WWWWW" },
      { slug: "feyenoord",   name: "Feyenoord",   currentPosition: 2, recentForm: "WWWLW" },
      { slug: "ajax",        name: "Ajax",        currentPosition: 3, recentForm: "WDWWL" },
      { slug: "az-alkmaar",  name: "AZ Alkmaar",  currentPosition: 4, recentForm: "DWWLW" },
      { slug: "twente",      name: "Twente",      currentPosition: 5, recentForm: "WLDWL" },
    ],
    topScorer: { name: "Luuk de Jong", goals: 17 },
  },
  "primeira-liga": {
    free: [],
    locked: [ buildMatch("primeira-liga", 1, "benfica", "porto", { kickoff: "Sun 20:30" }) ],
    fixtures: [
      buildMatch("primeira-liga", 2, "sporting-cp", "braga",    { kickoff: "Sun 18:00" }),
      buildMatch("primeira-liga", 3, "vitoria-guimaraes", "boavista", { kickoff: "Sat 20:30" }),
    ],
    matchweekCount: 6,
    topTeams: [
      { slug: "benfica",      name: "Benfica",      currentPosition: 1, recentForm: "WWWLW" },
      { slug: "porto",        name: "Porto",        currentPosition: 2, recentForm: "WDWWL" },
      { slug: "sporting-cp",  name: "Sporting CP",  currentPosition: 3, recentForm: "WLWWD" },
      { slug: "braga",        name: "Braga",        currentPosition: 4, recentForm: "DWWLW" },
      { slug: "vitoria-guimaraes", name: "Vitória Guimarães", currentPosition: 5, recentForm: "WLDWL" },
    ],
  },
  "championship": {
    free: [],
    locked: [ buildMatch("championship", 1, "leeds-united", "leicester-city", { kickoff: "Sat 12:30" }) ],
    fixtures: [
      buildMatch("championship", 2, "ipswich-town", "southampton", { kickoff: "Sat 15:00" }),
      buildMatch("championship", 3, "norwich-city", "west-bromwich", { kickoff: "Sat 15:00" }),
    ],
    matchweekCount: 8,
    topTeams: [
      { slug: "leeds-united",   name: "Leeds United",   currentPosition: 1, recentForm: "WWWWL" },
      { slug: "leicester-city", name: "Leicester City", currentPosition: 2, recentForm: "WWWLW" },
      { slug: "ipswich-town",   name: "Ipswich Town",   currentPosition: 3, recentForm: "DWWWL" },
      { slug: "southampton",    name: "Southampton",    currentPosition: 4, recentForm: "WLWWL" },
      { slug: "norwich-city",   name: "Norwich City",   currentPosition: 5, recentForm: "DLWLW" },
    ],
  },
};

export const GET: APIRoute = ({ params }) => {
  const slug = params.slug as LeagueSlug;
  if (!leagues[slug]) {
    return new Response(JSON.stringify({ error: "Unknown league" }), { status: 404 });
  }
  const cfg = leagues[slug];
  const data = PREDICTIONS_BY_LEAGUE[slug];

  const response: LeagueResponse = {
    league: {
      slug,
      name: cfg.name,
      country: cfg.country,
      currentMatchweek: data.matchweekCount,
      season: cfg.season,
      teams: cfg.teams,
    },
    today: {
      freeCount: data.free.length,
      totalCount: data.free.length + data.locked.length + data.fixtures.length,
      freeMatches: data.free,
      lockedMatches: data.locked,
      fixtures: data.fixtures,
    },
    week: { matches: [...data.free, ...data.locked, ...data.fixtures], predictionsCount: data.free.length + data.locked.length },
    upcoming: { matches: [...data.free, ...data.locked, ...data.fixtures] },
    topTeams: data.topTeams,
    topScorer: data.topScorer,
    predictionsThisSeason: 380 + data.matchweekCount * 10,
    predictionsThisWeek: data.free.length + data.locked.length + data.fixtures.length,
    lastUpdated: NOW,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
};
