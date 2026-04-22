import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, isLocale, type Locale } from "@/i18n/config";
import { parseLocalizedPath } from "@/i18n/routes";

/**
 * EN-only middleware (2026-04-22)
 * ────────────────────────────────────────────────────────────
 * Server-rendered output is English across every URL. Visitor-
 * facing translation is handled in the browser via the Google
 * Translate widget (see `layout.tsx`) — the language switcher
 * sets the `googtrans` cookie and reloads, Google Translate
 * rewrites the DOM. No URL changes, no SSR translation, no
 * hreflang, no duplicate content.
 *
 *   1. /xx/... prefixes → 308 to canonical EN path
 *   2. Bare translated slugs (e.g. /voorspellingen) → 308 to EN
 *   3. Canonical EN path → served as-is with x-locale=en
 *   4. Non-canonical host (vercel.app previews) → noindex header
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

  if (hasLocalePrefix) {
    const parsed = parseLocalizedPath(pathname, firstSegment as Locale);
    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    url.search = search;
    return applyIndexability(NextResponse.redirect(url, 308), host);
  }

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
