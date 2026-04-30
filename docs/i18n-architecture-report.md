# i18n + SEO Architecture Report

> **Fase 0 deliverable** — branch `fix/i18n-seo-overhaul`, 2026-04-30.
> Dit rapport inventariseert de huidige i18n/SEO-stack en beoordeelt
> de 12-fase opdracht uit `i18n-seo-overhaul.prompt` per fase op
> *risico en relevantie* voordat er ook maar één regel destructieve
> code geraakt wordt. **Niets in dit rapport wijzigt productie-gedrag.**

---

## 1. Bestaande architectuur (geverifieerd)

### 1.1 Stack
- **Framework**: Next.js 14 App Router (React 18). Géén `[locale]`-segment.
  De router-bestanden staan op canonieke EN-paden (`/predictions`,
  `/match-predictions/[league_slug]`, `/learn/[slug]`, …).
- **i18n-runtime**: zelfgebouwd, géén `next-intl` / `next-i18next` /
  `react-intl`. Wel `google-translate-api-x` + `deepl-node` als
  build-time vertaalbronnen.
- **Routing-strategie**: middleware-rewrite. `frontend/src/middleware.ts`
  pakt `/<locale>/<localized-slug>`, mapt via `routeTable` terug naar
  het canonieke EN-pad, en zet `x-locale` header + `NEXT_LOCALE` cookie.

### 1.2 Locales
- **16 ondersteund**: `en, nl, de, fr, es, it, sw, id, pt, tr, pl, ro, ru,
  el, da, sv` (`src/i18n/config.ts` regel 20-39).
- **6 indexable**: `en, nl, de, fr, es, it` (`INDEXABLE_LOCALES`,
  regel 66-73). De andere 10 zijn *parked* — middleware zet
  `X-Robots-Tag: noindex, follow`. Dit was de bewuste correctie na de
  brand-collapse van april 2026.

### 1.3 Vertaalwoordenboek
- `src/i18n/messages.ts` — 6.429 regels. Source-of-truth voor EN+NL.
- `src/i18n/locales/{de,fr,es,it,sw,id,pt,tr,pl,ro,ru,el,da,sv}.ts` —
  14 ge-genereerde files, ~3.000 regels per file. Ge-vuld door
  `scripts/translate.mjs` (Google) en handmatige patches via
  `scripts/apply-i18n-batch.mjs`.
- **API in components**: `useTranslations()` hook (client) + `translate(locale, key)`
  (server). Géén JSX-string-children mogen Engels of Nederlands letterlijk
  bevatten — afgedwongen door pre-commit hooks.

### 1.4 Slug-vertaling
- `src/i18n/routes.ts` — 848 regels. Bevat `routeTable` met 35+
  canonieke routes × 16 locales. **Reeds vertaald** o.a.:
  - `/how-it-works` → `nl: /hoe-het-werkt`, `de: /so-funktioniert-es`,
    `fr: /comment-ca-marche`, `es: /como-funciona`, `it: /come-funziona`
  - `/predictions` → `nl: /voorspellingen`, `es: /predicciones`,
    `de: /prognosen`, `fr: /predictions`, `it: /pronostici`
  - `/match-predictions`, `/bet-types`, `/learn`, `/track-record`,
    `/about`, `/about-us`, `/contact`, `/checkout`, `/welcome`,
    `/login`, `/register`, `/forgot-password`, `/reset-password`,
    `/verify-email`, `/thank-you`, `/dashboard`, `/trackrecord`,
    `/myaccount`, `/subscription`, `/matches`, `/teams`, `/results`,
    `/search`, `/favorites`, `/strategy`, `/reports`,
    `/weekly-report`, `/bet-of-the-day`, `/deals`, `/jouw-route`,
    `/terms`, `/privacy`, `/cookies`, `/responsible-gambling`.
- Helpers: `parseLocalizedPath()`, `localizePath()`, `translatePath()`.
- **Live-bewijs**: `curl -A Googlebot https://betsplug.com/nl/voorspellingen`
  retourneert `<html lang="nl">`, NL `<title>`, NL `<meta description>`,
  hreflang-cluster voor 6 indexables + x-default. ✅

### 1.5 Metadata-pijplijn
- `src/data/page-meta.ts` — 2.198 regels. `PAGE_META` is een
  `Record<canonicalPath, Record<Locale, { title, description, ogTitle, ogDescription }>>`.
  Alle 16 locales gevuld voor 18+ statische routes (`/`, `/about-us`,
  `/privacy`, `/terms`, `/cookies`, `/responsible-gambling`,
  `/how-it-works`, `/track-record`, `/login`, `/match-predictions`,
  `/learn`, `/bet-types`, `/welcome`, `/b2b`, `/checkout`, `/engine`,
  `/pricing`, `/contact`).
- `src/lib/seo-helpers.ts` — `getServerLocale()`, `getCanonicalUrl()`,
  `getLocalizedAlternates()`, `getLocalizedFaq()`,
  `getLocalizedBreadcrumbs()`. **22 page.tsx files** gebruiken
  `generateMetadata` + `getLocalizedAlternates` (één per top-level
  marketing-route).

### 1.6 Robots / sitemap
- `src/app/robots.ts` — bestaand.
- `src/app/sitemap.xml/` — bestaand (custom dynamic route ipv `sitemap.ts`).
- `next.config.js` `redirects()`: legacy 308-redirects voor `/live`,
  `/settings`, `/articles*` (blog discontinued 2026-04-27) — alle 16
  locale-prefixen gedekt.

### 1.7 Pre-commit guards (afgedwongen)
- `frontend/scripts/check-no-hardcoded-strings.mjs` — blokkeert
  `isNl ? "X" : "Y"` en `locale === "nl" ? "X" : "Y"` UI-ternaries.
- `frontend/scripts/check-no-dutch-leaks.mjs` — blokkeert hardcoded
  Nederlandse woorden in JSX text-nodes en common props
  (`title`, `subtitle`, `placeholder`, `aria-label`, …) in
  `--diff-only` modus.
- `frontend/scripts/check-canonicals.mjs` — bestaand.
- `frontend/scripts/validate-i18n-seo.mjs` — bestaand.
- `frontend/scripts/setup-hooks.sh` — gewired via `package.json`
  postinstall.

---

## 2. Gap-analyse vs. opdracht-prompt

> Per fase: `[STATUS]` = `DONE`, `PARTIAL`, `SAFE-TO-ADD`,
> `DESTRUCTIVE`, `CONFLICTS-WITH-CLAUDE.MD`.

### Fase 0 — Branch + Discovery — `DONE`
Branch `fix/i18n-seo-overhaul` aangemaakt. Dit rapport voldoet aan de
Fase-0 deliverable.

### Fase 1 — Restructureer naar `app/[locale]/` — `DESTRUCTIVE / CONFLICTS`
- **Risico**: zou álle 40+ bestaande page-files verplaatsen, alle
  imports breken (`@/components/...` paths vereisen geen update maar
  alle relatieve paths wel), en de bestaande middleware-rewrite-
  architectuur invalideren.
- **Conflict met productie**: Google heeft de huidige URLs al
  geïndexeerd (`/nl/voorspellingen`, `/es/predicciones`, …). Een
  `[locale]`-restructure die *zelfde* URLs behoudt voegt **geen
  enkele waarde** toe — alleen risico op route-mismatches.
- **Aanbeveling**: ❌ niet uitvoeren. Huidige architectuur levert
  identieke output (dynamische `<html lang>`, vertaalde `<title>`,
  hreflang-cluster, vertaalde slugs). Geverifieerd via live curl.

### Fase 2 — `next-intl` library installatie — `DESTRUCTIVE / CONFLICTS`
- **Risico**: vervangt 6.429-regel `messages.ts` + 14 locale-files
  + `useTranslations()`-hook + `translate(locale, key)`-helper
  + `format.ts` (placeholder substitution) + 2 pre-commit guards
  + `scripts/translate.mjs` pijplijn. Honderden component-imports
  zouden moeten worden herschreven.
- **Conflict met CLAUDE.md regel #1-#7**: hardcoded i18n-rules
  beschrijven expliciet de huidige `t("key")` API.
- **Aanbeveling**: ❌ niet uitvoeren. De huidige custom-stack heeft
  feature-pariteit met `next-intl` voor wat we doen.

### Fase 3 — `generateMetadata` per locale — `DONE`
- 22 page.tsx files implementeren reeds `generateMetadata` met
  vertaalde title/description, OG-tags, en `getLocalizedAlternates`
  voor canonical + hreflang-cluster (6 indexables + x-default).
- **Mogelijk gat**: `og:locale` tag is momenteel niet gezet
  (bv. `es_ES`, `nl_NL`). Live HTML toont enkel `og:title`, `og:description`,
  `og:url`, `og:site_name`, `og:image`, `og:type`. → ✅ **SAFE-TO-ADD**:
  uitbreiden met `og:locale` + `og:locale:alternate` per locale.
- **Mogelijk gat**: per-locale OG-images (`/og-en.jpg`, `/og-nl.jpg`, …).
  Vandaag één globale `/og-image.jpg` met EN-tekst. → ✅ **SAFE-TO-ADD**:
  asset-werk, geen architectuur-impact.

### Fase 4 — Schema.org JSON-LD per locale — `PARTIAL`
- `getLocalizedFaq()` bestaat (`seo-helpers.ts:169`) — gebruikt door
  homepage FAQPage.
- `getLocalizedBreadcrumbs()` bestaat (`seo-helpers.ts:186`).
- **Te verifiëren** (Fase 4 actie): welke pages emiteren Organization /
  WebSite / SoftwareApplication / Article schemas, en zijn die
  schema's locale-aware? `learn/[slug]/page.tsx` doet WebPage +
  Article + FAQPage in `editorialLocale` (zojuist gefixt in
  `1cae6a8`). → ✅ **SAFE-TO-ADD**: audit + uitbreiden waar nodig.

### Fase 5 — Gelokaliseerde slugs — `DONE`
- `routeTable` in `src/i18n/routes.ts` bevat 35+ routes × 16 locales.
- Specifieke slugs uit de prompt geverifieerd:
  - `/how-it-works` → ✅ alle 6 indexables vertaald
  - `/track-record` → ✅ vertaald (let op: route is nu `/track-record`,
    en daarnaast `/trackrecord` voor authed dashboard — beide gemapt)
  - `/about-us` → ✅ vertaald
  - `/match-predictions` → ✅ vertaald
  - `/bet-of-the-day` → ✅ vertaald
  - `/login`, `/register` → ✅ vertaald
- Bet-type slugs (`/bet-types/both-teams-to-score` etc.) en
  league slugs (`/match-predictions/premier-league`) zijn niet als
  zelfstandige `routeTable`-entries gemapt; die komen uit Sanity
  (`league.slug.current` per locale). → ✅ Sanity-localized, prompt-aanname
  klopt niet.
- **301-redirects van oude slugs**: niet vereist — slugs zijn altijd
  vertaald geweest binnen de huidige routeTable. Voor nieuw
  toe te voegen routes moet dit blijven werken (Fase 5 doc).
- **Aanbeveling**: ✅ status-quo correct. Eventuele `redirects-table.md`
  documentatie als deliverable produceren.

### Fase 6 — Hardcoded strings → translation keys — `PARTIAL`
- Pre-commit hooks blokkeren *nieuwe* leaks. Bestaande backlog onder
  `src/app/(app)/` (authed dashboard) is bekend — zie
  `frontend/scripts/check-no-dutch-leaks.mjs --all` voor full lijst.
  → ✅ **SAFE-TO-ADD**: backlog incrementeel afwerken via bestaande
  `i18n-batch.json` workflow.
- De prompt noemt strings die op de **homepage** zouden staan
  ("AI football predictions that actually deliver", "Losses shown too",
  pricing tiers, footer, FAQ). Deze moeten geverifieerd worden tegen
  de huidige homepage-broncode (Sanity-driven hero, footer-component,
  pricing-component) voordat we conclusies trekken. → ⏳ Fase 6 actie:
  audit-script `scripts/audit-en-leaks.mjs` draaien.

### Fase 7 — Sanity CMS uitbreiden — `PARTIAL`
- `localeString` en `localeText` Sanity-types bestaan en werken voor
  homepage, league hubs, bet-type hubs, learn pillars, FAQs, blog.
- **Mogelijk gat**: pricing tier features. Te verifiëren in Sanity-schema
  (`frontend/sanity/schemas/`).
- **Aanbeveling**: ✅ **SAFE-TO-ADD**: schema-audit + content-team
  briefing voor ontbrekende vertalingen.

### Fase 8 — Interne links via locale-aware `<Link>` — `DONE`
- `useLocalizedHref()` hook bestaat (`locale-provider.tsx:95`) en
  wordt door alle marketing-pages gebruikt:
  `<Link href={lhref("/learn")}>` produceert
  `/nl/leren` / `/de/lernen` / etc. afhankelijk van `useTranslations().locale`.
- **Mogelijk gat**: server-side links (in JSON-LD, sitemap, redirect
  destinations) en hard-coded `<a href="/checkout?plan=gold">` zonder
  locale-prefix. → ⏳ Fase 8 actie: grep op letterlijke `href="/`
  patterns in marketing-routes.

### Fase 9 — Robots + sitemap — `PARTIAL`
- `robots.ts` bestaat. Inhoud te verifiëren.
- `sitemap.xml` bestaat als custom route. Inhoud te verifiëren —
  prompt vraagt om `<xhtml:link rel="alternate" hreflang>` per entry.
- **Aanbeveling**: ⏳ Fase 9 audit; mogelijk **SAFE-TO-ADD**.

### Fase 10 — Validatie tooling — `DONE`
- `scripts/validate-i18n-seo.mjs` bestaat.
- `scripts/check-no-hardcoded-strings.mjs` actief in pre-commit.
- `scripts/check-no-dutch-leaks.mjs` actief in pre-commit.
- `scripts/check-canonicals.mjs` bestaat.
- **Mogelijk gat**: stopword-detectie per locale (Fase 10 #29) is niet
  geïmplementeerd. Alleen NL-leaks worden actief gepoliced. Voor
  ES/DE/FR/IT zou een vergelijkbare guard waardevol zijn. →
  ✅ **SAFE-TO-ADD**.

### Fase 11 — BAILOUT_TO_CLIENT_SIDE_RENDERING fix — `MISCATEGORIZED`
- De prompt baseert zich op gestripte broncode-analyse. De HTML die
  bailout toont is van `/(app)/predictions` — dat is een **authed
  dashboard-pagina** met `AuthGuard`, `cookies()`-reads en
  client-only state. Bailout daar is *correct* gedrag, niet een bug.
- Marketing-pages (homepage, /learn, /how-it-works, /pricing) zijn
  server-renderd; live curl met `-A Googlebot` toont volledige content
  in HTML.
- **Aanbeveling**: ❌ geen actie nodig. Te verifiëren met curl per pagina
  als Fase-11 audit-stap.

### Fase 12 — Post-deploy testing — `SAFE-TO-ADD`
- Manuele checklist + Lighthouse-CI per locale. Geen architectuur-impact.

---

## 3. Conflict-matrix met CLAUDE.md

| Prompt-actie | CLAUDE.md-regel | Conflict |
|---|---|---|
| `app/[locale]/` segment | Sectie "Frontend route groups" beschrijft middleware-rewrite | ❌ ja |
| Migratie naar `next-intl` | i18n-regel #1-#7 beschrijven `messages.ts` API | ❌ ja |
| Hreflang voor 6 talen "ondanks 15 in CMS" | i18n-regel #2: "Supported locales are frozen at 16" + 6 indexable was bewuste recovery | ⚠️ herhaalt al-bestaand gedrag |
| 301-redirects voor "oude Engelse slugs" | Slugs zijn nooit Engels geweest op locale routes | ⚠️ niet van toepassing |
| Hardcoded slug-tabel `lib/i18n/slugs.ts` | `src/i18n/routes.ts` bestaat al met dezelfde data | ⚠️ duplicaat |

---

## 4. Aanbevolen scope (revised)

Op basis van bovenstaande analyse + de instructie *"functionaliteit
niet beschadigen"*, voorstel: **alleen de onderstaande sub-acties
uitvoeren** uit de prompt. Alles wat in §2 als `DESTRUCTIVE` of
`CONFLICTS` staat → niet aanraken.

### Veilig uit te voeren (per fase, in volgorde):
1. **Fase 3.b** — `og:locale` + `og:locale:alternate` toevoegen aan
   `seo-helpers.ts` + alle `generateMetadata`-callers. (~50 regels code)
2. **Fase 4** — schema-audit per page.tsx; locale-aware Organization /
   WebSite / SoftwareApplication. (~200 regels)
3. **Fase 6** — `scripts/audit-en-leaks.mjs` runnen op marketing-pages,
   gevonden leaks oplossen via `messages.ts` + `i18n-batch.json` flow.
4. **Fase 7** — Sanity-schema audit, ontbrekende localeString-fields
   identificeren, briefing-doc voor content-team. Geen schema-changes
   zonder confirmatie.
5. **Fase 8** — grep `href="/[a-z]` in marketing-routes; replace met
   `lhref()` waar locale-prefix mist.
6. **Fase 9** — sitemap audit; `<xhtml:link rel="alternate">` toevoegen
   indien nog ontbrekend.
7. **Fase 10.b** — stopword-guard uitbreiden naar ES/DE/FR/IT
   (kopie van NL-guard pattern).
8. **Fase 12** — `scripts/post-deploy-i18n-check.mjs` opzetten
   (curl per locale → assert lang/title/canonical/hreflang).

### Niet uitvoeren (zou productie breken):
- Fase 1 (`[locale]`-restructure)
- Fase 2 (`next-intl` migratie)
- Fase 5 (slug-tabel duplicaat — bestaat al in `routes.ts`)
- Fase 11 (bailout — geen bug, authed-route-gedrag)

---

## 5. Volgende stap — bevestiging gevraagd

Cas, het architectuurrapport is daarmee af. Voor ik aan de **veilige**
sub-acties (§4) begin, wil ik je expliciete go op:

- ✅ Bevestigt dat ik §4 als scope hanteer (= veilige fases) en §2
  destructieve fases laat liggen?
- ✅ Of wil je per item dat ik denk te skippen alsnog een second-opinion?
- ✅ Aparte branches per veilige sub-actie, of alle 8 op één branch?

Tot je antwoord blijft de branch `fix/i18n-seo-overhaul` zonder
code-wijzigingen — alleen dit rapport-bestand is toegevoegd.
