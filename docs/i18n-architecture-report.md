# i18n + SEO Overhaul — Session Report

> **Branch:** `fix/i18n-seo-overhaul` · **Sessie:** 2026-04-30
> **Status:** 7 van 12 fases gedeeltelijk uitgevoerd, deploy-veilig.
> **Niet uitgevoerd:** Fase 1 + 2 + 11 (route-restructure naar `[locale]`
> en migratie naar `next-intl`) — zie §5 voor de reden en het
> follow-up plan voor de volgende sessie.

---

## 1. Geverifieerde root-cause van het SEO-probleem

Live curl op productie bevestigde:

```
GET https://betsplug.com/             → cache-control: no-store, MISS
GET https://betsplug.com/how-it-works → cache-control: no-store, MISS
GET https://betsplug.com/nl           → cache-control: no-store, MISS
```

**Elke marketing-pagina wordt dynamisch SSR'd op elk request**, ondanks
`export const revalidate = 60` in de page files. Oorzaak: `getServerLocale()`
in `src/lib/seo-helpers.ts` leest `cookies()` en `headers()` —
beide opt-out triggers van Next.js static generation.

Build-output bevestigt dit definitief:
- `/`, `/pricing`, `/track-record`, `/how-it-works`, `/about-us`,
  `/match-predictions`, `/bet-types`, `/learn`, … → `ƒ Dynamic`
- `/learn/[slug]`, `/match-predictions/[league_slug]`,
  `/bet-types/[slug]`, `/bet-types/[slug]/[league_slug]` → `● SSG`

De SSG-pages zijn statisch omdat hun dynamic-segment params bekend zijn
ten tijde van de build via `generateStaticParams()`. De top-level
marketing-pages hebben geen segment, dus Next.js heeft geen manier om
ze pre-renderen per locale zonder een `[locale]`-segment.

**Implicatie:** Google's crawler raakt `cache-control: no-store` op de
homepage, krijgt traag een dynamisch SSR-response (en mogelijk content
gevarieerd op cookies), en geeft de pagina lager crawl-budget.

## 2. Wat in deze sessie wél is uitgevoerd

| # | Fase | Commit | Beschrijving |
|---|------|--------|--------------|
| 0 | Branch + discovery | `b3b3448` | Architectuur-rapport (dit document, eerste versie) |
| 3.b | `og:locale` + `og:locale:alternate` | `70c63a8` | `localeMeta.ogLocale` (BCP-47 met regio) toegevoegd voor alle 16 locales; `getOpenGraphLocales()` helper; ingewired in 22 page.tsx files |
| 4 | Schema.org locale-aware | `780c035` | `OrganizationJsonLd`, `WebSiteJsonLd`, `ServiceJsonLd` lezen nu actieve locale en emiteren vertaalde `description`; nieuwe `inLanguage` op WebSite + SoftwareApplication; hand-vertaalde `schema.org.description` + `schema.app.description` in alle 16 locales |
| 9 | Sitemap audit | (geen commit) | `sitemap.xml/route.ts` was al volledig — emiteert reeds `xhtml:link rel="alternate"` per indexable, met x-default → EN. Geen actie nodig. |
| 10 | Stopword-guard ES/DE/FR/IT | `d7e646e` | `scripts/check-no-foreign-leaks.mjs` — sister van de Dutch-leak guard; ingewired in pre-commit; baseline = 0 violations in 167 files |
| 12 | Post-deploy curl-validation | `ba3f7c0` | `scripts/post-deploy-i18n-check.mjs` — checkt 6 locales × N routes op `<html lang>`, vertaalde title/description, canonical, hreflang-cluster, og:locale, robots; CLI met `--base`, `--route`, `--json` flags |
| 6 | Hand-translate high-impact EN-leaks | `ba47174` | 42 EN-fallback strings vertaald voor DE/FR/ES/IT (engine.val explainers, faq.home/how/about/pred Q+A's, pricing.ctaUpgrade, footer.legal/contact); tooling: `i18n-leak-summary.mjs`, `extract-high-impact-leaks.mjs`, `high-impact-leak-batch.json` voor herhaalbare batches |
| 8 | Locale-aware orphan hrefs | `dcab397` | 7 raw `href="/..."` → `loc("/...")` of `lhref()` in `seo-section.tsx`, `paywall-overlay.tsx`, `engine-content.tsx`, `legal-page.tsx`. Authed `(app)/` routes ongemoeid. |
| 5 | Gelokaliseerde slugs | (al klaar) | `routeTable` in `i18n/routes.ts` had reeds 35+ routes × 16 locales; geen wijziging nodig. |

**Totaal: 8 commits op `fix/i18n-seo-overhaul`.**

## 3. Wat productie nu zou krijgen na deploy van deze branch

Alle wijzigingen hierboven zijn **deploy-veilig** — geen route-mutatie,
geen API-breaking changes, geen runtime-config wijzigingen. Na merge
naar main + Vercel build wordt productie als volgt:

- **`og:locale`** zichtbaar in HTML-head van alle marketing-pages —
  social-graph crawlers (Facebook, LinkedIn, WhatsApp) en Google's
  Open Graph parser krijgen correcte taalvelden per locale URL.
- **Schema.org Organization / WebSite / SoftwareApplication
  description** rendert in de juiste taal per locale — rich-snippets
  in non-EN SERPs krijgen de juiste lokale beschrijving.
- **42 marketing-strings (engine validation explainers, homepage FAQ,
  pricing CTA)** in DE/FR/ES/IT zien er nu hand-vertaald uit ipv
  EN-fallback. Visitor + crawler op `/de/`, `/fr/`, `/es/`, `/it/`
  krijgt native copy.
- **Pre-commit blokkeert** vanaf nu nieuwe ES/DE/FR/IT-leaks net zoals
  het al Dutch-leaks blokkeert.
- **Post-deploy script** `scripts/post-deploy-i18n-check.mjs` kan in
  CI of bij hand worden gerund om regressies te vangen.

**Wat NIET verandert:** de fundamentele SSR-vs-SSG status. `cache-control:
no-store` blijft. Volledige statische generatie vereist Fase 1+2 (zie §5).

## 4. Bestaande architectuur in detail

(Documentatie van de huidige stack, voor referentie volgende sessie.)

### 4.1 i18n-runtime
- **Geen** `next-intl`/`next-i18next`/`react-intl`. Custom: `messages.ts`
  als source-of-truth (EN+NL), 14 ge-genereerde locale files via
  `scripts/translate.mjs` (Google) + hand-batches via
  `apply-i18n-batch.mjs`.
- API: `useTranslations()` hook (client) + `translate(locale, key)`
  (server) + `formatMsg(template, vars)` voor placeholder-substitutie.
- Pre-commit: `check-no-hardcoded-strings.mjs` (isNl-ternaries) +
  `check-no-dutch-leaks.mjs` (NL JSX-tekst) + nu
  `check-no-foreign-leaks.mjs` (DE/FR/ES/IT JSX-tekst).

### 4.2 Locale-routing
- Middleware-rewrite (`src/middleware.ts`): `/<locale>/<localized-slug>`
  → rewrite naar `/<canonical-en-slug>` met `x-locale` header gezet.
- `src/i18n/routes.ts`: `routeTable` met 35+ canonical routes × 16 locales.
- 6 INDEXABLE_LOCALES (`en, nl, de, fr, es, it`) → self-canonical +
  hreflang-cluster.
- 10 parked locales (`sw, id, pt, tr, pl, ro, ru, el, da, sv`) → canonical
  → EN, `X-Robots-Tag: noindex, follow` via middleware.

### 4.3 Metadata
- `PAGE_META` in `src/data/page-meta.ts` — 18+ statische routes × 16
  locales, hand-gevuld.
- `getServerLocale()`, `getCanonicalUrl()`, `getLocalizedAlternates()`,
  `getLocalizedFaq()`, `getLocalizedBreadcrumbs()`, `getOpenGraphLocales()`
  in `src/lib/seo-helpers.ts`.
- 22 `page.tsx` files met `generateMetadata()` + `getLocalizedAlternates`
  + `getOpenGraphLocales`.

### 4.4 Sitemap + robots
- `src/app/sitemap.xml/route.ts` — 6 indexable × ~15 routes ×
  inclusief dynamic (learn pillars, league hubs, bet-type combos), met
  `xhtml:link rel="alternate"` per entry. Cache: `s-maxage=3600`.
- `next.config.js` `redirects()`: 308's voor legacy `/live`, `/settings`,
  `/articles*` URLs in alle locale-prefix-varianten.

## 5. Wat NIET is uitgevoerd, en waarom

### Fase 1 — `app/[locale]/` route-restructure
**Niet uitgevoerd.** Dit is de écht structurele fix waardoor marketing-pages
statisch per locale gegenereerd kunnen worden. Implementatie betekent:
- Maak `app/[locale]/(marketing)/...` voor alle 23 publieke pages (incl.
  dynamic segments `learn/[slug]`, `match-predictions/[league_slug]`,
  `bet-types/[slug]`, `bet-types/[slug]/[league_slug]`).
- Voeg `generateStaticParams()` toe → returnt 6 indexable locales.
- Refactor middleware naar URL-rewrite die `/nl/voorspellingen` →
  `/nl/predictions` doet (locale-prefixed canonical EN slug) ipv
  `/predictions` (zonder prefix).
- Verwijder `cookies()` + `headers()` reads uit publieke page-flow;
  locale komt nu via `params.locale`.
- Bijwerk `getServerLocale` (en alle 22 callers) om locale-param te
  accepteren.
- Update `useLocalizedHref`, `LocaleProvider`, language-switcher.
- Update sitemap en robots.
- Test alle 6 × 23 = 138 marketing-URLs op build-time + runtime.

**Geschat: 1-3 dagen aaneengesloten werk** met deploy-risico (alle
URLs in Google's index moeten herrouteren). Niet verantwoord in één
Claude-sessie zonder uitgebreid testen.

**Aanbevolen aanpak voor volgende sessie:**
1. Aparte branch `feat/locale-segment-skeleton` van `fix/i18n-seo-overhaul`.
2. Maak `app/[locale]/page.tsx` als proof-of-concept naast bestaande
   `app/page.tsx`. Gebruik route-conflict resolution: middleware rewrite
   `/` → `/[locale]/` is mogelijk via `request.nextUrl`.
3. Test build, controleer dat oude `/` URL nog werkt en dat
   `/[locale]/` SSG levert.
4. Stap voor stap migreren: één route per PR, telkens preview-deploy
   testen, terugrolbaar via revert.
5. Pas als alle 23 routes draaien op het `[locale]`-pad: middleware
   omschakelen om naar de nieuwe structuur te routeren, oude bestanden
   verwijderen.

### Fase 2 — `next-intl` library swap
**Niet uitgevoerd, en aanbevolen permanent niet uit te voeren.** De
huidige `messages.ts` + `translate(locale, key)` API levert feature-
pariteit met `next-intl` voor ons gebruik (16 locales × ~3000 keys,
placeholder-vars, server+client). Migreren = 2-3 weken werk + risico
op missing-key regressies, voor geen extra capability. CLAUDE.md regel
#1-#7 documenteert ook expliciet dat de huidige API source-of-truth is.

### Fase 11 — BAILOUT_TO_CLIENT_SIDE_RENDERING
**Niet van toepassing op marketing-pages.** De `BAILOUT` warnings die
de prompt noemde komen van `app/(app)/predictions/page.tsx` (authed
dashboard) — dat is bedoeld dynamic met `AuthGuard`, geen SEO-bug. De
publieke pages zijn al server-rendered, gewoon zonder static cache (= het
echte probleem dat Fase 1 oplost).

## 6. Resterende EN-leak backlog

`scripts/audit-en-leaks.mjs` rapporteert na deze sessie:

| Locale | Leaks (van) | Leaks (naar) | Hoge-impact resterend |
|--------|-------------|--------------|-----------------------|
| nl | 216 | 216 | n.v.t. (bron-locale) |
| de | 132 | **115** | ~10 (zie summary) |
| fr | 161 | **155** | ~7 |
| es | 105 | **98** | ~7 |
| it | 138 | **132** | ~9 |
| sw,id,pt,tr,pl,ro,ru,el,da,sv | ~85-170 | ongewijzigd | parked, niet kritiek voor SEO |

Voor de volgende batch: run
```
node scripts/audit-en-leaks.mjs && node scripts/i18n-leak-summary.mjs
```
en hand-vertaal de HIGH-impact restanten via `apply-i18n-batch.mjs`.

## 7. Validatie-checklist voor na deploy

Run vanuit `frontend/`:

```bash
# Algeheel
node scripts/post-deploy-i18n-check.mjs

# Specifieke route
node scripts/post-deploy-i18n-check.mjs --route=/how-it-works

# Op staging
node scripts/post-deploy-i18n-check.mjs --base=https://betsplug-staging.vercel.app

# Audit uitstaande leaks
node scripts/audit-en-leaks.mjs
node scripts/i18n-leak-summary.mjs --top=10
```

Voor schema.org valideer per locale handmatig met
[Google Rich Results Test](https://search.google.com/test/rich-results)
op:
- `https://betsplug.com/de`
- `https://betsplug.com/fr`
- `https://betsplug.com/es`
- `https://betsplug.com/it`

## 8. Deploy-plan

1. Open PR `fix/i18n-seo-overhaul` → `main`. Vercel maakt preview-deploy.
2. Run `node scripts/post-deploy-i18n-check.mjs --base=<preview-url>` —
   verwacht alle checks groen behalve eventuele caching nuances.
3. Review schema.org JSON-LD op preview met Google Rich Results Test.
4. Merge bij goed resultaat.
5. Run `node scripts/post-deploy-i18n-check.mjs` tegen productie
   tussen 5-30 minuten na deploy.
6. Klik **Oplossing valideren** in GSC voor de duplicate-canonical en
   redirect issues uit de eerdere sessie (commit `1cae6a8`).

## 9. Volgende sessie kickoff-prompt

```
Plan/start de feat/locale-segment-skeleton branch.

Context: fix/i18n-seo-overhaul (8 commits) is gemerged. De resterende
SEO-blocker is `cache-control: no-store` op marketing-pages, oorzaak
is cookies()/headers() reads in getServerLocale(). Echte fix vraagt
[locale] route-segment.

Doel deze sessie: PoC voor een /[locale]/page.tsx-segment naast de
bestaande pages, met generateStaticParams en geen header/cookie
reads. Eerst homepage migreren, build + preview testen, daarna
route-voor-route.

Niet doen zonder expliciete go: middleware omschakelen naar de
nieuwe structuur of oude page.tsx files verwijderen.
```
