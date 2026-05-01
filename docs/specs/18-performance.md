═══════════════════════════════════════════════════════
PERFORMANCE & TECHNICAL REQUIREMENTS
═══════════════════════════════════════════════════════

This document defines technical performance standards across all 
pages. Performance directly impacts SEO (Core Web Vitals), 
accessibility (WCAG), and conversion (every 100ms of LCP delay 
costs ~7% conversions).

═══════════════════════════════════════════════════════
PERFORMANCE TARGETS
═══════════════════════════════════════════════════════

LIGHTHOUSE SCORES (per page, mobile + desktop)

- Performance: ≥95
- Accessibility: ≥95
- Best Practices: ≥95
- SEO: 100

CORE WEB VITALS

- LCP (Largest Contentful Paint): <2.0s (target), <2.5s (max)
- FID/INP (Interaction): <200ms (target), <300ms (max)
- CLS (Cumulative Layout Shift): <0.1 (target), <0.25 (max)

ADDITIONAL METRICS

- TTFB (Time to First Byte): <200ms
- FCP (First Contentful Paint): <1.5s
- TBT (Total Blocking Time): <200ms
- Speed Index: <3.0s

═══════════════════════════════════════════════════════
RENDERING STRATEGY PER PAGE TYPE
═══════════════════════════════════════════════════════

STATIC PAGES (SSG, build-time generated)

Pages:
- /pricing
- /about
- /contact
- /methodology
- /faq
- /free-vs-paid
- /telegram
- /bet-types
- /learn (hub + alle articles)
- All legal pages

Configuration:
```astro
---
export const prerender = true;
---
```

Result: HTML files served direct from Vercel CDN, sub-100ms TTFB.

ISR PAGES (incremental static regeneration)

Pages:
- / (homepage — heeft live predictions sectie)
- /predictions (hub)
- /predictions/{league} (10 pages)
- /track-record

Configuration:
```astro
---
export const prerender = true;
// Revalidate every 60 seconds
export const revalidate = 60;
---
```

Result: HTML cached, regenerated on-demand max 1×/min, fresh data 
voor crawlers en users.

DYNAMIC PAGES

Niet van toepassing — alle marketing pages kunnen statisch of ISR. 
Dynamic rendering (per-request) alleen voor app subdomain (out of 
scope voor marketing site).

═══════════════════════════════════════════════════════
IMAGE OPTIMIZATION
═══════════════════════════════════════════════════════

FORMATS

Priority order:
1. AVIF (modern browsers) — best compression
2. WebP (broader support) — fallback
3. JPEG (legacy fallback) — only voor photos
4. SVG (illustrations, icons) — vector

NEVER use PNG voor photos (te zwaar). PNG alleen voor:
- Logos with transparency
- Icons that aren't SVG-compatible

ASTRO IMAGE COMPONENT

```astro
---
import { Image } from 'astro:assets';
import heroImage from '@/assets/hero.jpg';
---

<Image 
  src={heroImage} 
  alt="..." 
  width={1200}
  height={630}
  format="webp"
  quality={85}
  loading="eager" {/* "eager" voor above-fold, "lazy" voor below */}
  decoding="async"
/>
```

Astro automatically:
- Generates multiple sizes (responsive srcset)
- Converts to optimal format
- Optimizes quality
- Provides explicit width/height (prevents CLS)

RESPONSIVE IMAGES

Voor hero/featured images:
```astro
<picture>
  <source media="(min-width: 1024px)" srcset="..." type="image/avif" />
  <source media="(min-width: 768px)" srcset="..." type="image/avif" />
  <source srcset="..." type="image/avif" />
  <source srcset="..." type="image/webp" />
  <img src="..." alt="..." width="..." height="..." />
</picture>
```

LAZY LOADING

- All below-fold images: loading="lazy"
- All above-fold images: loading="eager"
- Critical hero image: also fetchpriority="high"

═══════════════════════════════════════════════════════
FONT OPTIMIZATION
═══════════════════════════════════════════════════════

STRATEGY

1. Variable fonts only (Inter Variable, JetBrains Mono Variable)
2. Subset to Latin character set for primary loads
3. Preload critical weights only
4. font-display: swap (prevents invisible text)

PRELOAD CRITICAL FONT

```html
<head>
  <link 
    rel="preload" 
    href="/fonts/inter-var-latin.woff2" 
    as="font" 
    type="font/woff2" 
    crossorigin
  />
</head>
```

@font-face:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/inter-var-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;
}
```

JETBRAINS MONO

Lazy-loaded since used only voor data display:
```css
@font-face {
  font-family: 'JetBrains Mono';
  font-display: optional; /* Won't block, just not used initially */
  ...
}
```

═══════════════════════════════════════════════════════
JAVASCRIPT OPTIMIZATION
═══════════════════════════════════════════════════════

ASTRO ISLANDS PHILOSOPHY

Default: zero JavaScript shipped to browser.
Add interactivity only where needed via component directives:

- `client:load` — hydrate immediately (rare, only voor critical 
  interactivity)
- `client:idle` — hydrate when browser idle (most components)
- `client:visible` — hydrate when scrolled into view (best for 
  most below-fold)
- `client:media` — hydrate based on media query (mobile-only menu)

USAGE GUIDELINES

Use `client:load` only for:
- Above-fold critical UI (locale switcher, mobile menu)

Use `client:idle` for:
- Header/navigation interactivity
- Cookie banner (after page settles)

Use `client:visible` for:
- Below-fold accordions (FAQ)
- Carousels and sliders
- Scroll-triggered animations
- Live prediction widget (after scroll into view)

Use NO directive (server-only) for:
- All static content (text, images, layout)
- All structural components

THIRD-PARTY SCRIPTS

Minimize. Each adds:
- Network request
- JavaScript parsing
- Privacy concerns (cookies)

Allowed:
- Plausible/Fathom (privacy analytics, ~3kb)
- Sentry (error monitoring, defer load)

NOT allowed without strong justification:
- Google Analytics
- Facebook Pixel
- Hotjar / FullStory (heavy, privacy issues)
- Live chat widgets (Intercom, Drift — heavy)
- Any social media embed (use static link instead)

THIRD-PARTY LOADING

```html
<!-- Defer non-critical scripts -->
<script src="..." defer></script>

<!-- Async for independent scripts -->
<script src="..." async></script>

<!-- Lazy-load on user interaction -->
<button onclick="loadChat()">Chat with us</button>
<script>
  function loadChat() {
    const script = document.createElement('script');
    script.src = '...';
    document.head.appendChild(script);
  }
</script>
```

═══════════════════════════════════════════════════════
CSS OPTIMIZATION
═══════════════════════════════════════════════════════

TAILWIND PURGE

Production build automatically removes unused Tailwind classes via 
content config:

```javascript
content: [
  './src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}',
],
```

CRITICAL CSS

Astro inlines critical CSS automatically. Verify:
- Above-fold styles: inline in <head>
- Below-fold styles: external file (lazy-loaded)

CSS-IN-JS

Avoid for marketing site. Use Tailwind utility classes + Astro 
component scoping.

═══════════════════════════════════════════════════════
CACHING STRATEGY
═══════════════════════════════════════════════════════

VERCEL EDGE CACHING

Static pages: cache-control: public, max-age=31536000, immutable
ISR pages: revalidate per spec (60s, 300s, etc.)
API routes: cache-control: public, s-maxage=60, stale-while-revalidate=300

ASSETS

Images: cache 1 year, immutable filename hash
Fonts: cache 1 year, immutable filename hash
CSS/JS: cache 1 year, immutable filename hash

```astro
<!-- Astro automatically adds hash to asset filenames -->
<link rel="stylesheet" href="/styles.abc123.css" />
```

═══════════════════════════════════════════════════════
ACCESSIBILITY (WCAG 2.1 AA)
═══════════════════════════════════════════════════════

REQUIREMENTS

1. Color contrast: 4.5:1 minimum for body text, 3:1 for large text
2. Keyboard navigation: every interactive element reachable
3. Focus indicators: visible 2px ring
4. Skip-to-content link: first focusable element
5. Semantic HTML: proper heading hierarchy, lists, landmarks
6. Alt text: descriptive for images, empty for decorative
7. Form labels: every input has <label>
8. ARIA: only when semantic HTML insufficient
9. Reduced motion: respect prefers-reduced-motion
10. Screen reader: tested with NVDA/VoiceOver

TESTING TOOLS

Build-time:
- @axe-core/cli (run in CI/CD)
- pa11y (pages audit)

Manual:
- Keyboard-only navigation test
- Screen reader test (VoiceOver on Mac, NVDA on Windows)
- Browser zoom 200%
- Disable CSS test

ACCESSIBILITY CHECKLIST PER PAGE

- [ ] Single H1
- [ ] Heading hierarchy (no skipping levels)
- [ ] All images have meaningful alt or alt="" if decorative
- [ ] All interactive elements keyboard-accessible
- [ ] All form inputs have <label>
- [ ] Focus indicators visible
- [ ] Skip-to-content link present
- [ ] Color contrast meets WCAG AA
- [ ] No layout shift (CLS <0.1)
- [ ] Animations respect prefers-reduced-motion
- [ ] Screen reader testing passes

═══════════════════════════════════════════════════════
MOBILE OPTIMIZATION
═══════════════════════════════════════════════════════

VIEWPORT

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

TOUCH TARGETS

Minimum 44×44px for all interactive elements (WCAG + Apple/Google 
guidelines).

MOBILE-FIRST CSS

Tailwind classes default to mobile, scale up:
```html
<div class="text-base md:text-lg lg:text-xl">
  Mobile-first sizing
</div>
```

NO HOVER-DEPENDENT INTERACTIONS

Mobile users can't hover. All interactions accessible via tap.
Hover states: enhancement only, not required for functionality.

VIEWPORT TESTING

Test breakpoints:
- 320px (smallest mobile)
- 375px (standard mobile)
- 768px (tablet)
- 1024px (small desktop)
- 1280px (standard desktop)
- 1920px (large desktop)

═══════════════════════════════════════════════════════
SECURITY HEADERS
═══════════════════════════════════════════════════════

Implement via vercel.json or _headers file:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' plausible.io;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: cdn.betsplug.com;
  connect-src 'self' app.betsplug.com api.betsplug.com;
  frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

═══════════════════════════════════════════════════════
ERROR HANDLING
═══════════════════════════════════════════════════════

404 PAGE

Custom 404 page (/404.astro) per locale:
- Branded design (matches site)
- Helpful navigation (links to popular pages)
- Search suggestion
- Translated to 6 locales

500 PAGE

Custom 500 page (/500.astro):
- Apology + retry suggestion
- Contact info
- Translated to 6 locales

ERROR TRACKING

Integrate Sentry:
```javascript
// Defer load
const Sentry = await import('@sentry/astro');
Sentry.init({
  dsn: '...',
  tracesSampleRate: 0.1,
  environment: 'production',
});
```

Track:
- JavaScript errors
- API failures
- Performance issues

Don't track:
- User personal data
- Browser console output
- 404s (handled by Search Console)

═══════════════════════════════════════════════════════
MONITORING
═══════════════════════════════════════════════════════

VERCEL ANALYTICS

Built-in, enable via Vercel dashboard:
- Real User Metrics (RUM)
- Core Web Vitals tracking
- Per-page performance breakdown

LIGHTHOUSE CI

Run on every PR:
```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://preview-url.vercel.app/
      https://preview-url.vercel.app/predictions
      https://preview-url.vercel.app/pricing
    budgetPath: ./lighthouse-budget.json
```

Budget file (.lighthouse-budget.json):
```json
[
  {
    "resourceSizes": [
      {"resourceType": "script", "budget": 100},
      {"resourceType": "image", "budget": 200},
      {"resourceType": "stylesheet", "budget": 30},
      {"resourceType": "font", "budget": 100}
    ],
    "timings": [
      {"metric": "interactive", "budget": 3000},
      {"metric": "first-contentful-paint", "budget": 1500},
      {"metric": "largest-contentful-paint", "budget": 2000}
    ]
  }
]
```

═══════════════════════════════════════════════════════
PERFORMANCE TESTING CHECKLIST
═══════════════════════════════════════════════════════

PER PAGE LAUNCH CRITERIA

- [ ] Lighthouse Performance ≥95 (mobile + desktop)
- [ ] LCP <2.0s
- [ ] CLS <0.1
- [ ] INP <200ms
- [ ] TTFB <200ms
- [ ] No console errors
- [ ] No console warnings (production)
- [ ] Images optimized (correct format, size)
- [ ] Fonts preloaded correctly
- [ ] No unused JavaScript on page load
- [ ] All images have width/height
- [ ] No layout shift during load
- [ ] Test on real devices (slow 3G simulation)
- [ ] Test on real low-end mobile (Galaxy A series, iPhone SE)

LIGHTHOUSE COMMAND

```bash
npx lighthouse https://betsplug.com/predictions \
  --view \
  --preset=desktop \
  --output=html \
  --output-path=./reports/predictions.html
```

REAL DEVICE TESTING

Critical for accurate performance measurement:
- Browserstack or similar
- Test on slow 3G simulation
- Test with throttled CPU (4×)
- Test with disabled cache (first visit)

═══════════════════════════════════════════════════════
PERFORMANCE BUDGET PER PAGE
═══════════════════════════════════════════════════════

JAVASCRIPT
- Total page JS: <100KB (compressed)
- Render-blocking JS: 0KB

CSS  
- Total CSS: <30KB (compressed)
- Render-blocking CSS: <14KB (inline critical)

IMAGES
- Hero image: <100KB
- Total images per page: <500KB

FONTS
- Critical fonts: 1 file (~50KB)
- Total fonts: <100KB

HTML
- Per page: <100KB (uncompressed)

TOTAL PAGE WEIGHT
- Mobile: <800KB
- Desktop: <1.2MB

═══════════════════════════════════════════════════════
CONTINUOUS IMPROVEMENT
═══════════════════════════════════════════════════════

WEEKLY

- Check Lighthouse scores in Vercel dashboard
- Identify slowest pages
- Investigate Core Web Vitals trends in Search Console

MONTHLY

- Performance audit op alle pages
- Image audit (new images compressed?)
- Bundle analysis (unused JavaScript?)
- Cache hit rate review

QUARTERLY

- Major framework version updates (Astro, Tailwind)
- Image format migrations (newer formats available?)
- Browser support review (drop old browsers?)
