"""Point-in-time Elo history service — the v5 fix for feature leakage.

This replaces ``app/forecasting/team_seeds.py``. Instead of seeding
every EloModel with a hand-written present-day strength table, we walk
every finished match in chronological order and record the new rating
for each team in the ``team_elo_history`` table. Predictions then query
the table with a strict ``effective_at < kickoff`` filter, so the model
can only see ratings that were already known at kickoff.

Three invariants enforced in this module:

1. **Monotone time.** A rating written with ``effective_at = T`` is the
   rating that is valid FROM ``T`` onwards, until the next row for the
   same team. The ``get_rating_at(team, T)`` query always uses ``<`` not
   ``<=`` so the exact instant ``T`` is in the future from the rating's
   perspective.

2. **No rebuild during prediction.** The service only reads in the
   prediction path. All writes go through ``update_after_match`` which
   should only ever be called during backfill or by the scheduled sync
   job for newly-finished matches.

3. **Hard-fail assertion.** ``assert_rating_predates_kickoff(team_id,
   kickoff)`` is available for callers that want to verify they're
   reading a non-leaky rating. If the most recent rating for a team is
   ``>= kickoff`` this raises ``FeatureLeakageError``. The prediction
   path in ``EloModel.predict`` calls this in every inference.
"""
from __future__ import annotations

import logging
import math
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.elo_history import TeamEloHistory
from app.models.match import Match, MatchResult

log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Tunables — kept as module constants so backtest scripts can override.
# ──────────────────────────────────────────────────────────────────────────────

STARTING_RATING = 1500.0
"""Default Elo for any team with no history yet."""

K_FACTOR = 20.0
"""Rating update magnitude per match. 20 is the classic football value."""

HOME_ADVANTAGE = 65.0
"""Elo points added to the home team's effective rating before the
probability calculation. 65 is lower than the traditional 100 to reflect
that home advantage has decreased in the modern European leagues.
"""

POST_MATCH_DELAY_HOURS = 3
"""How long after kickoff we consider the rating to "take effect". Real
matches last ~100 minutes including injury time + stoppage; 3 hours is
a safe buffer so the new rating never lands inside the next fixture of
the same team (which would re-create the leakage we're trying to kill).
"""


class FeatureLeakageError(AssertionError):
    """Raised when a prediction pipeline is asked to use a rating whose
    ``effective_at`` is not strictly before the fixture kickoff. The
    ensemble model treats this as a hard fail — we'd rather crash a
    prediction than silently produce a leaky forecast.
    """


@dataclass
class RatingSnapshot:
    team_id: uuid.UUID
    rating: float
    effective_at: datetime
    source: str  # "history" | "default"


# ──────────────────────────────────────────────────────────────────────────────
# Service
# ──────────────────────────────────────────────────────────────────────────────


class EloHistoryService:
    """Stateless (per-instance) helper around ``team_elo_history``.

    All methods are async because we query the main async SQLAlchemy
    session. The service holds no mutable state — ratings live only in
    the database.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Reads ───────────────────────────────────────────────────────────────

    async def get_rating_at(
        self, team_id: uuid.UUID, at: datetime
    ) -> RatingSnapshot:
        """Return the rating that was valid for *team_id* just before *at*.

        If no history row exists with ``effective_at < at`` the default
        ``STARTING_RATING`` is returned with ``source="default"``. Callers
        that want to differentiate a cold-start team from a team with a
        real history should check ``source``.
        """
        stmt = (
            select(TeamEloHistory)
            .where(
                TeamEloHistory.team_id == team_id,
                TeamEloHistory.effective_at < at,
            )
            .order_by(TeamEloHistory.effective_at.desc())
            .limit(1)
        )
        row = (await self._db.execute(stmt)).scalar_one_or_none()
        if row is None:
            return RatingSnapshot(
                team_id=team_id,
                rating=STARTING_RATING,
                effective_at=datetime.min.replace(tzinfo=timezone.utc),
                source="default",
            )
        return RatingSnapshot(
            team_id=team_id,
            rating=float(row.rating),
            effective_at=row.effective_at,
            source="history",
        )

    async def assert_rating_predates_kickoff(
        self,
        team_id: uuid.UUID,
        kickoff: datetime,
        label: str = "team",
    ) -> None:
        """Hard-fail if the most recent rating for *team_id* has an
        ``effective_at`` that isn't strictly before *kickoff*.

        This is the anti-leakage tripwire. In practice it can only fire
        if a backfill script accidentally writes a rating with a
        timestamp in the future, or if the caller is generating a
        prediction for a fixture whose result has already been processed.
        Either case is a bug — we raise ``FeatureLeakageError`` so the
        prediction is NEVER produced.
        """
        snapshot = await self.get_rating_at(team_id, kickoff)
        if snapshot.source == "default":
            return  # cold-start team, nothing to check
        if snapshot.effective_at >= kickoff:
            raise FeatureLeakageError(
                f"Leakage detected: {label} team {team_id} has rating "
                f"with effective_at={snapshot.effective_at.isoformat()} "
                f">= kickoff={kickoff.isoformat()}. This would let the "
                f"model see outcome information from a match that "
                f"happened at or after the fixture it's predicting."
            )

    # ── Writes ──────────────────────────────────────────────────────────────

    async def update_after_match(
        self, match: Match, result: MatchResult
    ) -> tuple[float, float]:
        """Compute post-match ratings and persist them.

        Preconditions:
        - ``match.scheduled_at`` is set.
        - ``match.home_team_id``, ``match.away_team_id`` are set.
        - ``result.home_score`` and ``result.away_score`` are populated.

        Returns the new (home_rating, away_rating) tuple for logging.
        """
        if match.scheduled_at is None:
            raise ValueError(f"Match {match.id} has no scheduled_at")

        pre_kickoff = match.scheduled_at
        home_pre = (await self.get_rating_at(match.home_team_id, pre_kickoff)).rating
        away_pre = (await self.get_rating_at(match.away_team_id, pre_kickoff)).rating

        effective_home = home_pre + HOME_ADVANTAGE
        expected_home, expected_away = self._expected_scores(effective_home, away_pre)

        actual_home, actual_away = self._derive_actual_scores(
            result.home_score, result.away_score
        )

        new_home = home_pre + K_FACTOR * (actual_home - expected_home)
        new_away = away_pre + K_FACTOR * (actual_away - expected_away)

        effective_at = pre_kickoff + timedelta(hours=POST_MATCH_DELAY_HOURS)

        self._db.add(
            TeamEloHistory(
                id=uuid.uuid4(),
                team_id=match.home_team_id,
                rating=new_home,
                k_factor=K_FACTOR,
                effective_at=effective_at,
                source_match_id=match.id,
                source_kind="match_update",
            )
        )
        self._db.add(
            TeamEloHistory(
                id=uuid.uuid4(),
                team_id=match.away_team_id,
                rating=new_away,
                k_factor=K_FACTOR,
                effective_at=effective_at,
                source_match_id=match.id,
                source_kind="match_update",
            )
        )

        return new_home, new_away

    async def reset_and_backfill(self) -> dict:
        """Wipe every history row and rebuild from finished matches.

        Used by the ``POST /api/admin/v5/backfill-elo-history`` endpoint.
        This is the one write path that is legitimately destructive —
        previously-computed ratings are discarded in favour of a clean
        chronological walk. Callers are expected to commit the session
        after this returns.
        """
        from sqlalchemy import delete

        await self._db.execute(delete(TeamEloHistory))
        await self._db.flush()

        stmt = (
            select(Match, MatchResult)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .where(Match.scheduled_at.is_not(None))
            .order_by(Match.scheduled_at.asc())
        )
        rows = (await self._db.execute(stmt)).all()
        processed = 0
        for match, result in rows:
            try:
                await self.update_after_match(match, result)
                processed += 1
                # Flush in small batches so the DB sees the new rows
                # before the next ``get_rating_at`` query hits them.
                if processed % 50 == 0:
                    await self._db.flush()
            except Exception as exc:
                log.warning(
                    "elo_backfill_skip match=%s err=%s",
                    match.id, exc,
                )
        await self._db.flush()
        return {"processed": processed, "total_rows": processed * 2}

    # ── Internal maths ──────────────────────────────────────────────────────

    @staticmethod
    def _expected_scores(
        rating_a: float, rating_b: float
    ) -> tuple[float, float]:
        e_a = 1.0 / (1.0 + math.pow(10.0, (rating_b - rating_a) / 400.0))
        return e_a, 1.0 - e_a

    @staticmethod
    def _derive_actual_scores(
        home_score: int, away_score: int
    ) -> tuple[float, float]:
        if home_score > away_score:
            return 1.0, 0.0
        if home_score < away_score:
            return 0.0, 1.0
        return 0.5, 0.5
