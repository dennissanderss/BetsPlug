# `src/content/` — content layer

Per-locale page copy, articles, and shared UI strings. Loaded at
build time by `src/lib/i18n.ts` → `getContent()`.

## Layout

```
src/content/
├── pages/
│   ├── homepage/
│   │   ├── en.json   ← canonical, written first
│   │   ├── nl.json
│   │   ├── de.json
│   │   ├── fr.json
│   │   ├── es.json
│   │   └── it.json
│   ├── pricing/
│   │   └── (same)
│   └── ...
└── shared/
    ├── header.json   ← per-locale nav labels
    ├── footer.json   ← per-locale footer copy + disclaimer
    └── ...
```

## Workflow

1. Author copy in `en.json` first (single source of truth).
2. Translate to the other 5 locales (DeepL/Claude first pass → native review).
3. Use the structure documented in `docs/specs/16-i18n.md`.

## Adding a page

1. Create `pages/{slug}/en.json` with the page's content schema.
2. Create the matching 5 locale files. If a locale isn't translated
   yet, omit it — `getContent()` falls back to `en.json` and emits
   a build warning.
3. Add the canonical slug + per-locale forms to
   `src/i18n/slug-mappings.ts` if it's a routed page.

## Article slugs (Sanity)

Long-form `/learn/*` content lives in Sanity, not here. The Sanity
client in `src/lib/sanity.ts` is the source of truth for article
copy; this folder is for structured marketing pages.
