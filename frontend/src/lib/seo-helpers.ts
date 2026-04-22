/**
 * SEO helper utilities (EN-only — 2026-04-22)
 * ────────────────────────────────────────────────────────────
 * Every server render is English. Visitor-facing translation
 * runs in the browser via the Google Translate widget (see
 * `layout.tsx`), so the SSR output Google crawls stays pristine
 * EN with a single canonical per URL.
 */

import { defaultLocale, type Locale } from "@/i18n/config";
import { translate } from "@/i18n/messages";
import { formatMsg } from "@/i18n/format";
import { POTD_STATS } from "@/data/potd-stats";

const SITE_URL = "https://betsplug.com";

/* ── Locale detection ───────────────────────────────────────── */

/**
 * Always returns the default (English) locale — SSR is EN-only.
 * Client-side translation is handled by Google Translate (widget
 * reads the `googtrans` cookie, transforms the DOM post-hydration).
 */
export function getServerLocale(): Locale {
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
