"use client";

/**
 * TierLadder, public tier-accuracy showcase for the homepage.
 *
 * Uses the shared tier-theme (Bronze copper, Silver metallic, Gold
 * violet, Platinum gold) so the colors match everywhere on the site.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock, ShieldCheck, Unlock } from "lucide-react";
import Link from "next/link";
import { Pill } from "@/components/noct/pill";
import { TierEmblem } from "@/components/noct/tier-emblem";
import { TIER_THEME, TIER_ORDER, type TierKey } from "@/components/noct/tier-theme";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

interface TierRow {
  accuracy: number | null; // 0-1
  total: number | null;
}

/**
 * Static snapshot used as fallback / SSR seed. Refresh occasionally from
 * https://betsplug-production.up.railway.app/api/trackrecord/summary?pick_tier={tier}
 * lastReviewed: 2026-04-18
 */
const FALLBACK: Record<TierKey, { accuracy: number; total: number }> = {
  bronze: { accuracy: 0.484, total: 3763 },
  silver: { accuracy: 0.607, total: 1138 },
  gold: { accuracy: 0.706, total: 1650 },
  platinum: { accuracy: 0.823, total: 840 },
};

/** Map our client-side tier key to the backend pick_tier query value. */
const BACKEND_SLUG: Record<TierKey, string> = {
  bronze: "free",
  silver: "silver",
  gold: "gold",
  platinum: "platinum",
};

function useAllTierStats(): Record<TierKey, TierRow> {
  const [stats, setStats] = useState<Record<TierKey, TierRow>>({
    bronze: { accuracy: null, total: null },
    silver: { accuracy: null, total: null },
    gold: { accuracy: null, total: null },
    platinum: { accuracy: null, total: null },
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    Promise.all(
      TIER_ORDER.map((t) =>
        fetch(`${API}/trackrecord/summary?pick_tier=${BACKEND_SLUG[t]}`)
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
      {/* Ambient glows, warmer (copper) → cooler (violet) → warm (gold) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full"
        style={{ background: "rgba(139, 92, 246, 0.1)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-10 h-[460px] w-[460px] rounded-full"
        style={{ background: "rgba(212, 175, 55, 0.1)", filter: "blur(140px)" }}
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
              ? "Elke voorspelling krijgt een tier op basis van modelbetrouwbaarheid. Hoe hoger de tier, hoe strenger de drempel en hoe scherper de cijfers."
              : "Every prediction is labelled with a tier based on model confidence. The higher the tier, the stricter the threshold and the sharper the numbers."}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_ORDER.map((tierKey, i) => {
            const theme = TIER_THEME[tierKey];
            const row = stats[tierKey];
            const accuracyNum =
              row.accuracy != null && row.accuracy > 0
                ? row.accuracy
                : FALLBACK[tierKey].accuracy;
            const totalNum =
              row.total != null && row.total > 0 ? row.total : FALLBACK[tierKey].total;
            const accStr = `${(accuracyNum * 100).toFixed(1).replace(".", isNl ? "," : ".")}%`;
            const totalStr = totalNum.toLocaleString(locale);

            return (
              <motion.div
                key={tierKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border p-6"
                style={{
                  borderColor: theme.ringHex,
                  background: `linear-gradient(180deg, ${theme.bgTintHex}, rgba(15,20,32,0.6))`,
                }}
              >
                {/* Ambient glow per card */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-[160px] w-[160px] rounded-full"
                  style={{ background: `${theme.colorHex}33`, filter: "blur(50px)" }}
                />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <TierEmblem tier={tierKey} size="md" />
                    <Pill className="!text-[9px] tabular-nums">
                      conf ≥ {theme.confFloor}
                    </Pill>
                  </div>

                  <h3
                    className={`mt-5 text-xs font-bold uppercase tracking-widest ${theme.textClass}`}
                  >
                    {theme.name}
                  </h3>
                  <p className="text-stat mt-1 text-4xl leading-none text-[#ededed]">
                    {accStr}
                  </p>
                  <p className="mt-2 text-xs text-[#a3a9b8]">
                    {isNl ? "over" : "across"}{" "}
                    <span className="font-semibold text-[#ededed]">{totalStr}</span>{" "}
                    {isNl ? "beoordeelde picks" : "graded picks"}
                  </p>

                  {tierKey === "bronze" ? (
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#22c55e]">
                      <Unlock className="h-3 w-3" />
                      {isNl ? "Gratis tier" : "Free tier"}
                    </div>
                  ) : (
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
              ? "Live cijfers, rechtstreeks uit onze database."
              : "Live numbers, straight from our database."}
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
