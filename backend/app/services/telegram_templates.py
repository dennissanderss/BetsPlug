"""English-only message templates for the @BetsPluggs Telegram channel.

Design goals (v2, 2026-04):
    - ONE language per post (EN) — bilingual bodies doubled scroll length
      without measurable reach gain.
    - Every post fits on a phone screen without scrolling: pick posts
      are capped at ~8 lines, result replies at ~4.
    - Hierarchy via bold headers (Telegram MarkdownV2), not via stacking
      emojis on every line.
    - Section emojis only where they add meaning (✅/❌ verdict, ⏳
      pending). No decorative spam.
    - Disclaimers (18+, "statistical analysis") live in the channel
      description — NOT on every single pick post.
    - No ASCII rules (`━━━`) — they render fine on desktop but break
      lines on mobile Telegram clients.

The functions are PURE string formatters producing MarkdownV2-safe text.
Callers MUST send the result with ``parse_mode="MarkdownV2"`` — the
helper ``_md`` below escapes the reserved MarkdownV2 characters so
team/league names with `.`, `-`, `(`, `!` etc. don't trigger a 400 from
the Bot API.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from app.models.prediction import Prediction


_CET = ZoneInfo("Europe/Amsterdam")

# MarkdownV2 reserved characters that MUST be backslash-escaped when
# appearing as literal text (not as formatting). See
# https://core.telegram.org/bots/api#markdownv2-style.
_MDV2_RESERVED = r"_*[]()~`>#+-=|{}.!"


def _md(text: str) -> str:
    """Escape a string for safe inclusion in MarkdownV2 text.

    Leaves bold/italic markers to the caller — this helper is for
    literal values (team names, league names, numbers) that must not
    be interpreted as formatting.
    """
    if text is None:
        return ""
    out = []
    for ch in str(text):
        if ch in _MDV2_RESERVED:
            out.append("\\" + ch)
        else:
            out.append(ch)
    return "".join(out)


# ---------------------------------------------------------------------------
# Pick direction — argmax fallback for older rows without `pick` column
# ---------------------------------------------------------------------------


def _pick_label(pick: Optional[str], home_team: str, away_team: str) -> str:
    if pick is None:
        return "—"
    norm = pick.strip().upper()
    if norm == "HOME":
        return f"{home_team} win"
    if norm == "AWAY":
        return f"{away_team} win"
    if norm == "DRAW":
        return "Draw"
    return pick


def _infer_pick(prediction: Prediction) -> str:
    """Return HOME/DRAW/AWAY based on the highest outcome probability.

    Older Prediction rows don't carry an explicit `pick` column; in that
    case fall back to argmax of the three probs so the template never
    prints a bare dash.
    """
    stored = getattr(prediction, "pick", None)
    if stored:
        return stored
    probs = {
        "HOME": prediction.home_win_prob or 0.0,
        "DRAW": prediction.draw_prob or 0.0,
        "AWAY": prediction.away_win_prob or 0.0,
    }
    return max(probs, key=lambda k: probs[k])


def _fmt_odds(val: Optional[float]) -> str:
    if val is None:
        return "—"
    return f"{val:.2f}"


def _fmt_confidence_pct(conf: Optional[float]) -> str:
    if conf is None:
        return "—"
    return f"{round(conf * 100)}"


def _fmt_kickoff_cet(when: datetime) -> str:
    """Compact kickoff format: 'Thu 23 Apr · 20:00 CET'."""
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    local = when.astimezone(_CET)
    return local.strftime("%a %d %b · %H:%M CET")


def _fmt_date(when: datetime) -> str:
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    local = when.astimezone(_CET)
    return local.strftime("%a %d %b")


# ---------------------------------------------------------------------------
# Public templates
# ---------------------------------------------------------------------------


def render_pick_message(
    prediction: Prediction,
    odds_home: Optional[float] = None,
    odds_draw: Optional[float] = None,
    odds_away: Optional[float] = None,
) -> str:
    """Render a compact pick announcement (MarkdownV2, ~7 lines).

    Shape::

        *Arsenal vs Chelsea*
        Premier League · Thu 23 Apr · 20:00 CET

        *Pick:* Arsenal win
        *Confidence:* 62%
        *Odds:* 1.95 / 3.40 / 4.20

        _Result posted below after full-time_
    """
    match = prediction.match
    home_name = match.home_team.name if match.home_team else "Home"
    away_name = match.away_team.name if match.away_team else "Away"
    league_name = match.league.name if match.league else "—"
    kickoff = match.scheduled_at
    pick = _infer_pick(prediction)
    pick_str = _pick_label(pick, home_name, away_name)
    conf_pct = _fmt_confidence_pct(prediction.confidence)

    odds_str = (
        f"{_fmt_odds(odds_home)} / "
        f"{_fmt_odds(odds_draw)} / "
        f"{_fmt_odds(odds_away)}"
    )

    # Build MarkdownV2 body. Bold wraps the *label*, the value is escaped
    # plain text. Star characters inside bold are literal — they are the
    # Markdown delimiter, not content, so they don't get escaped.
    lines = [
        f"*{_md(home_name)} vs {_md(away_name)}*",
        f"{_md(league_name)} · {_md(_fmt_kickoff_cet(kickoff))}",
        "",
        f"*Pick:* {_md(pick_str)}",
        f"*Confidence:* {_md(conf_pct)}%",
        f"*Odds:* {_md(odds_str)}",
        "",
        "_Result posted below after full\\-time_",
    ]
    return "\n".join(lines)


def render_result_update(
    prediction: Prediction,
    home_score: int,
    away_score: int,
    was_correct: bool,
    weekly_accuracy_pct: Optional[float] = None,
) -> str:
    """Short result body — posted as a REPLY under the original pick.

    Telegram auto-renders a quote-preview of the parent pick above the
    reply, so we only need the verdict + final score + accuracy trend.

    Shape::

        ✅ *CORRECT*
        Arsenal 2–1 Chelsea
        Pick: Arsenal win (62%) · Week: 58%
    """
    match = prediction.match
    home_name = match.home_team.name if match.home_team else "Home"
    away_name = match.away_team.name if match.away_team else "Away"
    pick = _infer_pick(prediction)
    pick_str = _pick_label(pick, home_name, away_name)
    conf_pct = _fmt_confidence_pct(prediction.confidence)
    ok_emoji = "✅" if was_correct else "❌"
    verdict = "CORRECT" if was_correct else "MISS"

    score_line = f"{home_name} {home_score}–{away_score} {away_name}"
    trailer = f"Pick: {pick_str} ({conf_pct}%)"
    if weekly_accuracy_pct is not None:
        trailer += f" · Week: {round(weekly_accuracy_pct)}%"

    lines = [
        f"{ok_emoji} *{verdict}*",
        _md(score_line),
        _md(trailer),
    ]
    return "\n".join(lines)


def render_pick_with_graded_banner(
    original_body: str,
    home_score: int,
    away_score: int,
    was_correct: bool,
) -> str:
    """Prepend a single bold verdict header to the original pick body.

    Called when we edit the already-published pick in place so anyone
    scrolling back sees the outcome on the pick itself (not only in the
    reply thread below). Deliberately minimal — the full result body
    lives in the reply.
    """
    ok_emoji = "✅" if was_correct else "❌"
    verdict = "CORRECT" if was_correct else "MISS"
    score = f"{home_score}–{away_score}"
    banner = f"{ok_emoji} *GRADED · {_md(score)} · {verdict}*\n\n"
    return banner + original_body


def render_daily_summary(
    date_utc: datetime,
    rows: list[dict],
    weekly_accuracy_pct: Optional[float] = None,
) -> str:
    """Render the end-of-day scoreboard.

    ``rows`` contains dicts with::
        - league       str
        - home         str
        - away         str
        - pick         str   (HOME / DRAW / AWAY)
        - home_score   Optional[int]
        - away_score   Optional[int]
        - was_correct  Optional[bool]   (None when fixture unresolved)

    Shape::

        *Scoreboard · Thu 23 Apr*

        ✅ Arsenal 2–1 Chelsea — Arsenal win
        ❌ PSG 0–0 Marseille — PSG win
        ⏳ Ajax vs Feyenoord — Ajax win (pending)

        *Today:* 1/2 · *Week:* 58%
        betsplug\\.com/track\\-record
    """
    date_str = _fmt_date(date_utc)

    def _line(r: dict) -> str:
        pick_str = _pick_label(r.get("pick"), r["home"], r["away"])
        if r.get("home_score") is not None and r.get("away_score") is not None:
            verdict = "✅" if r.get("was_correct") else "❌"
            body = (
                f"{verdict} {r['home']} {r['home_score']}–{r['away_score']} "
                f"{r['away']} — {pick_str}"
            )
            return _md(body)
        # Unresolved fixture: whole body through _md() — it escapes the
        # parens of "(pending)" along with everything else consistently.
        body = f"⏳ {r['home']} vs {r['away']} — {pick_str} (pending)"
        return _md(body)

    graded = [r for r in rows if r.get("was_correct") is not None]
    correct = sum(1 for r in graded if r.get("was_correct") is True)
    total = len(graded)

    body_rows = "\n".join(_line(r) for r in rows) if rows else "_No picks today_"

    footer_parts = [f"*Today:* {correct}/{total}"]
    if weekly_accuracy_pct is not None:
        footer_parts.append(f"*Week:* {round(weekly_accuracy_pct)}%")
    footer = " · ".join(footer_parts)

    lines = [
        f"*Scoreboard · {_md(date_str)}*",
        "",
        body_rows,
        "",
        footer,
        _md("betsplug.com/track-record"),
    ]
    return "\n".join(lines)


def render_welcome_message() -> str:
    """Channel introduction / pinned welcome post.

    Meant to be posted once and pinned — gives a new subscriber the
    "what am I looking at, when do posts happen, and where do I click
    for more" summary the channel description can't fit. Intentionally
    slightly longer than a pick post (it's a one-off) but still fits
    on a phone screen without scrolling.

    Shape (MarkdownV2)::

        *Welcome to BetsPlug*
        _Data\\-driven football predictions_

        *What you'll see here*
        • 3 Free picks/day · 11:00 · 15:00 · 19:00 CET
        • Each pick replied with ✅/❌ after full\\-time
        • Daily scoreboard at 23:00 CET

        *How we pick*
        Every post is a Free \\(Bronze\\) tier call — the 55–65%
        confidence band of our model\\. Tested on 80,000\\+ historical
        matches\\.

        *Higher conviction available*
        🥈 Silver  · ≥65%
        🥇 Gold    · ≥70%
        💎 Platinum · ≥75% · top\\-5 leagues

        → betsplug\\.com/pricing
        → betsplug\\.com/track\\-record \\(live\\)

        18\\+ · Statistical analysis, not betting advice\\.
    """
    lines = [
        "*Welcome to BetsPlug*",
        "_" + _md("Data-driven football predictions") + "_",
        "",
        "*What you'll see here*",
        _md("• 3 Free picks/day · 11:00 · 15:00 · 19:00 CET"),
        _md("• Each pick replied with ✅/❌ after full-time"),
        _md("• Daily scoreboard at 23:00 CET"),
        "",
        "*How we pick*",
        _md(
            "Every post is a Free (Bronze) tier call — the 55–65% "
            "confidence band of our model. Tested on 80,000+ "
            "historical matches."
        ),
        "",
        "*Higher conviction available*",
        _md("🥈 Silver · ≥65%"),
        _md("🥇 Gold · ≥70%"),
        _md("💎 Platinum · ≥75% · top-5 leagues"),
        "",
        _md("→ betsplug.com/pricing"),
        _md("→ betsplug.com/track-record (live)"),
        "",
        _md("18+ · Statistical analysis, not betting advice."),
    ]
    return "\n".join(lines)


def render_promo_message(weekly_accuracy_pct: Optional[float] = None) -> str:
    """Weekly tier-explanation post — the only place we run a CTA.

    Fires Sunday 18:00 CET. Kept educational (not hypey) — audience is
    sceptics, not lottery players. This is the ONE post where we allow
    more than 10 lines.

    Shape::

        *What you're seeing here*

        Every pick in this channel is a Free \\(Bronze\\) tier call —
        the 55–65% confidence band of our model\\.

        *Last 7 days · Free accuracy:* 58%

        *Paid tiers unlock higher conviction:*
        🥈 Silver · ≥65% confidence
        🥇 Gold · ≥70% confidence
        💎 Platinum · ≥75% · top\\-5 leagues

        Every pick is tested on 80,000\\+ historical matches\\.
        → betsplug\\.com/pricing
    """
    weekly_line = (
        f"*Last 7 days · Free accuracy:* {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )

    lines = [
        "*What you're seeing here*",
        "",
        _md(
            "Every pick in this channel is a Free (Bronze) tier call — "
            "the 55–65% confidence band of our model."
        ),
    ]
    if weekly_line:
        lines.append("")
        lines.append(weekly_line)

    lines.extend(
        [
            "",
            "*Paid tiers unlock higher conviction:*",
            _md("🥈 Silver · ≥65% confidence"),
            _md("🥇 Gold · ≥70% confidence"),
            _md("💎 Platinum · ≥75% · top-5 leagues"),
            "",
            _md(
                "Every pick is tested on 80,000+ historical matches "
                "with a public track record."
            ),
            _md("→ betsplug.com/pricing"),
            _md("→ betsplug.com/track-record"),
        ]
    )
    return "\n".join(lines)


__all__ = [
    "render_pick_message",
    "render_pick_with_graded_banner",
    "render_result_update",
    "render_daily_summary",
    "render_promo_message",
    "render_welcome_message",
]
