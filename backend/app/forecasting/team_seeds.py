"""DEPRECATED — DO NOT USE.

This module used to return hardcoded present-day Elo seeds per team.
It was the root cause of the v4-era feature leakage: every historical
backfill silently used April-2026 knowledge of team strength when
"predicting" earlier fixtures, inflating strategy win rates far above
what a real 1X2 model can achieve.

v5 replaces it with :mod:`app.forecasting.elo_history`, which walks
every finished match in chronological order and persists post-match
ratings in the ``team_elo_history`` table. Predictions read the table
with a strict ``effective_at < kickoff`` filter and a hard-fail
anti-leakage assertion.

Any import from this module will raise. If you hit this in a stack
trace, switch the caller to ``EloHistoryService.get_rating_at``.
"""


_DEPRECATION_MSG = (
    "team_seeds.py is deprecated due to feature leakage in the v4 audit. "
    "Use app.forecasting.elo_history.EloHistoryService instead. "
    "See docs/session_audit_report.md §'Honest path forward' for context."
)


def get_seed_elo(team_slug: str) -> float | None:  # noqa: ARG001
    """Always raises. Kept as a function signature so grep works."""
    raise NotImplementedError(_DEPRECATION_MSG)


# Re-export an empty dict so any ``from team_seeds import TEAM_SEED_ELO``
# call site at least imports cleanly until it tries to use the value.
TEAM_SEED_ELO: dict[str, float] = {}
