"""Auto-generated tier league UUID constants.

Do NOT edit by hand. Regenerate via:
    python backend/scripts/bootstrap_tier_league_ids.py

Last generated: 2026-04-16T21:46:51+00:00
Source: v8.1 evaluated predictions, see docs/tier_system_plan.md

Tier structure:
    LEAGUES_PLATINUM  = top 5  elite competitions
    LEAGUES_GOLD      = top 10 (Platinum + 5 next)
    LEAGUES_SILVER    = top 14 (Gold + 4 next)
    FREE tier uses no league whitelist (everything not in Silver qualifies).
"""

LEAGUES_PLATINUM: frozenset[str] = frozenset({
    "e0efa138-7f03-4c60-bcbc-c463f3842438",  # Champions League
    "137edd72-3ef0-4e4a-9708-63c30df6ce1e",  # Süper Lig
    "f2b51cb0-733d-4f79-863f-cd510fd17311",  # Eredivisie
    "dc5763a2-0da9-4a13-8d6c-1c0ce6b2cc4c",  # Premier League
    "449aa2d2-74e9-4cfb-a32a-efea876d54b9",  # Saudi Pro League
})

LEAGUES_GOLD: frozenset[str] = LEAGUES_PLATINUM | frozenset({
    "f71b7c32-9f4a-41d6-b5ad-8a28b670f2bc",  # Scottish Premiership
    "81998369-31b7-4d92-9b63-4d071190c9c5",  # Liga MX
    "38fa627e-169e-4631-a646-ff6649ed5864",  # Chinese Super League
    "c14d2d79-979f-4ddb-b8b5-8195725fe121",  # Primeira Liga
    "c12726e4-bc51-45b8-9cc7-685d958c30f5",  # Bundesliga
})

LEAGUES_SILVER: frozenset[str] = LEAGUES_GOLD | frozenset({
    "43106ec3-111e-4a37-a415-9e0b20bd3590",  # Jupiler Pro League
    "4acd5222-802e-454e-b415-e9c1af26961d",  # Championship
    "00cdab5a-7846-4a6c-96d2-62d5ed12e305",  # La Liga
    "26d8d924-e0dd-4251-81da-82c7a0a6dce9",  # Serie A
})
