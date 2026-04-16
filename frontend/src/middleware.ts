import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  locales,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { localizePath, parseLocalizedPath } from "@/i18n/routes";

/**
 * i18n middleware with translated slugs
 * ────────────────────────────────────────────────────────────
 * - Incoming requests with a locale prefix (/nl, /de …) are
 *   parsed: the first segment after the locale is translated
 *   back to its canonical English slug (e.g. "voorspellingen"
 *   → "predictions") and the request is internally rewritten
 *   so the existing Next.js pages match.
 * - Incoming requests without a locale prefix are either
 *   served as-is (default locale) or redirected to the
 *   localized URL if the visitor has a NEXT_LOCALE cookie for
 *   a non-default locale or the Accept-Language header picks
 *   one.
 * - /en/... URLs are permanently redirected to the canonical
 *   unprefixed version to avoid duplicate content.
 */

const PUBLIC_FILE = /\.(.*)$/;

function pickFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  for (const raw of header.split(",")) {
    const primary = raw.trim().split(";")[0].split("-")[0].toLowerCase();
    if (isLocale(primary)) return primary;
  }
  return null;
}

function setLocaleCookie(res: NextResponse, locale: Locale) {
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  res.headers.set("Content-Language", locale);
}

/**
 * Build a Headers object for an internal rewrite that carries the
 * resolved locale as `x-locale`. Server-side code (generateMetadata,
 * getServerLocale) reads this header so the correct locale is used
 * on the very first request — cookies only land on the browser AFTER
 * render, which is why Googlebot was seeing English metadata on /de.
 */
function withLocaleHeader(req: NextRequest, locale: Locale): Headers {
  const h = new Headers(req.headers);
  h.set("x-locale", locale);
  return h;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip Next internals, API routes, Sanity Studio and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/studio") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const hasLocalePrefix = isLocale(firstSegment);

  // ── Case 1: explicit locale prefix ──────────────────────────
  if (hasLocalePrefix) {
    // /en/... → redirect to canonical unprefixed URL
    if (firstSegment === defaultLocale) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/en/, "") || "/";
      return NextResponse.redirect(url);
    }

    const parsed = parseLocalizedPath(pathname, firstSegment as Locale);

    // Rewrite /nl/voorspellingen → /predictions (internal)
    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, parsed.locale) },
    });
    setLocaleCookie(res, parsed.locale);
    return res;
  }

  // ── Case 2: no locale prefix ────────────────────────────────
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  const headerLocale = pickFromAcceptLanguage(req.headers.get("accept-language"));
  const preferred: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : headerLocale ?? defaultLocale;

  // Canonicalize the unprefixed path first. English slugs may
  // differ from the filesystem path (e.g. /your-route → /jouw-route).
  const parsed = parseLocalizedPath(pathname, defaultLocale);

  // If the visitor prefers a non-default locale, redirect them
  // to the localized URL so they see translated slugs + content.
  if (preferred !== defaultLocale) {
    // Only redirect if this is a GET navigation to an HTML doc.
    const accept = req.headers.get("accept") ?? "";
    if (req.method === "GET" && accept.includes("text/html")) {
      const localizedPath = localizePath(parsed.canonical, preferred);
      if (localizedPath !== pathname) {
        const url = req.nextUrl.clone();
        url.pathname = localizedPath;
        url.search = search;
        const res = NextResponse.redirect(url);
        setLocaleCookie(res, preferred);
        return res;
      }
    }
  }

  // Default locale — if the English slug differs from the canonical
  // filesystem path, rewrite internally so Next.js finds the page.
  // (e.g. /your-route → /jouw-route where the page file lives)
  if (parsed.canonical !== pathname) {
    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, defaultLocale) },
    });
    setLocaleCookie(res, defaultLocale);
    return res;
  }

  // Path already matches filesystem — serve as-is, just refresh cookie.
  // Also attach x-locale header so SSR sees the right language even
  // before the cookie has propagated.
  const res = NextResponse.next({
    request: { headers: withLocaleHeader(req, preferred) },
  });
  if (!cookieLocale || cookieLocale !== preferred) {
    setLocaleCookie(res, preferred);
  } else {
    res.headers.set("Content-Language", preferred);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

export { locales };
