#!/usr/bin/env node
/**
 * Validate i18n SEO signals across all 16 locales
 * ────────────────────────────────────────────────────────────
 * Run this against a preview deploy (or production) before
 * merging `feat/i18n-full-scale` — catches every class of
 * failure that broke us in April 2026:
 *   - noindex headers on URLs we want indexable
 *   - canonical pointing to the wrong URL
 *   - hreflang cluster too short / broken
 *   - content-language header mismatched
 *   - duplicate-content (byte-identical HTML across locales)
 *
 * Usage:
 *   BASE=https://betsplug-branchname.vercel.app node scripts/validate-i18n-seo.mjs
 *   BASE=https://betsplug.com                     node scripts/validate-i18n-seo.mjs
 */
import { locales, defaultLocale } from "../src/i18n/config.ts";
// ^ direct .ts import works via node --experimental-loader or Vercel runtime;
// fall back to a hardcoded array if you run this on vanilla node:
const LOCALES = [
  "en", "nl", "de", "fr", "es", "it", "sw", "id",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv",
];
const DEFAULT = "en";

const BASE = process.env.BASE ?? "https://betsplug.com";

// Representative canonical paths — homepage + one hub + one combo +
// one learn pillar + one static page. Add more if needed.
const SAMPLE_PATHS = [
  "/",
  "/match-predictions/premier-league",
  "/bet-types/both-teams-to-score/premier-league",
  "/learn/what-is-value-betting",
  "/how-it-works",
];

const BCP47 = {
  en: "en", nl: "nl", de: "de", fr: "fr", es: "es", it: "it",
  sw: "sw", id: "id", pt: "pt", tr: "tr", pl: "pl", ro: "ro",
  ru: "ru", el: "el", da: "da", sv: "sv",
};

/* ── helpers ────────────────────────────────────────────────── */

async function fetchHead(url) {
  const res = await fetch(url, { redirect: "manual" });
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
  };
}

async function fetchBody(url) {
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, text };
}

function between(str, start, end) {
  const i = str.indexOf(start);
  if (i === -1) return null;
  const j = str.indexOf(end, i + start.length);
  if (j === -1) return null;
  return str.slice(i + start.length, j);
}

function countMatches(str, pattern) {
  const m = str.match(pattern);
  return m ? m.length : 0;
}

/* ── checks ─────────────────────────────────────────────────── */

const failures = [];
const warnings = [];

function fail(label, url, detail) {
  failures.push(`  ✗ ${label}  (${url})\n      ${detail}`);
}
function warn(label, url, detail) {
  warnings.push(`  ⚠ ${label}  (${url})\n      ${detail}`);
}

async function checkUrl(localisedUrl, locale, canonicalPath) {
  const head = await fetchHead(localisedUrl);
  const body = await fetchBody(localisedUrl);

  // 1) status
  if (head.status !== 200) {
    fail("non-200 status", localisedUrl, `status=${head.status}`);
    return;
  }

  // 2) noindex — must NOT be set on canonical host
  const xrt = (head.headers["x-robots-tag"] ?? "").toLowerCase();
  if (xrt.includes("noindex")) {
    fail("noindex header on indexable URL", localisedUrl, `x-robots-tag=${xrt}`);
  }

  // 3) html lang attr
  const htmlTag = between(body.text, "<html", ">");
  const langMatch = htmlTag && htmlTag.match(/lang="([a-z]+)"/);
  const htmlLang = langMatch ? langMatch[1] : null;
  if (htmlLang !== locale) {
    fail("html lang mismatch", localisedUrl, `expected=${locale}, got=${htmlLang}`);
  }

  // 4) content-language header
  const cl = head.headers["content-language"];
  if (cl !== locale) {
    warn("content-language mismatch", localisedUrl, `expected=${locale}, got=${cl}`);
  }

  // 5) canonical self-referential
  const canonicalMatch = body.text.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonicalMatch) {
    fail("no canonical tag", localisedUrl, "none found in <head>");
  } else {
    const canonicalHref = canonicalMatch[1];
    // Canonical must point at the same locale as the URL we requested
    const expected = new URL(localisedUrl).pathname.replace(/\/$/, "") || "/";
    const actual = new URL(canonicalHref).pathname.replace(/\/$/, "") || "/";
    if (actual !== expected) {
      fail("canonical not self-referential", localisedUrl, `expected=${expected}, got=${actual}`);
    }
  }

  // 6) hreflang cluster — 16 locales + x-default = 17
  const altCount = countMatches(body.text, /<link rel="alternate" [^>]*hrefLang=/gi);
  if (altCount < 17) {
    fail("hreflang cluster too short", localisedUrl, `found=${altCount}, expected>=17`);
  } else if (altCount > 17) {
    warn("hreflang cluster too long", localisedUrl, `found=${altCount}, expected=17`);
  }

  return body.text;
}

/* ── duplicate-content check ───────────────────────────────── */

async function checkDuplicateContent(path) {
  const bodies = {};
  // Fetch the EN version + 3 sample non-EN to compare
  for (const l of ["en", "nl", "de", "fr"]) {
    const url = l === DEFAULT
      ? `${BASE}${path === "/" ? "" : path}`
      : `${BASE}/${l}${path === "/" ? "" : path}`;
    const res = await fetchBody(url);
    bodies[l] = res.text;
  }

  // If the entire <body> is byte-identical between EN and a non-EN
  // locale, editorial content failed to translate — Google will
  // read that as duplicate content.
  for (const l of ["nl", "de", "fr"]) {
    const enBody = between(bodies.en, "<body", "</body>");
    const otherBody = between(bodies[l], "<body", "</body>");
    if (enBody && otherBody && enBody === otherBody) {
      fail(
        "byte-identical HTML vs EN",
        `${BASE}/${l}${path}`,
        "editorial content didn't translate — duplicate-content risk",
      );
    }
  }
}

/* ── main ───────────────────────────────────────────────────── */

async function main() {
  console.log(`🔍 Validating i18n SEO signals on ${BASE}\n`);

  // Per sample path × each locale
  for (const canonicalPath of SAMPLE_PATHS) {
    console.log(`\n📄 ${canonicalPath}`);
    for (const l of LOCALES) {
      const url = l === DEFAULT
        ? `${BASE}${canonicalPath === "/" ? "" : canonicalPath}`
        : `${BASE}/${l}${canonicalPath === "/" ? "" : canonicalPath}`;
      process.stdout.write(`   ${l.padEnd(2)} `);
      try {
        await checkUrl(url, l, canonicalPath);
        process.stdout.write("✓\n");
      } catch (err) {
        process.stdout.write(`× ${err.message}\n`);
        fail("fetch error", url, err.message);
      }
    }
    await checkDuplicateContent(canonicalPath);
  }

  // Sitemap sanity
  console.log(`\n📍 Sitemap`);
  const sitemap = await fetchBody(`${BASE}/sitemap.xml`);
  const locCount = countMatches(sitemap.text, /<loc>/g);
  const altCount = countMatches(sitemap.text, /xhtml:link/g);
  console.log(`   URLs: ${locCount}`);
  console.log(`   Alternates: ${altCount}`);
  if (locCount < 1000) {
    warn("sitemap URL count low", `${BASE}/sitemap.xml`, `found=${locCount}, expected>=1000`);
  }
  if (altCount < 15000) {
    warn("sitemap alternate count low", `${BASE}/sitemap.xml`, `found=${altCount}, expected>=15000`);
  }

  console.log("\n" + "─".repeat(60));
  if (failures.length === 0 && warnings.length === 0) {
    console.log("✅ All checks passed — safe to merge to main.");
    process.exit(0);
  }
  if (warnings.length > 0) {
    console.log(`\n⚠  ${warnings.length} warning${warnings.length === 1 ? "" : "s"}:\n`);
    warnings.forEach((w) => console.log(w));
  }
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} failure${failures.length === 1 ? "" : "s"} — DO NOT MERGE:\n`);
    failures.forEach((f) => console.log(f));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ validator crashed:", err);
  process.exit(1);
});
