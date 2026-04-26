# Fase 4 — Indexing-directives scan

> Datum: 2026-04-26
> Bronnen: live `https://betsplug.com/robots.txt`, live `/sitemap.xml`, gerenderde `<head>`, HTTP response-headers.

## 4.1 robots.txt

Live response:

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /studio
Disallow: /studio/
Disallow: /dashboard/
Disallow: /myaccount
Disallow: /subscription
Disallow: /favorites
Disallow: /about$
Disallow: /predictions/
Disallow: /trackrecord
Disallow: /checkout
Disallow: /login
Disallow: /welcome
Disallow: /reports/
Disallow: /weekly-report/
Disallow: /search
Disallow: /results/
Disallow: /deals/
Disallow: /strategy/
Disallow: /matches/
Disallow: /teams/
Disallow: /bet-of-the-day/
Disallow: /jouw-route/

Sitemap: https://betsplug.com/sitemap.xml
```

### Bevindingen

| # | Issue | Niveau |
|---|-------|--------|
| R1 | `Disallow: /predictions/` heeft trailing slash → blokkeert /predictions/sub maar **niet** `/predictions` zelf. Dit is bewust (de teaser-pagina is publiek), maar in combinatie met Disallow `/about$` (wél exact) is het inconsistent qua patroon. OK voor nu. | OK |
| R2 | `Disallow: /trackrecord` (zonder trailing slash, geen `$`) is een **prefix-match**. Het blokkeert ook `/trackrecord-anything`. Onderzoek toont dat de NL slug voor de publieke `/track-record` pagina is `trackrecord-resultaten` — niet onder /trackrecord want die zit alleen in /nl/-prefix. **Geen botsing.** Maar de NL slug `trackrecord-resultaten` is verwarrend en suggereert dat het de privé-tracker is. | LOW |
| R3 | **Geen Disallow voor `/xx/dashboard/`, `/xx/myaccount`, `/xx/subscription`, `/xx/favorites`** etc. Robots disallow is alleen op canonical EN-paths. Aangezien middleware bij hits op `/de/dashboard` rewrite naar `/dashboard`, krijg je 200 OK met DE-locale render. Crawler ziet 16× pseudo-duplicate dashboard-pagina's. | **HIGH** |
| R4 | `Disallow: /jouw-route/` — een **NL-slug** in robots.txt. De canonical in `routeTable` is `/jouw-route` (zie 1.4), maar de Engelse equivalent zou `/your-route` moeten zijn. Robots blokkeert dus alleen de NL-prefix versie van een onduidelijk gemodelleerde route. | LOW (verwarring) |
| R5 | Geen blokkade van CSS/JS — `/_next/static/*` is bereikbaar. ✅ | OK |
| R6 | Sitemap-referentie aanwezig. ✅ | OK |

### Aanbevelingen Fase 10

- Voor authed-paths in alle 16 locales: **noindex via meta** is sterker dan robots-disallow, want robots-disallow leidt nog steeds tot URL-listing in SERPs onder bepaalde omstandigheden ("Indexed, though blocked by robots"). Plus: middleware kan elk authed-path detecteren en `X-Robots-Tag: noindex` header zetten ongeacht prefix.
- Vereenvoudig pattern-onderhoud: gebruik consistent `Disallow: /path/` (slash) voor mappen, `Disallow: /path$` voor exacte match.

## 4.2 sitemap.xml

Live respons:

- 1.299 `<url>` entries.
- 22.032 `<xhtml:link rel="alternate">` entries (klopt: 1.299 × ~17 alternates = ~22.000, minus de 3 legal-pages die geen alternates hebben).
- Eerste segment-counts:
  ```
  81 entries per locale prefix (16 locales × 81 = 1.296)
  41 /bet-types/...   (canonical EN)
  22 /match-predictions/...  (canonical EN)
   7 /learn/...
   2 /articles
   1 /track-record / /pricing / /how-it-works / /privacy / /cookies / /terms / /responsible-gambling
  ```

> Het patroon "81 per locale" komt voor: 81 × 16 = 1.296, plus 3 legal-pages = 1.299. ✓

### Bevindingen

| # | Issue | Niveau |
|---|-------|--------|
| S1 | **`/responsible-gambling` zit in de sitemap** maar bestaat niet in `routeTable`. Pagina-bestand `frontend/src/app/responsible-gambling/page.tsx` bestaat. | LOW |
| S2 | **Alle 8 onvolledige locales (pt/tr/pl/ro/ru/el/da/sv) hebben volledige 81-URL coverage** met self-canonical en hreflang, hoewel hun content gedeeltelijk Engels is. Dit is exact wat Google straft. | **CRITICAL** |
| S3 | Geen URL die in `/api/`, `/admin/`, `/studio` valt. ✅ | OK |
| S4 | Lastmod wordt voor alle entries op één moment (`2026-04-26T20:04:19.319Z` ten tijde van fetch) gezet, en alleen Sanity-articles krijgen hun eigen `publishedAt`. Voor sitemap-validiteit acceptabel; voor crawlers minder informatief (Google ziet "alles veranderde tegelijk"). | LOW |
| S5 | XSL-styling werkt (`Content-Type: text/xsl` voor `/sitemap.xsl`). ✅ Niet schadelijk. | OK |
| S6 | Geen `<sitemapindex>` — alles in één bestand. 1.299 URLs ligt ruim binnen het 50.000-URL-limiet, dus OK. Verdere groei (bv. een grote artikelen-export) zou een sitemap-index nodig maken. | LOW |
| S7 | Iedere niet-EN pagina-URL heeft een hreflang-cluster die zichzelf opsomt. ✅ Reciprociteit is structureel correct. | OK |
| S8 | **Geen URLs uit `(app)`-groep** in sitemap. ✅ | OK |
| S9 | **`bet-of-the-day`** zit in sitemap niet, want niet in `PUBLIC_PATHS` van `sitemap.xml/route.ts`. Tegelijk staat `/bet-of-the-day/` in robots Disallow — consistent. | OK |

## 4.3 Meta robots tags in HTML

Op alle 50 onderzochte URLs (zie Fase 3): **geen** `<meta name="robots">` tag in de HTML. Standaardgedrag voor Next.js/Vercel = "indexeerbaar tenzij anders aangegeven". Dat klopt met de huidige strategie ("alle 16 locales indexeerbaar"). Maar dat betekent ook dat we onvolledige locales niet via meta-noindex kunnen markeren zonder code-wijziging.

Authed-pagina's (in `(app)`-groep) hebben **wel** `noindex,nofollow` via een gedeelde `metadata` of `robots` field, maar zijn ook al door middleware/redirects beschermd voor anonieme bezoekers — Googlebot zou een redirect zien. Te valideren in fase 5.

## 4.4 X-Robots-Tag HTTP headers

Live response-headers:

| Pagina | X-Robots-Tag | Andere relevante |
|---|---|---|
| `https://betsplug.com/` | (afwezig) | `content-language: en` |
| `https://betsplug.com/de` | (afwezig) | `content-language: de`, `set-cookie: NEXT_LOCALE=de` |
| `https://betsplug.com/de/pricing` | (afwezig) | `content-language: de`, `set-cookie: NEXT_LOCALE=de` |
| `https://betsplug.com/api/health` | (afwezig) | `content-type: application/json` |

`X-Robots-Tag` wordt **alleen** door middleware gezet op niet-canonical hosts (`*.vercel.app` previews) — zie `applyIndexability()` in `middleware.ts:46-54`. Productie krijgt geen header.

## 4.5 Redirect-gedrag

| Probe | Verwacht | Werkelijk |
|---|---|---|
| `/en/` | 308 → `/` | `308 → https://betsplug.com/` ✅ |
| `/en/pricing` | 308 → `/pricing` | `308 → https://betsplug.com/pricing` ✅ |
| `/voorspellingen` (bare NL slug) | 308 → `/predictions` | `308 → https://betsplug.com/predictions` ✅ |
| `/prognosen` (bare DE slug) | 308 → `/predictions` | `308 → https://betsplug.com/predictions` ✅ |
| `/predicciones` (bare ES slug) | 308 → `/predictions` | `308 → https://betsplug.com/predictions` ✅ |

Redirect-keten netjes: één hop. ✅

## 4.6 Synthese — directives en hun effectief gedrag

```
ROBOTS                       → Open op alles publiek, dichte deur op /api/, /admin/, /studio,
                                authed paths in EN (maar NIET in /xx/ varianten)
META ROBOTS                  → Niet aanwezig op publieke pages → indexeerbaar
X-ROBOTS-TAG                 → Niet aanwezig in productie
SITEMAP                      → Volledig open, 1.299 URLs incl. 8 locales met onvolledige content
RENDERING                    → SSR overal, alle content in initial HTML
```

> **De directive-laag is "doe alles open en hopelijk komt het goed"**. Er zit geen vangnet voor de gevallen waar content nog niet klaar is. Voor de Fase 10-implementatie is dit waar de eerste defensieve laag moet komen: middleware moet `noindex` kunnen zetten per locale (op basis van een whitelist) zonder elk pagina-bestand aan te raken.

## 4.7 Vroege doorkijk naar Fase 10-acties op deze laag

1. **Middleware uitbreiden** met een `LOCALE_INDEXABLE: Locale[]` whitelist. Voor non-whitelisted locales: `res.headers.set("X-Robots-Tag", "noindex, follow")`. (`follow` zodat de hreflang en interne links nog crawlbaar blijven voor signal-flow.)
2. **Sitemap kortwieken**: alleen URLs voor locales in `LOCALE_INDEXABLE` enumeren.
3. **Hreflang-cluster** in `seo-helpers.ts`/`sitemap.xml/route.ts`: alleen `LOCALE_INDEXABLE` opnemen. Een hreflang naar een noindex-URL is een "hreflang error" volgens Google's eigen docs.
4. **robots.txt** verschoont voor authed paths: `Disallow: /*/dashboard/`, `Disallow: /*/myaccount`, etc. — wildcard prefixes om alle 16 locale-prefixen tegelijk te dekken (Google ondersteunt `*` in robots).
5. **`/responsible-gambling`** toevoegen aan `routeTable` (al wel in `PUBLIC_PATHS`).

---

**Volgende stap:** Fase 5 — canonical forensics per pagina-template.
