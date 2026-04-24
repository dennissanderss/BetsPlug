#!/usr/bin/env node
/**
 * Google-Translate auto-fill for Sanity CMS content
 * ────────────────────────────────────────────────────────────
 * Uses google-translate-api-x (free, no API key) to fill in
 * empty non-English locales on Sanity documents. Keeps the
 * structure of the original DeepL version but runs on the free
 * tier — matches the `translate.mjs` approach for UI strings.
 *
 * Run:
 *   SANITY_API_TOKEN=xxx node scripts/translate-sanity.mjs
 *   node scripts/translate-sanity.mjs --dry-run
 *   node scripts/translate-sanity.mjs --types leagueHub,learnPillar
 *   node scripts/translate-sanity.mjs --force    # re-translate non-empty fields
 */
import { createClient } from "@sanity/client";
import translate from "google-translate-api-x";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SANITY_TOKEN = process.env.SANITY_API_TOKEN;
if (!SANITY_TOKEN) {
  console.error("❌ SANITY_API_TOKEN not set");
  process.exit(1);
}

const client = createClient({
  projectId: "nk7ioy85",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: SANITY_TOKEN,
});

/* ── Config — Phase 2 top-16 locales ──────────────────────── */

const TARGET_LOCALES = [
  "nl", "de", "fr", "es", "it", "sw", "id",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv",
];

// Sanity localeString/localeText/localeBlockContent content types
const TYPES_WITH_LOCALE = [
  "learnPillar",
  "leagueHub",
  "betTypeHub",
  "pageMeta",
  "legalPage",
  "homepage",
  "pricingConfig",
  "aboutPage",
  "thankYouPage",
  "b2bPage",
  "howItWorksPage",
  "contactPage",
  "welcomePage",
  "checkoutPage",
  "trackRecordPage",
];

/* ── Glossary — protect brand + product terms from translation ── */

const GLOSSARY_PATH = path.join(__dirname, "i18n-glossary.json");
const GLOSSARY = fs.existsSync(GLOSSARY_PATH)
  ? JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf-8"))
  : { doNotTranslate: [] };

const PROTECTED_TERMS = (GLOSSARY.doNotTranslate ?? []).sort(
  (a, b) => b.length - a.length,
);
const TOKEN_OPEN = "\u27E6BP";
const TOKEN_CLOSE = "\u27E7";

function protectGlossary(text) {
  if (typeof text !== "string" || text.length === 0) {
    return { protectedText: text, tokens: [] };
  }
  const tokens = [];
  let out = text;
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
  // ICU placeholders like {foo} — Google Translate sometimes renames these.
  out = out.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `${TOKEN_OPEN}${idx}${TOKEN_CLOSE}`;
  });
  return { protectedText: out, tokens };
}

function restoreGlossary(text, tokens) {
  let out = text;
  for (let i = 0; i < tokens.length; i++) {
    const pattern = new RegExp(`\\u27E6?\\s*BP\\s*${i}\\s*\\u27E7?`, "g");
    out = out.replace(pattern, tokens[i]);
  }
  return out;
}

/* ── CLI args ─────────────────────────────────────────────── */

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forceAll = args.includes("--force");
const typesArg =
  args.find((a) => a.startsWith("--types="))?.split("=")[1] ??
  (args.includes("--types") ? args[args.indexOf("--types") + 1] : null);
const typesFilter = typesArg ? typesArg.split(",").map((t) => t.trim()) : null;

// Google Translate tolerates ~1 req/sec reliably on the free tier.
// We batch ALL 15 target locales into ONE call per EN source (the
// library accepts `to: [...]`), so a document with 10 localised
// fields costs 10 calls instead of 150 — drops rate-limit risk by
// an order of magnitude.
const DELAY_MS = 1100;

/* ── Helpers ──────────────────────────────────────────────── */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Translate one EN source string into every target locale in a
 * single batched call. Returns a Record<locale, translatedText>
 * with EN fallback on any individual miss.
 */
/**
 * Translate one EN source string into every target locale in a
 * single batched call. On API failure the function returns an
 * empty object so the caller SKIPS the field entirely — writing
 * the EN fallback as a "translation" to Sanity would just mask
 * missing coverage with falsely-branded English content, and
 * overwrite any good translation that already exists.
 */
async function translateBatch(text, targetLangs) {
  if (!text) return {};
  const { protectedText, tokens } = protectGlossary(text);
  try {
    const res = await translate(protectedText, {
      from: "en",
      to: targetLangs,
      autoCorrect: false,
      // google-translate-api-x has an over-strict ISO whitelist that
      // rejects pt / tr / pl / ro / ru / el / da / sv when passed as
      // an array target. `forceTo: true` bypasses the client-side
      // validation — Google itself supports all of these.
      forceTo: true,
    });
    const out = {};
    if (Array.isArray(res)) {
      targetLangs.forEach((l, i) => {
        const t = res[i]?.text;
        if (t && t !== protectedText) out[l] = restoreGlossary(t, tokens);
      });
    } else if (res && typeof res === "object") {
      for (const l of targetLangs) {
        const entry = (res)[l];
        const t = entry?.text ?? entry;
        if (typeof t === "string" && t && t !== protectedText) {
          out[l] = restoreGlossary(t, tokens);
        }
      }
    }
    return out;
  } catch (err) {
    console.error(
      `      ⚠ batch-translate "${text.slice(0, 40)}…": ${err.message}`,
    );
    return {};
  }
}

function isLocaleObject(val) {
  if (typeof val !== "object" || val === null) return false;
  const obj = val;
  return typeof obj.en === "string" && obj.en.length > 0;
}

/**
 * Walk every field on a document, find Sanity locale objects, and
 * fill in any empty target locales from EN via Google Translate.
 * Returns the count of fields translated (for logging).
 */
async function processDocument(doc) {
  let translated = 0;
  const patches = {};

  for (const [fieldName, fieldValue] of Object.entries(doc)) {
    if (fieldName.startsWith("_")) continue;

    // Direct locale field
    if (isLocaleObject(fieldValue)) {
      const result = await translateLocaleField(fieldValue);
      if (result.count > 0) {
        patches[fieldName] = result.patched;
        translated += result.count;
      }
    }

    // Array of objects (faqs, sections) — look one level deep
    if (Array.isArray(fieldValue)) {
      let arrayChanged = false;
      const patchedArray = [];
      for (const item of fieldValue) {
        if (typeof item !== "object" || !item) {
          patchedArray.push(item);
          continue;
        }
        let itemChanged = false;
        const patchedItem = { ...item };
        for (const [subKey, subVal] of Object.entries(item)) {
          if (subKey.startsWith("_")) continue;
          if (isLocaleObject(subVal)) {
            const result = await translateLocaleField(subVal);
            if (result.count > 0) {
              patchedItem[subKey] = result.patched;
              translated += result.count;
              itemChanged = true;
            }
          }
        }
        patchedArray.push(itemChanged ? patchedItem : item);
        if (itemChanged) arrayChanged = true;
      }
      if (arrayChanged) patches[fieldName] = patchedArray;
    }
  }

  if (!dryRun && Object.keys(patches).length > 0) {
    await client.patch(doc._id).set(patches).commit();
  }

  return translated;
}

async function translateLocaleField(field) {
  const patched = { ...field };
  // Only translate locales that are empty (unless --force).
  const missing = TARGET_LOCALES.filter((l) => {
    const have = patched[l];
    return patched.en && (forceAll || !have || String(have).trim() === "");
  });
  if (missing.length === 0) return { patched, count: 0 };

  const translations = await translateBatch(patched.en, missing);
  let written = 0;
  for (const l of missing) {
    if (typeof translations[l] === "string" && translations[l].length > 0) {
      patched[l] = translations[l];
      written++;
    }
  }

  // One batched call per source string — pause between sources so
  // Google doesn't rate-limit the whole document.
  await sleep(DELAY_MS);
  return { patched, count: written };
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  console.log("🌍 Google-Translate Sanity Content Fill");
  if (dryRun) console.log("   (dry-run — no writes)");
  if (forceAll) console.log("   (--force — re-translating non-empty fields)");
  console.log("");

  const targetTypes = typesFilter
    ? TYPES_WITH_LOCALE.filter((t) => typesFilter.includes(t))
    : TYPES_WITH_LOCALE;

  let totalDocs = 0;
  let totalTranslated = 0;

  for (const docType of targetTypes) {
    const docs = await client.fetch(`*[_type == "${docType}"]`);
    if (!docs?.length) {
      console.log(`⏭️  ${docType}: no documents`);
      continue;
    }
    console.log(`\n📄 ${docType}: ${docs.length} documents`);

    for (const doc of docs) {
      const label =
        doc.title?.en ||
        doc.name?.en ||
        doc.pageKey ||
        doc.slug?.current ||
        doc._id;
      const count = await processDocument(doc);
      totalDocs++;
      totalTranslated += count;
      if (count > 0) {
        console.log(`   ✅ ${label}: ${count} fields translated`);
      } else {
        console.log(`   ✓ ${label}: complete`);
      }
    }
  }

  console.log(
    `\n🎉 Processed ${totalDocs} documents, translated ${totalTranslated} fields across ${TARGET_LOCALES.length} locales.`,
  );
}

main().catch((err) => {
  console.error("❌ Translation failed:", err);
  process.exit(1);
});
