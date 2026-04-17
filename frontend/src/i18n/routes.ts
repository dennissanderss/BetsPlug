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
    sw: "/",
    id: "/",
  },
  "/predictions": {
    en: "/predictions",
    nl: "/voorspellingen",
    de: "/prognosen",
    fr: "/predictions",
    es: "/predicciones",
    it: "/pronostici",
    sw: "/utabiri",
    id: "/prediksi",
  },
  "/match-predictions": {
    en: "/match-predictions",
    nl: "/wedstrijd-voorspellingen",
    de: "/spiel-vorhersagen",
    fr: "/predictions-match",
    es: "/predicciones-partidos",
    it: "/previsioni-partite",
    sw: "/utabiri-mechi",
    id: "/prediksi-pertandingan",
  },
  "/bet-types": {
    en: "/bet-types",
    nl: "/wed-types",
    de: "/wett-arten",
    fr: "/types-de-paris",
    es: "/tipos-de-apuesta",
    it: "/tipi-di-scommessa",
    sw: "/aina-za-kamari",
    id: "/jenis-taruhan",
  },
  "/learn": {
    en: "/learn",
    nl: "/leren",
    de: "/lernen",
    fr: "/apprendre",
    es: "/aprender",
    it: "/impara",
    sw: "/jifunze",
    id: "/belajar",
  },
  "/live": {
    en: "/live",
    nl: "/live",
    de: "/live",
    fr: "/en-direct",
    es: "/en-vivo",
    it: "/live",
    sw: "/moja-kwa-moja",
    id: "/langsung",
  },
  "/dashboard": {
    en: "/dashboard",
    nl: "/dashboard",
    de: "/dashboard",
    fr: "/tableau-de-bord",
    es: "/panel",
    it: "/pannello",
    sw: "/dashibodi",
    id: "/dasbor",
  },
  "/trackrecord": {
    en: "/trackrecord",
    nl: "/prestaties",
    de: "/bilanz",
    fr: "/historique",
    es: "/historial",
    it: "/storico",
    sw: "/rekodi",
    id: "/riwayat",
  },
  "/track-record": {
    en: "/track-record",
    nl: "/trackrecord-resultaten",
    de: "/track-record-ergebnisse",
    fr: "/track-record-resultats",
    es: "/track-record-resultados",
    it: "/track-record-risultati",
    sw: "/track-record-matokeo",
    id: "/track-record-hasil",
  },
  "/how-it-works": {
    en: "/how-it-works",
    nl: "/hoe-het-werkt",
    de: "/so-funktioniert-es",
    fr: "/comment-ca-marche",
    es: "/como-funciona",
    it: "/come-funziona",
    sw: "/jinsi-inavyofanya-kazi",
    id: "/cara-kerjanya",
  },
  "/about": {
    en: "/about",
    nl: "/over-ons",
    de: "/ueber-uns",
    fr: "/a-propos",
    es: "/sobre-nosotros",
    it: "/chi-siamo",
    sw: "/kuhusu",
    id: "/tentang",
  },
  "/about-us": {
    en: "/about-us",
    nl: "/over-ons-team",
    de: "/ueber-uns-team",
    fr: "/notre-equipe",
    es: "/nuestro-equipo",
    it: "/il-nostro-team",
    sw: "/timu-yetu",
    id: "/tim-kami",
  },
  "/contact": {
    en: "/contact",
    nl: "/contact",
    de: "/kontakt",
    fr: "/contact",
    es: "/contacto",
    it: "/contatti",
    sw: "/wasiliana",
    id: "/kontak",
  },
  "/checkout": {
    en: "/checkout",
    nl: "/afrekenen",
    de: "/kasse",
    fr: "/paiement",
    es: "/pago",
    it: "/checkout",
    sw: "/malipo",
    id: "/pembayaran",
  },
  "/welcome": {
    en: "/welcome",
    nl: "/welkom",
    de: "/willkommen",
    fr: "/bienvenue",
    es: "/bienvenida",
    it: "/benvenuto",
    sw: "/karibu",
    id: "/selamat-datang",
  },
  "/login": {
    en: "/login",
    nl: "/inloggen",
    de: "/anmelden",
    fr: "/connexion",
    es: "/iniciar-sesion",
    it: "/accedi",
    sw: "/ingia",
    id: "/masuk",
  },
  "/articles": {
    en: "/articles",
    nl: "/artikelen",
    de: "/artikel",
    fr: "/articles",
    es: "/articulos",
    it: "/articoli",
    sw: "/makala",
    id: "/artikel",
  },
  "/deals": {
    en: "/deals",
    nl: "/aanbiedingen",
    de: "/angebote",
    fr: "/offres",
    es: "/ofertas",
    it: "/offerte",
    sw: "/ofa",
    id: "/penawaran",
  },
  "/strategy": {
    en: "/strategy",
    nl: "/strategie",
    de: "/strategie",
    fr: "/strategie",
    es: "/estrategia",
    it: "/strategia",
    sw: "/mikakati",
    id: "/strategi",
  },
  "/reports": {
    en: "/reports",
    nl: "/rapporten",
    de: "/berichte",
    fr: "/rapports",
    es: "/informes",
    it: "/report",
    sw: "/ripoti",
    id: "/laporan",
  },
  "/weekly-report": {
    en: "/weekly-report",
    nl: "/weekrapport",
    de: "/wochenbericht",
    fr: "/rapport-hebdomadaire",
    es: "/informe-semanal",
    it: "/report-settimanale",
    sw: "/ripoti-ya-wiki",
    id: "/laporan-mingguan",
  },
  "/bet-of-the-day": {
    en: "/bet-of-the-day",
    nl: "/pick-van-de-dag",
    de: "/tipp-des-tages",
    fr: "/pick-du-jour",
    es: "/pick-del-dia",
    it: "/pick-del-giorno",
    sw: "/chaguo-la-siku",
    id: "/pilihan-hari-ini",
  },
  "/search": {
    en: "/search",
    nl: "/zoeken",
    de: "/suche",
    fr: "/recherche",
    es: "/buscar",
    it: "/cerca",
    sw: "/tafuta",
    id: "/cari",
  },
  "/results": {
    en: "/results",
    nl: "/resultaten",
    de: "/ergebnisse",
    fr: "/resultats",
    es: "/resultados",
    it: "/risultati",
    sw: "/matokeo",
    id: "/hasil",
  },
  "/admin": {
    en: "/admin",
    nl: "/admin",
    de: "/admin",
    fr: "/admin",
    es: "/admin",
    it: "/admin",
    sw: "/admin",
    id: "/admin",
  },
  "/b2b": {
    en: "/b2b",
    nl: "/b2b",
    de: "/b2b",
    fr: "/b2b",
    es: "/b2b",
    it: "/b2b",
    sw: "/b2b",
    id: "/b2b",
  },
  "/jouw-route": {
    en: "/your-route",
    nl: "/jouw-route",
    de: "/dein-weg",
    fr: "/votre-parcours",
    es: "/tu-ruta",
    it: "/il-tuo-percorso",
    sw: "/njia-yako",
    id: "/rute-anda",
  },
  "/favorites": {
    en: "/favorites",
    nl: "/favorieten",
    de: "/favoriten",
    fr: "/favoris",
    es: "/favoritos",
    it: "/preferiti",
    sw: "/vipendwa",
    id: "/favorit",
  },
  "/myaccount": {
    en: "/myaccount",
    nl: "/mijn-account",
    de: "/mein-konto",
    fr: "/mon-compte",
    es: "/mi-cuenta",
    it: "/il-mio-account",
    sw: "/akaunti-yangu",
    id: "/akun-saya",
  },
  "/subscription": {
    en: "/subscription",
    nl: "/abonnement",
    de: "/abonnement",
    fr: "/abonnement",
    es: "/suscripcion",
    it: "/abbonamento",
    sw: "/usajili",
    id: "/langganan",
  },
  "/matches": {
    en: "/matches",
    nl: "/wedstrijden",
    de: "/spiele",
    fr: "/matchs",
    es: "/partidos",
    it: "/partite",
    sw: "/mechi",
    id: "/pertandingan",
  },
  "/teams": {
    en: "/teams",
    nl: "/teams",
    de: "/mannschaften",
    fr: "/equipes",
    es: "/equipos",
    it: "/squadre",
    sw: "/timu",
    id: "/tim",
  },
  "/terms": {
    en: "/terms",
    nl: "/voorwaarden",
    de: "/nutzungsbedingungen",
    fr: "/conditions",
    es: "/terminos",
    it: "/termini",
    sw: "/masharti",
    id: "/ketentuan",
  },
  "/privacy": {
    en: "/privacy",
    nl: "/privacybeleid",
    de: "/datenschutz",
    fr: "/confidentialite",
    es: "/privacidad",
    it: "/privacy",
    sw: "/faragha",
    id: "/privasi",
  },
  "/cookies": {
    en: "/cookies",
    nl: "/cookies",
    de: "/cookies",
    fr: "/cookies",
    es: "/cookies",
    it: "/cookies",
    sw: "/cookies",
    id: "/cookies",
  },
  "/register": {
    en: "/register",
    nl: "/registreren",
    de: "/registrieren",
    fr: "/inscription",
    es: "/registro",
    it: "/registrazione",
    sw: "/jisajili",
    id: "/daftar",
  },
  "/forgot-password": {
    en: "/forgot-password",
    nl: "/wachtwoord-vergeten",
    de: "/passwort-vergessen",
    fr: "/mot-de-passe-oublie",
    es: "/olvide-contrasena",
    it: "/password-dimenticata",
    sw: "/sahau-nenosiri",
    id: "/lupa-kata-sandi",
  },
  "/reset-password": {
    en: "/reset-password",
    nl: "/wachtwoord-resetten",
    de: "/passwort-zuruecksetzen",
    fr: "/reinitialiser-mot-de-passe",
    es: "/restablecer-contrasena",
    it: "/reimposta-password",
    sw: "/weka-nenosiri-upya",
    id: "/atur-ulang-kata-sandi",
  },
  "/thank-you": {
    en: "/thank-you",
    nl: "/bedankt",
    de: "/danke",
    fr: "/merci",
    es: "/gracias",
    it: "/grazie",
    sw: "/asante",
    id: "/terima-kasih",
  },
  "/verify-email": {
    en: "/verify-email",
    nl: "/e-mail-verifier",
    de: "/e-mail-verifizieren",
    fr: "/verifier-email",
    es: "/verificar-correo",
    it: "/verifica-email",
    sw: "/thibitisha-barua-pepe",
    id: "/verifikasi-email",
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
  sw: new Map(),
  id: new Map(),
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
