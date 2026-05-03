"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Sun, ArrowRight, Trophy } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import type { Tier } from "@/hooks/use-tier";

interface DashboardHeroProps {
  /** The user's active tier (free/silver/gold/platinum) — drives the
   *  copy that follows the greeting. Pass undefined while still
   *  hydrating so the line stays generic instead of flashing "Free". */
  tier: Tier | null | undefined;
  /** How many picks are scheduled today for the user's tier. Drives
   *  the dynamic subtitle. Pass null while loading. */
  todayPickCount: number | null;
}

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function pickGreetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function DashboardHero({ tier, todayPickCount }: DashboardHeroProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();
  const { user } = useAuth();

  // Take the first token of `name` so we get "Dennis" out of
  // "Dennis Sanders" or just the username when no full name is set.
  const firstName = (user?.name ?? "").split(/\s+/)[0] || null;
  const slot = pickGreetingKey();

  const greetingKey = `dashHero.greeting.${slot}` as const;
  const greeting = t(greetingKey as any);
  const greetingResolved =
    greeting === greetingKey
      ? slot === "morning" ? "Good morning" : slot === "afternoon" ? "Good afternoon" : "Good evening"
      : greeting;

  const headline = firstName ? `${greetingResolved}, ${firstName}` : greetingResolved;

  // Subtitle picks the most useful line based on what we actually
  // know — pick count first, fallback to tier-aware copy when the
  // count hasn't loaded yet.
  let subtitle: string;
  if (todayPickCount === null) {
    subtitle = t("dashHero.subtitleLoading" as any);
    if (subtitle === "dashHero.subtitleLoading") {
      subtitle = "Pulling today's predictions for your tier...";
    }
  } else if (todayPickCount > 0) {
    const tpl = t("dashHero.subtitleHasPicks" as any);
    const tierLabel = tier && tier !== "free" ? TIER_LABEL[tier] : TIER_LABEL.free;
    subtitle =
      tpl === "dashHero.subtitleHasPicks"
        ? `${todayPickCount} match${todayPickCount === 1 ? "" : "es"} on today's slate for ${tierLabel}.`
        : tpl
            .replace("{count}", String(todayPickCount))
            .replace("{tier}", tierLabel);
  } else {
    subtitle = t("dashHero.subtitleNoPicks" as any);
    if (subtitle === "dashHero.subtitleNoPicks") {
      subtitle = "No matches in your tier today — check back tomorrow.";
    }
  }

  const cta = t("dashHero.cta" as any);
  const ctaResolved = cta === "dashHero.cta" ? "Explore today's picks" : cta;

  return (
    <div className="welcome-card relative overflow-hidden">
      {/* Ambient glow blobs — single soft green wash, no purple
          accent now (post-2026-05 dashboard redesign keeps the
          welcome banner monochromatic green). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(74,222,128,0.28), transparent 70%)" }}
      />

      <div className="relative flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <HexBadge variant="green" size="lg">
            {slot === "morning" ? (
              <Sun className="h-6 w-6" />
            ) : slot === "evening" ? (
              <Trophy className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </HexBadge>
          <div className="min-w-0">
            <h1 className="text-heading text-xl sm:text-2xl text-[#ededed] truncate">
              <span className="gradient-text-green">{headline}</span>
            </h1>
            <p className="mt-1.5 text-sm text-[#a3a9b8] max-w-xl">{subtitle}</p>
            {tier && tier !== "free" && (
              <Pill tone="win" className="mt-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                {TIER_LABEL[tier]}
              </Pill>
            )}
          </div>
        </div>

        <Link
          href={lHref("/predictions")}
          className="btn-primary inline-flex items-center justify-center gap-2 self-start md:self-auto whitespace-nowrap"
        >
          {ctaResolved}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
