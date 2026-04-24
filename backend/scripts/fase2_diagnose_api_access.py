"""Diagnose: welke data geeft API-Football Pro tier wél/niet terug voor onze fixtures.

Test drie dingen voor één fixture ID:
1. /fixtures?id=X  → bestaat de fixture überhaupt?
2. /odds?fixture=X → odds endpoint lege respons?
3. /odds/mapping?id=X → is er een aparte mapping check?

Plus: /status om plan capabilities te zien.
"""
import os
import sys
import json
import httpx


API_BASE = "https://v3.football.api-sports.io"


def main() -> None:
    api_key = os.environ.get("API_FOOTBALL_KEY", "").strip()
    if not api_key:
        print("Set API_FOOTBALL_KEY env var first", file=sys.stderr)
        sys.exit(1)

    headers = {"x-apisports-key": api_key}
    fixture_id = "1396414"  # een Gold-tier fixture uit pilot

    with httpx.Client() as client:
        # ── 1) Plan / status ──────────────────────────────────
        print("=== /status (plan info) ===")
        r = client.get(f"{API_BASE}/status", headers=headers, timeout=30)
        print(f"HTTP {r.status_code}")
        print(json.dumps(r.json(), indent=2)[:1500])
        print()

        # ── 2) Fixture bestaat? ───────────────────────────────
        print(f"=== /fixtures?id={fixture_id} ===")
        r = client.get(f"{API_BASE}/fixtures", headers=headers,
                       params={"id": fixture_id}, timeout=30)
        print(f"HTTP {r.status_code}")
        data = r.json()
        print(f"results: {data.get('results')}")
        if data.get("response"):
            fx = data["response"][0]
            print(f"  league: {fx.get('league', {}).get('name')}")
            print(f"  season: {fx.get('league', {}).get('season')}")
            print(f"  date:   {fx.get('fixture', {}).get('date')}")
            print(f"  status: {fx.get('fixture', {}).get('status', {}).get('short')}")
        print()

        # ── 3) Odds endpoint voor dezelfde fixture ────────────
        print(f"=== /odds?fixture={fixture_id} ===")
        r = client.get(f"{API_BASE}/odds", headers=headers,
                       params={"fixture": fixture_id}, timeout=30)
        print(f"HTTP {r.status_code}")
        data = r.json()
        print(f"results: {data.get('results')}")
        print(f"errors: {data.get('errors')}")
        if data.get("response"):
            print(f"  response len: {len(data['response'])}")
            print(json.dumps(data["response"][:1], indent=2)[:500])
        print()

        # ── 4) Odds historic endpoint (Pro-only) ─────────────
        print(f"=== /odds/historic?fixture={fixture_id} ===")
        r = client.get(f"{API_BASE}/odds/historic", headers=headers,
                       params={"fixture": fixture_id}, timeout=30)
        print(f"HTTP {r.status_code}")
        data = r.json() if r.status_code == 200 else {"error": r.text[:200]}
        print(json.dumps(data, indent=2)[:800])
        print()

        # ── 5) Odds mapping (lijst wedstrijden met odds) ─────
        print("=== /odds/mapping (first page) ===")
        r = client.get(f"{API_BASE}/odds/mapping", headers=headers, timeout=30)
        print(f"HTTP {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"results: {data.get('results')}")
            paging = data.get("paging", {})
            print(f"paging: {paging}")
            if data.get("response"):
                first = data["response"][0]
                print(f"  sample: {first.get('fixture', {}).get('id')} — "
                      f"{first.get('league', {}).get('name')} — "
                      f"{first.get('fixture', {}).get('date')}")
        print()


if __name__ == "__main__":
    main()
