#!/usr/bin/env node
/**
 * DeepL auto-fill for Sanity CMS content
 * ────────────────────────────────────────────────────────────
 * Uses DeepL's REST API (Free or Pro tier) to fill empty
 * non-English locales on Sanity documents. Replaces the earlier
 * google-translate-api-x attempt, which kept hitting aggressive
 * IP rate-limiting at anything over ~1 RPS.
 *
 * DeepL Free tier: 500k chars/month, no credit card, key ends in
 * `:fx`. Pro tier (paid): no `:fx` suffix. The API endpoint is
 * chosen automatically from the key suffix.
 *
 * Run:
 *   DEEPL_API_KEY=xxx SANITY_API_TOKEN=yyy node scripts/translate-sanity.mjs
 *   node scripts/translate-sanity.mjs --dry-run
 *   node scripts/translate-sanity.mjs --types leagueHub,learnPillar
 *   node scripts/translate-sanity.mjs --force    # re-translate non-empty
 */
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEEPL_KEY = process.env.DEEPL_API_KEY;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;
if (!DEEPL_KEY) {
  console.error("❌ DEEPL_API_KEY not set");
  process.exit(1);
}
if (!SANITY_TOKEN) {
  console.error("❌ SANITY_API_TOKEN not set");
  process.exit(1);
}

const DEEPL_URL = DEEPL_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

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

// DeepL language codes. A few differ from our locale codes:
//   pt → PT-PT (PT-BR also works; PT-PT keeps Iberian spelling)
//   zh → ZH-HANS (not used here)
//   nb/no → NB (Norwegian Bokmål; not used here)
// Unsupported on DeepL (any tier, verified 2026-04):
//   sw (Swahili), id (Indonesian)
// Those locales fall back to EN at render-time via `locRecord`.
const DEEPL_LANG = {
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  pt: "PT-PT",
  tr: "TR",
  pl: "PL",
  ro: "RO",
  ru: "RU",
  el: "EL",
  da: "DA",
  sv: "SV",
};
// Locales we can actually translate via DeepL:
const SUPPORTED_LOCALES = TARGET_LOCALES.filter((l) => l in DEEPL_LANG);

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
// Opaque-token swap: brand / league / product terms are replaced
// with a sentinel `⟦BP#⟧` that DeepL treats as an uninterpretable
// token and passes through verbatim. Survives better than XML
// tag-handling, which fails on source strings that happen to
// contain `<` or `&` characters.
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
  return { protectedText: out, tokens };
}
function restoreGlossary(text, tokens) {
  let out = text;
  for (let i = 0; i < tokens.length; i++) {
    const pattern = new RegExp(
      `\\u27E6?\\s*BP\\s*${i}\\s*\\u27E7?`,
      "g",
    );
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

// DeepL Free has a per-second request cap that 13-way parallel
// fan-out blows past. Run calls sequentially with a small pace
// between them — still completes a full Sanity backfill in ~10
// minutes, and the Free-tier character budget (not RPS) is what
// we actually care about conserving.
const PER_REQUEST_MS = 120;

/* ── Helpers ──────────────────────────────────────────────── */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Translate one EN source string into every DeepL-supported target
 * locale. DeepL doesn't accept arrays of target_lang, and the Free
 * tier has a tight per-second RPS cap that parallel fan-out blows
 * past. Run sequentially with a small pause per call.
 */
async function translateBatch(text, targetLocales) {
  if (!text) return {};
  const { protectedText, tokens } = protectGlossary(text);

  const out = {};
  for (const l of targetLocales) {
    const res = await translateOne(protectedText, l);
    if (res !== null) out[l] = restoreGlossary(res, tokens);
    await sleep(PER_REQUEST_MS);
  }
  return out;
}

async function translateOne(text, locale, retries = 4) {
  const deeplLang = DEEPL_LANG[locale];
  if (!deeplLang) return null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(DEEPL_URL, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: [text],
          source_lang: "EN",
          target_lang: deeplLang,
          preserve_formatting: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.translations?.[0]?.text ?? null;
      }
      // DeepL's 429 signals per-second RPS overrun; an escalating
      // back-off reliably clears it within a second or two.
      if (res.status === 429 && attempt < retries) {
        await sleep(500 * (attempt + 1) + Math.random() * 300);
        continue;
      }
      const errBody = await res.text();
      console.error(
        `      ⚠ DeepL ${locale} (${res.status}): ${errBody.slice(0, 200)}`,
      );
      return null;
    } catch (err) {
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      console.error(`      ⚠ DeepL ${locale}: ${err.message}`);
      return null;
    }
  }
  return null;
}

function isLocaleObject(val) {
  if (typeof val !== "object" || val === null) return false;
  const obj = val;
  return typeof obj.en === "string" && obj.en.length > 0;
}

/**
 * Walk every field on a document, find Sanity locale objects, and
 * fill in empty target locales from EN via DeepL.
 */
async function processDocument(doc) {
  let translated = 0;
  const patches = {};

  for (const [fieldName, fieldValue] of Object.entries(doc)) {
    if (fieldName.startsWith("_")) continue;

    if (isLocaleObject(fieldValue)) {
      const result = await translateLocaleField(fieldValue);
      if (result.count > 0) {
        patches[fieldName] = result.patched;
        translated += result.count;
      }
    }

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
  const missing = SUPPORTED_LOCALES.filter((l) => {
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

  // Per-request pause already happens inside translateBatch;
  // nothing extra needed between source strings.
  return { patched, count: written };
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  console.log("🌍 DeepL Sanity Content Fill");
  console.log(`   Endpoint: ${DEEPL_URL}`);
  console.log(`   Target locales: ${SUPPORTED_LOCALES.join(", ")}`);
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
    `\n🎉 Processed ${totalDocs} documents, translated ${totalTranslated} fields across ${SUPPORTED_LOCALES.length} DeepL-supported locales.`,
  );
  console.log(
    `   Unsupported on DeepL (render-time EN fallback): ${TARGET_LOCALES.filter((l) => !(l in DEEPL_LANG)).join(", ")}`,
  );
}

main().catch((err) => {
  console.error("❌ Translation failed:", err);
  process.exit(1);
});
