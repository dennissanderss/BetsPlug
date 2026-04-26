"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/types/api";

/* ── Types ─────────────────────────────────────────────────── */

/**
 * Public shape of the authenticated user exposed to the rest
 * of the app. We keep this separate from the full `User` type
 * so we can add convenience fields (`name`) derived from the
 * server shape without leaking raw DB rows into components.
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string; // full_name ?? username ?? email local-part
  role: string;
  email_verified: boolean;
  raw: User;
}

interface AuthContextValue {
  /** The currently authenticated user, or null when logged out. */
  user: AuthUser | null;
  /** The JWT (or similar) token used for bearer auth. */
  token: string | null;
  /** Whether the initial hydration from localStorage is complete. */
  ready: boolean;
  /** Persist credentials after a successful login. */
  login: (token: string, user: User) => void;
  /** Clear credentials and redirect to the login page. */
  logout: () => void;
  /**
   * Re-fetch `/auth/me` and update the in-memory user. Used
   * after register/verify flows and after server-side role
   * changes so the UI stays in sync without a full reload.
   */
  refresh: () => Promise<void>;
}

/* ── Storage keys ──────────────────────────────────────────── */

const TOKEN_KEY = "betsplug_token";
const USER_KEY = "betsplug_user";
const TIER_KEY = "betsplug_tier";

/* ── Helpers ───────────────────────────────────────────────── */

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Accept both new shape (User) and the legacy `{email, name}`
    // shape so existing sessions don't get nuked on upgrade. A
    // legacy session will be validated against /auth/me and
    // replaced with the proper server response.
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      return parsed as User;
    }
    return null;
  } catch {
    return null;
  }
}

function toAuthUser(u: User): AuthUser {
  const fallback = u.username || u.email.split("@")[0] || "Member";
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.full_name || fallback,
    role: u.role,
    email_verified: u.email_verified,
    raw: u,
  };
}

/* ── Context ───────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  /**
   * Clear state + storage. We keep this as an internal helper
   * so `logout()` and the `auth:expired` event handler can
   * share the same teardown logic without triggering loops.
   */
  const clearSession = useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(TIER_KEY);
    } catch {
      // Ignore storage failures.
    }
    setToken(null);
    setUser(null);
  }, []);

  /* ── Initial hydration ───────────────────────────────────
     On mount, read any token from storage and call /auth/me
     to validate it. If the server says 401, we clear the
     session and mark ready. If the server returns a user, we
     hydrate from the fresh server response (not the stale
     localStorage copy) so role changes etc. propagate. */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const storedToken = readStoredToken();
      if (!storedToken) {
        // No token → already logged out, render login-aware UI.
        if (!cancelled) setReady(true);
        return;
      }

      // Keep the stored user around while we validate so
      // consumers that render on token presence alone (e.g.
      // navbar skeletons) don't flicker.
      const staleUser = readStoredUser();
      if (staleUser && !cancelled) {
        setToken(storedToken);
        setUser(toAuthUser(staleUser));
      }

      try {
        const fresh = await api.getMe();
        if (cancelled) return;
        setToken(storedToken);
        setUser(toAuthUser(fresh));
        try {
          window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        } catch {
          // Ignore storage failures.
        }
      } catch (err) {
        if (cancelled) return;
        // v6 fix: only clear the session when the server has
        // explicitly told us the token is invalid (401). For any
        // other error (network down, 500, timeout, trackrecord
        // endpoint returning 422, …) we KEEP the stale session so
        // a refresh doesn't log the user out just because a
        // single page crashed. The auth:expired event listener
        // still handles the real "token revoked" case via api.ts.
        if (err instanceof ApiError && err.status === 401) {
          // Storage already cleared by api.ts — just update state.
          setToken(null);
          setUser(null);
        } else {
          // Network / server error — hold on to the stale user so
          // the UI keeps the user logged in. Nothing to do here:
          // token + user stay populated from the staleUser hydration
          // above.
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  /* ── auth:expired event listener ────────────────────────
     api.ts dispatches this whenever any request returns 401.
     We clear the in-memory session, but ONLY redirect to /login
     when the visitor is actually inside an authed area. A 401
     from a background fetch on the homepage / pricing / articles
     used to bounce every visitor to /login indiscriminately —
     that produced the "open the site, get yeeted to login"
     symptom. Public pages now silently clear stale state and
     let the SiteNav render the logged-out CTAs (it reads useAuth
     too) without any navigation surprise. */
  useEffect(() => {
    const onExpired = () => {
      setToken((prev) => {
        if (prev) {
          setUser(null);
          // Strip the locale prefix so the prefix list can stay
          // canonical. e.g. "/pl/dashboard" → "/dashboard".
          const raw = window.location.pathname.replace(
            /^\/(en|nl|de|fr|es|it|sw|id|pt|tr|pl|ro|ru|el|da|sv)(?=\/|$)/,
            "",
          ) || "/";
          // Authed-area path prefixes that DO bounce on session
          // expiry. Anything outside this list is a public page
          // and should not redirect on a stray 401.
          const AUTHED_PREFIXES = [
            "/dashboard",
            "/predictions",
            "/trackrecord",
            "/results",
            "/myaccount",
            "/subscription",
            "/admin",
            "/favorites",
            "/reports",
            "/strategy",
            "/teams",
            "/matches",
            "/live-score",
            "/bet-of-the-day",
            "/weekly-report",
            "/checkout",
          ];
          if (AUTHED_PREFIXES.some((p) => raw.startsWith(p))) {
            router.replace("/login");
          }
        }
        return null;
      });
    };
    window.addEventListener("auth:expired", onExpired);
    return () => {
      window.removeEventListener("auth:expired", onExpired);
    };
  }, [router]);

  const login = useCallback((newToken: string, newUser: User) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, newToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {
      // Ignore storage failures (e.g. private browsing).
    }
    setToken(newToken);
    setUser(toAuthUser(newUser));
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  const refresh = useCallback(async () => {
    const storedToken = readStoredToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
      return;
    }
    try {
      const fresh = await api.getMe();
      setToken(storedToken);
      setUser(toAuthUser(fresh));
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      } catch {
        // Ignore storage failures.
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        setUser(null);
      } else {
        throw err;
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, ready, login, logout, refresh }),
    [user, token, ready, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ──────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
