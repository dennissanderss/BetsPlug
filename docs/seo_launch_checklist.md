# SEO Launch Checklist — BetsPlug

**Last updated:** 2026-04-22

This is a hand-work checklist. The codebase is already SEO-clean
(verified 2026-04-22: robots.txt, sitemap.xml, canonical tags, hreflang,
no noindex headers anywhere). What remains is telling Google + Bing the
site exists and requesting indexation. **Without these steps, the site
will never appear in search results** regardless of how perfect the code is.

---

## 1. Google Search Console (most important — do this first)

### 1.1 Verify domain ownership

1. Go to https://search.google.com/search-console/
2. Click **Add property** → pick **Domain** (not URL-prefix)
3. Enter `betsplug.com`
4. Google shows a `TXT` record. Copy it.
5. Log in to your domain registrar (where betsplug.com is registered).
6. Add a **DNS TXT record** at the root (`@`) with that value.
7. Wait 5–15 min for DNS propagation. Back in GSC, click **Verify**.

### 1.2 Submit sitemap

Once verified:

1. In GSC sidebar → **Sitemaps**
2. Enter: `sitemap.xml`
3. Submit. Google will start crawling within hours.

### 1.3 Request indexing for key pages

For each of these, paste into GSC top search bar → **Request indexing**:

- `https://betsplug.com/`
- `https://betsplug.com/match-predictions`
- `https://betsplug.com/pricing`
- `https://betsplug.com/how-it-works`
- `https://betsplug.com/track-record`
- `https://betsplug.com/engine`
- `https://betsplug.com/about-us`

This pushes each URL into Google's priority crawl queue. Daily quota is
~10 requests; do the priority pages first.

### 1.4 Verify after 48h

After 24–48 hours:

- Google search: `site:betsplug.com` — should return results
- GSC **Coverage** report → **Valid** count should be > 0
- GSC **Sitemaps** report → status should be "Success"

---

## 2. Bing Webmaster Tools (Bing + DuckDuckGo + Ecosia)

Bing indexes faster than Google for new sites and powers several other
engines.

1. Go to https://www.bing.com/webmasters/
2. Sign in → **Add a site** → `https://betsplug.com`
3. Choose **Import from Google Search Console** (cheapest path)
4. Submit sitemap: `https://betsplug.com/sitemap.xml`

---

## 3. IndexNow (automated — already wired in the code)

The repository includes an `IndexNow` endpoint that pings Bing + Yandex
whenever content changes. Bing typically reflects changes within hours.

Setup (one-time):

1. Generate a key: visit https://www.bing.com/indexnow/getstarted → copy
   the ~32-char key.
2. Save it as a Vercel environment variable named `INDEXNOW_KEY`.
3. Drop the key file at `public/{key}.txt` containing just the key (the
   IndexNow spec requires this for domain ownership proof). Or use the
   bundled `/api/indexnow/key` route if wired.
4. Redeploy. The endpoint at `/api/indexnow` will ping Bing on every
   sitemap-worthy content publish.

Google does **not** participate in IndexNow — GSC is still required for
Google.

---

## 4. Backlink strategy (weeks 2–4)

Google prioritizes sites with inbound links. Zero backlinks = slow
indexation. Tactical list for BetsPlug:

- **Reddit**: r/SoccerBetting, r/Betting — share honest content (track
  record transparency, not spam). One good post per week, 6 weeks.
- **Directory submissions**: productHunt (launch day), beta-list.com,
  AI-tool-directories (several).
- **Guest articles**: write one on Medium or Substack with 1–2 backlinks
  to betsplug.com.
- **Social signals**: LinkedIn article, Twitter/X bio + 1 launch post.

Google can sometimes skip the backlink requirement for sites that have
strong GSC signals (submitted sitemap, request indexing) — but backlinks
accelerate the signal massively.

---

## 5. Monitoring (weeks 2+)

Every Sunday, check:

| Metric | Where | Target week 4 |
|--------|-------|--------------:|
| `site:betsplug.com` result count | google.com | > 30 pages |
| GSC Coverage "Valid" count | GSC Coverage report | > 20 |
| Impressions | GSC Performance report | > 50/day |
| Average position | GSC Performance report | < 40 |

If any metric is flat at zero by week 3 with GSC properly set up, there
is a deeper issue (manual penalty, geo-block, name collision).
Escalate with screenshots of GSC.

---

## 6. Already done in code (no action needed)

Recorded here so you don't re-do them:

- ✅ `robots.txt` allows `/`, blocks only authed/private paths
  (`src/app/robots.ts`)
- ✅ `sitemap.xml` with hreflang per locale for all public paths
  (`src/app/sitemap.xml/route.ts`)
- ✅ Per-page `<link rel="canonical">` on every public route
- ✅ Per-page `<meta name="description">` via `PAGE_META`
- ✅ OpenGraph + Twitter card tags site-wide
  (`src/app/layout.tsx`)
- ✅ No `noindex` headers or meta tags on public routes
- ✅ `hreflang` alternates in sitemap + per-page
- ✅ SEO-friendly URL structure (`/match-predictions/bundesliga`, etc.)
- ✅ JSON-LD structured data on article and league-hub pages
  (where applicable — verify via Rich Results Test if unsure)

---

## 7. What to do if still not indexed after week 3 with GSC set up

Unlikely, but check in this order:

1. **Manual action**: GSC → **Security & Manual Actions** → **Manual
   Actions**. Should say "No issues detected." If there's an action,
   read the reason and fix.
2. **Geo-block or firewall**: Is Vercel serving differently to
   Googlebot? Test with `curl -A "Googlebot/2.1" https://betsplug.com/`
   and verify the HTML is identical to a normal browser fetch.
3. **Core Web Vitals**: GSC → **Core Web Vitals**. Sites with all URLs
   in "Poor" category get deprioritized. Run
   https://pagespeed.web.dev/ on the homepage.
4. **Duplicate content / thin content**: If every page looks essentially
   the same to Google, it deprioritizes indexing. Ensure each league
   hub, each bet-type page, each article has substantial unique content.

---

## TL;DR

**Step 1 (15 min): Do GSC verification + sitemap submit + request
indexing for 7 key pages.**

Everything else (Bing, IndexNow, backlinks) is optimization. GSC is the
whole ball game for Google discovery.
