"""Regression guard against dashboard/trackrecord/pricing tier drift.

The 2026-04 dashboard outage (`_v81` undefined after a rename left one of
three call-sites stale) happened because the per-tier aggregate SQL was
copy-pasted across three files. This test ensures:

1. The shared helper ``per_tier_evaluated_stmt`` compiles and emits the
   expected SELECT shape.
2. Dashboard and trackrecord routes call into the shared helper rather
   than reintroducing an inline copy.

The actual data-parity check (dashboard == trackrecord == pricing for
the same tier) requires a seeded DB and lives in
``tests/integration/test_tier_parity_data.py`` (not yet written; needs
Postgres-with-data fixture).
"""
from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import select


def test_aggregate_queries_module_compiles():
    """Importing the shared helper must not blow up at module load."""
    from app.core.aggregate_queries import per_tier_evaluated_stmt

    stmt = per_tier_evaluated_stmt()
    assert stmt is not None


def test_per_tier_stmt_shape():
    """The shared helper should produce a SELECT with 3 columns and a GROUP BY."""
    from app.core.aggregate_queries import per_tier_evaluated_stmt

    stmt = per_tier_evaluated_stmt()
    compiled = str(stmt.compile(compile_kwargs={"literal_binds": False}))

    # Must select the tier expression + count + sum(correct-cast)
    assert "count" in compiled.lower()
    assert "sum" in compiled.lower()
    # Must GROUP BY (same CASE-expression reused)
    assert "group by" in compiled.lower()
    # Must JOIN predictions + prediction_evaluations + matches
    assert "prediction_evaluations" in compiled.lower()
    assert "predictions" in compiled.lower()
    assert "matches" in compiled.lower()


def test_per_tier_stmt_source_filter():
    """Passing source='live' should add prediction_source WHERE clause."""
    from app.core.aggregate_queries import per_tier_evaluated_stmt

    # Compare SQL-shape with and without source — the source=live variant
    # must mention prediction_source. We avoid literal_binds because
    # UUIDs in LEAGUES_* can't render as backend-agnostic literals.
    base = str(per_tier_evaluated_stmt().compile())
    with_source = str(per_tier_evaluated_stmt(source="live").compile())
    assert "prediction_source" in with_source
    assert "prediction_source" not in base or base.count("prediction_source") < with_source.count(
        "prediction_source"
    )


def test_dashboard_uses_shared_helper():
    """Prevent regression: dashboard.py must call per_tier_evaluated_stmt,
    not rebuild the query inline with its own variable names."""
    path = (
        Path(__file__).parent.parent.parent
        / "app"
        / "api"
        / "routes"
        / "dashboard.py"
    )
    src = path.read_text(encoding="utf-8")
    assert "per_tier_evaluated_stmt" in src, (
        "dashboard.py should use the shared helper from "
        "app.core.aggregate_queries to avoid drift"
    )
    # Also: no leftover `_v81` identifier — the exact regression we guard against.
    assert "_v81" not in src, (
        "dashboard.py still references `_v81` (the 2026-04 outage root cause)"
    )


def test_trackrecord_uses_shared_helper():
    """Same regression-guard for the trackrecord summary per_tier block."""
    path = (
        Path(__file__).parent.parent.parent
        / "app"
        / "api"
        / "routes"
        / "trackrecord.py"
    )
    src = path.read_text(encoding="utf-8")
    assert "per_tier_evaluated_stmt" in src, (
        "trackrecord.py should use the shared helper from "
        "app.core.aggregate_queries"
    )
