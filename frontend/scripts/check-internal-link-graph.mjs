#!/usr/bin/env node
/**
 * Internal-link graph audit. Crawls the live site (BFS from
 * homepage) and produces:
 *   - List of orphan URLs (zero inbound internal links)
 *   - Click-depth from homepage per URL
 *   - Top-N most-linked URLs (likely authority pages)
 *   - URLs in sitemap but not reachable via crawl (= dead end)
 *
 * Usage:
 *   node scripts/check-internal-link-graph.mjs --max-depth=4 --max-urls=200
 */
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("--base="))?.split("=")[1]
  ?? "https://betsplug.com";
const MAX_DEPTH = parseInt(args.find((a) => a.startsWith("--max-depth="))?.split("=")[1] ?? "3", 10);
const MAX_URLS = parseInt(args.find((a) => a.startsWith("--max-urls="))?.split("=")[1] ?? "200", 10);
const UA = "BetsPlug-link-graph/1.0";

async function loadSitemap() {
  const r = await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } });
  const xml = await r.text();
  return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}

async function fetchHtml(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (r.status !== 200) return null;
    return await r.text();
  } catch { return null; }
}

function extractInternalLinks(html, currentUrl) {
  const out = new Set();
  const rx = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    let href = m[1];
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (href.startsWith("//")) href = "https:" + href;
    if (href.startsWith("/")) href = BASE + href;
    if (!href.startsWith(BASE)) continue;
    // Strip query + hash for canonicalization
    href = href.split("#")[0].split("?")[0];
    if (href.endsWith("/") && href !== BASE + "/") href = href.slice(0, -1);
    out.add(href);
  }
  return out;
}

(async () => {
  console.log(`Internal-link audit on ${BASE}`);
  const sitemap = await loadSitemap();
  console.log(`  Sitemap: ${sitemap.size} URLs`);

  const visited = new Set();
  const depth = { [BASE]: 0 };
  const inboundCount = {};
  const queue = [BASE];

  while (queue.length > 0 && visited.size < MAX_URLS) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    if (depth[url] > MAX_DEPTH) continue;
    visited.add(url);

    const html = await fetchHtml(url);
    if (!html) continue;
    const links = extractInternalLinks(html, url);
    for (const link of links) {
      inboundCount[link] = (inboundCount[link] ?? 0) + 1;
      if (!(link in depth)) {
        depth[link] = (depth[url] ?? 0) + 1;
        queue.push(link);
      }
    }
  }

  // Orphans: in sitemap but never linked-to from any crawled page.
  const orphans = [];
  for (const u of sitemap) {
    if (!(u in inboundCount) && u !== BASE) orphans.push(u);
  }

  // Top authority targets
  const topLinked = Object.entries(inboundCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Click-depth distribution
  const depthDist = {};
  for (const d of Object.values(depth)) {
    depthDist[d] = (depthDist[d] ?? 0) + 1;
  }

  console.log(`\nCrawled ${visited.size} URLs, max depth ${MAX_DEPTH}.`);
  console.log(`\nClick-depth distribution:`);
  for (const [d, n] of Object.entries(depthDist).sort()) {
    console.log(`  depth ${d}: ${n} URLs`);
  }
  console.log(`\nTop 15 most-linked-to URLs (authority pages):`);
  for (const [u, n] of topLinked) {
    console.log(`  ${String(n).padStart(3)} ← ${u.replace(BASE, "")}`);
  }
  console.log(`\nOrphans (in sitemap, not linked from crawled tree):`);
  if (orphans.length === 0) {
    console.log(`  None — every sitemap URL has at least 1 inbound link.`);
  } else {
    console.log(`  ${orphans.length} URLs — first 20:`);
    for (const u of orphans.slice(0, 20)) console.log(`    ${u.replace(BASE, "")}`);
  }
})();
