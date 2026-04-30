#!/usr/bin/env node
/**
 * Audit user-facing copy for gambling-positioning words that
 * undermine BetsPlug's "educational analytics" stance. The
 * positioning matters for:
 *   - Google Ads compliance (gambling-vertical content has stricter
 *     rules; analytics-vertical content does not)
 *   - App Store / Play Store reviews
 *   - E-E-A-T (educational sites rank for informational queries)
 *
 * Per-locale stopword lists. Each entry is a pattern that, when
 * found in JSX text or string-literal props, suggests the copy
 * leans gambling-promotional rather than analytics-educational.
 *
 * NOT every hit is a bug — context matters. Compliance disclaimers
 * legitimately use "gambling" and "wagering"; bookmaker references
 * legitimately compare against bookmaker odds. The audit produces
 * a per-file report; a human reviews and accepts or rewrites.
 *
 * Usage:
 *   node scripts/audit-gambling-language.mjs              # full sweep
 *   node scripts/audit-gambling-language.mjs --diff-only  # PR mode
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..");
const SRC = path.join(ROOT, "src");

// Per-locale words that mark gambling-promotional copy.
// Verbs that are unambiguous; nouns that suggest gambling-as-product
// rather than analytics-as-product. Tuned so legitimate disclaimer
// or compare-to-bookmaker copy does NOT trigger.
const STOPWORDS = {
  en: [
    "gamble", "gambler", "gamblers", "gambling site", "gambling app",
    "wager", "wagering", "place a bet", "place bets", "win money",
    "win cash", "casino", "slots", "poker chip",
  ],
  nl: [
    "gokken", "gokker", "gokkers", "goksite", "gokapp",
    "wedinzet", "weddenschap inzetten", "geld winnen", "casino",
  ],
  de: [
    "glücksspiel", "glücksspielanbieter", "wette platzieren",
    "geld gewinnen", "casino", "wettanbieter",
  ],
  fr: [
    "jeu d'argent", "jeux de hasard", "site de paris",
    "gagner de l'argent", "casino", "miser de l'argent",
  ],
  es: [
    "juegos de azar", "casa de apuestas", "ganar dinero",
    "casino", "sitio de apuestas",
  ],
  it: [
    "gioco d'azzardo", "sito di scommesse", "vincere soldi",
    "casinò", "scommesse online",
  ],
};

function escape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function compile(words) {
  return words.map((w) => ({
    word: w,
    rx: new RegExp(`(?:^|[^\\p{L}])${escape(w)}(?:$|[^\\p{L}])`, "iu"),
  }));
}

const triggers = Object.fromEntries(
  Object.entries(STOPWORDS).map(([loc, words]) => [loc, compile(words)]),
);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // Don't audit the audit script itself, the dictionary, or admin.
    if (entry.name === "node_modules" || entry.name === "i18n") continue;
    if (full.includes("/admin/")) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function checkFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  // Strip comments and import lines so disclaimer-comment hits don't fire.
  let stripped = raw
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`/])\/\/[^\n]*/g, "$1")
    .replace(/^\s*import\b[^\n]*\n/gm, "\n");

  const hits = [];
  for (const [loc, list] of Object.entries(triggers)) {
    for (const { word, rx } of list) {
      if (rx.test(stripped)) {
        const idx = raw.search(rx);
        const lineNum = raw.slice(0, Math.max(0, idx)).split("\n").length;
        hits.push({ file: path.relative(ROOT, file), line: lineNum, locale: loc, word });
      }
    }
  }
  return hits;
}

const files = walk(SRC);
const allHits = files.flatMap(checkFile);

console.log(`Audited ${files.length} files for gambling-positioning words.`);
console.log(`Found ${allHits.length} potential hits.\n`);

const byFile = {};
for (const h of allHits) {
  byFile[h.file] = byFile[h.file] || [];
  byFile[h.file].push(h);
}
for (const [file, hs] of Object.entries(byFile)) {
  console.log(`  ${file}`);
  for (const h of hs) {
    console.log(`    L${h.line} [${h.locale.toUpperCase()}] "${h.word}"`);
  }
}

console.log(`\nReview each hit:`);
console.log(`  - Compliance disclaimer / regulatory text → keep`);
console.log(`  - "Compare against bookmaker odds" / methodology → keep`);
console.log(`  - Marketing CTA encouraging gambling → rewrite to analytics positioning`);
