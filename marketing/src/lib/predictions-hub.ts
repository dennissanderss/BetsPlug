/**
 * Shared loader for the predictions hub page (EN root + locale variants).
 * Centralized so we don't duplicate the fetch + format logic in two pages.
 */
import { getContent, defaultLocale, type Locale } from "@/lib/i18n";
import { localeBcp47 } from "@/i18n/locales";
import { leagues, leagueOrder } from "@/config/leagues";
import type { PredictionsHubContent } from "@/content/pages/predictions/types";

interface HubResponse {
  today: {
    freeCount: number;
    totalCount: number;
    predictions: Array<{
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
    }>;
  };
  tomorrow: { teaser: HubResponse["today"]["predictions"][number]; totalCount: number };
  week: { dailyCounts: { date: string; count: number }[] };
  lastUpdated: string;
}

const EMPTY_HUB: HubResponse = {
  today: { freeCount: 0, totalCount: 0, predictions: [] },
  tomorrow: {
    teaser: {
      id: "empty",
      league: { name: "—", slug: "—", logo: "", country: "—" },
      kickoff: "—",
      homeTeam: { name: "—", logo: "", slug: "—" },
      awayTeam: { name: "—", logo: "", slug: "—" },
      prediction: "—",
      market: "—",
      confidence: 0,
      locked: false,
      lockedAt: new Date().toISOString(),
      matchUrl: "",
    },
    totalCount: 0,
  },
  week: { dailyCounts: [] },
  lastUpdated: new Date().toISOString(),
};

export async function loadHubData(_siteOrigin: URL | undefined): Promise<HubResponse> {
  // Direct import keeps SSG deterministic — fetching `Astro.site` at
  // build time silently resolved to the live origin and used the
  // previous deploy's shape. The `_siteOrigin` arg is kept so
  // callers don't need to change.
  const { HUB_RESPONSE } = await import("./hub-mock");
  return HUB_RESPONSE;
}

/** Format today's date in the locale's BCP-47. */
export function formatTodayForLocale(locale: Locale): string {
  // Hard-pin to a stable build date so SSG output is reproducible.
  // Real prod would use new Date() at request time (when on SSR/ISR).
  const date = new Date("2026-05-02T12:00:00Z");
  return new Intl.DateTimeFormat(localeBcp47[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
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
