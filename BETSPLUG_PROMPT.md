# BetsPlug - Complete Fix & Launch Prompt

## Context
BetsPlug (voorheen Sports Intelligence Platform / SIP) is een sport analytics tool gebouwd met:
- **Backend:** Python FastAPI + PostgreSQL + Redis + Celery
- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Data:** Football-Data.org API (gratis tier: PL, La Liga, Bundesliga, Serie A, Ligue 1, CL, Eredivisie, Championship)
- **Modellen:** Elo Rating, Poisson Score, Logistic Regression, Ensemble
- **Deployment:** Docker Compose (6 containers)

## Wat er NIET werkt en gefixt moet worden

### PRIORITEIT 1: Frontend build errors
De frontend crashed door TypeScript type mismatches:
- `types/api.ts` heeft `FixturesResponse` met `fixtures[]` maar sommige pagina's verwachten `matches[]`
- `weekly-report/page.tsx` cast `Fixture[]` naar `FixtureResultItem[]` - types overlappen niet
- Alle pagina's die `/api/fixtures/*` endpoints gebruiken moeten het `Fixture` type gebruiken
- FIX: Maak één consistent `Fixture` type en gebruik het OVERAL

### PRIORITEIT 2: Hernoem alles naar "BetsPlug"
- Frontend: titel, logo tekst "SIP" → "BetsPlug", meta tags, sidebar branding
- Backend: app_name in config.py
- README, docker-compose service namen (optioneel), start.bat banner
- About pagina: alle referenties naar "SIP" → "BetsPlug"

### PRIORITEIT 3: API koppelingen uitbreiden
**Huidige dekking (gratis Football-Data.org):**
- Premier League, La Liga, Bundesliga, Serie A, Ligue 1
- Champions League, Eredivisie, Championship
- Max 10 requests/minuut

**Ontbrekend (niet op gratis tier):**
- Europa League, Conference League
- Dus wedstrijden zoals Bologna-Aston Villa, Porto-Nottingham Forest NIET beschikbaar

**Oplossing optie A:** Upgrade naar Football-Data.org betaald plan (~€15/mo)
**Oplossing optie B:** Voeg API-Football (api-football.com) toe als tweede bron - gratis tier: 100 req/dag, heeft ALLE competities

### PRIORITEIT 4: Data sync robuust maken
De background sync (Celery beat) moet:
- Elke 5 min alle beschikbare competities doorlopen (roterend)
- Wedstrijden opslaan in DB zodat frontend NOOIT externe API's aanroept
- Predictions automatisch genereren voor upcoming matches
- Results automatisch evalueren na afloop
- Error handling: als één competitie faalt, door naar de volgende

### PRIORITEIT 5: Predictions pipeline
1. Sync haalt wedstrijden op → slaat op in matches tabel
2. generate_predictions task draait → voor elke match zonder prediction:
   - Haal features op (team form, h2h, standings)
   - Draai ensemble model
   - Sla prediction op (immutable)
3. Na wedstrijd: evalueer prediction (correct/incorrect, brier score)
4. Frontend toont alleen predictions voor UPCOMING matches
5. Afgelopen matches → Results pagina

### PRIORITEIT 6: Pagina structuur fixen
- **Live/Today**: wedstrijden van vandaag + komende 3 dagen uit DB
- **Predictions**: ALLEEN aankomende wedstrijden met model kansen
- **Results**: ALLEEN afgelopen wedstrijden met score + of prediction klopte
- **Weekly Report**: wekelijks overzicht van alle calls (won/lost/accuracy)
- **Trackrecord**: totaal overzicht alle predictions + performance metrics
- **Strategy Lab**: backtested strategieën (eerlijk gelabeld als simulatie tot echte data er is)

### PRIORITEIT 7: Stripe Payment
In `.env` staan Stripe placeholders. Om betalingen te laten werken:
1. Maak Stripe account aan op stripe.com
2. Ga naar Dashboard → API keys → kopieer secret key
3. Maak producten aan in Stripe Dashboard:
   - Basic: €15.99/maand
   - Standard: €35.97/3 maanden
   - Premium: €56.94/6 maanden
   - Lifetime: €199.99 eenmalig
4. Kopieer price IDs naar .env
5. Stel webhook endpoint in op stripe.com → `https://yourdomain.com/api/subscriptions/webhook`

### PRIORITEIT 8: Wekelijkse rapportage
Celery beat task die elke maandag 08:00 draait:
- Verzamel alle predictions van afgelopen week
- Bereken: totaal calls, won, lost, win rate, P/L
- Genereer rapport (JSON + optioneel PDF)
- Toon op Weekly Report pagina

## Technische details

### API key
```
FOOTBALL_DATA_API_KEY=280450cee4364fc29565738fb3526f16
```

### Beschikbare competities (codes)
PL, PD, BL1, SA, FL1, CL, DED, ELC, PPL, BSA, WC, EC

### Database
PostgreSQL op localhost:5432, user: sip_user, db: sports_intelligence

### Mappenstructuur
```
backend/
  app/
    api/routes/      → alle API endpoints
    services/        → data_sync_service, live_data_service
    forecasting/     → elo, poisson, logistic, ensemble modellen
    models/          → SQLAlchemy DB modellen
    tasks/           → Celery taken (sync, predictions, reports)
frontend/
  src/
    app/(app)/       → alle pagina's (Next.js App Router)
    components/      → UI componenten
    lib/api.ts       → API client
    types/api.ts     → TypeScript types
```

### Opdracht
Fix ALLES wat hierboven staat. Werk met meerdere agents parallel. Test alles na elke fix. Het platform moet 100% werken voordat je stopt. Geen nep data, geen broken pagina's, geen TypeScript errors.
