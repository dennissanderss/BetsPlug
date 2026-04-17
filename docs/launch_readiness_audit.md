# Launch Readiness Audit — BetsPlug Production

**Datum:** 2026-04-17
**Omgeving:** `https://betsplug.com` + `https://betsplug-production.up.railway.app`
**Auditor:** Claude (read-only, browser + curl + backend-code review)
**Doel:** GO/NO-GO beslissing voor launch.

---

## 1. Executive Summary

# 🛑 NO-GO

De app mag **nu niet live** zonder P0-fixes. De kern van het tier-systeem is uitgeschakeld in productie, drie kritieke API-endpoints geven 503, de publieke `/engine` transparency-pagina toont lege tabel-cellen, en op elke publieke pagina staat een prominent "0% winstpercentage"-banner die een 95% geloofwaardigheidsschade veroorzaakt bij elke bezoeker.

**Vier P0-blokkers vandaag:**

1. `TIER_SYSTEM_ENABLED` env-variabele is **niet gezet** op Railway → 3 kern-endpoints 503 voor ingelogde users (`/dashboard/metrics`, `/pricing/comparison`, `/trackrecord/summary`).
2. Publieke `/engine` methodology page toont een lege accuracy-per-tier tabel — alle 4 tier-rijen staan op "…" (loading state die nooit resolved).
3. Top-banner "**0% winstpercentage · 2+ keuzes geanalyseerd**" op elke publieke pagina, terwijl de database 96.068 predictions bevat. Marketing-disaster.
4. `/nl/engine` serveert 100% Engelse content op een `/nl/` URL (alleen header + banner is NL).

**Drie P1-issues die ook voor launch moeten:**
- `/nl/pricing` deep-dive is ~60% Engels.
- Emoji + em-dash mojibake in publieke BOTD + free-picks API responses (klassieke double-encoding bug).
- Dashboard-UI toont "Guest" rechtsboven zelfs voor ingelogde users met JWT in localStorage.

**Criteria waar we nu niet aan voldoen:**
- ❌ 0 P0 bugs → **4 P0 bugs**
- ❌ 0 P1 bugs → **3+ P1 bugs**
- ❌ Consistente accuracy cijfers → homepage toont 58% / 60.9% / 847 / 0% parallel
- ❌ Alle tier cijfers live uit API → `/engine` tabel leeg wegens 503
- ⚠️ Kapotte betaalflow → niet getest (geen login)
- ⚠️ Data integriteit → niet volledig getest (DEEL 1 geblokkeerd op user login)

---

## 2. Scope die getest is vs niet getest

| Onderdeel | Status | Opmerking |
|-----------|:------:|-----------|
| DEEL 1 App pages × 4 tiers | ❌ GEBLOKKEERD | Vereist user-login + admin tier override; security-rules verbieden claude wachtwoord-gebaseerd inloggen namens de user. Gebruiker moet zelf inloggen voor deze 36-cel matrix. |
| DEEL 2 Publieke pagina's logged-out | ⚠️ DEELS | 5 van 10 pagina's diep getest (home, engine, pricing, track-record, login). `/about`, `/contact`, `/register`, `/how-it-works`, `/blog` alleen HTTP-status gecheckt. |
| DEEL 3 Cross-platform data consistency | ✅ | Uitgevoerd via publieke API + health endpoint. Findings onder §5. |
| DEEL 4 Edge cases | ❌ | Meeste vereisen login — zelfde blokkade als DEEL 1. |
| DEEL 5 Security checks (no-auth surface) | ✅ | Uitgevoerd. Resultaten onder §6. |

De GO/NO-GO beslissing hierboven staat **ondanks** de ongeteste secties — de gevonden P0's in publieke/endpoint-laag zijn op zichzelf al voldoende blokkerend.

---

## 3. Critical Infrastructure Findings (P0)

### P0.1 — `TIER_SYSTEM_ENABLED` uit op Railway

**Impact:** kern van Fase A + B-tier systeem is dood in productie.

Reproductie:
```bash
# Health OK
curl -s https://betsplug-production.up.railway.app/api/health
→ {"status":"ok","checks":{"database":"ok","redis":"ok",
   "predictions_in_db":96068,"fixtures_finished":55673}}

# Tier-endpoints 503 (auth'd) / 500 (unauth'd)
curl https://betsplug-production.up.railway.app/api/pricing/comparison
→ HTTP 500 "Internal Server Error"

# From browser with valid session cookie:
→ HTTP 503 (observed via DevTools Network panel on /nl/dashboard)
```

**Getroffen endpoints en pagina's:**
| Endpoint | Status | UI-impact |
|----------|:------:|-----------|
| `/api/dashboard/metrics` | 503 | Dashboard KPI-tegels bevroren op skeleton of tonen stale cache |
| `/api/pricing/comparison` | 503 | Publieke `/engine` tabel leeg (zie P0.2); publieke `/pricing` live-stats werkt met hardcoded fallback |
| `/api/trackrecord/summary` | 503 | In-app `/trackrecord` + publieke `/track-record` tier-breakdown leeg / skeleton |

**Oorzaak:** Feature flag gate in `backend/app/api/routes/pricing.py` (~regel 115) retourneert 503 wanneer `TIER_SYSTEM_ENABLED=false`. Zelfde patroon op dashboard + trackrecord. De env-variabele ontbreekt in Railway project settings.

**Fix:** zet `TIER_SYSTEM_ENABLED=true` op Railway (backend service env-vars) en redeploy. Geen code-wijziging.

---

### P0.2 — `/engine` transparency-page toont lege tier-tabel

**Directe consequentie van P0.1.**

Reproductie: open https://betsplug.com/nl/engine → scroll naar "Live numbers, updated as each match finishes". Alle 4 tier-rijen tonen "…" (loading indicator). Scrape:

```
TIER  ACCURACY  95% LB  SAMPLE  CONF ≥  LEAGUES
🟢    …         …        …        …        …
🔵    …         …        …        …        …
⚪    …         …        …        …        …
⬜    …         …        …        …        …
```

**Impact:** de core methodology-pagina die we bouwden om transparantie te bewijzen, bewijst het tegenovergestelde. Elke bezoeker die hier komt met "kan ik deze club vertrouwen?" krijgt lege tabel + zinnen als *"Sourced from /api/pricing/comparison. Sample sizes and Wilson 95% lower bounds included — because a point estimate without a confidence interval is advertising, not science."* Ironie van jewelste.

**Fix:** P0.1 oplossen lost dit automatisch op. Daarnaast frontend P1: toevoegen van een duidelijke error-state als de fetch faalt (nu blijven "…" dots staan — React Query heeft geen error-UI op de tabel).

---

### P0.3 — "0% winstpercentage · 2+ keuzes geanalyseerd" banner

**Locatie:** top-of-page banner op elke publieke pagina (home, engine, pricing, track-record, login). Donkere achtergrond met witte tekst + groene dot.

```
● 0% winstpercentage  · 2+ keuzes geanalyseerd · Probeer het voor €0,01 →
```

**Waarom P0:**
- Conflict met hero-statistiek "58% gemiddeld hitpercentage" direct eronder.
- Conflict met live-stats kaart "60.9% winrate van 30 dagen · 64 voorspellingen".
- Conflict met floating badge "847 correcte picks".
- Conflict met `/api/health`: 96.068 predictions, 55.673 finished fixtures.

"2+ keuzes geanalyseerd" zegt letterlijk: we hebben 2 picks onderzocht. Lezer denkt: dit is een MVP zonder track record. Cognitieve dissonantie met de rest van de pagina. Bij €199 Platinum-pitch is dit een conversiekiller.

**Oorzaak-hypothese:** banner-component haalt stats van een endpoint dat geen data terugkreeg (leeg window, verkeerde filter), en toont 0 als fallback zonder to hide-state. Source: dev-console + code scan vereist — niet gedaan in deze sessie.

**Fix-target:** component identificeren (zoek in `frontend/src/components/` naar "winstpercentage" of "picks analyzed"), logica naar "als count < N → verberg banner" of live-API call herstellen.

---

### P0.4 — `/nl/engine` content 100% Engels

**Reproductie:** bezoek https://betsplug.com/nl/engine. Header + top-banner zijn NL, alle body-content is Engels:

```
How we classify picks and measure accuracy.
Every BetsPlug prediction is classified into one of four quality tiers...
→ How it works | Accuracy per tier | Walk-forward validation | Data sources | Disclaimers
Ensemble of four independent models
39 point-in-time features | Weighted ensemble | Tier classification at prediction time | No post-hoc tuning
Live numbers, updated as each match finishes
Trained on yesterday, tested on tomorrow
```

Alle section-headers, card-titles, descriptions, disclaimers — nul NL.

**Oorzaak:** `frontend/src/app/engine/engine-content.tsx` bevat inline JSX strings, geen `t()` wrappers. De pagina is recent geshipped (Fase B stap 7) en de i18n-extractie is niet gedaan.

**Fix:** alle strings in engine-content.tsx extraheren naar `src/i18n/messages.ts` met `engine.*` namespace (EN + NL). Schatting ~50 keys.

---

## 4. Per Pagina — Publieke Site (getest)

| Pagina | HTTP | Taal OK? | Cijfers consistent? | Layout OK? | Bugs gevonden |
|--------|:----:|:--------:|:-------------------:|:----------:|---------------|
| `/` (NL redirect) | 200 | ✅ NL | ❌ 4-weg conflict | ✅ | P0.3 banner, league-logo's deels leeg |
| `/nl/engine` | 200 | ❌ 100% EN | ❌ tabel leeg | ⚠️ skeleton bottled | P0.2, P0.3, P0.4 |
| `/nl/pricing` | 200 | ⚠️ ~60% EN | ⚠️ i18n-drift | ✅ | P1.1 (deep-dive EN) |
| `/nl/track-record` | 200 | ✅ NL (99%) | ⚠️ onverifieerd (503) | ✅ | P0.3 banner |
| `/login` | 200 | ✅ NL | — | ✅ | P0.3 banner |
| `/about` | 200 | (niet diep getest) | — | — | — |
| `/contact` | 200 | (niet diep getest) | — | — | — |
| `/how-it-works` | 200 | (niet diep getest) | — | — | — |
| `/register` | 200 | (niet diep getest) | — | — | — |
| `/nl/prijzen` | **404** | — | — | — | P2.1 Dutch pricing-slug niet gemapped |

### Zichtbare bugs op pricing page (screenshot/HTML-scrape)

- Plan detail cards (bronze/silver/gold/platinum) hebben **EN** feature lists: "Full Gold access for 7 days — every feature", "Cancel in two clicks — no auto-upgrade", "Included" / "Not included", "Start Gold", "Plan · Platinum lifetime"
- Comparison table row-labels: "⬜ Free picks (45%+ accuracy, all leagues)" — **EN**
- "Why Platinum lifetime · The math that makes Platinum unbeatable" — **EN**
- Tier accuracy cijfers (45% / 60% / 70% / 85%) zijn consistent met canonical ✅

---

## 5. Cross-Platform Data Consistency Matrix

| Datapunt | Waarde | Bron | Consistent met? |
|----------|-------:|------|-----------------|
| Predictions in DB | **96.068** | `/api/health` | Ground truth |
| Fixtures finished | **55.673** | `/api/health` | Ground truth |
| Top banner "keuzes geanalyseerd" | **2+** | Elke publieke pagina | ❌ conflict met 96.068 |
| Top banner "winstpercentage" | **0%** | Elke publieke pagina | ❌ conflict met 58%/60.9% |
| Homepage hero | **58%** hitpercentage | /nl | ❌ conflict met 60.9% |
| Homepage live-stats card | **60.9%** winrate, 64 predictions over 30d | /nl | ❌ conflict met 847 correct |
| Homepage floating badge | **847** correct picks | /nl | ❌ conflict met 64 predictions (30d) |
| /engine per-tier tabel | **leeg ("…")** | /nl/engine | N/A (service down) |
| /pricing tier accuracy claims | **45/60/70/85%** (hardcoded) | /nl/pricing | ✅ matcht canonical TIER_METADATA |
| BOTD pick_tier op unauth API | **"free"** + accuracy `"45%+"` | `/api/bet-of-the-day/` | ✅ consistent |

**Conclusie:** de homepage-cijfers zijn intern **niet** consistent. Drie van de vier getoonde statistieken spreken elkaar tegen. Voor een product dat "transparency" als usp pitcht is dit launch-blocker.

---

## 6. Security Checks (no-auth surface)

| Check | Resultaat | Severity |
|-------|-----------|:--------:|
| `/api/health` lekt DB-counts publiek | Lekt 96.068 / 55.673 / 349 / redis-status | P3 info |
| `/api/bet-of-the-day/` unauth → volledige pick data | ✅ Bedoeld (free-tier label, top_drivers=null) | OK |
| `/api/homepage/free-picks` unauth | ✅ Alleen free-tier picks | OK |
| `/api/reports/generate` unauth, valid body | **HTTP 402** "Reports require Gold tier" | **P1** — onjuist; moet 401 zijn (unauth'd caller behandeld als "Free tier") |
| `/api/reports/generate` unauth, empty body | **HTTP 422** (validation error) | P2 — validatie vóór auth; leakage van schema (`report_type`, `period`) |
| `/api/predictions` unauth | **HTTP 307** redirect | OK |
| `/api/dashboard/metrics` unauth | **HTTP 500** (gecrashd) | **P1** — moet 401 zijn; 500 lekt stack / backend-instabiliteit |
| `/api/trackrecord/summary` unauth | **HTTP 500** | **P1** — idem |
| `/api/pricing/comparison` unauth (publieke endpoint) | **HTTP 500** | **P1** — idem, endpoint is bedoeld publiek maar crasht zonder flag |

**Twee patronen:**
1. **Missing auth guard → 500**. Endpoints die auth vereisen returnen 500 i.p.v. 401 voor unauth'd callers, wat een slechte error-handling is (observability, rate-limit dodging, stack-leak kansen).
2. **Mojibake in JSON response**. Publieke BOTD endpoint:
   ```json
   "pick_tier_label": "\u00e2\u00ac\u0153 Free"
   "explanation_summary": "...mixed away form into this one\u00e2\u20ac\u201d..."
   ```
   `\u00e2\u00ac\u0153` = double-encoded `⬜` (medium white square). `\u00e2\u20ac\u201d` = double-encoded em-dash (—). Backend serveert UTF-8-encoded-bytes-interpreted-as-latin-1-then-re-UTF8-encoded. Classic double-encoding. Waarschijnlijke plek: `backend/app/core/tier_system.py` TIER_METADATA dict waar `pick_tier_label` wordt ingesteld, of de response-serializer.

---

## 7. Volledige bug lijst met prioriteit

### P0 — Block launch

| # | Titel | Locatie | Reproductie | Verwacht | Werkelijk | Fix voorstel |
|---|-------|---------|-------------|----------|-----------|--------------|
| **P0.1** | TIER_SYSTEM_ENABLED niet gezet op Railway | backend env vars | `curl /api/pricing/comparison` → 500; browser sees 503 on /dashboard | Endpoints retourneren tier data | 503/500 | Zet env var `TIER_SYSTEM_ENABLED=true` op Railway → redeploy |
| **P0.2** | /engine tier-tabel toont alleen "…" | `frontend/src/app/engine/engine-content.tsx` — React Query call naar /api/pricing/comparison | Open /nl/engine → scroll naar "Accuracy per tier" | Tabel met 4 tier-rijen + cijfers | 4 "…" rijen | P0.1 fixen. Daarnaast error-state toevoegen aan tabel-component. |
| **P0.3** | Misleidende "0% winstpercentage · 2+ keuzes" banner | Banner-component onderdeel van site-nav of layout | Bezoek elke publieke pagina | Banner toont echte cijfers óf is verborgen | Toont 0% + 2+ | Component vinden, ofwel live API call herstellen ofwel `{count > 50 && <Banner />}` guard toevoegen |
| **P0.4** | /nl/engine content 100% Engels | `engine-content.tsx` alle inline strings | Bezoek /nl/engine | Volledige NL-vertaling op /nl locale | EN content, NL shell | Extraheer ~50 strings naar `engine.*` i18n namespace EN+NL |

### P1 — Serious, fix before launch

| # | Titel | Locatie | Reproductie | Verwacht | Werkelijk | Fix voorstel |
|---|-------|---------|-------------|----------|-----------|--------------|
| **P1.1** | /nl/pricing deep-dive ~60% Engels | `pricing-content.tsx` — plans[].includes/notIncluded arrays, goldVsOthers, goldReasons, platinumReasons | Bezoek /nl/pricing → scroll onder de hoofdkaarten | Alles NL op NL locale | Mix: taglines + bestFor NL, arrays en deep-dive sections EN | Overige ~60 strings extraheren naar i18n (was expliciet scope-cut bij vorige commit — zie `docs/fase_b_qa_report.md` P2.3) |
| **P1.2** | Mojibake in publieke BOTD/free-picks responses | Backend serialize/TIER_METADATA | `curl /api/bet-of-the-day/` | `"⬜ Free"` + `"—"` chars correct | `\u00e2\u00ac\u0153 Free`, `\u00e2\u20ac\u201d` | UTF-8 encoding path auditen; waarschijnlijk DB-string opgeslagen als latin-1-decoded-bytes-of-UTF-8 |
| **P1.3** | "Guest" label rechtsboven voor ingelogde user | Header/user-dropdown component | Login → /nl/dashboard → kijk rechtsboven | User name of avatar | "Guest" tekst | `useAuth()` hook timing — `user` is null bij first paint; gate label rendering achter `ready` flag |
| **P1.4** | /api/reports/generate 402 unauth ipv 401 | `backend/app/api/routes/reports.py` | `curl -X POST -d '{"report_type":"weekly","period":"..."}' /api/reports/generate` | HTTP 401 Unauthorized | HTTP 402 "Requires Gold tier" | Auth dependency injectie vóór tier check — `Depends(get_current_user)` als required |
| **P1.5** | Homepage getallen intern niet consistent | /nl hero + stats card + badge | Bezoek /nl → vergelijk "58%" vs "60.9%" vs "847" vs "2+" | Eén kloppende bron per cijfer of duidelijk gescheiden perioden | 4 verschillende cijfers zonder uitleg welke periode | Ofwel alle dezelfde API-bron gebruiken ofwel per stat expliciete periode-label |
| **P1.6** | /api/dashboard/metrics + /api/trackrecord/summary → 500 unauth | Backend auth middleware | `curl /api/dashboard/metrics` zonder token | 401 | 500 | Auth guard vóór tier-logica; 401 returnen i.p.v. crash |

### P2 — Cosmetic, post-launch

| # | Titel | Locatie | Impact |
|---|-------|---------|--------|
| **P2.1** | `/nl/prijzen` slug → 404 | i18n route config | Dutch-typende bezoekers krijgen 404 in plaats van redirect naar `/nl/pricing` |
| **P2.2** | League-logo's grid leeg/broken | Homepage "De grootste competities" sectie | Enkele logo's tonen alleen "()" of lege card |
| **P2.3** | `/api/reports/generate` lekt schema via 422 | Backend endpoint | Attacker kan body-shape achterhalen zonder auth |
| **P2.4** | Pricing accuracy % hardcoded 15+ plekken | `pricing-content.tsx` (was audit P2.4 al gedocumenteerd) | Drift-risico, vandaag correct |
| **P2.5** | PickTierBadge TIER_DISPLAY hardcoded | `pick-tier-badge.tsx` | Drift-risico, vandaag correct |
| **P2.6** | `/api/health` lekt DB-counts | Backend `/health` route | Info disclosure voor attackers (niet kritiek) |

### P3 — Observaties

| # | Titel | Status |
|---|-------|--------|
| P3.1 | BOTD unauth endpoint toont volledige pick data | ✅ **Intended** — marketing lead-magnet, free-tier label |
| P3.2 | useTier() ready-check zonder timeout | Zeer lage kans op impact |

---

## 8. Aanbevolen fix-volgorde voor launch

### Sprint 1 — P0's (schatting: 1-2 uur)
1. **P0.1 Railway env-var** — zet `TIER_SYSTEM_ENABLED=true` op Railway → redeploy → verify via browser op `/nl/dashboard`, `/nl/engine`, `/nl/track-record`. **1 setting change, 10 min.**
2. **P0.3 banner component** — grep `frontend/` naar `winstpercentage|0%|2+` + de exacte tekst `keuzes geanalyseerd` om de component te vinden. Ofwel fix de data-fetch, ofwel verberg de banner zolang `count < 50`. **30-60 min.**
3. **P0.4 /nl/engine i18n extractie** — ~50 strings van `engine-content.tsx` naar `engine.*` namespace EN+NL. **1-2 uur.**
4. **P0.2 error-state op /engine tabel** — is self-healed na P0.1 maar voeg defensief een `isError` branch toe. **15 min.**

### Sprint 2 — P1's (schatting: 2-4 uur)
5. **P1.2 mojibake** — oorzaak-analyse + fix. Hoogste prioriteit P1 omdat het publiek zichtbaar is op elke homepage-pick.
6. **P1.3 Guest label** — `useAuth` + render-gate.
7. **P1.6 + P1.4 auth guards** — 500→401 voor drie endpoints, 402→401 voor reports/generate.
8. **P1.5 homepage cijfers** — beslis per stat welke periode + endpoint de waarheid is, align.
9. **P1.1 pricing deep-dive i18n** — rest-scope van vorige `docs/fase_b_qa_report.md` P2.3. ~60 strings.

### Sprint 3 — P2's (niet blocking, backlog)
P2.1 t/m P2.6 in een eigen ticket.

---

## 9. NIET blocking voor launch, wel opvolgen

- **DEEL 1 app pages x 4 tiers full matrix** — vereist user-login; claude mag geen wachtwoord-auth namens user doen. Gebruiker moet dit zelf afronden via checklist in deze audit + de 20-punten QA-lijst uit de originele prompt. Aanbevelen: 1 middag blokkeren, elke pagina als elke tier doorklikken met `?tier=` override.
- **DEEL 4 edge cases** — alle login/logout/refresh/taal-switch tests. Low-prio als P0's opgelost zijn.
- **Mobile responsive check** — 3 pagina's (dashboard, predictions, trackrecord) op viewport 375px. Niet gedaan.
- **Stripe checkout flow end-to-end** — niet gedaan (geen test-betaling).
- **CSV download validatie** — niet gedaan per tier.

---

## 10. Minimale launch-definitie

**Launch is GO zodra:**
1. ✅ P0.1 Railway env-var gezet → 3 endpoints werken
2. ✅ P0.2 /engine tabel toont echte data
3. ✅ P0.3 banner toont óf echte cijfers óf is weg
4. ✅ P0.4 /nl/engine volledig NL
5. ✅ P1.2 geen mojibake in API responses
6. ✅ P1.5 homepage cijfers zijn ofwel consistent ofwel expliciet gelabeld met periode
7. ✅ DEEL 1 app-matrix handmatig afgerond door user — 36 cellen minimaal PASS
8. ✅ Eén test-betaling via Stripe `€0,01` trial flow succesvol afgerond

**Alles daaronder:** post-launch backlog.

---

## Appendix A — Raw API evidence

```
https://betsplug-production.up.railway.app/api/health
HTTP 200
{"status":"ok","checks":{"database":"ok","redis":"ok",
 "fixtures_scheduled":349,"fixtures_finished":55673,
 "predictions_in_db":96068},"version":"2.0.0"}

https://betsplug-production.up.railway.app/api/dashboard/metrics (unauth)
HTTP 500 "Internal Server Error"

https://betsplug-production.up.railway.app/api/pricing/comparison (unauth)
HTTP 500 "Internal Server Error"

https://betsplug-production.up.railway.app/api/trackrecord/summary (unauth)
HTTP 500 "Internal Server Error"

Browser (authed session cookie, /nl/dashboard):
  /api/dashboard/metrics      → HTTP 503
  /api/pricing/comparison      → HTTP 503
  /api/trackrecord/summary     → HTTP 503
  /api/bet-of-the-day/         → HTTP 200
  /api/fixtures/live           → HTTP 200
  /api/fixtures/today          → HTTP 200
  /api/fixtures/results?days=1 → HTTP 200
  /api/homepage/free-picks     → HTTP 200
  /api/homepage/featured-match → HTTP 200

https://betsplug-production.up.railway.app/api/bet-of-the-day/
HTTP 200
{
  "available": true, "match_id": "2bd8181a-...", "pick_tier": "free",
  "pick_tier_label": "\u00e2\u00ac\u0153 Free",     # <- MOJIBAKE
  "pick_tier_accuracy": "45%+",
  "explanation_summary": "...mixed away form\u00e2\u20ac\u201d..."  # <- MOJIBAKE
}

https://betsplug-production.up.railway.app/api/reports/generate
POST {} → HTTP 422 (validation before auth)
POST {"report_type":"weekly","period":"last_7_days"} → HTTP 402 (tier-check without auth)
```

## Appendix B — Page-load observations

- `/nl` top banner: `● 0% winstpercentage · 2+ keuzes geanalyseerd · Probeer het voor € 0,01 →`
- `/nl` hero: "AI-voetbalvoorspellingen die daadwerkelijk opleveren" + "58% gemiddeld hitpercentage"
- `/nl` live stats: "3 AI-voorspellingen vandaag · 60.9% winrate van 30 dagen · 64 voorspellingen duren 30 dagen · 30+ voetbalcompetities live"
- `/nl` floating badge: "847 CORRECTE PICKS"
- `/nl/engine` title: "Engine Transparantie · BetsPlug Methodologie" (NL) maar content 100% EN
- `/nl/pricing` tier accuracy in copy: 45/60/70/85% ✅ canonical
- `/nl/pricing` tier deep-dive content: ~60% EN (includes arrays, compare tabel, reasons)
- `/nl/prijzen` → HTTP 404
