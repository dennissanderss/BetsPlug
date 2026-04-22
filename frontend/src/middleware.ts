import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  locales,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { parseLocalizedPath } from "@/i18n/routes";

/**
 * EN-indexable + server-rendered translated UI (2026-04-23)
 * ────────────────────────────────────────────────────────────
 * After the Google Translate widget proved unreliable (Google
 * rate-limits the widget script with a "/sorry" captcha after a
 * few reloads, and React re-renders clobber its DOM mutations),
 * translation moved back to SSR per-locale. To avoid duplicate
 * content, the locale-prefixed URLs are tagged noindex instead
 * of being served as separate indexable pages:
 *
 *   1. `/en/...`  → 308 redirect to the canonical unprefixed URL
 *      (the default locale must only exist in one shape).
 *   2. `/nl/...`, `/de/...`, `/fr/...`, `/es/...`, `/it/...`,
 *      `/sw/...`, `/id/...` → internal rewrite to the canonical
 *      EN path so the Next.js page file resolves, plus
 *      `x-locale` header + cookie so SSR renders in the
 *      visitor's language, plus `X-Robots-Tag: noindex, nofollow`
 *      so Google never indexes the translated URL.
 *   3. Bare translated slugs (e.g. `/voorspellingen`, `/prognosen`
 *      without a locale prefix) → 308 to the canonical EN path.
 *   4. Canonical EN paths → serve as-is, `x-locale` pinned to EN.
 *
 * Canonical tags in <head> always point to the EN URL (see
 * `lib/seo-helpers.ts`), no hreflang is emitted, and the sitemap
 * lists only EN URLs — so Google sees a single clean English
 * surface and the localized URLs exist purely for visitors.
 *
 * Non-canonical hosts (*.vercel.app preview deploys) still get
 * blanket noindex on every path.
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

function setLocaleCookie(res: NextResponse, locale: Locale) {
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  res.headers.set("Content-Language", locale);
}

function withLocaleHeader(req: NextRequest, locale: Locale): Headers {
  const h = new Headers(req.headers);
  h.set("x-locale", locale);
  return h;
}

function markNoindex(res: NextResponse): NextResponse {
  const existing = res.headers.get("X-Robots-Tag");
  if (!existing || !existing.includes("noindex")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
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

  // ── /en/... → 308 redirect to canonical unprefixed URL ─────
  if (hasLocalePrefix && firstSegment === defaultLocale) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    url.search = search;
    return applyIndexability(NextResponse.redirect(url, 308), host);
  }

  // ── /nl/, /de/, /fr/, /es/, /it/, /sw/, /id/ prefix ────────
  if (hasLocalePrefix) {
    const parsed = parseLocalizedPath(pathname, firstSegment as Locale);
    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    url.search = search;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, parsed.locale) },
    });
    setLocaleCookie(res, parsed.locale);
    markNoindex(res);
    return applyIndexability(res, host);
  }

  // ── Bare translated slug without prefix → 308 to canonical ─
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

  // ── Canonical EN path — serve as-is, pin x-locale to EN ────
  const res = NextResponse.next({
    request: { headers: withLocaleHeader(req, defaultLocale) },
  });
  res.headers.set("Content-Language", defaultLocale);
  return applyIndexability(res, host);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

export { locales };
