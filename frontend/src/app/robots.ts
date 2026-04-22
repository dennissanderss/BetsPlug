import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt — served at /robots.txt (EN-only, 2026-04-22)
 * ────────────────────────────────────────────────────────────
 * Allows crawlers on the English canonical only. Every /xx/ locale
 * prefix is disallowed as a belt-and-suspenders to the 308 redirect
 * in middleware — some crawlers (notably AI bots that cache
 * aggressively) still re-fetch old hreflang targets for weeks after
 * they disappear.
 */

const SITE_URL = "https://betsplug.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Locale-prefixed URLs — always 308-redirect to canonical EN,
          // but tell crawlers not to even attempt them.
          "/nl/",
          "/de/",
          "/fr/",
          "/es/",
          "/it/",
          "/sw/",
          "/id/",

          // API & admin
          "/api/",
          "/admin/",

          // Sanity Studio — CMS editing interface, no SEO value
          "/studio",
          "/studio/",

          // Authenticated app shell
          "/dashboard/",

          // Account / subscription / favorites (authenticated)
          "/myaccount",
          "/subscription",
          "/favorites",

          // Authenticated in-app routes that duplicate public canonicals.
          // `$` pins an exact match so siblings like `/about-us` remain
          // crawlable (disallow `/about` would otherwise swallow them).
          "/about$",
          "/predictions/",
          "/trackrecord",

          // Funnel / conversion pages (no organic search value)
          "/checkout",
          "/login",
          "/welcome",

          // Private reports, live data & internal feeds
          "/reports/",
          "/weekly-report/",
          "/search",
          "/results/",
          "/deals/",
          "/strategy/",
          "/matches/",
          "/teams/",
          "/bet-of-the-day/",
          "/jouw-route/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
