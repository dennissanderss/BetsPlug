#!/usr/bin/env node
/**
 * Sanity locale-coverage gap report
 * ────────────────────────────────────────────────────────────
 * For every document of a type that has localised fields, lists
 * the (docId, fieldPath, missing-locales) tuples. Used to scope
 * a hand-authored translation pass — I see what's actually empty
 * across 16 locales before writing a single line of copy.
 *
 * Output: `scripts/sanity-translation-gaps.json` — structured so
 * an author / translator can fill in the values per tuple, then
 * the companion `apply-hardcoded-translations.mjs` patches them
 * back to Sanity.
 *
 * Run:
 *   SANITY_API_TOKEN=xxx node scripts/sanity-gap-report.mjs
 *   SANITY_API_TOKEN=xxx node scripts/sanity-gap-report.mjs --types leagueHub
 */
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "sanity-translation-gaps.json");

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

const ALL_LOCALES = [
  "en", "nl", "de", "fr", "es", "it", "sw", "id",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv",
];

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

const args = process.argv.slice(2);
const typesArg =
  args.find((a) => a.startsWith("--types="))?.split("=")[1] ??
  (args.includes("--types") ? args[args.indexOf("--types") + 1] : null);
const typesFilter = typesArg ? typesArg.split(",").map((t) => t.trim()) : null;

/* ── helpers ────────────────────────────────────────────────── */

function isLocaleObject(val) {
  if (typeof val !== "object" || val === null) return false;
  if ("_type" in val && val._type !== "localeString" && val._type !== "localeText") {
    return false;
  }
  return typeof val.en === "string" && val.en.length > 0;
}

function findMissingLocales(localeObj) {
  const missing = [];
  for (const l of ALL_LOCALES) {
    const v = localeObj[l];
    if (!v || (typeof v === "string" && v.trim().length === 0)) {
      missing.push(l);
    }
  }
  return missing;
}

/**
 * Walk a doc, collect every locale-object and its path, return
 * a flat list of {path, enValue, missingLocales}.
 */
function walkDoc(doc, basePath = "") {
  const out = [];
  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith("_")) continue;
    const p = basePath ? `${basePath}.${key}` : key;

    if (isLocaleObject(value)) {
      const missing = findMissingLocales(value);
      if (missing.length > 0) {
        out.push({ path: p, enValue: value.en, missingLocales: missing });
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          // Use _key if available (Sanity array item identity), else index
          const idx = item._key ? `[${item._key}]` : `[${i}]`;
          out.push(...walkDoc(item, `${p}${idx}`));
        }
      });
    } else if (typeof value === "object" && value !== null) {
      out.push(...walkDoc(value, p));
    }
  }
  return out;
}

/* ── main ───────────────────────────────────────────────────── */

async function main() {
  const targetTypes = typesFilter
    ? TYPES_WITH_LOCALE.filter((t) => typesFilter.includes(t))
    : TYPES_WITH_LOCALE;

  const report = {};
  let totalGaps = 0;
  let totalMissingPairs = 0;

  console.log("🔎 Sanity locale coverage gap report\n");

  for (const docType of targetTypes) {
    const docs = await client.fetch(`*[_type == "${docType}"]`);
    if (!docs?.length) continue;

    for (const doc of docs) {
      const gaps = walkDoc(doc);
      if (gaps.length === 0) continue;

      const docLabel =
        doc.title?.en ||
        doc.name?.en ||
        doc.pageKey ||
        doc.slug?.current ||
        doc._id;

      report[doc._id] = {
        _type: docType,
        label: docLabel,
        gaps: gaps.map((g) => ({
          path: g.path,
          en: g.enValue.length > 120 ? g.enValue.slice(0, 117) + "…" : g.enValue,
          missing: g.missingLocales,
        })),
      };

      const missingPairs = gaps.reduce((n, g) => n + g.missingLocales.length, 0);
      totalGaps += gaps.length;
      totalMissingPairs += missingPairs;

      console.log(
        `  ${docType} / ${docLabel}: ${gaps.length} fields × avg ${(missingPairs / gaps.length).toFixed(1)} locales = ${missingPairs} missing`,
      );
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Documents with gaps: ${Object.keys(report).length}`);
  console.log(`   Total (field × locale) pairs missing: ${totalMissingPairs}`);
  console.log(`   Total fields that have >=1 missing locale: ${totalGaps}`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n✅ Wrote gap report to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error("❌ gap-report failed:", err);
  process.exit(1);
});
