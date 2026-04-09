"use client";

/**
 * Shared visual building blocks for the /articles pages.
 * ────────────────────────────────────────────────────────────
 * SportIcon, SportBadge and CoverArt are reused by the archive
 * page, the related-articles list and the single-post template,
 * so every visual element is defined once and stays consistent.
 */

import {
  Dribbble,
  Volleyball,
  Disc,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Sport } from "@/data/articles";
import { useTranslations } from "@/i18n/locale-provider";

/* ── Sport meta (icon + color + label key) ───────────────── */

type SportMeta = {
  icon: LucideIcon;
  /** Tailwind text color for the icon */
  textClass: string;
  /** Tailwind background + border for the badge pill */
  badgeClass: string;
  labelKey:
    | "articles.sportFootball"
    | "articles.sportNba"
    | "articles.sportNfl"
    | "articles.sportMlb"
    | "articles.sportNhl";
};

const SPORT_META: Record<Sport, SportMeta> = {
  football: {
    icon: Volleyball,
    textClass: "text-green-300",
    badgeClass: "border-green-500/30 bg-green-500/10 text-green-300",
    labelKey: "articles.sportFootball",
  },
  nba: {
    icon: Dribbble,
    textClass: "text-purple-300",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    labelKey: "articles.sportNba",
  },
  nfl: {
    icon: Zap,
    textClass: "text-sky-300",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    labelKey: "articles.sportNfl",
  },
  mlb: {
    icon: Disc,
    textClass: "text-amber-300",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    labelKey: "articles.sportMlb",
  },
  nhl: {
    icon: Disc,
    textClass: "text-cyan-300",
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    labelKey: "articles.sportNhl",
  },
};

export function getSportMeta(sport: Sport): SportMeta {
  return SPORT_META[sport];
}

/* ── Small icon ──────────────────────────────────────────── */

export function SportIcon({
  sport,
  className = "h-4 w-4",
}: {
  sport: Sport;
  className?: string;
}) {
  const { icon: Icon, textClass } = SPORT_META[sport];
  return <Icon className={`${className} ${textClass}`} />;
}

/* ── Badge pill ──────────────────────────────────────────── */

export function SportBadge({ sport }: { sport: Sport }) {
  const { t } = useTranslations();
  const meta = SPORT_META[sport];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${meta.badgeClass}`}
    >
      <Icon className="h-3 w-3" />
      {t(meta.labelKey)}
    </span>
  );
}

/* ── Cover art (layered gradient + oversized icon) ───────── */

export function CoverArt({
  gradient,
  pattern = "dots",
  sport,
  size = "md",
}: {
  gradient: string;
  pattern?: "dots" | "grid" | "diagonal";
  sport: Sport;
  size?: "sm" | "md" | "lg";
}) {
  const meta = SPORT_META[sport];
  const Icon = meta.icon;
  const iconSize =
    size === "lg"
      ? "h-40 w-40 sm:h-52 sm:w-52"
      : size === "sm"
      ? "h-16 w-16"
      : "h-24 w-24 sm:h-28 sm:w-28";

  const patternStyle: React.CSSProperties = (() => {
    switch (pattern) {
      case "grid":
        return {
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        };
      case "diagonal":
        return {
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 22px)",
        };
      default:
        return {
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        };
    }
  })();

  return (
    <div
      className="absolute inset-0"
      style={{ background: gradient }}
      aria-hidden="true"
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-60"
        style={patternStyle}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(74,222,128,0.22) 0%, transparent 55%)",
        }}
      />
      {/* Corner ambient */}
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-green-500/10 blur-[80px]" />
      <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-[90px]" />
      {/* Oversized sport icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/[0.04] blur-2xl" />
          <Icon
            className={`${iconSize} ${meta.textClass} drop-shadow-[0_0_30px_rgba(74,222,128,0.35)]`}
            strokeWidth={1.3}
          />
        </div>
      </div>
      {/* Bottom fade so text below reads cleanly */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
