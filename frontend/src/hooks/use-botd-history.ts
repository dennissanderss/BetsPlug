"use client";

import { useEffect, useState } from "react";

export interface BotdHistoryItem {
  date: string;
  correct: boolean | null;
  confidence: number;
}

/**
 * Fetches the last N BOTD picks and computes a cumulative accuracy
 * series — one data point per pick, oldest first.
 *
 * Returns `null` while loading, then an array of cumulative accuracy
 * percentages (0–100) suitable for a line chart.
 */
export function useBotdHistory(limit = 50): number[] | null {
  const [series, setSeries] = useState<number[] | null>(null);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/history?limit=${limit}`)
      .then((r) => r.json())
      .then((items: unknown) => {
        if (!Array.isArray(items) || items.length === 0) {
          setSeries(null);
          return;
        }

        // API returns newest first → reverse for chronological order
        const sorted = [...items].reverse() as BotdHistoryItem[];

        // Compute cumulative accuracy at each evaluated pick
        let correct = 0;
        let evaluated = 0;
        const points: number[] = [];

        for (const pick of sorted) {
          if (pick.correct === null) continue; // pending — skip
          evaluated += 1;
          if (pick.correct) correct += 1;
          points.push(Math.round((correct / evaluated) * 1000) / 10);
        }

        setSeries(points.length >= 2 ? points : null);
      })
      .catch(() => setSeries(null));
  }, [limit]);

  return series;
}
