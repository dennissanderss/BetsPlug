import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt — served at /robots.txt (2026-04-26 recovery)
 * ────────────────────────────────────────────────────────────
 * Indexability decisions:
 *   - 6 locale prefixes (en/nl/de/fr/es/it via root + /nl, /de, /fr,
 *     /es, /it) get full crawl access. EN sits unprefixed.
 *   - 10 parked locale prefixes get `noindex, follow` via the
 *     X-Robots-Tag header set in middleware. We do NOT block them
 *     here in robots.txt — Google needs to crawl the response to
 *     see the noindex header.
 *   - Authed / funnel paths are disallowed across ALL locale
 *     prefixes via `*` wildcards so a stray `/de/dashboard/` or
 *     `/ru/myaccount` is not crawled either.
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
  "/bet-of-the-day/",
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
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: withLocaleWildcards(PRIVATE_PATHS),
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
