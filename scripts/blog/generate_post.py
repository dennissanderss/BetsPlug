#!/usr/bin/env python3
"""
BetsPlug blog automation — Phase 3
────────────────────────────────────────────────────────────────
Generates one blog post end-to-end:
  1. Picks the next topic from topic_queue.json (round-robin via state.json)
  2. Calls Claude to draft the post as structured JSON matching
     the frontend `Article` type defined in
     frontend/src/data/articles.ts
  3. Calls OpenAI gpt-image-1 to generate a 1536x1024 hero image
     and saves it as .webp under frontend/public/articles/blog/
  4. Appends the new article to frontend/src/data/blog-posts.json
  5. Bumps state.json (cursor + lastRunAt + lastSlug)

The script is designed to run unattended in GitHub Actions (see
.github/workflows/blog-generation.yml). It writes files and exits
with code 0 on success; the workflow then commits the diff back
to main and the next deploy picks up the new post automatically.

Required env vars:
  ANTHROPIC_API_KEY — for Claude
  OPENAI_API_KEY    — for gpt-image-1

Optional:
  BLOG_DRY_RUN=1    — generate the post but DON'T write any files,
                      print the JSON to stdout instead. Useful for
                      local testing without burning state.
  BLOG_TOPIC_INDEX  — force a specific topic index (overrides cursor)
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Third-party deps. Listed in scripts/blog/requirements.txt
try:
    from anthropic import Anthropic
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "anthropic SDK missing — run `pip install -r scripts/blog/requirements.txt`"
    ) from exc

try:
    from openai import OpenAI
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "openai SDK missing — run `pip install -r scripts/blog/requirements.txt`"
    ) from exc

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow missing — run `pip install -r scripts/blog/requirements.txt`"
    ) from exc

# ── Paths ──────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
TOPIC_QUEUE_PATH = SCRIPT_DIR / "topic_queue.json"
STATE_PATH = SCRIPT_DIR / "state.json"
BLOG_POSTS_PATH = REPO_ROOT / "frontend" / "src" / "data" / "blog-posts.json"
HERO_IMAGE_DIR = REPO_ROOT / "frontend" / "public" / "articles" / "blog"

# ── Models ─────────────────────────────────────────────────────
# Claude Sonnet 4.6 is the right balance of cost and quality for
# 1500-word handwritten-feeling blog content. Opus would be
# overkill at ~5x the price; Haiku tends to feel templated.
CLAUDE_MODEL = "claude-sonnet-4-6"
IMAGE_MODEL = "gpt-image-1"

# Hero image dimensions — gpt-image-1 supports 1024x1024,
# 1024x1536, 1536x1024 and 1792x1024. 1536x1024 is the closest
# 3:2 framing for an article hero.
IMAGE_SIZE = "1536x1024"

# ── Helpers ────────────────────────────────────────────────────


def slugify(title: str) -> str:
    """Lowercase, ASCII-safe, hyphen-separated slug."""
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:80]


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


# ── Claude prompt ──────────────────────────────────────────────

SYSTEM_PROMPT = """You are a senior sports-betting writer for BetsPlug, an AI-driven football analytics platform. Your job is to draft long-form blog posts that read like handwritten editorial — never templated, never AI-flavored.

House voice: confident, evidence-driven, slightly contrarian. You sound like a poker pro who learned to read regression tables. You use specific numbers, name real teams and matches when relevant, and never use marketing fluff like "unlock your potential" or "elevate your game".

Hard rules:
- 1100–1400 words total.
- 4 to 6 H2 headings, each with 1–3 paragraphs underneath.
- One bulleted list (3–5 items) somewhere in the body.
- One pull-quote in the voice of "BetsPlug research log".
- Always link to one specific learn pillar and one league or bet-type hub from the BetsPlug site (the user will tell you which).
- Never invent statistics. If you cite a number, frame it as "in our backtests" or "the math suggests" — never as a hard external fact.
- End with a soft CTA pointing to the BetsPlug subscription, but make it feel like an aside, not a sales pitch.

Output format: a single JSON object matching the schema below. Output ONLY the JSON object, no prose before or after, no code fences. The JSON must be valid and parseable."""

USER_PROMPT_TEMPLATE = """Write a blog post for the BetsPlug /articles archive.

TOPIC TITLE:
{title}

ANGLE / EDITORIAL DIRECTION:
{angle}

INTERNAL LINKS YOU MUST INCLUDE (weave them naturally into the prose, not as a footer):
- Pillar: /learn/{primary_pillar} — link with descriptive anchor text relevant to the topic
- Hub: {secondary_hub} — link with descriptive anchor text relevant to the topic

OUTPUT SCHEMA — return JSON with exactly these fields:
{{
  "slug": "url-friendly-slug-derived-from-title (max 80 chars)",
  "title": "<final article title — can refine the input title if needed>",
  "excerpt": "<120–200 char summary used as preview text>",
  "metaTitle": "<SEO title — 50–65 chars — should end with ' | BetsPlug'>",
  "metaDescription": "<SEO meta description — 140–160 chars — must include the topic's main keyword phrase>",
  "tldr": "<one-sentence pull-out, 100–180 chars, surfaced under the H1>",
  "blocks": [
    {{ "type": "paragraph", "text": "<intro paragraph>" }},
    {{ "type": "paragraph", "text": "<second intro paragraph>" }},
    {{ "type": "heading", "text": "<H2 heading 1>" }},
    {{ "type": "paragraph", "text": "<paragraph>" }},
    ...
    {{ "type": "list", "items": ["item 1", "item 2", "item 3"] }},
    ...
    {{ "type": "quote", "text": "<pull quote>", "cite": "BetsPlug research log" }},
    ...
  ]
}}

Block types allowed:
- paragraph: {{"type": "paragraph", "text": "..."}}
- heading: {{"type": "heading", "text": "..."}}
- list: {{"type": "list", "items": ["...", "..."]}}
- quote: {{"type": "quote", "text": "...", "cite": "..."}}

The links to /learn/{primary_pillar} and {secondary_hub} should be embedded in paragraph text as full URLs (e.g. "see our guide at https://betsplug.com/learn/{primary_pillar}"). The frontend renders linkified URLs automatically in paragraph blocks.

Return ONLY the JSON object."""


def build_user_prompt(topic: dict) -> str:
    return USER_PROMPT_TEMPLATE.format(
        title=topic["title"],
        angle=topic["angle"],
        primary_pillar=topic["primaryPillar"],
        secondary_hub=topic["secondaryHub"],
    )


# ── Claude call ────────────────────────────────────────────────


def generate_article_json(topic: dict, anthropic_client: Anthropic) -> dict:
    """Call Claude and parse the structured JSON response."""
    response = anthropic_client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": build_user_prompt(topic),
            }
        ],
    )
    raw = "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()

    # Defensive: strip code fences if Claude added them
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    try:
        article = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Claude returned invalid JSON:\n{raw[:500]}\n…") from exc

    return article


# ── OpenAI image call ──────────────────────────────────────────


def generate_hero_image(
    title: str, slug: str, openai_client: OpenAI
) -> tuple[Path, str, str]:
    """Generate a hero image via gpt-image-1 and save as .webp.

    Returns (absolute_path_on_disk, public_url, alt_text).
    """
    prompt = (
        f"Editorial hero illustration for a sports-betting analytics article titled "
        f"\"{title}\". Style: dark moody football stadium at night with subtle data "
        f"visualization overlays — green and emerald accent colors, navy/charcoal "
        f"background, cinematic lighting, no text, no logos, no players' faces, no "
        f"team names, abstract enough to be evergreen. 3:2 landscape aspect."
    )

    response = openai_client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        size=IMAGE_SIZE,
        n=1,
    )

    b64 = response.data[0].b64_json
    if not b64:
        raise SystemExit("OpenAI returned no image data")

    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")

    HERO_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = HERO_IMAGE_DIR / f"{slug}.webp"
    img.save(out_path, "WEBP", quality=85, method=6)

    # Public URL relative to the Next.js public/ root
    public_path = f"/articles/blog/{slug}.webp"
    alt = f"Editorial illustration for {title}"
    return out_path, public_path, alt


# ── Article post-processing ────────────────────────────────────


def normalize_article(
    article: dict,
    topic: dict,
    cover_image_path: str,
    cover_image_alt: str,
) -> dict:
    """Fill in fields the model can't know and validate required keys."""
    required_keys = {
        "slug",
        "title",
        "excerpt",
        "metaTitle",
        "metaDescription",
        "blocks",
    }
    missing = required_keys - article.keys()
    if missing:
        raise SystemExit(f"Claude article missing required keys: {sorted(missing)}")

    # Re-derive slug from title if Claude's slug is messy
    article["slug"] = slugify(article.get("slug") or article["title"])

    # Backend-controlled fields — never trust the model for these
    article["sport"] = topic.get("primarySport", "football")
    article["author"] = "The BetsPlug Team"
    article["publishedAt"] = datetime.now(timezone.utc).date().isoformat()
    article["readingMinutes"] = max(
        4,
        round(
            sum(
                len(b.get("text", "").split())
                + sum(len(i.split()) for i in b.get("items", []))
                for b in article["blocks"]
            )
            / 220
        ),
    )
    article["coverGradient"] = (
        "linear-gradient(135deg, #0b1220 0%, #0f2a1a 40%, #064e3b 100%)"
    )
    article["coverPattern"] = "dots"
    article["coverImage"] = cover_image_path
    article["coverImageAlt"] = cover_image_alt

    # Validate block shapes
    for block in article["blocks"]:
        btype = block.get("type")
        if btype not in {"paragraph", "heading", "list", "quote"}:
            raise SystemExit(f"Unknown block type from Claude: {btype}")
        if btype in {"paragraph", "heading", "quote"} and not block.get("text"):
            raise SystemExit(f"Empty {btype} block from Claude")
        if btype == "list" and not block.get("items"):
            raise SystemExit("Empty list block from Claude")

    return article


# ── Topic selection ────────────────────────────────────────────


def pick_next_topic(queue: dict, state: dict) -> tuple[dict, int]:
    topics = queue["topics"]
    if not topics:
        raise SystemExit("topic_queue.json has no topics")

    forced = os.environ.get("BLOG_TOPIC_INDEX")
    if forced is not None:
        idx = int(forced) % len(topics)
    else:
        idx = state.get("topicCursor", 0) % len(topics)

    return topics[idx], idx


# ── Main ───────────────────────────────────────────────────────


def main() -> int:
    dry_run = os.environ.get("BLOG_DRY_RUN") == "1"

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not anthropic_key:
        raise SystemExit("ANTHROPIC_API_KEY is not set")
    if not openai_key and not dry_run:
        raise SystemExit("OPENAI_API_KEY is not set")

    queue = load_json(TOPIC_QUEUE_PATH)
    state = load_json(STATE_PATH)
    posts = load_json(BLOG_POSTS_PATH)

    topic, idx = pick_next_topic(queue, state)
    print(f"[blog] topic #{idx}: {topic['title']}", file=sys.stderr)

    anthropic_client = Anthropic(api_key=anthropic_key)
    article = generate_article_json(topic, anthropic_client)
    print(f"[blog] Claude returned slug={article.get('slug')}", file=sys.stderr)

    # Skip duplicate slugs (in case the cursor wraps around and we
    # re-hit a topic that was already published)
    candidate_slug = slugify(article.get("slug") or article["title"])
    if any(p.get("slug") == candidate_slug for p in posts):
        print(
            f"[blog] slug {candidate_slug} already exists — bumping cursor and exiting",
            file=sys.stderr,
        )
        state["topicCursor"] = (idx + 1) % len(queue["topics"])
        if not dry_run:
            save_json(STATE_PATH, state)
        return 0

    # Image generation (skipped in dry-run to avoid burning credit)
    if dry_run:
        cover_image_path = f"/articles/blog/{candidate_slug}.webp"
        cover_image_alt = f"Editorial illustration for {article['title']}"
    else:
        openai_client = OpenAI(api_key=openai_key)
        _abs, cover_image_path, cover_image_alt = generate_hero_image(
            article["title"], candidate_slug, openai_client
        )
        print(f"[blog] image saved to {cover_image_path}", file=sys.stderr)

    article = normalize_article(article, topic, cover_image_path, cover_image_alt)

    if dry_run:
        print(json.dumps(article, indent=2, ensure_ascii=False))
        return 0

    # Persist
    posts.append(article)
    save_json(BLOG_POSTS_PATH, posts)

    state["topicCursor"] = (idx + 1) % len(queue["topics"])
    state["lastRunAt"] = datetime.now(timezone.utc).isoformat()
    state["lastSlug"] = article["slug"]
    save_json(STATE_PATH, state)

    print(f"[blog] published {article['slug']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
