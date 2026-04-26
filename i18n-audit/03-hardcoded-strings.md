# Fase 3 — Hardcoded strings detection

> Datum: 2026-04-27
> Tool: `frontend/scripts/i18n-hardcoded-scan.mjs`
> Ruwe data: `/tmp/i18n-hardcoded.json`

## 3.1 Summary

| Bucket | Hits | Toelichting |
|--------|-----:|-------------|
| Public JSX text | **75** | Tekst tussen tags op publieke routes |
| Public attribute (placeholder/aria-label/title/alt/label) | **41** | |
| Public toast/alert/throw | 2 | Twee `console.error()`-calls |
| Authed JSX text | 116 | Onder `(app)/`-groep — admin + dashboard |
| Authed attribute | 129 | |
| Authed toast | 0 | Geen toast/alert hardcoded |
| Zod validation messages | 0 | Geen zod-validators in user-facing code |

**Scope-aandeel:**
- 143 publieke `.tsx/.jsx` files gescand
- 34 authed `.tsx/.jsx` files gescand
- 214 totale `.ts/.tsx` files (inclusief utilities) gescand voor zod

> ⚠️ **Beperkingen scan**: regex matched `>Tekst<` en `attr="Tekst"`. Het mist:
> - Strings in ternaries (`opt === "High" ? "High (>75%)" : ...`) — daardoor zijn de threshold-labels op `predictions/page.tsx:1142-1144` niet gepakt
> - Vervolg-fragmenten in JSX waar `{" "}` tussen string-segmenten zit (bv. de banner-vervolg op regel 1454, 1456)
> - Strings in conditionele expressies binnen `{...}`-curly-braces
>
> Het echte aantal hardcoded user-facing strings is dus hoger dan 116 + 245 = ~360. Reëel orde van grootte: **400-500 strings**.

## 3.2 Top-12 publieke files

| File | Hits | Status |
|------|-----:|--------|
| `src/app/privacy/page.tsx` | 25 | Legal page — by-design EN-only (sitemap.xml comment: "Legal pages: identical content across locales") |
| `src/app/responsible-gambling/page.tsx` | 19 | idem |
| `src/app/terms/page.tsx` | 10 | idem |
| `src/app/cookies/page.tsx` | 8 | idem |
| `src/components/bet-of-the-day/value-bet-panel.tsx` | 6 | **Mengeling NL+EN hardcoded** ("Extra bewijs:", "Methode-bewijs (leakage-vrij)", "Value Bet of the Day") |
| `src/components/noct/accuracy-plus-preview.tsx` | 4 | **NL hardcoded** ("Kan status niet ophalen.", "Voortgang dataset") |
| `src/app/checkout/checkout-content.tsx` | 4 | aria-label, console.error |
| `src/app/pricing/pricing-content.tsx` | 3 | "Platinum unbeatable.", "Upgrade once the numbers land." (EN hardcoded) |
| `src/components/ui/betsplug-footer.tsx` | 3 | "Free to join", "Daily picks", "Live chat" (EN, op iedere pagina) |
| `src/components/ui/payment-badges.tsx` | 3 | "Mastercard", "American Express", "Apple Pay" — brand-namen, mogen blijven |
| `src/components/layout/header.tsx` | 3 | aria-labels |
| `src/components/ui/seo-section.tsx` | 2 | "Elo ratings", "Poisson goal models" — technische termen |

### High-impact: NL-hardcoded in components die op alle locales renderen

```
src/components/bet-of-the-day/value-bet-panel.tsx:
  L299  >Extra bewijs:<
  L452  >Methode-bewijs (leakage-vrij)<
  L629  >Value Bet of the Day<

src/components/noct/accuracy-plus-preview.tsx:
  L85   >Kan status niet ophalen.<
  L94   >Voortgang dataset<
```

> Twee componenten met **hardcoded Nederlands**. Renderen die op een DE-/FR-/ES-pagina, dan ziet een Duitse bezoeker NL-tekst — exact het banner-symptoom uit de bug.

### High-impact: EN-hardcoded in iedere pagina (footer, header, nav)

```
src/components/ui/betsplug-footer.tsx:
  L140  >Free to join<
  L142  >Daily picks<
  L257  >Live chat<

src/components/ui/seo-section.tsx:
  L104  >Elo ratings<
  L105  >Poisson goal models<
```

> Op een NL-pagina ziet de bezoeker dan EN-fragmenten in de footer. Niet zo dramatisch als NL→DE maar wel zichtbaar.

## 3.3 Top-20 authed files (via `(app)/`-groep)

| File | Hits | User-zichtbaar? |
|------|-----:|-----------------|
| `src/components/admin/system-info.tsx` | 61 | Admin-only — niet kritiek |
| `src/app/(app)/admin/page.tsx` | 36 | Admin-only |
| `src/components/admin/analytics-settings.tsx` | 16 | Admin-only |
| `src/components/admin/finance-tab.tsx` | 13 | Admin-only |
| **`src/app/(app)/trackrecord/page.tsx`** | 11 | **Paid users** |
| `src/components/admin/telegram-manager.tsx` | 10 | Admin-only |
| `src/components/admin/goals-notes-tab.tsx` | 10 | Admin-only |
| **`src/app/(app)/teams/[id]/page.tsx`** | 8 | **Paid users** |
| **`src/app/(app)/strategy/[id]/page.tsx`** | 8 | **Paid users** |
| **`src/app/(app)/myaccount/page.tsx`** | 8 | **All authed** |
| **`src/app/(app)/about/page.tsx`** | 7 | **All authed** |
| **`src/app/(app)/live-score/[id]/page.tsx`** | 7 | **Paid users** |
| `src/components/admin/blog-manager.tsx` | 7 | Admin-only |
| `src/components/admin/email-diagnostics-tab.tsx` | 7 | Admin-only |
| `src/components/admin/user-manager.tsx` | 5 | Admin-only |
| **`src/app/(app)/favorites/page.tsx`** | 4 | **All authed** |
| **`src/app/(app)/predictions/page.tsx`** | 4 | **All authed — bug-locatie** |
| `src/components/admin/seo-dashboard.tsx` | 4 | Admin-only |
| **`src/app/(app)/results/page.tsx`** | 3 | **Paid users** |

### Bug-locatie volledig: `(app)/predictions/page.tsx`

```
L460   title="Upgrade to Silver to view pre-match odds"   [EN attribute]
L1019  >All Leagues<                                       [EN]
L1142  ?: "High (>75%)"                                    [EN, ternary - GEMIST door scan]
L1143  ?: "Med (50–75%)"                                   [EN, ternary - GEMIST]
L1144  ?: "Low (<50%)"                                     [EN, ternary - GEMIST]
L1407  >All predictions<                                   [EN]
L1453  >Hoe gebruik je deze picks?<                        [NL — banner-bug-eerste-regel]
L1454  Alle picks zijn beschikbaar om op te wedden...      [NL — banner vervolg]
L1456  zekerder het model. Wij raden aan: kies picks       [NL — banner vervolg]
L1473  ?: "Periode"                                        [NL fallback in ternary - GEMIST]
```

> Eén bestand combineert drie failure modes:
> - NL hardcoded (banner)
> - EN hardcoded (threshold-labels, "All Leagues", "All predictions", upgrade-tooltip)
> - "Periode"-NL-fallback via `t("pred.rangeLabel" as any) === "pred.rangeLabel" ? "Periode" : ...`

## 3.4 Specifieke bug-zoekvraag — banner & threshold-labels

**Banner Nederlandse strings**:
- Bestand: `src/app/(app)/predictions/page.tsx`
- Regelnummers: 1453-1461
- Status: **hardcoded in JSX zonder `t()` call, zonder translation key**
- Renders op iedere /xx/predictions URL (rewrite naar /predictions) ongeacht actieve locale → DE-bezoeker, FR-bezoeker, EN-bezoeker zien allemaal Nederlands
- Voorgestelde keys (volgt bestaande `pred.*` namespace):
  ```
  pred.banner.howToUseTitle    = "How to use these picks?"
  pred.banner.howToUseBody     = "All picks are available to bet on. The higher the {confidenceTerm}, the more confident the model. We recommend: pick predictions {threshold}+ for the best chance of success. Filter by {tier1} or {tier2} to see only those picks."
  pred.banner.confidenceTerm   = "confidence %"
  pred.banner.threshold        = "above 70%"
  pred.banner.tier1            = "Gold"
  pred.banner.tier2            = "Platinum"
  ```
  Of split de banner in losse spans met aparte keys voor de gehighlighte sub-strings:
  ```
  pred.banner.title
  pred.banner.intro      = "All picks are available to bet on. The higher the"
  pred.banner.confidence = "confidence %"
  pred.banner.middle     = ", the more confident the model. We recommend: pick predictions"
  pred.banner.threshold  = "above 70%"
  pred.banner.tail       = "for the best chance of success. Filter by"
  pred.banner.linkOr     = "or"
  pred.banner.suffix     = "to see only those picks."
  ```

**Threshold-labels**:
- Bestand: `src/app/(app)/predictions/page.tsx`
- Regels: 1142-1144
- Status: **hardcoded EN ternary**
- Voorgestelde keys:
  ```
  pred.threshold.high   = "High (>75%)"
  pred.threshold.medium = "Med (50–75%)"
  pred.threshold.low    = "Low (<50%)"
  ```

**rangeLabel-fallback**:
- Bestand: `src/app/(app)/predictions/page.tsx`
- Regels: 1472-1473
- Status: `t("pred.rangeLabel" as any) === "pred.rangeLabel"` — gebruikt `as any` om type-safety te omzeilen, key bestaat niet, fallback "Periode" (NL) hardcoded
- Voorgestelde fix:
  ```
  pred.rangeLabel = "Period"   (in en + nl + de + fr + es + it)
  ```
  En vervang de aanroep door simpelweg `t("pred.rangeLabel")` (zonder `as any`).

## 3.5 Voorgestelde aanpak per categorie (uitwerking in fase 8)

| Categorie | Aantal | Aanpak |
|-----------|-------:|--------|
| Authed admin (system-info, admin/page, finance, analytics, telegram, blog, email-diag, user-manager, seo-dashboard, goals-notes) | ~150 | **Skip in deze sprint**. Admin-only, alleen Cas/Dennis zien dit. Toevoegen aan whitelist van ESLint-regel zodat scan ze niet verder rapporteert. |
| Authed user-facing (`(app)/predictions`, `/trackrecord`, `/results`, `/teams`, `/strategy`, `/live-score`, `/myaccount`, `/about`, `/favorites`) | ~60 | **Vertalen voor en/nl/de/fr/es/it**. Eerste prioriteit: `predictions/page.tsx` (bug-fix). |
| Public marketing (footer, header, nav, seo-section, value-bet-panel, accuracy-plus-preview, pricing-content, checkout-content) | ~40 | **Vertalen voor en/nl/de/fr/es/it**. |
| Legal pages (privacy, terms, cookies, responsible-gambling) | ~62 | **Skip in deze sprint**. By-design EN-only zoals in sitemap-comment vastgelegd. Document expliciet in `docs/i18n.md`. |
| Brand/payment-badge labels ("Mastercard", "Apple Pay", "Elo ratings", "Poisson goal models") | ~10 | **Whitelist** — brand-namen, blijven verbatim. |
| aria-labels in payment-badges, header, checkout | ~10 | **Vertalen** — accessibility-strings horen vertaald te zijn. |

Totaal werk fase 8: **~120 strings extracten en vertalen** voor 6 indexable locales.

## 3.6 Specifieke check op de bekende fout (volgens opdracht-template 3.6)

Banner: "Hoe gebruik je deze picks" — zoekresultaat:
```
$ grep -rln "Hoe gebruik je deze picks" frontend/src/
frontend/src/app/(app)/predictions/page.tsx          ← enige treffer
```

Engelse equivalent: niet aanwezig in codebase.
Duitse equivalent: niet aanwezig in codebase.

Conclusie: **de string staat alleen in de component, hardcoded in NL, geen translation-file kent hem**. Dat is een type-1 failure (hardcoded string in component). De cleanup is straightforward: extraheer naar `messages.ts` onder `pred.banner.*`, vervang hardcoded JSX door `t()` calls, voeg vertalingen toe voor en/nl/de/fr/es/it.

---

**Volgende stap:** Fase 4 — Meta-tag source audit (translation-only).
