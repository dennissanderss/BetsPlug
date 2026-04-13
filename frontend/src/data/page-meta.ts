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
 *   - Separator: middle dot (·) everywhere
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
      title: "AI-Powered Football Predictions · BetsPlug",
      description:
        "AI-powered football predictions with 4 models. Live probabilities, Elo ratings, and a verified track record across 15+ leagues. Start your free trial today.",
      ogTitle: "AI-Powered Football Predictions · BetsPlug",
      ogDescription:
        "AI-powered football predictions with live probabilities, Elo ratings, and a verified track record across 15+ leagues.",
    },
    nl: {
      title: "AI-gedreven Voetbalvoorspellingen · BetsPlug",
      description:
        "AI-gedreven voetbalvoorspellingen met 4 modellen. Live kansen, Elo-ratings en een geverifieerd track record voor 15+ competities. Start vandaag je gratis proefperiode.",
      ogTitle: "AI-gedreven Voetbalvoorspellingen · BetsPlug",
      ogDescription:
        "AI-gedreven voetbalvoorspellingen met live kansen, Elo-ratings en een geverifieerd track record voor 15+ competities.",
    },
    de: {
      title: "KI-gestützte Fußballvorhersagen · BetsPlug",
      description:
        "KI-gestützte Fußballvorhersagen mit 4 Modellen. Live-Wahrscheinlichkeiten, Elo-Ratings und verifizierte Bilanz für 15+ Ligen. Jetzt kostenlos testen.",
      ogTitle: "KI-gestützte Fußballvorhersagen · BetsPlug",
      ogDescription:
        "KI-gestützte Fußballvorhersagen mit Live-Wahrscheinlichkeiten, Elo-Ratings und verifizierter Bilanz für 15+ Ligen.",
    },
    fr: {
      title: "Prédictions Football par IA · BetsPlug",
      description:
        "Prédictions football par IA avec 4 modèles. Probabilités en direct, classements Elo et historique vérifié pour 15+ ligues. Commencez votre essai gratuit.",
      ogTitle: "Prédictions Football par IA · BetsPlug",
      ogDescription:
        "Prédictions football par IA avec probabilités en direct, classements Elo et historique vérifié pour 15+ ligues.",
    },
    es: {
      title: "Predicciones de Fútbol con IA · BetsPlug",
      description:
        "Predicciones de fútbol con IA y 4 modelos. Probabilidades en vivo, ratings Elo e historial verificado en 15+ ligas. Comienza tu prueba gratis hoy.",
      ogTitle: "Predicciones de Fútbol con IA · BetsPlug",
      ogDescription:
        "Predicciones de fútbol con IA, probabilidades en vivo, ratings Elo e historial verificado en 15+ ligas.",
    },
    it: {
      title: "Pronostici Calcio con IA · BetsPlug",
      description:
        "Pronostici calcio con IA e 4 modelli. Probabilità in tempo reale, rating Elo e storico verificato per 15+ campionati. Inizia la prova gratuita oggi.",
      ogTitle: "Pronostici Calcio con IA · BetsPlug",
      ogDescription:
        "Pronostici calcio con IA, probabilità in tempo reale, rating Elo e storico verificato per 15+ campionati.",
    },
    sw: {
      title: "Utabiri wa Soka kwa AI · BetsPlug",
      description:
        "Utabiri wa soka kwa AI na mifano 4. Uwezekano wa moja kwa moja, ukadiriaji wa Elo na rekodi iliyothibitishwa kwa ligi 15+. Anza majaribio yako ya bure.",
      ogTitle: "Utabiri wa Soka kwa AI · BetsPlug",
      ogDescription:
        "Utabiri wa soka kwa AI na uwezekano wa moja kwa moja, ukadiriaji wa Elo na rekodi iliyothibitishwa kwa ligi 15+.",
    },
    id: {
      title: "Prediksi Sepak Bola Bertenaga AI · BetsPlug",
      description:
        "Prediksi sepak bola bertenaga AI dengan 4 model. Probabilitas langsung, peringkat Elo, dan rekam jejak terverifikasi untuk 15+ liga. Mulai uji coba gratis.",
      ogTitle: "Prediksi Sepak Bola Bertenaga AI · BetsPlug",
      ogDescription:
        "Prediksi sepak bola bertenaga AI dengan probabilitas langsung, peringkat Elo, dan rekam jejak terverifikasi untuk 15+ liga.",
    },
  },

  /* ─────────────────────────── ARTICLES ─────────────────────── */
  "/articles": {
    en: {
      title: "AI Football Predictions & Betting Tips · BetsPlug",
      description:
        "Football news, AI match predictions and data-driven betting tips across the Premier League, La Liga, Bundesliga, Serie A and more from the BetsPlug research team.",
      ogTitle: "AI Football Analysis & Betting Tips · BetsPlug",
      ogDescription:
        "AI football match breakdowns and data-driven betting tips from the BetsPlug research team.",
    },
    nl: {
      title: "AI Voetbalvoorspellingen & Wedtips · BetsPlug",
      description:
        "Voetbalnieuws, AI wedstrijdvoorspellingen en datagedreven wedtips voor de Premier League, La Liga, Bundesliga, Serie A en meer van het BetsPlug-team.",
      ogTitle: "AI Voetbalanalyse & Wedtips · BetsPlug",
      ogDescription:
        "AI voetbalvoorspellingen en datagedreven wedinzichten van het BetsPlug-onderzoeksteam.",
    },
    de: {
      title: "KI Fußballprognosen & Wett-Tipps · BetsPlug",
      description:
        "Fußballnews, KI Fußballprognosen und datenbasierte Wett-Tipps für Premier League, La Liga, Bundesliga, Serie A und mehr vom BetsPlug-Team.",
      ogTitle: "KI Fußballanalyse & Wett-Tipps · BetsPlug",
      ogDescription:
        "KI Fußballprognosen und datenbasierte Wett-Tipps vom BetsPlug-Forschungsteam.",
    },
    fr: {
      title: "Prédictions Football IA & Pronostics · BetsPlug",
      description:
        "Actualités football, prédictions football IA et pronostics basés sur les données pour la Premier League, la Liga, la Bundesliga et la Serie A par BetsPlug.",
      ogTitle: "Analyse Football IA & Pronostics · BetsPlug",
      ogDescription:
        "Prédictions football IA et pronostics basés sur les données par l'équipe de recherche BetsPlug.",
    },
    es: {
      title: "Predicciones Fútbol IA & Apuestas · BetsPlug",
      description:
        "Noticias de fútbol, predicciones fútbol IA e insights de apuestas basados en datos para la Premier League, La Liga, Bundesliga y Serie A por BetsPlug.",
      ogTitle: "Análisis de Fútbol IA & Apuestas · BetsPlug",
      ogDescription:
        "Predicciones fútbol IA e insights de apuestas basados en datos del equipo BetsPlug.",
    },
    it: {
      title: "Pronostici Calcio IA & Scommesse · BetsPlug",
      description:
        "News calcistiche, pronostici calcio IA e approfondimenti sulle scommesse basati sui dati per Premier League, Liga, Bundesliga e Serie A da BetsPlug.",
      ogTitle: "Analisi Calcistica IA & Scommesse · BetsPlug",
      ogDescription:
        "Pronostici calcio IA e approfondimenti sulle scommesse dal team di ricerca BetsPlug.",
    },
    sw: {
      title: "Utabiri wa Soka kwa AI & Makala · BetsPlug",
      description:
        "Habari za soka, utabiri wa soka kwa AI na uchambuzi wa soka unaotegemea data kwa Premier League, La Liga, Bundesliga na Serie A kutoka BetsPlug.",
      ogTitle: "Uchambuzi wa Soka kwa AI · BetsPlug",
      ogDescription:
        "Utabiri wa soka kwa AI na maarifa ya kamari kutoka timu ya utafiti ya BetsPlug.",
    },
    id: {
      title: "Prediksi Sepak Bola AI & Artikel · BetsPlug",
      description:
        "Berita sepak bola, prediksi sepak bola AI dan analisis sepak bola berbasis data untuk Premier League, La Liga, Bundesliga, dan Serie A dari tim BetsPlug.",
      ogTitle: "Analisis Sepak Bola AI · BetsPlug",
      ogDescription:
        "Prediksi sepak bola AI dan wawasan taruhan berbasis data dari tim riset BetsPlug.",
    },
  
},

  /* ─────────────────────────── ABOUT US ─────────────────────── */
  "/about-us": {
    en: {
      title: "About Us · BetsPlug AI Football Analytics Team",
      description:
        "Meet the two engineers building BetsPlug. Football fanatics with an ICT background, turning raw match data into transparent, probability-driven football predictions.",
      ogTitle: "About BetsPlug · The Team Behind the Edge",
      ogDescription:
        "Two engineers. 20+ years of combined ICT experience. One obsession: turning football data into a measurable edge.",
    },
    nl: {
      title: "Over Ons · BetsPlug AI Voetbalanalyse Team",
      description:
        "Maak kennis met de twee engineers achter BetsPlug. Voetbalfanaten met een ICT-achtergrond die ruwe data omzetten in transparante AI voetbalvoorspellingen.",
      ogTitle: "Over BetsPlug · Het Team Achter de Voorsprong",
      ogDescription:
        "Twee engineers. 20+ jaar gecombineerde ICT-ervaring. Eén obsessie: voetbaldata omzetten in meetbaar voordeel.",
    },
    de: {
      title: "Über Uns · BetsPlug KI Fußballanalyse-Team",
      description:
        "Lernen Sie die zwei Ingenieure hinter BetsPlug kennen. Fußballfans mit IT-Hintergrund, die Rohdaten in transparente KI Fußballprognosen verwandeln.",
      ogTitle: "Über BetsPlug · Das Team Hinter dem Vorsprung",
      ogDescription:
        "Zwei Ingenieure. Über 20 Jahre IT-Erfahrung. Eine Leidenschaft: Fußballdaten in messbaren Vorsprung verwandeln.",
    },
    fr: {
      title: "À Propos · Équipe BetsPlug Analyse Football IA",
      description:
        "Découvrez les deux ingénieurs derrière BetsPlug. Des passionnés de football avec une expertise en IT, créant des prédictions football IA transparentes et fiables.",
      ogTitle: "À Propos de BetsPlug · L'Équipe Derrière l'Avantage",
      ogDescription:
        "Deux ingénieurs. Plus de 20 ans d'expérience IT combinée. Une obsession : transformer les données en avantage mesurable.",
    },
    es: {
      title: "Sobre Nosotros · Equipo BetsPlug Análisis Fútbol",
      description:
        "Conoce a los dos ingenieros que construyen BetsPlug. Fanáticos del fútbol con formación en TI, convirtiendo datos en predicciones fútbol IA transparentes.",
      ogTitle: "Sobre BetsPlug · El Equipo Detrás de la Ventaja",
      ogDescription:
        "Dos ingenieros. Más de 20 años de experiencia combinada en TI. Una obsesión: convertir datos de fútbol en ventaja medible.",
    },
    it: {
      title: "Chi Siamo · Team BetsPlug Analisi Calcistica IA",
      description:
        "Scopri i due ingegneri dietro BetsPlug. Appassionati di calcio con background IT, che trasformano dati grezzi in pronostici calcio IA trasparenti e verificabili.",
      ogTitle: "Chi Siamo · Il Team Dietro il Vantaggio",
      ogDescription:
        "Due ingegneri. Oltre 20 anni di esperienza IT combinata. Un'ossessione: trasformare i dati calcistici in vantaggio misurabile.",
    },
    sw: {
      title: "Kuhusu Sisi · Timu ya BetsPlug Uchambuzi wa Soka",
      description:
        "Fahamu wahandisi wawili wanaojenga BetsPlug. Wapenda soka wenye ujuzi wa ICT, wanaobadilisha data mbichi kuwa utabiri wa soka unaotegemea uwezekano.",
      ogTitle: "Kuhusu BetsPlug · Timu Nyuma ya Ubora",
      ogDescription:
        "Wahandisi wawili. Zaidi ya miaka 20 ya uzoefu wa ICT. Shauku moja: kubadilisha data ya soka kuwa faida inayopimika.",
    },
    id: {
      title: "Tentang Kami · Tim BetsPlug Analisis Sepak Bola AI",
      description:
        "Kenali dua engineer di balik BetsPlug. Penggemar sepak bola dengan latar belakang TI, mengubah data mentah menjadi prediksi sepak bola AI yang transparan.",
      ogTitle: "Tentang BetsPlug · Tim di Balik Keunggulan",
      ogDescription:
        "Dua engineer. Lebih dari 20 tahun pengalaman TI gabungan. Satu obsesi: mengubah data sepak bola menjadi keunggulan terukur.",
    },
  
},

  /* ─────────────────────────── PRIVACY ──────────────────────── */
  "/privacy": {
    en: {
      title: "Privacy Policy · BetsPlug",
      description:
        "How BetsPlug collects, uses and protects your personal data. GDPR-compliant privacy policy for our AI football predictions and analytics platform.",
      ogTitle: "Privacy Policy · BetsPlug",
      ogDescription:
        "How BetsPlug collects, uses and protects your personal data. Fully GDPR-compliant.",
    },
    nl: {
      title: "Privacybeleid · BetsPlug",
      description:
        "Hoe BetsPlug uw persoonsgegevens verzamelt, gebruikt en beschermt. AVG-conform privacybeleid voor ons AI voetbalvoorspellingen en analyseplatform.",
      ogTitle: "Privacybeleid · BetsPlug",
      ogDescription:
        "Hoe BetsPlug uw persoonsgegevens verzamelt, gebruikt en beschermt. Volledig AVG-conform.",
    },
    de: {
      title: "Datenschutzrichtlinie · BetsPlug",
      description:
        "Wie BetsPlug Ihre personenbezogenen Daten erhebt, nutzt und schützt. DSGVO-konforme Datenschutzrichtlinie für unsere KI Fußballprognosen-Plattform.",
      ogTitle: "Datenschutzrichtlinie · BetsPlug",
      ogDescription:
        "Wie BetsPlug Ihre personenbezogenen Daten erhebt, nutzt und schützt. DSGVO-konform.",
    },
    fr: {
      title: "Politique de Confidentialité · BetsPlug",
      description:
        "Comment BetsPlug collecte, utilise et protège vos données personnelles. Politique conforme au RGPD pour notre plateforme de prédictions football IA.",
      ogTitle: "Politique de Confidentialité · BetsPlug",
      ogDescription:
        "Comment BetsPlug collecte, utilise et protège vos données personnelles. Conforme au RGPD.",
    },
    es: {
      title: "Política de Privacidad · BetsPlug",
      description:
        "Cómo BetsPlug recopila, utiliza y protege sus datos personales. Política de privacidad conforme al RGPD para nuestra plataforma de predicciones fútbol IA.",
      ogTitle: "Política de Privacidad · BetsPlug",
      ogDescription:
        "Cómo BetsPlug recopila, utiliza y protege sus datos personales. Conforme al RGPD.",
    },
    it: {
      title: "Informativa sulla Privacy · BetsPlug",
      description:
        "Come BetsPlug raccoglie, utilizza e protegge i tuoi dati personali. Informativa conforme al GDPR per la nostra piattaforma di pronostici calcio IA.",
      ogTitle: "Informativa sulla Privacy · BetsPlug",
      ogDescription:
        "Come BetsPlug raccoglie, utilizza e protegge i tuoi dati personali. Conforme al GDPR.",
    },
    sw: {
      title: "Sera ya Faragha · BetsPlug",
      description:
        "Jinsi BetsPlug inavyokusanya, kutumia na kulinda data yako binafsi. Sera ya faragha inayozingatia GDPR kwa jukwaa letu la utabiri wa soka kwa AI.",
      ogTitle: "Sera ya Faragha · BetsPlug",
      ogDescription:
        "Jinsi BetsPlug inavyokusanya, kutumia na kulinda data yako binafsi. Inazingatia GDPR.",
    },
    id: {
      title: "Kebijakan Privasi · BetsPlug",
      description:
        "Bagaimana BetsPlug mengumpulkan, menggunakan, dan melindungi data pribadi Anda. Kebijakan privasi sesuai GDPR untuk platform prediksi sepak bola AI kami.",
      ogTitle: "Kebijakan Privasi · BetsPlug",
      ogDescription:
        "Bagaimana BetsPlug mengumpulkan, menggunakan, dan melindungi data pribadi Anda. Sesuai GDPR.",
    },
  
},

  /* ─────────────────────────── TERMS ────────────────────────── */
  "/terms": {
    en: {
      title: "Terms of Service · BetsPlug",
      description:
        "The terms and conditions that apply when you use BetsPlug. Please read them before creating an account or subscribing to our AI football analytics platform.",
      ogTitle: "Terms of Service · BetsPlug",
      ogDescription:
        "The terms and conditions that apply when you use BetsPlug. Read before subscribing.",
    },
    nl: {
      title: "Algemene Voorwaarden · BetsPlug",
      description:
        "De voorwaarden die van toepassing zijn wanneer u BetsPlug gebruikt. Lees ze voordat u een account aanmaakt of een abonnement afsluit op ons analyseplatform.",
      ogTitle: "Algemene Voorwaarden · BetsPlug",
      ogDescription:
        "De voorwaarden die van toepassing zijn wanneer u BetsPlug gebruikt. Lees voor registratie.",
    },
    de: {
      title: "Nutzungsbedingungen · BetsPlug",
      description:
        "Die Nutzungsbedingungen für BetsPlug. Bitte lesen Sie diese, bevor Sie ein Konto erstellen oder ein Abonnement für unsere KI Fußballprognosen-Plattform abschließen.",
      ogTitle: "Nutzungsbedingungen · BetsPlug",
      ogDescription:
        "Die Nutzungsbedingungen, die bei der Nutzung von BetsPlug gelten. Vor Registrierung lesen.",
    },
    fr: {
      title: "Conditions d'Utilisation · BetsPlug",
      description:
        "Les conditions générales applicables lors de l'utilisation de BetsPlug. Veuillez les lire avant de créer un compte ou de vous abonner à notre plateforme.",
      ogTitle: "Conditions d'Utilisation · BetsPlug",
      ogDescription:
        "Les conditions générales applicables lors de l'utilisation de BetsPlug. À lire avant inscription.",
    },
    es: {
      title: "Términos de Servicio · BetsPlug",
      description:
        "Los términos y condiciones que se aplican al usar BetsPlug. Léalos antes de crear una cuenta o suscribirse a nuestra plataforma de predicciones fútbol IA.",
      ogTitle: "Términos de Servicio · BetsPlug",
      ogDescription:
        "Los términos y condiciones que se aplican al usar BetsPlug. Leer antes de suscribirse.",
    },
    it: {
      title: "Termini di Servizio · BetsPlug",
      description:
        "I termini e le condizioni applicabili quando si utilizza BetsPlug. Si prega di leggerli prima di creare un account o sottoscrivere un abbonamento alla piattaforma.",
      ogTitle: "Termini di Servizio · BetsPlug",
      ogDescription:
        "I termini e le condizioni applicabili quando si utilizza BetsPlug. Leggere prima dell'iscrizione.",
    },
    sw: {
      title: "Masharti ya Huduma · BetsPlug",
      description:
        "Masharti yanayotumika unapotumia BetsPlug. Tafadhali yasome kabla ya kuunda akaunti au kujisajili kwenye jukwaa letu la utabiri wa soka kwa AI.",
      ogTitle: "Masharti ya Huduma · BetsPlug",
      ogDescription:
        "Masharti yanayotumika unapotumia BetsPlug. Soma kabla ya kujisajili.",
    },
    id: {
      title: "Ketentuan Layanan · BetsPlug",
      description:
        "Syarat dan ketentuan yang berlaku saat Anda menggunakan BetsPlug. Harap baca sebelum membuat akun atau berlangganan platform prediksi sepak bola AI kami.",
      ogTitle: "Ketentuan Layanan · BetsPlug",
      ogDescription:
        "Syarat dan ketentuan yang berlaku saat Anda menggunakan BetsPlug. Baca sebelum berlangganan.",
    },
  
},

  /* ─────────────────────────── COOKIES ──────────────────────── */
  "/cookies": {
    en: {
      title: "Cookie Policy · BetsPlug",
      description:
        "Which cookies BetsPlug uses, why we use them, and how you can manage your cookie preferences on our AI football predictions and analytics platform.",
      ogTitle: "Cookie Policy · BetsPlug",
      ogDescription:
        "Which cookies BetsPlug uses, why we use them, and how you can manage your preferences.",
    },
    nl: {
      title: "Cookiebeleid · BetsPlug",
      description:
        "Welke cookies BetsPlug gebruikt, waarom we ze gebruiken en hoe u uw cookievoorkeuren kunt beheren op ons AI voetbalvoorspellingen en analyseplatform.",
      ogTitle: "Cookiebeleid · BetsPlug",
      ogDescription:
        "Welke cookies BetsPlug gebruikt, waarom we ze gebruiken en hoe u uw voorkeuren kunt beheren.",
    },
    de: {
      title: "Cookie-Richtlinie · BetsPlug",
      description:
        "Welche Cookies BetsPlug verwendet, warum wir sie verwenden und wie Sie Ihre Cookie-Einstellungen auf unserer KI Fußballprognosen-Plattform verwalten können.",
      ogTitle: "Cookie-Richtlinie · BetsPlug",
      ogDescription:
        "Welche Cookies BetsPlug verwendet und wie Sie Ihre Einstellungen verwalten können.",
    },
    fr: {
      title: "Politique des Cookies · BetsPlug",
      description:
        "Quels cookies BetsPlug utilise, pourquoi nous les utilisons et comment gérer vos préférences sur notre plateforme de prédictions football IA et d'analyse.",
      ogTitle: "Politique des Cookies · BetsPlug",
      ogDescription:
        "Quels cookies BetsPlug utilise, pourquoi nous les utilisons et comment gérer vos préférences.",
    },
    es: {
      title: "Política de Cookies · BetsPlug",
      description:
        "Qué cookies usa BetsPlug, por qué las usamos y cómo puede gestionar sus preferencias de cookies en nuestra plataforma de predicciones fútbol IA y análisis.",
      ogTitle: "Política de Cookies · BetsPlug",
      ogDescription:
        "Qué cookies usa BetsPlug, por qué las usamos y cómo gestionar sus preferencias.",
    },
    it: {
      title: "Politica sui Cookie · BetsPlug",
      description:
        "Quali cookie utilizza BetsPlug, perché li utilizziamo e come gestire le preferenze sui cookie sulla nostra piattaforma di pronostici calcio IA e analisi.",
      ogTitle: "Politica sui Cookie · BetsPlug",
      ogDescription:
        "Quali cookie utilizza BetsPlug, perché li utilizziamo e come gestire le preferenze.",
    },
    sw: {
      title: "Sera ya Vidakuzi · BetsPlug",
      description:
        "Vidakuzi gani BetsPlug inatumia, kwa nini tunazitumia na jinsi unavyoweza kudhibiti mapendeleo yako kwenye jukwaa letu la utabiri wa soka na uchambuzi wa soka.",
      ogTitle: "Sera ya Vidakuzi · BetsPlug",
      ogDescription:
        "Vidakuzi gani BetsPlug inatumia na jinsi unavyoweza kudhibiti mapendeleo yako.",
    },
    id: {
      title: "Kebijakan Cookie · BetsPlug",
      description:
        "Cookie apa yang digunakan BetsPlug, mengapa kami menggunakannya, dan bagaimana Anda dapat mengelola preferensi cookie di platform prediksi sepak bola AI kami.",
      ogTitle: "Kebijakan Cookie · BetsPlug",
      ogDescription:
        "Cookie apa yang digunakan BetsPlug dan bagaimana Anda dapat mengelola preferensi Anda.",
    },
  
},

  /* ─────────────────────── RESPONSIBLE GAMBLING ─────────────── */
  "/responsible-gambling": {
    en: {
      title: "18+ Play Responsibly · BetsPlug",
      description:
        "BetsPlug is not a betting site. Read our responsible gambling policy, learn the signs of problem gambling, and find help resources.",
    },
    nl: {
      title: "18+ Speel Verantwoord · BetsPlug",
      description:
        "BetsPlug is geen goksite. Lees ons beleid voor verantwoord gokken, herken de signalen van gokproblemen en vind hulporganisaties.",
    },
    de: {
      title: "18+ Verantwortungsvolles Spielen · BetsPlug",
      description:
        "BetsPlug ist keine Wettseite. Lesen Sie unsere Richtlinie zum verantwortungsvollen Spielen, erkennen Sie Anzeichen von Spielsucht und finden Sie Hilfe.",
    },
    fr: {
      title: "18+ Jouez Responsable · BetsPlug",
      description:
        "BetsPlug n'est pas un site de paris. Lisez notre politique de jeu responsable, identifiez les signes et trouvez de l'aide.",
    },
    es: {
      title: "18+ Juega Responsablemente · BetsPlug",
      description:
        "BetsPlug no es un sitio de apuestas. Lee nuestra política de juego responsable, reconoce las señales y encuentra ayuda.",
    },
    it: {
      title: "18+ Gioca Responsabilmente · BetsPlug",
      description:
        "BetsPlug non è un sito di scommesse. Leggi la nostra politica di gioco responsabile, riconosci i segnali e trova aiuto.",
    },
    sw: {
      title: "18+ Cheza kwa Uwajibikaji · BetsPlug",
      description:
        "BetsPlug si tovuti ya kamari. Soma sera yetu ya kamari ya uwajibikaji, tambua ishara za tatizo la kamari na pata msaada.",
    },
    id: {
      title: "18+ Bermain Bertanggung Jawab · BetsPlug",
      description:
        "BetsPlug bukan situs taruhan. Baca kebijakan perjudian bertanggung jawab kami, kenali tanda-tanda masalah dan temukan bantuan.",
    },
  },

  /* ─────────────────────────── HOW IT WORKS ─────────────────── */
  "/how-it-works": {
    en: {
      title: "How It Works · BetsPlug Pulse AI Predictions",
      description:
        "See how BetsPlug Pulse analyses every match, delivers a daily Pick of the Day with 66.7% accuracy, and lets you track every prediction transparently.",
      ogTitle: "How BetsPlug Works · Pulse AI Predictions",
      ogDescription:
        "One AI engine. 66.7% Pick of the Day accuracy. 70+ leagues. Full CSV download. Every prediction tracked and verifiable.",
    },
    nl: {
      title: "Hoe Het Werkt · BetsPlug Pulse AI-Voorspellingen",
      description:
        "Ontdek hoe BetsPlug Pulse elke wedstrijd analyseert, dagelijks een Pick of the Day levert met 66,7% nauwkeurigheid en je elke voorspelling transparant laat volgen.",
      ogTitle: "Hoe BetsPlug Werkt · Pulse AI-Voorspellingen",
      ogDescription:
        "Eén AI-engine. 66,7% Pick of the Day nauwkeurigheid. 70+ competities. Volledige CSV-download. Elke voorspelling gevolgd en verifieerbaar.",
    },
    de: {
      title: "So Funktioniert Es · BetsPlug KI-Prognosemaschine",
      description:
        "Schritt-für-Schritt-Erklärung der BetsPlug KI-Prognosemaschine: Datenerhebung, Feature-Engineering, Modelltraining und verifizierbare Fußballprognosen.",
      ogTitle: "So Funktioniert BetsPlug · KI-Prognosemaschine",
      ogDescription:
        "14 Datenquellen. Über 1.200 Features. 4 unabhängige Modelle. Jeder Tipp mit Zeitstempel und öffentlich verifizierbar.",
    },
    fr: {
      title: "Comment Ça Marche · Moteur BetsPlug IA",
      description:
        "Présentation complète du moteur de prédictions football IA BetsPlug : collecte de données, feature engineering, entraînement des modèles et pronostics vérifiables.",
      ogTitle: "Comment Fonctionne BetsPlug · Moteur IA",
      ogDescription:
        "14 sources de données. Plus de 1 200 features. 4 modèles indépendants. Chaque pick horodaté et vérifiable.",
    },
    es: {
      title: "Cómo Funciona · Motor de Predicción BetsPlug IA",
      description:
        "Guía completa paso a paso del motor de predicciones fútbol IA BetsPlug: recopilación de datos, ingeniería de features, entrenamiento de modelos y picks verificables.",
      ogTitle: "Cómo Funciona BetsPlug · Motor de Predicción IA",
      ogDescription:
        "14 fuentes de datos. Más de 1.200 features. 4 modelos independientes. Cada pick con marca de tiempo y verificable.",
    },
    it: {
      title: "Come Funziona · Motore di Previsione BetsPlug IA",
      description:
        "Guida completa passo dopo passo del motore di pronostici calcio IA BetsPlug: raccolta dati, feature engineering, addestramento modelli e pronostici verificabili.",
      ogTitle: "Come Funziona BetsPlug · Motore di Previsione IA",
      ogDescription:
        "14 fonti di dati. Oltre 1.200 feature. 4 modelli indipendenti. Ogni pronostico con timestamp e verificabile pubblicamente.",
    },
    sw: {
      title: "Jinsi Inavyofanya Kazi · Injini ya BetsPlug AI",
      description:
        "Mwongozo kamili wa hatua kwa hatua wa injini ya utabiri wa soka ya BetsPlug AI: ukusanyaji data, uhandisi wa vipengele na utabiri unaothibitishika.",
      ogTitle: "BetsPlug Inavyofanya Kazi · Injini ya Utabiri AI",
      ogDescription:
        "Vyanzo 14 vya data. Vipengele zaidi ya 1,200. Mifano 4 huru. Kila utabiri una muhuri wa wakati na unathibitishika.",
    },
    id: {
      title: "Cara Kerja · Mesin Prediksi BetsPlug AI",
      description:
        "Panduan lengkap langkah demi langkah mesin prediksi sepak bola AI BetsPlug: pengumpulan data, feature engineering, pelatihan model, dan prediksi yang dapat diverifikasi.",
      ogTitle: "Cara Kerja BetsPlug · Mesin Prediksi AI",
      ogDescription:
        "14 sumber data. 1.200+ fitur. 4 model independen. Setiap prediksi memiliki stempel waktu dan dapat diverifikasi publik.",
    },
  
},

  /* ─────────────────────────── TRACK RECORD ─────────────────── */
  "/track-record": {
    en: {
      title: "Track Record · Verified AI Prediction Results",
      description:
        "Transparent, auditable results for every BetsPlug AI football prediction. See how our models turn match data into a measurable edge - documented weekly, never cherry-picked.",
      ogTitle: "BetsPlug Track Record · Auditable Results",
      ogDescription:
        "58.3% hit rate. +14.6% ROI. 24,180 graded predictions. Every pick timestamped and logged to a public ledger.",
    },
    nl: {
      title: "Trackrecord · Geverifieerde AI-Voorspellingsresultaten",
      description:
        "Transparante, controleerbare resultaten voor elke BetsPlug AI voetbalvoorspelling. Zie hoe onze modellen data omzetten in meetbaar voordeel - wekelijks gedocumenteerd.",
      ogTitle: "BetsPlug Trackrecord · Controleerbare Resultaten",
      ogDescription:
        "58,3% hitrate. +14,6% ROI. 24.180 beoordeelde voorspellingen. Elke pick met tijdstempel op een publiek register.",
    },
    de: {
      title: "Bilanz · Verifizierte KI-Prognoseergebnisse",
      description:
        "Transparente, prüfbare Ergebnisse für jeden BetsPlug KI Fußballprognose-Tipp. Sehen Sie, wie unsere Modelle Daten in messbaren Vorsprung verwandeln - wöchentlich dokumentiert.",
      ogTitle: "BetsPlug Bilanz · Prüfbare Ergebnisse",
      ogDescription:
        "58,3% Trefferquote. +14,6% ROI. 24.180 bewertete Prognosen. Jeder Tipp mit Zeitstempel im öffentlichen Register.",
    },
    fr: {
      title: "Historique · Résultats Prédictions IA Vérifiés",
      description:
        "Des résultats transparents et vérifiables pour chaque prédiction football IA BetsPlug. Découvrez comment nos modèles transforment les données en avantage mesurable.",
      ogTitle: "Historique BetsPlug · Résultats Vérifiables",
      ogDescription:
        "58,3% de réussite. +14,6% ROI. 24 180 pronostics évalués. Chaque pick horodaté dans un registre public.",
    },
    es: {
      title: "Historial · Resultados Predicciones IA Verificados",
      description:
        "Resultados transparentes y auditables para cada predicción fútbol IA BetsPlug. Vea cómo nuestros modelos convierten datos en ventaja medible - documentado semanalmente.",
      ogTitle: "Historial BetsPlug · Resultados Auditables",
      ogDescription:
        "58,3% de acierto. +14,6% ROI. 24.180 predicciones calificadas. Cada pick con marca de tiempo en registro público.",
    },
    it: {
      title: "Storico · Risultati Pronostici IA Verificati",
      description:
        "Risultati trasparenti e verificabili per ogni pronostico calcio IA BetsPlug. Scopri come i nostri modelli trasformano dati in vantaggio misurabile - documentato settimanalmente.",
      ogTitle: "Storico BetsPlug · Risultati Verificabili",
      ogDescription:
        "58,3% di successo. +14,6% ROI. 24.180 pronostici valutati. Ogni pronostico con timestamp nel registro pubblico.",
    },
    sw: {
      title: "Rekodi ya Matokeo · Utabiri wa AI Uliothibitishwa",
      description:
        "Matokeo ya uwazi na yanayokaguliwa kwa kila utabiri wa soka wa BetsPlug AI. Angalia jinsi mifano yetu inavyobadilisha data kuwa faida inayopimika kila wiki.",
      ogTitle: "Rekodi ya BetsPlug · Matokeo Yanayokaguliwa",
      ogDescription:
        "58.3% kiwango cha mafanikio. +14.6% ROI. Utabiri 24,180 uliokadiriwa. Kila chaguo lina muhuri wa wakati.",
    },
    id: {
      title: "Rekam Jejak · Hasil Prediksi AI Terverifikasi",
      description:
        "Hasil transparan dan dapat diaudit untuk setiap prediksi sepak bola AI BetsPlug. Lihat bagaimana model AI kami mengubah data menjadi keunggulan terukur - didokumentasikan mingguan.",
      ogTitle: "Rekam Jejak BetsPlug · Hasil yang Dapat Diaudit",
      ogDescription:
        "58,3% tingkat akurasi. +14,6% ROI. 24.180 prediksi dinilai. Setiap prediksi memiliki stempel waktu di register publik.",
    },
  
},

  /* ─────────────────────────── LOGIN ────────────────────────── */
  "/login": {
    en: {
      title: "Log In · BetsPlug",
      description:
        "Log in to your BetsPlug account to see today's AI football predictions, track your ROI, and manage your subscription for match predictions and betting tips.",
    },
    nl: {
      title: "Inloggen · BetsPlug",
      description:
        "Log in op uw BetsPlug-account om de AI voetbalvoorspellingen van vandaag te zien, uw ROI te volgen en uw abonnement voor wedstrijdvoorspellingen te beheren.",
    },
    de: {
      title: "Anmelden · BetsPlug",
      description:
        "Melden Sie sich bei Ihrem BetsPlug-Konto an, um die heutigen KI Fußballprognosen zu sehen, Ihren ROI zu verfolgen und Ihr Abo für Wett-Tipps zu verwalten.",
    },
    fr: {
      title: "Connexion · BetsPlug",
      description:
        "Connectez-vous à votre compte BetsPlug pour voir les prédictions football IA du jour, suivre votre ROI et gérer votre abonnement aux pronostics.",
    },
    es: {
      title: "Iniciar Sesión · BetsPlug",
      description:
        "Inicie sesión en su cuenta BetsPlug para ver las predicciones fútbol IA de hoy, seguir su ROI y gestionar su suscripción de apuestas y análisis de fútbol.",
    },
    it: {
      title: "Accedi · BetsPlug",
      description:
        "Accedi al tuo account BetsPlug per vedere i pronostici calcio IA di oggi, monitorare il tuo ROI e gestire il tuo abbonamento per analisi calcistica e scommesse.",
    },
    sw: {
      title: "Ingia · BetsPlug",
      description:
        "Ingia kwenye akaunti yako ya BetsPlug kuona utabiri wa soka wa AI wa leo, kufuatilia ROI yako na kudhibiti usajili wako wa uchambuzi wa soka.",
    },
    id: {
      title: "Masuk · BetsPlug",
      description:
        "Masuk ke akun BetsPlug Anda untuk melihat prediksi sepak bola AI hari ini, melacak ROI, dan mengelola langganan analisis sepak bola Anda.",
    },
  
},

  /* ─────────────────────── MATCH PREDICTIONS ────────────────── */
  "/match-predictions": {
    en: {
      title: "AI Match Predictions · Free Football Picks · BetsPlug",
      description:
        "Preview 3 free AI football predictions with win probabilities and confidence scores. Unlock the full slate of upcoming match predictions with a BetsPlug subscription.",
      ogTitle: "Free AI Match Predictions · BetsPlug",
      ogDescription:
        "Preview 3 free AI-powered match predictions. Unlock the rest with a trial.",
    },
    nl: {
      title: "AI Wedstrijdvoorspellingen · Gratis Picks · BetsPlug",
      description:
        "Bekijk 3 gratis AI voetbalvoorspellingen met winstkansen en vertrouwensscores. Ontgrendel alle wedstrijdvoorspellingen met een BetsPlug-abonnement.",
      ogTitle: "Gratis AI Wedstrijdvoorspellingen · BetsPlug",
      ogDescription:
        "Bekijk 3 gratis AI voetbalvoorspellingen. Ontgrendel de rest met een proefabonnement.",
    },
    de: {
      title: "KI Spielvorhersagen · Gratis Fußball-Tipps · BetsPlug",
      description:
        "Vorschau auf 3 kostenlose KI Fußballprognosen mit Siegwahrscheinlichkeiten und Vertrauenswerten. Alle Spielvorhersagen freischalten mit einem BetsPlug-Abo.",
      ogTitle: "Kostenlose KI Spielvorhersagen · BetsPlug",
      ogDescription:
        "Vorschau auf 3 kostenlose KI Fußballprognosen. Den Rest freischalten mit einem Probeabo.",
    },
    fr: {
      title: "Prédictions de Matchs IA · Pronostics Gratuits · BetsPlug",
      description:
        "Aperçu de 3 prédictions football IA gratuites avec probabilités de victoire et scores de confiance. Débloquez tous les pronostics avec un abonnement BetsPlug.",
      ogTitle: "Prédictions Football IA Gratuites · BetsPlug",
      ogDescription:
        "Aperçu de 3 prédictions football IA gratuites. Débloquez le reste avec un essai.",
    },
    es: {
      title: "Predicciones IA · Picks de Fútbol Gratis · BetsPlug",
      description:
        "Vista previa de 3 predicciones fútbol IA gratuitas con probabilidades de victoria y puntuaciones de confianza. Desbloquee todas las apuestas con BetsPlug.",
      ogTitle: "Predicciones Fútbol IA Gratis · BetsPlug",
      ogDescription:
        "Vista previa de 3 predicciones fútbol IA gratuitas. Desbloquee el resto con una prueba.",
    },
    it: {
      title: "Pronostici Partite IA · Pick Gratuiti · BetsPlug",
      description:
        "Anteprima di 3 pronostici calcio IA gratuiti con probabilità di vittoria e punteggi di affidabilità. Sblocca tutte le scommesse con un abbonamento BetsPlug.",
      ogTitle: "Pronostici Calcio IA Gratuiti · BetsPlug",
      ogDescription:
        "Anteprima di 3 pronostici calcio IA gratuiti. Sblocca il resto con una prova.",
    },
    sw: {
      title: "Utabiri wa Mechi kwa AI · Picks Bure · BetsPlug",
      description:
        "Hakiki utabiri 3 wa soka bure kwa AI na uwezekano wa kushinda na alama za kujiamini. Fungua utabiri wote wa mechi na usajili wa BetsPlug.",
      ogTitle: "Utabiri wa Soka kwa AI Bure · BetsPlug",
      ogDescription:
        "Hakiki utabiri 3 bure wa soka kwa AI. Fungua zingine na majaribio.",
    },
    id: {
      title: "Prediksi Pertandingan AI · Picks Gratis · BetsPlug",
      description:
        "Pratinjau 3 prediksi sepak bola AI gratis dengan probabilitas kemenangan dan skor kepercayaan. Buka semua prediksi pertandingan dengan langganan BetsPlug.",
      ogTitle: "Prediksi Sepak Bola AI Gratis · BetsPlug",
      ogDescription:
        "Pratinjau 3 prediksi sepak bola AI gratis. Buka sisanya dengan uji coba.",
    },
  
},

  /* ─────────────────────────── LEARN ────────────────────────── */
  "/learn": {
    en: {
      title: "Learn Football Betting · Value, xG, Elo · BetsPlug",
      description:
        "In-depth pillar guides on the math behind sharp football betting - value betting, expected goals, Elo ratings, the Kelly criterion, Poisson models, and bankroll management.",
      ogTitle: "Learn Football Betting · BetsPlug",
      ogDescription:
        "Six deep-dive pillar guides covering value betting, xG, Elo, Kelly, Poisson and bankroll management.",
    },
    nl: {
      title: "Leer Voetbalwedden · Value, xG, Elo · BetsPlug",
      description:
        "Diepgaande pillar-gidsen over de wiskunde achter scherpe wedtips - value betting, expected goals, Elo-ratings, Kelly-criterium, Poisson-modellen en bankroll management.",
      ogTitle: "Leer Voetbalwedden · BetsPlug",
      ogDescription:
        "Zes diepgaande pillar-gidsen over value betting, xG, Elo, Kelly, Poisson en bankroll management.",
    },
    de: {
      title: "Fußballwetten Lernen · Value, xG, Elo · BetsPlug",
      description:
        "Ausführliche Pillar-Guides zur Mathematik hinter klugen Wett-Tipps - Value Betting, Expected Goals, Elo-Ratings, Kelly-Kriterium, Poisson und Bankroll-Management.",
      ogTitle: "Fußballwetten Lernen · BetsPlug",
      ogDescription:
        "Sechs tiefgehende Pillar-Guides zu Value Betting, xG, Elo, Kelly, Poisson und Bankroll-Management.",
    },
    fr: {
      title: "Apprendre les Paris · Value, xG, Elo · BetsPlug",
      description:
        "Guides approfondis sur les maths derrière les pronostics football intelligents - value betting, expected goals, classements Elo, critère de Kelly, modèles de Poisson.",
      ogTitle: "Apprendre les Paris Football · BetsPlug",
      ogDescription:
        "Six guides approfondis sur le value betting, xG, Elo, Kelly, Poisson et la gestion de bankroll.",
    },
    es: {
      title: "Aprende Apuestas Fútbol · Value, xG · BetsPlug",
      description:
        "Guías en profundidad sobre las matemáticas detrás de las apuestas inteligentes - value betting, goles esperados, ratings Elo, criterio Kelly y modelos Poisson.",
      ogTitle: "Aprende Apuestas de Fútbol · BetsPlug",
      ogDescription:
        "Seis guías en profundidad sobre value betting, xG, Elo, Kelly, Poisson y gestión de bankroll.",
    },
    it: {
      title: "Impara le Scommesse Calcio · Value, xG · BetsPlug",
      description:
        "Guide approfondite sulla matematica delle scommesse calcistiche intelligenti - value betting, expected goals, rating Elo, criterio di Kelly, modelli Poisson.",
      ogTitle: "Impara le Scommesse Calcio · BetsPlug",
      ogDescription:
        "Sei guide approfondite su value betting, xG, Elo, Kelly, Poisson e gestione del bankroll.",
    },
    sw: {
      title: "Jifunze Kamari ya Soka · Value, xG, Elo · BetsPlug",
      description:
        "Miongozo ya kina kuhusu hesabu nyuma ya uchambuzi wa soka - value betting, expected goals, Elo ratings, Kelly criterion, Poisson models na usimamizi wa bankroll.",
      ogTitle: "Jifunze Kamari ya Soka · BetsPlug",
      ogDescription:
        "Miongozo sita ya kina kuhusu value betting, xG, Elo, Kelly, Poisson na usimamizi wa bankroll.",
    },
    id: {
      title: "Belajar Taruhan Sepak Bola · Value, xG · BetsPlug",
      description:
        "Panduan mendalam tentang matematika di balik taruhan sepak bola cerdas - value betting, expected goals, rating Elo, kriteria Kelly, model Poisson, dan manajemen bankroll.",
      ogTitle: "Belajar Taruhan Sepak Bola · BetsPlug",
      ogDescription:
        "Enam panduan mendalam tentang value betting, xG, Elo, Kelly, Poisson, dan manajemen bankroll.",
    },
  
},

  /* ─────────────────────────── BET TYPES ────────────────────── */
  "/bet-types": {
    en: {
      title: "Bet Types Explained · BTTS, Over 2.5, DC · BetsPlug",
      description:
        "How popular football betting markets work, how books price them and when the market offers value. Explainers for BTTS, Over 2.5 goals, Double Chance and Draw No Bet.",
      ogTitle: "Bet Types Explained · BetsPlug",
      ogDescription:
        "Deep dives into BTTS, Over 2.5, Double Chance, Draw No Bet and more popular football markets.",
    },
    nl: {
      title: "Wedtypes Uitgelegd · BTTS, Over 2.5, DC · BetsPlug",
      description:
        "Hoe populaire voetbalwedmarkten werken, hoe bookmakers ze prijzen en wanneer de markt value biedt. Uitleg bij BTTS, Over 2.5 goals, Double Chance en Draw No Bet.",
      ogTitle: "Wedtypes Uitgelegd · BetsPlug",
      ogDescription:
        "Diepgaande uitleg over BTTS, Over 2.5, Double Chance, Draw No Bet en meer populaire wedmarkten.",
    },
    de: {
      title: "Wettarten Erklärt · BTTS, Over 2.5, DC · BetsPlug",
      description:
        "Wie beliebte Fußball-Wettmärkte funktionieren, wie Buchmacher sie bepreisen und wann der Markt Value bietet. Erklärungen für BTTS, Over 2.5 Tore und mehr.",
      ogTitle: "Wettarten Erklärt · BetsPlug",
      ogDescription:
        "Tiefgehende Erklärungen zu BTTS, Over 2.5, Double Chance, Draw No Bet und weiteren Fußball-Märkten.",
    },
    fr: {
      title: "Types de Paris Expliqués · BTTS, Over 2.5 · BetsPlug",
      description:
        "Comment fonctionnent les marchés de pronostics football populaires, comment les bookmakers les tarifent et quand le marché offre de la valeur. BTTS, Over 2.5 et plus.",
      ogTitle: "Types de Paris Expliqués · BetsPlug",
      ogDescription:
        "Analyses approfondies de BTTS, Over 2.5, Double Chance, Draw No Bet et d'autres marchés populaires.",
    },
    es: {
      title: "Tipos de Apuesta Explicados · BTTS, Over 2.5 · BetsPlug",
      description:
        "Cómo funcionan los mercados de apuestas de fútbol populares, cómo los fijan los bookmakers y cuándo el mercado ofrece valor. BTTS, Over 2.5, Double Chance y más.",
      ogTitle: "Tipos de Apuesta Explicados · BetsPlug",
      ogDescription:
        "Análisis detallados de BTTS, Over 2.5, Double Chance, Draw No Bet y más mercados populares de fútbol.",
    },
    it: {
      title: "Tipi di Scommessa Spiegati · BTTS, Over 2.5 · BetsPlug",
      description:
        "Come funzionano i mercati delle scommesse calcistiche, come i bookmaker li quotano e quando il mercato offre valore. BTTS, Over 2.5, Double Chance e Draw No Bet.",
      ogTitle: "Tipi di Scommessa Spiegati · BetsPlug",
      ogDescription:
        "Approfondimenti su BTTS, Over 2.5, Double Chance, Draw No Bet e altri mercati calcistici popolari.",
    },
    sw: {
      title: "Aina za Kamari Zimeelezwa · BTTS, Over 2.5 · BetsPlug",
      description:
        "Jinsi masoko maarufu ya kamari za soka yanavyofanya kazi, jinsi bukumeka zinavyoweka bei na masoko yanapotoa thamani. BTTS, Over 2.5, Double Chance na zaidi.",
      ogTitle: "Aina za Kamari Zimeelezwa · BetsPlug",
      ogDescription:
        "Uchambuzi wa kina wa BTTS, Over 2.5, Double Chance, Draw No Bet na masoko mengine maarufu.",
    },
    id: {
      title: "Jenis Taruhan Dijelaskan · BTTS, Over 2.5 · BetsPlug",
      description:
        "Bagaimana pasar taruhan sepak bola populer bekerja, bagaimana bandar menetapkan harga, dan kapan pasar menawarkan nilai. BTTS, Over 2.5, Double Chance dan lebih.",
      ogTitle: "Jenis Taruhan Dijelaskan · BetsPlug",
      ogDescription:
        "Pembahasan mendalam tentang BTTS, Over 2.5, Double Chance, Draw No Bet, dan pasar sepak bola populer lainnya.",
    },
  
},

  /* ─────────────────────────── WELCOME ──────────────────────── */
  "/welcome": {
    en: {
      title: "Welcome Aboard · BetsPlug",
      description:
        "Your BetsPlug membership is active. Log in to see today's AI football predictions, track your ROI, and start winning smarter with data-driven match predictions.",
    },
    nl: {
      title: "Welkom aan Boord · BetsPlug",
      description:
        "Uw BetsPlug-lidmaatschap is actief. Log in om de AI voetbalvoorspellingen van vandaag te zien, uw ROI te volgen en slimmer te beginnen winnen met wedtips.",
    },
    de: {
      title: "Willkommen an Bord · BetsPlug",
      description:
        "Ihre BetsPlug-Mitgliedschaft ist aktiv. Melden Sie sich an, um die heutigen KI Fußballprognosen zu sehen, Ihren ROI zu verfolgen und klügere Wett-Tipps zu nutzen.",
    },
    fr: {
      title: "Bienvenue à Bord · BetsPlug",
      description:
        "Votre abonnement BetsPlug est actif. Connectez-vous pour voir les prédictions football IA du jour, suivre votre ROI et gagner plus intelligemment avec nos pronostics.",
    },
    es: {
      title: "Bienvenido a Bordo · BetsPlug",
      description:
        "Su membresía BetsPlug está activa. Inicie sesión para ver las predicciones fútbol IA de hoy, seguir su ROI y ganar de forma más inteligente con nuestras apuestas.",
    },
    it: {
      title: "Benvenuto a Bordo · BetsPlug",
      description:
        "La tua iscrizione BetsPlug è attiva. Accedi per vedere i pronostici calcio IA di oggi, monitorare il tuo ROI e iniziare a vincere con le scommesse più intelligenti.",
    },
    sw: {
      title: "Karibu Ndani · BetsPlug",
      description:
        "Uanachama wako wa BetsPlug umewashwa. Ingia kuona utabiri wa soka wa AI wa leo, kufuatilia ROI yako na kuanza kushinda kwa akili zaidi na uchambuzi wa soka.",
    },
    id: {
      title: "Selamat Datang · BetsPlug",
      description:
        "Keanggotaan BetsPlug Anda aktif. Masuk untuk melihat prediksi sepak bola AI hari ini, melacak ROI, dan mulai menang lebih cerdas dengan analisis sepak bola kami.",
    },
  
},

  /* ─────────────────────────── B2B ────────────────────────────── */
  "/b2b": {
    en: {
      title: "B2B Partnerships · BetsPlug",
      description:
        "Partner with BetsPlug for AI football predictions and analytics. Data licensing, white-label solutions, and affiliate partnerships for businesses seeking betting tips.",
    },
    nl: {
      title: "B2B Partnerschappen · BetsPlug",
      description:
        "Word partner van BetsPlug voor AI voetbalvoorspellingen en voetbalanalyse. Datalicenties, white-label oplossingen en affiliate-partnerschappen voor bedrijven.",
    },
    de: {
      title: "B2B Partnerschaften · BetsPlug",
      description:
        "Werden Sie Partner von BetsPlug für KI Fußballprognosen und Fußballanalyse. Datenlizenzen, White-Label-Lösungen und Affiliate-Partnerschaften für Unternehmen.",
    },
    fr: {
      title: "Partenariats B2B · BetsPlug",
      description:
        "Devenez partenaire de BetsPlug pour les prédictions football IA et l'analyse football. Licences de données, solutions en marque blanche et partenariats d'affiliation.",
    },
    es: {
      title: "Asociaciones B2B · BetsPlug",
      description:
        "Asóciese con BetsPlug para predicciones fútbol IA y análisis de fútbol. Licencias de datos, soluciones de marca blanca y asociaciones de afiliados para empresas.",
    },
    it: {
      title: "Partnership B2B · BetsPlug",
      description:
        "Diventa partner di BetsPlug per pronostici calcio IA e analisi calcistica. Licenze dati, soluzioni white-label e partnership di affiliazione per aziende.",
    },
    sw: {
      title: "Ushirikiano wa B2B · BetsPlug",
      description:
        "Shirikiana na BetsPlug kwa utabiri wa soka kwa AI na uchambuzi wa soka. Leseni za data, suluhisho za white-label na ushirikiano wa washirika kwa biashara.",
    },
    id: {
      title: "Kemitraan B2B · BetsPlug",
      description:
        "Bermitra dengan BetsPlug untuk prediksi sepak bola AI dan analisis sepak bola. Lisensi data, solusi white-label, dan kemitraan afiliasi untuk bisnis.",
    },
  
},

  /* ─────────────────────────── CHECKOUT ─────────────────────── */
  "/checkout": {
    en: {
      title: "Checkout · Start Your BetsPlug Subscription",
      description:
        "Complete your BetsPlug subscription in three quick steps. Get AI football predictions and match analytics with a 14-day money-back guarantee. Cancel any time.",
    },
    nl: {
      title: "Afrekenen · Start Uw BetsPlug-Abonnement",
      description:
        "Voltooi uw BetsPlug-abonnement in drie snelle stappen. Krijg AI voetbalvoorspellingen en wedstrijdvoorspellingen met 14 dagen geld-terug-garantie. Op elk moment opzegbaar.",
    },
    de: {
      title: "Kasse · Starten Sie Ihr BetsPlug-Abo",
      description:
        "Schließen Sie Ihr BetsPlug-Abonnement in drei schnellen Schritten ab. Erhalten Sie KI Fußballprognosen und Wett-Tipps mit 14 Tage Geld-zurück-Garantie.",
    },
    fr: {
      title: "Paiement · Démarrez Votre Abonnement BetsPlug",
      description:
        "Finalisez votre abonnement BetsPlug en trois étapes rapides. Accédez aux prédictions football IA et pronostics avec garantie de remboursement de 14 jours.",
    },
    es: {
      title: "Pago · Comience Su Suscripción BetsPlug",
      description:
        "Complete su suscripción BetsPlug en tres pasos rápidos. Obtenga predicciones fútbol IA y análisis de fútbol con garantía de devolución de 14 días. Cancele cuando quiera.",
    },
    it: {
      title: "Checkout · Inizia il Tuo Abbonamento BetsPlug",
      description:
        "Completa il tuo abbonamento BetsPlug in tre rapidi passaggi. Ottieni pronostici calcio IA e analisi calcistica con garanzia di rimborso di 14 giorni.",
    },
    sw: {
      title: "Malipo · Anza Usajili Wako wa BetsPlug",
      description:
        "Kamilisha usajili wako wa BetsPlug kwa hatua tatu za haraka. Pata utabiri wa soka kwa AI na uchambuzi wa soka na dhamana ya kurudishiwa pesa siku 14.",
    },
    id: {
      title: "Pembayaran · Mulai Langganan BetsPlug Anda",
      description:
        "Selesaikan langganan BetsPlug Anda dalam tiga langkah cepat. Dapatkan prediksi sepak bola AI dan analisis sepak bola dengan jaminan uang kembali 14 hari.",
    },
  
},
};
