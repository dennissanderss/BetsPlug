/**
 * Localized URL slug mapping for the BetsPlug marketing site.
 * See docs/specs/01-site-architecture.md → "LOCALIZED SLUG MAPPING"
 * and docs/specs/16-i18n.md → "SLUG MAPPING CONFIGURATION".
 *
 * Two layers:
 *
 * 1. `folderSlugs` — top-level path segments. The canonical key is
 *    the English form. Look up by canonical → localized when
 *    *generating* a URL, by localized → canonical when *resolving*
 *    an incoming request.
 *
 * 2. `articleSlugs` — `/learn/{slug}` items. Same shape: canonical
 *    is the English slug; per-locale forms are translations.
 *
 * League slugs (`premier-league`, `la-liga`, …) deliberately stay
 * universal across locales, so they're absent here.
 */
import { type Locale, defaultLocale, locales } from "./locales";

type LocaleMap = Record<Locale, string>;

/* ── Folder slugs ─────────────────────────────────────────────── */

export const folderSlugs: Record<string, LocaleMap> = {
  predictions: {
    en: "predictions",
    nl: "voorspellingen",
    de: "vorhersagen",
    fr: "pronostics",
    es: "pronosticos",
    it: "pronostici",
    sw: "utabiri",
  },
  learn: {
    en: "learn",
    nl: "leren",
    de: "lernen",
    fr: "apprendre",
    es: "aprender",
    it: "imparare",
    sw: "jifunze",
  },
  pricing: {
    en: "pricing",
    nl: "prijzen",
    de: "preise",
    fr: "tarifs",
    es: "precios",
    it: "prezzi",
    sw: "bei",
  },
  about: {
    en: "about",
    nl: "over-ons",
    de: "ueber-uns",
    fr: "a-propos",
    es: "sobre-nosotros",
    it: "chi-siamo",
    sw: "kuhusu",
  },
  "how-it-works": {
    en: "how-it-works",
    nl: "hoe-het-werkt",
    de: "wie-es-funktioniert",
    fr: "comment-ca-marche",
    es: "como-funciona",
    it: "come-funziona",
    sw: "jinsi-inavyofanya-kazi",
  },
  methodology: {
    en: "methodology",
    nl: "methodologie",
    de: "methodik",
    fr: "methodologie",
    es: "metodologia",
    it: "metodologia",
    sw: "mbinu",
  },
  "bet-types": {
    en: "bet-types",
    nl: "weddenschap-types",
    de: "wett-arten",
    fr: "types-de-paris",
    es: "tipos-de-apuestas",
    it: "tipi-di-scommesse",
    sw: "aina-za-utabiri",
  },
  faq: {
    en: "faq",
    nl: "veelgestelde-vragen",
    de: "haeufig-gestellte-fragen",
    fr: "faq",
    es: "preguntas-frecuentes",
    it: "faq",
    sw: "maswali",
  },
  "free-vs-paid": {
    en: "free-vs-paid",
    nl: "gratis-vs-betaald",
    de: "kostenlos-vs-bezahlt",
    fr: "gratuit-vs-paye",
    es: "gratis-vs-pago",
    it: "gratis-vs-pagamento",
    sw: "bure-vs-malipo",
  },
  privacy: {
    en: "privacy",
    nl: "privacy",
    de: "datenschutz",
    fr: "confidentialite",
    es: "privacidad",
    it: "privacy",
    sw: "faragha",
  },
  terms: {
    en: "terms",
    nl: "voorwaarden",
    de: "agb",
    fr: "conditions",
    es: "terminos",
    it: "termini",
    sw: "masharti",
  },
  cookies: {
    en: "cookies",
    nl: "cookies",
    de: "cookies",
    fr: "cookies",
    es: "cookies",
    it: "cookie",
    sw: "vidakuzi",
  },
  "responsible-gambling": {
    en: "responsible-gambling",
    nl: "verantwoord-gokken",
    de: "verantwortungsvolles-spielen",
    fr: "jeu-responsable",
    es: "juego-responsable",
    it: "gioco-responsabile",
    sw: "mchezo-wenye-busara",
  },
  /* Universal — same in every locale */
  contact: {
    en: "contact", nl: "contact", de: "contact",
    fr: "contact", es: "contact", it: "contact",
    sw: "mawasiliano",
  },
  "track-record": {
    en: "track-record", nl: "track-record", de: "track-record",
    fr: "track-record", es: "track-record", it: "track-record",
    sw: "rekodi",
  },
  telegram: {
    en: "telegram", nl: "telegram", de: "telegram",
    fr: "telegram", es: "telegram", it: "telegram",
    sw: "telegram",
  },
};

/* ── Article slugs ─────────────────────────────────────────────── */

export const articleSlugs: Record<string, LocaleMap> = {
  "what-is-value-betting": {
    en: "what-is-value-betting",
    nl: "wat-is-value-betting",
    de: "was-ist-value-betting",
    fr: "qu-est-ce-que-le-value-betting",
    es: "que-es-value-betting",
    it: "cos-e-il-value-betting",
    sw: "value-betting-ni-nini",
  },
  "expected-goals-explained": {
    en: "expected-goals-explained",
    nl: "expected-goals-uitgelegd",
    de: "expected-goals-erklaert",
    fr: "expected-goals-explique",
    es: "expected-goals-explicado",
    it: "expected-goals-spiegato",
    sw: "expected-goals-imefafanuliwa",
  },
  "elo-rating-explained": {
    en: "elo-rating-explained",
    nl: "elo-rating-uitgelegd",
    de: "elo-rating-erklaert",
    fr: "classement-elo-explique",
    es: "clasificacion-elo-explicado",
    it: "classifica-elo-spiegato",
    sw: "elo-rating-imefafanuliwa",
  },
  "poisson-goal-models": {
    en: "poisson-goal-models",
    nl: "poisson-doelpunten-modellen",
    de: "poisson-tor-modelle",
    fr: "modeles-poisson-buts",
    es: "modelos-poisson-goles",
    it: "modelli-poisson-gol",
    sw: "mifumo-ya-mabao-ya-poisson",
  },
  "kelly-criterion": {
    en: "kelly-criterion",
    nl: "kelly-criterium",
    de: "kelly-kriterium",
    fr: "critere-de-kelly",
    es: "criterio-de-kelly",
    it: "criterio-di-kelly",
    sw: "kigezo-cha-kelly",
  },
  "bankroll-management": {
    en: "bankroll-management",
    nl: "bankroll-management",
    de: "bankroll-management",
    fr: "gestion-de-bankroll",
    es: "gestion-de-bankroll",
    it: "gestione-del-bankroll",
    sw: "usimamizi-wa-bankroll",
  },
  "ai-vs-tipsters": {
    en: "ai-vs-tipsters",
    nl: "ai-vs-tipsters",
    de: "ki-vs-tipster",
    fr: "ia-vs-pronostiqueurs",
    es: "ia-vs-tipsters",
    it: "ia-vs-tipster",
    sw: "ai-dhidi-ya-watabiri",
  },
};

/* ── Lookup helpers ────────────────────────────────────────────── */

/**
 * Translate a canonical (English) slug to its localized form.
 * Returns the canonical unchanged when no mapping exists, so unknown
 * slugs degrade gracefully instead of silently 404'ing.
 */
export function getLocalizedSlug(canonical: string, locale: Locale): string {
  const folder = folderSlugs[canonical];
  if (folder) return folder[locale] ?? canonical;
  const article = articleSlugs[canonical];
  if (article) return article[locale] ?? canonical;
  return canonical;
}

/**
 * Reverse lookup: given a localized slug + the locale it appears in,
 * return the canonical (English) slug. Returns null when there's no
 * match. Used by the catch-all router in src/pages/[locale]/[...slug].astro
 * to resolve an incoming localized URL back to the canonical page id.
 */
export function getCanonicalSlug(
  localizedSlug: string,
  locale: Locale,
): string | null {
  for (const [canonical, mapping] of Object.entries(folderSlugs)) {
    if (mapping[locale] === localizedSlug) return canonical;
  }
  for (const [canonical, mapping] of Object.entries(articleSlugs)) {
    if (mapping[locale] === localizedSlug) return canonical;
  }
  return null;
}

/**
 * Build the absolute path for a canonical page in a given locale.
 *
 * @example
 *   getLocalizedPath("predictions", "nl")            → "/nl/voorspellingen"
 *   getLocalizedPath("predictions", "en")            → "/predictions"
 *   getLocalizedPath("learn/expected-goals-explained", "de")
 *     → "/de/lernen/expected-goals-erklaert"
 *   getLocalizedPath("/", "fr")                       → "/fr"
 */
export function getLocalizedPath(
  canonicalPath: string,
  locale: Locale,
): string {
  // Homepage
  if (canonicalPath === "" || canonicalPath === "/") {
    return locale === defaultLocale ? "/" : `/${locale}`;
  }

  const trimmed = canonicalPath.replace(/^\/+|\/+$/g, "");
  const segments = trimmed.split("/");

  // First segment may be a folder (predictions, learn, …).
  // Second segment may be a child slug we need to translate too
  // when it's a learn-article. League slugs are universal, no work.
  const localized = segments.map((seg, i) => {
    if (i === 0 && folderSlugs[seg]) {
      return folderSlugs[seg][locale] ?? seg;
    }
    if (i === 1 && segments[0] === "learn" && articleSlugs[seg]) {
      return articleSlugs[seg][locale] ?? seg;
    }
    return seg;
  });

  const path = localized.join("/");
  return locale === defaultLocale ? `/${path}` : `/${locale}/${path}`;
}

/**
 * Generate the full set of localized URLs for the page currently
 * being rendered. Used to build hreflang link tags + the locale
 * switcher dropdown.
 *
 * @param canonicalPath  Canonical (English) path with leading slash.
 *                       Example: "/predictions/premier-league".
 * @param siteUrl        Absolute origin (no trailing slash). Defaults
 *                       to "https://betsplug.com".
 */
export function getAllLocaleVersions(
  canonicalPath: string,
  siteUrl = "https://betsplug.com",
): Array<{ locale: Locale; url: string; path: string }> {
  return locales.map((locale) => {
    const path = getLocalizedPath(canonicalPath, locale);
    return {
      locale,
      path,
      url: `${siteUrl}${path}`,
    };
  });
}

export { locales, defaultLocale };
