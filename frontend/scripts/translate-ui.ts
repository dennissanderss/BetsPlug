/**
 * DeepL auto-translation for UI strings
 * ────────────────────────────────────────────────────────────
 * Reads the English source dictionary from messages.ts, compares
 * with each locale file, and fills in missing translations via
 * DeepL API. Existing translations are never overwritten.
 *
 * Run: npx tsx --env-file=.env.local scripts/translate-ui.ts
 */
import * as fs from "fs";
import * as path from "path";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error("❌ DEEPL_API_KEY not set in .env.local");
  process.exit(1);
}

// DeepL Free API endpoint (ends with :fx)
const DEEPL_URL = DEEPL_API_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

// DeepL language codes (some differ from our locale codes)
const DEEPL_LANG: Record<string, string> = {
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  sw: "SW", // DeepL doesn't support Swahili — will skip
  id: "ID",
};

// Locales to process (nl is inline in messages.ts, handled separately)
const FILE_LOCALES = ["de", "fr", "es", "it", "sw", "id"] as const;

const FRONTEND_ROOT = path.resolve(__dirname, "..");
const MESSAGES_PATH = path.join(FRONTEND_ROOT, "src/i18n/messages.ts");
const LOCALES_DIR = path.join(FRONTEND_ROOT, "src/i18n/locales");

// ── Parse English keys from messages.ts ───────────────────

function parseEnglishKeys(): Record<string, string> {
  const src = fs.readFileSync(MESSAGES_PATH, "utf-8");
  // Extract the `const en = { ... }` block (first object literal)
  const enStart = src.indexOf("const en = {");
  if (enStart === -1) throw new Error("Cannot find 'const en = {' in messages.ts");

  let depth = 0;
  let start = -1;
  let end = -1;
  for (let i = enStart; i < src.length; i++) {
    if (src[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (src[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (start === -1 || end === -1) throw new Error("Cannot parse en object bounds");

  // Parse key-value pairs using regex on the raw text
  const block = src.slice(start, end);
  const keys: Record<string, string> = {};
  const re = /"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    keys[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
  return keys;
}

// ── Parse existing locale file ────────────────────────────

function parseLocaleFile(locale: string): Record<string, string> {
  const filePath = path.join(LOCALES_DIR, `${locale}.ts`);
  if (!fs.existsSync(filePath)) return {};

  const src = fs.readFileSync(filePath, "utf-8");
  const keys: Record<string, string> = {};
  const re = /"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    keys[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
  return keys;
}

// ── DeepL translation ─────────────────────────────────────

async function translateBatch(
  texts: string[],
  targetLang: string,
): Promise<string[]> {
  // DeepL doesn't support Swahili
  if (targetLang === "SW") {
    return texts; // Return English as fallback
  }

  const batchSize = 50; // DeepL limit per request
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const body = {
      text: batch,
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
      throw new Error(`DeepL API error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as { translations: { text: string }[] };
    results.push(...data.translations.map((t) => t.text));

    // Rate limiting
    if (i + batchSize < texts.length) await sleep(200);
  }

  return results;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Write locale file ─────────────────────────────────────

function writeLocaleFile(locale: string, keys: Record<string, string>) {
  const filePath = path.join(LOCALES_DIR, `${locale}.ts`);

  const entries = Object.entries(keys)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const escaped = v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      return `  "${k}": "${escaped}",`;
    })
    .join("\n");

  const content = `import type { TranslationKey } from '../messages';\nconst ${locale} = {\n${entries}\n} satisfies Partial<Record<TranslationKey, string>>;\nexport default ${locale};\n`;

  fs.writeFileSync(filePath, content, "utf-8");
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log("🌍 DeepL UI Translation Script\n");

  const enKeys = parseEnglishKeys();
  const enCount = Object.keys(enKeys).length;
  console.log(`📖 English source: ${enCount} keys\n`);

  let totalTranslated = 0;
  let totalChars = 0;

  for (const locale of FILE_LOCALES) {
    const deepLang = DEEPL_LANG[locale];
    if (!deepLang) {
      console.log(`⚠️  ${locale}: no DeepL language code, skipping`);
      continue;
    }

    const existing = parseLocaleFile(locale);
    const existingCount = Object.keys(existing).length;

    // Find missing keys
    const missing: [string, string][] = [];
    for (const [key, enValue] of Object.entries(enKeys)) {
      if (!existing[key]) {
        missing.push([key, enValue]);
      }
    }

    if (missing.length === 0) {
      console.log(`✅ ${locale}: ${existingCount}/${enCount} keys — complete`);
      continue;
    }

    console.log(
      `🔄 ${locale}: ${existingCount}/${enCount} keys — ${missing.length} missing, translating...`,
    );

    // Translate missing values
    const textsToTranslate = missing.map(([, v]) => v);
    const translated = await translateBatch(textsToTranslate, deepLang);

    // Merge: keep existing, add new translations
    const merged = { ...existing };
    for (let i = 0; i < missing.length; i++) {
      merged[missing[i][0]] = translated[i];
    }

    writeLocaleFile(locale, merged);

    const chars = textsToTranslate.reduce((sum, t) => sum + t.length, 0);
    totalTranslated += missing.length;
    totalChars += chars;

    console.log(
      `   ✅ Added ${missing.length} translations (${chars.toLocaleString()} chars)`,
    );
  }

  // Handle NL (inline in messages.ts) — report only, don't auto-edit
  const nlKeys = parseNlKeys();
  const nlMissing = Object.keys(enKeys).filter((k) => !nlKeys[k]);
  if (nlMissing.length > 0) {
    console.log(
      `\n⚠️  nl: ${nlMissing.length} missing keys (inline in messages.ts, manual update needed)`,
    );
  } else {
    console.log(`\n✅ nl: complete (inline in messages.ts)`);
  }

  console.log(
    `\n🎉 Done! Translated ${totalTranslated} keys (${totalChars.toLocaleString()} chars via DeepL)`,
  );
}

function parseNlKeys(): Record<string, string> {
  const src = fs.readFileSync(MESSAGES_PATH, "utf-8");
  const nlStart = src.indexOf("const nl");
  if (nlStart === -1) return {};

  let depth = 0;
  let start = -1;
  let end = -1;
  for (let i = nlStart; i < src.length; i++) {
    if (src[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (src[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (start === -1 || end === -1) return {};
  const block = src.slice(start, end);
  const keys: Record<string, string> = {};
  const re = /"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    keys[m[1]] = m[2];
  }
  return keys;
}

main().catch((err) => {
  console.error("❌ Translation failed:", err);
  process.exit(1);
});
