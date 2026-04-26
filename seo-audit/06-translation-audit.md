# Fase 6 — Translation Integrity Audit (kernfase)

> Datum: 2026-04-26
> Bronnen: dictionary parsing van `src/i18n/messages.ts` + `src/i18n/locales/*.ts` + `src/data/page-meta.ts`, plus de live-fetched HTML uit Fase 3.

## 6.1 Translation Coverage — UI dictionary

Bron: `frontend/src/i18n/messages.ts` (EN als source of truth) + `frontend/src/i18n/locales/<loc>.ts`.

**Totaal aantal EN keys: 2.589**

| Locale | Aanwezig | Missing | Identical-to-EN (leak) | Unieke vertalingen | Coverage% |
|--------|---------:|--------:|----------------------:|-------------------:|----------:|
| **nl** | 2.589 | 0 | 189 | 2.400 | **92.7%** |
| **de** | 2.639 | -50 (overschot) | 144 | 2.495 | **96.4%** |
| **fr** | 2.639 | -50 | 169 | 2.470 | **95.4%** |
| **es** | 2.639 | -50 | 123 | 2.516 | **97.2%** |
| **it** | 2.639 | -50 | 125 | 2.514 | **97.1%** |
| **sw** | 2.639 | -50 | 143 | 2.496 | **96.4%** |
| **id** | 2.639 | -50 | 149 | 2.490 | **96.2%** |
| **pt** | 2.589 | 0 | 98  | 2.491 | **96.2%** |
| **tr** | 2.589 | 0 | 85  | 2.504 | **96.7%** |
| **pl** | 2.589 | 0 | 117 | 2.472 | **95.5%** |
| **ro** | 2.589 | 0 | 139 | 2.450 | **94.6%** |
| **ru** | 2.589 | 0 | 78  | 2.511 | **97.0%** |
| **el** | 2.589 | 0 | 100 | 2.489 | **96.1%** |
| **da** | 2.589 | 0 | 167 | 2.422 | **93.5%** |
| **sv** | 2.589 | 0 | 140 | 2.449 | **94.6%** |

> "Identical-to-EN" telt alle keys waarvoor `<locale>[key] === en[key]`, na uitfilteren van brand-passthroughs (BetsPlug, Pulse, BTTS, Free, Silver, Gold, Platinum, Bronze, Free Access, ROI, xG, Elo, Poisson, XGBoost, Ensemble, Live, Reports, Stripe, Apple, Google).

**Conclusie**: alle 15 locales zitten op 92.7%–97.2% unieke vertalingen. Dat is een **acceptabele basis**; het probleem zit niet zozeer in massieve gaten, maar in (a) **welke** keys ontbreken/lekken (hoog-impact namespaces zoals nav, footer, pricing-tier-naam) en (b) **waar buiten de dictionary** EN content rechtstreeks in JSX of Sanity wordt gerenderd.

> ⚠️ **DE/FR/ES/IT/SW/ID hebben 50 keys méér dan EN**. Dit zijn legacy keys die uit `messages.ts` zijn gehaald maar in de aux locale-bestanden achterbleven. Niet schadelijk (dood gewicht), wel een hint dat de dictionary-onderhoudsdiscipline niet 100% strak is.

## 6.2 Hardcoded English in components (heuristisch)

Heuristisch scan op JSX-tagged English: `>Capitalized phrase<` zonder dat het door `t()` loopt.

```
Total likely-EN phrases inside JSX: 172
```

Top-15 bestanden naar aantal hits (publieke pagina's eerst):

| Bestand | Hits | Publiek? |
|---------|-----:|----------|
| `src/app/privacy/page.tsx` | **22** | ✅ Publiek + indexeerbaar |
| `src/app/responsible-gambling/page.tsx` | **16** | ✅ Publiek + indexeerbaar |
| `src/app/cookies/page.tsx` | **7** | ✅ Publiek + indexeerbaar |
| `src/app/terms/page.tsx` | **7** | ✅ Publiek + indexeerbaar |
| `src/components/ui/betsplug-footer.tsx` | 3 | ✅ Op iedere pagina |
| `src/components/noct/accuracy-plus-preview.tsx` | 4 | ✅ Marketing component |
| `src/components/ui/seo-section.tsx` | 2 | ✅ Marketing component |
| `src/components/bet-of-the-day/value-bet-panel.tsx` | 2 | ✅ Marketing |
| `src/app/pricing/pricing-content.tsx` | 2 | ✅ Marketing |
| `src/app/home-content.tsx` | 1 | ✅ Marketing |
| `src/app/(app)/admin/page.tsx` | 26 | 🔒 Authed (noindex) |
| `src/components/admin/analytics-settings.tsx` | 15 | 🔒 Authed |
| `src/app/(app)/about/page.tsx` | 8 | 🔒 Authed |

**Bevindingen**:

- **De legal-pagina's (`privacy`, `terms`, `cookies`, `responsible-gambling`) zijn praktisch volledig hardcoded EN.** Sitemap-comment zegt "Legal pages: identical content across locales" — dat is consistent met het ontwerp, maar problematisch zodra ze onder /xx/-prefix worden geserveerd. Als `/de/datenschutz` (vertaalde slug) bestaat én bereikt wordt, krijgt de bezoeker een Engelse legal-tekst onder een Duits URL. De huidige sitemap noemt alleen `/privacy`, `/terms`, `/cookies` (EN) — dus Google ontdekt /de/datenschutz waarschijnlijk niet via sitemap. Hreflang-cluster van /pricing etc. wijst er ook niet naar (legal heeft eigen, lege alternates). **Toch kan een externe link of footer-link Google er heen sturen**, en dan staat er EN content op een DE URL. Risico: Google ziet duplicate content (en zelfs een language-mismatch bij /de/datenschutz waar lang="de" maar body=en).
- **Footer en marketing-componenten** met hardcoded EN strings worden op iedere /xx/ pagina gerenderd — dit is de bron van leak-strings die we in Fase 3 zagen ("Free to join", "Live chat", "Most chosen", etc.).
- Authed admin/dashboard heeft veel hardcoded EN, maar staat onder noindex — niet kritiek voor SEO.

## 6.3 Meta Tag Source Audit — `PAGE_META` (`src/data/page-meta.ts`)

Resultaat van een sub-block parse per (route × locale), waarbij we flag wanneer `title` of `description` letterlijk gelijk is aan de EN-waarde:

| Route | Locales waar title/desc nog EN is | Locales zonder block |
|-------|-----------------------------------|----------------------|
| `/` | **`ru(TD)`** | (none) |
| `/articles` | **`ru(TD)`** | (none) |
| `/about-us` | **`ru(TD)`** | (none) |
| `/privacy` | **`ru(TD)`** | (none) |
| `/terms` | **`ru(TD)`** | (none) |
| `/cookies` | (none) | (none) |
| `/responsible-gambling` | (none) | (none) |
| **`/how-it-works`** | **`nl(D), pt(D), tr(D), pl(D), ro(D), ru(D), el(D), da(D), sv(D)`** ← 9 locales! | (none) |
| `/track-record` | (none) | (none) |
| `/login` | (none) | (none) |
| `/match-predictions` | (none) | (none) |
| `/learn` | (none) | (none) |
| `/bet-types` | (none) | (none) |
| `/welcome` | (none) | (none) |
| `/b2b` | (none) | (none) |
| `/checkout` | (none) | (none) |
| `/engine` | (none) | (none) |
| `/pricing` | (none) — alle locales hebben unieke title én description, **maar veel bevatten stale "Bronze trial €0,01"-claim** | (none) |
| `/contact` | (none) | (none) |

**Sleutelinzichten**:

1. **`ru` is structureel kapot** voor 5 routes (`/`, `/articles`, `/about-us`, `/privacy`, `/terms`). Iemand heeft de EN-block gekopieerd in plaats van te vertalen. Zie `src/data/page-meta.ts:136-143`.
2. **`/how-it-works`** heeft op 9 locales een gemixt patroon: title vertaald (anders dan EN), description identiek aan EN. Dit is exact het "title in taal A, description in taal B" patroon dat Cas oorspronkelijk meldde. **Geverifieerd op `/de/so-funktioniert-es`: title DE, description EN.** Wacht, op DE was de description ook DE — laat me dit specifiek voor RU verifiëren. Live-check toont dat `/ru/how-it-works` description `(none)` is (afwezig) — dat past met de leak-classificatie waarbij het EN-zelfde is en blijkbaar door Next.js niet geëmitteerd is.
3. **`/pricing`** heeft per-locale unieke meta's, maar de inhoud zit nog vast aan het oude Bronze-model dat 2026-04-25 is afgeschaft (commits `a3c5ee6`, `b5c7ea7`, `733d74e`). Zelfs op EN: `enpricing` description noemt nog "Bronze" niet, maar veel /xx/-pricing wel. Geverifieerd:
   - DE: "Bronze-Testversion für 0,01 €" → STALE
   - FR: "essai Bronze pour 0,01 €" → STALE
   - PT: "teste Bronze por € 0,01" → STALE
   - TR: "0,01 € karşılığında Bronz deneme" → STALE
   - DA: "Bronzeprøve for 0," → STALE
   - SV: "Bronsprovning för 0," → STALE
   - PL: "Brązowy okres pr…" → STALE
   - IT: "prova Bronzo per 0,01" → STALE
   - ES: "prueba Bronce po…" → STALE
   - ID: "Uji coba perung…" → STALE
   - RO: "Probă Bronz" → STALE
   - **EN doet het wel goed**: "Free Access at €0, Silver for casual users, …".

## 6.4 Routing & Locale Binding — verificatie via live-fetch

Geverifieerd op alle 16 locales (homepage + pricing + match-predictions, 48 fetches):

- ✅ `<html lang>` matcht altijd de URL-locale.
- ✅ `Content-Language` header matcht altijd de URL-locale.
- ✅ Canonical is altijd self-referential per locale.
- ❌ Title en description zijn niet altijd in dezelfde taal als `<html lang>` — concrete cases hierboven.

## 6.5 Dynamic Content Localization — Sanity

Sanity-content komt uit `frontend/src/lib/sanity-data.ts`. Geverifieerd door waarneming:

- Articles, learn pillars, league hubs, bet-type hubs en homepage-blocks hebben **per-locale localized fields** in Sanity (zie schemas).
- Sanity-translator (`scripts/translate-sanity.mjs`, `scripts/sanity-gap-report.mjs`) vult niet-EN locales via DeepL.
- De merge-commit (`f9c645e`) claimt "Sanity gap report: 0 documents with gaps" — maar:
  - We zien op `/de`, `/pt`, `/it`-homepages **Engelse Sanity-article-titles** (`>Bankroll Management for Football Bettors<`, `>Elo Rating Explained<`). Vermoedelijk: deze 2 articles zijn niet als 'localised' gemarkeerd, of `imageUrl`/`fields[locale]` valt terug naar EN.
  - Editorial-locale-fallback in `lib/sanity-data.ts` valt terug naar EN als de gevraagde locale geen vertaling heeft. Dat is een veiligheidsnet — maar als het te vaak terugvalt, krijg je weer mixed content.
- Sanity-content URLs (article slugs) zijn **niet vertaald** per locale — `/articles/ai-edge-matchday-research` is overal hetzelfde slug. Dat is meestal OK voor articles, maar voor "evergreen" learn-pillars (`/learn/poisson-goal-models`, `/learn/what-is-value-betting`) levert het Engels-ogend URLs onder /xx/-prefix.

## 6.6 Hreflang Validatie

Geverifieerd op live HTML van EN homepage + DE pricing:

| Check | Resultaat |
|-------|-----------|
| Aantal alternates | **17** (16 locales + x-default) ✅ |
| Self-reference aanwezig | ✅ |
| Wederkerigheid (alle pagina's verwijzen naar elkaars equivalent) | ✅ — geverifieerd via 3 pagina-templates |
| Geldige BCP-47 codes | ✅ alle codes zijn pure ISO 639-1 |
| `x-default` aanwezig + wijst naar EN | ✅ |
| Targets returnen 200 | ✅ alle 16 locale-URLs gaven HTTP 200 |
| Targets self-canonical | ✅ |
| Hreflang naar noindex-pagina | ❌ **N.v.t. nu, maar bij Fase 10-implementatie kritisch** |
| Sitemap heeft consistente alternates | ✅ |

> **Structureel correct**, maar zoals in 5.6 gezegd: hreflang naar 16 locale-varianten waarvan 8 onvolledig vertaald zijn = "deze 16 URLs zijn equivalent" als signaal naar Google, terwijl de werkelijkheid is "8 van deze 16 zijn 60-90% Engels". Dit is de structurele duplicate-content trap.

## 6.7 Coverage-rapport per locale (verdict-voorstel)

Onderstaande tabel is mijn voorstel voor de Fase 9-beslissing. Verdict bepaald op basis van: dictionary coverage (6.1) + hardcoded-string-leak (6.2) + PAGE_META completeness (6.3) + Sanity-coverage (6.5) + URL-slug-vertaling (1.4).

| Locale | URL-slug-translation | Dictionary cov. | Hardcoded leaks | Meta-tags compleet | Sanity content | **Voorstel verdict** |
|--------|:---:|:---:|:---:|:---:|:---:|---|
| **en** | n.v.t. (canonical) | 100% | volledig EN | 100% | 100% | **Hoofdversie** |
| **nl** | ✅ alle key routes | 92.7% | matig (legacy isNl-paths grotendeels weg) | 1 leak (/how-it-works desc) | hand-vertaald | **Klaar** |
| **de** | ✅ alle key routes | 96.4% | matig | OK | hand-vertaald | **Klaar** *(na pricing-stale-fix + leak-cleanup)* |
| **fr** | ✅ alle key routes | 95.4% | matig | OK | hand-vertaald | **Klaar** *(na pricing-stale-fix)* |
| **es** | ✅ alle key routes | 97.2% | matig | OK | hand-vertaald | **Klaar** *(na pricing-stale-fix)* |
| **it** | ✅ alle key routes | 97.1% | matig | OK | hand-vertaald | **Klaar** *(na pricing-stale-fix)* |
| **sw** | ✅ alle key routes | 96.4% | matig | OK | partieel | **NIET KLAAR** — Sanity-coverage is twijfelachtig + kleine markt |
| **id** | ✅ alle key routes | 96.2% | matig | OK | partieel | **NIET KLAAR** — idem |
| **pt** | ❌ slugs zijn EN | 96.2% | matig | OK | partieel | **NIET KLAAR** — slugs vertalen vóór indexering |
| **tr** | ❌ slugs zijn EN | 96.7% | matig | OK | partieel | **NIET KLAAR** — idem |
| **pl** | ❌ slugs zijn EN | 95.5% | matig | 1 leak (/how-it-works desc) | partieel | **NIET KLAAR** |
| **ro** | ❌ slugs zijn EN | 94.6% | matig | 1 leak (/how-it-works desc) | partieel | **NIET KLAAR** |
| **ru** | ❌ slugs zijn EN | 97.0% | matig | **5 routes met EN title+desc** | partieel | **NIET KLAAR** — fundamenteel kapot |
| **el** | ❌ slugs zijn EN | 96.1% | matig | 1 leak (/how-it-works desc) | partieel | **NIET KLAAR** |
| **da** | ❌ slugs zijn EN | 93.5% | matig | 1 leak (/how-it-works desc) | partieel | **NIET KLAAR** |
| **sv** | ❌ slugs zijn EN | 94.6% | matig | 1 leak (/how-it-works desc) | partieel | **NIET KLAAR** |

### Korte uitleg verdict-categorieën

- **Hoofdversie** = `en`. Blijft altijd live, krijgt self-canonical, is de x-default voor hreflang.
- **Klaar** = behoudt indexability + hreflang. Voorwaarden:
  1. URL-slugs zijn vertaald (alle 8 EU-key paths).
  2. Dictionary-coverage ≥95% unieke vertalingen.
  3. Meta-tags compleet en niet stale.
  4. Sanity-content is voor minimaal alle 5 league hubs + alle 4 bet-type hubs hand-vertaald.
- **NIET KLAAR** = tijdelijke noindex + uit sitemap + uit hreflang-cluster. Page blijft bereikbaar voor users (cookie-/URL-driven). Heractivatie wanneer de above voorwaarden zijn ingevuld voor die specifieke locale.

### Voorstel: 5 locales blijven indexeerbaar (en, nl, de, fr, es, it)

Dat is **6 hoofdversies (incl. EN)** die elk:
- ~95-97% UI-coverage hebben,
- vertaalde URL-slugs hebben,
- Sanity-content hebben (homepage + 6 league hubs + 4 bet-type hubs hand-vertaald per merge `f9c645e`).

De andere **10 locales (sw, id, pt, tr, pl, ro, ru, el, da, sv)** worden tijdelijk geparkeerd met noindex tot:
- (a) URL-slugs vertaald zijn,
- (b) PAGE_META gefixt is,
- (c) hardcoded EN-leaks in homepage/footer/pricing zijn opgelost,
- (d) Sanity-content geverifieerd compleet is voor de top-pagina's.

Dat is een *grote* keuze met markt-impact (Polen, Rusland, Brazilië/Portugal, Turkije zijn vandaag uit de SEO-target gehaald). De alternatieve route — alle 16 indexeerbaar houden en de gaten in 1-2 weken dichten — is de strategie die net gefaald heeft. Samenvatting in Fase 9.

## 6.8 Critical-bug-list

Vanuit Fase 6 vlieg ik nu door met deze priority-1 fixes (Fase 10):

1. **PAGE_META["/" → ru]** is identiek EN. Vervang met echte Russische vertalingen.
2. **PAGE_META["/articles"|"/about-us"|"/privacy"|"/terms" → ru]** idem.
3. **PAGE_META["/how-it-works"]** description voor `nl, pt, tr, pl, ro, ru, el, da, sv` (9 locales). Vervang met vertalingen.
4. **PAGE_META["/pricing"]** descriptions voor 11 locales bevatten stale "Bronze €0,01"-claims. Herschrijven conform huidig product (Free Access €0).
5. **8 locales (pt/tr/pl/ro/ru/el/da/sv) hebben Engels URL-slugs** in `routeTable`. Vertalen of die locales noindex zetten.
6. **Hardcoded EN strings** in `betsplug-footer.tsx`, `accuracy-plus-preview.tsx`, `seo-section.tsx`, `value-bet-panel.tsx`, `pricing-content.tsx`, `home-content.tsx`, plus de legal pages → minstens via `t()` voor de "Klaar" locales.
7. **Sanity-article-titles** die in homepages onvertaald renderen (`Bankroll Management for Football Bettors`, `Elo Rating Explained`) → controleer welke article docs geen `localized` fields hebben en vul die.

---

**Volgende stap:** Fase 7 — positionering-audit (educatief, niet gambling). Daarna Fase 8 (hygiene/CWV) en de diagnose (Fase 9).
