# Fase 7 — Positionerings-audit (educatief, niet gambling)

> Datum: 2026-04-26
> Doel: bevestigen dat betsplug.com een educatief data-platform is, identificeren waar tekst, structured data of links anders suggereren, en concrete fixes voorbereiden.

## 7.1 Eindoordeel — algehele positionering

**Overall is de site al positief gepositioneerd**: legal-pages, responsible-gambling, terms en de league-hub-methodologie benadrukken expliciet *"BetsPlug is not a bookmaker"*, *"educational only"*, *"no betting advice"*. De toon is data-driven, met doorsluizingen naar transparantie (model uitleg, public track record).

**Maar**: er zijn **twee structured-data fouten** die alleen al een aanzienlijke schade aan rankings kunnen verklaren — los van het i18n-probleem. Plus er zijn marketing-CTA's ("Start Winning", "Free Pick of the Day") die op de grens van gambling-toon staan en internationaal in een aantal markten echt risico opleveren.

## 7.2 Structured-data audit — KRITISCHE VONDSTEN

### 7.2.1 Bedreigde misuse #1 — Self-serving AggregateRating

In `frontend/src/components/seo/json-ld.tsx:225-254` (`ServiceJsonLd`) en `frontend/src/app/pricing/page.tsx:91-100` (`PricingProductJsonLd`) wordt een AggregateRating geëmitteerd met:

```json
{
  "@type": "AggregateRating",
  "ratingValue": "4.6",
  "ratingCount": "312",
  "bestRating": "5"
}
```

Deze rating:
- staat **op iedere homepage en op /pricing**, ook in alle 16 locales (geverifieerd: 2 occurrences in zowel `EN_root.html`, `EN_pricing.html`, `de.html` als `de_pricing.html`),
- heeft **geen overeenkomstige verifieerbare reviews op de pagina** (geen Review-objecten met author, datePublished, reviewRating). Er zijn wel testimonial-componenten op de homepage (`<Testimonials/>`), maar die emitteren geen `Review` schema en zijn ook niet 1-op-1 gekoppeld aan een 4.6/5-score.
- is **per locale identiek** — dat is technisch consistent, maar versterkt de indruk dat het verzonnen is.

> **Google's eigen structured-data-richtlijnen**: *"Don't include star ratings unless they're actual ratings from real users on this page. Aggregator sites that don't allow users to write reviews in the same place where the rating data is displayed shouldn't have rating data."* Dit is de definitie van **self-serving structured data**, en is sinds 2019 aanleiding voor handmatige acties of algoritmische onderdrukking van rich snippets en organische rankings.
>
> Dit is een serieuze ranking-killer en kan op zichzelf de brand-term collapse verklaren — los van de i18n-mess.

**Fix Fase 10**:
- Verwijder `aggregateRating` uit zowel `ServiceJsonLd` als de aanroep in `pricing/page.tsx`.
- **Niet vervangen door echte ratings** tot er een onafhankelijke bron (bv. Trustpilot, geverifieerde Capterra/G2-listings) bestaat met **eigen schema-emit op hun domein** waar BetsPlug aan kan refereren via `sameAs`. Pas op een ander moment, niet in deze recovery, opnieuw rating-schema's introduceren.

### 7.2.2 Bedreigde misuse #2 — `lowPrice: "0.01"` blijft Bronze-trial-claim leven

`ServiceJsonLd` (root layout, dus op iedere pagina):

```json
{
  "@type": "AggregateOffer",
  "priceCurrency": "USD",
  "lowPrice": "0.01",
  "highPrice": "29.99",
  "offerCount": 3
}
```

Issues:
- `lowPrice: "0.01"` verwijst naar de oude Bronze-trial van €0,01 die op 2026-04-25 is afgeschaft. De huidige Free Access tier kost €0.
- `priceCurrency: "USD"` terwijl de site Europese pricing in EUR voert.
- `offerCount: 3` terwijl er nu 4 tiers zijn (Free Access, Silver, Gold, Platinum).
- `highPrice: "29.99"` — Platinum is een eenmalige €199, niet 29.99 recurring. Dat is dan de Gold-prijs bij yearly billing. Onduidelijk of het de juiste hoogste prijs is.

**Fix Fase 10**:
- Update `ServiceJsonLd` naar EUR, lowPrice "0", highPrice "199" (Platinum lifetime), offerCount 4 (of weghalen). Of de hele `AggregateOffer` weg en alleen de `Product+Offer`-emit op /pricing houden — dat is schoner.

### 7.2.3 WebSite SearchAction wijst naar disallowed pad

`WebSiteJsonLd` heeft:
```json
"potentialAction": {
  "@type": "SearchAction",
  "target": { "urlTemplate": "https://betsplug.com/search?q={search_term_string}" },
  ...
}
```

Maar `robots.txt` bevat `Disallow: /search`. Google kan dus de SearchAction-target niet daadwerkelijk crawlen om validatie te doen. Niet kritisch (Google laat dit soft-fail) maar inconsistent — verwijderen of `/search` whitelisten.

### 7.2.4 Geen `EducationalOrganization`-framing

Organisatie wordt nu als plain `Organization` gemodelleerd. Voor een educatief data-platform is `EducationalOrganization` of een specifieker subtype passender en helpt Google de positionering te begrijpen.

```json
{
  "@type": ["Organization", "EducationalOrganization"],
  "knowsAbout": [
    "Football statistics",
    "Sports analytics",
    "Probabilistic modeling",
    "Elo rating systems",
    "Poisson goal models",
    "Bankroll management education"
  ]
}
```

Niet kritisch maar een goedkope verbetering die de framing versterkt.

### 7.2.5 `Organization.sameAs` is mager voor brand-disambiguation

```json
"sameAs": [
  "https://x.com/betsplug",
  "https://instagram.com/betsplug",
  "https://youtube.com/@betsplug",
  "https://t.me/BetsPluggs"
]
```

Disambiguation tegen `betplug.com`, `plugbets.com`, `yourbetplug.com` zou hier sterker zijn met:
- LinkedIn company page,
- Eventueel Trustpilot business profile,
- GitHub-org als die bestaat,
- Crunchbase / Wikipedia indien van toepassing.

In Fase 11 als follow-up.

## 7.3 Copy-toon — gambling-trigger scan

Scan van `'(bet now|place your bet|wager|gamble|sign up to bet|guaranteed wins|sure win|free picks|lock\b|bet types|tipster|bookmaker)'` over de hele frontend.

| # | Bron | Voorbeeld | Beoordeling | Voorgestelde herformulering |
|---|------|-----------|-------------|------------------------------|
| P1 | `nav.startFreeTrial` (`messages.ts:23`) | `"Start Winning"` | ❌ Sales-CTA met direct gambling-suggestie | `"Start exploring"` / `"Start the data tour"` |
| P2 | `nav.getStarted` (`messages.ts:25`) | `"Get Started"` | ✅ Neutraal | houden |
| P3 | `topbar.v.scarcity.text` | `"Today's top picks lock at kick-off, act before the whistle"` | ⚠️ "Lock" heeft betting-connotatie + scarcity druk | `"Today's data snapshot freezes at kick-off — view it before the match starts"` |
| P4 | `topbar.v.fomo.text` | `"... today's pick is already live"` | ⚠️ FOMO + gambling | `"... today's data is already published"` |
| P5 | `topbar.v.reciprocity.text` | `"Free Pick of the Day"` | ⚠️ "Pick" is gambling-jargon | Keep brand product name "Pick of the Day" maar herformuleer als `"Today's data spotlight"` of `"Daily AI analysis"` |
| P6 | `riskReversal.guaranteeTitle` | `"14-day money-back guarantee"` | ✅ Refund policy, niet gambling-guarantee | houden |
| P7 | `home.value.subtitle` (messages.ts:198) | `"Most subscribers burn through €15 in a single weekend on gut-feeling stakes."` | ⚠️ Direct gambling-narratief, framet de gebruiker als gokker | `"Many football fans spend more on impulse decisions than on tools that actually help them understand the game."` |
| P8 | `engine.disclaimers.edu.body` | `"BetsPlug provides statistical analysis of historical sports data. All predictions are presented as simulations for educational purposes. Nothing on this site constitutes betting advice, financial advice, or a guarantee of future results."` | ✅ Sterk educatief disclaimer | houden — uitbreiden naar homepage hero |
| P9 | `bet-types/page.tsx:120` | `"... when they hide real value, and the tipster traps to avoid"` | ✅ Anti-tipster framing | houden |
| P10 | `learn/page.tsx:110` | `"... stop relying on tipster guesswork"` | ✅ Anti-tipster | houden |
| P11 | `match-predictions/.../league-hub-methodology.tsx:83` | `"We're not a tipster. We're a data pipeline with a public track record."` | ✅ Sterk educatief | houden |
| P12 | `terms/page.tsx:50` | `"BetsPlug is not a bookmaker."` | ✅ | houden |
| P13 | `responsible-gambling/page.tsx:32` | `"BetsPlug is an analytics platform, not a bookmaker. Our AI football predictions are educational ..."` | ✅ Sterk | houden |
| P14 | `home.heroSubtitle` | mentions "AI football predictions" + "Every pick is locked before kickoff and tracked publicly" | ⚠️ "locked" past in transparency-context maar is dubbelzinnig | overweeg `"Every prediction is timestamped before kickoff and tracked publicly"` |
| P15 | `seo.pillar4*` (messages.ts:664-666) | `"Daily Pick of the Day"` als SEO pillar copy | Acceptabel maar gambling-toon | overweeg "Daily AI football analysis" |
| P16 | `home.value.title` | `"... daily Pick of the Day, and a fully public track record, for less than that one lost accumulator."` (messages.ts:198) | ⚠️ "lost accumulator" is hardcore gambling-frame | `"for less than the cost of a few entry-level subscriptions"` |
| P17 | Pricing tier descriptions | "Pick of the Day", "Bet of the Day" | brand-product-namen | mogen blijven als productnaam, maar copy eromheen moet educatief zijn |

> Brand-product-naam "Pick of the Day" is een **product feature** en is acceptabel om te houden. Het is jargon, maar geen actieve aanmoediging om te gokken. De "Start Winning" CTA + "lost accumulator"-frase + "burn through €15 on gut-feeling stakes" zijn de scherpste punten die geherformuleerd moeten worden.

## 7.4 Disclaimers — toestand en aanbeveling

| Plek | Aanwezig? | Status |
|------|:---:|--------|
| Homepage hero | ❌ | Toevoegen — kort, één regel onder de hoofd-CTA |
| Footer (sitewide) | ⚠️ | Korte verwijzing naar `/responsible-gambling` aanwezig in NL/EN, maar geen disclaimer-tekst zelf |
| /pricing | ❌ | Disclaimer onderaan plaatsen |
| /match-predictions | ❌ | "These probabilities are model outputs for educational use" |
| /engine | ✅ | `engine.disclaimers.edu.body` reeds aanwezig |
| /responsible-gambling | ✅ | Volledig pagina-niveau dekkend |
| /terms | ✅ | Sterk |
| Structured data | ❌ | Geen disclaimer-property; `description` in Organization kan worden aangepast om educatief framework expliciet te maken |

**Voorgestelde sitewide disclaimer (footer)**:

> *"BetsPlug provides statistical data and analysis for educational and informational purposes only. We do not provide betting advice, do not facilitate wagering, and do not encourage betting. Users are responsible for their own decisions."*

Per locale vertalen voor de "Klaar"-locales (en, nl, de, fr, es, it).

## 7.5 Outbound links — affiliate / bookmaker

Scan op `rel="nofollow"` of `rel="sponsored"` in JSX componenten: **geen treffers** in `frontend/src/`. Dat betekent:
- Of er zijn geen outbound links naar bookmakers (waarschijnlijk: dit is een platform, geen affiliate-vergelijker),
- Of bestaande outbound links zonder `rel` zijn potentieel kwetsbaar voor Google's "anchor text spam" detection.

`bet-of-the-day` en `results` referencen "bookmaker odds" maar dat zijn data-attributes (origin van de odds-snapshot), niet daadwerkelijke outbound links.

`Telegram` link in footer is wel outbound (`https://t.me/BetsPluggs`) — dat is een eigen kanaal en hoeft niet `nofollow`.

> **Geen acute fix nodig**, maar bij toekomstige Telegram-CTAs of ankerpartner-functionaliteit moeten alle outbound betting-gerelateerde links verplicht `rel="nofollow sponsored"` krijgen.

## 7.6 Leeftijd-gate / disclaimers-flow

`responsible-gambling/page.tsx:53`: *"You must be at least 18 years old (or the legal gambling age in your country, whichever is higher) to use BetsPlug."*

Dit is een **passieve disclaimer in de pagina**, geen modal-acknowledge-flow. Conform de eis "Geen leeftijd-gate flow die als gambling-acknowledgment functioneert" — ✅. Goed zo.

## 7.7 Open Graph / Twitter Card — toon en framing

Audit van `<meta property="og:*">` van EN homepage:

```
og:title:        AI-Powered Football Predictions · BetsPlug
og:description:  AI-powered football predictions with live probabilities, Elo ratings,
                 and a verified track record across 15+ leagues.
og:type:         website
twitter:card:    summary_large_image
twitter:title:   AI-Powered Football Predictions · BetsPlug
twitter:description: AI-powered football predictions with live probabilities, ...
```

Tone is data-driven, niet "bet now". ✅

Per non-EN locale wordt og:title/description correct gespiegeld vanuit PAGE_META — behalve voor `ru/`, `/articles`, `/about-us`, `/privacy`, `/terms`, en alle locales op `/how-it-works` description (zie Fase 6.3) waar dezelfde leak-bron geldt.

## 7.8 Educatieve framing — voorgesteld structureel patroon

Voor de "Klaar"-locales en alle nieuwe content geldt vanaf nu:

1. **Title** mag het product noemen, maar moet eindigen in een kennis-/data-noun (bv. *"Premier League Statistics & AI Match Probabilities · BetsPlug"* > *"Free Premier League Picks ..."*).
2. **Description** mag CTA bevatten maar moet een data-claim hebben (bv. *"... explore probabilities, Elo ratings and verified historical performance ..."*).
3. **Body H1**: voorkeur voor *"... Statistics"*, *"... Data"*, *"... Analysis"* in plaats van *"... Picks"* of *"... Tips"*. Brand-product-naam *"Pick of the Day"* mag in body, niet in H1.
4. **CTA-knoppen**: *"View today's data"* / *"See the analysis"* / *"Start exploring"* in plaats van *"Start Winning"*.
5. **Sitewide footer disclaimer** zoals 7.4.
6. **Schema.org**: `Organization + EducationalOrganization` types (multi-type), `knowsAbout` met statistical/data-analytics keywords, **geen** AggregateRating.

## 7.9 Critical-bug-list voor Fase 10

In volgorde van impact:

1. **Verwijder AggregateRating uit `ServiceJsonLd` en `PricingProductJsonLd`-aanroep**. Single most likely contributor to brand-term ranking collapse alongside the i18n issues. (json-ld.tsx + pricing/page.tsx)
2. **Update `ServiceJsonLd.offers`** naar EUR, juiste prijzen, juiste offerCount of overweeg verwijdering en alleen Product+Offer op /pricing.
3. **`nav.startFreeTrial` → `"Start exploring"`** of vergelijkbaar (en alle 16 locales als ze voor dat label een vertaling hebben).
4. **Sitewide footer disclaimer** toevoegen, voor 6 "Klaar"-locales vertaald.
5. **Homepage value-proposition copy** ("burn through €15 ...", "lost accumulator") vervangen door educatieve framing.
6. **Schema.org Organization → ["Organization", "EducationalOrganization"]** + `knowsAbout`-array.
7. **WebSite SearchAction**: ofwel `/search` whitelisten in robots, ofwel SearchAction verwijderen.
8. **Outbound links** (toekomstig): forceer `rel="nofollow sponsored"` op elke link naar een bookmaker-domein.

---

**Volgende stap:** Fase 8 — hygiene (OG/CWV/images/headings/security headers).
