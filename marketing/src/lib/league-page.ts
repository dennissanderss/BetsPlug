/**
 * Shared loader for the per-league page (EN root + locale variants).
 *
 * Pulls TODAY's predictions from the live backend at
 * /api/homepage/free-picks, filters them down to the league we're
 * rendering, and shapes the response into the structure the page
 * components expect. This replaces the legacy mock generator at
 * /api/predictions/league/{slug}.json which only ever returned a
 * static "Manchester City vs Arsenal" placeholder — broken team
 * logos and made-up prediction text.
 *
 * Top-team rosters + matchweek count + top scorer are kept as
 * static config until a backend endpoint exists. Logos for those
 * teams resolve via the shared <TeamLogo> component which hits
 * /api/public/teams/{slug} at SSR time, so the rosters render
 * real crests despite the static metadata.
 */
import { type Locale } from "@/lib/i18n";
import { type LeagueConfig } from "@/config/leagues";
import { loadLeagueContent } from "@/lib/league-content";
import type { LeaguePageContent } from "@/content/leagues/types";

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

export interface LeagueApiResponse {
  league: {
    slug: string;
    name: string;
    country: string;
    currentMatchweek: number;
    season: string;
    teams: number;
  };
  today: {
    freeCount: number;
    totalCount: number;
    freeMatches: Match[];
    lockedMatches: Match[];
    fixtures: Match[];
  };
  week: { matches: Match[]; predictionsCount: number };
  upcoming: { matches: Match[] };
  topTeams: TopTeam[];
  topScorer?: { name: string; goals: number };
  predictionsThisSeason: number;
  predictionsThisWeek: number;
  lastUpdated: string;
}

interface BackendFreePick {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  league: string;
  scheduled_at: string;
  pick?: "HOME" | "DRAW" | "AWAY" | null;
  home_win_prob?: number | null;
  draw_prob?: number | null;
  away_win_prob?: number | null;
  confidence?: number | null;
  status: string;
}

interface BackendFreePicksResponse {
  today?: BackendFreePick[];
  yesterday?: BackendFreePick[];
  stats?: { total: number; correct: number; winrate: number };
}

const API_BASE =
  import.meta.env.PUBLIC_API_BASE ?? "https://betsplug-production.up.railway.app";

// ---------------------------------------------------------------------------
// Static metadata that the backend doesn't yet expose per league. Each entry
// supplies top teams + current matchweek + top scorer for the league hub
// page; team logos for these still resolve via /api/public/teams/{slug}.
// ---------------------------------------------------------------------------

const LEAGUE_STATIC: Record<string, { matchweekCount: number; topTeams: TopTeam[]; topScorer?: { name: string; goals: number } }> = {
  "premier-league": {
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
    matchweekCount: 6,
    topTeams: [
      { slug: "real-madrid",     name: "Real Madrid",     currentPosition: 1, recentForm: "WWWWD" },
      { slug: "barcelona",       name: "Barcelona",       currentPosition: 2, recentForm: "WWLWW" },
      { slug: "atletico-madrid", name: "Atlético Madrid", currentPosition: 3, recentForm: "WDWWL" },
      { slug: "athletic-bilbao", name: "Athletic Bilbao", currentPosition: 4, recentForm: "DWWLW" },
      { slug: "real-sociedad",   name: "Real Sociedad",   currentPosition: 5, recentForm: "LDWLW" },
      { slug: "villarreal",      name: "Villarreal",      currentPosition: 6, recentForm: "WLDWL" },
      { slug: "real-betis",      name: "Real Betis",      currentPosition: 7, recentForm: "DWLWD" },
      { slug: "valencia",        name: "Valencia",        currentPosition: 8, recentForm: "LWLDW" },
    ],
    topScorer: { name: "Robert Lewandowski", goals: 19 },
  },
  "bundesliga": {
    matchweekCount: 5,
    topTeams: [
      { slug: "bayern-munich",            name: "Bayern Munich",          currentPosition: 1, recentForm: "WWWLW" },
      { slug: "bayer-leverkusen",         name: "Bayer Leverkusen",       currentPosition: 2, recentForm: "WDWWW" },
      { slug: "rb-leipzig",               name: "RB Leipzig",             currentPosition: 3, recentForm: "WWWLD" },
      { slug: "borussia-dortmund",        name: "Borussia Dortmund",      currentPosition: 4, recentForm: "DWLWW" },
      { slug: "vfb-stuttgart",            name: "VfB Stuttgart",          currentPosition: 5, recentForm: "WDWLW" },
      { slug: "eintracht-frankfurt",      name: "Eintracht Frankfurt",    currentPosition: 6, recentForm: "LWDWL" },
      { slug: "borussia-monchengladbach", name: "Borussia Mönchengladbach", currentPosition: 7, recentForm: "DDWLD" },
      { slug: "vfl-wolfsburg",            name: "VfL Wolfsburg",          currentPosition: 8, recentForm: "LDWLD" },
    ],
    topScorer: { name: "Harry Kane", goals: 21 },
  },
  "serie-a": {
    matchweekCount: 6,
    topTeams: [
      { slug: "inter",      name: "Inter",      currentPosition: 1, recentForm: "WWWWL" },
      { slug: "juventus",   name: "Juventus",   currentPosition: 2, recentForm: "DWWLW" },
      { slug: "ac-milan",   name: "AC Milan",   currentPosition: 3, recentForm: "WLWDW" },
      { slug: "napoli",     name: "Napoli",     currentPosition: 4, recentForm: "WDWWL" },
      { slug: "atalanta",   name: "Atalanta",   currentPosition: 5, recentForm: "WWLWD" },
      { slug: "as-roma",    name: "Roma",       currentPosition: 6, recentForm: "DLWWD" },
      { slug: "lazio",      name: "Lazio",      currentPosition: 7, recentForm: "LWDWL" },
      { slug: "fiorentina", name: "Fiorentina", currentPosition: 8, recentForm: "DLLWW" },
    ],
    topScorer: { name: "Lautaro Martínez", goals: 20 },
  },
  "ligue-1": {
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
    matchweekCount: 6,
    topTeams: [
      { slug: "real-madrid",         name: "Real Madrid",         currentPosition: 1, recentForm: "WWWDW" },
      { slug: "manchester-city",     name: "Manchester City",     currentPosition: 2, recentForm: "WWLWW" },
      { slug: "bayern-munich",       name: "Bayern Munich",       currentPosition: 3, recentForm: "WDWWL" },
      { slug: "paris-saint-germain", name: "Paris Saint-Germain", currentPosition: 4, recentForm: "WWWWD" },
      { slug: "barcelona",           name: "Barcelona",           currentPosition: 5, recentForm: "WWWLW" },
    ],
  },
  "europa-league": {
    matchweekCount: 5,
    topTeams: [
      { slug: "ajax",     name: "Ajax",     currentPosition: 1, recentForm: "WWWLW" },
      { slug: "as-roma",  name: "Roma",     currentPosition: 2, recentForm: "WDWWL" },
      { slug: "lazio",    name: "Lazio",    currentPosition: 3, recentForm: "WLWWD" },
      { slug: "atalanta", name: "Atalanta", currentPosition: 4, recentForm: "DWWLW" },
    ],
  },
  "eredivisie": {
    matchweekCount: 6,
    topTeams: [
      { slug: "psv-eindhoven", name: "PSV Eindhoven", currentPosition: 1, recentForm: "WWWWW" },
      { slug: "feyenoord",     name: "Feyenoord",     currentPosition: 2, recentForm: "WWWLW" },
      { slug: "ajax",          name: "Ajax",          currentPosition: 3, recentForm: "WDWWL" },
      { slug: "az-alkmaar",    name: "AZ Alkmaar",    currentPosition: 4, recentForm: "DWWLW" },
      { slug: "twente",        name: "Twente",        currentPosition: 5, recentForm: "WLDWL" },
    ],
    topScorer: { name: "Luuk de Jong", goals: 17 },
  },
  "primeira-liga": {
    matchweekCount: 6,
    topTeams: [
      { slug: "benfica",     name: "Benfica",     currentPosition: 1, recentForm: "WWWLW" },
      { slug: "fc-porto",    name: "Porto",       currentPosition: 2, recentForm: "WDWWL" },
      { slug: "sporting-cp", name: "Sporting CP", currentPosition: 3, recentForm: "WLWWD" },
      { slug: "sc-braga",    name: "Braga",       currentPosition: 4, recentForm: "DWWLW" },
    ],
  },
  "championship": {
    matchweekCount: 8,
    topTeams: [
      { slug: "leeds",          name: "Leeds United",   currentPosition: 1, recentForm: "WWWWL" },
      { slug: "leicester",      name: "Leicester City", currentPosition: 2, recentForm: "WWWLW" },
      { slug: "ipswich",        name: "Ipswich Town",   currentPosition: 3, recentForm: "DWWWL" },
      { slug: "southampton",    name: "Southampton",    currentPosition: 4, recentForm: "WLWWL" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickLabel(p: BackendFreePick): string {
  if (p.pick === "HOME") return p.home_team;
  if (p.pick === "AWAY") return p.away_team;
  return "Draw";
}

function pickConfidence(p: BackendFreePick): number {
  const probs = [p.home_win_prob ?? 0, p.draw_prob ?? 0, p.away_win_prob ?? 0];
  return Math.round(Math.max(...probs) * 100);
}

function formatKickoff(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function buildMatchFromBackend(p: BackendFreePick, leagueName: string, leagueSlug: string): Match {
  return {
    id: p.id,
    league: { name: leagueName, slug: leagueSlug, logo: "" },
    kickoff: formatKickoff(p.scheduled_at),
    homeTeam: {
      name: p.home_team,
      logo: p.home_team_logo ?? "",
      slug: slugify(p.home_team),
    },
    awayTeam: {
      name: p.away_team,
      logo: p.away_team_logo ?? "",
      slug: slugify(p.away_team),
    },
    prediction: pickLabel(p),
    market: "Match Result",
    confidence: pickConfidence(p),
    // Match-detail pages don't exist on the app yet. PredictionCard will
    // not render a wrap-link without matchUrl, so leaving it empty
    // disables the click that would otherwise 404.
    matchUrl: "",
  };
}

function isMatchInLeague(p: BackendFreePick, leagueName: string): boolean {
  const a = (p.league ?? "").toLowerCase().trim();
  const b = leagueName.toLowerCase().trim();
  if (!a || !b) return false;
  // Exact or substring match — backend uses "Premier League", "Eredivisie" etc.
  return a === b || a.includes(b) || b.includes(a);
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loadLeagueData(league: LeagueConfig, _siteOrigin: URL | undefined): Promise<LeagueApiResponse> {
  const staticMeta = LEAGUE_STATIC[league.slug] ?? { matchweekCount: 0, topTeams: [] };

  const empty: LeagueApiResponse = {
    league: {
      slug: league.slug,
      name: league.name,
      country: league.country,
      currentMatchweek: staticMeta.matchweekCount,
      season: league.season,
      teams: league.teams,
    },
    today: { freeCount: 0, totalCount: 0, freeMatches: [], lockedMatches: [], fixtures: [] },
    week: { matches: [], predictionsCount: 0 },
    upcoming: { matches: [] },
    topTeams: staticMeta.topTeams,
    topScorer: staticMeta.topScorer,
    predictionsThisSeason: 380 + staticMeta.matchweekCount * 10,
    predictionsThisWeek: 0,
    lastUpdated: new Date().toISOString(),
  };

  let matches: Match[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/homepage/free-picks`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as BackendFreePicksResponse;
      const today = (data.today ?? []).filter((p) => isMatchInLeague(p, league.name));
      matches = today.map((p) => buildMatchFromBackend(p, league.name, league.slug));
    }
  } catch {
    // Swallow — fall through to empty/static fallback.
  }

  // Gating: top-3 leagues show first 2 picks free, the rest as locked
  // teasers. Other leagues have no free picks — every match is locked.
  let freeMatches: Match[];
  let lockedMatches: Match[];
  if (league.isTopThree) {
    freeMatches = matches.slice(0, 2);
    lockedMatches = matches.slice(2).map((m) => ({
      ...m,
      prediction: undefined,
      market: undefined,
      confidence: undefined,
    }));
  } else {
    freeMatches = [];
    lockedMatches = matches.map((m) => ({
      ...m,
      prediction: undefined,
      market: undefined,
      confidence: undefined,
    }));
  }

  return {
    ...empty,
    today: {
      freeCount: freeMatches.length,
      totalCount: matches.length,
      freeMatches,
      lockedMatches,
      fixtures: [],
    },
    week: { matches, predictionsCount: matches.length },
    upcoming: { matches },
    predictionsThisWeek: matches.length,
  };
}

export async function loadLeaguePageBundle(league: LeagueConfig, locale: Locale, siteOrigin: URL | undefined): Promise<{
  content: LeaguePageContent;
  data: LeagueApiResponse;
}> {
  const [content, data] = await Promise.all([
    loadLeagueContent(league, locale),
    loadLeagueData(league, siteOrigin),
  ]);
  return { content, data };
}
