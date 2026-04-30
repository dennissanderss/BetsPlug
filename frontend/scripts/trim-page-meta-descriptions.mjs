#!/usr/bin/env node
/**
 * Trim PAGE_META descriptions that exceed 155 chars to the last
 * sentence boundary (or, failing that, the last word boundary)
 * before the cut. EN + NL are NEVER touched — those are the
 * source-of-truth locales and were hand-authored within range.
 *
 * Why 155 instead of 160? Google occasionally re-wraps to 920px
 * and that maps to ~155 chars in most languages. 155 keeps every
 * description fully visible in SERPs without truncation ellipses.
 *
 * Usage:
 *   node scripts/trim-page-meta-descriptions.mjs            # dry-run, prints diff
 *   node scripts/trim-page-meta-descriptions.mjs --write    # apply changes
 */
import fs from "node:fs";

const FILE = "src/data/page-meta.ts";
const SOURCE_LOCALES = new Set(["en", "nl"]); // never touched
const TARGET_LEN = 155;

function trimDesc(s) {
  if (s.length <= TARGET_LEN) return s;
  const cut = s.slice(0, TARGET_LEN);
  // Prefer last sentence boundary (".", "!", "?", "。") within window.
  const sentenceMatch = cut.match(/[\s\S]*[.!?。](?=\s|$)/);
  if (sentenceMatch && sentenceMatch[0].length >= TARGET_LEN * 0.6) {
    return sentenceMatch[0].trimEnd();
  }
  // Else fall back to last word boundary.
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > TARGET_LEN * 0.5) {
    return cut.slice(0, lastSpace).trimEnd().replace(/[,;:]+$/, "") + "…";
  }
  // Last resort: hard cut + ellipsis.
  return cut.trimEnd() + "…";
}

const src = fs.readFileSync(FILE, "utf8");

// Find each "/route": { ... } block and within each, find each
// locale: { ... description: "..." } pair.
const out = src.replace(
  /(\b(?:en|nl|de|fr|es|it|sw|id|pt|tr|pl|ro|ru|el|da|sv): \{[\s\S]*?\})/g,
  (block) => {
    const localeMatch = block.match(/^([a-z]+):/);
    if (!localeMatch) return block;
    const locale = localeMatch[1];
    if (SOURCE_LOCALES.has(locale)) return block;

    return block.replace(
      /(description:\s*")((?:[^"\\]|\\.)+)(")/g,
      (m, prefix, value, suffix) => {
        const decoded = value
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
        if (decoded.length <= TARGET_LEN) return m;
        const trimmed = trimDesc(decoded);
        const encoded = trimmed
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
        return prefix + encoded + suffix;
      },
    );
  },
);

const beforeLen = src.length;
const afterLen = out.length;
const diff = beforeLen - afterLen;

if (process.argv.includes("--write")) {
  fs.writeFileSync(FILE, out);
  console.log(`✓ Wrote ${FILE} — saved ${diff} chars across PAGE_META.`);
} else {
  console.log(`Dry-run: would save ${diff} chars in ${FILE}.`);
  console.log("Pass --write to apply.");
}
