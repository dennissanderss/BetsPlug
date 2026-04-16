"""
Bootstrap league UUIDs for the tier system.

Reads Railway DB, finds the exact UUIDs for the 14 leagues that make up the
Platinum/Gold/Silver tiers, and writes them to
``backend/app/core/tier_leagues.py`` as a Python module with frozenset
constants.

Source names are matched EXACTLY against ``leagues.name`` in the DB.
If a league is missing, a warning is printed and the tier is smaller than
expected — review the script output before trusting the generated module.

Idempotent: safe to re-run. Only the timestamp differs between runs.

Usage:
    python backend/scripts/bootstrap_tier_league_ids.py

Output:
    backend/app/core/tier_leagues.py (overwrite)
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

import psycopg2

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

# Tier composition — exact names as stored in DB.
# Confirmed via scripts/analyze_accuracy_per_league.py output (16 apr 2026).
TOP5_PLATINUM = [
    "Champions League",
    "Süper Lig",
    "Eredivisie",
    "Premier League",
    "Saudi Pro League",
]
TOP10_GOLD_ADDITIONAL = [
    "Scottish Premiership",
    "Liga MX",
    "Chinese Super League",
    "Primeira Liga",
    "Bundesliga",
]
TOP14_SILVER_ADDITIONAL = [
    "Jupiler Pro League",
    "Championship",
    "La Liga",
    "Serie A",
]

# Path to write generated module
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.normpath(
    os.path.join(HERE, "..", "app", "core", "tier_leagues.py")
)


def fetch_uuids(cur, names: list[str]) -> dict[str, str | None]:
    """Return {name: uuid-string-or-None} for each requested league name."""
    cur.execute(
        "SELECT id, name FROM leagues WHERE name = ANY(%s)",
        (names,),
    )
    found = {name: str(lid) for lid, name in cur.fetchall()}
    return {name: found.get(name) for name in names}


def render_frozenset(
    var_name: str,
    name_to_uuid: dict[str, str | None],
    base_var: str | None = None,
) -> str:
    """Render a Python frozenset literal with inline name comments."""
    lines: list[str] = []
    if base_var:
        lines.append(f"{var_name}: frozenset[str] = {base_var} | frozenset({{")
    else:
        lines.append(f"{var_name}: frozenset[str] = frozenset({{")
    for name, uuid in name_to_uuid.items():
        if uuid is None:
            lines.append(f"    # MISSING: {name!r} — not found in leagues table")
            continue
        lines.append(f'    "{uuid}",  # {name}')
    lines.append("})")
    return "\n".join(lines)


def main() -> None:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    all_names = TOP5_PLATINUM + TOP10_GOLD_ADDITIONAL + TOP14_SILVER_ADDITIONAL
    resolved = fetch_uuids(cur, all_names)

    missing = [name for name, uuid in resolved.items() if uuid is None]
    if missing:
        print("WARNING — leagues not found in DB (will be SKIPPED):")
        for m in missing:
            print(f"  - {m}")
        print()

    platinum = {n: resolved[n] for n in TOP5_PLATINUM}
    gold_add = {n: resolved[n] for n in TOP10_GOLD_ADDITIONAL}
    silver_add = {n: resolved[n] for n in TOP14_SILVER_ADDITIONAL}

    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")

    header = f'''"""Auto-generated tier league UUID constants.

Do NOT edit by hand. Regenerate via:
    python backend/scripts/bootstrap_tier_league_ids.py

Last generated: {now_iso}
Source: v8.1 evaluated predictions, see docs/tier_system_plan.md

Tier structure:
    LEAGUES_PLATINUM  = top 5  elite competitions
    LEAGUES_GOLD      = top 10 (Platinum + 5 next)
    LEAGUES_SILVER    = top 14 (Gold + 4 next)
    FREE tier uses no league whitelist (everything not in Silver qualifies).
"""
'''

    module_src = (
        header
        + "\n"
        + render_frozenset("LEAGUES_PLATINUM", platinum)
        + "\n\n"
        + render_frozenset("LEAGUES_GOLD", gold_add, base_var="LEAGUES_PLATINUM")
        + "\n\n"
        + render_frozenset("LEAGUES_SILVER", silver_add, base_var="LEAGUES_GOLD")
        + "\n"
    )

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(module_src)

    print(f"Wrote {OUT_PATH}")
    print(f"  Platinum: {sum(1 for v in platinum.values() if v)} leagues")
    print(f"  Gold    : {sum(1 for v in {**platinum, **gold_add}.values() if v)} leagues")
    print(f"  Silver  : {sum(1 for v in resolved.values() if v)} leagues")

    conn.close()


if __name__ == "__main__":
    main()
