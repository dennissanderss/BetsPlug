from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import get_settings

# We used to delegate to passlib's ``CryptContext`` here, but passlib 1.7.4
# has been unmaintained since 2020 and its ``detect_wrap_bug`` boot-time
# self-test crashes on bcrypt >= 4.1 with
# ``ValueError: password cannot be longer than 72 bytes``. Every password
# hash / verify call from a worker would then bring the whole auth flow
# down. Using ``bcrypt`` directly is simpler, one external dep less, and
# fully compatible with the existing ``$2b$...`` hashes in the users table.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# bcrypt refuses passwords longer than 72 bytes with a ValueError. We
# truncate at the UTF-8 byte boundary (not the character boundary) to stay
# safe with multi-byte characters and to be bit-identical across Python
# versions.
_BCRYPT_MAX_BYTES = 72


def _to_bcrypt_bytes(password: str) -> bytes:
    """Encode a password to bytes, truncated to bcrypt's 72-byte limit."""
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Return a bcrypt hash of ``password`` as a plain ASCII string."""
    hashed = bcrypt.hashpw(_to_bcrypt_bytes(password), bcrypt.gensalt())
    return hashed.decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify ``plain`` against a previously hashed password.

    Accepts the ``$2a$``, ``$2b$`` and ``$2y$`` bcrypt variants produced
    by both the old passlib pipeline and the new direct-bcrypt path, so
    existing users keep working after the migration.
    """
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(_to_bcrypt_bytes(plain), hashed.encode("ascii"))
    except (ValueError, TypeError):
        # Malformed hash, non-ASCII encoding, etc. Treat as a failed
        # verification rather than crashing the endpoint.
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
