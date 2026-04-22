import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, isLocale, type Locale } from "@/i18n/config";
import { parseLocalizedPath } from "@/i18n/routes";

/**
 * EN-only middleware (SEO-stability rollback 2026-04-22)
 * ────────────────────────────────────────────────────────────
 * Prior versions did full i18n routing: incoming /nl/, /de/ … URLs
 * were rewritten internally and the site served translated SSR
 * content per locale. That setup caused brand-term visibility to
 * collapse in Google (duplicate content, hreflang conflicts,
 * cross-locale link graph pollution).
 *
 * This middleware collapses everything to English:
 *   1. Any request with a locale prefix (/nl/…, /de/…, /fr/…, …)
 *      308-redirects to the canonical EN path with the prefix
 *      stripped.
 *   2. Any non-prefixed request whose first segment is a localized
 *      translation slug (e.g. /voorspellingen, /prognosen) also
 *      308-redirects to the canonical EN slug (/predictions).
 *   3. Every surviving request is served with x-locale=en so SSR
 *      renders the English copy exclusively.
 *   4. Non-canonical hosts (*.vercel.app preview deploys) keep the
 *      X-Robots-Tag: noindex, nofollow header.
 *
 * No locale cookie is set. No Accept-Language detection. Client-side
 * translation (if re-introduced later) runs in the browser and is
 * invisible to crawlers.
 */

const PUBLIC_FILE = /\.(.*)$/;
const CANONICAL_HOST = "betsplug.com";

function applyIndexability(res: NextResponse, host: string | null): NextResponse {
  if (!host) return res;
  const bare = host.split(":")[0].toLowerCase();
  if (bare === CANONICAL_HOST || bare === `www.${CANONICAL_HOST}`) {
    return res;
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function withEnHeader(req: NextRequest): Headers {
  const h = new Headers(req.headers);
  h.set("x-locale", defaultLocale);
  return h;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/studio") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return applyIndexability(NextResponse.next(), host);
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const hasLocalePrefix = isLocale(firstSegment);

  // ── /xx/ prefix → 308 to canonical EN path ───────────────────
  if (hasLocalePrefix) {
    const parsed = parseLocalizedPath(pathname, firstSegment as Locale);
    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    url.search = search;
    return applyIndexability(NextResponse.redirect(url, 308), host);
  }

  // ── Non-prefixed localized slug → 308 to canonical ───────────
  // Catches bare /voorspellingen, /prognosen, /predictions-match,
  // etc. Any slug that only appears in a non-EN locale's reverse
  // map redirects to the EN canonical. `parseLocalizedPath` scans
  // one locale at a time, so loop until a hit.
  for (const l of locales) {
    if (l === defaultLocale) continue;
    const parsed = parseLocalizedPath(pathname, l);
    if (parsed.canonical !== pathname) {
      const url = req.nextUrl.clone();
      url.pathname = parsed.canonical;
      url.search = search;
      return applyIndexability(NextResponse.redirect(url, 308), host);
    }
  }

  // ── Canonical path — serve as-is ─────────────────────────────
  const res = NextResponse.next({
    request: { headers: withEnHeader(req) },
  });
  res.headers.set("Content-Language", defaultLocale);
  return applyIndexability(res, host);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

export { locales };
