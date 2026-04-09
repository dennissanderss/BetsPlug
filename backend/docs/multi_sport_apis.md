# Multi-Sport API Research

> Last updated: 2026-04-09

## Summary Table

| Sport | Recommended Free API | Free Tier Limit | Fixtures | Results | Stats | Odds | Live Scores | Docs URL |
|---|---|---|---|---|---|---|---|---|
| Basketball (NBA) | API-Sports (api-basketball.com) | 100 req/day | Yes | Yes | Yes | Yes | Yes | https://api-sports.io/documentation/basketball/v1 |
| Basketball (EuroLeague) | API-Sports (api-basketball.com) | 100 req/day | Yes | Yes | Yes | Yes | Yes | https://api-sports.io/documentation/basketball/v1 |
| Tennis (ATP/WTA) | API-Sports | 100 req/day | Yes | Yes | Limited | Yes | Yes | https://api-sports.io/documentation/tennis/v1 |
| American Football (NFL) | API-Sports (api-nfl) | 100 req/day | Yes | Yes | Yes | Yes | Yes | https://api-sports.io/documentation/nfl/v1 |
| Baseball (MLB) | BallDontLie | ~60 req/min | Yes | Yes | Yes | Paid only | Yes | https://www.balldontlie.io/ |
| Ice Hockey (NHL) | API-Sports (api-hockey) | 100 req/day | Yes | Yes | Yes | Yes | Yes | https://api-sports.io/documentation/hockey/v1 |
| MMA/UFC | API-Sports (api-mma) | 100 req/day | Yes | Yes | Yes | Yes | N/A | https://api-sports.io/documentation/mma/v1 |
| Cricket | Sportmonks | 180 req/hr (free forever) | Yes | Yes | Yes | No | Yes | https://www.sportmonks.com/cricket-api/ |
| Formula 1 | OpenF1 | 3 req/s, 30 req/min | Yes | Yes | Yes (telemetry) | No | Yes | https://openf1.org/docs/ |

### Odds Coverage (supplement any sport)

| API | Free Tier | Sports with Odds | Docs |
|---|---|---|---|
| The Odds API | 500 credits/month | NFL, NBA, NHL, MLB, Tennis, MMA, Cricket, Soccer + more | https://the-odds-api.com/ |
| API-Sports (per sport) | 100 req/day each | All sports above | https://api-sports.io/ |

---

## Detailed Findings Per Sport

---

### 1. Basketball (NBA + EuroLeague)

#### Recommended: API-Sports (api-basketball.com)

- **Free tier**: 100 requests/day, resets at 00:00 UTC. No credit card. Free forever.
- **Coverage**: NBA, EuroLeague, and 300+ other basketball leagues worldwide
- **Endpoints**: Seasons, Countries, Leagues, Teams, Standings, Games (fixtures + results), Statistics, Odds, Players
- **Data quality**: Game scores, player stats, pre-match odds, standings. Solid for both NBA and European leagues.
- **Docs**: https://api-sports.io/documentation/basketball/v1

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| BallDontLie | ~60 req/min free | Great NBA stats, MCP integration | NBA only (no EuroLeague). Odds requires paid tier ($499/mo all-access). |
| The Odds API | 500 credits/month | Best odds coverage (85+ bookmakers), covers NBA + EuroLeague odds | Odds only -- no stats, fixtures, or results. Credits burn fast. |
| Highlightly | 100 req/day | NBA + NCAAB, includes highlights | Some endpoints locked on free tier. No EuroLeague. |
| SportsDataIO | Free trial only | Very comprehensive | Trial expires -- not a real free tier. |

#### Why API-Sports wins for Basketball
- Single API key covers NBA AND EuroLeague (and 300+ other leagues)
- Free tier includes odds data (The Odds API does not include stats)
- Same platform as API-Football (already used in this project for soccer)
- Consistent endpoint structure across all sports

---

### 2. Tennis (ATP, WTA, Grand Slams)

#### Recommended: API-Sports

- **Free tier**: 100 requests/day
- **Coverage**: ATP, WTA, Grand Slams, Challenger events, ITF
- **Endpoints**: Seasons, Leagues, Rankings, Games (fixtures/results), Odds, Head-to-Head
- **Data quality**: Match results, rankings, pre-match odds. Player statistics are more limited compared to team sports.
- **Docs**: https://api-sports.io/documentation/tennis/v1 (listed under their sports portfolio)

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| The Odds API | 500 credits/month | Tennis odds for ATP/WTA/Grand Slams from 85+ books | Odds only -- no match stats or player data |
| Goalserve | Free trial | Very detailed (point-by-point, in-play odds) | Paid after trial ($150+/month) |
| TennisAPI (RapidAPI) | Freemium | Match results, rankings | Rate limits unclear, limited docs |

#### Why API-Sports wins for Tennis
- Same API key and platform as the other sports
- Includes both fixtures/results AND odds in a single call
- Covers the key tournaments (ATP 250/500/1000, WTA, Grand Slams)

---

### 3. American Football (NFL)

#### Recommended: API-Sports (api-nfl)

- **Free tier**: 100 requests/day
- **Coverage**: NFL + NCAA
- **Endpoints**: Seasons, Teams, Standings, Games (fixtures + scores), Statistics, Players, Odds
- **Data quality**: Game scores, team and player stats, standings, pre-match odds
- **Docs**: https://api-sports.io/documentation/nfl/v1

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| BallDontLie | Free (basic) | Clean API, good NFL stats | Odds locked behind paid. Per-sport pricing. |
| The Odds API | 500 credits/month | Excellent NFL odds (spreads, totals, props) | Odds only |
| MySportsFeeds | 14-day trial | Very detailed play-by-play, DFS data | Not truly free after trial |
| ESPN (unofficial) | Unlimited (scraping) | Free, real-time | Unofficial, may break, no odds, TOS risk |

#### Why API-Sports wins for NFL
- Free forever with no trial expiry
- Includes NFL odds alongside stats
- Same platform, same API key as other sports

---

### 4. Baseball (MLB)

#### Recommended: BallDontLie

- **Free tier**: Free account with ~60 requests/minute rate limit
- **Coverage**: MLB, minor leagues
- **Endpoints**: Games, Teams, Players, Stats, Standings, Box Scores
- **Data quality**: Comprehensive box scores, player stats, game results. Strong historical data.
- **Docs**: https://www.balldontlie.io/

#### Alternative Recommendation: API-Sports (api-baseball)

- **Free tier**: 100 requests/day
- **Coverage**: MLB + international baseball leagues (KBO, NPB, etc.)
- **Endpoints**: Seasons, Leagues, Teams, Games, Statistics, Odds
- **Docs**: https://api-sports.io/documentation/baseball/v1

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| MLB StatsAPI (official) | Free, unofficial | Very detailed, real-time | Undocumented, may change without notice, no odds |
| SportsDataIO Discovery Lab | Last season data free | Good for prototyping | No current season, no live data |
| The Odds API | 500 credits/month | MLB odds from 85+ bookmakers | Odds only |

#### Why BallDontLie for MLB
- Higher request limits than API-Sports free tier (60/min vs 100/day)
- Excellent MLB stats and box score coverage
- For odds: supplement with The Odds API or upgrade to API-Sports

---

### 5. Ice Hockey (NHL)

#### Recommended: API-Sports (api-hockey)

- **Free tier**: 100 requests/day
- **Coverage**: NHL + 50+ other hockey leagues (KHL, SHL, AHL, etc.)
- **Endpoints**: Seasons, Countries, Leagues, Teams, Standings, Games, Statistics, Odds
- **Data quality**: Game scores, team/player stats, standings, pre-match odds
- **Docs**: https://api-sports.io/documentation/hockey/v1

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| Highlightly | 100 req/day | NHL + NCAAH, includes video highlights | Some endpoints locked, less league coverage |
| NHL Web API (official) | Free, unofficial | Very detailed, real-time | Undocumented/community-maintained, no odds |
| The Odds API | 500 credits/month | NHL odds (puck line, totals) | Odds only |
| nhl-api-py (PyPI) | Unlimited (scraping) | Python wrapper for official NHL API | Unofficial, no odds |

#### Why API-Sports wins for NHL
- Covers NHL + international leagues
- Includes odds within the same API
- Same platform as your other sports

---

### 6. MMA / UFC

#### Recommended: API-Sports (api-mma)

- **Free tier**: 100 requests/day
- **Coverage**: UFC, Bellator, ONE Championship, PFL
- **Endpoints**: Seasons, Fighters, Teams, Categories, Fights (fixtures + results), Odds
- **Data quality**: Fight results, fighter stats, pre-match odds, event schedules
- **Docs**: https://api-sports.io/documentation/mma/v1

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| TheSportsDB | Free (limited) | UFC fixtures, results, artwork | 30 req/min, no detailed fight stats, no odds |
| BallDontLie | Free (basic) | Includes MMA | Less MMA-specific data than API-Sports |
| The Odds API | 500 credits/month | UFC odds | Odds only |
| ufc-api (GitHub scraper) | Free/open source | Direct UFC.com data | Scraping-based, fragile, no odds |
| SportsDataIO | Trial only | Detailed MMA data | Trial expires |

#### Why API-Sports wins for MMA
- Covers multiple MMA organizations beyond just UFC
- Includes pre-match odds
- Same platform as your other sport APIs

---

### 7. Cricket

#### Recommended: Sportmonks Cricket API

- **Free tier**: Free forever plan. 180 API calls per hour per endpoint.
- **Coverage**: 130+ cricket leagues across 30 countries (IPL, BBL, PSL, ICC events, county cricket, etc.)
- **Endpoints**: Fixtures, Results, Livescores, Scorecards, Ball-by-ball, Teams, Players, Standings, Venues
- **Data quality**: Excellent -- ball-by-ball data, batting/bowling scorecards, detailed player stats
- **Docs**: https://docs.sportmonks.com/cricket

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| CricketData.org (CricAPI) | Free (limits unclear) | Free live scores, scorecards, fantasy API | Documentation sparse, limits not transparent |
| API-Sports (api-cricket) | 100 req/day | Same platform as other sports | Less cricket depth than Sportmonks |
| Roanuz Cricket API | Limited free endpoints | IPL, ICC events, live scores | Most endpoints paid |
| The Odds API | 500 credits/month | Cricket odds | Odds only, no stats |

#### Why Sportmonks wins for Cricket
- 180 req/hr is far more generous than API-Sports' 100 req/day
- Ball-by-ball data quality is superior
- Free forever tier (not a trial)
- Covers 130+ leagues vs limited coverage on other free tiers
- Note: For cricket odds, supplement with The Odds API

---

### 8. Formula 1

#### Recommended: OpenF1

- **Free tier**: No authentication needed. 3 requests/second, 30 requests/minute. Completely free.
- **Coverage**: All F1 sessions from 2023 onwards (races, qualifying, practice, sprint)
- **Endpoints (18 total)**: Car data (telemetry), Drivers, Intervals, Laps, Location, Meetings, Pit stops, Position, Race control, Sessions, Stints, Team radio, Weather
- **Data quality**: Outstanding -- live telemetry at 3.7 Hz (speed, throttle, brake, RPM, gear), sector times, pit timing, weather, race control messages, driver radio transcriptions
- **Response formats**: JSON, CSV
- **Docs**: https://openf1.org/docs/

#### Alternatives

| API | Free Tier | Pros | Cons |
|---|---|---|---|
| f1api.dev | Free, open source | Race results, standings, historical data | Less real-time data than OpenF1 |
| API-Sports (Formula-1) | 100 req/day | Circuits, races, rankings, teams, drivers | No telemetry, less detail |
| Ergast (deprecated) | Was free | Historical data back to 1950 | Deprecated in 2024, replaced by Jolpica |
| Jolpica F1 API | Free | Successor to Ergast, historical data | Community-maintained |

#### Why OpenF1 wins for Formula 1
- Completely free, no API key needed for historical data
- Unmatched data quality (live telemetry, pit stops, radio)
- Open source
- For F1 odds: The Odds API does NOT cover F1. Use API-Sports or a bookmaker-specific API.

---

## The API-Sports Ecosystem

Since the project already uses API-Football (api-football.com), API-Sports is the natural choice for expanding to other sports. All APIs share:

- **Single dashboard**: One account, one API key per sport
- **Same architecture**: Identical endpoint patterns, response formats, authentication
- **Same free tier**: 100 requests/day per sport API (each sport counted independently)

### All API-Sports Products

| Product | Domain | Coverage |
|---|---|---|
| API-Football | api-football.com | Soccer (800+ leagues) |
| API-Basketball | api-basketball.com | Basketball (NBA, EuroLeague, 300+ leagues) |
| API-NBA | api-sports.io/sports/nba | NBA-specific |
| API-NFL | api-sports.io/sports/nfl | NFL + NCAA |
| API-Baseball | api-sports.io/sports/baseball | MLB + international |
| API-Hockey | api-sports.io/sports/hockey | NHL + international |
| API-MMA | api-sports.io/sports/mma | UFC, Bellator, ONE, PFL |
| API-Formula-1 | api-sports.io/sports/formula-1 | F1 races, results, standings |
| API-Rugby | api-sports.io/sports/rugby | Rugby union + league |
| API-Volleyball | api-sports.io/sports/volleyball | International |
| API-Handball | api-sports.io/sports/handball | International |
| API-AFL | api-sports.io/sports/afl | Australian Football |

### Free Tier Summary

- **100 requests/day PER sport** (basketball, NFL, hockey, etc. each get their own 100)
- Resets daily at 00:00 UTC
- No credit card required
- Access to ALL endpoints
- Paid plans start at ~$10/month per sport for higher limits

---

## The Odds API as a Cross-Sport Odds Layer

If odds are the primary need, The Odds API is the best single source:

- **Free tier**: 500 credits/month (1 credit = 1 market x 1 region per request)
- **Sports covered**: NFL, NBA, NHL, MLB, Tennis (ATP/WTA), MMA/UFC, Cricket, Soccer, Golf, Rugby, Australian Rules
- **NOT covered**: Formula 1
- **Bookmaker coverage**: 85+ bookmakers worldwide
- **Markets**: Moneyline (h2h), spreads, totals, outrights
- **Docs**: https://the-odds-api.com/liveapi/guides/v4/

### Credit Math

| Query Type | Credits per Call | Calls from 500 Free Credits |
|---|---|---|
| 1 sport, 1 market, 1 region | 1 | 500 |
| 1 sport, 3 markets, 2 regions | 6 | 83 |
| 5 sports, 2 markets, 1 region | 10 | 50 |

**Important**: You already use The Odds API for soccer odds. The same API key and free credits cover all sports. Adding more sports will consume the same 500-credit pool faster.

---

## Recommended Integration Strategy

### Phase 1: Use API-Sports Ecosystem (Free)

Since the project already uses API-Football, add other sports through the same platform:
1. Register for each sport API on api-sports.io (free, same dashboard)
2. Each sport gets its own 100 req/day allowance
3. Total free budget: 100 x N sports per day
4. Consistent data format reduces development time

### Phase 2: Supplement with Specialized APIs

| Need | API | Reason |
|---|---|---|
| Cross-sport odds | The Odds API | 85+ bookmakers, already integrated |
| Cricket depth | Sportmonks | 180 req/hr free, ball-by-ball data |
| F1 telemetry | OpenF1 | Free, no auth, unmatched data quality |
| MLB deep stats | BallDontLie | Higher free limits than API-Sports |

### Phase 3: Scale Up (When Needed)

- API-Sports paid plans start at ~$10/month per sport
- The Odds API paid starts at $30/month (10,000 credits)
- Sportmonks cricket paid starts at ~$25/month

### Cost Estimate for Full Multi-Sport (Paid)

| Provider | Sports | Monthly Cost |
|---|---|---|
| API-Sports (all sports) | Basketball, NFL, NHL, MMA, Tennis, F1 | ~$60-80/mo (at $10-15/sport) |
| The Odds API | Cross-sport odds | $30/mo |
| Sportmonks Cricket | Cricket | $25/mo |
| OpenF1 | Formula 1 (telemetry) | Free |
| **Total** | **8 sports** | **~$115-135/mo** |
