# Fase 9 — Executive Summary & Diagnose

> Datum: 2026-04-26
> Branch: `seo/full-recovery`
> Bron-rapporten: `01-stack-overview.md` t/m `08-hygiene-audit.md`.

## 1. Root cause — één zin

> De ranking-collapse heeft **drie samengestelde oorzaken** die in één gecombineerde fix moeten worden aangepakt: (1) het 16-locale "Nerdytips-pattern indexable routing" werd op 24-25 april 2026 live gezet terwijl de onderliggende content per locale niet daadwerkelijk volledig vertaald was — Google ziet 1.299 self-canonical URLs waarvan een groot deel partial-Engelse fallback content bevat = duplicate-content-trap; (2) op iedere pagina staat een verzonnen **`AggregateRating` 4.6/312** in de JSON-LD wat een directe overtreding van Google's structured-data-richtlijnen is en op zichzelf brand-term suppressie kan veroorzaken; (3) de meta-data per locale heeft concrete bugs (PAGE_META["/" → ru] is letterlijk EN, /how-it-works description voor 9 locales is EN, /pricing description in 11 locales noemt nog de afgeschafte Bronze-€0,01-trial).

## 2. Bewijsketen

1. **Git-log** (`02-git-timeline.md`):
   - `8281f0c` (2026-04-22) rolde i18n routing al eerder terug nadat een soortgelijke collapse plaatsvond ("Brand-term visibility collapsed in GSC under the 8-locale setup").
   - `712de96` (2026-04-24) flipte naar 16-locale indexable, met in zijn eigen commit-message de waarschuwing: *"shipping now would flood Google with 1,299 URLs serving EN fallback in every locale, which is exactly the duplicate-content trap we just climbed out of."*
   - Werd 24 uur later (`f9c645e`) naar main gemerged.
   - Tussen 25-26 april kwamen `aa1cb33` (1.359 EN-leaks gefixt, ~1.485 nog open) en `7e671cd` (151 hardcoded UI strings geëxtraheerd) — bewijs dat de inhoud niet volledig klaar was bij de flip.

2. **Live-fetch** (`03-rendering-check.md`):
   - `/ru/articles`: title is letterlijk Engels (*"AI Football Predictions & Betting Tips · BetsPlug"*), terwijl `<html lang="ru">` en canonical `/ru/articles` staan. Klassieke language-mismatch.
   - `/de/pricing`: title vertaald, body bevat "7-tägige Gold-Testversion für 0,01 €" (afgeschaft product) + Engelse leaks "Free Access", "Most chosen", "Based on model validation on 2 years of historical data".
   - `/ru` homepage rendert in body een Engelse h1-equivalent **én** een Russische h2 boven elkaar.

3. **Translation-audit** (`06-translation-audit.md`):
   - Dictionary-coverage 92.7%–97.2% per locale (acceptabel als basis).
   - **PAGE_META["/" → ru]** is een copy-paste van de EN-block. Idem voor 4 andere routes.
   - **/how-it-works description** voor 9 locales (nl/pt/tr/pl/ro/ru/el/da/sv) is identiek aan EN.
   - **8 locales (pt/tr/pl/ro/ru/el/da/sv) hebben Engelse URL-slugs** — `/pt/predictions` ipv `/pt/previsoes`. Combineert met onvolledige content tot near-duplicate van /predictions in Google's ogen.

4. **Structured-data-audit** (`07-positioning-audit.md` + `08-hygiene-audit.md`):
   - `ServiceJsonLd` op iedere pagina én `PricingProductJsonLd` op /pricing emitten een **AggregateRating 4.6/312**. Geen verifieerbare reviews op de pagina. Direct in conflict met Google's policy. Single largest individual ranking risk los van i18n.
   - `ServiceJsonLd.AggregateOffer` heeft `lowPrice: "0.01"` en `priceCurrency: "USD"` — stale (Bronze trial afgeschaft, site is EUR).

5. **GSC-symptomen passen perfect**:
   - 64 "Discovered – not indexed" → de 1.299 URLs waarvan Google er maar een deel waard vindt om te indexeren omdat content overlapt.
   - 6 "Crawled – not indexed" → Google heeft ze gelezen en als low-quality afgewezen.
   - 1 "Duplicate without user-selected canonical" → een pagina waar het canonical-signaal botst (mogelijk `/register` of `/forgot-password` die geen eigen canonical hebben — zie `05-canonical-audit.md` C2).

## 3. Per ondersteunde locale — voorgesteld verdict

| Locale | Verdict | Hoofdreden |
|--------|---------|------------|
| **en** | **Hoofdversie** | Canonical, x-default, blijft altijd live |
| **nl** | **Klaar** *(na fixes)* | 92.7% UI-coverage, vertaalde slugs, Sanity content compleet, één meta-leak (/how-it-works desc) |
| **de** | **Klaar** *(na fixes)* | 96.4% coverage, vertaalde slugs, Sanity compleet — pricing-stale + leak-cleanup |
| **fr** | **Klaar** *(na fixes)* | 95.4% coverage, vertaalde slugs — pricing-stale fix |
| **es** | **Klaar** *(na fixes)* | 97.2% coverage, vertaalde slugs — pricing-stale fix |
| **it** | **Klaar** *(na fixes)* | 97.1% coverage, vertaalde slugs — pricing-stale fix |
| **sw** | **NIET KLAAR** | Sanity-coverage twijfelachtig + kleine markt + lijkt zware investering tov payoff |
| **id** | **NIET KLAAR** | Idem sw |
| **pt** | **NIET KLAAR** | EN URL-slugs, partial Sanity, grote markt — pas later heractiveren |
| **tr** | **NIET KLAAR** | EN URL-slugs, partial Sanity |
| **pl** | **NIET KLAAR** | EN URL-slugs, /how-it-works desc leak |
| **ro** | **NIET KLAAR** | EN URL-slugs, /how-it-works desc leak |
| **ru** | **NIET KLAAR — kapot** | 5 routes met copy-paste EN PAGE_META, EN URL-slugs |
| **el** | **NIET KLAAR** | EN URL-slugs |
| **da** | **NIET KLAAR** | EN URL-slugs |
| **sv** | **NIET KLAAR** | EN URL-slugs |

> **Resultaat**: 6 indexable hoofdversies (en + nl + de + fr + es + it). 10 locales tijdelijk geparkeerd met noindex tot ze één voor één heractiveerbaar zijn (criteria in Fase 11 handoff).

## 4. Top-5 fixes in volgorde van impact

| # | Fix | Verwachte impact | Effort |
|---|-----|------------------|--------|
| 1 | **Verwijder AggregateRating** uit `ServiceJsonLd` + `PricingProductJsonLd` | **Brand-term ranking** kan binnen dagen herstellen (Google's structured-data quality classifier) | LOW (1 file) |
| 2 | **Tijdelijk noindex op 10 NIET-KLAAR-locales**: middleware zet `X-Robots-Tag: noindex, follow` op `/(sw|id|pt|tr|pl|ro|ru|el|da|sv)/*`. Verwijder die uit sitemap en uit hreflang-cluster | Stopt de duplicate-content bloeding: Google ziet 6 echte locales i.p.v. 16 partial | MEDIUM (middleware + sitemap + seo-helpers) |
| 3 | **PAGE_META RU + /how-it-works descriptions fix** + `/pricing` description re-write voor 5 Klaar-locales (en/nl/de/fr/es/it) zonder Bronze-€0,01-claim | Heelt de title/desc-mismatch op pagina's die wél geïndexeerd blijven | LOW (1 file) |
| 4 | **Update `ServiceJsonLd.AggregateOffer`**: prijs, currency, count corrigeren of de Offer-emit verwijderen | Stopt stale-product-claim signal | LOW |
| 5 | **Sitewide footer disclaimer** + 1× herformuleer "Start Winning" CTA + "burn through €15" copy | Versterkt educatieve framing, ondersteunt brand-trust signalen op lange termijn | LOW (messages.ts) |

Optionele follow-ups (Fase 11):
- Vervang Organization door `["Organization", "EducationalOrganization"]` met `knowsAbout`.
- Heractiveer per niet-klaar-locale in fases (URL-slug-vertalen → meta-vullen → Sanity-vullen → noindex weghalen) — markt-prioriteit: pt, pl, ru.

## 5. Geschatte hersteltijd

| Fase | Werktijd | Wachttijd Google |
|------|----------|------------------|
| 10.1 Code-fixes (alle 5 top fixes) | 1-2 uur dev werk | n.v.t. |
| 10.2 Verificatie + Vercel deploy | 30 min | n.v.t. |
| Initial recrawl (homepage + top 10 pagina's via GSC "Request Indexing") | n.v.t. | 1-3 dagen |
| GSC indexing-status update | n.v.t. | 7-14 dagen |
| Brand-term ranking herstel (mits geen Manual Action) | n.v.t. | **2-4 weken** |
| Algemene organische ranking herstel | n.v.t. | **4-12 weken** |
| Per-locale heractivatie (pt/pl/ru als prioriteit) | 4-8 uur per locale | 4-8 weken per locale |

---

# 🛑 BESLISMOMENT

**Cas, dit is mijn voorstel:**

| | |
|---|---|
| **Engels (`/`)** | **Hoofdversie** — self-canonical, x-default, blijft altijd live. |
| **NL, DE, FR, ES, IT** | **Klaar** *(na de drie meta-fixes)* — blijven indexeerbaar in hreflang-cluster van 6 locales (incl. EN). |
| **SW, ID, PT, TR, PL, RO, RU, EL, DA, SV** | **Tijdelijk geparkeerd** — `X-Robots-Tag: noindex, follow` via middleware. URLs blijven werken voor bezoekers (incl. taal-switcher), uit sitemap, uit hreflang-cluster. Heractivatie criteria vastgelegd in Fase 11 handoff. |
| **Hreflang** | Herimplementeren voor alleen de 6 Klaar-locales — cluster van 7 entries (6 + x-default). |
| **AggregateRating** | Volledig verwijderd. Geen reintroductie tot er onafhankelijke ratings bestaan op een externe gevalideerde bron. |
| **AggregateOffer** | Verwijderd of gecorrigeerd naar EUR / juiste prijzen. |
| **PAGE_META RU + /how-it-works desc + /pricing desc** | Hand-vertaald, niet door automatic translator. |
| **Educatieve framing** | Sitewide footer disclaimer + "Start Winning" → educatieve CTA + Schema `EducationalOrganization`. |
| **Site-positie** | "Educatief data-platform, geen gokwebsite" — explicieter in copy en structured data. |

**Akkoord om door te gaan met Fase 10 implementatie zoals voorgesteld?**

Of, alternatief:

- (**A**) Wil je een andere set "Klaar"-locales? Bijvoorbeeld alleen EN+NL parkeren en de rest behouden? Of een tussenvariant?
- (**B**) Wil je dat ik de 10 NIET-KLAAR-locales **niet noindex** maar **301-redirect** naar EN equivalent? (Riskanter — verliest verzamelde URL-equity helemaal i.p.v. tijdelijk parkeren.)
- (**C**) Wil je dat ik de `AggregateRating` vervang door een rating gebaseerd op Trustpilot/Google Business profiel als die bestaat, in plaats van helemaal weghalen?

Wacht op bevestiging vóór ik de implementatie-fase start.
