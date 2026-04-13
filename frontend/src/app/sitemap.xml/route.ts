import { fetchAllSlugsForSitemap } from "@/lib/sanity-data";
import { defaultLocale, locales, localeMeta } from "@/i18n/config";
import { localizePath } from "@/i18n/routes";

export const revalidate = 60;

/**
 * Custom sitemap route — served at /sitemap.xml
 * ────────────────────────────────────────────────────────────
 * Replaces the previous Next.js Metadata Route (sitemap.ts) so
 * we can prepend an <?xml-stylesheet?> processing instruction
 * pointing at /sitemap.xsl. The Metadata Route API returns
 * structured objects and offers no hook for the PI, so we
 * serialize the XML by hand here.
 *
 * The URL set, hreflang alternates and priorities are kept
 * identical to the old sitemap.ts so the migration is a pure
 * presentation upgrade — Google sees exactly the same content.
 *
 * Private (authenticated) routes under the (app) group are
 * deliberately excluded, as are funnel pages like /checkout,
 * /login and /welcome that have no organic search value.
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
  alternates?: Record<string, string>;
};

/* ── Canonical public paths ─────────────────────────────────── */

const PUBLIC_PATHS: Array<{
  canonical: string;
  priority: number;
  changeFrequency: ChangeFreq;
}> = [
  { canonical: "/", priority: 1.0, changeFrequency: "daily" },
  { canonical: "/match-predictions", priority: 0.9, changeFrequency: "daily" },
  { canonical: "/bet-types", priority: 0.8, changeFrequency: "monthly" },
  { canonical: "/learn", priority: 0.8, changeFrequency: "monthly" },
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
      url: absoluteUrl(localizePath(canonical, defaultLocale)),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: languageAlternatesFor(canonical),
    }),
  );

  const leagueHubEntries: SitemapEntry[] = leagueHubs.map((slug) => {
    const canonical = `/match-predictions/${slug}`;
    return {
      url: absoluteUrl(localizePath(canonical, defaultLocale)),
      lastModified: now,
      changeFrequency: "daily" as ChangeFreq,
      priority: 0.85,
      alternates: languageAlternatesFor(canonical),
    };
  });

  const betTypeHubEntries: SitemapEntry[] = betTypeHubs.map((slug) => {
    const canonical = `/bet-types/${slug}`;
    return {
      url: absoluteUrl(localizePath(canonical, defaultLocale)),
      lastModified: now,
      changeFrequency: "monthly" as ChangeFreq,
      priority: 0.75,
      alternates: languageAlternatesFor(canonical),
    };
  });

  const learnPillarEntries: SitemapEntry[] = learnPillars.map((slug) => {
    const canonical = `/learn/${slug}`;
    return {
      url: absoluteUrl(localizePath(canonical, defaultLocale)),
      lastModified: now,
      changeFrequency: "monthly" as ChangeFreq,
      priority: 0.75,
      alternates: languageAlternatesFor(canonical),
    };
  });

  const articleEntries: SitemapEntry[] = articles.map((article) => {
    const canonical = `/articles/${article.slug}`;
    return {
      url: absoluteUrl(canonical),
      lastModified: article.publishedAt
        ? new Date(article.publishedAt)
        : now,
      changeFrequency: "monthly" as ChangeFreq,
      priority: 0.6,
      alternates: languageAlternatesFor(canonical),
    };
  });

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
    ...learnPillarEntries,
    ...articleEntries,
    ...legalEntries,
  ];
}

function serializeXml(entries: SitemapEntry[]): string {
  const urlBlocks = entries
    .map((e) => {
      const altLines = e.alternates
        ? Object.entries(e.alternates)
            .map(
              ([lang, href]) =>
                `    <xhtml:link rel="alternate" hreflang="${escapeXml(
                  lang,
                )}" href="${escapeXml(href)}" />`,
            )
            .join("\n")
        : "";
      return `  <url>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>${
        altLines ? "\n" + altLines : ""
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
