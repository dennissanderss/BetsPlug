#!/usr/bin/env node
/**
 * Review i18n auto-translations and flag probable issues
 * ────────────────────────────────────────────────────────────────────
 * Runs a set of heuristics over every locale file and reports keys
 * that look wrong. With `--fix`, clears the flagged entries in each
 * locale so the next run of `translate.mjs` re-generates them (now
 * via the glossary-protected pipeline).
 *
 * Usage:
 *   node scripts/review-translations.mjs                 # report only
 *   node scripts/review-translations.mjs --fix           # re-translate flagged
 *   node scripts/review-translations.mjs --locales de,fr # scope to locales
 *   node scripts/review-translations.mjs --severity high # only high-sev issues
 *   node scripts/review-translations.mjs --verbose       # show every issue
 *
 * Detection heuristics:
 *   - escapeLeak:      translation contains "\\uXXXX" literally (the
 *                      bug we hit earlier — re-appearance prevention)
 *   - placeholderLost: EN contains {foo} but translation dropped it
 *   - duplicateOfEn:   translation === EN source (no translation done)
 *                      — exempted for nav/common/breadcrumb keys where
 *                      EN survival is often intentional
 *   - lengthRatio:     translation.length / en.length is outside the
 *                      [min, max] range configured in the glossary
 *   - glossaryWrong:   a doNotTranslate term appears in EN but was
 *                      translated away in the locale output
 *   - preferredTerm:   the translation contains a phrase listed in
 *                      preferredTranslations[locale] as "bad" (the key
 *                      of the map) — replaced with the preferred value
 *                      on --fix.
 *
 * Exit code: 0 always (reporting tool, not a CI gate by default).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.join(__dirname, "../src/i18n");
const MESSAGES_FILE = path.join(I18N_DIR, "messages.ts");
const LOCALES_DIR = path.join(I18N_DIR, "locales");
const GLOSSARY_FILE = path.join(__dirname, "i18n-glossary.json");

const TARGET_LOCALES = ["nl", "de", "fr", "es", "it", "sw", "id"];

/* ── CLI args ─────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const doFix = args.includes("--fix");
const verbose = args.includes("--verbose") || args.includes("-v");
const severityArg = argValue("--severity") || "any";
const localesArg = argValue("--locales");
const scopeLocales = localesArg
  ? localesArg.split(",").map((l) => l.trim()).filter(Boolean)
  : TARGET_LOCALES;

function argValue(name) {
  const inline = args.find((a) => a.startsWith(`${name}=`));
  if (inline) return inline.split("=").slice(1).join("=");
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return null;
}

/* ── Parsing helpers (shared with translate.mjs) ──────────────────── */

function parseEntries(content) {
  const entries = new Map();
  const regex = /^\s*"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = match[2]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\");
    entries.set(key, value);
  }
  return entries;
}

function findBlock(content, prefix) {
  const idx = content.indexOf(prefix);
  if (idx === -1) return null;
  const braceStart = content.indexOf("{", idx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        return { bodyStart: braceStart + 1, bodyEnd: i };
      }
    }
  }
  return null;
}

function extractEn() {
  const content = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const block = findBlock(content, "const en = {");
  if (!block) throw new Error("Could not find 'const en' block");
  return parseEntries(content.slice(block.bodyStart, block.bodyEnd));
}

function extractNl() {
  const content = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const block = findBlock(content, "const nl");
  if (!block) return new Map();
  return parseEntries(content.slice(block.bodyStart, block.bodyEnd));
}

function extractLocale(locale) {
  if (locale === "nl") return extractNl();
  const p = path.join(LOCALES_DIR, `${locale}.ts`);
  if (!fs.existsSync(p)) return new Map();
  return parseEntries(fs.readFileSync(p, "utf-8"));
}

/* ── Glossary + rules ─────────────────────────────────────────────── */

const GLOSSARY = JSON.parse(fs.readFileSync(GLOSSARY_FILE, "utf-8"));
const PROTECTED = GLOSSARY.doNotTranslate ?? [];
const PREFERRED = GLOSSARY.preferredTranslations ?? {};
const V = GLOSSARY.validation ?? {};
const LEN_MIN = V.lengthRatio?.min ?? 0.35;
const LEN_MAX = V.lengthRatio?.max ?? 2.6;
const MIN_LEN_TO_CHECK = V.minKeyLengthToCheck ?? 20;
const DUP_EXEMPT_PREFIXES = V.allowDuplicateFor ?? [];
const DUP_MIN_LEN = V.allowDuplicateIfShorterThan ?? 4;

function isExemptFromDuplicate(key, en) {
  if (en.length < DUP_MIN_LEN) return true;
  if (DUP_EXEMPT_PREFIXES.some((p) => key.startsWith(p))) return true;
  // Brand-only lines (e.g. "BetsPlug", "Premier League") are legitimately identical
  if (PROTECTED.some((t) => en.trim() === t)) return true;
  // Numeric values / percentages / very short stat values
  if (/^[\s\-+−%0-9.,]+$/.test(en)) return true;
  return false;
}

function extractPlaceholders(s) {
  const found = new Set();
  for (const m of s.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)) {
    found.add(m[1]);
  }
  return found;
}

/* ── Detection ────────────────────────────────────────────────────── */

function severityRank(s) {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

function inspect(key, en, tr, locale) {
  const issues = [];

  // (1) escape leak
  if (/\\u[0-9a-fA-F]{4}/.test(tr)) {
    issues.push({
      rule: "escapeLeak",
      severity: "high",
      detail: "Translation contains a literal \\uXXXX escape sequence.",
    });
  }

  // (2) placeholder loss — only care about named placeholders in EN
  const enPlaceholders = extractPlaceholders(en);
  if (enPlaceholders.size > 0) {
    const trPlaceholders = extractPlaceholders(tr);
    const missing = [...enPlaceholders].filter((p) => !trPlaceholders.has(p));
    if (missing.length > 0) {
      issues.push({
        rule: "placeholderLost",
        severity: "high",
        detail: `Missing placeholders: {${missing.join("}, {")}}`,
      });
    }
  }

  // (3) duplicate of EN
  if (
    en.length >= MIN_LEN_TO_CHECK &&
    tr.trim() === en.trim() &&
    !isExemptFromDuplicate(key, en)
  ) {
    issues.push({
      rule: "duplicateOfEn",
      severity: "medium",
      detail: "Translation is identical to the English source.",
    });
  }

  // (4) length ratio — only meaningful for longer strings
  if (en.length >= MIN_LEN_TO_CHECK && tr.length > 0) {
    const ratio = tr.length / en.length;
    if (ratio < LEN_MIN || ratio > LEN_MAX) {
      issues.push({
        rule: "lengthRatio",
        severity: ratio < 0.2 || ratio > 3.5 ? "high" : "medium",
        detail: `tr/en length ratio = ${ratio.toFixed(2)} (allowed: ${LEN_MIN}–${LEN_MAX})`,
      });
    }
  }

  // (5) glossary survival: every do-not-translate term present in EN
  //     should also be present in the translation, verbatim.
  for (const term of PROTECTED) {
    if (en.includes(term) && !tr.includes(term)) {
      issues.push({
        rule: "glossaryWrong",
        severity: "high",
        detail: `"${term}" present in EN but missing/translated in ${locale}.`,
      });
    }
  }

  // (6) preferred translations — a small, explicit per-locale list of
  //     words google-translate gets wrong that we'd like swapped.
  const pref = PREFERRED[locale];
  if (pref) {
    for (const [bad, good] of Object.entries(pref)) {
      if (bad === good) continue;
      const re = new RegExp(`\\b${bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(tr)) {
        issues.push({
          rule: "preferredTerm",
          severity: "medium",
          detail: `Prefer "${good}" over "${bad}"`,
          replace: { from: bad, to: good },
        });
      }
    }
  }

  return issues;
}

/* ── Report ───────────────────────────────────────────────────────── */

function severityLabel(s) {
  return s === "high" ? "\x1b[31mHIGH\x1b[0m" : s === "medium" ? "\x1b[33mMED \x1b[0m" : "\x1b[36mLOW \x1b[0m";
}

function filterBySeverity(issues) {
  if (severityArg === "any") return issues;
  const target = severityRank(severityArg);
  return issues.filter((i) => severityRank(i.severity) >= target);
}

function shortenEn(en) {
  return en.length <= 72 ? en : en.slice(0, 69) + "...";
}

/* ── Main ─────────────────────────────────────────────────────────── */

const en = extractEn();
console.log(`\nReviewing ${en.size} keys × ${scopeLocales.length} locales...\n`);

const flagged = []; // { locale, key, issues, tr }
let ruleCounts = new Map();

for (const locale of scopeLocales) {
  const tr = extractLocale(locale);
  for (const [key, enVal] of en) {
    const trVal = tr.get(key);
    if (trVal == null) continue; // missing keys are translate.mjs's job
    const issues = filterBySeverity(inspect(key, enVal, trVal, locale));
    if (issues.length > 0) {
      flagged.push({ locale, key, issues, tr: trVal, en: enVal });
      for (const i of issues) {
        ruleCounts.set(i.rule, (ruleCounts.get(i.rule) ?? 0) + 1);
      }
    }
  }
}

// ── Print summary ──
const byLocale = new Map();
for (const f of flagged) {
  byLocale.set(f.locale, (byLocale.get(f.locale) ?? 0) + 1);
}

console.log("Summary by locale:");
for (const locale of scopeLocales) {
  const n = byLocale.get(locale) ?? 0;
  console.log(`  ${locale}: ${n} flagged`);
}
console.log("\nBy rule:");
for (const [rule, count] of [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${rule.padEnd(16)} ${count}`);
}
console.log("");

if (verbose || flagged.length <= 30) {
  for (const f of flagged) {
    console.log(`[${f.locale}] ${f.key}`);
    console.log(`       en: ${shortenEn(f.en)}`);
    console.log(`       ${f.locale}: ${shortenEn(f.tr)}`);
    for (const i of f.issues) {
      console.log(`       ${severityLabel(i.severity)} ${i.rule}: ${i.detail}`);
    }
    console.log("");
  }
} else {
  console.log(`(${flagged.length} flags total — re-run with --verbose to see all)`);
}

/* ── --fix mode ───────────────────────────────────────────────────── */

if (!doFix) {
  console.log("\nRe-run with --fix to apply preferredTerm swaps + clear");
  console.log("duplicate/escape-leak/glossary issues so translate.mjs can");
  console.log("regenerate them through the glossary-protected pipeline.\n");
  process.exit(0);
}

console.log("\n--fix: applying preferredTerm swaps + marking other issues\n");

// Group by locale so we write each file once.
const byLocaleFiles = new Map();
for (const f of flagged) {
  if (!byLocaleFiles.has(f.locale)) byLocaleFiles.set(f.locale, []);
  byLocaleFiles.get(f.locale).push(f);
}

const toReTranslate = []; // { locale, key }
let swapsApplied = 0;

for (const [locale, flags] of byLocaleFiles) {
  const filePath = locale === "nl" ? MESSAGES_FILE : path.join(LOCALES_DIR, `${locale}.ts`);
  let content = fs.readFileSync(filePath, "utf-8");

  for (const f of flags) {
    // 1. preferredTerm swaps: just replace in-file.
    const swaps = f.issues.filter((i) => i.rule === "preferredTerm" && i.replace);
    if (swaps.length > 0) {
      let newTr = f.tr;
      for (const s of swaps) {
        const re = new RegExp(
          `\\b${s.replace.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi",
        );
        newTr = newTr.replace(re, s.replace.to);
      }
      if (newTr !== f.tr) {
        // Escape for TypeScript string literal.
        const esc = (s) =>
          s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
        const keyPattern = new RegExp(
          `("${f.key.replace(/\./g, "\\.")}":\\s*")[^"\\\\]*(?:\\\\.[^"\\\\]*)*(")`,
        );
        if (keyPattern.test(content)) {
          content = content.replace(keyPattern, `$1${esc(newTr)}$2`);
          swapsApplied++;
        }
      }
    }

    // 2. Hard issues (escapeLeak, duplicateOfEn, glossaryWrong, placeholderLost)
    //    — flag for re-translation.
    const needsReTranslate = f.issues.some((i) =>
      ["escapeLeak", "duplicateOfEn", "glossaryWrong", "placeholderLost"].includes(i.rule),
    );
    if (needsReTranslate) {
      toReTranslate.push({ locale, key: f.key });
    }
  }

  fs.writeFileSync(filePath, content, "utf-8");
}

console.log(`  preferredTerm swaps applied: ${swapsApplied}`);
console.log(`  keys flagged for re-translation: ${toReTranslate.length}`);

if (toReTranslate.length > 0) {
  // Build --keys arg (unique key names) and print the exact follow-up command.
  const uniqueKeys = [...new Set(toReTranslate.map((x) => x.key))].sort();
  console.log("\n  To re-translate the flagged keys (glossary-protected):");
  console.log(`    node scripts/translate.mjs --force --keys "${uniqueKeys.join(",")}"`);
  console.log("");

  // Also dump a .tmp file for CI pipelines.
  const outPath = path.join(__dirname, "review-flagged-keys.tmp");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), keys: uniqueKeys, entries: toReTranslate },
      null,
      2,
    ),
    "utf-8",
  );
  console.log(`  (also written to ${path.relative(process.cwd(), outPath)})\n`);
}

process.exit(0);
