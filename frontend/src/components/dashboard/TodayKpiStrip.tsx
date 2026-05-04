"use client";

import Link from "next/link";
import { Calendar, Sparkles, Activity, Clock, ArrowRight } from "lucide-react";
import { useLocalizedHref } from "@/i18n/locale-provider";
import type { Tier } from "@/hooks/use-tier";

interface TodayKpiStripProps {
  tier: Tier | null;
  todayPickCount: number | null;
  liveCount: number;
  weekHitRate: number | null;
}

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_ACCENT: Record<string, string> = {
  free: "text-[#e8a864]",
  silver: "text-[#d7d9dc]",
  gold: "text-[#f5d67a]",
  platinum: "text-[#d9f0ff]",
};

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface Cell {
  label: string;
  value: string;
  icon: typeof Calendar;
  accent: string;
  /** When set, cell renders as a Link to this href with hover-arrow. */
  href?: string;
  /** Tooltip / hint shown on hover ("Open today's picks", etc.). */
  hoverHint?: string;
}

/**
 * Editorial-style stat strip across the top of the dashboard.
 * Replaces the "Good morning" greeting hero — denser, content-led,
 * no AI-template warmth. Four cells separated by hairlines.
 *
 * "Picks today" and "Live now" cells are clickable and jump to the
 * matching tab on /predictions so users don't have to hunt for the
 * actual matches behind the count.
 */
export function TodayKpiStrip({
  tier,
  todayPickCount,
  liveCount,
  weekHitRate,
}: TodayKpiStripProps) {
  const lHref = useLocalizedHref();
  const tierLabel = tier ? TIER_LABEL[tier] : "Free";
  const tierAccent = tier ? TIER_ACCENT[tier] : TIER_ACCENT.free;
  const today = formatToday();

  const hasPicksToday = todayPickCount !== null && todayPickCount > 0;

  const cells: Cell[] = [
    {
      label: "Today",
      value: today,
      icon: Calendar,
      accent: "text-white",
    },
    {
      label: "Your tier",
      value: tierLabel,
      icon: Sparkles,
      accent: tierAccent,
    },
    {
      label: "Picks today",
      value: todayPickCount === null ? "—" : String(todayPickCount),
      icon: Clock,
      accent: "text-white",
      // Only link when there's at least one pick — clicking a "0"
      // count is just a dead end.
      href: hasPicksToday ? lHref("/predictions") : undefined,
      hoverHint: hasPicksToday ? "View these picks" : undefined,
    },
    {
      label: "Live now",
      value: liveCount === 0 ? "0" : String(liveCount),
      icon: Activity,
      accent: liveCount > 0 ? "text-red-400" : "text-slate-500",
      // Same rule: don't link to a live tab that has nothing on it.
      href: liveCount > 0 ? lHref("/predictions?tab=live") : undefined,
      hoverHint: liveCount > 0 ? "Watch live now" : undefined,
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[hsl(230_22%_9%/0.4)] backdrop-blur-sm">
      <div className="grid grid-cols-2 divide-x divide-white/[0.06] sm:grid-cols-4">
        {cells.map(({ label, value, icon: Icon, accent, href, hoverHint }) => {
          const inner = (
            <>
              <Icon className="h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  {label}
                </p>
                <p
                  className={`mt-0.5 truncate text-sm font-bold tabular-nums sm:text-base ${accent}`}
                >
                  {value}
                </p>
                {hoverHint && (
                  <p className="mt-0.5 text-[10px] text-slate-500 transition-colors group-hover:text-emerald-400">
                    {hoverHint} →
                  </p>
                )}
              </div>
              {href && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              )}
            </>
          );

          if (href) {
            return (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:px-5 sm:py-4"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4"
            >
              {inner}
            </div>
          );
        })}
      </div>
      {weekHitRate !== null && (
        <div className="border-t border-white/[0.05] px-4 py-2 text-[11px] text-slate-500 sm:px-5">
          Last 7 days for{" "}
          <span className="font-semibold text-slate-300">{tierLabel}</span>:{" "}
          <span className="font-semibold text-slate-200 tabular-nums">
            {weekHitRate.toFixed(1)}%
          </span>{" "}
          hit rate
        </div>
      )}
    </div>
  );
}
