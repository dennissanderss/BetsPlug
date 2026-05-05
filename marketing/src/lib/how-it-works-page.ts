/**
 * Loader for /how-it-works educational page content. Mirrors the
 * methodology-page loader pattern: getContent() handles locale
 * fallback + dev-mode warnings when a delta is missing.
 */
import { getContent, type Locale } from "@/lib/i18n";
import type { HowItWorksContent } from "@/content/pages/how-it-works/types";

export async function loadHowItWorksContent(
  locale: Locale,
): Promise<HowItWorksContent> {
  return await getContent<HowItWorksContent>("how-it-works", locale);
}
