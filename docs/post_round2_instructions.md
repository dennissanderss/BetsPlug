# Na de round-2 audit — wat moet jij nog doen

**Laatst bijgewerkt:** 2026-04-18 na commit `f67524f`

Ik heb zojuist drie dingen gepusht (commit `f67524f`) die nu automatisch via Railway
deployen. Daarna rest jouw hand-werk: 2 ops-commands + een browser-walkthrough.
Volgorde is relevant — wacht tot Railway groen staat voor je de ops-stappen doet.

---

## 1. Wachten op Railway-deploy (~2-4 min)

Open Railway dashboard. Wacht tot de backend-service "Deployed" toont voor commit `f67524f`.
Snel te checken op de command-line:

```bash
# Moet nu 401 geven i.p.v. 200. Als nog 200 → Railway deploy nog niet klaar.
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://betsplug-production.up.railway.app/api/admin/users
```

Verwacht: `401`. Zodra je die ziet, deploy is live en de admin-lek is dicht.

---

## 2. Admin Bearer token ophalen

Je hebt een admin-token nodig voor stap 3. Login via de normale UI of via curl:

```bash
# Vervang wachtwoord. Email hierboven was admin@betsplug.com.
curl -sS -X POST https://betsplug-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@betsplug.com&password=JOUW_ADMIN_WACHTWOORD"
```

Zoek in de response `"access_token": "eyJ..."`. Kopieer die string.
Zet hem in een env var voor de volgende stap:

```bash
export TOKEN="eyJ..."   # de string uit de login-response
```

(Als login een ander schema heeft, kan het ook `/api/auth/token` zijn — check
wat de frontend-login call is in Network-tab als curl faalt.)

---

## 3. Pipeline-gap dichten (2026-04-16 t/m 2026-04-22)

Er zijn ~141 matches in die week zonder predictions. Het `batch-predictions` endpoint
kan nu óók upcoming matches backfillen — gebruik `include_upcoming=true` +
`upcoming_days=14` om het gat te sluiten. Herhaal tot `remaining: 0`.

```bash
# Eén call genereert 100 predictions. Herhaal tot remaining=0.
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sS -X POST https://betsplug-production.up.railway.app/api/admin/batch-predictions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"batch_size": 100, "include_upcoming": true, "upcoming_days": 14}'
  echo
  sleep 2
done
```

Je zou per call moeten zien:
```json
{"generated": 100, "evaluated": 0, "remaining": 41, "message": "Batch done. ..."}
```

(`evaluated: 0` is verwacht — upcoming matches zijn nog niet gespeeld.)

Stop zodra `remaining: 0` staat. Dan verifieer je met:

```bash
curl -sS https://betsplug-production.up.railway.app/api/fixtures/today | \
  python -c "import json,sys; d=json.load(sys.stdin); fx=d['fixtures']; \
    print(f'today: {len(fx)} matches, {sum(1 for f in fx if f.get(\"prediction\") or f.get(\"locked_pick_tier\"))} covered')"
```

Doel: "today: 60 matches, 60 covered" (of dichtbij).

---

## 4. Browser walkthrough — wat jij nu zelf wilt doen

Log in als admin in de browser. Per pagina de checklist erbij. Heen-en-weer
admin tier-switch gebruik je via `/beheer`. Meld me concrete problemen per pagina.

### 4.1 `/dashboard` (test als elke tier)

- [ ] Pagina laadt binnen 3 sec zonder console-errors
- [ ] **TierPerformanceCard** toont 4 rijen (Free 48.4%, Silver 60.7%, Gold 70.5%, Platinum 82.3%). Niet alleen jouw tier.
- [ ] **Bij tier-switch:** andere tier wordt highlighted, cijfers blijven gelijk.
- [ ] **Pick of the Day preview:** match-naam + confidence ≥55%.
- [ ] **Als FREE:** upgrade CTA zichtbaar; **Als PLATINUM:** geen upgrade CTA meer.
- [ ] Alle quick-nav knoppen leiden naar de goede pagina.

### 4.2 `/bet-of-the-day`

- [ ] Pick is zichtbaar (vandaag: Sheffield Wednesday vs Charlton).
- [ ] Tier-badge matcht: pick `confidence=0.6491` op Championship → ⬜ Free badge (niet Silver — conf onder 0.65).
- [ ] Track record card onderaan: toont "—" als geen evaluaties, niet "0%".
- [ ] **Als FREE:** "Why this pick?" is locked-teaser.
- [ ] **Als GOLD+:** "Why this pick?" klapt open met 3 drivers.

### 4.3 `/voorspellingen`

- [ ] Wedstrijden zichtbaar — NIET een lege pagina of "geen voorspellingen".
- [ ] **Tier-filter chips:** klik Platinum → aantal gaat omlaag (weinig). Klik Free → omhoog. Klik All → alles terug.
- [ ] **Tel picks per tier als FREE**: noteer het aantal. Doe hetzelfde als PLATINUM. Platinum-count moet hoger zijn.
- [ ] **Locked picks:** bij de Saudi Pro League / Süper Lig matches zie je als Free een "🔵 Gold" of "🟢 Platinum" lock-badge i.p.v. cijfers. Als Platinum zie je de cijfers wél.
- [ ] Competitie-filter werkt: kies "Premier League" → alleen PL-matches.
- [ ] Confidence-filter werkt.

### 4.4 `/resultaten`

- [ ] Laatste resultaat is 17 of 18 april — NIET stuck op 14 april.
- [ ] Correct/incorrect markering zichtbaar per match.
- [ ] **Na stap 3 (backfill) opnieuw checken** — 16/17/18 april moeten nu picks hebben.

### 4.5 `/trackrecord`

- [ ] Tier-tabs werken (All, Free, Silver, Gold, Platinum).
- [ ] Per-tier tabel toont ALTIJD alle 4 tiers, ongeacht welke tab actief is.
- [ ] Totalen per tier: Free 3763 / Silver 3004 / Gold 1650 / Platinum 840.
- [ ] **CSV download als Free-user van Free tier** → werkt (200).
- [ ] **CSV download als Free-user van Platinum tier** → geweigerd (402).
- [ ] **Als Platinum-user** → alle CSV downloads werken.
- [ ] Open de CSV in Excel/Sheets: aantal rijen matcht met de total op de pagina (voor Free ~3763 rijen).

### 4.6 `/rapporten`

- [ ] **Als FREE:** paywall overlay, kan geen rapport genereren.
- [ ] **Als GOLD+:** klik "Genereer rapport" → PDF download start.
- [ ] Open de PDF: header toont "Scope: Gold tier" (of jouw actuele tier), KPI tegels tonen echte cijfers (niet "—" tenzij echt geen data).
- [ ] Per-tier vergelijkingstabel staat in de PDF.

### 4.7 `/hoe-het-werkt` / `/account` / `/beheer`

- [ ] Alle drie laden zonder errors.
- [ ] `/beheer` tier-switch werkt: kies Silver → andere pagina's tonen Silver-scoped data.

### 4.8 Publieke pagina's — **log uit eerst**

- [ ] **Homepage `/`:** geen "64.8%" of "1,247" te zien. Live getal of "—".
  - Het actuele getal zou `48.4%` en `3,763` moeten zijn (matcht trackrecord).
- [ ] **`/pricing`:** Platinum rij toont **"80%+"**, NIET "85%+".
- [ ] **`/track-record` (publiek):** tier-tabs werken. Per tier matchen de getallen
      met wat je in-app zag.
- [ ] **`/engine`:** Platinum-rij toont **"80%+"**. Sample=840, Wilson LB 79.5%.
      Disclaimer-sectie onderaan zichtbaar.

---

## 5. Dingen om op te letten (per fix 1 regel)

| Fix | Waar in UI je merkt of het goed staat |
|-----|----------------------------------------|
| P0.1 (85→80) | Pricing + /engine + PickTierBadge tonen "80%+" voor Platinum |
| P0.2 (Bronze→Gold) | Niet testbaar zonder Stripe test-mode; codepad is `basic`→`gold` in frontend hook |
| P0.3 (admin auth) | `curl /api/admin/users` geeft 401 (na Railway deploy) |
| P1.2 (locked teaser) | `/voorspellingen` als Free: Saudi Pro / CL matches tonen "🔵 Gold" shield i.p.v. lege kaart |
| P1.3 (fake fallbacks) | Homepage: als API faalt, staat er "—", niet "64.8%" |
| P1.6 (home = trackrecord) | Homepage stats blok: 48.4% + 3,763 — zelfde als /trackrecord Free tab |
| P2-C (league funnel) | `/fixtures/upcoming` toont geen A-League / Serie B predictions meer |

---

## 6. Als iets stuk is

Meld per pagina:
- URL waar je bent
- Welke tier je hebt (Free/Silver/Gold/Platinum)
- Wat je verwachtte vs wat je zag
- Browser-console error als die er is (F12 → Console, screenshot of copy)
- Network-request die 4xx/5xx geeft (F12 → Network → rood gemarkeerd)

Dan los ik fixen in code op.

---

## 7. Post-launch monitoring (na live)

Eenmaal live, dagelijks 30 sec werk:

```bash
# Consistency check — elke cel moet met elkaar kloppen
curl -sS https://betsplug-production.up.railway.app/api/pricing/comparison | \
  python -m json.tool

# Freshness — period_end moet binnen 48u van now() liggen
curl -sS "https://betsplug-production.up.railway.app/api/trackrecord/summary?pick_tier=free" | \
  python -c "import json,sys; d=json.load(sys.stdin); print('period_end:', d['period_end'])"

# Today coverage — als dit 0/N blijft, pipeline is stuck
curl -sS https://betsplug-production.up.railway.app/api/fixtures/today | \
  python -c "import json,sys; d=json.load(sys.stdin); f=d['fixtures']; \
    vis=sum(1 for x in f if x.get('prediction')); lok=sum(1 for x in f if x.get('locked_pick_tier')); \
    print(f'today: {len(f)} matches, {vis} visible, {lok} locked')"
```

Zet eventueel als cronjob / bookmarked URL.
