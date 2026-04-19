# Consistency Matrix — Deep Audit Fase 6

**Datum:** 2026-04-19
**Doel:** elke bron die per-tier accuracy exposed vergelijken en blote getallen naast elkaar leggen. Cellen met `?` vereisen DB-toegang om in te vullen (zie `database_inventory.md § 4` voor queries).

## 6.1 Verwachte baseline uit code

Alle bronnen die *zouden moeten* matchen delen dezelfde SQL-kern:
`trackrecord_filter()` (v8.1 + `predicted_at <= scheduled_at`) + `pick_tier_expression()` GROUP BY.

Dit geldt voor:
- `/api/trackrecord/summary.per_tier`
- `/api/pricing/comparison[*].accuracy_pct` en `.sample_size`
- `/api/dashboard/metrics.per_tier` — **crasht** (Fase 4)

## 6.2 Referentie-getallen uit handoff-docs

Session-handoff (2026-04-17) en `SESSION_HANDOFF_2026-04-18.md` noemen:
- Free: **3.763** predictions / **48.4%** accuracy
- Silver: **3.004** / 60%+
- Gold: **1.650** / 70%+
- Platinum: **840** / 82.5% (was 74.4% walk-forward vóór v8.1)
- BOTD overall: **71%** (POTD_STATS constant)

Dit is de baseline die op elke gebruikersinterface moet verschijnen, onafhankelijk van de tier-scope van de viewer.

## 6.3 Matrix

Cellen: `n` = sample size, `%` = accuracy. Velden met twee bronnen die samen geverifieerd moeten worden zijn **vet**.

| Bron | Filter-stack | Free n | Free % | Silver n | Silver % | Gold n | Gold % | Plat n | Plat % | BOTD % |
|---|---|---|---|---|---|---|---|---|---|---|
| DB direct (geen filters) | — | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| DB + v81_predictions_filter | `prediction_source IN (…) AND created_at≥2026-04-16 11:00` | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| DB + trackrecord_filter | v81 + `predicted_at<=scheduled_at` | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| DB + trackrecord_filter + strikt `<` | v81 + `predicted_at<scheduled_at` | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| **`/api/pricing/comparison`** | trackrecord + pte groep | **3.763¹** | **48.4** | **3.004¹** | **60+** | **1.650¹** | **70+** | **840¹** | **82.5** | — |
| **`/api/trackrecord/summary.per_tier`** | trackrecord + pte groep | 3.763 | 48.4 | 3.004 | 60+ | 1.650 | 70+ | 840 | 82.5 | — |
| `/api/dashboard/metrics.per_tier` | **crash** | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | — |
| `/api/bet-of-the-day/track-record` | trackrecord + source='live' (fallback v81) | — | — | — | — | — | — | — | — | **71²** |
| `/api/bet-of-the-day/live-tracking` | source='live' + strikt `<` + eigen cutoff 2026-04-18 | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| `/api/trackrecord/live-measurement` | source='live' + strikt `<` + 2026-04-16 cut-off | ? | ? | ? | ? | ? | ? | ? | ? | — |
| Dashboard card (browser, ingelogd FREE-user) | via `/api/dashboard/metrics` | **0** | **0.0** | ? | ? | ? | ? | ? | ? | — |
| Dashboard card (browser, PLATINUM-user) | idem | 0 | 0.0 | 0 | 0.0 | 0 | 0.0 | 0 | 0.0 | — |
| Trackrecord-pagina (browser) | via `/api/trackrecord/summary` | 3.763 | 48.4 | 3.004 | 60+ | 1.650 | 70+ | 840 | 82.5 | — |
| Pricing-pagina (browser) | via `/api/pricing/comparison` | 3.763 | 48.4 | 3.004 | 60+ | 1.650 | 70+ | 840 | 82.5 | — |
| Homepage stats-strook | (?) zie `homepage.py` | ? | ? | — | — | — | — | — | — | — |
| CSV download per tier | `/api/trackrecord/export.csv?pick_tier=` | = endpoint | = endpoint | idem | idem | idem | idem | idem | idem | — |

¹ Deze getallen zijn als canonical beschouwd in handoff-docs. Te bevestigen met live DB-query.
² BOTD 71% is een POTD_STATS constant; te verifiëren tegen echt geëvalueerde BOTD-subset.

## 6.4 Mismatches die nu bekend zijn

| Bron A | Bron B | Mismatch | Oorzaak |
|---|---|---|---|
| Dashboard card FREE | Trackrecord FREE | 0/0 vs 3.763/48.4 | Dashboard per_tier crasht (`_v81` NameError). Zie Fase 4. |
| Dashboard card SILVER/GOLD/PLAT | Trackrecord idem | 0/0 vs echte cijfers | Zelfde bug — hele per_tier dict mist of is leeg. |
| Live-meting alle tiers | Trackrecord | 0/0 vs 3.763 enz. | Bewust: live-meting filtert harder (source='live' + strikt pre-match + eval). Zie Fase 5. |
| `/bet-of-the-day/live-tracking` | `/bet-of-the-day/track-record` | vermoedelijk leeg vs niet-leeg | Live-tracking heeft eigen cutoff 2026-04-18 + strikt `<`. Track-record is de model-validatie tegenhanger. |

## 6.5 Mismatches die nul zouden moeten zijn

Als de fix in Fase 4 landt en cache geflusht wordt, moeten deze pairs **exact gelijk** zijn (tot op rij-count):

1. `/api/pricing/comparison[TIER].sample_size` == `/api/trackrecord/summary?pick_tier=TIER.total_predictions`
2. `/api/trackrecord/summary?pick_tier=TIER.total_predictions` == `/api/trackrecord/summary.per_tier[TIER].total`
3. `/api/dashboard/metrics.per_tier[TIER].total` (post-fix) == same
4. CSV regel-count (na Excel-header/footer aftrek) == idem

## 6.6 Validatie-test (te automatiseren na Fase 8.6)

Pseudo-code voor een pytest `tests/consistency/test_tier_parity.py`:

```python
@pytest.mark.asyncio
async def test_tier_parity_across_endpoints(client, reset_cache):
    dash  = (await client.get("/api/dashboard/metrics")).json()["per_tier"]
    track = (await client.get("/api/trackrecord/summary")).json()["per_tier"]
    price = (await client.get("/api/pricing/comparison")).json()
    price_by_slug = {p["pick_tier"]: p for p in price}

    for slug in ["free", "silver", "gold", "platinum"]:
        assert dash[slug]["total"] == track[slug]["total"] == price_by_slug[slug]["sample_size"]
        # accuracy: dash/track return floats 0-1, pricing returns 0-100
        assert dash[slug]["total"] == 0 or abs(
            dash[slug]["accuracy"] * 100 - price_by_slug[slug]["accuracy_pct"]
        ) < 0.1
```

Draai in CI + als cron-check elke 15 min in prod (admin notificeren bij fail).

## 6.7 Openstaande invulling

De vraagtekens (`?`) in matrix 6.3 kunnen we niet vanuit de working-copy invullen. Twee opties om ze te sluiten:

1. **User draait SQL** (database_inventory.md §4) via Railway PSQL shell en plakt output.
2. **Admin-endpoint toevoegen** `/api/admin/consistency-matrix` die alle bronnen serverside draait en matrix JSON retourneert. Scope voor Fase 8.6.

Zonder deze cellen kunnen we niet **bewijzen** dat onze hypothese klopt (alleen dashboard-per-tier is kapot); we kunnen alleen beredeneerd aannemen op basis van code-inspectie. Voor de user-facing sign-off is stap 1 snel genoeg.
