# Blog automation pipeline (Phase 3)

Generates one BetsPlug blog post end-to-end on a daily cron, no
human in the loop. Articles are written by Claude Sonnet 4.6, hero
images by OpenAI `gpt-image-1`, and the result is committed straight
to `main` so the next deploy picks it up.

## How it fits together

```
.github/workflows/blog-generation.yml   ← daily cron + push
        │
        ▼
scripts/blog/generate_post.py           ← orchestrator
        │
        ├─► topic_queue.json            (round-robin via state.json)
        ├─► Claude API                  (article body as JSON)
        ├─► OpenAI gpt-image-1          (1536x1024 hero → .webp)
        │
        ▼
frontend/src/data/blog-posts.json       ← appended
frontend/public/articles/blog/<slug>.webp  ← saved
scripts/blog/state.json                 ← cursor bumped
```

`frontend/src/data/articles.ts` imports `blog-posts.json` at build
time and merges its entries with the handwritten editorial array,
sorted newest-first. The frontend has zero awareness of which posts
are auto-generated — they share the same `Article` type and the same
`/articles/[slug]` template.

## Topic queue

`topic_queue.json` is the editorial backlog. Each entry has:

| field          | purpose                                                      |
|----------------|--------------------------------------------------------------|
| `title`        | Working title (Claude may refine it)                         |
| `angle`        | Editorial direction — given to Claude verbatim               |
| `primarySport` | Sets `Article.sport` (currently always `football`)           |
| `primaryPillar`| Slug under `/learn/` that the post must link to              |
| `secondaryHub` | Full path under `/match-predictions/` or `/bet-types/`       |

Each pillar should be referenced by 1–3 topics so PageRank flows
back to the evergreen `/learn` URLs. Add new topics to the bottom
of the array — the cursor wraps around modulo the array length.

**Cadence note:** the workflow runs daily, so a 10-topic queue
cycles every 10 days. The duplicate-slug guard in
`generate_post.py` will skip a topic if Claude returns a slug
that already exists in `blog-posts.json`, but that's a safety net,
not a refresh strategy. Aim to keep the queue at 30+ topics so the
same angle isn't republished within a month, and rotate stale
topics out as the model's framing diverges from the original brief.

## State file

`state.json` is committed to source control on every successful run:

```json
{
  "topicCursor": 3,
  "lastRunAt": "2026-04-13T09:01:47Z",
  "lastSlug": "expected-goals-vs-actual-goals"
}
```

Don't edit this manually unless you're recovering from a botched
run — the workflow rewrites it.

## Local dry-run

```bash
cd sportbettool
pip install -r scripts/blog/requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
BLOG_DRY_RUN=1 python scripts/blog/generate_post.py
```

`BLOG_DRY_RUN=1` skips the OpenAI image call (saves credit) and
prints the article JSON to stdout instead of writing files. Use
`BLOG_TOPIC_INDEX=N` to force a specific topic instead of the
cursor.

## CI secrets

The workflow needs two repo secrets:

- `ANTHROPIC_API_KEY` — Claude API key
- `OPENAI_API_KEY` — OpenAI API key with image generation enabled

`GITHUB_TOKEN` (auto-provided) is used to push the commit.

## Cost guardrails

- Claude Sonnet 4.6 at 1100–1400 words ≈ 4k input + 4k output tokens
  per run. ~$0.04 per post.
- gpt-image-1 at 1536x1024 ≈ $0.04 per image.
- Daily cron = ~$30/year in API spend. Still negligible against
  the SEO upside, but watch the OpenAI bill if image-quality tier
  changes (the high-quality `gpt-image-1` tier is ~5× the cost).

## Manual override

Actions tab → Blog generation → Run workflow. Enter a `topic_index`
if you want to force a specific topic; leave blank to use the cursor.

## Adding a new topic

1. Append to `scripts/blog/topic_queue.json`.
2. Commit and push to `main`.
3. Either wait for the next 09:00 UTC cron tick or trigger the
   workflow manually with the new topic's index.
