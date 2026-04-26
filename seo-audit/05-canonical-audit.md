# Fase 5 — Canonical forensics

> Datum: 2026-04-26
> Bron: alle `page.tsx`/`layout.tsx` onder `frontend/src/app/`, gerenderde HTML uit Fase 3.

## 5.1 Hoe canonical wordt gegenereerd

Eén centrale helper: `getLocalizedAlternates(canonicalEnglishPath)` in `frontend/src/lib/seo-helpers.ts:103-118`.

```ts
export function getLocalizedAlternates(canonicalPath: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const locale = getServerLocale();
  const canonical = buildAbsoluteUrl(canonicalPath, locale);   // self-canonical per locale

  const languages: Record<string, string> = {};
  for (const l of locales) {
    const tag = localeMeta[l].hreflang;
    languages[tag] = buildAbsoluteUrl(canonicalPath, l);
  }
  languages["x-default"] = buildAbsoluteUrl(canonicalPath, defaultLocale);

  return { canonical, languages };
}
```

Iedere pagina importeert `getLocalizedAlternates(<EN-path>)` in zijn `generateMetadata()` en spreid het resultaat in `alternates: { canonical, languages }`. Next.js emit dan `<link rel="canonical">` + de hreflang-cluster.

## 5.2 Inventaris per pagina-template

> ✅ = `generateMetadata` is aanwezig en gebruikt `getLocalizedAlternates`.
> ⚠️ = pagina-bestand bestaat maar mist canonical/alternates.
> 🔒 = `(app)` route-group → `robots: { index: false, follow: false }` via `(app)/layout.tsx` (mag ongeïndexeerd blijven).

### Publieke routes (root)

| Pagina | Bestand | Canonical-bron | Status |
|---|---|---|---|
| `/` | `app/layout.tsx` (`generateMetadata`) | `getLocalizedAlternates("/")` | ✅ self-canonical per locale |
| `/about-us` | `app/about-us/page.tsx` | `getLocalizedAlternates("/about-us")` | ✅ |
| `/articles` | `app/articles/page.tsx` | `getLocalizedAlternates("/articles")` | ✅ |
| `/articles/[slug]` | `app/articles/[slug]/page.tsx` | `getLocalizedAlternates(\`/articles/${slug}\`)` | ✅ |
| `/b2b` | `app/b2b/page.tsx` | (te verifiëren) | ❓ |
| `/bet-types` | `app/bet-types/page.tsx` | `getLocalizedAlternates("/bet-types")` | ✅ |
| `/bet-types/[slug]` | `app/bet-types/[slug]/page.tsx` | `getLocalizedAlternates(\`/bet-types/${slug}\`)` | ✅ |
| `/bet-types/[slug]/[league_slug]` | `app/bet-types/.../page.tsx` | `getLocalizedAlternates(...)` | ✅ |
| `/checkout` | `app/checkout/page.tsx` | `getLocalizedAlternates("/checkout")` + `robots: { index:false }` | ✅ noindex |
| `/contact` | `app/contact/page.tsx` | `getLocalizedAlternates("/contact")` | ✅ |
| `/cookies` | `app/cookies/page.tsx` | (waarschijnlijk geen — legal-page mogelijk gehaald uit shared) | ❓ |
| `/engine` | `app/engine/page.tsx` | `generateMetadata` aanwezig | ✅ (te verifiëren) |
| `/forgot-password` | `app/forgot-password/page.tsx` | **Geen `generateMetadata` in page** | ⚠️ erft van layout = `/` canonical |
| `/how-it-works` | `app/how-it-works/page.tsx` | `getLocalizedAlternates("/how-it-works")` | ✅ |
| `/learn` | `app/learn/page.tsx` | `getLocalizedAlternates("/learn")` | ✅ |
| `/learn/[slug]` | `app/learn/[slug]/page.tsx` | `getLocalizedAlternates(\`/learn/${slug}\`)` | ✅ |
| `/login` | `app/login/page.tsx` | `getLocalizedAlternates("/login")` + `robots: { index:false }` | ✅ noindex |
| `/match-predictions` | `app/match-predictions/page.tsx` | `generateMetadata` aanwezig | ✅ (te verifiëren of alternates is gebruikt) |
| `/match-predictions/[league_slug]` | dito | dito | ❓ |
| `/pricing` | `app/pricing/page.tsx` | `generateMetadata` aanwezig | ✅ |
| `/privacy` | `app/privacy/page.tsx` | `getLocalizedAlternates("/privacy")` | ✅ |
| `/register` | `app/register/page.tsx` | **Geen `generateMetadata`** | ⚠️ erft van layout |
| `/reset-password` | `app/reset-password/page.tsx` | **Geen `generateMetadata`** | ⚠️ erft van layout |
| `/responsible-gambling` | `app/responsible-gambling/page.tsx` | `getLocalizedAlternates("/responsible-gambling")` | ✅ — maar route ontbreekt in `routeTable` |
| `/terms` | `app/terms/page.tsx` | `getLocalizedAlternates("/terms")` | ✅ |
| `/thank-you` | `app/thank-you/page.tsx` | **Geen `generateMetadata`** | ⚠️ |
| `/track-record` | `app/track-record/page.tsx` | `generateMetadata` aanwezig | ✅ |
| `/verify-email` | `app/verify-email/page.tsx` | **Geen `generateMetadata`** | ⚠️ |
| `/welcome` | `app/welcome/page.tsx` | `getLocalizedAlternates("/welcome")` + `robots: { index:false }` | ✅ noindex |

### Authed routes (`(app)`-groep) — automatisch noindex

`(app)/layout.tsx:7-13` zet `metadata: { robots: { index:false, follow:false, googleBot: {…} } }`. Geërfd door alle children:

| Pagina |
|---|
| `(app)/dashboard`, `(app)/predictions`, `(app)/results`, `(app)/trackrecord`, `(app)/match-predictions`, `(app)/bet-of-the-day`, `(app)/deals`, `(app)/favorites`, `(app)/jouw-route`, `(app)/live-score`, `(app)/matches`, `(app)/myaccount`, `(app)/reports`, `(app)/search`, `(app)/strategy`, `(app)/subscription`, `(app)/teams`, `(app)/weekly-report`, `(app)/admin/*`, `(app)/about` |

🔒 Niveau is correct: noindex van layout. ✅

## 5.3 Canonical-tabel — gemeten uit live HTML

| URL | Verwachte canonical (Nerdytips-pattern: self per locale) | Actuele canonical | OK? |
|---|---|---|---|
| `https://betsplug.com/` | `https://betsplug.com` | `https://betsplug.com` | ✅ |
| `https://betsplug.com/nl` | `https://betsplug.com/nl` | `https://betsplug.com/nl` | ✅ |
| `https://betsplug.com/de` | `https://betsplug.com/de` | `https://betsplug.com/de` | ✅ |
| `https://betsplug.com/pricing` | `https://betsplug.com/pricing` | `https://betsplug.com/pricing` | ✅ |
| `https://betsplug.com/de/pricing` | `https://betsplug.com/de/pricing` | `https://betsplug.com/de/pricing` | ✅ |
| `https://betsplug.com/match-predictions` | `https://betsplug.com/match-predictions` | `https://betsplug.com/match-predictions` | ✅ |
| `https://betsplug.com/de/spiel-vorhersagen` | `https://betsplug.com/de/spiel-vorhersagen` | `https://betsplug.com/de/spiel-vorhersagen` | ✅ |
| `https://betsplug.com/fr/predictions-match` | `https://betsplug.com/fr/predictions-match` | `https://betsplug.com/fr/predictions-match` | ✅ |
| `https://betsplug.com/pt/match-predictions` | `https://betsplug.com/pt/match-predictions` | `https://betsplug.com/pt/match-predictions` | ✅ |
| `https://betsplug.com/ru/articles` | `https://betsplug.com/ru/articles` | `https://betsplug.com/ru/articles` | ✅ canonical, ⚠️ title is EN |
| `https://betsplug.com/ru/how-it-works` | `https://betsplug.com/ru/how-it-works` | `https://betsplug.com/ru/how-it-works` | ✅ |
| `https://betsplug.com/de/so-funktioniert-es` | `https://betsplug.com/de/so-funktioniert-es` | `https://betsplug.com/de/so-funktioniert-es` | ✅ |

## 5.4 Trailing slash, protocol, www-consistentie

- Geen trailing slash gebruikt overal. Geen mix.
- HTTPS overal, zowel `https://betsplug.com/` als `/de/...`.
- `www.` is niet getest in deze fase, maar `applyIndexability()` accepteert zowel `betsplug.com` als `www.betsplug.com` als canonical host. Verifiëren in Fase 8 of www-redirect bestaat.
- Geen `index.html`-style suffixen.

## 5.5 Geconstateerde issues

| # | Issue | Bestand | Niveau |
|---|-------|---------|--------|
| C1 | `responsible-gambling` ontbreekt in `routes.ts → routeTable` maar wordt door `getLocalizedAlternates` aangeroepen → de helper laat de URL ongewijzigd door, dus `/de/responsible-gambling` werkt — maar als we ooit een vertaalde slug willen, valt dat niet op te zetten zonder routeTable-entry. | `src/lib/seo-helpers.ts` + `src/i18n/routes.ts` | LOW |
| C2 | `forgot-password`, `register`, `reset-password`, `thank-you`, `verify-email`: **geen `generateMetadata`**. Deze pages erven de root-layout metadata, dus krijgen `<title>AI-Powered Football Predictions · BetsPlug</title>` en `canonical=https://betsplug.com`. **Dat is een zelf-veroorzaakte duplicate-content-emissie.** | meerdere | **HIGH** |
| C3 | `/register` zit niet in `robots.txt` Disallow én niet in sitemap — Google kan deze pagina indien wel ontdekken (via interne link uit nav) en dan zien dat canonical = `/`. Resultaat: `Duplicate, Google chose different canonical` — exact één van de GSC-categorieën in de melding. | `src/app/register/page.tsx`, `src/app/robots.ts` | **HIGH** |
| C4 | `/jouw-route` route in routes.ts heeft canonical-key `/jouw-route` (NL) i.p.v. `/your-route` (EN). Maakt `getLocalizedAlternates("/your-route")` failen want die path zit nooit in routeTable. Niet acuut want de pagina staat in `(app)/jouw-route` (noindex), maar inconsistent. | `src/i18n/routes.ts:473-490` | LOW |
| C5 | `/about` wordt door robots disallowed (`Disallow: /about$`) maar er is **geen** publieke /about-page meer — de marketing-versie is verhuisd naar `/about-us`. De disallow blokkeert alleen de oude `(app)/about/page.tsx` route, die al noindex is via layout. Dubbele bescherming, geen fout. | `src/app/robots.ts` | OK |
| C6 | Geen verschil tussen canonical → "**self-canonical** binnen 16 partial-translated locales" en de marketing-claim "EN is hoofdversie". Google ziet 16 first-class pages, niet 1 hoofdversie + 15 alternatieven. **Dit is precies waarom de strategie moet veranderen.** | `src/lib/seo-helpers.ts` | **CRITICAL** |
| C7 | Op `/ru/articles` is title EN ondanks correcte canonical — bewijst dat de title-bron (PAGE_META→ru) **de fallback naar EN raakt**, terwijl canonical wél naar `/ru/articles` wijst. Dat is de mismatch tussen "hier rendert RU content" (ja, deels) en "hier zit een RU-page" (canonical zegt ja, title zegt nee). | `src/data/page-meta.ts` | **HIGH** |

## 5.6 Conclusie Fase 5

Mechanisch is de canonical-laag correct: elke pagina die `getLocalizedAlternates` gebruikt krijgt een self-referencing canonical en een 17-tag hreflang-cluster. **Het probleem is niet technisch in canonical-emissie, maar in de ondersteunende lagen**: PAGE_META mist locale-keys, content is niet daadwerkelijk vertaald, en 5 publieke (auth/funnel) pagina's hebben geen eigen canonical waardoor ze duplicate-content-signalen geven.

De canonical-strategie zelf — "elke locale is een first-class indexeerbare pagina met self-canonical" — is een *bewuste* keuze (Nerdytips-pattern), maar past **niet** bij de werkelijkheid van de huidige content-coverage. Het hoort om te keren naar:

> **Engels = hoofdversie** (self-canonical, blijft).
> **Onvolledige locales = noindex + uit sitemap + uit hreflang-cluster**.
> **Klaar locales = self-canonical + opgenomen in cluster, alléén deze**.

Dat is dezelfde structuur als nu, **maar geknepen tot alleen de varianten die echt klaar zijn**. Implementatie volgt in Fase 10.

---

**Volgende stap:** Fase 6 — translation integrity audit. De kern.
