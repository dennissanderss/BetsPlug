# V10 Final Plan — BetsPlug Gebruikersomgeving Redesign

**Datum:** 16 april 2026
**Status:** Definitief + eigenaar goedgekeurd. Wachtend op huisstijl-push van vriend vóór implementatie start.
**Vervangt:** `v10_user_environment_redesign.md` sectie 5–8.
**Engine-status:** v8 LIVE (commit `f41ce46`). Max confidence 0.877. Gold/Platinum tiers actief. DB 55.656 matches + 111.310 Elo ratings. Predictions backfill draait op achtergrond.

---

## 0. Vastgelegde beslissingen

1. **Twee pagina-klassen:**
   - **Basis-pagina's** — iedereen ziet in sidebar. Content-diepte volgt tier via paywall/blur binnen pagina.
   - **Data Analyst-pagina's** — alleen Gold/Platinum. Free/Silver zien **locked items** in sidebar → upgrade-modal on-click. **Silver krijgt één teaser-pagina** (Match Deep Dive, read-only preview) om upgrade-lust te wekken.

2. **Route-architectuur:**
   - Publieke site (SEO, buiten `(app)` route-group): home, pricing, blog, `/engine` (transparency hub), Learn.
   - App (`(app)/*`, `noindex`): alle authenticated-pagina's inclusief Data Analyst.
   - Data Analyst-prefix: `(app)/analyst/*`, server-side tier-guarded.

3. **Visueel:** donker canvas + groen accent (BetsPlug huisstijl, referenties NerdyTips / Value Analytics). Huisstijl-waarden (hex, font, shadcn-keuze) komen van vriend's push. Claude neemt over zodra die op `main` staat.

4. **SEO:** alleen publieke site indexeert. Hele `(app)/*` krijgt `noindex`.

5. **Strategies vs Tiers:** strategies worden uit UI gehaald. Alleen confidence tiers (Silver / Gold / Platinum picks) blijven als product-concept.

6. **Scope:** conversion-focused MVP van **152 uur**. Features met lage ROI bij huidige data geschrapt (zie §F).

---

## A. Definitieve feature-lijst

### BEHOUDEN

| # | Feature | Pagina | Tiers | Status |
|:-:|---------|--------|-------|:------:|
| F1 | **Pick Reasoning** (top 3 redenen uit features_snapshot) | BOTD + Match Detail + Match Deep Dive | Free 1 reden (op blur-unlock), Silver 3, Gold+ 39 features, Platinum + submodels | Nieuw — backend-vulling nodig |
| F2 | **Over/Under 2.5 markten** (uit Poisson lambdas) | Match Detail + Predictions Explorer | Gold+ | Nieuw — 8u |
| F2b | **BTTS markten** (uit Poisson lambdas) | Match Detail + Predictions Explorer | Platinum | Nieuw — deel van F2 |
| F4 | **Calibration chart** (10-bucket reliability) | Engine Performance pagina | Gold+ basis, Platinum + per-league | Nieuw |
| F6 | **Engine Transparency Hub** (walk-forward, live vs backtest) | Publieke `/engine` | Alle tiers incl. logged-out | Nieuw |
| F7 | **Match Deep Dive** (Elo progression, H2H, submodel breakdown, feature importance) | `/analyst/matches/[id]` | Silver teaser, Gold+ volledig | Uitbouw — **zonder** odds/stats (coverage te laag) |
| F8 | **Predictions Explorer** (tier-filter, market-filter, CSV export) | `/analyst/predictions` | Gold+ | Nieuw |
| F11 | **Weekend Preview** (vrijdag 18:00 email + pagina) | `/weekend-preview` + email | Silver top 3, Gold+ reasoning, Platinum CSV | Nieuw |
| F12 | **Educational content** (Sanity CMS) | `/learn`, `/articles`, `/bet-types` | Alle tiers | Uitbouw bestaand |

### GESCHRAPT (lage conversie-ROI bij huidige data)

| # | Feature | Reden schrap |
|:-:|---------|--------------|
| F3 | Value Bet Indicator | Odds-coverage slechts 3,2% (843/55.656 matches) — feature voelt kapot |
| F5 | Notifications system | 16u bouwen, onduidelijke payoff; streak-banner in-app kan in Fase 2 toegevoegd worden als simpele variant |
| F9 | Strategy Lab 2.0 | 14 strategies zijn allemaal inactief; concept overlapt met confidence tiers |
| F10 | API Access | <5% Platinum-users gebruikt het, 12u + support-last |
| F13 | Personal Trackrecord | Juridisch risico ("wat zou je verdiend hebben") + niche |
| F14 | League Specialist View | Nice-to-have, geen directe conversie-driver |
| F15 | Custom Alert Builder | Niche, 20u, valt ook buiten data-scope |

### Route-opruiming

- Schrap: `/weekly-report` (was redirect)
- Hernoem: `/jouw-route` → `/how-it-works`
- Samenvoeg: `/settings` + `/myaccount` → `/account`
- Reports → Track Record > Export sub-tab

---

## B. Per pagina: inhoud + zichtbaarheid

### B-PAGINA'S — iedereen ziet in sidebar

#### B1. Dashboard (`/dashboard`)
Hero BOTD card, live matches strip, today's fixtures, yesterday's results, weekly summary. Voor Free/Silver onder fold: "Upgrade to Gold" CTA met preview van Analyst-widgets. Gold/Platinum zien in plaats daarvan "Analyst Quick Links" paneel.

#### B2. Bet of the Day (`/bet-of-the-day`)
Dagelijkse pick. Confidence tier-badge. F1 Reasoning.
- Free: blur + "Unlock Silver" CTA
- Silver: pick + 3 redenen
- Gold: + raw submodel outputs (Elo / Logistic / XGBoost / Poisson)
- Platinum: + pre-match odds (waar beschikbaar) + tier-label "Platinum pick"

#### B3. Results & History (`/results`)
Laatste 7/30/90 dagen picks met uitkomst, streak-meter, weekly summary. Geen P/L tonen zonder echte odds. Free zien summary, Silver+ per-match detail.

#### B4. Track Record (`/trackrecord`)
Hero headline ("74% op premium picks, walk-forward geverifieerd"), rolling 30-day accuracy chart, per-sport accuracy, Export tab (CSV/JSON, Silver+).

#### B5. Match Detail (`/matches/[id]`)
Basis-kaart: teams, kickoff, 1X2 probability bars, pick + confidence, F1 Reasoning (top 3), team form, Elo-verschil.
- Free: blur + CTA
- Silver: volledige basis-kaart
- Gold+: CTA "Open Deep Dive" → `/analyst/matches/[id]`

#### B6. Live (`/live`)
Live matches 60s refetch. Free ziet scores zonder pick-overlay, Silver+ met pick.

#### B7. How It Works (`/how-it-works`)
Onboarding, 3-stappen uitleg, CTA. Alle tiers.

#### B8. Weekend Preview (`/weekend-preview`) — NIEUW
F11. Vrijdag 18:00 gegenereerd via Celery cron. Top 5 picks weekend + F1 reasoning.
- Free: blur + CTA
- Silver: top 3 zonder reasoning
- Gold: top 5 met reasoning
- Platinum: + CSV-export

#### B9. Subscription / Upgrade (`/subscription`)
4 tier-kaarten met concrete feature-lijst, huidige tier highlight, Stripe checkout.

#### B10. Account (`/account`)
Tabs: Profile, Preferences, Notifications, Security, Subscription.

#### B11. Learn (`/learn`, `/articles`, `/bet-types`)
F12 — Sanity CMS. Publieke site (buiten app). Alle tiers (incl. logged-out).

### PUBLIEKE SITE (buiten `(app)`, wel geïndexeerd)

#### P1. Engine Transparency Hub (`/engine`) — NIEUW
F6. Walk-forward resultaten, live vs backtest scheiding, "last retrained", model-versie historie, leak-test stamp. Openbaar — trust-content + SEO. Bereikbaar zonder login.

### DATA ANALYST-PAGINA'S — alleen Gold/Platinum in sidebar; Free/Silver zien locked

#### D1. Analyst Hub (`/analyst`)
Landing met shortcuts naar D2–D4. Gold/Platinum. Silver/Free: locked sidebar-item → modal.

#### D2. Predictions Explorer (`/analyst/predictions`)
F8. Filterbare tabel: confidence-tier toggle (Silver/Gold/Platinum), market filter (1X2 / Over-Under 2.5 / BTTS), league, date range, lead-time. Kolommen: match, pick, confidence, pre-match odds (indien beschikbaar). CSV export. Gold basis, Platinum + saved views.

#### D3. Match Deep Dive (`/analyst/matches/[id]`)
F7. Elo progression chart (team_elo_history), H2H laatste 10, recent form goals-for/against, submodel breakdown (Elo/Logistic/XGBoost/Poisson afzonderlijk), feature importance top-10, calibration context ("68%-bucket is historisch 67% accuraat, n=1.269"). **Geen odds-history / match-statistics** (coverage 3% en 2% — te laag).
- **Silver: teaser preview** (read-only, eerste 2 secties zichtbaar, rest blur + upgrade CTA)
- Gold: volledig
- Platinum: + feature-value drill-down + "copy features JSON"

#### D4. Engine Performance (`/analyst/engine-performance`)
F4. 10-bucket calibration chart, Brier score + log-loss, per-league accuracy tabel, per-tier accuracy (Silver/Gold/Platinum), lead-time decay curve, prediction-source split (live vs backtest). Gold basis, Platinum + per-month drill-down.

---

## C. Sidebar-structuur per tier

```
┌─ BETSPLUG (donker + groen accent) ────────────────────┐
│                                                        │
│  OVERVIEW                                              │
│  ├─ Dashboard                    [all]                 │
│  ├─ Bet of the Day               [all, blur op Free]   │
│  └─ Weekend Preview              [all, blur op Free]   │
│                                                        │
│  MATCHES                                               │
│  ├─ Live                         [all]                 │
│  ├─ Results                      [all]                 │
│  └─ Match Detail (from list)     [all]                 │
│                                                        │
│  INSIGHTS                                              │
│  ├─ Track Record                 [all]                 │
│  └─ Engine (publiek, externe link) [all]               │
│                                                        │
│  ──────── DATA ANALYST ────────                         │
│  ├─ Analyst Hub                  [🔒 F/S, ✅ G/P]       │
│  ├─ Predictions Explorer         [🔒 F/S, ✅ G/P]       │
│  ├─ Match Deep Dive              [teaser Silver, ✅ G/P]│
│  └─ Engine Performance           [🔒 F/S, ✅ G/P]       │
│                                                        │
│  ACCOUNT                                               │
│  ├─ Subscription / Upgrade       [all]                 │
│  ├─ Account                      [all]                 │
│  └─ Learn                        [all, naar publiek]   │
│                                                        │
│  SYSTEM                                                │
│  └─ Admin                        [admin role only]     │
└────────────────────────────────────────────────────────┘
```

### Tier-matrix

| Item | Free | Silver | Gold | Platinum |
|------|:----:|:------:|:----:|:--------:|
| Dashboard | ✅ | ✅ | ✅ + quick-links | ✅ + quick-links |
| Bet of the Day | 🔒 blur | ✅ 3 redenen | ✅ + submodels | ✅ + odds |
| Weekend Preview | 🔒 blur | ✅ top 3 | ✅ top 5 + reasoning | ✅ + CSV |
| Live | ✅ scores | ✅ + picks | ✅ | ✅ |
| Results | ✅ summary | ✅ detail | ✅ | ✅ |
| Match Detail | 🔒 blur | ✅ basis | ✅ + Deep Dive link | ✅ + Deep Dive link |
| Track Record | ✅ | ✅ + export | ✅ | ✅ |
| Engine (publiek) | ✅ | ✅ | ✅ | ✅ |
| **Analyst Hub** | 🔒 | 🔒 | ✅ | ✅ |
| **Predictions Explorer** | 🔒 | 🔒 | ✅ + O/U | ✅ + O/U + BTTS + saved views |
| **Match Deep Dive** | 🔒 | 👁 teaser | ✅ volledig | ✅ + drill + JSON |
| **Engine Performance** | 🔒 | 🔒 | ✅ | ✅ + per-month drill |
| Subscription | ✅ | ✅ | ✅ | ✅ |
| Account | ✅ | ✅ | ✅ | ✅ |
| Learn | ✅ | ✅ | ✅ | ✅ |

**Legenda:** ✅ = volledig · 🔒 = locked (upgrade modal) · 👁 teaser = eerste secties zichtbaar, rest blur · blur = feature-preview zichtbaar met unlock CTA

---

## D. Volgorde van bouwen

### Fase 0 — Fundering (16u)
**Update 16 april 2026:** NOCTURNE design system + `PaywallOverlay` (content-gating) zijn al gepusht op `main`. Design tokens, primitives (`GlassPanel`, `HexBadge`, `Pill`, `DataChip`, `TrustScore`), sidebar shell, header, alle `(app)/*` pagina's visueel al NOCTURNE. Auth-provider + tier-persistence (`localStorage.betsplug_tier` + `/subscriptions/status` fallback) + admin tier-switcher werken. Scheelt ~6u + een heel paywall-component.

Overblijvend werk:
1. `useTier()` hook (unificeer tier-reading, nu ad-hoc per component) — 2u
2. Sidebar: Data Analyst sectie + lock-state per item — 4u
3. `<UpgradeLockModal>` click-modal (aanvulling op bestaande `PaywallOverlay` die voor content-blur is) — 4u
4. Server-side tier-guard middleware voor `/analyst/*` — 3u
5. Route cleanup (`/jouw-route` → `/how-it-works`, schrap `/weekly-report`, merge `/settings`+`/myaccount` → `/account`) — 2u
6. `(app)/layout.tsx` noindex meta — 0.5u

### Fase 1 — Basis-pagina's + publieke Engine (68u)
7. Dashboard refresh
8. BOTD refresh + F1 Pick Reasoning (**backend eerst**: `prediction_explanations.top_factors_for` vullen bij predict-time in forecast_service)
9. Results + Track Record refresh
10. Match Detail refresh (met F1)
11. Live refresh
12. Engine Transparency Hub (`/engine`, publieke site, indexeerbaar)
13. Subscription + Account samengevoegd
14. Weekend Preview pagina + Celery cron + email template
15. Learn / Articles CMS hookup

### Fase 2 — Data Analyst (54u)
16. Analyst Hub landing
17. Predictions Explorer (tier + market filter, CSV)
18. Match Deep Dive (Elo progression, H2H, submodels, feature importance) + Silver teaser mode
19. Engine Performance + Calibration chart

### Fase 3 — Markten (8u)
20. Over/Under 2.5 + BTTS backend-formule in forecast_service → endpoint-uitbreiding → UI in Match Deep Dive + Predictions Explorer

**Totaal MVP: ~130 uur** (na NOCTURNE-push 16 apr).

### Later (post-launch, data-gedreven)
Features in schraplijst (F3, F5, F9, F10, F13, F14, F15) pas heroverwegen wanneer er usage-data is die de bouw rechtvaardigt.

---

## E. Geschatte tijd per pagina

### Fase 0 — Fundering
| # | Item | Uren |
|:-:|------|:----:|
| 1 | Huisstijl adoptie + theme tokens | 5 |
| 2 | Sidebar + tier-groepen | 6 |
| 3 | UpgradeLockModal | 4 |
| 4 | Tier-guard middleware | 3 |
| 5 | Route cleanup | 2 |
| 6 | Blur-overlay component | 2 |
| | **Subtotaal** | **22** |

### Fase 1 — Basis-pagina's
| # | Pagina | Uren |
|:-:|--------|:----:|
| 7 | Dashboard refresh | 8 |
| 8 | BOTD + F1 Reasoning (backend + UI) | 12 |
| 9 | Results + Track Record | 8 |
| 10 | Match Detail | 6 |
| 11 | Live | 3 |
| 12 | Engine Transparency Hub (publiek) | 10 |
| 13 | Subscription + Account merge | 6 |
| 14 | Weekend Preview + cron + email | 10 |
| 15 | Learn CMS hookup | 5 |
| | **Subtotaal** | **68** |

### Fase 2 — Data Analyst
| # | Pagina | Uren |
|:-:|--------|:----:|
| 16 | Analyst Hub | 4 |
| 17 | Predictions Explorer | 14 |
| 18 | Match Deep Dive + Silver teaser | 16 |
| 19 | Engine Performance + Calibration | 10 |
| 20 | Silver teaser-mode op Match Deep Dive | 2 |
| | **Subtotaal** | **54** |

### Fase 3 — Markten
| # | Item | Uren |
|:-:|------|:----:|
| 21 | Over/Under + BTTS backend + UI | 8 |
| | **Subtotaal** | **8** |

### Totaal: **152 uur** (MVP)

---

## F. Afhankelijkheden / blokkers

1. **Huisstijl-push van vriend** — blokkeert Fase 0 start. Wachten tot op `main`.
2. **Backend `prediction_explanations.top_factors_for` vulling** — blokkeert F1 (BOTD + Match Detail + Deep Dive). Moet in `forecast_service.predict()` geïmplementeerd worden vóór Fase 1 stap 8.
3. **v8 predictions backfill** — draait al op achtergrond. Calibration chart (F4) heeft ≥1.000 v8-geëvalueerde picks nodig voor zinvolle buckets. Fase 2 stap 19 pas starten als backfill ruim voorbij 1k v8-evals is.
4. **Engine-gap uit origineel v10 plan is opgelost** — v8 live met max confidence 0.877, Gold/Platinum tiers hebben nu picks. Geen buffer meer nodig.

---

## G. Volgende actie

1. Wachten op vriend's huisstijl-push op `main`
2. Dit plan definitief bevestigen door eigenaar (als er nog last-minute wijzigingen zijn)
3. Start Fase 0 stap 1 zodra huisstijl er is

**Niets bouwen voor die tijd** — geen halve wijzigingen, geen speculatieve refactors.
