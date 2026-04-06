import { useState, useEffect } from "react";

/**
 * Debounces a value, returning a new value only after the specified delay
 * has elapsed since the last change.  Ideal for deferring search queries
 * until the user has stopped typing.
 *
 * @param value - The value to debounce.
 * @param delay - Delay in milliseconds (default: 300 ms).
 * @returns The debounced value.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 400);
 *
 * useEffect(() => {
 *   if (debouncedQuery) fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the pending timeout whenever value or delay changes, and on
    // component unmount, preventing stale updates.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
