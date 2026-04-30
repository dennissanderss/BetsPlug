#!/usr/bin/env node
/**
 * Extract the homepage-FAQ + nav + hero + footer leaks for the 4
 * indexable non-NL locales (de, fr, es, it). The output JSON has
 * the same shape that `apply-i18n-batch.mjs` consumes — feed it
 * back through that script after hand-authoring corrections.
 */
import fs from "fs";

const report = JSON.parse(fs.readFileSync("scripts/i18n-leak-report.json", "utf-8"));

const TARGET_LOCALES = ["de", "fr", "es", "it"];
const HIGH_IMPACT_NS = [
  "faq.home",
  "faq.about",
  "faq.how",
  "faq.pred",
  "hero",
  "nav",
  "footer",
  "topbar",
  "homepage",
  "pricing.cta",
  "pricing.elite",
  "engine.val",
];

function isHighImpact(key) {
  return HIGH_IMPACT_NS.some((ns) => key.startsWith(ns));
}

const out = {};
for (const loc of TARGET_LOCALES) {
  const leaks = (report[loc] ?? []).filter((l) => isHighImpact(l.key));
  if (!leaks.length) continue;
  out[loc] = {};
  for (const { key, value } of leaks) {
    // value is the EN string that leaked — preserved here as the
    // template that needs hand-authored translation.
    out[loc][key] = value;
  }
}

fs.writeFileSync(
  "scripts/high-impact-leak-shell.json",
  JSON.stringify(out, null, 2),
);

let total = 0;
for (const [loc, keys] of Object.entries(out)) {
  total += Object.keys(keys).length;
  console.log(`  ${loc}: ${Object.keys(keys).length} high-impact leaks`);
}
console.log(`\nTotal: ${total} keys × locale combinations to hand-translate.`);
console.log(`Shell written: scripts/high-impact-leak-shell.json`);
console.log(`\nNext: replace each EN value with the locale-appropriate`);
console.log(`translation, then run apply-i18n-batch.mjs --file ...`);
