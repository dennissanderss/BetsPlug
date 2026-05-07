# UX Vereenvoudiging — Volledig (4 pagina's)

*Generated 2026-05-07. Alle 4 pagina's gestript voor 8-jarige UX. Engine, combo selector, backend filters en database NIET aangeraakt.*

---

## Samenvatting

| Pagina | Commit | Vroegere complexiteit | Nieuwe vorm |
|---|---|---|---|
| 2 — Voorspellingen | `6aa7859` | 4 filter strips, tier+confidence chips, "How it works" card, BOTD upsell | 3 tabs + 1 datumdropdown + 1 league dropdown |
| 3 — Resultaten | `00a4142` | 4-tier KPI tiles, day counter, ROI claims progress, advanced simulation card, RelatedLinks | 2 stat cards + 1 periode dropdown + tabel |
| 1 — Combo | `92f673b` | 4 KPI grid, 5 period tabs, edge labels, technical disclaimer | 1 combo card + 2 stat cards + history list |
| 4 — Trackrecord | `ec1a7cf` | 3 tabs, 4 KPI tier grid, calibration buckets, segment tables, AccuracyPlus | 2 secties (Voorspellingen + Combo) onder elkaar |

---

## Pagina 2 — Voorspellingen (commit `6aa7859`)

### Verwijderd
- "How it works" tier-explainer card met hit-rate ladder per tier
- Tier filter chips (All/Plat/Gold/Silver/Free) — backend toont al de juiste tier
- Confidence filter chips (All/High/Med/Low)
- 4-knops date strip → vervangen door 1 dropdown
- BOTD Gold-upsell banner onderaan (BOTD is afgeschaft)
- Lange empty-state copy met "switch to lower tier" suggestie
- "Wedstrijden met odds onder 1.50 verborgen" toggle was al weg sinds Phase 4

### Toegevoegd / aangepast
- Eén `<select>` dropdown: "Wanneer: Vandaag / Deze week / Deze maand"
- Empty state: "Vandaag geen voorspellingen voor jouw tier"

### Resultaat
- Interactive controls: ~15 → **3** (3 tabs + 1 date dropdown + 1 league dropdown)
- Bestand: 1975 → 1801 regels (-9%)

---

## Pagina 3 — Resultaten (commit `00a4142`)

### Verwijderd
- "Live tracking — Day 21 of 90" header counter + "Progress to ROI claims" balk
- 4-tier KPI tile grid (free/silver/gold/platinum naast elkaar)
- "Result" filter (All/Correct/Incorrect)
- Period chip strip (7d/14d/30d/90d) → dropdown
- "Advanced simulation" collapsible (RoiCalculatorCard + WeeklySummary + custom stake + dataSource toggle + stream toggle)
- "Ontdek meer" RelatedLinks sectie

### Toegevoegd
- 2 prominente stat cards: "% correct" + "Bij €10 inzet" met €-rendement
- Eén `<select>` dropdown: "Periode: Laatste 7 / 30 / 90 dagen"
- Tier filter impliciet = user's eigen tier

### Resultaat
- 2239 → 2178 regels (-3%)
- Geen jargon meer, geen 4 tier breakdown, geen advanced section

---

## Pagina 1 — Combo van de Dag (commit `92f673b`)

### Verwijderd uit zichtbare pagina
- Header subtitel "3 legs · edge-filtered · live pre-match odds since 16 Apr 2026"
- 4 KPI grid (Combined odds / Model hit-rate / Bookmaker implied / Expected ROI)
- Per-leg edge labels ("+24.8% edge")
- Per-leg "model 84% · book 63%" technische sub-line
- Lange Nederlandse disclaimer paragraaf
- 5 periode tabs (TODAY/WEEKLY/MONTHLY/QUARTERLY/ALL TIME)
- Backtest/Live scope toggle

### Toegevoegd (3 nieuwe simpele componenten)
- **`SimpleTodayCombo`** — Vandaag's Combo card met:
  - 2 wedstrijden (competitie + teams + onze pick + odds)
  - Totaal "X keer je inzet" + "€10 → €X winst" line
- **`SimpleTrackRecord`** — "Hoe deden we het?" met 2 cards:
  - Historisch (alle data): combo's gespeeld + gewonnen + rendement
  - Live meting sinds 16 april: idem
- **`SimpleHistory`** — laatste 10 combo's lijst met datum + win/loss icoon
- Footer: "Statistische analyse · 18+ · geen gokadvies"

### Resultaat
- 709 → 887 regels (+25%, want nieuwe simpele componenten zijn pure JSX)
- Old code (TodayComboCard, StatsBlock, HistoryBlock, etc.) blijft in bestand maar wordt niet meer gerenderd

---

## Pagina 4 — Trackrecord (commit `ec1a7cf`)

### Verwijderd
- 3-tab navigatie ("Onze prestatie / Modelvalidatie / Walk-forward")
- 4-tier KPI grid met Brier score / log-loss / Wilson CI kolommen
- Calibration buckets sectie
- Per-segment tabellen (per league, per period, per confidence band)
- LiveMeasurementSection met "2 · LIVE METING" labels
- AccuracyPlusPreview "Engine v2 in ontwikkeling" card
- "Apart gelogd sinds 16 april 2026" lange uitleg
- "Statistisch betekenisvolle cijfers per tier vereisen circa 200 beoordeelde wedstrijden" footer
- 189 regels legacy code volledig gedeleted

### Toegevoegd (2 secties onder elkaar, geen tabs)
- **SECTIE 1 — "Voorspellingen per tier"**
  - Hergebruikt `PerTierPerformanceSection` (uit Phase 5)
  - Per tier: 14d / 30d / lifetime ROI op display-filtered picks
- **SECTIE 2 — "Combo van de dag"**
  - Nieuwe `SimpleComboTrackRecord` component
  - 2 cards: Historisch + Live meting sinds 16 april
- Footer line: "Backtest = ons model toegepast op afgelopen wedstrijden. Live = voorspellingen die we vooraf hebben vastgelegd."

### Resultaat
- 1653 → 1561 regels (-6%)

---

## Algemene wijzigingen

### Taal
- Geen jargon meer in zichtbare UI: "edge", "vig", "implied", "EV", "FT", "scope", "Brier", "Wilson", "calibration" allemaal weg
- Nederlands of Engels per user-preference (bestaande i18n keys)
- Korte zinnen

### Numerieke weergave
- Percentages met % teken
- Geld met € teken
- Positief: groen, met +
- Negatief: rood, met −
- Sample sizes: "X wedstrijden" niet "n=X"

### Empty states
- Vriendelijk Nederlands
- Geen technische error messages
- Suggestie wat de gebruiker wel kan doen

### Loading
- Skeleton screens, niet spinners

---

## Wat NIET veranderd is

- ❌ Engine v8.1 (`forecast_service`)
- ❌ Engine v2 / Combo selector (`combo_bet_service`)
- ❌ Backend display filter (`predictions_display_filter`) — recipes onveranderd
- ❌ Database schema
- ❌ Tier classification logic
- ❌ Stripe pricing tiers
- ❌ API contracts (alle endpoints retourneren dezelfde shape)

Alle wijzigingen zijn pure UI: layout, copy, weghalen van complexiteit. De backend ROI cijfers blijven consistent over alle pagina's (komen uit `/trackrecord/per-tier-roi` en `/value-bets/combo-history`).

---

## Consistency check (cijfers per surface)

| Plek | Bron data | Gegarandeerd consistent |
|---|---|---|
| `/dashboard` TierRoiHeadline | `/trackrecord/per-tier-roi` | ✅ |
| `/predictions` lijst | `/fixtures/upcoming` (server-side filter) | ✅ |
| `/trackrecord` Sectie 1 | `/trackrecord/per-tier-roi` | ✅ |
| `/trackrecord` Sectie 2 | `/value-bets/combo-history` | ✅ |
| `/results` 2 stat cards | computed van filtered fixtures | ✅ (tier filter = user's tier) |
| `/combi-of-the-day` Hoe deden we het | `/value-bets/combo-history` | ✅ |

---

## Volgende stappen voor jou

1. **Vercel deploy afwachten** (~2 min na laatste push)
2. **Bekijk de 4 pagina's**:
   - `/predictions` — simpele lijst, geen filters
   - `/results` — 2 stat cards + tabel
   - `/combi-of-the-day` — combo card + history
   - `/trackrecord` — 2 secties, geen tabs
3. **Geef terugkoppeling** als er copy / labels zijn die nog versimpeld kunnen
4. **Power-user features** (advanced simulator, calibration, segments) zijn niet weg — code is alleen niet meer gerenderd. Kunnen later als "Pro tools" sectie terugkomen indien gewenst.

---

**Klaar.** 4 commits, 4 pagina's, 1 eindrapport.
