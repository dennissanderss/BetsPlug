"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocalizedHref } from "@/i18n/locale-provider";
import type { Tier } from "@/hooks/use-tier";

interface DashboardHeroBannerProps {
  /** User's active tier — drives the eyebrow line copy. */
  tier: Tier | null;
  /** Today's pick count in the user's scope. Null while loading. */
  todayPickCount: number | null;
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

/**
 * Photo-driven hero banner for the dashboard.
 * Soccer-action photograph as background, dark gradient overlay
 * for text contrast, tier-aware eyebrow + headline. Single primary
 * CTA on the right. Designed to feel like a magazine cover, not a
 * SaaS greeting card.
 */
export function DashboardHeroBanner({
  tier,
  todayPickCount,
}: DashboardHeroBannerProps) {
  const lHref = useLocalizedHref();
  const tierLabel = tier ? TIER_LABEL[tier] : "Free";
  const tierAccent = tier ? TIER_ACCENT[tier] : TIER_ACCENT.free;

  // Headline copy adapts to the actual data — no greeting fluff,
  // just what the engine produced for this user today.
  let eyebrow: string;
  let headline: string;
  let sub: string;
  if (todayPickCount === null) {
    eyebrow = `Today · ${tierLabel}`;
    headline = "Loading today's slate";
    sub = "Pulling fresh predictions from the engine.";
  } else if (todayPickCount > 0) {
    eyebrow = `Today · ${tierLabel}`;
    headline =
      todayPickCount === 1
        ? "1 pick on the slate today"
        : `${todayPickCount} picks on the slate today`;
    sub = "Pre-match locked. Results recorded post-FT.";
  } else {
    eyebrow = `Today · ${tierLabel}`;
    headline = "No matches in your tier today";
    sub = "Engine is on duty — fresh slate every morning.";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08]">
      {/* Background photo — fills the card, slightly desaturated by
          the gradient overlay above. Lazy loaded by the browser. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hero-action.jpg')",
          filter: "saturate(0.85) brightness(0.55)",
        }}
      />

      {/* Gradient overlay — dark wash on the left for text contrast,
          fades into the photo on the right. Plus a soft brand-green
          tint at top so the banner feels part of the dashboard. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,11,17,0.92) 0%, rgba(10,11,17,0.78) 40%, rgba(10,11,17,0.45) 75%, rgba(10,11,17,0.20) 100%), radial-gradient(circle at 0% 0%, rgba(74,222,128,0.18), transparent 55%)",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="min-w-0 max-w-2xl">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${tierAccent}`}
          >
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          <p className="mt-3 text-sm text-slate-300/90 sm:text-base">
            {sub}
          </p>
        </div>

        <Link
          href={lHref("/predictions")}
          className="inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-full bg-[hsl(var(--accent-green))] px-5 py-3 text-sm font-bold tracking-tight text-[hsl(234_25%_5%)] shadow-[0_8px_28px_rgba(74,222,128,0.40)] transition-transform hover:scale-[1.03] md:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          Open all predictions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
