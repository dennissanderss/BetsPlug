import type { MetadataRoute } from "next";

/**
 * robots.txt for the Next.js project (app.betsplug.com).
 * ────────────────────────────────────────────────────────────
 * After the marketing/app split (2026-05-01) this Next.js project
 * only serves the authenticated dashboard at app.betsplug.com.
 * Marketing SEO is owned by the Astro project at betsplug.com,
 * which ships its own /robots.txt and /sitemap.xml.
 *
 * Therefore we tell crawlers to stay out of everything here:
 * Disallow: /. Saves crawl budget, prevents the dashboard surface
 * from appearing in SERPs as duplicate content of betsplug.com.
 */

const SITE_URL = "https://betsplug.com";

// Authed / funnel / no-organic-value paths. Each is emitted twice:
// once at the root (canonical EN) and once with a `*/` wildcard so
// `/de/dashboard/`, `/ru/myaccount` etc. are also blocked.
const PRIVATE_PATHS = [
  "/api/",
  "/admin/",
  "/studio",
  "/studio/",
  "/dashboard/",
  "/myaccount",
  "/subscription",
  "/favorites",
  "/about$",
  "/predictions/",
  "/trackrecord",
  "/checkout",
  "/login",
  "/welcome",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/thank-you",
  "/verify-email",
  "/reports/",
  "/weekly-report/",
  "/search",
  "/results/",
  "/deals/",
  "/strategy/",
  "/matches/",
  "/teams/",
  "/jouw-route/",
  "/your-route/",
];

function withLocaleWildcards(paths: string[]): string[] {
  const out: string[] = [];
  for (const p of paths) {
    out.push(p);
    // `*` wildcards in robots.txt are supported by Google + Bing.
    // `*/foo` blocks /xx/foo for any single segment xx, which is
    // exactly the locale-prefix shape.
    if (!p.endsWith("$")) out.push(`*${p}`);
  }
  return out;
}

export default function robots(): MetadataRoute.Robots {
  // Block crawlers from the entire app.betsplug.com surface — the
  // marketing project at betsplug.com is the canonical SEO target.
  // The PRIVATE_PATHS list above is kept for archival reasons and
  // in case this app ever serves public content again.
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}
