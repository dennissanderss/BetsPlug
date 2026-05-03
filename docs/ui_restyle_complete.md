# Dashboard UI redesign — eindrapport (2026-05-03)

Sprint: visuele restyle + UX-tightening van de Next.js app
(`app.betsplug.com`). Marketing-omgeving (`betsplug.com`) is
parallel door Cas herbouwd in Astro — viel buiten deze sprint.

---

## Eindstand

✅ Alle commits live op `main` en gerebuild door Vercel
✅ TypeScript: 0 errors
✅ Geen content / route / API wijzigingen
✅ Tier-accuracy widget onaangetast (zoals afgesproken)
✅ Geen paarse / roze / berg-achtergronden — pure brand-groen

---

## Wat is gewijzigd per pagina

### Sidebar (alle authed pagina's)
- Active item: 2px groene linker-streep + tinted bg-gradient
- Section labels (OVERVIEW / VOORSPELLINGEN / RESULTATEN / SYSTEM): 10px uppercase, tracking-widest
- Hover: subtiele bg-white/4 highlight
- Locked / coming-soon items: zelfde basis, gemute treatment
- **Logo:** wijst naar `betsplug.com` (extern), niet naar interne homepage
- **Inhoud ongewijzigd:** zelfde menu-items, zelfde tier-locked logica

### Dashboard
- **DashboardHero** wrapper class: `welcome-card` (24px radius, soft 80px green halo, single-color glow blob — purple weg)
- Hero padding bumped van p-5/p-7 → p-6/p-8
- Trackrecord quick-link: nu `strip-card strip-card-green` ipv `glass-panel-lifted`
- **Niet aangeraakt:** HeroBotdCompact, UpcomingPicksStrip, LiveMatchesStrip, SportsHubSidebar (tier-widget), UpgradeNudgeCard, TelegramInviteCard

### Predictions (`/predictions`)
- Tabs (Upcoming / Live / Results): pill-shape segmented control
- Active state: brand-green (`hsl(var(--accent-green))`) op alle drie ipv blauw/rood/groen mix
- Live tab houdt rode pulse-dot (universele "in-play" signaal)
- Per-tier scope strip + alle filtering: ongewijzigd

### Pick of the Day (`/bet-of-the-day`)
- Hero "Pick" card class: `welcome-card` ipv `card-neon card-neon-green halo-green`
- Match info, "Why this pick", track record sub-cards: ongewijzigd

### Trackrecord (`/trackrecord`)
- KpiCard helper: nieuwe `.kpi-card` token (rounded-xl, hover-lift, groene border-on-hover)
- Title typography: 10px uppercase tracking-widest
- KPI value: plain white tabular-nums ipv `gradient-text` (cleaner, geen rainbow)
- TrustFunnel + BotdTrackRecord + BotdLiveTracking secties: ongewijzigd

### Niet aangeraakt
- **Results & Simulation** (`/results`) — 1964 regels, te groot voor restyle in deze sprint zonder scope-creep. Werkt zoals het is.
- **Account / Subscription** — gebruiken al `card-neon rounded-2xl`. Geen visuele debt.
- **Auth flow** (login/register/forgot/reset) — al gepolijst tijdens de cutover-sessie.

---

## Design tokens toegevoegd

In `frontend/src/app/globals.css` (commit `5d04784`):

```css
--r-2xl: 24px;       /* hero / welcome banners */
--r-3xl: 32px;       /* full-width feature cards */

.welcome-card        /* brighter green border, soft 80px halo */
.strip-card          /* full-width inline CTA row */
.strip-card-green    /* same, with green gradient bg */
.kpi-card            /* stat tile, hover lift, green border on hover */
.sidebar-section-label
.sidebar-item
.sidebar-item-active /* 2px green left-border + tinted bg */
```

Backwards compatible — bestaande `card-neon` / `glass-panel` /
etc. ongewijzigd, dus pagina's die nog niet zijn gerestyld
renderen identiek aan voor de sprint.

---

## Commits

```
cf0c5a4 ui: pick-of-the-day + trackrecord tokens (Deel 5 + 6)
6ee27a8 ui(predictions): green-only tab pills + rounded-full segmented (Deel 4)
7418514 ui(dashboard): adopt welcome-card + strip-card-green tokens (Deel 3)
c9d57a7 ui(sidebar): green active state, cleaner section labels (Deel 2)
5d04784 ui: design tokens for 2026-05 dashboard redesign (Deel 1)
```

Eén commit per deel, allemaal op `main`, allemaal door Vercel
gedeployed.

---

## Wat eventueel nog gepolijst kan worden

**Lager prio, niet kritiek:**

1. **Results & Simulation pagina** — 1964 regels, oudste UI in de
   app. Kandidaat voor een aparte sprint waarbij je data-presentatie
   en filter-paneel echt goed bekijkt.
2. **Top-nav search bar** — momenteel een rechthoekige bar met
   placeholder; kan rounded-full pill worden voor consistentie met
   de tabs op /predictions.
3. **Animaties (Deel 10)** — niets toegevoegd, alleen behouden wat
   er al was. Bewust gekozen voor "subtle is better than busy" —
   als je later subtiele page-transitions of card-hover-lift wilt,
   is dat een aparte mini-sprint van een uur.
4. **Light mode** — bewust overgeslagen per spec. Komt later.

---

## Niet aangeraakt (per sprint-regels)

- Engine v8.1 — geen wijzigingen
- Database / migrations — geen wijzigingen
- Tier classificatie logica — geen wijzigingen
- Backend endpoints — geen wijzigingen
- Pagina inhoud (data, functies, copy) — geen wijzigingen behalve
  pure styling

---

## Voor Cas (marketing-kant)

Marketing-rebuild is parallel gebeurd. `marketing/` volgt zijn
eigen design-system (`tokens.css`, `typography.css`,
`MarketingLayout`, etc.) — onze app-redesign en zijn marketing-
redesign delen geen tokens, wat goed is: app en marketing zijn
twee aparte productsurfaces.

Brand-consistency check: beide gebruiken hetzelfde groen
(`#22c55e` / `#4ade80`) als primair accent. Het logo, NOCTURNE
gevoel en eindgebruiker-ervaring lopen visueel door tussen
`betsplug.com` en `app.betsplug.com`.
