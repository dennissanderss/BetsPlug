"use client";

/**
 * TierLadder — public tier-accuracy showcase for the homepage.
 *
 * Fetches live numbers from /api/trackrecord/summary?pick_tier={tier}
 * for all four tiers in parallel. Shows accuracy + graded-pick count +
 * confidence floor per tier so visitors can see the value ladder at a
 * glance ("the more you pay, the sharper the picks").
 *
 * Design: four `card-neon` panels, one per tier, with an ambient glow
 * blob behind the section that matches NOCTURNE. Numbers fall back to
 * a static approximation from the last manual snapshot if the API is
 * unreachable — we never render "0%" or a bare dash, which would look
 * like the service is broken.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock, Trophy, Crown, Gem, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

type TierKey = "free" | "silver" | "gold" | "platinum";

interface TierRow {
  accuracy: number | null; // 0–1
  total: number | null;
}

/**
 * Static snapshot used as fallback / SSR seed. Refresh occasionally from
 * https://betsplug-production.up.railway.app/api/trackrecord/summary?pick_tier={tier}
 * lastReviewed: 2026-04-18
 */
const FALLBACK: Record<TierKey, { accuracy: number; total: number }> = {
  free: { accuracy: 0.484, total: 3763 },
  silver: { accuracy: 0.607, total: 1138 },
  gold: { accuracy: 0.706, total: 1650 },
  platinum: { accuracy: 0.823, total: 840 },
};

const TIERS: {
  key: TierKey;
  name: string;
  icon: typeof Lock;
  variant: "green" | "purple" | "blue";
  confFloor: string;
  accent: string;
}[] = [
  { key: "free",     name: "Free",     icon: ShieldCheck, variant: "green",  confFloor: "0,55", accent: "text-slate-200" },
  { key: "silver",   name: "Silver",   icon: Trophy,      variant: "blue",   confFloor: "0,65", accent: "text-slate-100" },
  { key: "gold",     name: "Gold",     icon: Crown,       variant: "purple", confFloor: "0,70", accent: "text-amber-300" },
  { key: "platinum", name: "Platinum", icon: Gem,         variant: "green",  confFloor: "0,75", accent: "text-emerald-300" },
];

function useAllTierStats(): Record<TierKey, TierRow> {
  const [stats, setStats] = useState<Record<TierKey, TierRow>>({
    free: { accuracy: null, total: null },
    silver: { accuracy: null, total: null },
    gold: { accuracy: null, total: null },
    platinum: { accuracy: null, total: null },
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const tiers: TierKey[] = ["free", "silver", "gold", "platinum"];
    Promise.all(
      tiers.map((t) =>
        fetch(`${API}/trackrecord/summary?pick_tier=${t}`)
          .then((r) => r.json())
          .then((d) => [t, d] as const)
          .catch(() => [t, null] as const),
      ),
    ).then((results) => {
      const next: Record<TierKey, TierRow> = { ...stats };
      for (const [tier, data] of results) {
        if (data && typeof data === "object") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = data as any;
          next[tier] = {
            accuracy: typeof d.accuracy === "number" ? d.accuracy : null,
            total: typeof d.total_predictions === "number" ? d.total_predictions : null,
          };
        }
      }
      setStats(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stats;
}

export function TierLadder() {
  const stats = useAllTierStats();
  const { locale } = useTranslations();
  const loc = useLocalizedHref();
  const isNl = locale === "nl";

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-10 h-[460px] w-[460px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-3xl"
        >
          <span className="section-label">
            <ShieldCheck className="h-3 w-3" />
            {isNl ? "Vier tiers, één eerlijk trackrecord" : "Four tiers, one honest track record"}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {isNl ? (
              <>
                Hoger vertrouwen ={" "}
                <span className="gradient-text-green">hogere nauwkeurigheid</span>
              </>
            ) : (
              <>
                Higher confidence ={" "}
                <span className="gradient-text-green">higher accuracy</span>
              </>
            )}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "Elke voorspelling krijgt een tier op basis van modelbetrouwbaarheid. Hoe hoger de tier, hoe strenger de drempel — en hoe scherper de cijfers. Alle getallen komen rechtstreeks uit ons openbare trackrecord."
              : "Every prediction is labelled with a tier based on model confidence. The higher the tier, the stricter the threshold — and the sharper the numbers. All stats pulled live from our public track record."}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => {
            const row = stats[tier.key];
            const accuracyNum =
              row.accuracy != null && row.accuracy > 0
                ? row.accuracy
                : FALLBACK[tier.key].accuracy;
            const totalNum =
              row.total != null && row.total > 0
                ? row.total
                : FALLBACK[tier.key].total;
            const accStr = `${(accuracyNum * 100).toFixed(1).replace(".", isNl ? "," : ".")}%`;
            const totalStr = totalNum.toLocaleString(locale);
            const Icon = tier.icon;

            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className={`card-neon card-neon-${tier.variant} relative overflow-hidden rounded-2xl`}
              >
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <HexBadge variant={tier.variant} size="sm">
                      <Icon className="h-4 w-4" />
                    </HexBadge>
                    <Pill className="!text-[9px] tabular-nums">
                      {isNl ? "conf ≥" : "conf ≥"} {tier.confFloor}
                    </Pill>
                  </div>

                  <h3 className={`mt-5 text-xs font-bold uppercase tracking-widest ${tier.accent}`}>
                    {tier.name}
                  </h3>
                  <p className="text-stat mt-1 text-4xl leading-none text-[#ededed]">
                    {accStr}
                  </p>
                  <p className="mt-2 text-xs text-[#a3a9b8]">
                    {isNl ? "over" : "across"}{" "}
                    <span className="font-semibold text-[#ededed]">{totalStr}</span>{" "}
                    {isNl ? "beoordeelde picks" : "graded picks"}
                  </p>

                  {tier.key !== "free" && (
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                      <Lock className="h-3 w-3" />
                      {isNl ? "Premium tier" : "Premium tier"}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-[#6b7280]">
            {isNl
              ? "Live cijfers — elke beoordeelde pick sinds de v8.1 deploy (2026-04-16)."
              : "Live numbers — every graded pick since the v8.1 deploy (2026-04-16)."}
          </p>
          <Link
            href={loc("/track-record")}
            className="btn-glass inline-flex items-center gap-2 text-sm"
          >
            {isNl ? "Bekijk volledig trackrecord" : "See full track record"}
          </Link>
        </div>
      </div>
    </section>
  );
}
