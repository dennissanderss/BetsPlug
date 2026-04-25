#!/usr/bin/env node
/**
 * CI check: no hardcoded isNl/locale-ternary UI strings in components
 * ────────────────────────────────────────────────────────────
 * Fails the build if any `.tsx` file under `src/` contains:
 *   - `isNl ? "X" : "Y"`                    (two-locale shortcut)
 *   - `locale === "nl" ? "X" : "Y"`         (same shortcut, different phrasing)
 *
 * These patterns bypass the i18n dictionary and cause every non-NL
 * visitor to see English fallback — exactly what broke brand SEO
 * in April 2026. All UI strings MUST flow through `t("key")` + the
 * full 16-locale dictionary.
 *
 * Exclusions — these are legitimate (not UI strings):
 *   - `isNl ? "nl" : "en"`              — language code passthrough to data helpers
 *   - `locale === "nl" ? "nl" : "en"`   — same
 *   - `[editorialLocale]`                — Sanity per-locale field lookup
 *   - Files under src/app/(app)/         — authed routes, tracked separately
 *
 * Usage:
 *   node scripts/check-no-hardcoded-strings.mjs              # exit 1 on violations
 *   node scripts/check-no-hardcoded-strings.mjs --fix-hint   # suggest i18n key names
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, "../src");

// Directories where this check is enforced. (app) is EXCLUDED because
// authed routes have their own cadence and are not SEO-critical.
const INCLUDE_DIRS = [
  path.join(SRC_DIR, "app"),
  path.join(SRC_DIR, "components"),
];
const EXCLUDE_PATHS = [
  path.join(SRC_DIR, "app/(app)"),
  path.join(SRC_DIR, "app/api"),
  path.join(SRC_DIR, "app/studio"),
  // Dashboard components are authed-only; tracked in a separate
  // sub-sprint. Public-site lockdown happens first.
  path.join(SRC_DIR, "components/dashboard"),
];

// Literal values that are legitimate (not UI text) — BCP-47 locale
// codes, HTML lang codes, Intl format options, etc. If BOTH sides
// of the ternary match one of these, the ternary is skipped.
const NON_UI_LITERAL = [
  /^[a-z]{2}$/,               //  "nl", "en", "de"
  /^[a-z]{2}-[A-Z]{2}$/,      //  "nl-NL", "en-GB", "de-DE"
  /^[a-z]{2}_[A-Z]{2}$/,      //  "nl_NL" (some libs want underscore)
];

function isNonUiLiteral(value) {
  return NON_UI_LITERAL.some((rx) => rx.test(value));
}

// Pattern that flags violations. Supports both string literals
// ("…"/'…') and template literals (`…`). We capture both branch
// values so we can post-filter out non-UI literals (BCP-47 codes)
// and true-passthroughs (where both sides are byte-identical).
const HARDCODED_PATTERNS = [
  {
    name: "isNl ternary",
    regex:
      /\bisNl\s*\?\s*(["'`])([^"'`]{2,}?)\1\s*:\s*(["'`])([^"'`]{2,}?)\3/gs,
    leftGroup: 2,
    rightGroup: 4,
  },
  {
    name: 'locale === "nl" ternary',
    regex:
      /locale\s*===\s*["']nl["']\s*\?\s*(["'`])([^"'`]{2,}?)\1\s*:\s*(["'`])([^"'`]{2,}?)\3/gs,
    leftGroup: 2,
    rightGroup: 4,
  },
];

function isExcluded(absPath) {
  return EXCLUDE_PATHS.some((p) => absPath.startsWith(p));
}

function walkTsx(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (isExcluded(full)) continue;
    if (entry.isDirectory()) {
      walkTsx(full, out);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      // Skip test + config files
      if (/\.(test|spec)\.(tsx?|ts)$/.test(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function relFromRepo(abs) {
  return path.relative(path.join(__dirname, ".."), abs);
}

function checkFile(file) {
  const content = fs.readFileSync(file, "utf-8");
  const violations = [];
  for (const { name, regex, leftGroup, rightGroup } of HARDCODED_PATTERNS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const leftValue = m[leftGroup];
      const rightValue = m[rightGroup];
      // Skip passthroughs: both sides are "nl"/"en"/BCP-47 codes.
      if (isNonUiLiteral(leftValue) && isNonUiLiteral(rightValue)) continue;
      // Skip identical branches — a no-op ternary is harmless.
      if (leftValue === rightValue) continue;
      const before = content.slice(0, m.index);
      const line = before.split("\n").length;
      const col = before.length - before.lastIndexOf("\n");
      violations.push({
        file: relFromRepo(file),
        line,
        col,
        type: name,
        snippet: m[0].replace(/\s+/g, " ").slice(0, 120),
      });
    }
  }
  return violations;
}

/* ── Main ─────────────────────────────────────────────────────── */

// Accept args as an allowlist of files to scan. With no args, scan
// the whole repo (CI fallback). The pre-commit hook passes only
// staged files so pre-existing violations in untouched files don't
// block an unrelated commit.
const REPO_ROOT = path.join(__dirname, "..");
const argFiles = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const scanAll = process.argv.includes("--all") || argFiles.length === 0;

let files;
if (scanAll) {
  files = INCLUDE_DIRS.flatMap((d) => walkTsx(d));
} else {
  files = argFiles
    .map((f) => (path.isAbsolute(f) ? f : path.join(REPO_ROOT, f)))
    .filter((abs) => {
      if (!fs.existsSync(abs)) return false;
      if (!/\.(tsx|ts)$/.test(abs)) return false;
      if (isExcluded(abs)) return false;
      if (!INCLUDE_DIRS.some((d) => abs.startsWith(d))) return false;
      return true;
    });
}

const allViolations = files.flatMap((f) => checkFile(f));

if (allViolations.length === 0) {
  console.log(
    `✓ No hardcoded isNl/locale ternaries in ${files.length} files checked.`,
  );
  process.exit(0);
}

console.error(
  `✗ Found ${allViolations.length} hardcoded locale ternary ` +
    `violation${allViolations.length === 1 ? "" : "s"} across ` +
    `${new Set(allViolations.map((v) => v.file)).size} file` +
    `${new Set(allViolations.map((v) => v.file)).size === 1 ? "" : "s"}:`,
);
console.error("");

// Group by file for readable output
const byFile = new Map();
for (const v of allViolations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}

for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    :${v.line}:${v.col}  [${v.type}]`);
    console.error(`      ${v.snippet}`);
  }
  console.error("");
}

console.error(
  "Every UI string must go through the i18n dictionary. Extract each\n" +
    "ternary to a translation key:\n" +
    '  - Add `"my.key": "English text"` to messages.ts en + nl blocks\n' +
    "  - Replace the ternary with `t(\"my.key\")` via useTranslations()\n" +
    "  - Run `npm run translate` to populate the 14 aux locales\n" +
    "\n" +
    "Full rationale + conventions: see CLAUDE.md § i18n.",
);

process.exit(1);
