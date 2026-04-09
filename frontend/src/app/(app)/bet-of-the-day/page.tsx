"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Lock,
  ChevronRight,
  Star,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BetOfTheDay {
  available: boolean;
  match_id?: string;
  home_team?: string;
  away_team?: string;
  league?: string;
  scheduled_at?: string;
  home_win_prob?: number;
  draw_prob?: number;
  away_win_prob?: number;
  confidence?: number;
  predicted_outcome?: string;
  explanation_summary?: string;
  prediction_id?: string;
}

// ─── Large Probability Display ──────────────────────────────────────────────

function ProbCircle({
  label,
  prob,
  isHighest,
  color,
}: {
  label: string;
  prob: number;
  isHighest: boolean;
  color: string;
}) {
  const pct = Math.round(prob * 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all ${
          isHighest ? "scale-110" : "opacity-50"
        }`}
        style={{
          borderColor: isHighest ? color : "rgba(255,255,255,0.1)",
          boxShadow: isHighest ? `0 0 30px ${color}40` : "none",
        }}
      >
        <span
          className="text-3xl font-extrabold"
          style={{ color: isHighest ? color : "#475569" }}
        >
          {pct}%
        </span>
      </div>
      <span
        className={`text-sm font-semibold ${isHighest ? "text-white" : "text-slate-500"}`}
      >
        {label}
      </span>
      {isHighest && (
        <span
          className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase"
          style={{ background: `${color}20`, color }}
        >
          <Star className="h-3 w-3" /> Predicted
        </span>
      )}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function BotdSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="h-12 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
      <div className="glass-card p-12">
        <div className="flex flex-col items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-8 w-80 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-48 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function BetOfTheDayPage() {
  const { data, isLoading, isError } = useQuery<BetOfTheDay>({
    queryKey: ["bet-of-the-day"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/bet-of-the-day/`
      );
      if (!res.ok) throw new Error("Failed to fetch BOTD");
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) return <BotdSkeleton />;

  const botd = data;
  const hasData = botd?.available && botd.home_team;

  const homeProb = botd?.home_win_prob ?? 0;
  const drawProb = botd?.draw_prob ?? 0;
  const awayProb = botd?.away_win_prob ?? 0;
  const confidence = botd?.confidence ?? 0;

  const formatTime = (iso?: string) => {
    if (!iso) return "--:--";
    try {
      return new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 shadow-lg shadow-amber-500/10">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
              Pick of the Day
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Our AI&apos;s highest-conviction pick for today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">Premium Feature</span>
        </div>
      </div>

      {/* ── Main Card ── */}
      {!hasData ? (
        <div className="glass-card flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Trophy className="h-12 w-12 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-300">
            No Pick of the Day Yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Our AI hasn&apos;t found a match meeting the minimum confidence threshold (65%)
            for today. Check back as more matches get analysed.
          </p>
        </div>
      ) : (
        <>
          {/* The Pick */}
          <div className="glass-card relative overflow-hidden">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-blue-500/[0.04]" />

            <div className="relative p-8 sm:p-12">
              {/* League + Time */}
              <div className="mb-6 flex items-center justify-center gap-4">
                {botd.league && (
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {botd.league.replace(/-/g, " ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  {formatTime(botd.scheduled_at)}
                </span>
              </div>

              {/* Match Title */}
              <h2 className="mb-8 text-center text-3xl font-extrabold text-white sm:text-4xl">
                {botd.home_team}{" "}
                <span className="text-slate-500 font-normal">vs</span>{" "}
                {botd.away_team}
              </h2>

              {/* Probability Circles */}
              <div className="mb-8 flex items-center justify-center gap-8 sm:gap-16">
                <ProbCircle
                  label={botd.home_team ?? "Home"}
                  prob={homeProb}
                  isHighest={homeProb >= drawProb && homeProb >= awayProb}
                  color="#3b82f6"
                />
                <ProbCircle
                  label="Draw"
                  prob={drawProb}
                  isHighest={drawProb > homeProb && drawProb >= awayProb}
                  color="#f59e0b"
                />
                <ProbCircle
                  label={botd.away_team ?? "Away"}
                  prob={awayProb}
                  isHighest={awayProb > homeProb && awayProb > drawProb}
                  color="#ef4444"
                />
              </div>

              {/* Confidence meter */}
              <div className="mx-auto max-w-sm">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Model Confidence</span>
                  <span
                    className={`text-lg font-extrabold ${
                      confidence >= 0.8
                        ? "text-emerald-400"
                        : confidence >= 0.65
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${confidence * 100}%`,
                      background:
                        confidence >= 0.8
                          ? "#10b981"
                          : confidence >= 0.65
                          ? "#f59e0b"
                          : "#ef4444",
                      boxShadow:
                        confidence >= 0.8
                          ? "0 0 12px rgba(16,185,129,0.5)"
                          : confidence >= 0.65
                          ? "0 0 12px rgba(245,158,11,0.5)"
                          : "0 0 12px rgba(239,68,68,0.5)",
                    }}
                  />
                </div>
              </div>

              {/* Predicted outcome badge */}
              <div className="mt-8 flex justify-center">
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-3">
                  <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    Predicted Outcome
                  </p>
                  <p className="mt-1 text-center text-xl font-extrabold text-emerald-300">
                    {botd.predicted_outcome ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Info Cards ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Value Detection</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                This pick was selected because our ensemble model identified a significant
                edge in the probability vs market odds.
              </p>
            </div>

            <div className="glass-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">4 Models Agree</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Elo, Poisson, Logistic Regression, and our Ensemble model all contribute
                to this prediction for maximum reliability.
              </p>
            </div>

            <div className="glass-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Daily Selection</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Only one pick per day — we choose quality over quantity.
                Minimum 65% confidence required for selection.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Disclaimer ── */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Analytical Disclaimer</p>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              This prediction is generated by machine learning models for analytical and
              educational purposes only. It is{" "}
              <span className="font-semibold text-slate-300">not financial or betting advice</span>.
              Past model accuracy does not guarantee future performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
