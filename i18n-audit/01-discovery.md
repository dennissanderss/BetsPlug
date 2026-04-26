# Fase 1 — Discovery

> Datum: 2026-04-27
> Branch: `i18n/full-overhaul`
> Scope: alleen observeren — geen wijzigingen.

## 1.1 Tech-stack

| Onderdeel | Waarde | Bewijs |
|-----------|--------|--------|
| Framework | Next.js **14** App Router | `frontend/package.json:36` |
| Rendering | SSR (server components default) | n.v.t. |
| TypeScript | 5.6 | `frontend/package.json:60` |
| Hosting | Vercel `fra1` | `frontend/vercel.json:8` |

## 1.2 i18n-library

**Geen externe i18n library**. Volledig custom implementatie in `frontend/src/i18n/`.

```
$ grep -E '"(next-intl|next-i18next|react-i18next|react-intl|@nuxtjs/i18n|vue-i18n|@lingui|@formatjs)"' frontend/package.json
(empty)
```

Bestanden in `src/i18n/`:

```
config.ts             — locales tuple, defaultLocale, localeMeta, isLocale, INDEXABLE_LOCALES
expand.ts             — onbekend, te inspecteren in fase 2
format.ts             — formatMsg(template, vars) voor placeholder-substitutie {name}
locale-provider.tsx   — React Context: LocaleProvider, useTranslations(), useLocalizedHref()
locales/*.ts          — 14 aux locale dicts (de, fr, es, it, sw, id, pt, tr, pl, ro, ru, el, da, sv)
messages.ts           — EN dict (regel 13-3244, source of truth) + NL dict inline (3250-6018)
                        + samengevoegd `messages` record (6019-6036)
                        + translate() helper (6038-6041)
routes.ts             — routeTable: canonical EN path → per-locale slug; helpers
split-messages.mjs    — onbekend tooling-script (mogelijk historische split tussen modules)
```

## 1.3 Translation-bestanden

**`messages.ts` is .ts, geen .json.** Iedere locale-dict is een TypeScript object literal getypt als `Dictionary` (`Partial<Record<TranslationKey, string>>`).

| Locale | Pad | Vorm | Regels |
|--------|-----|------|--------|
| en (canoniek) | `src/i18n/messages.ts` (inline regel 13-3244) | `as const` object | ~3.232 keys |
| nl (inline) | `src/i18n/messages.ts` (regel 3250-6018) | `Dictionary` | ~2.589 keys |
| de | `src/i18n/locales/de.ts` | `Partial<Record<…>>` | ~2.717 |
| fr | `src/i18n/locales/fr.ts` | idem | ~2.717 |
| es | `src/i18n/locales/es.ts` | idem | ~2.717 |
| it | `src/i18n/locales/it.ts` | idem | ~2.717 |
| sw | `src/i18n/locales/sw.ts` | idem | ~2.717 |
| id | `src/i18n/locales/id.ts` | idem | ~2.717 |
| pt | `src/i18n/locales/pt.ts` | idem | ~2.667 |
| tr | `src/i18n/locales/tr.ts` | idem | ~2.667 |
| pl | `src/i18n/locales/pl.ts` | idem | ~2.667 |
| ro | `src/i18n/locales/ro.ts` | idem | ~2.667 |
| ru | `src/i18n/locales/ru.ts` | idem | ~2.667 |
| el | `src/i18n/locales/el.ts` | idem | ~2.667 |
| da | `src/i18n/locales/da.ts` | idem | ~2.667 |
| sv | `src/i18n/locales/sv.ts` | idem | ~2.667 |

> Type-safety: `TranslationKey = keyof typeof en` (`messages.ts:3245`). EN is dus al de single source of truth voor key-structuur — de aux locales zijn `Partial<Record>`, dus missende keys triggeren géén TS-error. Dat is by design (recovery commit `4e7e0a4` van 2026-04-26). **Bijgevolg**: missende DE-keys vallen runtime door naar EN via `translate()`'s `?? en[key]` (zie 1.5).

## 1.4 Ondersteunde locales + routing

Uit `src/i18n/config.ts:20-39` + `:79-92` (na de SEO recovery van 2026-04-26):

```ts
locales            = en, nl, de, fr, es, it, sw, id, pt, tr, pl, ro, ru, el, da, sv  (16)
defaultLocale      = en
INDEXABLE_LOCALES  = en, nl, de, fr, es, it                                          (6)
PARKED            = sw, id, pt, tr, pl, ro, ru, el, da, sv                          (10)
```

Routing-strategie: **prefix-based** met middleware-rewrite naar canonical EN page.

```
/en/<path>          → 308 redirect → /<path>
/nl/voorspellingen  → internal rewrite → /predictions, x-locale: nl, NEXT_LOCALE cookie
/de/spiel-vorhersagen → idem (de)
/voorspellingen     → 308 → /predictions
/<canonical-en>     → as-is, x-locale: en
```

`src/middleware.ts` is de centrale broker. `applyParkedLocaleNoindex` zet `X-Robots-Tag: noindex, follow` op de 10 parked locales (toegevoegd in de SEO recovery — niet relevant voor deze i18n-overhaul, **niet aanraken**).

## 1.5 Locale-stroom door de app

```
HTTP request /de/spiel-vorhersagen
        │
        ▼
middleware.ts ── parseLocalizedPath() ── rewrite → /match-predictions + headers x-locale=de
        │
        ▼
app/match-predictions/page.tsx (server component)
   └─ generateMetadata() ── getServerLocale() reads x-locale → "de" → PAGE_META["/match-predictions"].de
   └─ default export: page renders, calls Sanity / API
   └─ children include client components wrapped in <LocaleProvider locale={locale}>
        │
        ▼
LocaleProvider (locale-provider.tsx)
   └─ stores locale in React Context
   └─ exposes useTranslations() → t(key, vars) which calls translate(locale, key)
        │
        ▼
translate(locale, key)  in messages.ts:6038-6041
   const dict = messages[locale];      // de dict
   return dict?.[key] ?? en[key];      // fallback to EN if missing
```

**Belangrijk gevolg van die fallback-regel**: een missende key in DE valt naar **EN**, NIET naar NL. Dat betekent het banner-symptoom (NL tekst op DE-pagina) kan NIET door dit mechanisme komen — die NL-tekst moet dus hardcoded in een component staan of fysiek in de.ts onder een verkeerde key. Dit beperkt de zoekruimte.

## 1.6 Externe vs interne content-bron

| Bron | Doel | Locale-handling |
|------|------|-----------------|
| `messages.ts` + `locales/*.ts` | UI-strings (knoppen, labels, errors, banners) | flat dotted keys, type-safe via TranslationKey |
| `src/data/page-meta.ts` | per-route SEO meta (title/description/og*) | `PAGE_META["/path"][locale]` lookup |
| Sanity CMS | editorial content (homepage blocks, articles, learn pillars, league hubs, bet-type hubs) | per-locale localized fields op document-niveau |
| `src/data/home-faq.ts`, `tier-metadata.ts`, etc. | gestructureerde data met user-facing strings | mengeling: sommige verwijzen naar TranslationKey, andere bevatten directe strings |

> Twee aparte mechanismen voor i18n: (a) `messages.ts` voor UI, (b) `PAGE_META` voor `<title>`/description, (c) Sanity voor copy. **Drie bronnen** — cruciaal voor fase 4 (meta-tag audit). De banner uit het bug-rapport is type (a)/UI, dus moet via `messages.ts` of hardcoded zijn.

## 1.7 Bestaande tooling

| Tool | Pad | Doel |
|------|-----|------|
| Auto-translator | `frontend/scripts/translate.mjs` | Vult missing keys in aux locales via Google Translate API; pre-commit hook trigger |
| EN-leak audit | `scripts/audit-en-leaks.mjs` | Detecteert keys waar value === EN-value (potentieel niet vertaald) |
| Hardcoded ternary check | `scripts/check-no-hardcoded-strings.mjs` | **Beperkt** — alleen `isNl ? "X" : "Y"` patroon, NIET algemene hardcoded JSX |
| Sanity gap report | `scripts/sanity-gap-report.mjs` | Per-document missende localized fields |
| i18n-batch tooling | `scripts/apply-i18n-batch.mjs`, etc. | Bulk hand-vertalingen uit JSON in messages/locales injecteren |
| Validator | `scripts/validate-i18n-seo.mjs` | 16-locale × 5-path probe |
| pre-commit hook | `scripts/setup-hooks.sh` (auto-installed via `postinstall`) | Triggert translate + check on commit |

## 1.8 Sample renders (productie betsplug.com)

```
GET /
  <html lang="en">
  <title>AI-Powered Football Predictions · BetsPlug</title>

GET /de/predictions
  <html lang="de">
  <title>KI-gestützte Fußballvorhersagen · BetsPlug</title>

GET /nl/predictions
  <html lang="nl">
  <title>AI-gedreven Voetbalvoorspellingen · BetsPlug</title>

GET /predictions
  <html lang="en">
  <title>AI-Powered Football Predictions · BetsPlug</title>
```

**Conclusie**: `<html lang>` en `<title>` matchen overal de URL-locale. Dat deel werkt structureel correct (al gevalideerd in de SEO-audit van gisteren). Het banner-probleem zit dus dieper in body-rendering, niet in metadata.

## 1.9 Bug-locatie banner — directe vondst

`grep -rln "Hoe gebruik je deze picks"` levert exact één treffer:

```
frontend/src/app/(app)/predictions/page.tsx:1453-1461
```

```tsx
<p className="text-xs leading-relaxed text-slate-300">
  <span className="font-semibold text-white">Hoe gebruik je deze picks?</span>{" "}
  Alle picks zijn beschikbaar om op te wedden. Hoe hoger de{" "}
  <span className="font-semibold text-amber-300">betrouwbaarheid %</span>, hoe
  zekerder het model. Wij raden aan: kies picks{" "}
  <span className="font-semibold text-emerald-300">boven 70%</span> voor de beste
  kans op succes. Filter op{" "}
  <span className="font-semibold text-white">Gold</span> of{" "}
  <span className="font-semibold text-white">Platinum</span> om alleen die picks te
  zien.
</p>
```

✅ **Smoking gun.** Hardcoded NL JSX, geen `t()`, geen translation key. Dezelfde tekst rendert dus in iedere locale, ook DE.

Threshold-labels op regel 1142-1144 in dezelfde file:

```tsx
{opt === "High"   ? "High (>75%)"
 : opt === "Medium" ? "Med (50–75%)"
 : opt === "Low"    ? "Low (<50%)"
 : opt}
```

✅ **Tweede vondst.** Hardcoded EN strings.

Plus regel 1472-1473 (rangeLabel met NL hardcoded fallback):

```tsx
{t("pred.rangeLabel" as any) === "pred.rangeLabel"
  ? "Periode"
  : t("pred.rangeLabel" as any)}
```

✅ **Derde vondst.** "Periode" is NL hardcoded; `as any` cast omzeilt het type-systeem; key bestaat niet in `en`.

> Deze drie patronen bevestigen drie verschillende failure modes uit de opdracht in één bestand:
> - Failure mode 1 (banner): hardcoded user-facing string in component
> - Failure mode 1 (threshold): idem voor labels
> - Failure mode 3 (rangeLabel): `as any`-cast leak die het type-systeem bypasses

## 1.10 Reikwijdte van de i18n-functie-aanroepen

```
235 .ts/.tsx files in src/
 82 components import useTranslations()
153 components doen dat NIET
```

Niet elk van die 153 is een vertaalrisico (sommige zijn pure utilities, types, hooks zonder UI), maar het verschil markeert de zoekruimte voor fase 3.

---

**Volgende stap:** Fase 2 — Translation file forensics (coverage matrix + language detection).
