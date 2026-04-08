from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "BetsPlug"
    app_version: str = "2.0.0"
    debug: bool = False
    log_level: str = "INFO"

    # Database - supports both Docker (individual vars) and production (full URL)
    database_url_override: str = ""  # Set DATABASE_URL for production (Supabase etc.)
    postgres_host: str = "db"
    postgres_port: int = 5432
    postgres_db: str = "sports_intelligence"
    postgres_user: str = "sip_user"
    postgres_password: str = "changeme_in_production"

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            url = self.database_url_override
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
        if self.database_url_override:
            url = self.database_url_override
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

    # Redis
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    # Auth
    secret_key: str = "changeme-generate-a-real-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Celery
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    # Stripe (free to set up — only pay per transaction: 1.5% + €0.25 EU)
    stripe_secret_key: str = "sk_test_placeholder"
    stripe_webhook_secret: str = ""
    stripe_price_basic: str = ""      # Create in Stripe Dashboard: €15.99/month recurring
    stripe_price_standard: str = ""   # Create in Stripe Dashboard: €35.97 every 3 months recurring
    stripe_price_premium: str = ""    # Create in Stripe Dashboard: €56.94 every 6 months recurring
    stripe_price_lifetime: str = ""   # Create in Stripe Dashboard: €199.99 one-time

    # Football Data API
    football_data_api_key: str = ""

    # Reports
    reports_output_dir: str = "/app/reports"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
