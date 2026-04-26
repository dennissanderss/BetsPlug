/**
 * i18n configuration
 * ────────────────────────────────────────────────────────────
 * Single source of truth for supported locales. Used by the
 * middleware (to match /nl, /de, … URL prefixes), by the root
 * layout (to emit hreflang alternates) and by the client-side
 * locale provider.
 *
 * Top-16 locales targeting the high-value football-betting
 * markets: Western Europe (en/nl/de/fr/es/it/pt), Southern/
 * Eastern Europe (el/tr/pl/ro/ru), Nordic (da/sv), and
 * Asia/Africa keepers (sw/id) — with English as canonical.
 *
 * Deliberately NOT included: ar/zh/ja/ko/th/vi and other Asian
 * scripts. Those need RTL layout + non-Latin font pipelines that
 * are out of scope for Phase 1. Revisit in Phase 2+ once the
 * top-16 rollout is stable.
 */

export const locales = [
  // Current (Phase 1 baseline)
  "en",
  "nl",
  "de",
  "fr",
  "es",
  "it",
  "sw",
  "id",
  // New in Phase 2 — top football-betting markets
  "pt", // Portuguese (Portugal + Brazil)
  "tr", // Turkish
  "pl", // Polish
  "ro", // Romanian
  "ru", // Russian
  "el", // Greek
  "da", // Danish
  "sv", // Swedish
] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * Locales that are indexable by search engines.
 * ────────────────────────────────────────────────────────────
 * After the 2026-04-26 SEO recovery, only the 6 locales whose
 * URL slugs are translated AND whose UI dictionary + Sanity
 * content are at parity with EN are indexable. The remaining 10
 * are reachable for users (cookie + URL) but tagged
 * `X-Robots-Tag: noindex, follow` by middleware, removed from
 * sitemap and removed from the hreflang cluster.
 *
 * Re-activation criteria per parked locale (see
 * seo-audit/09-handoff.md):
 *   1. URL slugs translated in src/i18n/routes.ts
 *   2. PAGE_META block hand-translated (no copy-paste of EN)
 *   3. Hardcoded EN strings in homepage/footer/pricing routed
 *      through t()
 *   4. Sanity content for homepage + 5 league hubs + 4 bet-type
 *      hubs hand-translated (DeepL fallback NOT enough)
 *
 * After all four are green for a locale, add it to
 * INDEXABLE_LOCALES below and re-deploy.
 */
export const INDEXABLE_LOCALES: readonly Locale[] = [
  "en",
  "nl",
  "de",
  "fr",
  "es",
  "it",
] as const;

export function isIndexableLocale(locale: Locale): boolean {
  return (INDEXABLE_LOCALES as readonly Locale[]).includes(locale);
}

/**
 * Locales that are user-selectable in the language switcher.
 * ────────────────────────────────────────────────────────────
 * Set per the 2026-04-27 i18n overhaul. Only the 6 locales for
 * which we hand-translate hardcoded strings + maintain meta-tag
 * parity are surfaced to users. The other 10 stay in `locales`
 * (so their .ts files keep loading and parked URLs keep working
 * for direct visits) but are hidden from the switcher.
 *
 * Promotion criteria (a parked locale graduates to ENABLED when
 * each is green — see docs/i18n.md):
 *   1. URL slugs translated in src/i18n/routes.ts
 *   2. PAGE_META block hand-translated for the locale (no EN
 *      copy-paste, no DeepL fallback)
 *   3. Hardcoded EN strings in homepage/footer/pricing/predictions
 *      routed through t() with a translation in this locale
 *   4. Sanity content for homepage + 5 league hubs + 4 bet-type
 *      hubs hand-translated
 *   5. `npm run i18n:check` passes
 */
export const ENABLED_LOCALES: readonly Locale[] = [
  "en",
  "nl",
  "de",
  "fr",
  "es",
  "it",
] as const;

export function isEnabledLocale(locale: Locale): boolean {
  return (ENABLED_LOCALES as readonly Locale[]).includes(locale);
}

/** Human-readable label + flag for each locale (used by the switcher). */
export const localeMeta: Record<
  Locale,
  { label: string; native: string; flag: string; hreflang: string }
> = {
  en: { label: "English", native: "English", flag: "🇬🇧", hreflang: "en" },
  nl: { label: "Dutch", native: "Nederlands", flag: "🇳🇱", hreflang: "nl" },
  de: { label: "German", native: "Deutsch", flag: "🇩🇪", hreflang: "de" },
  fr: { label: "French", native: "Français", flag: "🇫🇷", hreflang: "fr" },
  es: { label: "Spanish", native: "Español", flag: "🇪🇸", hreflang: "es" },
  it: { label: "Italian", native: "Italiano", flag: "🇮🇹", hreflang: "it" },
  sw: { label: "Swahili", native: "Kiswahili", flag: "🇰🇪", hreflang: "sw" },
  id: {
    label: "Indonesian",
    native: "Bahasa Indonesia",
    flag: "🇮🇩",
    hreflang: "id",
  },
  pt: { label: "Portuguese", native: "Português", flag: "🇵🇹", hreflang: "pt" },
  tr: { label: "Turkish", native: "Türkçe", flag: "🇹🇷", hreflang: "tr" },
  pl: { label: "Polish", native: "Polski", flag: "🇵🇱", hreflang: "pl" },
  ro: { label: "Romanian", native: "Română", flag: "🇷🇴", hreflang: "ro" },
  ru: { label: "Russian", native: "Русский", flag: "🇷🇺", hreflang: "ru" },
  el: { label: "Greek", native: "Ελληνικά", flag: "🇬🇷", hreflang: "el" },
  da: { label: "Danish", native: "Dansk", flag: "🇩🇰", hreflang: "da" },
  sv: { label: "Swedish", native: "Svenska", flag: "🇸🇪", hreflang: "sv" },
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
