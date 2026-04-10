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

    # SMTP (Hostinger)
    smtp_host: str = "smtp.hostinger.com"
    smtp_port: int = 465
    smtp_user: str = ""
    smtp_pass: str = ""
    mail_from_address: str = ""
    mail_from_name: str = "BetsPlug"

    # Abandoned Checkout
    abandoned_checkout_delay_minutes: int = 60   # wait before sending email
    coupon_discount_percent: float = 5.0         # 5% off
    coupon_expiry_days: int = 7                  # coupon valid for 7 days
    recovery_token_expiry_hours: int = 168       # recovery link valid 7 days
    site_url: str = "https://www.betsplug.com"   # used in email links

    # Reports
    reports_output_dir: str = "/app/reports"

    # Email (SMTP) — when smtp_host is empty, email bodies are logged to
    # stdout instead of being sent (dev fallback so tokens can be copied).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "BetsPlug <noreply@betsplug.com>"
    smtp_use_tls: bool = True

    # Admin bootstrap — comma-separated list of emails that are promoted
    # to ``Role.ADMIN`` (and auto-marked email_verified=True) on every boot.
    # Idempotent: missing users are skipped with a warning, existing admins
    # are left untouched. Use this to promote your own account once without
    # needing DB access; clear the env var after the first successful boot
    # if you want. Example:
    #   BOOTSTRAP_ADMIN_EMAILS=dennis@betsplug.com,friend@betsplug.com
    bootstrap_admin_emails: str = ""

    # Optional one-time password reset for the bootstrap admin(s).
    # When set, every user listed in ``BOOTSTRAP_ADMIN_EMAILS`` gets their
    # password rehashed to this value on each boot. **Remove this var
    # immediately after you have successfully logged in** so the plaintext
    # password is no longer sitting in your Railway config.
    bootstrap_admin_password: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
