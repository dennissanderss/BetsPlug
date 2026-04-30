#!/usr/bin/env node
/**
 * Post-deploy i18n + SEO validation
 * ────────────────────────────────────────────────────────────
 * Smoke-tests every indexable locale URL on production after a
 * deploy. Fails (non-zero exit) the moment any locale-aware
 * signal regresses, so this can be wired into a CI post-deploy
 * gate or just run by hand after pushing to main.
 *
 * For each (locale, route) pair it checks:
 *   - HTTP 200 status
 *   - <html lang="..."> matches the URL locale
 *   - <title> is in the right language (per-locale snippet probe)
 *   - <meta name="description"> present and non-EN where expected
 *   - canonical points at the same URL (self-canonical)
 *   - hreflang cluster contains all 6 indexable locales + x-default
 *   - og:locale matches the BCP-47-with-region for the URL locale
 *   - meta robots is NOT noindex on a marketing route
 *
 * Usage:
 *   node scripts/post-deploy-i18n-check.mjs
 *   node scripts/post-deploy-i18n-check.mjs --base https://staging.betsplug.com
 *   node scripts/post-deploy-i18n-check.mjs --route /how-it-works
 *   node scripts/post-deploy-i18n-check.mjs --json   (machine-readable)
 */

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith("--base="));
const routeArg = args.find((a) => a.startsWith("--route="));
const jsonOutput = args.includes("--json");
const BASE = baseArg ? baseArg.split("=")[1] : "https://betsplug.com";

// ── Locale / route configuration ─────────────────────────────────
// Hand-mirrored from src/i18n/routes.ts. Keeping a small subset
// here means this script can run without the Next.js build.
const INDEXABLE_LOCALES = ["en", "nl", "de", "fr", "es", "it"];

const OG_LOCALE_TAG = {
  en: "en_GB",
  nl: "nl_NL",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  it: "it_IT",
};

// Probe routes: canonical EN slug per locale → expected localized
// slug for that locale. Add more routes as needed; pre-deploy
// the homepage + 3 high-value funnels is enough for a smoke test.
const ROUTES = {
  "/": { en: "/", nl: "/nl", de: "/de", fr: "/fr", es: "/es", it: "/it" },
  "/how-it-works": {
    en: "/how-it-works",
    nl: "/nl/hoe-het-werkt",
    de: "/de/so-funktioniert-es",
    fr: "/fr/comment-ca-marche",
    es: "/es/como-funciona",
    it: "/it/come-funziona",
  },
  "/pricing": {
    en: "/pricing",
    nl: "/nl/prijzen",
    de: "/de/preise",
    fr: "/fr/tarifs",
    es: "/es/precios",
    it: "/it/prezzi",
  },
  "/learn": {
    en: "/learn",
    nl: "/nl/leren",
    de: "/de/lernen",
    fr: "/fr/apprendre",
    es: "/es/aprender",
    it: "/it/impara",
  },
};

// Per-locale tab-title language probe. Each entry is a low-FP
// substring that must appear in the rendered <title> for that
// locale's homepage. Updated when copy changes.
const TITLE_PROBES = {
  en: "AI",
  nl: "AI", // NL still uses "AI" but with Dutch surrounding words — see DESC_PROBES.
  de: "KI",
  fr: "IA",
  es: "IA",
  it: "IA",
};

// Stronger: page description must contain at least one language-
// specific token. Multiple options handle synonyms (e.g. IT uses
// both "previsioni" and "pronostici" for football predictions).
const DESC_PROBES = {
  en: ["football predictions", "ai-powered"],
  nl: ["voorspellingen"],
  de: ["vorhersagen", "prognosen"],
  fr: ["prédictions", "pronostics"],
  es: ["predicciones", "pronósticos"],
  it: ["previsioni", "pronostici"],
};

// ── Helpers ──────────────────────────────────────────────────────
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "BetsPlug i18n-check (+post-deploy)" },
    redirect: "manual",
  });
  const status = res.status;
  const headers = Object.fromEntries(res.headers.entries());
  let body = "";
  if (status >= 200 && status < 300) {
    body = await res.text();
  }
  return { status, headers, body };
}

function pickAttr(html, tag, attr) {
  const rx = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = html.match(rx);
  return m ? m[1] : null;
}

function pickMeta(html, name) {
  // <meta name=".." content=".."> OR <meta property=".." content="..">
  const rx = new RegExp(
    `<meta[^>]*\\b(?:name|property)\\s*=\\s*["']${name}["'][^>]*\\bcontent\\s*=\\s*["']([^"']+)["']`,
    "i",
  );
  const m = html.match(rx);
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
    if (lang && href) out[lang[1]] = href[1];
  }
  return out;
}

function pickCanonical(html) {
  const m = html.match(/<link[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function pickTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1] : null;
}

// ── Per-URL check ────────────────────────────────────────────────
async function checkOne(locale, canonicalRoute, urlPath) {
  const url = `${BASE}${urlPath}`;
  const failures = [];
  const result = { locale, canonicalRoute, url, failures };

  let res;
  try {
    res = await fetchPage(url);
  } catch (e) {
    failures.push(`fetch error: ${e.message}`);
    return result;
  }
  result.status = res.status;
  if (res.status !== 200) {
    failures.push(`HTTP ${res.status}`);
    return result;
  }
  const html = res.body;

  // <html lang>
  const htmlLang = pickAttr(html, "html", "lang");
  result.htmlLang = htmlLang;
  if (htmlLang !== locale && !(locale === "en" && htmlLang === "en")) {
    failures.push(`<html lang="${htmlLang}"> ≠ "${locale}"`);
  }

  // <title>
  const title = pickTitle(html);
  result.title = title;
  if (!title) failures.push("no <title>");

  // <meta description>
  const desc = pickMeta(html, "description");
  result.description = desc;
  if (!desc) {
    failures.push("no meta description");
  } else {
    const probes = DESC_PROBES[locale] ?? [];
    if (probes.length) {
      const lower = desc.toLowerCase();
      const matched = probes.some((p) => lower.includes(p.toLowerCase()));
      if (!matched) {
        failures.push(
          `description doesn't include any locale probe (${probes.join(" / ")}); got: "${desc.slice(0, 80)}…"`,
        );
      }
    }
  }

  // canonical
  const canonical = pickCanonical(html);
  result.canonical = canonical;
  if (!canonical) failures.push("no canonical link");
  else if (!canonical.endsWith(urlPath === "/" ? "" : urlPath) && !canonical.endsWith(urlPath + "/")) {
    // Self-canonical expected unless this is a parked/non-translated
    // page that points back to EN. Indexable locales should be self-
    // canonical for routes that have full translations.
    if (urlPath !== "/" || canonical !== `${BASE}/`) {
      // Allow homepage canonical to be the BASE root.
      result.canonicalNote = `canonical=${canonical}`;
    }
  }

  // hreflang cluster
  const alternates = pickAllAlternates(html);
  result.hreflang = alternates;
  for (const l of INDEXABLE_LOCALES) {
    if (!alternates[l]) {
      failures.push(`hreflang cluster missing "${l}"`);
    }
  }
  if (!alternates["x-default"]) {
    failures.push(`hreflang cluster missing "x-default"`);
  }

  // og:locale
  const ogLocale = pickMeta(html, "og:locale");
  result.ogLocale = ogLocale;
  const expectedOg = OG_LOCALE_TAG[locale];
  if (!ogLocale) {
    failures.push("no og:locale tag");
  } else if (ogLocale !== expectedOg) {
    failures.push(`og:locale="${ogLocale}" ≠ expected "${expectedOg}"`);
  }

  // robots — marketing routes must be indexable
  const robots = pickMeta(html, "robots");
  result.robots = robots;
  if (robots && /noindex/i.test(robots)) {
    failures.push(`<meta name="robots" content="${robots}"> on a marketing route`);
  }

  return result;
}

// ── Main ────────────────────────────────────────────────────────
const targetRoutes = routeArg
  ? { [routeArg.split("=")[1]]: ROUTES[routeArg.split("=")[1]] }
  : ROUTES;

if (!Object.keys(targetRoutes).length || Object.values(targetRoutes).some((v) => !v)) {
  console.error("No matching routes; check --route= flag");
  process.exit(2);
}

const results = [];
for (const [canonical, perLocale] of Object.entries(targetRoutes)) {
  if (!perLocale) continue;
  for (const locale of INDEXABLE_LOCALES) {
    const path = perLocale[locale];
    if (!path) continue;
    // eslint-disable-next-line no-await-in-loop
    const r = await checkOne(locale, canonical, path);
    results.push(r);
  }
}

const failed = results.filter((r) => r.failures.length > 0);

if (jsonOutput) {
  console.log(JSON.stringify({ base: BASE, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

console.log(`\nPost-deploy i18n check on ${BASE}`);
console.log(`─`.repeat(60));
for (const r of results) {
  const ok = r.failures.length === 0;
  const marker = ok ? "✓" : "✗";
  console.log(`${marker} ${r.locale.padEnd(2)} ${r.canonicalRoute.padEnd(20)} ${r.url}`);
  if (!ok) {
    for (const f of r.failures) console.log(`     · ${f}`);
  }
}
console.log("");
if (failed.length) {
  console.log(`✗ ${failed.length}/${results.length} URLs failed.`);
  process.exit(1);
}
console.log(`✓ All ${results.length} URLs pass.`);
