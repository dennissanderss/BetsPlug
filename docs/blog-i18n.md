# Blog post translations — workflow

> Last updated: 2026-04-27

Articles in `frontend/src/data/articles.ts` are **hardcoded TS objects**, fully version-controlled, with all 6 enabled-locale translations stored inline. No Sanity round-trip. Add an article in EN, run one command, commit. Done.

## TL;DR

```bash
# 1. Append a new article entry to src/data/articles.ts in EN only:
#    { slug, title: "EN", excerpt: "EN", blocks: [{ type: "paragraph", text: "EN" }, …] }

# 2. Translate to nl/de/fr/es/it via Claude API:
export ANTHROPIC_API_KEY=sk-ant-…
cd frontend
npm run articles:translate <slug>

# 3. Inspect the diff, commit:
git diff src/data/articles.ts
git add src/data/articles.ts
git commit -m "feat(blog): translate <slug> via Claude"
```

CI gate (`npm run articles:check`) blocks the merge if any article is missing translations.

## How the type works

```ts
export type LocalizedString = string | Partial<Record<Locale, string>>;
```

A field can be a **single EN string** (legacy / pre-translation) OR a **per-locale object**. The frontend always reads via `pickLocalized(field, locale)` which returns the active-locale value, fall back to EN.

After translation, the field becomes:

```ts
title: {
  en: "How to Find a Real Edge on Matchday",
  nl: "Hoe vind je een echt voordeel op wedstrijddag",
  de: "Wie du am Spieltag einen echten Edge findest",
  fr: "Comment trouver un véritable avantage le jour du match",
  es: "Cómo encontrar una ventaja real el día del partido",
  it: "Come trovare un vero vantaggio in giornata",
}
```

## What gets translated

For each article, the script translates:
- `title`
- `excerpt`
- `metaTitle`
- `metaDescription`
- `tldr` (if present)
- `blocks[].text` (paragraph, heading, quote)
- `blocks[].items[]` (list)

NOT translated:
- `slug` (URL stays canonical EN — different SEO sprint to add per-locale slugs)
- `author`, `publishedAt`, `coverGradient`, `coverPattern`, `coverImage` (no language)
- `quote.cite` (usually a name or short attribution — keep verbatim)

## The translator (Claude API)

`scripts/articles-translate.mjs` calls `https://api.anthropic.com/v1/messages` with:

- **Model**: `claude-sonnet-4-6` (override via `ANTHROPIC_MODEL` env)
- **Brand glossary** in the system prompt: BetsPlug, Pulse, Elo, Poisson, XGBoost, BTTS, ROI, xG, Free Access, Silver, Gold, Platinum, league names, "Pick of the Day", "Bet of the Day" — all stay verbatim
- **Tone instruction**: data-driven, factual, educational — not hype
- **Strict JSON output**: each batch returns `[{ id, value }, …]` so we can map back to fields
- **One API call per locale** (5 calls per article)

If `ANTHROPIC_API_KEY` is not set, the script exits with an error message — no silent failure.

Cost estimate (Sonnet 4.6, late-2026 pricing): ~$0.05–$0.15 per article × 5 locales ≈ $0.25–$0.75 per blog post.

## CI gate

`.github/workflows/articles-i18n.yml` runs `npm run articles:check` on every PR that touches `articles.ts`. The check:
- Lists every article block
- Verifies each localizable field is either the per-locale object form (with all 6 locales) or — fail — a plain string
- Prints a per-(slug, field) gap report and exits 1

## Manual translation fallback

If you don't have an API key or want hand-quality control:

```ts
// Edit src/data/articles.ts directly:
title: {
  en: "Original EN string",
  nl: "Hand-vertaalde NL string",
  de: "Hand-übersetzte DE string",
  fr: "...",
  es: "...",
  it: "...",
}
```

The check passes as long as all 6 keys are present.

## Workflow when adding a new article via Claude Code

1. Ask Claude Code to draft the EN version. It appends `{ slug, title, excerpt, blocks: […] }` to `articles[]`.
2. Claude Code runs `npm run articles:translate <slug>` (or you do, with your key).
3. Claude Code commits the result.
4. PR is opened. CI runs `articles:check`. If green → merge.

The translator script lives in the same repo, no external services needed.

## Re-translating an existing article

If you edit an EN field, the script will _not_ overwrite the existing translations — it skips fields that are already objects with all 6 locales. To force a re-translation, **first** revert the field to a plain string, then re-run:

```ts
// Revert
title: "New EN title (forces re-translation)"
```

Then `npm run articles:translate <slug>` and the field becomes a Record again.

## Open questions / follow-ups

- **Per-locale slugs**: today the URL is the same EN slug across all locales (`/articles/foo`, `/nl/articles/foo`). Localized slugs are a separate sprint — would require routing changes plus per-locale slug fields in the article schema.
- **Sanity articles**: still mono-lingual EN. The hardcoded `articles.ts` source falls back to Sanity if it has more recent content; the fallback returns plain strings that resolve to EN via `pickLocalized`. To translate Sanity articles too, the schema needs `localizedString`/`localizedText` types — separate sprint.
- **Cost ceiling**: if blog volume grows beyond ~50 articles, consider batching (multiple articles per API call) to reduce per-article API overhead.
