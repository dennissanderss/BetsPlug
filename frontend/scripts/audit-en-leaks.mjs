#!/usr/bin/env node
/**
 * Audit each non-EN locale (incl. NL) against EN to find keys that
 * still ship the English value — i.e. translation leaks.
 *
 * Skips obvious brand-passthroughs (one-word brand entities, tier
 * names) so they don't pollute the report.
 */
import fs from "fs";
import path from "path";

const I18N_DIR = "src/i18n";
const MESSAGES = path.join(I18N_DIR, "messages.ts");
const LOCALES_DIR = path.join(I18N_DIR, "locales");

function parseBlock(content, name, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error(`block ${name} not found`);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`block ${name} end not found`);
  const block = content.slice(start, end);
  const out = {};
  const rx = /^  "([^"]+)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm;
  let m;
  while ((m = rx.exec(block)) !== null) {
    out[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return out;
}

const messagesContent = fs.readFileSync(MESSAGES, "utf-8");
const en = parseBlock(messagesContent, "en", "const en = {", "} as const;");
const nl = parseBlock(
  messagesContent,
  "nl",
  "const nl: Dictionary = {",
  "};\n\n\n/* ── Locale dictionaries",
);

const otherLocales = ["de", "fr", "es", "it", "sw", "id", "pt", "tr", "pl", "ro", "ru", "el", "da", "sv"];
const dicts = { nl };
for (const loc of otherLocales) {
  const filePath = path.join(LOCALES_DIR, `${loc}.ts`);
  const content = fs.readFileSync(filePath, "utf-8");
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  const block = content.slice(start, end + 1);
  dicts[loc] = {};
  const rx = /^  "([^"]+)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm;
  let m;
  while ((m = rx.exec(block)) !== null) {
    dicts[loc][m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
}

// Brand passthroughs (whitelist): keys whose EN value is one of these
// strings legitimately stays the same in every locale.
const BRAND_PASSTHROUGHS = new Set([
  "Free", "Silver", "Gold", "Platinum", "Bronze", "Free Access",
  "BetsPlug", "Pulse", "BTTS", "ROI", "xG", "Elo", "Poisson", "XGBoost",
  "Ensemble", "Live", "Reports",
  // Stripe/Apple/Google brand names also stay verbatim
  "Stripe", "Apple", "Google",
]);

// Keys whose value containing a placeholder like {tier}/{accuracy}
// often legitimately has identical NL+EN structure. We still flag them
// if the value is purely English wording.

function looksHardcodedEnglish(value) {
  // Empty values are fine (e.g. hero.titleLine1 was empty in source)
  if (!value || value.length < 2) return false;
  // Brand-only passthroughs are fine
  if (BRAND_PASSTHROUGHS.has(value)) return false;
  // Pure punctuation / numbers
  if (!/[a-zA-Z]/.test(value)) return false;
  // Very short tier names with a placeholder ("Upgrade to {tier}") -
  // these we WILL flag for non-EN to translate.
  return true;
}

const report = {};
let totalLeaks = 0;
for (const [loc, dict] of Object.entries(dicts)) {
  const leaks = [];
  for (const [key, value] of Object.entries(dict)) {
    if (en[key] !== undefined && en[key] === value && looksHardcodedEnglish(value)) {
      leaks.push({ key, value });
    }
  }
  report[loc] = leaks;
  totalLeaks += leaks.length;
  console.log(`  ${loc}: ${leaks.length} EN-value leaks`);
}

const outPath = "scripts/i18n-leak-report.json";
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\nTotal EN-value leaks across 15 non-EN locales: ${totalLeaks}`);
console.log(`Report: ${outPath}`);
