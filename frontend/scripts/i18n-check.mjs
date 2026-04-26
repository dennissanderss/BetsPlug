#!/usr/bin/env node
/**
 * i18n:check — combined CI gate
 * ────────────────────────────────────────────────────────────
 * Runs three checks and exits 1 if any fails:
 *   1. ENABLED_LOCALES coverage   — every EN key must exist in
 *      every enabled locale (en/nl/de/fr/es/it).
 *   2. Language-detection sanity  — value's detected language
 *      must match its locale file (franc-min, minLength: 80,
 *      with brand whitelist).
 *   3. Hardcoded JSX strings      — no `>Capitalized phrase<` in
 *      .tsx/.jsx outside legal pages, admin, dev/, sanity/.
 *
 * Designed to be fast (<3s on this codebase) so it can run
 * pre-commit and on every PR.
 *
 * Run: node scripts/i18n-check.mjs
 *      node scripts/i18n-check.mjs --no-detect   (skip step 2)
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { franc } from "franc-min";

const SRC = join(import.meta.dirname, "..", "src");
const I18N = join(SRC, "i18n");
const LOCALES_DIR = join(I18N, "locales");
const MESSAGES = join(I18N, "messages.ts");

// Locales that MUST be at parity with EN. Mirrors ENABLED_LOCALES
// in src/i18n/config.ts.
const ENABLED = ["en", "nl", "de", "fr", "es", "it"];

const EXPECTED_LANG = {
  en: "eng", nl: "nld", de: "deu", fr: "fra", es: "spa", it: "ita",
  sw: "swa", id: "ind", pt: "por", tr: "tur", pl: "pol", ro: "ron",
  ru: "rus", el: "ell", da: "dan", sv: "swe",
};

const MIN_DETECT_LEN = 80;
const flags = process.argv.slice(2);
const skipDetect = flags.includes("--no-detect");

let errors = 0;
const errorList = [];
function err(msg) { errors++; errorList.push(msg); }

// ─── Parser (re-used from i18n-forensics.mjs) ───────────────────
function parseTSDict(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start < 0) return null;
  const end = endMarker
    ? content.indexOf(endMarker, start + startMarker.length)
    : content.length;
  const block = content.slice(start, end);
  const out = {};
  const reTwoLine = /^\s*"([^"]+)":\s*\n\s*"((?:[^"\\]|\\.)*)"\s*,?$/gm;
  const reOneLine = /^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)"\s*,?$/gm;
  const reBack = /^\s*"([^"]+)":\s*`((?:[^`\\]|\\.)*)`\s*,?$/gm;
  let m;
  while ((m = reTwoLine.exec(block)) !== null) out[m[1]] = m[2];
  while ((m = reOneLine.exec(block)) !== null) if (!(m[1] in out)) out[m[1]] = m[2];
  while ((m = reBack.exec(block)) !== null) if (!(m[1] in out)) out[m[1]] = m[2];
  return out;
}

const messagesContent = readFileSync(MESSAGES, "utf-8");
const en = parseTSDict(messagesContent, "const en = {", "} as const;");
const nl = parseTSDict(messagesContent, "const nl: Dictionary = {", "};\n\n\n/* ── Locale dictionaries");
const dicts = { en, nl };
for (const loc of ["de", "fr", "es", "it", "sw", "id", "pt", "tr", "pl", "ro", "ru", "el", "da", "sv"]) {
  const c = readFileSync(join(LOCALES_DIR, `${loc}.ts`), "utf-8");
  dicts[loc] = parseTSDict(c, `const ${loc} = {`, "} as Partial");
}

// ─── 1. Coverage check for ENABLED_LOCALES ──────────────────────
const enKeys = Object.keys(en);
console.log(`\n[i18n:check] EN baseline: ${enKeys.length} keys`);
console.log(`[i18n:check] Checking coverage for ENABLED_LOCALES (${ENABLED.length}): ${ENABLED.join(", ")}\n`);

for (const loc of ENABLED) {
  if (loc === "en") continue;
  const d = dicts[loc] || {};
  const missing = enKeys.filter((k) => !(k in d));
  if (missing.length > 0) {
    err(`[coverage] ${loc}: missing ${missing.length} key(s)`);
    missing.slice(0, 8).forEach((k) => console.error(`  ${loc}.ts missing: ${k}`));
    if (missing.length > 8) console.error(`  ... and ${missing.length - 8} more`);
  } else {
    console.log(`  ✓ ${loc}: 100% (${Object.keys(d).length} keys)`);
  }
}

// ─── 2. Language-detection sanity (skippable) ───────────────────
if (!skipDetect) {
  console.log(`\n[i18n:check] Language-detection sanity (minLength=${MIN_DETECT_LEN})...`);
  // Only check ENABLED_LOCALES — parked locales are noindex/hidden
  // and scrutinizing them just adds noise.
  for (const loc of ENABLED) {
    const expected = EXPECTED_LANG[loc];
    if (!expected) continue;
    const d = dicts[loc] || {};
    let mismatchCount = 0;
    for (const [k, v] of Object.entries(d)) {
      if (typeof v !== "string") continue;
      // Strip placeholders and HTML so franc gets pure prose.
      const cleaned = v
        .replace(/\{[^}]+\}/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length < MIN_DETECT_LEN) continue;
      const detected = franc(cleaned, { minLength: MIN_DETECT_LEN });
      if (detected !== "und" && detected !== expected) {
        mismatchCount++;
        if (mismatchCount <= 5) {
          err(`[lang-detect] ${loc}.ts key '${k}' detected as '${detected}' (expected '${expected}'): ${v.slice(0, 60)}…`);
        }
      }
    }
    if (mismatchCount > 5) {
      console.error(`  ${loc}: ${mismatchCount - 5} more mismatches not shown`);
    }
    if (mismatchCount === 0) console.log(`  ✓ ${loc}: no mismatches`);
  }
}

// ─── 3. Hardcoded JSX text scan ─────────────────────────────────
console.log(`\n[i18n:check] Hardcoded JSX scan...`);

// Skip rules — these surfaces are out of scope (admin = internal,
// legal = by-design EN-only, dev/ = development-only).
const SKIP_PATHS = [
  /\/admin\//,
  /\/\(app\)\/admin/,
  /\/i18n\//,
  /\/sanity\//,
  /\/types\//,
  /\.test\.tsx?$/,
  /\.d\.ts$/,
  /\/dev\//,
  /\/app\/privacy\//,
  /\/app\/terms\//,
  /\/app\/cookies\//,
  /\/app\/responsible-gambling\//,
];

// Baseline whitelist: known existing hardcoded strings (technical
// debt). New violations get blocked; existing ones are deferred to
// a follow-up sprint. Read from .i18nignore at scan time so the
// list lives outside the script.
function loadIgnoreList() {
  const path = join(SRC, "..", ".i18nignore");
  try {
    return readFileSync(path, "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  } catch { return []; }
}
const IGNORE = loadIgnoreList();
function isIgnored(file, line) {
  const rel = file.replace(SRC, "src");
  for (const pattern of IGNORE) {
    // Two forms: "path:line" exact OR "path/" prefix (whole dir).
    if (pattern.includes(":")) {
      if (`${rel}:${line}` === pattern) return true;
    } else if (pattern.endsWith("/")) {
      if (rel.startsWith(pattern)) return true;
    } else {
      if (rel === pattern) return true;
    }
  }
  return false;
}

// Brand passthrough whitelist (case-sensitive substring match).
const BRAND = new Set([
  "BetsPlug", "Pulse", "BTTS", "ROI", "xG", "Elo", "Poisson", "XGBoost",
  "Free", "Silver", "Gold", "Platinum", "Bronze", "Free Access",
  "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie",
  "Champions League", "Europa League", "Conference League",
  "Stripe", "Apple", "Google", "Telegram", "Mastercard", "American Express",
  "Apple Pay", "Pick of the Day", "Bet of the Day",
  "Schalke", "Bayern", "Real Madrid", "Barcelona", "Manchester", "Chelsea",
  "Liverpool", "Arsenal", "PSV", "Ajax", "Feyenoord",
  "Elo ratings", "Poisson goal models",  // technical jargon
  "Accuracy Pro Engine v2",  // brand/product name
]);

const TAG_RX = />\s*([A-Z][a-zA-Z][a-zA-Z\s,!?:.'\-/%()0-9]{6,80})\s*</g;
const HAS_TRANSLATE_RX = /\b(t|translate|i18n|trans|FormattedMessage|Trans)\b\s*\(/;
const SVG_RX = /<(svg|path|circle|rect|g|defs|stop|linearGradient|radialGradient|use|symbol|line|polygon|polyline|ellipse|text)\b/;

function listSrcFiles() {
  const out = execSync(
    `find ${SRC} -type f \\( -name "*.tsx" -o -name "*.jsx" \\)`,
    { encoding: "utf-8" }
  ).split("\n").filter(Boolean);
  return out.filter((f) => !SKIP_PATHS.some((rx) => rx.test(f)));
}

const files = listSrcFiles();
let hardcodedHits = 0;
const hardcodedSamples = [];

for (const f of files) {
  const content = readFileSync(f, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SVG_RX.test(line)) continue;
    TAG_RX.lastIndex = 0;
    let m;
    while ((m = TAG_RX.exec(line)) !== null) {
      const phrase = m[1].trim();
      if (BRAND.has(phrase)) continue;
      if (!/[a-zA-Z]/.test(phrase)) continue;
      // Has t() within +/- 3 lines? Skip — likely already wrapped.
      const ctx = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join("\n");
      if (HAS_TRANSLATE_RX.test(ctx) && HAS_TRANSLATE_RX.test(line)) continue;
      // Whitelisted technical debt? Skip.
      if (isIgnored(f, i + 1)) continue;
      hardcodedHits++;
      if (hardcodedSamples.length < 12) {
        hardcodedSamples.push(`${f.replace(SRC, "src")}:${i + 1}  "${phrase.slice(0, 60)}"`);
      }
    }
  }
}

if (hardcodedHits > 0) {
  err(`[hardcoded] Found ${hardcodedHits} potentially hardcoded UI strings (samples below)`);
  hardcodedSamples.forEach((s) => console.error(`  ${s}`));
  if (hardcodedHits > 12) console.error(`  ... and ${hardcodedHits - 12} more`);
} else {
  console.log(`  ✓ no new hardcoded strings`);
}

// ─── Summary ────────────────────────────────────────────────────
console.log("\n──────────────────────────────────────────");
if (errors > 0) {
  console.error(`[i18n:check] FAILED — ${errors} category(ies) with errors`);
  errorList.forEach((e) => console.error(`  • ${e}`));
  process.exit(1);
} else {
  console.log(`[i18n:check] ✓ all checks passed`);
}
