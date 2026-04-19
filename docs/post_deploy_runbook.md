# Post-Deploy Runbook

**Context:** volg deze stappen 5-15 min na elke deploy die via de deep-audit sprint (2026-04-19) is gepusht. Alles wat hieronder staat is een copy-paste commando.

Prod-URLs:
- Backend: `https://betsplug-production.up.railway.app`
- Frontend: `https://betsplug.vercel.app` (en custom domain)

Admin-auth: gebruik een user met `role=admin`. Tokens via `/auth/login`.

---

## 1. Backend health (geen DB-toegang nodig)

```bash
curl -s https://betsplug-production.up.railway.app/api/ping
# → {"status":"ok"}

curl -s https://betsplug-production.up.railway.app/api/health | jq '.db, .redis, .api_football'
# → "up" / "up" / "up"  (anders: onderzoek)
```

## 2. Dashboard-fix verifiëren

```bash
TOKEN="<admin-jwt>"

# per_tier moet vier tiers teruggeven, elke met positieve total
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://betsplug-production.up.railway.app/api/dashboard/metrics" \
  | jq '.per_tier | keys, (.platinum, .gold, .silver, .free) | .total'
# → ["free","gold","platinum","silver"]  + vier positieve integers
```

Vroegere buggy response: `per_tier: null` of `{}` — als je dat nog ziet is de fix niet gedeployed of cache niet geflushed.

## 3. Scheduler-status

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://betsplug-production.up.railway.app/api/admin/scheduler-status" | jq
```

Verwacht minimaal:
- `running: true`
- `jobs[].id == "generate_predictions"` met trigger dat `600s` (10 min) bevat
- `jobs[].id == "evaluate_predictions"` met trigger dat `1200s` (20 min) bevat
- `jobs[].id == "historical_predictions"` met 5 min trigger

Als `running: false` of een `503`: APScheduler faalde stil tijdens boot. Check Railway-logs op `Failed to start scheduler`.

## 4. Cache leegmaken

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "https://betsplug-production.up.railway.app/api/admin/cache-flush" | jq
# → {"flushed": {"dashboard:*": N, "strategy:metrics:*": M, ...}, "total": N+M+...}
```

Doe dit één keer na elke deploy die filter-semantiek aanraakt. Voorkomt dat users tot 1u stale aggregates zien.

### 4b. Scheduler-job handmatig triggeren (optioneel)

Als je een job direct wilt laten draaien (backfill na deploy, of verifiëren dat eval echt werkt zonder 20 min wachten):

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "https://betsplug-production.up.railway.app/api/admin/trigger-job?job_id=evaluate_predictions" | jq
```

`job_id` kan: `generate_predictions`, `evaluate_predictions`, `historical_predictions`, `sync_data`.

## 5. Data-parity matrix vullen (DB-toegang)

Railway PSQL shell:
```bash
railway run --service=<postgres-service-name> psql
```

Draai de 5 queries uit `docs/database_inventory.md § 4` en plak de resultaten in `docs/consistency_matrix.md § 6.3`. Verwachte match:
- `/api/pricing/comparison[platinum].sample_size` == Platinum-row `total` in DB-query 4.5
- `/api/trackrecord/summary.per_tier.platinum.total` == idem
- `/api/dashboard/metrics.per_tier.platinum.total` (na fix) == idem

Als één van de drie afwijkt: filter-drift teruggesluipt.

## 6. Browser-walkthrough per tier

Gebruik admin `?tier=` query-param voor overrides.

1. **FREE view**: `https://betsplug.vercel.app/dashboard?tier=free` → tier-kaart toont Free/Silver/Gold/Platinum accuracy; upgrades gesloten met slot.
2. **PLATINUM view**: `?tier=platinum` → alles ontgrendeld, cijfers identiek aan Free-view voor trackrecord (per_tier is tier-agnostisch na Bug 1 fix).
3. **Trackrecord tabs**: 4 tabs bestaan (Performance / Segments / Pick of the Day / Live measurement). Tab-switch verandert inhoud, geen 404.
4. **Pricing-pagina**: vier tier-cards tonen live cijfers uit `/api/pricing/comparison` (niet hardcoded).

## 7. Live-meting groei over 24-48u

Op dag 0 is `/trackrecord` → Live-tab nagenoeg leeg. Elke 24u zou het totaal moeten groeien met nieuw-geëvalueerde pre-match picks. Monitoring:

```bash
curl -s "https://betsplug-production.up.railway.app/api/trackrecord/live-measurement" | jq '.total, .per_tier'
```

Verwacht 0-tientallen op dag 1, tientallen-honderden op dag 7. Als na 48u nog steeds `total: 0`: scheduler draait niet, of `source="live"` wordt niet correct gestempeld — dan `scheduler-status` opnieuw checken.

## 8. Regenereren documenten (optioneel, content-freeze moment)

```bash
cd docs
node generate-technical-doc.js      # → BetsPlug-Technical-Framework (ENG).docx
node generate-technical-doc-nl.js   # → BetsPlug-Technisch-Kader-NL.docx
node generate-legal-doc.js          # → BetsPlug-Legal-Framework (ENG).docx
node generate-legal-doc-nl.js       # → BetsPlug-Juridisch-Kader-NL.docx
```

De technical-doc scripts bevatten nu de live v8.1 tier-cijfers (82.5% / 71.7% / 60%+ / 48.4%) naast de walk-forward baseline. Legal-docs zijn onveranderd in deze audit.

---

## Rollback-pad

Als één van bovenstaande stappen iets kritieks laat zien:

1. **Dashboard 500** opnieuw: `git revert` het relevante commit en push — maar dat zal de `_v81` fix wegnemen. Eerst logs checken.
2. **Scheduler down**: zet `TIER_SYSTEM_ENABLED=false` op Railway env-vars om terug te vallen op pre-v8.1 gedrag (geen tier-filters, endpoint-500s verdwijnen), dan in rust onderzoeken.
3. **Cache chaos**: `railway run redis-cli FLUSHDB` — werkt altijd.

Geen enkele fix in deze sprint raakt engine-model-artifacts; een rollback is altijd veilig.
