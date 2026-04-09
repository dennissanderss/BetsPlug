/**
 * Localized route map
 * ────────────────────────────────────────────────────────────
 * Maps a canonical (English) path → localized slug per locale.
 *
 * The middleware uses this to rewrite incoming localized URLs
 * (e.g. /nl/voorspellingen) to the underlying Next.js page
 * path (/predictions) so existing App Router files keep
 * working without any restructuring.
 *
 * The language switcher uses it to translate the current URL
 * from one locale to another when the user changes language.
 */

import { defaultLocale, locales, type Locale } from "./config";

/* ── Canonical path ⇄ localized slug table ─────────────────── */

// Each key is the canonical path matched by the Next.js app
// router. Each value is a full Record<Locale, string> giving
// the public URL segment for that locale.
export const routeTable = {
  "/": {
    en: "/",
    nl: "/",
    de: "/",
    fr: "/",
    es: "/",
    it: "/",
  },
  "/predictions": {
    en: "/predictions",
    nl: "/voorspellingen",
    de: "/prognosen",
    fr: "/predictions",
    es: "/predicciones",
    it: "/pronostici",
  },
  "/match-predictions": {
    en: "/match-predictions",
    nl: "/wedstrijd-voorspellingen",
    de: "/spiel-vorhersagen",
    fr: "/predictions-match",
    es: "/predicciones-partidos",
    it: "/previsioni-partite",
  },
  "/live": {
    en: "/live",
    nl: "/live",
    de: "/live",
    fr: "/en-direct",
    es: "/en-vivo",
    it: "/live",
  },
  "/dashboard": {
    en: "/dashboard",
    nl: "/dashboard",
    de: "/dashboard",
    fr: "/tableau-de-bord",
    es: "/panel",
    it: "/pannello",
  },
  "/trackrecord": {
    en: "/trackrecord",
    nl: "/prestaties",
    de: "/bilanz",
    fr: "/historique",
    es: "/historial",
    it: "/storico",
  },
  "/track-record": {
    en: "/track-record",
    nl: "/trackrecord-resultaten",
    de: "/track-record-ergebnisse",
    fr: "/track-record-resultats",
    es: "/track-record-resultados",
    it: "/track-record-risultati",
  },
  "/how-it-works": {
    en: "/how-it-works",
    nl: "/hoe-het-werkt",
    de: "/so-funktioniert-es",
    fr: "/comment-ca-marche",
    es: "/como-funciona",
    it: "/come-funziona",
  },
  "/about": {
    en: "/about",
    nl: "/over-ons",
    de: "/ueber-uns",
    fr: "/a-propos",
    es: "/sobre-nosotros",
    it: "/chi-siamo",
  },
  "/about-us": {
    en: "/about-us",
    nl: "/over-ons-team",
    de: "/ueber-uns-team",
    fr: "/notre-equipe",
    es: "/nuestro-equipo",
    it: "/il-nostro-team",
  },
  "/contact": {
    en: "/contact",
    nl: "/contact",
    de: "/kontakt",
    fr: "/contact",
    es: "/contacto",
    it: "/contatti",
  },
  "/checkout": {
    en: "/checkout",
    nl: "/afrekenen",
    de: "/kasse",
    fr: "/paiement",
    es: "/pago",
    it: "/checkout",
  },
  "/welcome": {
    en: "/welcome",
    nl: "/welkom",
    de: "/willkommen",
    fr: "/bienvenue",
    es: "/bienvenida",
    it: "/benvenuto",
  },
  "/login": {
    en: "/login",
    nl: "/inloggen",
    de: "/anmelden",
    fr: "/connexion",
    es: "/iniciar-sesion",
    it: "/accedi",
  },
  "/deals": {
    en: "/deals",
    nl: "/aanbiedingen",
    de: "/angebote",
    fr: "/offres",
    es: "/ofertas",
    it: "/offerte",
  },
  "/strategy": {
    en: "/strategy",
    nl: "/strategie",
    de: "/strategie",
    fr: "/strategie",
    es: "/estrategia",
    it: "/strategia",
  },
  "/reports": {
    en: "/reports",
    nl: "/rapporten",
    de: "/berichte",
    fr: "/rapports",
    es: "/informes",
    it: "/report",
  },
  "/weekly-report": {
    en: "/weekly-report",
    nl: "/weekrapport",
    de: "/wochenbericht",
    fr: "/rapport-hebdomadaire",
    es: "/informe-semanal",
    it: "/report-settimanale",
  },
  "/bet-of-the-day": {
    en: "/bet-of-the-day",
    nl: "/pick-van-de-dag",
    de: "/tipp-des-tages",
    fr: "/pick-du-jour",
    es: "/pick-del-dia",
    it: "/pick-del-giorno",
  },
  "/settings": {
    en: "/settings",
    nl: "/instellingen",
    de: "/einstellungen",
    fr: "/parametres",
    es: "/ajustes",
    it: "/impostazioni",
  },
  "/search": {
    en: "/search",
    nl: "/zoeken",
    de: "/suche",
    fr: "/recherche",
    es: "/buscar",
    it: "/cerca",
  },
  "/results": {
    en: "/results",
    nl: "/resultaten",
    de: "/ergebnisse",
    fr: "/resultats",
    es: "/resultados",
    it: "/risultati",
  },
  "/admin": {
    en: "/admin",
    nl: "/admin",
    de: "/admin",
    fr: "/admin",
    es: "/admin",
    it: "/admin",
  },
} as const satisfies Record<string, Record<Locale, string>>;

export type CanonicalPath = keyof typeof routeTable;

/* ── Lookup helpers (cached) ───────────────────────────────── */

// locale → localized-first-segment → canonical first segment
const reverseBySegment: Record<Locale, Map<string, string>> = {
  en: new Map(),
  nl: new Map(),
  de: new Map(),
  fr: new Map(),
  es: new Map(),
  it: new Map(),
};

(Object.keys(routeTable) as CanonicalPath[]).forEach((canonical) => {
  const localized = routeTable[canonical];
  for (const l of locales) {
    const seg = stripLeadingSlash(localized[l]);
    const canonicalSeg = stripLeadingSlash(canonical);
    if (seg) reverseBySegment[l].set(seg, canonicalSeg);
  }
});

function stripLeadingSlash(p: string) {
  return p.replace(/^\/+/, "");
}

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/**
 * Given a pathname in any locale (with or without /xx prefix),
 * returns the canonical English pathname + detected locale.
 *
 * Examples:
 *   /nl/voorspellingen  →  { canonical: "/predictions", locale: "nl" }
 *   /predictions        →  { canonical: "/predictions", locale: "en" }
 *   /nl/matches/42      →  { canonical: "/matches/42",  locale: "nl" }
 */
export function parseLocalizedPath(
  pathname: string,
  fallbackLocale: Locale = defaultLocale
): { canonical: string; locale: Locale; rest: string[] } {
  const segments = splitPath(pathname);
  let locale: Locale = fallbackLocale;

  if (segments.length && (locales as readonly string[]).includes(segments[0])) {
    locale = segments.shift() as Locale;
  }

  if (segments.length === 0) {
    return { canonical: "/", locale, rest: [] };
  }

  // Try to translate the first segment back to canonical.
  const first = segments[0];
  const canonicalFirst = reverseBySegment[locale].get(first) ?? first;
  const rest = segments.slice(1);
  const canonical = "/" + [canonicalFirst, ...rest].filter(Boolean).join("/");

  return { canonical, locale, rest: [canonicalFirst, ...rest] };
}

/**
 * Convert a canonical path to its public URL in the given locale.
 * For unknown canonical paths the segments pass through unchanged
 * (so dynamic routes like /matches/42 still get a locale prefix).
 *
 * Examples:
 *   ("/predictions", "nl") → "/nl/voorspellingen"
 *   ("/matches/42", "de")  → "/de/matches/42"
 *   ("/", "fr")            → "/"   (default) or "/fr" (non-default)
 */
export function localizePath(canonical: string, locale: Locale): string {
  const segments = splitPath(canonical);

  if (segments.length === 0) {
    return locale === defaultLocale ? "/" : `/${locale}`;
  }

  const canonicalFirst = "/" + segments[0];
  const entry = (routeTable as Record<string, Record<Locale, string>>)[canonicalFirst];
  const localizedFirst = entry ? stripLeadingSlash(entry[locale]) : segments[0];

  const rest = segments.slice(1).join("/");
  const tail = [localizedFirst, rest].filter(Boolean).join("/");

  if (locale === defaultLocale) {
    return tail ? `/${tail}` : "/";
  }
  return tail ? `/${locale}/${tail}` : `/${locale}`;
}

/**
 * Translate a pathname from its current locale into another locale,
 * preserving any dynamic segments.
 */
export function translatePath(
  currentPathname: string,
  nextLocale: Locale
): string {
  const { canonical } = parseLocalizedPath(currentPathname);
  return localizePath(canonical, nextLocale);
}
