/**
 * Locale-aware page metadata
 * ────────────────────────────────────────────────────────────
 * SEO title + description for every static page, in all 8
 * supported locales. Used by generateMetadata() in each page
 * file together with the seo-helpers utilities.
 *
 * Guidelines followed:
 *   - Titles: under 60 characters, brand name at the end
 *   - Descriptions: 120-160 characters, compelling + keyword-rich
 *   - OG title / description optional overrides (shorter, punchier)
 */

import type { Locale } from "@/i18n/config";

export interface PageMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}

export const PAGE_META: Record<string, Record<Locale, PageMeta>> = {
  /* ─────────────────────────── HOME ─────────────────────────── */
  "/": {
    en: {
      title: "BetsPlug - AI-Powered Football Analytics",
      description:
        "Premium AI-powered football analytics. Data-driven predictions, live match tracking, and deep performance insights for smarter betting decisions.",
      ogTitle: "BetsPlug - AI Football Analytics & Predictions",
      ogDescription:
        "Data-driven football predictions powered by AI. Live tracking, performance insights and a verified track record.",
    },
    nl: {
      title: "BetsPlug - AI-gestuurde Voetbalanalyse",
      description:
        "Premium AI-gestuurde voetbalanalyse. Datagedreven voorspellingen, live wedstrijdtracking en diepgaande prestatie-inzichten voor slimmere weddenschappen.",
      ogTitle: "BetsPlug - AI Voetbalanalyse & Voorspellingen",
      ogDescription:
        "Datagedreven voetbalvoorspellingen aangedreven door AI. Live tracking, prestatie-inzichten en een geverifieerd trackrecord.",
    },
    de: {
      title: "BetsPlug - KI-gestuetzte Fussballanalyse",
      description:
        "Premium KI-gestuetzte Fussballanalysen. Datenbasierte Vorhersagen, Live-Tracking und tiefgehende Leistungseinblicke fuer kluge Wettentscheidungen.",
      ogTitle: "BetsPlug - KI Fussballanalyse & Prognosen",
      ogDescription:
        "Datenbasierte Fussballprognosen mit kuenstlicher Intelligenz. Live-Tracking, Leistungsanalysen und verifizierte Ergebnisse.",
    },
    fr: {
      title: "BetsPlug - Analyse Football par IA",
      description:
        "Analyse football premium par IA. Predictions basees sur les donnees, suivi en direct et analyses de performances approfondies pour des paris plus intelligents.",
      ogTitle: "BetsPlug - Analyse & Predictions Football IA",
      ogDescription:
        "Predictions football basees sur l'IA. Suivi en direct, analyses de performance et resultats verifies.",
    },
    es: {
      title: "BetsPlug - Analisis de Futbol con IA",
      description:
        "Analisis de futbol premium con IA. Predicciones basadas en datos, seguimiento en vivo e insights de rendimiento para apuestas mas inteligentes.",
      ogTitle: "BetsPlug - Analisis y Predicciones de Futbol con IA",
      ogDescription:
        "Predicciones de futbol impulsadas por IA. Seguimiento en vivo, analisis de rendimiento y resultados verificados.",
    },
    it: {
      title: "BetsPlug - Analisi Calcio con IA",
      description:
        "Analisi calcistica premium con IA. Previsioni basate sui dati, monitoraggio live e approfondimenti sulle prestazioni per scommesse piu intelligenti.",
      ogTitle: "BetsPlug - Analisi & Pronostici Calcio con IA",
      ogDescription:
        "Pronostici calcistici basati sull'IA. Monitoraggio live, analisi delle prestazioni e risultati verificati.",
    },
    sw: {
      title: "BetsPlug - Uchambuzi wa Mpira kwa AI",
      description:
        "Uchambuzi wa mpira wa miguu wa hali ya juu kwa AI. Utabiri unaotegemea data, ufuatiliaji wa mechi za moja kwa moja na maarifa ya kina ya utendaji.",
      ogTitle: "BetsPlug - Uchambuzi & Utabiri wa Mpira kwa AI",
      ogDescription:
        "Utabiri wa mpira wa miguu unaotegemea AI. Ufuatiliaji wa moja kwa moja na matokeo yaliyothibitishwa.",
    },
    id: {
      title: "BetsPlug - Analisis Sepak Bola Bertenaga AI",
      description:
        "Analisis sepak bola premium bertenaga AI. Prediksi berbasis data, pelacakan pertandingan langsung, dan wawasan performa mendalam untuk taruhan lebih cerdas.",
      ogTitle: "BetsPlug - Analisis & Prediksi Sepak Bola AI",
      ogDescription:
        "Prediksi sepak bola berbasis AI. Pelacakan langsung, analisis performa, dan rekam jejak terverifikasi.",
    },
  },

  /* ─────────────────────────── ARTICLES ─────────────────────── */
  "/articles": {
    en: {
      title: "Football Analysis & AI Betting Articles | BetsPlug",
      description:
        "Football news, AI match breakdowns and data-driven betting insights across the Premier League, La Liga, Bundesliga, Serie A and more from the BetsPlug research team.",
      ogTitle: "Latest Football Analysis - BetsPlug",
      ogDescription:
        "AI football match breakdowns and data-driven betting insights from the BetsPlug research team.",
    },
    nl: {
      title: "Voetbalanalyse & AI Wedartikelen | BetsPlug",
      description:
        "Voetbalnieuws, AI-wedstrijdanalyses en datagedreven wedinzichten voor de Premier League, La Liga, Bundesliga, Serie A en meer van het BetsPlug-team.",
      ogTitle: "Laatste Voetbalanalyse - BetsPlug",
      ogDescription:
        "AI-voetbalanalyses en datagedreven wedinzichten van het BetsPlug-onderzoeksteam.",
    },
    de: {
      title: "Fussballanalyse & KI-Wettartikel | BetsPlug",
      description:
        "Fussballnews, KI-Spielanalysen und datenbasierte Wett-Einblicke fuer Premier League, La Liga, Bundesliga, Serie A und mehr vom BetsPlug-Team.",
      ogTitle: "Aktuelle Fussballanalyse - BetsPlug",
      ogDescription:
        "KI-Fussballanalysen und datenbasierte Wett-Einblicke vom BetsPlug-Forschungsteam.",
    },
    fr: {
      title: "Analyse Football & Articles Paris IA | BetsPlug",
      description:
        "Actualites football, analyses de matchs par IA et conseils de paris bases sur les donnees pour la Premier League, la Liga, la Bundesliga et la Serie A.",
      ogTitle: "Derniere Analyse Football - BetsPlug",
      ogDescription:
        "Analyses de matchs football par IA et conseils de paris bases sur les donnees par BetsPlug.",
    },
    es: {
      title: "Analisis de Futbol & Articulos IA | BetsPlug",
      description:
        "Noticias de futbol, analisis de partidos con IA e insights de apuestas basados en datos para la Premier League, La Liga, Bundesliga y Serie A.",
      ogTitle: "Ultimo Analisis de Futbol - BetsPlug",
      ogDescription:
        "Analisis de partidos de futbol con IA e insights de apuestas basados en datos del equipo BetsPlug.",
    },
    it: {
      title: "Analisi Calcio & Articoli Scommesse IA | BetsPlug",
      description:
        "News calcistiche, analisi delle partite con IA e approfondimenti sulle scommesse basati sui dati per Premier League, Liga, Bundesliga e Serie A.",
      ogTitle: "Ultime Analisi Calcio - BetsPlug",
      ogDescription:
        "Analisi delle partite di calcio con IA e approfondimenti sulle scommesse dal team di ricerca BetsPlug.",
    },
    sw: {
      title: "Uchambuzi wa Mpira & Makala za AI | BetsPlug",
      description:
        "Habari za mpira, uchambuzi wa mechi kwa AI na maarifa ya kamari yanayotegemea data kwa Premier League, La Liga, Bundesliga na Serie A.",
      ogTitle: "Uchambuzi Mpya wa Mpira - BetsPlug",
      ogDescription:
        "Uchambuzi wa mechi za mpira kwa AI na maarifa ya kamari kutoka timu ya utafiti ya BetsPlug.",
    },
    id: {
      title: "Analisis Sepak Bola & Artikel AI | BetsPlug",
      description:
        "Berita sepak bola, analisis pertandingan AI dan wawasan taruhan berbasis data untuk Premier League, La Liga, Bundesliga, dan Serie A dari tim BetsPlug.",
      ogTitle: "Analisis Sepak Bola Terbaru - BetsPlug",
      ogDescription:
        "Analisis pertandingan sepak bola AI dan wawasan taruhan berbasis data dari tim riset BetsPlug.",
    },
  },

  /* ─────────────────────────── ABOUT US ─────────────────────── */
  "/about-us": {
    en: {
      title: "About BetsPlug - AI Football Analytics Team",
      description:
        "Meet the two engineers building BetsPlug. Football fanatics with an ICT background, turning raw match data into transparent, probability-driven football predictions.",
      ogTitle: "About BetsPlug - The team behind the edge",
      ogDescription:
        "Two engineers. 20+ years of combined ICT experience. One obsession: turning football data into a measurable edge.",
    },
    nl: {
      title: "Over BetsPlug - Het AI-voetbalanalyse Team",
      description:
        "Maak kennis met de twee engineers achter BetsPlug. Voetbalfanaten met een ICT-achtergrond die ruwe wedstrijddata omzetten in transparante, kansgedreven voorspellingen.",
      ogTitle: "Over BetsPlug - Het team achter de voorsprong",
      ogDescription:
        "Twee engineers. 20+ jaar gecombineerde ICT-ervaring. Een obsessie: voetbaldata omzetten in meetbaar voordeel.",
    },
    de: {
      title: "Ueber BetsPlug - Das KI-Fussballanalyse-Team",
      description:
        "Lernen Sie die zwei Ingenieure hinter BetsPlug kennen. Fussballfans mit IT-Hintergrund, die Rohdaten in transparente, wahrscheinlichkeitsbasierte Prognosen verwandeln.",
      ogTitle: "Ueber BetsPlug - Das Team hinter dem Vorsprung",
      ogDescription:
        "Zwei Ingenieure. Ueber 20 Jahre IT-Erfahrung. Eine Leidenschaft: Fussballdaten in messbaren Vorsprung verwandeln.",
    },
    fr: {
      title: "A propos de BetsPlug - Equipe Analyse Football IA",
      description:
        "Decouvrez les deux ingenieurs derriere BetsPlug. Des passionnes de football avec une expertise en IT, transformant les donnees brutes en predictions transparentes.",
      ogTitle: "A propos de BetsPlug - L'equipe derriere l'avantage",
      ogDescription:
        "Deux ingenieurs. Plus de 20 ans d'experience IT combinee. Une obsession : transformer les donnees en avantage mesurable.",
    },
    es: {
      title: "Sobre BetsPlug - Equipo de Analisis Futbol IA",
      description:
        "Conoce a los dos ingenieros que construyen BetsPlug. Fanaticos del futbol con formacion en TI, convirtiendo datos en predicciones transparentes basadas en probabilidades.",
      ogTitle: "Sobre BetsPlug - El equipo detras de la ventaja",
      ogDescription:
        "Dos ingenieros. Mas de 20 anos de experiencia combinada en TI. Una obsesion: convertir datos de futbol en ventaja medible.",
    },
    it: {
      title: "Chi Siamo - Il Team BetsPlug di Analisi Calcio IA",
      description:
        "Scopri i due ingegneri dietro BetsPlug. Appassionati di calcio con background IT, che trasformano dati grezzi in pronostici trasparenti basati sulle probabilita.",
      ogTitle: "Chi Siamo - Il team dietro il vantaggio",
      ogDescription:
        "Due ingegneri. Oltre 20 anni di esperienza IT combinata. Un'ossessione: trasformare i dati calcistici in vantaggio misurabile.",
    },
    sw: {
      title: "Kuhusu BetsPlug - Timu ya Uchambuzi wa Mpira kwa AI",
      description:
        "Fahamu wahandisi wawili wanaojenga BetsPlug. Wapenda mpira wenye ujuzi wa ICT, wanaobadilisha data mbichi kuwa utabiri unaotegemea uwezekano.",
      ogTitle: "Kuhusu BetsPlug - Timu nyuma ya ubora",
      ogDescription:
        "Wahandisi wawili. Zaidi ya miaka 20 ya uzoefu wa ICT. Shauku moja: kubadilisha data ya mpira kuwa faida inayopimika.",
    },
    id: {
      title: "Tentang BetsPlug - Tim Analisis Sepak Bola AI",
      description:
        "Kenali dua engineer di balik BetsPlug. Penggemar sepak bola dengan latar belakang TI, mengubah data mentah menjadi prediksi transparan berbasis probabilitas.",
      ogTitle: "Tentang BetsPlug - Tim di balik keunggulan",
      ogDescription:
        "Dua engineer. Lebih dari 20 tahun pengalaman TI gabungan. Satu obsesi: mengubah data sepak bola menjadi keunggulan terukur.",
    },
  },

  /* ─────────────────────────── PRIVACY ──────────────────────── */
  "/privacy": {
    en: {
      title: "Privacy Policy - BetsPlug",
      description:
        "How BetsPlug collects, uses and protects your personal data. GDPR-compliant privacy policy for our AI football analytics platform.",
      ogTitle: "Privacy Policy - BetsPlug",
      ogDescription:
        "How BetsPlug collects, uses and protects your personal data.",
    },
    nl: {
      title: "Privacybeleid - BetsPlug",
      description:
        "Hoe BetsPlug uw persoonsgegevens verzamelt, gebruikt en beschermt. AVG-conform privacybeleid voor ons AI-voetbalanalyseplatform.",
      ogTitle: "Privacybeleid - BetsPlug",
      ogDescription:
        "Hoe BetsPlug uw persoonsgegevens verzamelt, gebruikt en beschermt.",
    },
    de: {
      title: "Datenschutzrichtlinie - BetsPlug",
      description:
        "Wie BetsPlug Ihre personenbezogenen Daten erhebt, nutzt und schuetzt. DSGVO-konforme Datenschutzrichtlinie fuer unsere KI-Fussballanalyseplattform.",
      ogTitle: "Datenschutzrichtlinie - BetsPlug",
      ogDescription:
        "Wie BetsPlug Ihre personenbezogenen Daten erhebt, nutzt und schuetzt.",
    },
    fr: {
      title: "Politique de Confidentialite - BetsPlug",
      description:
        "Comment BetsPlug collecte, utilise et protege vos donnees personnelles. Politique de confidentialite conforme au RGPD pour notre plateforme d'analyse football IA.",
      ogTitle: "Politique de Confidentialite - BetsPlug",
      ogDescription:
        "Comment BetsPlug collecte, utilise et protege vos donnees personnelles.",
    },
    es: {
      title: "Politica de Privacidad - BetsPlug",
      description:
        "Como BetsPlug recopila, utiliza y protege sus datos personales. Politica de privacidad conforme al RGPD para nuestra plataforma de analisis de futbol con IA.",
      ogTitle: "Politica de Privacidad - BetsPlug",
      ogDescription:
        "Como BetsPlug recopila, utiliza y protege sus datos personales.",
    },
    it: {
      title: "Informativa sulla Privacy - BetsPlug",
      description:
        "Come BetsPlug raccoglie, utilizza e protegge i tuoi dati personali. Informativa sulla privacy conforme al GDPR per la nostra piattaforma di analisi calcio con IA.",
      ogTitle: "Informativa sulla Privacy - BetsPlug",
      ogDescription:
        "Come BetsPlug raccoglie, utilizza e protegge i tuoi dati personali.",
    },
    sw: {
      title: "Sera ya Faragha - BetsPlug",
      description:
        "Jinsi BetsPlug inavyokusanya, kutumia na kulinda data yako binafsi. Sera ya faragha inayozingatia GDPR kwa jukwaa letu la uchambuzi wa mpira kwa AI.",
      ogTitle: "Sera ya Faragha - BetsPlug",
      ogDescription:
        "Jinsi BetsPlug inavyokusanya, kutumia na kulinda data yako binafsi.",
    },
    id: {
      title: "Kebijakan Privasi - BetsPlug",
      description:
        "Bagaimana BetsPlug mengumpulkan, menggunakan, dan melindungi data pribadi Anda. Kebijakan privasi sesuai GDPR untuk platform analisis sepak bola AI kami.",
      ogTitle: "Kebijakan Privasi - BetsPlug",
      ogDescription:
        "Bagaimana BetsPlug mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
    },
  },

  /* ─────────────────────────── TERMS ────────────────────────── */
  "/terms": {
    en: {
      title: "Terms of Service - BetsPlug",
      description:
        "The terms and conditions that apply when you use BetsPlug. Please read them before creating an account or subscribing to our AI football analytics platform.",
      ogTitle: "Terms of Service - BetsPlug",
      ogDescription:
        "The terms and conditions that apply when you use BetsPlug.",
    },
    nl: {
      title: "Algemene Voorwaarden - BetsPlug",
      description:
        "De voorwaarden die van toepassing zijn wanneer u BetsPlug gebruikt. Lees ze voordat u een account aanmaakt of een abonnement afsluit.",
      ogTitle: "Algemene Voorwaarden - BetsPlug",
      ogDescription:
        "De voorwaarden die van toepassing zijn wanneer u BetsPlug gebruikt.",
    },
    de: {
      title: "Nutzungsbedingungen - BetsPlug",
      description:
        "Die Nutzungsbedingungen fuer BetsPlug. Bitte lesen Sie diese, bevor Sie ein Konto erstellen oder ein Abonnement fuer unsere KI-Fussballanalyseplattform abschliessen.",
      ogTitle: "Nutzungsbedingungen - BetsPlug",
      ogDescription:
        "Die Nutzungsbedingungen, die bei der Nutzung von BetsPlug gelten.",
    },
    fr: {
      title: "Conditions d'Utilisation - BetsPlug",
      description:
        "Les conditions generales applicables lors de l'utilisation de BetsPlug. Veuillez les lire avant de creer un compte ou de vous abonner a notre plateforme.",
      ogTitle: "Conditions d'Utilisation - BetsPlug",
      ogDescription:
        "Les conditions generales applicables lors de l'utilisation de BetsPlug.",
    },
    es: {
      title: "Terminos de Servicio - BetsPlug",
      description:
        "Los terminos y condiciones que se aplican al usar BetsPlug. Lealos antes de crear una cuenta o suscribirse a nuestra plataforma de analisis de futbol con IA.",
      ogTitle: "Terminos de Servicio - BetsPlug",
      ogDescription:
        "Los terminos y condiciones que se aplican al usar BetsPlug.",
    },
    it: {
      title: "Termini di Servizio - BetsPlug",
      description:
        "I termini e le condizioni applicabili quando si utilizza BetsPlug. Si prega di leggerli prima di creare un account o sottoscrivere un abbonamento.",
      ogTitle: "Termini di Servizio - BetsPlug",
      ogDescription:
        "I termini e le condizioni applicabili quando si utilizza BetsPlug.",
    },
    sw: {
      title: "Masharti ya Huduma - BetsPlug",
      description:
        "Masharti yanayotumika unapotumia BetsPlug. Tafadhali yasome kabla ya kuunda akaunti au kujisajili kwenye jukwaa letu la uchambuzi wa mpira kwa AI.",
      ogTitle: "Masharti ya Huduma - BetsPlug",
      ogDescription:
        "Masharti yanayotumika unapotumia BetsPlug.",
    },
    id: {
      title: "Ketentuan Layanan - BetsPlug",
      description:
        "Syarat dan ketentuan yang berlaku saat Anda menggunakan BetsPlug. Harap baca sebelum membuat akun atau berlangganan platform analisis sepak bola AI kami.",
      ogTitle: "Ketentuan Layanan - BetsPlug",
      ogDescription:
        "Syarat dan ketentuan yang berlaku saat Anda menggunakan BetsPlug.",
    },
  },

  /* ─────────────────────────── COOKIES ──────────────────────── */
  "/cookies": {
    en: {
      title: "Cookie Policy - BetsPlug",
      description:
        "Which cookies BetsPlug uses, why we use them, and how you can manage your cookie preferences on our AI football analytics platform.",
      ogTitle: "Cookie Policy - BetsPlug",
      ogDescription:
        "Which cookies BetsPlug uses, why we use them, and how you can manage your preferences.",
    },
    nl: {
      title: "Cookiebeleid - BetsPlug",
      description:
        "Welke cookies BetsPlug gebruikt, waarom we ze gebruiken en hoe u uw cookievoorkeuren kunt beheren op ons AI-voetbalanalyseplatform.",
      ogTitle: "Cookiebeleid - BetsPlug",
      ogDescription:
        "Welke cookies BetsPlug gebruikt, waarom we ze gebruiken en hoe u uw voorkeuren kunt beheren.",
    },
    de: {
      title: "Cookie-Richtlinie - BetsPlug",
      description:
        "Welche Cookies BetsPlug verwendet, warum wir sie verwenden und wie Sie Ihre Cookie-Einstellungen auf unserer KI-Fussballanalyseplattform verwalten koennen.",
      ogTitle: "Cookie-Richtlinie - BetsPlug",
      ogDescription:
        "Welche Cookies BetsPlug verwendet und wie Sie Ihre Einstellungen verwalten koennen.",
    },
    fr: {
      title: "Politique des Cookies - BetsPlug",
      description:
        "Quels cookies BetsPlug utilise, pourquoi nous les utilisons et comment vous pouvez gerer vos preferences sur notre plateforme d'analyse football IA.",
      ogTitle: "Politique des Cookies - BetsPlug",
      ogDescription:
        "Quels cookies BetsPlug utilise, pourquoi nous les utilisons et comment gerer vos preferences.",
    },
    es: {
      title: "Politica de Cookies - BetsPlug",
      description:
        "Que cookies usa BetsPlug, por que las usamos y como puede gestionar sus preferencias de cookies en nuestra plataforma de analisis de futbol con IA.",
      ogTitle: "Politica de Cookies - BetsPlug",
      ogDescription:
        "Que cookies usa BetsPlug, por que las usamos y como gestionar sus preferencias.",
    },
    it: {
      title: "Politica sui Cookie - BetsPlug",
      description:
        "Quali cookie utilizza BetsPlug, perche li utilizziamo e come gestire le preferenze sui cookie sulla nostra piattaforma di analisi calcio con IA.",
      ogTitle: "Politica sui Cookie - BetsPlug",
      ogDescription:
        "Quali cookie utilizza BetsPlug, perche li utilizziamo e come gestire le preferenze.",
    },
    sw: {
      title: "Sera ya Vidakuzi - BetsPlug",
      description:
        "Vidakuzi gani BetsPlug inatumia, kwa nini tunazitumia na jinsi unavyoweza kudhibiti mapendeleo yako kwenye jukwaa letu la uchambuzi wa mpira kwa AI.",
      ogTitle: "Sera ya Vidakuzi - BetsPlug",
      ogDescription:
        "Vidakuzi gani BetsPlug inatumia na jinsi unavyoweza kudhibiti mapendeleo yako.",
    },
    id: {
      title: "Kebijakan Cookie - BetsPlug",
      description:
        "Cookie apa yang digunakan BetsPlug, mengapa kami menggunakannya, dan bagaimana Anda dapat mengelola preferensi cookie di platform analisis sepak bola AI kami.",
      ogTitle: "Kebijakan Cookie - BetsPlug",
      ogDescription:
        "Cookie apa yang digunakan BetsPlug dan bagaimana Anda dapat mengelola preferensi Anda.",
    },
  },

  /* ─────────────────────────── HOW IT WORKS ─────────────────── */
  "/how-it-works": {
    en: {
      title: "How BetsPlug Works - AI Prediction Engine",
      description:
        "A full, step-by-step walkthrough of the BetsPlug prediction engine: how we collect data, engineer features, train models, detect value and publish verifiable picks.",
      ogTitle: "How BetsPlug Works - Step-by-Step Prediction Engine",
      ogDescription:
        "14 data sources. 1,200+ features. 4 independent models. Every pick timestamped and publicly verifiable.",
    },
    nl: {
      title: "Hoe BetsPlug Werkt - AI-voorspellingsmotor",
      description:
        "Een volledige stapsgewijze uitleg van de BetsPlug-voorspellingsmotor: hoe we data verzamelen, features engineeren, modellen trainen en verifieerbare picks publiceren.",
      ogTitle: "Hoe BetsPlug Werkt - Stap-voor-stap Voorspellingsmotor",
      ogDescription:
        "14 databronnen. 1.200+ features. 4 onafhankelijke modellen. Elke pick met tijdstempel en publiek verifieerbaar.",
    },
    de: {
      title: "So Funktioniert BetsPlug - KI-Prognosemaschine",
      description:
        "Eine vollstaendige Schritt-fuer-Schritt-Erklaerung der BetsPlug-Prognosemaschine: Datenerhebung, Feature-Engineering, Modelltraining und verifizierbare Tipps.",
      ogTitle: "So Funktioniert BetsPlug - Schritt fuer Schritt",
      ogDescription:
        "14 Datenquellen. Ueber 1.200 Features. 4 unabhaengige Modelle. Jeder Tipp mit Zeitstempel und oeffentlich verifizierbar.",
    },
    fr: {
      title: "Comment Fonctionne BetsPlug - Moteur IA",
      description:
        "Presentation complete du moteur de prediction BetsPlug : collecte de donnees, feature engineering, entrainement des modeles et publication de picks verifiables.",
      ogTitle: "Comment Fonctionne BetsPlug - Etape par Etape",
      ogDescription:
        "14 sources de donnees. Plus de 1 200 features. 4 modeles independants. Chaque pick horodate et publiquement verifiable.",
    },
    es: {
      title: "Como Funciona BetsPlug - Motor de Prediccion IA",
      description:
        "Guia completa paso a paso del motor de prediccion BetsPlug: recopilacion de datos, ingenieria de features, entrenamiento de modelos y picks verificables.",
      ogTitle: "Como Funciona BetsPlug - Paso a Paso",
      ogDescription:
        "14 fuentes de datos. Mas de 1.200 features. 4 modelos independientes. Cada pick con marca de tiempo y verificable.",
    },
    it: {
      title: "Come Funziona BetsPlug - Motore di Previsione IA",
      description:
        "Una guida completa passo dopo passo del motore di previsione BetsPlug: raccolta dati, feature engineering, addestramento modelli e pronostici verificabili.",
      ogTitle: "Come Funziona BetsPlug - Passo dopo Passo",
      ogDescription:
        "14 fonti di dati. Oltre 1.200 feature. 4 modelli indipendenti. Ogni pronostico con timestamp e verificabile pubblicamente.",
    },
    sw: {
      title: "BetsPlug Inavyofanya Kazi - Injini ya Utabiri ya AI",
      description:
        "Mwongozo kamili wa hatua kwa hatua wa injini ya utabiri ya BetsPlug: ukusanyaji data, uhandisi wa vipengele, mafunzo ya mifano na utabiri unaothibitishika.",
      ogTitle: "BetsPlug Inavyofanya Kazi - Hatua kwa Hatua",
      ogDescription:
        "Vyanzo 14 vya data. Vipengele zaidi ya 1,200. Mifano 4 huru. Kila utabiri una muhuri wa wakati na unathibitishika.",
    },
    id: {
      title: "Cara Kerja BetsPlug - Mesin Prediksi AI",
      description:
        "Panduan lengkap langkah demi langkah mesin prediksi BetsPlug: pengumpulan data, feature engineering, pelatihan model, dan publikasi prediksi yang dapat diverifikasi.",
      ogTitle: "Cara Kerja BetsPlug - Langkah demi Langkah",
      ogDescription:
        "14 sumber data. 1.200+ fitur. 4 model independen. Setiap prediksi memiliki stempel waktu dan dapat diverifikasi publik.",
    },
  },

  /* ─────────────────────────── TRACK RECORD ─────────────────── */
  "/track-record": {
    en: {
      title: "Track Record - Verified AI Prediction Results",
      description:
        "Transparent, auditable results for every BetsPlug pick. See how our AI models turn raw match data into a measurable edge - documented weekly, never cherry-picked.",
      ogTitle: "BetsPlug Track Record - Auditable, Never Cherry-Picked",
      ogDescription:
        "58.3% hit rate. +14.6% ROI. 24,180 graded predictions. Every pick timestamped and logged to a public ledger.",
    },
    nl: {
      title: "Trackrecord - Geverifieerde AI-voorspellingsresultaten",
      description:
        "Transparante, controleerbare resultaten voor elke BetsPlug-pick. Zie hoe onze AI-modellen ruwe data omzetten in meetbaar voordeel - wekelijks gedocumenteerd.",
      ogTitle: "BetsPlug Trackrecord - Controleerbaar, Nooit Selectief",
      ogDescription:
        "58,3% hitrate. +14,6% ROI. 24.180 beoordeelde voorspellingen. Elke pick met tijdstempel op een publiek register.",
    },
    de: {
      title: "Bilanz - Verifizierte KI-Prognoseergebnisse",
      description:
        "Transparente, pruefbare Ergebnisse fuer jeden BetsPlug-Tipp. Sehen Sie, wie unsere KI-Modelle Rohdaten in messbaren Vorsprung verwandeln - woechentlich dokumentiert.",
      ogTitle: "BetsPlug Bilanz - Pruefbar, Nie Selektiv",
      ogDescription:
        "58,3% Trefferquote. +14,6% ROI. 24.180 bewertete Prognosen. Jeder Tipp mit Zeitstempel im oeffentlichen Register.",
    },
    fr: {
      title: "Historique - Resultats de Predictions IA Verifies",
      description:
        "Des resultats transparents et verifiables pour chaque pick BetsPlug. Decouvrez comment nos modeles IA transforment les donnees brutes en avantage mesurable.",
      ogTitle: "Historique BetsPlug - Verifiable, Jamais Selectif",
      ogDescription:
        "58,3% de reussite. +14,6% ROI. 24 180 predictions evaluees. Chaque pick horodate dans un registre public.",
    },
    es: {
      title: "Historial - Resultados de Predicciones IA Verificados",
      description:
        "Resultados transparentes y auditables para cada pick de BetsPlug. Vea como nuestros modelos IA convierten datos brutos en ventaja medible - documentado semanalmente.",
      ogTitle: "Historial BetsPlug - Auditable, Nunca Selectivo",
      ogDescription:
        "58,3% de acierto. +14,6% ROI. 24.180 predicciones calificadas. Cada pick con marca de tiempo en registro publico.",
    },
    it: {
      title: "Storico - Risultati Pronostici IA Verificati",
      description:
        "Risultati trasparenti e verificabili per ogni pronostico BetsPlug. Scopri come i nostri modelli IA trasformano dati grezzi in vantaggio misurabile - documentato settimanalmente.",
      ogTitle: "Storico BetsPlug - Verificabile, Mai Selettivo",
      ogDescription:
        "58,3% di successo. +14,6% ROI. 24.180 pronostici valutati. Ogni pronostico con timestamp nel registro pubblico.",
    },
    sw: {
      title: "Rekodi ya Matokeo - Matokeo ya Utabiri wa AI",
      description:
        "Matokeo ya uwazi na yanayokaguliwa kwa kila chaguo la BetsPlug. Angalia jinsi mifano yetu ya AI inavyobadilisha data kuwa faida inayopimika - imeandikwa kila wiki.",
      ogTitle: "Rekodi ya BetsPlug - Inakaguliwa, Haijachanganywa",
      ogDescription:
        "58.3% kiwango cha mafanikio. +14.6% ROI. Utabiri 24,180 uliokadiriwa. Kila chaguo lina muhuri wa wakati.",
    },
    id: {
      title: "Rekam Jejak - Hasil Prediksi AI Terverifikasi",
      description:
        "Hasil transparan dan dapat diaudit untuk setiap prediksi BetsPlug. Lihat bagaimana model AI kami mengubah data mentah menjadi keunggulan terukur - didokumentasikan mingguan.",
      ogTitle: "Rekam Jejak BetsPlug - Dapat Diaudit, Tidak Selektif",
      ogDescription:
        "58,3% tingkat akurasi. +14,6% ROI. 24.180 prediksi dinilai. Setiap prediksi memiliki stempel waktu di register publik.",
    },
  },

  /* ─────────────────────────── LOGIN ────────────────────────── */
  "/login": {
    en: {
      title: "Log In - BetsPlug",
      description:
        "Log in to your BetsPlug account to see today's picks, track your ROI and manage your subscription.",
    },
    nl: {
      title: "Inloggen - BetsPlug",
      description:
        "Log in op uw BetsPlug-account om de picks van vandaag te zien, uw ROI te volgen en uw abonnement te beheren.",
    },
    de: {
      title: "Anmelden - BetsPlug",
      description:
        "Melden Sie sich bei Ihrem BetsPlug-Konto an, um die heutigen Tipps zu sehen, Ihren ROI zu verfolgen und Ihr Abo zu verwalten.",
    },
    fr: {
      title: "Connexion - BetsPlug",
      description:
        "Connectez-vous a votre compte BetsPlug pour voir les picks du jour, suivre votre ROI et gerer votre abonnement.",
    },
    es: {
      title: "Iniciar Sesion - BetsPlug",
      description:
        "Inicie sesion en su cuenta BetsPlug para ver las selecciones de hoy, seguir su ROI y gestionar su suscripcion.",
    },
    it: {
      title: "Accedi - BetsPlug",
      description:
        "Accedi al tuo account BetsPlug per vedere le selezioni di oggi, monitorare il tuo ROI e gestire il tuo abbonamento.",
    },
    sw: {
      title: "Ingia - BetsPlug",
      description:
        "Ingia kwenye akaunti yako ya BetsPlug kuona chaguzi za leo, kufuatilia ROI yako na kudhibiti usajili wako.",
    },
    id: {
      title: "Masuk - BetsPlug",
      description:
        "Masuk ke akun BetsPlug Anda untuk melihat prediksi hari ini, melacak ROI, dan mengelola langganan Anda.",
    },
  },

  /* ─────────────────────── MATCH PREDICTIONS ────────────────── */
  "/match-predictions": {
    en: {
      title: "Free AI Match Predictions - Upcoming Games | BetsPlug",
      description:
        "Preview 3 free AI-powered match predictions with win probabilities and confidence scores. Unlock the full slate of upcoming games with a BetsPlug subscription.",
      ogTitle: "Free AI Match Predictions - BetsPlug",
      ogDescription:
        "Preview 3 free AI-powered match predictions. Unlock the rest with a trial.",
    },
    nl: {
      title: "Gratis AI-Wedstrijdvoorspellingen | BetsPlug",
      description:
        "Bekijk 3 gratis AI-gestuurde wedstrijdvoorspellingen met winstkansen en vertrouwensscores. Ontgrendel alle komende wedstrijden met een BetsPlug-abonnement.",
      ogTitle: "Gratis AI-Wedstrijdvoorspellingen - BetsPlug",
      ogDescription:
        "Bekijk 3 gratis AI-voorspellingen. Ontgrendel de rest met een proefabonnement.",
    },
    de: {
      title: "Kostenlose KI-Spielvorhersagen | BetsPlug",
      description:
        "Vorschau auf 3 kostenlose KI-gestuetzte Spielvorhersagen mit Siegwahrscheinlichkeiten und Vertrauenswerten. Alle Spiele freischalten mit einem BetsPlug-Abo.",
      ogTitle: "Kostenlose KI-Spielvorhersagen - BetsPlug",
      ogDescription:
        "Vorschau auf 3 kostenlose KI-Vorhersagen. Den Rest freischalten mit einem Probeabo.",
    },
    fr: {
      title: "Predictions de Matchs IA Gratuites | BetsPlug",
      description:
        "Apercu de 3 predictions de matchs gratuites par IA avec probabilites de victoire et scores de confiance. Debloquez tous les matchs avec un abonnement BetsPlug.",
      ogTitle: "Predictions de Matchs IA Gratuites - BetsPlug",
      ogDescription:
        "Apercu de 3 predictions IA gratuites. Debloquez le reste avec un essai.",
    },
    es: {
      title: "Predicciones de Partidos IA Gratis | BetsPlug",
      description:
        "Vista previa de 3 predicciones gratuitas de partidos con IA, con probabilidades de victoria y puntuaciones de confianza. Desbloquee todos los partidos con BetsPlug.",
      ogTitle: "Predicciones de Partidos IA Gratis - BetsPlug",
      ogDescription:
        "Vista previa de 3 predicciones IA gratuitas. Desbloquee el resto con una prueba.",
    },
    it: {
      title: "Pronostici Partite IA Gratuiti | BetsPlug",
      description:
        "Anteprima di 3 pronostici gratuiti con IA con probabilita di vittoria e punteggi di affidabilita. Sblocca tutte le partite con un abbonamento BetsPlug.",
      ogTitle: "Pronostici Partite IA Gratuiti - BetsPlug",
      ogDescription:
        "Anteprima di 3 pronostici IA gratuiti. Sblocca il resto con una prova.",
    },
    sw: {
      title: "Utabiri wa Mechi kwa AI Bure | BetsPlug",
      description:
        "Hakiki utabiri 3 wa mechi bure unaotegemea AI na uwezekano wa kushinda na alama za kujiamini. Fungua mechi zote na usajili wa BetsPlug.",
      ogTitle: "Utabiri wa Mechi kwa AI Bure - BetsPlug",
      ogDescription:
        "Hakiki utabiri 3 bure wa AI. Fungua zingine na majaribio.",
    },
    id: {
      title: "Prediksi Pertandingan AI Gratis | BetsPlug",
      description:
        "Pratinjau 3 prediksi pertandingan AI gratis dengan probabilitas kemenangan dan skor kepercayaan. Buka semua pertandingan dengan langganan BetsPlug.",
      ogTitle: "Prediksi Pertandingan AI Gratis - BetsPlug",
      ogDescription:
        "Pratinjau 3 prediksi AI gratis. Buka sisanya dengan uji coba.",
    },
  },

  /* ─────────────────────────── LEARN ────────────────────────── */
  "/learn": {
    en: {
      title: "Learn Football Betting - Value, xG, Elo | BetsPlug",
      description:
        "In-depth pillar guides on the math behind sharp football betting - value betting, expected goals, Elo ratings, the Kelly criterion, Poisson models, and bankroll management.",
      ogTitle: "Learn Football Betting - BetsPlug",
      ogDescription:
        "Six deep-dive pillar guides covering value betting, xG, Elo, Kelly, Poisson and bankroll management.",
    },
    nl: {
      title: "Leer Voetbalwedden - Value, xG, Elo | BetsPlug",
      description:
        "Diepgaande pillar-gidsen over de wiskunde achter scherpe voetbalwedden - value betting, expected goals, Elo-ratings, Kelly-criterium, Poisson-modellen en bankroll management.",
      ogTitle: "Leer Voetbalwedden - BetsPlug",
      ogDescription:
        "Zes diepgaande pillar-gidsen over value betting, xG, Elo, Kelly, Poisson en bankroll management.",
    },
    de: {
      title: "Fussballwetten Lernen - Value, xG, Elo | BetsPlug",
      description:
        "Ausfuehrliche Pillar-Guides zur Mathematik hinter klugen Fussballwetten - Value Betting, Expected Goals, Elo-Ratings, Kelly-Kriterium, Poisson-Modelle und Bankroll-Management.",
      ogTitle: "Fussballwetten Lernen - BetsPlug",
      ogDescription:
        "Sechs tiefgehende Pillar-Guides zu Value Betting, xG, Elo, Kelly, Poisson und Bankroll-Management.",
    },
    fr: {
      title: "Apprendre les Paris - Value, xG, Elo | BetsPlug",
      description:
        "Guides approfondis sur les maths derriere les paris football intelligents - value betting, expected goals, classements Elo, critere de Kelly, modeles de Poisson.",
      ogTitle: "Apprendre les Paris Football - BetsPlug",
      ogDescription:
        "Six guides approfondis sur le value betting, xG, Elo, Kelly, Poisson et la gestion de bankroll.",
    },
    es: {
      title: "Aprende Apuestas de Futbol - Value, xG | BetsPlug",
      description:
        "Guias en profundidad sobre las matematicas detras de las apuestas inteligentes - value betting, goles esperados, ratings Elo, criterio Kelly y modelos Poisson.",
      ogTitle: "Aprende Apuestas de Futbol - BetsPlug",
      ogDescription:
        "Seis guias en profundidad sobre value betting, xG, Elo, Kelly, Poisson y gestion de bankroll.",
    },
    it: {
      title: "Impara le Scommesse Calcio - Value, xG | BetsPlug",
      description:
        "Guide approfondite sulla matematica delle scommesse calcistiche intelligenti - value betting, expected goals, rating Elo, criterio di Kelly, modelli Poisson.",
      ogTitle: "Impara le Scommesse Calcio - BetsPlug",
      ogDescription:
        "Sei guide approfondite su value betting, xG, Elo, Kelly, Poisson e gestione del bankroll.",
    },
    sw: {
      title: "Jifunze Kamari ya Mpira - Value, xG, Elo | BetsPlug",
      description:
        "Miongozo ya kina kuhusu hesabu nyuma ya kamari bora za mpira - value betting, expected goals, Elo ratings, Kelly criterion, Poisson models na usimamizi wa bankroll.",
      ogTitle: "Jifunze Kamari ya Mpira - BetsPlug",
      ogDescription:
        "Miongozo sita ya kina kuhusu value betting, xG, Elo, Kelly, Poisson na usimamizi wa bankroll.",
    },
    id: {
      title: "Belajar Taruhan Sepak Bola - Value, xG | BetsPlug",
      description:
        "Panduan mendalam tentang matematika di balik taruhan sepak bola cerdas - value betting, expected goals, rating Elo, kriteria Kelly, model Poisson, dan manajemen bankroll.",
      ogTitle: "Belajar Taruhan Sepak Bola - BetsPlug",
      ogDescription:
        "Enam panduan mendalam tentang value betting, xG, Elo, Kelly, Poisson, dan manajemen bankroll.",
    },
  },

  /* ─────────────────────────── BET TYPES ────────────────────── */
  "/bet-types": {
    en: {
      title: "Bet Types Explained - BTTS, Over 2.5, DC | BetsPlug",
      description:
        "How popular football betting markets work, how books price them and when the market offers value. Explainers for BTTS, Over 2.5 goals, Double Chance and Draw No Bet.",
      ogTitle: "Bet Types Explained - BetsPlug",
      ogDescription:
        "Deep dives into BTTS, Over 2.5, Double Chance, Draw No Bet and more popular football markets.",
    },
    nl: {
      title: "Wed-types Uitgelegd - BTTS, Over 2.5, DC | BetsPlug",
      description:
        "Hoe populaire voetbalwedmarkten werken, hoe bookmakers ze prijzen en wanneer de markt value biedt. Uitleg bij BTTS, Over 2.5 goals, Double Chance en Draw No Bet.",
      ogTitle: "Wed-types Uitgelegd - BetsPlug",
      ogDescription:
        "Diepgaande uitleg over BTTS, Over 2.5, Double Chance, Draw No Bet en meer populaire wedmarkten.",
    },
    de: {
      title: "Wettarten Erklaert - BTTS, Over 2.5, DC | BetsPlug",
      description:
        "Wie beliebte Fussball-Wettmaerkte funktionieren, wie Buchmacher sie bepreisen und wann der Markt Value bietet. Erklaerungen fuer BTTS, Over 2.5 Tore und mehr.",
      ogTitle: "Wettarten Erklaert - BetsPlug",
      ogDescription:
        "Tiefgehende Erklaerungen zu BTTS, Over 2.5, Double Chance, Draw No Bet und weiteren Fussball-Maerkten.",
    },
    fr: {
      title: "Types de Paris Expliques - BTTS, Over 2.5 | BetsPlug",
      description:
        "Comment fonctionnent les marches de paris football populaires, comment les bookmakers les tarifent et quand le marche offre de la valeur. BTTS, Over 2.5, Double Chance.",
      ogTitle: "Types de Paris Expliques - BetsPlug",
      ogDescription:
        "Analyses approfondies de BTTS, Over 2.5, Double Chance, Draw No Bet et d'autres marches populaires.",
    },
    es: {
      title: "Tipos de Apuesta Explicados - BTTS, Over 2.5 | BetsPlug",
      description:
        "Como funcionan los mercados de apuestas de futbol populares, como los fijan los bookmakers y cuando el mercado ofrece valor. BTTS, Over 2.5, Double Chance y mas.",
      ogTitle: "Tipos de Apuesta Explicados - BetsPlug",
      ogDescription:
        "Analisis detallados de BTTS, Over 2.5, Double Chance, Draw No Bet y mas mercados populares de futbol.",
    },
    it: {
      title: "Tipi di Scommessa Spiegati - BTTS, Over 2.5 | BetsPlug",
      description:
        "Come funzionano i mercati delle scommesse calcistiche, come i bookmaker li quotano e quando il mercato offre valore. BTTS, Over 2.5, Double Chance e Draw No Bet.",
      ogTitle: "Tipi di Scommessa Spiegati - BetsPlug",
      ogDescription:
        "Approfondimenti su BTTS, Over 2.5, Double Chance, Draw No Bet e altri mercati calcistici popolari.",
    },
    sw: {
      title: "Aina za Kamari Zimeelezwa - BTTS, Over 2.5 | BetsPlug",
      description:
        "Jinsi masoko maarufu ya kamari za mpira yanavyofanya kazi, jinsi bukumeka zinavyoweka bei na masoko yanapotoa thamani. BTTS, Over 2.5, Double Chance na Draw No Bet.",
      ogTitle: "Aina za Kamari Zimeelezwa - BetsPlug",
      ogDescription:
        "Uchambuzi wa kina wa BTTS, Over 2.5, Double Chance, Draw No Bet na masoko mengine maarufu.",
    },
    id: {
      title: "Jenis Taruhan Dijelaskan - BTTS, Over 2.5 | BetsPlug",
      description:
        "Bagaimana pasar taruhan sepak bola populer bekerja, bagaimana bandar menetapkan harga, dan kapan pasar menawarkan nilai. BTTS, Over 2.5, Double Chance dan Draw No Bet.",
      ogTitle: "Jenis Taruhan Dijelaskan - BetsPlug",
      ogDescription:
        "Pembahasan mendalam tentang BTTS, Over 2.5, Double Chance, Draw No Bet, dan pasar sepak bola populer lainnya.",
    },
  },

  /* ─────────────────────────── WELCOME ──────────────────────── */
  "/welcome": {
    en: {
      title: "Welcome Aboard - BetsPlug",
      description:
        "Your BetsPlug membership is active. Log in to see today's picks, track your ROI and start winning smarter.",
    },
    nl: {
      title: "Welkom aan Boord - BetsPlug",
      description:
        "Uw BetsPlug-lidmaatschap is actief. Log in om de picks van vandaag te zien, uw ROI te volgen en slimmer te beginnen winnen.",
    },
    de: {
      title: "Willkommen an Bord - BetsPlug",
      description:
        "Ihre BetsPlug-Mitgliedschaft ist aktiv. Melden Sie sich an, um die heutigen Tipps zu sehen und Ihren ROI zu verfolgen.",
    },
    fr: {
      title: "Bienvenue a Bord - BetsPlug",
      description:
        "Votre abonnement BetsPlug est actif. Connectez-vous pour voir les picks du jour, suivre votre ROI et commencer a gagner plus intelligemment.",
    },
    es: {
      title: "Bienvenido a Bordo - BetsPlug",
      description:
        "Su membresia BetsPlug esta activa. Inicie sesion para ver las selecciones de hoy, seguir su ROI y comenzar a ganar de forma mas inteligente.",
    },
    it: {
      title: "Benvenuto a Bordo - BetsPlug",
      description:
        "La tua iscrizione BetsPlug e attiva. Accedi per vedere le selezioni di oggi, monitorare il tuo ROI e iniziare a vincere in modo piu intelligente.",
    },
    sw: {
      title: "Karibu Ndani - BetsPlug",
      description:
        "Uanachama wako wa BetsPlug umewashwa. Ingia kuona chaguzi za leo, kufuatilia ROI yako na kuanza kushinda kwa akili zaidi.",
    },
    id: {
      title: "Selamat Datang - BetsPlug",
      description:
        "Keanggotaan BetsPlug Anda aktif. Masuk untuk melihat prediksi hari ini, melacak ROI, dan mulai menang lebih cerdas.",
    },
  },

  /* ─────────────────────────── B2B ────────────────────────────── */
  "/b2b": {
    en: {
      title: "B2B Partnerships - BetsPlug",
      description:
        "Partner with BetsPlug for AI-powered football analytics. Data licensing, white-label solutions, and affiliate partnerships for businesses.",
    },
    nl: {
      title: "B2B Partnerschappen - BetsPlug",
      description:
        "Word partner van BetsPlug voor AI-gestuurde voetbalanalyse. Datalicenties, white-label oplossingen en affiliate-partnerschappen voor bedrijven.",
    },
    de: {
      title: "B2B Partnerschaften - BetsPlug",
      description:
        "Werden Sie Partner von BetsPlug fuer KI-gestuetzte Fussballanalyse. Datenlizenzen, White-Label-Loesungen und Affiliate-Partnerschaften fuer Unternehmen.",
    },
    fr: {
      title: "Partenariats B2B - BetsPlug",
      description:
        "Devenez partenaire de BetsPlug pour l'analyse football par IA. Licences de donnees, solutions en marque blanche et partenariats d'affiliation pour les entreprises.",
    },
    es: {
      title: "Asociaciones B2B - BetsPlug",
      description:
        "Asociese con BetsPlug para analisis de futbol con IA. Licencias de datos, soluciones de marca blanca y asociaciones de afiliados para empresas.",
    },
    it: {
      title: "Partnership B2B - BetsPlug",
      description:
        "Diventa partner di BetsPlug per analisi calcistiche con IA. Licenze dati, soluzioni white-label e partnership di affiliazione per aziende.",
    },
    sw: {
      title: "Ushirikiano wa B2B - BetsPlug",
      description:
        "Shirikiana na BetsPlug kwa uchambuzi wa mpira kwa AI. Leseni za data, suluhisho za white-label na ushirikiano wa washirika kwa biashara.",
    },
    id: {
      title: "Kemitraan B2B - BetsPlug",
      description:
        "Bermitra dengan BetsPlug untuk analisis sepak bola bertenaga AI. Lisensi data, solusi white-label, dan kemitraan afiliasi untuk bisnis.",
    },
  },

  /* ─────────────────────────── CHECKOUT ─────────────────────── */
  "/checkout": {
    en: {
      title: "Checkout - Start Your BetsPlug Subscription",
      description:
        "Complete your BetsPlug subscription in three quick steps. 14-day money-back guarantee, SSL-encrypted checkout, cancel any time.",
    },
    nl: {
      title: "Afrekenen - Start Uw BetsPlug-abonnement",
      description:
        "Voltooi uw BetsPlug-abonnement in drie snelle stappen. 14 dagen geld-terug-garantie, SSL-versleutelde checkout, op elk moment opzegbaar.",
    },
    de: {
      title: "Kasse - Starten Sie Ihr BetsPlug-Abo",
      description:
        "Schliessen Sie Ihr BetsPlug-Abonnement in drei schnellen Schritten ab. 14 Tage Geld-zurueck-Garantie, SSL-verschluesselter Checkout, jederzeit kuendbar.",
    },
    fr: {
      title: "Paiement - Demarrez Votre Abonnement BetsPlug",
      description:
        "Finalisez votre abonnement BetsPlug en trois etapes rapides. Garantie de remboursement de 14 jours, paiement crypte SSL, resiliation a tout moment.",
    },
    es: {
      title: "Pago - Comience Su Suscripcion BetsPlug",
      description:
        "Complete su suscripcion BetsPlug en tres pasos rapidos. Garantia de devolucion de 14 dias, pago encriptado SSL, cancele en cualquier momento.",
    },
    it: {
      title: "Checkout - Inizia il Tuo Abbonamento BetsPlug",
      description:
        "Completa il tuo abbonamento BetsPlug in tre rapidi passaggi. Garanzia di rimborso di 14 giorni, checkout crittografato SSL, cancella quando vuoi.",
    },
    sw: {
      title: "Malipo - Anza Usajili Wako wa BetsPlug",
      description:
        "Kamilisha usajili wako wa BetsPlug kwa hatua tatu za haraka. Dhamana ya kurudishiwa pesa siku 14, malipo yaliyosimbwa kwa SSL, futa wakati wowote.",
    },
    id: {
      title: "Pembayaran - Mulai Langganan BetsPlug Anda",
      description:
        "Selesaikan langganan BetsPlug Anda dalam tiga langkah cepat. Jaminan uang kembali 14 hari, checkout terenkripsi SSL, batalkan kapan saja.",
    },
  },
};
