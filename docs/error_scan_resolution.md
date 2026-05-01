# Error scan resolution — 2026-05-02

Vervolg op `docs/error_scan_report.md`. App-omgeving (`frontend/` +
`backend/`) cleanup. Marketing-omgeving (`marketing/`) blijft over
voor Cas.

---

## Wat is gefixt (commits)

| Commit | Issue | Bestand(en) | Effect |
|--------|-------|-------------|--------|
| `339b634` | P2.1 — trust-funnel dode `loc()` refs | `components/ui/trust-funnel.tsx` | "Bekijk track record" knoppen op `/trackrecord` dashboard wijzen direct naar `betsplug.com/track-record` (geen middleware-hop meer) |
| `59b1abb` | P2.2 — dode SiteNav + Footer imports | 7 auth/legal pagina's | Bundle-grootte iets kleiner; geen visueel verschil (componenten renderden al null) |
| `5c55996` | P1.1 + P3.3 — backend config defaults | `backend/app/core/config.py`, `backend/app/api/routes/subscriptions.py` | `site_url` deprecated + apex; Stripe success/cancel defaults nu app.betsplug.com (geen "localhost:3000"-leak meer mogelijk) |

## Wat is NIET gefixt en waarom

### P0.1 — Sitemap belooft 404-pages
**Hoort bij Cas (marketing-kant).** Vereist Vercel-rebuild op het `betsplug-marketing` project + diagnose van zijn Sanity-config voor `leagueHub` en `betTypeHub` documents. Volledige instructie staat in het oorspronkelijke rapport.

### P0.2 — Vercel image-optimization quota
**Geen code-fix.** Jij moet zelf checken via `vercel.com/dashboard → Usage → Image Optimization Transformations` of de huidige stand boven of onder 5K zit, en dan kiezen tussen niets-doen / Pro upgrade.

### P2.3 — `/welcome` 79 KB
**Bewust niet aangeraakt.** Pagina is een complete marketing-style landing met 7 secties, `motion`-animaties, Sanity-content. Werkt zoals hij is. Een volledige redesign is content-werk, geen bug-fix. Beschouw dit als een open backlog-item dat jij kunt oppakken als je `/welcome` ooit korter wilt.

### P2.4 — top-bar.tsx onverwachte consumers
**False positive in de oorspronkelijke scan.** De matches in `data/potd-stats.ts` en `hooks/use-botd-track-record.ts` waren JSDoc-commentaar, geen imports. Top-bar wordt enkel door site-nav geconsumeerd → beide effectief dood. Geen actie.

### P3.1 — Astro redirects via meta-refresh
**Hoort bij Cas (marketing-kant).** Werkt nu — Astro static-output kan geen 308 redirect headers serveren. Pas relevant als Cas naar hybrid output mode wil overstappen.

### P3.2 — `[slug]` orphan-routes
Zelfde issue als P0.1, hoort bij Cas.

---

## App-omgeving status

✅ **TypeScript build:** clean
✅ **Backend Python syntax:** clean
✅ **Geen kapotte user-flows**
✅ **Geen leaks van marketing-routes naar app**
✅ **Stripe, email, auth — alles correct gerouteerd via `app_base_url`**

## Open punten (wachten op andere actie)

| Wie | Wat |
|-----|------|
| Cas | P0.1 + P3.2 — Vercel rebuild + sitemap fix |
| Jij | P0.2 — Vercel Usage check |
| Jij of Cas | P2.3 — `/welcome` redesign (geen bug, content-keuze) |

## Test resultaten

Alle commits getypecheckt + Python ge-asserteerd vóór push. Geen regressies in build-pipeline. Geen wijzigingen aan engine, predictions, database of CORS — alleen URL/imports/defaults.
