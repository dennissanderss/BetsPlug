import { getContent, type Locale } from "@/lib/i18n";
import type { FAQContent, FAQItem, FAQCategory } from "@/content/pages/faq/types";

export async function loadFaqContent(locale: Locale): Promise<FAQContent> {
  return await getContent<FAQContent>("faq", locale);
}

/**
 * No-JS server-side filter: substring match on question/answer.
 * Returns a flattened list of matching items + categories with hits.
 */
export function filterCategoriesByQuery(categories: FAQCategory[], query: string | null): FAQCategory[] {
  if (!query || query.trim().length < 2) return categories;
  const q = query.toLowerCase();
  return categories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item: FAQItem) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.questions.length > 0);
}
