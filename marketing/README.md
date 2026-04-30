# BetsPlug — Marketing site (Astro)

Static-first marketing site that will live at `betsplug.com` once
deployed. Built with **Astro 4** + **Tailwind CSS v4**. Ships pure
HTML — zero client-side React, zero hydration cost, instant LCP.

The authenticated dashboard lives in a separate Next.js project at
`../frontend/` (eventually `app.betsplug.com`).

## Run it locally

```bash
cd marketing
npm install
npm run dev
# → http://localhost:4321
```

Free picks on the homepage are fetched from the FastAPI backend.
Configure the API base in `.env`:

```
PUBLIC_API_BASE=http://localhost:8000
# or for prod data while developing:
# PUBLIC_API_BASE=https://api.betsplug.com
```

When the API is unreachable the page degrades gracefully — it still
renders, just without the picks grid populated.

## Build

```bash
npm run build         # → dist/ static HTML
npm run preview       # serve the built site locally
```

The build is **fully static**. Output is plain `.html` files plus a
single `_astro/` CSS chunk. Drop it on Vercel, Netlify, Cloudflare
Pages — anywhere that serves static files.

## Project structure

```
marketing/
├── src/
│   ├── components/     # reusable .astro components (SiteNav, FreePicksGrid, …)
│   ├── layouts/        # page wrappers (Layout.astro = head + body shell)
│   ├── pages/          # one .astro file per route
│   │   └── index.astro
│   └── styles/
│       └── global.css  # NOCTURNE design tokens, Tailwind import
├── public/             # static assets (favicon, robots.txt, og-images)
├── astro.config.mjs    # Astro + Tailwind config
└── tsconfig.json
```

## Adding a new page

Create `src/pages/<slug>.astro`. Astro maps it to `/<slug>` automatically.

```astro
---
import Layout from "../layouts/Layout.astro";
import SiteNav from "../components/SiteNav.astro";
---

<Layout title="Pricing — BetsPlug" description="Plans starting free.">
  <SiteNav />
  <main class="mx-auto max-w-7xl px-4 py-12">
    <h1>Pricing</h1>
  </main>
</Layout>
```

For a localized variant create `src/pages/<locale>/<slug>.astro`
(e.g. `src/pages/nl/pricing.astro`). Locale routing isn't wired in
the scaffold yet — that's a follow-up commit.

## Adding interactivity

Astro is server-first. If you need React interactivity later:

```bash
npx astro add react
```

Then drop `<MyComponent client:load />` in any `.astro` file. Only
that component hydrates, not the whole page.

## Deploy

`betsplug.com` will eventually point to a Vercel project rooted at
this folder. Until that switch the existing Next.js project at
`../frontend/` still serves the public site — this Astro project is
the future home.

## NOCTURNE design tokens

`src/styles/global.css` mirrors the design tokens from
`frontend/src/app/globals.css` so the marketing site looks identical
to the dashboard. When colour tokens change in the dashboard, mirror
the change here.
