/**
 * i18n configuration
 * ────────────────────────────────────────────────────────────
 * Single source of truth for supported locales. Used by the
 * middleware (to match /nl, /de, … URL prefixes), by the root
 * layout (to emit hreflang alternates) and by the client-side
 * locale provider.
 */

export const locales = ["en", "nl", "de", "fr", "es", "it", "sw", "id"] as const;
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
  id: { label: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", hreflang: "id" },
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
