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
 * Build a locale-aware FAQ items array from translation keys.
 * Each entry in `keys` is { q: "faq.home.q1", a: "faq.home.a1" }.
 */
export function getLocalizedFaq(keys: FaqKeySet) {
  const locale = getServerLocale();
  return keys.map(({ q, a }) => ({
    question: translate(locale, q as any),
    answer: translate(locale, a as any),
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
