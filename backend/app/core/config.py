from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "BetsPlug"
    app_version: str = "2.0.0"
    debug: bool = False
    log_level: str = "INFO"

    # Database - supports both Railway (DATABASE_URL) and Docker (individual vars)
    database_url_env: str = Field(default="", validation_alias="DATABASE_URL")  # Railway/Supabase
    postgres_host: str = "db"
    postgres_port: int = 5432
    postgres_db: str = "sports_intelligence"
    postgres_user: str = "sip_user"
    postgres_password: str = "changeme_in_production"

    @property
    def database_url(self) -> str:
        if self.database_url_env:
            url = self.database_url_env
            # Convert postgresql:// to postgresql+asyncpg://
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        if self.database_url_env:
            url = self.database_url_env
            # Convert to psycopg2 format
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+psycopg2://", 1)
            if "asyncpg" in url:
                return url.replace("asyncpg", "psycopg2")
            return url
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # Redis - supports Railway (REDIS_URL or REDIS_PRIVATE_URL) and Docker
    redis_url_env: str = Field(default="", validation_alias="REDIS_URL")  # Railway
    redis_private_url: str = Field(default="", validation_alias="REDIS_PRIVATE_URL")
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0

    @property
    def redis_url(self) -> str:
        if self.redis_url_env:
            return self.redis_url_env
        if self.redis_private_url:
            return self.redis_private_url
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    # Auth
    secret_key: str = "changeme-generate-a-real-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    frontend_url: str = ""  # Used by Railway for CORS; appended to cors_origins
    cors_origins: str = "http://localhost:3000"

    # Celery
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    # Stripe (free to set up — only pay per transaction: 1.5% + €0.25 EU)
    #
    # Prices are NOT configured here anymore — they're resolved at runtime
    # via Stripe lookup keys (set per Price in Stripe Dashboard). This means
    # price changes are a 2-click operation in Stripe with no redeploy.
    # See backend/app/api/routes/subscriptions.py → PLAN_LOOKUP_KEYS for the
    # full list of keys this app expects to find in your Stripe account.
    stripe_secret_key: str = "sk_test_placeholder"
    stripe_webhook_secret: str = ""

    # Sports Data APIs
    football_data_api_key: str = ""   # football-data.org (free, 10 req/min)
    api_football_key: str = ""        # api-football.com (free, 100 req/day)
    the_odds_api_key: str = ""        # the-odds-api.com (free, 500 req/month)

    # Reports
    reports_output_dir: str = "/app/reports"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
