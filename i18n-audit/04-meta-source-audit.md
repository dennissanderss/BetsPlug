# Fase 4 — Meta tag source audit (translation-only)

> Datum: 2026-04-27
> Scope: alleen taal-consistentie van meta-tags, **geen** SEO-aspecten (canonical, hreflang, robots, sitemap blijven onaangeroerd).

## 4.1 Bron per meta-tag

Eén centrale plek emit metadata in dit project: **`generateMetadata()` per route** + de root `app/layout.tsx`.

| Tag | Bron | Locale-aware? |
|-----|------|---------------|
| `<html lang>` | `app/layout.tsx:117` → `getServerLocale()` (leest `x-locale` header gezet door middleware) | ✅ |
| `<title>` | per-route `generateMetadata()` → `PAGE_META[<canonical>][locale]` | ✅ |
| `<meta name="description">` | idem | ✅ |
| `og:title`, `og:description` | idem (delen waarde met title/description) | ✅ |
| `og:url` | `getLocalizedAlternates()` returnt active-locale URL | ✅ |
| `og:locale` | **niet expliciet gezet** | ❌ — fallback Next.js default |
| `og:site_name` | `app/layout.tsx:86` hardcoded `"BetsPlug"` | n.v.t. (brand) |
| `og:type` | hardcoded `"website"` | n.v.t. |
| `twitter:title`, `twitter:description` | delen met OG | ✅ |
| `twitter:site`, `twitter:creator` | hardcoded `@betsplug` | n.v.t. (handle) |
| `Content-Language` HTTP header | middleware sets per locale | ✅ |

> Eén route, één `generateMetadata`, één bron. Geen mengeling van hardcoded title + vertaalde description meer (die was er WEL — gefixt in de SEO recovery van 2026-04-26 voor RU + 9-locale `/how-it-works` description gap + 14-locale `/pricing` stale Bronze).

## 4.2 Live verificatie per indexable locale

Sample render via `curl -A Googlebot` op productie:

| URL | `<html lang>` | `<title>` | description (eerste 80 chars) | Consistent? |
|-----|---------------|-----------|------------------------------|-------------|
| `/` | en | AI-Powered Football Predictions · BetsPlug | AI-powered football predictions with 4 models … | ✅ |
| `/de` | de | KI-gestützte Fußballvorhersagen · BetsPlug | KI-gestützte Fußballvorhersagen mit 4 Modellen … | ✅ |
| `/nl` | nl | AI-gedreven Voetbalvoorspellingen · BetsPlug | AI-gedreven voetbalvoorspellingen met 4 modellen … | ✅ |
| `/fr` | fr | Prédictions Football par IA · BetsPlug | Prédictions football par IA avec 4 modèles … | ✅ |
| `/es` | es | Predicciones de Fútbol con IA · BetsPlug | Predicciones de fútbol con IA y 4 modelos … | ✅ |
| `/it` | it | Pronostici Calcio con IA · BetsPlug | Pronostici calcio con IA e 4 modelli … | ✅ |
| `/de/pricing` | de | Preispläne · KI-Fußballvorhersagen · BetsPlug | Wählen Sie den BetsPlug-Plan … Free Access für 0 € … | ✅ (geen Bronze stale meer) |
| `/de/spiel-vorhersagen` | de | KI Spielvorhersagen · Gratis Fußball-Tipps · BetsPlug | … | ✅ |
| `/nl/pricing` | nl | Prijsplannen · AI-voetbalvoorspellingen · BetsPlug | … | ✅ |
| `/nl/wedstrijd-voorspellingen` | nl | AI Wedstrijdvoorspellingen · Gratis Picks · BetsPlug | … | ✅ |
| `/de/so-funktioniert-es` | de | So Funktioniert Es · BetsPlug KI-Prognosemaschine | Schritt-für-Schritt-Erklärung der BetsPlug KI-Prognosemaschine … | ✅ |

**Conclusie**: meta-tags zijn voor de 6 indexable locales **structureel consistent met de pagina-locale**. Het mengtaal-probleem zit niet in metadata — het zit in body-content (zoals al bewezen in fase 3).

## 4.3 Routes zonder eigen `generateMetadata`

Uit de SEO-audit van gisteren (`seo-audit/05-canonical-audit.md` C2):

```
/forgot-password   geen generateMetadata → erft root layout (NL/DE/FR/ES/IT title komt van layout, niet specifiek voor deze pagina)
/register          idem
/reset-password    idem
/thank-you         idem
/verify-email      idem
```

Voor de i18n-overhaul betekent dit: een NL bezoeker op `/nl/registreren` krijgt de NL homepage-title. Functioneel niet ideaal, maar **geen taal-mismatch**: de title is NL, en de pagina is NL. Het is een SEO-issue (al opgelost in robots-disallow), geen i18n-issue.

## 4.4 `og:locale` ontbreekt

Niet sites-stoppend, maar Facebook/LinkedIn share-cards profiteren van `og:locale="nl_NL"` etc. Voorgestelde toevoeging in `app/layout.tsx` `generateMetadata`:

```ts
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US", nl: "nl_NL", de: "de_DE", fr: "fr_FR", es: "es_ES", it: "it_IT",
  // parked locales: niet toevoegen (worden niet gedeeld)
};

openGraph: {
  ...,
  locale: OG_LOCALE[locale] ?? "en_US",
  alternateLocale: Object.values(OG_LOCALE).filter(l => l !== OG_LOCALE[locale]),
}
```

Optioneel in fase 8.

## 4.5 Conclusie fase 4

✅ Geen meta-tag-bron-mismatches voor de 6 indexable locales op de getest pagina's.
✅ `<html lang>` consistent met URL-locale.
✅ Title + description komen uit dezelfde bron.
⚠️ `og:locale` ontbreekt — kleine improvement, niet kritiek.
ℹ️ 5 funnel-pages (`/register`, `/forgot-password`, …) hebben geen eigen generateMetadata — al door SEO-audit afgevangen via robots-disallow + (app)/layout noindex.

> **Belangrijke conclusie voor de overhaul**: de meta-tag-laag is nu schoon. Alle bug-bronnen voor het banner-probleem zitten in de body-content / component-code, niet in metadata. Dat sluit aan bij fase 3 vondsten.

---

**Volgende stap:** Fase 5 — Runtime locale binding check.
