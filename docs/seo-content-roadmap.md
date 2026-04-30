# SEO content-roadmap — backlog na audit-sessie 2026-05-01

> Deze items zijn surfaced uit de comprehensive SEO audit maar
> vereisen **content-werk** (copywriting, vertaling, asset-creatie)
> dat niet door een agent kan worden opgelost. Backlog voor het
> content-team / een externe copywriter.

## Hoge prioriteit (week 1-4 na deploy)

### A1. Hand-translate over-160-char EN+NL meta descriptions
12 descriptions in `src/data/page-meta.ts` zijn hand-authored EN+NL
maar overschrijden 160 chars (zichtbaar in audit log). Reduceer tot
≤155 chars met behoud van merkstem:

| Route | Locale | Lengte |
|---|---|---|
| `/` | NL | 167 |
| `/about-us` | EN | 165 |
| `/track-record` | EN | 173 |
| `/track-record` | NL | 167 |
| `/bet-of-the-day` | EN | 166 |
| `/learn` | EN | 172 |
| `/learn` | NL | 168 |
| `/bet-types` | EN | 165 |
| `/bet-types` | NL | 161 |
| `/b2b` | EN | 167 |
| `/checkout` | NL | 171 |
| `/pricing` | NL | 184 |

Alle andere locales (DE/FR/ES/IT/SW/ID/PT/TR/PL/RO/RU/EL/DA/SV) zijn
al automatisch getrimd door `scripts/trim-page-meta-descriptions.mjs`.

### A2. Trim 2 over-60-char Sanity hub titles
- `/nl/wedstrijd-voorspellingen/premier-league` (62 chars,
  Sanity field `metaTitle.nl`)
- `/de/spiel-vorhersagen/premier-league` (61 chars,
  Sanity field `metaTitle.de`)

Edit in Sanity Studio → leagueHub → Premier League → metaTitle.

### A3. Backlog van ~280 EN-leak high-impact keys (DE/FR/ES/IT)
Uit vorige sessie. Run:
```
cd frontend && node scripts/audit-en-leaks.mjs && \
  node scripts/i18n-leak-summary.mjs --top=10
```
Pak de HIGH-impact leaks per locale, hand-vertaal in batches via
`scripts/apply-i18n-batch.mjs`.

## Medium prioriteit (week 4-8)

### B1. Author-bio's voor learn-pillar Articles
De Article schemas referencen `Cas Sanders` en `Dennis Sanders`
Person @ids. Op `/about-us` ontbreken nog publieke bio's met:
- Foto (square crop, ≥400×400)
- Beroepsbeschrijving (1-2 zinnen)
- Expertise-areas (matchend met Person.knowsAbout)
- LinkedIn / X / GitHub links (drives Person.sameAs)

Voeg toe aan Sanity (over-page schema heeft `founders[]` veld) en
backfill in Organization schema's `founder[].sameAs`.

### B2. Editorial-guidelines page (`/editorial-guidelines`)
E-E-A-T trust-signal. Documenteert hoe BetsPlug content beoordeelt:
- Hoe model-accuracy wordt geverifieerd
- Update-cadence per pillar
- Wie reviewt content vóór publicatie
- Conflict-of-interest beleid (geen affiliate links naar bookmakers)
- Correctie-protocol

Klein (~600-800 woorden), publiceer onder hoofdmenu of footer.

### B3. Methodology white paper of expanded `/how-it-works`
Hierin:
- Pipeline-walkthrough met diagrammen
- Welke datapoints uit welke bron (api-sports.io)
- Welke modellen, hoe gewogen in ensemble
- Walk-forward validation methodologie
- Backtest-procedure + leak-prevention

Linkt aan Article schema's `cite` velden voor academic-style
citation. ~2500 woorden.

### B4. Per-route H1 + first-paragraph audit voor primary keyword
Verifieer dat elk van de 19 marketing-routes een primary keyword
heeft die hoog op de pagina staat. Audit-script
`scripts/check-keyword-on-page.mjs` zou hier waarde toevoegen
(future).

## Lage prioriteit (vervolg-rollout)

### C1. Glossary / wiki sectie voor "what is X" queries
Korte definities (1-2 paragrafen) voor:
- Expected goals (xG) - bestaat al als pillar, link daar naartoe
- Elo rating
- Poisson distribution
- Brier score
- Wilson confidence interval
- Implied probability
- Closing line value (CLV)
- ROI (sports analytics context)
- Bankroll
- etc.

Pages onder `/glossary/[term]` met DefinedTerm schema.

### C2. Comparison content
"BetsPlug vs alternative" pages — privacy-aware (niet de concurrent
direct noemen, generieke alternatives). Beschrijft USP zonder
spam-signal.

### C3. Use-case landings
- `/accumulator-research`
- `/value-betting-research`
- `/in-play-statistics`
- `/pre-match-research`

Elke ~1200 woorden, eigen H1 + primary keyword cluster.

### C4. League-specific team pages (waar wettelijk toegestaan)
`/match-predictions/eredivisie/feyenoord`, etc. — voor major teams
in major leagues. Long-tail traffic. Volume: 5 leagues × ~10 teams
= 50 pages. ~600 woorden uniek per team.

## Wat NIET doen

- **Geen blog/news sectie** — verwijderd in 2026-04-27 commit. De
  pillar+league+bet-type structure dekt de educational+local-SEO
  rol af. Re-introduceren zou de pijngrens van content-onderhoud
  buiten de team-bandbreedte tillen.
- **Geen automatische translations voor bovenstaande items** —
  hand-translate of leave EN. Google Translate fallbacks zijn de
  oorzaak van de April-collapse (gisteren post-mortem'd).

## Tooling die het content-team kan gebruiken

- `scripts/audit-en-leaks.mjs` — vind keys die nog EN-fallback
  serveren in andere locales
- `scripts/i18n-leak-summary.mjs` — categoriseer leaks per
  HIGH/MEDIUM/LOW SEO-impact
- `scripts/apply-i18n-batch.mjs` — apply hand-vertaalde batches
  in JSON-formaat naar alle 14 locale-files in één shot
- `scripts/check-no-foreign-leaks.mjs` — pre-commit guard tegen
  hardcoded ES/DE/FR/IT in JSX
- `scripts/check-no-dutch-leaks.mjs` — pre-commit guard tegen
  hardcoded NL in JSX
- `scripts/seo-comprehensive-audit.mjs` — runnable per deploy
  voor regression-detection

CI runs deze automatisch via `.github/workflows/seo-checks.yml`.
