import { getContent, type Locale } from "@/lib/i18n";
import type { TelegramContent } from "@/content/pages/telegram/types";

export async function loadTelegramContent(locale: Locale): Promise<TelegramContent> {
  return await getContent<TelegramContent>("telegram", locale);
}
