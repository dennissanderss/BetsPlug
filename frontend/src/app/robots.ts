import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt — served at /robots.txt (2026-04-23)
 * ────────────────────────────────────────────────────────────
 * Allows crawling across the public surface. /xx/ locale URLs
 * are intentionally NOT disallowed here: they serve translated
 * UI to visitors but return `X-Robots-Tag: noindex, nofollow`
 * (see middleware.ts). If we disallow them in robots.txt Google
 * can't fetch them and can't see the noindex header, which would
 * leave stale /xx/ URLs in the index. Allow + noindex is the
 * spec-recommended way to remove a set of URLs.
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
