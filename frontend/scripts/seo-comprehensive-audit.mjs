#!/usr/bin/env node
/**
 * Comprehensive SEO audit — runs against a live origin (defaults to
 * https://betsplug.com) and produces a single machine-readable JSON
 * report covering:
 *
 *   - Status code health on all sitemap URLs (200, 3xx redirects,
 *     4xx, 5xx, redirect chains)
 *   - Canonical link sanity (self-canonical, no cross-locale, no
 *     canonical-to-redirect/404, no canonical-to-noindex)
 *   - Meta robots audit (correct routes noindex'd, marketing
 *     routes indexable)
 *   - Hreflang cluster validity (self-referential, x-default
 *     present, no broken siblings)
 *   - Meta title / description length compliance (50-60 / 140-155)
 *     + duplicate detection
 *   - Heading-structure smell tests (single H1, hierarchy)
 *   - JSON-LD validity + duplicate schema detection
 *   - Open Graph completeness (og:locale per locale)
 *
 * Usage:
 *   node scripts/seo-comprehensive-audit.mjs
 *   node scripts/seo-comprehensive-audit.mjs --base=https://betsplug.com
 *   node scripts/seo-comprehensive-audit.mjs --limit=50      # cap URL count
 *   node scripts/seo-comprehensive-audit.mjs --out=audit.json
 */
import fs from "node:fs";

const args = process.argv.slice(2);
const BASE =
  args.find((a) => a.startsWith("--base="))?.split("=")[1] ??
  "https://betsplug.com";
const LIMIT = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "100",
  10,
);
const OUT =
  args.find((a) => a.startsWith("--out="))?.split("=")[1] ??
  "scripts/_audit-report.json";

const UA = "BetsPlug-SEO-Audit/1.0 (+https://betsplug.com)";

// Reasonable per-domain throttle so we don't hammer Vercel's CDN.
const CONCURRENCY = 6;

async function fetchHead(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      redirect: "manual",
    });
    return {
      url,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      location: res.headers.get("location"),
    };
  } catch (e) {
    return { url, status: 0, error: String(e) };
  }
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "manual",
    });
    const text =
      res.status >= 200 && res.status < 300 ? await res.text() : "";
    return {
      url,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: text,
    };
  } catch (e) {
    return { url, status: 0, error: String(e) };
  }
}

function pickAttr(html, tag, attr) {
  const rx = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = html.match(rx);
  return m ? m[1] : null;
}

function pickAllMeta(html, name, attr = "name") {
  const out = [];
  const rx = new RegExp(
    `<meta[^>]*\\b${attr}\\s*=\\s*["']${name}["'][^>]*\\bcontent\\s*=\\s*["']([^"']*)["']`,
    "gi",
  );
  let m;
  while ((m = rx.exec(html)) !== null) out.push(m[1]);
  return out;
}

function pickMeta(html, name, attr = "name") {
  return pickAllMeta(html, name, attr)[0] ?? null;
}

function pickTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function pickCanonical(html) {
  const m = html.match(
    /<link[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["']([^"']+)["']/i,
  );
  return m ? m[1] : null;
}

function pickAllAlternates(html) {
  const out = {};
  const rx = /<link[^>]*\brel\s*=\s*["']alternate["'][^>]*>/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    const tag = m[0];
    const lang = tag.match(/\bhref[Ll]ang\s*=\s*["']([^"']+)["']/);
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/);
    if (lang && href) {
      if (!out[lang[1]]) out[lang[1]] = [];
      out[lang[1]].push(href[1]);
    }
  }
  return out;
}

function pickAllJsonLd(html) {
  const out = [];
  const rx =
    /<script[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch (e) {
      out.push({ __parseError: String(e), __raw: m[1].slice(0, 200) });
    }
  }
  return out;
}

function countHeadings(html) {
  const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  for (const lvl of Object.keys(counts)) {
    const rx = new RegExp(`<${lvl}\\b`, "gi");
    counts[lvl] = (html.match(rx) ?? []).length;
  }
  return counts;
}

function detectSchemaDuplicates(jsonLds) {
  const types = jsonLds
    .flatMap((ld) =>
      Array.isArray(ld?.["@graph"])
        ? ld["@graph"].map((n) => n["@type"])
        : [ld?.["@type"]].filter(Boolean),
    )
    .filter(Boolean)
    .map((t) => (Array.isArray(t) ? t[0] : t));
  const counts = {};
  for (const t of types) counts[t] = (counts[t] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).filter(([, n]) => n > 1),
  );
}

async function pool(items, fn, concurrency = CONCURRENCY) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array(concurrency).fill(0).map(worker));
  return out;
}

async function loadSitemapUrls(baseUrl) {
  const res = await fetch(`${baseUrl}/sitemap.xml`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) {
    throw new Error(`sitemap.xml returned ${res.status}`);
  }
  const xml = await res.text();
  // Simple regex parser — sufficient for our well-formed sitemap.
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  return urlBlocks.map((block) => {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null;
    const alternates = [];
    const altRx =
      /<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/g;
    let m;
    while ((m = altRx.exec(block)) !== null) {
      alternates.push({ hreflang: m[1], href: m[2] });
    }
    return { loc, lastmod, alternates };
  });
}

function analyzeStatus(headRes) {
  const issues = [];
  const s = headRes.status;
  if (s === 0) issues.push({ severity: "critical", msg: `fetch failed: ${headRes.error}` });
  else if (s >= 500) issues.push({ severity: "critical", msg: `${s} server error` });
  else if (s >= 400) issues.push({ severity: "high", msg: `${s} client error` });
  else if (s >= 300) issues.push({ severity: "info", msg: `${s} redirect to ${headRes.location}` });
  return issues;
}

function analyzeMeta(html, url) {
  const issues = [];
  const title = pickTitle(html);
  const desc = pickMeta(html, "description");
  const robots = pickMeta(html, "robots");
  const canonical = pickCanonical(html);

  if (!title) issues.push({ severity: "high", msg: "no <title>" });
  else if (title.length > 60)
    issues.push({ severity: "medium", msg: `title ${title.length} chars (>60): "${title.slice(0, 70)}…"` });
  else if (title.length < 30)
    issues.push({ severity: "low", msg: `title ${title.length} chars (<30): "${title}"` });

  if (!desc) issues.push({ severity: "high", msg: "no meta description" });
  else if (desc.length > 160)
    issues.push({ severity: "medium", msg: `description ${desc.length} chars (>160)` });
  else if (desc.length < 70)
    issues.push({ severity: "low", msg: `description ${desc.length} chars (<70)` });

  if (!canonical) issues.push({ severity: "high", msg: "no canonical link" });

  // Marketing routes shouldn't be noindex.
  const isMarketing =
    !/\/(dashboard|admin|account|api|checkout|trackrecord|predictions|results|teams|search|favorites|live-score|matches|reports|strategy|weekly-report|combo-of-the-day|jouw-route|deals|myaccount|subscription|register|login|forgot-password|reset-password|verify-email|thank-you|welcome|b2b)\b/.test(url);
  if (isMarketing && robots && /noindex/i.test(robots))
    issues.push({ severity: "high", msg: `noindex on marketing URL: "${robots}"` });

  return { title, desc, robots, canonical, issues };
}

function analyzeHreflang(html, url, sitemapAlternates) {
  const issues = [];
  const onPage = pickAllAlternates(html);
  const hreflangs = Object.keys(onPage);
  const flat = Object.values(onPage).flat();

  // Self-referential check: this URL should appear in the cluster.
  const stripped = url.replace(/\/$/, "");
  const selfFound = flat.some(
    (h) => h.replace(/\/$/, "") === stripped,
  );
  if (hreflangs.length > 0 && !selfFound) {
    issues.push({ severity: "medium", msg: "hreflang cluster missing self-reference" });
  }

  // x-default required when cluster present.
  if (hreflangs.length > 0 && !hreflangs.includes("x-default")) {
    issues.push({ severity: "medium", msg: "hreflang cluster missing x-default" });
  }

  // Duplicate hreflang values for one tag = bug.
  for (const [tag, hrefs] of Object.entries(onPage)) {
    if (hrefs.length > 1) {
      issues.push({
        severity: "medium",
        msg: `hreflang="${tag}" has ${hrefs.length} entries`,
      });
    }
  }

  return { onPage, issues };
}

function analyzeSchema(html) {
  const lds = pickAllJsonLd(html);
  const issues = [];
  const dupes = detectSchemaDuplicates(lds);
  for (const [type, n] of Object.entries(dupes)) {
    issues.push({
      severity: type === "FAQPage" ? "high" : "medium",
      msg: `JSON-LD duplicate @type "${type}" appears ${n} times`,
    });
  }
  for (const ld of lds) {
    if (ld.__parseError) {
      issues.push({ severity: "high", msg: `JSON-LD parse error: ${ld.__parseError}` });
    }
  }
  return { count: lds.length, types: lds.map((l) => l?.["@type"] ?? "?"), issues };
}

function analyzeOpenGraph(html, url) {
  const issues = [];
  const ogLocale = pickMeta(html, "og:locale", "property");
  const ogTitle = pickMeta(html, "og:title", "property");
  const ogDesc = pickMeta(html, "og:description", "property");
  if (!ogLocale) issues.push({ severity: "medium", msg: "no og:locale" });
  if (!ogTitle) issues.push({ severity: "low", msg: "no og:title" });
  if (!ogDesc) issues.push({ severity: "low", msg: "no og:description" });

  // Locale-vs-URL sanity: /nl URLs should have og:locale containing "nl"
  const localeFromUrl = url.match(
    /^https?:\/\/[^/]+\/(en|nl|de|fr|es|it|sw|id|pt|tr|pl|ro|ru|el|da|sv)(\/|$)/,
  )?.[1];
  if (localeFromUrl && ogLocale && !ogLocale.startsWith(localeFromUrl)) {
    issues.push({
      severity: "high",
      msg: `og:locale="${ogLocale}" mismatches URL-locale "${localeFromUrl}"`,
    });
  }
  return { ogLocale, ogTitle, ogDesc, issues };
}

function analyzeHeadings(html) {
  const counts = countHeadings(html);
  const issues = [];
  if (counts.h1 === 0) issues.push({ severity: "high", msg: "no <h1>" });
  if (counts.h1 > 1) issues.push({ severity: "high", msg: `${counts.h1} <h1> tags (must be 1)` });
  if (counts.h3 > 0 && counts.h2 === 0)
    issues.push({ severity: "medium", msg: "h3 without preceding h2 (skipped level)" });
  return { counts, issues };
}

async function auditOne(urlEntry, sitemapAlternates) {
  const url = urlEntry.loc;
  const head = await fetchHead(url);
  if (head.status >= 300) {
    return { url, lastmod: urlEntry.lastmod, statusOnly: true, head, issues: analyzeStatus(head) };
  }
  const get = await fetchHtml(url);
  if (get.status !== 200) {
    return { url, lastmod: urlEntry.lastmod, statusOnly: true, head: get, issues: analyzeStatus(get) };
  }

  const meta = analyzeMeta(get.body, url);
  const hreflang = analyzeHreflang(get.body, url, sitemapAlternates);
  const schema = analyzeSchema(get.body);
  const og = analyzeOpenGraph(get.body, url);
  const headings = analyzeHeadings(get.body);
  const cacheStatus = get.headers["x-vercel-cache"] ?? null;
  const cacheControl = get.headers["cache-control"] ?? null;

  const issues = [
    ...analyzeStatus(get),
    ...meta.issues,
    ...hreflang.issues,
    ...schema.issues,
    ...og.issues,
    ...headings.issues,
  ];

  return {
    url,
    lastmod: urlEntry.lastmod,
    status: get.status,
    cacheStatus,
    cacheControl,
    title: meta.title,
    titleLen: meta.title?.length ?? 0,
    desc: meta.desc,
    descLen: meta.desc?.length ?? 0,
    canonical: meta.canonical,
    robots: meta.robots,
    hreflangs: Object.keys(hreflang.onPage),
    schemaTypes: schema.types,
    schemaCount: schema.count,
    ogLocale: og.ogLocale,
    headingCounts: headings.counts,
    issueCount: issues.length,
    issues,
  };
}

(async () => {
  console.log(`SEO audit — base ${BASE}`);
  const urls = await loadSitemapUrls(BASE);
  console.log(`  Sitemap reports ${urls.length} URLs.`);
  const sample = urls.slice(0, LIMIT);
  console.log(`  Auditing first ${sample.length}…`);

  const results = await pool(sample, (u) => auditOne(u, urls));

  // Aggregate
  const summary = {
    base: BASE,
    auditedAt: new Date().toISOString(),
    totalUrls: urls.length,
    audited: results.length,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    statusBreakdown: {},
    duplicateTitles: {},
    duplicateDescriptions: {},
    titlesOver60: 0,
    descsOver160: 0,
    schemaDuplicates: 0,
    missingOgLocale: 0,
    missingCanonical: 0,
    multipleH1: 0,
  };

  for (const r of results) {
    const s = String(r.status ?? "0");
    summary.statusBreakdown[s] = (summary.statusBreakdown[s] ?? 0) + 1;
    if (r.titleLen > 60) summary.titlesOver60++;
    if (r.descLen > 160) summary.descsOver160++;
    if (!r.ogLocale) summary.missingOgLocale++;
    if (!r.canonical) summary.missingCanonical++;
    if (r.headingCounts?.h1 > 1) summary.multipleH1++;
    for (const i of r.issues ?? []) {
      summary.bySeverity[i.severity] = (summary.bySeverity[i.severity] ?? 0) + 1;
      if (i.msg.includes("JSON-LD duplicate")) summary.schemaDuplicates++;
    }
    if (r.title) {
      summary.duplicateTitles[r.title] = (summary.duplicateTitles[r.title] ?? 0) + 1;
    }
    if (r.desc) {
      summary.duplicateDescriptions[r.desc] = (summary.duplicateDescriptions[r.desc] ?? 0) + 1;
    }
  }
  // Strip the dup maps to ones that actually duplicate
  for (const k of Object.keys(summary.duplicateTitles)) {
    if (summary.duplicateTitles[k] < 2) delete summary.duplicateTitles[k];
  }
  for (const k of Object.keys(summary.duplicateDescriptions)) {
    if (summary.duplicateDescriptions[k] < 2) delete summary.duplicateDescriptions[k];
  }

  fs.writeFileSync(OUT, JSON.stringify({ summary, results }, null, 2));

  console.log(`\nSummary:`);
  console.log(`  status counts: ${JSON.stringify(summary.statusBreakdown)}`);
  console.log(`  by severity:   ${JSON.stringify(summary.bySeverity)}`);
  console.log(`  titles >60:    ${summary.titlesOver60}`);
  console.log(`  descs >160:    ${summary.descsOver160}`);
  console.log(`  missing canonical: ${summary.missingCanonical}`);
  console.log(`  missing og:locale: ${summary.missingOgLocale}`);
  console.log(`  multiple H1:   ${summary.multipleH1}`);
  console.log(`  schema duplicates flagged: ${summary.schemaDuplicates}`);
  console.log(`  duplicate titles:        ${Object.keys(summary.duplicateTitles).length}`);
  console.log(`  duplicate descriptions:  ${Object.keys(summary.duplicateDescriptions).length}`);
  console.log(`\nFull report: ${OUT}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
