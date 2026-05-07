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

/**
 * A per-locale metadata bag. English (`en`) is mandatory because every
 * caller uses it as the fallback (`PAGE_META["/x"]?.[locale] ?? PAGE_META["/x"].en`).
 * All other locales are optional — when they're missing we fall back to
 * English, which matches our SEO posture for pages that aren't translated
 * into every locale yet (e.g. /engine is only EN + NL for now).
 */
export type PageMetaByLocale = Partial<Record<Locale, PageMeta>> & {
  en: PageMeta;
};

export const PAGE_META: Record<string, PageMetaByLocale> = {
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
  
    pt: {
      title: "Previsões de futebol com tecnologia de IA · BetsPlug",
      description:
        "Previsões de futebol alimentadas por IA com 4 modelos. Probabilidades ao vivo, classificações Elo e um histórico verificado em mais de 15 ligas.",
      ogTitle: "Previsões de futebol com tecnologia de IA · BetsPlug",
      ogDescription:
        "Previsões de futebol baseadas em IA com probabilidades ao vivo, classificações Elo e um histórico verificado em mais de 15 ligas.",
    },
    tr: {
      title: "Yapay Zeka Destekli Futbol Tahminleri · BetsPlug",
      description:
        "4 modelle yapay zeka destekli futbol tahminleri. Canlı olasılıklar, Elo reytingler ve 15'ten fazla ligde doğrulanmış performans geçmişi.",
      ogTitle: "Yapay Zeka Destekli Futbol Tahminleri · BetsPlug",
      ogDescription:
        "Canlı olasılıklar, Elo derecelendirmeleri ve 15'ten fazla ligde doğrulanmış geçmiş performansıyla yapay zeka destekli futbol tahminleri.",
    },
    pl: {
      title: "Prognozy piłkarskie oparte na sztucznej inteligencji · BetsPlug",
      description:
        "Prognozy piłkarskie oparte na sztucznej inteligencji z 4 modelami. Prawdopodobieństwa na żywo, oceny Elo i potwierdzone osiągnięcia w ponad 15 ligach.",
      ogTitle: "Prognozy piłkarskie oparte na sztucznej inteligencji · BetsPlug",
      ogDescription:
        "Prognozy piłkarskie oparte na sztucznej inteligencji z prawdopodobieństwem na żywo, rankingami Elo i zweryfikowanymi osiągnięciami w ponad 15 ligach.",
    },
    ro: {
      title: "Predicții de fotbal bazate pe inteligență artificială · BetsPlug",
      description:
        "Predicții de fotbal bazate pe inteligență artificială cu 4 modele. Probabilități live, evaluări Elo și un palmares verificat în peste 15 ligi.",
      ogTitle: "Predicții de fotbal bazate pe inteligență artificială · BetsPlug",
      ogDescription:
        "Predicții de fotbal bazate pe inteligență artificială cu probabilități live, evaluări Elo și un palmares verificat în peste 15 ligi.",
    },
    ru: {
      title: "Футбольная аналитика на базе ИИ · BetsPlug",
      description:
        "Образовательная платформа футбольной аналитики на основе ИИ с 4 моделями. Вероятности в реальном времени, рейтинги Эло и проверяемая история результатов в…",
      ogTitle: "Футбольная аналитика на базе ИИ · BetsPlug",
      ogDescription:
        "Футбольная аналитика на базе ИИ с вероятностями в реальном времени, рейтингами Эло и проверяемой историей результатов в 15+ лигах.",
    },
    el: {
      title: "Προβλέψεις ποδοσφαίρου με τεχνητή νοημοσύνη · BetsPlug",
      description:
        "Προβλέψεις ποδοσφαίρου με τεχνητή νοημοσύνη με 4 μοντέλα. Ζωντανές πιθανότητες, βαθμολογίες Elo και επαληθευμένο ιστορικό σε 15+ πρωταθλήματα.",
      ogTitle: "Προβλέψεις ποδοσφαίρου με τεχνητή νοημοσύνη · BetsPlug",
      ogDescription:
        "Προβλέψεις ποδοσφαίρου με τεχνητή νοημοσύνη με ζωντανές πιθανότητες, βαθμολογίες Elo και επαληθευμένο ιστορικό σε 15+ πρωταθλήματα.",
    },
    da: {
      title: "AI-drevet fodboldforudsigelser · BetsPlug",
      description:
        "AI-drevne fodboldforudsigelser med 4 modeller. Live-sandsynligheder, Elo-vurderinger og en verificeret track record på tværs af 15+ ligaer.",
      ogTitle: "AI-drevet fodboldforudsigelser · BetsPlug",
      ogDescription:
        "AI-drevne fodboldforudsigelser med sandsynligheder, Elo-vurderinger og en verificeret track record på tværs af 15+ ligaer.",
    },
    sv: {
      title: "AI-drivna fotbollsförutsägelser · BetsPlug",
      description:
        "AI-drivna fotbollsförutsägelser med 4 modeller. Sannolikheter i realtid, Elo-betyg och en verifierad meritlista över 15+ ligor.",
      ogTitle: "AI-drivna fotbollsförutsägelser · BetsPlug",
      ogDescription:
        "AI-drivna fotbollsförutsägelser med sannolikheter i realtid, Elo-betyg och en verifierad meritlista över 15+ ligor.",
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
        "Découvrez les deux ingénieurs derrière BetsPlug. Des passionnés de football avec une expertise en IT, créant des prédictions football IA transparentes et…",
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
        "Scopri i due ingegneri dietro BetsPlug. Appassionati di calcio con background IT, che trasformano dati grezzi in pronostici calcio IA trasparenti e…",
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
  

    pt: {
      title: "Sobre nós · BetsPlug Equipe de análise de futebol AI",
      description:
        "Conheça os dois engenheiros que constroem BetsPlug. Fanáticos por futebol com experiência em TIC, transformando dados brutos de jogos em previsões de…",
      ogTitle: "Sobre BetsPlug · A equipe por trás do limite",
      ogDescription:
        "Dois engenheiros. Mais de 20 anos de experiência combinada em TIC. Uma obsessão: transformar os dados do futebol numa vantagem mensurável.",
    },
    tr: {
      title: "Hakkımızda · BetsPlug Yapay Zeka Futbol Analitik Ekibi",
      description:
        "BetsPlug binasındaki iki mühendisle tanışın. BİT geçmişine sahip futbol fanatikleri, ham maç verilerini şeffaf, olasılık odaklı futbol tahminlerine…",
      ogTitle: "BetsPlug Hakkında · Kenarın Arkasındaki Ekip",
      ogDescription:
        "İki mühendis. 20 yılı aşkın birleşik BİT deneyimi. Bir takıntım var: Futbol verilerini ölçülebilir bir üstünlüğe dönüştürmek.",
    },
    pl: {
      title: "O nas · BetsPlug Zespół AI Football Analytics",
      description:
        "Poznaj dwóch inżynierów budujących BetsPlug. Fanatycy piłki nożnej z doświadczeniem w branży ICT, przekształcający surowe dane meczowe w przejrzyste…",
      ogTitle: "O BetsPlug · Zespół za krawędzią",
      ogDescription:
        "Dwóch inżynierów. Ponad 20 lat wspólnego doświadczenia w branży ICT. Jedna obsesja: przekształcanie danych piłkarskich w wymierną przewagę.",
    },
    ro: {
      title: "Despre noi · BetsPlug AI Football Analytics Team",
      description:
        "Faceți cunoștință cu cei doi ingineri din clădirea BetsPlug. Fanatici ai fotbalului cu un fundal TIC, transformând datele brute despre meci în predicții…",
      ogTitle: "Despre BetsPlug · Echipa din spatele marginii",
      ogDescription:
        "Doi ingineri. Peste 20 de ani de experiență combinată în domeniul TIC. O obsesie: transformarea datelor de fotbal într-un avantaj măsurabil.",
    },
    ru: {
      title: "О нас · команда BetsPlug по футбольной аналитике на базе ИИ",
      description:
        "Знакомьтесь с двумя инженерами, создающими BetsPlug. Футбольные фанатики с опытом в ИТ, превращающие необработанные данные матчей в прозрачные…",
      ogTitle: "О BetsPlug · команда, стоящая за платформой",
      ogDescription:
        "Два инженера. Более 20 лет совокупного ИТ-опыта. Одна цель: превращать футбольные данные в измеримое преимущество.",
    },
    el: {
      title: "Σχετικά με εμάς · BetsPlug AI Football Analytics Team",
      description:
        "Γνωρίστε το κτίριο των δύο μηχανικών BetsPlug. Φανατικοί του ποδοσφαίρου με υπόβαθρο ΤΠΕ, μετατρέποντας τα ακατέργαστα δεδομένα αγώνων σε διαφανείς…",
      ogTitle: "Σχετικά με το BetsPlug · The Team Behind the Edge",
      ogDescription:
        "Δύο μηχανικοί. 20+ χρόνια συνδυασμένης εμπειρίας στις ΤΠΕ. Μία εμμονή: μετατροπή των ποδοσφαιρικών δεδομένων σε μετρήσιμο πλεονέκτημα.",
    },
    da: {
      title: "Om os · BetsPlug AI Football Analytics Team",
      description:
        "Mød de to ingeniører, der bygger BetsPlug. Fodboldfanatikere med en ikt-baggrund, der omdanner rå kampdata til gennemsigtige, sandsynlighedsdrevne…",
      ogTitle: "Om BetsPlug · Teamet bag kanten",
      ogDescription:
        "To ingeniører. 20+ års kombineret IKT-erfaring. En besættelse: at gøre fodbolddata til en målbar fordel.",
    },
    sv: {
      title: "Om oss · BetsPlug AI Football Analytics Team",
      description:
        "Möt de två ingenjörerna som bygger BetsPlug. Fotbollsfanatiker med IKT-bakgrund som förvandlar rå matchdata till transparenta, sannolikhetsdrivna…",
      ogTitle: "Om BetsPlug · Teamet bakom kanten",
      ogDescription:
        "Två ingenjörer. 20+ års kombinerad IKT-erfarenhet. En besatthet: att förvandla fotbollsdata till en mätbar fördel.",
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
  

    pt: {
      title: "Política de Privacidade · BetsPlug",
      description:
        "Como o BetsPlug coleta, usa e protege seus dados pessoais. Política de privacidade compatível com GDPR para nossa plataforma de previsões e análises de…",
      ogTitle: "Política de Privacidade · BetsPlug",
      ogDescription:
        "Como o BetsPlug coleta, usa e protege seus dados pessoais. Totalmente compatível com GDPR.",
    },
    tr: {
      title: "Gizlilik Politikası · BetsPlug",
      description:
        "BetsPlug kişisel verilerinizi nasıl toplar, kullanır ve korur. Yapay zeka futbol tahminleri ve analiz platformumuz için GDPR uyumlu gizlilik politikası.",
      ogTitle: "Gizlilik Politikası · BetsPlug",
      ogDescription:
        "BetsPlug kişisel verilerinizi nasıl toplar, kullanır ve korur. Tamamen GDPR uyumludur.",
    },
    pl: {
      title: "Polityka prywatności · BetsPlug",
      description:
        "Jak BetsPlug gromadzi, wykorzystuje i chroni Twoje dane osobowe. Zgodna z RODO polityka prywatności dotycząca naszej platformy prognoz i analiz…",
      ogTitle: "Polityka prywatności · BetsPlug",
      ogDescription:
        "Jak BetsPlug gromadzi, wykorzystuje i chroni Twoje dane osobowe. W pełni zgodne z RODO.",
    },
    ro: {
      title: "Politica de confidențialitate · BetsPlug",
      description:
        "Cum BetsPlug colectează, utilizează și vă protejează datele personale. Politica de confidențialitate conformă cu GDPR pentru platforma noastră de analiză…",
      ogTitle: "Politica de confidențialitate · BetsPlug",
      ogDescription:
        "Cum BetsPlug colectează, utilizează și vă protejează datele personale. Complet în conformitate cu GDPR.",
    },
    ru: {
      title: "Политика конфиденциальности · BetsPlug",
      description:
        "Как BetsPlug собирает, использует и защищает ваши персональные данные. Политика конфиденциальности, соответствующая GDPR, для нашей образовательной…",
      ogTitle: "Политика конфиденциальности · BetsPlug",
      ogDescription:
        "Как BetsPlug собирает, использует и защищает ваши персональные данные. Полное соответствие GDPR.",
    },
    el: {
      title: "Πολιτική απορρήτου · BetsPlug",
      description:
        "Πώς η BetsPlug συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα. Συμβατή με το GDPR πολιτική απορρήτου για την πλατφόρμα προβλέψεων και…",
      ogTitle: "Πολιτική απορρήτου · BetsPlug",
      ogDescription:
        "Πώς η BetsPlug συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα. Πλήρως συμβατό με το GDPR.",
    },
    da: {
      title: "Privatlivspolitik · BetsPlug",
      description:
        "Hvordan BetsPlug indsamler, bruger og beskytter dine personlige data. GDPR-kompatibel privatlivspolitik for vores AI-fodboldforudsigelser og…",
      ogTitle: "Privatlivspolitik · BetsPlug",
      ogDescription:
        "Hvordan BetsPlug indsamler, bruger og beskytter dine personlige data. Fuldstændig GDPR-kompatibel.",
    },
    sv: {
      title: "Sekretesspolicy · BetsPlug",
      description:
        "Hur BetsPlug samlar in, använder och skyddar dina personuppgifter. GDPR-kompatibel sekretesspolicy för vår AI-fotbollsförutsägelse och analysplattform.",
      ogTitle: "Sekretesspolicy · BetsPlug",
      ogDescription:
        "Hur BetsPlug samlar in, använder och skyddar dina personuppgifter. Helt GDPR-kompatibel.",
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
        "Die Nutzungsbedingungen für BetsPlug. Bitte lesen Sie diese, bevor Sie ein Konto erstellen oder ein Abonnement für unsere KI Fußballprognosen-Plattform…",
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
        "I termini e le condizioni applicabili quando si utilizza BetsPlug. Si prega di leggerli prima di creare un account o sottoscrivere un abbonamento alla…",
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
  

    pt: {
      title: "Termos de Serviço · BetsPlug",
      description:
        "Os termos e condições que se aplicam quando você usa BetsPlug. Leia-os antes de criar uma conta ou assinar nossa plataforma de análise de futebol com IA.",
      ogTitle: "Termos de Serviço · BetsPlug",
      ogDescription:
        "Os termos e condições que se aplicam quando você usa BetsPlug. Leia antes de assinar.",
    },
    tr: {
      title: "Hizmet Şartları · BetsPlug",
      description:
        "BetsPlug kullandığınızda geçerli olan şartlar ve koşullar. Hesap oluşturmadan veya AI futbol analiz platformumuza abone olmadan önce lütfen bunları okuyun.",
      ogTitle: "Hizmet Şartları · BetsPlug",
      ogDescription:
        "BetsPlug kullandığınızda geçerli olan şartlar ve koşullar. Abone olmadan önce okuyun.",
    },
    pl: {
      title: "Warunki korzystania z usługi · BetsPlug",
      description:
        "Warunki obowiązujące podczas korzystania z BetsPlug. Przeczytaj je przed utworzeniem konta lub subskrypcją naszej platformy analityki piłkarskiej AI.",
      ogTitle: "Warunki korzystania z usługi · BetsPlug",
      ogDescription:
        "Warunki obowiązujące podczas korzystania z BetsPlug. Przeczytaj zanim zasubskrybujesz.",
    },
    ro: {
      title: "Termeni și condiții · BetsPlug",
      description:
        "Termenii și condițiile care se aplică atunci când utilizați BetsPlug. Vă rugăm să le citiți înainte de a vă crea un cont sau de a vă abona la platforma…",
      ogTitle: "Termeni și condiții · BetsPlug",
      ogDescription:
        "Termenii și condițiile care se aplică atunci când utilizați BetsPlug. Citiți înainte de a vă abona.",
    },
    ru: {
      title: "Условия использования · BetsPlug",
      description:
        "Положения и условия, применимые при использовании BetsPlug. Прочтите их перед созданием аккаунта или подпиской на нашу образовательную платформу…",
      ogTitle: "Условия использования · BetsPlug",
      ogDescription:
        "Положения и условия, применимые при использовании BetsPlug. Прочтите перед оформлением подписки.",
    },
    el: {
      title: "Όροι Παροχής Υπηρεσιών · BetsPlug",
      description:
        "Οι όροι και οι προϋποθέσεις που ισχύουν όταν χρησιμοποιείτε το BetsPlug. Διαβάστε τα πριν δημιουργήσετε έναν λογαριασμό ή εγγραφείτε στην πλατφόρμα…",
      ogTitle: "Όροι Παροχής Υπηρεσιών · BetsPlug",
      ogDescription:
        "Οι όροι και οι προϋποθέσεις που ισχύουν όταν χρησιμοποιείτε το BetsPlug. Διαβάστε πριν εγγραφείτε.",
    },
    da: {
      title: "Servicevilkår · BetsPlug",
      description:
        "Vilkår og betingelser, der gælder, når du bruger BetsPlug. Læs dem, før du opretter en konto eller abonnerer på vores AI-fodboldanalyseplatform.",
      ogTitle: "Servicevilkår · BetsPlug",
      ogDescription:
        "Vilkår og betingelser, der gælder, når du bruger BetsPlug. Læs før du tilmelder dig.",
    },
    sv: {
      title: "Användarvillkor · BetsPlug",
      description:
        "Villkoren som gäller när du använder BetsPlug. Läs dem innan du skapar ett konto eller prenumererar på vår AI fotbollsanalysplattform.",
      ogTitle: "Användarvillkor · BetsPlug",
      ogDescription:
        "Villkoren som gäller när du använder BetsPlug. Läs innan du prenumererar.",
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
        "Welche Cookies BetsPlug verwendet, warum wir sie verwenden und wie Sie Ihre Cookie-Einstellungen auf unserer KI Fußballprognosen-Plattform verwalten…",
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
        "Vidakuzi gani BetsPlug inatumia, kwa nini tunazitumia na jinsi unavyoweza kudhibiti mapendeleo yako kwenye jukwaa letu la utabiri wa soka na uchambuzi wa…",
      ogTitle: "Sera ya Vidakuzi · BetsPlug",
      ogDescription:
        "Vidakuzi gani BetsPlug inatumia na jinsi unavyoweza kudhibiti mapendeleo yako.",
    },
    id: {
      title: "Kebijakan Cookie · BetsPlug",
      description:
        "Cookie apa yang digunakan BetsPlug, mengapa kami menggunakannya, dan bagaimana Anda dapat mengelola preferensi cookie di platform prediksi sepak bola AI…",
      ogTitle: "Kebijakan Cookie · BetsPlug",
      ogDescription:
        "Cookie apa yang digunakan BetsPlug dan bagaimana Anda dapat mengelola preferensi Anda.",
    },
  

    pt: {
      title: "Política de Cookies · BetsPlug",
      description:
        "Quais cookies BetsPlug usa, por que os usamos e como você pode gerenciar suas preferências de cookies em nossa plataforma de previsões e análises de…",
      ogTitle: "Política de Cookies · BetsPlug",
      ogDescription:
        "Quais cookies BetsPlug utiliza, por que os utilizamos e como você pode gerenciar suas preferências.",
    },
    tr: {
      title: "Çerez Politikası · BetsPlug",
      description:
        "BetsPlug hangi çerezleri kullanıyor, bunları neden kullanıyoruz ve yapay zeka futbol tahminleri ve analiz platformumuzda çerez tercihlerinizi nasıl…",
      ogTitle: "Çerez Politikası · BetsPlug",
      ogDescription:
        "BetsPlug hangi çerezleri kullanıyor, bunları neden kullanıyoruz ve tercihlerinizi nasıl yönetebilirsiniz.",
    },
    pl: {
      title: "Polityka plików cookie · BetsPlug",
      description:
        "Z jakich plików cookie korzysta BetsPlug, dlaczego ich używamy i w jaki sposób możesz zarządzać preferencjami dotyczącymi plików cookie na naszej…",
      ogTitle: "Polityka plików cookie · BetsPlug",
      ogDescription:
        "Z jakich plików cookie korzysta BetsPlug, dlaczego ich używamy i jak możesz zarządzać swoimi preferencjami.",
    },
    ro: {
      title: "Politica privind cookie-urile · BetsPlug",
      description:
        "Ce cookie-uri folosește BetsPlug, de ce le folosim și cum vă puteți gestiona preferințele cookie-urilor pe platforma noastră de analiză și predicții de…",
      ogTitle: "Politica privind cookie-urile · BetsPlug",
      ogDescription:
        "Ce cookie-uri folosește BetsPlug, de ce le folosim și cum vă puteți gestiona preferințele.",
    },
    ru: {
      title: "Политика использования файлов cookie · BetsPlug",
      description:
        "Какие файлы cookie использует BetsPlug, почему мы их используем и как вы можете управлять настройками файлов cookie на нашей платформе футбольных…",
      ogTitle: "Политика использования файлов cookie · BetsPlug",
      ogDescription:
        "Какие файлы cookie использует BetsPlug, почему мы их используем и как вы можете управлять своими предпочтениями.",
    },
    el: {
      title: "Πολιτική cookie · BetsPlug",
      description:
        "Ποια cookies χρησιμοποιεί η BetsPlug, γιατί τα χρησιμοποιούμε και πώς μπορείτε να διαχειριστείτε τις προτιμήσεις σας για cookie στην πλατφόρμα προβλέψεων…",
      ogTitle: "Πολιτική cookie · BetsPlug",
      ogDescription:
        "Ποια cookies χρησιμοποιεί το BetsPlug, γιατί τα χρησιμοποιούμε και πώς μπορείτε να διαχειριστείτε τις προτιμήσεις σας.",
    },
    da: {
      title: "Cookiepolitik · BetsPlug",
      description:
        "Hvilke cookies BetsPlug bruger, hvorfor vi bruger dem, og hvordan du kan administrere dine cookiepræferencer på vores AI-fodboldforudsigelser og…",
      ogTitle: "Cookiepolitik · BetsPlug",
      ogDescription:
        "Hvilke cookies BetsPlug bruger, hvorfor vi bruger dem, og hvordan du kan administrere dine præferencer.",
    },
    sv: {
      title: "Cookiepolicy · BetsPlug",
      description:
        "Vilka cookies BetsPlug använder, varför vi använder dem och hur du kan hantera dina cookie-preferenser på vår AI-fotbollsförutsägelse och analysplattform.",
      ogTitle: "Cookiepolicy · BetsPlug",
      ogDescription:
        "Vilka cookies BetsPlug använder, varför vi använder dem och hur du kan hantera dina inställningar.",
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
        "BetsPlug is geen goksite. Lees ons beleid voor verantwoord voorspellen, herken de signalen van gokproblemen en vind hulporganisaties.",
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
  
    pt: {
      title: "Maiores de 18 anos Jogue com responsabilidade · BetsPlug",
      description:
        "BetsPlug não é um site de apostas. Leia a nossa política de jogo responsável, conheça os sinais de problemas de jogo e encontre recursos de ajuda.",
    },
    tr: {
      title: "18+ Sorumlu Oynayın · BetsPlug",
      description:
        "BetsPlug bir bahis sitesi değildir. Sorumlu kumar politikamızı okuyun, sorunlu kumarın belirtilerini öğrenin ve yardım kaynaklarını bulun.",
    },
    pl: {
      title: "18+ Graj odpowiedzialnie · BetsPlug",
      description:
        "BetsPlug nie jest witryną zawierającą zakłady. Przeczytaj nasze zasady odpowiedzialnego hazardu, poznaj oznaki problematycznego hazardu i znajdź zasoby…",
    },
    ro: {
      title: "18+ Joacă responsabil · BetsPlug",
      description:
        "BetsPlug nu este un site de pariuri. Citiți politica noastră privind jocurile de noroc responsabile, aflați semnele problemelor legate de jocurile de…",
    },
    ru: {
      title: "18+ Играйте ответственно · BetsPlug",
      description:
        "BetsPlug не является сайтом ставок. Прочтите нашу политику ответственной игры, узнайте признаки проблем с азартными играми и найдите справочные ресурсы.",
    },
    el: {
      title: "18+ Παίξτε Υπεύθυνα · BetsPlug",
      description:
        "Το BetsPlug δεν είναι ιστότοπος στοιχημάτων. Διαβάστε την πολιτική μας για τον υπεύθυνο τζόγο, μάθετε τα σημάδια του προβληματικού τζόγου και βρείτε…",
    },
    da: {
      title: "18+ Spil ansvarligt · BetsPlug",
      description:
        "BetsPlug er ikke en bettingside. Læs vores politik for ansvarligt hasardspil, lær tegn på problematisk hasardspil, og find hjælperessourcer.",
    },
    sv: {
      title: "18+ Spela ansvarsfullt · BetsPlug",
      description:
        "BetsPlug är inte en bettingsida. Läs vår policy för ansvarsfullt spelande, lär dig tecken på problem med spelande och hitta hjälpresurser.",
    },
},

  /* ─────────────────────────── HOW IT WORKS ─────────────────── */
  "/how-it-works": {
    en: {
      title: "How It Works · BetsPlug Pulse AI Predictions",
      description:
        "See how BetsPlug Pulse analyses every match across 70+ leagues, with full CSV download and every prediction tracked and verifiable.",
      ogTitle: "How BetsPlug Works · Pulse AI Predictions",
      ogDescription:
        "One AI engine. 70+ leagues. Full CSV download. Every prediction tracked and verifiable.",
    },
    nl: {
      title: "Hoe Het Werkt · BetsPlug Pulse AI-Voorspellingen",
      description:
        "Ontdek hoe BetsPlug Pulse elke wedstrijd analyseert in 70+ competities, met volledige CSV-download en elke voorspelling transparant te volgen.",
      ogTitle: "Hoe BetsPlug Werkt · Pulse AI-Voorspellingen",
      ogDescription:
        "Eén AI-engine. 70+ competities. Volledige CSV-download. Elke voorspelling gevolgd en verifieerbaar.",
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
        "Présentation complète du moteur de prédictions football IA BetsPlug : collecte de données, feature engineering, entraînement des modèles et pronostics…",
      ogTitle: "Comment Fonctionne BetsPlug · Moteur IA",
      ogDescription:
        "14 sources de données. Plus de 1 200 features. 4 modèles indépendants. Chaque pick horodaté et vérifiable.",
    },
    es: {
      title: "Cómo Funciona · Motor de Predicción BetsPlug IA",
      description:
        "Guía completa paso a paso del motor de predicciones fútbol IA BetsPlug: recopilación de datos, ingeniería de features, entrenamiento de modelos y picks…",
      ogTitle: "Cómo Funciona BetsPlug · Motor de Predicción IA",
      ogDescription:
        "14 fuentes de datos. Más de 1.200 features. 4 modelos independientes. Cada pick con marca de tiempo y verificable.",
    },
    it: {
      title: "Come Funziona · Motore di Previsione BetsPlug IA",
      description:
        "Guida completa passo dopo passo del motore di pronostici calcio IA BetsPlug: raccolta dati, feature engineering, addestramento modelli e pronostici…",
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
        "Panduan lengkap langkah demi langkah mesin prediksi sepak bola AI BetsPlug: pengumpulan data, feature engineering, pelatihan model, dan prediksi yang…",
      ogTitle: "Cara Kerja BetsPlug · Mesin Prediksi AI",
      ogDescription:
        "14 sumber data. 1.200+ fitur. 4 model independen. Setiap prediksi memiliki stempel waktu dan dapat diverifikasi publik.",
    },
  

    pt: {
      title: "Como funciona · BetsPlug Pulse Previsões de IA",
      description:
        "Veja como o BetsPlug Pulse analisa cada partida, entrega uma Pick of the Day diária e permite acompanhar cada previsão de forma transparente.",
      ogTitle: "Como funciona o BetsPlug · Previsões da Pulse AI",
      ogDescription:
        "Um motor de IA. 70+ ligas. Cada previsão registada com data e verificável publicamente.",
    },
    tr: {
      title: "Nasıl Çalışır · BetsPlug Pulse Yapay Zeka Tahminleri",
      description:
        "BetsPlug Pulse'un her maçı nasıl analiz ettiğini, her gün bir Pick of the Day sunduğunu ve her tahmini şeffaf bir şekilde takip etmenizi nasıl sağladığını…",
      ogTitle: "BetsPlug Nasıl Çalışır · Pulse Yapay Zeka Tahminleri",
      ogDescription:
        "Tek bir yapay zeka motoru. 70+ lig. Her tahmin zaman damgalı ve herkese açık olarak doğrulanabilir.",
    },
    pl: {
      title: "Jak to działa · BetsPlug Pulse Prognozy AI",
      description:
        "Zobacz, jak BetsPlug Pulse analizuje każdy mecz, dostarcza codzienny Pick of the Day i pozwala śledzić każdą prognozę w sposób przejrzysty.",
      ogTitle: "Jak działa BetsPlug · Prognozy Pulse AI",
      ogDescription:
        "Jeden silnik AI. Ponad 70 lig. Każda prognoza opatrzona znacznikiem czasu i publicznie weryfikowalna.",
    },
    ro: {
      title: "Cum funcționează · BetsPlug Pulse Predicții AI",
      description:
        "Vezi cum BetsPlug Pulse analizează fiecare meci, livrează zilnic un Pick of the Day și îți permite să urmărești fiecare predicție în mod transparent.",
      ogTitle: "Cum funcționează BetsPlug · Predicții Pulse AI",
      ogDescription:
        "Un singur motor AI. Peste 70 de ligi. Fiecare predicție are marcaj temporal și este verificabilă public.",
    },
    ru: {
      title: "Как это работает · аналитика BetsPlug Pulse на базе ИИ",
      description:
        "Узнайте, как BetsPlug Pulse анализирует каждый матч, ежедневно публикует Pick of the Day и позволяет прозрачно отслеживать каждую модельную оценку.",
      ogTitle: "Как работает BetsPlug · аналитика Pulse на базе ИИ",
      ogDescription:
        "Один ИИ-движок. 70+ лиг. Каждая оценка имеет временную метку и доступна для публичной проверки.",
    },
    el: {
      title: "Πώς λειτουργεί · BetsPlug Pulse Προβλέψεις AI",
      description:
        "Δείτε πώς το BetsPlug Pulse αναλύει κάθε αγώνα, δημοσιεύει καθημερινά ένα Pick of the Day και σας επιτρέπει να παρακολουθείτε διαφανώς κάθε πρόβλεψη.",
      ogTitle: "Πώς λειτουργεί το BetsPlug · Pulse AI Predictions",
      ogDescription:
        "Μία μηχανή AI. Πάνω από 70 πρωταθλήματα. Κάθε πρόβλεψη φέρει χρονοσήμανση και είναι δημόσια επαληθεύσιμη.",
    },
    da: {
      title: "Sådan fungerer det · BetsPlug Pulse AI-forudsigelser",
      description:
        "Se hvordan BetsPlug Pulse analyserer hver kamp, leverer en daglig Pick of the Day og lader dig følge hver forudsigelse transparent.",
      ogTitle: "Sådan fungerer BetsPlug · Pulse AI-forudsigelser",
      ogDescription:
        "Én AI-motor. 70+ ligaer. Hver forudsigelse har tidsstempel og er offentligt verificerbar.",
    },
    sv: {
      title: "Hur det fungerar · BetsPlug Pulse AI-förutsägelser",
      description:
        "Se hur BetsPlug Pulse analyserar varje match, levererar ett dagligt Pick of the Day och låter dig följa varje förutsägelse transparent.",
      ogTitle: "Hur BetsPlug fungerar · Puls AI-förutsägelser",
      ogDescription:
        "En AI-motor. 70+ ligor. Varje förutsägelse har tidsstämpel och är offentligt verifierbar.",
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
        "Transparente, prüfbare Ergebnisse für jeden BetsPlug KI Fußballprognose-Tipp. Sehen Sie, wie unsere Modelle Daten in messbaren Vorsprung verwandeln -…",
      ogTitle: "BetsPlug Bilanz · Prüfbare Ergebnisse",
      ogDescription:
        "58,3% Trefferquote. +14,6% ROI. 24.180 bewertete Prognosen. Jeder Tipp mit Zeitstempel im öffentlichen Register.",
    },
    fr: {
      title: "Historique · Résultats Prédictions IA Vérifiés",
      description:
        "Des résultats transparents et vérifiables pour chaque prédiction football IA BetsPlug. Découvrez comment nos modèles transforment les données en avantage…",
      ogTitle: "Historique BetsPlug · Résultats Vérifiables",
      ogDescription:
        "58,3% de réussite. +14,6% ROI. 24 180 pronostics évalués. Chaque pick horodaté dans un registre public.",
    },
    es: {
      title: "Historial · Resultados Predicciones IA Verificados",
      description:
        "Resultados transparentes y auditables para cada predicción fútbol IA BetsPlug. Vea cómo nuestros modelos convierten datos en ventaja medible - documentado…",
      ogTitle: "Historial BetsPlug · Resultados Auditables",
      ogDescription:
        "58,3% de acierto. +14,6% ROI. 24.180 predicciones calificadas. Cada pick con marca de tiempo en registro público.",
    },
    it: {
      title: "Storico · Risultati Pronostici IA Verificati",
      description:
        "Risultati trasparenti e verificabili per ogni pronostico calcio IA BetsPlug. Scopri come i nostri modelli trasformano dati in vantaggio misurabile -…",
      ogTitle: "Storico BetsPlug · Risultati Verificabili",
      ogDescription:
        "58,3% di successo. +14,6% ROI. 24.180 pronostici valutati. Ogni pronostico con timestamp nel registro pubblico.",
    },
    sw: {
      title: "Rekodi ya Matokeo · Utabiri wa AI Uliothibitishwa",
      description:
        "Matokeo ya uwazi na yanayokaguliwa kwa kila utabiri wa soka wa BetsPlug AI. Angalia jinsi mifano yetu inavyobadilisha data kuwa faida inayopimika kila…",
      ogTitle: "Rekodi ya BetsPlug · Matokeo Yanayokaguliwa",
      ogDescription:
        "58.3% kiwango cha mafanikio. +14.6% ROI. Utabiri 24,180 uliokadiriwa. Kila chaguo lina muhuri wa wakati.",
    },
    id: {
      title: "Rekam Jejak · Hasil Prediksi AI Terverifikasi",
      description:
        "Hasil transparan dan dapat diaudit untuk setiap prediksi sepak bola AI BetsPlug. Lihat bagaimana model AI kami mengubah data menjadi keunggulan terukur -…",
      ogTitle: "Rekam Jejak BetsPlug · Hasil yang Dapat Diaudit",
      ogDescription:
        "58,3% tingkat akurasi. +14,6% ROI. 24.180 prediksi dinilai. Setiap prediksi memiliki stempel waktu di register publik.",
    },
  

    pt: {
      title: "Histórico · Resultados verificados de previsão de IA",
      description:
        "Resultados transparentes e auditáveis ​​para cada previsão de futebol BetsPlug AI. Veja como nossos modelos transformam os dados de correspondência em uma…",
      ogTitle: "BetsPlug Histórico · Resultados Auditáveis",
      ogDescription:
        "Taxa de acerto de 58,3%. +14,6% de ROI. 24.180 previsões avaliadas. Cada seleção tem carimbo de data e hora e é registrada em um livro-razão público.",
    },
    tr: {
      title: "Geçmiş Performans · Doğrulanmış Yapay Zeka Tahmin Sonuçları",
      description:
        "Her BetsPlug AI futbol tahmini için şeffaf, denetlenebilir sonuçlar. Modellerimizin eşleşme verilerini nasıl ölçülebilir bir avantaja dönüştürdüğünü…",
      ogTitle: "BetsPlug Geçmiş Performans · Denetlenebilir Sonuçlar",
      ogDescription:
        "%58,3 isabet oranı. +%14,6 yatırım getirisi. 24.180 derecelendirilmiş tahmin. Her seçime zaman damgası vuruluyor ve halka açık bir deftere kaydediliyor.",
    },
    pl: {
      title: "Historia osiągnięć · Zweryfikowane wyniki prognoz AI",
      description:
        "Przejrzyste, podlegające kontroli wyniki każdej prognozy piłkarskiej BetsPlug AI. Zobacz, jak nasze modele przekształcają dane o dopasowaniach w wymierną…",
      ogTitle: "BetsPlug Historia · Wyniki podlegające kontroli",
      ogDescription:
        "Skuteczność trafień 58,3%. +14,6% zwrotu z inwestycji. 24 180 stopniowanych prognoz. Każdy wybór jest oznaczony znacznikiem czasu i zarejestrowany w publicznej księdze.",
    },
    ro: {
      title: "Înregistrare · Rezultate verificate de predicție AI",
      description:
        "Rezultate transparente, auditabile pentru fiecare predicție de fotbal BetsPlug AI. Vedeți cum modelele noastre transformă datele de potrivire într-un…",
      ogTitle: "BetsPlug Înregistrare · Rezultate auditabile",
      ogDescription:
        "Rata de lovituri de 58,3%. +14,6% ROI. 24.180 de predicții gradate. Fiecare alegere marcată de timp și înregistrată într-un registru public.",
    },
    ru: {
      title: "Послужной список · Проверенные результаты прогнозов ИИ",
      description:
        "Прозрачные, проверяемые результаты для каждого футбольного прогноза BetsPlug AI. Посмотрите, как наши модели превращают данные матчей в измеримое…",
      ogTitle: "BetsPlug Послужной список · Результаты, подлежащие проверке",
      ogDescription:
        "Показатель попадания 58,3%. +14,6% рентабельности инвестиций. 24 180 оцененных прогнозов. Каждый выбор имеет временную метку и вносится в публичный реестр.",
    },
    el: {
      title: "Εγγραφή παρακολούθησης · ​​Επαληθευμένα αποτελέσματα πρόβλεψης AI",
      description:
        "Διαφανή, ελεγχόμενα αποτελέσματα για κάθε πρόβλεψη ποδοσφαίρου BetsPlug AI. Δείτε πώς τα μοντέλα μας μετατρέπουν τα δεδομένα αντιστοίχισης σε ένα…",
      ogTitle: "BetsPlug Εγγραφή παρακολούθησης · ​​Ελεγχόμενα αποτελέσματα",
      ogDescription:
        "Ποσοστό επιτυχίας 58,3%. +14,6% ROI. 24.180 βαθμολογημένες προβλέψεις. Κάθε επιλογή έχει χρονική σήμανση και καταγράφεται σε ένα δημόσιο βιβλίο.",
    },
    da: {
      title: "Track Record · Verificerede AI-forudsigelsesresultater",
      description:
        "Gennemsigtige, reviderbare resultater for hver BetsPlug AI fodboldforudsigelse. Se, hvordan vores modeller forvandler matchdata til en målbar fordel -…",
      ogTitle: "BetsPlug Track Record · Reviderbare resultater",
      ogDescription:
        "58,3% hitrate. +14,6 % ROI. 24.180 graderede forudsigelser. Hvert valg er tidsstemplet og logget til en offentlig hovedbog.",
    },
    sv: {
      title: "Track Record · Verifierade AI-förutsägelseresultat",
      description:
        "Transparenta, granskningsbara resultat för varje BetsPlug AI fotbollsförutsägelse. Se hur våra modeller förvandlar matchdata till en mätbar fördel -…",
      ogTitle: "BetsPlug Track Record · Reviderbara resultat",
      ogDescription:
        "58,3 % träfffrekvens. +14,6 % ROI. 24 180 graderade förutsägelser. Varje plockning tidsstämplat och loggat till en offentlig reskontra.",
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
        "Accedi al tuo account BetsPlug per vedere i pronostici calcio IA di oggi, monitorare il tuo ROI e gestire il tuo abbonamento per analisi calcistica e…",
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
  

    pt: {
      title: "Entrar · BetsPlug",
      description:
        "Faça login em sua conta BetsPlug para ver as previsões de futebol de IA de hoje, acompanhar seu ROI e gerenciar sua assinatura para previsões de jogos e…",
    },
    tr: {
      title: "Giriş Yap · BetsPlug",
      description:
        "Bugünün AI futbol tahminlerini görmek, yatırım getirinizi takip etmek ve maç tahminleri ve bahis ipuçlarına yönelik aboneliğinizi yönetmek için BetsPlug…",
    },
    pl: {
      title: "Zaloguj się · BetsPlug",
      description:
        "Zaloguj się na swoje konto BetsPlug, aby zobaczyć dzisiejsze prognozy piłkarskie AI, śledzić zwrot z inwestycji i zarządzać subskrypcją prognoz meczów i…",
    },
    ro: {
      title: "Autentificare · BetsPlug",
      description:
        "Conectați-vă la contul dvs. BetsPlug pentru a vedea previziunile de fotbal AI de astăzi, pentru a urmări rentabilitatea investiției și pentru a vă…",
    },
    ru: {
      title: "Войти · BetsPlug",
      description:
        "Войдите в свою учетную запись BetsPlug, чтобы увидеть сегодняшние футбольные прогнозы AI, отслеживать рентабельность инвестиций и управлять подпиской на…",
    },
    el: {
      title: "Σύνδεση · BetsPlug",
      description:
        "Συνδεθείτε στον λογαριασμό σας BetsPlug για να δείτε τις σημερινές προβλέψεις ποδοσφαίρου AI, να παρακολουθήσετε την απόδοση επένδυσης (ROI) και να…",
    },
    da: {
      title: "Log ind · BetsPlug",
      description:
        "Log ind på din BetsPlug-konto for at se dagens AI-fodboldforudsigelser, spore dit ROI og administrere dit abonnement for kampforudsigelser og tip om…",
    },
    sv: {
      title: "Logga in · BetsPlug",
      description:
        "Logga in på ditt BetsPlug-konto för att se dagens AI-fotbollsförutsägelser, spåra din ROI och hantera din prenumeration för matchförutsägelser och…",
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
        "Aperçu de 3 prédictions football IA gratuites avec probabilités de victoire et scores de confiance.",
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
        "Anteprima di 3 pronostici calcio IA gratuiti con probabilità di vittoria e punteggi di affidabilità.",
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
  

    pt: {
      title: "Previsões de partidas de IA · Escolhas de futebol grátis · BetsPlug",
      description:
        "Visualize 3 previsões gratuitas de futebol de IA com probabilidades de vitória e pontuações de confiança.",
      ogTitle: "Previsões de partidas de IA gratuitas · BetsPlug",
      ogDescription:
        "Visualize três previsões de partidas gratuitas com tecnologia de IA. Desbloqueie o resto com um teste.",
    },
    tr: {
      title: "AI Maç Tahminleri · Ücretsiz Futbol Tahminleri · BetsPlug",
      description:
        "Kazanma olasılıkları ve güven puanları ile 3 ücretsiz AI futbol tahminini önizleyin. BetsPlug aboneliğiyle yaklaşan maç tahminlerinin tüm listesinin…",
      ogTitle: "Ücretsiz AI Maç Tahminleri · BetsPlug",
      ogDescription:
        "Yapay zeka destekli 3 ücretsiz maç tahmininin önizlemesini yapın. Geri kalanın kilidini bir denemeyle açın.",
    },
    pl: {
      title: "Prognozy meczów AI · Darmowe typy piłkarskie · BetsPlug",
      description:
        "Przeglądaj 3 bezpłatne prognozy piłkarskie AI z prawdopodobieństwem wygranej i poziomem pewności.",
      ogTitle: "Darmowe prognozy meczów AI · BetsPlug",
      ogDescription:
        "Przejrzyj 3 bezpłatne prognozy meczów oparte na sztucznej inteligencji. Odblokuj resztę w wersji próbnej.",
    },
    ro: {
      title: "Predicții de meci AI · Alegeri gratuite de fotbal · BetsPlug",
      description:
        "Previzualizează 3 previziuni gratuite de fotbal AI cu probabilități de câștig și scoruri de încredere.",
      ogTitle: "Predicții gratuite de meci AI · BetsPlug",
      ogDescription:
        "Previzualizează 3 previziuni gratuite de meci bazate pe inteligență artificială. Deblocați restul cu o încercare.",
    },
    ru: {
      title: "Прогнозы матчей AI · Бесплатные прогнозы на футбол · BetsPlug",
      description:
        "Предварительный просмотр 3 бесплатных футбольных прогнозов AI с вероятностью победы и показателями достоверности.",
      ogTitle: "Бесплатные прогнозы матчей AI · BetsPlug",
      ogDescription:
        "Просмотрите 3 бесплатных прогноза матчей на основе искусственного интеллекта. Остальное разблокируйте с помощью пробной версии.",
    },
    el: {
      title: "Προβλέψεις αγώνων AI · Δωρεάν επιλογές ποδοσφαίρου · BetsPlug",
      description:
        "Προεπισκόπηση 3 δωρεάν προβλέψεων ποδοσφαίρου AI με πιθανότητες νίκης και σκορ εμπιστοσύνης. Ξεκλειδώστε το πλήρες φυλλάδιο των επερχόμενων προβλέψεων…",
      ogTitle: "Δωρεάν προβλέψεις αγώνων AI · BetsPlug",
      ogDescription:
        "Προεπισκόπηση 3 δωρεάν προβλέψεων αγώνων με τεχνητή νοημοσύνη. Ξεκλειδώστε τα υπόλοιπα με μια δοκιμή.",
    },
    da: {
      title: "AI-kampforudsigelser · Gratis fodboldvalg · BetsPlug",
      description:
        "Forhåndsvis 3 gratis AI-fodboldforudsigelser med sejrssandsynligheder og selvtillidsscore. Lås op for hele listen af ​​kommende kampforudsigelser med et…",
      ogTitle: "Gratis AI Match Forudsigelser · BetsPlug",
      ogDescription:
        "Forhåndsvis 3 gratis AI-drevne kampforudsigelser. Lås resten op med en prøveperiode.",
    },
    sv: {
      title: "AI-matchförutsägelser · Gratis fotbollsval · BetsPlug",
      description:
        "Förhandsgranska 3 gratis AI-fotbollsförutsägelser med vinstsannolikheter och självförtroendepoäng.",
      ogTitle: "Gratis AI-matchförutsägelser · BetsPlug",
      ogDescription:
        "Förhandsgranska 3 gratis AI-drivna matchförutsägelser. Lås upp resten med en provversion.",
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
        "Ausführliche Pillar-Guides zur Mathematik hinter klugen Wett-Tipps - Value Betting, Expected Goals, Elo-Ratings, Kelly-Kriterium, Poisson und…",
      ogTitle: "Fußballwetten Lernen · BetsPlug",
      ogDescription:
        "Sechs tiefgehende Pillar-Guides zu Value Betting, xG, Elo, Kelly, Poisson und Bankroll-Management.",
    },
    fr: {
      title: "Apprendre les Paris · Value, xG, Elo · BetsPlug",
      description:
        "Guides approfondis sur les maths derrière les pronostics football intelligents - value betting, expected goals, classements Elo, critère de Kelly, modèles…",
      ogTitle: "Apprendre les Paris Football · BetsPlug",
      ogDescription:
        "Six guides approfondis sur le value betting, xG, Elo, Kelly, Poisson et la gestion de bankroll.",
    },
    es: {
      title: "Aprende Apuestas Fútbol · Value, xG · BetsPlug",
      description:
        "Guías en profundidad sobre las matemáticas detrás de las apuestas inteligentes - value betting, goles esperados, ratings Elo, criterio Kelly y modelos…",
      ogTitle: "Aprende Apuestas de Fútbol · BetsPlug",
      ogDescription:
        "Seis guías en profundidad sobre value betting, xG, Elo, Kelly, Poisson y gestión de bankroll.",
    },
    it: {
      title: "Impara le Scommesse Calcio · Value, xG · BetsPlug",
      description:
        "Guide approfondite sulla matematica delle scommesse calcistiche intelligenti - value betting, expected goals, rating Elo, criterio di Kelly, modelli…",
      ogTitle: "Impara le Scommesse Calcio · BetsPlug",
      ogDescription:
        "Sei guide approfondite su value betting, xG, Elo, Kelly, Poisson e gestione del bankroll.",
    },
    sw: {
      title: "Jifunze Kamari ya Soka · Value, xG, Elo · BetsPlug",
      description:
        "Miongozo ya kina kuhusu hesabu nyuma ya uchambuzi wa soka - value betting, expected goals, Elo ratings, Kelly criterion, Poisson models na usimamizi wa…",
      ogTitle: "Jifunze Kamari ya Soka · BetsPlug",
      ogDescription:
        "Miongozo sita ya kina kuhusu value betting, xG, Elo, Kelly, Poisson na usimamizi wa bankroll.",
    },
    id: {
      title: "Belajar Taruhan Sepak Bola · Value, xG · BetsPlug",
      description:
        "Panduan mendalam tentang matematika di balik taruhan sepak bola cerdas - value betting, expected goals, rating Elo, kriteria Kelly, model Poisson, dan…",
      ogTitle: "Belajar Taruhan Sepak Bola · BetsPlug",
      ogDescription:
        "Enam panduan mendalam tentang value betting, xG, Elo, Kelly, Poisson, dan manajemen bankroll.",
    },
  

    pt: {
      title: "Aprenda apostas em futebol · Valor, xG, Elo · BetsPlug",
      description:
        "Guias detalhados sobre a matemática por trás das apostas de futebol precisas - apostas de valor, gols esperados, classificações Elo, critério de Kelly…",
      ogTitle: "Aprenda Apostas em Futebol · BetsPlug",
      ogDescription:
        "Seis guias de pilares detalhados que cobrem apostas de valor, xG, Elo, Kelly, Poisson e gerenciamento de bankroll.",
    },
    tr: {
      title: "Futbol Bahislerini Öğrenin · Değer, xG, Elo · BetsPlug",
      description:
        "Keskin futbol bahislerinin arkasındaki matematik hakkında derinlemesine temel kılavuzlar - değerli bahisler, beklenen goller, Elo derecelendirmeleri…",
      ogTitle: "Futbol Bahislerini Öğrenin · BetsPlug",
      ogDescription:
        "Değerli bahisleri, xG, Elo, Kelly, Poisson ve hazır para yönetimini kapsayan altı ayrıntılı temel kılavuz.",
    },
    pl: {
      title: "Naucz się zakładów na piłkę nożną · Wartość, xG, Elo · BetsPlug",
      description:
        "Dogłębne przewodniki po filarach na temat matematyki stojącej za ostrymi zakładami na piłkę nożną – zakłady z wartością, oczekiwane bramki, rankingi Elo…",
      ogTitle: "Naucz się zakładów piłkarskich · BetsPlug",
      ogDescription:
        "Sześć szczegółowych przewodników po filarach obejmujących zakłady wartościowe, xG, Elo, Kelly, Poisson i zarządzanie bankrollem.",
    },
    ro: {
      title: "Învață pariuri la fotbal · Valoare, xG, Elo · BetsPlug",
      description:
        "Ghiduri aprofundate despre matematica din spatele pariurilor ascuțite pe fotbal - pariuri de valoare, goluri așteptate, evaluări Elo, criteriul Kelly…",
      ogTitle: "Învață pariuri la fotbal · BetsPlug",
      ogDescription:
        "Șase ghiduri de pilon de adâncime care acoperă pariurile valorice, xG, Elo, Kelly, Poisson și managementul bankroll-ului.",
    },
    ru: {
      title: "Изучите ставки на футбол · Значение, xG, Elo · BetsPlug",
      description:
        "Подробные руководства по математике, лежащей в основе четких ставок на футбол: ставки с перевесом, ожидаемые голы, рейтинги Elo, критерий Келли, модели…",
      ogTitle: "Изучите ставки на футбол · BetsPlug",
      ogDescription:
        "Шесть подробных руководств по ставкам на ценность, xG, Elo, Келли, Poisson и управлению банкроллом.",
    },
    el: {
      title: "Μάθετε στοιχήματα ποδοσφαίρου · Value, xG, Elo · BetsPlug",
      description:
        "Σε βάθος οδηγοί πυλώνων σχετικά με τα μαθηματικά πίσω από τα αιχμηρά στοιχήματα ποδοσφαίρου - στοιχήματα αξίας, αναμενόμενα γκολ, βαθμολογίες Elo, το…",
      ogTitle: "Μάθετε στοιχήματα ποδοσφαίρου · BetsPlug",
      ogDescription:
        "Έξι οδηγοί πυλώνων βαθιάς κατάδυσης που καλύπτουν στοιχήματα αξίας, xG, Elo, Kelly, Poisson και διαχείριση bankroll.",
    },
    da: {
      title: "Lær fodboldvæddemål · Værdi, xG, Elo · BetsPlug",
      description:
        "Dybtgående søjlevejledninger om matematikken bag skarpe fodboldvæddemål - værdivæddemål, forventede mål, Elo-vurderinger, Kelly-kriteriet…",
      ogTitle: "Lær fodboldvæddemål · BetsPlug",
      ogDescription:
        "Seks dybe dyk-søjleguider, der dækker værdivæddemål, xG, Elo, Kelly, Poisson og bankroll management.",
    },
    sv: {
      title: "Lär dig vadslagning på fotboll · Värde, xG, Elo · BetsPlug",
      description:
        "Fördjupade pelarguider om matematiken bakom skarp fotbollsvadslagning - värdespel, förväntade mål, Elo-betyg, Kelly-kriteriet, Poisson-modeller och…",
      ogTitle: "Lär dig vadslagning på fotboll · BetsPlug",
      ogDescription:
        "Sex djupdykningsguider som täcker värdespel, xG, Elo, Kelly, Poisson och bankrullehantering.",
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
        "Comment fonctionnent les marchés de pronostics football populaires, comment les bookmakers les tarifent et quand le marché offre de la valeur.",
      ogTitle: "Types de Paris Expliqués · BetsPlug",
      ogDescription:
        "Analyses approfondies de BTTS, Over 2.5, Double Chance, Draw No Bet et d'autres marchés populaires.",
    },
    es: {
      title: "Tipos de Apuesta Explicados · BTTS, Over 2.5 · BetsPlug",
      description:
        "Cómo funcionan los mercados de apuestas de fútbol populares, cómo los fijan los bookmakers y cuándo el mercado ofrece valor.",
      ogTitle: "Tipos de Apuesta Explicados · BetsPlug",
      ogDescription:
        "Análisis detallados de BTTS, Over 2.5, Double Chance, Draw No Bet y más mercados populares de fútbol.",
    },
    it: {
      title: "Tipi di Scommessa Spiegati · BTTS, Over 2.5 · BetsPlug",
      description:
        "Come funzionano i mercati delle scommesse calcistiche, come i bookmaker li quotano e quando il mercato offre valore.",
      ogTitle: "Tipi di Scommessa Spiegati · BetsPlug",
      ogDescription:
        "Approfondimenti su BTTS, Over 2.5, Double Chance, Draw No Bet e altri mercati calcistici popolari.",
    },
    sw: {
      title: "Aina za Kamari Zimeelezwa · BTTS, Over 2.5 · BetsPlug",
      description:
        "Jinsi masoko maarufu ya kamari za soka yanavyofanya kazi, jinsi bukumeka zinavyoweka bei na masoko yanapotoa thamani.",
      ogTitle: "Aina za Kamari Zimeelezwa · BetsPlug",
      ogDescription:
        "Uchambuzi wa kina wa BTTS, Over 2.5, Double Chance, Draw No Bet na masoko mengine maarufu.",
    },
    id: {
      title: "Jenis Taruhan Dijelaskan · BTTS, Over 2.5 · BetsPlug",
      description:
        "Bagaimana pasar taruhan sepak bola populer bekerja, bagaimana bandar menetapkan harga, dan kapan pasar menawarkan nilai.",
      ogTitle: "Jenis Taruhan Dijelaskan · BetsPlug",
      ogDescription:
        "Pembahasan mendalam tentang BTTS, Over 2.5, Double Chance, Draw No Bet, dan pasar sepak bola populer lainnya.",
    },
  

    pt: {
      title: "Tipos de apostas explicados · BTTS, acima de 2,5, DC · BetsPlug",
      description:
        "Como funcionam os mercados populares de apostas em futebol, como os livros os avaliam e quando o mercado oferece valor.",
      ogTitle: "Tipos de apostas explicados · BetsPlug",
      ogDescription:
        "Mergulha profundamente em BTTS, Over 2.5, Double Chance, Draw No Bet e mercados de futebol mais populares.",
    },
    tr: {
      title: "Açıklanan Bahis Türleri · BTTS, 2.5 Üstü, DC · BetsPlug",
      description:
        "Popüler futbol bahis pazarları nasıl çalışır, kitapların bunları nasıl fiyatlandırdığı ve pazarın ne zaman değer sunduğu.",
      ogTitle: "Açıklanan Bahis Türleri · BetsPlug",
      ogDescription:
        "BTTS, 2.5 Üstü, Çifte Şans, Beraberlik Bahissiz ve daha popüler futbol pazarlarına derinlemesine bakış.",
    },
    pl: {
      title: "Wyjaśnienie typów zakładów · BTTS, powyżej 2,5, DC · BetsPlug",
      description:
        "Jak działają popularne rynki zakładów na piłkę nożną, jak wyceniają je książki i kiedy rynek oferuje wartość.",
      ogTitle: "Wyjaśnienie typów zakładów · BetsPlug",
      ogDescription:
        "Głęboko zagłębiamy się w BTTS, Over 2,5, Double Chance, Draw No Bet i bardziej popularne rynki piłkarskie.",
    },
    ro: {
      title: "Tipuri de pariuri explicate · BTTS, peste 2,5, DC · BetsPlug",
      description:
        "Cât de populare funcționează piețele de pariuri pe fotbal, cum le prețuiesc cărțile și când piața oferă valoare.",
      ogTitle: "Tipuri de pariuri explicate · BetsPlug",
      ogDescription:
        "Scufundări profunde în BTTS, Over 2.5, Double Chance, Draw No Bet și mai multe piețe de fotbal populare.",
    },
    ru: {
      title: "Объяснение типов ставок · BTTS, Больше 2,5, DC · BetsPlug",
      description:
        "Как работают популярные рынки ставок на футбол, как на них оцениваются книги и когда рынок предлагает ценность.",
      ogTitle: "Объяснение типов ставок · BetsPlug",
      ogDescription:
        "Подробный обзор BTTS, «Более 2,5», «Двойной шанс», «Ничья без ставки» и других популярных футбольных рынков.",
    },
    el: {
      title: "Επεξήγηση τύπων στοιχήματος · BTTS, Πάνω από 2,5, DC · BetsPlug",
      description:
        "Πώς λειτουργούν οι δημοφιλείς αγορές στοιχημάτων ποδοσφαίρου, πώς τιμολογούν τα βιβλία και πότε η αγορά προσφέρει αξία.",
      ogTitle: "Επεξήγηση των τύπων στοιχημάτων · BetsPlug",
      ogDescription:
        "Βαθιές βουτιές σε BTTS, Over 2,5, Double Chance, Draw No Bet και σε πιο δημοφιλείς αγορές ποδοσφαίρου.",
    },
    da: {
      title: "Indsatstyper forklaret · BTTS, over 2,5, DC · BetsPlug",
      description:
        "Hvordan populære markeder for fodboldvæddemål fungerer, hvordan bøger prissætter dem, og hvornår markedet tilbyder værdi.",
      ogTitle: "Indsatstyper forklaret · BetsPlug",
      ogDescription:
        "Dyb dyk ned i BTTS, Over 2,5, Double Chance, Draw No Bet og flere populære fodboldmarkeder.",
    },
    sv: {
      title: "Insatstyper förklaras · BTTS, över 2,5, DC · BetsPlug",
      description:
        "Hur populära fotbollsspelmarknader fungerar, hur böcker prissätter dem och när marknaden erbjuder värde.",
      ogTitle: "Insatstyper förklaras · BetsPlug",
      ogDescription:
        "Djupdykning i BTTS, Över 2,5, Double Chance, Draw No Bet och fler populära fotbollsmarknader.",
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
        "Ihre BetsPlug-Mitgliedschaft ist aktiv. Melden Sie sich an, um die heutigen KI Fußballprognosen zu sehen, Ihren ROI zu verfolgen und klügere Wett-Tipps zu…",
    },
    fr: {
      title: "Bienvenue à Bord · BetsPlug",
      description:
        "Votre abonnement BetsPlug est actif. Connectez-vous pour voir les prédictions football IA du jour, suivre votre ROI et gagner plus intelligemment avec nos…",
    },
    es: {
      title: "Bienvenido a Bordo · BetsPlug",
      description:
        "Su membresía BetsPlug está activa. Inicie sesión para ver las predicciones fútbol IA de hoy, seguir su ROI y ganar de forma más inteligente con nuestras…",
    },
    it: {
      title: "Benvenuto a Bordo · BetsPlug",
      description:
        "La tua iscrizione BetsPlug è attiva. Accedi per vedere i pronostici calcio IA di oggi, monitorare il tuo ROI e iniziare a vincere con le scommesse più…",
    },
    sw: {
      title: "Karibu Ndani · BetsPlug",
      description:
        "Uanachama wako wa BetsPlug umewashwa. Ingia kuona utabiri wa soka wa AI wa leo, kufuatilia ROI yako na kuanza kushinda kwa akili zaidi na uchambuzi wa…",
    },
    id: {
      title: "Selamat Datang · BetsPlug",
      description:
        "Keanggotaan BetsPlug Anda aktif. Masuk untuk melihat prediksi sepak bola AI hari ini, melacak ROI, dan mulai menang lebih cerdas dengan analisis sepak…",
    },
  

    pt: {
      title: "Bem-vindo a bordo · BetsPlug",
      description:
        "Sua assinatura BetsPlug está ativa. Faça login para ver as previsões de futebol de IA de hoje, acompanhe seu ROI e comece a ganhar de maneira mais…",
    },
    tr: {
      title: "Aramıza Hoş Geldiniz · BetsPlug",
      description:
        "BetsPlug üyeliğiniz aktif. Bugünün yapay zeka futbol tahminlerini görmek, yatırım getirinizi takip etmek ve veriye dayalı maç tahminleriyle daha akıllıca…",
    },
    pl: {
      title: "Witamy na pokładzie · BetsPlug",
      description:
        "Twoje członkostwo BetsPlug jest aktywne. Zaloguj się, aby zobaczyć dzisiejsze prognozy piłkarskie AI, śledzić zwrot z inwestycji i zacząć wygrywać mądrzej…",
    },
    ro: {
      title: "Bun venit la bord · BetsPlug",
      description:
        "Abonamentul dvs. BetsPlug este activ. Conectați-vă pentru a vedea previziunile de fotbal AI de astăzi, urmăriți rentabilitatea investiției și începeți să…",
    },
    ru: {
      title: "Добро пожаловать на борт · BetsPlug",
      description:
        "Ваше членство в BetsPlug активно. Войдите в систему, чтобы увидеть сегодняшние футбольные прогнозы AI, отслеживать рентабельность инвестиций и начать…",
    },
    el: {
      title: "Καλώς ήρθατε στο πλοίο · BetsPlug",
      description:
        "Η συνδρομή σας στο BetsPlug είναι ενεργή. Συνδεθείτε για να δείτε τις σημερινές προβλέψεις ποδοσφαίρου με τεχνητή νοημοσύνη, παρακολουθήστε την απόδοση…",
    },
    da: {
      title: "Velkommen ombord · BetsPlug",
      description:
        "Dit BetsPlug-medlemskab er aktivt. Log ind for at se dagens AI-fodboldforudsigelser, spor dit ROI, og begynd at vinde smartere med datadrevne…",
    },
    sv: {
      title: "Välkommen ombord · BetsPlug",
      description:
        "Ditt BetsPlug-medlemskap är aktivt. Logga in för att se dagens AI-fotbollsförutsägelser, spåra din ROI och börja vinna smartare med datadrivna…",
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
        "Werden Sie Partner von BetsPlug für KI Fußballprognosen und Fußballanalyse. Datenlizenzen, White-Label-Lösungen und Affiliate-Partnerschaften für…",
    },
    fr: {
      title: "Partenariats B2B · BetsPlug",
      description:
        "Devenez partenaire de BetsPlug pour les prédictions football IA et l'analyse football. Licences de données, solutions en marque blanche et partenariats…",
    },
    es: {
      title: "Asociaciones B2B · BetsPlug",
      description:
        "Asóciese con BetsPlug para predicciones fútbol IA y análisis de fútbol. Licencias de datos, soluciones de marca blanca y asociaciones de afiliados para…",
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
  

    pt: {
      title: "Parcerias B2B · BetsPlug",
      description:
        "Faça parceria com BetsPlug para previsões e análises de futebol de IA. Licenciamento de dados, soluções de marca branca e parcerias afiliadas para…",
    },
    tr: {
      title: "B2B Ortaklıkları · BetsPlug",
      description:
        "Yapay zeka futbol tahminleri ve analizleri için BetsPlug ile ortak olun. Bahis ipuçları arayan işletmeler için veri lisanslama, beyaz etiket çözümleri ve…",
    },
    pl: {
      title: "Partnerstwa B2B · BetsPlug",
      description:
        "Współpracuj z BetsPlug w zakresie prognoz i analiz piłkarskich AI. Licencjonowanie danych, rozwiązania typu white-label i partnerstwa partnerskie dla firm…",
    },
    ro: {
      title: "Parteneriate B2B · BetsPlug",
      description:
        "Colaborați cu BetsPlug pentru predicții și analize de fotbal AI. Licențiere de date, soluții cu etichetă albă și parteneriate cu afiliați pentru…",
    },
    ru: {
      title: "B2B-партнерство · BetsPlug",
      description:
        "Сотрудничайте с BetsPlug для прогнозов и аналитики футбола с помощью искусственного интеллекта.",
    },
    el: {
      title: "Συνεργασίες B2B · BetsPlug",
      description:
        "Συνεργαστείτε με το BetsPlug για προβλέψεις και αναλυτικά στοιχεία ποδοσφαίρου AI. Αδειοδότηση δεδομένων, λύσεις λευκής ετικέτας και συνεργασίες…",
    },
    da: {
      title: "B2B-partnerskaber · BetsPlug",
      description:
        "Partner med BetsPlug for forudsigelser og analyser af AI-fodbold. Datalicenser, white-label-løsninger og affilierede partnerskaber for virksomheder, der…",
    },
    sv: {
      title: "B2B-partnerskap · BetsPlug",
      description:
        "Samarbeta med BetsPlug för AI-fotbollsförutsägelser och analyser. Datalicensiering, white-label-lösningar och affiliate-partnerskap för företag som söker…",
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
        "Complete su suscripción BetsPlug en tres pasos rápidos. Obtenga predicciones fútbol IA y análisis de fútbol con garantía de devolución de 14 días.",
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


    pt: {
      title: "Finalizar compra · Comece sua assinatura BetsPlug",
      description:
        "Conclua sua assinatura BetsPlug em três etapas rápidas. Obtenha previsões de futebol de IA e análises de partidas com garantia de devolução do dinheiro em…",
    },
    tr: {
      title: "Ödeme · BetsPlug Aboneliğinizi Başlatın",
      description:
        "BetsPlug aboneliğinizi üç hızlı adımda tamamlayın. 14 günlük para iade garantisiyle yapay zeka futbol tahminleri ve maç analizleri alın.",
    },
    pl: {
      title: "Do kasy · Rozpocznij subskrypcję BetsPlug",
      description:
        "Ukończ subskrypcję BetsPlug w trzech szybkich krokach. Otrzymuj prognozy piłkarskie AI i analizy meczów dzięki 14-dniowej gwarancji zwrotu pieniędzy.",
    },
    ro: {
      title: "Finalizare · Începeți abonamentul BetsPlug",
      description:
        "Finalizați abonamentul BetsPlug în trei pași rapizi. Obțineți previziuni de fotbal AI și analize de meci cu o garanție de rambursare a banilor de 14 zile.",
    },
    ru: {
      title: "Оформить заказ · Начните подписку BetsPlug",
      description:
        "Завершите подписку BetsPlug за три быстрых шага. Получайте футбольные прогнозы с помощью искусственного интеллекта и аналитику матчей с 14-дневной…",
    },
    el: {
      title: "Ολοκλήρωση αγοράς · Ξεκινήστε τη συνδρομή σας BetsPlug",
      description:
        "Ολοκληρώστε τη συνδρομή σας BetsPlug σε τρία γρήγορα βήματα. Λάβετε προβλέψεις ποδοσφαίρου AI και αναλυτικά στοιχεία αγώνων με εγγύηση επιστροφής χρημάτων…",
    },
    da: {
      title: "Kasse · Start dit BetsPlug-abonnement",
      description:
        "Fuldfør dit BetsPlug-abonnement i tre hurtige trin. Få AI-fodboldforudsigelser og kampanalyser med en 14-dages pengene-tilbage-garanti.",
    },
    sv: {
      title: "Kassa · Starta din BetsPlug-prenumeration",
      description:
        "Slutför din BetsPlug-prenumeration i tre snabba steg. Få AI-fotbollsförutsägelser och matchanalyser med en 14-dagars pengarna-tillbaka-garanti.",
    },
},

  /* ─────────────────────────── ENGINE TRANSPARENCY ───────────── */
  "/engine": {
    en: {
      title: "Engine Transparency · BetsPlug Methodology",
      description: "How BetsPlug classifies every pick into a quality tier, how we measure accuracy, and the live per-tier results from our v8.1 engine.",
      ogTitle: "How BetsPlug measures accuracy · Engine transparency",
      ogDescription: "Four pick tiers (Platinum / Gold / Silver / Free), each with its own historical accuracy. Methodology, sample sizes, Wilson confidence intervals — all public.",
    },
    nl: {
      title: "Engine Transparantie · BetsPlug Methodologie",
      description: "Hoe BetsPlug elke pick in een kwaliteitstier indeelt, hoe we nauwkeurigheid meten, en de live per-tier resultaten van onze v8.1 engine.",
      ogTitle: "Hoe BetsPlug nauwkeurigheid meet · Engine transparantie",
      ogDescription: "Vier pick tiers (Platinum / Gold / Silver / Free), elk met eigen historische nauwkeurigheid. Methodologie, sample sizes, Wilson betrouwbaarheidsintervallen — publiek.",
    },
  
    de: {
      title: "Engine-Transparenz · BetsPlug Methodik",
      description:
        "Wie BetsPlug jede Auswahl in eine Qualitätsstufe einordnet, wie wir die Genauigkeit messen und die Live-Ergebnisse pro Stufe unserer v8.1-Engine.",
      ogTitle: "Wie BetsPlug die Genauigkeit misst · Engine-Transparenz",
      ogDescription:
        "Vier Auswahlstufen (Platin / Gold / Silber / Kostenlos), jede mit ihrer eigenen historischen Genauigkeit. Methodik, Stichprobengrößen, Wilson-Konfidenzintervalle – alles öffentlich.",
    },
    fr: {
      title: "Transparence du moteur · Méthodologie BetsPlug",
      description:
        "Comment BetsPlug classe chaque choix dans un niveau de qualité, comment nous mesurons la précision et les résultats en direct par niveau de notre moteur…",
      ogTitle: "Comment BetsPlug mesure la précision · Transparence du moteur",
      ogDescription:
        "Quatre niveaux de sélection (Platine/Or/Argent/Gratuit), chacun avec sa propre précision historique. Méthodologie, tailles d’échantillon, intervalles de confiance de Wilson – tous publics.",
    },
    es: {
      title: "Transparencia del Motor · BetsPlug Metodología",
      description:
        "Cómo BetsPlug clasifica cada selección en un nivel de calidad, cómo medimos la precisión y los resultados en vivo por nivel de nuestro motor v8.1.",
      ogTitle: "Cómo BetsPlug mide la precisión · Transparencia del motor",
      ogDescription:
        "Cuatro niveles de selección (Platino / Oro / Plata / Gratis), cada uno con su propia precisión histórica. Metodología, tamaños de muestra, intervalos de confianza de Wilson: todo público.",
    },
    it: {
      title: "Trasparenza del motore · Metodologia BetsPlug",
      description:
        "Come BetsPlug classifica ogni scelta in un livello di qualità, come misuriamo la precisione e i risultati in tempo reale per livello dal nostro motore…",
      ogTitle: "Come BetsPlug misura la precisione · Trasparenza del motore",
      ogDescription:
        "Quattro livelli di scelta (Platino/Oro/Argento/Gratuito), ciascuno con la propria accuratezza storica. Metodologia, dimensioni del campione, intervalli di confidenza di Wilson: tutto pubblico.",
    },
    sw: {
      title: "Uwazi wa Injini · BetsPlug Mbinu",
      description:
        "Jinsi BetsPlug inavyoainisha kila chaguo katika kiwango cha ubora, jinsi tunavyopima usahihi, na matokeo ya moja kwa moja kwa kila ngazi kutoka kwa injini…",
      ogTitle: "Jinsi BetsPlug inavyopima usahihi · Uwazi wa injini",
      ogDescription:
        "Viwango vinne vya kuchagua (Platinum / Dhahabu / Fedha / Bure), kila moja ikiwa na usahihi wake wa kihistoria. Mbinu, ukubwa wa sampuli, vipindi vya kujiamini vya Wilson - yote ya umma.",
    },
    id: {
      title: "Transparansi Mesin · BetsPlug Metodologi",
      description:
        "Bagaimana BetsPlug mengklasifikasikan setiap pilihan ke dalam tingkat kualitas, cara kami mengukur akurasi, dan hasil langsung per tingkat dari mesin v8.1…",
      ogTitle: "Bagaimana BetsPlug mengukur akurasi · Transparansi mesin",
      ogDescription:
        "Empat tingkatan pilihan (Platinum / Emas / Perak / Gratis), masing-masing memiliki keakuratan historisnya sendiri. Metodologi, ukuran sampel, interval kepercayaan Wilson — semuanya bersifat publik.",
    },

    pt: {
      title: "Transparência do motor · Metodologia BetsPlug",
      description:
        "Como o BetsPlug classifica cada escolha em um nível de qualidade, como medimos a precisão e os resultados ao vivo por nível do nosso mecanismo v8.1.",
      ogTitle: "Como BetsPlug mede a precisão · Transparência do mecanismo",
      ogDescription:
        "Quatro níveis de escolha (Platina/Ouro/Prata/Grátis), cada um com sua própria precisão histórica. Metodologia, tamanhos de amostra, intervalos de confiança de Wilson – todos públicos.",
    },
    tr: {
      title: "Motor Şeffaflığı · BetsPlug Metodoloji",
      description:
        "BetsPlug'nin her seçimi bir kalite katmanına nasıl sınıflandırdığı, doğruluğu nasıl ölçtüğümüz ve v8.1 motorumuzdan her aşamaya göre canlı sonuçlar.",
      ogTitle: "BetsPlug doğruluğu nasıl ölçer · Motor şeffaflığı",
      ogDescription:
        "Her biri kendi tarihsel doğruluğuna sahip dört seçim katmanı (Platin / Altın / Gümüş / Ücretsiz). Metodoloji, örneklem büyüklükleri, Wilson güven aralıkları — hepsi halka açık.",
    },
    pl: {
      title: "Przejrzystość silnika · BetsPlug Metodologia",
      description:
        "Jak BetsPlug klasyfikuje każdy typ według poziomu jakości, jak mierzymy dokładność i aktualne wyniki dla poszczególnych poziomów z naszego silnika v8.1.",
      ogTitle: "Jak BetsPlug mierzy dokładność · Przejrzystość silnika",
      ogDescription:
        "Cztery poziomy wyboru (Platyna / Złoto / Srebro / Bezpłatny), każdy z własną historyczną dokładnością. Metodologia, wielkość próby, przedziały ufności Wilsona – wszystkie informacje publiczne.",
    },
    ro: {
      title: "Transparența motorului · BetsPlug Metodologie",
      description:
        "Cum BetsPlug clasifică fiecare alegere într-un nivel de calitate, cum măsurăm acuratețea și rezultatele live pe nivel din motorul nostru v8.1.",
      ogTitle: "Cum măsoară BetsPlug acuratețea · Transparența motorului",
      ogDescription:
        "Patru niveluri de alegere (Platină / Aur / Argint / Gratuit), fiecare cu acuratețea sa istorică. Metodologie, dimensiunile eșantionului, intervale de încredere Wilson — toate publice.",
    },
    ru: {
      title: "Прозрачность движка · Методология BetsPlug",
      description:
        "Как BetsPlug классифицирует каждый выбор по уровню качества, как мы измеряем точность и получаем реальные результаты для каждого уровня с помощью нашего…",
      ogTitle: "Как BetsPlug измеряет точность · Прозрачность движка",
      ogDescription:
        "Четыре уровня выбора (Платина/Золото/Серебро/Бесплатно), каждый из которых имеет свою историческую точность. Методология, размеры выборки, доверительные интервалы Вильсона — все общедоступно.",
    },
    el: {
      title: "Διαφάνεια κινητήρα · Μεθοδολογία BetsPlug",
      description:
        "Πώς το BetsPlug ταξινομεί κάθε επιλογή σε επίπεδο ποιότητας, πώς μετράμε την ακρίβεια και τα ζωντανά αποτελέσματα ανά βαθμίδα από τον κινητήρα μας v8.1.",
      ogTitle: "Πώς το BetsPlug μετρά την ακρίβεια · Διαφάνεια κινητήρα",
      ogDescription:
        "Τέσσερα επίπεδα επιλογής (Πλατινένιο / Χρυσό / Ασήμι / Δωρεάν), το καθένα με τη δική του ιστορική ακρίβεια. Μεθοδολογία, μεγέθη δείγματος, διαστήματα εμπιστοσύνης Wilson — όλα δημόσια.",
    },
    da: {
      title: "Motorgennemsigtighed · BetsPlug Metodik",
      description:
        "Hvordan BetsPlug klassificerer hvert valg i et kvalitetsniveau, hvordan vi måler nøjagtighed og de live per-tier resultater fra vores v8.1-motor.",
      ogTitle: "Hvordan BetsPlug måler nøjagtighed · Motorgennemsigtighed",
      ogDescription:
        "Fire udvalgte niveauer (Platin / Guld / Sølv / Gratis), hver med sin egen historiske nøjagtighed. Metode, stikprøvestørrelser, Wilson-konfidensintervaller - alle offentlige.",
    },
    sv: {
      title: "Motortransparens · BetsPlug Metodik",
      description:
        "Hur BetsPlug klassificerar varje val i en kvalitetsnivå, hur vi mäter noggrannhet och liveresultaten per nivå från vår v8.1-motor.",
      ogTitle: "Hur BetsPlug mäter noggrannhet · Motortransparens",
      ogDescription:
        "Fyra valnivåer (Platina / Guld / Silver / Gratis), var och en med sin egen historiska noggrannhet. Metodik, urvalsstorlekar, Wilsons konfidensintervall – allt offentligt.",
    },
},

  /* ─────────────────────────── PRICING ─────────────────────── */
  "/pricing": {
    en: {
      title: "Pricing Plans · AI Football Predictions · BetsPlug",
      description:
        "Choose the BetsPlug plan that fits you — Free Access at €0, Silver for casual users, Gold for full access, or Platinum Lifetime founder-tier for €199 once.",
      ogTitle: "BetsPlug Pricing · AI Football Predictions",
      ogDescription:
        "Free Access, Silver, Gold or Platinum Lifetime — pick the plan built for your betting style.",
    },

    nl: {
      title: "Prijsplannen · AI-voetbalvoorspellingen · BetsPlug",
      description:
        "Kies het BetsPlug-abonnement dat bij je past: Free Access voor €0, Silver voor informele abonnees, Gold voor volledige toegang, of Platinum Lifetime Founder-niveau voor eenmalig € 199.",
      ogTitle: "BetsPlug-prijzen · AI-voetbalvoorspellingen",
      ogDescription:
        "Free Access, Silver, Gold of Platinum Lifetime — kies het plan dat bij je gokstijl past.",
    },
    de: {
      title: "Preispläne · KI-Fußballvorhersagen · BetsPlug",
      description:
        "Wählen Sie den BetsPlug-Plan, der zu Ihnen passt — Free Access für 0 €, Silber für Gelegenheitsnutzer, Gold für vollen Zugriff oder Platinum…",
      ogTitle: "BetsPlug-Preise · KI-Fußballvorhersagen",
      ogDescription:
        "Free Access, Silber, Gold oder Platin auf Lebenszeit — wählen Sie den Plan, der zu Ihrem Analysestil passt.",
    },
    fr: {
      title: "Plans tarifaires · Prédictions de football IA · BetsPlug",
      description:
        "Choisissez le plan BetsPlug qui vous convient : Free Access à 0 €, Argent pour les utilisateurs occasionnels, Or pour un accès complet ou niveau fondateur…",
      ogTitle: "Tarifs BetsPlug · Prédictions de football IA",
      ogDescription:
        "Free Access, Argent, Or ou Platine à vie : choisissez le plan adapté à votre style d’analyse.",
    },
    es: {
      title: "Planes de precios · Predicciones de fútbol con IA · BetsPlug",
      description:
        "Elige el plan BetsPlug que más te convenga: Free Access a 0 €, Silver para usuarios ocasionales, Gold para acceso completo o nivel fundador Platinum…",
      ogTitle: "Precios de BetsPlug · Predicciones de fútbol con IA",
      ogDescription:
        "Free Access, Silver, Gold o Platinum de por vida: elige el plan diseñado para tu estilo de análisis.",
    },
    it: {
      title: "Piani tariffari · Pronostici di calcio AI · BetsPlug",
      description:
        "Scegli il piano BetsPlug adatto a te: Free Access a 0 €, Silver per utenti occasionali, Gold per accesso completo o Livello fondatore Platinum Lifetime…",
      ogTitle: "Prezzi BetsPlug · Pronostici calcistici AI",
      ogDescription:
        "Free Access, Silver, Gold o Platinum a vita: scegli il piano creato per il tuo stile di analisi.",
    },
    sw: {
      title: "Mipango ya Bei · Utabiri wa Soka wa AI · BetsPlug",
      description:
        "Chagua mpango wa BetsPlug unaokufaa — Free Access kwa €0, Silver kwa watumiaji wa kawaida, Gold kwa ufikiaji kamili, au mwanzilishi wa kiwango cha…",
      ogTitle: "Bei ya BetsPlug · Utabiri wa Soka wa AI",
      ogDescription:
        "Free Access, Silver, Gold au Platinum Maishani — chagua mpango ulioundwa kwa mtindo wako wa uchambuzi.",
    },
    id: {
      title: "Paket Harga · Prediksi Sepak Bola AI · BetsPlug",
      description:
        "Pilih paket BetsPlug yang cocok untuk Anda — Free Access seharga €0, Silver untuk pengguna biasa, Gold untuk akses penuh, atau tingkat pendiri Platinum…",
      ogTitle: "Harga BetsPlug · Prediksi Sepak Bola AI",
      ogDescription:
        "Free Access, Silver, Gold, atau Platinum Seumur Hidup — pilih paket yang dibuat untuk gaya analisis Anda.",
    },
  
    pt: {
      title: "Planos de preços · Previsões de futebol com IA · BetsPlug",
      description:
        "Escolha o plano BetsPlug mais adequado para você: Free Access por € 0, Silver para usuários casuais, Gold para acesso total ou nível de fundador Platinum…",
      ogTitle: "BetsPlug Preços · Previsões de futebol de IA",
      ogDescription:
        "Free Access, Silver, Gold ou Platinum Vitalício — escolha o plano criado para o seu estilo de análise.",
    },
    tr: {
      title: "Fiyatlandırma Planları · AI Futbol Tahminleri · BetsPlug",
      description:
        "Size uygun BetsPlug planını seçin — 0 € karşılığında Free Access, sıradan kullanıcılar için Silver, tam erişim için Gold veya tek seferlik 199 €…",
      ogTitle: "BetsPlug Fiyatlandırma · Yapay Zeka Futbol Tahminleri",
      ogDescription:
        "Free Access, Silver, Gold veya Platinum Ömür Boyu — analiz tarzınıza uygun planı seçin.",
    },
    pl: {
      title: "Plany cenowe · Prognozy piłkarskie AI · BetsPlug",
      description:
        "Wybierz plan BetsPlug, który Ci odpowiada — Free Access za 0 EUR, Silver dla zwykłych użytkowników, Gold z pełnym dostępem lub Poziom założycielski…",
      ogTitle: "BetsPlug Ceny · Prognozy piłkarskie AI",
      ogDescription:
        "Free Access, Silver, Gold lub Platinum Lifetime — wybierz plan dostosowany do Twojego stylu analizy.",
    },
    ro: {
      title: "Planuri de prețuri · Predicții de fotbal AI · BetsPlug",
      description:
        "Alegeți planul BetsPlug care vi se potrivește — Free Access pentru 0 EUR, Silver pentru utilizatorii ocazionali, Gold pentru acces complet sau Nivelul…",
      ogTitle: "BetsPlug Prețuri · Predicții de fotbal AI",
      ogDescription:
        "Free Access, Silver, Gold sau Platinum Lifetime — alege planul creat pentru stilul tău de analiză.",
    },
    ru: {
      title: "Тарифные планы · образовательная футбольная аналитика на базе ИИ · BetsPlug",
      description:
        "Выберите план BetsPlug, который вам подходит — Free Access за 0 евро, Silver для обычных пользователей, Gold для полного доступа или уровень основателя…",
      ogTitle: "BetsPlug Цены · футбольная аналитика на базе ИИ",
      ogDescription:
        "Free Access, Silver, Gold или пожизненный Platinum — выберите план, созданный с учётом вашего стиля анализа.",
    },
    el: {
      title: "Σχέδια τιμολόγησης · ​​Προβλέψεις ποδοσφαίρου AI · BetsPlug",
      description:
        "Επιλέξτε το πρόγραμμα BetsPlug που σας ταιριάζει — Free Access για 0 €, Silver για περιστασιακούς χρήστες, Gold για πλήρη πρόσβαση ή Platinum Lifetime…",
      ogTitle: "Τιμολόγηση BetsPlug · Προβλέψεις ποδοσφαίρου AI",
      ogDescription:
        "Free Access, Silver, Gold ή πλατινένιο Lifetime — επιλέξτε το σχέδιο που έχει σχεδιαστεί για το στυλ ανάλυσής σας.",
    },
    da: {
      title: "Prisplaner · AI-fodboldforudsigelser · BetsPlug",
      description:
        "Vælg den BetsPlug-plan, der passer til dig — Free Access for €0, Silver for casual-brugere, Gold for fuld adgang eller Platinum Lifetime-grundlægger-tier…",
      ogTitle: "BetsPlug Priser · AI fodbold forudsigelser",
      ogDescription:
        "Free Access, Silver, Gold eller platin levetid — vælg den plan, der er bygget til din analysestil.",
    },
    sv: {
      title: "Prisplaner · AI fotbollsförutsägelser · BetsPlug",
      description:
        "Välj den BetsPlug-plan som passar dig — Free Access för 0 €, Silver för tillfälliga användare, Gold för full åtkomst eller Platinum Lifetime-grundarnivå…",
      ogTitle: "BetsPlug Prissättning · AI fotbollsförutsägelser",
      ogDescription:
        "Free Access, Silver, Gold eller Platinum Lifetime — välj den plan som är byggd för din analysstil.",
    },
},

  /* ─────────────────────────── CONTACT ─────────────────────────── */
  "/contact": {
    en: {
      title: "Contact BetsPlug · Support, partnerships & press",
      description:
        "Get in touch with the BetsPlug team. Email support, partnership requests, or press enquiries — we reply within one business day.",
      ogTitle: "Contact BetsPlug",
      ogDescription:
        "Email support, partnerships, or press — we reply within one business day.",
    },
  
    nl: {
      title: "Contact BetsPlug · Ondersteuning, partnerschappen en pers",
      description:
        "Neem contact op met het BetsPlug-team. E-mailondersteuning, partnerschapsverzoeken of persvragen: wij antwoorden binnen één werkdag.",
      ogTitle: "Contact BetsPlug",
      ogDescription:
        "E-mailondersteuning, partnerschappen of pers: we antwoorden binnen één werkdag.",
    },
    de: {
      title: "Kontakt BetsPlug · Support, Partnerschaften & Presse",
      description:
        "Nehmen Sie Kontakt mit dem BetsPlug-Team auf. E-Mail-Support, Partnerschaftsanfragen oder Presseanfragen – wir antworten innerhalb eines Werktages.",
      ogTitle: "Kontakt BetsPlug",
      ogDescription:
        "E-Mail-Support, Partnerschaften oder Presse – wir antworten innerhalb eines Werktages.",
    },
    fr: {
      title: "Contact BetsPlug · Accompagnement, partenariats & presse",
      description:
        "Prenez contact avec l'équipe BetsPlug. Assistance par e-mail, demandes de partenariat ou demandes de presse : nous répondons dans un délai d'un jour…",
      ogTitle: "Contacter BetsPlug",
      ogDescription:
        "Assistance par e-mail, partenariats ou presse : nous répondons dans un délai d'un jour ouvrable.",
    },
    es: {
      title: "Contacto BetsPlug · Soporte, asociaciones y prensa",
      description:
        "Ponte en contacto con el equipo de BetsPlug. Soporte por correo electrónico, solicitudes de asociación o consultas de prensa: respondemos dentro de un día…",
      ogTitle: "Contacto BetsPlug",
      ogDescription:
        "Soporte por correo electrónico, asociaciones o prensa: respondemos dentro de un día hábil.",
    },
    it: {
      title: "Contatto BetsPlug · Supporto, partnership e stampa",
      description:
        "Entra in contatto con il team BetsPlug. Supporto via email, richieste di partnership o richieste della stampa: rispondiamo entro un giorno lavorativo.",
      ogTitle: "Contatto BetsPlug",
      ogDescription:
        "Supporto via e-mail, partnership o stampa: rispondiamo entro un giorno lavorativo.",
    },
    sw: {
      title: "Wasiliana na BetsPlug · Usaidizi, ushirikiano na vyombo vya habari",
      description:
        "Wasiliana na timu ya BetsPlug. Usaidizi wa barua pepe, maombi ya ushirikiano, au maswali ya waandishi wa habari - tunajibu ndani ya siku moja ya kazi.",
      ogTitle: "Wasiliana BetsPlug",
      ogDescription:
        "Usaidizi wa barua pepe, ushirikiano, au bonyeza - tunajibu ndani ya siku moja ya kazi.",
    },
    id: {
      title: "Hubungi BetsPlug · Dukungan, kemitraan & pers",
      description:
        "Hubungi tim BetsPlug. Dukungan email, permintaan kemitraan, atau pertanyaan pers — kami membalasnya dalam satu hari kerja.",
      ogTitle: "Hubungi BetsPlug",
      ogDescription:
        "Dukungan email, kemitraan, atau pers — kami membalas dalam satu hari kerja.",
    },

    pt: {
      title: "Contato BetsPlug · Suporte, parcerias e imprensa",
      description:
        "Entre em contato com a equipe BetsPlug. Suporte por e-mail, solicitações de parceria ou perguntas da imprensa — respondemos em um dia útil.",
      ogTitle: "Contato BetsPlug",
      ogDescription:
        "Suporte por e-mail, parcerias ou imprensa — respondemos em um dia útil.",
    },
    tr: {
      title: "İletişim BetsPlug · Destek, ortaklıklar ve basın",
      description:
        "BetsPlug ekibiyle iletişime geçin. E-posta desteği, ortaklık talepleri veya basın soruları; bir iş günü içinde yanıt veririz.",
      ogTitle: "İletişim BetsPlug",
      ogDescription:
        "E-posta desteği, ortaklıklar veya basın; bir iş günü içinde yanıt veririz.",
    },
    pl: {
      title: "Kontakt BetsPlug · Wsparcie, partnerstwo i prasa",
      description:
        "Skontaktuj się z zespołem BetsPlug. Wsparcie e-mailowe, prośby o współpracę lub zapytania prasowe — odpowiadamy w ciągu jednego dnia roboczego.",
      ogTitle: "Skontaktuj się z BetsPlug",
      ogDescription:
        "Wsparcie e-mailowe, partnerstwa lub prasa — odpowiadamy w ciągu jednego dnia roboczego.",
    },
    ro: {
      title: "Contact BetsPlug · Asistență, parteneriate și presă",
      description:
        "Luați legătura cu echipa BetsPlug. Asistență prin e-mail, solicitări de parteneriat sau întrebări de presă - răspundem în termen de o zi lucrătoare.",
      ogTitle: "Contact BetsPlug",
      ogDescription:
        "Asistență prin e-mail, parteneriate sau presă - răspundem în termen de o zi lucrătoare.",
    },
    ru: {
      title: "Контакты BetsPlug · Поддержка, партнерство и пресса",
      description:
        "Свяжитесь с командой BetsPlug. Поддержка по электронной почте, запросы на партнерство или запросы прессы — мы отвечаем в течение одного рабочего дня.",
      ogTitle: "Контакт BetsPlug",
      ogDescription:
        "Поддержка по электронной почте, партнерство или пресса — мы отвечаем в течение одного рабочего дня.",
    },
    el: {
      title: "Επικοινωνία BetsPlug · Υποστήριξη, συνεργασίες και τύπος",
      description:
        "Επικοινωνήστε με την ομάδα BetsPlug. Υποστήριξη μέσω email, αιτήματα συνεργασίας ή ερωτήσεις τύπου — απαντάμε εντός μιας εργάσιμης ημέρας.",
      ogTitle: "Επικοινωνία BetsPlug",
      ogDescription:
        "Στείλτε υποστήριξη μέσω email, συνεργασίες ή πατήστε — απαντάμε εντός μιας εργάσιμης ημέρας.",
    },
    da: {
      title: "Kontakt BetsPlug · Support, partnerskaber & presse",
      description:
        "Kom i kontakt med BetsPlug-teamet. E-mailsupport, partnerskabsanmodninger eller presseforespørgsler – vi svarer inden for en hverdag.",
      ogTitle: "Kontakt BetsPlug",
      ogDescription:
        "E-mail support, partnerskaber eller presse - vi svarer inden for en hverdag.",
    },
    sv: {
      title: "Kontakta BetsPlug · Support, partnerskap & press",
      description:
        "Ta kontakt med BetsPlug-teamet. E-postsupport, partnerskapsförfrågningar eller pressförfrågningar – vi svarar inom en arbetsdag.",
      ogTitle: "Kontakta BetsPlug",
      ogDescription:
        "E-postsupport, partnerskap eller press – vi svarar inom en arbetsdag.",
    },
},
};
