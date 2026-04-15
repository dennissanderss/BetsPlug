# BetsPlug Gebruikersomgeving Redesign — Voorstellen

**Datum:** 15 april 2026
**Versie:** v10.0 (Plan)
**Scope:** Alleen UI-redesign voorstellen. Geen code, geen engine wijzigingen.
**Status:** Wachtend op eigenaar keuze

---

## 1. Engine Capabilities (geverifieerd)

Volledige inventarisatie in `docs/v10_progress_1.md`. Samenvatting:

### ✅ Beschikbaar in engine
- **Predictions per match:** confidence, home/draw/away probabilities, Poisson goal forecasts (predicted_home_score, predicted_away_score)
- **Features snapshot (jsonb):** 39 features per prediction — recent form, Elo, H2H, standings, consistency, clean sheets
- **Raw submodel outputs (jsonb):** Elo, Logistic, XGBoost, Poisson outputs afzonderlijk
- **Team Elo history:** 12,418 walked-forward snapshots over 5.5 jaar
- **Pre-match odds:** 843 matches met 1X2, Over/Under 2.5, BTTS odds (3.2% coverage)
- **Match statistics:** shots, possession, cards (818 matches, 2% coverage)
- **Standings snapshots:** 2,031 daggebonden league tables
- **Track record:** accuracy per segment, 10-bucket calibration, Brier score, log-loss
- **Walk-forward validation:** 28,838 test picks over 4 temporal folds
- **Lead time proof:** `locked_at`, `lead_time_hours` bewijst pre-match origin
- **Prediction source:** 'live' (208 picks) vs 'backtest' (26,412 picks) duidelijk gescheiden

### ⚠️ Kritische engine-gap
**Productie accuracy komt NIET overeen met walk-forward resultaten:**
- Walk-forward: ≥60% confidence → 67.4% accuracy
- **Productie: ≥60% confidence → 42.42% accuracy**
- Productie confidence max = 0.612 — Gold/Platinum tiers hebben **0 picks**

Dit is een **engine-deploy issue**, geen UI-issue. Moet opgelost voor tier-claims legitiem zijn. **Te verifiëren met eigenaar.**

### ⚠️ Geïmplementeerd maar leeg
- `prediction_explanations.top_factors_for: {}` voor alle 26k predictions
- `backtest_runs`, `backtest_results`: 0 rijen
- 14 strategies alle `is_active=false`
- `subscriptions`, `payments`, `users` zeer beperkt (3 users)

### ❌ Niet in engine
- Notification system
- User favorites (alleen localStorage)
- Public API keys / rate-limited user API
- Value bet calculation
- Custom alert builder

---

## 2. Huidige Features Audit

Volledige audit in `docs/v10_progress_2.md`. Samenvatting van 21 pagina's:

### ✅ Behouden (7)
BOTD, Results, Live, Team Detail, Subscription, How It Works, Admin

### 🔄 Behouden maar aanpassen (10)
Dashboard, Predictions, TrackRecord, Strategy Lab, Strategy Detail, Favorites, Match Detail, About, Search, Deals

### 🔀 Samenvoegen (2)
- Reports → Track Record (als Export sub-sectie)
- Settings + MyAccount → één Account pagina

### ❌ Schrappen (1)
- Weekly Report (is alleen redirect naar /results)

### Kritische observaties
1. **Strategies vs Tiers is conceptueel verwarrend** — 14 strategieën inactief, overlapt met confidence tiers
2. **Reasoning is geïmplementeerd maar leeg** — grootste UX-kans
3. **Match Detail mist diepte** — engine heeft rijke data die niet zichtbaar is
4. **Twee user experiences ontbreken** — huidige UI is compromis tussen simpel en analyst
5. **Confidence tier filter niet in UI** — constants in code maar niet gebruikt

---

## 3. Nieuwe Feature Voorstellen

Details in `docs/v10_progress_3.md`. 13 features voorgesteld, gerangschikt naar prioriteit.

### MUST HAVE (bouw eerst)
| # | Feature | Engine data |
|:-:|---------|-------------|
| 1 | **Pick Reasoning** — "Waarom deze pick?" | features_snapshot, raw_output |
| 2 | **Over/Under & BTTS markten** | Poisson lambdas |
| 4 | **Calibration Chart** | /trackrecord/calibration |
| 6 | **Engine Transparency Hub** | walk-forward report, model_versions |
| 13 | **Educational Content** | CMS (Sanity) |

### HIGH (bouw daarna)
| # | Feature | Engine data |
|:-:|---------|-------------|
| 5 | **Streak & Milestone Notifications** | predictions + evaluations |
| 8 | **API Access** (Platinum) | Bestaande endpoints + API keys |
| 9 | **Match Deep Dive** (Gold+) | features, raw_output, Elo history, stats, odds |
| 10 | **Weekend Preview** (email) | Celery + predictions filter |

### NICE TO HAVE (later)
| # | Feature |
|:-:|---------|
| 3 | Value Bet Indicator |
| 11 | League Specialist View |
| 7 | Personal Trackrecord |
| 12 | Custom Alert Builder |

---

## 4. Gebruikersprofielen

Details in `docs/v10_progress_4.md`.

### Profiel A: Mark (Simpele Gebruiker) — 75% van user base
- **Wie:** 28-45 jaar, man, HBO, modaal. Gokt €5-25 per week
- **Gedrag:** Mobile, 2-5 min sessies, 2-3x/week
- **Wil in 10s:** Beste tip, streak, gisteren's score
- **Overweldigd door:** Grafieken, jargon, >5 keuzes, lange tabellen
- **Copy:** Vriendelijk, "jij", emojis OK, getallen in context

### Profiel B: Laura (Data Analist) — 25% van user base
- **Wie:** 25-40 jaar, technische achtergrond, hoger inkomen. Gokt €50-500, 5-20x/week
- **Gedrag:** Desktop+mobile, 10-30 min sessies, dagelijks
- **Wil in 10s:** Premium picks vandaag, weekly model performance, health check
- **Geïrriteerd door:** Te simpel, geen filters/exports, marketing-copy
- **Copy:** Precies, statistisch, sample sizes, units, geen emojis

---

## 5. Product Structuur Voorstellen

Details in `docs/v10_progress_5.md`.

### Voorstel A: Mode Toggle (Simpel ↔ Pro)
Eén URL-structuur met prominente toggle in header. Componenten hebben `mode` prop.

**Voordelen:** Eenvoudig, geen duplicatie, Mark blijft in Simpel, Laura in Pro
**Nadelen:** Toggle-moeheid, ambigue voor nieuwe user
**Bouwwerk:** ~60-80 uur

### Voorstel B: Aparte Routes (`/simpel`, `/pro`)
Twee gescheiden URL-spaces met eigen layouts. Shared backend.

**Voordelen:** Sterke positionering, upgrade trigger glashelder, design-vrijheid
**Nadelen:** 2x code, SEO kannibalisatie risico, meer maintenance
**Bouwwerk:** ~100-140 uur

### Voorstel C: Progressive Disclosure (één interface, 3 lagen)
Geen modes. Elke pagina heeft hero + "meer details" collapse + "deep dive" (Platinum).

**Voordelen:** Minst code, geen cognitive load, upgrade triggers natuurlijk, mobile-perfect
**Nadelen:** Laura moet altijd klikken, ontdekbaarheid van diepte
**Bouwwerk:** ~50-70 uur

---

## 6. Vergelijking en Aanbeveling

### 6A — Vergelijkingstabel

| Criterium | A (Toggle) | B (Routes) | C (Disclosure) |
|-----------|:----------:|:----------:|:--------------:|
| **Eenvoud voor Mark** | 8/10 | 9/10 | 9/10 |
| **Diepgang voor Laura** | 9/10 | 10/10 | 7/10 |
| **Tier upgrade incentive** | 7/10 | 10/10 | 9/10 |
| **Bouwwerk uren** | 60-80 | 100-140 | **50-70** ✓ |
| **Onderhoud complexiteit** | 6/10 | 4/10 | 8/10 |
| **Risico verwarring** | 6/10 | 8/10 | 8/10 |
| **Mobile friendly** | 7/10 | 7/10 | **10/10** ✓ |
| **SEO impact** | 7/10 | 6/10 (duplicaat) | 8/10 |
| **Onboarding flow** | 7/10 | 9/10 | 8/10 |
| **Adoption snelheid** | 8/10 | 6/10 | **9/10** ✓ |
| **A/B test vrijheid** | 6/10 | 10/10 | 5/10 |
| **Totaalscore (impact/kost)** | 78 | 89 | **89** ✓ |

### 6B — Aanbeveling

**Primaire aanbeveling: Voorstel C (Progressive Disclosure) met elementen uit A.**

#### Onderbouwing

**Waarom Voorstel C winnt:**
1. **Minste bouwwerk** (50-70 uur) voor maximale impact
2. **Mobile-first**: Mark opent op telefoon, collapsibles werken perfect
3. **Natural upgrade triggers**: Lock-modals verschijnen precies bij het moment van verlangen
4. **Eenvoudig onderhoud**: één component met diepte-prop, geen dubbele pagina's
5. **Scalable**: nieuwe features passen in bestaande laag-structuur

**Waarom NIET Voorstel B:**
- Te duur (100-140 uur) zonder bewezen extra retentie
- Risico SEO kannibalisatie
- Overlap met bestaande pagina's zou refactor vereisen
- Maintenance burden weegt niet op tegen flexibility

**Waarom NIET puur Voorstel A:**
- Toggle-moeheid is een reëel probleem
- Nieuwe user moet kiezen zonder context
- Pro/Simpel toggle is minder duidelijke upgrade-trigger dan "unlock deep dive"

#### Hybride: C + A-element

**Neem 1 element van A over:** behoud een kleine "Pro-toolbar" (breadcrumb of header-strip) die Laura laat zien in welke staat ze zitten, met shortcut naar "Expand all deep dives" en "Export all". Dit voorkomt irritatie bij de analist die altijd dezelfde diepte wil.

#### Voorbeeld van aanbevolen UX-flow (BOTD pagina)

```
┌─ TIP VAN DE DAG ─────────────────────┐
│                                       │
│  🏆 FC Bayern München vs Dortmund    │
│                                       │
│     Pick: Bayern wint                 │
│     Confidence: ★★★★☆ (68%)          │
│                                       │
│  💡 Bayern wint 80% van thuisduels   │
│     tegen zwakkere tegenstanders.     │
│                                       │
│  [Bekijk volledige onderbouwing ↓]   │
│                                       │
└───────────────────────────────────────┘

[Klik op uitbreiden]

┌─ WAAROM DEZE PICK? ──────────────────┐
│                                       │
│  1. Elo: Bayern 1732, Dortmund 1639  │
│     → Bayern 93 punten sterker        │
│                                       │
│  2. Laatste 5 thuis: 4W 1D (80%)    │
│                                       │
│  3. H2H: Bayern 7-2-1 laatste 10     │
│                                       │
│  📊 Historische accuracy BOTD: 68/100 │
│     deze maand                        │
│                                       │
│  🔬 [Deep dive: 39 features] (Gold+) │
│  💹 [Value bet check] (Gold+)        │
│                                       │
└───────────────────────────────────────┘

[Platinum user klikt deep dive]

┌─ DEEP DIVE ──────────────────────────┐
│                                       │
│  Submodel breakdown:                  │
│   Elo:      62% home                  │
│   Logistic: 71% home                  │
│   XGBoost:  69% home                  │
│   Poisson:  exp 2.3-1.1 goals        │
│   ────────────────────                │
│   Ensemble: 68% home                  │
│                                       │
│  Calibration context:                 │
│  68%-bucket is historisch 67% accuraat│
│  (n=1,269 picks walk-forward)        │
│                                       │
│  Pre-match odds (sample):             │
│   Home: 1.52  Draw: 4.30  Away: 6.20│
│   Model edge: +2.8pp home            │
│                                       │
│  Feature importance (top 10):         │
│   [Bar chart]                         │
│                                       │
└───────────────────────────────────────┘
```

### 6C — Implementatie roadmap (indicatief)

**Fase 1 — Fundament (week 1-2)**
- Sidebar cleanup (6 items, merge Settings+Account)
- Schrap Weekly Report route
- Progressive disclosure framework (collapsible component)
- About pagina naar v8 data updaten
- Engine Transparency Hub (nieuwe pagina)

**Fase 2 — Engine fix (parallel)**
- ⚠️ Productie model retrain (engine-probleem, buiten v10 scope)
- Prediction explanations vullen bij predict-time (feature #1 backend-side)

**Fase 3 — Must Have features (week 3-4)**
- Pick Reasoning in BOTD + Match Detail + Predictions (feature #1)
- Calibration chart in Track Record (feature #4)
- Educational content (feature #13)

**Fase 4 — High features (week 5-6)**
- Over/Under & BTTS markets (feature #2)
- Match Deep Dive upgrade (feature #9)
- Streak notifications basis (feature #5)
- Weekend preview email (feature #10)

**Fase 5 — Platinum features (week 7-8)**
- API access (feature #8)
- Value bet indicator (feature #3)
- Custom alert builder basic (feature #12)

---

## 7. Vragen aan eigenaar

### Kritisch (blokkeer beslissing)
1. **Productie accuracy gap:** Walk-forward validatie toont 67-78%, productie toont 42%. Moet fixed voor tier claims legitiem zijn. Wanneer fix?
2. **Strategies vs Confidence Tiers:** één concept behouden of beide? 14 strategieën zijn inactief.
3. **Juridisch:** Mag copy als "je zou X% hebben verdiend" of alleen accuracy?

### Belangrijk
4. **User demografie:** Klopt 75% Mark / 25% Laura? Of andere mix?
5. **Reports feature:** blijft (B2B) of wegsnijden?
6. **Backtest functie:** wordt gebruikt of verwijderen?
7. **Favorites:** uitbouwen of localStorage laten?
8. **Mobile-first of desktop-first?**

### Optioneel
9. **Taal:** NL primair, EN ook? Micro-copy beide nodig.
10. **Search feature:** analytics toont welk gebruik? De-prominent of behouden?
11. **Deals / referral:** actief gebruikt of naar footer?

---

## 8. Volgende stap

Eigenaar kiest:

**A)** Welke feature-aanbevelingen (behouden/wijzigen/schrappen) uit sectie 2 goedkeuren?
**B)** Welke nieuwe features uit sectie 3 prioriteren?
**C)** Welk product structuur voorstel? (Aanbeveling: **Voorstel C met A-hybride**)
**D)** Antwoord op openstaande vragen uit sectie 7

Daarna: maakbaar-prompt voor implementatie in nieuwe sessie met concrete scope.

---

## Bijlagen (tussenrapporten)

Alle stap-voor-stap documentatie in de docs folder:
- `docs/v10_progress_1.md` — Engine Capabilities
- `docs/v10_progress_2.md` — Huidige Features Audit
- `docs/v10_progress_3.md` — Nieuwe Feature Voorstellen
- `docs/v10_progress_4.md` — Gebruikersprofielen
- `docs/v10_progress_5.md` — 3 Product Structuur Voorstellen

Engine referenties:
- `docs/V8_ENGINE_REPORT.md` — Walk-forward validatie
- `docs/BetsPlug-Technisch-Juridisch-Kader-NL.docx` — v8 framework
- `docs/ARCHITECTURE.md` — Technische architectuur
