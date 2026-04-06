"""FastAPI shared dependencies.

Re-exports the most commonly used dependencies so that route modules can
import from a single, stable location::

    from app.api.deps import get_db, get_current_user

This module is a thin re-export layer; the actual implementations live in
their canonical home:
  - ``get_db``           → app.db.session
  - ``get_current_user`` → app.auth.dependencies
"""

from app.db.session import get_db
from app.auth.dependencies import (
    get_current_user,
    get_active_user,
    require_admin,
    require_analyst,
    require_role,
)

__all__ = [
    "get_db",
    "get_current_user",
    "get_active_user",
    "require_admin",
    "require_analyst",
    "require_role",
]
