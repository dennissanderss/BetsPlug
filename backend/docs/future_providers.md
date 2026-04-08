# Future Sports Data Providers — Research (Phase 3)

Do NOT integrate these until primary providers (API-Football + football-data.org) are stable.

## Decision criteria for adding a provider
1. You know exactly which data gap it fills
2. Primary providers run stable without errors for 2+ weeks
3. The provider has a free tier sufficient for our needs

---

## 1. TheSportsDB
- **URL**: https://www.thesportsdb.com/api.php
- **Free tier**: Unlimited (Patreon for premium)
- **Coverage**: Global, 400+ leagues, all sports
- **Data**: Metadata, historical scores, team info, logos, venue photos
- **Quality**: Good for metadata, inconsistent for live data
- **Effort**: Low (simple REST, JSON)
- **Gap filled**: Team logos, venue info, broader league metadata
- **Verdict**: Good supplement for UI enrichment, not for core predictions

## 2. OpenLigaDB
- **URL**: https://www.openligadb.de
- **Free tier**: Unlimited, no key needed
- **Coverage**: Primarily Bundesliga, some other German leagues
- **Data**: Fixtures, results, standings, goals
- **Quality**: Good for German football, limited elsewhere
- **Effort**: Low (simple REST)
- **Gap filled**: Redundant Bundesliga coverage, free alternative
- **Verdict**: Useful as Bundesliga fallback if API-Football quota runs out

## 3. Understat
- **URL**: https://understat.com
- **Free tier**: No official API — requires scraping
- **Coverage**: Top 5 EU leagues (PL, La Liga, Bundesliga, Serie A, Ligue 1)
- **Data**: xG, xGA, xPTS, shot maps, player xG
- **Quality**: Excellent xG data, widely used in analytics
- **Effort**: Medium-High (no API, need HTML scraping)
- **Gap filled**: xG data that API-Football free tier doesn't include
- **Verdict**: HIGH PRIORITY for Phase 3 — xG is our biggest data gap

## 4. The Odds API
- **URL**: https://the-odds-api.com
- **Free tier**: 500 requests/month
- **Coverage**: Global, all major bookmakers
- **Data**: Pre-match odds, live odds, historical odds
- **Quality**: Excellent, aggregates 40+ bookmakers
- **Effort**: Low (simple REST, JSON)
- **Gap filled**: Bookmaker odds for edge calculation
- **Verdict**: HIGH PRIORITY — needed for real edge calculation in strategies

## 5. Football-API.com
- **URL**: https://www.football-api.com
- **Free tier**: 100 requests/day
- **Coverage**: Global, similar to API-Football
- **Data**: Fixtures, results, standings, statistics
- **Quality**: Good, but less detailed than API-Football
- **Effort**: Low (similar structure to API-Football)
- **Gap filled**: Redundant coverage, useful as additional fallback
- **Verdict**: Only if we need a third provider for redundancy

## 6. FBref / Soccerway
- **URL**: https://fbref.com, https://www.soccerway.com
- **Free tier**: No API — scraping only
- **Coverage**: Global, extensive historical data
- **Data**: Advanced stats, player data, historical results going back decades
- **Quality**: Excellent, StatsBomb xG data on FBref
- **Effort**: High (scraping, anti-bot measures)
- **Gap filled**: Deep historical data for backtesting
- **Verdict**: Phase 4 — only for backtesting with large historical datasets

## 7. LiveScore API
- **URL**: https://rapidapi.com/apidojo/api/livescore6
- **Free tier**: 100 requests/day via RapidAPI
- **Coverage**: Global, all major leagues
- **Data**: Live scores, fixtures, standings
- **Quality**: Good for live data
- **Effort**: Low (RapidAPI wrapper)
- **Gap filled**: Faster live score updates
- **Verdict**: Only if live sync latency becomes a user complaint

---

## Priority ranking for Phase 3
1. **The Odds API** — enables real edge calculation (critical for Strategy Lab)
2. **Understat** — xG data for better predictions
3. **TheSportsDB** — team logos and UI enrichment
4. **OpenLigaDB** — free Bundesliga fallback
