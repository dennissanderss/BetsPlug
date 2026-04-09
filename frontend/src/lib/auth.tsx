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

/* ── Types ─────────────────────────────────────────────────── */

export interface AuthUser {
  email: string;
  name: string;
}

interface AuthContextValue {
  /** The currently authenticated user, or null when logged out. */
  user: AuthUser | null;
  /** A dummy token string (replace with a real JWT later). */
  token: string | null;
  /** Whether the initial hydration from localStorage is complete. */
  ready: boolean;
  /** Persist credentials after a successful login. */
  login: (token: string, user: AuthUser) => void;
  /** Clear credentials and redirect to the login page. */
  logout: () => void;
}

/* ── Storage keys ──────────────────────────────────────────── */

const TOKEN_KEY = "betsplug_token";
const USER_KEY = "betsplug_user";

/* ── Helpers ───────────────────────────────────────────────── */

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/* ── Context ───────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on first mount (client only).
  useEffect(() => {
    const storedToken = readStoredToken();
    const storedUser = readStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setReady(true);
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, newToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {
      // Ignore storage failures (e.g. private browsing).
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage failures.
    }
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, ready, login, logout }),
    [user, token, ready, login, logout],
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
