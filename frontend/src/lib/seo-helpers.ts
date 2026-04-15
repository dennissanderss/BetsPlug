/**
 * SEO helper utilities
 * ────────────────────────────────────────────────────────────
 * Shared helpers for building locale-aware canonical URLs,
 * hreflang alternates and translated page metadata across
 * every page in the app.
 *
 * The middleware always sets the NEXT_LOCALE cookie before the
 * page renders, so reading the cookie is the reliable way to
 * determine the active locale during SSR / generateMetadata().
 */

import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  isLocale,
  defaultLocale,
  locales,
  localeMeta,
  type Locale,
} from "@/i18n/config";
import { localizePath } from "@/i18n/routes";
import { translate } from "@/i18n/messages";
import { formatMsg } from "@/i18n/format";
import { POTD_STATS } from "@/data/potd-stats";

const SITE_URL = "https://betsplug.com";

/* ── Locale detection ───────────────────────────────────────── */

/** Read the active locale from the NEXT_LOCALE cookie. */
export function getServerLocale(): Locale {
  const cookieStore = cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : defaultLocale;
}

/* ── Canonical URL ──────────────────────────────────────────── */

/**
 * Build the full canonical URL for a page, localised for the
 * current user's locale.
 *
 * @param canonicalPath  The canonical (English) path, e.g. "/articles"
 * @returns              Absolute URL, e.g. "https://betsplug.com/nl/artikelen"
 */
export function getCanonicalUrl(canonicalPath: string): string {
  const locale = getServerLocale();
  const localised = localizePath(canonicalPath, locale);
  return `${SITE_URL}${localised === "/" ? "" : localised}`;
}

/* ── hreflang alternates ────────────────────────────────────── */

/**
 * Build the alternates.languages map for a given canonical path.
 * Emits one entry per locale (keyed by its BCP-47 hreflang tag)
 * plus x-default pointing to the English URL.
 */
export function getLocalizedAlternates(canonicalPath: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const locale = getServerLocale();
  const localised = localizePath(canonicalPath, locale);
  const canonical = `${SITE_URL}${localised === "/" ? "" : localised}`;

  const languages: Record<string, string> = {};
  for (const l of locales) {
    const tag = localeMeta[l].hreflang;
    const path = localizePath(canonicalPath, l);
    languages[tag] = `${SITE_URL}${path === "/" ? "" : path}`;
  }
  languages["x-default"] = `${SITE_URL}${localizePath(canonicalPath, defaultLocale) === "/" ? "" : localizePath(canonicalPath, defaultLocale)}`;

  return { canonical, languages };
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
 * Build locale-aware breadcrumbs with translated names and
 * localized hrefs.
 *
 * @param items Array of { labelKey, canonicalPath } pairs
 * @returns BreadcrumbItem[] with translated name + localized href
 */
export function getLocalizedBreadcrumbs(
  items: { labelKey: string; canonicalPath: string }[]
) {
  const locale = getServerLocale();
  return items.map(({ labelKey, canonicalPath }) => ({
    name: translate(locale, labelKey as any),
    href:
      canonicalPath === "/"
        ? `${SITE_URL}/`
        : `${SITE_URL}${localizePath(canonicalPath, locale)}`,
  }));
}
