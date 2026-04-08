import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  locales,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/i18n/config";

/**
 * i18n middleware
 * ────────────────────────────────────────────────────────────
 * - If URL starts with a locale prefix (/nl, /de …) we strip it
 *   via `rewrite` so that the existing App Router pages still
 *   match, and we set a cookie so the client can read the
 *   active locale during hydration.
 * - If no prefix is present we pick the locale from (in order):
 *     1. existing NEXT_LOCALE cookie
 *     2. Accept-Language header
 *     3. default locale (en)
 *   and keep serving the root path (no redirect) — this keeps
 *   `/` as the canonical English URL.
 */

const PUBLIC_FILE = /\.(.*)$/;

function pickFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const parts = header
    .split(",")
    .map((p) => p.trim().split(";")[0].toLowerCase());
  for (const raw of parts) {
    const primary = raw.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals, API routes and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // ── Case 1: URL has an explicit locale prefix ────────────
  if (isLocale(first)) {
    // /en is treated the same as /, we redirect it away so we
    // don't duplicate content.
    if (first === defaultLocale) {
      const url = req.nextUrl.clone();
      url.pathname = "/" + segments.slice(1).join("/");
      return NextResponse.redirect(url);
    }

    // Rewrite /nl/foo → /foo (internal) so pages still match
    const url = req.nextUrl.clone();
    url.pathname = "/" + segments.slice(1).join("/");
    const res = NextResponse.rewrite(url);
    res.cookies.set(LOCALE_COOKIE, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    // Content-Language header also helps search engines
    res.headers.set("Content-Language", first);
    return res;
  }

  // ── Case 2: no prefix → infer locale, stay on current URL ─
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  const headerLocale = pickFromAcceptLanguage(req.headers.get("accept-language"));
  const inferred: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : headerLocale ?? defaultLocale;

  const res = NextResponse.next();
  if (!cookieLocale || cookieLocale !== inferred) {
    res.cookies.set(LOCALE_COOKIE, inferred, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  res.headers.set("Content-Language", inferred);
  return res;
}

export const config = {
  // Match everything except Next internals and static assets
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

// Re-export for tests / docs
export { locales };
