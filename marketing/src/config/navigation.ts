/**
 * Centralized navigation config for the BetsPlug marketing site.
 *
 * Single source of truth for header, mobile drawer, and footer
 * link sets. Components consume this and run hrefs through
 * `getLocalizedPath()` for per-locale URL rendering.
 *
 * The label dictionary lives here too — once the shared
 * `content/shared/{nav,footer}.json` files exist, components can
 * swap the inline lookup for `getContent("shared/nav", locale)`.
 *
 * Source of truth for routes: docs/specs/01-site-architecture.md.
 * Items intentionally omitted from the header (per the spec):
 * About, Contact, FAQ, Learn, Bet Types, Free vs Paid, Telegram —
 * all reachable via footer or contextual links.
 */
import type { Locale } from "@/i18n/locales";

/** Label keys — every nav item references one of these. */
export type NavKey =
  // Primary product
  | "predictions"
  | "howItWorks"
  | "methodology"
  | "trackRecord"
  | "pricing"
  // Learn
  | "learnHub"
  | "betTypes"
  | "faq"
  // Company
  | "about"
  | "contact"
  | "freeVsPaid"
  | "telegram"
  // Account / actions
  | "login"
  | "getFreePicks"
  // Group labels (mobile drawer + footer column headings)
  | "product"
  | "learn"
  | "company"
  | "leagues"
  | "resources"
  | "language"
  // Legal
  | "privacy"
  | "terms"
  | "cookies"
  | "responsibleGambling"
  | "cookieSettings"
  // Footer extras
  | "viewAllLeagues"
  // League names (shared, not localized but kept here for label lookup)
  | "premierLeague"
  | "laLiga"
  | "bundesliga"
  | "serieA"
  | "championsLeague";

export interface NavItem {
  key: NavKey;
  /** Canonical (EN) path or absolute URL. Components run it through getLocalizedPath. */
  href: string;
  /** Absolute URL (e.g. app.betsplug.com) — bypasses locale prefixing. */
  external?: boolean;
}

export interface NavGroup {
  labelKey: NavKey;
  items: NavItem[];
}

/* ── Header (desktop) ─────────────────────────────────────────────
 * Five primary items. Conversion-focused: secondary pages live in
 * the footer / mobile drawer. */
export const headerNavItems: NavItem[] = [
  { key: "predictions", href: "predictions" },
  { key: "howItWorks",  href: "how-it-works" },
  { key: "methodology", href: "methodology" },
  { key: "trackRecord", href: "track-record" },
  { key: "pricing",     href: "pricing" },
];

export const headerActions = {
  login: {
    key: "login" as NavKey,
    href: "https://app.betsplug.com/login",
    external: true,
  },
  cta: {
    key: "getFreePicks" as NavKey,
    href: "https://app.betsplug.com/register",
    external: true,
  },
};

/* ── Mobile drawer groups ─────────────────────────────────────────
 * All product, learn, and company items grouped for scanning. */
export const mobileNavGroups: NavGroup[] = [
  {
    labelKey: "product",
    items: [
      { key: "predictions", href: "predictions" },
      { key: "howItWorks",  href: "how-it-works" },
      { key: "methodology", href: "methodology" },
      { key: "trackRecord", href: "track-record" },
      { key: "pricing",     href: "pricing" },
    ],
  },
  {
    labelKey: "learn",
    items: [
      { key: "learnHub", href: "learn" },
      { key: "betTypes", href: "bet-types" },
      { key: "faq",      href: "faq" },
    ],
  },
  {
    labelKey: "company",
    items: [
      { key: "freeVsPaid", href: "free-vs-paid" },
      { key: "telegram",   href: "telegram" },
      { key: "contact",    href: "contact" },
    ],
  },
];

/* ── Footer (4 columns) ───────────────────────────────────────────
 * Product / Leagues / Resources / Company. Legal items merged into
 * Company so the column count stays at 4 per the spec. */
export const footerNavGroups = {
  product: {
    labelKey: "product" as NavKey,
    items: [
      { key: "predictions", href: "predictions" },
      { key: "pricing",     href: "pricing" },
      { key: "howItWorks",  href: "how-it-works" },
      { key: "methodology", href: "methodology" },
      { key: "trackRecord", href: "track-record" },
    ] as NavItem[],
  },
  leagues: {
    labelKey: "leagues" as NavKey,
    items: [
      { key: "premierLeague",   href: "predictions/premier-league" },
      { key: "laLiga",          href: "predictions/la-liga" },
      { key: "bundesliga",      href: "predictions/bundesliga" },
      { key: "serieA",          href: "predictions/serie-a" },
      { key: "championsLeague", href: "predictions/champions-league" },
      { key: "viewAllLeagues",  href: "predictions" },
    ] as NavItem[],
  },
  resources: {
    labelKey: "resources" as NavKey,
    items: [
      { key: "learnHub",   href: "learn" },
      { key: "betTypes",   href: "bet-types" },
      { key: "faq",        href: "faq" },
      { key: "freeVsPaid", href: "free-vs-paid" },
      { key: "telegram",   href: "telegram" },
    ] as NavItem[],
  },
  company: {
    labelKey: "company" as NavKey,
    items: [
      { key: "contact",             href: "contact" },
      { key: "privacy",             href: "privacy" },
      { key: "terms",               href: "terms" },
      { key: "cookies",             href: "cookies" },
      { key: "responsibleGambling", href: "responsible-gambling" },
    ] as NavItem[],
  },
} as const;

/* ── Label dictionary (per-locale) ─────────────────────────────── */

export const navLabels: Record<Locale, Record<NavKey, string>> = {
  en: {
    predictions: "Predictions",
    howItWorks: "How it works",
    methodology: "Methodology",
    trackRecord: "Track record",
    pricing: "Pricing",
    learnHub: "Learn hub",
    betTypes: "Bet types",
    faq: "FAQ",
    about: "About",
    contact: "Contact",
    freeVsPaid: "Free vs paid",
    telegram: "Telegram",
    login: "Log in",
    getFreePicks: "Get free picks",
    product: "Product",
    learn: "Learn",
    company: "Company",
    leagues: "Leagues",
    resources: "Resources",
    language: "Language",
    privacy: "Privacy",
    terms: "Terms",
    cookies: "Cookies",
    responsibleGambling: "Responsible play",
    cookieSettings: "Cookie settings",
    viewAllLeagues: "View all leagues",
    premierLeague: "Premier League",
    laLiga: "La Liga",
    bundesliga: "Bundesliga",
    serieA: "Serie A",
    championsLeague: "Champions League",
  },
  nl: {
    predictions: "Voorspellingen",
    howItWorks: "Hoe het werkt",
    methodology: "Methodologie",
    trackRecord: "Track record",
    pricing: "Prijzen",
    learnHub: "Kennisbank",
    betTypes: "Weddenschap-types",
    faq: "Veelgestelde vragen",
    about: "Over ons",
    contact: "Contact",
    freeVsPaid: "Gratis vs betaald",
    telegram: "Telegram",
    login: "Inloggen",
    getFreePicks: "Gratis voorspellingen",
    product: "Product",
    learn: "Leren",
    company: "Bedrijf",
    leagues: "Competities",
    resources: "Bronnen",
    language: "Taal",
    privacy: "Privacy",
    terms: "Voorwaarden",
    cookies: "Cookies",
    responsibleGambling: "Verantwoord spelen",
    cookieSettings: "Cookie-instellingen",
    viewAllLeagues: "Alle competities",
    premierLeague: "Premier League",
    laLiga: "La Liga",
    bundesliga: "Bundesliga",
    serieA: "Serie A",
    championsLeague: "Champions League",
  },
  de: {
    predictions: "Vorhersagen",
    howItWorks: "Wie es funktioniert",
    methodology: "Methodik",
    trackRecord: "Track Record",
    pricing: "Preise",
    learnHub: "Wissens-Hub",
    betTypes: "Wett-Arten",
    faq: "Häufige Fragen",
    about: "Über uns",
    contact: "Kontakt",
    freeVsPaid: "Kostenlos vs. bezahlt",
    telegram: "Telegram",
    login: "Anmelden",
    getFreePicks: "Kostenlose Tipps",
    product: "Produkt",
    learn: "Lernen",
    company: "Unternehmen",
    leagues: "Ligen",
    resources: "Ressourcen",
    language: "Sprache",
    privacy: "Datenschutz",
    terms: "AGB",
    cookies: "Cookies",
    responsibleGambling: "Verantwortungsvolles Spielen",
    cookieSettings: "Cookie-Einstellungen",
    viewAllLeagues: "Alle Ligen ansehen",
    premierLeague: "Premier League",
    laLiga: "La Liga",
    bundesliga: "Bundesliga",
    serieA: "Serie A",
    championsLeague: "Champions League",
  },
  fr: {
    predictions: "Pronostics",
    howItWorks: "Comment ça marche",
    methodology: "Méthodologie",
    trackRecord: "Track record",
    pricing: "Tarifs",
    learnHub: "Centre d'apprentissage",
    betTypes: "Types de paris",
    faq: "FAQ",
    about: "À propos",
    contact: "Contact",
    freeVsPaid: "Gratuit vs payant",
    telegram: "Telegram",
    login: "Connexion",
    getFreePicks: "Pronostics gratuits",
    product: "Produit",
    learn: "Apprendre",
    company: "Entreprise",
    leagues: "Championnats",
    resources: "Ressources",
    language: "Langue",
    privacy: "Confidentialité",
    terms: "Conditions",
    cookies: "Cookies",
    responsibleGambling: "Jeu responsable",
    cookieSettings: "Paramètres des cookies",
    viewAllLeagues: "Tous les championnats",
    premierLeague: "Premier League",
    laLiga: "La Liga",
    bundesliga: "Bundesliga",
    serieA: "Serie A",
    championsLeague: "Champions League",
  },
  es: {
    predictions: "Pronósticos",
    howItWorks: "Cómo funciona",
    methodology: "Metodología",
    trackRecord: "Track record",
    pricing: "Precios",
    learnHub: "Centro de aprendizaje",
    betTypes: "Tipos de apuestas",
    faq: "Preguntas frecuentes",
    about: "Sobre nosotros",
    contact: "Contacto",
    freeVsPaid: "Gratis vs pago",
    telegram: "Telegram",
    login: "Iniciar sesión",
    getFreePicks: "Pronósticos gratis",
    product: "Producto",
    learn: "Aprender",
    company: "Empresa",
    leagues: "Ligas",
    resources: "Recursos",
    language: "Idioma",
    privacy: "Privacidad",
    terms: "Términos",
    cookies: "Cookies",
    responsibleGambling: "Juego responsable",
    cookieSettings: "Ajustes de cookies",
    viewAllLeagues: "Ver todas las ligas",
    premierLeague: "Premier League",
    laLiga: "La Liga",
    bundesliga: "Bundesliga",
    serieA: "Serie A",
    championsLeague: "Champions League",
  },
  it: {
    predictions: "Pronostici",
    howItWorks: "Come funziona",
    methodology: "Metodologia",
    trackRecord: "Track record",
    pricing: "Prezzi",
    learnHub: "Centro didattico",
    betTypes: "Tipi di scommesse",
    faq: "FAQ",
    about: "Chi siamo",
    contact: "Contatti",
    freeVsPaid: "Gratis vs a pagamento",
    telegram: "Telegram",
    login: "Accedi",
    getFreePicks: "Pronostici gratuiti",
    product: "Prodotto",
    learn: "Imparare",
    company: "Azienda",
    leagues: "Campionati",
    resources: "Risorse",
    language: "Lingua",
    privacy: "Privacy",
    terms: "Termini",
    cookies: "Cookie",
    responsibleGambling: "Gioco responsabile",
    cookieSettings: "Impostazioni cookie",
    viewAllLeagues: "Tutti i campionati",
    premierLeague: "Premier League",
    laLiga: "La Liga",
    bundesliga: "Bundesliga",
    serieA: "Serie A",
    championsLeague: "Champions League",
  },
};
