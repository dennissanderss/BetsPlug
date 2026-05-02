/**
 * Loader for /track-record content + summary fetch.
 */
import { getContent, type Locale } from "@/lib/i18n";
import type { TrackRecordContent } from "@/content/pages/track-record/types";

interface TrackRecordEntry {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  market: string;
  confidence: number;
  result: "win" | "loss" | "void";
  lockedAt: string;
  matchUrl: string;
}

export interface TrackRecordSummary {
  totalCount: number;
  wins: number;
  losses: number;
  voids: number;
  predictions: TrackRecordEntry[];
  rangeStart: string;
  rangeEnd: string;
  daysOfTracking: number;
  lastAddedAt: string;
}

export async function loadTrackRecordContent(locale: Locale): Promise<TrackRecordContent> {
  return await getContent<TrackRecordContent>("track-record", locale);
}

export async function loadTrackRecordSummary(siteOrigin: URL | undefined): Promise<TrackRecordSummary | null> {
  try {
    const url = new URL("/api/track-record/summary.json", siteOrigin ?? "http://localhost:4321");
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as TrackRecordSummary;
  } catch {
    return null;
  }
}

/** Filter predictions by range. "all" → return as-is. */
export function filterByRange(summary: TrackRecordSummary, range: 30 | 90 | "all"): TrackRecordSummary {
  if (range === "all") return summary;
  const cutoff = new Date(summary.rangeEnd);
  cutoff.setDate(cutoff.getDate() - range);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const filtered = summary.predictions.filter((p) => p.date >= cutoffIso);
  return {
    ...summary,
    predictions: filtered,
    totalCount: filtered.length,
    wins: filtered.filter((p) => p.result === "win").length,
    losses: filtered.filter((p) => p.result === "loss").length,
    voids: filtered.filter((p) => p.result === "void").length,
    rangeStart: cutoffIso,
  };
}
