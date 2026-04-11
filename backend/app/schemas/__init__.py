"""
Sports Intelligence Platform — Pydantic v2 schema package.

All public schemas are re-exported from here so that the rest of the
application can import from ``app.schemas`` without knowing which module
each schema lives in, e.g.::

    from app.schemas import MatchDetail, ForecastOutput, PaginatedResponse

SIMULATION / EDUCATIONAL DISCLAIMER
------------------------------------
All probability estimates, forecasts, and model outputs produced by this
platform are for simulation and educational research purposes only. They
do not constitute financial, betting, or investment advice of any kind.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# common
# ---------------------------------------------------------------------------
from app.schemas.common import ApiResponse, PaginatedResponse

# ---------------------------------------------------------------------------
# sport
# ---------------------------------------------------------------------------
from app.schemas.sport import SportBase, SportCreate, SportResponse

# ---------------------------------------------------------------------------
# league
# ---------------------------------------------------------------------------
from app.schemas.league import LeagueBase, LeagueCreate, LeagueResponse

# ---------------------------------------------------------------------------
# team
# ---------------------------------------------------------------------------
from app.schemas.team import (
    TeamBase,
    TeamCreate,
    TeamDetail,
    TeamForm,
    TeamResponse,
    TeamStats,
)

# ---------------------------------------------------------------------------
# match
# ---------------------------------------------------------------------------
from app.schemas.match import (
    MatchAnalysis,
    MatchBase,
    MatchCreate,
    MatchDetail,
    MatchKeyStats,
    MatchResponse,
    MatchResultSchema,
)

# ---------------------------------------------------------------------------
# prediction
# ---------------------------------------------------------------------------
from app.schemas.prediction import (
    ForecastOutput,
    PredictionBase,
    PredictionCreate,
    PredictionEvaluationSchema,
    PredictionExplanationSchema,
    PredictionMatchResult,
    PredictionMatchSummary,
    PredictionModelSummary,
    PredictionResponse,
)

# ---------------------------------------------------------------------------
# trackrecord
# ---------------------------------------------------------------------------
from app.schemas.trackrecord import (
    CalibrationBucket,
    CalibrationReport,
    SegmentPerformance,
    TrackrecordSummary,
)

# ---------------------------------------------------------------------------
# report
# ---------------------------------------------------------------------------
from app.schemas.report import (
    GeneratedReportResponse,
    ReportJobCreate,
    ReportJobResponse,
)

# ---------------------------------------------------------------------------
# backtest
# ---------------------------------------------------------------------------
from app.schemas.backtest import (
    BacktestResultResponse,
    BacktestRunCreate,
    BacktestRunResponse,
)

# ---------------------------------------------------------------------------
# search
# ---------------------------------------------------------------------------
from app.schemas.search import SearchResponse, SearchResult, SearchResultGroup

# ---------------------------------------------------------------------------
# user
# ---------------------------------------------------------------------------
from app.schemas.user import Token, TokenData, UserCreate, UserLogin, UserResponse

__all__ = [
    # common
    "ApiResponse",
    "PaginatedResponse",
    # sport
    "SportBase",
    "SportCreate",
    "SportResponse",
    # league
    "LeagueBase",
    "LeagueCreate",
    "LeagueResponse",
    # team
    "TeamBase",
    "TeamCreate",
    "TeamDetail",
    "TeamForm",
    "TeamResponse",
    "TeamStats",
    # match
    "MatchAnalysis",
    "MatchBase",
    "MatchCreate",
    "MatchDetail",
    "MatchKeyStats",
    "MatchResponse",
    "MatchResultSchema",
    # prediction
    "ForecastOutput",
    "PredictionBase",
    "PredictionCreate",
    "PredictionEvaluationSchema",
    "PredictionExplanationSchema",
    "PredictionMatchResult",
    "PredictionMatchSummary",
    "PredictionModelSummary",
    "PredictionResponse",
    # trackrecord
    "CalibrationBucket",
    "CalibrationReport",
    "SegmentPerformance",
    "TrackrecordSummary",
    # report
    "GeneratedReportResponse",
    "ReportJobCreate",
    "ReportJobResponse",
    # backtest
    "BacktestResultResponse",
    "BacktestRunCreate",
    "BacktestRunResponse",
    # search
    "SearchResponse",
    "SearchResult",
    "SearchResultGroup",
    # user
    "Token",
    "TokenData",
    "UserCreate",
    "UserLogin",
    "UserResponse",
]
