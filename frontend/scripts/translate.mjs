#!/usr/bin/env node
/**
 * Auto-translate script for BetsPlug i18n
 * ────────────────────────────────────────────────────────────
 * Uses google-translate-api-x (free, no API key, no credit card)
 * to translate missing/new English keys to all target locales.
 *
 * Usage:
 *   node scripts/translate.mjs              # translate all missing keys
 *   node scripts/translate.mjs --force      # re-translate ALL keys
 *   node scripts/translate.mjs --keys "b2b.*,footer.*"  # only specific key patterns
 *   node scripts/translate.mjs --locales "de,fr"         # only specific locales
 *   node scripts/translate.mjs --dry-run    # preview without writing
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import translate from "google-translate-api-x";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.join(__dirname, "../src/i18n");
const MESSAGES_FILE = path.join(I18N_DIR, "messages.ts");
const LOCALES_DIR = path.join(I18N_DIR, "locales");

/* ── Config ────────────────────────────────────────────────── */

const TARGET_LOCALES = ["de", "fr", "es", "it", "sw", "id"];
// NL is inline in messages.ts — handled separately

const LOCALE_CODES = {
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  sw: "sw",
  id: "id",
  nl: "nl",
};

// Google Translate rate limiting
const BATCH_SIZE = 20;       // keys per API call
const DELAY_MS = 1500;       // delay between batches

/* ── CLI args ──────────────────────────────────────────────── */

const args = process.argv.slice(2);
const forceAll = args.includes("--force");
const dryRun = args.includes("--dry-run");
const keysArg = args.find((a) => a.startsWith("--keys="))?.split("=")[1]
  ?? (args.includes("--keys") ? args[args.indexOf("--keys") + 1] : null);
const localesArg = args.find((a) => a.startsWith("--locales="))?.split("=")[1]
  ?? (args.includes("--locales") ? args[args.indexOf("--locales") + 1] : null);

const keyPatterns = keysArg ? keysArg.split(",").map((p) => p.trim()) : null;
const targetLocales = localesArg
  ? localesArg.split(",").map((l) => l.trim())
  : TARGET_LOCALES;

/* ── Helpers ───────────────────────────────────────────────── */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse a TypeScript file containing a flat key-value object.
 * Returns a Map of key → value strings.
 */
function parseTranslationFile(content) {
  const entries = new Map();

  // Match "key": "value" patterns (handles escaped quotes inside values)
  const regex = /^\s*"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    // Unescape the value
    const value = match[2]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\");
    entries.set(key, value);
  }

  return entries;
}

/**
 * Extract the English dictionary from messages.ts
 */
function extractEnglishDict() {
  const content = fs.readFileSync(MESSAGES_FILE, "utf-8");

  // Find the `const en = {` block — it ends at the next `};` at column 0
  const enStart = content.indexOf("const en = {");
  if (enStart === -1) throw new Error("Could not find 'const en = {' in messages.ts");

  // Find the matching closing brace
  let depth = 0;
  let enEnd = -1;
  for (let i = content.indexOf("{", enStart); i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        enEnd = i + 1;
        break;
      }
    }
  }
  if (enEnd === -1) throw new Error("Could not find end of en object");

  const enBlock = content.slice(enStart, enEnd);
  return parseTranslationFile(enBlock);
}

/**
 * Extract the NL dictionary from messages.ts
 */
function extractNlDict() {
  const content = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const nlStart = content.indexOf("const nl");
  if (nlStart === -1) throw new Error("Could not find 'const nl' in messages.ts");

  let depth = 0;
  let nlEnd = -1;
  for (let i = content.indexOf("{", nlStart); i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        nlEnd = i + 1;
        break;
      }
    }
  }
  if (nlEnd === -1) throw new Error("Could not find end of nl object");

  const nlBlock = content.slice(nlStart, nlEnd);
  return parseTranslationFile(nlBlock);
}

/**
 * Read a locale file and parse its translations
 */
function readLocaleFile(locale) {
  const filePath = path.join(LOCALES_DIR, `${locale}.ts`);
  if (!fs.existsSync(filePath)) return new Map();
  const content = fs.readFileSync(filePath, "utf-8");
  return parseTranslationFile(content);
}

/**
 * Write the locale file with updated translations
 */
function writeLocaleFile(locale, translations) {
  const filePath = path.join(LOCALES_DIR, `${locale}.ts`);

  // Build the file content
  const lines = [`import type { TranslationKey } from '../messages';`, `const ${locale} = {`];

  // Group keys by prefix for readability
  let lastPrefix = "";
  const sortedKeys = [...translations.keys()].sort();

  for (const key of sortedKeys) {
    const prefix = key.split(".")[0];
    if (prefix !== lastPrefix && lastPrefix !== "") {
      lines.push(""); // blank line between groups
    }
    lastPrefix = prefix;

    const value = translations.get(key);
    // Escape for TypeScript string
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    lines.push(`  "${key}": "${escaped}",`);
  }

  lines.push(`} as Record<TranslationKey, string>;`);
  lines.push(`export default ${locale};`);
  lines.push(""); // trailing newline

  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}

/**
 * Check if a key matches any of the filter patterns
 */
function matchesKeyPattern(key) {
  if (!keyPatterns) return true;
  return keyPatterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      return key.startsWith(pattern.slice(0, -1));
    }
    return key === pattern;
  });
}

/**
 * Translate a batch of strings using google-translate-api-x
 */
async function translateBatch(texts, targetLang) {
  try {
    // google-translate-api-x supports array input
    const results = await translate(texts, {
      from: "en",
      to: targetLang,
      autoCorrect: false,
    });

    if (Array.isArray(results)) {
      return results.map((r) => r.text);
    }
    // Single string result
    return [results.text];
  } catch (err) {
    console.error(`  Error translating to ${targetLang}: ${err.message}`);
    // Return originals on error
    return texts;
  }
}

/* ── Main ──────────────────────────────────────────────────── */

async function main() {
  console.log("\n  BetsPlug Translation Script");
  console.log("  ─────────────────────────────────────────\n");

  if (dryRun) console.log("  MODE: Dry run (no files will be written)\n");
  if (forceAll) console.log("  MODE: Force re-translate all keys\n");

  // 1. Read English source
  const enDict = extractEnglishDict();
  console.log(`  English source: ${enDict.size} keys\n`);

  // 2. Process each locale
  let totalTranslated = 0;
  let totalSkipped = 0;

  for (const locale of targetLocales) {
    const langCode = LOCALE_CODES[locale];
    if (!langCode) {
      console.log(`  Skipping unknown locale: ${locale}`);
      continue;
    }

    console.log(`  ── ${locale.toUpperCase()} ──────────────────────────────────`);

    // Read existing translations
    const existing = locale === "nl"
      ? extractNlDict()
      : readLocaleFile(locale);

    console.log(`  Existing: ${existing.size} keys`);

    // Find keys that need translation
    const toTranslate = [];
    for (const [key, enValue] of enDict) {
      if (!matchesKeyPattern(key)) continue;
      if (!forceAll && existing.has(key)) continue;
      toTranslate.push({ key, text: enValue });
    }

    if (toTranslate.length === 0) {
      console.log(`  Nothing to translate ✓\n`);
      totalSkipped += enDict.size;
      continue;
    }

    console.log(`  To translate: ${toTranslate.length} keys`);

    // Translate in batches
    const translated = new Map(existing);
    let done = 0;

    for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
      const batch = toTranslate.slice(i, i + BATCH_SIZE);
      const texts = batch.map((b) => b.text);

      const results = await translateBatch(texts, langCode);

      for (let j = 0; j < batch.length; j++) {
        translated.set(batch[j].key, results[j]);
      }

      done += batch.length;
      const pct = Math.round((done / toTranslate.length) * 100);
      process.stdout.write(`\r  Progress: ${done}/${toTranslate.length} (${pct}%)`);

      // Rate limiting
      if (i + BATCH_SIZE < toTranslate.length) {
        await sleep(DELAY_MS);
      }
    }

    console.log(""); // newline after progress

    // Write file (skip NL — it's inline in messages.ts)
    if (locale === "nl") {
      console.log(`  NL is inline in messages.ts — output to console:`);
      for (const { key } of toTranslate) {
        console.log(`    "${key}": "${translated.get(key)}",`);
      }
    } else if (!dryRun) {
      writeLocaleFile(locale, translated);
      console.log(`  Written: ${translated.size} keys → locales/${locale}.ts`);
    } else {
      console.log(`  Would write: ${translated.size} keys → locales/${locale}.ts`);
    }

    totalTranslated += toTranslate.length;
    console.log("");
  }

  console.log("  ─────────────────────────────────────────");
  console.log(`  Total translated: ${totalTranslated} strings`);
  console.log(`  Total skipped (already exist): ${totalSkipped}`);
  if (dryRun) console.log("  (Dry run — no files written)");
  console.log("\n  Done! Now optimize SEO keywords with Claude.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
