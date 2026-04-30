#!/usr/bin/env node
/**
 * Codemod: add og:locale + og:locale:alternate to public-page
 * generateMetadata() blocks. Idempotent.
 *
 * Run from frontend/:  node scripts/add-og-locale.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync(
  "grep -rl 'getLocalizedAlternates' src/app --include='*.tsx' | grep -v '/(app)/' | grep -v '/api/' | grep -v '/studio/' | grep -v 'layout.tsx'",
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

let touched = 0;
let skipped = 0;

for (const file of files) {
  let src = readFileSync(file, "utf8");

  if (src.includes("getOpenGraphLocales")) {
    skipped++;
    continue;
  }

  // 1) Add getOpenGraphLocales to existing seo-helpers import.
  //    Handle BOTH single-line and multiline import shapes by finding
  //    the import statement, locating the closing brace before the
  //    "from", and inserting our identifier just before that brace.
  const fromMatch = src.match(
    /import\s*\{([\s\S]*?)\}\s*from\s+["']@\/lib\/seo-helpers["']/,
  );
  if (!fromMatch) {
    console.warn(`  ! no seo-helpers import in ${file} — skipping`);
    skipped++;
    continue;
  }
  const importBody = fromMatch[1];
  // Strip trailing comma + whitespace from the existing list, then
  // append our new identifier on its own line/pos.
  const cleanedBody = importBody.replace(/,\s*$/, "");
  const isMultiline = importBody.includes("\n");
  const newBody = isMultiline
    ? `${cleanedBody.replace(/\s+$/, "")},\n  getOpenGraphLocales,\n`
    : `${cleanedBody.trim()}, getOpenGraphLocales `;
  src = src.replace(
    fromMatch[0],
    `import {${newBody}} from "@/lib/seo-helpers"`,
  );

  // 2) Insert `const og = getOpenGraphLocales();` next to existing
  //    `const alternates = getLocalizedAlternates(...);`.
  src = src.replace(
    /(const\s+alternates\s*=\s*getLocalizedAlternates\([^)]*\);)\s*\n/,
    (_m, decl) => {
      const indentMatch = _m.match(/^(\s*)const/);
      const indent = indentMatch ? indentMatch[1] : "  ";
      return `${decl}\n${indent}const og = getOpenGraphLocales();\n`;
    },
  );

  // 3) Add locale + alternateLocale to the openGraph object literal,
  //    just before its closing brace. Find the openGraph block by
  //    counting balanced braces from `openGraph: {`.
  const ogStart = src.search(/openGraph:\s*\{/);
  if (ogStart >= 0) {
    const openBrace = src.indexOf("{", ogStart);
    let depth = 1;
    let i = openBrace + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      if (depth === 0) break;
      i++;
    }
    if (depth === 0) {
      const blockBefore = src.slice(0, i);
      const blockAfter = src.slice(i);
      // Match the indent of the closing brace's preceding lines.
      const lastLine = blockBefore.slice(blockBefore.lastIndexOf("\n") + 1);
      const closingIndent = lastLine.match(/^\s*/)?.[0] ?? "    ";
      const fieldIndent = closingIndent + "  ";
      const insert =
        `${fieldIndent}locale: og.locale,\n` +
        `${fieldIndent}alternateLocale: og.alternateLocales,\n` +
        closingIndent;
      // Trim any trailing blank line / stray whitespace right before }
      const trimmedBefore = blockBefore.replace(/[ \t]*\n\s*$/, "\n");
      src = trimmedBefore + insert + blockAfter;
    }
  }

  writeFileSync(file, src);
  touched++;
  console.log(`✓ ${file}`);
}

console.log(`\n${touched} files updated, ${skipped} skipped.`);
