#!/usr/bin/env node
// Translation forensics for the betsplug.com TS-based i18n.
// Parses the EN + NL inline blocks from messages.ts plus all 14 aux locale .ts
// files, then runs:
//   - Coverage matrix (total / present / missing / empty / identical-to-EN)
//   - Language detection per value via franc-min
//   - Orphan-keys (in locale but not in EN)
//
// Run: node i18n-audit/scripts/forensics.mjs
//
// Output: writes /tmp/i18n-forensics.json with raw data, prints a summary.

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { franc } from "franc-min";

const ROOT = "/Users/casmeisters/Documents/Claude/Sportsbetting/sportbettool/frontend/src/i18n";
const MESSAGES = join(ROOT, "messages.ts");
const LOCALES_DIR = join(ROOT, "locales");

const EXPECTED_LANG = {
  en: "eng",
  nl: "nld",
  de: "deu",
  fr: "fra",
  es: "spa",
  it: "ita",
  sw: "swa",
  id: "ind",
  pt: "por",
  tr: "tur",
  pl: "pol",
  ro: "ron",
  ru: "rus",
  el: "ell",
  da: "dan",
  sv: "swe",
};

const MIN_LENGTH = 18;

// ─── Parser ─────────────────────────────────────────────────────────────
// Matches:   "key.path": "value with \"escapes\"",
// Multiline values get joined by the simple regex below — for the bulk of
// messages.ts the values are single-line, which is good enough.
function parseTSDict(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start < 0) return null;
  const end = endMarker
    ? content.indexOf(endMarker, start + startMarker.length)
    : content.length;
  const block = content.slice(start, end);
  const out = {};
  // Two-line form: "key":\n    "value"
  const reTwoLine = /^\s*"([^"]+)":\s*\n\s*"((?:[^"\\]|\\.)*)"\s*,?$/gm;
  let m;
  while ((m = reTwoLine.exec(block)) !== null) {
    out[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  // Single-line form: "key": "value",
  const reOneLine = /^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)"\s*,?$/gm;
  while ((m = reOneLine.exec(block)) !== null) {
    if (!(m[1] in out)) {
      out[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  // Backtick template form: "key": `...`,
  const reBacktick = /^\s*"([^"]+)":\s*`((?:[^`\\]|\\.)*)`\s*,?$/gm;
  while ((m = reBacktick.exec(block)) !== null) {
    if (!(m[1] in out)) {
      out[m[1]] = m[2];
    }
  }
  return out;
}

// ─── Brand-passthrough whitelist ────────────────────────────────────────
const BRAND_WHITELIST = new Set([
  "BetsPlug", "Pulse", "BTTS", "ROI", "xG", "Elo", "Poisson", "XGBoost",
  "Ensemble", "Live", "Reports", "Stripe", "Apple", "Google", "Telegram",
  "Free", "Silver", "Gold", "Platinum", "Bronze", "Free Access",
  "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie",
  "Champions League", "Europa League", "Conference League",
]);

function isBrandPassthrough(v) {
  if (!v || v.length < 2) return true;
  if (BRAND_WHITELIST.has(v)) return true;
  // Pure numbers / punctuation
  if (!/[a-zA-Zа-яёΑ-ωа-я]/.test(v)) return true;
  return false;
}

// ─── Load EN + NL from messages.ts ──────────────────────────────────────
const messagesContent = readFileSync(MESSAGES, "utf-8");
const en = parseTSDict(messagesContent, "const en = {", "} as const;");
const nl = parseTSDict(
  messagesContent,
  "const nl: Dictionary = {",
  "};\n\n\n/* ── Locale dictionaries"
);

if (!en || !nl) {
  console.error("Failed to parse en or nl block from messages.ts");
  process.exit(1);
}

// ─── Load aux locales ───────────────────────────────────────────────────
const auxLocales = ["de", "fr", "es", "it", "sw", "id", "pt", "tr", "pl", "ro", "ru", "el", "da", "sv"];
const dicts = { en, nl };
for (const loc of auxLocales) {
  const path = join(LOCALES_DIR, `${loc}.ts`);
  const content = readFileSync(path, "utf-8");
  // Aux locale files start with `const <loc> = {` and end with `};`
  const startMarker = `const ${loc} = {`;
  const dict = parseTSDict(content, startMarker, "} as const");
  // Some files use `}` not `} as const`
  if (!dict || Object.keys(dict).length === 0) {
    const fallback = parseTSDict(content, startMarker);
    dicts[loc] = fallback || {};
  } else {
    dicts[loc] = dict;
  }
}

// ─── Coverage matrix ────────────────────────────────────────────────────
const enKeys = Object.keys(en);
const enKeySet = new Set(enKeys);
const totals = enKeys.length;

console.log("\n════ COVERAGE MATRIX ════");
console.log(`EN baseline: ${totals} keys\n`);
console.log(
  "Locale | present | missing | empty | identical-EN | orphan | unique"
);
console.log("-------|---------|---------|-------|--------------|--------|-------");

const coverage = {};
for (const loc of ["nl", ...auxLocales]) {
  const d = dicts[loc];
  const dKeys = Object.keys(d);
  let missing = 0,
    empty = 0,
    identical = 0,
    unique = 0;
  for (const k of enKeys) {
    if (!(k in d)) {
      missing++;
      continue;
    }
    const v = d[k];
    if (v === "" || v === null || v === undefined) {
      empty++;
      continue;
    }
    if (v === en[k] && !isBrandPassthrough(v)) {
      identical++;
    } else {
      unique++;
    }
  }
  const orphans = dKeys.filter((k) => !enKeySet.has(k));
  coverage[loc] = {
    present: dKeys.length,
    missing,
    empty,
    identical,
    orphan: orphans.length,
    unique,
    orphanKeys: orphans,
  };
  console.log(
    `${loc.padEnd(6)} | ${String(dKeys.length).padStart(7)} | ${String(missing).padStart(7)} | ${String(empty).padStart(5)} | ${String(identical).padStart(12)} | ${String(orphans.length).padStart(6)} | ${String(unique).padStart(6)}`
  );
}

// ─── Language detection ─────────────────────────────────────────────────
console.log("\n\n════ LANGUAGE-DETECTION MISMATCHES ════");
console.log("(value's detected language ≠ filename language; may indicate misplaced strings)");

const mismatches = {};
for (const loc of ["en", "nl", ...auxLocales]) {
  const expected = EXPECTED_LANG[loc];
  if (!expected) continue;
  const d = dicts[loc];
  const list = [];
  for (const [k, v] of Object.entries(d)) {
    if (typeof v !== "string") continue;
    if (v.length < MIN_LENGTH) continue;
    if (isBrandPassthrough(v)) continue;
    // Strip placeholders {x} and HTML so franc gets pure prose
    const cleaned = v
      .replace(/\{[^}]+\}/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < MIN_LENGTH) continue;
    const detected = franc(cleaned, { minLength: MIN_LENGTH });
    if (detected !== "und" && detected !== expected) {
      list.push({ key: k, detected, expected, value: v.slice(0, 100) });
    }
  }
  mismatches[loc] = list;
  console.log(`\n--- ${loc}.ts: ${list.length} suspicious values ---`);
  list.slice(0, 8).forEach((m) =>
    console.log(`  [${m.detected}] ${m.key}: ${m.value}`)
  );
  if (list.length > 8) console.log(`  ... and ${list.length - 8} more`);
}

// ─── Top-20 leaking namespaces (identical-EN) ───────────────────────────
console.log("\n\n════ TOP-20 LEAKING NAMESPACES (identical-EN values) ════");
const namespaceLeaks = {};
for (const loc of ["nl", ...auxLocales]) {
  const d = dicts[loc];
  const ns = {};
  for (const k of enKeys) {
    if (!(k in d)) continue;
    const v = d[k];
    if (v === en[k] && !isBrandPassthrough(v)) {
      const namespace = k.split(".")[0];
      ns[namespace] = (ns[namespace] || 0) + 1;
    }
  }
  namespaceLeaks[loc] = ns;
}
const allNs = new Set();
Object.values(namespaceLeaks).forEach((m) =>
  Object.keys(m).forEach((n) => allNs.add(n))
);
const topNs = [...allNs]
  .map((n) => ({
    ns: n,
    total: ["nl", ...auxLocales].reduce(
      (s, l) => s + (namespaceLeaks[l]?.[n] || 0),
      0
    ),
  }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 20);

console.log(
  "namespace        | nl  | de  | fr  | es  | it  | sw  | id  | pt  | tr  | pl  | ro  | ru  | el  | da  | sv  | total"
);
console.log(
  "-----------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|------"
);
for (const { ns, total } of topNs) {
  const cells = ["nl", "de", "fr", "es", "it", "sw", "id", "pt", "tr", "pl", "ro", "ru", "el", "da", "sv"]
    .map((l) => String(namespaceLeaks[l]?.[ns] || 0).padStart(3))
    .join(" | ");
  console.log(`${ns.padEnd(16)} | ${cells} | ${String(total).padStart(5)}`);
}

// ─── Save raw data ──────────────────────────────────────────────────────
writeFileSync(
  "/tmp/i18n-forensics.json",
  JSON.stringify({ coverage, mismatches, namespaceLeaks, totals }, null, 2)
);
console.log("\n\nRaw data: /tmp/i18n-forensics.json");
