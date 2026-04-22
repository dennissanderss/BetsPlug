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

/**
 * Block search engines on any host other than the canonical apex.
 *
 * Vercel gives every deployment a *.vercel.app URL that serves the
 * same content as the custom domain. Without a noindex gate on those
 * hosts, Google sees duplicate content and can pick the wrong
 * canonical (betsplug.com vs bets-plug.vercel.app), which delays
 * indexation on the real domain.
 *
 * The `www` subdomain is already 308-redirected to apex at the
 * Vercel edge, so it never reaches middleware. We only need to tag
 * the vercel.app + any preview-branch deploys here.
 */
const CANONICAL_HOST = "betsplug.com";

function applyIndexability(res: NextResponse, host: string | null): NextResponse {
  if (!host) return res;
  const bare = host.split(":")[0].toLowerCase();
  if (bare === CANONICAL_HOST || bare === `www.${CANONICAL_HOST}`) {
    return res;
  }
  // Every non-canonical host (preview deploys, *.vercel.app mirrors)
  // is emphatically not for Google. This header is honored by all
  // major search engines.
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Vercel normalises the `host` header to the custom domain even on *.vercel.app
  // preview URLs; `x-forwarded-host` carries the original public hostname.
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  // Skip Next internals, API routes, Sanity Studio and public files
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

  // ── Case 1: explicit locale prefix ──────────────────────────
  if (hasLocalePrefix) {
    // /en/... → redirect to canonical unprefixed URL
    if (firstSegment === defaultLocale) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/en/, "") || "/";
      return NextResponse.redirect(url);
    }

    const parsed = parseLocalizedPath(pathname, firstSegment as Locale);

    // Canonical consolidation: if the URL under a non-default locale
    // uses the English slug instead of the translated one (e.g.
    // /fr/match-predictions/premier-league instead of
    // /fr/predictions-match/premier-league), 301 redirect to the
    // translated form. Both paths resolved to the same page before
    // (because parseLocalizedPath falls back to the input segment on
    // miss), which created duplicate content that Google had to
    // de-dupe via the canonical tag alone. A permanent redirect is
    // cleaner — Googlebot consolidates the crawl budget onto the
    // intended localized URL and inbound links with the wrong slug
    // still land in the right place.
    const expectedLocalized = localizePath(parsed.canonical, parsed.locale);
    if (expectedLocalized !== pathname && expectedLocalized !== "/") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = expectedLocalized;
      redirectUrl.search = search;
      const res = NextResponse.redirect(redirectUrl, 308);
      setLocaleCookie(res, parsed.locale);
      return res;
    }

    // Rewrite /nl/voorspellingen → /predictions (internal)
    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, parsed.locale) },
    });
    setLocaleCookie(res, parsed.locale);
    return applyIndexability(res, host);
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
        return applyIndexability(res, host);
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
    return applyIndexability(res, host);
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
  return applyIndexability(res, host);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

export { locales };
