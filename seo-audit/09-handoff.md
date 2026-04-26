# Fase 11 — Handoff

> Datum: 2026-04-26
> Branch: `seo/full-recovery` (5 commits boven main)
> Status: implementatie klaar, klaar voor merge + Vercel deploy.

## 1. Wat is er veranderd (samenvatting van de 5 implementatie-commits)

| # | Commit | Doel |
|---|--------|------|
| 1 | `fix(seo): drop self-serving AggregateRating + stale AggregateOffer` | JSON-LD opgeschoond. AggregateRating 4.6/312 weg. AggregateOffer met stale Bronze-€0,01-USD-prijs weg. Organization → `["Organization", "EducationalOrganization"]` met `knowsAbout` array. |
| 2 | `fix(seo): park 10 incomplete locales (noindex+follow), keep en/nl/de/fr/es/it indexable` | Middleware zet `X-Robots-Tag: noindex, follow` op /sw, /id, /pt, /tr, /pl, /ro, /ru, /el, /da, /sv. Sitemap krimpt van 1.299 naar ~492 URLs. Hreflang-cluster van 17 naar 7 tags (6 + x-default). Robots-disallow voor authed paths met locale-wildcards. |
| 3 | `fix(seo): hand-author RU PAGE_META + plug /how-it-works desc gap + drop stale Bronze claims` | RU title/desc voor 5 routes hand-vertaald. /how-it-works description voor 9 locales gevuld. /pricing description voor 14 locales: Bronze-€0,01 vervangen door Free Access €0. |
| 4 | `copy(seo): swap "Start Winning" CTA + add sitewide educational disclaimer` | `nav.startFreeTrial` → "Explore the data". Footer-disclaimer block sitewide ("BetsPlug provides statistical data … not a bookmaker … 18+ play responsibly"). Hand-vertaald voor en/nl/de/fr/es/it. |
| (audit) | `docs(seo): full crisis audit — phases 1-9` | Alle audit-rapporten in `seo-audit/`. |

## 2. Acties voor Cas (in volgorde)

### 2.1 Merge + Vercel deploy

```bash
git checkout main
git merge --no-ff seo/full-recovery
git push origin main
```

Vercel deployt automatisch op `main`. Wacht tot de deploy groen is en doe een sanity-check:

```bash
curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://betsplug.com/ | grep -E '<title>|<link rel="canonical"|hreflang' | head -10
curl -sSI -A "Googlebot" https://betsplug.com/ru/ | grep -i 'x-robots'   # → noindex, follow
curl -sSI -A "Googlebot" https://betsplug.com/de/ | grep -i 'x-robots'   # → afwezig
curl -s https://betsplug.com/sitemap.xml | grep -c '<url>'                # → ~492
```

### 2.2 Google Search Console

Ga naar https://search.google.com/search-console — selecteer property `betsplug.com`.

1. **Security & Manual Actions → Manual actions** — controleer of er geen handmatige actie staat. Als wel: melden, niet zelf aanpassen voor je een reconsideration request schrijft.
2. **Sitemaps** — verwijder oude submission, dien `https://betsplug.com/sitemap.xml` opnieuw in. Aantal URLs daalt van 1.299 → ~492.
3. **URL-inspection** voor de homepage:
   - `https://betsplug.com/` → "Request indexing"
   - `https://betsplug.com/match-predictions` → idem
   - `https://betsplug.com/pricing` → idem
   - `https://betsplug.com/track-record` → idem
   - `https://betsplug.com/how-it-works` → idem
   - `https://betsplug.com/articles` → idem
   - `https://betsplug.com/learn` → idem
   - `https://betsplug.com/bet-types` → idem
   - `https://betsplug.com/about-us` → idem
   - `https://betsplug.com/engine` → idem
   - + per "Klaar" locale: `https://betsplug.com/nl`, `/de`, `/fr`, `/es`, `/it` → idem
4. **Indexing → Pages**: na 7-14 dagen klik **"Validate fix"** voor:
   - "Discovered – currently not indexed" (64)
   - "Crawled – currently not indexed" (6)
   - "Duplicate without user-selected canonical" (1)
5. **Removal Tool** (alleen als nodig): voor /pt, /tr, /pl, /ro, /ru, /el, /da, /sv URLs die al in de index staan en je wilt versnellen.

### 2.3 Bing Webmaster Tools

Idem stap 2.2 op https://www.bing.com/webmasters voor je property.

### 2.4 Geen reconsideration request indienen

Tenzij Manual Actions iets toont. De wijziging is structureel/algoritmisch, niet penalty-driven. Reconsideration zonder Manual Action = ruis voor Google.

## 3. Verificatie-tijdpad (verwachting)

| Periode | Wat te verwachten |
|---------|-------------------|
| Dag 1-3 | Vercel deploy live; Googlebot herfetcht homepage en top-10 pagina's. |
| Week 1-2 | GSC laat nieuwe HTML zien in URL-inspection. /xx-noindex-URLs beginnen uit de index te vallen. |
| Week 2-4 | Brand-name rankings horen terug te keren (mits geen Manual Action). |
| Week 3-6 | "Discovered – not indexed" → "Indexed" voor opgeloste pagina's. |
| Week 4-12 | Algemene organische rankings herstellen. |

## 4. Wat NIET te doen tot rankings herstelt zijn

- **Geen verdere structurele wijzigingen** aan i18n, sitemap, robots, canonical, hreflang.
- **Geen massa-content toevoegen** (artikelen, league hubs, bet-type combos). Wachten tot baseline gestabiliseerd is.
- **Geen disavow-bestand indienen** zonder duidelijk bewijs van toxic backlinks.
- **Geen extra locales heractiveren** voordat de 6 indexable locales solide ranken.
- **Geen experimenten** met rendering-mode (geen plotse SSG-migratie, geen edge-runtime).
- **Geen rebranding** van product-namen ("Pick of the Day" mag blijven, "Start Winning" is nu vervangen — verder niets).

## 5. Roadmap voor de 10 geparkeerde locales

Heractivatie criteria per locale (staan ook in `src/i18n/config.ts` boven `INDEXABLE_LOCALES`):

1. **URL-slugs vertaald** in `src/i18n/routes.ts` (bv. `/pt/predictions` → `/pt/previsoes`).
2. **PAGE_META block hand-vertaald** voor alle 19 routes (geen copy-paste van EN, geen DeepL-output zonder review). Audit met `node /tmp/page-meta-audit.mjs` (script staat in `/tmp/` lokaal).
3. **Hardcoded EN strings** in homepage/footer/pricing/legal opgeruimd of via `t()` geleid voor die specifieke locale.
4. **Sanity-content** voor minimaal homepage + alle 5 league hubs + alle 4 bet-type hubs hand-vertaald (DeepL fallback is niet voldoende — gegarandeerd brand-stem en correcte locale-entiteit).

Volgorde-aanbeveling op marktpotentie + bestaande coverage:

| # | Locale | Reden | Geschatte werktijd |
|---|--------|-------|---------------------|
| 1 | **pt** (Portuguese) | Brazilië + Portugal — grote markt; UI-coverage al 96.2% | 6-10 uur |
| 2 | **pl** (Polish) | EU-markt met sterke voetbal-affiniteit | 6-10 uur |
| 3 | **ru** (Russian) | grote markt maar geopolitieke targeting-overwegingen + PAGE_META was ergst kapot — herhaal-audit nodig | 8-12 uur |
| 4 | **el** (Greek) | kleine maar enthousiaste voetbal-markt | 4-6 uur |
| 5 | **ro** (Romanian) | groeiende markt | 4-6 uur |
| 6 | **tr** (Turkish) | groot — maar lokaal sterke concurrenten | 8-12 uur |
| 7 | **da, sv** (Nordic) | klein en concurrentieel — lage prioriteit | 4-6 uur elk |
| 8 | **id, sw** | klein op brand-niveau in deze niches — heroverweeg of dit überhaupt SEO-target moet zijn | 6-8 uur elk |

**Eén locale per week**, met 2 weken Google-verificatie tussen heractivaties.

## 6. Brand-disambiguation (langere termijn)

`betsplug.com` deelt brand-naam met `betplug.com`, `plugbets.com`, `yourbetplug.com`. Maatregelen:

1. **Organization.sameAs** uitbreiden met:
   - LinkedIn company page (aanmaken indien afwezig).
   - Trustpilot business profile (na onafhankelijke reviews zijn er — niet eerder).
   - Crunchbase listing (na aanmaak).
   - GitHub-org indien van toepassing.
2. **Google Business Profile** claimen (al je niet al hebt).
3. **Consistente `betsplug` (één woord) spelling** in alle eigen kanalen (sociale media, e-mails, Telegram).
4. **Wikipedia-stub** — als je een betrouwbare bron hebt om te citeren (bv. tech-pers-vermelding) — geeft Google duidelijke entity-resolution.

## 7. Educatieve positionering vasthouden

Voor alle nieuwe content en marketing geldt vanaf nu:

- **Title/H1** moet eindigen in een data/kennis-noun (statistics, data, analytics, probabilities) — niet in tips, picks, free-bets.
- **CTA-knoppen** zijn educatief: "View the data", "See the analysis", "Explore probabilities" — niet "Start winning", "Lock in tonight's pick", "Get exclusive tips".
- **Geen rating-schema's** zonder onafhankelijk geverifieerde reviews op de pagina (Review-objects + zichtbare UGC).
- **Outbound naar bookmakers**: altijd `rel="nofollow sponsored"` + expliciete affiliate-disclaimer.
- **Footer-disclaimer** mag niet weg.
- **Bij twijfel**: data en feiten presenteren, geen aanmoediging.

## 8. Follow-ups (nice-to-have, niet kritiek)

1. **`og:locale` + `og:locale:alternate`** toevoegen aan `layout.tsx` `generateMetadata` — voor betere social-share-cards in alle talen.
2. **`Article` schema** op `/articles/[slug]` indien nog niet aanwezig.
3. **`Dataset` schema** op `/track-record` (sterke educatief signaal).
4. **`theme-color` meta** toevoegen.
5. **Content-Security-Policy header** in `next.config.js` `headers()`.
6. **CrUX-meting + Lighthouse audit** voor harde CWV-getallen na deploy.
7. **Sanity-articles die nog Engelse titles hebben** op vertaalde pagina's renderen ("Bankroll Management for Football Bettors", "Elo Rating Explained") — vul de Sanity localised fields voor de "Klaar" locales.

## 9. Snel-referentie: bestanden die ik aangeraakt heb

```
frontend/src/i18n/config.ts                  — INDEXABLE_LOCALES + isIndexableLocale
frontend/src/i18n/routes.ts                  — /responsible-gambling toegevoegd
frontend/src/middleware.ts                   — applyParkedLocaleNoindex
frontend/src/lib/seo-helpers.ts              — getCanonicalUrl + getLocalizedAlternates
frontend/src/app/sitemap.xml/route.ts        — alleen INDEXABLE_LOCALES
frontend/src/app/robots.ts                   — locale-wildcard private paths
frontend/src/components/seo/json-ld.tsx      — geen AggregateRating/Offer; EducationalOrganization
frontend/src/app/pricing/page.tsx            — geen aggregateRating prop
frontend/src/data/page-meta.ts               — RU + /how-it-works desc + /pricing stale
frontend/src/i18n/messages.ts                — nav.startFreeTrial + footer.educationalDisclaimer
frontend/src/components/ui/betsplug-footer.tsx — disclaimer block
frontend/src/i18n/locales/{de,fr,es,it}.ts   — hand-vertalingen voor nav CTA + disclaimer
+ 10× aux locales (sw,id,pt,tr,pl,ro,ru,el,da,sv) auto-translated by pre-commit hook
```

## 10. Als iets misgaat na deploy

Snelle rollback:

```bash
git revert HEAD~5..HEAD   # rollback alle 5 fix-commits
git push origin main
```

Of selectief één commit revert (commit hashes staan boven). De middleware en sitemap zijn de meest impactvolle wijzigingen — als rankings verder dalen na 1-2 weken kunnen die specifiek terug.

---

**Klaar.** De 5 fix-commits + 9 audit-docs vormen de complete recovery. Houd de GSC-stats wekelijks bij; verwacht brand-term herstel binnen 2-4 weken, algemene organic recovery binnen 4-12 weken.
