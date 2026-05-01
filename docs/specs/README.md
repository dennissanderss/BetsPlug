═══════════════════════════════════════════════════════
BETSPLUG MARKETING SITE — SPECIFICATION INDEX
═══════════════════════════════════════════════════════

This folder contains the complete specification for rebuilding 
the BetsPlug marketing site (betsplug.com) from scratch.

The site uses Astro with Tailwind CSS, hosted on Vercel.
The app (app.betsplug.com) is separate — these specs do NOT cover 
the app.

═══════════════════════════════════════════════════════
HOW TO USE THESE SPECS
═══════════════════════════════════════════════════════

For any implementation task:

1. Read 00-context-and-goals.md FIRST — establishes positioning
2. Read 01-site-architecture.md — establishes URLs and routing
3. Read 04-design-system.md — establishes visual language
4. Read the specific page-type spec for the page being built
5. Read 09-i18n.md when working on translations
6. Read 10-seo.md for meta/schema requirements
7. Read 11-performance.md for technical targets

═══════════════════════════════════════════════════════
SPECIFICATION FILES
═══════════════════════════════════════════════════════

00-context-and-goals.md      — Positioning, voice, compliance
01-site-architecture.md      — Sitemap, URLs, routing strategy
02-homepage.md               — Homepage page specification
03-predictions-hub.md        — /predictions hub spec
04-design-system.md          — Visual language, components, tokens
05-league-page-template.md   — Per-league page template (×10)
06-methodology.md            — /methodology page spec
07-track-record.md           — /track-record page spec
08-pricing.md                — /pricing page spec
09-about.md                  — /about page spec
10-contact.md                — /contact page spec
11-learn-hub.md              — /learn hub + article template
12-learn-articles.md         — Content briefs for 7 learn articles
13-bet-types.md              — /bet-types pillar page
14-conversion-pages.md       — /free-vs-paid, /telegram, /faq
15-legal-pages.md            — Privacy, terms, cookies, responsible-gambling
16-i18n.md                   — Internationalization strategy
17-seo.md                    — Meta tags, schema.org, hreflang, sitemap
18-performance.md            — Core Web Vitals, accessibility, caching
19-content-strategy.md       — Copywriting & translation workflow
20-verification.md           — Pre-launch checklists & QA

═══════════════════════════════════════════════════════
EXECUTION PHASES (week by week)
═══════════════════════════════════════════════════════

PHASE 0 — Foundation (1 day)
  Module 0.2: Design system implementation in Tailwind config
  Module 0.3: Data layer & API client setup

PHASE 1 — Core marketing (Week 1-2)
  Module 1.1: Homepage
  Module 1.2: Pricing
  Module 1.3: How It Works
  Module 1.4: About
  Module 1.5: Contact

PHASE 2 — Product pages (Week 3-4)
  Module 2.1: /predictions hub
  Module 2.2: Per-league template + 10 leagues
  Module 2.3: /methodology
  Module 2.4: /track-record

PHASE 3 — Educational content (Week 5)
  Module 3.1: /learn hub + article template
  Module 3.2: 7 learn articles (Engelse content)
  Module 3.3: /bet-types pillar

PHASE 4 — Conversion & trust (Week 6)
  Module 4.1: /free-vs-paid
  Module 4.2: /telegram
  Module 4.3: /faq central

PHASE 5 — Legal & finishing (Week 7)
  Module 5.1: Legal pages (4 pages)
  Module 5.2: SEO finishing (sitemap, robots, schema validation)
  Module 5.3: Performance optimization
  Module 5.4: Accessibility audit & fixes

PHASE 6 — Translation (Week 7-8, parallel)
  Module 6.1: Engelse content compleet checken
  Module 6.2: Vertaling NL/DE/FR/ES/IT (per page)
  Module 6.3: Locale-specific QA

PHASE 7 — Launch readiness (Week 8)
  Module 7.1: SEO audit (Search Console, Lighthouse)
  Module 7.2: Cross-browser testing
  Module 7.3: 301 redirects van oude naar nieuwe URLs
  Module 7.4: Go-live checklist

═══════════════════════════════════════════════════════
DECISIONS ALREADY MADE (DO NOT REVISIT)
═══════════════════════════════════════════════════════

- Architecture: Astro for marketing site, Next.js for app (separate)
- URL structure: /predictions/{league} with localized folder slugs
- Locales: en (default), nl, de, fr, es, it
- Design: Premium SaaS with subtle sport-DNA, mixed light/dark
- Primary colors: pitch-green-500, deep-navy-900, stadium-white-50
- Fonts: Inter (sans-serif), JetBrains Mono (data)
- Free predictions: 5 per day, top 3 leagues only
- Other 7 leagues: paid only with teaser
- Live data: ISR 60s + client polling 30s
- Track record: option A (static marketing + integrated widget)
- No author/team pages
- No fake reviews, no fabricated statistics
- BetsPlug positioned as data analytics, NOT a bookmaker
