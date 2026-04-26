# Fase 6 — Diagnose & Plan (BESLISMOMENT)

> Datum: 2026-04-27
> Branch: `i18n/full-overhaul`
> Bron-rapporten: `01-discovery.md` t/m `05-runtime-binding.md`.

## 1. Root cause(s)

Drie samengestelde oorzaken, gerangschikt op impact:

### 1.1 PRIMARY — Hardcoded user-facing strings buiten `t()` in componenten

**Bewijs**: ~360+ hardcoded strings (115 publiek, 245 authed). De gemelde NL-banner op DE-pagina komt uit `src/app/(app)/predictions/page.tsx:1453-1461` waar de hele banner-tekst rauw in JSX staat, geen translation key, geen `t()`.

```tsx
<span className="font-semibold text-white">Hoe gebruik je deze picks?</span>{" "}
Alle picks zijn beschikbaar om op te wedden. Hoe hoger de{" "}
...
```

Dezelfde file heeft ook hardcoded EN threshold-labels (`"High (>75%)"`) en een `as any`-cast die het type-systeem omzeilt voor een NL-fallback "Periode".

Dit is geen incident maar een patroon: 7 componenten op de publieke surface en 9 in de authed-surface bevatten user-facing hardcoded text.

### 1.2 SECONDARY — Type-safety voor translation keys is verzwakt door `Partial<Record>` cast

**Bewijs**: aux locale dicts zijn getypt als `Partial<Record<TranslationKey, string>>`. Dat is by design (recovery-commit `4e7e0a4`) zodat orphan keys de build niet breken. Bijgevolg: TypeScript klaagt **niet** als een aux locale-bestand keys mist. Pre-commit auto-translator vangt dit gedeeltelijk af, maar 8 keys (allemaal `results.*`) ontsnappen — ze ontbreken in alle 14 aux locales en vallen runtime door naar EN.

`as any`-casts in component-code (`t("pred.rangeLabel" as any)`) bypassen `TranslationKey`-validatie volledig. Dit moet niet kunnen.

### 1.3 TERTIARY — Geen "loud failure" mechanisme in dev

**Bewijs**: `translate()` in `messages.ts:6038` doet stille fallback (`?? en[key]`). Geen `console.warn`, geen `[MISSING:key]` placeholder, geen telemetry. Een ontwikkelaar die een nieuwe key toevoegt en vergeet dezelfde toe te voegen aan andere "Klaar"-locales merkt niets totdat een gebruiker het rapporteert.

### NIET een oorzaak

- ❌ De runtime-binding werkt. Locale stroomt correct van URL → middleware → server-component → client-context.
- ❌ Geen meta-tag-bron-mismatches voor de 6 indexable locales (al gefixt in SEO-recovery van 2026-04-26).
- ❌ Geen verifieerbaar misplaced NL-strings in aux locale .ts files. De 102 "DE detected as Dutch" hits in de language-detection scan zijn franc-min false positives op korte Latin-script strings.
- ❌ De fallback-cascade (`dict[key] ?? en[key]`) valt naar EN, **niet** naar NL. De NL-banner-bug komt niet door fallback-keten.

## 2. Per-locale werk

| Locale | Coverage | Identical-EN leaks | Missing keys | Aanbeveling |
|--------|---------:|-------------------:|-------------:|-------------|
| **en** | 100% (baseline) | n.v.t. | 0 | **Hoofdversie — blijft** |
| **nl** | 100% (alle keys aanwezig) | 168 | 0 | **Klaar maken** — fix 168 leaks indien hoog-impact, anders accepteren als brand-passthrough |
| **de** | 99.7% (8 missing) | 126 | 8 | **Klaar maken** — vul 8 `results.*` + +50 orphans verwijderen |
| **fr** | 99.7% | 153 | 8 | **Klaar maken** — idem |
| **es** | 99.7% | 101 | 8 | **Klaar maken** — idem |
| **it** | 99.7% | 107 | 8 | **Klaar maken** — idem |
| **sw** | 99.7% | 114 | 8 | **Tijdelijk inactief** — al parked door SEO-recovery (`noindex, follow`); UI-coverage is OK maar Sanity-content niet |
| **id** | 99.7% | 131 | 8 | **Tijdelijk inactief** — idem |
| **pt** | 99.7% | 76 | 8 | **Tijdelijk inactief** — idem |
| **tr** | 99.7% | 65 | 8 | **Tijdelijk inactief** — idem |
| **pl** | 99.7% | 96 | 8 | **Tijdelijk inactief** — idem |
| **ro** | 99.7% | 117 | 8 | **Tijdelijk inactief** — idem |
| **ru** | 99.7% | 55 | 8 | **Tijdelijk inactief** — idem |
| **el** | 99.7% | 78 | 8 | **Tijdelijk inactief** — idem |
| **da** | 99.7% | 151 | 8 | **Tijdelijk inactief** — idem |
| **sv** | 99.7% | 120 | 8 | **Tijdelijk inactief** — idem |

> "Klaar maken" = en, nl, de, fr, es, it (6 locales — exact dezelfde set als `INDEXABLE_LOCALES` van de SEO-recovery).
> "Tijdelijk inactief" = de 10 parked locales. Voor i18n-purposes bestaat hun translation-file nog (zodat heractivatie mogelijk blijft), maar:
> - Gebruikers kunnen ze niet meer kiezen via de language switcher
> - Verwijderd uit `locales` tuple (niet uit het type-systeem)
> - Heractivatie-criteria gedocumenteerd in `docs/i18n.md`

> **Belangrijk**: dit is een meer aggressieve stap dan de SEO-recovery. SEO-recovery heeft de 10 locales op `noindex, follow` gezet maar **wel bereikbaar gehouden voor users**. Voor i18n-purposes wil de opdracht "gebruikers kunnen ze niet meer kiezen" — dat betekent **language switcher beperken tot 6 locales**.

## 3. Componenten met hardcoded strings (extract-prioriteit)

### Priority 1 — banner-bug + threshold-labels (de gemelde fout)

```
src/app/(app)/predictions/page.tsx
  L460   title="Upgrade to Silver to view pre-match odds"
  L1019  >All Leagues<
  L1142  ?: "High (>75%)"
  L1143  ?: "Med (50–75%)"
  L1144  ?: "Low (<50%)"
  L1407  >All predictions<
  L1453-1461  >Hoe gebruik je deze picks ... NL banner ...<
  L1473  ?: "Periode" (NL hardcoded, t() with as-any cast)
```

### Priority 2 — public components op iedere pagina

```
src/components/ui/betsplug-footer.tsx       3 hits ("Free to join", "Daily picks", "Live chat")
src/components/ui/seo-section.tsx           2 hits ("Elo ratings", "Poisson goal models" — overweeg whitelisten als technische term)
src/components/ui/site-nav.tsx              2 hits
src/components/layout/header.tsx            3 aria-labels
src/components/bet-of-the-day/value-bet-panel.tsx  6 hits (NL/EN mix)
src/components/noct/accuracy-plus-preview.tsx      4 hits (NL hardcoded)
src/app/pricing/pricing-content.tsx         3 hits ("Platinum unbeatable.", "Upgrade once the numbers land.")
src/app/checkout/checkout-content.tsx       4 hits
```

### Priority 3 — authed user-facing pages (Klaar-tier-feature)

```
src/app/(app)/trackrecord/page.tsx     11 hits
src/app/(app)/teams/[id]/page.tsx       8
src/app/(app)/strategy/[id]/page.tsx    8
src/app/(app)/myaccount/page.tsx        8
src/app/(app)/about/page.tsx            7
src/app/(app)/live-score/[id]/page.tsx  7
src/app/(app)/favorites/page.tsx        4
src/app/(app)/results/page.tsx          3
```

### NIET in scope deze sprint — admin & legal

```
admin/* (Cas + Dennis only — ~150 hits)
src/app/privacy/page.tsx (25)
src/app/terms/page.tsx (10)
src/app/cookies/page.tsx (8)
src/app/responsible-gambling/page.tsx (19)
```

Alle 4 legal-pages zijn by-design EN-only volgens `sitemap.xml/route.ts` comment ("Legal pages: identical content across locales — emit default locale only"). Document dit expliciet in `docs/i18n.md` zodat het geen surprise is.

## 4. Voorgestelde architectuur (Fase 7)

**Hergebruik bestaande custom i18n-implementatie.** Niet migreren naar next-intl/react-intl/i18next. Reden: 82 components gebruiken `useTranslations()`, de wrapper is type-safe via `TranslationKey`, en de SEO-recovery van gisteren zit er net in. Een library-migratie is een grotere chirurgie dan dit probleem rechtvaardigt.

**Wat wel gewijzigd:**

1. **Strenger TS-type voor aux locales**
   - Behoud `Partial<Record<TranslationKey, string>>` voor pragmatische redenen (auto-translator vult progressief in), MAAR
   - Voeg een aparte `RequiredKeysFor<Locale>`-check toe in CI die voor "Klaar"-locales (en, nl, de, fr, es, it) een **strict** match verlangt
   - Verbied `as any` in `t()` aanroepen via ESLint custom rule

2. **Loud failures in development**
   - `translate()` wordt: `dict?.[key] ?? markMissing(en[key], key, locale)` waar `markMissing` in dev een `console.error` logt en het returned value wraps in `[MISSING:de:key.path] EN-fallback-text`
   - In productie: silent fallback naar EN (geen visuele wijziging — geen UX-regressie)

3. **Dev runtime locale-mismatch sanity check**
   - Mount `<LocaleSanityCheck />` in `(app)/layout.tsx` en root `layout.tsx` in dev
   - Gebruikt franc-min met `minLength: 80` om false positives te beperken
   - Logged `console.error` bij detectie van content in andere taal dan URL-locale

4. **Type-safe `t()` zonder ontsnapping**
   - Wrapper `useTranslations()` returnt `t: (key: TranslationKey, vars?: MessageVars) => string` — al type-safe
   - ESLint regel die `t(... as any)` patroon blokkeert

5. **Single source of truth voor locale-tuple**
   - `locales` (16) blijft het type-niveau (zodat parked locale-files niet TS-error geven)
   - Nieuw: `ENABLED_LOCALES` (6) is wat de language-switcher gebruikt en wat in `messages` record zit
   - `INDEXABLE_LOCALES` (6) blijft voor SEO-doeleinden (gerelateerd maar niet aanraken)

## 5. Voorgestelde guardrails (Fase 9)

1. **`scripts/i18n-check.mjs`** (nieuw, vervangt en breidt uit op `audit-en-leaks.mjs`):
   - Verifieert iedere "Klaar"-locale heeft alle EN keys
   - Detecteert language-mismatches met `franc-min` op `minLength: 80` + brand-whitelist
   - Detecteert hardcoded JSX text in component-files (de bestaande `check-no-hardcoded-strings.mjs` is te beperkt — alleen `isNl ?` ternary)
   - Exit 1 bij issues
2. **Pre-commit hook** roept `npm run i18n:check` aan (al via husky-equivalent; uitbreiden)
3. **GitHub Actions workflow** `.github/workflows/i18n.yml` runt zelfde check op iedere PR
4. **ESLint custom rule** `no-as-any-in-t` — blokkeert `t(... as any)` patroon
5. **PR-template** met i18n-checklist
6. **`docs/i18n.md`** documenteert workflow + heractivatie-criteria voor parked locales

## 6. Estimaat van werk per fase

| Fase | Werk | Estimaat |
|------|------|----------|
| 7 — Architectuur | Loud-failure wrapper, dev sanity check, ENABLED_LOCALES, ESLint rule | 2 uur |
| 8.1 — 8 missing `results.*` keys vertalen voor 6 locales | hand | 30 min |
| 8.2 — Banner + threshold + rangeLabel extract uit predictions/page.tsx | bug-fix | 1 uur |
| 8.3 — Top-15 high-impact public/authed component-extracts | strings + vertalingen 6 locales | 4-6 uur |
| 8.4 — Orphan keys verwijderen uit 6 oudste aux locales (50/locale) | huishouden | 30 min |
| 8.5 — Language switcher beperken tot 6 locales | ENABLED_LOCALES integratie | 30 min |
| 9 — Guardrails (i18n-check, ESLint rule, CI workflow, docs) | tooling + docs | 2 uur |
| 10 — Verificatie + build | curl + manueel testen | 1 uur |
| **Totaal** | | **~12-14 uur** |

> Pragmatische scope: **legal-pages, admin, en authed-tier-only niet-kritieke pages worden NIET vertaald in deze sprint** — admin is niet user-facing voor klanten, legal is by design EN-only. Dat scheelt ~250 strings × 5 locales = 1.250 vertalingen.

---

# 🛑 BESLISMOMENT

**Cas, samenvatting:**

Ik heb **75 hardcoded JSX-strings + 41 hardcoded attributes op publieke pages** gevonden, **245 hardcoded in authed pages** (waarvan ~150 admin-only), **8 missing translation keys** (allemaal `results.*` in alle aux locales) en **0 verifieerbare misplaced NL-strings in aux-locale files**.

**Het banner-probleem zit in:**
```
src/app/(app)/predictions/page.tsx
  L460   title="Upgrade to Silver to view pre-match odds"  (EN attribute)
  L1019  >All Leagues<                                      (EN)
  L1142-1144  threshold-labels via ternary               (EN, gemist door scan)
  L1407  >All predictions<                                  (EN)
  L1453-1461  De volledige NL-banner                       (NL hardcoded JSX)
  L1473  ?: "Periode"                                       (NL fallback met as-any cast)
```

Eén bestand, drie failure modes (NL hardcoded + EN hardcoded + as-any cast).

**Voorstel:**
- Architectuur: behoud bestaande custom i18n (geen library-migratie). Voeg wrapper-laag toe met loud failures in dev, dev runtime sanity-check (franc-min), ENABLED_LOCALES (6) gescheiden van type-niveau locales (16).
- Type-safe keys via bestaande `TranslationKey = keyof typeof en` + ESLint regel die `as any`-cast in `t()` verbiedt.
- Pre-commit hook + CI-check uitbreiden tot full hardcoded-string detection (bestaande `check-no-hardcoded-strings.mjs` is te beperkt).
- Runtime-validatie via `<LocaleSanityCheck />` in dev-mode op (app)/layout en root-layout — met franc-min `minLength: 80` om false positives te vermijden.
- **Per locale**:
  - `en` — Hoofdversie, blijft.
  - `nl, de, fr, es, it` — **Klaar maken**. Alle Priority-1 + Priority-2 + Priority-3 hardcoded strings extracten en vertalen. 8 missing `results.*` keys hand-vertalen. 50 orphans opruimen in de 6 oudste aux-files.
  - `sw, id, pt, tr, pl, ro, ru, el, da, sv` — **Tijdelijk inactief**. Verwijder uit `ENABLED_LOCALES` (language-switcher toont ze niet). Behoud translation-files. Documenteer heractivatie-criteria.
- **Niet in scope deze sprint**: admin pages, legal pages (privacy/terms/cookies/responsible-gambling). Documenteer expliciet in `docs/i18n.md`.

**Concrete impact:**
- Banner-bug verdwijnt voor altijd.
- Geen mengtaal meer mogelijk op de 6 indexable locales.
- Nieuwe hardcoded strings worden door pre-commit + CI geblokkeerd.
- Nieuwe `as any` casts in `t()` worden door ESLint geblokkeerd.
- Nieuwe missende keys voor "Klaar"-locales falen build.
- Translation-platform (Lokalise/Crowdin) wordt voor later open gehouden — niet nu.

**Akkoord om door te gaan met implementatie?**

Of, alternatief:

- (**A**) Wil je een andere set "Klaar"-locales? Bijvoorbeeld alleen EN+NL?
- (**B**) Wil je dat ik de admin-strings óók extract (~150 strings + vertalingen)?
- (**C**) Wil je dat ik de legal-pages óók vertaal? (Was bewuste keuze om EN-only te houden volgens sitemap-comment.)
- (**D**) Wil je een library-migratie naar next-intl ondanks de extra impact?
- (**E**) Wil je de runtime franc-min check NIET (extra dependency in dev-bundle, geen prod-impact)?

Wacht op je bevestiging.
