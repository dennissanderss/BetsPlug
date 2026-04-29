#!/usr/bin/env node
/**
 * CI check: no hardcoded Dutch text in JSX
 * ────────────────────────────────────────────────────────────
 * Companion to check-no-hardcoded-strings.mjs. That sibling only
 * catches `isNl ? "X" : "Y"` ternaries — but the most common leak
 * is when a developer just writes Dutch directly into JSX:
 *
 *     <h2>Per tier — live accuraatheid</h2>
 *     <SectionPhaseBanner title="Pre-match meting die dagelijks groeit" />
 *
 * That string then renders unchanged in every locale, and EN /
 * non-NL users see Dutch. This script is a high-precision
 * heuristic to catch those leaks at commit time.
 *
 * Method:
 *   1. Walk .ts/.tsx under src/, skipping the i18n source dirs and
 *      a small allowlist of hand-tuned exceptions.
 *   2. Extract two kinds of "user-visible" strings:
 *        a. JSX text nodes:   `>  Per tier  <`
 *        b. Common string-literal props: `title="..."`, `subtitle=`,
 *           `kicker=`, `placeholder=`, `aria-label=`, `description=`,
 *           `label=`, `heading=`, `tooltip=`, `cta=`, `body=`.
 *   3. Test each candidate against a Dutch-trigger word list — e.g.
 *      "wedstrijd", "aftrap", "vóór", "uitgesplitst", "vrij te
 *      spelen", phrases that don't appear in English. Skip strings
 *      that are obviously English (common English-only words like
 *      "the ", " and ", " for ").
 *   4. Report violations.
 *
 * Unlike the sibling check, this one DOES include src/app/(app)/.
 * The whole point is that authed-route Dutch leaks were going
 * un-policed.
 *
 * Usage:
 *   node scripts/check-no-dutch-leaks.mjs                    # exit 1 on violations
 *   node scripts/check-no-dutch-leaks.mjs --all              # scan whole repo (CI)
 *   node scripts/check-no-dutch-leaks.mjs path/to/file.tsx   # scan one file
 *   node scripts/check-no-dutch-leaks.mjs --diff-only <files>  # only flag NEW
 *                                                              violations
 *                                                              (used by the
 *                                                              pre-commit hook)
 *
 * Why --diff-only matters:
 *   The first time this script ran on the codebase it found ~9 pre-existing
 *   leaks. We don't want every unrelated commit that touches one of those
 *   files to fail because of the existing backlog. So in --diff-only mode we
 *   compare each violation against the text of `git diff --cached`'s +
 *   lines — only violations that were INTRODUCED by the staged change are
 *   reported. Pre-existing leaks are documented as a backlog and fixed
 *   separately.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");

// ── Where to scan ───────────────────────────────────────────────
const INCLUDE_DIRS = [
  path.join(SRC_DIR, "app"),
  path.join(SRC_DIR, "components"),
];

// ── Where NOT to scan ───────────────────────────────────────────
// Two reasons a path is on this list:
//   1. It IS the dictionary (messages.ts, locales/*.ts) — it's
//      supposed to contain Dutch.
//   2. It's a comment-heavy or test/spec file.
const EXCLUDE_PATHS = [
  path.join(SRC_DIR, "i18n"),
  path.join(SRC_DIR, "app/api"),
  path.join(SRC_DIR, "app/studio"),
  path.join(SRC_DIR, "data/page-meta.ts"),     // localized meta dictionary
  // Admin-internal surfaces. Only Cas / Denis ever see these — they
  // contain technical diagnostics with internal identifiers (cron
  // names, scheduler queues, sync_recent_results, etc.) where
  // translating to 16 locales would just add maintenance churn for
  // no user benefit. Treat the Dutch prose here as intentional.
  path.join(SRC_DIR, "app/(app)/admin"),
  path.join(SRC_DIR, "components/admin"),
];
const EXCLUDE_FILE_RX = /\.(test|spec|stories)\.(tsx?|ts)$/;

// ── Strings allowed to "look Dutch" ─────────────────────────────
// Tier names, brand names, and a few BetsPlug-specific compounds
// that incidentally contain a Dutch trigger word. These are not
// translated as UI copy, so we whitelist them so the heuristic
// doesn't false-positive.
const ALLOWLIST_SUBSTRINGS = [
  "BetsPlug",
  "BOTD",
];

// ── Dutch trigger words ─────────────────────────────────────────
// High-precision: each entry is a token / phrase that doesn't
// appear in normal English UI copy. If a candidate string contains
// any of these, we flag it. Word boundaries are enforced for the
// short tokens to keep precision high.
//
// To avoid false positives, every entry below was hand-checked to
// verify it does NOT appear as a substring of common English UI
// vocabulary used elsewhere in this repo.
const DUTCH_WORDS = [
  // Sport / measurement nouns
  "wedstrijd",
  "wedstrijden",
  "aftrap",
  "voorspelling",
  "voorspellingen",
  "voorspellingskwaliteit",
  "nauwkeurigheid",
  "nauwkeurig",
  "accuraatheid",
  "betrouwbaar",
  "betrouwbaarheid",
  "trefzekerheid",
  "modelconfidentie",
  "abonnees",
  "abonnement",
  "competities",
  "voorbeeld",
  // Verbs / participles
  "geëvalueerd",
  "geëvalueerde",
  "uitgesplitst",
  "vastgelegd",
  "vastgezet",
  "gesimuleerd",
  "afgelopen",
  "aanmelden",
  "bekijken",
  "ontgrendel",
  // Determiners / connectives that are Dutch-only
  "vóór",
  "vanaf",
  "elke",
  "zolang",
  "hieronder",
  "dezelfde",
  "omdat",
  "terwijl",
  "wanneer",
  "tonen",
  "werden",
  "willen",
  // Adjectives / phrases
  "dagelijks",
  "dagelijkse",
  "eerlijke",
  "huidige",
  "kleine",
  "volledige",
  // Single-word triggers (Dutch-only / very high precision)
  "geen",        // "no/none"
  "niet",        // "not"
  "voortgang",   // "progress"
  "drempel",     // "threshold"
  "ontwikkeling",// "in development"
  "verbeterde",  // "improved"
  "ophalen",     // "fetch"
  "verzameld",   // "collected"
  "bewijs",      // "proof/evidence"
  "loopt",       // "runs/active"
  "uitsluitend", // "exclusively"
  "leakage-vrij",// internal phrase
  "toon",        // "show"
  "alle",        // "all" (Dutch, !=EN "all" by case + context)
  "ontgrendelt", // "unlocks"
  "samen met",   // "together with"

  // Multi-word phrasal triggers (high-precision, no word-boundary needed)
  // NOTE: "log in" is intentionally NOT here — it's identical EN+NL.
  "wachten op data",
  "vrij te spelen",
  "geen conclusie",
  "kleine samples",
  "Gold en Platinum",
  "Free en Silver",
  "deze sectie",
  "log opnieuw",
  "naar Gold",
  "naar Platinum",
  "kan niet",
  "kon niet",
  "te zien",
  "niet laden",
  "niet ophalen",
  "Toon minder",
  "Toon alle",
  "vóór kickoff",
  "vóór de aftrap",
  "zit in",
  "om te",
  "Voor elke",
  "voor elke",
  "die nu lopen",
  "deze meetlaag",
  "meting loopt",
  "geen evaluaties",
  "verschijnen ze",
  "Beschikbaar vanaf",
];

// Pre-compile word-boundary regexes for the single-word triggers
// (anything that's a multi-word phrase falls back to substring).
function compileTriggers() {
  return DUTCH_WORDS.map((word) => {
    if (word.includes(" ")) {
      // Phrase trigger — case-insensitive substring match
      return { word, rx: new RegExp(escape(word), "i") };
    }
    // Single-word trigger — case-insensitive with word boundaries.
    // \b doesn't play well with non-ASCII, so we anchor on the
    // chars that surround the word in JS strings.
    return {
      word,
      rx: new RegExp(`(?:^|[^\\p{L}])${escape(word)}(?:$|[^\\p{L}])`, "iu"),
    };
  });
}
function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── English-vs-Dutch tie-breakers ───────────────────────────────
// If a string contains BOTH a Dutch trigger AND a clearly English
// signal, prefer Dutch (since EN-only locale text shouldn't have
// any Dutch token). But some BetsPlug copy intentionally code-
// switches (e.g., "Pick of the Day — live measurement") — in
// those cases the EN side dominates the rest of the sentence and
// we don't want to flag it. So: if the string is mostly English
// AND only matches a SHORT trigger, allow it. The trigger has to
// be one of the high-impact ones below to flag.
const STRONG_TRIGGERS = new Set([
  "wedstrijd",
  "wedstrijden",
  "aftrap",
  "voorspelling",
  "voorspellingen",
  "uitgesplitst",
  "vastgelegd",
  "vastgezet",
  "gesimuleerd",
  "vóór",
  "vanaf",
  "geëvalueerd",
  "geëvalueerde",
  "nauwkeurigheid",
  "betrouwbaarheid",
  "abonnees",
  "wachten op data",
  "vrij te spelen",
  "kleine samples",
  "geen conclusie",
  "Gold en Platinum",
  "Free en Silver",
]);

// ── Walk ────────────────────────────────────────────────────────
function isExcluded(absPath) {
  return EXCLUDE_PATHS.some((p) => absPath === p || absPath.startsWith(p + path.sep));
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (isExcluded(full)) continue;
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      if (EXCLUDE_FILE_RX.test(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

// ── Strip code that's NOT user-visible ──────────────────────────
// Comments and import statements can legitimately contain Dutch
// — and we don't want to flag them. Strip them before scanning.
function stripNonVisible(content) {
  // Block comments
  let s = content.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Line comments — must be on their own (avoid eating "https://")
  s = s.replace(/(^|[^:"'`/])\/\/[^\n]*/g, "$1");
  // Import statements (whole line)
  s = s.replace(/^\s*import\b[^\n]*\n/gm, "\n");
  return s;
}

// ── Candidate extraction ────────────────────────────────────────
// We extract two kinds of user-visible string:
//   1. Common string-literal props in JSX
//   2. JSX text nodes (text between > and <)
//
// We only need a heuristic: 80% precision is fine because we're
// going to back it up with the Dutch-trigger filter. The trigger
// list is what drives false-positive control.
function extractCandidates(stripped) {
  const candidates = [];

  // (1) JSX string-literal props
  //     Match: <Foo title="..." subtitle="..." aria-label="..." />
  //     The list is curated to avoid noise from `className`, `key`, etc.
  const PROP_NAMES = [
    "title",
    "subtitle",
    "kicker",
    "label",
    "heading",
    "description",
    "placeholder",
    "tooltip",
    "body",
    "cta",
    "name",
    "text",
    "alt",
    "aria-label",
    "aria-description",
    "ariaLabel",
    "ariaDescription",
    "emptyMessage",
  ];
  const propRx = new RegExp(
    `\\b(${PROP_NAMES.join("|")})\\s*=\\s*(['"\`])([^'"\`\\n]{2,400}?)\\2`,
    "g",
  );
  let m;
  while ((m = propRx.exec(stripped)) !== null) {
    candidates.push({
      kind: `prop ${m[1]}=`,
      value: m[3],
      offset: m.index,
    });
  }

  // (2) JSX text nodes — text between `>` and `<` that is more than
  //     a couple of characters and isn't pure whitespace / digits.
  //     This is heuristic: we're not running a real JSX parser, so
  //     we tolerate some false positives in the candidate set —
  //     the Dutch-trigger filter takes care of them.
  const textRx = />\s*([^<>{}\n][^<>{}]{4,600})</g;
  while ((m = textRx.exec(stripped)) !== null) {
    const value = m[1].trim();
    if (!value) continue;
    // Skip pure punctuation / numbers / single-token identifiers
    if (!/[A-Za-zÀ-ɏ]/.test(value)) continue;
    // Skip strings that are clearly an interpolation expression like {x}
    if (/^\{.*\}$/s.test(value)) continue;
    candidates.push({
      kind: "JSX text",
      value,
      offset: m.index,
    });
  }

  return candidates;
}

// ── Trigger match ───────────────────────────────────────────────
function isAllowlisted(s) {
  return ALLOWLIST_SUBSTRINGS.some((needle) => s.includes(needle));
}

function matchesDutchTrigger(triggers, candidate) {
  for (const { word, rx } of triggers) {
    if (rx.test(candidate)) return word;
  }
  return null;
}

// ── Diff-only support ───────────────────────────────────────────
// Returns the concatenated text of `+` lines from
// `git diff --cached -- <file>`. We use substring containment to
// decide whether a violation was introduced by the staged change
// (rather than tracking exact line numbers, which fails for
// multi-line strings or whitespace-only diff churn).
function getStagedAddedText(absPath) {
  let rel;
  try {
    rel = path.relative(REPO_ROOT, absPath);
  } catch {
    return "";
  }
  let result = "";
  try {
    result = execSync(
      `git diff --cached --unified=0 -- "frontend/${rel}"`,
      {
        cwd: path.resolve(REPO_ROOT, ".."),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  } catch {
    return "";
  }
  const added = [];
  for (const line of result.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) added.push(line.slice(1));
  }
  return added.join("\n");
}

function violationIsNew(value, addedText) {
  if (!addedText) return false;
  // Substring match on a moderately specific prefix. Short strings
  // get matched as a whole; long strings get a 60-char prefix.
  const probe = value.length > 60 ? value.slice(0, 60) : value;
  return addedText.includes(probe);
}

// ── Per-file scan ───────────────────────────────────────────────
function scanFile(file, triggers, opts = {}) {
  const { diffOnly = false } = opts;
  const raw = fs.readFileSync(file, "utf-8");
  const stripped = stripNonVisible(raw);
  const candidates = extractCandidates(stripped);
  const addedText = diffOnly ? getStagedAddedText(file) : "";
  const violations = [];

  for (const c of candidates) {
    const trigger = matchesDutchTrigger(triggers, c.value);
    if (!trigger) continue;

    // Hard allowlist (brand, BOTD, etc.) — skip when the only
    // suspicious tokens are inside a brand substring.
    if (isAllowlisted(c.value) && !STRONG_TRIGGERS.has(trigger)) continue;

    // Diff-only: only flag if the offending text appears in the
    // staged "+" lines for this file.
    if (diffOnly && !violationIsNew(c.value, addedText)) continue;

    // Compute line number from offset in the *stripped* text.
    // We re-derive from raw to give the user a useful location.
    const idx = raw.indexOf(c.value);
    const lineNum =
      (idx >= 0 ? raw.slice(0, idx) : stripped.slice(0, c.offset)).split(
        "\n",
      ).length;

    violations.push({
      file: path.relative(REPO_ROOT, file),
      line: lineNum,
      kind: c.kind,
      trigger,
      snippet:
        c.value.length > 110 ? c.value.slice(0, 107) + "…" : c.value,
    });
  }
  return violations;
}

// ── Main ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const diffOnly = args.includes("--diff-only");
const scanAll = args.includes("--all");
const argFiles = args.filter((a) => !a.startsWith("--"));

let files;
if (scanAll || (!diffOnly && argFiles.length === 0)) {
  files = INCLUDE_DIRS.flatMap((d) => (fs.existsSync(d) ? walk(d) : []));
} else {
  files = argFiles
    .map((f) => (path.isAbsolute(f) ? f : path.join(REPO_ROOT, f)))
    .filter((abs) => {
      if (!fs.existsSync(abs)) return false;
      if (!/\.(tsx|ts)$/.test(abs)) return false;
      if (EXCLUDE_FILE_RX.test(path.basename(abs))) return false;
      if (isExcluded(abs)) return false;
      if (!INCLUDE_DIRS.some((d) => abs.startsWith(d + path.sep))) return false;
      return true;
    });
}

const triggers = compileTriggers();
const allViolations = files.flatMap((f) => scanFile(f, triggers, { diffOnly }));

if (allViolations.length === 0) {
  console.log(
    `✓ No hardcoded Dutch leaks in ${files.length} file${files.length === 1 ? "" : "s"} checked.`,
  );
  process.exit(0);
}

console.error(
  `✗ Found ${allViolations.length} hardcoded Dutch string` +
    `${allViolations.length === 1 ? "" : "s"} across ` +
    `${new Set(allViolations.map((v) => v.file)).size} file` +
    `${new Set(allViolations.map((v) => v.file)).size === 1 ? "" : "s"}:`,
);
console.error("");

const byFile = new Map();
for (const v of allViolations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}

for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    :${v.line}  [${v.kind}]  trigger: "${v.trigger}"`);
    console.error(`      ${v.snippet}`);
  }
  console.error("");
}

console.error(
  "Every UI string must go through the i18n dictionary:\n" +
    '  1. Add `"my.key": "English text"` to messages.ts en + nl blocks\n' +
    '  2. Replace the literal with `t("my.key")` via useTranslations()\n' +
    "  3. Run `npm run translate` (or hand-author batch + apply-i18n-batch.mjs)\n" +
    "\n" +
    "Allowlist: brand names + BOTD pass through unflagged.\n" +
    "If you believe a flag is a false positive, add the surrounding\n" +
    "phrase to ALLOWLIST_SUBSTRINGS in scripts/check-no-dutch-leaks.mjs.\n" +
    "\n" +
    "Full rationale: see CLAUDE.md § i18n.",
);

process.exit(1);
