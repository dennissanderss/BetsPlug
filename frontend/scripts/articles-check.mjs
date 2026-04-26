#!/usr/bin/env node
/**
 * articles-check — fail CI if any article in src/data/articles.ts
 * is missing translations for the 5 ENABLED_LOCALES (non-EN).
 *
 * Run via:  npm run articles:check
 *
 * Logic:
 *   - Locate every article block by slug.
 *   - For each localizable field (title/excerpt/metaTitle/
 *     metaDescription/tldr/block.text/block.items), confirm the
 *     value is either a plain string (EN-only — caught as missing)
 *     OR an object with all 6 enabled locale keys present.
 *   - Exit 1 with a list of (slug, field, missing-locales).
 */

import { readFileSync } from "fs";
import { join } from "path";

const ARTICLES_PATH = join(
  import.meta.dirname,
  "..",
  "src",
  "data",
  "articles.ts",
);

const REQUIRED = ["en", "nl", "de", "fr", "es", "it"];

const src = readFileSync(ARTICLES_PATH, "utf-8");

function findAllArticles() {
  const out = [];
  const rx = /slug:\s*"([^"]+)"/g;
  let m;
  while ((m = rx.exec(src)) !== null) {
    let i = m.index;
    while (i >= 0 && src[i] !== "{") i--;
    let depth = 0;
    let j;
    for (j = i; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ slug: m[1], body: src.slice(i, j + 1) });
  }
  return out;
}

function checkField(body, fieldName) {
  const re = new RegExp(
    `\\b${fieldName}:\\s*([\\s\\S]*?)(?=,\\s*\\n\\s*[\\w"]+:|\\n\\s*\\})`,
    "g",
  );
  const issues = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    const v = m[1].trim();
    if (v.startsWith('"') || v.startsWith("`")) {
      issues.push({
        field: fieldName,
        missing: REQUIRED.filter((l) => l !== "en"),
      });
    } else if (v.startsWith("{")) {
      const present = [];
      for (const l of REQUIRED) {
        const has = new RegExp(`\\b${l}:\\s*"`).test(v);
        if (has) present.push(l);
      }
      const missing = REQUIRED.filter((l) => !present.includes(l));
      if (missing.length) issues.push({ field: fieldName, missing });
    }
  }
  return issues;
}

let totalIssues = 0;
const reports = [];

const articles = findAllArticles();
for (const a of articles) {
  const articleIssues = [];
  for (const f of ["title", "excerpt", "metaTitle", "metaDescription", "tldr"]) {
    articleIssues.push(...checkField(a.body, f));
  }
  articleIssues.push(...checkField(a.body, "text"));
  articleIssues.push(...checkField(a.body, "items"));
  if (articleIssues.length) {
    reports.push({ slug: a.slug, issues: articleIssues });
    totalIssues += articleIssues.length;
  }
}

console.log(`\n[articles:check] Inspected ${articles.length} article(s)`);
if (totalIssues === 0) {
  console.log("[articles:check] ✓ all articles have translations for en/nl/de/fr/es/it");
  process.exit(0);
}

console.error(
  `[articles:check] FAILED — ${reports.length} article(s) missing translations:\n`,
);
for (const r of reports) {
  console.error(`  ${r.slug}:`);
  const seen = new Set();
  for (const i of r.issues) {
    const key = `${i.field}|${i.missing.join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.error(`    • ${i.field} → missing: ${i.missing.join(", ")}`);
  }
}
console.error(
  `\nFix:  ANTHROPIC_API_KEY=… npm run articles:translate ${reports[0].slug}`,
);
console.error(`(or hand-translate the affected fields in src/data/articles.ts)`);
process.exit(1);
