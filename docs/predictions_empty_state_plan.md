---
title: UX — eerlijke empty-state op /predictions → Resultaten & uitslagen
date: 2026-04-18
scope: frontend only (voorstel, nog niet geïmplementeerd)
---

# UX — eerlijke empty-state op /predictions

## Huidige gedrag

Bestand: `frontend/src/app/(app)/predictions/page.tsx`, regels 1376-1397.

De pagina rendert twee empty-states:

1. `upcomingFixtures.length === 0`  
   → "Geen komende wedstrijden in de komende 7 dagen /  
   Er zijn geen geplande wedstrijden gevonden in de database."

2. `filtered.length === 0` (filters te streng)  
   → "Geen voorspellingen die aan je filters voldoen /  
   Pas de competitie- of betrouwbaarheidsfilters hierboven aan."  
   + knop "Filters wissen".

Maar er is een **derde** situatie die nu onder case 2 valt: er zijn
wél wedstrijden op de gekozen datum, maar niet één heeft een
voorspelling. De frontend-filter op regel 1170
(`items = items.filter((f) => f.prediction != null)`) gooit dan
alles weg en de gebruiker krijgt "pas je filters aan" te zien —
filters wissen helpt niet, want het gaat niet om filters.

## Waarom dit misleidend is

De user ziet "0 results" en kan niet afleiden:

- Is het mijn filter?
- Zijn er geen wedstrijden die dag?
- Hebben we geen voorspelling gedaan (en zo nee, waarom)?
- Is het systeem kapot?

Uit het pipeline-rapport (`docs/pipeline_gap_report.md`) blijkt dat
scenario 3 op dit moment de realiteit is voor 17 en 18 april.

## Voorgestelde empty-state-logica

Drie duidelijk onderscheiden situaties, elk met eigen copy:

### Situatie A — geen wedstrijden op deze datum

```
if (rawFixtures.length === 0)
```

Copy (bestaande keys, geen aanpassing):

- NL: "Geen wedstrijden op deze datum"
- EN: "No matches on this date"
- Sub: "Kies een andere dag met de datumkiezer boven."
- Geen knop — filters wissen helpt niet.

### Situatie B — wedstrijden maar geen voorspellingen

```
if (rawFixtures.length > 0 && fixturesWithPrediction.length === 0)
```

Copy (nieuwe keys):

- NL: "Voor deze wedstrijden is nog geen voorspelling gegenereerd"
- EN: "No forecasts have been generated for these matches yet"
- Sub NL: "Onze modellen draaien elke 10 min op nieuwe fixtures.
  Als een wedstrijd net is ingeplant kan dit tot 20 min duren.
  Je ziet hier alleen pre-match voorspellingen — retroactieve
  simulaties worden apart bijgehouden."
- Sub EN: "Our models run every 10 min on new fixtures. If a match
  was only just scheduled it can take up to 20 min to appear here.
  Only pre-kickoff forecasts are shown — retroactive simulations
  are tracked separately."
- Knop: link naar `/engine` ("Hoe werkt ons model?") in plaats van
  "Filters wissen".

### Situatie C — voorspellingen maar filters te streng

```
if (fixturesWithPrediction.length > 0 && filtered.length === 0)
```

Copy (huidige keys hergebruiken):

- NL: "Geen voorspellingen die aan je filters voldoen"
- EN: "No predictions match your filters"
- Sub: vertel **hoeveel** voorspellingen er zijn zonder filter:
  "Er zijn X voorspellingen beschikbaar. Je filters (tier Y,
  competitie Z) laten er 0 door."
- Knop: "Filters wissen" (bestaand gedrag).

## Code-implementatie (high-level)

Wijzigingen alleen in `frontend/src/app/(app)/predictions/page.tsx`:

```ts
// Nieuwe derived values:
const rawFixtures = upcomingFixtures;                           // al aanwezig
const fixturesWithPrediction = rawFixtures.filter(
  (f) => f.prediction != null,
);

// Bestaande "filtered" blijft staan maar consumeert nu
// fixturesWithPrediction als startpunt (regel 1170 weg halen).

// Render-logica:
{rawFixtures.length === 0 ? (
  <EmptyStateA />
) : fixturesWithPrediction.length === 0 ? (
  <EmptyStateB />
) : filtered.length === 0 ? (
  <EmptyStateC total={fixturesWithPrediction.length} />
) : (
  // normale lijst
)}
```

Plus 4 nieuwe i18n-keys (EN + NL alleen, conform `npm run translate`
restrictie):

```
"pred.emptyNoMatches":            "Geen wedstrijden op deze datum"
"pred.emptyNoMatchesDesc":        "Kies een andere dag ..."
"pred.emptyNoForecasts":          "Voor deze wedstrijden is nog geen voorspelling gegenereerd"
"pred.emptyNoForecastsDesc":      "Onze modellen draaien ..."
```

(Plus EN-equivalenten. Bestaande `pred.noMatchingPredictions*` blijft
voor situatie C.)

## Open productbeslissing

De sub-tekst van situatie B verwijst naar onze interne cadans
("elke 10 min"). Twee opties:

- **B1** — transparant zoals hierboven. Voordeel: eerlijk, lost
  "hoe weet ik of het werkt?" op. Nadeel: legt implementatie-details
  bloot.
- **B2** — neutraal: "De voorspelling voor deze wedstrijd is nog
  niet beschikbaar." Voordeel: minder brittle als we ooit de
  cadans wijzigen. Nadeel: minder uitleg.

Ik neig naar B1 zolang de echte cadans inderdaad 10 min is en blijft;
anders B2.

## Samenhang met pipeline-fix

Deze UX-fix is onafhankelijk nuttig: zelfs nadat fix 2 uit
`pipeline_gap_report.md` live staat, kan er altijd **even** een
gat zijn tussen fixture-ingestion en forecast-generation. Daar moet
de empty-state een eerlijk antwoord op geven.

## Geen code-wijziging

Enkel voorstel. Wacht op akkoord.
