#!/usr/bin/env node
/**
 * Read i18n-leak-report.json and produce per-locale-group source
 * files for translation agents. Each output is `{ locale: { key:
 * "EN string" } }` so the agent can hand-author the translation.
 */
import fs from "fs";

const HIGH_IMPACT_PREFIXES = [
  "sidebar.", "upgrade.", "tier.", "tierEmpty.", "subscription.",
  "date.", "auth.", "login.", "register.", "forgotPassword.",
  "resetPassword.", "verifyEmail.", "admin.", "results.", "botd.",
  "trackRecord.", "predictions.", "matches.", "checkout.",
];

// One-word brand entities + short proper nouns we never translate.
const BRAND_PASSTHROUGHS = new Set([
  "Free", "Silver", "Gold", "Platinum", "Bronze", "Free Access",
  "BetsPlug", "Pulse", "BTTS", "ROI", "xG", "Elo", "Poisson",
  "XGBoost", "Ensemble", "Live", "Reports", "Stripe", "Apple",
  "Google", "Telegram", "Pick of the Day", "Track Record",
  "Trackrecord", "Dashboard", "Brier Score", "Conf.", "Odds",
  "Pick", "correct", "CORRECT", "Online", "Account",
  "Strategy Lab", "Strategy", "FT",
]);

function isHigh(key) {
  return HIGH_IMPACT_PREFIXES.some((p) => key.startsWith(p));
}

function isBrandPassthrough(value) {
  return BRAND_PASSTHROUGHS.has(value);
}

const report = JSON.parse(fs.readFileSync("scripts/i18n-leak-report.json", "utf-8"));

// Group locales for parallel agents
const LOCALE_GROUPS = {
  "set-1": ["nl", "de", "fr", "es", "it"],   // West-Europe
  "set-2": ["pt", "tr", "pl", "ro", "ru"],   // South + East
  "set-3": ["el", "da", "sv", "sw", "id"],   // North + Other
};

for (const [setName, locales] of Object.entries(LOCALE_GROUPS)) {
  const out = {};
  let totalKeys = 0;
  for (const locale of locales) {
    const leaks = report[locale] || [];
    out[locale] = {};
    for (const { key, value } of leaks) {
      if (!isHigh(key)) continue;
      if (isBrandPassthrough(value)) continue;
      // Skip very short labels that are likely brand-style across locales
      if (value.length < 4 && !/[a-z]{4,}/.test(value)) continue;
      out[locale][key] = value;
    }
    totalKeys += Object.keys(out[locale]).length;
  }
  const file = `scripts/i18n-leak-${setName}.json`;
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(
    `  ${setName} (${locales.join(",")}): ${totalKeys} keys → ${file}`,
  );
}
