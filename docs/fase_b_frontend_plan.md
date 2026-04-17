# Fase B — Frontend Tier UI Implementation Plan

**Datum:** 17 april 2026
**Status:** PLAN — wacht op goedkeuring. Geen code gewijzigd.
**Context:** Backend tier systeem is live sinds 16 april (commit `f9b1b62`). Alle 9 tier-aware endpoints geven 200 met correcte filtering. Baseline-diff toont no drift.
**Referenties:**
- `docs/tier_system_plan.md` — tier-definities + cijfer-architectuur
- `docs/v10_user_environment_redesign.md` — oorspronkelijke UI plannen (§5-6 achterhaald door NOCTURNE)
- `frontend/NOCTURNE.md` — design system (volledig)
- `docs/_internal_tier_response_shape.md` — API response-velden

---

## 0. Wat al werkt — Fase B hoeft NIET te bouwen

Onderstaande bestaat al in `frontend/src/`. Fase B **hergebruikt** dit, niet herbouwen:

| Bestaand | Waar | Wat |
|---------|------|-----|
| NOCTURNE design system | `NOCTURNE.md` + `src/components/noct/*` | `<GlassPanel>`, `<HexBadge>`, `<Pill>`, `<DataChip>`, `<TrustScore>`, `.card-neon-*`, `.btn-*` |
| `<UpgradeLockModal>` | `src/components/noct/upgrade-lock-modal.tsx` | Click-CTA voor locked features (benefits + per-tier copy) |
| `<PaywallOverlay>` | `src/components/ui/paywall-overlay.tsx` | Blurred content overlay |
| `<UpsellBanner>` | `src/components/ui/upsell-banner.tsx` | Inline/banner/card upsell CTAs |
| `<Sidebar>` lock-per-item | `src/components/layout/sidebar.tsx` | `requiredTier` prop + lock-icon + modal |
| `useTier()` hook | `src/hooks/use-tier.ts` | `{ tier, rank, isAdmin, hasAccess(req) }` — localStorage + `/api/subscriptions/status` |
| Analyst tier-gate | `src/app/(app)/analyst/layout.tsx` | Layout-level guard (Silver teaser Match Deep Dive, Gold+ rest) |
| Pricing page | `src/app/pricing/page.tsx` | Plan comparison (leest nu van Sanity — moet overschakelen naar API) |
| Dashboard | `src/app/(app)/dashboard/page.tsx` | Hero + widgets — hoeft pick_tier badge toegevoegd |
| BOTD pagina | `src/app/(app)/bet-of-the-day/page.tsx` | PaywallOverlay + UpsellBanner al actief |

---

## 1. Design tokens — **ongewijzigd** uit NOCTURNE

Tier-kleuren **worden gemapped op bestaande NOCTURNE accent-kleuren**:

| Pick tier | Badge emoji | Accent-kleur | Shadow / glow | Gebruik |
|-----------|:--:|-----|-----|-----|
| 🟢 Platinum | 🟢 | `--accent-green` (#22c55e) | `glow-green` | Elite, hero, premium CTA |
| 🔵 Gold | 🔵 | `--accent-blue` (#3b82f6) | `glow-blue` | Performance tier |
| ⚪ Silver | ⚪ | `--text-secondary` (~#999) | neutrale stroke | Mid-tier |
| ⬜ Free | ⬜ | `--surface-3` muted | geen glow | Baseline |

**Purple** (`--accent-purple`) blijft exclusief gebruikt voor "Platinum / Premium subscription" marketing CTAs (upgrade-prompts), niet voor pick-tier badges zelf. Dit onderscheidt **product-tier** (subscription paywall) van **kwaliteitsniveau** (pick badge).

Fonts/spacing/surface-tokens: **geen wijzigingen** — alles komt uit NOCTURNE.md.

---

## 2. Nieuw component — `<PickTierBadge>` (±60 regels)

```
File:  src/components/noct/pick-tier-badge.tsx
Props: { tier: "free" | "silver" | "gold" | "platinum",
         label: string,                    // "🟢 Platinum"
         accuracy: string,                 // "85%+"
         size?: "sm" | "md" | "lg" }
Tones: gradient border per tier (green/blue/muted/minimal)
States:
  - Normaal: glow accent, label + accuracy claim
  - Hover: tooltip "Historical accuracy: 85%+ on 635 elite picks"
  - Locked: gray + lock icon (Free-user sees locked Platinum card)
```

Gebruikt `<Pill>` en `<HexBadge>` uit NOCTURNE als basis. Één component, overal hergebruikt.

---

## 3. Paginas om te wijzigen — 8 pages

Volgorde van uitvoering (afhankelijkheden eerst):

### 3.0 — Shared: `<PickTierBadge>` + response-type updates

- **Verandert:** nieuwe component + TypeScript types
- **Endpoints:** n.v.t.
- **Bestanden:** `src/components/noct/pick-tier-badge.tsx` (nieuw), `src/types/prediction.ts` (update: add `pick_tier`, `pick_tier_label`, `pick_tier_accuracy` als optional), `src/types/dashboard.ts` (add `per_tier`)
- **Geschatte tijd:** **2u** (incl. storybook-style visual test)
- **Blocker voor alles daarna** — moet eerst klaar

### 3.1 — Homepage hero (publiek, `/`)

- **Verandert:** headline + subtitle volgens tier_system_plan §3.1
- **Copy:**
  - Hero: `"85%+ accuracy op onze elite picks"`
  - Sub: `"Van 45% (Free) tot 85%+ (Platinum) — kies jouw niveau."`
  - Proof: `"Gevalideerd op 27,037 predictions across 29 leagues"`
  - CTAs: `[Start Free]` `[Zie Pricing]`
- **Endpoints:** n.v.t. (statische copy)
- **Bestand:** `src/app/page.tsx` + `src/i18n/{en,nl}.json` (nieuwe keys)
- **Geschatte tijd:** **2u**

### 3.2 — Pricing page (publiek, `/pricing`)

- **Verandert:** source-of-truth van plan-vergelijking verschuiven van Sanity naar **live `/api/pricing/comparison`**
- **Layout:** 4 kaarten (Free / Silver / Gold / Platinum) met:
  - Tier-badge + accuracy claim (uit API `pick_tier_accuracy`)
  - Sample-size footnote ("Gevalideerd op 635 picks sinds jan 2024")
  - Confidence threshold ("Conf ≥ 75%")
  - League count ("Top 5 elite")
  - Picks/dag INCLUSIVE ("~7 picks per dag")
  - Feature matrix (bestaat al — ophalen uit Sanity zoals nu, maar prices + accuracy uit API)
  - Price + CTA (ongewijzigd)
- **Endpoints:** `GET /api/pricing/comparison` (SSR met 5-min revalidate)
- **Bestanden:** `src/app/pricing/page.tsx`, `src/lib/pricing-api.ts` (nieuw, fetch helper)
- **Let op:** Sanity `tier-config` blijft voor marketing-copy (features lijsten, FAQs); alleen numeriek data komt uit API
- **Geschatte tijd:** **4u**

### 3.3 — Dashboard (`/dashboard`)

- **Verandert:** nieuwe widget "Your tier performance" + per-tier breakdown + upgrade nudge voor lagere tiers
- **Layout toevoegen:**
  ```
  ┌── Jouw tier: ⚪ Silver ────────────────────┐
  │ Deze maand: 14/20 correct (70.0%)          │
  │                                            │
  │ Per label:                                 │
  │   ⚪ Silver picks: 9/12 (75%)              │
  │   ⬜ Free picks:   5/8  (62%)              │
  │                                            │
  │ [Upgrade naar Gold voor 🔵 Gold picks]     │
  └────────────────────────────────────────────┘
  ```
- **Endpoints:** `GET /api/dashboard/metrics` (bevat `per_tier` als flag on)
- **Bestanden:** `src/app/(app)/dashboard/page.tsx`, nieuwe component `TierPerformanceCard`
- **Geschatte tijd:** **4u**

### 3.4 — BOTD (`/bet-of-the-day`)

- **Verandert:** pick-card krijgt prominente `<PickTierBadge>` + upgrade-nudge voor locked hogere-tier picks
- **Layout:**
  - Free user: ⬜ Free pick van de dag + locked 🟢 / 🔵 / ⚪ teasers (blurred)
  - Silver user: ⚪ Silver pick + ⬜ picks visible + locked 🟢 / 🔵
  - Gold/Plat: alle zichtbaar met badges
- **Endpoints:** `GET /api/bet-of-the-day/` (bevat `pick_tier*` velden)
- **Bestanden:** `src/app/(app)/bet-of-the-day/page.tsx`, update `BotdCard` component
- **Geschatte tijd:** **3u**

### 3.5 — Predictions list (`/predictions`)

- **Verandert:** tier-filter checkboxes bovenaan (🟢 🔵 ⚪ ⬜), badge op elke rij, locked state voor niet-toegankelijke picks
- **Filter UI:** sticky pillbar boven lijst — klik 🟢 toggle alleen Platinum picks. Free-user klik op 🟢 → UpgradeLockModal.
- **Endpoints:** `GET /api/predictions/` (bevat `pick_tier*` velden per item)
- **Bestanden:** `src/app/(app)/predictions/page.tsx`, nieuwe `TierFilterBar` component, update pick-row-component
- **Geschatte tijd:** **5u**

### 3.6 — Trackrecord (`/trackrecord`)

- **Verandert:** per-tier breakdown tabel + accuracy-over-time chart per tier
- **Layout:**
  - Huidige summary (total, correct, brier) — ongewijzigd
  - **NIEUW:** per-tier breakdown-tabel (rijen = 🟢 🔵 ⚪ ⬜, kolommen = picks / correct / accuracy)
  - Bestaande trend-chart: optie om per tier te filteren (checkboxes)
  - CSV export: bestaande endpoint is al tier-aware
- **Endpoints:** `GET /api/trackrecord/summary` (met `per_tier`), `GET /api/trackrecord/segments?group_by=month` (voor chart)
- **Bestanden:** `src/app/(app)/trackrecord/page.tsx`, update `TrackrecordChart`
- **Geschatte tijd:** **5u**

### 3.7 — Methodology page (`/engine`) — **NIEUW, publiek**

- **Verandert:** **nieuwe pagina** — transparency hub per tier_system_plan §3.3
- **Content:**
  1. Engine uitleg (Ensemble: Elo + LR + XGB, 39 features)
  2. Walk-forward validatie (28,838 test picks methode-uitleg)
  3. Accuracy-per-tier tabel met Wilson 95% CI (live uit `/api/pricing/comparison`)
  4. Calibration chart (live uit `/api/trackrecord/calibration`)
  5. Disclaimers (historical, educational, not betting advice)
- **Endpoints:** `GET /api/pricing/comparison`, `GET /api/trackrecord/calibration`
- **Bestanden:** `src/app/engine/page.tsx` (nieuw), `src/app/engine/layout.tsx` (publiek SEO-indexeerbaar)
- **SEO:** indexeert, metadata + OG tags
- **Geschatte tijd:** **6u**

### 3.8 — Sidebar updates (global)

- **Verandert:** lock-icon + accuracy-hint bij elk tier-gated nav-item; tooltip "Silver tier unlocks this"
- **Endpoints:** n.v.t.
- **Bestanden:** `src/components/layout/sidebar.tsx` (bestaande `requiredTier` props uitbreiden naar alle Data Analyst items)
- **Geschatte tijd:** **1u**

---

## 4. Samenvatting tabel

| # | Pagina | Status | Endpoint(s) | Tijd | Kritiek pad? |
|:-:|--------|:--:|---|:--:|:--:|
| 3.0 | Shared `<PickTierBadge>` + types | **Nieuw** | — | 2u | **Ja** |
| 3.1 | Homepage (`/`) | Update | — | 2u | Nee |
| 3.2 | Pricing (`/pricing`) | Refactor data-bron | `/api/pricing/comparison` | 4u | Nee |
| 3.3 | Dashboard | Nieuwe widget | `/api/dashboard/metrics` | 4u | Nee |
| 3.4 | BOTD | Badge + locked teasers | `/api/bet-of-the-day/` | 3u | Nee |
| 3.5 | Predictions list | Tier filters + badges | `/api/predictions/` | 5u | Nee |
| 3.6 | Trackrecord | Per-tier breakdown | `/api/trackrecord/{summary,segments}` | 5u | Nee |
| 3.7 | Methodology (`/engine`) | **NIEUW publiek** | 2 endpoints | 6u | Nee |
| 3.8 | Sidebar lock-icons | Update bestaande props | — | 1u | Nee |
| | **TOTAAL** | | | **32u** | |

Oorspronkelijke Fase B schatting in `v10_user_environment_redesign.md` was 68u. Dankzij NOCTURNE + bestaande paywall/upsell/lock-modal componenten is de werkelijke scope **~32u** (minder dan de helft).

---

## 5. Volgorde van uitvoering

**Week 1 — Kernwerk (16u):**
1. Dag 1: 3.0 shared components + types (2u) + 3.8 sidebar (1u) → 3u — ontsluit rest
2. Dag 2: 3.4 BOTD (3u) + 3.5 Predictions list (5u) → 8u — meest gebruikte UX
3. Dag 3: 3.3 Dashboard (4u) + 3.1 Homepage (2u) → 6u — hero + dagelijks gebruik

**Week 2 — Public facing + transparency (16u):**
4. Dag 4: 3.2 Pricing page (4u) + 3.6 Trackrecord (5u) → 9u
5. Dag 5: 3.7 Methodology `/engine` (6u) + QA + spot-checks → 7u

**Parallel:** Fase C (framework docs updates) kan week 2 starten.

---

## 6. Pick-tier badge visuele spec

```
┌─ Platinum 🟢 ─────────────────────┐   Glow: green
│ Pick: Manchester City home win    │   Border: gradient green
│ ⚡ 85%+ accuracy on 635 picks     │   Bg: card-neon-green
└───────────────────────────────────┘

┌─ Gold 🔵 ─────────────────────────┐   Glow: blue subtle
│ Pick: Bayern Munich draw          │   Border: gradient blue
│ 📊 70%+ accuracy on 1,341 picks   │   Bg: card-neon-blue
└───────────────────────────────────┘

┌─ Silver ⚪ ───────────────────────┐   Stroke: gray-white
│ Pick: Inter home win              │   Border: 1px solid white/20
│ 📊 60%+ accuracy on 2,356 picks   │   Bg: glass-2
└───────────────────────────────────┘

┌─ Free ⬜ ─────────────────────────┐   Minimal
│ Pick: Celtic home win             │   Border: 1px dashed white/10
│ 📊 45%+ accuracy                  │   Bg: surface-2
└───────────────────────────────────┘

┌─ 🔒 Gold pick locked ─────────────┐   blurred
│ ▒▒▒▒▒ vs ▒▒▒▒▒▒                   │   + overlay:
│ [Unlock with Gold — €19/mo]       │   UpgradeLockModal trigger
└───────────────────────────────────┘
```

---

## 7. Locked/upgrade UX per pagina

- **BOTD:** 3 preview-cards (🟢🔵⚪) onder hoofdpick, blurred met "Unlock ..." overlay → click opent `<UpgradeLockModal>`
- **Predictions list:** rijen buiten user-tier-scope zijn ⬜grayed met 🔒-icon + tooltip; klik → modal
- **Dashboard widget:** "Upgrade naar Gold → +8pp accuracy op top-10 leagues"
- **Sidebar:** lock-icon + accuracy-teaser in tooltip ("Predictions Explorer — requires Gold (70%+ accuracy)")
- **Engine pagina:** publiek — geen locked state, volledige transparantie

**Geen nieuwe lock-modals nodig** — bestaande `<UpgradeLockModal>` wordt met andere props aangeroepen. Benefits-lijst per tier in aparte config.

---

## 8. Data Analyst sectie (Gold/Platinum only) — **bestaat al**

Geen Fase B werk:
- `src/app/(app)/analyst/layout.tsx` heeft al `useTier().hasAccess(...)` guard
- Sub-routes `/analyst`, `/analyst/predictions`, `/analyst/matches/[id]`, `/analyst/engine-performance` zijn live

**Wel:** Predictions Explorer (3.5 hierboven) en Engine Performance krijgen dezelfde `<PickTierBadge>` + tier-filter UI. Dat is al meegenomen in 3.5/3.6.

---

## 9. Risico's

| R | Risico | Mitigatie |
|---|--------|-----------|
| 1 | `/api/pricing/comparison` te traag → pricing page lazy loads | 1u cache op Redis bestaat al; SSR met 300s revalidate |
| 2 | Tier-badge visueel chaotisch als 20+ picks per list | Max 4 tiers → 4 kleuren, consistent; kleine badges in list-rows |
| 3 | i18n (EN+NL) tier-copy synchroon houden | Voeg alle tier-strings in `src/i18n/*.json` per commit |
| 4 | Mobile layout voor BOTD teasers (4 locked cards = verticaal scrollen) | Stack verticaal op <640px; horizontal scroll op sm+ |
| 5 | Accuracy claim strings (uit `pick_tier_accuracy`) verouderen | Strings komen live uit API — update = 1 commit in backend |
| 6 | Pricing A/B drift (Sanity vs API) | Pricing page: prijzen/features uit Sanity (marketing); accuracy+sample uit API |

---

## 10. Open vragen voor beslissing

1. **Pricing page prijzen** — blijven €9/€19/€39 placeholders of wil je echte prijzen vóór Fase B publiek gaat?
2. **Methodology `/engine`** — jouw voorkeur: één lange pagina (alle content zichtbaar) of tabs (1-klik-navigatie tussen engine / per-tier / calibration)?
3. **Tier badges** — emoji zoals in plan (🟢🔵⚪⬜) of iconic SVG (bv. shield-met-ster)? Emoji is universeel + zero bundle cost, SVG is premium maar meer werk.
4. **Launchvolgorde** — alles tegelijk naar prod, of gefaseerd per-pagina (feature flags per page)?

---

## 11. Niet in scope (voor later)

- Custom alerts (F15) — uit plan geschrapt
- Strategy Lab rebuild (F9) — uit plan geschrapt
- B2B API tier-access — apart traject
- Stripe webhook → tier change → cache flush (backend task, niet frontend)
- Framework doc updates (EN+NL .docx) — **Fase C**, parallel te doen

---

**Geen code gewijzigd. Wacht op jouw goedkeuring + antwoord op de 4 open vragen (§10).**
