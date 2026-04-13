# BetsPlug Casino-Style UI Redesign

## Doel
De gebruikersomgeving moet transformeren van een data-analist tool naar een premium sports betting platform met casino-vibes. Referentie: Houshoot dashboard + FootballBet screenshots.

## Design Principes
- **Casino aesthetic** — donker paars/navy met vibrant accenten, glows, gradients
- **Afbeeldingen** — team logos, competitie badges, eventueel speler foto's
- **Leven erin** — match cards met visuele flair, niet alleen tekst en containers
- **BetsPlug identiteit** — behoud groen (#10b981/#4ade80) als primary accent
- **Simpel maar premium** — clean maar niet kaal, visueel maar niet overweldigend

## Wat er moet veranderen

### Globaal
- **Achtergrondkleur**: donkerder paars/navy i.p.v. puur donkergrijs (referentie: #0f0a1e → #1a1030 gradient)
- **Accent glows**: subtiele paarse/groene glows achter kaarten
- **Typografie**: grotere titels, meer contrast, boldere cijfers
- **Kaarten**: glassmorphism met gekleurde borders, geen platte grijze boxes

### Sidebar
- Compacter, met iconen prominenter
- Actieve item met glow effect

### Dashboard
- **Hero card**: Pick van de Dag prominent bovenaan met team namen groot, odds, en confidence
- **Quick stats rij**: winrate, picks vandaag, actieve competities — compact, geen grote boxes
- **Volgende wedstrijden**: horizontale scrollbare kaarten met team logos + kickoff tijd
- **Performance mini-chart**: sparkline of donut chart voor accuracy
- Geen "recente voorspellingen" tabel — dat is de Predictions pagina

### Pick van de Dag
- **Grote hero card** met teams, competitie badge, aftrap tijd
- **Visuele kansen**: donut charts of grote cijfers met kleuren
- **Track record**: lijst van vorige picks met correct/incorrect visueel (groene/rode badges)
- **Streak indicator**: vuur-icoon bij winstreaks

### Voorspellingen (Alle Wedstrijden)
- **Geen grote containers per wedstrijd** — clean rijen in een tabel-achtig format
- Per rij: competitie-badge | teams | tijd | pick (1/X/2) | odds | confidence bar
- **Competitie filter**: horizontale chips met competitie logos
- **Gegroepeerd per dag**, niet per competitie
- **Live badge**: pulserende rode dot bij live wedstrijden

### Resultaten
- **Periode tabs**: deze week / vorige week / maand
- **Samenvatting bovenaan**: totaal | correct | incorrect | winrate — in een clean rij
- **Wedstrijd resultaten**: clean tabel met score + correct/incorrect badge
- **Analytics**: beste competitie, langste streak, ROI — compact

### Track Record
- **Performance over tijd**: lijn chart
- **Per competitie**: bar chart
- **CSV export**: prominente knop

## Technische vereisten voor afbeeldingen
- **Team logos**: API-Football levert logo URLs per team (veld `logo` in teams endpoint)
- **Competitie badges**: API-Football levert league logos
- Backend moet logo URLs opslaan in teams/leagues tabellen en doorgeven via API
- Frontend: `<img>` met fallback naar competitie-naam tekst
- Caching: CDN of locale cache voor logos

## Aanpak
1. Eerst: team/league logo URLs ophalen en opslaan (backend)
2. Dan: globale CSS/theme aanpassen (paarse glows, nieuwe gradients)
3. Dashboard: hero card + quick stats + volgende wedstrijden
4. Predictions: clean tabel met logos
5. BOTD: hero card met track record
6. Results: clean tabel met badges
7. Track Record: charts

## Geschatte tijd
- Backend (logos ophalen + API): 1-2 uur
- CSS/theme: 1 uur
- Dashboard redesign: 2-3 uur
- Predictions redesign: 2-3 uur
- BOTD + Results + Track Record: 2-3 uur
- **Totaal: 8-12 uur** = 2-3 sessies
