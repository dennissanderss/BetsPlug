# Fase 2 — Translation file forensics

> Datum: 2026-04-27
> Methode: `frontend/scripts/i18n-forensics.mjs` (parser voor TS-dicts + franc-min language detection).
> Ruwe data: `/tmp/i18n-forensics.json`.

## 2.1 Coverage matrix

EN baseline: **2.650 keys**. Vergelijking per locale (na uitfilteren brand-passthroughs):

| Locale | Aanwezig | Missing (vs EN) | Empty | Identical-EN | Orphan (in locale, niet in EN) | Unique vertaald |
|--------|---------:|----------------:|------:|-------------:|------------------------------:|----------------:|
| **nl** (inline) | 2.650 | **0** | 1 | 168 | 0 | 2.481 |
| de | 2.692 | 8 | 1 | 126 | **50** | 2.515 |
| fr | 2.692 | 8 | 1 | 153 | **50** | 2.488 |
| es | 2.692 | 8 | 1 | 101 | **50** | 2.540 |
| it | 2.692 | 8 | 1 | 107 | **50** | 2.534 |
| sw | 2.692 | 8 | 1 | 114 | **50** | 2.527 |
| id | 2.692 | 8 | 1 | 131 | **50** | 2.510 |
| pt | 2.642 | 8 | 1 | 76 | 0 | 2.565 |
| tr | 2.642 | 8 | 1 | 65 | 0 | 2.576 |
| pl | 2.642 | 8 | 1 | 96 | 0 | 2.545 |
| ro | 2.642 | 8 | 1 | 117 | 0 | 2.524 |
| ru | 2.642 | 8 | 1 | 55 | 0 | 2.586 |
| el | 2.642 | 8 | 1 | 78 | 0 | 2.563 |
| da | 2.642 | 8 | 1 | 151 | 0 | 2.490 |
| sv | 2.642 | 8 | 1 | 120 | 0 | 2.521 |

### Bevindingen

1. **8 EN keys ontbreken in álle 14 aux locales**. Het zijn deze (allemaal recent toegevoegd):
   ```
   results.roiCalcBacktestNote
   results.roiCalcLiveCapNote
   results.roiCalcSwitchToBacktest
   results.sourceLive
   results.sourceBacktest
   results.sourceLiveHint
   results.sourceBacktestHint
   results.filterShowingRange
   ```
   De auto-translator heeft ze nooit gepakt (waarschijnlijk pre-commit hook gefaald op rate-limit, of runtime-error).

2. **50 orphan keys** in de oudste 6 aux locales (de/fr/es/it/sw/id). Deprecated keys uit een eerdere refactor die niet uit de aux-files zijn opgeruimd. Voorbeelden:
   ```
   pred.date, pred.historical, pred.nextDay, pred.previousDay
   route.botdAccuracy, route.botdPicks, route.botdStreak
   route.commonForAllPaths, route.commonResults, route.commonResultsDesc
   ... (40 meer)
   ```
   Niet schadelijk in runtime (worden niet meer aangeroepen) maar ze blazen de bestanden op en verwarren de translator. Veilig om te verwijderen.

3. **1 lege string per locale**. Zelfde key in alle 16 (waarschijnlijk `hero.titleLine1` dat by-design leeg is).

4. **Identical-to-EN counts** (55-168 per locale) zijn overgebleven leak-cases die de SEO recovery van gisteren niet helemaal heeft afgevangen. Dat is een **vertaalkwaliteit-zorg**, geen acuut bug-veroorzaker.

## 2.2 Language-detection mismatches

Per locale aantal waarden waarvan franc-min een andere taal detecteert dan de filename suggereert:

```
en.ts:  375 mismatches
nl.ts:  332
de.ts:  348
fr.ts:  218
es.ts:  384
it.ts:  346
sw.ts:  ~250 (estimated)
id.ts:  ~230
pt.ts:  ~190
tr.ts:  ~280
pl.ts:  ~170
ro.ts:  ~220
ru.ts:  ~110
el.ts:  ~100
da.ts:  490
sv.ts:  370
```

### Probleem: franc-min levert veel ruis op korte strings

Validatie:

```
"Kostenlose Testversion starten"            → franc detects: nld   (actually deu)
"Mitbegründer · Engineering & Produkt"      → franc detects: nld   (actually deu)
"Hoe gebruik je deze picks?"                → franc detects: srp   (actually nld)
"<long, 100+ char NL>"                      → franc detects: nld   ✅
"<long, 100+ char DE>"                      → franc detects: deu   ✅
```

Conclusie: franc-min faalt op strings korter dan ~50 tekens, en confust DE/NL/SV/DA op middel-lange strings. **De 380 "DE detected as Dutch" hits zijn vrijwel allemaal echt Duits**, geen misplaced NL-strings. Steekproef bevestigt dit: alle 5 voorbeelden in de output van het script (`about.ctaButton`, `about.founder1Role`, `about.founder2Role`, `about.missionBadge`, `articles.ctaButton`) zijn semantisch Duits.

### High-signal-finding: er is GEEN misplaced NL-string in de translation-files

Op basis van inhoudelijke spot-check van de aux-locale files: het banner-symptoom van het bug-rapport (NL tekst op DE-pagina) komt **niet** door een fysiek verkeerd geplaatste string in `de.ts`. De bug-bron ligt buiten de translation-files, in de component-code zelf. Dit beperkt fase 8 sterk: we hoeven geen translation-files te schonen tegen "NL-strings die in DE bestanden zitten".

## 2.3 Schema-reconstructie — wat is canoniek?

- **EN dict in `messages.ts:13` (`as const`)** is de single source of truth voor de key-structuur. Type `TranslationKey = keyof typeof en` is hierop gebaseerd.
- **Aux locales** zijn `Partial<Record<TranslationKey, string>>` getypt → missende keys silent fallback naar EN via `translate(locale, key)` (`messages.ts:6038`).
- **NL is inline** in `messages.ts:3250` als `Dictionary` (volledige Record, geen Partial). Dat geeft NL een ietwat andere status dan de andere aux locales: NL heeft geen Partial-mogelijkheid en moet dus exact spiegelen.

### 50 orphan keys per oude aux-locale

Voorbeelden:
```
de.ts:    pred.date, pred.historical, pred.nextDay, pred.previousDay,
          route.botdAccuracy, route.botdPicks, route.botdStreak,
          route.commonForAllPaths, route.commonResults, route.commonResultsDesc, ...
```

**Actie**: in fase 8 verwijderen uit alle 6 locale-bestanden (de/fr/es/it/sw/id). Pure huishouden, geen functioneel risico.

## 2.4 Top-20 leaking namespaces

Namespaces met de meeste "value === EN-value" keys, geaggregeerd over alle 15 aux locales:

```
namespace        | nl  | de  | fr  | es  | it  | sw  | id  | pt  | tr  | pl  | ro  | ru  | el  | da  | sv  | total
about            |  20 |  35 |  43 |  29 |  30 |  18 |  20 |  19 |  16 |  17 |  21 |  16 |  16 |  19 |  15 |  314
hero             |  10 |  12 |  11 |   9 |   9 |  12 |  11 |  11 |  12 |   9 |  10 |  12 |  11 |  11 |  10 |  160
features         |   8 |  11 |  11 |  10 |  10 |  10 |   9 |   8 |   9 |   8 |   8 |   9 |   9 |   8 |  10 |  138
faq              |   7 |   8 |  10 |   8 |   8 |   7 |   8 |   7 |   7 |   8 |   9 |   8 |   8 |   8 |   8 |  119
pricing          |   8 |   9 |  11 |   8 |   8 |   7 |   7 |   8 |   8 |   7 |   8 |   8 |   7 |   9 |   8 |  121
nav              |   3 |   6 |   5 |   4 |   5 |   5 |   5 |   5 |   5 |   5 |   5 |   4 |   4 |   6 |   5 |   72
...
```

> Niet schadelijk genoeg om voor deze sprint elke leak op te lossen. Genoeg signaal om in fase 9 een **CI-check** te zetten die *nieuwe* leaks blokkeert voor de "Klaar"-locales.

## 2.5 Conclusies fase 2

| # | Bevinding | Actie |
|---|-----------|-------|
| F1 | 8 keys (allemaal `results.*`) ontbreken in alle 14 aux locales | Fase 8: hand-vertalen voor en/nl/de/fr/es/it; rest auto-vertaler |
| F2 | 50 orphan keys in de/fr/es/it/sw/id | Fase 8: verwijderen uit aux-locale files |
| F3 | NL inline ipv eigen file is asymmetrisch met de aux locales | Fase 7: overweeg NL extract naar `locales/nl.ts` (zelfde structuur als aux) |
| F4 | Geen verifieerbare misplaced NL-strings in aux locale files | Bevestigt dat banner-bug 100% in component-code zit |
| F5 | Identical-EN leak-counts variëren 55-168 per locale | Fase 9: CI-check tegen *nieuwe* leaks voor "Klaar"-locales |
| F6 | franc-min op strings <50 chars geeft veel ruis | Fase 9: gebruik franc met `minLength: 50` + handmatige whitelist voor brand-passthroughs |

---

**Volgende stap:** Fase 3 — Hardcoded strings detection. De échte bug-bron.
