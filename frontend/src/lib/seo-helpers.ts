/**
 * SEO helper utilities (EN-indexable, translated UI — 2026-04-23)
 * ────────────────────────────────────────────────────────────
 * Every canonical URL emitted here is the English form. The
 * middleware rewrites /nl/, /de/, … URLs to the canonical path
 * AND tags the response `X-Robots-Tag: noindex`, so Google only
 * indexes the English URL space while visitors still see their
 * chosen language via SSR (not Google Translate).
 *
 * `getServerLocale()` IS locale-aware (reads the `x-locale`
 * request header set by the middleware), so SSR renders the right
 * language. Canonical URLs built via `getCanonicalUrl()` /
 * `getLocalizedAlternates()` ignore the active locale and always
 * return the English URL — that's what goes into
 * `<link rel="canonical">` and OG `url`.
 */

import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  isLocale,
  defaultLocale,
  type Locale,
} from "@/i18n/config";
import { translate } from "@/i18n/messages";
import { formatMsg } from "@/i18n/format";
import { POTD_STATS } from "@/data/potd-stats";

const SITE_URL = "https://betsplug.com";

/* ── Locale detection ───────────────────────────────────────── */

/**
 * Resolve the active locale for the current server request.
 *
 * Checks sources in order:
 *   1. `x-locale` request header — set by middleware on every
 *      rewrite so generateMetadata() sees the correct locale on
 *      the first request.
 *   2. NEXT_LOCALE cookie — for direct hits that didn't route
 *      through the /xx/ rewrite path.
 *   3. defaultLocale (English) fallback.
 *
 * The middleware pins `x-locale` to `en` on canonical URLs, so
 * visitors with a stale NL cookie who type `/match-predictions`
 * still see English (URL wins over cookie).
 */
export function getServerLocale(): Locale {
  try {
    const h = headers();
    const hdrLocale = h.get("x-locale");
    if (isLocale(hdrLocale)) return hdrLocale;
  } catch {
    // headers() throws outside a request scope.
  }
  try {
    const raw = cookies().get(LOCALE_COOKIE)?.value;
    if (isLocale(raw)) return raw;
  } catch {
    // same
  }
  return defaultLocale;
}

/* ── Canonical URL ──────────────────────────────────────────── */

/**
 * Build the absolute canonical URL for a page.
 *
 * EN-only: every page's canonical is the English URL with no locale
 * prefix. Non-EN URLs are 308-redirected by the middleware.
 *
 * @param canonicalPath  The canonical (English) path, e.g. "/articles"
 * @returns              Absolute URL, e.g. "https://betsplug.com/articles"
 */
export function getCanonicalUrl(canonicalPath: string): string {
  return `${SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;
}

/* ── hreflang alternates (disabled) ─────────────────────────── */

/**
 * Build Next.js `alternates` for a page.
 *
 * With i18n rolled back, every page has a single canonical (the EN
 * URL) and no hreflang alternates. The `languages` field is kept on
 * the return type so existing call sites that spread
 * `languages: alternates.languages` keep compiling — an empty
 * object tells Next.js to emit no `<link rel="alternate">` tags.
 *
 * @param canonicalPath the EN canonical path, e.g. "/articles"
 *                      or "/match-predictions/premier-league".
 */
export function getLocalizedAlternates(canonicalPath: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  return {
    canonical: getCanonicalUrl(canonicalPath),
    languages: {},
  };
}

/* ── Locale-aware FAQ builder ──────────────────────────────── */

type FaqKeySet = { q: string; a: string }[];

/**
 * Per-locale narrative numbers for SSR placeholder substitution.
 * Uses the comma decimal for NL/DE/FR/ES/IT and point for everything
 * else. These feed `formatMsg()` where FAQ strings contain
 * `{potdAccuracy}` / `{potdPicks}` tokens — keeps JSON-LD markup
 * crawler-friendly with real numbers instead of raw templates.
 */
const POTD_VARS_BY_LOCALE: Record<Locale, { potdAccuracy: string; potdPicks: string }> = {
  en: { potdAccuracy: POTD_STATS.accuracy, potdPicks: POTD_STATS.totalPicks },
  nl: { potdAccuracy: POTD_STATS.accuracyNL, potdPicks: POTD_STATS.totalPicks },
  de: { potdAccuracy: POTD_STATS.accuracyNL, potdPicks: POTD_STATS.totalPicks },
  fr: { potdAccuracy: POTD_STATS.accuracyNL, potdPicks: POTD_STATS.totalPicks },
  es: { potdAccuracy: POTD_STATS.accuracyNL, potdPicks: POTD_STATS.totalPicks },
  it: { potdAccuracy: POTD_STATS.accuracyNL, potdPicks: POTD_STATS.totalPicks },
  sw: { potdAccuracy: POTD_STATS.accuracy, potdPicks: POTD_STATS.totalPicks },
  id: { potdAccuracy: POTD_STATS.accuracyNL, potdPicks: POTD_STATS.totalPicks },
};

/**
 * Build a locale-aware FAQ items array from translation keys.
 * Each entry in `keys` is { q: "faq.home.q1", a: "faq.home.a1" }.
 * Applies `{potdAccuracy}` / `{potdPicks}` placeholder substitution
 * using the static `POTD_STATS` snapshot so JSON-LD ships real
 * numbers to crawlers without a client fetch.
 */
export function getLocalizedFaq(keys: FaqKeySet) {
  const locale = getServerLocale();
  const vars = POTD_VARS_BY_LOCALE[locale];
  return keys.map(({ q, a }) => ({
    question: formatMsg(translate(locale, q as any), vars),
    answer: formatMsg(translate(locale, a as any), vars),
  }));
}

/* ── Locale-aware breadcrumb builder ───────────────────────── */

/**
 * Build EN breadcrumbs with translated names and absolute hrefs.
 *
 * @param items Array of { labelKey, canonicalPath } pairs
 * @returns BreadcrumbItem[] with EN name + absolute EN href
 */
export function getLocalizedBreadcrumbs(
  items: { labelKey: string; canonicalPath: string }[]
) {
  return items.map(({ labelKey, canonicalPath }) => ({
    name: translate(defaultLocale, labelKey as any),
    href:
      canonicalPath === "/"
        ? `${SITE_URL}/`
        : `${SITE_URL}${canonicalPath}`,
  }));
}
