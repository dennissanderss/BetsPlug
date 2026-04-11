"use client";

/**
 * Global error boundary (Next.js App Router convention).
 *
 * This component catches any unhandled error thrown by a client
 * component in any route. It renders a simple recoverable error
 * card with a "Try again" button that calls `reset()` to re-mount
 * the failed segment.
 *
 * **Critical**: this boundary does NOT clear auth state or call
 * any logout logic. The auth state lives in a separate context
 * (``lib/auth.tsx``) and persists in localStorage, so as long as
 * we don't touch it here the user stays logged in after a page
 * error + refresh. See docs/v6_bugfix_report.md §A3.
 */

import * as React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to the console for dev inspection. Intentionally no
    // side effects on auth / localStorage / analytics.
    // eslint-disable-next-line no-console
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Er ging iets mis op deze pagina
        </h2>
        <p className="text-sm text-slate-400">
          De pagina kon niet worden geladen. Je blijft ingelogd — probeer het
          opnieuw of ga terug naar de vorige pagina.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs text-red-400 overflow-x-auto p-2 bg-black/40 rounded">
            {error.message}
            {error.digest ? `\n(ref: ${error.digest})` : null}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm py-2 transition-colors"
          >
            Probeer opnieuw
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.history.back();
              }
            }}
            className="flex-1 rounded-lg border border-white/[0.12] text-slate-200 hover:bg-white/[0.04] text-sm py-2 transition-colors"
          >
            Terug
          </button>
        </div>
      </div>
    </div>
  );
}
