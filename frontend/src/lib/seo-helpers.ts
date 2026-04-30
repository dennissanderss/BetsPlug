/**
 * SEO helper utilities (6-locale recovery — 2026-04-26)
 * ────────────────────────────────────────────────────────────
 * Only the 6 INDEXABLE_LOCALES (en, nl, de, fr, es, it) get a
 * self-canonical + hreflang cluster. The 10 parked locales render
 * for visitors but are hidden from Google via `X-Robots-Tag:
 * noindex, follow` (set by middleware), are absent from the
 * sitemap, and are absent from the hreflang cluster — both as
 * source URL (no canonical/alternates emitted from a parked
 * locale) and as target URL (no hreflang pointing to them from
 * the indexable locales).
 */

import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  isLocale,
  defaultLocale,
  INDEXABLE_LOCALES,
  isIndexableLocale,
  localeMeta,
  type Locale,
} from "@/i18n/config";
import { localizePath } from "@/i18n/routes";
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
 * For INDEXABLE locales: self-canonical (e.g. `/de/spiel-vorhersagen`
 * canonicals to itself).
 * For PARKED locales: canonical points at the EN equivalent so any
 * stray index entry consolidates onto the EN URL while the parked
 * URL itself is also tagged `noindex` by middleware. Belt-and-braces.
 */
export function getCanonicalUrl(canonicalPath: string): string {
  const locale = getServerLocale();
  if (!isIndexableLocale(locale)) {
    return buildAbsoluteUrl(canonicalPath, defaultLocale);
  }
  return buildAbsoluteUrl(canonicalPath, locale);
}

function buildAbsoluteUrl(canonicalPath: string, locale: Locale): string {
  const localised = localizePath(canonicalPath, locale);
  return `${SITE_URL}${localised === "/" ? "" : localised}`;
}

/* ── hreflang alternates ────────────────────────────────────── */

/**
 * Build Next.js `alternates` for a page.
 *
 * - From an INDEXABLE locale: self-canonical + hreflang cluster
 *   for the 6 indexable locales + `x-default` → EN.
 * - From a PARKED locale: canonical → EN, NO hreflang cluster.
 *   We don't want to advertise parked URLs to Google as siblings
 *   of indexable ones, since the parked content is partial /
 *   stale. The middleware sets `X-Robots-Tag: noindex, follow`
 *   on this response so the parked URL is dropped anyway.
 *
 * @param canonicalPath the EN canonical path, e.g. "/learn"
 *                      or "/match-predictions/premier-league".
 * @param contentLocales optional whitelist of locales that have
 *                      hand-translated content for THIS page. Locales
 *                      outside this set behave like parked: canonical
 *                      → EN to consolidate duplicate-content signals,
 *                      and they're omitted from the hreflang cluster.
 *                      Use this when a page falls back to EN copy in
 *                      most locales (e.g. learn pillars only have
 *                      en+nl), so Google doesn't treat each non-
 *                      translated locale as a duplicate of the EN URL.
 */
export function getLocalizedAlternates(
  canonicalPath: string,
  contentLocales?: readonly Locale[],
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const locale = getServerLocale();
  const indexable = isIndexableLocale(locale);
  const hasTranslation =
    !contentLocales || contentLocales.includes(locale);
  const selfCanonicalAllowed = indexable && hasTranslation;

  const canonical = selfCanonicalAllowed
    ? buildAbsoluteUrl(canonicalPath, locale)
    : buildAbsoluteUrl(canonicalPath, defaultLocale);

  if (!selfCanonicalAllowed) {
    return { canonical, languages: {} };
  }

  const cluster = contentLocales
    ? INDEXABLE_LOCALES.filter((l) => contentLocales.includes(l))
    : INDEXABLE_LOCALES;

  const languages: Record<string, string> = {};
  for (const l of cluster) {
    const tag = localeMeta[l].hreflang;
    languages[tag] = buildAbsoluteUrl(canonicalPath, l);
  }
  languages["x-default"] = buildAbsoluteUrl(canonicalPath, defaultLocale);

  return { canonical, languages };
}

/* ── Locale-aware FAQ builder ──────────────────────────────── */

type FaqKeySet = { q: string; a: string }[];

/**
 * Per-locale narrative numbers for SSR placeholder substitution.
 * Uses the comma decimal for every European locale that formats
 * numbers with a comma (most continental Europe), point for Anglo-
 * style locales. These feed `formatMsg()` where FAQ strings contain
 * `{potdAccuracy}` / `{potdPicks}` tokens — keeps JSON-LD markup
 * crawler-friendly with real numbers instead of raw templates.
 */
// Locales that render decimals with a comma (fr, de, nl, es, it,
// pt, pl, ro, ru, el, da, sv, tr, id); point-style: en, sw.
const COMMA_DECIMAL_LOCALES: ReadonlySet<Locale> = new Set<Locale>([
  "nl", "de", "fr", "es", "it",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv", "id",
]);

const POTD_VARS_BY_LOCALE: Record<Locale, { potdAccuracy: string; potdPicks: string }> =
  Object.fromEntries(
    (["en","nl","de","fr","es","it","sw","id","pt","tr","pl","ro","ru","el","da","sv"] as Locale[])
      .map((l) => [
        l,
        {
          potdAccuracy: COMMA_DECIMAL_LOCALES.has(l)
            ? POTD_STATS.accuracyNL
            : POTD_STATS.accuracy,
          potdPicks: POTD_STATS.totalPicks,
        },
      ]),
  ) as Record<Locale, { potdAccuracy: string; potdPicks: string }>;

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
