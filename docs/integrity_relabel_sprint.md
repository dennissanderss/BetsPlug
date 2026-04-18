---
title: Integrity Relabel Sprint — progress report
date: 2026-04-18
session: sprint part 4 (integrity relabel)
---

# Integrity Relabel Sprint — progress report

Context: 2026-04-18 audit revealed that none of the 3,763 historical
predictions in the live DB have a strict pre-match timestamp
(`predicted_at < scheduled_at`). 14 are explicit post-kickoff
backfills; 269 of every 283 sampled have `predicted_at` exactly equal
to kickoff (batch-simulation default). Model is methodologically
honest (point-in-time features); marketing language was not.

Engine untouched. Database untouched beyond the 14 post-kickoff rows
being filtered out of user-facing queries.

## Steps completed

| Step | Commit | Scope |
|------|--------|-------|
| 1 — post-kickoff filter | `447297e` | New `trackrecord_filter()` combines v81 + `predicted_at <= scheduled_at`. Rewired 30+ user-facing call sites. v81 stays for admin/subquery uses. |
| 2 — homepage copy | `f8d9d56` | Batch rewrite of core claims ("locked before kickoff" → "point-in-time model analysis") in EN + NL across ~25 i18n keys. Three exceptions kept in place (engine methodology, prediction availability FAQ, feature description). |
| 3 — pricing copy | `e1900fe` | Tier accuracy bullets → "based on collected data: X%+". New provenance footer on every card and Platinum card explaining dataset origin + live-measurement start date. |
| 4 — engine methodology | `84605aa` | New two-card block on `/engine#validation` distinguishing Model Validation from Live Measurement, with explicit non-mixing disclaimer ("we will publish the gap"). |
| 5 — live measurement | `00462f2` | Backend `GET /api/trackrecord/live-measurement` (source='live' ∧ strictly pre-match ∧ since 2026-04-16). Frontend `LiveMeasurementSection` with per-tier Wilson CIs and an "Awaiting data" badge for n<10. |
| 6 — authed /trackrecord | `1376e5c` | Authed trackrecord page now embeds BotdTrackRecordSection + LiveMeasurementSection + TrustFunnel inline so signed-in users see all three datasets without leaving the page. Hub-tabs strip stays for deep-linking. |
| 7 — FAQ | `5adfa12` | Three new Q&A entries (EN + NL): "live vs model validation", "why is live measurement still small", "how do I know your validation is honest". Explicitly mentions the 14 backfill rows removed. |

## What users will see after deploy

**Public homepage**
- TrustFunnel header rephrased to "how our model numbers are built" (from "how we got to our numbers").
- Final step label "Wedstrijden in onze dataset" (was "Wedstrijden beoordeeld").
- Funnel closing copy points to the split between model validation and the live measurement that started on 16 April 2026.

**Public /track-record**
- Existing tier KPI grid → still shows model-validation numbers but rebranded as "collected data" / "model performance".
- New "Pick of the Day track record" section (from earlier sprint).
- NEW: "Live measurement" section with four tier cards. All four currently show "Awaiting data" because the live pipeline hasn't produced a graded match yet — will populate as matches play and resolve.
- Dataset provenance: TrustFunnel visualisation.

**Public /pricing**
- Every tier card carries a provenance footer: "Based on model validation on 2 years of historical data. Live measurement started 16 April 2026."
- Silver "Full public track record" bullet renamed to "Full public dataset, downloadable per tier".

**Public /engine**
- Validation section gains a two-card block clearly separating Model Validation vs Live Measurement.
- Disclaimer: "we will publish the gap" if live diverges from validation.

**Public FAQ**
- Three new entries answering the most obvious questions a visitor will now have.

**Signed-in /trackrecord**
- Hub tabs stay (Cumulative / Recent / Pick of the Day).
- Cumulative view now also shows BOTD section, Live measurement section, and TrustFunnel below.

## Quantitative impact

- Total graded predictions in headline aggregates: 3,763 → **~3,749** (14 rows filtered out).
- Per-tier accuracies: expected to tick up slightly — the 14 offenders scored 35.7% collectively, below the population mean. Gold ~70.5% and Platinum ~82.3% may land a fraction of a point higher after the filter propagates through Railway.
- Live measurement today: 0 / 0 on all four tiers. Starts growing per match.

## Step 8 verification — remaining "track record" references

grep shows ~25 files still contain "track record" / "trackrecord" in
free-form marketing copy (article pages, SEO metadata, match-predictions
pages, pricing comparison). The programmatic rewrite in Step 2 covered
the core hero/USP/FAQ/pillar claims; the long tail of article prose and
SEO boilerplate is not blocking but should get a second pass:

- `frontend/src/app/home-content.tsx` — some prose still uses "track record" narratively
- `frontend/src/app/articles/article-template.tsx` — SEO copy templates
- `frontend/src/app/match-predictions/**` — league-hub pages
- `frontend/src/app/pricing/pricing-content.tsx` — deep-dive pricing page copy

These are visible-but-non-critical places. Recommend a follow-up
session to walk through each and decide: replace ("model performance"),
keep (when genuinely talking about the historical dataset as evidence),
or reframe ("collected data"). That's editorial work more than
engineering — better to do once with fresh eyes than in batch.

Strings that SHOULD stay:
- Source-code comments documenting filter names (functional docs)
- API route paths (`/trackrecord/...` — breaking change risk)
- The `trackrecord_filter()` backend function name itself

## Open follow-ups (not blocking launch)

- **Editorial pass on the long-tail pages** (above).
- **CSV column "Predicted At"** — add to `/trackrecord/export.csv` so auditors can see the lock state per row.
- **Wilson CIs on the model-validation tier cards** — optional, reduce statistics objections from analytical users.
- **report_service `config.pick_tier` honoring** — verify PDF generation actually respects the tier selected on the form (backend follow-up).
- **Monitor live measurement vs validation divergence** — once live has 50+ picks per tier, compare delta and decide whether to publish.

## Rollback guidance

All 7 commits are isolated:
- Rollback STEP 1 (filter): revert commit, v81 semantics restored; 14 backfill rows re-appear in aggregates.
- Rollback STEP 2-3-4-7 (copy): revert commit; previous copy strings restored.
- Rollback STEP 5 (live measurement): revert, endpoint gone and section disappears. Nothing downstream breaks.
- Rollback STEP 6 (authed embed): revert, sections removed from authed trackrecord.

Nothing in this sprint is destructive to DB data.
