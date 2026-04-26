#!/usr/bin/env node
// Comprehensive hardcoded-string scan for the betsplug.com i18n overhaul.
// Targets:
//   3.1  JSX text between tags  >Some Text<
//   3.2  String literals in attributes (placeholder, aria-label, title, alt, label)
//   3.3  Toast / alert / error / throw messages
//   3.4  Form-validation messages (zod .min/.max/.email/.required/.regex/.url/.refine)
//   3.5  Constants files with UI-strings
//
// Output: prints CSV-ish summary + writes /tmp/i18n-hardcoded.json with structured hits.

import { readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const SRC = "/Users/casmeisters/Documents/Claude/Sportsbetting/sportbettool/frontend/src";

// ─── Helpers ────────────────────────────────────────────────────────────
function shell(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8" });
  } catch (e) {
    return e.stdout?.toString() || "";
  }
}

function listFiles(extensions, excludeRegex = null) {
  const cmd = `find ${SRC} -type f \\( ${extensions
    .map((e) => `-name "*.${e}"`)
    .join(" -o ")} \\)`;
  const all = shell(cmd).split("\n").filter(Boolean);
  if (!excludeRegex) return all;
  return all.filter((f) => !excludeRegex.test(f));
}

// Skip i18n / sanity / types files; tracking dashboard authed surface separately.
const EXCLUDE = /(\/i18n\/|\/sanity\/|\/types\/|\.d\.ts$|\.test\.tsx?$|\/__tests__\/)/;
const COMPONENT_FILES = listFiles(["tsx", "jsx"], EXCLUDE);
const ALL_TS_FILES = listFiles(["ts", "tsx"], EXCLUDE);

const PUBLIC_FILES = COMPONENT_FILES.filter(
  (f) => !f.includes("/(app)/") && !f.includes("/admin/")
);
const AUTHED_FILES = COMPONENT_FILES.filter(
  (f) => f.includes("/(app)/") || f.includes("/admin/")
);

// Brand whitelist — strings that legitimately stay verbatim in UI.
const BRAND = new Set([
  "BetsPlug", "Pulse", "BTTS", "ROI", "xG", "Elo", "Poisson", "XGBoost",
  "Ensemble", "Live", "Reports",
  "Free", "Silver", "Gold", "Platinum", "Bronze", "Free Access",
  "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie",
  "Champions League", "Europa League", "Conference League",
  "Stripe", "Apple", "Google", "Telegram",
  "Pick of the Day", "Bet of the Day",
  "Schalke", "Bayern", "Real Madrid", "Barcelona", "Manchester", "Chelsea",
  "Liverpool", "Arsenal", "PSV", "Ajax", "Feyenoord",
]);

// ─── 3.1: JSX text between tags ─────────────────────────────────────────
//   matches:  >Some Phrase<
//   excludes: SVG / styling-only tags, single-word content, brand names
const TAG_RX = />\s*([A-Z][a-zA-Z][a-zA-Z\s,!?:.'\-/%()0-9]{2,80})\s*</g;
// Skip lines that contain t( or i18n or t<TranslationKey> usage near the literal
const HAS_TRANSLATE_RX = /\b(t|translate|i18n|trans|FormattedMessage|Trans)\b\s*\(/;
// Skip SVG inner-content tags
const SVG_RX = /<(svg|path|circle|rect|g|defs|stop|linearGradient|radialGradient|use|symbol|line|polygon|polyline|ellipse|text)\b/;

function scanJsxText(files) {
  const hits = [];
  for (const f of files) {
    let content;
    try { content = readFileSync(f, "utf-8"); } catch { continue; }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (SVG_RX.test(line)) continue;
      // Reset regex
      TAG_RX.lastIndex = 0;
      let m;
      while ((m = TAG_RX.exec(line)) !== null) {
        const phrase = m[1].trim();
        // Filter brand only
        if (BRAND.has(phrase)) continue;
        // Single-word with no space and starts capital — most likely a CSS class fragment
        if (!/\s/.test(phrase) && phrase.length < 12) continue;
        // Pure number/punctuation
        if (!/[a-zA-Z]/.test(phrase)) continue;
        // Surrounding context translate-call — within ±3 lines of t(
        const ctx = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join("\n");
        if (HAS_TRANSLATE_RX.test(ctx)) {
          // If this line itself is inside a t() argument, skip
          if (HAS_TRANSLATE_RX.test(line)) continue;
        }
        hits.push({
          file: f.replace(SRC, "src"),
          line: i + 1,
          phrase,
          category: "jsx-text",
        });
      }
    }
  }
  return hits;
}

// ─── 3.2: Attribute literals ────────────────────────────────────────────
//   matches:  placeholder="Search teams"   aria-label="Close"
const ATTR_RX = /\b(placeholder|aria-label|title|alt|label)="([A-Z][a-zA-Z][a-zA-Z\s,!?:.'\-/%()0-9]{2,80})"/g;

function scanAttrs(files) {
  const hits = [];
  for (const f of files) {
    let content;
    try { content = readFileSync(f, "utf-8"); } catch { continue; }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      ATTR_RX.lastIndex = 0;
      let m;
      while ((m = ATTR_RX.exec(line)) !== null) {
        const phrase = m[2].trim();
        if (BRAND.has(phrase)) continue;
        if (!/\s/.test(phrase) && phrase.length < 8) continue;
        hits.push({
          file: f.replace(SRC, "src"),
          line: i + 1,
          phrase: `${m[1]}="${phrase}"`,
          category: "attribute",
        });
      }
    }
  }
  return hits;
}

// ─── 3.3: Toast / alert / throw ─────────────────────────────────────────
//   toast.error("Could not save"), throw new Error("..."), alert("...")
const TOAST_RX = /\b(toast|alert|console)\.(success|error|warning|warn|info|log)\(\s*["'`]([A-Z][a-zA-Z\s,!?:.'\-/0-9]{4,200})["'`]/g;
const THROW_RX = /throw\s+new\s+(?:Error|TypeError|RangeError)\(\s*["'`]([A-Z][a-zA-Z\s,!?:.'\-/0-9]{4,200})["'`]/g;

function scanToasts(files) {
  const hits = [];
  for (const f of files) {
    let content;
    try { content = readFileSync(f, "utf-8"); } catch { continue; }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      TOAST_RX.lastIndex = 0;
      let m;
      while ((m = TOAST_RX.exec(line)) !== null) {
        hits.push({
          file: f.replace(SRC, "src"),
          line: i + 1,
          phrase: `${m[1]}.${m[2]}("${m[3].slice(0, 70)}")`,
          category: "toast/alert/console",
        });
      }
      THROW_RX.lastIndex = 0;
      while ((m = THROW_RX.exec(line)) !== null) {
        hits.push({
          file: f.replace(SRC, "src"),
          line: i + 1,
          phrase: `throw new Error("${m[1].slice(0, 70)}")`,
          category: "throw-error",
        });
      }
    }
  }
  return hits;
}

// ─── 3.4: Zod / validation messages ─────────────────────────────────────
//   z.string().min(8, "Must be at least 8 characters")
//   .email("Invalid email")
const ZOD_RX = /\.(min|max|length|email|url|regex|refine|nonempty|required|optional)\(\s*[^)]*?["'`]([A-Z][a-zA-Z\s,!?:.'\-/0-9]{4,200})["'`]/g;

function scanZod(files) {
  const hits = [];
  for (const f of files) {
    let content;
    try { content = readFileSync(f, "utf-8"); } catch { continue; }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      ZOD_RX.lastIndex = 0;
      let m;
      while ((m = ZOD_RX.exec(lines[i])) !== null) {
        hits.push({
          file: f.replace(SRC, "src"),
          line: i + 1,
          phrase: `.${m[1]}("${m[2].slice(0, 70)}")`,
          category: "zod-validation",
        });
      }
    }
  }
  return hits;
}

// ─── Run all scans ──────────────────────────────────────────────────────
const buckets = {
  publicJsxText: scanJsxText(PUBLIC_FILES),
  publicAttrs: scanAttrs(PUBLIC_FILES),
  publicToasts: scanToasts(PUBLIC_FILES),
  authedJsxText: scanJsxText(AUTHED_FILES),
  authedAttrs: scanAttrs(AUTHED_FILES),
  authedToasts: scanToasts(AUTHED_FILES),
  zodAll: scanZod(ALL_TS_FILES),
};

// ─── Summary ────────────────────────────────────────────────────────────
console.log("\n════ HARDCODED STRING SCAN ════");
console.log(`Public files scanned:  ${PUBLIC_FILES.length}`);
console.log(`Authed files scanned:  ${AUTHED_FILES.length}`);
console.log(`Total .ts/.tsx scanned: ${ALL_TS_FILES.length}\n`);

const counts = Object.fromEntries(
  Object.entries(buckets).map(([k, v]) => [k, v.length])
);
console.log("Hits per bucket:");
for (const [k, n] of Object.entries(counts)) console.log(`  ${k.padEnd(22)} ${n}`);

// Top files (public, jsx-text + attr) — those are the highest-priority leaks
const publicByFile = {};
for (const h of [...buckets.publicJsxText, ...buckets.publicAttrs, ...buckets.publicToasts]) {
  publicByFile[h.file] = (publicByFile[h.file] || 0) + 1;
}
const authedByFile = {};
for (const h of [...buckets.authedJsxText, ...buckets.authedAttrs, ...buckets.authedToasts]) {
  authedByFile[h.file] = (authedByFile[h.file] || 0) + 1;
}

console.log("\n--- TOP 20 PUBLIC files by hardcoded-string count ---");
Object.entries(publicByFile)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([f, n]) => console.log(`  ${String(n).padStart(4)}  ${f}`));

console.log("\n--- TOP 20 AUTHED files by hardcoded-string count ---");
Object.entries(authedByFile)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([f, n]) => console.log(`  ${String(n).padStart(4)}  ${f}`));

// Save
import("fs").then(({ writeFileSync }) => {
  writeFileSync("/tmp/i18n-hardcoded.json", JSON.stringify(buckets, null, 2));
  console.log("\nRaw data: /tmp/i18n-hardcoded.json");
});
