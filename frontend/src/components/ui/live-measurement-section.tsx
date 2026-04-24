"use client";

/**
 * LiveMeasurementSection — dedicated "Live meting" surface separate
 * from the model-validation numbers on the rest of the page.
 *
 * Pulls /api/trackrecord/live-measurement which applies a strict
 * filter: prediction_source='live' AND predicted_at < scheduled_at
 * AND created_at >= 2026-04-16. Starts empty on launch and grows
 * as matches are graded.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, Clock } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { useTranslations } from "@/i18n/locale-provider";
import { TIER_THEME, TIER_ORDER, type TierKey } from "@/components/noct/tier-theme";
import { TierEmblem } from "@/components/noct/tier-emblem";

interface TierBucket {
  total: number;
  correct: number;
  accuracy: number;
}

interface LiveMeasurementResponse {
  start_date: string;
  total: number;
  correct: number;
  accuracy: number;
  per_tier: Record<string, TierBucket>;
}

// Wilson 95% CI half-width helper (two-sided).
function wilson(correct: number, total: number): { lower: number; upper: number } | null {
  if (total === 0) return null;
  const z = 1.96;
  const p = correct / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return {
    lower: Math.max(0, (centre - margin) / denom),
    upper: Math.min(1, (centre + margin) / denom),
  };
}

export function LiveMeasurementSection() {
  const { t } = useTranslations();
  const [data, setData] = useState<LiveMeasurementResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/trackrecord/live-measurement`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const startLabel = data?.start_date
    ? new Date(data.start_date).toLocaleDateString(t("live.dateLocale"), {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "16 april 2026";

  return (
    <section
      id="live-measurement"
      className="relative overflow-hidden py-20 md:py-28 scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[440px] w-[440px] rounded-full"
        style={{
          background: "hsl(var(--accent-blue) / 0.10)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <span className="section-label">
            <Activity className="h-3 w-3" />
            {t("live.sectionLabel")}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
            {t("live.titleLine1")}{" "}
            <span className="gradient-text-green">{startLabel}</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">
            {t("live.lede")}
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_ORDER.map((tier) => (
            <LiveTierCard
              key={tier}
              tier={tier}
              bucket={data?.per_tier?.[tier === "bronze" ? "free" : tier]}
              loaded={loaded}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[#6b7280]">
          {t("live.footnote")}
        </p>
      </div>
    </section>
  );
}

function LiveTierCard({
  tier,
  bucket,
  loaded,
}: {
  tier: TierKey;
  bucket: TierBucket | undefined;
  loaded: boolean;
}) {
  const { t } = useTranslations();
  const theme = TIER_THEME[tier];
  const total = bucket?.total ?? 0;
  const correct = bucket?.correct ?? 0;
  const ci = wilson(correct, total);
  const awaiting = total < 10;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: theme.ringHex,
        background: `linear-gradient(180deg, ${theme.bgTintHex}, rgba(15,20,32,0.6))`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-[100px] w-[100px] rounded-full"
        style={{ background: `${theme.colorHex}22`, filter: "blur(36px)" }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TierEmblem tier={tier} size="sm" />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textClass}`}>
            {theme.name}
          </span>
        </div>
        {awaiting ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold text-slate-400">
            <Clock className="h-2.5 w-2.5" />
            {t("live.awaitingData")}
          </span>
        ) : null}
      </div>

      <p className="relative mt-3 text-3xl font-extrabold tabular-nums leading-none text-[#ededed]">
        {total === 0
          ? "—"
          : `${(bucket!.accuracy * 100).toFixed(1).replace(".", t("live.decimalSep"))}%`}
      </p>

      {loaded && total > 0 ? (
        <div className="relative mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center">
            <p className="text-base font-extrabold tabular-nums leading-none text-[#ededed]">
              {total}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#6b7280]">
              {t("live.played")}
            </p>
          </div>
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1.5 text-center">
            <p className="text-base font-extrabold tabular-nums leading-none text-emerald-300">
              {correct}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-emerald-500/80">
              {t("live.won")}
            </p>
          </div>
          <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-2 py-1.5 text-center">
            <p className="text-base font-extrabold tabular-nums leading-none text-red-300">
              {total - correct}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-red-500/80">
              {t("live.lost")}
            </p>
          </div>
        </div>
      ) : (
        <p className="relative mt-2 text-[11px] text-[#a3a9b8]">
          {loaded ? t("live.noGradedPicks") : t("live.loading")}
        </p>
      )}

      {ci && total >= 10 && (
        <p className="relative mt-2 text-[10px] text-[#6b7280] tabular-nums">
          95% CI {(ci.lower * 100).toFixed(0)}–{(ci.upper * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
}

export default LiveMeasurementSection;
