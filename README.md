# Sports Intelligence Platform

> **Disclaimer:** All outputs produced by this platform are simulated and hypothetical.
> Nothing in this software constitutes financial, betting, or investment advice.
> This project is built strictly for educational and research purposes.

A full-stack sports analytics platform that ingests match data, engineers features,
runs probabilistic forecasts (Elo, Poisson, Logistic Regression, Ensemble), tracks
model accuracy over time, and publishes structured reports — all in a reproducible,
containerised environment.

---

## Architecture Overview

| Layer | Technology |
|---|---|
| API | FastAPI 0.115, Python 3.12, Uvicorn |
| Task queue | Celery 5.4 + Redis 7 (broker & result backend) |
| Database | PostgreSQL 16 (async via asyncpg, migrations via Alembic) |
| ML / Analytics | scikit-learn 1.6, XGBoost 2.1, NumPy, SciPy, pandas |
| PDF reports | ReportLab + Matplotlib |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Container | Docker + Docker Compose |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a detailed technical breakdown.

---

## Features

- **Multi-sport support** — Football and Basketball out of the box; extensible adapter pattern for additional sports.
- **Forecasting pipeline** — Four interchangeable models (Elo, Poisson, Logistic, Ensemble) with per-match probability outputs and confidence intervals.
- **Feature engineering** — Recent form windows, head-to-head history, home/away advantage, injury adjustments, and Elo ratings.
- **Backtesting** — Run historical simulations against any date range and league; results are scored with accuracy, Brier score, log-loss, and calibration error.
- **Track record** — Persistent, immutable prediction log with automated post-match evaluation.
- **Reports** — Weekly and monthly PDF reports generated asynchronously via Celery and stored for download.
- **Role-based access** — Three roles: `admin`, `analyst`, `viewer` secured with JWT authentication.
- **Admin panel** — User management, model version control, and data ingestion triggers.
- **Search** — Cross-entity search across teams, leagues, and matches.
- **Interactive dashboard** — Next.js frontend with live API calls, charts, and prediction explorer.

---

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Docker | 24+ |
| Docker Compose | v2.20+ |
| Node.js (local dev only) | 20+ |
| Python (local dev only) | 3.12+ |

---

## Quick Start (Docker Compose)

```bash
# 1. Copy the environment file
cp .env.example .env

# 2. Build and start all services (db, redis, backend, workers, frontend)
docker-compose up --build
```

Once running:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| API docs (ReDoc) | http://localhost:8000/redoc |

---

## Development Setup

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Seed sample data (football + basketball leagues, teams, matches, predictions)
python -m seed.seed_data

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend development server runs at http://localhost:3000 and proxies API
requests to `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api`).

---

## Seeding the Database

Sample data includes two sports, four leagues, rosters of teams, historical
matches with results, simulated predictions and evaluations, and example
backtest runs.

```bash
# From the backend directory (or inside the running container)
python -m seed.seed_data
```

To run inside a running Docker container:

```bash
docker-compose exec backend python -m seed.seed_data
```

---

## API Documentation

Interactive Swagger UI is available at **http://localhost:8000/docs** when the
backend is running. ReDoc is available at **http://localhost:8000/redoc**.

All endpoints are prefixed with `/api`. The full endpoint list is documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Project Structure

```
Sportbetting/
├── backend/
│   ├── app/
│   │   ├── api/routes/         # FastAPI routers (one file per resource)
│   │   ├── auth/               # JWT dependency injection
│   │   ├── backtesting/        # Backtest orchestration service
│   │   ├── core/               # Settings (pydantic-settings), logging
│   │   ├── db/                 # SQLAlchemy session, base declarative
│   │   ├── evaluation/         # Post-match prediction scoring
│   │   ├── features/           # Feature engineering service
│   │   ├── forecasting/        # Forecast service + model implementations
│   │   │   └── models/         # elo_model, poisson_model, logistic_model, ensemble_model
│   │   ├── ingestion/          # Data ingestion service + sport adapters
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── monitoring/         # Health & metrics
│   │   ├── reporting/          # PDF report generation
│   │   ├── repositories/       # Data access layer (async SQLAlchemy queries)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic services
│   │   ├── tasks/              # Celery task definitions & app factory
│   │   ├── utils/              # Shared utilities
│   │   └── main.py             # FastAPI app factory
│   ├── alembic/                # Database migration scripts
│   ├── seed/                   # Sample data seeder
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── dashboard/
│   │   │   ├── matches/[id]/
│   │   │   ├── teams/[id]/
│   │   │   ├── reports/
│   │   │   ├── trackrecord/
│   │   │   ├── search/
│   │   │   └── admin/
│   │   ├── components/         # Reusable React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility libraries
│   │   ├── services/           # API client functions
│   │   └── types/              # TypeScript type definitions
│   ├── public/
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── docker/                     # Additional Docker assets
├── docs/
│   └── ARCHITECTURE.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Running Tests

```bash
# From the backend directory
pytest

# With coverage
pytest --cov=app

# Integration tests only (requires a running database)
pytest tests/integration/
```

---

## Environment Variables

All variables are read from `.env` at the project root (or injected via the
environment). Copy `.env.example` to `.env` to get started.

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `db` | PostgreSQL hostname |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `sports_intelligence` | Database name |
| `POSTGRES_USER` | `sip_user` | Database user |
| `POSTGRES_PASSWORD` | `changeme_in_production` | Database password — **change this** |
| `SECRET_KEY` | `changeme-generate-a-real-secret-key` | JWT signing key — **change this** |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT expiry (minutes) |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_DB` | `0` | Redis DB index for general cache |
| `CELERY_BROKER_URL` | `redis://redis:6379/1` | Celery broker |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/2` | Celery result backend |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Frontend API base URL |
| `REPORTS_OUTPUT_DIR` | `/app/reports` | Path for generated PDF reports |
| `LOG_LEVEL` | `INFO` | Application log level |
| `DEBUG` | `false` | Enable debug mode |

---

## Roadmap / Improvement Areas

- **Live data ingestion** — integrate a real sports data provider (e.g., API-Football, SportMonks) to replace the sample adapters.
- **Advanced ML models** — gradient-boosted trees (XGBoost/LightGBM) trained on richer feature sets; neural network options.
- **Calibration** — Platt scaling and isotonic regression post-processing for better probability calibration.
- **Real-time updates** — WebSocket or SSE push for live match state and prediction updates.
- **Multi-tenancy** — workspace-level data isolation for hosting multiple independent research groups.
- **Observability** — Prometheus metrics endpoint, Grafana dashboards, structured log shipping.
- **CI/CD pipeline** — GitHub Actions workflow for lint, test, and container build on every push.
- **Model explainability** — SHAP value integration surfaced in the frontend prediction detail view.

---

## License

This project is provided for educational and research use. See `LICENSE` for details.
