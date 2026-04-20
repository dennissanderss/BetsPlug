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

    # ── Transactional email (Resend HTTP API) ────────────────────────
    # Replaced Hostinger SMTP on 2026-04-21 after an ~2-week silent
    # outage caused by duplicated Settings fields + env var name
    # mismatches + an implicit dev-mode fallback that returned True
    # without sending anything. Resend is HTTP-only so none of those
    # failure modes are possible anymore.
    #
    # Required Railway env:
    #   RESEND_API_KEY       — from resend.com → API Keys
    #   MAIL_FROM_ADDRESS    — e.g. support@betsplug.com (must be a
    #                          verified Resend domain)
    #   MAIL_FROM_NAME       — e.g. BetsPlug
    # Optional:
    #   EMAIL_DEV_MODE=1     — skip real sends, log to stdout (local
    #                          dev only)
    resend_api_key: str = Field(
        default="",
        validation_alias="RESEND_API_KEY",
    )
    email_from_address: str = Field(
        default="",
        validation_alias="MAIL_FROM_ADDRESS",
    )
    email_from_name: str = Field(
        default="BetsPlug",
        validation_alias="MAIL_FROM_NAME",
    )
    # Explicit opt-in: when true, ``send_email`` logs the message body
    # to stdout and returns True without calling Resend. Production
    # must NEVER set this — missing RESEND_API_KEY on production
    # triggers a LOUD misconfig error instead of a silent pass.
    email_dev_mode: bool = Field(
        default=False,
        validation_alias="EMAIL_DEV_MODE",
    )

    @property
    def email_from(self) -> str:
        """RFC-5322 "Name <address>" formatted From header.

        Falls back to a sane default when MAIL_FROM_ADDRESS is unset so
        Resend never sees an empty From (it would reject the send).
        """
        address = self.email_from_address or "noreply@betsplug.com"
        name = self.email_from_name or "BetsPlug"
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
