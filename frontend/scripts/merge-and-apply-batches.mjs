#!/usr/bin/env node
/**
 * Merge two i18n batch JSONs (set-A + set-B) into one, then apply via
 * the existing apply-i18n-batch.mjs.
 *
 * Use this when translation work is split across multiple parallel
 * agents — each agent writes its own JSON for its slice of locales,
 * and this script stitches them together before patching.
 */
import fs from "fs";
import { execSync } from "child_process";

const SET_A = "scripts/i18n-batch-set-A.json";
const SET_B = "scripts/i18n-batch-set-B.json";
const MERGED = "scripts/i18n-batch-merged.json";

if (!fs.existsSync(SET_A)) {
  console.error(`❌ ${SET_A} not found — run translation agents first.`);
  process.exit(1);
}
if (!fs.existsSync(SET_B)) {
  console.error(`❌ ${SET_B} not found — run translation agents first.`);
  process.exit(1);
}

const a = JSON.parse(fs.readFileSync(SET_A, "utf-8"));
const b = JSON.parse(fs.readFileSync(SET_B, "utf-8"));

// Sanity check: locales should not overlap.
const overlap = Object.keys(a).filter((l) => l in b);
if (overlap.length > 0) {
  console.warn(`⚠ Locales overlap between A and B: ${overlap.join(", ")}`);
  console.warn(`  Set B will overwrite Set A for these locales.`);
}

const merged = { ...a, ...b };
const locales = Object.keys(merged);
const keysPerLocale = Object.keys(merged[locales[0]] ?? {}).length;

fs.writeFileSync(MERGED, JSON.stringify(merged, null, 2));
console.log(`✅ Merged: ${locales.length} locales × ${keysPerLocale} keys`);
console.log(`   → ${MERGED}`);

// Now apply via the existing patcher.
console.log(`\n🛠  Applying merged batch via apply-i18n-batch.mjs…\n`);
execSync(
  `node scripts/apply-i18n-batch.mjs --file=${MERGED}`,
  { stdio: "inherit" },
);
