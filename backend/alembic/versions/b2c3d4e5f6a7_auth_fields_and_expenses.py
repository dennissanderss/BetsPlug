"""add auth verification/reset fields and manual_expenses table

Adds email verification + password reset + last_login tracking columns to
the users table (existing rows are grandfathered with ``email_verified =
True`` so the admin account doesn't lock itself out), and creates the
``manual_expenses`` table used by the admin finance dashboard.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-10 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users: auth / verification fields ────────────────────────────────

    # email_verified — default false, but we flip every pre-existing row to
    # True below so the admin account isn't locked out on deploy.
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(length=128), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "email_verification_sent_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column("reset_password_token", sa.String(length=128), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "reset_password_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Grandfather existing users — mark them verified so deployment doesn't
    # lock anyone out. New users (inserted after this migration runs) start
    # with email_verified = false from the server_default.
    op.execute("UPDATE users SET email_verified = TRUE")

    # Indexes on token columns for O(log n) lookup during verify / reset.
    op.create_index(
        op.f("ix_users_email_verification_token"),
        "users",
        ["email_verification_token"],
        unique=False,
    )
    op.create_index(
        op.f("ix_users_reset_password_token"),
        "users",
        ["reset_password_token"],
        unique=False,
    )

    # ── manual_expenses table ────────────────────────────────────────────

    op.create_table(
        "manual_expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="eur"),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "category",
            sa.String(length=50),
            nullable=False,
            server_default="other",
        ),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        op.f("ix_manual_expenses_category"),
        "manual_expenses",
        ["category"],
        unique=False,
    )
    op.create_index(
        op.f("ix_manual_expenses_expense_date"),
        "manual_expenses",
        ["expense_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_manual_expenses_expense_date"), table_name="manual_expenses"
    )
    op.drop_index(op.f("ix_manual_expenses_category"), table_name="manual_expenses")
    op.drop_table("manual_expenses")

    op.drop_index(op.f("ix_users_reset_password_token"), table_name="users")
    op.drop_index(op.f("ix_users_email_verification_token"), table_name="users")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "reset_password_expires_at")
    op.drop_column("users", "reset_password_token")
    op.drop_column("users", "email_verification_sent_at")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "email_verified")
