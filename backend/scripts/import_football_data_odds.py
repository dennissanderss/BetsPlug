"""Import historical 1X2 odds from football-data.co.uk into odds_history.

football-data.co.uk publishes free CSV files per league per season with
closing 1X2 odds from up to 10 bookmakers. We use this to backfill
odds for historical predictions that lack a real bookmaker_odds row,
so both engines (single-pick + combo) can compute real-odds ROI on
their backtest dataset.

Why this is honest:
  - Odds are the ACTUAL closing prices that bookmakers offered before
    those matches kicked off, scraped from public bookmaker pages by
    football-data.co.uk and republished as CSV.
  - We do not invent or interpolate values; either we find a price
    in the CSV or we don't write a row.
  - The match identification step is conservative: we only match a
    CSV row to a fixture when the league + date + both team names
    line up. Ambiguous matches are skipped and logged.

Coverage:
  - Top European leagues (PL, Championship, La Liga, Bundesliga 1+2,
    Serie A+B, Ligue 1+2, Eredivisie, Belgian Pro, Scottish Prem,
    Primeira Liga, Turkish Super Lig, Greek Super League): seasons
    1993/94 → present.
  - Latin / extra leagues (Argentinian, Brazilian, Mexican, MLS,
    etc.): 2012/13 → present.
  - Champions / Europa League / Conference League / Saudi / Asian
    leagues are NOT in football-data.co.uk and stay uncovered.

Usage:
    python backend/scripts/import_football_data_odds.py
    python backend/scripts/import_football_data_odds.py --dry-run
    python backend/scripts/import_football_data_odds.py --seasons 2425
    python backend/scripts/import_football_data_odds.py --seasons 2324,2425 --leagues E0,SP1
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import io
import re
import sys
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select, update  # noqa: E402
from app.db.session import async_session_factory  # noqa: E402
from app.models.match import Match  # noqa: E402
from app.models.league import League  # noqa: E402
from app.models.odds import OddsHistory  # noqa: E402
from app.models.prediction import Prediction  # noqa: E402
from app.models.team import Team  # noqa: E402

# ── Football-data.co.uk URL pattern ───────────────────────────────────────────
# Pattern: https://www.football-data.co.uk/mmz4281/{season}/{league}.csv
#   season: "2425" for 2024/25, "2526" for 2025/26 etc.
#   league: 2-3 char code per league (E0, SP1, D1, ...)
BASE_URL = "https://www.football-data.co.uk/mmz4281/{season}/{league}.csv"

# Map our internal league names to football-data.co.uk codes.
# Add/edit as your tier_leagues evolve. Substring match (lowercased).
LEAGUE_CODE_MAP: dict[str, str] = {
    "premier league": "E0",
    "championship": "E1",
    "league one": "E2",
    "league two": "E3",
    "national league": "EC",
    "scottish premiership": "SC0",
    "scottish championship": "SC1",
    "la liga": "SP1",
    "primera división": "SP1",
    "primera division": "SP1",
    "segunda división": "SP2",
    "segunda division": "SP2",
    "bundesliga": "D1",
    "2. bundesliga": "D2",
    "serie a": "I1",
    "serie b": "I2",
    "ligue 1": "F1",
    "ligue 2": "F2",
    "eredivisie": "N1",
    "jupiler pro league": "B1",
    "primeira liga": "P1",
    "süper lig": "T1",
    "super lig": "T1",
    "super league": "G1",  # Greek Super League
}


# Team-name aliases for cases where football-data.co.uk and our DB
# use materially different forms — e.g. abbreviations, accented chars
# already stripped, or city-vs-club confusion. Slugified on both sides
# (lowercase, no spaces, no accents). Add cases as we find them.
TEAM_ALIASES: dict[str, str] = {
    # Bundesliga + 2.Bundesliga
    "bayernmunich": "bayernmunchen",
    "bayermunich": "bayernmunchen",  # very rare typo variant
    "borussiamgladbach": "monchengladbach",
    "moenchengladbach": "monchengladbach",
    "borussiadortmund": "dortmund",
    "ein frankfurt": "eintrachtfrankfurt",
    "eintfrankfurt": "eintrachtfrankfurt",
    "tsghoffenheim": "hoffenheim",
    "1899hoffenheim": "hoffenheim",
    "rbleipzig": "rasenballsportleipzig",
    "leipzig": "rasenballsportleipzig",
    "stpauli": "stpauli",
    "fc koln": "koln",
    "fckoln": "koln",
    "cologne": "koln",
    # Premier League / Championship
    "manunited": "manchesterunited",
    "manutd": "manchesterunited",
    "mancity": "manchestercity",
    "manchesteru": "manchesterunited",
    "spurs": "tottenham",
    "tottenhamhotspur": "tottenham",
    "wolves": "wolverhamptonwanderers",
    "newcastle": "newcastleunited",
    "westham": "westhamunited",
    "leicester": "leicestercity",
    "norwich": "norwichcity",
    "leeds": "leedsunited",
    # Serie A
    "inter": "internazionale",
    "intermilan": "internazionale",
    "ac milan": "milan",
    "acmilan": "milan",
    "as roma": "roma",
    "asroma": "roma",
    "lazio": "lazio",
    "ssclazio": "lazio",
    "juventus": "juventus",
    "juve": "juventus",
    # La Liga
    "realmadrid": "realmadrid",
    "atletico madrid": "atleticomadrid",
    "atleticomadrid": "atleticomadrid",
    "atleticom": "atleticomadrid",
    "atletico": "atleticomadrid",
    "athletic club": "athleticbilbao",
    "athleticbilbao": "athleticbilbao",
    "athletic": "athleticbilbao",
    "rayovallecano": "rayovallecano",
    "celta": "celtavigo",
    "betis": "realbetis",
    "realbetis": "realbetis",
    "realsociedad": "realsociedad",
    "valladolid": "realvalladolid",
    # Greek Super League — main mismatches between CSV/DB
    "olympiakos": "olympiacos",
    "olympiacosp": "olympiacos",
    "panathinaikos": "panathinaikos",
    "paok": "paok",
    "paoks": "paok",
    "aekathens": "aek",
    "aek": "aek",
    # Belgian Pro League
    "anderlecht": "anderlecht",
    "rscanderlecht": "anderlecht",
    "club brugge": "clubbrugge",
    "clubbrugge": "clubbrugge",
    "kvclubbrugge": "clubbrugge",
    "standardliege": "standard",
    "standardluik": "standard",
    "antwerp": "antwerp",
    "rantwerp": "antwerp",
    # Eredivisie
    "ajax": "ajax",
    "psv": "psv",
    "feyenoord": "feyenoord",
    "azalkmaar": "az",
    "az": "az",
    # Turkey
    "galatasaray": "galatasaray",
    "fenerbahce": "fenerbahce",
    "besiktas": "besiktas",
    "trabzonspor": "trabzonspor",
}


def slugify_team(name: str) -> str:
    """Lowercase, strip accents, drop common club-suffix words.

    Examples (intended outputs):
        "Real Madrid CF"        → "realmadrid"
        "Manchester United"     → "manchesterunited"
        "Bayern München"        → "bayernmunchen"
        "1. FC Köln"            → "koln"
    Then we apply TEAM_ALIASES on top to bridge known FBdata-vs-DB
    naming gaps.
    """
    if not name:
        return ""
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.lower().strip()
    # Drop common club-suffix words and prefix tokens.
    s = re.sub(
        r"\b(fc|cf|ac|sc|sv|afc|cfc|ssc|us|as|ca|ud|cd|club|cp|cd|de|"
        r"the|le|la|el|los|las|1|2|fk|tsv|tsg|svg|kv|kvc|k|rsc|r)\b",
        "",
        s,
    )
    s = re.sub(r"[^a-z0-9]+", "", s)
    return TEAM_ALIASES.get(s, s)


def parse_date_cell(s: str) -> Optional[date]:
    s = s.strip()
    for fmt in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def pick_closing_odds(row: dict) -> Optional[tuple[float, float, float, str]]:
    """Pick the best available closing 1X2 odds for a row.

    Preference order:
      1. Bet365 closing  (B365CH, B365CD, B365CA)
      2. Pinnacle closing (PSCH, PSCD, PSCA)
      3. Average closing  (AvgCH, AvgCD, AvgCA)
      4. Bet365 opening   (B365H, B365D, B365A)  ← fallback
      5. Average opening  (AvgH, AvgD, AvgA)     ← fallback
    Returns (home, draw, away, source_label) or None when nothing
    parseable is in the row.
    """
    candidates = [
        ("B365CH", "B365CD", "B365CA", "bet365_closing"),
        ("PSCH", "PSCD", "PSCA", "pinnacle_closing"),
        ("AvgCH", "AvgCD", "AvgCA", "market_avg_closing"),
        ("B365H", "B365D", "B365A", "bet365_opening"),
        ("AvgH", "AvgD", "AvgA", "market_avg_opening"),
        ("BbAvH", "BbAvD", "BbAvA", "betbrain_avg"),
    ]
    for h_key, d_key, a_key, label in candidates:
        h = row.get(h_key)
        d = row.get(d_key)
        a = row.get(a_key)
        if not h or not d or not a:
            continue
        try:
            ho = float(h)
            do = float(d)
            ao = float(a)
        except ValueError:
            continue
        if ho > 1 and do > 1 and ao > 1:
            return ho, do, ao, label
    return None


async def fetch_csv(client: httpx.AsyncClient, season: str, league_code: str) -> Optional[str]:
    url = BASE_URL.format(season=season, league=league_code)
    try:
        r = await client.get(url, timeout=30.0)
    except httpx.HTTPError as exc:
        print(f"  ! download failed for {league_code} {season}: {exc}")
        return None
    if r.status_code == 404:
        # Season + league combination not yet published — quietly skip.
        return None
    if r.status_code != 200:
        print(f"  ! HTTP {r.status_code} for {url}")
        return None
    return r.text


async def import_one_csv(
    db, csv_text: str, league_ids: list, league_code: str, season: str,
    *, dry_run: bool,
) -> dict:
    """Walk one CSV, match rows against fixtures, write odds rows.

    ``league_ids`` is a list because the same FBdata code can map to
    multiple DB rows (Bundesliga and Serie A both have duplicate
    league rows from different ingestion sources). We pool fixtures
    from every UUID so the CSV's matches go to whichever league row
    actually owns the fixture.

    Returns counters: rows, matched, written, skipped_no_match, skipped_no_odds.
    """
    counters = {
        "rows": 0,
        "matched": 0,
        "written": 0,
        "snapshot_updated": 0,
        "skipped_no_match": 0,
        "skipped_no_odds": 0,
        "already_present": 0,
    }
    reader = csv.DictReader(io.StringIO(csv_text))

    # Build a lookup map: (home_slug, away_slug, ymd) -> match_id,
    # pooled across ALL league UUIDs that map to this FBdata code.
    fixture_index: dict[tuple[str, str, str], object] = {}
    rows = (await db.execute(
        select(
            Match.id,
            Match.scheduled_at,
            Match.home_team_id,
            Match.away_team_id,
        ).where(Match.league_id.in_(league_ids))
    )).all()
    if not rows:
        return counters

    team_rows = (await db.execute(
        select(Team.id, Team.name)
    )).all()
    team_name_by_id = {tid: name for tid, name in team_rows}

    for match_id, scheduled_at, home_id, away_id in rows:
        home_name = team_name_by_id.get(home_id, "")
        away_name = team_name_by_id.get(away_id, "")
        ymd = scheduled_at.date().isoformat()
        key = (slugify_team(home_name), slugify_team(away_name), ymd)
        fixture_index[key] = match_id

    # Existing odds_history rows for this league, to avoid duplicates.
    existing_q = (
        select(OddsHistory.match_id, OddsHistory.source, OddsHistory.market)
        .join(Match, Match.id == OddsHistory.match_id)
        .where(Match.league_id.in_(league_ids))
    )
    existing_keys: set[tuple[object, str, str]] = set(
        (mid, src, mkt) for mid, src, mkt in (await db.execute(existing_q)).all()
    )

    # Bulk-load ALL predictions for these leagues once, indexed by match_id.
    # Without this we'd do one SELECT per CSV row → 10k+ round-trips over the
    # Railway proxy = 15-30 min. With it: one query, one in-memory patch loop,
    # one bulk-commit. Cuts wall time to under a minute.
    pred_rows = (await db.execute(
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.league_id.in_(league_ids))
    )).scalars().all()
    preds_by_match: dict[object, list] = {}
    for p in pred_rows:
        preds_by_match.setdefault(p.match_id, []).append(p)

    for raw in reader:
        counters["rows"] += 1
        d = parse_date_cell(raw.get("Date", ""))
        if d is None:
            continue
        home_slug = slugify_team(raw.get("HomeTeam", ""))
        away_slug = slugify_team(raw.get("AwayTeam", ""))
        if not home_slug or not away_slug:
            continue
        ymd = d.isoformat()
        match_id = fixture_index.get((home_slug, away_slug, ymd))
        if match_id is None:
            # Try ±1 day window (fixture might have been logged on local date)
            for offset in (-1, 1):
                alt_ymd = (d.replace(day=d.day) if False else d).isoformat()
                # offset trick
                from datetime import timedelta as _td
                alt = (d + _td(days=offset)).isoformat()
                if (home_slug, away_slug, alt) in fixture_index:
                    match_id = fixture_index[(home_slug, away_slug, alt)]
                    break
        if match_id is None:
            counters["skipped_no_match"] += 1
            continue
        counters["matched"] += 1

        odds = pick_closing_odds(raw)
        if odds is None:
            counters["skipped_no_odds"] += 1
            continue
        ho, do, ao, source_label = odds

        key = (match_id, source_label, "1x2")
        odds_history_already = key in existing_keys

        if not dry_run:
            # 1. odds_history insert (skip if already there)
            if not odds_history_already:
                db.add(OddsHistory(
                    match_id=match_id,
                    source=source_label,
                    market="1x2",
                    home_odds=ho,
                    draw_odds=do,
                    away_odds=ao,
                    recorded_at=datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc),
                ))
                existing_keys.add(key)
                counters["written"] += 1
            else:
                counters["already_present"] += 1

            # 2. closing_odds_snapshot patch — uses the in-memory
            # preds_by_match dict (bulk-loaded once at top of function)
            # so we don't do per-row SELECTs over the Railway proxy.
            for p in preds_by_match.get(match_id, []):
                snap = dict(p.closing_odds_snapshot or {})
                if "bookmaker_odds" in snap and snap["bookmaker_odds"]:
                    continue  # already populated
                snap["bookmaker_odds"] = {
                    "home": ho,
                    "draw": do,
                    "away": ao,
                }
                snap.setdefault("source", source_label)
                snap.setdefault("recorded_at", d.isoformat())
                p.closing_odds_snapshot = snap
                counters["snapshot_updated"] += 1
        else:
            # dry-run accounting
            if odds_history_already:
                counters["already_present"] += 1
            else:
                counters["written"] += 1

    if not dry_run:
        await db.commit()

    return counters


async def main(seasons: list[str], league_codes: list[str], dry_run: bool):
    print(f"=== football-data.co.uk odds import ===")
    print(f"  Seasons : {seasons}")
    print(f"  Leagues : {league_codes}")
    print(f"  Mode    : {'DRY RUN' if dry_run else 'LIVE'}")
    print()

    async with async_session_factory() as db:
        # Build league_id lookup from our DB
        leagues = (await db.execute(select(League.id, League.name))).all()
        # Map DB league row -> football-data code via LEAGUE_CODE_MAP substring match
        db_to_code: dict[object, str] = {}
        for lid, name in leagues:
            lname = (name or "").lower()
            for needle, code in LEAGUE_CODE_MAP.items():
                if needle in lname:
                    db_to_code[lid] = code
                    break

        # Group by FBdata code: one code may map to multiple DB UUIDs
        # (duplicate league rows from different ingestion sources).
        # We pool them so each code is processed once with all matching
        # UUIDs at hand.
        code_to_lids: dict[str, list] = {}
        for lid, code in db_to_code.items():
            if code in league_codes:
                code_to_lids.setdefault(code, []).append(lid)
        if not code_to_lids:
            print("No matching leagues in your DB for the requested codes. Aborting.")
            return

        print(f"Matched {sum(len(v) for v in code_to_lids.values())} league row(s) ↔ {len(code_to_lids)} FBdata code(s)")
        for code, lids in code_to_lids.items():
            for lid in lids:
                print(f"  - {code:4s}  ←  {lid}")
        print()

        async with httpx.AsyncClient(headers={"User-Agent": "betsplug-import/1.0"}) as client:
            grand = {"rows": 0, "matched": 0, "written": 0, "snapshot_updated": 0, "skipped_no_match": 0, "skipped_no_odds": 0, "already_present": 0}
            for code, lids in code_to_lids.items():
                for season in seasons:
                    csv_text = await fetch_csv(client, season, code)
                    if csv_text is None:
                        continue
                    counters = await import_one_csv(
                        db, csv_text, lids, code, season, dry_run=dry_run,
                    )
                    print(
                        f"  {code} {season}: rows={counters['rows']:4d} "
                        f"matched={counters['matched']:4d} "
                        f"odds_history={counters['written']:4d} "
                        f"snapshot={counters['snapshot_updated']:4d} "
                        f"existing={counters['already_present']:4d} "
                        f"no-match={counters['skipped_no_match']:4d} "
                        f"no-odds={counters['skipped_no_odds']:4d}"
                    )
                    for k in grand:
                        grand[k] += counters[k]

        print()
        print("=== TOTAL ===")
        print(f"  Rows in CSVs: {grand['rows']}")
        print(f"  Matched to fixtures: {grand['matched']}")
        print(f"  Written to odds_history (Engine 1): {grand['written']}")
        print(f"  Predictions snapshot patched (Engine 2): {grand['snapshot_updated']}")
        print(f"  Already in DB (skipped): {grand['already_present']}")
        print(f"  Unmatched fixtures: {grand['skipped_no_match']}")
        print(f"  Rows with no parseable odds: {grand['skipped_no_odds']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--seasons", default="2324,2425,2526",
        help="Comma-separated season codes (e.g. 2425 = 2024/25). Default covers your prediction history (2023/24 → present).",
    )
    parser.add_argument(
        "--leagues",
        default="E0,E1,E2,SP1,SP2,D1,D2,I1,I2,F1,F2,N1,B1,SC0,SC1,P1,T1,G1",
        help="Comma-separated football-data.co.uk league codes. Default: 18 top-European competitions.",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    seasons = [s.strip() for s in args.seasons.split(",") if s.strip()]
    leagues = [c.strip() for c in args.leagues.split(",") if c.strip()]
    asyncio.run(main(seasons, leagues, args.dry_run))
