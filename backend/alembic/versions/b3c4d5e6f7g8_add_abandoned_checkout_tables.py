"""add abandoned_checkouts and coupons tables

Revision ID: b3c4d5e6f7g8
Revises: a1b2c3d4e5f6
Create Date: 2026-04-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7g8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    checkout_status = sa.Enum('started', 'completed', 'abandoned', name='checkoutstatus')
    coupon_status = sa.Enum('active', 'redeemed', 'expired', name='couponstatus')

    # abandoned_checkouts table
    op.create_table(
        'abandoned_checkouts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        # Contact info
        sa.Column('email', sa.String(320), nullable=False, index=True),
        sa.Column('first_name', sa.String(100), nullable=True),
        # Plan selection
        sa.Column('plan_id', sa.String(50), nullable=False),
        sa.Column('billing_cycle', sa.String(20), nullable=False),
        sa.Column('with_trial', sa.Boolean(), nullable=False, server_default='true'),
        # Session lifecycle
        sa.Column('status', checkout_status, nullable=False, server_default='started'),
        sa.Column('checkout_started_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        # Recovery
        sa.Column('recovery_token', sa.String(64), unique=True, nullable=False),
        # Email tracking
        sa.Column('abandoned_email_sent_at', sa.DateTime(timezone=True), nullable=True),
        # Linked coupon
        sa.Column('coupon_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('coupon_code', sa.String(20), nullable=True),
        # Progress tracking
        sa.Column('last_step', sa.Integer(), nullable=False, server_default='1'),
        # Locale
        sa.Column('locale', sa.String(5), nullable=True),
        # Timestamps (from TimestampMixin)
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # coupons table
    op.create_table(
        'coupons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(20), unique=True, nullable=False),
        sa.Column('discount_percent', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('status', coupon_status, nullable=False, server_default='active'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('max_uses', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('times_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column(
            'checkout_session_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('abandoned_checkouts.id'),
            nullable=True,
        ),
        # Timestamps (from TimestampMixin)
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Additional indexes for common queries
    op.create_index(
        'ix_abandoned_checkouts_status_email_sent',
        'abandoned_checkouts',
        ['status', 'abandoned_email_sent_at'],
        postgresql_where=sa.text("status = 'started' AND abandoned_email_sent_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index('ix_abandoned_checkouts_status_email_sent', table_name='abandoned_checkouts')
    op.drop_table('coupons')
    op.drop_table('abandoned_checkouts')
    sa.Enum(name='checkoutstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='couponstatus').drop(op.get_bind(), checkfirst=True)
