"use client";

/**
 * Shared visual building blocks for the /articles pages.
 * ────────────────────────────────────────────────────────────
 * SportIcon, SportBadge and CoverArt are reused by the archive
 * page, the related-articles list and the single-post template,
 * so every visual element is defined once and stays consistent.
 */

import { Volleyball } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Sport } from "@/data/articles";
import { useTranslations } from "@/i18n/locale-provider";
import { Pill } from "@/components/noct/pill";

/* ── Sport meta (icon + tone + label key) ─────────────────── */

type SportTone = "green" | "purple" | "blue";

type SportMeta = {
  icon: LucideIcon;
  iconColor: string;
  tone: SportTone;
  /** Gradient used on CoverArt fallback. */
  gradient: string;
  labelKey: "articles.sportFootball";
};

const SPORT_META: Record<Sport, SportMeta> = {
  football: {
    icon: Volleyball,
    iconColor: "#4ade80",
    tone: "green",
    gradient:
      "radial-gradient(ellipse at top left, rgba(74,222,128,0.28), transparent 55%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.2), transparent 55%), linear-gradient(135deg, #0a1412 0%, #0a0f1a 100%)",
    labelKey: "articles.sportFootball",
  },
};

export function getSportMeta(sport: Sport): SportMeta {
  return SPORT_META[sport];
}

/* ── Small icon (kept for API compatibility) ──────────────── */

export function SportIcon({
  sport,
  className = "h-4 w-4",
}: {
  sport: Sport;
  className?: string;
}) {
  const { icon: Icon, iconColor } = SPORT_META[sport];
  return <Icon className={className} style={{ color: iconColor }} />;
}

/* ── Badge pill — NOCTURNE Pill primitive ─────────────────── */

export function SportBadge({ sport }: { sport: Sport }) {
  const { t } = useTranslations();
  const meta = SPORT_META[sport];
  const Icon = meta.icon;
  const tone = meta.tone === "green" ? "win" : meta.tone === "purple" ? "purple" : "info";
  return (
    <Pill tone={tone} className="inline-flex items-center gap-1.5">
      <Icon className="h-3 w-3" />
      <span>{t(meta.labelKey)}</span>
    </Pill>
  );
}

/* ── Cover art — smooth gradient + subtle pattern ─────────── */

export function CoverArt({
  gradient,
  pattern = "dots",
  sport,
  size = "md",
  imageUrl,
  imageAlt,
}: {
  gradient: string;
  pattern?: "dots" | "grid" | "diagonal";
  sport: Sport;
  size?: "sm" | "md" | "lg";
  imageUrl?: string;
  imageAlt?: string;
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
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        };
      case "diagonal":
        return {
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 22px)",
        };
      default:
        return {
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        };
    }
  })();

  // Prefer the caller-supplied gradient; fall back to the sport default.
  const background = gradient || meta.gradient;

  return (
    <div
      className="absolute inset-0"
      style={{ background }}
      aria-hidden={imageUrl ? undefined : "true"}
    >
      {/* Pattern overlay — soft */}
      <div className="absolute inset-0 opacity-50" style={patternStyle} />

      {/* Ambient radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(74,222,128,0.18) 0%, transparent 60%)",
        }}
      />

      {/* Corner glows */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#4ade80]/10 blur-[90px]" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-[#a855f7]/10 blur-[100px]" />

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt ?? ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity opacity-90"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/[0.04] blur-2xl" />
            <Icon
              className={`${iconSize} drop-shadow-[0_0_30px_rgba(74,222,128,0.35)]`}
              strokeWidth={1.3}
              style={{ color: meta.iconColor }}
            />
          </div>
        </div>
      )}

      {/* Bottom fade so text below reads cleanly */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
