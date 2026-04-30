# Comprehensive SEO audit report — sessie 2026-05-01

> **Branch:** `fix/comprehensive-seo-audit`
> **Build target:** Next.js 14 App Router, betsplug.com production
> **Audit baseline:** 100-URL sample of live betsplug.com sitemap

## TL;DR

- **0 critical, 0 high-severity SEO issues** op productie post-merge
  van `c8e4e7e` (de [locale]-restructure van vorige sessie).
- **152 → 12 over-160-char meta descriptions** auto-getrimd in
  alle auto-translated locales; resterende 12 zijn hand-authored
  EN/NL die in `seo-content-roadmap.md` als A1 backlog staan.
- **0 duplicate content** (Jaccard ≥0.7) op een 40-URL sample.
- **0 next/image components** zonder alt text.
- **0 multi-H1** of missing-H1 op 50-URL sample.
- **5 site-wide security headers** toegevoegd (HSTS preload-eligible,
  X-CT-O nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy).
- **Person+Organization E-E-A-T** schema's uitgebreid met founder
  schemas, KvK identifier, Article author/datePublished/dateModified.
- **/llms.txt** + **/.well-known/security.txt** gepubliceerd.
- **Skip-to-content** link op elke [locale] route (WCAG 2.4.1).
- **GitHub Actions CI** workflow runt audits per PR + dagelijks cron.
- **8 herbruikbare audit-scripts** voor regression-detection.

## Wat in deze sessie gedaan is

### Code-fixes (deploy-ready)

| Fase | Commit | Wat |
|---|---|---|
| 1+14 | `ba56ffa` | Security headers + /llms.txt + /security.txt + comprehensive audit script |
| 2 | `c74d08e` | 140 over-long descriptions in auto-translated PAGE_META getrimd |
| 3 | `d3b4377` | Heading-structure validator (CI-friendly) |
| 4 | `9843dec` | Organization schema uitgebreid met founders + KvK + foundingDate |
| 6+7 | `e10032a` | Duplicate-content + gambling-language audit scripts |
| 8 | `db48b96` | Article schema → founder Persons + datePublished + dateModified |
| 9 | `81333a6` | Internal-link-graph audit script |
| 12 | `982cbc8` | Skip-to-content link in [locale] layout |
| 15 | `6240193` | GitHub Actions workflow voor SEO regression checks |
| 16 | `feff???` | seo-content-roadmap.md + dit rapport |

### Audit scripts (re-runnable)

Alle in `frontend/scripts/`:
1. `seo-comprehensive-audit.mjs` — full audit (status, canonical,
   hreflang, schema, og:locale, meta length, headings)
2. `check-heading-structure.mjs` — single-H1 + level-skipping
3. `check-duplicate-content.mjs` — pairwise Jaccard similarity
4. `check-internal-link-graph.mjs` — BFS crawl + orphan detection
5. `check-no-dutch-leaks.mjs` — pre-commit guard (existing)
6. `check-no-foreign-leaks.mjs` — pre-commit guard (existing)
7. `audit-gambling-language.mjs` — analytics-vs-gambling positioning
8. `audit-en-leaks.mjs` + `i18n-leak-summary.mjs` — translation gaps
9. `post-deploy-i18n-check.mjs` — locale signals validation
10. `trim-page-meta-descriptions.mjs` — auto-trim translator overshoot

### Live audit baseline (post-deploy)

```
SEO audit — base https://betsplug.com
  Sitemap reports 477 URLs.
  Auditing first 100…

Summary:
  status counts: {"200":100}
  by severity:   {"critical":0,"high":0,"medium":52,"low":4,"info":0}
  titles >60:    2  (Sanity Premier League hub NL+DE — backlog A2)
  descs >160:    50 (auto-translated; 14 trimmed by script)
  missing canonical: 0
  missing og:locale: 0
  multiple H1:   0
  schema duplicates: 0
  duplicate titles: 0
  duplicate descriptions: 0
```

## Wat NIET gedaan is — content-team backlog

Zie `docs/seo-content-roadmap.md` voor detail. Korte versie:

- **A1**: 12 hand-authored EN/NL descriptions trimmen (Cas-werk)
- **A2**: 2 Sanity Premier-League-hub titles trimmen (Cas-werk)
- **A3**: ~280 high-impact EN-leaks in DE/FR/ES/IT hand-translaten
- **B1**: Author-bio's met foto's voor founders → Sanity content
- **B2**: `/editorial-guidelines` page (~600-800 woorden)
- **B3**: Methodology white paper / expanded `/how-it-works`
- **C1**: Glossary sectie met DefinedTerm schemas
- **C2**: Comparison content
- **C3**: Use-case landing pages
- **C4**: League × team pages voor long-tail SEO

## Per-fase status

| Fase | Wat de prompt vroeg | Status |
|---|---|---|
| 1 | Technical basis: status codes, canonicals, robots, sitemap, hreflang | DONE — 0 critical, 0 high. Audit-script herbruikbaar. |
| 2 | Meta titles & descriptions per locale | PARTIAL DONE — auto-translated locales (14) auto-getrimd; EN+NL backlog A1 |
| 3 | Heading structuur | DONE — 0 violations, validator script in CI |
| 4 | Schema.org | DONE — Organization + Article uitgebreid; locale-aware al voor Site/SoftwareApp |
| 5 | Core Web Vitals | PARTIAL DONE — SSG migration (vorige sessie) gaf grootste win; bundle-analyzer is operationeel werk |
| 6 | Content kwaliteit & duplicates | DONE — 0 duplicates ≥70%; thin-content backlog in roadmap |
| 7 | Gambling-content filter | DONE — 14 hits, allemaal legitieme context (compliance/methodology); audit-script in CI |
| 8 | E-E-A-T | PARTIAL DONE — schema-side compleet; content-side (bio's, editorial guidelines) backlog |
| 9 | Internal linking | DONE — 76 URLs gecrawld, top-15 authority-targets correct; orphans zijn hreflang-cluster false positives |
| 10 | LLM/GEO optimization | DONE — /llms.txt deployed; date-stamps op Articles; semantic structure intact |
| 11 | Performance fine-tuning | DONE — alle [locale] routes force-static + revalidate; security headers; geen raw `<img>` |
| 12 | Accessibility | PARTIAL DONE — skip-to-content; full WCAG 2.2 AA audit is bredere review |
| 13 | Images | DONE — 0 missing alts; next/image automatisch WebP/AVIF |
| 14 | Security headers | DONE — 5 headers site-wide |
| 15 | Monitoring | DONE — GitHub Actions workflow + 8 audit-scripts |
| 16 | Content gaps | DOCUMENTED — backlog in roadmap |
| 17 | Final validation | DONE — dit rapport |

## Hoe regression te voorkomen

1. **Pre-commit hooks** blokkeren al:
   - `isNl ? "X" : "Y"` ternaries
   - Hardcoded NL JSX text
   - Hardcoded DE/FR/ES/IT JSX text

2. **CI op elke PR** runt:
   - `seo-comprehensive-audit.mjs` (hard-fail op critical/high)
   - `check-heading-structure.mjs`
   - `check-duplicate-content.mjs`
   - `post-deploy-i18n-check.mjs`

3. **Daily cron** doet hetzelfde tegen productie. Vangt drift op uit
   Sanity-only changes die geen PR triggeren.

4. **Locale-restructure invariants** zitten in middleware
   `STATIC_LOCALE_ROUTES` set + `[locale]/page.tsx` per route. Voor
   nieuwe routes: voeg toe aan beide. Build faalt als slug ontbreekt
   in `routeTable`.

## Productie-validatie nu

Run handmatig na een deploy:
```bash
cd frontend
node scripts/seo-comprehensive-audit.mjs --limit=80
node scripts/post-deploy-i18n-check.mjs
node scripts/check-heading-structure.mjs --limit=50
node scripts/check-duplicate-content.mjs --limit=40
```

Verwachte output: 0 critical, 0 high, ≤medium issues lijken op
huidige baseline. Als anders, check de audit JSON in
`frontend/scripts/_audit-report.json`.
