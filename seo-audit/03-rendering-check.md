# Fase 3 — Rendering check (Googlebot view)

> Datum: 2026-04-26
> Methode: `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://betsplug.com/...` op 65 URL-locale combinaties.
> Output bewaard in `/tmp/seo-audit/`.

## 3.1 Conclusie kort

- **SSR werkt overal.** Iedere geteste URL geeft 200, geen redirect naar JS-only shell, en de hoofdcontent staat in de geserveerde HTML.
- **`<html lang>` matcht altijd de URL-locale.** ✅
- **Hreflang cluster wordt wél geëmitteerd**: 17 tags (16 locales + `x-default`) per pagina. ✅ (mijn eerste grep miste ze door de Next.js camelCase `hrefLang` notatie.)
- **Canonical is self-referential per locale**: `/de/pricing` → canonical `https://betsplug.com/de/pricing`. ✅
- **Title/description**: deels OK, deels Engels op een /xx/-pagina. ❌ **Dit is de bug die de gebruiker meldde.**
- **Body content**: bevat een mengeling van vertaalde + Engelse strings. ❌
- **Meta-description content is op meerdere locales STALE** (verwijst naar de Bronze-€0,01-trial die weken geleden is afgeschaft). ❌

## 3.2 Concrete mismatches (smoking guns)

### 3.2.1 Title in verkeerde taal — `/ru/articles`

```
GET https://betsplug.com/ru/articles
─ Content-Language: ru
─ <html lang="ru">
─ <title>AI Football Predictions &amp; Betting Tips · BetsPlug</title>   ← ENGELS!
─ <link rel="canonical" href="https://betsplug.com/ru/articles">
```

`PAGE_META["/articles"]` is in `src/data/page-meta.ts` blijkbaar niet voor `ru` ingevuld; de fallback levert `en` terug. Echo van het `messages.ts`-Partial<>-cast pattern dat `4e7e0a4` invoerde — **ru.ts heeft geen `articles.metaTitle` key**, dus EN wint.

### 3.2.2 Stale metadata + body op `/de/pricing`

Title is correct vertaald (`Preispläne · KI-Fußballvorhersagen · BetsPlug`), **maar**:

- `<meta description>` zegt nog: *"Bronze-Testversion für 0,01 €, Silber für Gelegenheitswettende, Gold für vollen Zugriff oder Platinum Lifetime…"* — Bronze + €0,01 trial werd 2026-04-25 afgeschaft (commit `a3c5ee6 feat(free-access): no-Stripe signup flow for €0 tier` + `b5c7ea7 copy: scrub remaining €0,01 trial framing`). DE-translatie is niet bijgewerkt.
- Body bevat letterlijk:
  ```
  >7-tägige Gold-Testversion für 0,01 €<
  >Starten Sie die Testversion für 0,01 €<
  >Voller Gold-Zugang für 7 Tage<
  ```
- En tegelijk Engelse string-leaks tussen de Duitse copy:
  ```
  >Free Access<
  >Most chosen<
  >Based on model validation on 2 years of historical data. Live measurement started 16 April 2026.<
  ```

Hetzelfde patroon op FR/PT/TR/RU (verschillende mate, allemaal genoemd "Bronze trial €0,01"-stale-fragments).

### 3.2.3 Body-mix op `/ru/` (homepage)

Russische homepage bevat o.a.:
- `>AI-Powered Football Predictions · BetsPlug<` — Engelse hero-heading bovenaan, bovenop de Russische `>Прогнозы на футбол с помощью ИИ<`. (Twee titel-bronnen botsen — er staat een EN h1 en een RU h2.)
- `>Locked pick · sign in to view<` — komt 2× voor in body, hardcoded English string, terwijl rest van card Russisch is.
- Brand-namen blijven natuurlijk EN: `Champions League`, `BetsPlug`. OK.

### 3.2.4 EN-string-leaks op `/de/` (homepage)

Hier is een (niet-uitputtende) lijst met Engelse strings die in de DE-render staan terwijl er een Duitse equivalent bestaat:

```
>Bankroll Management for Football Bettors<      (Sanity article-titel — niet vertaald in CMS)
>Both Teams To Score<                            (bet type label — niet in dictionary)
>Daily picks<                                    (hardcoded UI string?)
>Double Chance<                                  (bet type label)
>Draw No Bet<                                    (bet type label)
>Elo Rating Explained<                           (Sanity article)
>Email support<                                  (pricing feature label)
>Exclusive Deals<                                (nav/footer label)
>Exclusive tips<                                 (footer USP)
>Free Access<                                    (tier name — beleidskeuze, mag eventueel)
>Free to join<                                   (CTA)
>Join our Telegram for<                          (footer CTA)
>Join Telegram<                                  (footer button)
>Live chat<                                      (support)
>Looking for<                                    (search prompt)
>Most chosen<                                    (pricing badge)
>Pick of the Day<                                (productnaam — beleidskeuze)
>Poisson goal models<                            (engine description)
```

Dit zijn precies de leaks die `aa1cb33 fix(i18n): plug 1359 EN-value leaks` adresseerde, maar:
- Niet alle 2.844 leaks zijn opgelost (1.485 staan nog open).
- De productie-deploy van de fix is wellicht niet (volledig) live, of de Sanity-data is nooit ververst voor deze locales.

### 3.2.5 Conflicterende headings op `/ru/`

Twee H1-achtige strings boven elkaar in de hero:
```
>AI-Powered Football Predictions · BetsPlug<        ← lijkt op meta title
>Прогнозы на футбол с помощью ИИ<                   ← gewenste H1
```

Of dit echt twee `<h1>`-tags zijn, of een meta die in body terechtkomt, moet in fase 5/6 worden uitgezocht. In beide gevallen is het slecht voor SEO (multiple H1) én voor gebruikers (visuele duplicate copy).

## 3.3 Voorbeeld-tabel — title/description-bron per locale (homepage `/`)

| Locale | `<html lang>` | Title-bron | Description-bron | Status |
|---|---|---|---|---|
| en | `en` | `PAGE_META["/"]→en` | `PAGE_META["/"]→en` | ✅ uniform EN |
| nl | `nl` | `PAGE_META["/"]→nl` | `PAGE_META["/"]→nl` | ✅ uniform NL |
| de | `de` | `PAGE_META["/"]→de` | `PAGE_META["/"]→de` | ⚠️ wel DE, maar **Bronze-€0,01-fragment** in description |
| fr | `fr` | `PAGE_META["/"]→fr` | `PAGE_META["/"]→fr` | ⚠️ idem |
| es | `es` | `PAGE_META["/"]→es` | `PAGE_META["/"]→es` | ⚠️ idem |
| it | `it` | `PAGE_META["/"]→it` | `PAGE_META["/"]→it` | ⚠️ idem |
| pt | `pt` | `PAGE_META["/"]→pt` | `PAGE_META["/"]→pt` | ⚠️ idem |
| tr | `tr` | `PAGE_META["/"]→tr` | `PAGE_META["/"]→tr` | ⚠️ idem |
| pl | `pl` | `PAGE_META["/"]→pl` | `PAGE_META["/"]→pl` | ⚠️ vermoedelijk idem |
| ro | `ro` | `PAGE_META["/"]→ro` | `PAGE_META["/"]→ro` | ⚠️ vermoedelijk idem |
| ru | `ru` | `PAGE_META["/"]→ru` | `PAGE_META["/"]→ru` | ⚠️ + body-mix |
| el | `el` | `PAGE_META["/"]→el` | `PAGE_META["/"]→el` | ⚠️ |
| da | `da` | `PAGE_META["/"]→da` | `PAGE_META["/"]→da` | ⚠️ |
| sv | `sv` | `PAGE_META["/"]→sv` | `PAGE_META["/"]→sv` | ⚠️ |
| sw | `sw` | `PAGE_META["/"]→sw` | `PAGE_META["/"]→sw` | ⚠️ |
| id | `id` | `PAGE_META["/"]→id` | `PAGE_META["/"]→id` | ⚠️ |

> Pricing en home delen het Bronze-stale-probleem. Match-predictions metadata is fresh.

## 3.4 Voorbeeld-tabel — `/articles` per locale

| Locale | Title-resultaat | Diagnose |
|---|---|---|
| EN | `AI Football Predictions & Betting Tips · BetsPlug` | OK |
| RU | **`AI Football Predictions & Betting Tips · BetsPlug`** | **PAGE_META mist `ru` voor `/articles`. Fallback naar EN.** |
| DE | (vertaald, OK) | OK |

Andere /articles locales nog te valideren in Fase 6.

## 3.5 Wat dit betekent voor Google

Vanuit een Googlebot-perspectief ziet de site er zo uit:

1. **/de/pricing**: title in DE → goed signaal. Description in DE met daarin "0,01 €"-belofte → semantisch off (legacy product). Body-content half DE, half EN → **mixed-language signaal**, Google's Quality-team interpreteert dit als low-quality / auto-translated content.
2. **/ru/articles**: lang=ru, title=EN → **conflicting signaal**. Google kan de pagina als duplicate van /articles markeren.
3. **/pt/predictions**: URL-slug is Engels (`/pt/predictions`, niet `/pt/previsoes`). Combineert met onvolledige PT-content → **near-duplicate van /predictions**. Past 1-op-1 op het GSC-verdict "Discovered – currently not indexed" of "Crawled – currently not indexed".

## 3.6 Hreflang-cluster — wel correct geëmitteerd

Per pagina (geverifieerd op `/`, `/pricing`, `/match-predictions`):

- 16 hreflang-tags + `x-default`.
- Reciprociteit OK (alle pagina's verwijzen naar elkaar).
- ISO-codes geldig (`en, nl, de, fr, es, it, sw, id, pt, tr, pl, ro, ru, el, da, sv`).
- `x-default` wijst naar EN-canonical.

Dat is structureel correct. Maar het is **een snelweg richting duplicate-content-trap zolang de inhoud van die 16 alternatieven niet écht verschillend is** — wat momenteel het geval is.

## 3.7 X-Robots-Tag header

Op `https://betsplug.com/`, `/de`, `/de/pricing`: **geen X-Robots-Tag header** in de respons. Dat is conform `applyIndexability()` — alleen op niet-canonical hosts (preview-deploys). Productie is dus volledig indexeerbaar voor Googlebot. ✅

## 3.8 Lijst van pagina's getest in deze fase

| Locale | / | /pricing | /match-predictions | /about-us | /articles | /how-it-works |
|---|---|---|---|---|---|---|
| EN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| nl | ✓ | ✓ | ✓ | — | — | — |
| de | ✓ | ✓ | ✓ | — | — | ✓ |
| fr | ✓ | ✓ | ✓ | — | — | — |
| es | ✓ | ✓ | ✓ | — | — | — |
| it | ✓ | ✓ | ✓ | — | — | — |
| pt | ✓ | ✓ | ✓ | — | — | — |
| tr | ✓ | ✓ | ✓ | — | — | — |
| pl | ✓ | ✓ | ✓ | — | — | — |
| ro | ✓ | ✓ | ✓ | — | — | — |
| ru | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| el | ✓ | ✓ | ✓ | — | — | — |
| da | ✓ | ✓ | ✓ | — | — | — |
| sv | ✓ | ✓ | ✓ | — | — | — |
| sw | ✓ | ✓ | ✓ | — | — | — |
| id | ✓ | ✓ | ✓ | — | — | — |

Totaal: **~50 unieke URL-fetches** als bewijsbasis.

---

**Volgende stap:** Fase 4 — robots.txt / meta robots / X-Robots-Tag scan op directieven die crawl/index sturen.
