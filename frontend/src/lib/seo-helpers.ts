/**
 * SEO helper utilities (16-locale Nerdytips pattern — 2026-04-24)
 * ────────────────────────────────────────────────────────────
 * Phase 4: every locale URL is indexable with its own
 * self-canonical + a full hreflang cluster (17 tags = x-default +
 * 16 locales). `getServerLocale()` reads the `x-locale` header set
 * by middleware so SSR renders the right language; canonical
 * + alternates are built off that locale.
 */

import { cookies, headers } from "next/headers";
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
 * Build the absolute canonical URL for a page in the ACTIVE
 * locale — Nerdytips pattern. Each locale URL is its own
 * indexable entity with a self-canonical, so `/de/…` canonicals
 * to itself, NOT the EN URL.
 *
 * @param canonicalPath  The canonical (English) path, e.g. "/articles"
 * @returns              Absolute URL in the active locale, e.g.
 *                       "https://betsplug.com/de/spiel-vorhersagen"
 */
export function getCanonicalUrl(canonicalPath: string): string {
  const locale = getServerLocale();
  return buildAbsoluteUrl(canonicalPath, locale);
}

function buildAbsoluteUrl(canonicalPath: string, locale: Locale): string {
  const localised = localizePath(canonicalPath, locale);
  return `${SITE_URL}${localised === "/" ? "" : localised}`;
}

/* ── hreflang alternates ────────────────────────────────────── */

/**
 * Build Next.js `alternates` for a page with self-canonical and
 * a full hreflang cluster across all 16 locales + `x-default`.
 *
 * Consumers pass the CANONICAL (English) path — we build the
 * localized URL for every locale via the `routeTable` + emit them
 * in the `languages` map keyed by BCP-47 tag. The self-canonical
 * points at the ACTIVE locale's URL.
 *
 * @param canonicalPath the EN canonical path, e.g. "/articles"
 *                      or "/match-predictions/premier-league".
 */
export function getLocalizedAlternates(canonicalPath: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const locale = getServerLocale();
  const canonical = buildAbsoluteUrl(canonicalPath, locale);

  const languages: Record<string, string> = {};
  for (const l of locales) {
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
