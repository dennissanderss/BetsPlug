# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Session handoff:** at the start of any new session, first read
> `docs/SESSION_HANDOFF.md` for the current state of Fase A/B/C,
> recent commits, open follow-ups, canonical tier facts and
> do's/don'ts. Pair it with `docs/fase_b_qa_report.md` for the detailed
> QA audit findings. Those two files together replace having to
> reconstruct prior-session history.

> **Frontend design (NOCTURNE):** before touching any visual code, read
> `frontend/NOCTURNE.md`. Every page, card, button and data chip on the
> public site and in the authed dashboard must follow those conventions —
> `card-neon` gradient-border surfaces, `<HexBadge>` icon frames, `<Pill>` /
> `<DataChip>` / `<TrustScore>` data primitives, ambient glow blobs behind
> every section, mixed-case typography, and logo-green as the sole primary
> accent. Plain `<div>` + hard-coded hex colours will render off-brand.

## Project

Sports Intelligence Platform / BetsPlug — subscription B2C sports-forecasting SaaS. Ingests football/basketball matches, engineers point-in-time features (Elo, form, H2H, standings), runs probabilistic models (Elo / Poisson / Logistic / XGBoost / Ensemble), tracks accuracy, and serves a Next.js marketing + dashboard site behind a Stripe paywall.

All forecasting output is labelled simulated/educational. The `/api/strategies/*` contract enforces a plausibility gate that clamps implausible winrate/ROI to 0 — see `backend/API_CONTRACT.md`. Preserve this when touching metrics endpoints.

## Stack

- **Backend**: FastAPI 0.115 + async SQLAlchemy 2 (asyncpg) + Alembic + Celery 5 + Redis 7 + PostgreSQL 16. Python 3.12.
- **ML**: scikit-learn 1.8, XGBoost 2.1. Pre-trained artifacts live in `backend/models/` (`xgboost_model.ubj`, `logistic_model.pkl`, `feature_scaler.pkl`, `feature_names.json`, `model_metadata.json`) and are loaded at Railway boot.
- **Frontend**: Next.js **14** App Router (note: README says 15, package.json pins 14) + React 18 + TypeScript + Tailwind + Radix + TanStack Query + Sanity Studio (embedded at `/studio`).
- **Deploy**: Docker Compose locally; backend on Railway (see `backend/railway.toml`, `backend/nixpacks.toml`, `backend/Procfile`, `backend/start.py`); frontend on Vercel (`frontend/vercel.json`).

## Common commands

Backend (from `backend/`):
```bash
pip install -r requirements.txt
alembic upgrade head
python -m seed.seed_data                              # sample data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest                                                # all tests
pytest tests/unit/test_foo.py::test_bar -xvs          # single test
pytest tests/integration/                             # needs live DB
python scripts/train_local.py                         # retrain v8 models vs Railway DB
python scripts/validate_walkforward.py                # leak-free walk-forward eval
python scripts/leak_test.py                           # feature-leakage probe
```

Frontend (from `frontend/`):
```bash
npm install
npm run dev                     # http://localhost:3000
npm run build && npm run start
npm run lint
npm run translate               # google-translate-api-x → NL only (see below)
npm run migrate:homepage        # push local homepage content into Sanity
npm run migrate:homepage:dry    # same, dry-run (no writes)
```

`npm install` silently runs `scripts/setup-hooks.sh` via `postinstall` to wire git hooks — expected, not an error.

Docker (from repo root):
```bash
docker-compose up --build       # db + redis + backend + celery_worker + celery_beat + frontend
docker-compose exec backend python -m seed.seed_data
```

Windows convenience wrappers: `start.bat`, `stop.bat`, `open.bat`.

## Architecture notes that aren't obvious from file names

**Railway boot sequence** (`backend/start.py`, runs before uvicorn): `bootstrap_alembic_if_needed` → `reconcile_user_auth_columns` → `alembic upgrade head`. This self-heals databases that were created by `Base.metadata.create_all` before Alembic existed, and patches the `users` table with missing auth columns even when Alembic has stamped `head` without actually running migration `b2c3d4e5f6a7`. The FastAPI lifespan (`app/main.py`) also runs `Base.metadata.create_all` as a last-resort safety net for tables added without a migration. **Migrations are the source of truth** — when adding a model, always write the Alembic revision; don't rely on the safety nets.

**Layered backend**: `api/routes/` (thin, one file per resource, ~40 routers including heavy `admin_*` surface) → `services/` (business logic) → `repositories/` (async SQL). `schemas/` are Pydantic v2 request/response. `models/` are SQLAlchemy ORM. Keep routers thin.

**Forecasting pipeline**: `forecasting/forecast_service.py` selects the active `ModelVersion` row from DB and dispatches to an implementation in `forecasting/models/` (all extend `base_model.ForecastModel`). `features/feature_service.py` builds vectors; `ingestion/` uses per-sport adapters behind `base_adapter.BaseAdapter`. The v8 engine is the XGBoost + calibrated logistic pair loaded from `backend/models/` on boot.

**Pre-match lock / honest ROI**: predictions and evaluations are split by whether a match was locked before kickoff vs. recorded live/backtest. When touching prediction, trackrecord, strategy, or ROI code, preserve this split — conflating them is the class of bug the v7/v8 work exists to prevent.

**Celery queues**: `celery,emails` (two queues, concurrency 2). Beat schedule in `backend/celerybeat-schedule`. Scheduled ingestion, report PDF generation, nightly evaluation.

**Frontend route groups**: `src/app/(app)/*` is the authenticated SaaS (dashboard, predictions, trackrecord, admin, etc.); `src/app/*` (outside the group) is the public marketing site (home, pricing, blog, auth). They share `layout.tsx` at the root. Sanity Studio is mounted at `/studio`.

**i18n**: **only EN and NL**. Don't generate other locales — `npm run translate` and the config in `src/i18n/` are intentionally constrained to save translation-API usage.

**Sanity CMS**: blog posts and marketing content come from Sanity (`frontend/sanity/`, `next-sanity` client). Don't hardcode content that belongs in the CMS.

## Working in this repo

- README claims Next.js 15 / React 19; actual pinned versions are Next 14 / React 18. Trust `package.json`.
- `backend/models/` holds serialized ML artifacts — do not git-delete; they are loaded at boot and retraining requires direct Railway DB access (credentials are in `scripts/train_local.py`; rotate if exposed).
- `/api/strategies/{id}/metrics` returns both clamped (`winrate`, `roi`) and raw (`raw_winrate`, `raw_roi`) values plus a `validation_status` enum. The frontend "Profitable" badge logic depends on the clamp — don't remove it.
- The `docs/v10_progress_*.md` and `docs/V8_ENGINE_REPORT.md` files are working logs from the current engine/UX build; treat as context, not spec.

## i18n — hard rules (2026-04-23)

Non-negotiable after the April 2026 brand-SEO collapse + full Nerdytips-style re-architecture:

1. **No hardcoded locale ternaries in components.** `isNl ? "X" : "Y"` and `locale === "nl" ? "X" : "Y"` are banned for UI strings. Every UI string goes through `t("key")` + the `useTranslations()` hook (client) or `translate(locale, "key")` (server). Pre-commit hook (`frontend/scripts/check-no-hardcoded-strings.mjs`) blocks commits that re-introduce the pattern.
   - Allowed exceptions: language-code passthroughs (`isNl ? "nl" : "en"`), BCP-47 date codes (`"nl-NL"` / `"en-GB"`), editorial-locale picks on Sanity content (`hub.name[editorialLocale]`). The check whitelists these automatically.

2. **Supported locales are frozen at 16** — `en, nl, de, fr, es, it, sw, id, pt, tr, pl, ro, ru, el, da, sv`. Adding a 17th locale is a deliberate multi-system change (middleware + routeTable + translate.mjs + font fallback + Sanity schema).

3. **`messages.ts` is the source of truth for UI strings.** Add every new key to BOTH the `en` and `nl` blocks. The `npm run translate` script (`scripts/translate.mjs`) fills the other 14 locales via google-translate-api-x and runs automatically via the pre-commit hook when `messages.ts` changes.
   - **Fallback when Google rate-limits.** The free Google endpoint hard-throttles at ~1k calls/min and silently writes EN as fallback when it fails (you'll see "Too Many Requests" in logs). When that happens: ask Claude (in this conversation, with full context) to hand-author the missing translations as a JSON batch shaped like `{ "de": { "key": "Wert", ... }, "fr": {...}, ... }`, save to `frontend/scripts/i18n-batch.json`, then run `node frontend/scripts/apply-i18n-batch.mjs` to patch all 14 locale files in one shot. The `--dry-run` flag previews changes. Hand-authored translations stick because the pre-commit hook only fills *missing* keys.

4. **Editorial / marketing content (hero copy, league intros, FAQs, blog posts) lives in Sanity**, not in component code. Use `fetchXPage` / `fetchXBySlug` helpers in `src/lib/sanity-data.ts`; Sanity documents have per-locale localised fields. DeepL-powered `scripts/translate-sanity.ts` keeps non-EN locales filled.

5. **Canonical URLs are always the EN form**, regardless of which locale is rendering. `lib/seo-helpers.ts` → `getCanonicalUrl()` returns `https://betsplug.com{canonicalPath}`; individual pages never build their own canonical.

6. **Co-founder workflow:** code changes that add UI strings MUST route through Cas (me). If Denis adds an inline string in a component, the pre-commit hook blocks it — the change needs to land as a key in `messages.ts` first, Cas runs the translator, then Denis rebases on top. This keeps the dictionary consistent and every locale up to date.

7. **Session start:** any new Claude Code session must open with a routine check — `git log` since last session, Vercel deploy status, and a hardcoded-string scan across recently-changed files. That routine lives in `docs/BETSPLUG_STARTUP.md`; the memory system has a pointer to it.
