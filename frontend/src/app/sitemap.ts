import type { MetadataRoute } from "next";
import { articles } from "@/data/articles";
import { LEAGUE_HUBS } from "@/data/league-hubs";
import { defaultLocale, locales, localeMeta } from "@/i18n/config";
import { localizePath } from "@/i18n/routes";

/**
 * Dynamic sitemap — listed at /sitemap.xml
 * ────────────────────────────────────────────────────────────
 * Emits one entry per public, indexable page with hreflang
 * alternates for every supported locale. Private (authenticated)
 * routes under the (app) group are deliberately excluded, as are
 * funnel pages like /checkout, /login and /welcome that have no
 * organic search value.
 */

const SITE_URL = "https://betsplug.com";

/* ── Canonical public paths ─────────────────────────────────── */

type PublicPath = {
  canonical: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const PUBLIC_PATHS: PublicPath[] = [
  { canonical: "/", priority: 1.0, changeFrequency: "daily" },
  { canonical: "/match-predictions", priority: 0.9, changeFrequency: "daily" },
  { canonical: "/articles", priority: 0.8, changeFrequency: "weekly" },
  { canonical: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { canonical: "/track-record", priority: 0.7, changeFrequency: "weekly" },
  { canonical: "/about", priority: 0.6, changeFrequency: "monthly" },
  { canonical: "/about-us", priority: 0.5, changeFrequency: "monthly" },
  { canonical: "/contact", priority: 0.5, changeFrequency: "yearly" },
];

/* ── Localized, non-routed legal pages ──────────────────────── */
// Legal pages live outside the routeTable because they don't have
// localized slugs — the same URL serves every locale.
const LEGAL_PATHS: { path: string; priority: number }[] = [
  { path: "/privacy", priority: 0.3 },
  { path: "/cookies", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

/* ── Helpers ────────────────────────────────────────────────── */

function absoluteUrl(path: string): string {
  // path is always "/..." — concatenation is safe
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function languageAlternatesFor(canonical: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of locales) {
    const tag = localeMeta[l].hreflang;
    map[tag] = absoluteUrl(localizePath(canonical, l));
  }
  map["x-default"] = absoluteUrl(localizePath(canonical, defaultLocale));
  return map;
}

/* ── Sitemap builder ────────────────────────────────────────── */

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pageEntries: MetadataRoute.Sitemap = PUBLIC_PATHS.map(
    ({ canonical, priority, changeFrequency }) => ({
      url: absoluteUrl(localizePath(canonical, defaultLocale)),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages: languageAlternatesFor(canonical) },
    })
  );

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => {
    const canonical = `/articles/${article.slug}`;
    return {
      url: absoluteUrl(canonical),
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: languageAlternatesFor(canonical) },
    };
  });

  const leagueHubEntries: MetadataRoute.Sitemap = LEAGUE_HUBS.map((hub) => {
    const canonical = `/match-predictions/${hub.slug}`;
    return {
      url: absoluteUrl(localizePath(canonical, defaultLocale)),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
      alternates: { languages: languageAlternatesFor(canonical) },
    };
  });

  const legalEntries: MetadataRoute.Sitemap = LEGAL_PATHS.map(
    ({ path, priority }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "yearly",
      priority,
    })
  );

  return [...pageEntries, ...leagueHubEntries, ...articleEntries, ...legalEntries];
}
