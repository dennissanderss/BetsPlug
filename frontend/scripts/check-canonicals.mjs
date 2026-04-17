#!/usr/bin/env node
/**
 * check-canonicals — fail if any page hardcodes its canonical
 * path instead of using `getLocalizedAlternates()` from
 * `src/lib/seo-helpers`.
 *
 * The bug this catches: writing
 *
 *     alternates: { canonical: `/match-predictions/${hub.slug}` }
 *
 * which renders as `https://betsplug.com/match-predictions/premier-league`
 * on EVERY locale, so /nl /de /fr all point to the English URL and
 * Google demotes the localised pages as duplicates.
 *
 * Runs as a pre-commit hook (opt-in, see scripts/setup-hooks.sh)
 * and in CI.
 *
 * Usage:
 *   node scripts/check-canonicals.mjs        # returns 1 on violation
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, "../src/app");

// Patterns that indicate a hardcoded canonical string inside
// `alternates: { canonical: <something> }`.
//   ✓  canonical: alternates.canonical          (good)
//   ✓  canonical: getLocalizedAlternates(…).canonical
//   ✗  canonical: "/some/path"
//   ✗  canonical: `/some/${var}`
const HARD_CODED_CANONICAL_RE =
  /alternates\s*:\s*\{[^}]*canonical\s*:\s*(?:"[^"]+"|`[^`]+`)/s;

const ALLOWED_PATTERNS = [
  // Sitemap entries (not page metadata)
  /sitemap\.xml/,
  // Data-only files that just DECLARE a `canonical` field in their schema
  /"canonical"\s*:\s*string/,
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walk(p));
    } else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      results.push(p);
    }
  }
  return results;
}

function check(file) {
  const content = fs.readFileSync(file, "utf-8");
  // Skip obviously allowed files (sitemap route etc.).
  if (ALLOWED_PATTERNS.some((re) => re.test(file))) return null;

  // Only inspect metadata blocks in page.tsx / layout.tsx.
  if (!/page\.tsx$|layout\.tsx$/.test(file)) return null;

  const match = HARD_CODED_CANONICAL_RE.exec(content);
  if (!match) return null;

  const lineNum = content.slice(0, match.index).split("\n").length;
  return { file, line: lineNum, snippet: match[0].slice(0, 160) };
}

const files = walk(APP_DIR);
const violations = [];
for (const f of files) {
  const v = check(f);
  if (v) violations.push(v);
}

if (violations.length === 0) {
  console.log("✓ No hardcoded canonicals found.");
  process.exit(0);
}

console.error("✗ Hardcoded canonical(s) found — use getLocalizedAlternates() instead:");
for (const v of violations) {
  const rel = path.relative(process.cwd(), v.file);
  console.error(`\n  ${rel}:${v.line}`);
  console.error(`    ${v.snippet.replace(/\s+/g, " ").trim()}`);
}
console.error(
  "\n  Correct pattern:\n" +
    "    import { getLocalizedAlternates } from '@/lib/seo-helpers';\n" +
    "    const alt = getLocalizedAlternates('/your/canonical/path');\n" +
    "    return {\n" +
    "      alternates: { canonical: alt.canonical, languages: alt.languages },\n" +
    "    };\n",
);
process.exit(1);
