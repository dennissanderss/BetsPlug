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
