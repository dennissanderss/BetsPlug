#!/usr/bin/env node
/**
 * Apply hand-authored translations to Sanity
 * ────────────────────────────────────────────────────────────
 * Reads JSON files under `scripts/hardcoded-translations/*.json`,
 * each file containing a batch of translations authored for a
 * single Sanity document, and patches them in.
 *
 * Input format (per file):
 *   {
 *     "_docId": "leagueHub-premier-league",
 *     "_type": "leagueHub",
 *     "_label": "Premier League",
 *     "fields": {
 *       "tagline":    { "pt": "...", "tr": "...", "pl": "..." },
 *       "intro":      { "pt": "...", "tr": "..." },
 *       "faqs[faq-0].answer": { "pt": "...", "tr": "..." }
 *     }
 *   }
 *
 * Path grammar:
 *   Plain field name:            "title"
 *   Nested:                      "nested.field"
 *   Array item by _key:          "faqs[faq-0].answer"
 *   Array item by index:         "sections[2].heading"
 *
 * Run:
 *   SANITY_API_TOKEN=xxx node scripts/apply-hardcoded-translations.mjs
 *   node scripts/apply-hardcoded-translations.mjs --dry-run
 *   node scripts/apply-hardcoded-translations.mjs --file homepage.json
 */
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_DIR = path.join(__dirname, "hardcoded-translations");

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

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg =
  args.find((a) => a.startsWith("--file="))?.split("=")[1] ??
  (args.includes("--file") ? args[args.indexOf("--file") + 1] : null);

/* ── path parsing ───────────────────────────────────────────── */

/**
 * Parse a path like `faqs[faq-0].answer` into a Sanity patch-path
 * segment list. Supports both `_key` and numeric-index array access.
 * Returns:
 *   [
 *     { type: "field", name: "faqs" },
 *     { type: "keyed", key: "faq-0" } | { type: "index", i: 0 },
 *     { type: "field", name: "answer" }
 *   ]
 */
function parsePath(p) {
  const tokens = [];
  const rx = /([a-zA-Z0-9_-]+)|\[([^\]]+)\]|\./g;
  let m;
  while ((m = rx.exec(p)) !== null) {
    if (m[1]) tokens.push({ type: "field", name: m[1] });
    else if (m[2]) {
      const raw = m[2];
      if (/^\d+$/.test(raw)) tokens.push({ type: "index", i: Number(raw) });
      else tokens.push({ type: "keyed", key: raw });
    }
  }
  return tokens;
}

/**
 * Convert token list to Sanity-patch-compatible string path.
 * Sanity accepts `foo.bar`, `foo[0].bar`, `foo[_key=="abc"].bar`.
 * For locale-objects we append `.<locale>` at the very end — caller
 * appends via the translations map.
 */
function toPatchPath(tokens) {
  let out = "";
  for (const t of tokens) {
    if (t.type === "field") out += out ? `.${t.name}` : t.name;
    else if (t.type === "keyed") out += `[_key=="${t.key}"]`;
    else if (t.type === "index") out += `[${t.i}]`;
  }
  return out;
}

/* ── apply one document ─────────────────────────────────────── */

async function applyOne(batch) {
  const { _docId: docId, _label: label, fields } = batch;
  if (!docId || typeof fields !== "object") {
    console.warn(`  ⏭️  skipping malformed batch (label=${label ?? "?"})`);
    return { patchedFields: 0, patchedLocales: 0 };
  }

  // Group path → locale → value into a single Sanity patch set so
  // we do one round-trip per doc instead of one per field.
  const patchOp = {};
  let localeCount = 0;
  for (const [fieldPath, localeMap] of Object.entries(fields)) {
    if (!localeMap || typeof localeMap !== "object") continue;
    const tokens = parsePath(fieldPath);
    const base = toPatchPath(tokens);
    for (const [locale, value] of Object.entries(localeMap)) {
      if (typeof value !== "string" || value.length === 0) continue;
      patchOp[`${base}.${locale}`] = value;
      localeCount++;
    }
  }

  if (localeCount === 0) {
    console.log(`  ⏭️  ${label ?? docId}: no valid translations in batch`);
    return { patchedFields: 0, patchedLocales: 0 };
  }

  if (dryRun) {
    console.log(
      `  📝 DRY ${label ?? docId}: would patch ${Object.keys(fields).length} fields × ${localeCount} locale values`,
    );
    return {
      patchedFields: Object.keys(fields).length,
      patchedLocales: localeCount,
    };
  }

  try {
    await client.patch(docId).set(patchOp).commit();
    console.log(
      `  ✅ ${label ?? docId}: patched ${Object.keys(fields).length} fields × ${localeCount} locale values`,
    );
    return {
      patchedFields: Object.keys(fields).length,
      patchedLocales: localeCount,
    };
  } catch (err) {
    console.error(`  ❌ ${label ?? docId}: ${err.message}`);
    return { patchedFields: 0, patchedLocales: 0 };
  }
}

/* ── main ───────────────────────────────────────────────────── */

async function main() {
  if (!fs.existsSync(TRANSLATIONS_DIR)) {
    console.error(`❌ ${TRANSLATIONS_DIR} does not exist`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(TRANSLATIONS_DIR)
    .filter((f) => f.endsWith(".json"));

  const filtered = fileArg ? files.filter((f) => f === fileArg || f === `${fileArg}.json`) : files;

  if (filtered.length === 0) {
    console.error(`❌ no translation files found${fileArg ? ` matching "${fileArg}"` : ""}`);
    process.exit(1);
  }

  console.log(`🛠  Applying hand-authored translations${dryRun ? " (dry-run)" : ""}`);
  console.log(`   Files: ${filtered.join(", ")}\n`);

  let totalFields = 0;
  let totalLocales = 0;

  for (const file of filtered) {
    const full = path.join(TRANSLATIONS_DIR, file);
    let batch;
    try {
      batch = JSON.parse(fs.readFileSync(full, "utf-8"));
    } catch (err) {
      console.error(`  ❌ ${file}: JSON parse failed — ${err.message}`);
      continue;
    }
    // Allow a file to be either one batch object or an array of batches.
    const batches = Array.isArray(batch) ? batch : [batch];
    for (const b of batches) {
      const res = await applyOne(b);
      totalFields += res.patchedFields;
      totalLocales += res.patchedLocales;
    }
  }

  console.log(
    `\n🎉 ${dryRun ? "Would have patched" : "Patched"} ${totalFields} fields / ${totalLocales} locale values across ${filtered.length} file${filtered.length === 1 ? "" : "s"}.`,
  );
}

main().catch((err) => {
  console.error("❌ patcher crashed:", err);
  process.exit(1);
});
