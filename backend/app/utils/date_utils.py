"""Timezone-aware date utilities for the Sports Intelligence Platform.

All public functions operate in UTC.  Naive datetimes passed in are assumed to
be UTC and are made aware before any conversion.

Public API
----------
    now_utc()                              -> datetime
    to_utc(dt)                             -> datetime
    format_iso(dt)                         -> str
    parse_date_range(start_str, end_str)   -> tuple[datetime, datetime]
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_UTC = timezone.utc


def _ensure_aware(dt: datetime) -> datetime:
    """Return *dt* with UTC tzinfo attached if it is naive."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=_UTC)
    return dt


# ---------------------------------------------------------------------------
# Public utilities
# ---------------------------------------------------------------------------


def now_utc() -> datetime:
    """Return the current moment as a timezone-aware UTC datetime.

    Example
    -------
    >>> ts = now_utc()
    >>> ts.tzinfo == timezone.utc
    True
    """
    return datetime.now(_UTC)


def to_utc(dt: datetime) -> datetime:
    """Convert *dt* to UTC, preserving the instant in time.

    Parameters
    ----------
    dt:
        Any :class:`~datetime.datetime`.  Naive datetimes are assumed to
        already be in UTC (i.e. no offset is applied, only tzinfo is added).

    Returns
    -------
    datetime
        Timezone-aware datetime expressed in UTC.

    Example
    -------
    >>> from datetime import timezone, timedelta
    >>> eastern = timezone(timedelta(hours=-5))
    >>> local = datetime(2024, 6, 1, 12, 0, tzinfo=eastern)
    >>> to_utc(local).hour
    17
    """
    aware = _ensure_aware(dt)
    return aware.astimezone(_UTC)


def format_iso(dt: datetime) -> str:
    """Format *dt* as an ISO-8601 string with UTC offset (``+00:00``).

    Parameters
    ----------
    dt:
        Any :class:`~datetime.datetime`.  Naive datetimes are treated as UTC.

    Returns
    -------
    str
        ISO-8601 string, e.g. ``"2024-06-01T12:00:00+00:00"``.

    Example
    -------
    >>> format_iso(datetime(2024, 6, 1, 12, 0, tzinfo=timezone.utc))
    '2024-06-01T12:00:00+00:00'
    """
    return to_utc(dt).isoformat()


def parse_date_range(
    start_str: str,
    end_str: Optional[str] = None,
) -> tuple[datetime, datetime]:
    """Parse a date range from ISO-8601 strings and return UTC datetimes.

    Parameters
    ----------
    start_str:
        Start of the range.  Accepts full ISO-8601 datetimes
        (``"2024-06-01T00:00:00Z"``) or plain dates (``"2024-06-01"``).
        Plain dates are interpreted as midnight UTC on that day.
    end_str:
        End of the range (inclusive intent; callers choose how to apply it).
        When omitted or ``None``, defaults to the end of the day specified by
        *start_str* (i.e. ``start + 23h 59m 59s``).

    Returns
    -------
    tuple[datetime, datetime]
        ``(start_utc, end_utc)`` – both timezone-aware in UTC.

    Raises
    ------
    ValueError
        If either string cannot be parsed or if *start* is later than *end*.

    Examples
    --------
    >>> start, end = parse_date_range("2024-06-01", "2024-06-30")
    >>> start.date().isoformat()
    '2024-06-01'
    >>> end.date().isoformat()
    '2024-06-30'
    """
    start_utc = _parse_single(start_str, "start_str")

    if end_str is None:
        # Default: remainder of the same calendar day in UTC
        end_utc = start_utc.replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
    else:
        end_utc = _parse_single(end_str, "end_str")

    if start_utc > end_utc:
        raise ValueError(
            f"start ({start_utc.isoformat()}) must not be later than "
            f"end ({end_utc.isoformat()})"
        )

    return start_utc, end_utc


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _parse_single(value: str, param_name: str) -> datetime:
    """Parse a single date/datetime string into a UTC-aware datetime."""
    value = value.strip()

    # Try full ISO-8601 datetime first (handles 'Z' suffix via fromisoformat
    # on Python 3.11+ and manually for older versions).
    if "T" in value or " " in value:
        # Normalise 'Z' -> '+00:00' for Python < 3.11 compatibility
        normalised = value.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(normalised)
            return to_utc(dt)
        except ValueError:
            pass

    # Try plain date  (YYYY-MM-DD)
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(value, fmt)
            return dt.replace(tzinfo=_UTC)
        except ValueError:
            continue

    raise ValueError(
        f"Cannot parse {param_name!r} = {value!r}. "
        "Expected ISO-8601 datetime or YYYY-MM-DD date string."
    )
