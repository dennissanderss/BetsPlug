/**
 * Single source of truth for the BetsPlug locale set.
 *
 * 2026-05-05: extended from 6 → 7 with `sw` (Standard Swahili / Kiswahili
 * Sanifu). Adding another locale is a deliberate multi-system change
 * (astro.config.mjs i18n config, slug-mappings, content folders, sitemap,
 * hreflang, navigation labels, footer/announcement strings, legal
 * overrides + resources). See docs/specs/16-i18n.md → "LOCALES OVERVIEW".
 */
export const locales = ["en", "nl", "de", "fr", "es", "it", "sw"] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  sw: "Kiswahili",
};

/** BCP-47 tag for `Intl.DateTimeFormat`, `Intl.NumberFormat`, etc. */
export const localeBcp47: Record<Locale, string> = {
  en: "en-GB",
  nl: "nl-NL",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  sw: "sw-KE",
};

/** OpenGraph `og:locale` value per locale. */
export const localeOgTag: Record<Locale, string> = {
  en: "en_GB",
  nl: "nl_NL",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  it: "it_IT",
  sw: "sw_KE",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
