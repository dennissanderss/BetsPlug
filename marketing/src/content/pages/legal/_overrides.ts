/**
 * Per-locale overrides for the 4 legal pages.
 *
 * Strategy: the EN content (privacy.en.ts, terms.en.ts, etc.) is the
 * canonical source of legal prose. Non-EN locales receive only the
 * fields that MUST be localized:
 *   - H1, intro paragraph
 *   - Meta title + description (for hreflang and search snippets)
 *   - Layout labels (TOC title, "Last updated", contact heading)
 *   - Lawyer-review warning text
 *
 * Section bodies fall back to EN with the warning prominently shown
 * — flagged as `needsLawyerReview` and `needsLocaleTranslation` so the
 * legal team can prioritize per-jurisdiction review.
 */
import type { Locale } from "@/lib/i18n";
import type { LegalPageContent } from "./types";

export type LegalSlug = "privacy" | "terms" | "cookies" | "responsible-gambling";

/** Subset of LegalPageContent that locales override. */
export interface LegalLocaleOverride {
  meta: { title: string; description: string };
  hero: { h1: string; intro: string };
  labels: LegalPageContent["labels"];
}

/* ── Layout labels per locale (shared across all 4 pages) ── */

export const labelsByLocale: Record<Locale, LegalPageContent["labels"]> = {
  en: {
    tocTitle: "Table of contents",
    lastUpdatedLabel: "Last updated",
    versionLabel: "Version",
    effectiveDateLabel: "Effective",
    lawyerReviewWarning:
      "TODO: Lawyer review required before production launch. This document is a template and is not legal advice.",
    contactHeading: "Contact us",
  },
  nl: {
    tocTitle: "Inhoudsopgave",
    lastUpdatedLabel: "Laatst bijgewerkt",
    versionLabel: "Versie",
    effectiveDateLabel: "Ingangsdatum",
    lawyerReviewWarning:
      "TODO: Juridische review vereist vóór productielancering. Dit document is een template en geen juridisch advies.",
    contactHeading: "Contact",
  },
  de: {
    tocTitle: "Inhaltsverzeichnis",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    versionLabel: "Version",
    effectiveDateLabel: "Gültig ab",
    lawyerReviewWarning:
      "TODO: Anwaltliche Prüfung vor Produktionsstart erforderlich. Dieses Dokument ist eine Vorlage und keine Rechtsberatung.",
    contactHeading: "Kontakt",
  },
  fr: {
    tocTitle: "Table des matières",
    lastUpdatedLabel: "Dernière mise à jour",
    versionLabel: "Version",
    effectiveDateLabel: "En vigueur depuis",
    lawyerReviewWarning:
      "TODO: Examen juridique requis avant la mise en production. Ce document est un modèle et ne constitue pas un avis juridique.",
    contactHeading: "Contact",
  },
  es: {
    tocTitle: "Índice",
    lastUpdatedLabel: "Última actualización",
    versionLabel: "Versión",
    effectiveDateLabel: "Vigente desde",
    lawyerReviewWarning:
      "TODO: Se requiere revisión legal antes del lanzamiento a producción. Este documento es una plantilla y no constituye asesoramiento legal.",
    contactHeading: "Contacto",
  },
  it: {
    tocTitle: "Indice",
    lastUpdatedLabel: "Ultimo aggiornamento",
    versionLabel: "Versione",
    effectiveDateLabel: "In vigore dal",
    lawyerReviewWarning:
      "TODO: Revisione legale richiesta prima del lancio in produzione. Questo documento è un modello e non costituisce consulenza legale.",
    contactHeading: "Contatti",
  },
  sw: {
    tocTitle: "Yaliyomo",
    lastUpdatedLabel: "Imesasishwa mwisho",
    versionLabel: "Toleo",
    effectiveDateLabel: "Imeanza kutumika",
    lawyerReviewWarning:
      "TODO: Mapitio ya kisheria yanahitajika kabla ya uzinduzi wa uzalishaji. Hati hii ni kiolezo na si ushauri wa kisheria. Kabla ya kuchapishwa katika masoko ya Afrika Mashariki (Kenya, Tanzania, Uganda, Rwanda) lazima ipitiwe na wakili anayejua sheria za eneo hilo.",
    contactHeading: "Wasiliana nasi",
  },
};

/* ── Per-page hero + meta overrides per locale ── */

type PageOverrides = Record<Locale, Pick<LegalLocaleOverride, "meta" | "hero">>;

export const privacyOverrides: PageOverrides = {
  en: {
    meta: { title: "Privacy Policy | BetsPlug", description: "How BetsPlug collects, uses, and protects your data. GDPR-compliant, transparent, no data sold to third parties." },
    hero: { h1: "Privacy Policy", intro: "BetsPlug respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using BetsPlug, you agree to the practices described here." },
  },
  nl: {
    meta: { title: "Privacybeleid | BetsPlug", description: "Hoe BetsPlug je gegevens verzamelt, gebruikt en beschermt. AVG-conform, transparant, geen verkoop aan derden." },
    hero: { h1: "Privacybeleid", intro: "BetsPlug respecteert je privacy. Dit privacybeleid legt uit welke gegevens we verzamelen, hoe we ze gebruiken en wat je rechten zijn. Door BetsPlug te gebruiken ga je akkoord met de hier beschreven praktijken." },
  },
  de: {
    meta: { title: "Datenschutzerklärung | BetsPlug", description: "Wie BetsPlug Ihre Daten erhebt, nutzt und schützt. DSGVO-konform, transparent, kein Verkauf an Dritte." },
    hero: { h1: "Datenschutzerklärung", intro: "BetsPlug respektiert Ihre Privatsphäre. Diese Datenschutzerklärung erläutert, welche Daten wir erheben, wie wir sie nutzen und welche Rechte Sie bezüglich Ihrer Daten haben. Mit der Nutzung von BetsPlug erklären Sie sich mit den hier beschriebenen Praktiken einverstanden." },
  },
  fr: {
    meta: { title: "Politique de Confidentialité | BetsPlug", description: "Comment BetsPlug collecte, utilise et protège vos données. Conforme RGPD, transparent, aucune vente à des tiers." },
    hero: { h1: "Politique de Confidentialité", intro: "BetsPlug respecte votre vie privée. Cette politique explique quelles informations nous collectons, comment nous les utilisons, et vos droits concernant vos données. En utilisant BetsPlug, vous acceptez les pratiques décrites ici." },
  },
  es: {
    meta: { title: "Política de Privacidad | BetsPlug", description: "Cómo BetsPlug recopila, usa y protege tus datos. Conforme al RGPD, transparente, sin venta a terceros." },
    hero: { h1: "Política de Privacidad", intro: "BetsPlug respeta tu privacidad. Esta Política de Privacidad explica qué información recopilamos, cómo la usamos y tus derechos sobre tus datos. Al usar BetsPlug, aceptas las prácticas aquí descritas." },
  },
  it: {
    meta: { title: "Informativa sulla Privacy | BetsPlug", description: "Come BetsPlug raccoglie, utilizza e protegge i tuoi dati. Conforme al GDPR, trasparente, nessuna vendita a terzi." },
    hero: { h1: "Informativa sulla Privacy", intro: "BetsPlug rispetta la tua privacy. Questa Informativa sulla Privacy spiega quali informazioni raccogliamo, come le utilizziamo e i tuoi diritti relativi ai tuoi dati. Utilizzando BetsPlug, accetti le pratiche qui descritte." },
  },
  sw: {
    meta: { title: "Sera ya Faragha | BetsPlug", description: "Jinsi BetsPlug inavyokusanya, kutumia na kulinda data yako. Inakidhi GDPR, wazi, hakuna data inayouzwa kwa watu wengine." },
    hero: { h1: "Sera ya Faragha", intro: "BetsPlug inaheshimu faragha yako. Sera hii ya Faragha inaelezea taarifa zipi tunazokusanya, jinsi tunavyotumia, na haki zako kuhusu data yako. Kwa kutumia BetsPlug, unakubali kanuni zilizoelezwa hapa." },
  },
};

export const termsOverrides: PageOverrides = {
  en: {
    meta: { title: "Terms of Service | BetsPlug", description: "Terms governing your use of BetsPlug. Subscription, acceptable use, liability and disputes — written for clarity." },
    hero: { h1: "Terms of Service", intro: "These Terms of Service ('Terms') govern your access to and use of BetsPlug. By creating an account or using our service, you agree to these Terms. If you don't agree, don't use our service." },
  },
  nl: {
    meta: { title: "Algemene Voorwaarden | BetsPlug", description: "Voorwaarden die je gebruik van BetsPlug regelen. Abonnement, toegelaten gebruik, aansprakelijkheid en geschillen." },
    hero: { h1: "Algemene Voorwaarden", intro: "Deze Algemene Voorwaarden ('Voorwaarden') regelen je toegang tot en gebruik van BetsPlug. Door een account aan te maken of de service te gebruiken ga je akkoord met deze Voorwaarden. Ga je niet akkoord, gebruik onze service dan niet." },
  },
  de: {
    meta: { title: "Allgemeine Geschäftsbedingungen | BetsPlug", description: "Bedingungen für die Nutzung von BetsPlug: Abonnement, zulässige Nutzung, Haftung und Streitigkeiten." },
    hero: { h1: "Allgemeine Geschäftsbedingungen", intro: "Diese Allgemeinen Geschäftsbedingungen ('AGB') regeln Ihren Zugang zu und die Nutzung von BetsPlug. Durch das Erstellen eines Kontos oder die Nutzung unseres Dienstes stimmen Sie diesen AGB zu. Wenn Sie nicht einverstanden sind, nutzen Sie unseren Dienst nicht." },
  },
  fr: {
    meta: { title: "Conditions Générales d'Utilisation | BetsPlug", description: "Conditions régissant votre utilisation de BetsPlug. Abonnement, utilisation acceptable, responsabilité et litiges." },
    hero: { h1: "Conditions Générales d'Utilisation", intro: "Ces Conditions Générales d'Utilisation ('Conditions') régissent votre accès et votre utilisation de BetsPlug. En créant un compte ou en utilisant notre service, vous acceptez ces Conditions. Si vous n'êtes pas d'accord, n'utilisez pas notre service." },
  },
  es: {
    meta: { title: "Términos del Servicio | BetsPlug", description: "Términos que rigen tu uso de BetsPlug. Suscripción, uso aceptable, responsabilidad y disputas." },
    hero: { h1: "Términos del Servicio", intro: "Estos Términos del Servicio ('Términos') rigen tu acceso y uso de BetsPlug. Al crear una cuenta o usar nuestro servicio, aceptas estos Términos. Si no los aceptas, no uses nuestro servicio." },
  },
  it: {
    meta: { title: "Termini di Servizio | BetsPlug", description: "Termini che regolano l'uso di BetsPlug. Abbonamento, uso consentito, responsabilità e controversie." },
    hero: { h1: "Termini di Servizio", intro: "Questi Termini di Servizio ('Termini') regolano l'accesso e l'uso di BetsPlug. Creando un account o utilizzando il nostro servizio, accetti questi Termini. Se non sei d'accordo, non utilizzare il nostro servizio." },
  },
  sw: {
    meta: { title: "Masharti ya Huduma | BetsPlug", description: "Masharti yanayodhibiti matumizi yako ya BetsPlug. Kujisajili, matumizi yanayoruhusiwa, dhima na mizozo — yameandikwa kwa uwazi." },
    hero: { h1: "Masharti ya Huduma", intro: "Masharti haya ya Huduma ('Masharti') yanadhibiti ufikiaji na matumizi yako ya BetsPlug. Kwa kuunda akaunti au kutumia huduma yetu, unakubali Masharti haya. Iwapo hukubali, usitumie huduma yetu." },
  },
};

export const cookiesOverrides: PageOverrides = {
  en: {
    meta: { title: "Cookie Policy | BetsPlug", description: "What cookies BetsPlug uses, why, and how to manage your preferences. Essential cookies only by default." },
    hero: { h1: "Cookie Policy", intro: "Cookies are small text files stored on your device when you visit websites. This policy explains which cookies BetsPlug uses, why we use them, and how you can manage your preferences." },
  },
  nl: {
    meta: { title: "Cookiebeleid | BetsPlug", description: "Welke cookies BetsPlug gebruikt, waarom, en hoe je je voorkeuren beheert. Standaard alleen essentiële cookies." },
    hero: { h1: "Cookiebeleid", intro: "Cookies zijn kleine tekstbestanden die op je apparaat worden opgeslagen wanneer je websites bezoekt. Dit beleid legt uit welke cookies BetsPlug gebruikt, waarom, en hoe je je voorkeuren beheert." },
  },
  de: {
    meta: { title: "Cookie-Richtlinie | BetsPlug", description: "Welche Cookies BetsPlug verwendet, warum, und wie Sie Ihre Einstellungen verwalten. Standardmäßig nur essentielle Cookies." },
    hero: { h1: "Cookie-Richtlinie", intro: "Cookies sind kleine Textdateien, die beim Besuch von Websites auf Ihrem Gerät gespeichert werden. Diese Richtlinie erläutert, welche Cookies BetsPlug verwendet, warum wir sie verwenden und wie Sie Ihre Einstellungen verwalten können." },
  },
  fr: {
    meta: { title: "Politique de Cookies | BetsPlug", description: "Les cookies que BetsPlug utilise, pourquoi, et comment gérer vos préférences. Cookies essentiels uniquement par défaut." },
    hero: { h1: "Politique de Cookies", intro: "Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez des sites web. Cette politique explique quels cookies BetsPlug utilise, pourquoi nous les utilisons et comment vous pouvez gérer vos préférences." },
  },
  es: {
    meta: { title: "Política de Cookies | BetsPlug", description: "Qué cookies usa BetsPlug, por qué, y cómo gestionar tus preferencias. Solo cookies esenciales por defecto." },
    hero: { h1: "Política de Cookies", intro: "Las cookies son pequeños archivos de texto almacenados en tu dispositivo cuando visitas sitios web. Esta política explica qué cookies usa BetsPlug, por qué las usamos, y cómo puedes gestionar tus preferencias." },
  },
  it: {
    meta: { title: "Politica sui Cookie | BetsPlug", description: "Quali cookie utilizza BetsPlug, perché, e come gestire le tue preferenze. Solo cookie essenziali di default." },
    hero: { h1: "Politica sui Cookie", intro: "I cookie sono piccoli file di testo memorizzati sul tuo dispositivo quando visiti i siti web. Questa politica spiega quali cookie utilizza BetsPlug, perché li utilizziamo e come puoi gestire le tue preferenze." },
  },
  sw: {
    meta: { title: "Sera ya Vidakuzi | BetsPlug", description: "Vidakuzi vipi BetsPlug inatumia, kwa nini, na jinsi ya kudhibiti mapendeleo yako. Vidakuzi vya msingi pekee kwa kawaida." },
    hero: { h1: "Sera ya Vidakuzi", intro: "Vidakuzi ni faili ndogo za maandishi zinazohifadhiwa kwenye kifaa chako unapotembelea tovuti. Sera hii inaelezea vidakuzi vipi BetsPlug inatumia, kwa nini tunavitumia, na jinsi unavyoweza kudhibiti mapendeleo yako." },
  },
};

export const responsibleGamblingOverrides: PageOverrides = {
  en: {
    meta: { title: "Responsible Gambling | BetsPlug", description: "BetsPlug supports responsible gambling. Recognise problem gambling, find help and self-exclusion options, and protect family and friends." },
    hero: { h1: "Responsible Gambling", intro: "BetsPlug provides statistical analysis of football matches. We don't operate as a bookmaker or facilitate gambling. However, we recognise that some users may use our predictions in conjunction with gambling activities. This page covers responsible gambling principles and resources." },
  },
  nl: {
    meta: { title: "Verantwoord Gokken | BetsPlug", description: "BetsPlug ondersteunt verantwoord gokken. Herken probleemgedrag, vind hulp en zelfuitsluitingsopties, en bescherm familie en vrienden." },
    hero: { h1: "Verantwoord Gokken", intro: "BetsPlug levert statistische analyses van voetbalwedstrijden. Wij opereren niet als bookmaker en faciliteren geen gokken. We erkennen wel dat sommige gebruikers onze voorspellingen mogelijk gebruiken in combinatie met gokactiviteiten. Deze pagina behandelt principes en hulpbronnen voor verantwoord gokken." },
  },
  de: {
    meta: { title: "Verantwortungsvolles Spielen | BetsPlug", description: "BetsPlug unterstützt verantwortungsvolles Spielen. Problematisches Spielverhalten erkennen, Hilfe und Selbstausschluss finden, Familie und Freunde schützen." },
    hero: { h1: "Verantwortungsvolles Spielen", intro: "BetsPlug bietet statistische Analysen von Fußballspielen. Wir sind kein Buchmacher und vermitteln kein Glücksspiel. Wir erkennen jedoch an, dass manche Nutzer unsere Vorhersagen in Verbindung mit Glücksspielaktivitäten verwenden. Diese Seite behandelt Prinzipien und Ressourcen für verantwortungsvolles Spielen." },
  },
  fr: {
    meta: { title: "Jeu Responsable | BetsPlug", description: "BetsPlug soutient le jeu responsable. Reconnaître le jeu problématique, trouver de l'aide et des options d'auto-exclusion, et protéger sa famille et ses amis." },
    hero: { h1: "Jeu Responsable", intro: "BetsPlug fournit une analyse statistique des matchs de football. Nous n'opérons pas en tant que bookmaker et ne facilitons pas le jeu. Cependant, nous reconnaissons que certains utilisateurs peuvent utiliser nos pronostics en lien avec des activités de jeu. Cette page couvre les principes et ressources pour un jeu responsable." },
  },
  es: {
    meta: { title: "Juego Responsable | BetsPlug", description: "BetsPlug apoya el juego responsable. Reconoce el juego problemático, encuentra ayuda y opciones de autoexclusión, y protege a familiares y amigos." },
    hero: { h1: "Juego Responsable", intro: "BetsPlug ofrece análisis estadístico de partidos de fútbol. No operamos como casa de apuestas ni facilitamos el juego. Sin embargo, reconocemos que algunos usuarios pueden usar nuestros pronósticos junto con actividades de juego. Esta página cubre los principios y recursos para el juego responsable." },
  },
  it: {
    meta: { title: "Gioco Responsabile | BetsPlug", description: "BetsPlug supporta il gioco responsabile. Riconosci il gioco problematico, trova aiuto e opzioni di autoesclusione, e proteggi familiari e amici." },
    hero: { h1: "Gioco Responsabile", intro: "BetsPlug fornisce analisi statistiche di partite di calcio. Non operiamo come bookmaker né facilitiamo il gioco d'azzardo. Riconosciamo tuttavia che alcuni utenti possono utilizzare i nostri pronostici in connessione con attività di gioco. Questa pagina copre principi e risorse per il gioco responsabile." },
  },
  sw: {
    meta: { title: "Mchezo Wenye Busara | BetsPlug", description: "BetsPlug inaunga mkono mchezo wenye busara. Tambua tatizo la kamari, pata msaada na njia za kujizuia, na linda familia na marafiki." },
    hero: { h1: "Mchezo Wenye Busara", intro: "BetsPlug inatoa uchambuzi wa takwimu wa mechi za mpira wa miguu. Sisi si bookmaker na hatuwezeshi kamari. Hata hivyo, tunatambua kwamba baadhi ya watumiaji wanaweza kutumia utabiri wetu pamoja na shughuli za kamari. Ukurasa huu unahusu kanuni na rasilimali za mchezo wenye busara." },
  },
};

/* ── Single helper used by the loader ── */

export function buildLocalizedLegalContent(
  base: LegalPageContent,
  page: LegalSlug,
  locale: Locale,
): LegalPageContent {
  const labels = labelsByLocale[locale];
  const overrides =
    page === "privacy" ? privacyOverrides[locale] :
    page === "terms" ? termsOverrides[locale] :
    page === "cookies" ? cookiesOverrides[locale] :
    responsibleGamblingOverrides[locale];

  return {
    ...base,
    _meta: {
      ...base._meta,
      translationStatus: locale === "en" ? "source" : "ai-generated",
      needsReview: locale !== "en",
    },
    meta: { ...base.meta, ...overrides.meta },
    hero: overrides.hero,
    labels,
  };
}
