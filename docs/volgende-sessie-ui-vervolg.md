# UI Redesign Vervolg — Volgende Sessie

## Feedback Dennis (14 april 2026)

### 1. Your Route TERUGZETTEN (vereenvoudigd)
- Korte uitleg van onze engine (niet technisch, voor normale mensen)
- Hoe het toepasbaar is voor de gebruiker
- Dan keuze: "Tip van de Dag" of "Alle Voorspellingen"
- Zoals het hiervoor was maar simpeler
- Terug in sidebar als eerste item

### 2. Tip van de Dag — TRACK RECORD TOEVOEGEN
- BOTD pagina toont nu alleen de dagelijkse pick
- MOET ook historische performance tonen:
  - Lijst van vorige picks met correct/incorrect
  - Running accuracy (bijv. "71% correct op 43 picks")
  - Win/loss streak
- De backend endpoint `/bet-of-the-day/track-record` bestaat al — frontend moet het tonen

### 3. Voorspellingen pagina — VOLLEDIG REDESIGNEN
Huidige problemen (screenshot 14 april):
- Te veel stat-boxes bovenaan (6.703 / 194 / 3.175) — niet relevant voor gebruikers
- Te veel containers/secties
- Onoverzichtelijk en niet mooi
- Filters werken maar layout is rommelig

Gewenst:
- Clean, overzichtelijk, casino-aesthetic
- Minder boxes/containers
- Wedstrijden in nette rijen zonder zware containers
- Pre-match odds duidelijk zichtbaar (dit werkt al!)
- Confidence met hover tooltip (dit is al gebouwd)
- Competitie filter compacter
- Datum navigatie compacter
- Verwijder onnodige stat counters bovenaan
- Behoud: CompactMatchRow (werkt goed), LeagueSection groupering

### 4. Overige opmerkingen
- Kleuren zijn iets lichter maar nog steeds erg donker
- Moet meer "good vibes" / casino / premium feeling
- Containers overal moeten minder prominent
- Meer witruimte, meer ademruimte

## Wat al gedaan is (deze sessie)
- Sidebar: vereenvoudigd (Settings weg, Weekly Report weg)
- Kleuren: lichter navy in CSS vars
- "Model: Ensemble" badge → "Live updates"
- BOTD: werkt nu (fallback naar backtest)
- i18n: column headers, tooltips, upsell banners
- Redirects: /jouw-route → /dashboard, /weekly-report → /results
- Deploy fix: Vercel CLI gekoppeld aan juiste project
