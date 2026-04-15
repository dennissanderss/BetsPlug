"use client";

import { useEffect, useState } from "react";

export interface BotdTrackRecord {
  /** 0–100, integer or one-decimal from the API. */
  accuracy_pct: number;
  /** Total picks recorded (including pending / not-yet-evaluated). */
  total_picks: number;
  /** Correct evaluated picks. */
  correct: number;
  /** Picks with a final outcome. */
  evaluated: number;
}

/**
 * Public Pick-of-the-Day track-record summary.
 *
 * Canonical hook for unauthenticated marketing surfaces — the homepage
 * hero chips, the top-bar banner, and the how-it-works hero stats all
 * read from here. Consolidates three previously-duplicated inline
 * fetchers so the "live numbers" shown across the public site stay in
 * sync and come from a single HTTP call.
 *
 * Returns `null` until the fetch resolves; consumers should render
 * a dash or loading state in that window, or fall back to a default.
 *
 * The authed-dashboard equivalent lives in
 * `src/app/(app)/bet-of-the-day/page.tsx` (TanStack Query + auth
 * token) — intentionally not consolidated with this one.
 */
export function useBotdTrackRecord(): BotdTrackRecord | null {
  const [data, setData] = useState<BotdTrackRecord | null>(null);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/track-record`)
      .then((r) => r.json())
      .then((d: unknown) => {
        const record = d as Partial<BotdTrackRecord> | null;
        if (record && typeof record.accuracy_pct === "number") {
          setData({
            accuracy_pct: record.accuracy_pct,
            total_picks: record.total_picks ?? 0,
            correct: record.correct ?? 0,
            evaluated: record.evaluated ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  return data;
}
