# Fase 1 — Stack- en codebase-inventaris

> Datum: 2026-04-26
> Branch: `seo/full-recovery`
> Scope: alleen `frontend/` — de FastAPI/ML backend bedient `/api/*` en wordt door zoekmachines niet gecrawld (hard disallow in robots).

## 1.1 Tech-stack

| Onderdeel | Versie / keuze | Bron |
|-----------|----------------|------|
| Framework | **Next.js 14.2** App Router | `frontend/package.json:36` |
| React | 18.3 | `frontend/package.json:38-39` |
| TypeScript | 5.6 | `frontend/package.json:60` |
| UI | Tailwind 3.4 + Radix + shadcn-conventies | `frontend/tailwind.config.ts` |
| Data-laag (frontend) | TanStack Query 5.60 | `frontend/package.json:30` |
| CMS | Sanity 3.99 (embedded studio op `/studio`) | `frontend/package.json:42`, `frontend/sanity/` |
| Package manager | **npm** (`package-lock.json` + `npm ci`) | `frontend/vercel.json:5` |
| Output mode | `output: "standalone"` | `frontend/next.config.js:3` |
| Hosting | **Vercel**, region `fra1` | `frontend/vercel.json:8` |
| Runtime | Node (Next.js standalone) | — |

> README claimt Next 15 / React 19, dat klopt niet. `package.json` is leidend (zie ook `CLAUDE.md`).

## 1.2 Routing & rendering

- **App Router**, route-groups:
  - `src/app/*` — publieke marketing/SEO-pagina's (root, `home-content.tsx`, `pricing`, `articles`, `learn`, `match-predictions`, `bet-types`, `track-record`, `engine`, `about-us`, `contact`, legal, auth-pagina's).
  - `src/app/(app)/*` — authed dashboard (private, mag niet geïndexeerd worden).
  - `src/app/api/*` — Next-side API (proxy / Stripe / Sanity webhooks).
  - `src/app/studio/*` — Sanity Studio.
- **Rendering-modus**: standaard SSR via Server Components. `src/app/sitemap.xml/route.ts` heeft `revalidate = 60` (ISR voor sitemap). Geen `output: "export"`, dus geen statische export.
- **Middleware** (`src/middleware.ts`): draait op elke niet-asset/-API-request en bepaalt de locale.

### Middleware-gedrag (versie 2026-04-24, "Nerdytips Phase 4")

```
/en/<path>              → 308 redirect → /<path>            (default-locale mag maar één URL hebben)
/<xx>/<path>            → internal rewrite → /<canonical-path>  + header x-locale=<xx>
/<niet-EN-slug>         → 308 redirect → /<canonical-EN-slug>
/<canonical-EN-path>    → serve as-is, x-locale=en
preview hosts (*.vercel.app) → X-Robots-Tag: noindex,nofollow
```

> **Belangrijk**: alle 15 niet-default-locale-URLs zijn nu **indexeerbaar** met een eigen self-canonical en een hreflang-cluster. Dat is een bewuste keuze die in de commits van 2026-04-24 is gezet.

## 1.3 i18n-implementatie

- **Geen externe library**. Volledig zelfgebouwd.
- 16 ondersteunde locales (`src/i18n/config.ts:20-39`):
  ```
  en, nl, de, fr, es, it, sw, id, pt, tr, pl, ro, ru, el, da, sv
  ```
  Default: `en`.
- **String-bron**: `src/i18n/messages.ts` bevat de Engelse `en` dictionary (bron van waarheid) + de NL inline. Alle 14 andere locales staan in losse files (`src/i18n/locales/<locale>.ts`) en worden in `messages.ts` samengevoegd.
- **String-volume**: `messages.ts` is **5.914 regels**. Per locale-file: 2.667–2.717 regels. Dit zijn ~2.500 vertaalbare keys per locale.
- **Server-side locale-detectie** (`src/lib/seo-helpers.ts:42-58`): leest `x-locale` header (door middleware gezet), valt terug op `NEXT_LOCALE` cookie, dan `defaultLocale`.
- **Client-side**: `LocaleProvider` (`src/i18n/locale-provider.tsx`) ontvangt `locale` als prop vanuit root layout en exposeert `useTranslations()` → `t(key, vars)`.
- **Locale-prefix-gedrag**: bestaande pagina-files gebruiken **geen** `/[locale]` segment. Het hele systeem hangt aan middleware-rewriting + `x-locale` header.

### Gevolg voor SSR

`generateMetadata()` per pagina roept `getServerLocale()` aan; de active locale komt uit het header. Daardoor:
- `<title>` / `<meta description>` / `og:*` / `twitter:*` worden in de juiste taal gerenderd.
- `<html lang>` (`src/app/layout.tsx:117`) wordt op de actieve locale gezet.
- Canonical wijst naar **zichzelf** in de active locale (`getCanonicalUrl()` in `seo-helpers.ts:65-71`).
- `alternates.languages` levert een 16+1 hreflang-cluster op elke pagina.

## 1.4 Locale-routes & vertaalde slugs (`src/i18n/routes.ts`)

`routeTable` mapt **canonical EN-pad → per-locale slug**. Patroon per route:

| Route-type | Voorbeeld | Status |
|------------|-----------|--------|
| Volledig vertaald (NL/DE/FR/ES/IT/SW/ID) | `/predictions` → `/voorspellingen, /prognosen, /predictions, /predicciones, /pronostici, /utabiri, /prediksi` | OK |
| **Niet vertaald (PT/TR/PL/RO/RU/EL/DA/SV)** | dezelfde route → 8× **`/predictions`** (Engels slug, alleen prefix `/pt/`, `/tr/` …) | Slugs Engels — content wordt door middleware naar de canonical pagina gerouteerd en via `t()` vertaald |
| Identiek over alle locales | `/admin`, `/b2b`, `/cookies`, `/dashboard`, `/live-score` | OK |
| **Asymmetrische canonical** | `/jouw-route` (NL-key) maps `en: "/your-route"` | Bug-vermoeden — canonical-key zou EN moeten zijn |

> Lijst dekt **38 canonical paths**. Dynamische routes (`/articles/[slug]`, `/learn/[slug]`, `/match-predictions/[league_slug]`, `/bet-types/[slug]`) erven het prefix-patroon van hun parent.

## 1.5 Content-bron per pagina-template

| Pagina-template | Content-bron |
|-----------------|--------------|
| `/` (root) | Hardcoded sections in `src/app/home-content.tsx` + Sanity (homepage doc) + i18n strings via `t()` |
| `/articles`, `/articles/[slug]` | Sanity (`fetchArticles`, `fetchArticleBySlug`) |
| `/learn`, `/learn/[slug]` | Sanity (`learnPillars`) |
| `/match-predictions`, `/match-predictions/[league_slug]` | Sanity hubs + backend-API live data |
| `/bet-types`, `/bet-types/[slug]`, `/bet-types/[slug]/[league]` | Local data file (`src/data/bet-type-hubs.ts`, `bet-type-league-combos.ts`) + Sanity hubs |
| `/about-us`, `/how-it-works`, `/engine`, `/track-record`, `/b2b`, `/contact` | Hardcoded copy + i18n strings |
| Legal (`/privacy`, `/terms`, `/cookies`) | Hardcoded + i18n |
| Auth (`/login`, `/register`, …) | Hardcoded + i18n |

> Sanity-docs hebben **per-locale localized fields** (zie `frontend/sanity/schemas/`); DeepL-aangedreven script `scripts/translate-sanity.ts` houdt non-EN-locales gevuld.

## 1.6 Hosting / deployment configuratie

- **`frontend/vercel.json`** — minimale config, alleen build-commands. Geen redirects of headers.
- **`frontend/next.config.js`**:
  - `output: "standalone"`.
  - Image-optimisatie: AVIF/WebP, remote patterns voor Unsplash, Sanity, api-sports.
  - `headers()`: alleen `Content-Type: text/xsl` voor `/sitemap.xsl`.
  - `redirects()`: 16 hard-coded 308 redirects (`/live`, `/settings`, en alle locale-varianten daarvan).
- **Geen** `_redirects`, `_headers`, `.htaccess`, of `netlify.toml`.

## 1.7 Robots & sitemap (samenvatting; details in Fase 4)

- **`src/app/robots.ts`**: dynamische robots.txt. Allow `/`, disallow `/api/`, `/admin/`, `/studio`, `/dashboard/`, `/myaccount`, `/subscription`, `/favorites`, `/about$`, `/predictions/`, `/trackrecord`, `/checkout`, `/login`, `/welcome`, `/reports/`, `/weekly-report/`, `/search`, `/results/`, `/deals/`, `/strategy/`, `/matches/`, `/teams/`, `/bet-of-the-day/`, `/jouw-route/`. Sitemap-referentie aanwezig.
- **`src/app/sitemap.xml/route.ts`**: dynamische sitemap. Voor elke canonical path × 16 locales één `<url>` met `xhtml:link` hreflang-cluster van 17 entries (16 + x-default). Inclusief Sanity-slugs (articles, learn, league hubs, bet-type hubs) en bet-type×league-combo's.

## 1.8 Vroege observaties (worden in latere fases uitgewerkt)

1. **Slug-mismatch in 8 locales** (`pt/tr/pl/ro/ru/el/da/sv`): `/pt/predictions` heeft een Engelse slug maar serveert (theoretisch) Portugese content. Voor Google ziet zo'n URL er niet locale-native uit; het schaadt waarschijnlijk de relevance-signalen. Nog erger: middleware doet alleen prefix-stripping, dus `/pt/predictions` rewrite naar `/predictions` werkt — maar in 6.4 verifiëren we of de ge-rendere content écht Portugees is en niet (deels) Engels.
2. **Stale comments wijzen op recente flip**: `locale-provider.tsx:55` en `layout.tsx:52-57` noemen nog "X-Robots-Tag noindex" en "no hreflang", terwijl de huidige middleware (2026-04-24) juist alles indexeerbaar maakt en hreflang **wel** uitstuurt. De *implementatie* is geüpdatet, maar er kan ergens een vergeten stuk zijn — kandidaat-locatie van de regressie.
3. **`/jouw-route` heeft een NL-key als canonical**, niet `/your-route`. Asymmetrie tegen het patroon van de rest van de routeTable.
4. **Geen pre-rendered fallback voor onbekende locales**. Als de middleware faalt of een edge-case mist, krijgt de bezoeker default Engels gerenderd op een /xx/ URL. Dat is precies het mengsel-symptoom dat de gebruiker meldt.
5. **Geen tests** rondom i18n / SEO directives (`grep -l "describe" frontend/src/i18n` levert niets) — alle SEO-regressies moeten met curl-checks gedetecteerd worden.

---

**Volgende stap:** Fase 2 — git-archeologie van de hreflang/i18n/sitemap-commits.
