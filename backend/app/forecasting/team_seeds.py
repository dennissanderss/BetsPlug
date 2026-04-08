"""Cold-start team strength seeds for prediction models.

When the database has no historical results or standings, models use
these seed ratings to produce differentiated predictions. Ratings are
on a 1200-1800 Elo scale where 1500 = average team.

Sources: Historical performance, UEFA coefficients, market expectations.
Updated manually per season start.
"""

# team_slug → seed Elo rating
TEAM_SEED_ELO: dict[str, float] = {
    # Premier League
    "manchester-city-fc": 1780,
    "arsenal-fc": 1760,
    "liverpool-fc": 1750,
    "chelsea-fc": 1680,
    "manchester-united-fc": 1660,
    "tottenham-hotspur-fc": 1650,
    "newcastle-united-fc": 1640,
    "aston-villa-fc": 1620,
    "brighton-hove-albion-fc": 1600,
    "west-ham-united-fc": 1580,
    "brentford-fc": 1560,
    "crystal-palace-fc": 1540,
    "fulham-fc": 1540,
    "wolverhampton-wanderers-fc": 1530,
    "everton-fc": 1520,
    "nottingham-forest-fc": 1520,
    "bournemouth-fc": 1510,
    "afc-bournemouth": 1510,
    "burnley-fc": 1480,
    "luton-town-fc": 1460,
    "sheffield-united-fc": 1460,

    # La Liga
    "real-madrid-cf": 1790,
    "fc-barcelona": 1780,
    "club-atletico-de-madrid": 1720,
    "real-sociedad-de-futbol": 1640,
    "athletic-club": 1630,
    "villarreal-cf": 1620,
    "real-betis-balompie": 1610,
    "sevilla-fc": 1600,
    "girona-fc": 1590,
    "getafe-cf": 1560,
    "rayo-vallecano-de-madrid": 1540,
    "rc-celta-de-vigo": 1530,
    "rcd-mallorca": 1520,
    "ud-las-palmas": 1500,
    "ca-osasuna": 1520,
    "deportivo-alaves": 1490,
    "valencia-cf": 1510,
    "elche-cf": 1470,
    "rcd-espanyol-de-barcelona": 1480,
    "cd-leganes": 1470,
    "real-valladolid-cf": 1460,

    # Bundesliga
    "fc-bayern-munchen": 1780,
    "bayer-04-leverkusen": 1740,
    "borussia-dortmund": 1720,
    "rb-leipzig": 1700,
    "vfb-stuttgart": 1660,
    "eintracht-frankfurt": 1640,
    "sc-freiburg": 1620,
    "tsg-1899-hoffenheim": 1580,
    "vfl-wolfsburg": 1570,
    "1-fc-union-berlin": 1560,
    "borussia-monchengladbach": 1550,
    "fc-augsburg": 1530,
    "sv-werder-bremen": 1530,
    "1-fsv-mainz-05": 1520,
    "1-fc-heidenheim-1846": 1500,
    "fc-st-pauli": 1490,
    "holstein-kiel": 1470,
    "vfl-bochum-1848": 1460,

    # Serie A
    "fc-internazionale-milano": 1760,
    "ssc-napoli": 1740,
    "ac-milan": 1720,
    "juventus-fc": 1710,
    "atalanta-bc": 1700,
    "as-roma": 1660,
    "ss-lazio": 1640,
    "acf-fiorentina": 1620,
    "torino-fc": 1580,
    "bologna-fc-1909": 1580,
    "udinese-calcio": 1560,
    "us-sassuolo-calcio": 1540,
    "genoa-cfc": 1530,
    "cagliari-calcio": 1520,
    "hellas-verona-fc": 1500,
    "empoli-fc": 1490,
    "us-lecce": 1480,
    "frosinone-calcio": 1460,
    "us-salernitana-1919": 1450,
    "us-cremonese": 1470,
    "ac-pisa-1909": 1480,

    # Ligue 1
    "paris-saint-germain-fc": 1780,
    "olympique-de-marseille": 1680,
    "as-monaco-fc": 1660,
    "olympique-lyonnais": 1640,
    "losc-lille": 1640,
    "stade-rennais-fc-1901": 1600,
    "ogc-nice": 1590,
    "rc-lens": 1580,
    "rc-strasbourg-alsace": 1550,
    "stade-de-reims": 1540,
    "montpellier-hsc": 1530,
    "toulouse-fc": 1530,
    "fc-nantes": 1520,
    "stade-brestois-29": 1510,
    "aj-auxerre": 1500,
    "le-havre-ac": 1490,
    "angers-sco": 1480,
    "fc-metz": 1470,
    "clermont-foot-63": 1460,
    "fc-lorient": 1450,

    # Eredivisie
    "psv": 1720,
    "afc-ajax": 1710,
    "feyenoord-rotterdam": 1700,
    "az-alkmaar": 1620,
    "fc-twente-65": 1600,
    "fc-utrecht": 1580,
    "sc-heerenveen": 1540,
    "vitesse": 1530,
    "nec-nijmegen": 1520,
    "fc-groningen": 1510,
    "sparta-rotterdam": 1510,
    "go-ahead-eagles": 1500,
    "heracles-almelo": 1490,
    "rkc-waalwijk": 1480,
    "fortuna-sittard": 1480,
    "pec-zwolle": 1470,
    "excelsior-rotterdam": 1460,
    "fc-volendam": 1450,

    # Champions League teams (aliases)
    "paris-fc": 1500,
}


def get_seed_elo(team_slug: str) -> float | None:
    """Return the seed Elo for a team slug, or None if not found.

    Tries exact match first, then fuzzy partial match.
    """
    if team_slug in TEAM_SEED_ELO:
        return TEAM_SEED_ELO[team_slug]

    # Fuzzy match: check if any seed key is contained in the slug or vice versa
    slug_lower = team_slug.lower()
    for key, elo in TEAM_SEED_ELO.items():
        if key in slug_lower or slug_lower in key:
            return elo

    return None
