/**
 * Loader for /methodology long-form content. Falls back to EN when a
 * locale delta file isn't available — non-EN delta files are added
 * incrementally; the page still renders for every locale.
 */
import { getContent, type Locale } from "@/lib/i18n";
import type { MethodologyContent } from "@/content/pages/methodology/types";

export async function loadMethodologyContent(locale: Locale): Promise<MethodologyContent> {
  return await getContent<MethodologyContent>("methodology", locale);
}
