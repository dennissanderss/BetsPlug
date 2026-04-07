"""add subscriptions and payments tables

Revision ID: a1b2c3d4e5f6
Revises: 239b393c2b2b
Create Date: 2026-04-07 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '239b393c2b2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Subscription plans enum
    plan_type = sa.Enum('basic', 'standard', 'premium', 'lifetime', name='plantype')
    subscription_status = sa.Enum('active', 'cancelled', 'expired', 'past_due', 'trialing', name='subscriptionstatus')
    payment_status = sa.Enum('pending', 'succeeded', 'failed', 'refunded', name='paymentstatus')

    op.create_table('subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('plan_type', plan_type, nullable=False),
        sa.Column('status', subscription_status, nullable=False, server_default='trialing'),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True, unique=True),
        sa.Column('stripe_price_id', sa.String(255), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_lifetime', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table('payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('stripe_payment_intent_id', sa.String(255), nullable=True, unique=True),
        sa.Column('stripe_checkout_session_id', sa.String(255), nullable=True),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='eur'),
        sa.Column('status', payment_status, nullable=False, server_default='pending'),
        sa.Column('plan_type', plan_type, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('subscriptions')
    sa.Enum(name='plantype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='subscriptionstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='paymentstatus').drop(op.get_bind(), checkfirst=True)
