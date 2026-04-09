import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt — served at /robots.txt
 * ────────────────────────────────────────────────────────────
 * Allows all crawlers on public pages. Blocks authenticated
 * app routes, the API surface and funnel pages that should not
 * be indexed. Points crawlers to the dynamic sitemap.
 */

const SITE_URL = "https://betsplug.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/settings/",
          "/checkout",
          "/login",
          "/welcome",
          "/reports/",
          "/weekly-report/",
          "/search",
          "/live/",
          "/results/",
          "/deals/",
          "/strategy/",
          "/matches/",
          "/teams/",
          "/bet-of-the-day/",
          "/jouw-route/",
          // Localized variants of the same private areas
          "/*/admin/",
          "/*/dashboard/",
          "/*/settings/",
          "/*/afrekenen",
          "/*/kasse",
          "/*/paiement",
          "/*/pago",
          "/*/malipo",
          "/*/pembayaran",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
