/**
 * Shared locale-specific data: data-protection authorities (used in
 * /privacy contact section) and responsible-gambling helplines (used
 * in /responsible-gambling resources section).
 *
 * Authoritative per docs/specs/15-legal-pages.md. Any change here
 * needs lawyer review.
 */
import type { Locale } from "@/lib/i18n";

export interface DataProtectionAuthority {
  countryLabel: string;
  name: string;
  url?: string;
}

/** Per-locale data-protection authority shown on /privacy. */
export const dataProtectionAuthorities: Record<Locale, DataProtectionAuthority> = {
  en: {
    countryLabel: "European Union",
    name: "Your local data protection authority",
    url: "https://edpb.europa.eu/about-edpb/about-edpb/members_en",
  },
  nl: {
    countryLabel: "Nederland",
    name: "Autoriteit Persoonsgegevens",
    url: "https://autoriteitpersoonsgegevens.nl",
  },
  de: {
    countryLabel: "Deutschland",
    name: "Bundesbeauftragter für Datenschutz und die Informationsfreiheit",
    url: "https://www.bfdi.bund.de",
  },
  fr: {
    countryLabel: "France",
    name: "CNIL — Commission Nationale de l'Informatique et des Libertés",
    url: "https://www.cnil.fr",
  },
  es: {
    countryLabel: "España",
    name: "AEPD — Agencia Española de Protección de Datos",
    url: "https://www.aepd.es",
  },
  it: {
    countryLabel: "Italia",
    name: "Garante per la protezione dei dati personali",
    url: "https://www.garanteprivacy.it",
  },
  sw: {
    countryLabel: "Afrika Mashariki",
    name: "Office of the Data Protection Commissioner (Kenya / ODPC)",
    url: "https://www.odpc.go.ke",
  },
};

export interface HelplineEntry {
  name: string;
  url?: string;
  phone?: string;
  note?: string;
}

/** Per-locale responsible-gambling helplines shown on /responsible-gambling. */
export const responsibleGamblingResources: Record<Locale, HelplineEntry[]> = {
  en: [
    { name: "BeGambleAware", url: "https://www.begambleaware.org" },
    { name: "GamCare", url: "https://www.gamcare.org.uk", phone: "0808 8020 133", note: "Free helpline (UK)" },
    { name: "Gambling Therapy", url: "https://www.gamblingtherapy.org" },
  ],
  nl: [
    { name: "AGOG — anonieme hulp bij gokverslaving", url: "https://www.agog.nl" },
    { name: "Loket Kansspel", phone: "0900-2177721" },
    { name: "Trimbos-instituut", url: "https://www.trimbos.nl/onderwerpen/gokken" },
  ],
  de: [
    { name: "BZgA — Spielen mit Verantwortung", url: "https://www.spielen-mit-verantwortung.de" },
    { name: "Hotline (kostenfrei)", phone: "0800 137 27 00" },
  ],
  fr: [
    { name: "Joueurs Info Service", phone: "09 74 75 13 13", url: "https://www.joueurs-info-service.fr" },
  ],
  es: [
    { name: "FEJAR — Federación Española de Jugadores de Azar Rehabilitados", url: "https://fejar.org" },
    { name: "Línea de ayuda", phone: "900 200 225" },
  ],
  it: [
    { name: "Gioca Responsabile", url: "https://www.giocaresponsabile.it" },
    { name: "Numero Verde", phone: "800 558822" },
  ],
  sw: [
    { name: "Gambling Therapy (Kiswahili / kimataifa)", url: "https://www.gamblingtherapy.org", note: "Msaada wa bure mtandaoni kwa lugha nyingi" },
    { name: "BetsPlug — Wasiliana nasi", url: "/contact", note: "Tunaweza kukuelekeza kwa rasilimali za karibu" },
  ],
};

/** Self-exclusion programmes by locale (where applicable). */
export interface SelfExclusionProgramme {
  countryLabel: string;
  name: string;
  url: string;
}

export const selfExclusionProgrammes: SelfExclusionProgramme[] = [
  { countryLabel: "Netherlands", name: "Cruks", url: "https://www.kansspelautoriteit.nl/registratie/cruks" },
  { countryLabel: "Germany", name: "OASIS", url: "https://www.oasis-bzga.de" },
  { countryLabel: "United Kingdom", name: "GamStop", url: "https://www.gamstop.co.uk" },
];
