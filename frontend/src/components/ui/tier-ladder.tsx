"use client";

/**
 * TierLadder, public tier-accuracy showcase for the homepage.
 *
 * Uses the shared tier-theme (Bronze copper, Silver metallic, Gold
 * violet, Platinum gold) so the colors match everywhere on the site.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock, ShieldCheck } from "lucide-react";
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
  const { t } = useTranslations();
  const loc = useLocalizedHref();

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
            {t("tier.badge")}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("tier.titleLine1")}{" "}
            <span className="gradient-text-green">{t("tier.titleHighlight")}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {t("tier.lede")}
          </p>
        </motion.div>

        {/* Bronze (Free · 45%+) is deliberately hidden from the public
            tier ladder. It returns the full-sample accuracy (60.1%)
            which reads as "the Free subscription performs weakly" to
            prospective visitors, even though the number just reflects
            the lowest confidence floor. The three paid tiers are the
            ones the product actually promises; the raw Bronze numbers
            remain available via the per-tier CSV export on /prestaties. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIER_ORDER.filter((t) => t !== "bronze").map((tierKey, i) => {
            const theme = TIER_THEME[tierKey];
            const row = stats[tierKey];
            const accuracyNum =
              row.accuracy != null && row.accuracy > 0
                ? row.accuracy
                : FALLBACK[tierKey].accuracy;
            const accStr = `${(accuracyNum * 100).toFixed(1).replace(".", t("tier.decimalSep"))}%`;

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

                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                    <Lock className="h-3 w-3" />
                    {t("tier.premiumTier")}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-[#6b7280]">
            {t("tier.liveNote")}
          </p>
          <Link
            href={loc("/track-record")}
            className="btn-glass inline-flex items-center gap-2 text-sm"
          >
            {t("tier.seeFullTrackRecord")}
          </Link>
        </div>
      </div>
    </section>
  );
}
