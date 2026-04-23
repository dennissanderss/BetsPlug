"""Bilingual message templates for the @BetsPluggs Telegram channel.

Every public post is EN-top / NL-bottom, separated by a `---` line so the
two blocks are visually distinct in the Telegram client. Content is
rendered from ORM objects we already have on the site (``Prediction``
with its eager-loaded ``match`` + teams + league + result) so the
Telegram feed stays in lock-step with what a Free-tier visitor sees on
betsplug.com — no shadow copy, no drift.

The functions here are PURE string formatters. All database IO lives in
`telegram_service.py`; all scheduling lives in `tasks/telegram_tasks.py`.
Keeping the boundaries strict makes the templates trivially unit-testable
(feed a Prediction instance, assert the output string) and safe to tweak
without touching the posting machinery.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from app.models.prediction import Prediction


# ---------------------------------------------------------------------------
# Pick direction mapping — the model's `pick` column is one of {HOME, DRAW,
# AWAY} (uppercase) or the probability-derived variants in lowercase. The
# functions below tolerate both so they can be called against both the raw
# ORM row and synthesized predictions from the API layer.
# ---------------------------------------------------------------------------


def _pick_label_en(pick: Optional[str], home_team: str, away_team: str) -> str:
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


def _pick_label_nl(pick: Optional[str], home_team: str, away_team: str) -> str:
    if pick is None:
        return "—"
    norm = pick.strip().upper()
    if norm == "HOME":
        return f"{home_team} wint"
    if norm == "AWAY":
        return f"{away_team} wint"
    if norm == "DRAW":
        return "Gelijkspel"
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
    """Format kickoff in CET (with DST handled by zoneinfo)."""
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    local = when.astimezone(ZoneInfo("Europe/Amsterdam"))
    return local.strftime("%a %d %b · %H:%M")


def _fmt_kickoff_wib(when: datetime) -> str:
    """Format kickoff in WIB (UTC+7, Indonesia) for the EN-speaking
    Asia subscribers that follow the channel."""
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    local = when.astimezone(ZoneInfo("Asia/Jakarta"))
    return local.strftime("%a %d %b · %H:%M")


def _fmt_date_nl(when: datetime) -> str:
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    local = when.astimezone(ZoneInfo("Europe/Amsterdam"))
    return local.strftime("%A %d %B %Y")


def _fmt_date_en(when: datetime) -> str:
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    local = when.astimezone(ZoneInfo("Europe/Amsterdam"))
    return local.strftime("%A %d %B %Y")


# ---------------------------------------------------------------------------
# Public templates
# ---------------------------------------------------------------------------


def render_pick_message(
    prediction: Prediction,
    odds_home: Optional[float] = None,
    odds_draw: Optional[float] = None,
    odds_away: Optional[float] = None,
) -> str:
    """Return the bilingual pick-announcement block.

    Shape:

        🎯 Free Pick — <Date EN>
        ⚽ <League>: <Home> vs <Away>
        🕐 Kickoff: <CET> CET / <WIB> WIB
        🤖 Prediction: <Pick EN>
        Confidence: <N>%
        Pre-match odds: 1: x.xx  X: x.xx  2: x.xx
        📝 Result follows after the match.
        ⚠️ Statistical analysis · 18+ · betsplug.com
        ---
        🎯 Free Pick — <Datum NL>
        ⚽ <League>: <Home> vs <Away>
        🕐 Aftrap: <CET> CET
        🤖 Voorspelling: <Pick NL>
        Zekerheid: <N>%
        Pre-match odds: 1: x.xx  X: x.xx  2: x.xx
        📝 Uitslag volgt na de wedstrijd.
        ⚠️ Statistische analyse · 18+ · betsplug.com
    """
    match = prediction.match
    home_name = match.home_team.name if match.home_team else "Home"
    away_name = match.away_team.name if match.away_team else "Away"
    league_name = match.league.name if match.league else "—"
    kickoff = match.scheduled_at
    pick = _infer_pick(prediction)
    conf_pct = _fmt_confidence_pct(prediction.confidence)
    odds_line = (
        f"1: {_fmt_odds(odds_home)}  "
        f"X: {_fmt_odds(odds_draw)}  "
        f"2: {_fmt_odds(odds_away)}"
    )

    en_block = (
        f"🎯 Free Pick — {_fmt_date_en(kickoff)}\n"
        "\n"
        f"⚽ {league_name}: {home_name} vs {away_name}\n"
        f"🕐 Kickoff: {_fmt_kickoff_cet(kickoff)} CET · "
        f"{_fmt_kickoff_wib(kickoff)} WIB\n"
        "\n"
        f"🤖 Prediction: {_pick_label_en(pick, home_name, away_name)}\n"
        f"Confidence: {conf_pct}%\n"
        "\n"
        f"Pre-match odds:\n{odds_line}\n"
        "\n"
        "📝 Result auto-posted here as a reply after full-time.\n"
        "🎁 Free tier pick · Silver/Gold/Platinum = higher confidence → betsplug.com\n"
        "⚠️ Statistical analysis · 18+"
    )

    nl_block = (
        f"🎯 Gratis Pick — {_fmt_date_nl(kickoff)}\n"
        "\n"
        f"⚽ {league_name}: {home_name} vs {away_name}\n"
        f"🕐 Aftrap: {_fmt_kickoff_cet(kickoff)} CET\n"
        "\n"
        f"🤖 Voorspelling: {_pick_label_nl(pick, home_name, away_name)}\n"
        f"Zekerheid: {conf_pct}%\n"
        "\n"
        f"Pre-match odds:\n{odds_line}\n"
        "\n"
        "📝 Uitslag komt automatisch hieronder als reply na de wedstrijd.\n"
        "🎁 Gratis tier pick · Silver/Gold/Platinum = hogere zekerheid → betsplug.com\n"
        "⚠️ Statistische analyse · 18+"
    )

    return f"{en_block}\n\n---\n\n{nl_block}"


def render_result_update(
    prediction: Prediction,
    home_score: int,
    away_score: int,
    was_correct: bool,
    weekly_accuracy_pct: Optional[float] = None,
) -> str:
    """Short bilingual result body — posted as a REPLY under the original pick.

    Kept terse on purpose: users see this in the channel scroll days
    after the pick was published, so the message must convey
    "verdict + score + accuracy trend" without repeating what's already
    in the reply-preview that Telegram auto-generates above it.
    """
    match = prediction.match
    home_name = match.home_team.name if match.home_team else "Home"
    away_name = match.away_team.name if match.away_team else "Away"
    pick = _infer_pick(prediction)
    conf_pct = _fmt_confidence_pct(prediction.confidence)
    ok_emoji = "✅" if was_correct else "❌"
    en_verdict = "CORRECT" if was_correct else "MISS"
    nl_verdict = "CORRECT" if was_correct else "MIS"

    weekly_line_en = (
        f"\n📊 Week accuracy: {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )
    weekly_line_nl = (
        f"\n📊 Deze week: {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )

    en_block = (
        f"{ok_emoji} RESULT · {en_verdict}\n"
        "\n"
        f"⚽ {home_name} {home_score} – {away_score} {away_name}\n"
        f"🤖 Our pick: {_pick_label_en(pick, home_name, away_name)} "
        f"({conf_pct}%)"
        f"{weekly_line_en}"
    )

    nl_block = (
        f"{ok_emoji} UITSLAG · {nl_verdict}\n"
        "\n"
        f"⚽ {home_name} {home_score} – {away_score} {away_name}\n"
        f"🤖 Onze pick: {_pick_label_nl(pick, home_name, away_name)} "
        f"({conf_pct}%)"
        f"{weekly_line_nl}"
    )

    return f"{en_block}\n\n---\n\n{nl_block}"


def render_pick_with_graded_banner(
    original_body: str,
    home_score: int,
    away_score: int,
    was_correct: bool,
) -> str:
    """Prepend a GRADED banner to the original pick body for in-place edit.

    The pick post is ALSO edited when its fixture resolves so anyone
    scrolling back through history sees the verdict without needing
    to tap the reply thread. Shorter than `render_result_update`
    because the full result body is carried by the reply message.
    """
    ok_emoji = "✅" if was_correct else "❌"
    en = "CORRECT" if was_correct else "MISS"
    nl = "CORRECT" if was_correct else "MIS"
    banner = (
        f"{ok_emoji} GRADED · {home_score}–{away_score} · {en} / {nl}\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
    )
    return banner + original_body


def render_daily_summary(
    date_utc: datetime,
    rows: list[dict],
    weekly_accuracy_pct: Optional[float] = None,
) -> str:
    """Return the bilingual daily summary.

    ``rows`` is a list of dicts with keys::
        - league       str
        - home         str
        - away         str
        - pick         str   (HOME / DRAW / AWAY)
        - home_score   Optional[int]
        - away_score   Optional[int]
        - was_correct  Optional[bool]   (None when fixture unresolved)
    """
    date_en = _fmt_date_en(date_utc)
    date_nl = _fmt_date_nl(date_utc)

    def _line_en(r: dict) -> str:
        pick_str = _pick_label_en(r.get("pick"), r["home"], r["away"])
        if r.get("home_score") is not None and r.get("away_score") is not None:
            verdict = "✅" if r.get("was_correct") else "❌"
            return (
                f"• {r['home']} {r['home_score']}-{r['away_score']} "
                f"{r['away']} — pick {pick_str} {verdict}"
            )
        return f"• {r['home']} vs {r['away']} — pick {pick_str} (pending)"

    def _line_nl(r: dict) -> str:
        pick_str = _pick_label_nl(r.get("pick"), r["home"], r["away"])
        if r.get("home_score") is not None and r.get("away_score") is not None:
            verdict = "✅" if r.get("was_correct") else "❌"
            return (
                f"• {r['home']} {r['home_score']}-{r['away_score']} "
                f"{r['away']} — pick {pick_str} {verdict}"
            )
        return f"• {r['home']} vs {r['away']} — pick {pick_str} (volgt)"

    total = len([r for r in rows if r.get("was_correct") is not None])
    correct = len([r for r in rows if r.get("was_correct") is True])
    weekly_en = (
        f"\n📈 This week: {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )
    weekly_nl = (
        f"\n📈 Deze week: {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )
    en_rows = "\n".join(_line_en(r) for r in rows) or "(no picks today)"
    nl_rows = "\n".join(_line_nl(r) for r in rows) or "(geen picks vandaag)"

    en_block = (
        f"📊 Daily Summary — {date_en}\n"
        "\n"
        "Today's picks:\n"
        f"{en_rows}\n"
        "\n"
        f"📈 Score today: {correct}/{total}"
        f"{weekly_en}\n"
        "\n"
        "🔓 More picks + higher accuracy?\n"
        "→ betsplug.com"
    )

    nl_block = (
        f"📊 Dagoverzicht — {date_nl}\n"
        "\n"
        "Picks van vandaag:\n"
        f"{nl_rows}\n"
        "\n"
        f"📈 Score vandaag: {correct}/{total}"
        f"{weekly_nl}\n"
        "\n"
        "🔓 Meer picks + hogere accuracy?\n"
        "→ betsplug.com"
    )

    return f"{en_block}\n\n---\n\n{nl_block}"


def render_promo_message(weekly_accuracy_pct: Optional[float] = None) -> str:
    """Return the bilingual weekly promo post.

    Explains what a reader on @BetsPluggsgs is actually looking at (Free
    tier only, 55-65% confidence band) and what the paid tiers unlock.
    Intentionally educational rather than hypey — the audience is
    sceptics burned by tipster channels, not lottery players.
    """
    weekly_en = (
        f"\n📊 Last 7 days — Free tier accuracy: {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )
    weekly_nl = (
        f"\n📊 Afgelopen 7 dagen — Free-tier accuracy: {round(weekly_accuracy_pct)}%"
        if weekly_accuracy_pct is not None
        else ""
    )

    en_block = (
        "🔓 What you're seeing here\n"
        "\n"
        "Every pick in this channel is a BRONZE (Free) tier prediction —\n"
        "the 55–65% confidence band of our model. Honest, modest, free."
        f"{weekly_en}\n"
        "\n"
        "Paid tiers unlock higher-conviction calls:\n"
        "🥈 Silver    · ≥ 65% confidence\n"
        "🥇 Gold      · ≥ 70% confidence\n"
        "💎 Platinum · ≥ 75% confidence · top-5 leagues only\n"
        "\n"
        "Every pick — Free or paid — is tested on 80,000+ historical\n"
        "matches with a public, tamper-proof track record.\n"
        "\n"
        "→ Upgrade: betsplug.com/pricing\n"
        "→ Track record: betsplug.com/track-record"
    )

    nl_block = (
        "🔓 Wat je hier ziet\n"
        "\n"
        "Elke pick in dit kanaal is een BRONZE (gratis) tier voorspelling —\n"
        "de 55–65% zekerheidsband van ons model. Eerlijk, bescheiden, gratis."
        f"{weekly_nl}\n"
        "\n"
        "Betaalde tiers ontgrendelen sterkere calls:\n"
        "🥈 Silver    · ≥ 65% zekerheid\n"
        "🥇 Gold      · ≥ 70% zekerheid\n"
        "💎 Platinum · ≥ 75% zekerheid · alleen top-5 competities\n"
        "\n"
        "Elke pick — gratis of betaald — wordt getest op 80.000+ historische\n"
        "wedstrijden met een publiek, niet-bewerkbaar trackrecord.\n"
        "\n"
        "→ Upgraden: betsplug.com/pricing\n"
        "→ Trackrecord: betsplug.com/track-record"
    )

    return f"{en_block}\n\n---\n\n{nl_block}"


__all__ = [
    "render_pick_message",
    "render_pick_with_graded_banner",
    "render_result_update",
    "render_daily_summary",
    "render_promo_message",
]
