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

  /* Comparison table */
  "comparison.badge": "Why BetsPlug",
  "comparison.titleA": "Not all prediction sites",
  "comparison.titleB": "are built the same.",
  "comparison.subtitle":
    "Here's exactly what separates BetsPlug from typical tipster sites — no fine print, no cherry-picked wins.",
  "comparison.feature": "Feature",
  "comparison.winner": "Winner",
  "comparison.others": "Others",
  "comparison.typicalTipsters": "Typical tipsters",
  "comparison.finalScore": "Final score",
  "comparison.fullHouse": "Full house",
  "comparison.fallsShort": "Falls short",
  "comparison.caption":
    "Comparison based on publicly available information from leading tipster platforms as of 2026.",

  /* How it works */
  "how.badge": "How it works",
  "how.title": "From signup to smarter picks in 3 steps.",
  "how.subtitle":
    "A simple, transparent workflow built around data — no hype, no guesswork.",
  "how.step1Title": "Create your account",
  "how.step1Desc":
    "Sign up for free in seconds. No credit card required to explore our daily value picks.",
  "how.step2Title": "Explore AI predictions",
  "how.step2Desc":
    "Four AI models combine live odds, Elo, form and historical data to surface real edges.",
  "how.step3Title": "Make smarter decisions",
  "how.step3Desc":
    "Use transparent probabilities, edges and confidence scores to bet with conviction.",

  /* Pricing */
  "pricing.badge": "Pricing",
  "pricing.title": "Simple pricing. Serious edge.",
  "pricing.subtitle":
    "Start free. Upgrade when you're ready. Cancel anytime.",
  "pricing.monthly": "Monthly",
  "pricing.yearly": "Yearly",
  "pricing.save": "Save 20%",
  "pricing.savingNote": "You're saving 2 months",
  "pricing.mostPopular": "Most popular",
  "pricing.ctaFree": "Start free",
  "pricing.ctaUpgrade": "Upgrade",
  "pricing.ctaLifetime": "Get lifetime access",

  /* Final CTA */
  "cta.badge": "Ready to win smarter?",
  "cta.title": "Start your data-driven edge today.",
  "cta.subtitle":
    "Join 1,500+ analysts already using BetsPlug to make sharper, calmer, data-backed decisions.",
  "cta.primary": "Start Free Trial",
  "cta.secondary": "View Predictions",

  /* Footer */
  "footer.premiumBadge": "Premium access",
  "footer.premiumTitleA": "Join our",
  "footer.premiumTitleB": "Premium Telegram",
  "footer.premiumTitleC": "group",
  "footer.premiumSubtitle":
    "Get real-time picks, edge alerts and live chat with our AI analysts. Be the first to know when a high-value match hits the board — straight in your pocket.",
  "footer.perk1": "Instant value alerts",
  "footer.perk2": "Private analyst Q&A",
  "footer.perk3": "Daily free picks",
  "footer.perk4": "VIP-only deep dives",
  "footer.joinCta": "Join the Premium Group",
  "footer.limited": "Limited spots · Members only",
  "footer.onlineNow": "1,200+ members online",
  "footer.brandTagline":
    "BetsPlug unites data, Elo ratings, Poisson models and machine learning into one platform — built for serious sports analysts who refuse to guess.",
  "footer.product": "Product",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.secureTitle": "Secure payments",
  "footer.secureDesc": "256-bit SSL encrypted checkout",
  "footer.pciCompliant": "PCI DSS compliant",
  "footer.copyright":
    "All rights reserved. BetsPlug is a data & analytics platform — not a gambling operator.",
  "footer.responsible": "18+ Play responsibly",
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

  "comparison.badge": "Waarom BetsPlug",
  "comparison.titleA": "Niet elke voorspelsite",
  "comparison.titleB": "is hetzelfde gebouwd.",
  "comparison.subtitle":
    "Dit is precies wat BetsPlug onderscheidt van gewone tipstersites — geen kleine lettertjes, geen uitgekozen successen.",
  "comparison.feature": "Functie",
  "comparison.winner": "Winnaar",
  "comparison.others": "Anderen",
  "comparison.typicalTipsters": "Gewone tipsters",
  "comparison.finalScore": "Eindscore",
  "comparison.fullHouse": "Alles goed",
  "comparison.fallsShort": "Schiet tekort",
  "comparison.caption":
    "Vergelijking gebaseerd op openbaar beschikbare informatie van toonaangevende tipsterplatforms (2026).",

  "how.badge": "Hoe het werkt",
  "how.title": "Van aanmelden tot slimmere picks in 3 stappen.",
  "how.subtitle":
    "Een eenvoudig, transparant proces rond data — geen hype, geen gokken.",
  "how.step1Title": "Maak een account",
  "how.step1Desc":
    "Registreer gratis in enkele seconden. Geen creditcard nodig voor onze dagelijkse value picks.",
  "how.step2Title": "Bekijk AI-voorspellingen",
  "how.step2Desc":
    "Vier AI-modellen combineren live odds, Elo, vorm en historische data voor echte voordelen.",
  "how.step3Title": "Neem slimmere beslissingen",
  "how.step3Desc":
    "Gebruik transparante kansen, voordelen en confidence scores om met overtuiging te kiezen.",

  "pricing.badge": "Prijzen",
  "pricing.title": "Simpele prijzen. Serieus voordeel.",
  "pricing.subtitle":
    "Begin gratis. Upgrade wanneer je wilt. Altijd opzegbaar.",
  "pricing.monthly": "Maandelijks",
  "pricing.yearly": "Jaarlijks",
  "pricing.save": "Bespaar 20%",
  "pricing.savingNote": "Je bespaart 2 maanden",
  "pricing.mostPopular": "Meest gekozen",
  "pricing.ctaFree": "Gratis starten",
  "pricing.ctaUpgrade": "Upgraden",
  "pricing.ctaLifetime": "Lifetime toegang",

  "cta.badge": "Klaar om slimmer te winnen?",
  "cta.title": "Begin vandaag nog je datagedreven voordeel.",
  "cta.subtitle":
    "Sluit je aan bij 1.500+ analisten die BetsPlug al gebruiken voor scherpere, rustigere beslissingen.",
  "cta.primary": "Gratis proberen",
  "cta.secondary": "Bekijk voorspellingen",

  "footer.premiumBadge": "Premium toegang",
  "footer.premiumTitleA": "Word lid van onze",
  "footer.premiumTitleB": "Premium Telegram",
  "footer.premiumTitleC": "groep",
  "footer.premiumSubtitle":
    "Krijg realtime picks, value-alerts en live chat met onze AI-analisten. Wees de eerste die weet wanneer er een hoge-waarde wedstrijd langskomt — direct in je zak.",
  "footer.perk1": "Directe value-alerts",
  "footer.perk2": "Privé Q&A met analisten",
  "footer.perk3": "Dagelijkse gratis picks",
  "footer.perk4": "VIP-only diepgaande analyses",
  "footer.joinCta": "Word lid van de Premium Groep",
  "footer.limited": "Beperkte plekken · Alleen voor leden",
  "footer.onlineNow": "1.200+ leden online",
  "footer.brandTagline":
    "BetsPlug combineert data, Elo-ratings, Poisson-modellen en machine learning in één platform — gemaakt voor serieuze sportanalisten die niet willen gokken.",
  "footer.product": "Product",
  "footer.company": "Bedrijf",
  "footer.legal": "Juridisch",
  "footer.secureTitle": "Veilige betalingen",
  "footer.secureDesc": "256-bit SSL versleutelde checkout",
  "footer.pciCompliant": "PCI DSS gecertificeerd",
  "footer.copyright":
    "Alle rechten voorbehouden. BetsPlug is een data- & analyseplatform — geen gokaanbieder.",
  "footer.responsible": "18+ Speel verantwoord",
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

  "comparison.badge": "Warum BetsPlug",
  "comparison.titleA": "Nicht alle Prognose-Seiten",
  "comparison.titleB": "sind gleich gebaut.",
  "comparison.subtitle":
    "Genau das unterscheidet BetsPlug von typischen Tipster-Seiten — kein Kleingedrucktes, keine Rosinenpickerei.",
  "comparison.feature": "Funktion",
  "comparison.winner": "Sieger",
  "comparison.others": "Andere",
  "comparison.typicalTipsters": "Typische Tipster",
  "comparison.finalScore": "Endstand",
  "comparison.fullHouse": "Alles erfüllt",
  "comparison.fallsShort": "Ungenügend",
  "comparison.caption":
    "Vergleich basierend auf öffentlich verfügbaren Informationen führender Tipster-Plattformen (2026).",

  "how.badge": "So funktioniert's",
  "how.title": "Von der Anmeldung zu klügeren Picks in 3 Schritten.",
  "how.subtitle":
    "Ein einfacher, transparenter Workflow rund um Daten — kein Hype, kein Rätselraten.",
  "how.step1Title": "Konto erstellen",
  "how.step1Desc":
    "Kostenlos in Sekunden registrieren. Keine Kreditkarte nötig für unsere täglichen Value-Picks.",
  "how.step2Title": "KI-Prognosen entdecken",
  "how.step2Desc":
    "Vier KI-Modelle kombinieren Live-Quoten, Elo, Form und historische Daten für echte Vorteile.",
  "how.step3Title": "Klügere Entscheidungen treffen",
  "how.step3Desc":
    "Nutze transparente Wahrscheinlichkeiten, Vorteile und Confidence-Scores mit voller Überzeugung.",

  "pricing.badge": "Preise",
  "pricing.title": "Einfache Preise. Echter Vorteil.",
  "pricing.subtitle":
    "Starte kostenlos. Upgrade jederzeit. Jederzeit kündbar.",
  "pricing.monthly": "Monatlich",
  "pricing.yearly": "Jährlich",
  "pricing.save": "20% sparen",
  "pricing.savingNote": "Du sparst 2 Monate",
  "pricing.mostPopular": "Am beliebtesten",
  "pricing.ctaFree": "Kostenlos starten",
  "pricing.ctaUpgrade": "Upgrade",
  "pricing.ctaLifetime": "Lifetime-Zugang",

  "cta.badge": "Bereit, klüger zu gewinnen?",
  "cta.title": "Starte heute deinen datengetriebenen Vorteil.",
  "cta.subtitle":
    "Schließ dich 1.500+ Analysten an, die BetsPlug bereits für schärfere, ruhigere Entscheidungen nutzen.",
  "cta.primary": "Kostenlos testen",
  "cta.secondary": "Prognosen ansehen",

  "footer.premiumBadge": "Premium-Zugang",
  "footer.premiumTitleA": "Tritt unserer",
  "footer.premiumTitleB": "Premium Telegram",
  "footer.premiumTitleC": "Gruppe bei",
  "footer.premiumSubtitle":
    "Erhalte Echtzeit-Picks, Edge-Alerts und Live-Chat mit unseren KI-Analysten. Sei der Erste, der erfährt, wann ein hoch bewerteter Match reinkommt — direkt in deine Tasche.",
  "footer.perk1": "Sofortige Value-Alerts",
  "footer.perk2": "Privates Analysten-Q&A",
  "footer.perk3": "Tägliche kostenlose Picks",
  "footer.perk4": "Exklusive VIP-Analysen",
  "footer.joinCta": "Der Premium-Gruppe beitreten",
  "footer.limited": "Begrenzte Plätze · Nur für Mitglieder",
  "footer.onlineNow": "1.200+ Mitglieder online",
  "footer.brandTagline":
    "BetsPlug vereint Daten, Elo-Ratings, Poisson-Modelle und maschinelles Lernen auf einer Plattform — für ernsthafte Sportanalysten, die nicht raten wollen.",
  "footer.product": "Produkt",
  "footer.company": "Unternehmen",
  "footer.legal": "Rechtliches",
  "footer.secureTitle": "Sichere Zahlungen",
  "footer.secureDesc": "256-Bit-SSL verschlüsselter Checkout",
  "footer.pciCompliant": "PCI DSS konform",
  "footer.copyright":
    "Alle Rechte vorbehalten. BetsPlug ist eine Daten- & Analyseplattform — kein Buchmacher.",
  "footer.responsible": "18+ Spiele verantwortungsvoll",
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

  "comparison.badge": "Pourquoi BetsPlug",
  "comparison.titleA": "Tous les sites de pronostics",
  "comparison.titleB": "ne se valent pas.",
  "comparison.subtitle":
    "Voici exactement ce qui distingue BetsPlug des sites de tipsters classiques — aucune petite ligne, aucune victoire triée sur le volet.",
  "comparison.feature": "Fonction",
  "comparison.winner": "Gagnant",
  "comparison.others": "Autres",
  "comparison.typicalTipsters": "Tipsters classiques",
  "comparison.finalScore": "Score final",
  "comparison.fullHouse": "Sans-faute",
  "comparison.fallsShort": "Insuffisant",
  "comparison.caption":
    "Comparaison basée sur les informations publiquement disponibles des principales plateformes de tipsters (2026).",

  "how.badge": "Comment ça marche",
  "how.title": "De l'inscription à des picks plus intelligents en 3 étapes.",
  "how.subtitle":
    "Un workflow simple et transparent axé sur les données — ni hype, ni devinettes.",
  "how.step1Title": "Créez votre compte",
  "how.step1Desc":
    "Inscription gratuite en quelques secondes. Aucune carte bancaire requise pour nos picks de valeur quotidiens.",
  "how.step2Title": "Explorez les prédictions IA",
  "how.step2Desc":
    "Quatre modèles d'IA combinent cotes en direct, Elo, forme et historique pour révéler de vrais avantages.",
  "how.step3Title": "Prenez de meilleures décisions",
  "how.step3Desc":
    "Utilisez des probabilités, avantages et scores de confiance transparents pour parier avec conviction.",

  "pricing.badge": "Tarifs",
  "pricing.title": "Tarifs simples. Avantage sérieux.",
  "pricing.subtitle":
    "Commencez gratuitement. Passez payant quand vous voulez. Annulation à tout moment.",
  "pricing.monthly": "Mensuel",
  "pricing.yearly": "Annuel",
  "pricing.save": "Économisez 20%",
  "pricing.savingNote": "Vous économisez 2 mois",
  "pricing.mostPopular": "Le plus populaire",
  "pricing.ctaFree": "Commencer gratuitement",
  "pricing.ctaUpgrade": "Passer payant",
  "pricing.ctaLifetime": "Accès à vie",

  "cta.badge": "Prêt à gagner plus intelligemment ?",
  "cta.title": "Lancez dès aujourd'hui votre avantage fondé sur les données.",
  "cta.subtitle":
    "Rejoignez plus de 1 500 analystes qui utilisent déjà BetsPlug pour des décisions plus nettes et plus sereines.",
  "cta.primary": "Essai gratuit",
  "cta.secondary": "Voir les prédictions",

  "footer.premiumBadge": "Accès premium",
  "footer.premiumTitleA": "Rejoignez notre",
  "footer.premiumTitleB": "groupe Telegram",
  "footer.premiumTitleC": "Premium",
  "footer.premiumSubtitle":
    "Recevez des picks en temps réel, des alertes de valeur et un chat en direct avec nos analystes IA. Soyez le premier informé dès qu'un match à forte valeur arrive — directement dans votre poche.",
  "footer.perk1": "Alertes de valeur instantanées",
  "footer.perk2": "Q&A privé avec les analystes",
  "footer.perk3": "Picks gratuits quotidiens",
  "footer.perk4": "Analyses exclusives VIP",
  "footer.joinCta": "Rejoindre le groupe Premium",
  "footer.limited": "Places limitées · Réservé aux membres",
  "footer.onlineNow": "1 200+ membres en ligne",
  "footer.brandTagline":
    "BetsPlug réunit données, classements Elo, modèles de Poisson et machine learning sur une seule plateforme — pensé pour les analystes sportifs exigeants qui refusent de deviner.",
  "footer.product": "Produit",
  "footer.company": "Société",
  "footer.legal": "Mentions légales",
  "footer.secureTitle": "Paiements sécurisés",
  "footer.secureDesc": "Paiement chiffré SSL 256 bits",
  "footer.pciCompliant": "Conforme PCI DSS",
  "footer.copyright":
    "Tous droits réservés. BetsPlug est une plateforme de données & d'analyses — pas un opérateur de jeu.",
  "footer.responsible": "18+ Jouez de manière responsable",
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

  "comparison.badge": "Por qué BetsPlug",
  "comparison.titleA": "No todas las webs de predicciones",
  "comparison.titleB": "están hechas igual.",
  "comparison.subtitle":
    "Esto es exactamente lo que separa a BetsPlug de los típicos sitios de tipsters — sin letra pequeña, sin victorias cuidadosamente seleccionadas.",
  "comparison.feature": "Función",
  "comparison.winner": "Ganador",
  "comparison.others": "Otros",
  "comparison.typicalTipsters": "Tipsters típicos",
  "comparison.finalScore": "Puntuación final",
  "comparison.fullHouse": "Pleno",
  "comparison.fallsShort": "Se queda corto",
  "comparison.caption":
    "Comparación basada en información pública de las principales plataformas de tipsters (2026).",

  "how.badge": "Cómo funciona",
  "how.title": "Del registro a picks más inteligentes en 3 pasos.",
  "how.subtitle":
    "Un flujo simple y transparente alrededor de los datos — sin hype, sin adivinanzas.",
  "how.step1Title": "Crea tu cuenta",
  "how.step1Desc":
    "Regístrate gratis en segundos. No se necesita tarjeta para explorar nuestros picks diarios.",
  "how.step2Title": "Explora predicciones IA",
  "how.step2Desc":
    "Cuatro modelos de IA combinan cuotas en vivo, Elo, forma e historial para revelar ventajas reales.",
  "how.step3Title": "Toma decisiones más inteligentes",
  "how.step3Desc":
    "Usa probabilidades, ventajas y niveles de confianza transparentes para apostar con convicción.",

  "pricing.badge": "Precios",
  "pricing.title": "Precios simples. Ventaja seria.",
  "pricing.subtitle":
    "Empieza gratis. Actualiza cuando quieras. Cancela cuando quieras.",
  "pricing.monthly": "Mensual",
  "pricing.yearly": "Anual",
  "pricing.save": "Ahorra 20%",
  "pricing.savingNote": "Ahorras 2 meses",
  "pricing.mostPopular": "Más popular",
  "pricing.ctaFree": "Empieza gratis",
  "pricing.ctaUpgrade": "Actualizar",
  "pricing.ctaLifetime": "Acceso de por vida",

  "cta.badge": "¿Listo para ganar más inteligente?",
  "cta.title": "Empieza hoy tu ventaja basada en datos.",
  "cta.subtitle":
    "Únete a más de 1.500 analistas que ya usan BetsPlug para decisiones más nítidas y tranquilas.",
  "cta.primary": "Prueba gratis",
  "cta.secondary": "Ver predicciones",

  "footer.premiumBadge": "Acceso premium",
  "footer.premiumTitleA": "Únete a nuestro",
  "footer.premiumTitleB": "grupo Telegram",
  "footer.premiumTitleC": "Premium",
  "footer.premiumSubtitle":
    "Obtén picks en tiempo real, alertas de valor y chat en vivo con nuestros analistas IA. Sé el primero en saberlo cuando aparezca un partido de alto valor — directamente en tu bolsillo.",
  "footer.perk1": "Alertas de valor instantáneas",
  "footer.perk2": "Q&A privado con analistas",
  "footer.perk3": "Picks gratis diarios",
  "footer.perk4": "Análisis exclusivos VIP",
  "footer.joinCta": "Unirse al grupo Premium",
  "footer.limited": "Plazas limitadas · Solo miembros",
  "footer.onlineNow": "1.200+ miembros en línea",
  "footer.brandTagline":
    "BetsPlug combina datos, ratings Elo, modelos de Poisson y machine learning en una sola plataforma — creado para analistas deportivos serios que no quieren adivinar.",
  "footer.product": "Producto",
  "footer.company": "Empresa",
  "footer.legal": "Legal",
  "footer.secureTitle": "Pagos seguros",
  "footer.secureDesc": "Pago cifrado SSL 256 bits",
  "footer.pciCompliant": "Conforme PCI DSS",
  "footer.copyright":
    "Todos los derechos reservados. BetsPlug es una plataforma de datos y análisis — no un operador de apuestas.",
  "footer.responsible": "18+ Juega con responsabilidad",
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

  "comparison.badge": "Perché BetsPlug",
  "comparison.titleA": "Non tutti i siti di pronostici",
  "comparison.titleB": "sono uguali.",
  "comparison.subtitle":
    "Ecco esattamente cosa distingue BetsPlug dai tipici siti di tipster — nessuna riga in piccolo, nessuna vittoria scelta a caso.",
  "comparison.feature": "Funzione",
  "comparison.winner": "Vincitore",
  "comparison.others": "Altri",
  "comparison.typicalTipsters": "Tipster tipici",
  "comparison.finalScore": "Punteggio finale",
  "comparison.fullHouse": "Pieno",
  "comparison.fallsShort": "Insufficiente",
  "comparison.caption":
    "Confronto basato su informazioni pubbliche delle principali piattaforme di tipster (2026).",

  "how.badge": "Come funziona",
  "how.title": "Dall'iscrizione a pick più intelligenti in 3 passi.",
  "how.subtitle":
    "Un flusso semplice e trasparente attorno ai dati — niente hype, niente congetture.",
  "how.step1Title": "Crea il tuo account",
  "how.step1Desc":
    "Iscriviti gratis in pochi secondi. Nessuna carta richiesta per esplorare i nostri value pick quotidiani.",
  "how.step2Title": "Esplora i pronostici IA",
  "how.step2Desc":
    "Quattro modelli IA combinano quote live, Elo, forma e storico per rivelare veri vantaggi.",
  "how.step3Title": "Prendi decisioni più intelligenti",
  "how.step3Desc":
    "Usa probabilità, vantaggi e punteggi di confidenza trasparenti per scommettere con convinzione.",

  "pricing.badge": "Prezzi",
  "pricing.title": "Prezzi semplici. Vantaggio serio.",
  "pricing.subtitle":
    "Inizia gratis. Passa a pagamento quando vuoi. Cancella in qualsiasi momento.",
  "pricing.monthly": "Mensile",
  "pricing.yearly": "Annuale",
  "pricing.save": "Risparmi il 20%",
  "pricing.savingNote": "Stai risparmiando 2 mesi",
  "pricing.mostPopular": "Più popolare",
  "pricing.ctaFree": "Inizia gratis",
  "pricing.ctaUpgrade": "Aggiorna",
  "pricing.ctaLifetime": "Accesso a vita",

  "cta.badge": "Pronto a vincere in modo più intelligente?",
  "cta.title": "Inizia oggi il tuo vantaggio basato sui dati.",
  "cta.subtitle":
    "Unisciti a oltre 1.500 analisti che usano già BetsPlug per decisioni più nitide e tranquille.",
  "cta.primary": "Prova gratuita",
  "cta.secondary": "Vedi pronostici",

  "footer.premiumBadge": "Accesso premium",
  "footer.premiumTitleA": "Unisciti al nostro",
  "footer.premiumTitleB": "gruppo Telegram",
  "footer.premiumTitleC": "Premium",
  "footer.premiumSubtitle":
    "Ricevi pick in tempo reale, avvisi di valore e chat live con i nostri analisti IA. Sii il primo a sapere quando arriva una partita ad alto valore — direttamente in tasca.",
  "footer.perk1": "Avvisi di valore istantanei",
  "footer.perk2": "Q&A privato con gli analisti",
  "footer.perk3": "Pick gratuiti quotidiani",
  "footer.perk4": "Analisi esclusive VIP",
  "footer.joinCta": "Entra nel gruppo Premium",
  "footer.limited": "Posti limitati · Solo membri",
  "footer.onlineNow": "1.200+ membri online",
  "footer.brandTagline":
    "BetsPlug combina dati, rating Elo, modelli di Poisson e machine learning in un'unica piattaforma — pensato per analisti sportivi seri che non vogliono tirare a indovinare.",
  "footer.product": "Prodotto",
  "footer.company": "Azienda",
  "footer.legal": "Legale",
  "footer.secureTitle": "Pagamenti sicuri",
  "footer.secureDesc": "Checkout cifrato SSL 256 bit",
  "footer.pciCompliant": "Conforme PCI DSS",
  "footer.copyright":
    "Tutti i diritti riservati. BetsPlug è una piattaforma di dati e analisi — non un operatore di scommesse.",
  "footer.responsible": "18+ Gioca responsabilmente",
};

export const messages: Record<Locale, Dictionary> = { en, nl, de, fr, es, it };

/** Resolve a key for a locale, falling back to English if missing. */
export function translate(locale: Locale, key: TranslationKey): string {
  return messages[locale]?.[key] ?? en[key];
}
