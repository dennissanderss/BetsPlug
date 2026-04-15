# V10 Progress — Step 4: Gebruikersprofielen

Datum: 15 april 2026

---

## Profiel A: De Simpele Gebruiker — "Mark"

### Wie is dit persoon?
- **Demografie:** 28-45 jaar, man (75%), HBO-opleiding, modaal inkomen
- **Context:** Werkt kantoorbaan, volgt Eredivisie + Champions League, kijkt af en toe Premier League
- **Gokervaring:** Zet 1-2x/week kleine bedragen in (€5-25). Geen professioneel gokker
- **Gedrag:**
  - Opent app op telefoon 2-3x/week, vooral vrijdag en zaterdag
  - Sessieduur 2-5 minuten
  - Scrollt niet door lange lijsten
  - Wil snelle overzichten, niet diepe analyse
- **Motivatie:** Wil een "edge" voelen zonder moeilijk te denken. Gelooft in data maar begrijpt statistiek beperkt.

### Wat wil Mark vinden in 10 seconden na inloggen?
1. **"Wat is de beste tip voor vandaag?"** — één duidelijke pick
2. **"Ga ik het goed doen?"** — streak / accuracy getal
3. **"Heb ik iets gemist?"** — gisteren's score

### Wat overweldigt Mark?
- Grafieken met te veel datapunten
- Statistische termen (Brier score, confidence interval, calibration)
- Meer dan 5 keuzes op één scherm
- Lange tabellen met veel getallen
- Tabs binnen tabs
- Ongevraagde notifications in de UI (banners, popups)
- Concepten als "walk-forward validation", "XGBoost", "39 features"

### Welke features uit Stap 2 + Stap 3 passen?
**Bestaand:**
- ✅ Dashboard (gepersonaliseerd)
- ✅ Bet of the Day (killer feature)
- ✅ Results (simpel overzicht)
- ✅ Live (fun om te volgen)
- ✅ How It Works (onboarding)
- ✅ About (vertrouwen)

**Nieuw:**
- ✅ **#1 Pick Reasoning** — 1 reden als simpele zin
- ✅ **#5 Streak Notifications** — emotionele hook
- ✅ **#10 Weekend Preview** — vrijdagavond email
- ✅ **#13 Educational Content** — wegwijs maken
- ✅ **#11 League View** — zijn favoriete Eredivisie

**Weggeblind voor Mark:**
- Calibration charts, Brier scores, submodel breakdowns, API access, custom alerts, value bet EV%

### Welke micro-copy past Mark?

**Toon:**
- Vriendelijk, direct, geen jargon
- "jij"-vorm, niet "u"
- Emojis OK (⚽🏆🔥📊)
- Getallen in context, niet technisch

**Goede voorbeelden:**
- ✅ "Onze beste tip van vandaag"
- ✅ "70% kans dat Bayern wint"
- ✅ "Gisteren raakten we 4 van de 5"
- ✅ "🔥 Je zit op een 3-streak!"
- ✅ "Bekijk waarom we dit voorspellen"

**Verkeerde voorbeelden:**
- ❌ "Confidence: 0.72, Brier: 0.19"
- ❌ "Walk-forward validated prediction"
- ❌ "Feature importance: h_ppg5=0.22"
- ❌ "Calibration slope: 0.94"

### Conversie triggers (Free → Silver)
1. **Lock-scherm op BOTD:** "Vandaag's pick is Silver-exclusive. Bekijk met gratis 7-dagen trial."
2. **Streak preview:** "Je zou in de afgelopen 3 dagen 3/3 hebben geraakt met onze tips."
3. **League lock:** "Kies je favoriete league. Upgrade voor alle 30 leagues."

---

## Profiel B: De Data Analist — "Laura"

### Wie is dit persoon?
- **Demografie:** 25-40 jaar, vaker man (85%), vaak technische/wiskundige achtergrond, hoger inkomen
- **Context:** Gokt ofwel als hobby-obsessie (betting enthusiast) of als professionele ex-trader
- **Gokervaring:** Zet regelmatig in, 5-20x/week, €50-500 per bet. Gebruikt Excel, eigen modellen, meerdere tipster-diensten
- **Gedrag:**
  - Opent app dagelijks, 10-30 minuten sessies
  - Drilldown, drill-down, drill-down
  - Exporteert data (CSV)
  - Wil filters, sorteringen, custom views
  - Bouwt eigen strategieën op basis van platform data
- **Motivatie:** Zoekt een edge. Wil begrijpen HOE het model werkt om het te vertrouwen. Verwacht transparantie en diepgang.

### Wat wil Laura vinden in 10 seconden na inloggen?
1. **"Wat heeft het model vandaag aan picks met >70% confidence?"** — filter op premium picks
2. **"Hoe presteert het model vorige week in mijn leagues?"** — track record + segments
3. **"Is er iets raars gebeurd (losing streak, calibration drift)?"** — health check

### Wat irriteert Laura?
- Te simpele UI zonder filters
- Geen exports (CSV/JSON)
- Marketing-copy ("WAUW! Mis dit niet!")
- Geen uitleg van model internals
- Geen per-league, per-tier breakdowns
- Modals die antwoorden weghouden
- Vaste categoriseringen (Gold/Silver) zonder onderliggende data
- Geen timestamp/bronvermelding

### Welke features uit Stap 2 + Stap 3 passen?
**Bestaand:**
- ✅ All Predictions (met volledige filters)
- ✅ Track Record (volledig, alle segments)
- ✅ Strategy Lab (als feitelijke strategieën met walk-forward)
- ✅ Match Detail (diep)
- ✅ Admin-achtige transparency view

**Nieuw:**
- ✅ **#1 Pick Reasoning** — alle 39 features + importances
- ✅ **#2 Over/Under & BTTS** — meer markten
- ✅ **#3 Value Bet Indicator** — het echte spel
- ✅ **#4 Calibration Chart** — model-validatie
- ✅ **#6 Engine Transparency Hub** — due diligence
- ✅ **#8 API Access** — programmatisch werken
- ✅ **#9 Match Deep Dive** — alle data
- ✅ **#12 Custom Alert Builder** — eigen workflow

**Waardeloos voor Laura:**
- Streak emojis, motivational nudges, simplified reasoning

### Welke micro-copy past Laura?

**Toon:**
- Precies, statistisch, data-first
- "u"-vorm (of neutraal English)
- Geen emojis (of maximaal 1 functioneel)
- Getallen met units, sample sizes, confidence intervals

**Goede voorbeelden:**
- ✅ "78.2% accuracy (n=1,497, Apr 2022 – Apr 2026)"
- ✅ "Model confidence: 72.3% | Market implied: 58.1% | Edge: +14.2pp"
- ✅ "Brier score 0.214 (≤ 0.22 threshold)"
- ✅ "Walk-forward validated, 28,838 test picks, 4 folds"
- ✅ "Feature importance: elo_diff (0.22), form_diff (0.18)"
- ✅ "Export to CSV | Download JSON"

**Verkeerde voorbeelden:**
- ❌ "Onze beste tip van vandaag!"
- ❌ "🔥 Je zit op een streak!"
- ❌ "Dit wil je niet missen"
- ❌ "Simpel uitgelegd"

### Conversie triggers (Silver → Gold → Platinum)
1. **Gold lock:** "Calibration chart beschikbaar in Gold. Zie hoe betrouwbaar 70%-confidence picks zijn (n=3,942)."
2. **Platinum API lock:** "API endpoint `/v1/predictions` met 100 req/hour. Sync met je eigen bots."
3. **Deep dive lock:** "Alle 39 features + submodel outputs beschikbaar in Platinum."

---

## Gemeenschappelijke behoeften (beiden)

### Beide profielen willen:
- **Vertrouwen:** transparantie over hoe model werkt
- **Eerlijkheid:** live vs backtest duidelijk gescheiden
- **Disclaimer:** "geen gokadvies" zichtbaar
- **Security:** 2FA, veilige betalingen, privacy controls
- **Mobile-vriendelijk:** beide openen app op telefoon

### Gemeenschappelijke UI-principes
- Header met status: "Last updated: 3 min ago" (beiden waarderen dit)
- Consistentie: zelfde kleuren voor correct/incorrect, win/lose
- Duidelijke tier badges
- Opt-out voor notifications

---

## Verdeling binnen user base (schatting)

| Profiel | % | Tier distributie verwacht |
|---------|:-:|---------------------------|
| **Mark** (simpel) | 75% | 60% Free → 30% Silver → 10% Gold |
| **Laura** (analist) | 25% | 20% Silver → 50% Gold → 30% Platinum |

**Implicatie:** UI moet primair voor Mark werken (default view = simpel), maar Laura moet snel naar diepte kunnen (toggle of drill-down).

---

## Vragen aan eigenaar

1. **Demografie:** Klopt de 75/25 split Mark/Laura? Of is BetsPlug juist gemikt op analisten?
2. **Taal:** NL primair of EN ook? Beide moeten uitleg in juiste toon hebben.
3. **Mobile-first of desktop-first?** Mark gebruikt mobile, Laura vaak desktop.
4. **Juridisch:** Mag "je zou X hebben verdiend" copy? Of is alleen "correct/incorrect" toegestaan?
