"""Celery tasks for email processing.

Currently contains:
- ``task_process_abandoned_checkouts``: Finds abandoned checkouts and
  sends a single reminder email with a 5% coupon code.

Scheduled via Celery Beat (every 30 minutes).
"""

from __future__ import annotations

import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.email_tasks.task_process_abandoned_checkouts",
    bind=True,
    max_retries=2,
    default_retry_delay=300,  # 5 min between retries
    queue="emails",
)
def task_process_abandoned_checkouts(self) -> dict:
    """Find and email abandoned checkouts.

    This task is idempotent:
    - Only processes sessions where ``abandoned_email_sent_at IS NULL``
    - Sets ``abandoned_email_sent_at`` atomically with the DB commit
    - On email failure, the session stays in STARTED so the next run
      retries it
    """
    logger.info("Starting abandoned checkout email processing")
    try:
        from app.services.abandoned_checkout_service import (
            process_abandoned_checkouts_sync,
        )
        stats = process_abandoned_checkouts_sync()
        logger.info("Abandoned checkout processing result: %s", stats)
        return {"status": "success", **stats}

    except Exception as exc:
        logger.error("Abandoned checkout task failed: %s", exc)
        raise self.retry(exc=exc)
