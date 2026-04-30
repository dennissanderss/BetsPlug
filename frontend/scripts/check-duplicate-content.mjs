#!/usr/bin/env node
/**
 * Cross-page duplicate-content detector. Pulls live HTML from a
 * sitemap sample, strips boilerplate (nav, footer, scripts), then
 * compares pages pairwise via shingle-based Jaccard similarity.
 *
 * Cross-locale URLs serving identical content (i.e. localized
 * slug rendering EN body) are flagged as the most dangerous case —
 * that's the failure mode that started the April brand-collapse.
 *
 * Usage:
 *   node scripts/check-duplicate-content.mjs --limit=60
 *   node scripts/check-duplicate-content.mjs --threshold=0.7
 */
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("--base="))?.split("=")[1]
  ?? "https://betsplug.com";
const LIMIT = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "60", 10);
const THRESHOLD = parseFloat(args.find((a) => a.startsWith("--threshold="))?.split("=")[1] ?? "0.7");
const UA = "BetsPlug-dup-check/1.0";

async function loadSitemap() {
  const r = await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } });
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function fetchHtml(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.status !== 200) return null;
    return await r.text();
  } catch {
    return null;
  }
}

// Strip <head>, <script>, <style>, <nav>, <footer>, GTM noscript,
// __next_f hydration payload, and SVGs. Result is the visible
// body content alone.
function stripBoilerplate(html) {
  let s = html;
  s = s.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ");
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ");
  s = s.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&[a-z#0-9]+;/gi, " ");
  s = s.replace(/\s+/g, " ").trim().toLowerCase();
  return s;
}

function shingles(text, k = 5) {
  const words = text.split(" ").filter((w) => w.length > 1);
  const out = new Set();
  for (let i = 0; i + k <= words.length; i++) {
    out.add(words.slice(i, i + k).join(" "));
  }
  return out;
}

function jaccard(a, b) {
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

async function pool(items, fn, c = 6) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array(c).fill(0).map(async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

(async () => {
  const urls = (await loadSitemap()).slice(0, LIMIT);
  console.log(`Duplicate-content audit on ${BASE} — ${urls.length} URLs`);

  const docs = await pool(urls, async (u) => {
    const html = await fetchHtml(u);
    if (!html) return { url: u, body: "", shingles: new Set() };
    const body = stripBoilerplate(html);
    return { url: u, body, shingles: shingles(body) };
  });

  // Pairwise comparison — O(n²) but fine for 60 docs.
  const flagged = [];
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      if (docs[i].shingles.size === 0 || docs[j].shingles.size === 0) continue;
      const sim = jaccard(docs[i].shingles, docs[j].shingles);
      if (sim >= THRESHOLD) {
        flagged.push({ a: docs[i].url, b: docs[j].url, sim });
      }
    }
  }

  flagged.sort((x, y) => y.sim - x.sim);

  console.log(`\nFlagged ${flagged.length} pairs above similarity ${THRESHOLD}:\n`);
  for (const f of flagged.slice(0, 50)) {
    console.log(`  ${(f.sim * 100).toFixed(1)}%  ${f.a.replace(BASE, "")}`);
    console.log(`         vs   ${f.b.replace(BASE, "")}\n`);
  }

  // Cross-locale variants of the SAME canonical path are EXPECTED to
  // be semantically similar but stylistically distinct (different
  // languages). When two URLs in different locales hit >85% similarity
  // it usually means one is rendering EN fallback for non-EN locale.
  const crossLocaleHigh = flagged.filter((f) => {
    const aLocale = f.a.match(/\/(en|nl|de|fr|es|it)(\/|$)/)?.[1];
    const bLocale = f.b.match(/\/(en|nl|de|fr|es|it)(\/|$)/)?.[1];
    return aLocale && bLocale && aLocale !== bLocale && f.sim >= 0.85;
  });
  if (crossLocaleHigh.length > 0) {
    console.log(`\n⚠ ${crossLocaleHigh.length} cross-locale pairs >85% similarity — likely EN-fallback bug:`);
    for (const f of crossLocaleHigh) {
      console.log(`  ${(f.sim * 100).toFixed(1)}%  ${f.a} <-> ${f.b}`);
    }
  }
})();
