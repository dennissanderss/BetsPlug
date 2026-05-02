import { getContent, type Locale } from "@/lib/i18n";
import type { FreeVsPaidContent } from "@/content/pages/free-vs-paid/types";

export async function loadFreeVsPaidContent(locale: Locale): Promise<FreeVsPaidContent> {
  return await getContent<FreeVsPaidContent>("free-vs-paid", locale);
}
