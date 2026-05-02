import type { Locale } from "@/lib/i18n";
import { privacyEn } from "@/content/pages/legal/privacy.en";
import { termsEn } from "@/content/pages/legal/terms.en";
import { cookiesEn } from "@/content/pages/legal/cookies.en";
import { responsibleGamblingEn } from "@/content/pages/legal/responsible-gambling.en";
import { buildLocalizedLegalContent, type LegalSlug } from "@/content/pages/legal/_overrides";
import {
  dataProtectionAuthorities,
  responsibleGamblingResources,
  selfExclusionProgrammes,
  type DataProtectionAuthority,
  type HelplineEntry,
  type SelfExclusionProgramme,
} from "@/content/pages/legal/_resources";
import type { LegalPageContent } from "@/content/pages/legal/types";

const baseByPage: Record<LegalSlug, LegalPageContent> = {
  privacy: privacyEn,
  terms: termsEn,
  cookies: cookiesEn,
  "responsible-gambling": responsibleGamblingEn,
};

export function loadLegalContent(page: LegalSlug, locale: Locale): LegalPageContent {
  const base = baseByPage[page];
  const localized = buildLocalizedLegalContent(base, page, locale);

  // /privacy: inject the locale-aware data-protection authority into
  // the contact block so the rendered page matches the spec without
  // duplicating per-locale wiring at the page level.
  if (page === "privacy") {
    const authority = dataProtectionAuthorities[locale];
    return {
      ...localized,
      contact: { ...localized.contact, authority },
    };
  }

  return localized;
}

export function getResponsibleGamblingHelplines(locale: Locale): HelplineEntry[] {
  return responsibleGamblingResources[locale];
}

export function getSelfExclusionProgrammes(): SelfExclusionProgramme[] {
  return selfExclusionProgrammes;
}

export function getDataProtectionAuthority(locale: Locale): DataProtectionAuthority {
  return dataProtectionAuthorities[locale];
}

export type { LegalSlug };
