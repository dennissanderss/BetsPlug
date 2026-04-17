# Fase B — QA Audit Report (2026-04-17)

**Scope:** volledige Fase B (Frontend Tier UI) + backend tier-display-laag + publieke pricing + docs-inventarisatie.
**Auteur:** Claude (read-only audit + fixes in aparte commits).
**Status:** Bug 1 + Bug 2 al gepatcht en gedeployed in commit `cf23773` voordat deze audit startte.

Canonical tier-feiten waartegen alles is afgezet:

| Tier | Accuracy claim | Confidence ≥ | League scope |
|------|---------------:|-------------:|--------------|
| 🟢 Platinum | 85%+ | 0.75 | Top-5 elite |
| 🔵 Gold | 70%+ | 0.70 | Top-10 |
| ⚪ Silver | 60%+ | 0.65 | Top-14 |
| ⬜ Free | 45%+ | 0.55 | Alle (geen whitelist) |

- BOTD historisch: 71% (POTD_STATS, geen tier-claim).
- Engine: v8.1 (XGBoost + calibrated logistic ensemble, walk-forward 28.838 OOS picks).
- Bronze = legacy €0,01 trial-SKU die Gold unlockt, **geen** pick-tier.

---

## DEEL 1 — Fase 1 Bugs (al gefixt, hier ter verificatie)

### Bug 1 — Dashboard per_tier toonde alleen user's eigen tier

- **File:** `backend/app/api/routes/dashboard.py`, regel ~170 (oude nummering).
- **Oorzaak:** `per_tier_q` paste `.where(access_filter(user_tier))` toe. Voor Free-user werden alle niet-Free rijen vóór GROUP BY weggefilterd → 1 tier in response.
- **Fix:** `.where(_tier)` verwijderd uit `per_tier_q`. Baseline `v81_predictions_filter()` blijft staan. Cache-key bumped naar `dashboard:metrics:v2:{tier}` om stale payloads te invalideren.
- **Gevolg:** iedere user ziet nu alle 4 tiers in `per_tier`. Transparantie + upgrade-trigger.

### Bug 2 — Trackrecord per_tier idem

- **File:** `backend/app/api/routes/trackrecord.py`, regel ~114 (oude nummering).
- **Fix:** identiek aan Bug 1. Geen cache busting nodig (endpoint is niet gecached).
- **Commit:** `cf23773` (beide fixes samen).

**Validatie:** `ast.parse` OK, geen tests gebroken (geen bestaande tests voor deze endpoints), Railway heeft push opgepakt.

---

## DEEL 2 — App-omgeving (ingelogd)

### Samenvatting per pagina

| Pagina | Tier-gate | per_tier zichtbaar | Cijfers | i18n | Links | Error-handling | Status |
|--------|-----------|--------------------|---------|------|-------|----------------|--------|
| `/dashboard` | ✅ Free default | ✅ Alle 4 (TierPerformanceCard) | ✅ Dynamisch | ✅ | ✅ | ✅ | **PASS** |
| `/bet-of-the-day` | ✅ Gold via PaywallOverlay | N/A | ✅ API-driven | ✅ | ✅ | ✅ | **PASS** |
| `/predictions` | ✅ Silver via PaywallOverlay | ❌ Niet opgehaald (client-classifier) | ✅ | ✅ | ✅ | ✅ | **PASS** |
| `/results` | ✅ Silver via PaywallOverlay | ❌ Niet gebruikt | ✅ | ✅ | ✅ | ✅ | **PASS** |
| `/trackrecord` | ✅ Auth-only | ✅ PerTierBreakdownTable (alle 4) | ✅ | ✅ | ✅ | ✅ | **PASS** |
| `/analyst` (hub) | ✅ Gold via layout | N/A | N/A | ✅ | ❌ 3 subroutes 404 | ✅ | **FAIL** |
| `/myaccount` | ✅ Auth-only | N/A | N/A | ✅ | ✅ | ✅ | **PASS** |

### Gevonden bugs — App

- **P1.1 — Broken analyst sub-routes.** `/analyst/page.tsx` rendert 3 kaarten die linken naar `/analyst/predictions`, `/analyst/matches`, `/analyst/engine-performance`. Alleen de dynamic `/analyst/matches/[id]` bestaat; de andere twee zijn niet aanwezig. Er staat wel een footnote "go live in Fase 2 of the v10 build" onderaan, maar de kaarten zelf zijn clickable en leveren een 404. Gold+ users die op een kaart klikken krijgen broken UX. **Fix-target:** kaarten als "Coming Soon"-state renderen (niet-clickable, gedimd, badge).

- **P2.1 — PickTierBadge TIER_DISPLAY hardcoded.** `frontend/src/components/noct/pick-tier-badge.tsx` bevat een `TIER_DISPLAY` constant met `"85%+" / "70%+" / "60%+" / "45%+"` als default accuracy labels. Als backend `TIER_METADATA` ooit wijzigt drift dit. Vandaag geen bug (cijfers matchen). **Fix-target later:** één gedeelde constantenfile (`src/data/tier-metadata.ts`) die door backend en frontend wordt gelezen, of badge altijd verplicht `accuracy` prop uit API.

- **P2.2 — `/predictions` gebruikt frontend-classifier i.p.v. backend tier-label.** `classifyPickTier()` in `frontend/src/lib/pick-tier.ts` mirrort `pick_tier_expression()` backend. Als CONF_THRESHOLD of league-lijsten verschuiven drift dit. Vandaag correct. **Mitigatie:** classifier heeft fallback op league-name wanneer UUID niet matcht.

- **P3.1 — useTier() ready-check zonder timeout.** Analyst layout geeft `null` terwijl tier hydratet. Als `useTier()` nooit resolved blijft de pagina blank. Zeer lage kans, geen fix nodig.

### Cross-check API → UI

- Dashboard metrics `per_tier` → `TierPerformanceCard.tsx` — ✅ klopt.
- Trackrecord summary `per_tier` → `PerTierBreakdownTable` in trackrecord/page.tsx — ✅ klopt.
- BOTD `pick_tier` veld → `PickTierBadge` op BOTD kaart — ✅ klopt.

---

## DEEL 3 — Publieke site (niet ingelogd)

### Samenvatting per pagina

| Pagina | Tier-cijfers-bron | Accuracy-drift | i18n (NL) | Links | Status |
|--------|-------------------|----------------|-----------|-------|--------|
| `/` (home) | Live `/homepage/free-picks` | ✅ | ✅ | ✅ | **PASS** |
| `/pricing` | Hardcoded literals (12+ plekken) | ✅ Klopt | ⚠️ Deels EN-only | ✅ | **PASS met opmerkingen** |
| `/track-record` | Live `/trackrecord/summary` | ✅ | ✅ | ✅ | **PASS** |
| `/how-it-works` | Sanity + `usePotdNumbers()` | ✅ | ✅ | ✅ | **PASS** |
| `/about-us` | Sanity | N/A | ✅ | ✅ | **PASS** |
| `/engine` | Live `/api/pricing/comparison` | ✅ | Alleen EN+NL metadata | ✅ | **PASS** |
| `/bet-types` | Geen tier-claims | N/A | ✅ | ✅ | **PASS** |
| `/contact` | Sanity | N/A | ✅ | ✅ | **PASS** |

### Gevonden bugs — Publieke site

- **P2.3 — Pricing tier-beschrijvingen niet i18n'd.** `pricing-content.tsx` bevat zinnen als `"⚪ Silver picks — top 14 competitions, confidence ≥65%, 60%+ historical accuracy"` als inline string. NL users zien dit in het Engels. De cards via `<PricingSection>` gebruiken wel i18n keys (`pricing.silverF1` etc.), maar de "deep-dive" sectie daaronder niet. **Fix-target:** keys toevoegen of deze sectie laten fetchen van Sanity.

- **P2.4 — Pricing accuracy % hardcoded op 15+ plekken.** Zelfde verhaal als P2.1 maar dan publiek. Drift-risico bij tier-threshold-wijzigingen. **Fix-target later:** pricing page overstappen op `/api/pricing/comparison` zoals `/engine` doet.

### Cross-check cijfers tussen bronnen

Alle onderstaande moeten dezelfde claims tonen. Gecontroleerd:

| Bron | Free | Silver | Gold | Platinum |
|------|------|--------|------|----------|
| `backend/TIER_METADATA` (tier_system.py) | 45%+ | 60%+ | 70%+ | 85%+ |
| `/api/pricing/comparison` (live, laatste 60d) | actual | actual | actual | actual |
| `/api/dashboard/metrics per_tier` (live) | actual | actual | actual | actual |
| `/api/trackrecord/summary per_tier` (live) | actual | actual | actual | actual |
| `/engine` pagina (render van live API) | live | live | live | live |
| `/pricing` pagina (pricing-content.tsx) | 45%+ ✓ | 60%+ ✓ | 70%+ ✓ | 85%+ ✓ |
| `frontend/PickTierBadge TIER_DISPLAY` | 45%+ ✓ | 60%+ ✓ | 70%+ ✓ | 85%+ ✓ |
| `i18n messages.ts (pricing.*F1)` | n/a | 60%+ ✓ | 70%+ ✓ | 85%+ ✓ |

**Geen mismatches gevonden.** Alle hardcoded waardes lopen synchroon met `TIER_METADATA`. Het risico is drift in de toekomst, niet vandaag.

---

## DEEL 4 — Data Consistency (cross-source)

Vergeleken zijn zes bronnen; alle zijn geldig per 2026-04-17:

1. `TIER_METADATA` in `backend/app/core/tier_system.py` regels 92–113 — bron-van-waarheid voor tier-slugs, confidence thresholds, accuracy claims.
2. `/api/pricing/comparison` — live DB query (60-dagen window, finished matches), geen hardcoded getallen.
3. `/api/dashboard/metrics` — live, `per_tier` nu zonder `access_filter` (Bug 1 fix).
4. `/api/trackrecord/summary` — live, `per_tier` nu zonder `access_filter` (Bug 2 fix).
5. `/engine` pagina — React Query naar `/api/pricing/comparison`, niets hardcoded behalve copy.
6. `/pricing` pagina — hardcoded maar correct; flagged als P2.4.

**Belangrijkste bevinding:** er zijn **geen inconsistenties** in de cijfers. Alle hardcoded literals in de frontend matchen exact de canonical tier-drempels. Risico's zijn conceptueel (drift) niet empirisch.

---

## DEEL 5 — Cache audit

| Cache key | Tier-aware | Bevat tier-data | Juist |
|-----------|:----------:|:---------------:|:-----:|
| `dashboard:metrics:v2:{tier}` | ✅ | ✅ | ✅ |
| `pricing:comparison` | ❌ | ✅ (public, alle tiers zichtbaar) | ✅ |
| `strategy:today:{id}:{tier}` | ✅ | ✅ | ✅ |
| `strategy:metrics:{id}:{tier}` | ✅ | ✅ | ✅ |
| `lineup:{apifb_id}`, `events:{apifb_id}` | ❌ | ❌ | ✅ |
| `models:list:...` | ❌ | ❌ | ✅ |

Geen cache-bugs.

---

## DEEL 6 — Admin-only tier override

`?tier=` query param op `/api/*` endpoints wordt geaccepteerd in `backend/app/auth/tier.py` regels 156–186. Strikt admin-gated (`user.role == Role.ADMIN`). `include_in_schema=False` dus verborgen uit OpenAPI. Ongeldige slug valt stil terug op normale resolutie. **Geen bug.**

---

## DEEL 7 — Docs inventarisatie (Fase 4)

Bronbestand-count in `docs/`: **27** files met tier/engine-relevantie.

### Status-verdeling

| Status | Count |
|--------|------:|
| `CURRENT` | 8 |
| `STALE-NUMBERS` | 2 |
| `STALE-TIERS` | 1 |
| `NO-TIER-CONTENT` | 16 |
| `NEEDS-REVIEW` | 4 (NL-varianten van generate-scripts, niet geïnspecteerd) |

### Actie-lijst

**UPDATE (1 file):**
- `docs/V8_ENGINE_REPORT.md` — verwijst naar 74.4% op walk-forward. Post-v8.1 meten we 82.5% (Platinum) / 71.7% (Gold) op 19.7k batch. Kort update-blokje toevoegen "V8.1 live results vs. V8 walk-forward baseline".

**NEEDS-REVIEW (4 files) — handmatige verificatie aanbevolen vóór Fase C:**
- `docs/generate-technical-doc.js` — bevat embedded accuracy-drempels voor de ENG technical framework .docx.
- `docs/generate-technical-doc-nl.js` — idem NL.
- `docs/generate-legal-doc.js` — tier-subscriptions, disclaimers voor de ENG legal .docx.
- `docs/generate-legal-doc-nl.js` — idem NL.

→ Deze vier genereren `BetsPlug-Technical-Framework (ENG).docx`, `BetsPlug-Technisch-Kader-NL.docx`, `BetsPlug-Legal-Framework (ENG).docx`, `BetsPlug-Juridisch-Kader-NL.docx` in dezelfde map. Als de .docx-bestanden extern zijn gedeeld met klanten/partners moeten de 4 scripts eerst worden doorgelicht op v3-tier accuracy-claims en dan opnieuw worden uitgedraaid. Dat is **Fase C werk**.

**ARCHIVE (2 files):**
- `docs/v10_user_environment_redesign.md` — oude 3-tier spec, vervangen door NOCTURNE + `fase_b_frontend_plan.md`.
- `docs/abandoned-checkout-flow.md` — naam zegt genoeg.

**KEEP als current reference (8 files):**
- `docs/tier_system_plan.md`
- `docs/_internal_tier_response_shape.md`
- `docs/_data_accuracy_per_league.md`
- `docs/fase_b_frontend_plan.md`
- `docs/v81_query_filter_plan.md`
- `docs/production_validation_v2.md`
- `docs/v8_accuracy_verification.md`
- `docs/ARCHITECTURE.md`

**KEEP als historisch logboek (16 files):** alle v10_progress_*, v8_DEPLOY_REPORT, evaluator_status, feature_pipeline_verification, etc. Hebben geen tier-claims, zijn momentopnames van eerder werk. Niet verplaatsen.

### Duplicaten

- Tier-definities staan in `tier_system_plan.md` (canoniek), referenced uit `fase_b_frontend_plan.md`, en embedded in de `generate-*.js` scripts. Update één bron (`tier_system_plan.md`) dan scripts auditen.
- Accuracy per league staat zowel in `_data_accuracy_per_league.md` als in `tier_system_plan.md §2b`. Complementair, niet redundant.

---

## Prioriteiten voor Fase 3 (fix-sprint)

**P0 (functionaliteit gebroken):**
- Geen.

**P1 (verkeerde data / broken UX):**
- **P1.1** — Analyst hub kaarten linken naar non-existent routes. Fix: "Coming Soon" state, niet-clickable.

**P2 (cosmetisch / drift-risico later):**
- **P2.1** — PickTierBadge TIER_DISPLAY hardcoded. Shared constants file.
- **P2.2** — Predictions frontend-classifier parallel aan backend. Documentatie toevoegen.
- **P2.3** — Pricing tier-descriptions niet i18n'd (NL users zien EN). i18n keys extracten.
- **P2.4** — Pricing accuracy % op 15+ plekken hardcoded. Later migreren naar live API.

**P3 (observaties, geen fix nodig):**
- **P3.1** — useTier() ready-check zonder timeout.

---

## Samenvatting

Fase B is **substantieel gezond**. De enige echte bug (P1.1: analyst sub-route links) is een UX-niet-data probleem en blocked users op 3 plekken in het product. De hardcoded pricing-copy (P2.3 + P2.4) is drift-risico voor later maar niet vandaag kapot. Backend + live endpoints zijn schoon; Bug 1 + Bug 2 zijn correct gepatcht in Fase 1.

Fase 3 richt zich uitsluitend op P1.1 + P2.3. P2.1/P2.2/P2.4 krijgen een follow-up in een eigen ticket — niet urgent.
