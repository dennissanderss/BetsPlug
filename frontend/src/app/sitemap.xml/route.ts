/**
 * sitemap.xml for the Next.js project (app.betsplug.com).
 *
 * After the marketing/app split (2026-05-01) all marketing SEO is
 * owned by the Astro project at betsplug.com, which ships its own
 * /sitemap.xml. This Next.js app only serves the authenticated
 * dashboard surface, so its sitemap is intentionally empty —
 * combined with the project-wide Disallow: / in robots.ts, the
 * dashboard host is fully invisible to crawlers.
 *
 * Returning a valid but empty <urlset> rather than a 404 makes it
 * explicit to search engines that we know the file exists and
 * deliberately ship nothing.
 */

export const revalidate = 3600;

export function GET(): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
