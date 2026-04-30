#!/usr/bin/env node
/**
 * CI check: no hardcoded ES / DE / FR / IT strings in JSX
 * ────────────────────────────────────────────────────────────
 * Companion to check-no-dutch-leaks.mjs. Same heuristic, different
 * trigger lists. Catches developer copy-paste of foreign UI copy
 * directly into TSX files (the dictionary in messages.ts is the
 * only place foreign-language strings should live).
 *
 * High-precision word lists per locale: each entry doesn't appear
 * in normal English UI copy nor in cross-locale loanwords. Triggers
 * are weighted as STRONG when they unambiguously can't be EN/Dutch
 * (e.g., "wedstrijd" → Dutch only; "scommessa" → IT only;
 * "fußball" → DE only; "pronosticos" → ES only; "cotes" → FR only).
 *
 * Usage:
 *   node scripts/check-no-foreign-leaks.mjs                  # exit 1 on hits
 *   node scripts/check-no-foreign-leaks.mjs --all            # full sweep
 *   node scripts/check-no-foreign-leaks.mjs --diff-only      # pre-commit
 *   node scripts/check-no-foreign-leaks.mjs --locale=de      # single locale
 *
 * Pre-commit hook runs in --diff-only mode and only blocks NEW
 * violations. Pre-existing leaks (if any) are documented in the
 * --all sweep output and worked off incrementally via i18n-batch.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");

const INCLUDE_DIRS = [
  path.join(SRC_DIR, "app"),
  path.join(SRC_DIR, "components"),
];

const EXCLUDE_PATHS = [
  path.join(SRC_DIR, "i18n"),
  path.join(SRC_DIR, "app/api"),
  path.join(SRC_DIR, "app/studio"),
  path.join(SRC_DIR, "data/page-meta.ts"),
  path.join(SRC_DIR, "app/(app)/admin"),
  path.join(SRC_DIR, "components/admin"),
];
const EXCLUDE_FILE_RX = /\.(test|spec|stories)\.(tsx?|ts)$/;

const ALLOWLIST_SUBSTRINGS = ["BetsPlug", "BOTD"];

// ── Per-locale stopword lists ──────────────────────────────────
// Each list is curated for high precision: strings that ONLY make
// sense in that locale and don't collide with English idiom or
// brand vocabulary. Tokens are matched with word boundaries; full
// phrases (with spaces) match as substring, case-insensitive.
const STOPWORDS = {
  de: {
    label: "German",
    words: [
      "fußball",
      "fußball-",
      "vorhersage",
      "vorhersagen",
      "vorhersagen.",
      "wahrscheinlichkeit",
      "wahrscheinlichkeiten",
      "spielvorhersage",
      "spielvorhersagen",
      "wettquote",
      "wettquoten",
      "spieltag",
      "anstoß",
      "abonnenten",
      "monatlich",
      "kostenlos",
      "kündigen",
      "anmelden",
      "registrieren",
      "wöchentlich",
      "ergebnisbilanz",
      // Multi-word phrases
      "vor anpfiff",
      "kostenlose vorhersage",
      "jetzt entsperren",
    ],
  },
  fr: {
    label: "French",
    words: [
      "pronostics",
      "pronostic",
      "côte",
      "côtes",
      "cotes",
      "parier",
      "parieur",
      "matchs",
      "matchs.",
      "championnat",
      "championnats",
      "abonnement",
      "abonnés",
      "abonnez",
      "résiliable",
      "essai gratuit",
      "inscription",
      "connexion",
      "tableau de bord",
      "historique vérifié",
      "coup d'envoi",
      "avant le coup",
      "déverrouiller",
      "voir aujourd'hui",
    ],
  },
  es: {
    label: "Spanish",
    words: [
      "pronósticos",
      "pronóstico",
      "predicciones de fútbol",
      "predicción",
      "apuesta",
      "apuestas",
      "cuotas",
      "cuota",
      "partidos",
      "partido",
      "jornada",
      "ligas",
      "suscriptores",
      "suscripción",
      "gratis hoy",
      "regístrate",
      "iniciar sesión",
      "histórico verificado",
      "antes del saque",
      "antes del pitido",
      "desbloquear",
      "ver pronósticos",
    ],
  },
  it: {
    label: "Italian",
    words: [
      "pronostici",
      "pronostico",
      "scommessa",
      "scommesse",
      "quote",
      "quota",
      "calcio",
      "campionato",
      "campionati",
      "partita",
      "partite",
      "giornata",
      "abbonati",
      "abbonamento",
      "iscriviti",
      "accedi ora",
      "registrati",
      "storico verificato",
      "prima del fischio",
      "prima del calcio",
      "sblocca",
      "vedi pronostici",
    ],
  },
};

const args = process.argv.slice(2);
const diffOnly = args.includes("--diff-only");
const scanAll = args.includes("--all");
const localeArg = args.find((a) => a.startsWith("--locale="));
const targetLocales = localeArg
  ? [localeArg.split("=")[1]]
  : Object.keys(STOPWORDS);
const argFiles = args.filter((a) => !a.startsWith("--"));

for (const l of targetLocales) {
  if (!STOPWORDS[l]) {
    console.error(`Unknown --locale=${l}. Supported: ${Object.keys(STOPWORDS).join(", ")}`);
    process.exit(2);
  }
}

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileTriggers(words) {
  return words.map((word) => {
    if (word.includes(" ") || word.includes("-")) {
      return { word, rx: new RegExp(escape(word), "i") };
    }
    return {
      word,
      rx: new RegExp(`(?:^|[^\\p{L}])${escape(word)}(?:$|[^\\p{L}])`, "iu"),
    };
  });
}

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

function stripNonVisible(content) {
  let s = content.replace(/\/\*[\s\S]*?\*\//g, " ");
  s = s.replace(/(^|[^:"'`/])\/\/[^\n]*/g, "$1");
  s = s.replace(/^\s*import\b[^\n]*\n/gm, "\n");
  return s;
}

function extractCandidates(stripped) {
  const candidates = [];
  const PROP_NAMES = [
    "title", "subtitle", "kicker", "label", "heading", "description",
    "placeholder", "tooltip", "body", "cta", "name", "text", "alt",
    "aria-label", "aria-description", "ariaLabel", "ariaDescription",
    "emptyMessage",
  ];
  const propRx = new RegExp(
    `\\b(${PROP_NAMES.join("|")})\\s*=\\s*(['"\`])([^'"\`\\n]{2,400}?)\\2`,
    "g",
  );
  let m;
  while ((m = propRx.exec(stripped)) !== null) {
    candidates.push({ kind: `prop ${m[1]}=`, value: m[3], offset: m.index });
  }
  const textRx = />\s*([^<>{}\n][^<>{}]{4,600})</g;
  while ((m = textRx.exec(stripped)) !== null) {
    const value = m[1].trim();
    if (!value) continue;
    if (!/[A-Za-zÀ-ɏ]/.test(value)) continue;
    if (/^\{.*\}$/s.test(value)) continue;
    candidates.push({ kind: "JSX text", value, offset: m.index });
  }
  return candidates;
}

function isAllowlisted(s) {
  return ALLOWLIST_SUBSTRINGS.some((needle) => s.includes(needle));
}

function findFirstTrigger(triggers, value) {
  for (const { word, rx } of triggers) {
    if (rx.test(value)) return word;
  }
  return null;
}

function getStagedAddedText(absPath) {
  let rel;
  try {
    rel = path.relative(REPO_ROOT, absPath);
  } catch {
    return "";
  }
  let result = "";
  try {
    result = execSync(`git diff --cached --unified=0 -- "frontend/${rel}"`, {
      cwd: path.resolve(REPO_ROOT, ".."),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
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
  const probe = value.length > 60 ? value.slice(0, 60) : value;
  return addedText.includes(probe);
}

function scanFile(file, perLocaleTriggers, opts = {}) {
  const { diffOnly = false } = opts;
  const raw = fs.readFileSync(file, "utf-8");
  const stripped = stripNonVisible(raw);
  const candidates = extractCandidates(stripped);
  const addedText = diffOnly ? getStagedAddedText(file) : "";
  const violations = [];

  for (const c of candidates) {
    if (isAllowlisted(c.value)) continue;
    for (const [loc, triggers] of perLocaleTriggers) {
      const trigger = findFirstTrigger(triggers, c.value);
      if (!trigger) continue;
      if (diffOnly && !violationIsNew(c.value, addedText)) continue;
      const idx = raw.indexOf(c.value);
      const lineNum =
        (idx >= 0 ? raw.slice(0, idx) : stripped.slice(0, c.offset)).split("\n").length;
      violations.push({
        file: path.relative(REPO_ROOT, file),
        line: lineNum,
        kind: c.kind,
        locale: loc,
        trigger,
        snippet: c.value.length > 110 ? c.value.slice(0, 107) + "…" : c.value,
      });
      break;
    }
  }
  return violations;
}

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

const perLocaleTriggers = targetLocales.map((l) => [
  l,
  compileTriggers(STOPWORDS[l].words),
]);

const allViolations = files.flatMap((f) => scanFile(f, perLocaleTriggers, { diffOnly }));

if (allViolations.length === 0) {
  console.log(
    `✓ No hardcoded ${targetLocales.join(", ").toUpperCase()} leaks in ${files.length} file${files.length === 1 ? "" : "s"} checked.`,
  );
  process.exit(0);
}

console.error(
  `✗ Found ${allViolations.length} hardcoded foreign-language string` +
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
    console.error(`    :${v.line}  [${v.kind}]  ${v.locale.toUpperCase()} trigger: "${v.trigger}"`);
    console.error(`        ${v.snippet}`);
  }
}

console.error("");
console.error("Move these strings into messages.ts (en + nl) and re-run translator.");
console.error("If a hit is a brand/league/team name, add it to ALLOWLIST_SUBSTRINGS.");
process.exit(1);
