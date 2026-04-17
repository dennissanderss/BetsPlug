# Session Handoff — Fase B Tier UI + QA Sprint

**Laatst bijgewerkt:** 2026-04-17
**Branch:** `main` (alles gepusht naar `origin/main`)
**Doel van dit document:** een volgende Claude-sessie (op een andere machine) moet na het lezen van deze doc + `docs/fase_b_qa_report.md` volledig weten wat er ligt en kan direct verder. Je hoeft géén eerdere sessie-geschiedenis te reconstrueren.

---

## 1. Waar we staan (TL;DR)

**Fase A (backend tier-filter, flag-gated):** ✅ AF (al eerder gepusht, zit in commits rond `17b68c4`..`f9b1b62`).
**Fase B (frontend tier UI, 8 stappen):** ✅ AF — stap 5/6/7/8 zijn in deze sessie afgerond.
**QA + fix-sprint over Fase B:** ✅ AF — 4 fases (Bug-fix → audit → P1/P2 fixes → docs-inventaris).
**Fase C (framework docs NL+EN × technical+legal):** ⏳ NIET BEGONNEN. Scope en input-materiaal staan klaar in `docs/fase_b_qa_report.md`.

---

## 2. Wat er in deze sessie is gebeurd (chronologisch, 11 commits)

| # | Commit | Regels | Wat |
|---|--------|-------:|-----|
| 1 | `9f96914` | +large | Fase B start: `PickTierBadge`, BOTD kaart, pricing cards, dashboard `TierPerformanceCard` widget |
| 2 | `8a77978` | +med | Stap 5: tier-filter + shield badges op `/predictions` |
| 3 | `79193a1` | +med | Stap 6: `PerTierBreakdownTable` op `/trackrecord` (summary tab) |
| 4 | `6a7b211` | +513 | Stap 7: publieke `/engine` methodology pagina (SSR + 5-min ISR, haalt `/api/pricing/comparison` live op) |
| 5 | `1e48515` | +116 | Stap 8: sidebar lock-icons + `UpgradeLockModal` i18n (23 nieuwe keys + relax-cast in 6 aux-locale-files) |
| 6 | `9b0defa` | +4 | Pricing hero subtitle: alle 4 tiers expliciet (⬜Free/⚪Silver/🔵Gold/🟢Platinum) |
| 7 | `cf23773` | +30 | **Bug 1 + Bug 2 fix:** `per_tier` breakdown in dashboard + trackrecord endpoints toonde alleen user's eigen tier. `access_filter` verwijderd uit aggregation queries. Cache-key bumped naar v2. |
| 8 | `23c21ad` | +222 | QA audit report `docs/fase_b_qa_report.md` (backend + app + publiek + docs-inventaris) |
| 9 | `250c67c` | +33 | **P1.1 fix:** analyst/page.tsx kaarten + sidebar items voor `/analyst/predictions` + `/analyst/matches` + `/analyst/engine-performance` flagged als `comingSoon` (3 pages zijn Fase-2 v10 werk, bestonden nog niet → 404s voor Gold+ users) |
| 10 | `9222501` | +90 | **P2.3 fix:** pricing-content.tsx deep-dive: 19 core strings (trust-bar, section header, 4× tagline + bestFor + CTA) naar i18n `pricingDeep.*` namespace, volledig NL vertaald |
| 11 | (dit commit, handoff doc) | | Session handoff doc + CLAUDE.md pointer |

---

## 3. Openstaand werk (gedocumenteerd, niet gefixt)

### Uit QA-audit gescope-cut naar Fase C / backlog

- **P2.1** — `PickTierBadge TIER_DISPLAY` hardcoded `85%+/70%+/60%+/45%+`. Drift-risico, vandaag correct. Fix: shared constants file (`src/data/tier-metadata.ts`) die backend `TIER_METADATA` mirrort, of badge verplicht `accuracy` prop laten krijgen.
- **P2.2** — `/predictions` gebruikt frontend-classifier (`src/lib/pick-tier.ts`) i.p.v. backend tier-label uit API. Mirror van `pick_tier_expression()` — drift-risico.
- **P2.4** — Pricing-content.tsx heeft `45%+/60%+/70%+/85%+` op 15+ plekken hardcoded. Migreren naar live fetch van `/api/pricing/comparison` (patroon van `/engine`).
- **P2.3 rest-scope** — plans[*].includes/notIncluded arrays (~39 strings), goldVsOthers comparison-tabel (~11), goldReasons + platinumReasons secties (~12) zijn nog Engels-only. Zie NOTE-comment in `pricing-content.tsx` regel ~172.
- **P3.1** — `useTier()` ready-check zonder timeout. Analyst layout geeft blank scherm als `useTier()` nooit resolved. Zeer lage kans.

### Docs — actie-lijst

Detail staat in `docs/fase_b_qa_report.md` § DEEL 7.

- `docs/V8_ENGINE_REPORT.md` → UPDATE: 74.4% walk-forward vervangen door v8.1 live cijfers (82.5% Platinum / 71.7% Gold op 19.7k batch).
- `docs/generate-technical-doc.js` + `...-nl.js` → NEEDS-REVIEW: scripts embedden accuracy-drempels; verify tegen canonical set voordat .docx opnieuw wordt gegenereerd voor klanten.
- `docs/generate-legal-doc.js` + `...-nl.js` → NEEDS-REVIEW: idem voor tier-subscription claims + disclaimers.
- `docs/v10_user_environment_redesign.md` → ARCHIVE: oude 3-tier spec.
- `docs/abandoned-checkout-flow.md` → ARCHIVE.

### Overig

- **Bulk evaluator run** voor resterende unevaluated predictions — niet urgent.
- **`/preview-pick-tier-badge` dev route** — verwijder als niet meer nodig.
- **`bets-plug.vercel.app` vs `betsplug.com` 404** op pricing — non-urgent, custom-domain-only.

---

## 4. Canonical feiten (altijd tegen valideren)

```
FREE:     45%+ accuracy  | confidence ≥0.55 | alle leagues
SILVER:   60%+ accuracy  | confidence ≥0.65 | top-14 leagues
GOLD:     70%+ accuracy  | confidence ≥0.70 | top-10 leagues
PLATINUM: 85%+ accuracy  | confidence ≥0.75 | top-5 elite

Bronnen-van-waarheid (in volgorde):
  1. backend/app/core/tier_system.py → TIER_METADATA dict (lines 92-113)
  2. /api/pricing/comparison — live DB, 60-dagen window, finished matches
  3. pick_tier_expression() SQL CASE — dezelfde file, lines 119-169

Feature flag: TIER_SYSTEM_ENABLED (env var, default false).
Engine: v8.1 (XGBoost + calibrated logistic, walk-forward 28.838 OOS).
BOTD historisch: 71% (POTD_STATS, geen tier-claim).
Bronze = legacy €0,01 Gold-trial SKU, GEEN pick-tier.
```

---

## 5. Architectuur-spiekbriefje voor volgende sessie

### Backend

- Route-handlers: `backend/app/api/routes/*.py` (thin).
- **Tier logic:** `backend/app/core/tier_system.py` — `pick_tier_expression()`, `access_filter()`, `CONF_THRESHOLD`, `LEAGUES_*` sets, `TIER_METADATA`.
- **Regel:** list-endpoints (predictions, BOTD) gebruiken `.where(access_filter(user_tier))`. Stats-endpoints (`/dashboard/metrics` per_tier, `/trackrecord/summary` per_tier) gebruiken het **NIET** — anders zie je alleen je eigen tier.
- **Elke query met `access_filter()` moet `Match` JOINen** (`access_filter` referencet `Match.league_id`).
- **Admin tier-override** via `?tier=` query param in `backend/app/auth/tier.py` — alleen `Role.ADMIN`, hidden uit OpenAPI.
- **Cache keys met tier-scope:** `dashboard:metrics:v2:{tier}` (v2 na Bug 1 fix), `strategy:today:{id}:{tier}`, `strategy:metrics:{id}:{tier}`. `pricing:comparison` is public/geen tier.

### Frontend

- **NOCTURNE design system** — zie `frontend/NOCTURNE.md`. `card-neon`, `HexBadge`, `Pill`, `DataChip`, `TrustScore`, ambient-glow blobs, logo-green primary accent. Geen plain `<div>` + hex colors.
- **Tier hook:** `useTier()` in `frontend/src/hooks/use-tier.ts`. Localstorage-backed. Plan → tier mapping: `BASIC → SILVER`, `GOLD → GOLD`, `PLATINUM → PLATINUM`, anders `FREE`.
- **Tier classifier (frontend mirror):** `frontend/src/lib/pick-tier.ts` — mirrort `pick_tier_expression()` backend. Gebruikt in `/predictions`.
- **PickTierBadge:** `frontend/src/components/noct/pick-tier-badge.tsx` — 4 varianten (platinum=goud gradient, gold=blauw, silver=wit, free=dashed grey). 3 sizes. Locked state.
- **UpgradeLockModal:** `frontend/src/components/noct/upgrade-lock-modal.tsx` — tier-gekleurde card, i18n'd CTA, routes via `useLocalizedHref`.
- **i18n:** alleen EN + NL. Dictionary in `src/i18n/messages.ts` (~3900 regels, split in `en` en `nl` blocks). Aux locales (de/fr/es/it/sw/id) in `src/i18n/locales/*.ts` met `Partial<Record<...>>` cast → missende keys vallen terug op EN.
- **`PAGE_META`** type: `Partial<Record<Locale,PageMeta>> & { en: PageMeta }` — alleen `en` verplicht.

### Deploy

- Frontend → Vercel (auto op push main).
- Backend → Railway (auto op push main). Boot volgorde: `bootstrap_alembic_if_needed` → `reconcile_user_auth_columns` → `alembic upgrade head` → uvicorn.
- Lokaal: `docker-compose up --build` vanaf repo root.

---

## 6. Hoe de volgende sessie oppakt

### Standaard-prompt op andere PC

```
Lees docs/SESSION_HANDOFF.md en docs/fase_b_qa_report.md.
Dit is de huidige state. [Beschrijf hier wat je wilt doen]
```

Bijvoorbeeld:

```
Lees docs/SESSION_HANDOFF.md en docs/fase_b_qa_report.md.
Ik wil beginnen met Fase C: de 4 generate-*.js scripts auditen op
stale tier-accuracy cijfers en daarna een clean herexport van de 4 .docx
bestanden in docs/.
```

Of:

```
Lees docs/SESSION_HANDOFF.md. Ik wil P2.4 oppakken — de 15+
hardcoded accuracy % in pricing-content.tsx migreren naar een
live fetch van /api/pricing/comparison, zelfde patroon als
/engine pagina gebruikt.
```

### Belangrijke do's / don'ts voor de volgende Claude

- **DO** de canonical tier-feiten uit §4 altijd eerst valideren tegen `backend/app/core/tier_system.py` voordat je getallen in docs of UI aanpast.
- **DO** altijd `npx tsc --noEmit` in `frontend/` draaien vóór committen.
- **DO** elk bug-fix commit los maken en de P-prioriteit in de commit-message vermelden.
- **DON'T** pre-match lock / honest-ROI logic aanpassen — dat is het V7/V8 werk waar we vanaf zijn gebleven. Zie CLAUDE.md.
- **DON'T** engine of DB-schema wijzigen tijdens Fase C — dat is content-werk.
- **DON'T** andere locales (de/fr/es/it/sw/id) vertalen — alleen EN + NL.
- **DON'T** de sanity-backed content overschrijven met hardcoded strings — blog/about/how-it-works komen uit Sanity.

---

## 7. Quick-reference: welke files herlezen bij welke vraag

| Vraag | Lees eerst |
|-------|------------|
| "Wat is een tier?" | `backend/app/core/tier_system.py` (§TIER_METADATA) |
| "Welke endpoint is kapot / werkt raar?" | `docs/fase_b_qa_report.md` |
| "Wat moet er nog in de sidebar?" | `frontend/src/components/layout/sidebar.tsx` + zoek naar `comingSoon: true` |
| "Welke pricing strings zijn nog hardcoded?" | `frontend/src/app/pricing/pricing-content.tsx` (NOTE comment boven `plans[]`) |
| "Welke docs zijn stale?" | `docs/fase_b_qa_report.md` § DEEL 7 |
| "Hoe werkt de /engine transparency page?" | `frontend/src/app/engine/engine-content.tsx` |
| "Waar classificeert de frontend picks?" | `frontend/src/lib/pick-tier.ts` |
| "Hoe wordt de UpgradeLockModal aangeroepen?" | `frontend/src/components/layout/sidebar.tsx` → `openLockFor()` |

---

## 8. Sanity-checks die niks mogen breken

Snel te draaien als je lokaal werkt:

```bash
# Frontend type-check (must be clean)
cd frontend && npx tsc --noEmit

# Backend syntax (must be clean)
cd backend && python -c "import ast; [ast.parse(open(f, encoding='utf-8').read()) for f in ['app/api/routes/dashboard.py', 'app/api/routes/trackrecord.py', 'app/core/tier_system.py']]; print('OK')"

# Backend tests (no tier tests exist yet — don't add stubs unless asked)
cd backend && pytest tests/unit -q

# Git status (should be clean after every fase)
git status
```
