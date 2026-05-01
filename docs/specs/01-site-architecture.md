═══════════════════════════════════════════════════════
SECTIE 2: SITE-ARCHITECTUUR EN SITEMAP
═══════════════════════════════════════════════════════

TOTALE OMVANG

34 unieke routes × 6 locales = 204 pagina's totaal

LOCALES

en (default), nl, de, fr, es, it
Default route: betsplug.com/ = English
Locale routes: betsplug.com/nl/, betsplug.com/de/, etc.

URL-STRUCTUUR PRINCIPES

1. Localized slugs per content-type folder (/predictions/, /learn/) 
   maar onvertaalde league-namen (Premier League, La Liga blijven 
   internationaal hetzelfde)

2. Lowercase, hyphen-separated, geen trailing slashes
3. Geen file extensions (.html, .php) zichtbaar
4. URLs maximaal 60 karakters waar mogelijk
5. Eén canonical per content-stuk (hreflang voor alternates)

VOLLEDIGE SITEMAP

KERN MARKETING (6 routes)
├── /                         Homepage
├── /how-it-works             Methodology overview (high-level)
├── /track-record             Publieke prediction history (statisch)
├── /pricing                  Subscription tiers + comparison
├── /about                    Over BetsPlug, team, missie
└── /contact                  Contact + support form

PRODUCT — PREDICTIONS (12 routes)
├── /predictions              Hub: 5 sample predictions + alle leagues
├── /predictions/premier-league
├── /predictions/la-liga
├── /predictions/bundesliga
├── /predictions/serie-a
├── /predictions/ligue-1
├── /predictions/champions-league
├── /predictions/europa-league
├── /predictions/eredivisie
├── /predictions/primeira-liga
├── /predictions/championship
└── /bet-types               Pillar: alle bet markets uitgelegd

EDUCATIONAL — LEARN (8 routes)
├── /learn                   Learn hub overzicht
├── /learn/what-is-value-betting
├── /learn/expected-goals-explained
├── /learn/elo-rating-explained
├── /learn/poisson-goal-models
├── /learn/kelly-criterion
├── /learn/bankroll-management
└── /learn/ai-vs-tipsters    Trust-building (BetsPlug authority)

TRUST/CONVERSIE (4 routes)
├── /methodology             Diepgaande engine deep-dive
├── /free-vs-paid           Comparison table tier-features
├── /telegram                Join Telegram free picks landing
└── /faq                     Centrale FAQ pagina

LEGAL (4 routes)
├── /privacy
├── /terms
├── /cookies
└── /responsible-gambling

LOCALIZED SLUG MAPPING

Folder slugs vertalen per locale:

EN: /predictions/...     →  NL: /voorspellingen/...
EN: /learn/...           →  NL: /leren/...
EN: /how-it-works        →  NL: /hoe-het-werkt
EN: /pricing             →  NL: /prijzen
EN: /about               →  NL: /over-ons
EN: /contact             →  NL: /contact
EN: /track-record        →  NL: /track-record (behouden, internationaal)
EN: /methodology         →  NL: /methodologie
EN: /bet-types           →  NL: /weddenschap-types
EN: /faq                 →  NL: /veelgestelde-vragen
EN: /telegram            →  NL: /telegram
EN: /free-vs-paid        →  NL: /gratis-vs-betaald
EN: /privacy             →  NL: /privacy
EN: /terms               →  NL: /voorwaarden
EN: /cookies             →  NL: /cookies
EN: /responsible-gambling → NL: /verantwoord-gokken

DE:
/predictions → /vorhersagen
/learn → /lernen
/how-it-works → /wie-es-funktioniert
/pricing → /preise
/about → /ueber-uns
/methodology → /methodik
/bet-types → /wett-arten
/faq → /haeufig-gestellte-fragen
/free-vs-paid → /kostenlos-vs-bezahlt
/terms → /agb
/cookies → /cookies
/responsible-gambling → /verantwortungsvolles-spielen

FR:
/predictions → /pronostics
/learn → /apprendre
/how-it-works → /comment-ca-marche
/pricing → /tarifs
/about → /a-propos
/methodology → /methodologie
/bet-types → /types-de-paris
/faq → /faq
/free-vs-paid → /gratuit-vs-paye
/terms → /conditions
/cookies → /cookies
/responsible-gambling → /jeu-responsable

ES:
/predictions → /pronosticos
/learn → /aprender
/how-it-works → /como-funciona
/pricing → /precios
/about → /sobre-nosotros
/methodology → /metodologia
/bet-types → /tipos-de-apuestas
/faq → /preguntas-frecuentes
/free-vs-paid → /gratis-vs-pago
/terms → /terminos
/cookies → /cookies
/responsible-gambling → /juego-responsable

IT:
/predictions → /pronostici
/learn → /imparare
/how-it-works → /come-funziona
/pricing → /prezzi
/about → /chi-siamo
/methodology → /metodologia
/bet-types → /tipi-di-scommesse
/faq → /faq
/free-vs-paid → /gratis-vs-pagamento
/terms → /termini
/cookies → /cookie
/responsible-gambling → /gioco-responsabile

LEARN ARTIKELEN — LOCALIZED SLUGS

/learn/what-is-value-betting:
- NL: /leren/wat-is-value-betting
- DE: /lernen/was-ist-value-betting
- FR: /apprendre/qu-est-ce-que-le-value-betting
- ES: /aprender/que-es-value-betting
- IT: /imparare/cos-e-il-value-betting

/learn/expected-goals-explained:
- NL: /leren/expected-goals-uitgelegd
- DE: /lernen/expected-goals-erklaert
- FR: /apprendre/expected-goals-explique
- ES: /aprender/expected-goals-explicado
- IT: /imparare/expected-goals-spiegato

/learn/elo-rating-explained:
- NL: /leren/elo-rating-uitgelegd
- DE: /lernen/elo-rating-erklaert
- FR: /apprendre/classement-elo-explique
- ES: /aprender/clasificacion-elo-explicado
- IT: /imparare/classifica-elo-spiegato

/learn/poisson-goal-models:
- NL: /leren/poisson-doelpunten-modellen
- DE: /lernen/poisson-tor-modelle
- FR: /apprendre/modeles-poisson-buts
- ES: /aprender/modelos-poisson-goles
- IT: /imparare/modelli-poisson-gol

/learn/kelly-criterion:
- NL: /leren/kelly-criterium
- DE: /lernen/kelly-kriterium
- FR: /apprendre/critere-de-kelly
- ES: /aprender/criterio-de-kelly
- IT: /imparare/criterio-di-kelly

/learn/bankroll-management:
- NL: /leren/bankroll-management
- DE: /lernen/bankroll-management
- FR: /apprendre/gestion-de-bankroll
- ES: /aprender/gestion-de-bankroll
- IT: /imparare/gestione-del-bankroll

/learn/ai-vs-tipsters:
- NL: /leren/ai-vs-tipsters
- DE: /lernen/ki-vs-tipster
- FR: /apprendre/ia-vs-pronostiqueurs
- ES: /aprender/ia-vs-tipsters
- IT: /imparare/ia-vs-tipster

/predictions HUB-PAGE SPECIFICATIE

De /predictions page (en alle gelocaliseerde versies) toont:

1. Sample predictions sectie met 5 gratis predictions
   Mix van:
   - 2 highest-confidence predictions van vandaag
   - 2 verschillende leagues' upcoming matches
   - 1 most popular match (highest expected viewership)
   
   Per prediction toon:
   - Home team + away team (logo's)
   - League badge
   - Kickoff datum/tijd
   - Voorspelling (1X2, Over/Under, BTTS afhankelijk van match)
   - Confidence percentage
   - Link naar detail (op app.betsplug.com)
   
   Boven de 5 predictions: header "Today's free AI predictions"
   Onder de 5 predictions: CTA "Get unlimited daily predictions"

2. League hub grid sectie
   Visuele grid met alle 10 league logo's, klikbaar naar 
   /predictions/{league}
   Header: "Predictions per league"

3. Methodology preview sectie
   Korte uitleg engine + link naar /methodology

4. Track record preview sectie
   Statische teaser van track record + link naar /track-record

5. Trust signals
   - Methodology snippet (Elo + Poisson + ML)
   - "Predictions locked before kickoff"
   - "30+ leagues, 6 languages"

6. Centrale FAQ over predictions (5 vragen)

DATA-FETCHING STRATEGY VOOR /predictions

Hybride: ISR + client-side polling

Server-side (build/revalidation):
- ISR met revalidate = 60 seconds
- Astro server endpoint fetcht predictions van app.betsplug.com API
- Initial HTML bevat verse data per minute

Client-side (na pageload):
- JavaScript polling elke 30 seconds
- Vervangt prediction kaarten met latest data
- Graceful fallback als API niet beschikbaar

Resultaat:
- Crawlers: zien altijd recente data (max 60 sec oud)
- Bezoekers: zien live data (max 30 sec oud na pageload)
- TTFB: <100ms (statische HTML met cached data)
- Geen rate-limit risico op API

INTERNAL LINKING ARCHITECTUUR

Hub-and-spoke model met cross-linking:

/predictions = central hub
├── linkt naar elke /predictions/{league} page
├── elke /predictions/{league} linkt terug naar /predictions
├── alle league pages linken naar /methodology, /track-record, /pricing
└── alle league pages tonen 5-10 sample predictions

/learn = educational hub
├── linkt naar elk learn-artikel
├── elk learn-artikel linkt naar /learn (breadcrumb)
├── learn-artikelen onderling linken (related articles sectie)
└── learn-artikelen linken contextueel naar /methodology en /predictions

/methodology = trust anchor
├── linkt naar relevante /learn-artikelen voor diepgang
├── linkt naar /track-record voor bewijs
└── linkt naar /pricing voor conversie

Footer-links: alle hoofdpagina's, alle 10 leagues, alle 7 learn-artikelen, 
alle legal pages

PAGINA-PRIORITEIT VOOR HOMEPAGE-LINKS

Op homepage prominent gelinkt (boven de fold of in hero):
- /predictions (primary CTA)
- /pricing
- /how-it-works

Secondary linking (verder op homepage):
- /track-record (trust)
- /methodology (trust)
- /learn (educational hook)
- /predictions/{top 3 leagues} (per locale relevant)

301 REDIRECT-MAPPING

Huidige live URLs → nieuwe URLs (alleen Engelse versies, locale-versies 
bestaan momenteel niet als 404):

URLs die behouden blijven (geen redirect nodig):
- /                                    (homepage)
- /pricing                             (zelfde)
- /how-it-works                        (zelfde)
- /contact                             (zelfde)
- /privacy                             (zelfde)
- /terms                               (zelfde)
- /cookies                             (zelfde)
- /responsible-gambling                (zelfde)
- /track-record                        (zelfde)

URLs die schrappen (301 naar logische bestemming):
- /b2b                                 → /contact
- /engine                              → /methodology

URLs die hernoemen:
- /about-us                            → /about
- /match-predictions                   → /predictions
- /match-predictions/premier-league    → /predictions/premier-league
- /match-predictions/la-liga           → /predictions/la-liga
- /match-predictions/bundesliga        → /predictions/bundesliga
- /match-predictions/serie-a           → /predictions/serie-a
- /match-predictions/ligue-1           → /predictions/ligue-1
- /match-predictions/champions-league  → /predictions/champions-league
- /match-predictions/eredivisie        → /predictions/eredivisie

URLs die samenvoegen tot pillar:
- /bet-types/both-teams-to-score       → /bet-types#btts
- /bet-types/double-chance             → /bet-types#double-chance
- /bet-types/draw-no-bet               → /bet-types#draw-no-bet
- /bet-types/over-2-5-goals            → /bet-types#over-25

URLs die ongewijzigd blijven (alleen content vervangen):
- /bet-types                           (zelfde, nu pillar)
- /learn (en alle /learn/* artikelen)  (zelfde URLs, content herschreven)

NIEUWE URLs (geen redirect, fresh routes):
- /predictions/europa-league
- /predictions/primeira-liga
- /predictions/championship
- /methodology
- /free-vs-paid
- /telegram
- /faq
- /learn/ai-vs-tipsters

XML SITEMAP REQUIREMENTS

Genereer sitemap.xml met:
- Alle 204 URLs (34 routes × 6 locales)
- xhtml:link alternates voor hreflang per URL
- lastmod dates per pagina
- changefreq: 'daily' voor /predictions/*, 'weekly' voor andere
- priority: 1.0 voor /, 0.9 voor /predictions, 0.8 voor /pricing 
  + /predictions/*, 0.7 voor andere, 0.5 voor /legal/*

Voorbeeld URL entry met hreflang:

<url>
  <loc>https://betsplug.com/predictions/premier-league</loc>
  <xhtml:link rel="alternate" hreflang="en" 
    href="https://betsplug.com/predictions/premier-league"/>
  <xhtml:link rel="alternate" hreflang="nl" 
    href="https://betsplug.com/nl/voorspellingen/premier-league"/>
  <xhtml:link rel="alternate" hreflang="de" 
    href="https://betsplug.com/de/vorhersagen/premier-league"/>
  <xhtml:link rel="alternate" hreflang="fr" 
    href="https://betsplug.com/fr/pronostics/premier-league"/>
  <xhtml:link rel="alternate" hreflang="es" 
    href="https://betsplug.com/es/pronosticos/premier-league"/>
  <xhtml:link rel="alternate" hreflang="it" 
    href="https://betsplug.com/it/pronostici/premier-league"/>
  <xhtml:link rel="alternate" hreflang="x-default" 
    href="https://betsplug.com/predictions/premier-league"/>
  <lastmod>2026-05-01</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>

ROBOTS.TXT VEREISTEN

User-agent: *
Allow: /
Sitemap: https://betsplug.com/sitemap.xml

# Geen disallows voor marketing site (alles indexeerbaar)
# app.betsplug.com heeft eigen robots.txt met Disallow: /
