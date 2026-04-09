"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// Language definitions
// ---------------------------------------------------------------------------

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English",    flag: "🇬🇧" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "de", name: "Deutsch",    flag: "🇩🇪" },
  { code: "fr", name: "Français",   flag: "🇫🇷" },
  { code: "es", name: "Español",    flag: "🇪🇸" },
];

// ---------------------------------------------------------------------------
// Translation table
// ---------------------------------------------------------------------------

type TranslationKey =
  // Navigation
  | "nav.about"
  | "nav.dashboard"
  | "nav.search"
  | "nav.live_matches"
  | "nav.bet_of_the_day"
  | "nav.predictions"
  | "nav.strategy_lab"
  | "nav.trackrecord"
  | "nav.reports"
  | "nav.admin"
  | "nav.settings"
  | "nav.deals"
  // Page titles
  | "page.dashboard"
  | "page.search"
  | "page.live_matches"
  | "page.predictions"
  | "page.strategy_lab"
  | "page.trackrecord"
  | "page.reports"
  | "page.admin"
  | "page.settings"
  | "page.deals"
  // Common labels
  | "common.dashboard"
  | "common.search"
  | "common.live_matches"
  | "common.predictions"
  | "common.strategy_lab"
  | "common.trackrecord"
  | "common.reports"
  | "common.admin"
  | "common.settings"
  | "common.deals"
  | "common.win"
  | "common.loss"
  | "common.draw"
  | "common.home"
  | "common.away"
  | "common.confidence"
  | "common.probability"
  | "common.accuracy"
  | "common.loading"
  | "common.error"
  | "common.no_data"
  | "common.save"
  | "common.cancel"
  | "common.confirm"
  | "common.close"
  | "common.back"
  | "common.next"
  | "common.submit"
  | "common.refresh"
  | "common.export"
  | "common.filter"
  | "common.sort"
  | "common.search_placeholder"
  | "common.language"
  | "common.notifications"
  | "common.sign_out"
  | "common.all_systems"
  // Common phrases
  | "phrase.simulation_disclaimer"
  | "phrase.educational_only"
  | "phrase.no_financial_advice"
  | "phrase.live_data"
  | "phrase.last_updated"
  | "phrase.view_all"
  | "phrase.see_details"
  | "phrase.select_language";

type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = {
  en: {
    // Navigation
    "nav.about":          "About",
    "nav.dashboard":     "Dashboard",
    "nav.bet_of_the_day": "Pick of the Day",
    "nav.search":        "Search",
    "nav.live_matches":  "Live Matches",
    "nav.predictions":   "Predictions",
    "nav.strategy_lab":  "Strategy Lab",
    "nav.trackrecord":   "Trackrecord",
    "nav.reports":       "Reports",
    "nav.admin":         "Admin",
    "nav.settings":      "Settings",
    "nav.deals":         "Deals",
    // Page titles
    "page.dashboard":    "Dashboard",
    "page.search":       "Search",
    "page.live_matches": "Live Matches",
    "page.predictions":  "Predictions",
    "page.strategy_lab": "Strategy Lab",
    "page.trackrecord":  "Trackrecord",
    "page.reports":      "Reports",
    "page.admin":        "Admin Panel",
    "page.settings":     "Settings",
    "page.deals":        "Deals",
    // Common labels
    "common.dashboard":          "Dashboard",
    "common.search":             "Search",
    "common.live_matches":       "Live Matches",
    "common.predictions":        "Predictions",
    "common.strategy_lab":       "Strategy Lab",
    "common.trackrecord":        "Trackrecord",
    "common.reports":            "Reports",
    "common.admin":              "Admin",
    "common.settings":           "Settings",
    "common.deals":              "Deals",
    "common.win":                "Win",
    "common.loss":               "Loss",
    "common.draw":               "Draw",
    "common.home":               "Home",
    "common.away":               "Away",
    "common.confidence":         "Confidence",
    "common.probability":        "Probability",
    "common.accuracy":           "Accuracy",
    "common.loading":            "Loading...",
    "common.error":              "Error",
    "common.no_data":            "No data available",
    "common.save":               "Save",
    "common.cancel":             "Cancel",
    "common.confirm":            "Confirm",
    "common.close":              "Close",
    "common.back":               "Back",
    "common.next":               "Next",
    "common.submit":             "Submit",
    "common.refresh":            "Refresh",
    "common.export":             "Export",
    "common.filter":             "Filter",
    "common.sort":               "Sort",
    "common.search_placeholder": "Search teams, matches, leagues...",
    "common.language":           "Language",
    "common.notifications":      "Notifications",
    "common.sign_out":           "Sign out",
    "common.all_systems":        "All systems operational",
    // Phrases
    "phrase.simulation_disclaimer": "Results shown are based on simulated model outputs.",
    "phrase.educational_only":      "For analytical & educational purposes only.",
    "phrase.no_financial_advice":   "Not financial advice.",
    "phrase.live_data":             "Live data",
    "phrase.last_updated":          "Last updated",
    "phrase.view_all":              "View all",
    "phrase.see_details":           "See details",
    "phrase.select_language":       "Select language",
  },

  nl: {
    "nav.about":          "Over ons",
    "nav.dashboard":     "Dashboard",
    "nav.bet_of_the_day": "Tip van de Dag",
    "nav.search":        "Zoeken",
    "nav.live_matches":  "Live Wedstrijden",
    "nav.predictions":   "Voorspellingen",
    "nav.strategy_lab":  "Strategie Lab",
    "nav.trackrecord":   "Trackrecord",
    "nav.reports":       "Rapporten",
    "nav.admin":         "Beheer",
    "nav.settings":      "Instellingen",
    "nav.deals":         "Aanbiedingen",
    "page.dashboard":    "Dashboard",
    "page.search":       "Zoeken",
    "page.live_matches": "Live Wedstrijden",
    "page.predictions":  "Voorspellingen",
    "page.strategy_lab": "Strategie Lab",
    "page.trackrecord":  "Trackrecord",
    "page.reports":      "Rapporten",
    "page.admin":        "Beheerpaneel",
    "page.settings":     "Instellingen",
    "page.deals":        "Aanbiedingen",
    "common.dashboard":          "Dashboard",
    "common.search":             "Zoeken",
    "common.live_matches":       "Live Wedstrijden",
    "common.predictions":        "Voorspellingen",
    "common.strategy_lab":       "Strategie Lab",
    "common.trackrecord":        "Trackrecord",
    "common.reports":            "Rapporten",
    "common.admin":              "Beheer",
    "common.settings":           "Instellingen",
    "common.deals":              "Aanbiedingen",
    "common.win":                "Winst",
    "common.loss":               "Verlies",
    "common.draw":               "Gelijkspel",
    "common.home":               "Thuis",
    "common.away":               "Uit",
    "common.confidence":         "Betrouwbaarheid",
    "common.probability":        "Kans",
    "common.accuracy":           "Nauwkeurigheid",
    "common.loading":            "Laden...",
    "common.error":              "Fout",
    "common.no_data":            "Geen gegevens beschikbaar",
    "common.save":               "Opslaan",
    "common.cancel":             "Annuleren",
    "common.confirm":            "Bevestigen",
    "common.close":              "Sluiten",
    "common.back":               "Terug",
    "common.next":               "Volgende",
    "common.submit":             "Verzenden",
    "common.refresh":            "Verversen",
    "common.export":             "Exporteren",
    "common.filter":             "Filteren",
    "common.sort":               "Sorteren",
    "common.search_placeholder": "Zoek teams, wedstrijden, competities...",
    "common.language":           "Taal",
    "common.notifications":      "Meldingen",
    "common.sign_out":           "Uitloggen",
    "common.all_systems":        "Alle systemen operationeel",
    "phrase.simulation_disclaimer": "Getoonde resultaten zijn gebaseerd op gesimuleerde modeluitvoer.",
    "phrase.educational_only":      "Alleen voor analytische en educatieve doeleinden.",
    "phrase.no_financial_advice":   "Geen financieel advies.",
    "phrase.live_data":             "Live gegevens",
    "phrase.last_updated":          "Laatst bijgewerkt",
    "phrase.view_all":              "Alles bekijken",
    "phrase.see_details":           "Details bekijken",
    "phrase.select_language":       "Taal selecteren",
  },

  de: {
    "nav.about":          "Über uns",
    "nav.dashboard":     "Dashboard",
    "nav.bet_of_the_day": "Tipp des Tages",
    "nav.search":        "Suche",
    "nav.live_matches":  "Live-Spiele",
    "nav.predictions":   "Vorhersagen",
    "nav.strategy_lab":  "Strategie-Labor",
    "nav.trackrecord":   "Bilanz",
    "nav.reports":       "Berichte",
    "nav.admin":         "Verwaltung",
    "nav.settings":      "Einstellungen",
    "nav.deals":         "Angebote",
    "page.dashboard":    "Dashboard",
    "page.search":       "Suche",
    "page.live_matches": "Live-Spiele",
    "page.predictions":  "Vorhersagen",
    "page.strategy_lab": "Strategie-Labor",
    "page.trackrecord":  "Bilanz",
    "page.reports":      "Berichte",
    "page.admin":        "Administrationspanel",
    "page.settings":     "Einstellungen",
    "page.deals":        "Angebote",
    "common.dashboard":          "Dashboard",
    "common.search":             "Suche",
    "common.live_matches":       "Live-Spiele",
    "common.predictions":        "Vorhersagen",
    "common.strategy_lab":       "Strategie-Labor",
    "common.trackrecord":        "Bilanz",
    "common.reports":            "Berichte",
    "common.admin":              "Verwaltung",
    "common.settings":           "Einstellungen",
    "common.deals":              "Angebote",
    "common.win":                "Sieg",
    "common.loss":               "Niederlage",
    "common.draw":               "Unentschieden",
    "common.home":               "Heim",
    "common.away":               "Auswärts",
    "common.confidence":         "Konfidenz",
    "common.probability":        "Wahrscheinlichkeit",
    "common.accuracy":           "Genauigkeit",
    "common.loading":            "Laden...",
    "common.error":              "Fehler",
    "common.no_data":            "Keine Daten verfügbar",
    "common.save":               "Speichern",
    "common.cancel":             "Abbrechen",
    "common.confirm":            "Bestätigen",
    "common.close":              "Schließen",
    "common.back":               "Zurück",
    "common.next":               "Weiter",
    "common.submit":             "Absenden",
    "common.refresh":            "Aktualisieren",
    "common.export":             "Exportieren",
    "common.filter":             "Filtern",
    "common.sort":               "Sortieren",
    "common.search_placeholder": "Teams, Spiele, Ligen suchen...",
    "common.language":           "Sprache",
    "common.notifications":      "Benachrichtigungen",
    "common.sign_out":           "Abmelden",
    "common.all_systems":        "Alle Systeme betriebsbereit",
    "phrase.simulation_disclaimer": "Gezeigte Ergebnisse basieren auf simulierten Modellausgaben.",
    "phrase.educational_only":      "Nur für analytische und Bildungszwecke.",
    "phrase.no_financial_advice":   "Keine Finanzberatung.",
    "phrase.live_data":             "Live-Daten",
    "phrase.last_updated":          "Zuletzt aktualisiert",
    "phrase.view_all":              "Alle anzeigen",
    "phrase.see_details":           "Details anzeigen",
    "phrase.select_language":       "Sprache auswählen",
  },

  fr: {
    "nav.about":          "À propos",
    "nav.dashboard":     "Tableau de bord",
    "nav.bet_of_the_day": "Pari du Jour",
    "nav.search":        "Recherche",
    "nav.live_matches":  "Matchs en direct",
    "nav.predictions":   "Prédictions",
    "nav.strategy_lab":  "Laboratoire stratégie",
    "nav.trackrecord":   "Historique",
    "nav.reports":       "Rapports",
    "nav.admin":         "Administration",
    "nav.settings":      "Paramètres",
    "nav.deals":         "Offres",
    "page.dashboard":    "Tableau de bord",
    "page.search":       "Recherche",
    "page.live_matches": "Matchs en direct",
    "page.predictions":  "Prédictions",
    "page.strategy_lab": "Laboratoire stratégie",
    "page.trackrecord":  "Historique",
    "page.reports":      "Rapports",
    "page.admin":        "Panneau d'administration",
    "page.settings":     "Paramètres",
    "page.deals":        "Offres",
    "common.dashboard":          "Tableau de bord",
    "common.search":             "Recherche",
    "common.live_matches":       "Matchs en direct",
    "common.predictions":        "Prédictions",
    "common.strategy_lab":       "Laboratoire stratégie",
    "common.trackrecord":        "Historique",
    "common.reports":            "Rapports",
    "common.admin":              "Administration",
    "common.settings":           "Paramètres",
    "common.deals":              "Offres",
    "common.win":                "Victoire",
    "common.loss":               "Défaite",
    "common.draw":               "Match nul",
    "common.home":               "Domicile",
    "common.away":               "Extérieur",
    "common.confidence":         "Confiance",
    "common.probability":        "Probabilité",
    "common.accuracy":           "Précision",
    "common.loading":            "Chargement...",
    "common.error":              "Erreur",
    "common.no_data":            "Aucune donnée disponible",
    "common.save":               "Enregistrer",
    "common.cancel":             "Annuler",
    "common.confirm":            "Confirmer",
    "common.close":              "Fermer",
    "common.back":               "Retour",
    "common.next":               "Suivant",
    "common.submit":             "Soumettre",
    "common.refresh":            "Actualiser",
    "common.export":             "Exporter",
    "common.filter":             "Filtrer",
    "common.sort":               "Trier",
    "common.search_placeholder": "Rechercher équipes, matchs, ligues...",
    "common.language":           "Langue",
    "common.notifications":      "Notifications",
    "common.sign_out":           "Se déconnecter",
    "common.all_systems":        "Tous les systèmes opérationnels",
    "phrase.simulation_disclaimer": "Les résultats affichés sont basés sur des sorties de modèle simulées.",
    "phrase.educational_only":      "À des fins analytiques et éducatives uniquement.",
    "phrase.no_financial_advice":   "Pas de conseil financier.",
    "phrase.live_data":             "Données en direct",
    "phrase.last_updated":          "Dernière mise à jour",
    "phrase.view_all":              "Tout afficher",
    "phrase.see_details":           "Voir les détails",
    "phrase.select_language":       "Sélectionner la langue",
  },

  es: {
    "nav.about":          "Acerca de",
    "nav.dashboard":     "Panel de control",
    "nav.bet_of_the_day": "Apuesta del Día",
    "nav.search":        "Buscar",
    "nav.live_matches":  "Partidos en vivo",
    "nav.predictions":   "Predicciones",
    "nav.strategy_lab":  "Laboratorio estratégico",
    "nav.trackrecord":   "Historial",
    "nav.reports":       "Informes",
    "nav.admin":         "Administración",
    "nav.settings":      "Configuración",
    "nav.deals":         "Ofertas",
    "page.dashboard":    "Panel de control",
    "page.search":       "Buscar",
    "page.live_matches": "Partidos en vivo",
    "page.predictions":  "Predicciones",
    "page.strategy_lab": "Laboratorio estratégico",
    "page.trackrecord":  "Historial",
    "page.reports":      "Informes",
    "page.admin":        "Panel de administración",
    "page.settings":     "Configuración",
    "page.deals":        "Ofertas",
    "common.dashboard":          "Panel de control",
    "common.search":             "Buscar",
    "common.live_matches":       "Partidos en vivo",
    "common.predictions":        "Predicciones",
    "common.strategy_lab":       "Laboratorio estratégico",
    "common.trackrecord":        "Historial",
    "common.reports":            "Informes",
    "common.admin":              "Administración",
    "common.settings":           "Configuración",
    "common.deals":              "Ofertas",
    "common.win":                "Victoria",
    "common.loss":               "Derrota",
    "common.draw":               "Empate",
    "common.home":               "Local",
    "common.away":               "Visitante",
    "common.confidence":         "Confianza",
    "common.probability":        "Probabilidad",
    "common.accuracy":           "Precisión",
    "common.loading":            "Cargando...",
    "common.error":              "Error",
    "common.no_data":            "No hay datos disponibles",
    "common.save":               "Guardar",
    "common.cancel":             "Cancelar",
    "common.confirm":            "Confirmar",
    "common.close":              "Cerrar",
    "common.back":               "Volver",
    "common.next":               "Siguiente",
    "common.submit":             "Enviar",
    "common.refresh":            "Actualizar",
    "common.export":             "Exportar",
    "common.filter":             "Filtrar",
    "common.sort":               "Ordenar",
    "common.search_placeholder": "Buscar equipos, partidos, ligas...",
    "common.language":           "Idioma",
    "common.notifications":      "Notificaciones",
    "common.sign_out":           "Cerrar sesión",
    "common.all_systems":        "Todos los sistemas operativos",
    "phrase.simulation_disclaimer": "Los resultados mostrados se basan en salidas de modelo simuladas.",
    "phrase.educational_only":      "Solo con fines analíticos y educativos.",
    "phrase.no_financial_advice":   "No es asesoramiento financiero.",
    "phrase.live_data":             "Datos en vivo",
    "phrase.last_updated":          "Última actualización",
    "phrase.view_all":              "Ver todo",
    "phrase.see_details":           "Ver detalles",
    "phrase.select_language":       "Seleccionar idioma",
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const STORAGE_KEY = "sip_language";
const DEFAULT_LANG = "en";

/** Get the currently active language code (safe for SSR). */
function getCurrentLang(): string {
  if (typeof window === "undefined") return DEFAULT_LANG;
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANG;
}

/** Persist a language choice to localStorage. */
export function setLanguage(lang: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
  // Dispatch a custom event so components can react without a full reload.
  window.dispatchEvent(new Event("sip_language_change"));
}

/** Translate a key using the currently active language.
 *  Falls back to the English string, then the raw key if nothing is found. */
export function t(key: TranslationKey): string {
  const lang = getCurrentLang();
  const dict = translations[lang] ?? translations[DEFAULT_LANG];
  return dict[key] ?? translations[DEFAULT_LANG][key] ?? key;
}

/** React hook — returns a stable `t` function that re-renders on language change. */
export function useTranslation(): { t: (key: TranslationKey) => string; lang: string } {
  const [lang, setLang] = React.useState<string>(DEFAULT_LANG);

  // Hydrate on mount (avoids SSR mismatch)
  React.useEffect(() => {
    setLang(getCurrentLang());

    function handleChange() {
      setLang(getCurrentLang());
    }

    window.addEventListener("sip_language_change", handleChange);
    return () => window.removeEventListener("sip_language_change", handleChange);
  }, []);

  const translate = React.useCallback(
    (key: TranslationKey): string => {
      const dict = translations[lang] ?? translations[DEFAULT_LANG];
      return dict[key] ?? translations[DEFAULT_LANG][key] ?? key;
    },
    [lang]
  );

  return { t: translate, lang };
}
