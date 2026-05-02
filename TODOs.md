# BetsPlug Marketing — Outstanding TODOs (Priority-Sorted)

**Last updated**: 2026-05-02 — Phase 7 (launch readiness) complete
**Full rationale**: see `docs/launch-readiness.md`

---

## 🔴 BLOCKING for HARD launch

| # | Item | Owner | Notes |
|--|---|---|---|
| 1 | Lawyer review: Privacy Policy × jurisdictions | Cas + counsel | Bodies in EN; locale headers warn "TODO Lawyer review required" |
| 2 | Lawyer review: Terms of Service × jurisdictions | Cas + counsel | Same pattern as Privacy |
| 3 | Lawyer review: Cookie Policy | Cas + counsel | EU directive compliance |
| 4 | Lawyer review: Responsible Gambling per locale | Cas + counsel | Verify national helpline numbers per locale |
| 5 | Real pricing in `marketing/src/pages/pricing.astro` | Product | Currently `[€X]` placeholders |
| 6 | Real contact details: privacy@, legal@, support@, postal | Cas | Currently placeholders in legal pages |
| 7 | Telegram channel URL final-verification | Cas | Currently `t.me/betsplug_picks` |
| 8 | Native NL speaker review of NL content | Cas (NL native) | All NL files marked `_meta.needsReview: true` |
| 9 | Production API: replace `/api/predictions/*` mocks | Dennis (frontend/backend) | Mock returns realistic shape; production target documented in launch-readiness.md §8 |
| 10 | Cookie `Domain=.betsplug.com` on app login | Dennis | For cross-subdomain session sharing |

## 🟡 BLOCKING for FULL multi-locale launch (DE/FR/ES/IT)

| # | Item | Owner | Notes |
|--|---|---|---|
| 11 | DE article translations × 6 | Native DE writer | bankroll-management.de.json exists as stub template |
| 12 | FR article translations × 7 | Native FR writer | EN fallback active; SEO will index thin content |
| 13 | ES article translations × 7 | Native ES writer | EN fallback active |
| 14 | IT article translations × 7 | Native IT writer | EN fallback active |
| 15 | Native speaker review: DE/FR/ES/IT page content | Per-locale reviewers | All flagged `_meta.translationStatus: "ai-generated"` |
| 16 | Lawyer review: legal pages × non-EN jurisdictions | Cas + per-jurisdiction counsel | |

## 🟢 POST-LAUNCH improvements

| # | Item | Owner | Notes |
|--|---|---|---|
| 17 | Lighthouse CI in Vercel deploy hook | DevOps | Target: ≥95 across categories |
| 18 | axe-core CI integration | DevOps | WCAG AA compliance gate |
| 19 | Custom OG images per page/locale | Designer | Currently template paths exist; assets pending |
| 20 | Real `/track-record` data from prod API | Dennis | Currently mock |
| 21 | Live homepage prediction widget | Dennis | Currently static mock |
| 22 | Google Search Console property verification | Cas | Submit sitemap.xml |
| 23 | Bing Webmaster Tools verification | Cas | Submit sitemap.xml |
| 24 | Sentry error monitoring setup | Cas | CSP allowlist already permits sentry |
| 25 | Plausible Analytics property | Cas | CSP already allows `plausible.io` |
| 26 | Delete legacy `.astro` pages so trailing-slash variants follow redirects | Either | `about-us.astro`, `b2b.astro`, `engine.astro`, `match-predictions/` |
| 27 | Add ISR `Cache-Control` headers to `/api/*` endpoints | Either | Current endpoints don't set explicit cache headers |
| 28 | Manual VoiceOver/NVDA spot-check on top 6 pages | Cas | A11y verification beyond Lighthouse |

## 🔵 KNOWN LIMITATIONS (document in support FAQ)

- Mock data on `/track-record` until production API live
- Article bodies render in EN under DE/FR/ES/IT URLs (i18n fallback) until native translations land
- Trailing-slash legacy URLs serve old pages (cleanup item #26)
- Legal page bodies in EN with locale-translated lawyer-warning header (intentional design pattern)
