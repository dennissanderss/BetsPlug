/**
 * Homepage FAQ — single source of truth (translation-key based)
 * ────────────────────────────────────────────────────────────
 * Consumed by:
 *   1. `<FaqBlock>` in `components/ui/seo-section.tsx` — the visible
 *      categorized accordion on the public homepage.
 *   2. `<FaqJsonLd>` in `app/page.tsx` — the Schema.org FAQPage
 *      structured data Google reads for rich results. Resolved to
 *      the active locale via `getHomeFaqJsonLdItems()` below.
 *
 * Keeping both render paths on a single key set guarantees the
 * visible Q/A matches what Google indexes. Drift here is a
 * rich-snippet mismatch risk — always add/remove q+a in pairs.
 *
 * Copy lives in `src/i18n/messages.ts` under the `faq.home.*`
 * namespace (4 category labels + 12 q/a pairs). Translations for
 * non-English locales are maintained via the auto-translate hook
 * (`scripts/translate.mjs`) and hand-written Dutch in messages.ts.
 */

import { translate, type TranslationKey } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import type { FaqItem } from "@/components/seo/json-ld";

export type HomeFaqCategoryId =
  | "getting-started"
  | "predictions"
  | "pricing"
  | "data-security";

export interface HomeFaqItem {
  /** Translation key for the question, e.g. `"faq.home.q1"`. */
  questionKey: TranslationKey;
  /** Translation key for the answer, e.g. `"faq.home.a1"`. */
  answerKey: TranslationKey;
}

export interface HomeFaqCategory {
  id: HomeFaqCategoryId;
  /** Translation key for the category label. */
  labelKey: TranslationKey;
  items: HomeFaqItem[];
}

export const homeFaqCategories: HomeFaqCategory[] = [
  {
    id: "getting-started",
    labelKey: "faq.home.cat1Label",
    items: [
      { questionKey: "faq.home.q1", answerKey: "faq.home.a1" },
      { questionKey: "faq.home.q2", answerKey: "faq.home.a2" },
      { questionKey: "faq.home.q3", answerKey: "faq.home.a3" },
    ],
  },
  {
    id: "predictions",
    labelKey: "faq.home.cat2Label",
    items: [
      { questionKey: "faq.home.q4", answerKey: "faq.home.a4" },
      { questionKey: "faq.home.q5", answerKey: "faq.home.a5" },
      { questionKey: "faq.home.q6", answerKey: "faq.home.a6" },
    ],
  },
  {
    id: "pricing",
    labelKey: "faq.home.cat3Label",
    items: [
      { questionKey: "faq.home.q7", answerKey: "faq.home.a7" },
      { questionKey: "faq.home.q8", answerKey: "faq.home.a8" },
      { questionKey: "faq.home.q9", answerKey: "faq.home.a9" },
    ],
  },
  {
    id: "data-security",
    labelKey: "faq.home.cat4Label",
    items: [
      { questionKey: "faq.home.q10", answerKey: "faq.home.a10" },
      { questionKey: "faq.home.q11", answerKey: "faq.home.a11" },
      { questionKey: "faq.home.q12", answerKey: "faq.home.a12" },
    ],
  },
];

/** Flat key list — identical order — for FAQPage JSON-LD emission. */
export const homeFaqKeySet: HomeFaqItem[] = homeFaqCategories.flatMap(
  (c) => c.items,
);

/**
 * Server-side helper: resolve the flat key list into translated
 * `FaqItem[]` for the active locale, ready to feed `<FaqJsonLd>`.
 * Use from server components / `generateMetadata()` where the
 * `useTranslations()` hook is unavailable.
 */
export function getHomeFaqJsonLdItems(locale: Locale): FaqItem[] {
  return homeFaqKeySet.map(({ questionKey, answerKey }) => ({
    question: translate(locale, questionKey),
    answer: translate(locale, answerKey),
  }));
}
