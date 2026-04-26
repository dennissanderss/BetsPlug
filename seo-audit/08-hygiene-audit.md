# Fase 8 — Hygiene & Performance audit

> Datum: 2026-04-26
> Bron: gerenderde HTML + HTTP headers van betsplug.com (live productie).

## 8.1 Open Graph & Twitter Card

| Tag | EN homepage | Per locale? | Status |
|-----|-------------|-------------|--------|
| `og:title` | ✅ aanwezig | ✅ vertaald | OK |
| `og:description` | ✅ aanwezig | ✅ vertaald | OK |
| `og:url` | ✅ wijst naar homepage | (te verifiëren of locale-aware) | OK |
| `og:site_name` | "BetsPlug" | identiek | OK |
| `og:image` | `/og-image.jpg` (1200×630) | identiek | OK |
| `og:image:width` / `:height` / `:alt` / `:type` | volledig | identiek | OK |
| `og:type` | `website` | identiek | OK |
| `og:locale` / `og:locale:alternate` | **❌ ontbreekt** | n.v.t. | **MISSING** |
| `twitter:card` | `summary_large_image` | identiek | OK |
| `twitter:site` / `:creator` | `@betsplug` | identiek | OK |
| `twitter:title` / `:description` / `:image` | volledig | vertaald | OK |

**Issue O1 — `og:locale` ontbreekt**: Facebook en LinkedIn parsen `og:locale` om de juiste taalversie van een share-card te tonen. Voor multilingual sites is dit een belangrijke hint. Voorgestelde fix in `frontend/src/app/layout.tsx` `generateMetadata()`:

```ts
openGraph: {
  ...,
  locale: locale === "en" ? "en_US" : (locale === "nl" ? "nl_NL" : `${locale}_${locale.toUpperCase()}`),
  alternateLocale: ["en_US", "nl_NL", "de_DE", ...]   // alle 16 als BCP-47-style
}
```

Niet ranking-kritisch maar voor social-share hygiëne wel waardevol.

## 8.2 JSON-LD inventaris (gerenderd)

EN homepage emit:
```
WebSite, SoftwareApplication, SearchAction, Organization, ImageObject, FAQPage,
EntryPoint, ContactPoint, AggregateRating, AggregateOffer
+ 12× Question, 12× Answer (FAQ)
```

EN /pricing emit:
```
Product, Brand, FAQPage, BreadcrumbList, AggregateRating
+ 4× Offer, 2× UnitPriceSpecification, 2× ListItem
+ 7× Question, 7× Answer (FAQ)
```

| # | Issue | Severity |
|---|-------|----------|
| J1 | **AggregateRating** geëmitteerd (zie Fase 7) — verzonnen 4.6/312 ratings | **CRITICAL** |
| J2 | **AggregateOffer** met `lowPrice: "0.01"` (verwijst naar afgeschafte Bronze trial) en `priceCurrency: "USD"` (site is EUR) | **HIGH** |
| J3 | `WebSite > SearchAction` wijst naar `/search` dat in robots.txt geblokkeerd is | LOW |
| J4 | Alleen `Organization`, niet `["Organization", "EducationalOrganization"]` | LOW |
| J5 | Geen `BreadcrumbList` op homepage (pricing heeft het wel) | LOW |
| J6 | Geen `Article` schema op `/articles/[slug]` (te verifiëren — niet getest in deze fase) | MEDIUM |
| J7 | Geen `Dataset` schema op data-pagina's zoals `/track-record` (passend voor educatief data-platform) | LOW |
| J8 | FAQ schema lijkt aanwezig op iedere pagina inclusief homepage — Google heeft sinds 2023 FAQ rich results gedeeltelijk uitgezet, dus niet meer een grote ranking-boost. Geen schade. | OK |

> J1 + J2 zijn kritiek en in Fase 10 onmiddellijk te fixen.

## 8.3 Heading-hiërarchie

EN homepage:
- 1× `<h1>` ✅ (single H1 op iedere geteste locale: en, de, ru, pt — allemaal exact 1)
- ~11× `<h2>` op semantisch significante secties (pricing, seo, leagues, hero-secundair)
- ~10× `<h3>`
- ~5× `<h4>`
- Geen `<h5>` of `<h6>` — clean

Geen H1-overslag, geen meerdere H1, hierarchy correct.

✅ Geen issue.

## 8.4 Images

Sample uit EN-homepage:
- Logo: `<img alt="BetsPlug" fetchPriority="high" width="200" height="80" decoding="async" srcset>`
  - ✅ alt + dimensions + fetchPriority + srcset (Next.js `<Image>` patroon)
- Avatars (testimonials): `<img alt="" loading="lazy" width="36" height="36" srcset>`
  - ✅ Lege alt is OK voor decoratieve avatars (a11y best practice).
- Geen `<img>` zonder alt-attribute geconstateerd.
- AVIF/WebP serving via `images.formats: ["image/avif","image/webp"]` (next.config.js).

✅ Geen issue.

## 8.5 Core Web Vitals — statische analyse

Volledige CWV-meting vereist Lighthouse / CrUX. Op basis van statische signalen:

| Signaal | Status |
|---------|--------|
| Single LCP candidate (logo of hero img) met `fetchPriority="high"` | ✅ |
| Font preload via `link rel="preload" as="font"` (woff2) | ✅ |
| Webpack chunk preload | ✅ |
| 22 `<script>` tags (Next.js + GTM) | ⚠️ — typisch voor Next.js, GTM voegt toe |
| Slechts 2 stylesheets | ✅ |
| `loading="lazy"` op below-the-fold imgs | ✅ |
| Geen iframe op homepage | ✅ (alleen GTM noscript-iframe) |
| `revalidate=60` op homepage en sitemap → ISR-caching | ✅ |
| `cache-control: private, no-cache` op responses | ⚠️ — Vercel-default voor SSR. Is OK maar betekent dat iedere pagina opnieuw rendert. |

> Geen rode vlaggen voor CWV vanuit statische analyse. CrUX-meting in Fase 11 follow-up als nodig.

## 8.6 Mobile usability

Viewport meta (`layout.tsx:30-34`): `width=device-width, initial-scale=1, viewport-fit=cover`. **Geen** `maximum-scale` of `user-scalable=no` — bewust toegelaten voor a11y. ✅

Body zegt: `min-h-screen font-sans font-normal antialiased` — Tailwind responsive design, getest via Tailwind breakpoints (`sm:`, `lg:`, `xl:`).

iOS-zoom-prevention via 16px font-size in globals.css (volgens layout-comment regel 24-28). ✅

## 8.7 Security headers

| Header | Aanwezig? | Waarde |
|--------|:---:|--------|
| `Strict-Transport-Security` | ✅ | `max-age=63072000` (2 jaar) |
| `X-Frame-Options` | ❌ | — |
| `X-Content-Type-Options` | ❌ | — |
| `Content-Security-Policy` | ❌ | — |
| `Referrer-Policy` | ❌ | — |
| `Permissions-Policy` | ❌ | — |
| `X-XSS-Protection` | ❌ | (deprecated, OK om weg te laten) |

> HSTS is goed gezet. De andere headers ontbreken. Niet kritiek voor SEO direct, maar Google's "Page Experience" signaal kijkt naar HTTPS + (vroeger) Safe Browsing. Voor security-volwassenheid en compliance is een `Content-Security-Policy` aan te raden — kan in Fase 11 follow-up. Voor nu niet acuut.

## 8.8 HTTPS / canonical host / www

| Probe | Resultaat |
|-------|-----------|
| `https://betsplug.com/` | 200 ✅ |
| `https://www.betsplug.com/` | **308 → `https://betsplug.com/`** ✅ |
| `http://betsplug.com/` | (niet getest, wordt door Vercel automatisch HTTPS) |
| HSTS preloaded? | (te verifiëren via `hstspreload.org`) |

✅ Canonical host hygiëne in orde.

## 8.9 PWA / manifest

- `/manifest.webmanifest` aanwezig + correct (`crossorigin="use-credentials"` per Next.js default).
- Apple touch icon, favicon-16, favicon-32, apple-icon.png — compleet.

✅

## 8.10 GTM / GA4 / Consent Mode

`layout.tsx:124-140` injecteert GTM-script `GTM-N7K574H7` met CookieYes-consent-template. Geen hardcoded gtag (CookieYes regelt Consent Mode v2 defaults via GTM).

✅ Privacy-compliant; geen direct SEO-impact maar voorkomt Page Experience-issues.

## 8.11 Theme-color / dark-mode

`<meta name="theme-color">` is **niet** aanwezig. Browsers (Chrome Android, Safari iOS) gebruiken dit voor de browser-chrome-kleur. Niet ranking-kritisch maar UX-verbeterpunt. Voorgesteld toe te voegen aan `viewport` of `metadata` (Next.js Metadata API ondersteunt `themeColor`).

## 8.12 Critical-bug-list voor Fase 10 vanuit hygiene

1. **Verwijder AggregateRating** uit JSON-LD (zie 7.2.1, 8.2 J1) — single largest hygiene fix.
2. **Update of verwijder AggregateOffer** in `ServiceJsonLd` (zie 7.2.2, 8.2 J2).
3. **`og:locale` + `og:locale:alternate`** toevoegen in root layout `generateMetadata` (8.1 O1).
4. **Article schema** op `/articles/[slug]` toevoegen indien afwezig (8.2 J6).
5. **Theme-color meta** toevoegen (8.11) — laag prioriteit.

---

**Volgende stap:** Fase 9 — diagnose-rapport en BESLISMOMENT.
