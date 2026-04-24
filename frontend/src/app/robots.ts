import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt — served at /robots.txt (2026-04-24)
 * ────────────────────────────────────────────────────────────
 * Allows crawling across the public surface in ALL 16 locales.
 * Each /xx/ URL is now indexable (Phase 4 Nerdytips rollout)
 * with a self-canonical + hreflang cluster in <head>, so Google
 * is welcome to crawl and rank them as per-locale siblings.
 *
 * Only authed / funnel / private API paths are disallowed.
 */

const SITE_URL = "https://betsplug.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
