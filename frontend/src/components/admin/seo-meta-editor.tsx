"use client";

import * as React from "react";
import {
  Globe,
  FileText,
  Check,
  Copy,
  RotateCcw,
  Save,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCALES = ["en", "nl", "de", "fr", "es", "it", "sw", "id"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Francais",
  es: "Espanol",
  it: "Italiano",
  sw: "Kiswahili",
  id: "Bahasa Indonesia",
};

const LOCALE_FLAGS: Record<Locale, string> = {
  en: "GB",
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  sw: "TZ",
  id: "ID",
};

interface PageRecommendation {
  title: string;
  description: string;
}

interface PageDef {
  path: string;
  label: string;
  recommendations: Partial<Record<Locale, PageRecommendation>>;
}

const PAGES: PageDef[] = [
  /* ─────────────────────────── HOME ─────────────────────────── */
  {
    path: "/",
    label: "Home",
    recommendations: {
      en: {
        title: "BetsPlug · AI Football Predictions & Analytics",
        description:
          "AI-powered football predictions with 4 models. Live probabilities, Elo ratings, and verified track record across 15+ leagues. Start your free trial.",
      },
      nl: {
        title: "BetsPlug · AI Voetbalvoorspellingen & Analyse",
        description:
          "AI-gestuurde voetbalvoorspellingen met 4 modellen. Live kansen, Elo-ratings en geverifieerd track record voor 15+ competities. Start gratis proefperiode.",
      },
      de: {
        title: "BetsPlug · KI Fussballprognosen & Analysen",
        description:
          "KI-gestutzte Fussballvorhersagen mit 4 Modellen. Live-Wahrscheinlichkeiten, Elo-Ratings und verifizierte Bilanz fur 15+ Ligen. Kostenlos testen.",
      },
      fr: {
        title: "BetsPlug · Predictions Football IA & Analyses",
        description:
          "Predictions football par IA avec 4 modeles. Probabilites en direct, classements Elo et historique verifie pour 15+ ligues. Essai gratuit.",
      },
      es: {
        title: "BetsPlug · Predicciones de Futbol con IA",
        description:
          "Predicciones de futbol con IA y 4 modelos. Probabilidades en vivo, ratings Elo y historial verificado en 15+ ligas. Prueba gratis.",
      },
      it: {
        title: "BetsPlug · Pronostici Calcio IA & Analisi",
        description:
          "Pronostici calcio con IA e 4 modelli. Probabilita in tempo reale, rating Elo e storico verificato per 15+ campionati. Prova gratuita.",
      },
      sw: {
        title: "BetsPlug · Utabiri wa Mpira wa Miguu kwa AI",
        description:
          "Utabiri wa soka kwa AI na mifano 4. Uwezekano wa moja kwa moja, ukadiriaji wa Elo na rekodi iliyothibitishwa kwa ligi 15+.",
      },
      id: {
        title: "BetsPlug · Prediksi Sepak Bola AI & Analitik",
        description:
          "Prediksi sepak bola bertenaga AI dengan 4 model. Probabilitas langsung, peringkat Elo, dan rekam jejak terverifikasi untuk 15+ liga.",
      },
    },
  },
  /* ─────────────────────────── ARTICLES ─────────────────────── */
  {
    path: "/articles",
    label: "Articles",
    recommendations: {
      en: {
        title: "Football Analysis & AI Betting Articles · BetsPlug",
        description:
          "In-depth football analysis, AI match breakdowns and data-driven betting insights across Premier League, La Liga, Bundesliga, Serie A and more.",
      },
      nl: {
        title: "Voetbalanalyse & AI Wedtips Artikelen · BetsPlug",
        description:
          "Diepgaande voetbalanalyse, AI-wedstrijdanalyses en datagedreven wedtips voor de Premier League, La Liga, Bundesliga, Serie A en meer.",
      },
      de: {
        title: "Fussballanalyse & KI-Wettartikel · BetsPlug",
        description:
          "Tiefgehende Fussballanalysen, KI-Spielanalysen und datenbasierte Wett-Einblicke fur Premier League, La Liga, Bundesliga, Serie A und mehr.",
      },
      fr: {
        title: "Analyse Football & Articles Paris IA · BetsPlug",
        description:
          "Analyses football approfondies, decryptages IA et insights de paris sportifs pour la Premier League, La Liga, Bundesliga, Serie A et plus.",
      },
      es: {
        title: "Analisis de Futbol & Articulos IA · BetsPlug",
        description:
          "Analisis de futbol en profundidad, desglose de partidos con IA e insights de apuestas basados en datos para Premier League, La Liga y mas.",
      },
      it: {
        title: "Analisi Calcio & Articoli Scommesse IA · BetsPlug",
        description:
          "Analisi calcistiche approfondite, analisi partite IA e insights sulle scommesse basati sui dati per Premier League, La Liga, Bundesliga e altro.",
      },
      sw: {
        title: "Uchambuzi wa Soka & Makala za AI · BetsPlug",
        description:
          "Uchambuzi wa kina wa soka, uchambuzi wa mechi kwa AI na maarifa yanayotokana na data kwa ligi kuu za Ulaya.",
      },
      id: {
        title: "Analisis Sepak Bola & Artikel AI · BetsPlug",
        description:
          "Analisis sepak bola mendalam, breakdown pertandingan AI, dan wawasan taruhan berbasis data untuk liga-liga top Eropa.",
      },
    },
  },
  /* ─────────────────────────── ABOUT US ─────────────────────── */
  {
    path: "/about-us",
    label: "About Us",
    recommendations: {
      en: {
        title: "About BetsPlug · AI Football Analytics Team",
        description:
          "Meet the engineers behind BetsPlug. Football fanatics with ICT backgrounds turning raw match data into transparent, probability-driven predictions.",
      },
      nl: {
        title: "Over BetsPlug · AI Voetbalanalyse Team",
        description:
          "Maak kennis met de engineers achter BetsPlug. Voetbalfanaten met ICT-achtergrond die ruwe data omzetten in transparante AI voetbalvoorspellingen.",
      },
      de: {
        title: "Uber BetsPlug · KI-Fussballanalyse Team",
        description:
          "Lernen Sie die Ingenieure hinter BetsPlug kennen. Fussballfans mit IT-Hintergrund, die Spieldaten in transparente KI Fussballprognosen verwandeln.",
      },
      fr: {
        title: "A Propos de BetsPlug · Equipe d'Analyse IA",
        description:
          "Decouvrez les ingenieurs derriere BetsPlug. Des passionnes de football avec un background IT, transformant les donnees en predictions football IA.",
      },
      es: {
        title: "Sobre BetsPlug · Equipo de Analisis Futbol IA",
        description:
          "Conoce a los ingenieros detras de BetsPlug. Fanaticos del futbol con experiencia TIC que convierten datos en predicciones de futbol IA transparentes.",
      },
      it: {
        title: "Chi Siamo · Il Team BetsPlug Analisi Calcio IA",
        description:
          "Conosci gli ingegneri dietro BetsPlug. Appassionati di calcio con background IT che trasformano i dati in pronostici calcio IA trasparenti.",
      },
      sw: {
        title: "Kuhusu BetsPlug · Timu ya Uchambuzi wa AI",
        description:
          "Kutana na wahandisi nyuma ya BetsPlug. Mashabiki wa soka wenye ujuzi wa IT wanaobadilisha data kuwa utabiri wa uwazi.",
      },
      id: {
        title: "Tentang BetsPlug · Tim Analitik Sepak Bola AI",
        description:
          "Kenali para insinyur di balik BetsPlug. Penggemar sepak bola dengan latar belakang TI yang mengubah data mentah menjadi prediksi transparan.",
      },
    },
  },
  /* ─────────────────────── MATCH PREDICTIONS ────────────────── */
  {
    path: "/match-predictions",
    label: "Match Predictions",
    recommendations: {
      en: {
        title: "AI Football Match Predictions · BetsPlug",
        description:
          "Real-time AI match predictions for football across 15+ leagues. View win probabilities, value bets, and confidence scores. Updated daily.",
      },
      nl: {
        title: "AI Voetbalwedstrijd Voorspellingen · BetsPlug",
        description:
          "Realtime AI voetbalvoorspellingen voor wedstrijden in 15+ competities. Bekijk winstkansen, value bets en betrouwbaarheidsscores. Dagelijks bijgewerkt.",
      },
      de: {
        title: "KI Fussballprognosen · Spielvorhersagen · BetsPlug",
        description:
          "Echtzeit-KI-Spielvorhersagen fur Fussball in 15+ Ligen. Siegwahrscheinlichkeiten, Value Bets und Vertrauenswerte ansehen. Taglich aktualisiert.",
      },
      fr: {
        title: "Predictions de Matchs Football IA · BetsPlug",
        description:
          "Predictions IA en temps reel pour les matchs de football de 15+ ligues. Probabilites, value bets et scores de confiance. Mise a jour quotidienne.",
      },
      es: {
        title: "Predicciones de Partidos Futbol IA · BetsPlug",
        description:
          "Predicciones IA en tiempo real para partidos de futbol en 15+ ligas. Probabilidades, apuestas de valor y puntuaciones de confianza. Actualizado diariamente.",
      },
      it: {
        title: "Pronostici Partite Calcio IA · BetsPlug",
        description:
          "Pronostici calcio IA in tempo reale per 15+ campionati. Probabilita di vittoria, value bet e punteggi di affidabilita. Aggiornato quotidianamente.",
      },
      sw: {
        title: "Utabiri wa Mechi za Mpira kwa AI · BetsPlug",
        description:
          "Utabiri wa mechi za mpira kwa AI kwa wakati halisi kwa ligi 15+. Angalia uwezekano wa kushinda, kamari za thamani na alama za kujiamini.",
      },
      id: {
        title: "Prediksi Pertandingan Sepak Bola AI · BetsPlug",
        description:
          "Prediksi pertandingan AI real-time untuk sepak bola di 15+ liga. Lihat probabilitas kemenangan, value bet, dan skor kepercayaan. Diperbarui harian.",
      },
    },
  },
  /* ─────────────────────────── PRIVACY ──────────────────────── */
  {
    path: "/privacy",
    label: "Privacy Policy",
    recommendations: {
      en: {
        title: "Privacy Policy · BetsPlug",
        description:
          "How BetsPlug collects, uses, and protects your personal data. GDPR-compliant privacy practices for our AI football analytics platform.",
      },
      nl: {
        title: "Privacybeleid · BetsPlug",
        description:
          "Hoe BetsPlug uw persoonsgegevens verzamelt, gebruikt en beschermt. AVG-conform privacybeleid voor ons AI-voetbalanalyseplatform.",
      },
      de: {
        title: "Datenschutzrichtlinie · BetsPlug",
        description:
          "Wie BetsPlug Ihre personenbezogenen Daten erhebt, nutzt und schuetzt. DSGVO-konforme Datenschutzrichtlinie fuer unsere KI-Fussballanalyseplattform.",
      },
      fr: {
        title: "Politique de Confidentialite · BetsPlug",
        description:
          "Comment BetsPlug collecte, utilise et protege vos donnees personnelles. Politique de confidentialite conforme au RGPD pour notre plateforme d'analyse football IA.",
      },
      es: {
        title: "Politica de Privacidad · BetsPlug",
        description:
          "Como BetsPlug recopila, utiliza y protege sus datos personales. Politica de privacidad conforme al RGPD para nuestra plataforma de analisis futbol IA.",
      },
      it: {
        title: "Informativa sulla Privacy · BetsPlug",
        description:
          "Come BetsPlug raccoglie, utilizza e protegge i tuoi dati personali. Informativa sulla privacy conforme al GDPR per la nostra piattaforma di analisi calcio IA.",
      },
      sw: {
        title: "Sera ya Faragha · BetsPlug",
        description:
          "Jinsi BetsPlug inavyokusanya, kutumia na kulinda data yako binafsi. Sera ya faragha inayozingatia GDPR kwa jukwaa letu la uchambuzi wa mpira kwa AI.",
      },
      id: {
        title: "Kebijakan Privasi · BetsPlug",
        description:
          "Bagaimana BetsPlug mengumpulkan, menggunakan, dan melindungi data pribadi Anda. Kebijakan privasi sesuai GDPR untuk platform analisis sepak bola AI kami.",
      },
    },
  },
  /* ─────────────────────────── TERMS ────────────────────────── */
  {
    path: "/terms",
    label: "Terms of Service",
    recommendations: {
      en: {
        title: "Terms of Service · BetsPlug",
        description:
          "Terms and conditions for using BetsPlug's AI football analytics platform. Read before signing up for betting predictions and match analysis.",
      },
      nl: {
        title: "Algemene Voorwaarden · BetsPlug",
        description:
          "Voorwaarden voor het gebruik van BetsPlug's AI voetbalanalyse platform. Lees voor registratie voor wedtips en wedstrijdanalyse.",
      },
      de: {
        title: "Nutzungsbedingungen · BetsPlug",
        description:
          "Nutzungsbedingungen fuer BetsPlug's KI-Fussballanalyse-Plattform. Bitte lesen vor Registrierung fuer Wett-Tipps und Spielanalyse.",
      },
      fr: {
        title: "Conditions d'Utilisation · BetsPlug",
        description:
          "Les conditions generales applicables lors de l'utilisation de BetsPlug. Veuillez les lire avant de creer un compte pour nos predictions football IA.",
      },
      es: {
        title: "Terminos de Servicio · BetsPlug",
        description:
          "Los terminos y condiciones que se aplican al usar BetsPlug. Lealos antes de registrarse para predicciones de futbol IA y analisis de partidos.",
      },
      it: {
        title: "Termini di Servizio · BetsPlug",
        description:
          "I termini e le condizioni applicabili quando si utilizza BetsPlug. Si prega di leggerli prima di registrarsi per pronostici calcio IA e analisi partite.",
      },
      sw: {
        title: "Masharti ya Huduma · BetsPlug",
        description:
          "Masharti yanayotumika unapotumia BetsPlug. Tafadhali yasome kabla ya kuunda akaunti kwenye jukwaa letu la uchambuzi wa mpira kwa AI.",
      },
      id: {
        title: "Ketentuan Layanan · BetsPlug",
        description:
          "Syarat dan ketentuan yang berlaku saat Anda menggunakan BetsPlug. Harap baca sebelum mendaftar untuk prediksi sepak bola AI dan analisis pertandingan.",
      },
    },
  },
  /* ─────────────────────────── COOKIES ──────────────────────── */
  {
    path: "/cookies",
    label: "Cookie Policy",
    recommendations: {
      en: {
        title: "Cookie Policy · BetsPlug",
        description:
          "Which cookies BetsPlug uses, why we use them, and how you can manage your cookie preferences on our AI football analytics platform.",
      },
      nl: {
        title: "Cookiebeleid · BetsPlug",
        description:
          "Welke cookies BetsPlug gebruikt, waarom we ze gebruiken en hoe u uw cookievoorkeuren kunt beheren op ons AI-voetbalanalyseplatform.",
      },
      de: {
        title: "Cookie-Richtlinie · BetsPlug",
        description:
          "Welche Cookies BetsPlug verwendet, warum wir sie verwenden und wie Sie Ihre Cookie-Einstellungen auf unserer KI-Fussballanalyseplattform verwalten koennen.",
      },
      fr: {
        title: "Politique des Cookies · BetsPlug",
        description:
          "Quels cookies BetsPlug utilise, pourquoi nous les utilisons et comment vous pouvez gerer vos preferences sur notre plateforme d'analyse football IA.",
      },
      es: {
        title: "Politica de Cookies · BetsPlug",
        description:
          "Que cookies usa BetsPlug, por que las usamos y como puede gestionar sus preferencias de cookies en nuestra plataforma de analisis futbol IA.",
      },
      it: {
        title: "Politica sui Cookie · BetsPlug",
        description:
          "Quali cookie utilizza BetsPlug, perche li utilizziamo e come gestire le preferenze sui cookie sulla nostra piattaforma di analisi calcio IA.",
      },
      sw: {
        title: "Sera ya Vidakuzi · BetsPlug",
        description:
          "Vidakuzi gani BetsPlug inatumia, kwa nini tunazitumia na jinsi unavyoweza kudhibiti mapendeleo yako kwenye jukwaa letu la uchambuzi wa mpira kwa AI.",
      },
      id: {
        title: "Kebijakan Cookie · BetsPlug",
        description:
          "Cookie apa yang digunakan BetsPlug, mengapa kami menggunakannya, dan bagaimana Anda dapat mengelola preferensi cookie di platform analisis sepak bola AI kami.",
      },
    },
  },
  /* ─────────────────────────── HOW IT WORKS ─────────────────── */
  {
    path: "/how-it-works",
    label: "How It Works",
    recommendations: {
      en: {
        title: "How BetsPlug Works · AI Prediction Engine",
        description:
          "Step-by-step walkthrough of the BetsPlug AI prediction engine: data collection, feature engineering, model training, value detection and verifiable football tips.",
      },
      nl: {
        title: "Hoe BetsPlug Werkt · AI-voorspellingsmotor",
        description:
          "Stapsgewijze uitleg van de BetsPlug AI-voorspellingsmotor: dataverzameling, feature engineering, modeltraining en verifieerbare voetbalvoorspellingen.",
      },
      de: {
        title: "So Funktioniert BetsPlug · KI-Prognosemaschine",
        description:
          "Schritt-fuer-Schritt-Erklaerung der BetsPlug KI-Prognosemaschine: Datenerhebung, Feature-Engineering, Modelltraining und verifizierbare Fussballprognosen.",
      },
      fr: {
        title: "Comment Fonctionne BetsPlug · Moteur de Predictions IA",
        description:
          "Presentation complete du moteur de predictions football IA de BetsPlug: collecte de donnees, feature engineering, entrainement des modeles et picks verifiables.",
      },
      es: {
        title: "Como Funciona BetsPlug · Motor de Prediccion IA",
        description:
          "Guia completa paso a paso del motor de predicciones futbol IA de BetsPlug: recopilacion de datos, ingenieria de features, entrenamiento de modelos y picks verificables.",
      },
      it: {
        title: "Come Funziona BetsPlug · Motore Pronostici IA",
        description:
          "Guida completa passo dopo passo del motore di pronostici calcio IA di BetsPlug: raccolta dati, feature engineering, addestramento modelli e pronostici verificabili.",
      },
      sw: {
        title: "BetsPlug Inavyofanya Kazi · Injini ya Utabiri AI",
        description:
          "Mwongozo kamili wa hatua kwa hatua wa injini ya utabiri ya BetsPlug: ukusanyaji data, uhandisi wa vipengele, mafunzo ya mifano na utabiri unaothibitishika.",
      },
      id: {
        title: "Cara Kerja BetsPlug · Mesin Prediksi AI",
        description:
          "Panduan lengkap langkah demi langkah mesin prediksi AI BetsPlug: pengumpulan data, feature engineering, pelatihan model, dan prediksi sepak bola yang dapat diverifikasi.",
      },
    },
  },
  /* ─────────────────────────── TRACK RECORD ─────────────────── */
  {
    path: "/track-record",
    label: "Track Record",
    recommendations: {
      en: {
        title: "Track Record · Verified AI Prediction Results · BetsPlug",
        description:
          "Transparent, auditable AI football prediction results. See how our models turn match data into a measurable edge - documented weekly, never cherry-picked.",
      },
      nl: {
        title: "Trackrecord · Geverifieerde AI-voorspellingsresultaten · BetsPlug",
        description:
          "Transparante, controleerbare resultaten van AI voetbalvoorspellingen. Zie hoe onze modellen data omzetten in meetbaar voordeel - wekelijks gedocumenteerd.",
      },
      de: {
        title: "Bilanz · Verifizierte KI-Prognoseergebnisse · BetsPlug",
        description:
          "Transparente, pruefbare Ergebnisse der KI Fussballprognosen. Sehen Sie, wie unsere Modelle Daten in messbaren Vorsprung verwandeln - woechentlich dokumentiert.",
      },
      fr: {
        title: "Historique · Resultats de Predictions IA Verifies · BetsPlug",
        description:
          "Resultats transparents et verifiables des predictions football IA. Decouvrez comment nos modeles transforment les donnees en avantage mesurable.",
      },
      es: {
        title: "Historial · Resultados de Predicciones IA · BetsPlug",
        description:
          "Resultados transparentes y auditables de predicciones futbol IA. Vea como nuestros modelos convierten datos en ventaja medible - documentado semanalmente.",
      },
      it: {
        title: "Storico · Risultati Pronostici Calcio IA · BetsPlug",
        description:
          "Risultati trasparenti e verificabili dei pronostici calcio IA. Scopri come i nostri modelli trasformano i dati in vantaggio misurabile - documentato settimanalmente.",
      },
      sw: {
        title: "Rekodi ya Matokeo · Utabiri wa AI Uliothibitishwa · BetsPlug",
        description:
          "Matokeo ya uwazi na yanayokaguliwa ya utabiri wa mpira kwa AI. Angalia jinsi mifano yetu inavyobadilisha data kuwa faida inayopimika.",
      },
      id: {
        title: "Rekam Jejak · Hasil Prediksi AI Terverifikasi · BetsPlug",
        description:
          "Hasil transparan dan dapat diaudit dari prediksi sepak bola AI. Lihat bagaimana model kami mengubah data menjadi keunggulan terukur - didokumentasikan mingguan.",
      },
    },
  },
  /* ─────────────────────────── LOGIN ────────────────────────── */
  {
    path: "/login",
    label: "Login",
    recommendations: {
      en: {
        title: "Log In · BetsPlug",
        description:
          "Log in to your BetsPlug account to see today's AI football predictions, track your ROI and manage your subscription.",
      },
      nl: {
        title: "Inloggen · BetsPlug",
        description:
          "Log in op uw BetsPlug-account om de AI voetbalvoorspellingen van vandaag te zien, uw ROI te volgen en uw abonnement te beheren.",
      },
      de: {
        title: "Anmelden · BetsPlug",
        description:
          "Melden Sie sich bei Ihrem BetsPlug-Konto an, um die heutigen KI Fussballprognosen zu sehen, Ihren ROI zu verfolgen und Ihr Abo zu verwalten.",
      },
      fr: {
        title: "Connexion · BetsPlug",
        description:
          "Connectez-vous a votre compte BetsPlug pour voir les predictions football IA du jour, suivre votre ROI et gerer votre abonnement.",
      },
      es: {
        title: "Iniciar Sesion · BetsPlug",
        description:
          "Inicie sesion en su cuenta BetsPlug para ver las predicciones futbol IA de hoy, seguir su ROI y gestionar su suscripcion.",
      },
      it: {
        title: "Accedi · BetsPlug",
        description:
          "Accedi al tuo account BetsPlug per vedere i pronostici calcio IA di oggi, monitorare il tuo ROI e gestire il tuo abbonamento.",
      },
      sw: {
        title: "Ingia · BetsPlug",
        description:
          "Ingia kwenye akaunti yako ya BetsPlug kuona utabiri wa mpira wa AI wa leo, kufuatilia ROI yako na kudhibiti usajili wako.",
      },
      id: {
        title: "Masuk · BetsPlug",
        description:
          "Masuk ke akun BetsPlug Anda untuk melihat prediksi sepak bola AI hari ini, melacak ROI, dan mengelola langganan Anda.",
      },
    },
  },
  /* ─────────────────────────── LEARN ────────────────────────── */
  {
    path: "/learn",
    label: "Learn",
    recommendations: {
      en: {
        title: "Learn Football Betting · Value, xG, Elo · BetsPlug",
        description:
          "In-depth pillar guides on the math behind sharp football betting - value betting, expected goals, Elo ratings, the Kelly criterion, Poisson models, and bankroll management.",
      },
      nl: {
        title: "Leer Voetbalwedden · Value, xG, Elo · BetsPlug",
        description:
          "Diepgaande gidsen over de wiskunde achter AI voetbalvoorspellingen - value betting, expected goals, Elo-ratings, Kelly-criterium, Poisson-modellen en bankroll management.",
      },
      de: {
        title: "Fussballwetten Lernen · Value, xG, Elo · BetsPlug",
        description:
          "Ausfuehrliche Guides zur Mathematik hinter KI Fussballprognosen - Value Betting, Expected Goals, Elo-Ratings, Kelly-Kriterium und Bankroll-Management.",
      },
      fr: {
        title: "Apprendre les Paris · Value, xG, Elo · BetsPlug",
        description:
          "Guides approfondis sur les maths derriere les paris sportifs intelligents - value betting, expected goals, classements Elo, critere de Kelly, modeles de Poisson.",
      },
      es: {
        title: "Aprende Apuestas Futbol · Value, xG · BetsPlug",
        description:
          "Guias en profundidad sobre las matematicas detras de las apuestas inteligentes - value betting, goles esperados, ratings Elo, criterio Kelly y modelos Poisson.",
      },
      it: {
        title: "Impara le Scommesse Calcio · Value, xG · BetsPlug",
        description:
          "Guide approfondite sulla matematica delle scommesse calcistiche - value betting, expected goals, rating Elo, criterio di Kelly, modelli Poisson e gestione bankroll.",
      },
      sw: {
        title: "Jifunze Kamari ya Mpira · Value, xG, Elo · BetsPlug",
        description:
          "Miongozo ya kina kuhusu hesabu nyuma ya kamari bora za mpira - value betting, expected goals, Elo ratings, Kelly criterion, Poisson models na bankroll.",
      },
      id: {
        title: "Belajar Taruhan Sepak Bola · Value, xG · BetsPlug",
        description:
          "Panduan mendalam tentang matematika di balik taruhan sepak bola cerdas - value betting, expected goals, rating Elo, kriteria Kelly, model Poisson, dan manajemen bankroll.",
      },
    },
  },
  /* ─────────────────────────── BET TYPES ────────────────────── */
  {
    path: "/bet-types",
    label: "Bet Types",
    recommendations: {
      en: {
        title: "Bet Types Explained · BTTS, Over 2.5, DC · BetsPlug",
        description:
          "How popular football betting markets work, how books price them and when the market offers value. Explainers for BTTS, Over 2.5 goals, Double Chance and Draw No Bet.",
      },
      nl: {
        title: "Wed-types Uitgelegd · BTTS, Over 2.5, DC · BetsPlug",
        description:
          "Hoe populaire voetbalwedmarkten werken, hoe bookmakers ze prijzen en wanneer de markt value biedt. Uitleg bij BTTS, Over 2.5 goals, Double Chance en Draw No Bet.",
      },
      de: {
        title: "Wettarten Erklaert · BTTS, Over 2.5, DC · BetsPlug",
        description:
          "Wie beliebte Fussball-Wettmaerkte funktionieren, wie Buchmacher sie bepreisen und wann der Markt Value bietet. Wett-Tipps fuer BTTS, Over 2.5 Tore und mehr.",
      },
      fr: {
        title: "Types de Paris Expliques · BTTS, Over 2.5 · BetsPlug",
        description:
          "Comment fonctionnent les marches de paris sportifs populaires, comment les bookmakers les tarifent et quand le marche offre de la valeur. BTTS, Over 2.5, Double Chance.",
      },
      es: {
        title: "Tipos de Apuesta · BTTS, Over 2.5 · BetsPlug",
        description:
          "Como funcionan los mercados de apuestas de futbol populares, como los fijan los bookmakers y cuando el mercado ofrece valor. BTTS, Over 2.5, Double Chance y mas.",
      },
      it: {
        title: "Tipi di Scommessa · BTTS, Over 2.5 · BetsPlug",
        description:
          "Come funzionano i mercati delle scommesse calcistiche, come i bookmaker li quotano e quando il mercato offre valore. BTTS, Over 2.5, Double Chance e Draw No Bet.",
      },
      sw: {
        title: "Aina za Kamari · BTTS, Over 2.5 · BetsPlug",
        description:
          "Jinsi masoko maarufu ya kamari za mpira yanavyofanya kazi, jinsi bukumeka zinavyoweka bei na masoko yanapotoa thamani. BTTS, Over 2.5, Double Chance.",
      },
      id: {
        title: "Jenis Taruhan · BTTS, Over 2.5 · BetsPlug",
        description:
          "Bagaimana pasar taruhan sepak bola populer bekerja, bagaimana bandar menetapkan harga, dan kapan pasar menawarkan nilai. BTTS, Over 2.5, Double Chance.",
      },
    },
  },
  /* ─────────────────────────── WELCOME ──────────────────────── */
  {
    path: "/welcome",
    label: "Welcome",
    recommendations: {
      en: {
        title: "Welcome Aboard · BetsPlug",
        description:
          "Your BetsPlug membership is active. Log in to see today's AI football predictions, track your ROI and start winning smarter with data-driven betting tips.",
      },
      nl: {
        title: "Welkom aan Boord · BetsPlug",
        description:
          "Uw BetsPlug-lidmaatschap is actief. Log in om de AI voetbalvoorspellingen van vandaag te zien, uw ROI te volgen en slimmer te beginnen wedden.",
      },
      de: {
        title: "Willkommen an Bord · BetsPlug",
        description:
          "Ihre BetsPlug-Mitgliedschaft ist aktiv. Melden Sie sich an, um die heutigen KI Fussballprognosen zu sehen und Ihren ROI zu verfolgen.",
      },
      fr: {
        title: "Bienvenue a Bord · BetsPlug",
        description:
          "Votre abonnement BetsPlug est actif. Connectez-vous pour voir les predictions football IA du jour, suivre votre ROI et commencer a gagner plus intelligemment.",
      },
      es: {
        title: "Bienvenido a Bordo · BetsPlug",
        description:
          "Su membresia BetsPlug esta activa. Inicie sesion para ver las predicciones futbol IA de hoy, seguir su ROI y comenzar a ganar de forma mas inteligente.",
      },
      it: {
        title: "Benvenuto a Bordo · BetsPlug",
        description:
          "La tua iscrizione BetsPlug e attiva. Accedi per vedere i pronostici calcio IA di oggi, monitorare il tuo ROI e iniziare a vincere in modo piu intelligente.",
      },
      sw: {
        title: "Karibu Ndani · BetsPlug",
        description:
          "Uanachama wako wa BetsPlug umewashwa. Ingia kuona utabiri wa mpira wa AI wa leo, kufuatilia ROI yako na kuanza kushinda kwa akili zaidi.",
      },
      id: {
        title: "Selamat Datang · BetsPlug",
        description:
          "Keanggotaan BetsPlug Anda aktif. Masuk untuk melihat prediksi sepak bola AI hari ini, melacak ROI, dan mulai menang lebih cerdas.",
      },
    },
  },
  /* ─────────────────────────── CHECKOUT ─────────────────────── */
  {
    path: "/checkout",
    label: "Checkout",
    recommendations: {
      en: {
        title: "Checkout · Start Your BetsPlug Subscription",
        description:
          "Complete your BetsPlug subscription in three quick steps. Access AI football predictions, 14-day money-back guarantee, SSL-encrypted checkout, cancel any time.",
      },
      nl: {
        title: "Afrekenen · Start Uw BetsPlug-abonnement",
        description:
          "Voltooi uw BetsPlug-abonnement in drie snelle stappen. Toegang tot AI voetbalvoorspellingen, 14 dagen geld-terug-garantie, SSL-versleuteld, op elk moment opzegbaar.",
      },
      de: {
        title: "Kasse · Starten Sie Ihr BetsPlug-Abo",
        description:
          "Schliessen Sie Ihr BetsPlug-Abonnement in drei schnellen Schritten ab. Zugang zu KI Fussballprognosen, 14 Tage Geld-zurueck-Garantie, jederzeit kuendbar.",
      },
      fr: {
        title: "Paiement · Demarrez Votre Abonnement BetsPlug",
        description:
          "Finalisez votre abonnement BetsPlug en trois etapes rapides. Acces aux predictions football IA, garantie de remboursement de 14 jours, resiliation a tout moment.",
      },
      es: {
        title: "Pago · Comience Su Suscripcion BetsPlug",
        description:
          "Complete su suscripcion BetsPlug en tres pasos rapidos. Acceso a predicciones futbol IA, garantia de devolucion de 14 dias, cancele en cualquier momento.",
      },
      it: {
        title: "Checkout · Inizia il Tuo Abbonamento BetsPlug",
        description:
          "Completa il tuo abbonamento BetsPlug in tre rapidi passaggi. Accesso ai pronostici calcio IA, garanzia di rimborso di 14 giorni, cancella quando vuoi.",
      },
      sw: {
        title: "Malipo · Anza Usajili Wako wa BetsPlug",
        description:
          "Kamilisha usajili wako wa BetsPlug kwa hatua tatu za haraka. Ufikiaji wa utabiri wa mpira kwa AI, dhamana ya kurudishiwa pesa siku 14, futa wakati wowote.",
      },
      id: {
        title: "Pembayaran · Mulai Langganan BetsPlug Anda",
        description:
          "Selesaikan langganan BetsPlug Anda dalam tiga langkah cepat. Akses prediksi sepak bola AI, jaminan uang kembali 14 hari, batalkan kapan saja.",
      },
    },
  },
  /* ─────────────────────────── B2B ────────────────────────────── */
  {
    path: "/b2b",
    label: "B2B Partnerships",
    recommendations: {
      en: {
        title: "B2B Partnerships · BetsPlug AI Football Analytics",
        description:
          "Partner with BetsPlug for AI-powered football analytics. Data licensing, white-label betting predictions, and affiliate partnerships for businesses.",
      },
      nl: {
        title: "B2B Partnerschappen · BetsPlug AI Voetbalanalyse",
        description:
          "Word partner van BetsPlug voor AI-gestuurde voetbalanalyse. Datalicenties, white-label AI voetbalvoorspellingen en affiliate-partnerschappen voor bedrijven.",
      },
      de: {
        title: "B2B Partnerschaften · BetsPlug KI Fussballanalyse",
        description:
          "Werden Sie Partner von BetsPlug fuer KI-gestuetzte Fussballanalyse. Datenlizenzen, White-Label KI Fussballprognosen und Affiliate-Partnerschaften fuer Unternehmen.",
      },
      fr: {
        title: "Partenariats B2B · BetsPlug Analyse Football IA",
        description:
          "Devenez partenaire de BetsPlug pour l'analyse football par IA. Licences de donnees, predictions football IA en marque blanche et partenariats d'affiliation.",
      },
      es: {
        title: "Asociaciones B2B · BetsPlug Analisis Futbol IA",
        description:
          "Asociese con BetsPlug para analisis de futbol con IA. Licencias de datos, predicciones futbol IA de marca blanca y asociaciones de afiliados para empresas.",
      },
      it: {
        title: "Partnership B2B · BetsPlug Analisi Calcio IA",
        description:
          "Diventa partner di BetsPlug per analisi calcistiche con IA. Licenze dati, pronostici calcio IA white-label e partnership di affiliazione per aziende.",
      },
      sw: {
        title: "Ushirikiano wa B2B · BetsPlug Uchambuzi wa AI",
        description:
          "Shirikiana na BetsPlug kwa uchambuzi wa mpira kwa AI. Leseni za data, suluhisho za white-label na ushirikiano wa washirika kwa biashara.",
      },
      id: {
        title: "Kemitraan B2B · BetsPlug Analisis Sepak Bola AI",
        description:
          "Bermitra dengan BetsPlug untuk analisis sepak bola bertenaga AI. Lisensi data, prediksi sepak bola AI white-label, dan kemitraan afiliasi untuk bisnis.",
      },
    },
  },
];

const STORAGE_KEY = "betsplug_seo_meta_drafts";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MetaValues {
  title: string;
  description: string;
}

type DraftState = Record<string, Partial<Record<Locale, MetaValues>>>;

// ─── Character count helpers ────────────────────────────────────────────────

function getTitleColor(len: number): string {
  if (len === 0) return "text-slate-500";
  if (len <= 60) return "text-green-400";
  if (len <= 70) return "text-amber-400";
  return "text-red-400";
}

function getTitleBgColor(len: number): string {
  if (len === 0) return "bg-slate-500/15";
  if (len <= 60) return "bg-green-500/15";
  if (len <= 70) return "bg-amber-500/15";
  return "bg-red-500/15";
}

function getDescColor(len: number): string {
  if (len === 0) return "text-slate-500";
  if (len >= 120 && len <= 160) return "text-green-400";
  if ((len >= 100 && len < 120) || (len > 160 && len <= 170))
    return "text-amber-400";
  return "text-red-400";
}

function getDescBgColor(len: number): string {
  if (len === 0) return "bg-slate-500/15";
  if (len >= 120 && len <= 160) return "bg-green-500/15";
  if ((len >= 100 && len < 120) || (len > 160 && len <= 170))
    return "bg-amber-500/15";
  return "bg-red-500/15";
}

function CharBadge({
  count,
  colorFn,
  bgFn,
  optimal,
}: {
  count: number;
  colorFn: (n: number) => string;
  bgFn: (n: number) => string;
  optimal: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        bgFn(count),
        colorFn(count)
      )}
    >
      {count} chars
      <span className="text-[10px] font-normal opacity-70">({optimal})</span>
    </span>
  );
}

// ─── SERP Preview ───────────────────────────────────────────────────────────

function SerpPreview({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const displayTitle = title || "Page Title";
  const displayDesc = description || "Page description will appear here...";
  const displayUrl = `betsplug.com${path}`;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">
        Google SERP Preview
      </p>
      <p className="text-sm font-medium text-blue-400 line-clamp-1 cursor-pointer hover:underline">
        {displayTitle}
      </p>
      <p className="text-xs text-green-500/80">{displayUrl}</p>
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
        {displayDesc}
      </p>
    </div>
  );
}

// ─── Locale Tab Bar ─────────────────────────────────────────────────────────

function LocaleTabs({
  active,
  onChange,
  hasRecommendation,
}: {
  active: Locale;
  onChange: (l: Locale) => void;
  hasRecommendation: (l: Locale) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
      {LOCALES.map((locale) => {
        const isActive = locale === active;
        const hasRec = hasRecommendation(locale);
        return (
          <button
            key={locale}
            onClick={() => onChange(locale)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            )}
          >
            <span className="text-[11px] uppercase">{locale}</span>
            {!hasRec && (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page Sidebar ───────────────────────────────────────────────────────────

function PageSidebar({
  pages,
  activePath,
  onSelect,
  drafts,
}: {
  pages: PageDef[];
  activePath: string;
  onSelect: (path: string) => void;
  drafts: DraftState;
}) {
  return (
    <div className="space-y-1">
      {pages.map((page) => {
        const isActive = page.path === activePath;
        const hasDraft = drafts[page.path] && Object.keys(drafts[page.path]!).length > 0;
        return (
          <button
            key={page.path}
            onClick={() => onSelect(page.path)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all",
              isActive
                ? "bg-blue-600/15 border border-blue-500/30 text-blue-300"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent"
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{page.label}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">
                {page.path}
              </p>
            </div>
            {hasDraft && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SeoMetaEditor() {
  const [activePath, setActivePath] = React.useState(PAGES[0].path);
  const [activeLocale, setActiveLocale] = React.useState<Locale>("en");
  const [drafts, setDrafts] = React.useState<DraftState>({});
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [mobilePageOpen, setMobilePageOpen] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const activePage = PAGES.find((p) => p.path === activePath) ?? PAGES[0];
  const activeRec = activePage.recommendations[activeLocale];
  const activeDraft = drafts[activePath]?.[activeLocale];

  const currentTitle = activeDraft?.title ?? "";
  const currentDesc = activeDraft?.description ?? "";

  // ─── Handlers ───────────────────────────────────────────────────────────

  function updateField(field: "title" | "description", value: string) {
    setDrafts((prev) => ({
      ...prev,
      [activePath]: {
        ...prev[activePath],
        [activeLocale]: {
          title: field === "title" ? value : (prev[activePath]?.[activeLocale]?.title ?? ""),
          description:
            field === "description"
              ? value
              : (prev[activePath]?.[activeLocale]?.description ?? ""),
        },
      },
    }));
    setSaved(false);
  }

  function applyRecommendation() {
    if (!activeRec) return;
    setDrafts((prev) => ({
      ...prev,
      [activePath]: {
        ...prev[activePath],
        [activeLocale]: {
          title: activeRec.title,
          description: activeRec.description,
        },
      },
    }));
    setSaved(false);
  }

  function applyAllRecommendations() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const page of PAGES) {
        for (const locale of LOCALES) {
          const rec = page.recommendations[locale];
          if (rec) {
            next[page.path] = {
              ...next[page.path],
              [locale]: { title: rec.title, description: rec.description },
            };
          }
        }
      }
      return next;
    });
    setSaved(false);
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore storage errors
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(drafts, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  function resetAll() {
    setDrafts({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  // Count total filled entries
  const totalEntries = Object.values(drafts).reduce((sum, locales) => {
    if (!locales) return sum;
    return (
      sum +
      Object.values(locales).filter(
        (v) => v && (v.title.length > 0 || v.description.length > 0)
      ).length
    );
  }, 0);

  const totalPossible = PAGES.length * LOCALES.length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                SEO Meta Editor
              </h2>
              <p className="text-xs text-slate-500">
                Edit meta titles & descriptions per page per locale
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Progress indicator */}
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
              {totalEntries}/{totalPossible} filled
            </span>

            <button
              onClick={applyAllRecommendations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Apply All AI Recs
            </button>

            <button
              onClick={saveDraft}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                saved
                  ? "border border-green-500/30 bg-green-500/10 text-green-300"
                  : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
              )}
            >
              {saved ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saved ? "Saved!" : "Save Draft"}
            </button>

            <button
              onClick={copyJson}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                copied
                  ? "border border-green-500/30 bg-green-500/10 text-green-300"
                  : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy JSON"}
            </button>

            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main content: sidebar + editor */}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Page sidebar - desktop */}
        <div className="hidden lg:block">
          <div className="glass-card rounded-xl p-3 sticky top-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pages
            </p>
            <PageSidebar
              pages={PAGES}
              activePath={activePath}
              onSelect={setActivePath}
              drafts={drafts}
            />
          </div>
        </div>

        {/* Page selector - mobile */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobilePageOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>{activePage.label}</span>
              <span className="font-mono text-xs text-slate-500">
                {activePage.path}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform",
                mobilePageOpen && "rotate-180"
              )}
            />
          </button>
          {mobilePageOpen && (
            <div className="mt-1 rounded-xl border border-white/[0.06] bg-[#0f1629] p-2 shadow-xl">
              <PageSidebar
                pages={PAGES}
                activePath={activePath}
                onSelect={(path) => {
                  setActivePath(path);
                  setMobilePageOpen(false);
                }}
                drafts={drafts}
              />
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Page header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {activePage.label}
                </h3>
                <p className="font-mono text-xs text-slate-500">
                  {activePage.path}
                </p>
              </div>
            </div>
            <a
              href={`https://betsplug.com${activePage.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ExternalLink className="h-3 w-3" />
              View page
            </a>
          </div>

          {/* Locale tabs */}
          <div className="border-b border-white/[0.06] px-6 py-3">
            <LocaleTabs
              active={activeLocale}
              onChange={setActiveLocale}
              hasRecommendation={(l) => !!activePage.recommendations[l]}
            />
          </div>

          {/* Editor form */}
          <div className="p-6 space-y-5">
            {/* Title field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Meta Title
                </label>
                <CharBadge
                  count={currentTitle.length}
                  colorFn={getTitleColor}
                  bgFn={getTitleBgColor}
                  optimal={"< 60 ideal"}
                />
              </div>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={activeRec?.title ?? "Enter meta title..."}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
              />
              {/* Title length bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentTitle.length <= 60
                      ? "bg-green-500"
                      : currentTitle.length <= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{
                    width: `${Math.min((currentTitle.length / 70) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Meta Description
                </label>
                <CharBadge
                  count={currentDesc.length}
                  colorFn={getDescColor}
                  bgFn={getDescBgColor}
                  optimal={"120-160 ideal"}
                />
              </div>
              <textarea
                value={currentDesc}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={
                  activeRec?.description ?? "Enter meta description..."
                }
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none"
              />
              {/* Description length bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentDesc.length >= 120 && currentDesc.length <= 160
                      ? "bg-green-500"
                      : (currentDesc.length >= 100 &&
                            currentDesc.length < 120) ||
                          (currentDesc.length > 160 &&
                            currentDesc.length <= 170)
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{
                    width: `${Math.min((currentDesc.length / 170) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* AI Recommendation panel */}
            {activeRec && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <p className="text-xs font-semibold text-purple-300">
                      AI Recommendation
                    </p>
                  </div>
                  <button
                    onClick={applyRecommendation}
                    className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-[11px] font-medium text-purple-300 transition-colors hover:bg-purple-500/25"
                  >
                    <Check className="h-3 w-3" />
                    Use This
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">
                      Suggested Title
                    </p>
                    <p className="text-xs text-slate-300">{activeRec.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">
                      Suggested Description
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeRec.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!activeRec && (
              <div className="rounded-lg border border-dashed border-white/[0.08] p-4 text-center">
                <p className="text-xs text-slate-500">
                  No AI recommendation available for{" "}
                  <span className="font-medium text-slate-400">
                    {LOCALE_LABELS[activeLocale]}
                  </span>{" "}
                  on this page.
                </p>
              </div>
            )}

            {/* SERP Preview */}
            <SerpPreview
              title={currentTitle || activeRec?.title || ""}
              description={currentDesc || activeRec?.description || ""}
              path={activePage.path}
            />

            {/* Coverage summary for this page */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-3">
                Locale Coverage for {activePage.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((locale) => {
                  const draft = drafts[activePath]?.[locale];
                  const hasDraft =
                    draft &&
                    (draft.title.length > 0 || draft.description.length > 0);
                  const hasRec = !!activePage.recommendations[locale];

                  return (
                    <button
                      key={locale}
                      onClick={() => setActiveLocale(locale)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                        locale === activeLocale
                          ? "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                          : "border border-white/[0.06] text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <span className="uppercase">{locale}</span>
                      {hasDraft ? (
                        <Check className="h-2.5 w-2.5 text-green-400" />
                      ) : hasRec ? (
                        <Sparkles className="h-2.5 w-2.5 text-purple-400/50" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-2.5 w-2.5 text-green-400" /> = has draft
                </span>
                <span className="mx-2">|</span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-purple-400/50" /> = AI
                  rec available
                </span>
                <span className="mx-2">|</span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />{" "}
                  = empty
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
