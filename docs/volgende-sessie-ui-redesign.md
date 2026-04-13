# BetsPlug UI Redesign — Volgende Sessie Prompt

## Context
De gebruikersomgeving (dashboard app) moet compleet herontworpen worden. Het is nu te donker, te technisch, te veel containers, en niet begrijpbaar voor normale gebruikers. Het moet een verbeterde versie van NerdyTips worden — clean, begrijpelijk, casino-aesthetic maar professioneel.

## Ontwerpprincipes

1. **Lichter, leesbaarder** — niet overal donkere containers. Meer witruimte, subtiele achtergronden, duidelijke tekst
2. **Minder containers** — clean regels, niet alles in aparte boxes stoppen
3. **Casino-vibes** — good vibes, aesthetic, premium gevoel maar simpel en clean
4. **Hover-tooltips** — technische termen uitleggen als je eroverheen hovert (confidence, edge, etc.)
5. **Begrijpbaar voor iedereen** — niet voor data-analisten maar voor normale mensen
6. **Consistentie** — alle pagina's zelfde stijl, zelfde patronen

## Navigatie herstructurering

### Sidebar — NIEUW:
```
OVERZICHT
  Dashboard          (samenvattingspagina)

VOORSPELLINGEN
  Pick van de Dag    (premium feature, dagelijkse beste pick)
  Alle Voorspellingen (volledige lijst met filters)

RESULTATEN
  Resultaten & Analyse  (combinatie van Results + Weekly Report)

MEER
  Track Record       (historische performance data)
  Rapporten          (CSV/PDF exports)
```

### Verwijderd:
- **Settings tab** — weg, settings via profiel-dropdown rechtsboven
- **Weekly Report** — gecombineerd in Resultaten
- **Your Route** — wordt de Dashboard landing (kort intro + overzicht)
- **Strategy Lab** — Coming Soon badge, niet prominent in nav

## Per pagina — wat moet veranderen

### 1. Dashboard (landing na login)
**Huidige problemen:** 4 technische KPI-boxes (Brier Score??), lege predictions tabel, geen richting
**Nieuw ontwerp:**
- Welkomstbanner met korte uitleg: "BetsPlug analyseert wedstrijddata om de meest waarschijnlijke uitslag te voorspellen"
- Pick van de Dag card prominent bovenaan (als beschikbaar)
- Snel overzicht: "Vandaag X wedstrijden beschikbaar" met link
- Mini track record: "Deze week: X/Y correct (Z%)" 
- Geen Brier Score, geen technische metrics voor eindgebruikers
- Hover tooltip op "confidence": "Hoe zeker ons model is over deze voorspelling (0-100%)"

### 2. Pick van de Dag
**Huidige problemen:** "No Pick Available" (omdat BOTD nu live-only is en er geen live predictions zijn)
**Nieuw ontwerp:**
- Grote, aantrekkelijke hero card met de dagelijkse pick
- Duidelijk: teams, competitie, aftrap, onze voorspelling, confidence
- Historische performance: "71% correct op 232 picks"
- Fallback: als geen live pick, toon "Nog geen pick voor vandaag — check later terug"
- Track record van vorige picks met scores en correct/incorrect

### 3. Alle Voorspellingen
**Huidige problemen:** Te donker, te veel containers, "Model: Ensemble" badge (wat is dat?), "SCH" badge, venue info
**Nieuw ontwerp:**
- Clean tabel/lijst layout — niet elke wedstrijd in een aparte container
- Per wedstrijd: competitie-logo/naam | teams | tijd | onze pick (1/X/2) | confidence | odds
- Competitie-filter bovenaan (chips of dropdown)
- Confidence uitleg via hover: "Hoe zeker we zijn: High = zeer zeker, Medium = redelijk zeker, Low = onzeker"
- Geen "Model: Ensemble" badge — dat is technisch jargon
- Geen "SCH" badge — gewoon de datum/tijd is genoeg
- Pre-match odds tonen als beschikbaar
- Datumnavigatie: vandaag / morgen / vorige dag

### 4. Resultaten & Analyse (samenvoeging Results + Weekly Report)
**Huidige problemen:** Aparte tabs, te veel containers, onduidelijke streaks
**Nieuw ontwerp:**
- Bovenaan: periodefilter (deze week / vorige week / 30 dagen / custom)
- Samenvatting: totaal calls, correct, incorrect, winrate — in clean rij, niet in boxes
- Lijst van resultaten: teams | score | onze call | correct/incorrect badge
- Analytics sectie onderaan: beste competitie, slechtste competitie, langste reeks
- Hover tooltips op alle termen
- Combineer weekly report data hier — geen aparte pagina nodig

### 5. Track Record
**Wat hier staat:** Historische performance data
**Vragen:** 
- Wordt BOTD getrackd of alle predictions?
- Antwoord: ALLES — maar met filter optie (live vs backtest, BOTD vs all)
- Clean tabel met: datum, wedstrijd, onze call, uitslag, correct/incorrect
- Overall stats bovenaan
- CSV export knop

### 6. Rapporten
**Huidig:** CSV/PDF export — opzich prima
**Aanpassingen:**
- Duidelijk welke data in de export zit
- Auto-cleanup elke paar uur
- Export opties: "Alle voorspellingen" / "Pick van de Dag alleen"

### 7. Strategy Lab
**Status:** Coming Soon (Gold tier)
**Aanpak:** Simpele "Coming Soon" pagina met uitleg wat het wordt
**Niet prominent in navigatie** — klein icoontje of onder "Meer"

## Technische notities
- Alle tekst via i18n (t() keys) — geen hardcoded strings
- Sanity CMS integratie voor teksten komt later
- Responsive design — mobile first
- Consistente kleuren: primary green (#10b981), accenten, light backgrounds
- Hover states op interactieve elementen

## Definition of Done
- [ ] Alle pagina's consistent redesigned
- [ ] Navigatie herstructurering doorgevoerd
- [ ] Settings tab verwijderd (profiel dropdown)
- [ ] Weekly Report gecombineerd in Results
- [ ] Hover tooltips op technische termen
- [ ] Geen technisch jargon zichtbaar (Brier Score, Ensemble, etc.)
- [ ] Lichter kleurenschema — niet alles pikzwart
- [ ] Mobile responsive
- [ ] Alle tekst via i18n
