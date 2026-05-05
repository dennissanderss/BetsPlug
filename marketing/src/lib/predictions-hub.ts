/**
 * Shared loader for the predictions hub page (EN root + locale variants).
 * Centralized so we don't duplicate the fetch + format logic in two pages.
 *
 * The hub page renders the same Free-tier picks the dashboard surfaces
 * to a logged-out / Free-tier visitor. This loader hits the public
 * backend endpoint at /api/homepage/free-picks (same source of truth as
 * the homepage hero + live-predictions grid), filters to today's UTC
 * day, and shapes the response into the structure the existing hub
 * components already expect. Falls back to an empty state when the
 * API is unreachable so a backend hiccup never crashes the page.
 */
import { getContent, defaultLocale, type Locale } from "@/lib/i18n";
import { localeBcp47 } from "@/i18n/locales";
import { leagues, leagueOrder } from "@/config/leagues";
import type { PredictionsHubContent } from "@/content/pages/predictions/types";

interface HubPrediction {
  id: string;
  league: { name: string; slug: string; logo: string; country: string };
  kickoff: string;
  /** Raw ISO timestamp — feeds the client-side kickoff countdown swap. */
  kickoffIso: string;
  homeTeam: { name: string; logo: string; slug: string };
  awayTeam: { name: string; logo: string; slug: string };
  prediction: string;
  market: string;
  confidence: number;
  locked: boolean;
  lockedAt: string;
  matchUrl: string;
}

interface HubResponse {
  today: {
    freeCount: number;
    totalCount: number;
    predictions: HubPrediction[];
  };
  tomorrow: { teaser: HubPrediction; totalCount: number };
  week: { dailyCounts: { date: string; count: number }[] };
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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickLabel(p: BackendFreePick): string {
  if (p.pick === "HOME") return p.home_team;
  if (p.pick === "AWAY") return p.away_team;
  return "Draw";
}

function formatKickoff(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleString(localeBcp47[locale] ?? "en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function shapePick(p: BackendFreePick, locale: Locale): HubPrediction {
  // Best-side probability — same number used on the hero card and live
  // grid, so all three surfaces report the same confidence figure for
  // the same match.
  const probs = [
    p.home_win_prob ?? 0,
    p.draw_prob ?? 0,
    p.away_win_prob ?? 0,
  ];
  const maxProb = Math.max(...probs);
  const conf = Math.round(maxProb * 100);
  return {
    id: p.id,
    league: {
      name: p.league,
      slug: slugify(p.league),
      logo: "",
      country: "",
    },
    kickoff: formatKickoff(p.scheduled_at, locale),
    kickoffIso: p.scheduled_at,
    homeTeam: { name: p.home_team, slug: slugify(p.home_team), logo: p.home_team_logo ?? "" },
    awayTeam: { name: p.away_team, slug: slugify(p.away_team), logo: p.away_team_logo ?? "" },
    prediction: pickLabel(p),
    market: "Match Result",
    confidence: conf,
    locked: true,
    lockedAt: p.scheduled_at,
    matchUrl: `https://app.betsplug.com/predictions/${p.match_id}`,
  };
}

function emptyTeaser(): HubPrediction {
  return {
    id: "empty",
    league: { name: "—", slug: "—", logo: "", country: "—" },
    kickoff: "—",
    kickoffIso: "",
    homeTeam: { name: "—", logo: "", slug: "—" },
    awayTeam: { name: "—", logo: "", slug: "—" },
    prediction: "—",
    market: "—",
    confidence: 0,
    locked: false,
    lockedAt: new Date().toISOString(),
    matchUrl: "",
  };
}

const EMPTY_HUB: HubResponse = {
  today: { freeCount: 0, totalCount: 0, predictions: [] },
  tomorrow: { teaser: emptyTeaser(), totalCount: 0 },
  week: { dailyCounts: [] },
  lastUpdated: new Date().toISOString(),
};

export async function loadHubData(
  _siteOrigin: URL | undefined,
  locale: Locale = defaultLocale,
): Promise<HubResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/homepage/free-picks`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return EMPTY_HUB;
    const data = (await res.json()) as BackendFreePicksResponse;
    // The backend's `today` field is misleadingly named — it's the
    // "next-N-upcoming Free-tier picks" feed (up to 45 days out),
    // mirroring what the dashboard surfaces to a logged-out / Free
    // visitor. We render it as-is so the marketing page reflects what
    // the app actually shows, instead of strict-filtering to today's
    // calendar day and rendering empty most weekdays.
    const all = data.today ?? [];
    const todayPicks = all.map((p) => shapePick(p, locale));
    return {
      today: {
        freeCount: todayPicks.length,
        // The public free-picks endpoint exposes only Free-tier picks, so
        // the visible count equals the total available to a non-account
        // visitor. The "5 of N" upsell uses freeCount as the numerator;
        // when we wire a paid-tier preview, totalCount will diverge.
        totalCount: todayPicks.length,
        predictions: todayPicks,
      },
      tomorrow: { teaser: emptyTeaser(), totalCount: 0 },
      week: { dailyCounts: [] },
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return EMPTY_HUB;
  }
}

/** Format today's date in the locale's BCP-47. */
export function formatTodayForLocale(locale: Locale): string {
  // Render-time date — refreshed on every (ISR-cached) build. The
  // previous version pinned a stable date so SSG output was
  // deterministic, but we now lean on Vercel ISR + the live
  // free-picks fetch, so a fresh "today" header is the right call.
  return new Intl.DateTimeFormat(localeBcp47[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

/** Map league slug → predictions today (mock: 47 distributed across 10 leagues). */
export function dailyCountsByLeague(): Record<string, number> {
  // TODO: derive from real API / DB. Mock spread:
  return {
    "premier-league":   8,
    "la-liga":          7,
    "bundesliga":       5,
    "serie-a":          6,
    "ligue-1":          5,
    "champions-league": 4,
    "europa-league":    3,
    "eredivisie":       4,
    "primeira-liga":    3,
    "championship":     2,
  };
}

export async function loadHubContent(locale: Locale): Promise<PredictionsHubContent> {
  return await getContent<PredictionsHubContent>("predictions", locale);
}

export { leagues, leagueOrder, defaultLocale };
