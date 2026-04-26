# Fase 2 — Git-archeologie

> Datum: 2026-04-26
> Scope: alleen commits die SEO-, i18n-, hreflang-, sitemap-, robots-, canonical-, locale-routing- of rendering-strategie raken.
> Branch: alle (`git log --all`).

## 2.1 Kernbevinding: dit is de TWEEDE collapse — niet de eerste

In de afgelopen 4 weken (april 2026) is de site **twee keer** door een i18n-induced ranking-collapse gegaan:

1. **Collapse 1 (rond 22 april)** — gediagnosticeerd door Cas in commit `8281f0c` ("Brand-term visibility collapsed in GSC under the 8-locale setup (hreflang conflicts, cross-locale link graph pollution, duplicate content)"). Toen werd de site **teruggerold naar EN-only**.
2. **Collapse 2 (na 24 april)** — wat de gebruiker nu meldt. Triggered door commit `712de96` "16-locale Nerdytips-pattern indexable routing", die een dag later ge-merged is naar main (`f9c645e`).

> De recovery die de gebruiker vraagt is dus de **tweede** in een korte cyclus. Iedere extra retry zonder onderliggende discipline kost weer rankings.

## 2.2 Tijdlijn van kritieke commits (chronologisch)

```
2026-04-09  dda6eb6  Add multi-language support with hreflang SEO
                     ↪ 6 locales (en/nl/de/fr/es/it), middleware-rewrites,
                       hreflang clusters in sitemap.

2026-04-09  96c6555  feat(i18n): complete site-wide translations for 6 locales
                     ↪ 217 → 806 keys per locale.

(later) ── intermezzo ── extra locales sw/id, ROI, value-bet werk

2026-04-22  8281f0c  fix(seo): roll back i18n routing, serve EN exclusively
                     ↪ ──────────────────────────────────────
                       ROLLBACK 1
                       Brand visibility collapsed in GSC.
                       /xx/ → 308 naar canonical EN. <html lang=en>.
                       Geen hreflang. Sitemap = 84 EN URLs.
                       robots.ts: expliciete Disallow op /nl/, /de/, ...
                       ──────────────────────────────────────

2026-04-22  7b7c2c4  feat(i18n): Google Translate widget (client-side)
                     ↪ Workaround. Bleek onbetrouwbaar (rate-limit + ORB).

2026-04-23  4a3d7cd  feat(i18n): SSR translations on /xx/ URLs tagged noindex
                     ↪ Translate-widget vervangen door SSR.
                       Maar /xx/ kreeg X-Robots-Tag: noindex,nofollow.
                       getCanonical = altijd EN. Geen hreflang.
                       Doel: visitor ziet z'n taal, Google ziet alleen EN.

2026-04-23  e326771  fix(i18n): extract 82 hardcoded isNl ternaries to dictionary
2026-04-23  ca13640  fix(i18n): extract 114 more hardcoded ternaries (batch 2)
                     ↪ Het feit dat dit nog gebeurde IN APRIL ná 6 maanden
                       i18n betekent: hardcoded strings waren nooit volledig
                       geëlimineerd vóór de schaalvergroting.

2026-04-24  ddf064c  feat(i18n): top-16 locale expansion + hardcoded-string guard
                     ↪ Locales widened 8 → 16.
                       Pre-commit hook tegen `isNl ? "X" : "Y"` patroon.

2026-04-24  200b268  feat(i18n): Sanity schema → 16 locales, free-tier translate pipeline
2026-04-24  728cd29  feat(i18n): widen editorial locale types to all 16 locales
2026-04-24  d82a898  fix(translator): skip writes on API failure (was: fall back to EN)
                     ↪ KRITIEK. Eerdere translator schreef EN als fallback bij
                       API-fail, wat stilletjes EN naar non-EN locale-bestanden
                       lekte (bron van 1359 leaks die later (aa1cb33) gefixt zijn).

2026-04-24  712de96  feat(seo): 16-locale Nerdytips-pattern indexable routing
                     ↪ ──────────────────────────────────────
                       THE FLIP — START VAN COLLAPSE 2
                       /xx/ URLs zijn nu indexeerbaar.
                       getCanonicalUrl returnt active-locale URL (self-canonical).
                       getLocalizedAlternates → 17-tag hreflang cluster
                         (16 locales + x-default).
                       Sitemap: 84 → 1.299 URLs, 22.032 hreflang-alternates.
                       Robots: /xx/ Disallows verwijderd.
                       
                       LET OP: de commit-message zelf waarschuwt:
                         "shipping now would flood Google with 1,299 URLs
                          serving EN fallback in every locale, which is
                          exactly the duplicate-content trap we just
                          climbed out of."
                       En toch is het een dag later op main gemerged.
                       ──────────────────────────────────────

2026-04-25  f9c645e  Merge feat/i18n-full-scale → main
                     ↪ De flip is nu live in productie.
                       Validator scripts/validate-i18n-seo.mjs toegevoegd
                       (16-locale × 5-path probe).
                       Sanity gap report claimt "0 documents with gaps".

2026-04-25  cfe53df / daa983c / 35d7240 / 5f3c124 / 85fb908
                     ↪ "feat(i18n): hand-authored translations for ..."
                       Hand-vertalingen voor homepage + 5 league hubs +
                       4 bet-type hubs + 14 Sanity documents +
                       app-shell strings × 14 locales.

2026-04-26  7e671cd  fix(auth+i18n): mixed-state session bug + 151 hardcoded UI strings
                     ↪ ────────────────────────────────────
                       USER MERKT BUGS — fixes:
                       - 151 hardcoded UI strings extracted (post-flip!)
                       - Auth bug die /login redirects veroorzaakte op
                         publieke pagina's (kan invloed hebben gehad op
                         crawler-experience: bot ziet 200 op /, dan in
                         background fetch een 401, dan client-side redirect
                         vóór render af is).
                       ────────────────────────────────────

2026-04-26  4e7e0a4  chore(i18n): make aux locale casts Partial...
                     ↪ Type-fix zodat fehlende keys in non-EN locales
                       silently terugvallen naar EN. Versterkt mismatch.

2026-04-26  aa1cb33  fix(i18n): plug 1359 EN-value leaks across 15 locales
                     ↪ ────────────────────────────────────
                       "Cas's screenshot showed the right-sidebar dashboard
                        widget rendering English (...) on the NL locale."
                       
                       2.844 keys hadden value === EN value (identical
                       fallback). 1.359 daarvan zijn nu hand-vertaald.
                       
                       Restant: 2844 − 1359 = ~1485 leaks blijven. Plus alles
                       wat de heuristiek miste (false-negatives als de
                       vertaling toevallig hetzelfde gespeld is, of als de
                       Engelse waarde een placeholder bevat).
                       ────────────────────────────────────
```

## 2.3 Voor versus na — kerncomponenten

### `src/middleware.ts`

| Aspect | Pre-flip (`8281f0c`) | Post-flip (`712de96`, huidige) |
|---|---|---|
| `/en/foo` | 308 → `/foo` | 308 → `/foo` |
| `/de/foo` | **308 → `/foo` + cookie cleared** | **rewrite → `/foo`, x-locale=de, INDEXABLE** |
| `/voorspellingen` (bare slug) | 308 → `/predictions` | 308 → `/predictions` |
| X-Robots-Tag | `noindex` op /xx/ | alleen op preview-hosts |

### `src/lib/seo-helpers.ts → getCanonicalUrl`

| Pre-flip | Post-flip |
|---|---|
| Returnt **EN-absolute** URL ongeacht active locale | Returnt **active-locale** URL (self-canonical per locale) |

### `src/lib/seo-helpers.ts → getLocalizedAlternates`

| Pre-flip | Post-flip |
|---|---|
| `{ canonical: <EN>, languages: {} }` (leeg) | `{ canonical: <activeLocale>, languages: { en, nl, de, fr, es, it, sw, id, pt, tr, pl, ro, ru, el, da, sv, "x-default" → en } }` |

### `src/app/layout.tsx → generateMetadata`

| Pre-flip | Post-flip |
|---|---|
| `<html lang="en">` hardcoded | `<html lang={getServerLocale()}>` |
| Geen `alternates.languages` | Spreid `alternates.languages` 16-key in metadata |

### `src/app/sitemap.xml/route.ts`

| Pre-flip | Post-flip |
|---|---|
| 84 URLs, alleen EN, geen alternates | 1.299 URLs (canonical × 16 locales), elk met 17-tag hreflang-cluster |

### `src/app/robots.ts`

| Pre-flip | Post-flip |
|---|---|
| Expliciete `Disallow: /nl/`, `/de/`, ... | Disallow alleen op authed/funnel paths |

## 2.4 Wat wel structureel goed is

- Pre-commit hook `frontend/scripts/check-no-hardcoded-strings.mjs` blokkeert `isNl ? "X" : "Y"` patronen sinds 24 april.
- Validator `frontend/scripts/validate-i18n-seo.mjs` controleert SEO-tags per locale.
- Translator schrijft niet meer EN als fallback bij API-fail (`d82a898`).
- Sanity-content is volgens claim van `f9c645e` voor 14 documenten compleet hand-vertaald.

## 2.5 Wat zwak / verdacht is

1. **De flip-commit (`712de96`) zegt zelf: "shipping now would flood Google with 1,299 URLs serving EN fallback in every locale, which is exactly the duplicate-content trap we just climbed out of."** — maar het is binnen 24 uur naar main gemerged.
2. **`aa1cb33` (gisteren) bevestigt 2.844 leaks**, waarvan 1.485 nog OPEN. Google heeft een week (24 → 26 april) gehad om die EN-fallback-content op /xx/-URLs te indexeren.
3. **`7e671cd` (gisteren) extracteerde 151 hardcoded strings** — die waren tijdens de flip dus nog actief en hebben in /xx/-render altijd Engels getoond.
4. **`4e7e0a4` (vandaag)** zet `Partial<Record<...>>` op de aux-locale casts. Dat is een type-cast: TS staat nu missing keys toe, terwijl de runtime stilletjes terugvalt op EN. Dit verstevigt de mismatch in plaats van te beschermen.
5. **8 van de 16 locales (pt/tr/pl/ro/ru/el/da/sv)** hebben in `routes.ts` geen vertaalde slugs. Als content onvolledig is, plus URL-slug Engels, dan ziet Google praktisch een EN-pagina onder een vreemd prefix. Dat is de ergste vorm van duplicate-content.

## 2.6 Conclusie Fase 2

De regressie heeft één duidelijk omslagpunt: **commit `712de96` op 2026-04-24**, ge-merged naar main op 2026-04-25 (`f9c645e`). De combinatie van:

- 1.299 URLs in de sitemap, waarvan een groot deel EN-fallback content serveert (door de 1.485 nog-niet-gevulde dictionary-keys);
- 8 locales zonder vertaalde slugs (Engelse URL-slug onder /pt/, /tr/, ...);
- hardcoded strings die nooit door `t()` lopen (151 in één commit gevonden, mogelijk meer);
- een fresh self-canonical regime dat Google dwingt /xx/ URLs als first-class te indexeren

heeft Google een grote partij **bijna-duplicate, gedeeltelijk-Engelse, gedeeltelijk-vertaalde** URLs voorgeschoteld. Daarom: 64 "Discovered – not indexed" en 6 "Crawled – not indexed" in GSC.

De symptomen die de gebruiker meldt — "title in taal A, description in taal B, op dezelfde pagina" — passen exact bij het patroon van **gemengde dictionary-keys** waarbij sommige namespaces (PAGE_META) wel hand-vertaald zijn en andere namespaces (sidebar/upgrade/tier/...) terugvallen op EN.

---

**Volgende stap:** Fase 3 — controleren of de geserveerde HTML écht het verwachte (gemengde) gedrag laat zien.
