═══════════════════════════════════════════════════════
SEO REQUIREMENTS
═══════════════════════════════════════════════════════

This document defines SEO requirements across all pages.
Page-specific SEO requirements are in respective page specs.

═══════════════════════════════════════════════════════
GLOBAL SEO PRINCIPLES
═══════════════════════════════════════════════════════

1. CONTENT-FIRST: Every page must serve a clear search intent
2. UNIQUE: Every page has unique title, description, content
3. FAST: Every page loads <2.0s LCP, scores ≥95 Lighthouse SEO
4. ACCESSIBLE: Every page passes WCAG 2.1 AA
5. STRUCTURED: Every page has appropriate schema.org markup
6. INDEXABLE: Marketing pages indexed; app subdomain not indexed

═══════════════════════════════════════════════════════
META TAG REQUIREMENTS
═══════════════════════════════════════════════════════

EVERY PAGE MUST HAVE

```html
<head>
  <!-- Required for all pages -->
  <title>[60 chars max]</title>
  <meta name="description" content="[155 chars max]" />

  <!-- Canonical -->
  <link rel="canonical" href="https://betsplug.com/[path]" />

  <!-- Hreflang for all 6 locales + x-default -->
  <link rel="alternate" hreflang="en" href="..." />
  <link rel="alternate" hreflang="nl" href="..." />
  <link rel="alternate" hreflang="de" href="..." />
  <link rel="alternate" hreflang="fr" href="..." />
  <link rel="alternate" hreflang="es" href="..." />
  <link rel="alternate" hreflang="it" href="..." />
  <link rel="alternate" hreflang="x-default" href="..." />

  <!-- Open Graph -->
  <meta property="og:title" content="..." />
  <meta property="og:description" content="..." />
  <meta property="og:url" content="..." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="..." />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" /> <!-- per locale -->
  <meta property="og:site_name" content="BetsPlug" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="..." />
  <meta name="twitter:description" content="..." />
  <meta name="twitter:image" content="..." />
  <meta name="twitter:site" content="@betsplug" />

  <!-- Robots (default to index, follow) -->
  <meta name="robots" content="index, follow, 
       max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

  <!-- Other -->
  <meta name="theme-color" content="#0A0E1F" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta charset="UTF-8" />
</head>
```

TITLE TAG GUIDELINES

Format: [Page Specific] | BetsPlug
- 60 characters max (longer truncates in SERPs)
- Primary keyword early in title
- Include "BetsPlug" brand at end
- Locale-specific keywords (Dutch words for NL pages)

DESCRIPTION TAG GUIDELINES

- 155 characters max
- Action-oriented (start with verb)
- Include primary keyword
- Include secondary keyword if natural
- Implicit CTA where appropriate

OG IMAGE REQUIREMENTS

Per page (or template):
- 1200×630 pixels
- Under 100KB (WebP preferred)
- Brand colors (deep-navy + pitch-green)
- Page-relevant text overlay
- Stored in /public/og-images/

═══════════════════════════════════════════════════════
SCHEMA.ORG REQUIREMENTS
═══════════════════════════════════════════════════════

EVERY PAGE GETS

1. Organization schema (in <head> on homepage; referenced 
   elsewhere via @id)
2. BreadcrumbList for the page
3. Page-specific type (WebPage, Article, ProductCollection, 
   FAQPage, etc.)

ORGANIZATION SCHEMA (homepage only, others reference)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://betsplug.com/#organization",
  "name": "BetsPlug",
  "url": "https://betsplug.com/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://betsplug.com/logo.svg",
    "width": 512,
    "height": 512
  },
  "description": "AI-driven football prediction platform with 
                  transparent track record. Statistical analysis, 
                  not a bookmaker.",
  "foundingDate": "[YEAR]",
  "sameAs": [
    "https://twitter.com/betsplug",
    "https://t.me/betsplug_picks"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@betsplug.com",
    "contactType": "customer support",
    "availableLanguage": ["en", "nl", "de", "fr", "es", "it"]
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://betsplug.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

PAGE-SPECIFIC SCHEMAS

Homepage:
- Organization (full)
- WebSite with SearchAction
- BreadcrumbList

/predictions hub:
- CollectionPage
- ItemList of SportsEvent (the 5 free predictions)
- BreadcrumbList

Per-league pages:
- SportsLeague
- ItemList of SportsEvent (visible predictions)
- BreadcrumbList

/methodology, /track-record, /about:
- WebPage (with specific subtype where applicable)
- BreadcrumbList

Learn articles:
- TechArticle
- BreadcrumbList
- HowTo (where applicable)

/pricing:
- ProductCollection with 3 Product entries
- BreadcrumbList
- FAQPage for pricing FAQ

/faq:
- FAQPage with all questions
- BreadcrumbList

Bet types pillar:
- TechArticle
- BreadcrumbList
- FAQPage for bet types FAQ

Legal pages:
- WebPage
- BreadcrumbList

CTA-CONTAINING SECTIONS

For pricing cards in any page:

```json
{
  "@type": "Product",
  "name": "BetsPlug Silver",
  "description": "Unlimited predictions, all leagues",
  "brand": { "@type": "Brand", "name": "BetsPlug" },
  "offers": {
    "@type": "Offer",
    "price": "[X]",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "https://betsplug.com/pricing"
  }
}
```

═══════════════════════════════════════════════════════
URL STRUCTURE BEST PRACTICES
═══════════════════════════════════════════════════════

1. Lowercase everywhere
2. Hyphens, not underscores
3. No trailing slashes (consistent)
4. No file extensions visible
5. Maximum 3 levels deep where possible
6. Localized folder slugs
7. Universal article slugs (where conceptually international)
8. Short, keyword-rich slugs
9. Consistent across locales (same depth, same structure)

WHAT NOT TO DO

❌ /Predictions/Premier-League (caps)
❌ /predictions_premier_league (underscores)
❌ /predictions/premier-league/ (trailing slash)
❌ /predictions/premier-league.html (extension)
❌ /predictions/league/teams/team-1 (too deep)
❌ /predictions/p/pl (too short, no keywords)
❌ /football-betting-predictions-and-tips (keyword stuffed)

═══════════════════════════════════════════════════════
INTERNAL LINKING STRATEGY
═══════════════════════════════════════════════════════

PRINCIPLES

1. Hub-and-spoke: hubs link to spokes, spokes link back to hubs
2. Topical clusters: related content interlinked
3. Authority funneling: deep pages get links from authoritative pages
4. User-driven: links serve user navigation, not just SEO
5. Anchor diversity: vary anchor text naturally

REQUIRED INTERNAL LINKS

Homepage:
- /predictions (hero CTA + multiple sections)
- /pricing (multiple CTAs)
- /how-it-works (hero CTA)
- /methodology (1-2 references)
- /track-record (1 reference)
- /faq (1 reference)
- /predictions/{top-3-leagues} (showcase grid)
- /learn (1 reference)

/predictions hub:
- All 10 league pages
- /pricing (multiple CTAs)
- /methodology (1-2)
- /track-record (1)
- /faq

Per-league pages:
- /predictions hub (breadcrumb)
- /pricing (multiple)
- /methodology (1-2)
- 2-3 other league pages
- /faq

/methodology:
- /track-record (3-5 references)
- /predictions (3-4)
- /pricing (3)
- 5+ learn articles (contextual)
- /faq

/track-record:
- /methodology (3+)
- /predictions
- /pricing

Learn articles:
- /methodology (always)
- /predictions (always)
- 2-3 other learn articles
- /pricing (1)
- 1 contextual link to relevant page

/faq:
- /methodology (5+)
- /track-record (3+)
- /pricing (3+)
- /predictions (3+)
- /contact (1)

ANCHOR TEXT STRATEGY

- Don't always use exact keyword
- Vary: "see our methodology", "how predictions work", 
  "the engine behind our predictions"
- Branded anchors OK: "BetsPlug pricing", "our methodology"
- Avoid generic: "click here", "read more"

═══════════════════════════════════════════════════════
SITEMAP STRATEGY
═══════════════════════════════════════════════════════

GENERATION

Auto-generate via @astrojs/sitemap with custom config:

```javascript
sitemap({
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: 'en',
      nl: 'nl',
      de: 'de',
      fr: 'fr',
      es: 'es',
      it: 'it',
    }
  },
  customPages: [
    'https://betsplug.com/predictions/premier-league',
    // ... explicit URLs if not auto-detected
  ],
  serialize(item) {
    // Set custom changefreq + priority per page type
    if (item.url.includes('/predictions')) {
      item.changefreq = 'daily';
      item.priority = 0.9;
    } else if (item.url === 'https://betsplug.com/') {
      item.changefreq = 'weekly';
      item.priority = 1.0;
    } else if (item.url.includes('/learn/')) {
      item.changefreq = 'monthly';
      item.priority = 0.7;
    } else if (item.url.includes('/legal') || 
               item.url.includes('/privacy') ||
               item.url.includes('/terms')) {
      item.changefreq = 'yearly';
      item.priority = 0.3;
    }
    return item;
  }
})
```

SUBMISSION

After deploy:
1. Submit sitemap to Google Search Console
2. Submit sitemap to Bing Webmaster Tools
3. Verify all URLs return 200 (not 404)
4. Monitor crawl stats weekly first month

═══════════════════════════════════════════════════════
ROBOTS.TXT
═══════════════════════════════════════════════════════

/public/robots.txt:

```
User-agent: *
Allow: /

# Block AI training scrapers (optional, ethical decision)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: CCBot
Disallow: /

# Sitemaps
Sitemap: https://betsplug.com/sitemap.xml
```

App subdomain has separate, restrictive robots.txt:

app.betsplug.com/robots.txt:
```
User-agent: *
Disallow: /
```

═══════════════════════════════════════════════════════
CORE WEB VITALS TARGETS
═══════════════════════════════════════════════════════

Per page:
- LCP (Largest Contentful Paint): <2.0s
- FID/INP (Interaction): <200ms
- CLS (Cumulative Layout Shift): <0.1

How to achieve:
- Server-side rendering or static generation
- Critical CSS inline
- Async/defer non-critical scripts
- Optimized images (WebP, sized correctly)
- Font preload for critical fonts only
- No layout-shifting elements (skeleton screens for loading)

═══════════════════════════════════════════════════════
RICH RESULTS / FEATURED SNIPPETS STRATEGY
═══════════════════════════════════════════════════════

PAGES OPTIMIZED FOR FEATURED SNIPPETS

/methodology — "How does X work" answers
/learn/* — "What is X" definitions
/faq — Direct Q&A format

OPTIMIZATION TECHNIQUES

1. Direct answer in first 60 words after H2
2. Use HowTo schema where applicable
3. Number/bullet lists for ranked answers
4. Tables for comparison data
5. Definitions in semantic <dfn> tags
6. Break up content with descriptive H2/H3 (matches "people 
   also ask")

═══════════════════════════════════════════════════════
SEARCH CONSOLE & ANALYTICS SETUP
═══════════════════════════════════════════════════════

REQUIRED PROPERTIES

Google Search Console:
- Property: betsplug.com (Domain property)
- Verify via DNS TXT record
- Submit sitemap.xml
- Request indexing for high-priority pages
- Monitor coverage report weekly

Bing Webmaster Tools:
- Same as above for Bing
- Less traffic but worth setup time

ANALYTICS

Use privacy-friendly analytics (Plausible/Fathom):
- No cookies (or minimal)
- GDPR-compliant by default
- Track: pageviews, conversions, locale distribution
- Goal: prediction signups via UTM source tracking

Avoid:
- Google Analytics 4 (privacy concerns + cookie banner needed)
- Behavioral tracking pixels
- Cross-site tracking

═══════════════════════════════════════════════════════
ONGOING SEO TASKS
═══════════════════════════════════════════════════════

WEEKLY (after launch)

- Search Console: check coverage, errors
- Indexing: verify new pages indexed within 7 days
- Crawl errors: fix 404s or unintended noindexes
- Core Web Vitals: monitor in Search Console

MONTHLY

- Position tracking for primary keywords
- Backlink analysis (Ahrefs/SEMrush)
- Content updates for top-traffic pages
- Schema validation (Google Rich Results Test)

QUARTERLY

- Full content audit (which pages perform, which don't)
- Keyword research expansion
- Competitor analysis
- Internal linking review
