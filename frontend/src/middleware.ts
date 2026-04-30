import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  locales,
  LOCALE_COOKIE,
  isLocale,
  isIndexableLocale,
  type Locale,
} from "@/i18n/config";
import { parseLocalizedPath } from "@/i18n/routes";

/**
 * 6-locale indexable routing (recovery — 2026-04-26)
 * ────────────────────────────────────────────────────────────
 * After the brand-term ranking collapse following the 16-locale
 * "indexable everywhere" experiment, only 6 locales (en, nl, de,
 * fr, es, it) are now indexable — they have translated URL slugs,
 * hand-authored PAGE_META, hand-translated Sanity content and a
 * UI dictionary at ≥95% unique-translation coverage.
 *
 * The 10 parked locales (sw, id, pt, tr, pl, ro, ru, el, da, sv)
 * keep working for visitors but Google sees them as `noindex,
 * follow`. They will be re-activated one by one once their
 * content reaches parity (criteria documented in
 * src/i18n/config.ts INDEXABLE_LOCALES + seo-audit/09-handoff.md).
 *
 * Routing rules:
 *   1. `/en/...`  → 308 → canonical unprefixed URL.
 *   2. `/<indexable>/...` (nl/de/fr/es/it) → internal rewrite to
 *      the canonical EN path with `x-locale` header — INDEXABLE.
 *   3. `/<parked>/...` (sw/id/pt/tr/pl/ro/ru/el/da/sv) → same
 *      rewrite, but response gets `X-Robots-Tag: noindex, follow`
 *      so Google drops the URL from its index while still
 *      following internal links to discover new pages.
 *   4. Bare translated slugs (e.g. `/voorspellingen`) → 308 to
 *      canonical EN path.
 *   5. Canonical EN paths → serve as-is, `x-locale` pinned to EN.
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

function applyParkedLocaleNoindex(res: NextResponse, locale: Locale): NextResponse {
  // `noindex, follow` so Google drops the parked-locale URL from its
  // index but still crawls outbound links for graph discovery. Once
  // a locale becomes indexable (added to INDEXABLE_LOCALES in
  // src/i18n/config.ts) this header simply stops being set.
  if (!isIndexableLocale(locale)) {
    res.headers.set("X-Robots-Tag", "noindex, follow");
  }
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


// Routes that have been migrated to the static `app/[locale]/...`
// segment. For these, middleware does NOT rewrite to a canonical EN
// path — instead it lets Next.js handle `/<locale>/<path>` directly
// so the pre-rendered static HTML is served. As more routes get
// migrated, add their canonical EN pathnames here.
//
// IMPORTANT: each entry must match the EN canonical that
// `parseLocalizedPath()` returns for that route family.
const STATIC_LOCALE_ROUTES: ReadonlySet<string> = new Set([
  "/", // homepage — every locale is statically pre-rendered at /[locale]/page
  "/learn", // pillar hub index
]);

const STATIC_LOCALE_ROUTE_PREFIXES: ReadonlyArray<string> = [
  "/learn/", // /learn/[slug] — pre-rendered for every (locale × pillar slug)
];

function isStaticLocaleRoute(canonicalPath: string): boolean {
  if (STATIC_LOCALE_ROUTES.has(canonicalPath)) return true;
  return STATIC_LOCALE_ROUTE_PREFIXES.some((p) => canonicalPath.startsWith(p));
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

  // ── /  →  internal rewrite to /en  ─────────────────────────
  // The bare canonical homepage URL stays "/" in the address bar
  // but the response comes from the statically pre-rendered
  // `app/[locale]/page.tsx` with locale=en. This is what unlocks
  // CDN caching for the EN homepage.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    url.search = search;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, defaultLocale) },
    });
    res.headers.set("Content-Language", defaultLocale);
    return applyIndexability(res, host);
  }

  // ── /<canonical-en-route> → /en/<canonical-en-route> ───────
  // For migrated routes accessed bare (no locale prefix), rewrite
  // internally to the EN-prefixed [locale] static path so the
  // address bar stays canonical and the response is statically
  // cached. Same trick as "/" → "/en" but for the migrated routes.
  if (!hasLocalePrefix && isStaticLocaleRoute(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    url.search = search;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, defaultLocale) },
    });
    res.headers.set("Content-Language", defaultLocale);
    return applyIndexability(res, host);
  }

  // ── /en/... → 308 redirect to canonical unprefixed URL ─────
  if (hasLocalePrefix && firstSegment === defaultLocale) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    url.search = search;
    return applyIndexability(NextResponse.redirect(url, 308), host);
  }

  // ── /xx/ prefix (15 non-default locales) ──────────────────
  // Two paths:
  //   A. The canonical-EN target is already migrated to the
  //      static [locale] segment (homepage today). DO NOT rewrite —
  //      let Next.js route the request to app/[locale]/page.tsx so
  //      the pre-rendered static HTML is served, full CDN cache.
  //   B. Otherwise: rewrite to the canonical EN path so Next.js
  //      resolves the legacy app/<route>/page.tsx file, render in
  //      the visitor's language. Indexable locales get a self-
  //      canonical + hreflang cluster; parked locales additionally
  //      get `X-Robots-Tag: noindex, follow`.
  if (hasLocalePrefix) {
    const parsed = parseLocalizedPath(pathname, firstSegment as Locale);

    if (isStaticLocaleRoute(parsed.canonical)) {
      // Migrated route. Rewrite to the locale-prefixed EN-canonical
      // path (e.g. /nl/leren → /nl/learn) so the static
      // app/[locale]/<route>/page.tsx HTML is served. URL stays in
      // the visitor's localized form for SEO.
      const targetPath = `/${parsed.locale}${parsed.canonical === "/" ? "" : parsed.canonical}`;
      if (targetPath === pathname) {
        // Already on the canonical-EN slug variant (e.g. /nl/learn).
        // Just pass through; Next.js routes directly to [locale]/...
        const res = NextResponse.next({
          request: { headers: withLocaleHeader(req, parsed.locale) },
        });
        setLocaleCookie(res, parsed.locale);
        applyParkedLocaleNoindex(res, parsed.locale);
        return applyIndexability(res, host);
      }
      const url = req.nextUrl.clone();
      url.pathname = targetPath;
      url.search = search;
      const res = NextResponse.rewrite(url, {
        request: { headers: withLocaleHeader(req, parsed.locale) },
      });
      setLocaleCookie(res, parsed.locale);
      applyParkedLocaleNoindex(res, parsed.locale);
      return applyIndexability(res, host);
    }

    const url = req.nextUrl.clone();
    url.pathname = parsed.canonical;
    url.search = search;
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleHeader(req, parsed.locale) },
    });
    setLocaleCookie(res, parsed.locale);
    applyParkedLocaleNoindex(res, parsed.locale);
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
