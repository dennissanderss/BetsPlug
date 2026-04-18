# Session Handoff — 2026-04-18 (einde dag)

> **Pick up op andere machine:** clone/pull de repo, lees dit bestand, pak de
> eerst-openstaande taak op. Alle context die je nodig hebt om zonder verdere
> uitleg verder te kunnen staat hier.

## 0 · Huidige staat van productie

- **Laatste commit op `main`:** `9572e23` (`feat(tier-theme): central tier palette + Roman numeral emblems`)
- **Branch:** `main` (alles direct op main gepusht, Railway + Vercel auto-deploy)
- **Live backend:** https://betsplug-production.up.railway.app
- **Live frontend:** https://betsplug.com
- **Sessie-log:** `C:\Users\denni\.claude\projects\C--Users-denni-Documents-Claude-coding-Sportbetting\a71b5b45-1a17-4c4e-aa21-e9ecb00ef5a4.jsonl`

Om te beginnen:
```bash
cd /path/naar/Sportbetting
git pull origin main
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

## 1 · Wat er vandaag klaar is

Korte terugblik per deploy, in volgorde van oud → nieuw:

| Commit | Onderwerp |
|--------|-----------|
| `a491590` | Homepage en fixtures endpoints laten wedstrijden zonder voorspelling wél zien |
| `d9d5a40` | Homepage stats van Free tier naar Gold tier |
| `01ca077` | TypeScript fix (Map.values iterator) |
| `a14aa96` | `how-it-works` fix: `step2P1` potd-vars + Strategy Lab kaart weg |
| `dbcd470` | Free picks die geen prediction hadden: synthesize uit `/homepage/free-picks` |
| `df7abb3` | Nieuwe TierLadder sectie op homepage |
| `fb2529c` | Homepage stats zijn nu exact Gold tier (niet Gold-access, dus geen Free+Silver+Gold gemengd) |
| `fc7e0bc` | Nieuwe TrustFunnel sectie ("55k → 1.65k honest picks") |
| `6781a33` | TrustFunnel copy: weg met data-vendors, v8.1 deploy dates, feature-pipeline jargon |
| `d7afdad` | "Sound familiar?" empathy-sectie + hero USP naar "70-80% in top tiers" |
| `a2450d8` | Alle em/en-dashes (—/–) vervangen door komma's en punten (AI-vibes eruit) |
| `d08c9a6` | Hero USP verduidelijkt, live-proof strip weggehaald |
| `40c4787` | Gok-terminologie gesaneerd (gokker/weddenschap/bookmaker) in marketing copy |
| `e417e5a` | RecognizeThis herontwerpen als fake-tipster chat vs echte BetsPlug card |
| `ae660e8` | TrustFunnel "geen garantie" disclaimer onderaan |
| `03948a8` | TrustFunnel toont alle 3 premium tiers + match-predictions opruiming |
| `9572e23` | Centraal `tier-theme.ts` + `<TierEmblem>` + TierLadder/TrustFunnel met nieuwe kleuren |

### Nieuwe homepage flow (belangrijkste resultaat)

```
Hero (USP chips: "Tot 80% nauwkeurig" · "Pre-match vergrendeld" · "30+ competities")
   ↓
RecognizeThis — fake tipster chat vs echte BetsPlug card (empathy)
   ↓
TierLadder — 4 cards met Bronze/Silver/Gold/Platinum live accuracy
   ↓
TrustFunnel — "van 55k wedstrijden naar 3.628 honest picks" met tier-breakdown onder
   ↓
LeaguesTicker → PAS → Features → How it works → Track record → ... → Footer
```

## 2 · Openstaande taken (prioriteit hoog → laag)

### 🔴 Taak A — Tier-theme uitbreiden naar rest van site

**Waarom:** Het centrale `tier-theme.ts` (Bronze=koper, Silver=zilver, Gold=violet, Platinum=goud met Romeinse cijfers) staat nu alleen toegepast in TierLadder en TrustFunnel. De pricing cards, dashboard, pick-badges enz. gebruiken nog oude ad-hoc kleuren.

**Bestanden die moeten worden geüpdatet:**

1. `frontend/src/components/noct/pick-tier-badge.tsx`
   - Huidige VISUALS: Platinum=amber, Gold=blue, Silver=slate, Free=slate
   - Vervangen door: import `TIER_THEME` uit `./tier-theme` en gebruik `theme.gradientFromHex/gradientToHex`
   - Optioneel: `<TierEmblem>` embedden i.p.v. eigen SVG shield

2. `frontend/src/components/noct/tier-scope-pill.tsx`
   - Huidige emojis: ⬜⚪🔵🟢 — vervangen door Romeinse cijfers I / II / III / IV
   - Kleuren uit `TIER_THEME` halen

3. `frontend/src/components/ui/pricing-section.tsx`
   - 4 plan objecten (bronze/silver/gold + aparte platinum sectie)
   - Huidige `accent` waardes: bronze=blue, silver=purple, gold=green
   - Vervangen door import van `TIER_THEME`, gebruik de `colorHex` / `gradientFromHex` / `bgTintHex` waardes per kaart
   - Icon: vervang `Shield/Zap/Sparkles/Crown` door `<TierEmblem tier=... size="lg">`
   - Highlight (middelste kaart) blijft op Gold, maar nu in violet
   - **Let op:** deze component is Sanity-geïntegreerd. Test lokaal vóór pushen.

4. `frontend/src/components/dashboard/TierPerformanceCard.tsx` + `TierEmptyStateCard.tsx`
   - Deze roepen `PickTierBadge` aan — als die wordt geüpdatet, stromen de nieuwe kleuren hier automatisch door. Visuele check na Vercel-deploy.

5. `backend/app/core/tier_system.py` (regel 98–119, `TIER_METADATA`)
   - Labels bevatten nog emojis: "🟢 Platinum", "🔵 Gold", "⚪ Silver", "⬜ Free"
   - Vervangen door Roman numerals: "IV Platinum", "III Gold", "II Silver", "I Bronze" (of laat emojis weg)
   - Frontend display leest deze labels voor tier dropdowns, tier badges in API response

**Commandos om te testen:**
```bash
cd frontend && npx tsc --noEmit --project .      # moet clean zijn
cd frontend && npm run build                      # moet slagen
```

**Design decisions al gemaakt (niet overnieuw bepalen):**

```typescript
Bronze (Free)  → #b87333 copper     → Roman I   → confidence ≥ 0.55
Silver         → #c0c0c0 silver     → Roman II  → confidence ≥ 0.65
Gold           → #8b5cf6 violet     → Roman III → confidence ≥ 0.70
Platinum       → #d4af37 gold       → Roman IV  → confidence ≥ 0.75
```

Alles staat in `frontend/src/components/noct/tier-theme.ts` — importeer `TIER_THEME` en `TIER_ORDER` vandaar.

### 🟠 Taak B — Audit: How-it-works content

**Waarom:** De user vroeg: "controleer of de informatie zoals alle stappen op de website van hoe het werkt overeenkomt met hoe we te werk gaan en vrijgeven in de app omgeving."

**Bestand:** `frontend/src/app/how-it-works/how-it-works-content.tsx`

**Wat te auditen:**

1. **Hero-KPI's (regels 55–66):**
   - Stat 1: `t("hiw.heroStat1Value", potd)` — komt uit `usePotdNumbers()` → gebruikt `POTD_STATS.accuracy = "70.6"` fallback. Check live waarde via:
     ```bash
     curl https://betsplug-production.up.railway.app/api/trackrecord/summary?pick_tier=gold
     ```
     Als accuracy niet ≈ 0.70, update `frontend/src/data/potd-stats.ts` `accuracy` en `totalPicks`.
   - Stat 3: `hiw.heroStat3Value` — statisch in i18n. Controleer of "30+" of "16+" leagues klopt (backend `LEAGUES_PLATINUM/GOLD/SILVER/FREE` in `tier_leagues.py`).
   - Stat 4: `hiw.heroStat4Value` — statisch. Waarschijnlijk "CSV export". Klopt.

2. **Step 1 (Pulse analyseert elke wedstrijd):** beschrijft data-ingest. Klopt dit met `backend/app/ingestion/`? Spot-check: wordt elke wedstrijd inderdaad elke 5 min ge-synct (Celery `task_sync_matches`)?

3. **Step 2 (Vier modellen → één voorspelling):** noemt "patroonzoeker, scorelijnvoorspeller, teamsterktebeoordelingen, oddskalibrator". Check tegen `backend/app/forecasting/models/` — welke model klassen bestaan echt? De Strategy Lab card is al verwijderd in commit `a14aa96`.

4. **Step 3 (Publiceren + grade):** claimt auto-grading na full time. Klopt dit met `backend/app/services/evaluation_service.py`?

5. **Integrity section:** laat 3 "slechte vs goede" patronen zien. Check of de beloftes ("no cherry picking", "publish every result", "locked before kickoff") ook technisch afgedwongen worden in de backend.

**Deliverable:** kort audit-rapport in `docs/audit_how_it_works.md` met per claim: CORRECT / ONDERSTEUND / WEG / HERFORMULEREN.

### 🟠 Taak C — Audit: Pricing comparison features

**Waarom:** User vroeg: "klopt dit allemaal ook met wat we echt aan kunnen bieden. Zitten er geen errors in elke functie zodat iedereen foutloos de bijhorende tools kan gebruiken?"

**Bestand waar de tier-feature matrix leeft:** waarschijnlijk in `frontend/src/components/ui/pricing-section.tsx` zelf, of in een aparte feature-comparison component. Begin met `grep "pricing.platF\|pricing.goldF\|pricing.silverF\|pricing.bronzeF" frontend/src/i18n/messages.ts` om alle feature rows te vinden.

**Claimed features die kritisch zijn om te verifiëren:**

- "Free picks (45%+ nauwkeurigheid, top 14 competities)"
  → `backend/app/core/tier_leagues.py` → `LEAGUES_FREE` bevat 14 competities? Check.
- "Silver picks (60%+ nauwkeurigheid, top 14)"
  → access_filter(SILVER) returnt top-14 + conf ≥ 0.65? Check in `tier_system.py`.
- "Gold picks (70%+ nauwkeurigheid, top 10 competities)"
  → `LEAGUES_GOLD` bevat echt 10? **Pas op:** scope scan zag 30+ leagues genoemd. Getal moet kloppen.
- "Platinum picks (80%+ nauwkeurigheid, top 5 elite)"
  → `LEAGUES_PLATINUM` bevat 5? Check.
- "Data Analyst tools (Deep Dive, Explorer, Calibration)"
  → Bestaan deze pagina's in `frontend/src/app/(app)/` ?
- "CSV / JSON / PDF exports"
  → CSV werkt (`/api/trackrecord/export.csv`), JSON? PDF? Check endpoints.
- "Gold Telegram-community"
  → Bestaat er een Telegram-koppeling? Of alleen claim in marketing?
- "Prioriteit 12-uurs support"
  → Supportkanaal bestaat? Kan klanten dit echt halen?
- "Private Platinum Telegram (20 plekken)"
  → Zelfde check.
- "Levenslange prijsvergrendeling"
  → Stripe backend checkt dit? Admin kan dit zien?
- "Eenmalig betalen, geen verlengingen"
  → `platinum` plan in Stripe echt one-time? Check `backend/app/services/stripe_service.py`.

**Deliverable:** `docs/audit_pricing_features.md` met per feature: WERKT / WERKT-MAAR-NIET-GEDOCUMENTEERD / NIET-WERKEND / MARKETING-ONLY.

Voor elke "niet-werkend" feature: of implementeren, of uit pricing-tabel halen.

### 🟢 Taak D — Live visuele check tier-theme

**Waarom:** Het nieuwe Bronze/Silver/Gold-violet/Platinum-goud kleurenschema is toegepast op TierLadder en TrustFunnel, maar user moet het nog in het echt zien om te bevestigen.

**Check:**
1. Open https://betsplug.com na Vercel-deploy (~3 min na pushen)
2. Scroll naar de "Vier tiers, één eerlijk trackrecord" sectie
3. Check: zijn Bronze-koper / Silver-zilver / Gold-violet / Platinum-goud kleuren OK?
4. Check de Romeinse cijfers op de TierLadder-cards
5. Scroll verder naar TrustFunnel → tier breakdown onderaan
6. Akkoord? → Taak A uitvoeren (theme uitbreiden naar pricing). Niet akkoord? → `tier-theme.ts` kleuren aanpassen.

## 3 · Belangrijke context die makkelijk vergeten wordt

### Over de 55.680 → 3.763 → 1.650 → 70,5% funnel

De TrustFunnel-sectie vertelt dit verhaal:
- **55.680 wedstrijden** in DB — alle ingest sinds begin
- **3.801 voorspeld** met huidige model — alleen post v8.1 deploy (16 april 2026 11:00 UTC)
- **3.763 beoordeeld** — met `PredictionEvaluation` ingevuld
- **1.650 in Gold-tier** — specifiek `pick_tier_expression() == GOLD` (NIET `access_filter(GOLD)` want dat zou Free+Silver+Gold samen geven = 8.417)
- **70,5% nauwkeurigheid** — correct/total over Gold tier

Zie `backend/app/api/routes/homepage.py` voor de exacte query. User-visible tekst in `frontend/src/components/ui/trust-funnel.tsx`.

### Over tier-namen: "Free" vs "Bronze"

- **Backend** (`backend/app/core/tier_system.py`): enum is `FREE / SILVER / GOLD / PLATINUM`
- **Frontend public-facing**: heet `Bronze / Silver / Gold / Platinum` (gebruiker ziet nooit "Free")
- **Backend wire format blijft onveranderd**: API accepteert `?pick_tier=free` (via `backendSlugToTier()` in `tier-theme.ts`)
- **Backend migraties NIET doen** — alleen UI labels veranderen

### Over gokterminologie

User eis: **geen gokwebsite of doorverwijzer**. Alle marketing copy is gesaneerd in commit `40c4787`:
- `gokker(s)` → `abonnee(s)` / `gebruiker(s)`
- `weddenschap(pen)` → `voorspelling(en)`
- `bookmaker` (in marketing) → `de markt` / `markt-odds`
- `bookmaker` blijft WEL in legal disclaimers ("wij zijn geen bookmaker")
- Responsible-gambling pagina en KSA-licentie disclaimer blijven intact

Niet opnieuw "gokken" invoeren in nieuwe copy.

### Over em/en-dashes

User eis: geen `—` of `–` in prose — "AI vibes". Commit `a2450d8` heeft 367 dashes vervangen door komma's, punten, of nieuwe zinnen. Hyphens in compounds (`AI-model`, `Gold-tier`) blijven. Nummer-ranges (`70-80%`) met gewone hyphen blijven ook.

Niet opnieuw em-dashes introduceren in nieuwe copy.

### Hoe test ik snel of de backend-stats kloppen?

```bash
# Gold tier (moet 70.5%, 1650 predictions zijn)
curl https://betsplug-production.up.railway.app/api/trackrecord/summary?pick_tier=gold

# Homepage free-picks stats (moet ook Gold zijn na commit fb2529c)
curl https://betsplug-production.up.railway.app/api/homepage/free-picks | python -m json.tool | grep -A3 stats

# Dashboard metrics (totaal + tier breakdown)
curl https://betsplug-production.up.railway.app/api/dashboard/metrics
```

Als een van de aantallen wild afwijkt van wat op de site staat: fallback-data updaten in:
- `frontend/src/data/potd-stats.ts`
- `frontend/src/components/ui/trust-funnel.tsx` → `FALLBACK` object
- `frontend/src/components/ui/tier-ladder.tsx` → `FALLBACK` object

## 4 · Git workflow als iets misgaat

```bash
# Rollback naar vorige commit (push was te vroeg)
git reset --hard HEAD~1
git push --force-with-lease origin main

# Kijk wat er op prod draait
git log --oneline -10

# Vergelijk local vs remote
git fetch origin main
git log HEAD..origin/main --oneline
```

Pre-commit hooks zijn soms streng; als `.husky` failt en je wil sneller een hotfix pushen, NIET `--no-verify` gebruiken — fix de linter-fout liever.

## 5 · Quick-start als je morgen begint

1. Pull en installeer (`git pull && cd frontend && npm install`)
2. Open dit bestand + `docs/SESSION_HANDOFF.md` (oudere context)
3. Kies een taak: **D** eerst (visuele check, 5 min), dan **A** (tier-theme uitbreiden, ~1u), dan **B/C** (audits, elk ~30min + backend opzoekwerk)
4. Typecheck: `cd frontend && npx tsc --noEmit --project .`
5. Commit in kleine slices, push na elke werkende stap zodat Vercel incremental bouwt

Bij blokkades: lees het sessie-log (pad bovenaan) of de commit body voor context over waarom een keuze is gemaakt.

---

**Einde handoff — succes met de rest 🙌**
