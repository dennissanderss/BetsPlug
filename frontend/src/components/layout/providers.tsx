"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { ApiError } from "@/lib/api";

// Retry up to 3 times with exponential backoff (1s, 2s, 4s, max 8s) so a
// transient network blip or Railway cold-start doesn't surface as a hard
// error. We never retry on 4xx EXCEPT 429 — most 4xx are deterministic
// (auth, missing resource, validation) and retrying wastes time, but
// 429 ("Too many requests") is by definition transient and the standard
// recommendation is exponential backoff. Without this exception the
// admin dashboard's burst of concurrent queries surfaces as permanent
// "Failed to fetch" cards if the rate limiter ever trips.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          if (error.status === 429) {
            return failureCount < 3;
          }
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
