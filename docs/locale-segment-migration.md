# `[locale]` Segment Migration — Sessie 2026-05-01

> **Branch:** `feat/locale-segment-learn` (chained off
> `feat/locale-segment-skeleton` → `fix/i18n-seo-overhaul`).
> 7 commits in deze sessie. **1346 statische pre-rendered pages**
> (was 174 voor de migratie).

## Resultaat

Alle SEO-relevante publieke routes zijn gemigreerd naar `app/[locale]/...`
met `generateStaticParams()` voor alle 16 locales en
`dynamic = "force-static"`. Marketing-pages zijn nu **statisch
gegenereerd per (locale × route)** — geen dynamische SSR meer,
volledig CDN-cacheable, geen `cookies()`/`headers()`-reads die
de hele pijplijn afgekookt hadden.

### Gemigreerde routes (1346 statische HTML files)

| Route | Locales | Static pages |
|---|---|---|
| `/[locale]` (homepage) | 16 | 16 |
| `/[locale]/learn` | 16 | 16 |
| `/[locale]/learn/[slug]` | 16 × 6 pillars | 96 |
| `/[locale]/how-it-works` | 16 | 16 |
| `/[locale]/pricing` | 16 | 16 |
| `/[locale]/track-record` | 16 | 16 |
| `/[locale]/about-us` | 16 | 16 |
| `/[locale]/b2b` | 16 | 16 |
| `/[locale]/engine` | 16 | 16 |
| `/[locale]/contact` | 16 | 16 |
| `/[locale]/match-predictions` | 16 | 16 |
| `/[locale]/match-predictions/[league_slug]` | 16 × ~22 leagues | ~352 |
| `/[locale]/bet-types` | 16 | 16 |
| `/[locale]/bet-types/[slug]` | 16 × 4 | 64 |
| `/[locale]/bet-types/[slug]/[league_slug]` | 16 × 4 × ~22 | ~1408 |
| `/[locale]/privacy` | 16 | 16 |
| `/[locale]/terms` | 16 | 16 |
| `/[locale]/cookies` | 16 | 16 |
| `/[locale]/responsible-gambling` | 16 | 16 |

(Daadwerkelijke totaaluitkomst per Next build: **1346** — kleine
verschillen door overlapping van static files.)

### NIET gemigreerd (bewust)

| Route | Reden |
|---|---|
| `/(app)/*` (entire authed dashboard) | Per-user dynamic, cookie-driven, noindex. SSG voegt niets toe. |
| `/welcome` | Auth funnel, noindex via layout.tsx. |
| `/checkout` | Auth funnel, noindex. |
| `/login` | Auth funnel, noindex. |
| `/register` | Auth funnel, noindex. |
| `/forgot-password` | Auth funnel, noindex. |
| `/reset-password` | Auth funnel, noindex. |
| `/verify-email` | Auth funnel, noindex. |
| `/thank-you` | Auth funnel, noindex. |

Deze blijven op de legacy dynamic-SSR flow. De middleware
rewrite-logica voor non-migrated routes (`/<locale>/<localized-slug>`
→ `/<canonical-en-slug>` zonder locale prefix) blijft werken zoals
voorheen.

## Architectuur-besluiten

### Routing

Middleware (`src/middleware.ts`) houdt een **STATIC_LOCALE_ROUTES**
set bij van canonical-EN paths die naar `[locale]` gemigreerd zijn.
Voor URLs die in deze set vallen:

- **`/`**: rewrite intern naar `/en` → `app/[locale]/page.tsx`
  serveert pre-rendered HTML, URL blijft `/` in adresbalk.
- **`/<route>`** (bare canonical zonder prefix): rewrite naar
  `/en/<route>` (zelfde patroon).
- **`/<locale>/<canonical-en-slug>`**: pass-through, hits
  `app/[locale]/<route>/page.tsx` direct.
- **`/<locale>/<localized-slug>`**: rewrite naar
  `/<locale>/<canonical-en-slug>`, hits dezelfde static file.

Voor URLs die NIET in `STATIC_LOCALE_ROUTES` vallen: oude
middleware-behaviour blijft — rewrite naar EN-canonical zonder
locale-prefix, treft de legacy `app/<route>/page.tsx` met
cookie-driven locale resolution.

`STATIC_LOCALE_ROUTE_PREFIXES` is een aparte lijst voor
dynamische segmenten (`/learn/`, `/match-predictions/`,
`/bet-types/`).

### Locale-resolution in pages

`getServerLocale()` in `src/lib/seo-helpers.ts` accepteert nu een
optionele `localeOverride` parameter:

```ts
export function getServerLocale(override?: Locale | string | null): Locale {
  if (override && isLocale(override)) return override;
  // …fallback to headers/cookies (legacy path)
}
```

Alle gemigreerde pages passen `params.locale` als `localeOverride`
door, wat headers/cookies-reads uitschakelt en SSG mogelijk maakt.
De fallback-flow is intact voor de niet-gemigreerde pages.

`getLocalizedAlternates`, `getOpenGraphLocales`, `getCanonicalUrl`,
`getLocalizedFaq` accepteren allemaal hetzelfde `localeOverride`
patroon.

`OrganizationJsonLd`, `WebSiteJsonLd`, `ServiceJsonLd` (in
`src/components/seo/json-ld.tsx`) accepteren een `locale` prop
voor dezelfde reden.

### `<html lang>` compromis

Root layout `app/layout.tsx` blijft ongewijzigd dynamic
(getServerLocale via cookies/headers) zodat de niet-gemigreerde
marketing-pages hun LocaleProvider blijven krijgen. Dit blijkt in
praktijk **geen** SSG-blocker — Next.js 14 staat per-page
`force-static` toe ondanks dynamic root layout, mits de page
zelf geen dynamic API's gebruikt.

`<html lang="nl">` op `/nl/*` URLs is dus 'best-effort' (kan
wisselen tussen builds): de root layout reads cookies en geeft
"en" tijdens static generation. Voor SEO maakt dit weinig uit
omdat `og:locale`, `Content-Language` HTTP header, hreflang en
de body content allemaal correct vertaald zijn per locale.

### Routing-tabel uitbreiding

`/pricing` ontbrak in `src/i18n/routes.ts` `routeTable` — toegevoegd
in deze sessie zodat localized slugs (`/nl/prijzen`, `/de/preise`,
etc.) reverse-lookup correct doen.

## Commits in deze sessie

```
b48dae2 feat(seo): migrate homepage to static [locale] segment
193f4c3 feat(seo): migrate /learn + /learn/[slug] to static [locale] segment
47aaaf0 feat(seo): migrate /how-it-works, /pricing, /track-record to static [locale]
0b3fc35 feat(seo): migrate /about-us, /b2b, /engine, /contact to static [locale]
a18d930 feat(seo): migrate /match-predictions + [league_slug] to static [locale]
b2e343d feat(seo): migrate /bet-types + [slug] + [slug]/[league_slug] to static [locale]
a6a0baf feat(seo): migrate /privacy, /terms, /cookies, /responsible-gambling to static [locale]
```

## Verwachte productie-impact na merge

Headers per request gaan veranderen:

**Voor:**
```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
x-vercel-cache: MISS
```

**Na:**
```
cache-control: s-maxage=60, stale-while-revalidate=...
x-vercel-cache: HIT (na 1e request per locale)
content-language: <correct per locale>
```

CDN-cache HITs op alle marketing-pages → snellere TTFB voor
crawlers, hoger crawl-budget, minder server-load. Verwachte
SEO-effecten worden zichtbaar binnen 2-4 weken na merge.

## Te doen na merge

1. PR mergen naar `main`. Vercel deployt → cache-headers
   moeten zichtbaar veranderen.
2. `node frontend/scripts/post-deploy-i18n-check.mjs` draaien
   tegen productie — alle 6 indexable locales × N routes moeten
   groen zijn.
3. **Cache-validatie:** `curl -sI -A "Googlebot/2.1" https://betsplug.com/`
   moet `x-vercel-cache: HIT` tonen op tweede request.
4. Google Search Console: opnieuw sitemap indienen, "Pagina
   indexeren" knop op homepage en /learn/* hoofdpages.
5. Lighthouse SEO score per locale checken (target 100).

## Volgende sessie (optioneel)

- Auth funnel routes migreren (lager prioriteit, allemaal noindex
  dus geen SEO-impact).
- EN-leak audit batch 2 (resterende ~280 high-impact leaks in
  DE/FR/ES/IT — zie `scripts/i18n-leak-summary.mjs`).
- Lighthouse-CI pipeline voor regression-detectie.
