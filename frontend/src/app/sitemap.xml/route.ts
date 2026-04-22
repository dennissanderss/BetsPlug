import { fetchAllSlugsForSitemap } from "@/lib/sanity-data";
import { getAllComboSlugs } from "@/data/bet-type-league-combos";

export const revalidate = 60;

/**
 * Custom sitemap route — served at /sitemap.xml (EN-only, 2026-04-22)
 * ────────────────────────────────────────────────────────────
 * Emits a single URL per public page — the English canonical —
 * with no hreflang `xhtml:link` alternates. Middleware 308-redirects
 * every /xx/ prefix to the canonical English path so there are no
 * indexable locale variants to advertise.
 *
 * Private routes under the (app) group are excluded, as are
 * funnel pages (/checkout, /login, /welcome) without organic value.
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
  url: string;
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

  const pageEntries: SitemapEntry[] = PUBLIC_PATHS.map(
    ({ canonical, priority, changeFrequency }) => ({
      url: absoluteUrl(canonical),
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const leagueHubEntries: SitemapEntry[] = leagueHubs.map((slug) => ({
    url: absoluteUrl(`/match-predictions/${slug}`),
    lastModified: now,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.85,
  }));

  const betTypeHubEntries: SitemapEntry[] = betTypeHubs.map((slug) => ({
    url: absoluteUrl(`/bet-types/${slug}`),
    lastModified: now,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.75,
  }));

  const comboEntries: SitemapEntry[] = getAllComboSlugs().map(
    ({ betTypeSlug, leagueSlug }) => ({
      url: absoluteUrl(`/bet-types/${betTypeSlug}/${leagueSlug}`),
      lastModified: now,
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.7,
    }),
  );

  const learnPillarEntries: SitemapEntry[] = learnPillars.map((slug) => ({
    url: absoluteUrl(`/learn/${slug}`),
    lastModified: now,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.75,
  }));

  const articleEntries: SitemapEntry[] = articles.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.6,
  }));

  const legalEntries: SitemapEntry[] = LEGAL_PATHS.map(({ path, priority }) => ({
    url: absoluteUrl(path),
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
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
