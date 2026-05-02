/**
 * Shared loader for the per-league page (EN root + locale variants).
 * Wraps `loadLeagueContent()` and the per-league API fetch into a
 * single helper so the EN and locale page files stay thin.
 */
import { type Locale } from "@/lib/i18n";
import { type LeagueConfig } from "@/config/leagues";
import { loadLeagueContent } from "@/lib/league-content";
import type { LeaguePageContent } from "@/content/leagues/types";

interface LeagueApiResponse {
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
    freeMatches: any[];
    lockedMatches: any[];
    fixtures: any[];
  };
  week: { matches: any[]; predictionsCount: number };
  upcoming: { matches: any[] };
  topTeams: any[];
  topScorer?: { name: string; goals: number };
  predictionsThisSeason: number;
  predictionsThisWeek: number;
  lastUpdated: string;
}

const EMPTY: LeagueApiResponse = {
  league: { slug: "", name: "", country: "", currentMatchweek: 0, season: "", teams: 0 },
  today: { freeCount: 0, totalCount: 0, freeMatches: [], lockedMatches: [], fixtures: [] },
  week: { matches: [], predictionsCount: 0 },
  upcoming: { matches: [] },
  topTeams: [],
  predictionsThisSeason: 0,
  predictionsThisWeek: 0,
  lastUpdated: new Date().toISOString(),
};

export async function loadLeagueData(league: LeagueConfig, siteOrigin: URL | undefined): Promise<LeagueApiResponse> {
  try {
    const url = new URL(`/api/predictions/league/${league.slug}.json`, siteOrigin ?? "http://localhost:4321");
    const res = await fetch(url);
    if (!res.ok) return EMPTY;
    return (await res.json()) as LeagueApiResponse;
  } catch {
    return EMPTY;
  }
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
