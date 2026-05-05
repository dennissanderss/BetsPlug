/**
 * Loader for the standalone /how-it-works page. Mirrors the
 * methodology-page loader pattern.
 */
import { getContent, type Locale } from "@/lib/i18n";
import type { HowItWorksContent } from "@/content/pages/how-it-works/types";

export async function loadHowItWorksContent(locale: Locale): Promise<HowItWorksContent> {
  return await getContent<HowItWorksContent>("how-it-works", locale);
}
