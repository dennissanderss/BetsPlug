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
    football_data_api_key: str = ""   # DEPRECATED — disabled 2026-04-14, do not set
    api_football_key: str = ""        # api-football.com (Pro tier, sole data source)
    the_odds_api_key: str = ""        # the-odds-api.com (optional, odds only)

    # ── SMTP (transactional email via Hostinger) ─────────────────────
    # History: this block was duplicated earlier (two `smtp_host` lines,
    # second one winning as empty, which disabled real sends on
    # production). Consolidated to ONE block below.
    #
    # Railway env naming convention is `SMTP_PASS` / `MAIL_FROM_ADDRESS`
    # / `MAIL_FROM_NAME`, which differs from the Python field names we
    # want (`smtp_password`, `smtp_from`). `validation_alias` on each
    # Field tells Pydantic which env var to read, so Railway keeps its
    # intuitive naming and the code keeps clean field names.
    smtp_host: str = Field(
        default="smtp.hostinger.com",
        validation_alias="SMTP_HOST",
    )
    smtp_port: int = Field(default=465, validation_alias="SMTP_PORT")
    smtp_user: str = Field(default="", validation_alias="SMTP_USER")
    # Accepts both SMTP_PASS (Railway's current name) and SMTP_PASSWORD
    # by reading SMTP_PASS as the canonical alias. Users migrating from
    # either name can continue without touching env config.
    smtp_password: str = Field(
        default="",
        validation_alias="SMTP_PASS",
    )
    smtp_from_address: str = Field(
        default="",
        validation_alias="MAIL_FROM_ADDRESS",
    )
    smtp_from_name: str = Field(
        default="BetsPlug",
        validation_alias="MAIL_FROM_NAME",
    )
    smtp_use_tls: bool = True
    # Explicit opt-in: when true, ``send_email`` logs the message to
    # stdout and returns True without attempting SMTP. The old code
    # tripped into this branch automatically whenever SMTP_HOST was
    # empty, which hid production misconfig (empty password → silent
    # failure was indistinguishable from "dev mode intentional").
    # Now you must *explicitly* set EMAIL_DEV_MODE=1 for local dev;
    # production with a broken SMTP config will log a loud error and
    # return False instead of pretending success.
    email_dev_mode: bool = Field(
        default=False,
        validation_alias="EMAIL_DEV_MODE",
    )

    @property
    def smtp_from(self) -> str:
        """RFC-5322 "Name <address>" formatted From header.

        Falls back to a sane default when MAIL_FROM_ADDRESS is unset so
        the header never ends up empty (which some SMTP servers reject).
        """
        address = self.smtp_from_address or "noreply@betsplug.com"
        name = self.smtp_from_name or "BetsPlug"
        return f"{name} <{address}>"

    # Abandoned Checkout
    abandoned_checkout_delay_minutes: int = 60   # wait before sending email
    coupon_discount_percent: float = 5.0         # 5% off
    coupon_expiry_days: int = 1                  # coupon valid for 24 hours
    recovery_token_expiry_hours: int = 24        # recovery link valid 24 hours
    site_url: str = "https://www.betsplug.com"   # used in email links

    # Reports
    reports_output_dir: str = "/app/reports"

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

    # ── Telegram auto-poster ─────────────────────────────────────────
    # Token comes from @BotFather; set in Railway only — never commit.
    # When empty the telegram_service logs messages at INFO level
    # instead of calling the Bot API (dev fallback).
    telegram_bot_token: str = Field(
        default="", validation_alias="TELEGRAM_BOT_TOKEN"
    )
    telegram_channel_free: str = Field(
        default="@BetsPlug", validation_alias="TELEGRAM_CHANNEL_FREE"
    )
    # Optional separate dev/test channel so staging never pollutes the
    # public @BetsPlug feed. When set, dev tasks use this instead of
    # `telegram_channel_free`.
    telegram_channel_test: str = Field(
        default="", validation_alias="TELEGRAM_CHANNEL_TEST"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
