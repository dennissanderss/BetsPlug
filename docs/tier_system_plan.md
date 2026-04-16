# Tier System Plan v3 — Inclusief Kwaliteitsmodel met Pick Labels

**Datum:** 16 april 2026 (v3 na user-feedback: inclusief tiers + visuele pick labels)
**Status:** PLAN v3 — goedgekeurd met 3 aanpassingen, wacht op OK voor implementatie.
**Brondata:** 27,037 geëvalueerde v8.1 predictions (`scripts/recalc_tier_samples.py`).

---

## Veranderingen t.o.v. v2

| | v2 (exclusief) | v3 (inclusief) |
|--|:--|:--|
| Picks tonen | Elke tier alleen eigen niveau | Elke tier = eigen niveau + alles lager |
| Platinum picks/dag | 1-2 (voelt leeg) | 40+ (1-2 Platinum-labeled, rest lower) |
| Pick identificatie | Geen label | Visueel label per pick (🟢🔵⚪⬜) |
| Marketing focus | Range "55% tot 85%" | **"85%+ op elite picks"** (headline) |
| Free cijfer tonen | Op homepage | Niet prominent — Platinum = hero |

---

## 1. Kern-concept: Pick Tier vs User Tier

Belangrijk onderscheid:

### Pick Tier = kwaliteitsniveau van een specifieke pick
Elke pick wordt dynamisch geclassificeerd op basis van league + confidence:

```
IF league IN TOP5  AND confidence >= 0.75  →  pick_tier = 🟢 PLATINUM
ELSE IF league IN TOP10 AND confidence >= 0.70  →  pick_tier = 🔵 GOLD
ELSE IF league IN TOP14 AND confidence >= 0.65  →  pick_tier = ⚪ SILVER
ELSE  →  pick_tier = ⬜ FREE
```

### User Tier = abonnementsniveau
Bepaalt welke pick_tiers de user mag zien:

| User tier | Ziet pick_tier | Picks/dag (schatting) |
|-----------|----------------|:-:|
| **Free** | ⬜ Free | ~5 (1 prominent, rest lijst) |
| **Silver** | ⚪ Silver + ⬜ Free | ~16 (11 Silver + 5 Free) |
| **Gold** | 🔵 Gold + ⚪ Silver + ⬜ Free | ~21 (5 Gold + 11 Silver + 5 Free) |
| **Platinum** | 🟢 Platinum + 🔵 Gold + ⚪ Silver + ⬜ Free | ~22 (1.6 Plat + 5 Gold + 11 Silver + 5 Free) |

Elk pick-item in de UI toont een badge ( 🟢 / 🔵 / ⚪ / ⬜ ) zodat user direct ziet welke kwaliteit het is. User kan filteren per tier.

---

## 2. Definitieve tier-configuratie

### Pick-tier definities (op welke picks kwalificeert een pick als dit tier?)

| Pick tier | Leagues | Confidence | Label | Historische accuracy |
|-----------|---------|:--:|:--:|:--:|
| 🟢 **Platinum** | Top 5 (CL, Süper Lig, Eredivisie, PL, Saudi PL) | >=0.75 | 🟢 | **87%** (635 picks) |
| 🔵 **Gold** | Top 10 (excl. Platinum-set) | >=0.70 | 🔵 | **77%** (1,341 picks*) |
| ⚪ **Silver** | Top 14 (excl. Gold-set) | >=0.65 | ⚪ | **69%** (2,356 picks*) |
| ⬜ **Free** | Alle andere combinaties | >=0.55 | ⬜ | **55%** (rest) |

*_Silver/Gold counts na uitsluiting van hogere tier-picks. Exact te herberekenen bij implementatie._

### User-tier pricing (placeholder)

| User tier | Picks/dag | Prijs (placeholder) |
|-----------|:-:|:-:|
| Free | ~5 | gratis |
| Silver | ~16 | EUR 9/mo |
| Gold | ~21 | EUR 19/mo |
| Platinum | ~22 | EUR 39/mo |

**Belangrijk:** Platinum user betaalt voor de 1.6 Platinum picks (85%+), niet voor "meer picks". De 22 totaal zijn een aangenaam bijproduct — de 🟢 badge is wat betaald wordt.

---

## 3. Cijfer-architectuur

### 3.1 Publieke pagina's (niet-ingelogd)

#### Homepage hero — focus op Platinum
```
HEADLINE: "85%+ accuracy op onze elite picks."
SUB:      "Van 55% (Free) tot 85%+ (Platinum) — kies jouw niveau."
CTA:      "Start Free" + "View Pricing"
PROOF:    "Gevalideerd op 27,037 predictions across 29 leagues."
DISCLAIMER: "Historical backtest. Educational purposes only."
```

**Free cijfer (55%) NIET prominent.** Het is een "van…tot" frame zodat de Platinum claim het anker is.

#### Pricing page — vergelijkingstabel

```
┌─────────────────────────────────────────────────────────────────┐
│  Free          Silver          Gold           PLATINUM ⭐       │
│  ⬜             ⚪              🔵             🟢                │
│                                                                 │
│  55%+          69%             77%            85%+              │
│  accuracy      accuracy        accuracy       accuracy          │
│                                                                 │
│  All leagues   Top 14          Top 10         Top 5 elite       │
│  Conf >=55%    Conf >=65%      Conf >=70%     Conf >=75%        │
│                                                                 │
│  ~5 picks/d    ~16 picks/d     ~21 picks/d    ~22 picks/d       │
│                                                                 │
│  (no label)    + ⚪ Silver      + 🔵 Gold      + 🟢 Platinum    │
│                + ⬜ Free        + ⚪ Silver     + 🔵 Gold        │
│                                 + ⬜ Free      + ⚪ Silver       │
│                                                + ⬜ Free         │
│                                                                 │
│  € 0/mo        € 9/mo          € 19/mo        € 39/mo           │
└─────────────────────────────────────────────────────────────────┘
```

Onderaan:
> **Every pick is labeled with its quality tier.** Free users see ⬜ picks. Upgrade to see higher-tier picks alongside.

#### Methodology (`/engine`) — transparantie
- Overall engine backtest: 49% (alle 27k predictions)
- Per-pick-tier accuracy met Wilson 95% confidence intervals
- Walk-forward validatie methode
- Calibration chart
- Vergelijking t.o.v. een willekeurige "always home win" baseline

#### Upgrade triggers (publiek)
- Blog sidebar: "Our 🟢 Platinum picks hit 85%+ in PL, CL, Eredivisie"
- Engine page CTA: "See how 🟢 Platinum reaches 87% accuracy — upgrade"
- Pricing kaart: per-tier badge + accuracy rendered

### 3.2 In-app pagina's (ingelogde users)

#### Dashboard (`/dashboard`)
- **Hero widget:** user's ACCESS tier samenvatting
  - Free user: "Today's Free Pick: {pick details, 🟢/🔵/⚪/⬜ label}"
  - Silver user: "11 picks today. Your best: {top Silver pick with ⚪ label}. Next Platinum upgrade shows elite-league 🟢 picks."
  - Platinum user: "22 picks today: 🟢×2 🔵×5 ⚪×11 ⬜×4. Top elite: {Platinum pick}"

- **Tier summary card (always visible):**
  ```
  Your tier: Silver (⚪)
  Seeing: ⚪ Silver (69%) + ⬜ Free (55%)
  Upgrade to Gold (🔵 77%) for +8pp accuracy on top-10 leagues.
  ```

- **Historical accuracy (your picks):**
  ```
  This month: 14/20 correct (70%) across your tier picks.
  Breakdown by label:
    🟢 Platinum: — (upgrade to unlock)
    🔵 Gold: — (upgrade to unlock)
    ⚪ Silver: 9/12 (75%) ← above tier average!
    ⬜ Free: 5/8 (62%)
  ```

#### Picks pages (`/predictions`, `/bet-of-the-day`)

**Core layout idea:** pick cards sorted by tier descending, each with badge.

```
┌─────────────────────────────────────────────────────┐
│ 🟢 PLATINUM PICK                          87% tier │
│ Man City vs Arsenal  •  Premier League             │
│ Pick: Home Win       •  Confidence 82%             │
│ [View Reasoning] [Add to Tracker]                  │
├─────────────────────────────────────────────────────┤
│ 🔵 GOLD PICK                             77% tier │
│ PSV vs Ajax          •  Eredivisie                 │
│ Pick: Draw           •  Confidence 71%             │
├─────────────────────────────────────────────────────┤
│ ⚪ SILVER PICK                           69% tier │
│ Inter vs Milan       •  Serie A                    │
│ Pick: Home Win       •  Confidence 66%             │
├─────────────────────────────────────────────────────┤
│ 🔒 2 more Platinum picks today — Upgrade to unlock │
└─────────────────────────────────────────────────────┘
```

User kan filteren op tier-badge (checkboxes 🟢 🔵 ⚪ ⬜).

#### Locked picks (upgrade nudge)
Silver user ziet Gold/Platinum picks als BLURRED cards:

```
┌─────────────────────────────────────────────────────┐
│ 🟢 PLATINUM PICK                          LOCKED  │
│ █████ vs ███████     •  ██████████                 │
│ Pick: ████           •  Confidence: ██             │
│                                                     │
│    [Unlock with Platinum — EUR 39/mo]              │
│    "Our Platinum picks hit 85%+ historically."     │
└─────────────────────────────────────────────────────┘
```

#### Trackrecord (`/trackrecord`)
Toont accuracy per pick-tier over tijd, filtered op user's access.

```
Your tier: Gold 🔵 (sees 🔵 Gold + ⚪ Silver + ⬜ Free)

Overall (this month): 25/36 correct (69.4%)
  🔵 Gold picks:   7/9 correct (78%)   ← at tier average
  ⚪ Silver picks: 12/17 correct (71%) ← above tier avg
  ⬜ Free picks:   6/10 correct (60%)  ← above tier avg

Historical (all-time):
  🔵 Gold:   145/189 (77%)
  ⚪ Silver: 412/597 (69%)
  ⬜ Free:   289/525 (55%)
```

### 3.3 Definities — 4 cijfer-bronnen

| Bron | Definitie | Waar gebruikt |
|------|-----------|---------------|
| **Overall engine backtest** | Alle v8.1 preds (27k+), geen filter | `/engine` transparency pagina |
| **Per-pick-tier backtest** | Picks geclassificeerd als 🟢/🔵/⚪/⬜, accuracy per label | Pricing, dashboard, pick cards |
| **Live track record** | Alleen `prediction_source='live'` post-deploy | Widget "Live streak" als ≥200 live picks |
| **User's own accuracy** | Picks die deze user zag, gefilterd op zijn access tier | Dashboard "Your picks" widget |

**Regel:** pick cards tonen de "per-pick-tier backtest" percentage (het kwaliteitsniveau), NIET "user's own accuracy" (dat kan klein sample zijn).

### 3.4 Technische architectuur

#### Nieuw kernbestand: `app/core/tier_system.py`

```python
from enum import IntEnum
from sqlalchemy import and_, case, or_
from sqlalchemy.sql import ColumnElement

from app.models.prediction import Prediction
from app.models.match import Match


class PickTier(IntEnum):
    """Integer so we can use <= comparisons for access control."""
    FREE = 0
    SILVER = 1
    GOLD = 2
    PLATINUM = 3


# League UUID sets — populated from DB, hardcoded for tier stability
LEAGUES_PLATINUM: set[str] = {
    "<CL_uuid>", "<SuperLig_uuid>", "<Eredivisie_uuid>",
    "<PL_uuid>", "<SaudiPL_uuid>",
}
LEAGUES_GOLD: set[str] = LEAGUES_PLATINUM | {
    "<Scottish_uuid>", "<LigaMX_uuid>", "<ChineseSL_uuid>",
    "<PrimeiraLiga_uuid>", "<Bundesliga_uuid>",
}
LEAGUES_SILVER: set[str] = LEAGUES_GOLD | {
    "<Jupiler_uuid>", "<Championship_uuid>",
    "<LaLiga_uuid>", "<SerieA_uuid>",
}

# Confidence thresholds per pick-tier
CONF_THRESHOLD = {
    PickTier.PLATINUM: 0.75,
    PickTier.GOLD:     0.70,
    PickTier.SILVER:   0.65,
    PickTier.FREE:     0.55,
}


def pick_tier_expression() -> ColumnElement:
    """SQLAlchemy CASE expression that classifies each row as a PickTier.

    Use as a SELECT column or in ORDER BY.
    Returns integer matching PickTier enum (3=Platinum, 2=Gold, 1=Silver, 0=Free).
    """
    return case(
        (
            and_(
                Match.league_id.in_(LEAGUES_PLATINUM),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.PLATINUM],
            ),
            PickTier.PLATINUM.value,
        ),
        (
            and_(
                Match.league_id.in_(LEAGUES_GOLD),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.GOLD],
            ),
            PickTier.GOLD.value,
        ),
        (
            and_(
                Match.league_id.in_(LEAGUES_SILVER),
                Prediction.confidence >= CONF_THRESHOLD[PickTier.SILVER],
            ),
            PickTier.SILVER.value,
        ),
        else_=PickTier.FREE.value,
    ).label("pick_tier")


def access_filter(user_tier: PickTier) -> ColumnElement:
    """SQLAlchemy WHERE expression — includes user's tier and below.

    Free user (0): only Free picks (pick_tier = 0)
    Silver (1): pick_tier IN (0, 1)
    Gold (2): pick_tier IN (0, 1, 2)
    Platinum (3): all (pick_tier IN (0, 1, 2, 3))

    Also applies the minimum confidence threshold so Free doesn't
    include noise below 0.55.
    """
    conds = [Prediction.confidence >= CONF_THRESHOLD[PickTier.FREE]]

    if user_tier == PickTier.FREE:
        # Free user: only picks that do NOT qualify for any paid tier
        conds.append(
            ~or_(
                and_(
                    Match.league_id.in_(LEAGUES_SILVER),
                    Prediction.confidence >= CONF_THRESHOLD[PickTier.SILVER],
                ),
            )
        )
    # All paid tiers see everything that passes Free minimum,
    # label is applied via pick_tier_expression() at display time.
    return and_(*conds)
```

**Belangrijk:** `access_filter(PLATINUM)` returnt vrijwel geen extra filter — Platinum ziet alles. Wat verschilt per tier is welke picks als welke tier **gelabeld** worden in de UI. De filter is vooral van belang voor Free (exclude higher-tier picks).

**Eigenlijk cleaner:** Free user krijgt NIET de ⚪ Silver picks uit Serie A — alleen ⬜ Free picks (alles wat buiten tier-definities valt, conf>=0.55). Dat voorkomt dat Free per ongeluk Silver-kwaliteit ziet zonder te betalen.

#### API endpoints

| Endpoint | Filter strategie |
|----------|------------------|
| `GET /api/predictions` | `.where(v81_predictions_filter()).where(access_filter(user_tier))` + `pick_tier_expression()` in SELECT |
| `GET /api/bet-of-the-day` | Idem, plus filter op hoogste tier beschikbaar voor user |
| `GET /api/trackrecord/summary` | Aggregated per pick_tier — user krijgt eigen access |
| `GET /api/dashboard/metrics` | Eigen-picks accuracy + tier breakdown |
| `GET /api/pricing/comparison` | Per-pick-tier historical accuracy (public) |

#### Pick tier classificatie — server-side vs client-side?

**Server-side.** De classificatie gebeurt in SQL via `pick_tier_expression()` zodat:
- Admin kan het tier zien op oude predictions (audit)
- Filter consistency over alle endpoints
- Frontend toont alleen het label (geen computatie)

Response shape:
```json
{
  "id": "uuid",
  "match": { "home": "Man City", "away": "Arsenal", "league": "Premier League" },
  "home_win_prob": 0.82,
  "draw_prob": 0.11,
  "away_win_prob": 0.07,
  "confidence": 0.82,
  "predicted_outcome": "home",
  "pick_tier": "platinum",       // NEW: from pick_tier_expression()
  "pick_tier_label": "🟢",        // NEW: UI hint
  "pick_tier_accuracy": 0.87      // NEW: historical accuracy for this tier
}
```

#### Cache strategie

Cache keys bevatten user_tier: `predictions:today:{user_tier}`, `dashboard:metrics:{user_tier}`.

Bij tier-upgrade (Stripe webhook):
- Invalidate `*:{old_tier}` voor die user
- Invalidate `*:{new_tier}` (bust zodat next request vers laadt)

#### Database: geen schema change
Pick tier wordt **dynamisch berekend per query**. Geen nieuwe column in `predictions`. Voordeel: als tier-grenzen verschuiven is het een code-deploy, geen data-migratie.

### 3.5 Juridische kant

#### Marketing claims per context

| Context | Toegestane claim | Eisen |
|---------|------------------|-------|
| Homepage headline | "85%+ on elite picks" | Moet "Platinum tier" of "on elite picks" of "Top 5 leagues" bevatten |
| Homepage subtitle | "55% to 85%+ accuracy" | Tier range, "from... to..." frame |
| Pricing kaart Platinum | "85%+" (badge + copy) | Footnote: "635 validated picks, >=75% confidence, top 5 leagues" |
| Pricing kaart Gold | "77%" | Footnote: "1,341+ picks, >=70% conf, top 10 leagues" |
| Pricing kaart Silver | "69%" | Footnote: "2,356+ picks, >=65% conf, top 14 leagues" |
| Pricing kaart Free | "55%+" | Footnote: "All leagues, >=55% confidence" |
| In-app pick badge | Badge (🟢🔵⚪⬜) met accuracy hint | Hover: "tier accuracy + sample size" |
| Methodology page | Alle tiers + Wilson CIs + sample | Volledig transparant |
| Blog / social / email | Alleen "85%+" als Platinum | Altijd met context-footnote |

#### 4 disclaimer-niveaus (onveranderd vs v2)

1. **Universeel:** "Educational, not betting advice. Historical results don't guarantee future."
2. **Per-tier footnote:** "Based on {n} picks, confidence >= {X}, {date range}."
3. **Live vs backtest label:** "Backtest validated" tot ≥200 live picks per tier.
4. **KSA/NL:** "Educatief platform, geen gokadvies, geen vergunning nodig."

#### Sample-size minimums

| Context | Minimum | Huidig sample | OK? |
|---------|:-:|:-:|:-:|
| In-app tier metric | 100 | 635/1,341/2,356/12k | Alle OK |
| Pricing / homepage | 500 | 635 (Platinum net OK) | Platinum marginaal |
| Marketing external (blog/ads) | 1,000 | 635 Platinum | **TE KLEIN voor Platinum** — gebruik "on 635+ elite picks" exact i.p.v. "1000+" |

#### Tier-cijfer "stabiel"
- n >= 500 en
- Rolling 30-day accuracy niet >5pp afwijkend van backtest average

Tot dan: "preliminary" of "early validation" label (small print).

### 3.6 Risico's en edge cases

#### R1. User upgrade mid-dag
**Mitigatie:** Stripe webhook invalidate `*:{old_tier}:*` + `*:{new_tier}:*` voor die user. `user.tier_changed_at` timestamp in DB zodat cache-keys user-specifiek kunnen zijn.

#### R2. Competitie verschuift van tier
**Mitigatie:** wekelijkse `analyze_accuracy_per_league.py` + alert bij >5pp shift. Tier-wijziging = handmatig + deploy.

#### R3. User filtert op 🟢 Platinum maar is Free
**Mitigatie:** UI toont de filter-knop disabled met upgrade-CTA. Geen "0 results" — informatieve nudge.

#### R4. Platinum picks voelen leeg op sommige dagen
**Mitigatie:** **opgelost door v3!** Platinum user ziet OOK Gold/Silver/Free picks, altijd >10 picks/dag. 🟢 scarcity is feature, niet bug.

#### R5. Label verwarring
**Risico:** user ziet ⚪ in Free mode, denkt "ik heb al Silver".
**Mitigatie:** Free user ziet GEEN ⚪ picks — alleen ⬜. Labels verschijnen pas bij upgrade. Consistente nudge: "You're Free. Unlock ⚪ Silver picks."

#### R6. Pick niet in betaalde pool — wat dan?
Als een pick geen enkele tier-criterium haalt (bijv. sparse league, conf 0.58), wordt het ⬜ Free. Niet verborgen — Free users zien het. Paid users kunnen het ook zien als "Free" label. Volledig consistent.

#### R7. Evaluator-achterstand
**Opgelost:** `evaluate_predictions_local.py` kan bulks van 20k in <15s verwerken. Wekelijkse maintenance.

---

## 4. UI copy voorbeelden per pagina (v3)

### Homepage hero
```
[Grote headline, 60px]
85%+ accuracy op onze elite picks.

[Subtitle, 24px]
Van 55% (Free) tot 85%+ (Platinum) — kies jouw niveau.

[Proof, small]
Gevalideerd op 27,037 predictions across 29 leagues (2024-2026).

[CTA buttons]
[Start Free]  [See Pricing]

[Disclaimer footer]
Historical backtest. Educational purposes only. Not betting advice.
```

### Pricing page
Volledige vergelijkingstabel (zie §3.1), met per-tier toelichting:

> **🟢 Platinum** – Onze elite tier.
> Picks uit Champions League, Premier League, Eredivisie, Süper Lig en Saudi Pro League, alleen bij confidence >=75%. Historisch 87% accuracy op 635 picks.
> Plus: alle Gold, Silver en Free picks zichtbaar onder tier-label.
> EUR 39/maand.

### In-app dashboard (Gold user — user-facing voorbeeld)
```
Welcome back 👋
Your tier: 🔵 Gold

Today: 12 picks (2 🔵 Gold, 5 ⚪ Silver, 5 ⬜ Free)

Top pick of the day:
┌────────────────────────────────┐
│ 🔵 GOLD    77% tier accuracy   │
│ Bayern München vs Leverkusen   │
│ Pick: Home Win (74% conf)      │
│ [View Deep Dive]               │
└────────────────────────────────┘

Upgrade to Platinum?
→ See 1-2 🟢 elite picks daily (85%+ accuracy)
→ Champions League, Premier League focus
→ EUR 39/mo [Upgrade]

This month:
🔵 Gold: 7/9 correct (78%)
⚪ Silver: 12/17 correct (71%)
⬜ Free: 6/10 correct (60%)
Total: 25/36 (69.4%)
```

### BOTD page (Free user)
```
Your Free Pick Today:
┌────────────────────────────────┐
│ ⬜ FREE PICK   55% tier avg    │
│ Celtic vs Rangers              │
│ Pick: Home Win (62% conf)      │
└────────────────────────────────┘

🔒 Today's 🟢 Platinum pick (85%+ accuracy):
[Man City vs Arsenal — unlock with Platinum, EUR 39/mo]

🔒 Today's 🔵 Gold pick (77%):
[Bayern vs Leverkusen — unlock with Gold, EUR 19/mo]

Upgrade any time. Cancel any time.
```

### Methodologie-pagina (/engine)
```
## Accuracy by Pick Tier

Every pick we generate is classified into one of 4 tiers based on
league quality and confidence level:

🟢 Platinum — Top 5 leagues, confidence >= 75%
   Historical: 87% accuracy on 635 picks (2024-2026)
   Wilson 95% CI: [84%, 89%]

🔵 Gold — Top 10 leagues, confidence >= 70%
   Historical: 77% accuracy on 1,341+ picks
   Wilson 95% CI: [75%, 79%]

⚪ Silver — Top 14 leagues, confidence >= 65%
   Historical: 69% accuracy on 2,356+ picks
   Wilson 95% CI: [67%, 71%]

⬜ Free — All other qualifying picks, confidence >= 55%
   Historical: 55% accuracy on remaining set

*All figures are historical backtests on the v8.1 engine.
Past performance does not guarantee future results.
For educational purposes only.*
```

---

## 5. Documentatie plan (6 docs — onveranderd vs v2)

| # | Document | Taal | Update |
|:-:|----------|:-:|-------|
| 1-2 | Technical Framework EN+NL | docx | Add tier system section (inclusief model) |
| 3-4 | Legal Framework EN+NL | docx | Add tier disclosure + label system |
| 5-6 | Tier Guide EN+NL (new) | md | User-facing explanation with labels |

**Update pas NADAT backend filter live is en cijfers stabiel** (week 2-3).

---

## 6. Volgorde van werk (aangepast voor v3)

### Fase A — Backend (week 1)
1. `app/core/tier_system.py` met `PickTier` enum + `pick_tier_expression()` + `access_filter()`
2. Haal league UUIDs op uit Railway DB en vul hardcoded sets
3. `Depends(get_current_tier)` dependency
4. Patch endpoints:
   - `/api/predictions` — add `pick_tier` to response
   - `/api/bet-of-the-day/*` — tier label + access filter
   - `/api/trackrecord/*` — aggregate per pick_tier
   - `/api/dashboard/metrics` — user-specific + per-tier breakdown
   - `/api/homepage/free-picks` — alleen ⬜ Free picks
5. Nieuw endpoint: `GET /api/pricing/comparison` (public, returns all 4 tier stats)
6. Test: `scripts/test_tier_system.py` — 4 users simuleren, valideren access + labels

### Fase B — Frontend (week 2)
7. Pick card component met tier badge + locked state
8. Pricing page: vergelijkingstabel uit `/api/pricing/comparison`
9. Dashboard: tier-specific widget + upgrade nudges
10. Filter UI: tier checkboxes op picks lijst
11. Marketing: homepage hero copy update

### Fase C — Documenten (week 3)
12. Update 4 framework docs
13. Schrijf 2 tier guides (user-facing)

### Fase D — QA + launch (week 3-4)
14. End-to-end test per tier
15. Cijfer-consistency check per endpoint
16. Juridische review
17. Launch

---

## 7. Implementatie-prompt — Fase A

```
CONTEXT:
BetsPlug tier-systeem v3 (docs/tier_system_plan.md). 4 pick-tiers
(🟢 Platinum, 🔵 Gold, ⚪ Silver, ⬜ Free) op basis van league + confidence.
User-tier is inclusief: Platinum user ziet alle 4 tiers, Free ziet alleen ⬜.
Elke pick krijgt een tier-label gerenderd in UI.

BOUW:

STAP 1 — app/core/tier_system.py
- class PickTier(IntEnum): FREE=0, SILVER=1, GOLD=2, PLATINUM=3
- Haal league UUIDs uit Railway DB via een bootstrap script:
    backend/scripts/bootstrap_tier_league_ids.py
  Die writes exacte UUIDs naar app/core/tier_leagues.py (simple dict).
- LEAGUES_PLATINUM, LEAGUES_GOLD, LEAGUES_SILVER als sets van UUID-strings
- CONF_THRESHOLD: {PLATINUM: 0.75, GOLD: 0.70, SILVER: 0.65, FREE: 0.55}
- pick_tier_expression() -> SQLAlchemy CASE als integer label
- access_filter(user_tier: PickTier) -> WHERE expression:
    Free: pick_tier == 0 (niet in hogere sets op hun respective confidences)
    Silver: pick_tier <= 1
    Gold: pick_tier <= 2
    Platinum: no filter (all)

STAP 2 — Dependency app/api/dependencies.py
- get_current_tier(user: User = Depends(current_user)) -> PickTier
- Ongelogd: FREE
- Admin-mode override via ?tier=platinum (admin role only)

STAP 3 — Patch endpoints (1 per file):
- api/routes/predictions.py: add pick_tier to response + access_filter
- api/routes/betoftheday.py: tier label + access filter
- api/routes/trackrecord.py: aggregate per pick_tier (GROUP BY)
- api/routes/dashboard.py: user-specific breakdown per tier
- api/routes/homepage.py: force FREE tier on free-picks endpoint
- api/routes/strategies.py: tier label in metrics

STAP 4 — Nieuw endpoint: api/routes/pricing.py (new file)
- GET /api/pricing/comparison
- Returns list of 4 tier objects: {tier, label, emoji, conf_threshold, leagues, accuracy, sample_size, picks_per_day_estimate}
- Gebruik pick_tier_expression() in aggregate query
- Cache 1 hour (static-ish)

STAP 5 — Cache-key update
- Alle tier-aware endpoints: key :{user_tier_slug}
- Lifespan flush + admin /cache/invalidate-metrics blijven werken

STAP 6 — Tests
- scripts/test_tier_system.py
  - Voor elk van 4 tiers: query /api/predictions + vergelijk met directe SQL
  - Assert access_filter werkt (Free ziet GEEN Platinum-labeled picks)
  - Assert pick_tier_expression assigns correctly

STAP 7 — Commit
- 1 commit: "feat(tiers): inclusive pick-tier labeling + access filter"
- Push naar main

RANDVOORWAARDEN:
- GEEN database schema changes (pick_tier is computed)
- GEEN model changes
- GEEN frontend changes (aparte fase)
- GEEN document wijzigingen (aparte fase)
- Alle bestaande v81_predictions_filter() blijven actief
- Maximaal ~200 regels toegevoegd over alle files
```

---

## Besluit

Plan v3 is compleet. Inclusief tier-systeem met pick labels lost het "lege Platinum"-probleem op, marketing-hero is nu strak op Platinum gefocust, elke pick krijgt visuele quality-hint.

**Niks gewijzigd. Wacht op jouw OK om Fase A (backend) te starten.**
