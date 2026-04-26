#!/usr/bin/env node
/**
 * articles-translate — auto-translate a single article in
 * `src/data/articles.ts` from EN → nl/de/fr/es/it.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=… node scripts/articles-translate.mjs <slug>
 *   node scripts/articles-translate.mjs --all       # translate every article
 *   node scripts/articles-translate.mjs --dry-run   # preview, don't write
 *
 * What it does:
 *   1. Imports the articles module (as TS source via tsx isn't needed —
 *      we read the file as text and locate the article block by slug).
 *   2. Extracts every localizable field for the EN baseline:
 *        title, excerpt, metaTitle, metaDescription, tldr,
 *        blocks[].text (paragraph/heading/quote), blocks[].items (list).
 *   3. Sends one batched prompt per locale to the Anthropic API
 *      (Claude Sonnet 4.6) with a strict JSON-output instruction.
 *   4. Rewrites the article entry in-place: each LocalizedString
 *      becomes `{ en: "...", nl: "...", de: "...", fr: "...", es: "...", it: "..." }`.
 *   5. Skips fields that are already a Record (locale-aware) — only
 *      fills missing locales for the 5 enabled non-EN ones.
 *
 * Translator backend:
 *   - Anthropic API by default (model: claude-sonnet-4-6).
 *   - Falls back to a noop / TODO placeholder if ANTHROPIC_API_KEY
 *     is unset; CI then fails on `articles-check.mjs` which forces
 *     the developer to wire the key or hand-translate.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ARTICLES_PATH = join(
  import.meta.dirname,
  "..",
  "src",
  "data",
  "articles.ts",
);

const ENABLED_NON_EN = ["nl", "de", "fr", "es", "it"];
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ALL = args.includes("--all");
const slugArg = args.find((a) => !a.startsWith("--"));

if (!ALL && !slugArg) {
  console.error("Usage: node articles-translate.mjs <slug>  |  --all  |  --dry-run");
  process.exit(2);
}

// ─── Anthropic client ──────────────────────────────────────────
async function callAnthropic(systemPrompt, userPrompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(
      "❌ ANTHROPIC_API_KEY is not set. Either:\n" +
        "   - export ANTHROPIC_API_KEY=sk-ant-…  and re-run\n" +
        "   - or hand-translate the article and skip this script",
    );
    process.exit(3);
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("No text in Anthropic response");
  return text;
}

// ─── Article block parser ──────────────────────────────────────
//
// We don't try to parse TypeScript — we use a simple delimiter-based
// scanner that locates `{ slug: "<wanted>", … }` and extracts the
// EN-only fields by regex. Round-trip is by string-replace of the
// matched fields with their localized record form.
//
// This is purely scoped to the `articles[]` array; tighter parsing
// would be brittle against future schema additions.

function loadSource() {
  return readFileSync(ARTICLES_PATH, "utf-8");
}

function findArticleBlock(src, slug) {
  const slugRx = new RegExp(`slug:\\s*"${slug}"`);
  const slugMatch = slugRx.exec(src);
  if (!slugMatch) return null;
  // Walk back to the opening `{` and forward to the matching `}`.
  let i = slugMatch.index;
  while (i >= 0 && src[i] !== "{") i--;
  if (i < 0) return null;
  let depth = 0;
  let j;
  for (j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) return null;
  return { start: i, end: j + 1, body: src.slice(i, j + 1) };
}

function listArticleSlugs(src) {
  const slugs = [];
  const rx = /slug:\s*"([^"]+)"/g;
  let m;
  while ((m = rx.exec(src)) !== null) slugs.push(m[1]);
  return slugs;
}

// ─── Field extraction ──────────────────────────────────────────
//
// Returns an object describing every localizable field within the
// article block, with the EN value and a token (start/end position
// in the block source) for in-place replacement.

function extractEnFields(blockBody) {
  const fields = [];
  const captureScalar = (name) => {
    const rx = new RegExp(
      `(${name}:\\s*\\n?\\s*)("((?:[^"\\\\]|\\\\.)*)")`,
      "g",
    );
    let m;
    while ((m = rx.exec(blockBody)) !== null) {
      fields.push({
        name,
        kind: "scalar",
        valueRaw: m[2],
        valueEn: m[3],
        // Replace m[2] (the quoted EN string)
        target: m[2],
        targetIndex: m.index + m[1].length,
      });
    }
  };

  // Top-level scalar fields
  for (const name of ["title", "excerpt", "metaTitle", "metaDescription", "tldr"]) {
    captureScalar(name);
  }

  // Block paragraphs / headings / quotes — `text: "…"`
  const textRx = /(text:\s*\n?\s*)("((?:[^"\\]|\\.)*)")/g;
  let tm;
  while ((tm = textRx.exec(blockBody)) !== null) {
    fields.push({
      name: "block.text",
      kind: "scalar",
      valueRaw: tm[2],
      valueEn: tm[3],
      target: tm[2],
      targetIndex: tm.index + tm[1].length,
    });
  }

  // Block list items — `items: [ "…", "…", … ]`
  const itemsRx = /(items:\s*\[)([^\]]*)\]/g;
  let im;
  while ((im = itemsRx.exec(blockBody)) !== null) {
    const inside = im[2];
    const itemRx = /"((?:[^"\\]|\\.)*)"/g;
    const items = [];
    let isItem;
    while ((isItem = itemRx.exec(inside)) !== null) items.push(isItem[1]);
    fields.push({
      name: "block.items",
      kind: "array",
      valueRaw: `[${im[2]}]`,
      valueEn: items,
      target: `[${im[2]}]`,
      targetIndex: im.index + im[1].length,
    });
  }
  return fields;
}

// ─── Translator ────────────────────────────────────────────────
async function translateBatch(fields, locale) {
  const sourceForLocale = fields.map((f, i) => ({
    id: i,
    type: f.kind,
    value: f.kind === "array" ? f.valueEn : f.valueEn,
  }));
  const systemPrompt = `You are a professional sports-betting copywriter translating from English into ${locale.toUpperCase()}. Tone: data-driven, factual, educational — not hype. Brand names that stay verbatim: BetsPlug, Pulse, Elo, Poisson, XGBoost, Logistic, BTTS, ROI, xG, Free Access, Silver, Gold, Platinum, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Champions League, Europa League, Conference League, Pick of the Day, Bet of the Day. Currency formatting: keep symbols (€, $) and digits as-is. Placeholders like {name} are passthrough — don't translate the curly-brace tokens.

Output ONLY a JSON array, no prose. Each element has: { "id": <number>, "value": <string or string[]> }. Do not add fields. Do not wrap in markdown.`;

  const userPrompt = JSON.stringify(sourceForLocale, null, 2);

  const out = await callAnthropic(systemPrompt, userPrompt);
  // Extract JSON array (defensive: strip any backtick-wrapping)
  const cleaned = out.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  let arr;
  try {
    arr = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse model JSON for ${locale}: ${e.message}\n--- raw ---\n${out.slice(0, 500)}`);
  }
  if (!Array.isArray(arr)) throw new Error(`Model returned non-array for ${locale}`);
  return arr;
}

// ─── Replacement: build localized record for one field ─────────
function buildLocalizedScalar(en, perLocale) {
  // perLocale: { nl: "…", de: "…", fr: "…", es: "…", it: "…" }
  const obj = { en, ...perLocale };
  return JSON.stringify(obj);
}

function buildLocalizedArray(en, perLocale) {
  const obj = { en, ...perLocale };
  return JSON.stringify(obj);
}

// ─── Main ──────────────────────────────────────────────────────
async function translateOne(slug) {
  const src = loadSource();
  const block = findArticleBlock(src, slug);
  if (!block) {
    console.error(`Article slug '${slug}' not found in ${ARTICLES_PATH}`);
    return false;
  }

  const fields = extractEnFields(block.body);
  console.log(`[${slug}] ${fields.length} localizable field(s) found`);

  // Per-locale translations
  const perLocale = {}; // perLocale[locale] = string[] indexed by field
  for (const locale of ENABLED_NON_EN) {
    process.stdout.write(`[${slug}] translating → ${locale}…  `);
    if (DRY_RUN) {
      console.log("(dry-run, skipped)");
      continue;
    }
    const translated = await translateBatch(fields, locale);
    perLocale[locale] = translated;
    console.log("✓");
  }

  if (DRY_RUN) return true;

  // Apply replacements right-to-left so indices stay valid
  let body = block.body;
  // Sort by targetIndex desc so we can splice without shifting earlier offsets
  const ordered = [...fields]
    .map((f, i) => ({ ...f, idx: i }))
    .sort((a, b) => b.targetIndex - a.targetIndex);

  for (const f of ordered) {
    const newRecord = (() => {
      const trans = {};
      for (const locale of ENABLED_NON_EN) {
        const item = perLocale[locale]?.find((x) => x.id === f.idx);
        if (item) trans[locale] = item.value;
      }
      if (f.kind === "array") return buildLocalizedArray(f.valueEn, trans);
      return buildLocalizedScalar(f.valueEn, trans);
    })();
    body =
      body.slice(0, f.targetIndex) +
      newRecord +
      body.slice(f.targetIndex + f.target.length);
  }

  const newSrc = src.slice(0, block.start) + body + src.slice(block.end);
  writeFileSync(ARTICLES_PATH, newSrc);
  console.log(`[${slug}] articles.ts rewritten with ${ENABLED_NON_EN.length} locales`);
  return true;
}

async function main() {
  const src = loadSource();
  const targets = ALL ? listArticleSlugs(src) : [slugArg];
  console.log(`Translating ${targets.length} article(s) → nl, de, fr, es, it`);
  for (const slug of targets) {
    try {
      await translateOne(slug);
    } catch (e) {
      console.error(`[${slug}] ${e.message}`);
    }
  }
}

main();
