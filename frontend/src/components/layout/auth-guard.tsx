"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocalizedHref } from "@/i18n/locale-provider";

/**
 * Client-side auth guard for the (app) route group.
 *
 * Anyone who navigates to a route under (app) without a valid
 * session is redirected to /register with ?next=<original-path>
 * so the form can send them back after signup.
 *
 * `useSearchParams` is only legal during static prerender inside a
 * Suspense boundary — so the inner guard (which reads it) is wrapped
 * here. Without this, `next build` bails out with
 * "useSearchParams() should be wrapped in a suspense boundary" for
 * every page under (app).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthPending />}>
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
}

function AuthGuardInner({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loc = useLocalizedHref();

  useEffect(() => {
    if (!ready) return;
    if (user) return;
    const next = (() => {
      const qs = searchParams?.toString();
      return qs ? `${pathname}?${qs}` : pathname || "/dashboard";
    })();
    router.replace(`${loc("/register")}?next=${encodeURIComponent(next)}`);
  }, [ready, user, router, pathname, searchParams, loc]);

  if (!ready || !user) {
    return <AuthPending />;
  }

  return <>{children}</>;
}

function AuthPending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        <span>Één ogenblik…</span>
      </div>
    </div>
  );
}
