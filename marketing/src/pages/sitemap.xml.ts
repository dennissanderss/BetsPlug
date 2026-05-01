import type { APIRoute } from "astro";
import { sanity } from "../lib/sanity";

// Pre-render the sitemap at build time so it ships as a static file
// even though we're using the default `output: "static"` mode.
export const prerender = true;

const SITE = "https://betsplug.com";

const STATIC_PATHS: string[] = [
  "/",
  "/about-us",
  "/b2b",
  "/bet-types",
  "/contact",
  "/cookies",
  "/engine",
  "/how-it-works",
  "/learn",
  "/match-predictions",
  "/pricing",
  "/privacy",
  "/responsible-gambling",
  "/terms",
  "/track-record",
];

interface SlugResult {
  slug: { current: string };
}

async function fetchSlugs(documentType: string): Promise<string[]> {
  try {
    const rows = await sanity.fetch<SlugResult[]>(
      `*[_type == $type && defined(slug.current)] { slug }`,
      { type: documentType },
    );
    return rows.map((r) => r.slug.current);
  } catch {
    return [];
  }
}

export const GET: APIRoute = async () => {
  const [learn, leagues, betTypes] = await Promise.all([
    fetchSlugs("learnPillar"),
    fetchSlugs("leagueHub"),
    fetchSlugs("betTypeHub"),
  ]);

  const dynamicPaths: string[] = [
    ...learn.map((s) => `/learn/${s}`),
    ...leagues.map((s) => `/match-predictions/${s}`),
    ...betTypes.map((s) => `/bet-types/${s}`),
  ];

  const allPaths = [...STATIC_PATHS, ...dynamicPaths];
  const today = new Date().toISOString().slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths
  .map(
    (path) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${path === "/" ? "1.0" : "0.7"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
