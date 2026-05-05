"""Static branding data: league logos + colours + per-team colours / founded year.

Drives the marketing-facing /api/public/teams + /api/public/leagues endpoints
that the Astro site consumes. The fields here are not in the database
(API-Football's free endpoints don't return brand colours, and the existing
``Team`` / ``League`` ORM models have no ``founded`` or ``colors`` columns).

The mapping covers the 10 launch leagues listed in the marketing-site brief:
Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League,
Europa League, Eredivisie, Primeira Liga, Championship. Teams not in this
file still get served — they just return ``colors=None`` and ``founded=None``.

API-Football logo CDN: https://media.api-sports.io/football/{leagues|teams}/{id}.png
"""

from __future__ import annotations

from typing import Optional, TypedDict


class Colors(TypedDict):
    primary: str
    secondary: str


class LeagueBranding(TypedDict):
    api_football_id: int
    logo_url: str
    colors: Colors
    season: str


class TeamBranding(TypedDict, total=False):
    colors: Colors
    founded: int


# ---------------------------------------------------------------------------
# Leagues — top 10 covered by marketing site at launch.
# ``season`` is the human-readable season label; we keep it static rather
# than computing per-request because most leagues run Aug-May and the label
# only flips in July.
# ---------------------------------------------------------------------------

LEAGUE_BRANDING: dict[str, LeagueBranding] = {
    "premier-league": {
        "api_football_id": 39,
        "logo_url": "https://media.api-sports.io/football/leagues/39.png",
        "colors": {"primary": "#3D195B", "secondary": "#FFFFFF"},
        "season": "2025-26",
    },
    "championship": {
        "api_football_id": 40,
        "logo_url": "https://media.api-sports.io/football/leagues/40.png",
        "colors": {"primary": "#003B96", "secondary": "#E40523"},
        "season": "2025-26",
    },
    "la-liga": {
        "api_football_id": 140,
        "logo_url": "https://media.api-sports.io/football/leagues/140.png",
        "colors": {"primary": "#EE8707", "secondary": "#102541"},
        "season": "2025-26",
    },
    "bundesliga": {
        "api_football_id": 78,
        "logo_url": "https://media.api-sports.io/football/leagues/78.png",
        "colors": {"primary": "#D20515", "secondary": "#FFFFFF"},
        "season": "2025-26",
    },
    "serie-a": {
        "api_football_id": 135,
        "logo_url": "https://media.api-sports.io/football/leagues/135.png",
        "colors": {"primary": "#008FD7", "secondary": "#FFFFFF"},
        "season": "2025-26",
    },
    "ligue-1": {
        "api_football_id": 61,
        "logo_url": "https://media.api-sports.io/football/leagues/61.png",
        "colors": {"primary": "#091C3E", "secondary": "#DAE3EC"},
        "season": "2025-26",
    },
    "champions-league": {
        "api_football_id": 2,
        "logo_url": "https://media.api-sports.io/football/leagues/2.png",
        "colors": {"primary": "#0A0E2C", "secondary": "#FFFFFF"},
        "season": "2025-26",
    },
    "europa-league": {
        "api_football_id": 3,
        "logo_url": "https://media.api-sports.io/football/leagues/3.png",
        "colors": {"primary": "#FF6900", "secondary": "#0A0E2C"},
        "season": "2025-26",
    },
    "eredivisie": {
        "api_football_id": 88,
        "logo_url": "https://media.api-sports.io/football/leagues/88.png",
        "colors": {"primary": "#E2001A", "secondary": "#FFFFFF"},
        "season": "2025-26",
    },
    "primeira-liga": {
        "api_football_id": 94,
        "logo_url": "https://media.api-sports.io/football/leagues/94.png",
        "colors": {"primary": "#006A4D", "secondary": "#E20E17"},
        "season": "2025-26",
    },
}


# Public list of league slugs in the order they should appear in /api/public/leagues.
# Top-5 European competitions first, then UEFA, then the remaining domestic ones.
LEAGUE_DISPLAY_ORDER: tuple[str, ...] = (
    "premier-league",
    "la-liga",
    "bundesliga",
    "serie-a",
    "ligue-1",
    "champions-league",
    "europa-league",
    "eredivisie",
    "primeira-liga",
    "championship",
)


# ---------------------------------------------------------------------------
# Teams — colours and (optional) founded year for top clubs across the 6
# domestic launch leagues. Coverage is intentionally partial: clubs not in
# this map still resolve via the DB row, just with null colours/founded.
# Source: club crests / official brand guidelines, cross-referenced with
# Wikipedia for founded years.
# ---------------------------------------------------------------------------

TEAM_BRANDING: dict[str, TeamBranding] = {
    # ── Premier League ─────────────────────────────────────────────────────
    "manchester-city": {"colors": {"primary": "#6CABDD", "secondary": "#FFFFFF"}, "founded": 1880},
    "arsenal": {"colors": {"primary": "#EF0107", "secondary": "#FFFFFF"}, "founded": 1886},
    "liverpool": {"colors": {"primary": "#C8102E", "secondary": "#F6EB61"}, "founded": 1892},
    "chelsea": {"colors": {"primary": "#034694", "secondary": "#FFFFFF"}, "founded": 1905},
    "manchester-united": {"colors": {"primary": "#DA291C", "secondary": "#FBE122"}, "founded": 1878},
    "tottenham": {"colors": {"primary": "#132257", "secondary": "#FFFFFF"}, "founded": 1882},
    "newcastle": {"colors": {"primary": "#241F20", "secondary": "#FFFFFF"}, "founded": 1892},
    "brighton": {"colors": {"primary": "#0057B8", "secondary": "#FFCD00"}, "founded": 1901},
    "aston-villa": {"colors": {"primary": "#670E36", "secondary": "#95BFE5"}, "founded": 1874},
    "west-ham": {"colors": {"primary": "#7A263A", "secondary": "#1BB1E7"}, "founded": 1895},
    "crystal-palace": {"colors": {"primary": "#1B458F", "secondary": "#C4122E"}, "founded": 1905},
    "everton": {"colors": {"primary": "#003399", "secondary": "#FFFFFF"}, "founded": 1878},
    "fulham": {"colors": {"primary": "#000000", "secondary": "#CC0000"}, "founded": 1879},
    "brentford": {"colors": {"primary": "#E30613", "secondary": "#FFFFFF"}, "founded": 1889},
    "wolves": {"colors": {"primary": "#FDB913", "secondary": "#231F20"}, "founded": 1877},
    "nottingham-forest": {"colors": {"primary": "#DD0000", "secondary": "#FFFFFF"}, "founded": 1865},
    "bournemouth": {"colors": {"primary": "#DA291C", "secondary": "#000000"}, "founded": 1899},
    "sheffield-united": {"colors": {"primary": "#EE2737", "secondary": "#FFFFFF"}, "founded": 1889},
    "burnley": {"colors": {"primary": "#6C1D45", "secondary": "#99D6EA"}, "founded": 1882},
    "luton-town": {"colors": {"primary": "#F78F1E", "secondary": "#1C2541"}, "founded": 1885},

    # ── La Liga ────────────────────────────────────────────────────────────
    "real-madrid": {"colors": {"primary": "#FEBE10", "secondary": "#FFFFFF"}, "founded": 1902},
    "barcelona": {"colors": {"primary": "#A50044", "secondary": "#004D98"}, "founded": 1899},
    "atletico-madrid": {"colors": {"primary": "#CB3524", "secondary": "#262E61"}, "founded": 1903},
    "athletic-bilbao": {"colors": {"primary": "#EE2523", "secondary": "#FFFFFF"}, "founded": 1898},
    "real-sociedad": {"colors": {"primary": "#0067B1", "secondary": "#FFFFFF"}, "founded": 1909},
    "sevilla": {"colors": {"primary": "#D00027", "secondary": "#FFFFFF"}, "founded": 1890},
    "real-betis": {"colors": {"primary": "#00954C", "secondary": "#FFFFFF"}, "founded": 1907},
    "villarreal": {"colors": {"primary": "#FFE667", "secondary": "#005187"}, "founded": 1923},
    "valencia": {"colors": {"primary": "#EE3524", "secondary": "#000000"}, "founded": 1919},
    "getafe": {"colors": {"primary": "#1A4189", "secondary": "#FFFFFF"}, "founded": 1983},
    "girona": {"colors": {"primary": "#CC0000", "secondary": "#FFFFFF"}, "founded": 1930},
    "osasuna": {"colors": {"primary": "#D91A21", "secondary": "#0A346F"}, "founded": 1920},
    "mallorca": {"colors": {"primary": "#CC0000", "secondary": "#FFE600"}, "founded": 1916},
    "celta-vigo": {"colors": {"primary": "#8AC1E8", "secondary": "#FFFFFF"}, "founded": 1923},
    "rayo-vallecano": {"colors": {"primary": "#FFFFFF", "secondary": "#E53027"}, "founded": 1924},
    "alaves": {"colors": {"primary": "#005CA9", "secondary": "#FFFFFF"}, "founded": 1921},
    "las-palmas": {"colors": {"primary": "#FFE600", "secondary": "#1965B2"}, "founded": 1949},
    "cadiz": {"colors": {"primary": "#FFE600", "secondary": "#003C8C"}, "founded": 1910},
    "granada": {"colors": {"primary": "#C8102E", "secondary": "#FFFFFF"}, "founded": 1931},
    "almeria": {"colors": {"primary": "#E60026", "secondary": "#FFFFFF"}, "founded": 1989},

    # ── Bundesliga ─────────────────────────────────────────────────────────
    "bayern-munich": {"colors": {"primary": "#DC052D", "secondary": "#0066B2"}, "founded": 1900},
    "borussia-dortmund": {"colors": {"primary": "#FDE100", "secondary": "#000000"}, "founded": 1909},
    "bayer-leverkusen": {"colors": {"primary": "#E32221", "secondary": "#000000"}, "founded": 1904},
    "rb-leipzig": {"colors": {"primary": "#DD0741", "secondary": "#001A4F"}, "founded": 2009},
    "eintracht-frankfurt": {"colors": {"primary": "#E1000F", "secondary": "#000000"}, "founded": 1899},
    "vfb-stuttgart": {"colors": {"primary": "#E32219", "secondary": "#FFFFFF"}, "founded": 1893},
    "borussia-monchengladbach": {"colors": {"primary": "#000000", "secondary": "#00B04F"}, "founded": 1900},
    "werder-bremen": {"colors": {"primary": "#1D9053", "secondary": "#FFFFFF"}, "founded": 1899},
    "freiburg": {"colors": {"primary": "#5B2C8C", "secondary": "#E32219"}, "founded": 1904},
    "hoffenheim": {"colors": {"primary": "#1961AC", "secondary": "#FFFFFF"}, "founded": 1899},
    "mainz": {"colors": {"primary": "#C3141E", "secondary": "#FFFFFF"}, "founded": 1905},
    "augsburg": {"colors": {"primary": "#BA3733", "secondary": "#005A9C"}, "founded": 1907},
    "koln": {"colors": {"primary": "#ED1C24", "secondary": "#FFFFFF"}, "founded": 1948},
    "bochum": {"colors": {"primary": "#005CA9", "secondary": "#FFFFFF"}, "founded": 1938},
    "wolfsburg": {"colors": {"primary": "#65B32E", "secondary": "#FFFFFF"}, "founded": 1945},
    "union-berlin": {"colors": {"primary": "#E2001A", "secondary": "#FFE600"}, "founded": 1966},
    "heidenheim": {"colors": {"primary": "#E2001A", "secondary": "#0A346F"}, "founded": 1846},
    "darmstadt": {"colors": {"primary": "#005CA9", "secondary": "#FFFFFF"}, "founded": 1898},

    # ── Serie A ────────────────────────────────────────────────────────────
    "inter-milan": {"colors": {"primary": "#0068A8", "secondary": "#000000"}, "founded": 1908},
    "juventus": {"colors": {"primary": "#000000", "secondary": "#FFFFFF"}, "founded": 1897},
    "ac-milan": {"colors": {"primary": "#FB090B", "secondary": "#000000"}, "founded": 1899},
    "napoli": {"colors": {"primary": "#0046AD", "secondary": "#FFFFFF"}, "founded": 1926},
    "roma": {"colors": {"primary": "#8E1F2F", "secondary": "#F0BC42"}, "founded": 1927},
    "atalanta": {"colors": {"primary": "#1B72B8", "secondary": "#000000"}, "founded": 1907},
    "lazio": {"colors": {"primary": "#87CEEB", "secondary": "#FFFFFF"}, "founded": 1900},
    "fiorentina": {"colors": {"primary": "#592C82", "secondary": "#FFFFFF"}, "founded": 1926},
    "bologna": {"colors": {"primary": "#9F1F2E", "secondary": "#1F2E5B"}, "founded": 1909},
    "torino": {"colors": {"primary": "#8B1A1A", "secondary": "#FFFFFF"}, "founded": 1906},
    "monza": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1912},
    "genoa": {"colors": {"primary": "#C8102E", "secondary": "#001489"}, "founded": 1893},
    "lecce": {"colors": {"primary": "#FFE600", "secondary": "#E2001A"}, "founded": 1908},
    "sassuolo": {"colors": {"primary": "#00A859", "secondary": "#000000"}, "founded": 1920},
    "udinese": {"colors": {"primary": "#000000", "secondary": "#FFFFFF"}, "founded": 1896},
    "frosinone": {"colors": {"primary": "#FFE600", "secondary": "#0066B2"}, "founded": 1928},
    "empoli": {"colors": {"primary": "#0066B2", "secondary": "#FFFFFF"}, "founded": 1920},
    "hellas-verona": {"colors": {"primary": "#FFE600", "secondary": "#0046AD"}, "founded": 1903},
    "cagliari": {"colors": {"primary": "#A1112D", "secondary": "#0A346F"}, "founded": 1920},
    "salernitana": {"colors": {"primary": "#762828", "secondary": "#FFFFFF"}, "founded": 1919},

    # ── Ligue 1 ────────────────────────────────────────────────────────────
    "psg": {"colors": {"primary": "#004170", "secondary": "#DA291C"}, "founded": 1970},
    "marseille": {"colors": {"primary": "#2FAEE0", "secondary": "#FFFFFF"}, "founded": 1899},
    "monaco": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1924},
    "lyon": {"colors": {"primary": "#E2001A", "secondary": "#0046AD"}, "founded": 1950},
    "lille": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1944},
    "nice": {"colors": {"primary": "#E2001A", "secondary": "#000000"}, "founded": 1904},
    "lens": {"colors": {"primary": "#FFE600", "secondary": "#E2001A"}, "founded": 1906},
    "rennes": {"colors": {"primary": "#E2001A", "secondary": "#000000"}, "founded": 1901},
    "strasbourg": {"colors": {"primary": "#005CA9", "secondary": "#FFFFFF"}, "founded": 1906},
    "brest": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1950},
    "montpellier": {"colors": {"primary": "#F58220", "secondary": "#0046AD"}, "founded": 1974},
    "nantes": {"colors": {"primary": "#FFE600", "secondary": "#00A859"}, "founded": 1943},
    "reims": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1931},
    "toulouse": {"colors": {"primary": "#5B2C82", "secondary": "#FFFFFF"}, "founded": 1970},
    "le-havre": {"colors": {"primary": "#005CA9", "secondary": "#87CEEB"}, "founded": 1872},
    "metz": {"colors": {"primary": "#7E1A2A", "secondary": "#FFFFFF"}, "founded": 1932},
    "clermont": {"colors": {"primary": "#E2001A", "secondary": "#0046AD"}, "founded": 1990},
    "lorient": {"colors": {"primary": "#E2701F", "secondary": "#000000"}, "founded": 1926},

    # ── Eredivisie ─────────────────────────────────────────────────────────
    "ajax": {"colors": {"primary": "#D2122E", "secondary": "#FFFFFF"}, "founded": 1900},
    "psv-eindhoven": {"colors": {"primary": "#ED1C24", "secondary": "#FFFFFF"}, "founded": 1913},
    "feyenoord": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1908},
    "az-alkmaar": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1967},
    "fc-twente": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1965},
    "vitesse": {"colors": {"primary": "#FFE600", "secondary": "#000000"}, "founded": 1892},
    "heerenveen": {"colors": {"primary": "#005CA9", "secondary": "#FFFFFF"}, "founded": 1920},
    "utrecht": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1970},
    "sparta-rotterdam": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1888},
    "go-ahead-eagles": {"colors": {"primary": "#E2001A", "secondary": "#FFE600"}, "founded": 1902},
    "fortuna-sittard": {"colors": {"primary": "#FFE600", "secondary": "#00A859"}, "founded": 1968},
    "nec-nijmegen": {"colors": {"primary": "#E2001A", "secondary": "#000000"}, "founded": 1900},
    "rkc-waalwijk": {"colors": {"primary": "#FFE600", "secondary": "#0046AD"}, "founded": 1940},
    "almere-city": {"colors": {"primary": "#000000", "secondary": "#FFFFFF"}, "founded": 2001},
    "excelsior": {"colors": {"primary": "#E2001A", "secondary": "#000000"}, "founded": 1902},
    "heracles-almelo": {"colors": {"primary": "#000000", "secondary": "#FFFFFF"}, "founded": 1903},
    "volendam": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1920},
    "pec-zwolle": {"colors": {"primary": "#005CA9", "secondary": "#FFFFFF"}, "founded": 1910},

    # ── Primeira Liga / European regulars ──────────────────────────────────
    "benfica": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1904},
    "porto": {"colors": {"primary": "#003DA5", "secondary": "#FFFFFF"}, "founded": 1893},
    "sporting-cp": {"colors": {"primary": "#008458", "secondary": "#FFFFFF"}, "founded": 1906},
    "braga": {"colors": {"primary": "#E2001A", "secondary": "#FFFFFF"}, "founded": 1921},
    "galatasaray": {"colors": {"primary": "#FFE600", "secondary": "#E2001A"}, "founded": 1905},
    "fenerbahce": {"colors": {"primary": "#FFE600", "secondary": "#0046AD"}, "founded": 1907},
}


def get_league_branding(slug: str) -> Optional[LeagueBranding]:
    return LEAGUE_BRANDING.get(slug)


def get_team_branding(slug: str) -> Optional[TeamBranding]:
    return TEAM_BRANDING.get(slug)


def is_supported_league(slug: str) -> bool:
    return slug in LEAGUE_BRANDING
