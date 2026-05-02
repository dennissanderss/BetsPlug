import { getContent, type Locale } from "@/lib/i18n";
import type { BetTypesContent } from "@/content/pages/bet-types/types";

export async function loadBetTypesContent(locale: Locale): Promise<BetTypesContent> {
  return await getContent<BetTypesContent>("bet-types", locale);
}
