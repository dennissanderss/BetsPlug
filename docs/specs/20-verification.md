═══════════════════════════════════════════════════════
PRE-LAUNCH VERIFICATION & QA
═══════════════════════════════════════════════════════

This document defines the launch readiness criteria and verification 
process before going live with the new marketing site.

═══════════════════════════════════════════════════════
LAUNCH CRITERIA OVERVIEW
═══════════════════════════════════════════════════════

LAUNCH IS BLOCKED UNTIL:
1. All 204 pages (34 routes × 6 locales) are live and functional
2. All Lighthouse scores ≥95 across categories
3. All translations complete (no English fallbacks visible)
4. All schema.org markup validates (Google Rich Results Test)
5. All hreflang tags correct
6. All 301 redirects from old URLs configured and tested
7. Performance benchmarks met across breakpoints
8. Accessibility audit passes
9. Legal review completed (legal pages)
10. Cross-browser testing passes

═══════════════════════════════════════════════════════
VERIFICATION CHECKLIST PER PAGE
═══════════════════════════════════════════════════════

Apply this checklist to each of the 204 pages.

CONTENT VERIFICATION

- [ ] H1 present and unique
- [ ] H2 hierarchy logical (no skipping levels)
- [ ] All required sections present per spec
- [ ] No placeholder text ("Lorem ipsum", "[TODO]", "[X]")
- [ ] No verzonnen statistics
- [ ] Compliance language correct
- [ ] CTAs link to correct destinations
- [ ] Internal links work (no 404s)
- [ ] External links open in new tab where appropriate
- [ ] Images load correctly
- [ ] Images have meaningful alt text

META VERIFICATION

- [ ] <title> set, ≤60 chars
- [ ] Meta description set, ≤155 chars
- [ ] Canonical URL correct
- [ ] All 6 hreflang tags present
- [ ] x-default hreflang present
- [ ] OG title, description, image set
- [ ] Twitter card tags set
- [ ] Robots meta correct (index, follow for marketing)

SCHEMA.ORG VERIFICATION

- [ ] Page-specific schema present
- [ ] Organization schema referenced or present (homepage)
- [ ] BreadcrumbList present
- [ ] Schema validates: schema.org/validator
- [ ] Rich Results Test passes: search.google.com/test/rich-results

PERFORMANCE VERIFICATION

- [ ] Lighthouse Performance ≥95 (desktop)
- [ ] Lighthouse Performance ≥95 (mobile)
- [ ] LCP <2.0s
- [ ] CLS <0.1
- [ ] INP <200ms
- [ ] No console errors
- [ ] No console warnings (production)

ACCESSIBILITY VERIFICATION

- [ ] Lighthouse Accessibility ≥95
- [ ] Color contrast passes WCAG AA (4.5:1 body, 3:1 large)
- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicators visible
- [ ] Skip-to-content link present and functional
- [ ] Screen reader test passes (VoiceOver/NVDA)
- [ ] Reduced motion respected
- [ ] Form labels present
- [ ] ARIA used appropriately (not over-used)

CROSS-BROWSER TESTING

Test on:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 17+)
- [ ] Chrome Mobile (Android 13+)

CROSS-DEVICE TESTING

- [ ] iPhone SE (375px width)
- [ ] iPhone 14 Pro (393px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop 1280px
- [ ] Desktop 1920px

═══════════════════════════════════════════════════════
SITE-WIDE VERIFICATION
═══════════════════════════════════════════════════════

ROUTING & NAVIGATION

- [ ] All 34 routes accessible at expected URLs
- [ ] All 6 locales work (en, nl, de, fr, es, it)
- [ ] Locale switcher works on every page
- [ ] Locale switcher preserves current page context
- [ ] Default locale (en) accessible without prefix
- [ ] Other locales accessible with prefix
- [ ] No infinite redirect loops
- [ ] Trailing slash handling consistent

301 REDIRECTS

For each old URL in current sitemap (zie 01-site-architecture.md):
- [ ] Old URL returns 301 status
- [ ] Old URL redirects to correct new URL
- [ ] Redirect preserves locale where applicable
- [ ] No redirect chains (multiple 301s in sequence)

SITEMAP

- [ ] sitemap.xml generated correctly
- [ ] All 204 URLs present
- [ ] hreflang alternates per URL
- [ ] Lastmod dates accurate
- [ ] Priority and changefreq appropriate
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Sitemap submitted to Google Search Console
- [ ] Sitemap submitted to Bing Webmaster Tools

ROBOTS.TXT

- [ ] /robots.txt accessible
- [ ] Allows crawling of all marketing pages
- [ ] References sitemap.xml
- [ ] App subdomain has separate restrictive robots.txt

ERROR PAGES

- [ ] /404 custom page works (per locale)
- [ ] /500 custom page works (per locale)
- [ ] Both return correct HTTP status codes

═══════════════════════════════════════════════════════
CROSS-DOMAIN INTEGRATION
═══════════════════════════════════════════════════════

APP SUBDOMAIN INTEGRATION

- [ ] Marketing CTAs naar app.betsplug.com werken
- [ ] Login/Register flow vanaf marketing site werkt
- [ ] Cookie domain set to .betsplug.com (cross-subdomain)
- [ ] Authenticated users zien op marketing site dat ze ingelogd zijn
- [ ] Logged-out users gaan naar app login bij CTA
- [ ] Sessions blijven actief bij switch tussen domains
- [ ] No CORS errors in console

API INTEGRATION

- [ ] /predictions hub fetcht data van app.betsplug.com correct
- [ ] /predictions/{league} pages fetchen league-specific data
- [ ] /track-record fetcht summary data
- [ ] Homepage live predictions widget werkt
- [ ] API failures gracefully handled (no broken UI)
- [ ] ISR caching werkt (refresh interval 60s)
- [ ] Client-side polling werkt op live pages

═══════════════════════════════════════════════════════
SEO LAUNCH CHECKLIST
═══════════════════════════════════════════════════════

PRE-LAUNCH

- [ ] Google Search Console property verified
- [ ] Bing Webmaster Tools property verified
- [ ] Sitemap submitted to both
- [ ] All target keywords identified per page
- [ ] Internal linking structure complete
- [ ] No noindex tags on marketing pages (only app)
- [ ] All redirects from old URLs configured
- [ ] Brand mention monitoring set up

LAUNCH DAY

- [ ] DNS pointed to new Vercel deployment
- [ ] SSL certificate active
- [ ] All pages return 200 (not 4xx/5xx)
- [ ] Robot.txt accessible
- [ ] Sitemap.xml accessible
- [ ] Canonical URLs match production URLs
- [ ] Search Console: request indexing for top 20 pages

POST-LAUNCH (FIRST 7 DAYS)

- [ ] Daily check Search Console for crawl errors
- [ ] Verify indexed pages count growing
- [ ] Monitor Core Web Vitals trends
- [ ] Check for any 404 errors
- [ ] Verify 301 redirects still working
- [ ] Monitor organic traffic for ranking dips

POST-LAUNCH (FIRST 30 DAYS)

- [ ] All target pages indexed
- [ ] Position tracking for primary keywords starting
- [ ] Backlink monitoring for any spam links
- [ ] Performance metrics stable
- [ ] User feedback collection set up

═══════════════════════════════════════════════════════
LEGAL & COMPLIANCE VERIFICATION
═══════════════════════════════════════════════════════

LEGAL PAGES

- [ ] Privacy Policy reviewed by lawyer
- [ ] Terms of Service reviewed by lawyer
- [ ] Cookie Policy compliant with EU directives
- [ ] Responsible Gambling resources accurate per locale
- [ ] All legal pages translated and reviewed
- [ ] Last updated dates accurate
- [ ] Contact addresses correct

COMPLIANCE

- [ ] Cookie banner functional and compliant
- [ ] No essential cookies set without consent (where required)
- [ ] Analytics cookies opt-in only (if used)
- [ ] GDPR data subject rights process documented
- [ ] Privacy email accessible (privacy@)
- [ ] Legal email accessible (legal@)
- [ ] DPO appointed if required by law
- [ ] EU representative appointed if non-EU operator

GAMBLING COMPLIANCE

- [ ] "Not a bookmaker" prominent on About, FAQ, footer
- [ ] No gambling-promotion language anywhere
- [ ] Age verification (18+) prominent
- [ ] Responsible gambling resources accessible
- [ ] National helpline numbers correct per locale
- [ ] No bookmaker affiliate links without disclosure

═══════════════════════════════════════════════════════
FINAL LAUNCH SEQUENCE
═══════════════════════════════════════════════════════

T-MINUS 7 DAYS

- Complete all page implementations
- Run full QA pass on staging environment
- Get legal review back from lawyer
- Confirm DNS migration plan
- Set up monitoring (Sentry, Vercel Analytics)

T-MINUS 3 DAYS

- Final QA pass on staging
- Lighthouse scores verified across all pages
- Translations final-reviewed by native speakers
- Schema validation passing
- 301 redirects tested

T-MINUS 1 DAY

- Pre-launch announcement (internal, social)
- DNS TTL lowered for fast switching
- Backup of current production site
- Rollback plan documented
- On-call team briefed

LAUNCH DAY

- DNS switched at low-traffic time
- SSL verified post-switch
- Manual verification of top 20 pages
- Search Console resubmission
- Sitemap resubmission
- Monitor errors in real-time first 4 hours
- Customer support briefed for influx of questions

T-PLUS 1 DAY

- Full Lighthouse audit on production
- Search Console crawl stats check
- User feedback monitoring
- Quick fixes deployed if needed

T-PLUS 7 DAYS

- Performance review meeting
- SEO ranking baseline established
- User feedback analyzed
- Iteration plan for week 2

═══════════════════════════════════════════════════════
ROLLBACK CRITERIA
═══════════════════════════════════════════════════════

Rollback to old marketing site if (within 24 hours):
- Any of the top 5 pages return 5xx errors
- Critical conversion path broken (signup, login)
- Major SEO catastrophe (mass deindexing)
- Critical security vulnerability discovered
- Site-wide performance regression >50%

Don't rollback for (fix forward instead):
- Individual page bugs
- Translation errors
- Performance degradations <20%
- Minor visual issues
- Schema validation warnings

═══════════════════════════════════════════════════════
LAUNCH GO/NO-GO CRITERIA
═══════════════════════════════════════════════════════

GO if all are TRUE:
✓ All 204 pages live and tested
✓ All Lighthouse scores ≥95
✓ All translations complete
✓ Legal pages reviewed
✓ 301 redirects configured and tested
✓ Cross-browser testing passed
✓ App integration working
✓ Monitoring in place
✓ Rollback plan documented
✓ Stakeholders aligned

NO-GO if any are TRUE:
✗ Critical pages broken (homepage, pricing)
✗ Translation gaps in any locale
✗ Schema validation errors
✗ Lighthouse performance <80 on key pages
✗ Legal review not complete
✗ Major accessibility issues
✗ Authentication flow broken between domains

═══════════════════════════════════════════════════════
POST-LAUNCH MONITORING (FIRST 30 DAYS)
═══════════════════════════════════════════════════════

DAILY (FIRST WEEK)

- Search Console: errors, coverage
- Vercel Analytics: traffic, performance
- Sentry: error rates
- Uptime monitoring: any incidents
- Conversion tracking: signups, payments

WEEKLY (FIRST MONTH)

- SEO ranking changes
- Organic traffic trends
- Page-level performance review
- User feedback themes
- Bug reports prioritization

MONTHLY (ONGOING)

- Comprehensive performance audit
- SEO strategy iteration
- Content gap analysis
- Feature requests evaluation
- Stakeholder reporting
