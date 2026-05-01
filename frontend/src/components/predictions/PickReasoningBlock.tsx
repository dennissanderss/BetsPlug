"use client";

/**
 * PickReasoningBlock — NOCTURNE inline explainability for a prediction.
 *
 * Renders the top-3 feature drivers stored on ``prediction.top_drivers``
 * (populated by the backend from ``features_snapshot``). Gold+/Platinum
 * users see the full breakdown; Free/Silver see a locked teaser that
 * deep-links to the pricing page.
 *
 * No-op when ``drivers`` is null/undefined or empty — lets callers drop
 * it into any card without extra guards.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Lightbulb, Lock, Sparkles } from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import type { PredictionDriver } from "@/types/api";

type Variant = "compact" | "wide";

interface Props {
  drivers: PredictionDriver[] | null | undefined;
  variant?: Variant;
  defaultOpen?: boolean;
  className?: string;
}

const DIRECTION_TONE: Record<string, string> = {
  home: "text-emerald-300",
  away: "text-rose-300",
  neutral: "text-slate-300",
};

const DIRECTION_DOT: Record<string, string> = {
  home: "bg-emerald-400",
  away: "bg-rose-400",
  neutral: "bg-slate-500",
};

export function PickReasoningBlock({
  drivers,
  variant = "compact",
  defaultOpen = false,
  className,
}: Props) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const { hasAccess, ready } = useTier();
  const [open, setOpen] = React.useState(defaultOpen);

  // No drivers at all — nothing to render
  if (!drivers || drivers.length === 0) return null;

  // Don't flash the locked state while tier hydrates
  if (!ready) return null;

  const unlocked = hasAccess("gold");
  const wrapperBase =
    "rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors";
  const spacing = variant === "wide" ? "p-4" : "p-3";

  // ── Locked teaser for Free / Silver ────────────────────────────────
  if (!unlocked) {
    return (
      <div className={`${wrapperBase} ${spacing} ${className ?? ""}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
              {t("reasoning.lockedKicker")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-100">
              {t("reasoning.lockedTitle")}
            </p>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {t("reasoning.lockedBody")}
            </p>
          </div>
          <Link
            href="https://betsplug.com/pricing"
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            {t("reasoning.lockedCta")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Unlocked: collapsible reasoning card ────────────────────────────
  return (
    <div className={`${wrapperBase} ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 ${spacing} text-left hover:bg-white/[0.03] rounded-xl transition-colors`}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Lightbulb className="h-3.5 w-3.5 text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/90">
            {t("reasoning.kicker")}
          </p>
          <p className="text-sm font-semibold text-slate-100">
            {t("reasoning.title")}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-white/[0.05] px-3 pb-3 pt-2 space-y-1.5">
          {drivers.slice(0, 3).map((d, idx) => {
            const dir = d.direction ?? "neutral";
            const dotClass = DIRECTION_DOT[dir] ?? DIRECTION_DOT.neutral;
            const valueTone = DIRECTION_TONE[dir] ?? DIRECTION_TONE.neutral;
            return (
              <div
                key={`${d.feature}-${idx}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
                />
                <span className="flex-1 min-w-0 text-xs text-slate-300 truncate">
                  {d.label}
                </span>
                <span className={`text-xs font-bold tabular-nums ${valueTone}`}>
                  {d.value}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-[10px] text-slate-600 leading-relaxed">
            {t("reasoning.footnote")}
          </p>
        </div>
      )}
    </div>
  );
}

export default PickReasoningBlock;
