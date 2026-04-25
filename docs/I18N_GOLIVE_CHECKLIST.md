# BetsPlug i18n go-live checklist — Fase 5

This is the final gate before merging `feat/i18n-full-scale` → `main`. Walk the list top-to-bottom. Don't skip steps — the Nerdytips-pattern only works when every signal lines up; a half-rolled-out hreflang cluster is worse than no hreflang.

## Pre-flight — technical integrity

- [ ] `git fetch origin && git log main..feat/i18n-full-scale` — expected commits: `ddf034c`, `200b268`, `728cd29`, `d82a898`, `712de96` + any content / fix commits on top
- [ ] `npx tsc --noEmit` in `frontend/` → exits 0 on the feature branch tip
- [ ] `node scripts/check-no-hardcoded-strings.mjs --all` → clean
- [ ] `npm run build` on the feature branch succeeds and prerenders every static route

## Content integrity — Sanity

Run each check against the **feature-branch preview deploy** (Vercel auto-deploys branches). Token needed for the last step.

- [ ] For every editorial type (`leagueHub`, `learnPillar`, `betTypeHub`, `pageMeta`, `homepage`, `aboutPage`, etc.): all 16 locales are populated on at least one sample document. Spot-check via `/nl/`, `/de/`, `/fr/`, `/ru/`, `/el/`, `/pt/` of the homepage + one league hub + one learn pillar.
- [ ] No locale renders visible English fallback in its editorial copy (nav/UI chrome falling to EN via dictionary is fine — that's the auto-translate pipeline). If a document is missing a locale, it renders EN at runtime via `locRecord` — that's the failure mode to catch.
- [ ] `SANITY_API_TOKEN=xxx node scripts/translate-sanity.mjs --dry-run` reports `translated: 0` — i.e. no gaps left.

## SEO signals — per URL audit

Pick three representative URLs (homepage, one hub, one combo) and run each check for EN + DE + RU (covers Latin + Cyrillic + Greek-ish domain):

- [ ] HTTP 200, no `X-Robots-Tag: noindex` header
- [ ] `<html lang="xx">` matches the URL prefix
- [ ] `<link rel="canonical">` is **self-referential** (points at the URL you requested, not at EN)
- [ ] **17** `<link rel="alternate" hrefLang=…>` tags: x-default + en + 15 others
- [ ] Every hreflang href resolves (no 404 when you curl it)
- [ ] `<meta name="description">` is in the target language, not EN
- [ ] OG `og:locale` matches (Next writes this automatically from the metadata)
- [ ] `content-language` response header matches

Quick one-liner per URL:
```bash
URL=https://betsplug-branchname.vercel.app/de/spiel-vorhersagen/premier-league
curl -sI "$URL" | grep -iE "HTTP|x-robots-tag|content-language"
curl -s "$URL" | grep -ocE '<link rel="alternate"[^>]+hrefLang='   # want 17
curl -s "$URL" | grep -oE '<link rel="canonical"[^>]*>'
```

## Sitemap + robots

- [ ] `/sitemap.xml` returns 200 and is valid XML
- [ ] URL count ≈ 1,200–1,500 (80ish canonicals × 16 locales)
- [ ] `xhtml:link` alternate count ≈ 20,000 (each URL has 17 alternates)
- [ ] `/robots.txt` has no `/nl/`, `/de/`, etc. in `Disallow`
- [ ] `/robots.txt` references `Sitemap: https://betsplug.com/sitemap.xml`

## Duplicate-content trap — the thing that crashed us in April

- [ ] For a given URL, the rendered HTML of `/de/…` is NOT byte-identical to `/…` (English). If editorial content didn't translate, the only difference is UI chrome — that's the duplicate-content trap Google punished us for. Abort the merge until Sanity content is populated.
- [ ] `site:betsplug.com` in Google still has roughly the current indexed count (we want to ADD locale variants, not lose the English ones)

## Merge

When every box above is ticked:

```bash
git checkout main
git pull
git merge --ff-only feat/i18n-full-scale    # fast-forward only — avoid merge commits on SEO work
git push origin main
```

Vercel auto-deploys. Watch the build log for any prerender errors (`npm run build` should have caught these).

## Post-deploy (within 1 hour)

- [ ] `curl -I https://betsplug.com/nl/` returns 200 (not a 308 redirect)
- [ ] Browser-smoke: visit /fr/, /de/, /ru/, /pt/, /el/ — each shows translated content
- [ ] GSC → Sitemaps → remove old sitemap.xml entry, re-add `sitemap.xml` → submit
- [ ] GSC → URL Inspection on 5 sample locale URLs (one per major market: `/nl/`, `/de/`, `/fr/`, `/es/`, `/pt/`) → "Request indexing" for each
- [ ] GSC → International Targeting → check hreflang errors report; expected: 0 mismatches

## Post-deploy (within 1 week)

- [ ] GSC Coverage report: locale URLs should start appearing in "Valid" count (not "Excluded — noindex"). Expect ~1,000 URLs indexed within 3-7 days.
- [ ] Brand-term "BetsPlug" in Search Console → impressions should NOT drop. If they do, run the duplicate-content spot check again and roll back.
- [ ] Core Web Vitals on a random sample of locale pages (use PageSpeed Insights) — no regressions expected, but a big URL-count jump sometimes correlates with render-blocking changes.

## Rollback plan

If brand impressions drop >20% in week 1:

```bash
git revert -m 1 <merge-commit-sha>
git push origin main
```

The locale-indexable change is the top of the commit stack; reverting restores the previous `noindex + EN-canonical` regime while preserving all the dictionary / Sanity schema work. User sees localized UI chrome but only EN URLs are ranked — same as the state main was in before this rollout.

---

Generated 2026-04-24. Review + update after each phase merge.
