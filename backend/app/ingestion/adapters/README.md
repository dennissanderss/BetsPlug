# Sports Data Providers

## Architecture

All providers implement `DataSourceAdapter` (see `base_adapter.py`).
The `SportsAPIRouter` (see `router.py`) handles provider selection and fallback per league.

## Provider: API-Football (api-sports.io)

- **Base URL**: `https://v3.football.api-sports.io`
- **Auth**: Header `x-apisports-key: <key>`
- **Rate limit (free tier)**: 100 requests/day
- **Strengths**: Top 5 EU leagues, Champions League, xG, statistics, odds
- **League IDs**: Numeric (PL=39, La Liga=140, Bundesliga=78, Serie A=135, Ligue 1=61, Eredivisie=88)

### Quirks
- Date format: `YYYY-MM-DD`
- Status values: `NS` (not started), `1H`/`2H`/`HT` (live), `FT` (finished), `PST` (postponed)
- xG data only available for top leagues
- Odds endpoint requires separate call per fixture
- Free tier: NO live score updates (10-min delay)

## Provider: football-data.org

- **Base URL**: `https://api.football-data.org/v4`
- **Auth**: Header `X-Auth-Token: <key>`
- **Rate limit (free tier)**: 10 requests/minute
- **Strengths**: Eredivisie, Championship, Primeira Liga, broader league coverage
- **League codes**: Strings (PL, DED, BL1, SA, FL1, PD, ELC, PPL)

### Quirks
- Free tier: NO xG, limited player data
- Standings always available (good for cold-start)
- H2H available via `/matches/{id}/head2head`
- Date filter: `dateFrom` and `dateTo` query params
- Status values: `SCHEDULED`, `LIVE`, `IN_PLAY`, `FINISHED`, `POSTPONED`, `CANCELLED`

## League → Provider Mapping

| League | Primary | Fallback |
|--------|---------|----------|
| Premier League | api_football | football_data |
| La Liga | api_football | football_data |
| Bundesliga | api_football | football_data |
| Serie A | api_football | football_data |
| Ligue 1 | api_football | football_data |
| Eredivisie | football_data | api_football |
| Championship | football_data | api_football |
| Primeira Liga | football_data | api_football |
| Champions League | api_football | football_data |

## How to Add a New Provider

1. Create `adapters/your_provider.py`
2. Implement `DataSourceAdapter` (all abstract methods)
3. Add to `adapters/__init__.py` ADAPTER_REGISTRY
4. Add league mapping in `router.py` LEAGUE_PROVIDER_CONFIG
5. Add env var for API key in `core/config.py`
6. Add to `.env.example`
7. Test with: `pytest tests/test_your_provider.py`

### Template

```python
from app.ingestion.base_adapter import DataSourceAdapter

class YourProviderAdapter(DataSourceAdapter):
    BASE_URL = "https://api.yourprovider.com"

    async def fetch_matches(self, league_id, date_from, date_to):
        await self.rate_limit()
        resp = await self.http_client.get(...)
        return [self._normalize_match(m) for m in resp.json()]

    def _normalize_match(self, raw: dict) -> dict:
        return {
            "external_id": str(raw["id"]),
            "league_slug": ...,
            "home_team_slug": ...,
            # ... all required keys from base_adapter.py
        }
```

Estimated time to add a new provider: **20-30 minutes** if the API is well-documented.
