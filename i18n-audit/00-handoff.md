# Fase 11 — Handoff

> Datum: 2026-04-27
> Branch: `feat/upsell-banner-cleanup` (lokale auto-rename — was `i18n/full-overhaul`)
> Commits boven `bdae50a`: 5 (audit, architecture, banner-fix, hardcoded-extracts, guardrails)

## Wat is opgelost

### Direct fix van het bug-rapport

`(app)/predictions/page.tsx` had:
- Volledige NL banner hardcoded in JSX (geen `t()`, geen translation key)
- EN threshold-labels via ternary
- "Periode" NL-fallback met `as any`-cast
- "All Leagues", "All predictions" hardcoded EN

Allemaal vervangen door `t()` calls onder `pred.*` namespace, hand-vertaald voor en/nl/de/fr/es/it.

### Architecturele verbeteringen

| Aspect | Voor | Na |
|--------|------|-----|
| Aux-locale type | Inconsistent (sommige strict, sommige Partial) | Allemaal `Partial<Record<TranslationKey, string>>` |
| Language switcher | Toonde alle 16 locales | Alleen 6 ENABLED_LOCALES (en/nl/de/fr/es/it) |
| `setLocale("ru")` | Werkte (kon stale parked-locale pinnen) | Wordt geweigerd met `console.warn` |
| Missende key in dev | Silent EN fallback | `console.error` (throttled) + EN fallback |
| Onbekende key (bv. `as any`) | Returned key string | `[i18n:missing]key[/i18n:missing]` (zichtbaar in DOM) |
| Mengtaal-detectie in dev | Geen | `<LocaleSanityCheck />` mount in root layout, franc-min op rendered `<main>` |
| Pre-commit | `check-no-hardcoded-strings.mjs` (alleen `isNl?` ternary) | + `i18n-check.mjs` (volledige coverage + hardcoded scan) |
| CI | Geen i18n-gate | `.github/workflows/i18n.yml` op iedere PR |
| Documentatie | Verspreid in commit messages | `docs/i18n.md` (single source of truth) |

### ~30 hardcoded strings extracted

- `value-bet-panel.tsx` — 11 NL strings (banner, columns, labels)
- `accuracy-plus-preview.tsx` — 4 NL strings
- `betsplug-footer.tsx` — 3 EN
- `pricing-content.tsx` — 2 EN
- 4 client components met aria-labels (legal-page, data-table, disclaimer-banner, TierPerformanceCard)
- 19 aria-labels via batch-script in 14 andere components

## Hoe verder content toevoegen

Zie `docs/i18n.md` § "Adding a new UI string" voor de stap-voor-stap. Korte versie:

1. Add key naar EN block in `messages.ts`
2. Add NL inline + DE/FR/ES/IT in `locales/*.ts` (hand-translate)
3. Use via `t("key")` in client component
4. `npm run i18n:check` confirms

Voor een nieuwe **server component** met `t()`: bestaande pattern is via `translate(locale, key)` direct met `getServerLocale()`. Beter zou een `getServerTranslator()` helper zijn — niet in deze sprint, follow-up.

## Tijdelijk inactieve locales (10)

| Locale | Status | Heractivatie-criteria |
|--------|--------|------------------------|
| sw, id | Tijdelijk inactief | Sanity-content klaar + URL-slugs vertaald + hardcoded EN strings extracted voor deze locale |
| pt | Tijdelijk inactief | Idem — eerste op de roadmap (scheduled agent `betsplug-seo-pt-prep` runs 2026-05-24) |
| tr, pl, ro, ru, el, da, sv | Tijdelijk inactief | Idem — volgorde per markt-prioriteit in `seo-audit/09-handoff.md` |

Heractivatie = toevoegen aan `ENABLED_LOCALES` in `src/i18n/config.ts` zodra alle vier de voorwaarden green zijn.

## Actieve guardrails

| Laag | Wat | Wanneer |
|------|-----|---------|
| TypeScript | `TranslationKey = keyof typeof en` + Partial casts op aux | Compile-time (build) |
| `useTranslations()` wrapper | `t(key: TranslationKey)` is type-safe | Compile-time |
| `translate()` runtime | Console.error op missing key in dev, `[i18n:missing]…` op onbekende keys | Runtime in dev |
| `<LocaleSanityCheck />` | Detecteert mengtaal in `<main>` | Runtime in dev |
| `check-no-hardcoded-strings.mjs` | Blokkeert `isNl ? "X" : "Y"` patroon op staged files | Pre-commit |
| `i18n-check.mjs` | Coverage + hardcoded JSX scan met `.i18nignore` baseline | Pre-commit + CI |
| `.github/workflows/i18n.yml` | Runt i18n:check op iedere PR | CI |
| `.github/pull_request_template.md` | i18n-checklist | PR-creatie |

Defense in depth: een nieuwe Cas-of-Dennis-of-LLM die per ongeluk een NL string in een component plakt, krijgt:
1. Build error (als ze `as any` gebruiken om TS te omzeilen — die blocking is via runtime visible-marker)
2. Console.error in dev als ze een bestaande key gebruiken die in een aux locale ontbreekt
3. Visuele banner-mismatch via `LocaleSanityCheck` in dev
4. Pre-commit failure als de string nog niet via `t()` loopt
5. CI failure als het toch op de PR landt

## Follow-up sprints

In aflopende prioriteit:

1. **Blog posts multilingual** — schema-migratie in Sanity + ~115 article-vertalingen (zie `docs/i18n.md` § "Sanity articles mono-lingual"). User wil later op terugkomen, optie A/B/C/D.
2. **Authed Priority-3 pages** — 33 hardcoded strings in `.i18nignore` baseline (trackrecord, matches, about, teams, strategy, myaccount, live-score, results, favorites). Volgens dezelfde extract-pattern.
3. **accuracy-plus-preview.tsx restant** — 6+ NL strings die de scan miste. Vraagt complete rewrite van het component.
4. **Server-component breadcrumbs** — 6 publieke pages met `aria-label="Breadcrumb"` die nog niet via `t()` lopen. Vereist server-side i18n helper.
5. **PT (Portugees) heractivatie** — scheduled agent `betsplug-seo-pt-prep` (2026-05-24) inventariseert wat er nog mist.
6. **Identical-EN leak cleanup** — 100-170 keys per locale waar `value === en[key]`. Niet schadelijk in runtime maar vertaalkwaliteit-verbetering. CI flagt nieuwe leaks via `--no-detect`-skip.

## Snel-referentie: bestanden die ik heb aangeraakt

```
frontend/src/i18n/config.ts                  +ENABLED_LOCALES, +isEnabledLocale
frontend/src/i18n/messages.ts                loud-failure translate(); +50 nieuwe keys (en+nl)
frontend/src/i18n/locale-provider.tsx        setLocale rejects non-enabled
frontend/src/i18n/locales/{de,fr,es,it}.ts   +50 hand-vertaalde keys; cast naar Partial
frontend/src/i18n/locales/{sw,id,pt,tr,pl,ro,ru,el,da,sv}.ts   cast naar Partial
frontend/src/app/layout.tsx                  +<LocaleSanityCheck locale={locale} />
frontend/src/app/(app)/predictions/page.tsx  banner + thresholds + range labels via t()
frontend/src/components/dev/LocaleSanityCheck.tsx  NEW
frontend/src/components/ui/language-switcher.tsx   ENABLED_LOCALES
frontend/src/components/common/language-switcher.tsx  ENABLED_LOCALES
frontend/src/components/bet-of-the-day/value-bet-panel.tsx  11 strings via t()
frontend/src/components/noct/accuracy-plus-preview.tsx     4 strings via t() + loop var rename
frontend/src/components/ui/betsplug-footer.tsx              3 strings via t()
frontend/src/components/legal/legal-page.tsx                +useTranslations + breadcrumb t()
frontend/src/components/common/data-table.tsx               +useTranslations + page-nav t()
frontend/src/components/common/disclaimer-banner.tsx        +useTranslations + dismiss t()
frontend/src/components/dashboard/TierPerformanceCard.tsx   +useTranslations + noDataYet t()
+ 14 andere components met enkele aria-label vervangingen
frontend/src/app/pricing/pricing-content.tsx   2 strings via t()
frontend/src/app/checkout/checkout-content.tsx idem
frontend/src/app/(en hereisen) ...

frontend/scripts/i18n-check.mjs                 NEW
frontend/scripts/i18n-forensics.mjs             NEW (audit-tool)
frontend/scripts/i18n-hardcoded-scan.mjs        NEW (audit-tool)
frontend/scripts/setup-hooks.sh                 +i18n-check post-translate gate
frontend/.i18nignore                             NEW (technical-debt baseline)
frontend/package.json                            +i18n:check / i18n:check:full / i18n:forensics

.github/workflows/i18n.yml                      NEW
.github/pull_request_template.md                NEW

docs/i18n.md                                    NEW (definitive workflow doc)
i18n-audit/                                     NEW (8 documents — diagnose + plan)
```

## Voor de PR

Branch: `feat/upsell-banner-cleanup` (was bedoeld als `i18n/full-overhaul`; lokale hook hernoemde). Inhoudelijk klopt alles.

Aanbevolen PR-titel:
> i18n full overhaul — fix DE/NL banner mengtaal-bug + ENABLED_LOCALES + guardrails

Of, als je de oude branch-naam wil gebruiken: hernoem lokaal voor de push:

```bash
git branch -m feat/upsell-banner-cleanup i18n/full-overhaul
git push -u origin i18n/full-overhaul
```

Daarna PR via `gh pr create` of GitHub UI.

## Wat er NIET is aangeraakt (per opdracht)

- `sitemap.xml/route.ts`
- `robots.ts`
- `seo-helpers.ts` canonical / hreflang logica
- `middleware.ts` — alleen routing, niet de SEO directives
- Structured data / JSON-LD
- Indexing-directives

Dit is consistent met de instructie "raak GEEN SEO-zaken aan tenzij strikt nodig". Alleen de `Partial`-cast wijziging op alle aux locale files raakt het type-systeem dat de SEO-recovery van gisteren heeft gevormd — dat is een **harmoniserende** fix (alle 14 worden Partial in plaats van een mix), geen SEO-strategie-change.
