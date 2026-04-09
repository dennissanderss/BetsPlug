/**
 * One-time script to split the monolithic messages.ts into per-language files.
 * Run with: node frontend/src/i18n/split-messages.mjs
 * Then delete this file.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, "messages.ts"), "utf8");
const lines = src.split("\n");

// Known line boundaries (1-indexed) from grep analysis
const langBlocks = {
  nl: { start: 1234, end: 2408 },
  de: { start: 2411, end: 3218 },
  fr: { start: 3221, end: 4028 },
  es: { start: 4031, end: 4838 },
  it: { start: 4841, end: 5648 },
};

const outDir = join(__dirname, "messages");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const [lang, { start, end }] of Object.entries(langBlocks)) {
  const block = lines.slice(start - 1, end);
  const objectBody = block.join("\n");

  // Replace "const xx: Dictionary = {" with proper export syntax
  const fileContent =
    `import type { Dictionary } from "../messages";\n\n` +
    objectBody.replace(
      new RegExp(`^const ${lang}: Dictionary = \\{`),
      `const ${lang}: Dictionary = {`
    ) +
    `\n\nexport default ${lang};\n`;

  writeFileSync(join(outDir, `${lang}.ts`), fileContent, "utf8");
  console.log(`Wrote ${lang}.ts (${block.length} lines)`);
}

// Build new messages.ts
// Extract the en block (lines 1-1231) + type exports + new loader
const enBlock = lines.slice(0, 1231); // Lines 1-1231 include en + type exports

const newMessages = `${enBlock.join("\n")}

/* ── Lazy-loaded locale dictionaries ──────────────────────── */
/*
 * Non-English translations live in ./messages/<locale>.ts and
 * are loaded on demand via dynamic import(). This keeps the
 * initial bundle small: only English ships with every page.
 * The first call for a locale loads & caches the dictionary.
 */

const cache: Partial<Record<string, Dictionary>> = {};

async function loadDictionary(locale: string): Promise<Dictionary> {
  if (cache[locale]) return cache[locale]!;

  let dict: Dictionary = {};
  switch (locale) {
    case "nl":
      dict = (await import("./messages/nl")).default;
      break;
    case "de":
      dict = (await import("./messages/de")).default;
      break;
    case "fr":
      dict = (await import("./messages/fr")).default;
      break;
    case "es":
      dict = (await import("./messages/es")).default;
      break;
    case "it":
      dict = (await import("./messages/it")).default;
      break;
    default:
      break;
  }
  cache[locale] = dict;
  return dict;
}

/**
 * Pre-load a locale dictionary into the cache.
 * Call this once from the locale provider so \`translate()\` can
 * stay synchronous.
 */
export async function preloadLocale(locale: string): Promise<void> {
  if (locale !== "en") await loadDictionary(locale);
}

/**
 * Synchronous lookup used by the \`t()\` helper.
 * Returns the cached translation or falls back to English.
 * The locale MUST have been pre-loaded via \`preloadLocale()\`
 * before this function is called with a non-English locale.
 */
export function translate(locale: string, key: TranslationKey): string {
  return cache[locale]?.[key] ?? en[key];
}
`;

writeFileSync(join(__dirname, "messages.ts.new"), newMessages, "utf8");
console.log("Wrote messages.ts.new");
console.log("Done! Now:");
console.log("  1. Rename messages.ts.new -> messages.ts");
console.log("  2. Update locale-provider.tsx to call preloadLocale()");
console.log("  3. Update config.ts to remove sw and id");
console.log("  4. Delete this script file");
