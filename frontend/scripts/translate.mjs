#!/usr/bin/env node
/**
 * Auto-translate script for BetsPlug i18n
 * ────────────────────────────────────────────────────────────
 * Uses google-translate-api-x (free, no API key, no credit card)
 * to translate missing/new English keys to all target locales.
 *
 * Handles three translation targets:
 *   1. Locale files (de.ts, fr.ts, es.ts, it.ts, sw.ts, id.ts)
 *   2. NL translations inline in messages.ts
 *   3. Page metadata in page-meta.ts (all 8 locales)
 *
 * Usage:
 *   node scripts/translate.mjs              # translate all missing keys
 *   node scripts/translate.mjs --force      # re-translate ALL keys
 *   node scripts/translate.mjs --keys "b2b.*,footer.*"  # only specific key patterns
 *   node scripts/translate.mjs --locales "de,fr"         # only specific locales
 *   node scripts/translate.mjs --dry-run    # preview without writing
 *   node scripts/translate.mjs --skip-page-meta           # skip page-meta.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import translate from "google-translate-api-x";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.join(__dirname, "../src/i18n");
const MESSAGES_FILE = path.join(I18N_DIR, "messages.ts");
const LOCALES_DIR = path.join(I18N_DIR, "locales");
const PAGE_META_FILE = path.join(__dirname, "../src/data/page-meta.ts");
const GLOSSARY_FILE = path.join(__dirname, "i18n-glossary.json");

/* ── Glossary: protect brand / domain terms from translation ──────
   Load the shared glossary file. Every term in doNotTranslate is
   swapped for an opaque placeholder before we call Google Translate,
   then swapped back verbatim afterwards. This is cheaper + more
   reliable than hardcoding per-locale translations, and is the same
   glossary the review script uses for validation.
*/
const GLOSSARY = JSON.parse(fs.readFileSync(GLOSSARY_FILE, "utf-8"));
const PROTECTED_TERMS = (GLOSSARY.doNotTranslate ?? []).sort(
  (a, b) => b.length - a.length, // longest-first so "Pick of the Day" wins over "Pick"
);
// `⟦BP#⟧` uses angle-quote characters (U+27E6/27E7) that Google Translate
// leaves untouched — unlike `{{X#}}` which it sometimes mangles, or bare
// tokens which it sometimes capitalises.
const TOKEN_OPEN = "\u27E6BP";
const TOKEN_CLOSE = "\u27E7";

function protectGlossary(text) {
  if (text == null || typeof text !== "string") {
    return { protectedText: "", tokens: [] };
  }
  const tokens = [];
  let out = text;

  // (a) Fixed brand / product / league terms from the glossary.
  for (const term of PROTECTED_TERMS) {
    const pattern = new RegExp(
      term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g",
    );
    out = out.replace(pattern, () => {
      const idx = tokens.length;
      tokens.push(term);
      return `${TOKEN_OPEN}${idx}${TOKEN_CLOSE}`;
    });
  }

  // (b) ICU-style runtime placeholders like {amount}, {year}, {potdAccuracy}.
  //     Google Translate happily "translates" these to the target language
  //     (e.g. {amount} → {bedrag}) which breaks formatMsg() at runtime.
  //     Wrap each one as an opaque token so it survives verbatim.
  out = out.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `${TOKEN_OPEN}${idx}${TOKEN_CLOSE}`;
  });

  return { protectedText: out, tokens };
}

function restoreGlossary(text, tokens) {
  let out = text;
  // Google Translate occasionally drops the brackets or adds a trailing
  // space — tolerate that when restoring.
  for (let i = 0; i < tokens.length; i++) {
    const pattern = new RegExp(
      `\\u27E6?\\s*BP\\s*${i}\\s*\\u27E7?`,
      "g",
    );
    out = out.replace(pattern, tokens[i]);
  }
  return out;
}

/* ── Config ────────────────────────────────────────────────── */

// Top-16 locale expansion (Phase 2, 2026-04-23): added pt, tr, pl,
// ro, ru, el, da, sv to reach Nerdytips-style coverage of the high-
// value football-betting markets. Keep NL inline in messages.ts;
// everything else lives in src/i18n/locales/*.ts.
const TARGET_LOCALES = [
  "de", "fr", "es", "it", "sw", "id",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv",
];
const ALL_LOCALES = ["nl", ...TARGET_LOCALES];

const LOCALE_CODES = {
  nl: "nl",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  sw: "sw",
  id: "id",
  pt: "pt",
  tr: "tr",
  pl: "pl",
  ro: "ro",
  ru: "ru",
  el: "el",
  da: "da",
  sv: "sv",
};

// Google Translate rate limiting
const BATCH_SIZE = 20;       // keys per API call
const DELAY_MS = 1500;       // delay between batches

/* ── CLI args ──────────────────────────────────────────────── */

const args = process.argv.slice(2);
const forceAll = args.includes("--force");
const dryRun = args.includes("--dry-run");
const skipPageMeta = args.includes("--skip-page-meta");
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
 * Escape a string for use in a TypeScript double-quoted string literal.
 */
function escapeForTS(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/**
 * Parse a TypeScript file containing a flat key-value object.
 * Returns a Map of key -> value strings.
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
 * Find a top-level object block in TypeScript source by its declaration prefix.
 * Returns { start, bodyStart, bodyEnd, end } character offsets.
 *   start     = first char of the declaration (e.g. "const en")
 *   bodyStart = char after opening "{"
 *   bodyEnd   = char of closing "}"
 *   end       = char after closing "}" (may include ";")
 */
function findObjectBlock(content, prefix) {
  const idx = content.indexOf(prefix);
  if (idx === -1) throw new Error(`Could not find '${prefix}' in file`);

  const braceStart = content.indexOf("{", idx);
  if (braceStart === -1) throw new Error(`No opening brace found for '${prefix}'`);

  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  if (braceEnd === -1) throw new Error(`Could not find closing brace for '${prefix}'`);

  return {
    start: idx,
    bodyStart: braceStart + 1,
    bodyEnd: braceEnd,
    end: braceEnd + 1,
  };
}

/**
 * Extract the English dictionary from messages.ts
 */
function extractEnglishDict() {
  const content = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const block = findObjectBlock(content, "const en = {");
  const enBlock = content.slice(block.start, block.end);
  return parseTranslationFile(enBlock);
}

/**
 * Extract the NL dictionary from messages.ts
 */
function extractNlDict() {
  const content = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const block = findObjectBlock(content, "const nl");
  const nlBlock = content.slice(block.start, block.end);
  return parseTranslationFile(nlBlock);
}

/**
 * Insert or REPLACE NL key-value pairs inside the nl block.
 *
 * For keys that already exist in the block, the value is overwritten
 * in place — this is what --force expects. For genuinely new keys
 * the entry is appended just before the closing "}". Prevents the
 * "every run of --force doubles the NL block size" bug.
 */
function insertNlKeys(newEntries) {
  let content = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const block = findObjectBlock(content, "const nl");
  const nlBlock = content.slice(block.bodyStart, block.bodyEnd);
  const existing = parseTranslationFile(nlBlock);

  // Merge newEntries over existing, preserving the order of original
  // keys first, then appending truly-new keys at the end.
  const merged = new Map(existing);
  const appended = [];
  for (const [key, value] of newEntries) {
    if (merged.has(key)) {
      merged.set(key, value); // replace
    } else {
      merged.set(key, value); // append
      appended.push(key);
    }
  }

  // Rebuild the block body, grouped by key prefix for readability,
  // sorted alphabetically — same convention as locale files.
  const lines = [];
  let lastPrefix = "";
  for (const key of [...merged.keys()].sort()) {
    const prefix = key.split(".")[0];
    if (prefix !== lastPrefix && lastPrefix !== "") {
      lines.push("");
    }
    lastPrefix = prefix;
    const escaped = escapeForTS(merged.get(key));
    lines.push(`  "${key}": "${escaped}",`);
  }

  const newBlockBody = "\n" + lines.join("\n") + "\n";
  content =
    content.slice(0, block.bodyStart) + newBlockBody + content.slice(block.bodyEnd);
  fs.writeFileSync(MESSAGES_FILE, content, "utf-8");

  if (appended.length > 0) {
    // Just metadata for logging; the caller already prints totals.
  }
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
    const escaped = escapeForTS(value);
    lines.push(`  "${key}": "${escaped}",`);
  }

  // Aux locales are EN+NL-first-class per CLAUDE.md i18n hard rules. Cast
  // through Partial so the type system tolerates a temporarily-missing key
  // on a non-EN/NL locale (e.g. when a new key lands in messages.ts before
  // the next translation run completes).
  lines.push(`} as Partial<Record<TranslationKey, string>> as Record<TranslationKey, string>;`);
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
 * Dutch formality post-processor
 * ──────────────────────────────────────────────────────────────
 * Google Translate defaults to the formal "u" register for Dutch.
 * BetsPlug uses the informal "je/jij/jouw" register site-wide.
 * This function converts common formal patterns to informal ones.
 */
function enforceInformalDutch(text) {
  return text
    // "uw" (possessive) → "je" (but not inside words like "nieuw", "duw")
    .replace(/\bUw\b/g, "Je")
    .replace(/\buw\b/g, "je")
    // "u" (subject/object) → "je" (careful with word boundaries)
    .replace(/\bU\b(?!\.\w)/g, "Je")
    .replace(/\b u\b/g, " je")
    // Common verb+u patterns
    .replace(/\bheeft u\b/gi, "heb je")
    .replace(/\bkunt u\b/gi, "kun je")
    .replace(/\bwilt u\b/gi, "wil je")
    .replace(/\bzult u\b/gi, "zul je")
    .replace(/\bgaat u\b/gi, "ga je")
    .replace(/\baan u\b/gi, "aan jou");
}

/**
 * Translate a batch of strings using google-translate-api-x.
 *
 * Wraps each input with glossary-protection: brand / domain terms are
 * swapped for opaque tokens before the call and restored afterwards,
 * so Google Translate never has a chance to "translate" BetsPlug into
 * "wedstop" or "Pick of the Day" into "Keuze van de dag".
 */
async function translateBatch(texts, targetLang) {
  const protectedPairs = texts.map((t) => protectGlossary(t));
  const protectedTexts = protectedPairs.map((p) => p.protectedText);

  try {
    const results = await translate(protectedTexts, {
      from: "en",
      to: targetLang,
      autoCorrect: false,
    });

    let translated;
    if (Array.isArray(results)) {
      translated = results.map((r) => r.text);
    } else {
      translated = [results.text];
    }

    // Restore glossary placeholders to their original brand terms.
    translated = translated.map((text, i) =>
      restoreGlossary(text, protectedPairs[i].tokens),
    );

    // Enforce informal register for Dutch.
    if (targetLang === "nl") {
      translated = translated.map(enforceInformalDutch);
    }

    return translated;
  } catch (err) {
    console.error(`  Error translating to ${targetLang}: ${err.message}`);
    // Return originals on error.
    return texts;
  }
}

/* ── page-meta.ts helpers ─────────────────────────────────── */

const PAGE_META_LOCALES = [
  "en", "nl", "de", "fr", "es", "it", "sw", "id",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv",
];

/**
 * Parse page-meta.ts and return a structured representation.
 * Returns an array of { route, locales: { [locale]: { title, description, ogTitle?, ogDescription? } } }
 * along with the raw file content for rewriting.
 */
function parsePageMeta() {
  const content = fs.readFileSync(PAGE_META_FILE, "utf-8");

  // Find each route entry by matching the pattern:  "/route": {
  const routeRegex = /^(\s*)"(\/[^"]*)":\s*\{/gm;
  const routes = [];
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    const route = match[2];
    const indent = match[1];
    const routeStart = match.index;

    // Find the matching closing brace for this route block
    const braceStart = content.indexOf("{", routeStart + match[0].indexOf("{"));
    let depth = 0;
    let routeEnd = -1;
    for (let i = braceStart; i < content.length; i++) {
      if (content[i] === "{") depth++;
      if (content[i] === "}") {
        depth--;
        if (depth === 0) {
          routeEnd = i + 1;
          break;
        }
      }
    }
    if (routeEnd === -1) continue;

    const routeBlock = content.slice(braceStart, routeEnd);

    // Parse each locale within this route block
    const locales = {};
    for (const locale of PAGE_META_LOCALES) {
      const localeRegex = new RegExp(`(\\s*)${locale}:\\s*\\{`, "g");
      const lm = localeRegex.exec(routeBlock);
      if (!lm) continue;

      // Find matching closing brace
      const lBraceStart = routeBlock.indexOf("{", lm.index + lm[0].indexOf("{"));
      let ld = 0;
      let lBraceEnd = -1;
      for (let i = lBraceStart; i < routeBlock.length; i++) {
        if (routeBlock[i] === "{") ld++;
        if (routeBlock[i] === "}") {
          ld--;
          if (ld === 0) {
            lBraceEnd = i + 1;
            break;
          }
        }
      }
      if (lBraceEnd === -1) continue;

      const localeBlock = routeBlock.slice(lBraceStart, lBraceEnd);

      // Extract fields
      const getField = (field) => {
        // Match field: "value" or field:\n  "value"
        const fRegex = new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
        const fm = fRegex.exec(localeBlock);
        return fm ? fm[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\") : undefined;
      };

      locales[locale] = {
        title: getField("title"),
        description: getField("description"),
        ogTitle: getField("ogTitle"),
        ogDescription: getField("ogDescription"),
      };
    }

    routes.push({ route, indent, locales, blockStart: routeStart, blockEnd: routeEnd });
  }

  return { routes, content };
}

/**
 * Generate a locale block string for page-meta.ts
 */
function formatLocaleBlock(locale, meta, indent) {
  const inner = indent + "    ";
  const lines = [`${indent}  ${locale}: {`];
  lines.push(`${inner}title: "${escapeForTS(meta.title)}",`);
  lines.push(`${inner}description:`);
  lines.push(`${inner}  "${escapeForTS(meta.description)}",`);
  if (meta.ogTitle) {
    lines.push(`${inner}ogTitle: "${escapeForTS(meta.ogTitle)}",`);
  }
  if (meta.ogDescription) {
    lines.push(`${inner}ogDescription:`);
    lines.push(`${inner}  "${escapeForTS(meta.ogDescription)}",`);
  }
  lines.push(`${indent}  },`);
  return lines.join("\n");
}

/**
 * Translate missing locale entries in page-meta.ts
 */
async function translatePageMeta() {
  console.log("\n  ── PAGE-META.TS ────────────────────────────");

  const { routes, content } = parsePageMeta();
  console.log(`  Found ${routes.length} page routes`);

  // Collect all missing translations
  const missing = []; // { route, locale, enMeta }
  for (const route of routes) {
    const enMeta = route.locales.en;
    if (!enMeta || !enMeta.title) {
      console.log(`  Warning: no EN entry for ${route.route}, skipping`);
      continue;
    }

    for (const locale of PAGE_META_LOCALES) {
      if (locale === "en") continue;
      if (!forceAll && route.locales[locale]?.title) continue;
      // If filtering by locale, only translate those
      if (localesArg && !localesArg.split(",").map(l => l.trim()).includes(locale)) continue;
      missing.push({ route: route.route, locale, enMeta });
    }
  }

  if (missing.length === 0) {
    console.log("  Nothing to translate ✓\n");
    return 0;
  }

  console.log(`  Missing entries: ${missing.length}`);

  // Group by locale for efficient batch translation
  const byLocale = {};
  for (const m of missing) {
    if (!byLocale[m.locale]) byLocale[m.locale] = [];
    byLocale[m.locale].push(m);
  }

  // Translate each locale batch
  const translations = new Map(); // "route|locale" -> { title, description, ogTitle?, ogDescription? }
  let totalDone = 0;

  for (const [locale, entries] of Object.entries(byLocale)) {
    const langCode = LOCALE_CODES[locale];
    if (!langCode) continue;

    console.log(`  Translating ${entries.length} entries to ${locale.toUpperCase()}...`);

    // Build flat text array: [title1, desc1, ogTitle1?, ogDesc1?, title2, ...]
    const textItems = [];
    const textMap = []; // track which entry + field each text belongs to
    for (const entry of entries) {
      textItems.push(entry.enMeta.title);
      textMap.push({ route: entry.route, locale, field: "title" });

      textItems.push(entry.enMeta.description);
      textMap.push({ route: entry.route, locale, field: "description" });

      if (entry.enMeta.ogTitle) {
        textItems.push(entry.enMeta.ogTitle);
        textMap.push({ route: entry.route, locale, field: "ogTitle" });
      }
      if (entry.enMeta.ogDescription) {
        textItems.push(entry.enMeta.ogDescription);
        textMap.push({ route: entry.route, locale, field: "ogDescription" });
      }
    }

    // Translate in batches
    for (let i = 0; i < textItems.length; i += BATCH_SIZE) {
      const batch = textItems.slice(i, i + BATCH_SIZE);
      const batchMap = textMap.slice(i, i + BATCH_SIZE);

      const results = await translateBatch(batch, langCode);

      for (let j = 0; j < batchMap.length; j++) {
        const { route, locale: loc, field } = batchMap[j];
        const key = `${route}|${loc}`;
        if (!translations.has(key)) {
          translations.set(key, {});
        }
        translations.get(key)[field] = results[j];
      }

      totalDone += batch.length;
      if (i + BATCH_SIZE < textItems.length) {
        await sleep(DELAY_MS);
      }
    }
  }

  if (dryRun) {
    console.log(`  Would write ${translations.size} locale entries to page-meta.ts`);
    for (const [key, meta] of translations) {
      const [route, locale] = key.split("|");
      console.log(`    ${route} -> ${locale}: "${meta.title}"`);
    }
    console.log("");
    return missing.length;
  }

  // Re-read and rebuild page-meta.ts with new translations inserted
  let updated = fs.readFileSync(PAGE_META_FILE, "utf-8");
  const freshParsed = parsePageMeta();

  // Process routes in reverse order so character offsets stay valid
  for (let ri = freshParsed.routes.length - 1; ri >= 0; ri--) {
    const route = freshParsed.routes[ri];
    const indent = route.indent || "  ";

    // Collect new locale blocks to insert for this route
    const newBlocks = [];
    for (const locale of PAGE_META_LOCALES) {
      if (locale === "en") continue;
      const key = `${route.route}|${locale}`;
      if (!translations.has(key)) continue;

      // Only insert if this locale was truly missing
      if (!forceAll && route.locales[locale]?.title) continue;

      newBlocks.push({ locale, meta: translations.get(key) });
    }

    if (newBlocks.length === 0) continue;

    // Find the closing brace of the route block
    const routeBlockContent = updated.slice(route.blockStart, route.blockEnd);
    const outerBraceStart = routeBlockContent.indexOf("{");
    let depth = 0;
    let outerBraceEnd = -1;
    for (let i = outerBraceStart; i < routeBlockContent.length; i++) {
      if (routeBlockContent[i] === "{") depth++;
      if (routeBlockContent[i] === "}") {
        depth--;
        if (depth === 0) {
          outerBraceEnd = i;
          break;
        }
      }
    }
    if (outerBraceEnd === -1) continue;

    const insertPos = route.blockStart + outerBraceEnd;

    // Build insertion text
    const insertLines = newBlocks.map(({ locale, meta }) =>
      formatLocaleBlock(locale, meta, indent)
    );
    const insertText = "\n" + insertLines.join("\n");

    updated = updated.slice(0, insertPos) + insertText + "\n" + updated.slice(insertPos);
  }

  fs.writeFileSync(PAGE_META_FILE, updated, "utf-8");
  console.log(`  Written: ${translations.size} new locale entries to page-meta.ts`);
  console.log("");

  return missing.length;
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

  // 2. Process each locale file (de, fr, es, it, sw, id)
  let totalTranslated = 0;
  let totalSkipped = 0;

  for (const locale of targetLocales) {
    if (locale === "nl") continue; // NL handled separately below

    const langCode = LOCALE_CODES[locale];
    if (!langCode) {
      console.log(`  Skipping unknown locale: ${locale}`);
      continue;
    }

    console.log(`  ── ${locale.toUpperCase()} ──────────────────────────────────`);

    // Read existing translations
    const existing = readLocaleFile(locale);
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

    if (!dryRun) {
      writeLocaleFile(locale, translated);
      console.log(`  Written: ${translated.size} keys → locales/${locale}.ts`);
    } else {
      console.log(`  Would write: ${translated.size} keys → locales/${locale}.ts`);
    }

    totalTranslated += toTranslate.length;
    console.log("");
  }

  // 3. NL auto-translation (inline in messages.ts)
  console.log("  ── NL (inline) ──────────────────────────────");

  const nlDict = extractNlDict();
  console.log(`  Existing NL: ${nlDict.size} keys`);

  const nlToTranslate = [];
  for (const [key, enValue] of enDict) {
    if (!matchesKeyPattern(key)) continue;
    if (!forceAll && nlDict.has(key)) continue;
    nlToTranslate.push({ key, text: enValue });
  }

  if (nlToTranslate.length === 0) {
    console.log("  Nothing to translate ✓\n");
  } else {
    console.log(`  To translate: ${nlToTranslate.length} keys`);

    const nlTranslated = new Map();
    let done = 0;

    for (let i = 0; i < nlToTranslate.length; i += BATCH_SIZE) {
      const batch = nlToTranslate.slice(i, i + BATCH_SIZE);
      const texts = batch.map((b) => b.text);

      const results = await translateBatch(texts, "nl");

      for (let j = 0; j < batch.length; j++) {
        nlTranslated.set(batch[j].key, results[j]);
      }

      done += batch.length;
      const pct = Math.round((done / nlToTranslate.length) * 100);
      process.stdout.write(`\r  Progress: ${done}/${nlToTranslate.length} (${pct}%)`);

      if (i + BATCH_SIZE < nlToTranslate.length) {
        await sleep(DELAY_MS);
      }
    }

    console.log(""); // newline after progress

    if (!dryRun) {
      insertNlKeys(nlTranslated);
      console.log(`  Inserted ${nlTranslated.size} keys into NL block in messages.ts`);
    } else {
      console.log(`  Would insert ${nlTranslated.size} keys into NL block:`);
      for (const [key, value] of nlTranslated) {
        console.log(`    "${key}": "${escapeForTS(value)}",`);
      }
    }

    totalTranslated += nlToTranslate.length;
    console.log("");
  }

  // 4. page-meta.ts translations
  if (!skipPageMeta) {
    const pageMetaCount = await translatePageMeta();
    totalTranslated += pageMetaCount;
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
