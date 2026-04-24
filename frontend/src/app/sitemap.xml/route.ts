import { fetchAllSlugsForSitemap } from "@/lib/sanity-data";
import { getAllComboSlugs } from "@/data/bet-type-league-combos";
import { locales, defaultLocale, localeMeta, type Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routes";

export const revalidate = 60;

/**
 * 16-locale sitemap — Nerdytips pattern (2026-04-24)
 * ────────────────────────────────────────────────────────────
 * Every canonical URL is enumerated across all 16 locales. Each
 * entry carries its own <xhtml:link rel="alternate" hreflang=…>
 * cluster pointing at every sibling locale + x-default, which
 * tells Google: "these are the same content in different
 * languages, index all of them, serve the matching one per
 * user".
 *
 * Private routes under the (app) group are excluded, as are
 * funnel pages (/checkout, /login, /welcome) without organic
 * value. Legal pages (/privacy, /cookies, /terms) are only
 * emitted in the default locale since content is identical
 * across locales.
 */

const SITE_URL = "https://betsplug.com";

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type SitemapEntry = {
  /** Absolute URL for this locale × path combo. */
  url: string;
  /** Map of hreflang → absolute URL for every sibling locale. */
  alternates: Record<string, string>;
  lastModified: Date;
  changeFrequency: ChangeFreq;
  priority: number;
};

/* ── Canonical public paths ─────────────────────────────────── */

const PUBLIC_PATHS: Array<{
  canonical: string;
  priority: number;
  changeFrequency: ChangeFreq;
}> = [
  { canonical: "/", priority: 1.0, changeFrequency: "daily" },
  { canonical: "/match-predictions", priority: 0.9, changeFrequency: "daily" },
  { canonical: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { canonical: "/bet-types", priority: 0.8, changeFrequency: "monthly" },
  { canonical: "/learn", priority: 0.8, changeFrequency: "monthly" },
  { canonical: "/articles", priority: 0.8, changeFrequency: "weekly" },
  { canonical: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { canonical: "/track-record", priority: 0.7, changeFrequency: "weekly" },
  { canonical: "/engine", priority: 0.7, changeFrequency: "monthly" },
  { canonical: "/b2b", priority: 0.6, changeFrequency: "monthly" },
  { canonical: "/about-us", priority: 0.6, changeFrequency: "monthly" },
  { canonical: "/responsible-gambling", priority: 0.5, changeFrequency: "yearly" },
  { canonical: "/contact", priority: 0.5, changeFrequency: "yearly" },
];

const LEGAL_PATHS: { path: string; priority: number }[] = [
  { path: "/privacy", priority: 0.3 },
  { path: "/cookies", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

/* ── Helpers ────────────────────────────────────────────────── */

function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function buildAbsolute(canonicalPath: string, locale: Locale): string {
  return absoluteUrl(localizePath(canonicalPath, locale));
}

/** Build the hreflang alternate cluster for a canonical path. */
function alternatesFor(canonicalPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of locales) {
    const tag = localeMeta[l].hreflang;
    out[tag] = buildAbsolute(canonicalPath, l);
  }
  out["x-default"] = buildAbsolute(canonicalPath, defaultLocale);
  return out;
}

/**
 * Emit 16 entries (one per locale) for a single canonical path,
 * each with the same hreflang cluster. The cluster is what tells
 * Google the 16 URLs are siblings of the same content.
 */
function expandAcrossLocales(
  canonicalPath: string,
  opts: {
    priority: number;
    changeFrequency: ChangeFreq;
    lastModified?: Date;
  },
): SitemapEntry[] {
  const alternates = alternatesFor(canonicalPath);
  const when = opts.lastModified ?? new Date();
  return locales.map((l) => ({
    url: buildAbsolute(canonicalPath, l),
    alternates,
    lastModified: when,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  }));
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/* ── Sitemap builder ────────────────────────────────────────── */

async function buildEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const { articles, learnPillars, leagueHubs, betTypeHubs } =
    await fetchAllSlugsForSitemap();

  const pageEntries = PUBLIC_PATHS.flatMap(({ canonical, priority, changeFrequency }) =>
    expandAcrossLocales(canonical, { priority, changeFrequency, lastModified: now }),
  );

  const leagueHubEntries = leagueHubs.flatMap((slug) =>
    expandAcrossLocales(`/match-predictions/${slug}`, {
      priority: 0.85,
      changeFrequency: "daily",
      lastModified: now,
    }),
  );

  const betTypeHubEntries = betTypeHubs.flatMap((slug) =>
    expandAcrossLocales(`/bet-types/${slug}`, {
      priority: 0.75,
      changeFrequency: "monthly",
      lastModified: now,
    }),
  );

  const comboEntries = getAllComboSlugs().flatMap(({ betTypeSlug, leagueSlug }) =>
    expandAcrossLocales(`/bet-types/${betTypeSlug}/${leagueSlug}`, {
      priority: 0.7,
      changeFrequency: "weekly",
      lastModified: now,
    }),
  );

  const learnPillarEntries = learnPillars.flatMap((slug) =>
    expandAcrossLocales(`/learn/${slug}`, {
      priority: 0.75,
      changeFrequency: "monthly",
      lastModified: now,
    }),
  );

  const articleEntries = articles.flatMap((article) =>
    expandAcrossLocales(`/articles/${article.slug}`, {
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
    }),
  );

  // Legal pages: identical content across locales — emit default
  // locale only, no hreflang cluster needed.
  const legalEntries: SitemapEntry[] = LEGAL_PATHS.map(({ path, priority }) => ({
    url: absoluteUrl(path),
    alternates: {},
    lastModified: now,
    changeFrequency: "yearly" as ChangeFreq,
    priority,
  }));

  return [
    ...pageEntries,
    ...leagueHubEntries,
    ...betTypeHubEntries,
    ...comboEntries,
    ...learnPillarEntries,
    ...articleEntries,
    ...legalEntries,
  ];
}

function serializeXml(entries: SitemapEntry[]): string {
  const urlBlocks = entries
    .map((e) => {
      const alternateLines = Object.entries(e.alternates)
        .map(
          ([tag, url]) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(
              tag,
            )}" href="${escapeXml(url)}" />`,
        )
        .join("\n");
      return `  <url>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>${
        alternateLines ? "\n" + alternateLines : ""
      }
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks}
</urlset>
`;
}

/* ── Route handler ──────────────────────────────────────────── */

export async function GET(): Promise<Response> {
  const xml = serializeXml(await buildEntries());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
