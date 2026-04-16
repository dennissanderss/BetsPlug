/**
 * Migrate marketing copy from `messages.ts` → Sanity `homepage` singleton
 * ────────────────────────────────────────────────────────────
 * Reads all 8 locale dictionaries (EN/NL inline in `messages.ts`,
 * DE/FR/ES/IT/SW/ID from `src/i18n/locales/*.ts`) and writes a fully
 * populated `homepage` document to Sanity with per-locale values in
 * every `localeString` / `localeText` field.
 *
 * The homepage singleton's schema (see
 * `sanity/schemas/documents/homepage.ts`) covers the hero, comparison
 * table, trusted cards, features grid, track record stats, SEO pillars
 * and the categorized FAQ accordion. This script pulls the matching
 * i18n keys for each field and seeds Sanity so marketing can edit the
 * copy in the Studio without touching source code.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-homepage-to-sanity.ts
 *   npx tsx --env-file=.env.local scripts/migrate-homepage-to-sanity.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/migrate-homepage-to-sanity.ts --out homepage.json
 *
 * Flags:
 *   --dry-run   Print the document JSON, do not write to Sanity.
 *   --out FILE  Write the document to a JSON file instead of Sanity.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.join(__dirname, "../src/i18n");
const MESSAGES_FILE = path.join(I18N_DIR, "messages.ts");
const LOCALES_DIR = path.join(I18N_DIR, "locales");

const LOCALES = ["en", "nl", "de", "fr", "es", "it", "sw", "id"] as const;
type Locale = (typeof LOCALES)[number];

/* ── CLI flags ────────────────────────────────────────────── */

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const outIdx = args.indexOf("--out");
const outFile = outIdx !== -1 ? args[outIdx + 1] : null;

/* ── i18n parsing ─────────────────────────────────────────── */

/** Extract key → value pairs from a flat TS object literal. */
function parseDict(content: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /^\s*"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const key = m[1];
    const value = m[2]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\");
    out.set(key, value);
  }
  return out;
}

/** Locate a top-level object block by declaration prefix. */
function findObjectBlock(content: string, prefix: string) {
  const idx = content.indexOf(prefix);
  if (idx === -1) throw new Error(`Could not find '${prefix}' in file`);
  const open = content.indexOf("{", idx);
  let depth = 0;
  for (let i = open; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) return { start: idx, end: i + 1 };
    }
  }
  throw new Error(`No closing brace for '${prefix}'`);
}

/** Load all 8 locale dictionaries keyed by locale. */
function loadAllLocales(): Record<Locale, Map<string, string>> {
  const messages = fs.readFileSync(MESSAGES_FILE, "utf-8");
  const enBlock = findObjectBlock(messages, "const en = {");
  const nlBlock = findObjectBlock(messages, "const nl");
  const enDict = parseDict(messages.slice(enBlock.start, enBlock.end));
  const nlDict = parseDict(messages.slice(nlBlock.start, nlBlock.end));

  const out: Partial<Record<Locale, Map<string, string>>> = {
    en: enDict,
    nl: nlDict,
  };

  for (const loc of ["de", "fr", "es", "it", "sw", "id"] as const) {
    const p = path.join(LOCALES_DIR, `${loc}.ts`);
    const content = fs.readFileSync(p, "utf-8");
    out[loc] = parseDict(content);
  }

  return out as Record<Locale, Map<string, string>>;
}

/* ── Sanity locale value builders ─────────────────────────── */

type LocaleObj = { _type: "localeString" | "localeText" } & Partial<
  Record<Locale, string>
>;

/**
 * Build a `localeString` object for all 8 locales from a single i18n key.
 * EN is always populated; missing translations fall through to EN.
 */
function ls(
  dicts: Record<Locale, Map<string, string>>,
  key: string,
): LocaleObj {
  const obj: LocaleObj = { _type: "localeString" };
  const enVal = dicts.en.get(key) ?? "";
  for (const loc of LOCALES) {
    const v = dicts[loc].get(key);
    if (v !== undefined) obj[loc] = v;
    else if (loc === "en") obj[loc] = enVal;
  }
  return obj;
}

/** Same as `ls` but for multi-line text. */
function lt(
  dicts: Record<Locale, Map<string, string>>,
  key: string,
): LocaleObj {
  return { ...ls(dicts, key), _type: "localeText" };
}

/* ── Homepage doc builder ─────────────────────────────────── */

function buildHomepageDoc(dicts: Record<Locale, Map<string, string>>) {
  // Small helpers that close over `dicts` for brevity.
  const S = (k: string) => ls(dicts, k);
  const T = (k: string) => lt(dicts, k);

  return {
    _id: "homepage",
    _type: "homepage",

    /* Hero */
    heroBadge: S("hero.badge"),
    heroTitleLine1: S("hero.titleLine1"),
    heroTitleLine2: S("hero.titleLine2"),
    heroTitleLine3: S("hero.titleLine3"),
    heroSubtitle: T("hero.subtitle"),
    heroCtaPrimary: S("hero.ctaPrimary"),
    heroCtaSecondary: S("hero.ctaSecondary"),
    heroUsps: [
      { _key: "usp1", title: S("hero.usp1Title"), description: T("hero.usp1Desc") },
      { _key: "usp2", title: S("hero.usp2Title"), description: T("hero.usp2Desc") },
      { _key: "usp3", title: S("hero.usp3Title"), description: T("hero.usp3Desc") },
    ],

    /* Comparison */
    comparisonBadge: S("comparison.badge"),
    comparisonTitleA: S("comparison.titleA"),
    comparisonTitleB: S("comparison.titleB"),
    comparisonSubtitle: T("comparison.subtitle"),
    comparisonCaption: T("comparison.caption"),

    /* Trusted */
    trustedTitleA: S("trusted.titleA"),
    trustedTitleHighlight: S("trusted.titleHighlight"),
    trustedTitleB: S("trusted.titleB"),
    trustedTitleC: S("trusted.titleC"),
    trustedSubtitle: T("trusted.subtitle"),
    trustedCards: [
      {
        _key: "t1",
        title: S("trusted.card1Title"),
        description: T("trusted.card1Desc"),
        icon: "BookOpen",
      },
      {
        _key: "t2",
        title: S("trusted.card2Title"),
        description: T("trusted.card2Desc"),
        icon: "Sparkles",
      },
      {
        _key: "t3",
        title: S("trusted.card3Title"),
        description: T("trusted.card3Desc"),
        icon: "ShieldCheck",
      },
    ],

    /* Features */
    featuresBadge: S("features.badge"),
    featuresTitleA: S("features.titleA"),
    featuresTitleB: S("features.titleB"),
    featuresGrid: [
      {
        _key: "f1",
        title: S("features.f1Title"),
        description: T("features.f1Desc"),
        icon: "Calendar",
      },
      {
        _key: "f2",
        title: S("features.f2Title"),
        description: T("features.f2Desc"),
        icon: "Brain",
      },
      {
        _key: "f3",
        title: S("features.f3Title"),
        description: T("features.f3Desc"),
        icon: "TestTube",
      },
      {
        _key: "f4",
        title: S("features.f4Title"),
        description: T("features.f4Desc"),
        icon: "Database",
      },
      {
        _key: "f5",
        title: S("features.f5Title"),
        description: T("features.f5Desc"),
        icon: "Star",
      },
      {
        _key: "f6",
        title: S("features.f6Title"),
        description: T("features.f6Desc"),
        icon: "Send",
      },
    ],

    /* Track Record */
    trackRecordBadge: S("tr.kpisBadge"),
    trackRecordTitle: S("tr.kpisTitle"),
    trackRecordSubtitle: T("tr.kpisSubtitle"),
    trackRecordStats: [
      { _key: "k1", value: dicts.en.get("tr.kpi1Value") ?? "", label: S("tr.kpi1Label") },
      { _key: "k2", value: dicts.en.get("tr.kpi2Value") ?? "", label: S("tr.kpi2Label") },
      { _key: "k3", value: dicts.en.get("tr.kpi3Value") ?? "", label: S("tr.kpi3Label") },
      { _key: "k4", value: dicts.en.get("tr.kpi4Value") ?? "", label: S("tr.kpi4Label") },
    ],

    /* SEO */
    seoBadge: S("seo.badge"),
    seoTitleA: S("seo.titleA"),
    seoTitleB: S("seo.titleB"),
    seoSubtitle: T("seo.subtitle"),
    seoPillars: [
      {
        _key: "p1",
        title: S("seo.pillar1Title"),
        description: T("seo.pillar1Desc"),
      },
      {
        _key: "p2",
        title: S("seo.pillar2Title"),
        description: T("seo.pillar2Desc"),
      },
      {
        _key: "p3",
        title: S("seo.pillar3Title"),
        description: T("seo.pillar3Desc"),
      },
      {
        _key: "p4",
        title: S("seo.pillar4Title"),
        description: T("seo.pillar4Desc"),
      },
      {
        _key: "p5",
        title: S("seo.pillar5Title"),
        description: T("seo.pillar5Desc"),
      },
      {
        _key: "p6",
        title: S("seo.pillar6Title"),
        description: T("seo.pillar6Desc"),
      },
    ],

    /* Homepage FAQ */
    faqBadge: S("faq.badge"),
    faqTitleA: S("faq.titleA"),
    faqTitleB: S("faq.titleB"),
    faqSubtitle: T("faq.subtitle"),
    faqBrowseBy: S("faq.browseBy"),
    faqStillQuestions: S("faq.stillQuestions"),
    faqSupportBlurb: T("faq.supportBlurb"),
    faqContactSupport: S("faq.contactSupport"),
    homeFaqCategories: [
      {
        _key: "cat1",
        id: "getting-started",
        label: S("faq.home.cat1Label"),
        items: [
          { _key: "q1", _type: "localeFaq", question: S("faq.home.q1"), answer: T("faq.home.a1") },
          { _key: "q2", _type: "localeFaq", question: S("faq.home.q2"), answer: T("faq.home.a2") },
          { _key: "q3", _type: "localeFaq", question: S("faq.home.q3"), answer: T("faq.home.a3") },
        ],
      },
      {
        _key: "cat2",
        id: "predictions",
        label: S("faq.home.cat2Label"),
        items: [
          { _key: "q4", _type: "localeFaq", question: S("faq.home.q4"), answer: T("faq.home.a4") },
          { _key: "q5", _type: "localeFaq", question: S("faq.home.q5"), answer: T("faq.home.a5") },
          { _key: "q6", _type: "localeFaq", question: S("faq.home.q6"), answer: T("faq.home.a6") },
        ],
      },
      {
        _key: "cat3",
        id: "pricing",
        label: S("faq.home.cat3Label"),
        items: [
          { _key: "q7", _type: "localeFaq", question: S("faq.home.q7"), answer: T("faq.home.a7") },
          { _key: "q8", _type: "localeFaq", question: S("faq.home.q8"), answer: T("faq.home.a8") },
          { _key: "q9", _type: "localeFaq", question: S("faq.home.q9"), answer: T("faq.home.a9") },
        ],
      },
      {
        _key: "cat4",
        id: "data-security",
        label: S("faq.home.cat4Label"),
        items: [
          { _key: "q10", _type: "localeFaq", question: S("faq.home.q10"), answer: T("faq.home.a10") },
          { _key: "q11", _type: "localeFaq", question: S("faq.home.q11"), answer: T("faq.home.a11") },
          { _key: "q12", _type: "localeFaq", question: S("faq.home.q12"), answer: T("faq.home.a12") },
        ],
      },
    ],
  };
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  console.log("\n  Migrate homepage marketing copy → Sanity\n  ─────────────────────────────────────────\n");

  const dicts = loadAllLocales();
  console.log(`  Loaded dicts: ${LOCALES.map((l) => `${l}=${dicts[l].size}`).join(", ")}`);

  const doc = buildHomepageDoc(dicts);

  // Report fields whose EN value is missing entirely (undefined).
  // Empty strings are treated as intentional placeholders (e.g.
  // `hero.titleLine3` is deliberately blank in some layouts).
  const missing: string[] = [];
  const walk = (obj: any, trail: string) => {
    const isLocaleLeaf =
      obj && typeof obj === "object" &&
      (obj._type === "localeString" || obj._type === "localeText");
    if (isLocaleLeaf) {
      if (obj.en === undefined) missing.push(trail);
      return;
    }
    if (Array.isArray(obj)) obj.forEach((v, i) => walk(v, `${trail}[${i}]`));
    else if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) walk(v, trail ? `${trail}.${k}` : k);
    }
  };
  walk(doc, "");
  if (missing.length) {
    console.warn(`\n  ⚠ ${missing.length} field(s) missing EN value:`);
    for (const m of missing) console.warn(`    - ${m}`);
  }

  if (outFile) {
    const outPath = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
    fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), "utf-8");
    console.log(`\n  Wrote doc → ${outPath}\n`);
    return;
  }

  if (dryRun) {
    console.log("\n  MODE: Dry run — document preview (truncated):\n");
    // Preview top-level keys + types only, to keep output readable.
    const preview = Object.fromEntries(
      Object.entries(doc).map(([k, v]) => [
        k,
        Array.isArray(v) ? `<${v.length} items>` : typeof v === "object" ? `<${(v as any)._type ?? "object"}>` : v,
      ]),
    );
    console.log(preview);
    console.log("\n  (use --out <file> to dump the full JSON)\n");
    return;
  }

  if (!process.env.SANITY_API_TOKEN) {
    console.error("\n  ❌ SANITY_API_TOKEN not set in environment.");
    console.error("     Set it in .env.local or pass --dry-run / --out <file>.\n");
    process.exit(1);
  }

  const client = createClient({
    projectId: "nk7ioy85",
    dataset: "production",
    apiVersion: "2024-01-01",
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  });

  console.log("\n  Writing homepage singleton to Sanity (production)…");
  await client.createOrReplace(doc as any);
  console.log("  ✅ Homepage singleton updated.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
