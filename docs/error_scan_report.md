# Error scan rapport — 2026-05-01

Sprint-context: post-cutover sweep van de marketing/app split.
Scan-modus alleen — **geen fixes** zonder akkoord.

---

## Executive summary

| Prioriteit | Aantal | Beschrijving |
|------------|--------|--------------|
| **P0** (blocking) | 2 | Sitemap-pages 404'en + Vercel image-quota |
| **P1** (functional bug) | 1 | Backend `site_url` config nog op www-default |
| **P2** (UX nuisance) | 4 | Dode `loc()` refs, dode imports, redirect-hops |
| **P3** (cosmetic / nice-to-have) | 3 | HTML meta-refresh ipv 308, dode bestanden |
| **TOTAAL** | **10** | |

**De site werkt.** Auth, dashboard, Stripe, emails — allemaal functioneel. De P0-issues zijn SEO-gericht (Google indexeert pages die niet bestaan), niet user-blocking.

---

## P0 — Blocking issues

### P0.1 — Sitemap belooft pages die 404 geven (SEO-killer)

**Impact:** Google crawlt deze 30+ URLs uit de sitemap, krijgt 404s, daalt in ranking. Direct user-impact: iemand die deze URLs deelt op social, zal een 404 zien.

**Bewijs (live):**
```
betsplug.com/sitemap.xml bevat:
  /match-predictions/premier-league   → HTTP 404
  /match-predictions/eredivisie       → HTTP 404
  /match-predictions/la-liga          → HTTP 404
  /match-predictions/bundesliga       → HTTP 404
  /match-predictions/serie-a          → HTTP 404
  /match-predictions/ligue-1          → HTTP 404
  /match-predictions/champions-league → HTTP 404
  /bet-types/both-teams-to-score      → HTTP 404
  /bet-types/double-chance            → HTTP 404
  ... (alle slug-pages onder /match-predictions/* en /bet-types/*)
```

**Locatie:**
- `marketing/src/pages/sitemap.xml.ts` — fetcht slugs uit Sanity (werkt: 30+ urls)
- `marketing/src/pages/match-predictions/[slug].astro` — `getStaticPaths` zou pages moeten genereren maar bouwde ze niet
- `marketing/src/pages/bet-types/[slug].astro` — idem

**Reproductiestappen:**
1. `curl https://betsplug.com/sitemap.xml | grep premier-league` → URL aanwezig
2. `curl -I https://betsplug.com/match-predictions/premier-league` → 404

**Diagnose:** `getStaticPaths` query in beide `[slug].astro` files faalt of geeft 0 resultaten tijdens de Vercel-build, terwijl de sitemap (die dezelfde Sanity-query draait) wel slugs vindt. Vermoedelijk:
- Sanity `leagueHub` / `betTypeHub` documents bestaan, sitemap pakt ze
- Maar tijdens Vercel-build wordt de query ergens gecached/geblokt
- Of de `getStaticPaths`-resultaat gaat verloren in een transient build-fout

**Voorgestelde fix:**
1. Vercel project `betsplug-marketing` → Deployments → laatste → **Redeploy zonder cache**
2. Als dat niet helpt: build-logs van die deploy lezen, kijken of Sanity-queries stille fouten gaven
3. Als Sanity-data leeg is: óf documents toevoegen óf die slug-pages tijdelijk uit de sitemap halen

### P0.2 — Vercel image-optimization quota — onbekende status

**Bewijs:** vorige UI-sessie toonde **5.4K / 5K limiet bereikt**.

**Risk:** als de limiet over de Hobby-grens schiet, valt de afbeeldingsoptimalisatie weg. Pagina's tonen originele (grote) afbeeldingen — slechtere mobile-prestatie, hogere bandwidth. **Niet broken**, alleen suboptimaal.

**Voorgestelde actie:** gebruiker checkt zelf via vercel.com → Usage → Image Optimization Transformations. Beslis dan: niets doen / Pro upgrade.

---

## P1 — Functional bugs

### P1.1 — Backend `settings.site_url` defaulteert nog op `www.betsplug.com`

**Locatie:** `backend/app/core/config.py:185`
```python
site_url: str = "https://www.betsplug.com"   # used in email links
```

**Status:** **Niet meer in gebruik** door de hot-paths (email-templates, abandoned-checkout, Stripe portal — die zijn allemaal omgezet naar `app_base_url` of `public_site_url`). Maar als toekomstige code per ongeluk `settings.site_url` gebruikt, zit hij verkeerd.

**Risk:** latente bug. Komt niet voor in huidige flows.

**Voorgestelde fix:** zelfde patroon als de andere — vervang door `public_site_url` property of update default naar `https://betsplug.com` (zonder www). Of: marker als deprecated.

---

## P2 — UX nuisances

### P2.1 — 12 dode `loc("/<marketing>")` refs in Next.js

**Locatie:** `frontend/src/components/ui/site-nav.tsx`, `betsplug-footer.tsx`, `trust-funnel.tsx`.

**Impact:** Bij klik op deze links gebeurt er **geen 404** — middleware fangt op en 308't naar Astro. Maar:
- Eén extra request voor de browser
- Iets trager bij click
- Code-leesbaarheid: lijkt alsof internal Next.js routing verwacht wordt

**Volledige lijst:**
```
site-nav.tsx       :149   loc("/pricing")
site-nav.tsx       :208,252,465  loc("/match-predictions")
betsplug-footer.tsx:283   loc("/contact")
betsplug-footer.tsx:324   loc("/match-predictions")
betsplug-footer.tsx:392   loc("/learn")
betsplug-footer.tsx:440   loc("/bet-types")
betsplug-footer.tsx:515   loc("/privacy")
betsplug-footer.tsx:518   loc("/terms")
betsplug-footer.tsx:521   loc("/cookies")
trust-funnel.tsx   :193   loc("/track-record")  ← LEEFT op /trackrecord dashboard
trust-funnel.tsx   :220   loc("/track-record")  ← idem
```

**Site-nav + betsplug-footer rendereren null** op alle live routes — hun `loc()`-refs zijn dode imports. Geen runtime-effect.

**Trust-funnel** is wél actief op `app.betsplug.com/trackrecord`. Bezoeker klikt → werkt via middleware-redirect. UX is correct (komt op marketing-site), alleen niet de meest directe weg.

**Voorgestelde fix:** vervang `loc("/track-record")` met `"https://betsplug.com/track-record"`.

### P2.2 — 7 auth-pagina's importeren `SiteNav` + `BetsPlugFooter` die niets doen

**Locatie:**
- `app/forgot-password/page.tsx`
- `app/register/page.tsx`
- `app/reset-password/page.tsx`
- `app/thank-you/thank-you-content.tsx`
- `app/verify-email/page.tsx`
- `app/welcome/welcome-content.tsx`
- `components/legal/legal-page.tsx`

**Impact:** Componenten renderen `null` op deze routes, dus user ziet niets ervan. Maar Webpack bundelt ze nog wel mee (~tientallen KB) → marginaal grotere JS-bundle.

**Voorgestelde fix:** verwijder de imports + gebruik in deze 7 bestanden. Login-page heeft dit al gehad — patroon is bekend.

### P2.3 — `/welcome` levert 79 KB HTML — verdacht groot

**Bewijs:** `curl https://app.betsplug.com/welcome` → 79.5 KB.

**Vergelijking:** `/login` 22 KB, `/dashboard` 21 KB, `/welcome` **79 KB** = ~3.5× zo groot.

**Voorgestelde diagnose:** `app/welcome/welcome-content.tsx` openen, kijken of er per ongeluk een marketing-page-grote hero / dashboard preview / lange copy in zit die niet hoort.

### P2.4 — `top-bar.tsx` heeft 3 consumers, waarvan 2 verdacht

**Locatie:**
- `components/ui/site-nav.tsx` — verwacht (top-bar zit in nav header)
- `data/potd-stats.ts` — onverwacht (data-file met UI-component import?)
- `hooks/use-botd-track-record.ts` — onverwacht (hook met UI-component import?)

**Voorgestelde diagnose:** check de laatste twee — vermoedelijk type-import (alleen interface), wat geen runtime-impact heeft. Als het een echte component-import is: refactor.

---

## P3 — Cosmetic / nice-to-have

### P3.1 — Astro safety-net redirects gebruiken HTML meta-refresh ipv 308

**Bewijs:**
```
GET https://betsplug.com/dashboard → HTTP 200
Body: <meta http-equiv="refresh" content="0;url=https://app.betsplug.com/dashboard">
```

**Wat zou beter zijn:** een echte HTTP 308 met `Location:` header. Sneller, beter voor SEO, geen flash van de redirect-page.

**Reden:** Astro's static-output mode kan geen HTTP-redirects servereren — dat is een server-side feature die `output: "server"` of een Vercel `vercel.json` rewrite vereist.

**Voorgestelde fix:** voeg `frontend.json` of `vercel.json` toe aan het `marketing/`-project met expliciete rewrites/redirects. Of switch Astro naar hybrid output mode.

**Risk:** laag, werkt nu prima voor users.

### P3.2 — Astro `[slug]` orphan-routes na build-failure

**Locatie:** `marketing/src/pages/match-predictions/[slug].astro` + `bet-types/[slug].astro`.

**Symptom:** files bestaan in source, sitemap genereert URLs, maar Vercel build levert 0 statische pages. Zie P0.1.

### P3.3 — Backend `subscriptions.py` defaults staan nog op localhost

**Locatie:** `backend/app/api/routes/subscriptions.py:63-64`
```python
success_url: str = "http://localhost:3000/subscriptions?success=true"
cancel_url: str = "http://localhost:3000/subscriptions?cancelled=true"
```

**Status:** Pydantic field-defaults. Frontend stuurt altijd zelf success_url/cancel_url, dus deze defaults firen nooit in productie. Code-rot, geen bug.

---

## Consistency matrix

### URL consistency

| Type | Marketing (Astro) | App (Next.js) | OK? |
|------|-------------------|---------------|-----|
| Logo-klik | → `/` (intern) | → `https://betsplug.com` (extern) | ✅ |
| Login-knop | → `https://app.betsplug.com/login` | n/a | ✅ |
| Pricing-knop | → `/pricing` (intern) | → `https://betsplug.com/pricing` | ✅ |
| Subscribe-knop | → `https://app.betsplug.com/checkout?plan=…` | n/a | ✅ |
| Stripe success | n/a | success_url = `app.betsplug.com/thank-you` | ✅ |
| Stripe portal return | n/a | `app.betsplug.com/subscription` | ✅ |
| Email verify-link | n/a | `app.betsplug.com/verify-email` | ✅ |
| Email reset-link | n/a | `app.betsplug.com/reset-password` | ✅ |

### Robots / sitemap

| Surface | robots.txt | sitemap | OK? |
|---------|------------|---------|-----|
| betsplug.com | `Allow: / · Disallow: /thank-you` | 30+ URLs | ✅ behalve P0.1 |
| app.betsplug.com | `Disallow: /` | empty `<urlset>` | ✅ |

### Brand assets

| Asset | Marketing public/ | OK? |
|-------|-------------------|-----|
| logo.webp | ✅ | ✅ |
| logo-email.png | ✅ | ✅ |
| logo-email@2x.png | ✅ | ✅ |
| og-image.jpg | ✅ | ✅ |
| favicon-16/32 + svg | ✅ | ✅ |

### Backend URL helpers

| Email-template | Helper | OK? |
|----------------|--------|-----|
| send_verification_email | `app_base_url` + `public_site_url` | ✅ |
| send_password_reset_email | `app_base_url` | ✅ |
| send_payment_success_email | `app_base_url` | ✅ |
| send_payment_receipt_email | `app_base_url` | ✅ |
| send_subscription_cancelled_email | `app_base_url` | ✅ |
| abandoned_checkout recovery | `app_base_url` | ✅ |
| Stripe billing-portal return | `app_base_url` | ✅ |
| Email layout footer "back to home" | `public_site_url` | ✅ |

---

## Aanbevolen fix-volgorde (na akkoord)

| Volgorde | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | P0.1 — sitemap 404s | medium (Vercel-rebuild + diagnose) | hoog (SEO) |
| 2 | P2.1 — 12 dode loc() refs | low (zoek-vervang) | laag (één extra hop) |
| 3 | P2.3 — /welcome 79 KB diagnose | low (file lezen + krimpen) | laag |
| 4 | P2.2 — 7 auth-pagina dode imports | low (imports verwijderen) | laag (kleinere bundle) |
| 5 | P1.1 — `site_url` deprecated marker | low (one-line fix) | laag (latent) |
| 6 | P3.x | optional | minimaal |

---

## Wat ik NIET kon scannen zonder gebruiker

- **Railway logs (laatste 7 dagen)** — geen toegang tot Railway-account.
- **Vercel function logs (beide projecten)** — geen toegang.
- **Browser-console errors per kernpagina** — vereist menselijke navigatie + DevTools open.
- **Echte Stripe-flow testbetaling** — vereist Stripe Dashboard interactie.
- **Email-flow trigger test** — registreer-flow met echte mailbox-check.

**Voorgestelde aanpak:** als jij Railway- en Vercel-logs in een tekst-export naar mij stuurt, kan ik die alsnog parsen op patronen.

---

## Stop. Wacht op akkoord.

Geen fixes voor je expliciet zegt: "ga door met P0", "doe P0+P1+P2", of "skip die en focus op X".
