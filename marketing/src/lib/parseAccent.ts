/**
 * parseAccent — turn a {{accent}}…{{/accent}} marker pair inside a heading
 * string into a <span class="text-pitch-green-500">…</span> wrapper.
 *
 * Used in hero H1's and major-section H2's to tint 1–2 strategic words
 * in the primary accent colour. Components consume the result with
 * `set:html={parseAccent(text)}` (Astro) — heading semantics stay intact
 * because the wrapper is an inline span inside the same heading element.
 *
 * Why a string token instead of structured data: keeps i18n JSON files
 * trivially translatable. Translators move the markers around words
 * naturally; no per-locale field schema change.
 *
 * Translators: place the markers around 1–2 words you want emphasised.
 * Don't escape the value — markers are processed at render time, not
 * indexed by Schema.org or by the title tag (call `stripAccent` for
 * those callers).
 */

const ACCENT_MARKER = /\{\{accent\}\}([\s\S]*?)\{\{\/accent\}\}/g;

/** Replace marker pairs with a pitch-green inline span. */
export function parseAccent(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(
    ACCENT_MARKER,
    '<span class="text-pitch-green-500">$1</span>',
  );
}

/** Strip marker syntax — for plain-text contexts (meta tags, schema.org). */
export function stripAccent(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(ACCENT_MARKER, "$1");
}
