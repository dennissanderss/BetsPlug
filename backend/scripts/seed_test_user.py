"""Seed or reset a test user for email-flow verification.

Usage (from the backend directory, with Railway env loaded):

    railway run python scripts/seed_test_user.py \
        --email betsplug50@gmail.com \
        --password '<wegwerp-wachtwoord>' \
        --username betsplug50

Behaviour
---------
- If no user with that email exists: create one (role=VIEWER, active,
  email_verified=True so forgot-password + re-verify flows both work).
- If a user already exists: update the hashed_password so you can
  re-login with the supplied password. Role/role/active flags are
  left untouched.

Why this exists
---------------
The /register → verify-email path requires a trial checkout, which
isn't useful when we only want a user row in the DB to test the
transactional email pipeline (forgot-password, verify, welcome,
receipt). This script bypasses registration and drops the user in
directly.

Safe to run on production. Idempotent: running it twice with the
same args leaves the user in the same state.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import Role, User
from app.core.security import hash_password


async def seed(email: str, password: str, username: str | None, role: str) -> None:
    """Idempotently create or update a user row."""
    role_enum = Role(role.lower())

    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()

        if existing is not None:
            existing.hashed_password = hash_password(password)
            existing.email_verified = True
            existing.is_active = True
            action = "UPDATED"
            user = existing
        else:
            if not username:
                username = email.split("@")[0]
            # If the derived username collides with another row, suffix
            # until we find a free slot. Keeps the script idempotent
            # even when re-run with a different email.
            base = username
            i = 1
            while (
                await session.execute(
                    select(User).where(User.username == username)
                )
            ).scalar_one_or_none() is not None:
                username = f"{base}{i}"
                i += 1

            user = User(
                email=email,
                username=username,
                hashed_password=hash_password(password),
                role=role_enum,
                is_active=True,
                email_verified=True,
            )
            session.add(user)
            action = "CREATED"

        await session.commit()
        await session.refresh(user)

    print(f"[SEED_TEST_USER] {action} user id={user.id} email={user.email} "
          f"username={user.username} role={user.role.value} "
          f"email_verified={user.email_verified}")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--username", default=None,
                   help="Defaults to the local-part of the email.")
    p.add_argument("--role", default="viewer",
                   choices=[r.value for r in Role])
    args = p.parse_args()

    asyncio.run(seed(args.email, args.password, args.username, args.role))
    return 0


if __name__ == "__main__":
    sys.exit(main())
