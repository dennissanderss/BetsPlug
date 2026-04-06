# Architecture — Sports Intelligence Platform

> All forecasts and analytical outputs are simulated/hypothetical.
> This platform is for educational and research purposes only.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Browser                             │
│              Next.js 15 · React 19 · TypeScript · Tailwind          │
│         Dashboard / Matches / Teams / Reports / Admin / Search       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (REST/JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend  :8000                        │
│  /api/auth  /api/sports  /api/leagues  /api/teams  /api/matches     │
│  /api/predictions  /api/trackrecord  /api/backtests  /api/reports   │
│  /api/search  /api/admin  /api/health                               │
│                                                                      │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │
│  │  Auth (JWT)  │  │  Services   │  │   Forecasting Pipeline   │   │
│  │  RBAC roles  │  │  Ingestion  │  │  Elo · Poisson · Logistic│   │
│  │  admin       │  │  Features   │  │  Ensemble                │   │
│  │  analyst     │  │  Evaluation │  └──────────────────────────┘   │
│  │  viewer      │  │  Reporting  │                                  │
│  └──────────────┘  └─────────────┘                                  │
└──────────┬──────────────────────────────────────┬───────────────────┘
           │ asyncpg (async)                       │ redis-py
           ▼                                       ▼
┌──────────────────────┐              ┌────────────────────────────────┐
│   PostgreSQL 16      │              │   Redis 7                      │
│   sports_intelligence│              │   DB 0 — API cache             │
│   (pgdata volume)    │              │   DB 1 — Celery broker         │
│                      │              │   DB 2 — Celery results        │
└──────────────────────┘              └──────────┬─────────────────────┘
                                                 │
                                    ┌────────────┴──────────────┐
                                    │      Celery Workers        │
                                    │  celery_worker (concurrency│
                                    │  2) + celery_beat          │
                                    │  · Scheduled ingestion     │
                                    │  · Async report generation │
                                    │  · Prediction evaluation   │
                                    └───────────────────────────┘
```

---

## Backend Module Descriptions

| Module | Path | Responsibility |
|---|---|---|
| **API routes** | `app/api/routes/` | FastAPI routers; one file per resource. Thin — delegates to services. |
| **Auth** | `app/auth/` | JWT token creation and validation; `get_current_user` dependency injector. |
| **Core** | `app/core/` | `Settings` (pydantic-settings, reads `.env`), structured logging setup. |
| **DB** | `app/db/` | Async SQLAlchemy engine, session factory, declarative `Base`. |
| **Models** | `app/models/` | SQLAlchemy ORM table definitions (see schema section below). |
| **Schemas** | `app/schemas/` | Pydantic v2 request/response models. |
| **Repositories** | `app/repositories/` | Async data-access functions; no business logic. |
| **Services** | `app/services/` | Business logic; orchestrate repositories. |
| **Ingestion** | `app/ingestion/` | `IngestionService` + sport-specific adapters (`sample_football`, `sample_basketball`). Adapter pattern makes adding new data sources straightforward. |
| **Features** | `app/features/` | `FeatureService` — builds the feature vector for a match: recent form, head-to-head stats, Elo ratings, home advantage, injury factor. |
| **Forecasting** | `app/forecasting/` | `ForecastService` selects the active `ModelVersion` and delegates to the appropriate model implementation. |
| **Forecasting models** | `app/forecasting/models/` | Four implementations: `EloModel`, `PoissonModel`, `LogisticModel`, `EnsembleModel`. All extend `ForecastModel` (abstract base). |
| **Evaluation** | `app/evaluation/` | `EvaluationService` — scores completed predictions: accuracy, Brier score, log-loss. |
| **Backtesting** | `app/backtesting/` | Runs historical simulations over configurable date/league ranges; stores `BacktestRun` + per-match `BacktestResult` rows. |
| **Reporting** | `app/reporting/` | `ReportService` — assembles statistics and renders PDF reports via ReportLab + Matplotlib. |
| **Tasks** | `app/tasks/` | Celery app factory; task definitions for scheduled ingestion, async report generation, and nightly evaluation runs. |
| **Monitoring** | `app/monitoring/` | Health-check helpers surfaced via `/api/health`. |
| **Utils** | `app/utils/` | Shared helpers (date arithmetic, slug generation, etc.). |

---

## Frontend Page Map

| Route | Directory | Description |
|---|---|---|
| `/` | `app/page.tsx` | Root — redirects to dashboard. |
| `/dashboard` | `app/dashboard/` | Overview cards: recent predictions, accuracy trend, upcoming matches. |
| `/matches/[id]` | `app/matches/[id]/` | Match detail: head-to-head, prediction breakdown, odds comparison. |
| `/teams/[id]` | `app/teams/[id]/` | Team profile: roster, recent form, stats history. |
| `/reports` | `app/reports/` | List and download generated PDF reports. |
| `/trackrecord` | `app/trackrecord/` | Full prediction log with outcome evaluation and accuracy metrics. |
| `/search` | `app/search/` | Cross-entity search (teams, leagues, matches). |
| `/admin` | `app/admin/` | User management, model version control, ingestion triggers (admin role only). |
| `/api/*` | Next.js API routes | `app/api/` — thin proxy/helper routes (e.g., auth callbacks). |

**Frontend structure:**

```
src/
├── app/          — Next.js App Router pages and layouts
├── components/   — Shared UI components (cards, tables, charts, nav)
├── hooks/        — Custom React hooks (data fetching, auth state)
├── lib/          — Client utilities (formatters, constants)
├── services/     — Typed API client functions (wrapping fetch)
└── types/        — TypeScript interface definitions mirroring API schemas
```

---

## Database Schema Overview

All tables use UUID primary keys and carry `created_at` / `updated_at` timestamps.

| Table | Key Columns | Relationships |
|---|---|---|
| `sports` | `name`, `slug`, `is_active` | has many `leagues` |
| `leagues` | `sport_id`, `name`, `slug`, `country`, `tier` | belongs to `sport`; has many `teams`, `seasons`, `matches` |
| `seasons` | `league_id`, `name`, `start_date`, `end_date` | belongs to `league` |
| `teams` | `league_id`, `name`, `slug`, `country`, `venue` | belongs to `league`; has many `players`, `team_stats` |
| `players` | `team_id`, `name`, `position`, `is_active` | belongs to `team` |
| `matches` | `league_id`, `season_id`, `home_team_id`, `away_team_id`, `status`, `scheduled_at` | belongs to `league`, `season`, two `teams`; has one `match_result`; has many `predictions`, `odds_history` |
| `match_results` | `match_id`, `home_score`, `away_score`, `winner` | belongs to `match` (1-to-1) |
| `odds_history` | `match_id`, `source`, `market`, `home_odds`, `draw_odds`, `away_odds`, `recorded_at` | belongs to `match` |
| `model_versions` | `name`, `version`, `model_type`, `sport_scope`, `is_active`, `accuracy`, `brier_score` | has many `predictions`, `backtest_runs` |
| `feature_snapshots` | `prediction_id`, `feature_set` (JSONB), `feature_version` | linked to `predictions` |
| `predictions` | `match_id`, `model_version_id`, `home_win_prob`, `draw_prob`, `away_win_prob`, `confidence`, `is_simulation` | belongs to `match`, `model_version`; has one `prediction_explanation`, `prediction_evaluation` |
| `prediction_explanations` | `prediction_id`, `summary`, `top_factors_for/against` (JSONB) | belongs to `prediction` (1-to-1) |
| `prediction_evaluations` | `prediction_id`, `actual_outcome`, `is_correct`, `brier_score`, `log_loss` | belongs to `prediction` (1-to-1) |
| `backtest_runs` | `model_version_id`, `sport_slug`, `start_date`, `end_date`, `accuracy`, `brier_score`, `status` | has many `backtest_results` |
| `backtest_results` | `backtest_run_id`, `match_id`, per-model metrics | belongs to `backtest_run` |
| `report_jobs` | `report_type`, `triggered_by`, `status`, `config` (JSONB) | has many `generated_reports` |
| `generated_reports` | `job_id`, `title`, `file_path`, `report_type` | belongs to `report_job` |
| `users` | `email`, `username`, `hashed_password`, `role`, `is_active` | role: `admin` / `analyst` / `viewer` |
| `audit_logs` | `user_id`, `action`, `resource_type`, `resource_id`, `metadata` (JSONB) | belongs to `user` |
| `standings` | `league_id`, `season_id`, `team_id`, position/points/GD | per-season league table snapshot |
| `team_stats` | `team_id`, `season_id`, rolling statistics | belongs to `team` |
| `injuries` | `player_id`, `team_id`, `severity`, `start_date`, `expected_return` | belongs to `player`, `team` |

**Key relationships:**

```
Sport ──< League ──< Season
                 ──< Team  ──< Player
                         ──< Match ──< MatchResult
                                   ──< OddsHistory
                                   ──< Prediction ──< PredictionExplanation
                                                  ──< PredictionEvaluation
ModelVersion ──< Prediction
             ──< BacktestRun ──< BacktestResult
User ──< ReportJob ──< GeneratedReport
     ──< AuditLog
```

---

## Data Flow

```
1. INGESTION
   IngestionService.run_ingestion(sport)
     └─ SportAdapter (sample_football / sample_basketball)
           └─ Upsert: sports, leagues, seasons, teams, players,
                      matches, match_results, odds_history

2. FEATURE ENGINEERING
   FeatureService.build_features(match_id)
     ├─ Recent form (last N results per team)
     ├─ Head-to-head history
     ├─ Elo ratings (current team ratings)
     ├─ Home / away advantage factor
     └─ Injury adjustment (active injuries per squad)
     → Returns: FeatureVector dict stored in feature_snapshots

3. FORECASTING
   ForecastService.predict(match_id, model_version_id)
     └─ ForecastModel.predict(features)  [Elo | Poisson | Logistic | Ensemble]
           └─ Returns: ForecastResult {home_win_prob, draw_prob, away_win_prob,
                        predicted_scores, confidence, explanation}
     → Writes: predictions + prediction_explanations rows

4. EVALUATION  (triggered after match_result recorded)
   EvaluationService.evaluate(prediction_id)
     ├─ Compares predicted outcome vs actual winner
     ├─ Computes Brier score, log-loss
     └─ Writes: prediction_evaluations row

5. BACKTESTING  (async Celery task)
   BacktestService.run(model_version_id, date_range, league_slug)
     ├─ Iterates historical matches
     ├─ Re-runs steps 2-3 with features available at match time
     ├─ Scores against known results
     └─ Writes: backtest_runs + backtest_results rows

6. REPORTING  (async Celery task)
   ReportService.generate(report_type, config)
     ├─ Aggregates predictions, evaluations, backtest results
     ├─ Renders charts (Matplotlib) and tables
     ├─ Produces PDF (ReportLab)
     └─ Writes: report_jobs, generated_reports; file saved to reports_output_dir
```

---

## Forecasting Pipeline

### Base Interface

All models implement `ForecastModel.predict(features: FeatureVector) -> ForecastResult`.
`ForecastResult` carries: `home_win_prob`, `draw_prob`, `away_win_prob`,
`predicted_home_score`, `predicted_away_score`, `confidence`,
`confidence_interval_low/high`, `explanation`.

### Model Implementations

**EloModel**
Classic Elo rating system (Arpad Elo, 1978). Each team carries a numeric rating;
after every match the winner gains points and the loser loses the same number.
Expected scores follow `E_A = 1 / (1 + 10^((R_B - R_A) / 400))`.
Draws are modelled via a configurable `draw_factor` (default 0.28 for football)
applied symmetrically around the 0.5 expected-score boundary.

**PoissonModel**
Models home and away goal expectations as independent Poisson random variables.
Expected goals are derived from team attack/defence strengths estimated from
recent results, adjusted for home advantage. The full scoreline probability
matrix is computed and summed to yield 1X2 probabilities.

**LogisticModel**
Logistic regression classifier trained on the engineered feature vector.
Uses scikit-learn's `LogisticRegression`; features include Elo ratings, recent
form ratios, H2H win rates, home advantage indicator, and injury impact scores.
Produces calibrated class probabilities for home win / draw / away win.

**EnsembleModel**
Weighted average of any number of `ForecastModel` sub-models. Weights are
configurable in `hyperparameters` on the `ModelVersion` record. Agreement
across sub-models (measured as variance) drives the confidence score: low
variance → high confidence.

### Active Model Selection

`ForecastService` queries `model_versions` for the active record matching the
relevant `sport_scope`. The `model_type` field (`elo`, `poisson`, `logistic`,
`ensemble`) determines which implementation is instantiated.

---

## API Endpoint Summary

All endpoints are prefixed with `/api`.

| Method | Path | Auth Required | Description |
|---|---|---|---|
| GET | `/health` | No | Service health check |
| POST | `/auth/login` | No | Obtain JWT access token |
| POST | `/auth/register` | Admin | Create new user account |
| GET | `/auth/me` | Yes | Current user profile |
| GET | `/sports` | Yes | List all sports |
| GET | `/leagues` | Yes | List leagues (filterable by sport) |
| GET | `/leagues/{id}` | Yes | League detail + current season |
| GET | `/teams` | Yes | List teams (filterable by league) |
| GET | `/teams/{id}` | Yes | Team detail, stats, roster |
| GET | `/matches` | Yes | List matches (filterable by league, date, status) |
| GET | `/matches/{id}` | Yes | Match detail including prediction and odds |
| GET | `/predictions` | Yes | List predictions (filterable by model, date) |
| POST | `/predictions` | Analyst | Generate prediction for a match |
| GET | `/predictions/{id}` | Yes | Prediction detail with explanation |
| GET | `/trackrecord` | Yes | Evaluated prediction history with metrics |
| GET | `/backtests` | Yes | List backtest runs |
| POST | `/backtests` | Analyst | Trigger new backtest run |
| GET | `/backtests/{id}` | Yes | Backtest results detail |
| GET | `/reports` | Yes | List generated reports |
| POST | `/reports` | Analyst | Request new report generation |
| GET | `/reports/{id}/download` | Yes | Download report PDF |
| GET | `/search` | Yes | Full-text search across entities |
| GET | `/admin/users` | Admin | List all users |
| POST | `/admin/users` | Admin | Create user |
| PATCH | `/admin/users/{id}` | Admin | Update user role / active status |
| GET | `/admin/model-versions` | Admin | List model versions |
| POST | `/admin/model-versions` | Admin | Register new model version |
| POST | `/admin/ingest` | Admin | Trigger data ingestion |

---

## Security

### Authentication

JWT-based authentication using `python-jose`. The `/api/auth/login` endpoint
issues a signed access token (configurable expiry, default 60 minutes).
All protected routes require `Authorization: Bearer <token>`.

### Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `viewer` | Read-only access to all data endpoints. |
| `analyst` | Viewer permissions + ability to generate predictions, trigger backtests, and request reports. |
| `admin` | Full access including user management, model version control, ingestion triggers, and audit log access. |

Role enforcement is applied via FastAPI dependencies injected at the route level.
Violations return `HTTP 403 Forbidden`.

### Audit Logging

Sensitive write operations (user creation, role changes, model version updates)
are recorded in the `audit_logs` table with the acting user, action type,
affected resource, and a JSONB metadata payload.

### Passwords

Passwords are hashed with `bcrypt` via `passlib`. Plain-text passwords are
never stored.

---

## Deployment Considerations

- **Secrets** — Replace all `changeme_*` defaults in `.env` before any deployment.
  Use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) in production.
- **HTTPS** — Place a reverse proxy (Nginx or Caddy) in front of both the frontend
  (:3000) and backend (:8000) with TLS termination.
- **Database** — For production use, run PostgreSQL outside Docker with automated
  backups (e.g., pg_dump, RDS automated snapshots). Set `POSTGRES_PASSWORD` to a
  strong random value.
- **Redis** — Enable Redis AUTH (`requirepass`) and bind to localhost or a private
  network; do not expose port 6379 publicly.
- **Celery workers** — Scale `celery_worker` replicas horizontally; adjust
  concurrency (`-c`) based on available CPU. Use `celery_beat` as a single
  instance (leader election not required for simple schedules).
- **Reports volume** — Mount `reports_data` to durable external storage (e.g., S3
  via FUSE, EFS, or a managed NAS) so PDF files survive container restarts.
- **Container images** — Pin base image digests in Dockerfiles for reproducible
  builds. Scan images with `docker scout` or Trivy before deployment.
- **Alembic migrations** — Run `alembic upgrade head` as a pre-start step (init
  container or entrypoint guard) to keep schema in sync with the application.
- **Logging** — The backend uses `structlog` for structured JSON logging. Ship
  logs to a centralised sink (CloudWatch, Loki, Datadog) for production
  observability.
- **Health checks** — `/api/health` is used by Docker Compose. Wire the same
  endpoint into your load balancer or Kubernetes liveness/readiness probes.
