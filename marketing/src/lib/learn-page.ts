/**
 * Loader for /learn hub content + per-article content.
 */
import { getContent, type Locale } from "@/lib/i18n";
import type { LearnHubContent } from "@/content/pages/learn/types";

export async function loadLearnHubContent(locale: Locale): Promise<LearnHubContent> {
  return await getContent<LearnHubContent>("learn", locale);
}
