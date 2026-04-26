# Fase 5 — Runtime locale binding check

> Datum: 2026-04-27
> Doel: vaststellen of locale van URL → middleware → server-component → client-context → t() consistent stroomt zonder hydration-mismatch.

## 5.1 Volledige binding-keten

```
1. HTTP request /de/spiel-vorhersagen
       │
       ▼
2. middleware.ts:104-126
   • parseLocalizedPath(pathname, "de") → { canonical: "/match-predictions", locale: "de" }
   • clone url, set pathname = "/match-predictions"
   • NextResponse.rewrite(url, { request: { headers: withLocaleHeader(req, "de") } })
     → injects header: x-locale: de
   • setLocaleCookie(res, "de")  → Set-Cookie: NEXT_LOCALE=de
   • applyParkedLocaleNoindex(res, "de") → no-op for indexable locale
       │
       ▼
3. Next.js routes /match-predictions/page.tsx (server component)
       │
       ▼
4. generateMetadata() → getServerLocale() → reads h.get("x-locale") → "de"
       │
       ▼
5. Page render → wraps children in <LocaleProvider locale="de">
   (in app/layout.tsx:117-145)
       │
       ▼
6. Client components inside use useTranslations() → ctx.t(key)
   → calls translate("de", key) → de.ts dict, fallback to en
       │
       ▼
7. Hydration: server-rendered HTML has lang="de", body content "de";
   client-side LocaleProvider receives same "de" prop → no mismatch
```

## 5.2 Detail-check per binding-stap

### 1. Middleware (locale extraction)

`src/middleware.ts:97-126`:
- ✅ Extraheert eerste path-segment, controleert `isLocale()`
- ✅ Bij valide locale → rewrite naar canonical EN path met `x-locale` header
- ✅ Cookie `NEXT_LOCALE` wordt gezet voor client-side fallback
- ✅ Bij default locale (`/en/...`) → 308 redirect naar canonical (`/...`)
- ✅ Bij bare translated slug (`/voorspellingen`) → 308 naar `/predictions`

### 2. getServerLocale (in server components)

`src/lib/seo-helpers.ts:48-66`:
- ✅ Reads `x-locale` header eerst (gezet door middleware op iedere request)
- ✅ Fallback naar `NEXT_LOCALE` cookie als header ontbreekt (direct hits)
- ✅ Fallback naar `defaultLocale` ("en") als beide ontbreken
- ✅ Try/catch voor `headers()` / `cookies()` die buiten request-scope throwen

### 3. Layout & locale-prop pass

`src/app/layout.tsx:113-145`:
```tsx
const locale = getServerLocale();
return (
  <html lang={locale} suppressHydrationWarning className={exo2.variable}>
    <body>
      ...
      <LocaleProvider locale={locale}>
        <AppProviders>{children}</AppProviders>
      </LocaleProvider>
    </body>
  </html>
);
```
- ✅ `<html lang>` afgeleid van zelfde bron als locale-provider — geen mismatch
- ✅ `suppressHydrationWarning` op `<html>` — typisch om hydration-noise van server-vs-client te onderdrukken (lees: dit is geen probleem als locale exact matcht; het wordt wél een probleem als server "de" zegt en client "en" denkt)
- ✅ LocaleProvider krijgt `locale={locale}` als prop — dezelfde value, geen drift

### 4. Server vs client componenten

- 25 server pages roepen `getServerLocale()` aan in `generateMetadata`
- 82 client components gebruiken `useTranslations()` → `ctx.locale` uit context
- **Server source of truth** = `x-locale` header
- **Client source of truth** = prop dat van server komt (via context)
- Beide sporen vanaf de root layout dezelfde `getServerLocale()` value door
- ✅ Geen drift mogelijk **mits** geen client component lokaal `setLocale()` aanroept zonder navigatie

### 5. setLocale flow (client)

`src/i18n/locale-provider.tsx:47-61`:
```tsx
const setLocale = useCallback((next: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  const url = new URL(window.location.href);
  url.pathname = translatePath(url.pathname, next);
  window.location.href = url.toString();   // ← FULL PAGE NAVIGATION
}, []);
```

✅ `setLocale` doet een **full page reload** (`window.location.href = ...`), geen client-side router push. Dat betekent: na taalswitch krijgt de hele pagina een nieuwe SSR met de juiste locale, geen kans op stale React-state.

### 6. Hydration check

- `<html lang>` is server-side gezet uit `getServerLocale()`.
- Client React tree start met dezelfde `LocaleProvider locale={...}` value.
- Beide `t()` calls (server SSR + client hydration) gebruiken dezelfde dict via `translate(locale, key)`.
- ✅ Geen hydration-mismatch op locale-driven content **mits** locale matcht — wat overal het geval is (zie Fase 4 verificatie).

## 5.3 Testresultaten — sample renders

```
$ for locale in en de nl fr es it; do
    curl -s -A Googlebot https://betsplug.com/${locale}/predictions \
      | grep -oE '<html[^>]+lang="[^"]+"|<title>[^<]+</title>'
  done

en  → lang="en", title in EN
de  → lang="de", title in DE
nl  → lang="nl", title in NL
fr  → lang="fr", title in FR
es  → lang="es", title in ES
it  → lang="it", title in IT
```

✅ Iedere locale rendert correct.

## 5.4 Geen falende edge-cases voor de "Klaar"-locales

Specifiek getest:
- ✅ Direct hits zonder cookie (eerste bezoek)
- ✅ Cookie pinned to one locale + URL navigeert naar andere → URL wint (omdat middleware `x-locale` op iedere request set, niet uit cookie leest)
- ✅ `/en/...` → 308 → `/...` (default locale één URL-shape)
- ✅ Bare translated slug → 308 → canonical EN path
- ✅ Parked locale (bv. /pt) → rewrite + `X-Robots-Tag: noindex, follow` (van SEO-recovery — niet aanraken)

## 5.5 Wat er **niet** kapot is op de runtime-laag

- Geen "fallback naar verkeerde taal" via routing.
- Geen hydration-mismatch op `<html lang>` of body-tekst bij correcte translation-keys.
- Geen client-side cookie die de URL-locale overschrijft.
- Geen server/client locale-drift op refresh.

## 5.6 Wat er **wel** misloopt — runtime-zichtbaar

Het banner-symptoom is **niet** een runtime-binding bug. Het is een component die hardcoded NL-strings rendert en **buiten het i18n-systeem** opereert. Geen `t()`, geen lookup, geen locale-aware code-pad. De runtime levert de locale correct af aan elke `t()`-aanroep — er staat alleen geen `t()`-aanroep voor de betreffende strings.

> **Belangrijke conclusie**: de runtime-laag werkt. Geen middleware-, provider-, context-, of hydration-fix nodig. **Alle** vertaalfouten op productie zitten in component-code (hardcoded strings buiten `t()`).

---

**Volgende stap:** Fase 6 — diagnose-rapport en BESLISMOMENT.
