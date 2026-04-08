"""
Adapter registry.

Maps the ``adapter_type`` string stored on ``DataSource.adapter_type`` to the
concrete adapter class.  The ingestion service uses this registry to
instantiate the correct adapter at runtime.

To register a new adapter, import its class and add it to ``ADAPTER_REGISTRY``.

Live data adapters (no paid key required)
-----------------------------------------
openligadb         – OpenLigaDB (German football, completely free, no key)
football_data_org  – football-data.org v4 (free tier, key optional but recommended)
thesportsdb        – TheSportsDB (free tier key=3 embedded in URL)
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from app.ingestion.adapters.sample_football import SampleFootballAdapter
from app.ingestion.adapters.sample_basketball import SampleBasketballAdapter
from app.ingestion.adapters.api_football import APIFootballAdapter
from app.ingestion.adapters.football_data_org import FootballDataOrgAdapter
from app.ingestion.adapters.openligadb import OpenLigaDBAdapter
from app.ingestion.adapters.thesportsdb import TheSportsDBAdapter

if TYPE_CHECKING:
    from app.ingestion.base_adapter import DataSourceAdapter

# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------
# key   : the value stored in DataSource.adapter_type
# value : the concrete DataSourceAdapter subclass
ADAPTER_REGISTRY: dict[str, type[DataSourceAdapter]] = {
    # Sample / seed adapters (offline, no HTTP)
    "sample_football":    SampleFootballAdapter,
    "sample_basketball":  SampleBasketballAdapter,
    # Live data adapters
    "api_football":       APIFootballAdapter,
    "openligadb":         OpenLigaDBAdapter,
    "football_data_org":  FootballDataOrgAdapter,
    "thesportsdb":        TheSportsDBAdapter,
}

__all__ = [
    "ADAPTER_REGISTRY",
    "APIFootballAdapter",
    "SampleFootballAdapter",
    "SampleBasketballAdapter",
    "FootballDataOrgAdapter",
    "OpenLigaDBAdapter",
    "TheSportsDBAdapter",
]
