#!/usr/bin/env node
/**
 * Apply hand-authored UI translations to locale files
 * ────────────────────────────────────────────────────────────
 * Companion to `translate.mjs` for cases where Google Translate
 * hits rate limits (>1000 calls/min on the free endpoint) and
 * silently writes EN as fallback. When that happens, ask Claude
 * to hand-author the missing translations as a JSON batch, then
 * run this script to patch every locale file in one shot.
 *
 * Input format (default: scripts/i18n-batch.json):
 *   {
 *     "de": {
 *       "sidebar.tierAccuracy": "Deine Tier-Genauigkeit",
 *       "upgrade.now": "Jetzt upgraden",
 *       …
 *     },
 *     "fr": { … },
 *     …  (one entry per target locale)
 *   }
 *
 * Behavior:
 *   - If the key already exists in the locale file, its value is
 *     replaced (idempotent).
 *   - If the key is new, it's appended just before the closing `};`.
 *   - Strings are escaped for TS double-quoted literals — backslashes
 *     and `"` get the right backslash treatment.
 *
 * Usage:
 *   node scripts/apply-i18n-batch.mjs                       # default file
 *   node scripts/apply-i18n-batch.mjs --file batch-foo.json # custom file
 *   node scripts/apply-i18n-batch.mjs --dry-run             # preview only
 *
 * After patching, commit the locale files. The pre-commit hook will
 * NOT re-run the translator on these — it only fires when
 * messages.ts changes. So hand-authored translations stick.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "src", "i18n", "locales");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg =
  args.find((a) => a.startsWith("--file="))?.split("=")[1] ??
  (args.includes("--file") ? args[args.indexOf("--file") + 1] : null);

const BATCH_FILE = fileArg
  ? path.resolve(fileArg)
  : path.join(__dirname, "i18n-batch.json");

if (!fs.existsSync(BATCH_FILE)) {
  console.error(`❌ batch file not found: ${BATCH_FILE}`);
  console.error(`   pass --file=path/to/batch.json or create scripts/i18n-batch.json`);
  process.exit(1);
}

const batch = JSON.parse(fs.readFileSync(BATCH_FILE, "utf-8"));
const locales = Object.keys(batch);

console.log(
  `🛠  Applying hand-authored UI translations${dryRun ? " (dry-run)" : ""}`,
);
console.log(`   Source: ${path.relative(process.cwd(), BATCH_FILE)}`);
console.log(`   Locales: ${locales.join(", ")}\n`);

let totalPatched = 0;
let totalAdded = 0;

for (const locale of locales) {
  const filePath = path.join(LOCALES_DIR, `${locale}.ts`);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⏭️  ${locale}: locale file does not exist, skipping`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf-8");
  const translations = batch[locale];
  let patched = 0;
  let added = 0;

  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== "string") continue;
    // TS double-quoted string escape: \ first, then "
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const newLine = `  "${key}": "${escaped}",`;

    // Match an existing line for this key (start-of-line, two-space indent,
    // same key, no trailing context).
    const lineRx = new RegExp(
      `^  "${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":[^\\n]*$`,
      "m",
    );

    if (lineRx.test(content)) {
      content = content.replace(lineRx, newLine);
      patched++;
    } else {
      // Append before the closing brace. Locale files end with
      //   } as Record<TranslationKey, string>;
      // while messages.ts uses plain `};`. Handle both.
      const closingRx = /\n(\}\s*(?:as\s+[^;]+)?;)/;
      const before = content;
      content = content.replace(closingRx, `\n${newLine}\n$1`);
      if (content === before) {
        console.warn(
          `  ⚠️  ${locale}: could not find closing brace for key "${key}"`,
        );
      }
      added++;
    }
  }

  if (!dryRun) fs.writeFileSync(filePath, content);
  console.log(
    `  ${dryRun ? "📝" : "✅"} ${locale}: ${patched} replaced + ${added} added`,
  );
  totalPatched += patched;
  totalAdded += added;
}

console.log(
  `\n🎉 ${dryRun ? "Would have written" : "Wrote"} ${totalPatched + totalAdded} keys ` +
    `(${totalPatched} replaced, ${totalAdded} added) across ${locales.length} locales.`,
);
