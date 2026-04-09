"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Sparkles, Crown } from "lucide-react";

interface PaywallOverlayProps {
  feature: string;
  requiredTier: "silver" | "gold" | "platinum";
  children: React.ReactNode;
  /**
   * "overlay" (default): keep the children behind a frosted blur and
   * float a prominent paywall card on top. Use for large content (tables,
   * full sections) where blurring the preview adds visual context.
   *
   * "inline": replace the children entirely with a compact gold-themed
   * upgrade CTA. Use for small buttons, teaser cards, or anything where
   * a full overlay would overflow its container.
   */
  variant?: "overlay" | "inline";
}

const TIER_RANK: Record<string, number> = { free: 0, silver: 1, gold: 2, platinum: 3 };

const TIER_LABELS = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
} as const;

const TIER_ACCENT = {
  silver: {
    from: "from-slate-300",
    to: "to-slate-500",
    ring: "ring-slate-300/40",
    border: "border-slate-300/40",
    glow: "shadow-[0_0_32px_rgba(203,213,225,0.35)]",
    glowHover: "hover:shadow-[0_0_48px_rgba(203,213,225,0.55)]",
    btnFrom: "from-slate-100",
    btnVia: "via-slate-200",
    btnTo: "to-slate-400",
    text: "text-[#14181f]",
    gradientText: "from-slate-100 to-slate-300",
  },
  gold: {
    from: "from-amber-400",
    to: "to-yellow-500",
    ring: "ring-amber-300/40",
    border: "border-amber-400/40",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.4)]",
    glowHover: "hover:shadow-[0_0_48px_rgba(251,191,36,0.6)]",
    btnFrom: "from-amber-300",
    btnVia: "via-yellow-400",
    btnTo: "to-amber-500",
    text: "text-[#1a1408]",
    gradientText: "from-amber-200 to-yellow-400",
  },
  platinum: {
    from: "from-cyan-300",
    to: "to-indigo-400",
    ring: "ring-cyan-300/40",
    border: "border-cyan-300/40",
    glow: "shadow-[0_0_32px_rgba(103,232,249,0.4)]",
    glowHover: "hover:shadow-[0_0_48px_rgba(103,232,249,0.6)]",
    btnFrom: "from-cyan-200",
    btnVia: "via-sky-300",
    btnTo: "to-indigo-400",
    text: "text-[#0b1220]",
    gradientText: "from-cyan-200 to-indigo-300",
  },
} as const;

/* ─── Shared upgrade card (used by both variants) ──────────────────────── */
function UpgradeCard({
  tierLabel,
  tierKey,
  size = "full",
}: {
  tierLabel: string;
  tierKey: "silver" | "gold" | "platinum";
  size?: "full" | "compact";
}) {
  const accent = TIER_ACCENT[tierKey];
  const isCompact = size === "compact";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${accent.border} bg-gradient-to-b from-[#0d1321]/90 via-[#080b14]/92 to-[#060912]/95 text-center backdrop-blur-xl ${
        isCompact ? "p-6" : "p-8"
      }`}
    >
      {/* Ambient top glow */}
      <div
        className={`pointer-events-none absolute -top-24 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-gradient-to-b ${accent.from} ${accent.to} opacity-[0.12] blur-[90px]`}
      />
      {/* Diagonal hairlines for texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(255,255,255,0.8) 0 1px, transparent 1px 18px)",
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Crown badge */}
        <div
          className={`mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br ${accent.from} ${accent.to} ${accent.glow} ring-2 ${accent.ring} ${
            isCompact ? "h-12 w-12" : "h-14 w-14"
          }`}
        >
          <Crown
            className={`${accent.text} ${isCompact ? "h-5 w-5" : "h-6 w-6"}`}
            strokeWidth={2.5}
          />
        </div>

        {/* Heading */}
        <h3
          className={`bg-gradient-to-b ${accent.gradientText} bg-clip-text font-extrabold tracking-tight text-transparent ${
            isCompact ? "text-lg" : "text-xl"
          }`}
        >
          Upgrade to {tierLabel}
        </h3>

        {/* Subtitle */}
        <p
          className={`mx-auto mt-1.5 max-w-xs text-slate-400 ${
            isCompact ? "text-xs" : "text-sm"
          }`}
        >
          This feature requires a {tierLabel} subscription or higher.
        </p>

        {/* CTA button */}
        <Link
          href="/checkout"
          className={`group/btn relative mt-5 inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r ${accent.btnFrom} ${accent.btnVia} ${accent.btnTo} ${accent.text} ${accent.glow} ${accent.glowHover} font-black tracking-tight transition-all hover:scale-[1.03] ${
            isCompact ? "px-5 py-2.5 text-xs" : "px-6 py-3 text-sm"
          }`}
        >
          <Sparkles className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          Upgrade Now
          {/* Shimmer sweep on hover */}
          <div
            className="pointer-events-none absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-[200%]"
          />
        </Link>
      </div>
    </div>
  );
}

export function PaywallOverlay({
  requiredTier,
  children,
  variant = "overlay",
}: PaywallOverlayProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [checked, setChecked] = useState(false);
  const [userTier, setUserTier] = useState("free");

  useEffect(() => {
    const requiredRank = TIER_RANK[requiredTier] ?? 0;

    // First check localStorage (set by admin or after login)
    const stored = localStorage.getItem("betsplug_tier");
    if (stored) {
      setUserTier(stored);
      const userRank = TIER_RANK[stored] ?? 0;
      if (userRank >= requiredRank) setHasAccess(true);
      setChecked(true);
      return;
    }

    // Then check API for subscription status
    const checkSubscription = async () => {
      try {
        const raw = localStorage.getItem("betsplug_user");
        if (!raw) {
          setChecked(true);
          return;
        }
        const user = JSON.parse(raw);
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const resp = await fetch(`${API}/subscriptions/status?email=${encodeURIComponent(user.email || "")}`);
        const data = await resp.json();
        if (data.plan) {
          const tierMap: Record<string, string> = { basic: "silver", standard: "silver", premium: "gold", lifetime: "platinum" };
          const tier = tierMap[data.plan] || "free";
          setUserTier(tier);
          localStorage.setItem("betsplug_tier", tier);
          const userRank = TIER_RANK[tier] ?? 0;
          if (userRank >= requiredRank) setHasAccess(true);
        }
      } catch {
        // Keep free tier on error
      }
      setChecked(true);
    };
    checkSubscription();
  }, [requiredTier]);

  // Avoid a flash of paywall during first paint
  if (!checked) return <>{children}</>;
  if (hasAccess) return <>{children}</>;

  const tierLabel = TIER_LABELS[requiredTier];

  /* ── Inline variant: compact replacement ──────────────────────────────
     Use when the wrapped child is a small button or short teaser card.
     An absolute overlay on such tiny children always overflows, so we
     simply render the upgrade card in place of the child. */
  if (variant === "inline") {
    return <UpgradeCard tierLabel={tierLabel} tierKey={requiredTier} size="compact" />;
  }

  /* ── Overlay variant: blurred preview + centered card ─────────────────
     Use when the wrapped child has real visual substance (tables, grids)
     so the blurred preview acts as a hint of what's locked behind. */
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Heavier blur so the preview reads as "locked" rather than "broken" */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[6px] saturate-[0.6] opacity-40"
      >
        {children}
      </div>

      {/* Frosted tint layer */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#080b14]/70 via-[#080b14]/80 to-[#080b14]/90 backdrop-blur-md" />

      {/* Centered paywall card */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <UpgradeCard tierLabel={tierLabel} tierKey={requiredTier} size="full" />
        </div>
      </div>
    </div>
  );
}
