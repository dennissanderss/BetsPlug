/**
 * Message interpolation helper
 * ────────────────────────────────────────────────────────────
 * Replaces `{name}` placeholders in a translated string with
 * values from a `vars` map. Unknown placeholders are preserved
 * verbatim (visible in dev, a signal that a var wasn't passed).
 *
 *   formatMsg("Hi {name}, you have {n} picks",
 *             { name: "Dennis", n: 3 })
 *   // → "Hi Dennis, you have 3 picks"
 *
 * The regex matches `\w+` (letters, digits, underscore) inside
 * curly braces — no nesting, no escaping. Keep placeholder names
 * in this simple shape so Google Translate leaves them alone when
 * the translate script runs over the strings.
 *
 * Canonical placeholder names used in this codebase:
 *   - {potdAccuracy}  - Pick-of-the-Day win rate (locale-formatted)
 *   - {potdPicks}     - POTD total picks count (locale-formatted)
 */

export type MessageVars = Record<string, string | number>;

export function formatMsg(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = vars[key];
    return v != null ? String(v) : match;
  });
}
