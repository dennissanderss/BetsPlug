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

/** Human-readable label + flag for each locale (used by the switcher).
 *
 * `ogLocale` is the BCP-47-with-region tag that Open Graph expects
 * (e.g. `en_GB`, `nl_NL`, `de_DE`). Per-locale OG tags help Facebook,
 * LinkedIn, WhatsApp and crawlers index translated pages with the
 * correct language signal. The choice of region pair follows the
 * dominant football market for that language (e.g. `pt_PT` over
 * `pt_BR`, `es_ES` over `es_MX`). */
export const localeMeta: Record<
  Locale,
  { label: string; native: string; flag: string; hreflang: string; ogLocale: string }
> = {
  en: { label: "English", native: "English", flag: "🇬🇧", hreflang: "en", ogLocale: "en_GB" },
  nl: { label: "Dutch", native: "Nederlands", flag: "🇳🇱", hreflang: "nl", ogLocale: "nl_NL" },
  de: { label: "German", native: "Deutsch", flag: "🇩🇪", hreflang: "de", ogLocale: "de_DE" },
  fr: { label: "French", native: "Français", flag: "🇫🇷", hreflang: "fr", ogLocale: "fr_FR" },
  es: { label: "Spanish", native: "Español", flag: "🇪🇸", hreflang: "es", ogLocale: "es_ES" },
  it: { label: "Italian", native: "Italiano", flag: "🇮🇹", hreflang: "it", ogLocale: "it_IT" },
  sw: { label: "Swahili", native: "Kiswahili", flag: "🇰🇪", hreflang: "sw", ogLocale: "sw_KE" },
  id: {
    label: "Indonesian",
    native: "Bahasa Indonesia",
    flag: "🇮🇩",
    hreflang: "id",
    ogLocale: "id_ID",
  },
  pt: { label: "Portuguese", native: "Português", flag: "🇵🇹", hreflang: "pt", ogLocale: "pt_PT" },
  tr: { label: "Turkish", native: "Türkçe", flag: "🇹🇷", hreflang: "tr", ogLocale: "tr_TR" },
  pl: { label: "Polish", native: "Polski", flag: "🇵🇱", hreflang: "pl", ogLocale: "pl_PL" },
  ro: { label: "Romanian", native: "Română", flag: "🇷🇴", hreflang: "ro", ogLocale: "ro_RO" },
  ru: { label: "Russian", native: "Русский", flag: "🇷🇺", hreflang: "ru", ogLocale: "ru_RU" },
  el: { label: "Greek", native: "Ελληνικά", flag: "🇬🇷", hreflang: "el", ogLocale: "el_GR" },
  da: { label: "Danish", native: "Dansk", flag: "🇩🇰", hreflang: "da", ogLocale: "da_DK" },
  sv: { label: "Swedish", native: "Svenska", flag: "🇸🇪", hreflang: "sv", ogLocale: "sv_SE" },
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
