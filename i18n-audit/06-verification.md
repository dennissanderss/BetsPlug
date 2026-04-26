# Fase 10 — Verificatie

> Datum: 2026-04-27

## Build status

```
$ npm run i18n:check
[i18n:check] EN baseline: 2707 keys
[i18n:check] Checking coverage for ENABLED_LOCALES (6): en, nl, de, fr, es, it
  ✓ nl: 100% (2707 keys)
  ✓ de: 100% (2757 keys)
  ✓ fr: 100% (2757 keys)
  ✓ es: 100% (2757 keys)
  ✓ it: 100% (2757 keys)
[i18n:check] Hardcoded JSX scan...
  ✓ no new hardcoded strings
[i18n:check] ✓ all checks passed

$ npx tsc --noEmit
(clean — pre-existing demo.* errors filtered)

$ npx next build
✓ all 117 static pages generated
✓ middleware bundle 30.9 kB
✓ no build errors
```

## Wat in deze sprint is opgelost

| # | Bug | Fix |
|---|-----|-----|
| F1 | NL banner op DE /predictions pagina | Banner extracted naar 8 `pred.banner.*` keys + threshold-labels naar `pred.threshold.*` + rangeLabel naar `pred.rangeLabel`. Geen hardcoded NL meer in dat bestand. |
| F2 | `t("pred.rangeLabel" as any)` cast bypassed type-systeem | Key bestaat nu écht in EN dict; `as any` verwijderd. |
| F3 | 8 `results.*` keys ontbraken in alle 14 aux locales | Auto-translator vulde ze in tijdens commit 1. |
| F4 | 168-150 hardcoded JSX strings op publieke surface | Top-30 high-impact extracted: footer (3), pricing (2), value-bet-panel (11), accuracy-plus-preview (4), 19 aria-labels in 14 components, plus 4 nieuwe a11y client components met hook. |
| F5 | Aux locale dicts cast als strict `Record` (build break met missing keys) | Alle 14 aux files genormaliseerd naar `Partial<Record>`. |
| F6 | LanguageSwitcher toonde alle 16 locales (incl. parked) | Beperkt tot `ENABLED_LOCALES` (6). |
| F7 | Silent fallback in `translate()` (geen dev-feedback bij missende keys) | Loud failure: console.error in dev voor missing key + EN fallback; `[i18n:missing]key[/i18n:missing]` voor onbekende keys (die `as any`-casts vinden). |
| F8 | Geen runtime detectie van mengtaal-content | `<LocaleSanityCheck />` gemount in dev: leest `<main>` text, franc-min met `minLength: 200`, console.error bij locale-mismatch. |
| F9 | Geen CI-gate tegen nieuwe hardcoded strings | `npm run i18n:check` + GitHub Actions workflow + pre-commit hook. |
| F10 | Geen documentatie van workflow | `docs/i18n.md` (nieuw, 200 regels). |
| F11 | Geen baseline-bookkeeping voor bekende technical debt | `.i18nignore` met ~33 entries voor authed Priority-3 pages. |

## Wat structureel anders werkt

1. **Type safety verstevigt**: `t(... as any)` bypass blocked door ESLint geen — maar de loud-failure wrapper rendert `[i18n:missing]…[/i18n:missing]` zodat een dev meteen ziet dat de key niet bestaat. Plus de pre-commit `i18n:check` faalt op missing keys voor enabled locales.
2. **6/16 locales als gate**: language-switcher + setLocale rejecten parked locales. URL-direct hits werken nog (parked URLs bestaan voor de SEO-noindex-strategie). Iemand kan dus nog steeds `/ru/predictions` typen — maar de UI biedt de switch niet aan.
3. **Sitewide footer + meta-tags consistent**: alle 6 indexable locales tonen native taal in header, footer, banners, and most components.
4. **Drie defensielagen tegen het banner-bug**:
   - Pre-commit hook: blokkeert nieuwe hardcoded JSX strings op publieke surface.
   - Dev console: `LocaleSanityCheck` logged zichtbaar bij iedere render.
   - CI: GitHub Actions valt PR's omver bij missing keys of nieuwe hardcoded strings.
5. **Documentatie**: `docs/i18n.md` is dé referentie voor add-key/add-locale/troubleshoot. PR template heeft i18n-checklist.

## Manueel test-protocol (voor Cas)

Na merge en Vercel-deploy:

```bash
# Smoke check per locale — title + html lang + Content-Language
for locale in en nl de fr es it; do
  echo "=== /${locale}/predictions ==="
  curl -sSI -A Googlebot -L "https://betsplug.com/${locale}/predictions" | grep -i 'content-language'
  curl -sS -A Googlebot -L "https://betsplug.com/${locale}/predictions" \
    | grep -oE '<title>[^<]+</title>|<html[^>]+lang="[^"]+"' | head -2
done
```

Manueel in browser:
1. Open `https://betsplug.com/de/spiel-vorhersagen` → banner moet in **Duits** zijn ("Wie nutzt du diese Tipps? Alle Tipps stehen zum Wetten zur Verfügung. Je höher die Konfidenz %, …")
2. Open `https://betsplug.com/nl/voorspellingen` → banner Nederlands ("Hoe gebruik je deze picks?")
3. Open `https://betsplug.com/fr/predictions-match` → banner Frans
4. Open `https://betsplug.com/predictions` → banner Engels ("How do you use these picks?")
5. Inspecteer `<select>` taal-switcher — moet **6** opties tonen (en/nl/de/fr/es/it), géén 16
6. Open dev-tools → Console → switch naar `/de/predictions` → géén `[i18n] LocaleSanityCheck:` errors verwacht

## Wat NIET in deze sprint is opgelost (follow-ups)

| # | Item | Reden | Aanpak |
|---|------|-------|--------|
| O1 | ~33 hardcoded strings in authed Priority-3 pages (trackrecord, matches, about, teams, strategy, myaccount, live-score, results, favorites) | Buiten scope (geen blocking bug, lower-traffic) | Eigen sprint; baseline staat in `.i18nignore` |
| O2 | Admin pages (~150 strings) | Cas + Dennis only, niet user-facing | Skip permanent of separate admin-i18n-sprint |
| O3 | Legal pages (privacy/terms/cookies/responsible-gambling, ~62 strings) | By design EN-only per sitemap-comment | Skip permanent, document in `docs/i18n.md` |
| O4 | thank-you-content.tsx (single-shot post-checkout) | Lower priority | Volgende UX-sprint |
| O5 | Sanity articles mono-lingual (blog posts in EN op /xx/ pages) | Schema-migratie + 23 × 5 vertalingen vereist | Aparte sprint; user vraagt later beslissing |
| O6 | 6 server-component breadcrumbs op publieke pages | Vereist server-side i18n wiring | Refactor naar `t()` server helper of port deze pages naar client |
| O7 | accuracy-plus-preview.tsx — 6 langere NL strings (regel 61, 65, 75-79, 119, 122-123, 153, 162) | Te kort/variabel voor scan; niet gevangen in hardcoded-detector | Eigen pass — dit bestand is overwegend NL-hardcoded, vraagt totale rewrite |
| O8 | Auto-translator output kwaliteit voor parked locales | Google Translate API, niet hand-vertaald | OK voor parked; bij promotion handmatig reviewen |

## Restant-leak baseline

Coverage 100% maar er zijn nog 100-170 keys per locale waar `value === en[key]` (identical-EN leaks). Deze zijn:
- Brand passthroughs (Free, Silver, Gold, …) — OK
- Korte technische termen (xG, Elo, …) — OK
- Mogelijk wat onvertaalde keys die niet voldoen aan brand-whitelist heuristiek — opruimen in follow-up

Ik laat dit aan de fase-9 i18n:check doen om bij gradual-improvement te helpen — de detect-pass (`npm run i18n:check:full`) flagt strings waarvan franc-min de taal "wrong" detecteert.

---

**Volgende stap:** Fase 11 — Handoff voor Cas.
