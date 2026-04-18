---
title: Integriteit-audit draaien — stap voor stap
date: 2026-04-18
audience: product owner (non-technical)
---

# Integriteit-audit draaien

Doel: met zekerheid vaststellen dat de nauwkeurigheidscijfers op
BetsPlug.com backed zijn door schone database-data. Geen dubbele
tellingen, geen ghost-rijen, geen evaluaties die elkaar tegenspreken.

Duur: **~2 minuten**. Read-only, niks wordt aangepast.

---

## Wat je nodig hebt

- Railway-account met toegang tot het BetsPlug-project
- Moderne browser

Geen SQL-kennis nodig. Je kopieert-plakt en klikt Run.

---

## Stap 1 — Open Railway

1. Ga naar https://railway.app/ en log in.
2. Klik op het project **BetsPlug**.
3. Je ziet meerdere "services" als vakjes: backend, redis, en **Postgres**.

## Stap 2 — Open de database

1. Klik op de **Postgres**-service (icoontje met database-logo).
2. Bovenaan zie je tabs: Deployments / Variables / Metrics / **Data**.
3. Klik op **Data**.

> Zie je geen Data-tab? Railway toont die niet altijd standaard.
> Alternatief staat onderaan dit document.

## Stap 3 — Open een query-venster

1. Op de Data-pagina zie je een lijst met tabellen (predictions,
   matches, users, …).
2. Zoek een knop **"Query"** of **"New Query"** bovenaan (meestal
   rechtsboven).
3. Je krijgt een leeg tekstvak.

## Stap 4 — Kopieer + plak het audit-script

Open dit bestand in de repo:

```
backend/scripts/integrity_audit.sql
```

Of direct op GitHub:
https://github.com/dennissanderss/BetsPlug/blob/main/backend/scripts/integrity_audit.sql

Kopieer **de volledige inhoud** → plak in het Railway query-venster
→ klik **Run**.

---

## Wat je moet zien (alles OK)

Vier resultaten achter elkaar:

```
Q1 ghost predictions   0
Q2 ghost evaluations   0
Q3 (empty result)
Q4 (empty result)
```

Alles netjes nul / leeg = je trackrecord is schoon op rij-niveau.
Je kunt met volle zekerheid launchen.

## Wat je moet doen als er iets mis is

Als één van de 4 queries **meer dan 0 rijen** geeft → er is een
data-probleem. Copy-paste die output terug in Claude Code (of
bewaar het als screenshot). De volgende Claude-sessie kan je
vertellen:

- Wat het betekent
- Hoeveel picks erbij betrokken zijn
- Hoe het je accuracy-cijfers beïnvloedt
- Wat de fix is (meestal een korte DELETE of rescore)

## Wat elke query test

| Query | Checkt op | Waarom het ertoe doet |
|-------|-----------|------------------------|
| Q1 | Predictions die verwijzen naar een wedstrijd die niet bestaat | Rotte database-verwijzingen, meestal door onvoorzichtige DELETE's |
| Q2 | Evaluaties die verwijzen naar een voorspelling die niet bestaat | Ghost-evaluaties die je totaal opblazen |
| Q3 | Dezelfde voorspelling die meer dan 1 keer is beoordeeld | Dubbele tellingen in accuracy (een win telt 2x) |
| Q4 | `is_correct = true` terwijl de scoreboard het tegendeel zegt | Evaluator-bug die percentages fout maakt |

---

## Alternatief als Railway's Data-tab er niet is

Railway heeft de Data-tab niet altijd beschikbaar voor elk plan.

**Plan B — via een GUI-tool** (gratis, 5 minuten setup):

1. Download **DBeaver Community Edition** (https://dbeaver.io/) of
   **TablePlus** (https://tableplus.com/, 14-dagen trial).
2. In Railway: klik Postgres → **Variables** tab → kopieer de
   `DATABASE_URL` (begint met `postgresql://...`).
3. In DBeaver/TablePlus: "New Connection" → "PostgreSQL" → plak de
   URL → Connect.
4. Open het SQL-tabblad. Kopieer `backend/scripts/integrity_audit.sql`
   → plak → Run.

**Plan C — vragen of Claude het voor je doet**:

Als je vastloopt of Railway niet meewerkt, spawn dan in Claude Code
een nieuwe sessie en vraag: "Draai `backend/scripts/integrity_audit.sql`
via `scripts/train_local.py` DB-credentials." Die heeft al de
credentials en kan de queries namens jou draaien.

---

## Wanneer draai je deze audit?

- **Nu, vóór launch** — een keer schone stip op de horizon.
- **Na elke grote data-migratie** (bv. backfill-run, Alembic-schema-
  change).
- **Elk kwartaal** als hygiëne-check.

Read-only, 2 minuten, geen downtime. Niks om bang voor te zijn.
