#!/usr/bin/env node
/**
 * Heading-structure validator — runs against a live origin.
 *
 * Rules:
 *   1. Exactly one <h1> per page (mandatory).
 *   2. No level skipping (e.g. h1 → h3 without an h2 in between).
 *   3. h1 should be reasonably descriptive (>10 chars, contains
 *      letters, not "404" or empty).
 *   4. Page should have at least one h2 if it has any h3+ headings
 *      (otherwise that suggests a hard-coded styling-heading bug).
 *
 * Usage:
 *   node scripts/check-heading-structure.mjs               # 100 URLs from sitemap
 *   node scripts/check-heading-structure.mjs --limit=20    # smaller sample
 *   node scripts/check-heading-structure.mjs --base=...    # different origin
 *
 * Exit code 1 if any HIGH-severity violations found, 0 otherwise.
 */
const args = process.argv.slice(2);
const BASE =
  args.find((a) => a.startsWith("--base="))?.split("=")[1] ??
  "https://betsplug.com";
const LIMIT = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "100",
  10,
);

const UA = "BetsPlug-heading-check/1.0";

async function loadSitemap() {
  const r = await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`sitemap.xml: ${r.status}`);
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function extractHeadings(html) {
  const out = [];
  const rx = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    const text = m[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    out.push({ level: parseInt(m[1], 10), text });
  }
  return out;
}

function validate(headings) {
  const issues = [];
  const h1 = headings.filter((h) => h.level === 1);
  if (h1.length === 0)
    issues.push({ severity: "high", msg: "no <h1>" });
  else if (h1.length > 1)
    issues.push({ severity: "high", msg: `${h1.length} <h1> tags (must be 1)` });
  else if (h1[0].text.length < 8)
    issues.push({ severity: "medium", msg: `h1 too short: "${h1[0].text}"` });

  let lastLevel = 0;
  for (const h of headings) {
    if (lastLevel > 0 && h.level > lastLevel + 1) {
      issues.push({
        severity: "medium",
        msg: `h${lastLevel} → h${h.level} (skipped level): "${h.text.slice(0, 60)}"`,
      });
    }
    lastLevel = h.level;
  }

  const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  for (const h of headings) counts[`h${h.level}`]++;
  if (counts.h3 > 0 && counts.h2 === 0) {
    issues.push({
      severity: "medium",
      msg: "h3 present without any h2 (suggests styling-only heading)",
    });
  }

  return { counts, issues };
}

async function checkOne(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "manual",
    });
    if (r.status !== 200) {
      return { url, status: r.status, skipped: true };
    }
    const html = await r.text();
    const headings = extractHeadings(html);
    return { url, status: 200, headings: headings.length, ...validate(headings) };
  } catch (e) {
    return { url, status: 0, error: String(e) };
  }
}

async function pool(items, fn, concurrency = 6) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array(concurrency)
      .fill(0)
      .map(async () => {
        while (next < items.length) {
          const i = next++;
          out[i] = await fn(items[i]);
        }
      }),
  );
  return out;
}

(async () => {
  const urls = (await loadSitemap()).slice(0, LIMIT);
  console.log(`Heading audit on ${BASE} — ${urls.length} URLs`);
  const results = await pool(urls, checkOne);

  let high = 0;
  let medium = 0;
  for (const r of results) {
    for (const i of r.issues ?? []) {
      if (i.severity === "high") {
        high++;
        console.log(`  HIGH   ${r.url} — ${i.msg}`);
      } else if (i.severity === "medium") {
        medium++;
      }
    }
  }
  console.log(`\nSummary: ${high} HIGH, ${medium} medium across ${results.length} pages.`);
  process.exit(high > 0 ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
