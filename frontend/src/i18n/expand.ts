/**
 * Locale expansion helpers for hardcoded seed data
 * ────────────────────────────────────────────────────────────
 * Seed content in `src/data/*.ts` is authored in EN + NL only
 * (the two locales we hand-write). To satisfy
 * `Record<Locale, T>` across all 16 locales, we expand each seed
 * at module-init time via EN fallback — so components that do
 * `hub.name[editorialLocale]` always resolve to a non-empty
 * value even on /ru, /el, /pt, etc.
 *
 * When Sanity content for a specific locale lands later, the
 * Sanity-fetched hub replaces the seed and the real translation
 * shows through. Until then: EN copy under a noindex header —
 * hidden from Google, visually consistent for the visitor.
 */

import { locales, type Locale } from "./config";

/**
 * Expand a partial locale record to full 16-locale coverage with
 * EN fallback. Input may contain any subset (usually just en+nl);
 * output has every `Locale` key filled, so downstream code can
 * safely do `out[anyLocale]` without an undefined guard.
 */
export function expandStringLocales<T = string>(
  partial: Partial<Record<Locale, T>> | Record<string, T>,
): Record<Locale, T> {
  const rec = partial as Record<string, T>;
  const fallback =
    rec.en ??
    rec.nl ??
    Object.values(rec).find((v): v is T => v !== undefined && v !== null) ??
    ("" as unknown as T);
  const out = {} as Record<Locale, T>;
  for (const l of locales) {
    const v = rec[l];
    out[l] = v !== undefined && v !== null ? v : fallback;
  }
  return out;
}

/**
 * Array-valued expansion — same fallback semantics but preserves
 * per-locale arrays (FAQs, content sections, body paragraphs).
 * Empty arrays fall back to the EN array so downstream code
 * iterating `hub.faqs[locale]` always has something to render.
 */
export function expandArrayLocales<T>(
  partial: Partial<Record<Locale, T[]>> | Record<string, T[]>,
): Record<Locale, T[]> {
  const rec = partial as Record<string, T[]>;
  const fallback = rec.en ?? rec.nl ?? [];
  const out = {} as Record<Locale, T[]>;
  for (const l of locales) {
    const v = rec[l];
    out[l] = Array.isArray(v) && v.length > 0 ? v : fallback;
  }
  return out;
}
