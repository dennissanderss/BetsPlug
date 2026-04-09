"""Admin SEO audit routes."""

from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class PageSeoAnalysis(BaseModel):
    path: str
    title: str
    title_length: int
    title_score: str  # "good" | "too_short" | "too_long"
    meta_description: str
    meta_length: int
    meta_score: str  # "good" | "needs_improvement" | "missing"
    has_og_tags: bool
    has_schema: bool
    overall_score: int


# ---------------------------------------------------------------------------
# Hardcoded page analyses
# ---------------------------------------------------------------------------

_SEO_PAGES: List[dict] = [
    {
        "path": "/",
        "title": "Betsplug - AI-Powered Sports Predictions",
        "title_length": 43,
        "title_score": "good",
        "meta_description": "Data-driven sports predictions powered by machine learning. Get daily tips, track records, and betting strategy insights.",
        "meta_length": 120,
        "meta_score": "good",
        "has_og_tags": True,
        "has_schema": False,
        "overall_score": 72,
    },
    {
        "path": "/predictions",
        "title": "Today's Predictions - Betsplug",
        "title_length": 31,
        "title_score": "good",
        "meta_description": "Browse today's AI-generated sports predictions with confidence ratings and value analysis.",
        "meta_length": 90,
        "meta_score": "good",
        "has_og_tags": True,
        "has_schema": True,
        "overall_score": 88,
    },
    {
        "path": "/bet-of-the-day",
        "title": "Pick of the Day - Betsplug",
        "title_length": 26,
        "title_score": "good",
        "meta_description": "Our highest-confidence pick each day, backed by data analysis.",
        "meta_length": 62,
        "meta_score": "needs_improvement",
        "has_og_tags": True,
        "has_schema": False,
        "overall_score": 65,
    },
    {
        "path": "/results",
        "title": "Results - Betsplug",
        "title_length": 18,
        "title_score": "too_short",
        "meta_description": "View past prediction results and outcomes.",
        "meta_length": 43,
        "meta_score": "needs_improvement",
        "has_og_tags": False,
        "has_schema": False,
        "overall_score": 42,
    },
    {
        "path": "/trackrecord",
        "title": "Track Record - Betsplug Performance History",
        "title_length": 45,
        "title_score": "good",
        "meta_description": "Transparent performance history showing win rates, ROI, and prediction accuracy over time.",
        "meta_length": 91,
        "meta_score": "good",
        "has_og_tags": True,
        "has_schema": True,
        "overall_score": 91,
    },
    {
        "path": "/strategy",
        "title": "Betting Strategy Guide - Betsplug",
        "title_length": 34,
        "title_score": "good",
        "meta_description": "Learn proven betting strategies and bankroll management techniques.",
        "meta_length": 66,
        "meta_score": "needs_improvement",
        "has_og_tags": True,
        "has_schema": False,
        "overall_score": 68,
    },
    {
        "path": "/subscriptions",
        "title": "Pricing & Plans - Betsplug",
        "title_length": 27,
        "title_score": "good",
        "meta_description": "Choose a plan that fits your needs. Free and premium tiers available.",
        "meta_length": 68,
        "meta_score": "needs_improvement",
        "has_og_tags": True,
        "has_schema": True,
        "overall_score": 78,
    },
    {
        "path": "/about",
        "title": "About Us - Betsplug",
        "title_length": 20,
        "title_score": "too_short",
        "meta_description": "Meet the team behind Betsplug and learn about our mission to bring data-driven insights to sports fans.",
        "meta_length": 103,
        "meta_score": "good",
        "has_og_tags": False,
        "has_schema": False,
        "overall_score": 55,
    },
    {
        "path": "/support",
        "title": "Support & FAQ - Betsplug",
        "title_length": 25,
        "title_score": "good",
        "meta_description": "Get help with your account, subscriptions, and common questions.",
        "meta_length": 64,
        "meta_score": "needs_improvement",
        "has_og_tags": False,
        "has_schema": False,
        "overall_score": 50,
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/audit", response_model=List[PageSeoAnalysis])
async def seo_audit():
    """Return a hardcoded SEO analysis for known pages."""
    return [PageSeoAnalysis(**page) for page in _SEO_PAGES]
