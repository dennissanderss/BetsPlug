/**
 * DeepL auto-translation for Sanity CMS content
 * ────────────────────────────────────────────────────────────
 * Reads Sanity documents with localized fields, detects empty
 * non-English locales, translates from English via DeepL, and
 * patches the documents.
 *
 * Run: npx tsx --env-file=.env.local scripts/translate-sanity.ts
 */
import { createClient } from "@sanity/client";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

if (!DEEPL_API_KEY) { console.error("❌ DEEPL_API_KEY not set"); process.exit(1); }
if (!SANITY_TOKEN) { console.error("❌ SANITY_API_TOKEN not set"); process.exit(1); }

const client = createClient({
  projectId: "nk7ioy85",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: SANITY_TOKEN,
});

const DEEPL_URL = DEEPL_API_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

const TARGET_LOCALES = ["nl", "de", "fr", "es", "it", "id"] as const;
// sw (Swahili) excluded — DeepL doesn't support it

const DEEPL_LANG: Record<string, string> = {
  nl: "NL", de: "DE", fr: "FR", es: "ES", it: "IT", id: "ID",
};

// Document types with localized fields
const TYPES_WITH_LOCALE = [
  "learnPillar",
  "leagueHub",
  "betTypeHub",
  "pageMeta",
  "legalPage",
] as const;

// ── DeepL ─────────────────────────────────────────────────

async function translateText(text: string, targetLang: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const body = {
        text: [text],
        source_lang: "EN",
        target_lang: targetLang,
        preserve_formatting: true,
      };

      const res = await fetch(DEEPL_URL, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepL error (${res.status}): ${err}`);
      }

      const data = (await res.json()) as { translations: { text: string }[] };
      return data.translations[0].text;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`      ⏳ Retry ${attempt}/${retries} after error...`);
      await sleep(2000 * attempt);
    }
  }
  return text; // Unreachable, but satisfies TS
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Process a single document ─────────────────────────────

async function processDocument(doc: any): Promise<number> {
  let translated = 0;
  const patches: Record<string, unknown> = {};

  // Walk all fields looking for locale objects (have _type and en field)
  for (const [fieldName, fieldValue] of Object.entries(doc)) {
    if (fieldName.startsWith("_")) continue;

    // Direct locale field (localeString/localeText)
    if (isLocaleObject(fieldValue)) {
      const result = await translateLocaleField(fieldValue as any);
      if (result.count > 0) {
        patches[fieldName] = result.patched;
        translated += result.count;
      }
    }

    // Array of objects (faqs, sections) — check nested locale fields
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
            const result = await translateLocaleField(subVal as any);
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

  if (Object.keys(patches).length > 0) {
    await client.patch(doc._id).set(patches).commit();
  }

  return translated;
}

function isLocaleObject(val: unknown): boolean {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.en === "string" && obj.en.length > 0;
}

async function translateLocaleField(
  field: Record<string, string>,
): Promise<{ patched: Record<string, string>; count: number }> {
  const patched = { ...field };
  let count = 0;

  for (const locale of TARGET_LOCALES) {
    const deepLang = DEEPL_LANG[locale];
    if (!deepLang) continue;

    // Only translate if field is empty/missing AND English has content
    if (patched.en && (!patched[locale] || patched[locale].trim() === "")) {
      patched[locale] = await translateText(patched.en, deepLang);
      count++;
      await sleep(500); // Rate limit
    }
  }

  return { patched, count };
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log("🌍 DeepL Sanity Content Translation\n");

  let totalDocs = 0;
  let totalTranslated = 0;

  for (const docType of TYPES_WITH_LOCALE) {
    const docs = await client.fetch(`*[_type == "${docType}"]`);
    if (!docs?.length) {
      console.log(`⏭️  ${docType}: no documents`);
      continue;
    }

    console.log(`\n📄 ${docType}: ${docs.length} documents`);

    for (const doc of docs) {
      const label = doc.title?.en || doc.name?.en || doc.pageKey || doc._id;
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
    `\n🎉 Done! Processed ${totalDocs} documents, translated ${totalTranslated} fields via DeepL`,
  );
}

main().catch((err) => {
  console.error("❌ Translation failed:", err);
  process.exit(1);
});
