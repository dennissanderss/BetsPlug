/**
 * Translation dictionaries
 * ────────────────────────────────────────────────────────────
 * Flat key → string map per locale. Keys use dot notation for
 * logical grouping (nav.predictions, hero.title …). Fallback
 * behaviour: if a key is missing in a locale, the hook falls
 * back to the English version.
 */

import type { Locale } from "./config";

/* ── English (source of truth) ─────────────────────────────── */
const en = {
  /* Navigation */
  "nav.predictions": "Predictions",
  "nav.howItWorks": "How It Works",
  "nav.trackRecord": "Track Record",
  "nav.pricing": "Pricing",
  "nav.login": "Login",
  "nav.startFreeTrial": "Start Free Trial",
  "nav.menu": "Menu",
  "nav.getStarted": "Get Started",
  "nav.joinBlurb": "Join 1,500+ analysts and get data-driven predictions today.",

  /* Hero */
  "hero.badge": "Be ahead of the bookmakers",
  "hero.titleLine1": "Best AI-driven",
  "hero.titleLine2": "sports predictions",
  "hero.titleLine3": "for your edge.",
  "hero.subtitle":
    "BetsPlug unites data, Elo ratings, Poisson models and machine learning into one platform. Live probabilities, deep insights, proven track record — built for serious sports analysts.",
  "hero.activeUsers": "Active Users",
  "hero.ctaPrimary": "View Predictions",
  "hero.ctaSecondary": "How it works",
  "hero.livePick": "Live Pick",
  "hero.hot": "Hot",
  "hero.homeWin": "Home win",
  "hero.draw": "Draw",
  "hero.away": "Away",
  "hero.confidence": "Confidence",
  "hero.edge": "Edge",
  "hero.joinNow": "Join Now",
  "hero.winRate": "Win Rate",
  "hero.today": "Today",
  "hero.wins": "Wins",

  /* Language switcher */
  "lang.label": "Language",
  "lang.switch": "Switch language",
} as const;

export type TranslationKey = keyof typeof en;

type Dictionary = Partial<Record<TranslationKey, string>>;

/* ── Dutch ─────────────────────────────────────────────────── */
const nl: Dictionary = {
  "nav.predictions": "Voorspellingen",
  "nav.howItWorks": "Hoe het werkt",
  "nav.trackRecord": "Track Record",
  "nav.pricing": "Prijzen",
  "nav.login": "Inloggen",
  "nav.startFreeTrial": "Gratis proberen",
  "nav.menu": "Menu",
  "nav.getStarted": "Begin nu",
  "nav.joinBlurb":
    "Sluit je aan bij 1.500+ analisten en krijg vandaag nog datagedreven voorspellingen.",

  "hero.badge": "Wees de bookmaker voor",
  "hero.titleLine1": "De beste AI-gedreven",
  "hero.titleLine2": "sportvoorspellingen",
  "hero.titleLine3": "voor jouw voordeel.",
  "hero.subtitle":
    "BetsPlug combineert data, Elo-ratings, Poisson-modellen en machine learning in één platform. Live kansen, diepgaande inzichten en een bewezen track record — gemaakt voor serieuze sportanalisten.",
  "hero.activeUsers": "Actieve gebruikers",
  "hero.ctaPrimary": "Bekijk voorspellingen",
  "hero.ctaSecondary": "Hoe het werkt",
  "hero.livePick": "Live pick",
  "hero.hot": "Hot",
  "hero.homeWin": "Thuiswinst",
  "hero.draw": "Gelijk",
  "hero.away": "Uit",
  "hero.confidence": "Zekerheid",
  "hero.edge": "Voordeel",
  "hero.joinNow": "Word lid",
  "hero.winRate": "Winst %",
  "hero.today": "Vandaag",
  "hero.wins": "Gewonnen",

  "lang.label": "Taal",
  "lang.switch": "Wissel taal",
};

/* ── German ────────────────────────────────────────────────── */
const de: Dictionary = {
  "nav.predictions": "Prognosen",
  "nav.howItWorks": "So funktioniert's",
  "nav.trackRecord": "Erfolgsbilanz",
  "nav.pricing": "Preise",
  "nav.login": "Anmelden",
  "nav.startFreeTrial": "Kostenlos testen",
  "nav.menu": "Menü",
  "nav.getStarted": "Jetzt starten",
  "nav.joinBlurb":
    "Schließ dich 1.500+ Analysten an und erhalte noch heute datengetriebene Prognosen.",

  "hero.badge": "Sei den Buchmachern voraus",
  "hero.titleLine1": "Die besten KI-gestützten",
  "hero.titleLine2": "Sport-Prognosen",
  "hero.titleLine3": "für deinen Vorteil.",
  "hero.subtitle":
    "BetsPlug vereint Daten, Elo-Ratings, Poisson-Modelle und maschinelles Lernen auf einer Plattform. Live-Wahrscheinlichkeiten, tiefe Einblicke und nachgewiesene Ergebnisse — für ernsthafte Sportanalysten.",
  "hero.activeUsers": "Aktive Nutzer",
  "hero.ctaPrimary": "Prognosen ansehen",
  "hero.ctaSecondary": "So funktioniert's",
  "hero.livePick": "Live-Tipp",
  "hero.hot": "Hot",
  "hero.homeWin": "Heimsieg",
  "hero.draw": "Unentschieden",
  "hero.away": "Auswärts",
  "hero.confidence": "Sicherheit",
  "hero.edge": "Vorteil",
  "hero.joinNow": "Beitreten",
  "hero.winRate": "Trefferquote",
  "hero.today": "Heute",
  "hero.wins": "Siege",

  "lang.label": "Sprache",
  "lang.switch": "Sprache wechseln",
};

/* ── French ────────────────────────────────────────────────── */
const fr: Dictionary = {
  "nav.predictions": "Prédictions",
  "nav.howItWorks": "Comment ça marche",
  "nav.trackRecord": "Historique",
  "nav.pricing": "Tarifs",
  "nav.login": "Connexion",
  "nav.startFreeTrial": "Essai gratuit",
  "nav.menu": "Menu",
  "nav.getStarted": "Commencer",
  "nav.joinBlurb":
    "Rejoignez plus de 1 500 analystes et obtenez des prédictions fondées sur les données dès aujourd'hui.",

  "hero.badge": "Gardez une longueur d'avance sur les bookmakers",
  "hero.titleLine1": "Les meilleures prédictions",
  "hero.titleLine2": "sportives par IA",
  "hero.titleLine3": "à votre avantage.",
  "hero.subtitle":
    "BetsPlug réunit données, classements Elo, modèles de Poisson et machine learning sur une seule plateforme. Probabilités en direct, analyses approfondies, historique prouvé — pensé pour les analystes sportifs exigeants.",
  "hero.activeUsers": "Utilisateurs actifs",
  "hero.ctaPrimary": "Voir les prédictions",
  "hero.ctaSecondary": "Comment ça marche",
  "hero.livePick": "Pick en direct",
  "hero.hot": "Hot",
  "hero.homeWin": "Victoire domicile",
  "hero.draw": "Nul",
  "hero.away": "Extérieur",
  "hero.confidence": "Confiance",
  "hero.edge": "Avantage",
  "hero.joinNow": "Rejoindre",
  "hero.winRate": "Taux de réussite",
  "hero.today": "Aujourd'hui",
  "hero.wins": "Victoires",

  "lang.label": "Langue",
  "lang.switch": "Changer de langue",
};

/* ── Spanish ───────────────────────────────────────────────── */
const es: Dictionary = {
  "nav.predictions": "Predicciones",
  "nav.howItWorks": "Cómo funciona",
  "nav.trackRecord": "Historial",
  "nav.pricing": "Precios",
  "nav.login": "Entrar",
  "nav.startFreeTrial": "Prueba gratis",
  "nav.menu": "Menú",
  "nav.getStarted": "Empezar",
  "nav.joinBlurb":
    "Únete a más de 1.500 analistas y obtén predicciones basadas en datos hoy mismo.",

  "hero.badge": "Adelántate a las casas de apuestas",
  "hero.titleLine1": "Las mejores predicciones",
  "hero.titleLine2": "deportivas con IA",
  "hero.titleLine3": "para tu ventaja.",
  "hero.subtitle":
    "BetsPlug combina datos, Elo, modelos de Poisson y machine learning en una sola plataforma. Probabilidades en vivo, análisis profundos y un historial comprobado — creado para analistas deportivos serios.",
  "hero.activeUsers": "Usuarios activos",
  "hero.ctaPrimary": "Ver predicciones",
  "hero.ctaSecondary": "Cómo funciona",
  "hero.livePick": "Pick en vivo",
  "hero.hot": "Hot",
  "hero.homeWin": "Victoria local",
  "hero.draw": "Empate",
  "hero.away": "Visitante",
  "hero.confidence": "Confianza",
  "hero.edge": "Ventaja",
  "hero.joinNow": "Unirse",
  "hero.winRate": "% Aciertos",
  "hero.today": "Hoy",
  "hero.wins": "Victorias",

  "lang.label": "Idioma",
  "lang.switch": "Cambiar idioma",
};

/* ── Italian ───────────────────────────────────────────────── */
const it: Dictionary = {
  "nav.predictions": "Pronostici",
  "nav.howItWorks": "Come funziona",
  "nav.trackRecord": "Storico",
  "nav.pricing": "Prezzi",
  "nav.login": "Accedi",
  "nav.startFreeTrial": "Prova gratis",
  "nav.menu": "Menu",
  "nav.getStarted": "Inizia",
  "nav.joinBlurb":
    "Unisciti a oltre 1.500 analisti e ottieni pronostici basati sui dati oggi stesso.",

  "hero.badge": "Anticipa i bookmaker",
  "hero.titleLine1": "I migliori pronostici",
  "hero.titleLine2": "sportivi con AI",
  "hero.titleLine3": "per il tuo vantaggio.",
  "hero.subtitle":
    "BetsPlug combina dati, Elo, modelli di Poisson e machine learning in un'unica piattaforma. Probabilità live, analisi approfondite e uno storico comprovato — pensato per analisti sportivi seri.",
  "hero.activeUsers": "Utenti attivi",
  "hero.ctaPrimary": "Vedi pronostici",
  "hero.ctaSecondary": "Come funziona",
  "hero.livePick": "Pick live",
  "hero.hot": "Hot",
  "hero.homeWin": "Vittoria casa",
  "hero.draw": "Pareggio",
  "hero.away": "Trasferta",
  "hero.confidence": "Sicurezza",
  "hero.edge": "Vantaggio",
  "hero.joinNow": "Iscriviti",
  "hero.winRate": "% Vittorie",
  "hero.today": "Oggi",
  "hero.wins": "Vittorie",

  "lang.label": "Lingua",
  "lang.switch": "Cambia lingua",
};

export const messages: Record<Locale, Dictionary> = { en, nl, de, fr, es, it };

/** Resolve a key for a locale, falling back to English if missing. */
export function translate(locale: Locale, key: TranslationKey): string {
  return messages[locale]?.[key] ?? en[key];
}
