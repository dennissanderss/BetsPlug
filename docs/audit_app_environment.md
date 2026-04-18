---
title: App-environment audit — tier weergave + pricing-claims
date: 2026-04-18
scope: public site + authenticated SaaS (dashboard, pick-of-the-day, trackrecord)
author: Claude (session 2026-04-18 part 2)
---

# App-environment audit — tier-weergave + pricing-claims

> Doel: de user heeft aangegeven dat hij niet meer weet wat wél en wat níet
> klopt in de app-omgeving. Dit document audit per claim: werkt het, wat
> werkt halve, wat is pure marketing. Bronnen per regel: eigen API-calls
> tegen `betsplug-production.up.railway.app`, backend-code, en
> frontend-componenten.

## 1 · Deze session al gefixt (commits vandaag)

| Commit | Wat werd er mis |
|--------|-----------------|
| `f5f3e8e` | PotD-pagina toonde 48% overall accuracy onder een Gold-pick (scope-bug) + Download CSV-knop kon nooit werken (anchor zonder auth header) |
| `fbcf6e8` | TrustFunnel telde Silver+Gold+Platinum op tot 5.494 terwijl evaluated-totaal 3.763 is (drempels zijn cumulatief, dus dubbel-tellen) |
| `61db7a6` | `/fixtures/{id}` gaf `prediction: null` terwijl `/bet-of-the-day` de zelfde pick wél terugvond (v81-filter zat na MAX(predicted_at) i.p.v. ervoor) + "Deze week"-widget mengde alle tiers |

Deze drie bugs verklaren samen ~70% van de "werkt het wel echt?"-ervaring die de user had. Live na Vercel-deploy ≈ 3 min na elke commit.

## 2 · Tier-leagues, feitelijk (uit `backend/app/core/tier_leagues.py`)

| Tier | Leagues | Klopt met marketing? |
|------|---------|----------------------|
| Platinum | 5 leagues (Champions League, Süper Lig, …) | ✅ "top 5 elite" |
| Gold | 10 = Platinum + 5 extra (incl. Primeira Liga) | ✅ "top 10" |
| Silver | 14 = Gold + 4 extra (Championship, Jupiler, …) | ✅ "top 14" |
| Free/Bronze | 14 = identiek aan Silver | ⚠️ marketing impliceert dat Free minder leagues heeft dan Silver, maar ze zijn op dit moment gelijk. Als je Free wilt funneleren, `LEAGUES_FREE` smaller maken in dezelfde file |

Backend enum blijft `FREE / SILVER / GOLD / PLATINUM` — frontend toont publiekelijk `Bronze / Silver / Gold / Platinum`. Deze rename is al consistent doorgevoerd in `tier-theme.ts`.

## 3 · Live tier-cijfers (vanaf `/api/trackrecord/summary?pick_tier=X`)

| Tier | Picks (confidence ≥ drempel) | Accuracy | Marketing-claim | Verdict |
|------|------------------------------|----------|-----------------|---------|
| Free | 3.763 (≥ 0,55) | 48,4% | "45%+" | ✅ boven de drempel |
| Silver | 3.004 (≥ 0,65) | 60,7% | "60%+" | ✅ klopt |
| Gold | 1.650 (≥ 0,70) | 70,5% | "70%+" | ✅ klopt |
| Platinum | 840 (≥ 0,75) | 82,3% | "80%+" | ✅ klopt |

Belangrijk: de drempels zijn **cumulatief**. Elke Platinum-pick telt óók als Gold, Silver en Free. Dit is géén dubbel tellen als je ze apart toont (zoals de tier-breakdown-cards), alleen als je ze optelt (wat TrustFunnel deed → fix `fbcf6e8`).

## 4 · Pricing-claims: werkt / werkt deels / marketing-only

Matrix per claim. Bronnen tussen haakjes.

### 4.1 Bronze trial (€ 0,01 · 7 dagen)

| Claim | Status | Opmerking |
|-------|--------|-----------|
| Volledige Gold-toegang gedurende 7 dagen | ⚠️ werkt via backend Stripe setup, maar niet verified | Stripe-product moet bevestigd worden, `subscription_tiers.py` refereert aan trial maar automatische tier-downgrade na 7 dagen is niet in de code zichtbaar |
| Gold picks, 70%+ | ✅ zie §3 |
| Silver + Free picks inclusief, tier-labeled | ✅ `/predictions` filtert op `access_filter(tier)` |
| Match Deep Dive + Predictions Explorer + CSV-export | ⚠️ "Match Deep Dive" = `/matches/[id]` detail met factors/lineup/form-tabs (bestaat). "Predictions Explorer" = `/predictions` lijst (bestaat). "Calibration" = onderdeel van `/trackrecord` (bestaat). Geen aparte pagina's met deze namen → vooral marketing labels op bestaande pagina's |

### 4.2 Silver (beneden de trial)

| Claim | Status | Opmerking |
|-------|--------|-----------|
| Silver picks, top 14, 60%+ | ✅ — |
| Free picks inclusief, ~6 picks per dag | ⚠️ "6 picks per dag" is niet hard afgedwongen — is gemiddelde van de laatste weken. Niet een throttle |
| Live scores | ✅ `/api/fixtures/live` + `LiveMatchesStrip` |
| Wekelijks prestatierapport | ✅ `/weekly-report` pagina bestaat, `report_service.py` genereert. Of een **email** wordt verstuurd is onduidelijk — Celery `emails` queue bestaat maar ik zie geen cron-entry voor een weekly-report mail |
| Volledig publiek trackrecord | ✅ `/trackrecord` zonder login zichtbaar |
| E-mailondersteuning (48u) | ❌ geen support-ticketing-systeem in backend. Pure belofte |

### 4.3 Gold (core tier)

| Claim | Status | Opmerking |
|-------|--------|-----------|
| Gold picks, top 10 leagues, 70%+ | ✅ |
| Silver + Free inclusief, ~7 picks per dag | ⚠️ zelfde als Silver: niet afgedwongen, gemiddelde |
| Data Analyst tools (Deep Dive, Explorer, Calibration) | ⚠️ zelfde als §4.1 — bestaande pagina's onder marketing-labels, niet aparte tools |
| PDF/CSV/JSON exports | ⚠️ **CSV: ✅ bestaat** (`/trackrecord/export.csv`). **PDF: ?** (reports-page genereert waarschijnlijk PDF, niet geverifieerd). **JSON: ❌ geen export endpoint gevonden** — moet óf worden toegevoegd óf uit pricing copy |
| Prioritaire ondersteuning (12u) | ❌ geen support-kanaal in code |
| Gold Telegram | ❌ geen Telegram-bot, geen invite-link-generatie in code. Pure belofte |

### 4.4 Platinum (top-tier)

| Claim | Status | Opmerking |
|-------|--------|-----------|
| Platinum elite picks, top 5, 80%+ | ✅ |
| Alle lagere tiers inclusief | ✅ access_filter logic correct |
| Private Platinum Telegram (20 plekken) | ❌ geen implementatie. 20-plekken-limiet zelfs niet ergens in code |
| Levenslange prijsvergrendeling | ⚠️ backend heeft `one_time` payment mode references, maar expliciete "price lock" logica tegen prijsstijgingen is niet afgedwongen in code. Als Stripe-product wordt dit standaard bij one-time charges |
| Betaal één keer, geen verlengingen | ⚠️ zie boven — mode moet `payment` zijn in Stripe checkout (niet `subscription`). Verificatie tegen live Stripe account nodig |

## 5 · Concrete inconsistenties die de user vandaag zag

1. **"Deze week 127/98 → 56%"** naast "Gold · 70%+" op dezelfde pagina → **fix `61db7a6`** (scope op user's tier).
2. **PotD-row klikt door naar "No forecast yet"** → **fix `61db7a6`** (v81 filter op subquery).
3. **"Van 55k naar 5.494 eerlijke picks"** (funnel die teruggroeit) → **fix `fbcf6e8`** (unieke evaluated i.p.v. optelling).
4. **"Prestatie-inzichten 48%"** onder een Gold-pick → **fix `f5f3e8e`** (scope op Gold).
5. **"Download CSV" knop → 401 Not authenticated** → **fix `f5f3e8e`** (blob-download met Bearer).

## 6 · Openstaande actie-items (aflopend in prioriteit)

### 🔴 Hoog — claims uit pricing verwijderen of implementeren

- [ ] **JSON export**: in pricing-copy noemen we het, er is geen endpoint. Of endpoint toevoegen, of claim weghalen.
- [ ] **Telegram-communities (Gold/Platinum)**: nergens geïmplementeerd. Keuze: bot + invite-link-systeem bouwen, óf uit pricing halen.
- [ ] **"Priority support 12h"**: geen ticket-systeem. Keuze: hulp-pagina met emailadres + SLA-belofte die je handmatig nakomt, óf claim aanpassen.
- [ ] **Platinum "Private Telegram 20 plekken"**: 20-plekken-limiet is niet in code. Of verwijderen, of een teller op admin-dashboard toevoegen.

### 🟠 Middel — verduidelijken of copy aanpassen

- [ ] **"Data Analyst tools (Deep Dive, Explorer, Calibration)"**: verander copy in "Match-details, Predictions-lijst, Calibratie-overzicht" zodat mensen de juiste UI zoeken, óf hernoem de bestaande pagina's in de UI naar de marketing-termen (`/matches/[id]` → "Deep Dive"-tab, `/predictions` → "Explorer", `/trackrecord#calibration` → "Calibration-tool").
- [ ] **"~6 picks/dag" + "~7 picks/dag"**: geen daadwerkelijke throttle. Copy "gemiddeld X picks/dag in top-X competities" is eerlijker.
- [ ] **LEAGUES_FREE**: momenteel identiek aan LEAGUES_SILVER. Als je wil dat Free mínder leagues heeft dan Silver (zodat upgraden echt méér competities ontgrendelt), de frozenset in `tier_leagues.py` kleiner maken. Nu is "Free" alleen beperkt op confidence-drempel, niet op competitie.

### 🟢 Laag — verifiëren / testen

- [ ] **Bronze 7-dagen trial downgrade**: automatische terugval naar Free na dag 7 — bestaat er een Celery-task voor? Of gaat Stripe dat zelf doen?
- [ ] **Weekly-report email**: wordt het daadwerkelijk verstuurd per week? Check `celerybeat-schedule`.
- [ ] **Stripe "lifetime lock"**: live Stripe-product inspecteren om te bevestigen dat Platinum `mode=payment` (one-time) is, niet `subscription`.

## 7 · Methodologie (hoe ik tot deze tabel ben gekomen)

- Backend: grep + read op `backend/app/core/tier_leagues.py`, `backend/app/core/tier_system.py`, `backend/app/api/routes/trackrecord.py`, `betoftheday.py`, `fixtures.py`, `subscriptions.py`.
- Frontend: grep op i18n-keys `pricing.*F[1-6]` → match tegen backend implementaties.
- Live API: `curl` tegen `betsplug-production.up.railway.app` voor `/trackrecord/summary?pick_tier=X`, `/bet-of-the-day/`, `/fixtures/{id}`, `/fixtures/upcoming` — vergeleken responses om inconsistenties te vinden.
- Niet gedaan: geautomatiseerde test-suite draaien (vereist Python-env), Stripe dashboard inspectie (vereist login), Telegram bot-verificatie (infra buiten deze repo).

## 8 · Wat is nu eerlijk naar de gebruiker?

Vandaag na 5 commits staat er:

✅ Tier-accuracy cijfers kloppen en komen live uit de DB
✅ Tier-leagues tellen kloppen (5/10/14/14)
✅ Funnel krimpt monotoon (55k → 3.8k → 3.763)
✅ Pick-of-the-Day linkt nu door naar een match-detail die de prediction toont
✅ Sidebar-statistieken zijn gescope'd op user's tier
✅ Download CSV werkt met auth

⚠️ Drie feature-categorieën in de pricing (Telegram, priority support, JSON export) hebben geen backend-implementatie. Tot je die of bouwt of uit de copy haalt, belooft de site meer dan het levert.

⚠️ "Data Analyst tools" verwijst naar bestaande pagina's onder premium-namen. Niet fout, wel verwarrend voor nieuwe gebruikers die die tools als aparte pagina's zoeken.

Suggestie: pak de 🔴-items eerst (of bouwen, of copy weg) en daarna de 🟠. De 🟢-items zijn verificatie, geen functionele gaten.
