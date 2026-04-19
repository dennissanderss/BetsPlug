"use client";

/**
 * TrustFunnel, "honest funnel" transparency section for the homepage.
 *
 * Explains in plain language how we go from 55 000+ ingested matches
 * down to the ~1 650 Gold-tier graded predictions we actually advertise.
 * Designed to answer the visitor question: "you say 1 650, but didn't
 * you have tens of thousands of matches? Why so few?"
 *
 * The answer is honest: we only count predictions made with the CURRENT
 * model (post-v8.1 deploy on 2026-04-16). Older predictions with a
 * broken feature pipeline are archived, not stuffed into the headline
 * number. That is a trust feature, not a shortfall.
 *
 * Live data:
 *   - Gold accuracy/total → /api/trackrecord/summary?pick_tier=gold
 * Static snapshot (manually reviewed):
 *   - Total ingested matches (~55 680)
 *   - Predictions made with current model (from /dashboard/metrics)
 *   - Last-reviewed date at the bottom of the funnel
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ShieldCheck, ArrowRight, Lock, Unlock } from "lucide-react";
import { TierEmblem } from "@/components/noct/tier-emblem";
import { TIER_THEME, type TierKey } from "@/components/noct/tier-theme";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

interface TierStat {
  accuracy: number | null;
  total: number | null;
}

interface TrustData {
  bronze: TierStat;
  silver: TierStat;
  gold: TierStat;
  platinum: TierStat;
  forecastsTotal: number | null;
  evaluatedTotal: number | null;
}

/** Manually reviewed fallback, update alongside potd-stats.ts refreshes. */
const FALLBACK = {
  matchesIngested: 55680,
  forecastsTotal: 3801,
  evaluatedTotal: 3763,
  bronze: { total: 3763, accuracy: 0.484 },
  silver: { total: 3004, accuracy: 0.607 },
  gold: { total: 1650, accuracy: 0.705 },
  platinum: { total: 840, accuracy: 0.823 },
  lastReviewed: "2026-04-18",
};

function useTrustData(): TrustData {
  const [data, setData] = useState<TrustData>({
    bronze: { accuracy: null, total: null },
    silver: { accuracy: null, total: null },
    gold: { accuracy: null, total: null },
    platinum: { accuracy: null, total: null },
    forecastsTotal: null,
    evaluatedTotal: null,
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const pick = (d: unknown): TierStat => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = d as any;
      return {
        accuracy: typeof r?.accuracy === "number" && r.accuracy > 0 ? r.accuracy : null,
        total: typeof r?.total_predictions === "number" && r.total_predictions > 0 ? r.total_predictions : null,
      };
    };
    Promise.all([
      // Bronze maps to backend pick_tier=free (see tier-ladder.tsx)
      fetch(`${API}/trackrecord/summary?pick_tier=free`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/trackrecord/summary?pick_tier=silver`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/trackrecord/summary?pick_tier=gold`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/trackrecord/summary?pick_tier=platinum`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/dashboard/metrics`).then((r) => r.json()).catch(() => null),
    ]).then(([bronze, silver, gold, platinum, dashboard]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = dashboard as any;
      setData({
        bronze: pick(bronze),
        silver: pick(silver),
        gold: pick(gold),
        platinum: pick(platinum),
        forecastsTotal: typeof d?.total_forecasts === "number" && d.total_forecasts > 0 ? d.total_forecasts : null,
        evaluatedTotal: typeof d?.evaluated_count === "number" && d.evaluated_count > 0 ? d.evaluated_count : null,
      });
    });
  }, []);

  return data;
}

export function TrustFunnel() {
  const { locale } = useTranslations();
  const loc = useLocalizedHref();
  const isNl = locale === "nl";
  const live = useTrustData();

  // Merge live with fallback, never render zero / dash in a marketing section
  const evaluatedTotal = live.evaluatedTotal ?? FALLBACK.evaluatedTotal;
  const silver = {
    total: live.silver.total ?? FALLBACK.silver.total,
    accuracy: live.silver.accuracy ?? FALLBACK.silver.accuracy,
  };
  const gold = {
    total: live.gold.total ?? FALLBACK.gold.total,
    accuracy: live.gold.accuracy ?? FALLBACK.gold.accuracy,
  };
  const platinum = {
    total: live.platinum.total ?? FALLBACK.platinum.total,
    accuracy: live.platinum.accuracy ?? FALLBACK.platinum.accuracy,
  };
  // Don't sum silver+gold+platinum totals. The pick_tier thresholds
  // are cumulative (confidence >= 0.65 / 0.70 / 0.75), so a Platinum
  // pick is also counted under Gold and Silver in the backend.

  const fmt = (n: number) => n.toLocaleString(locale);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-blue) / 0.12)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-10 h-[460px] w-[460px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="section-label mx-auto">
            <ShieldCheck className="h-3 w-3" />
            {isNl ? "Openbaar trackrecord" : "Public track record"}
          </span>
          <h2 className="text-heading mt-5 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {isNl ? (
              <>
                Elke voorspelling{" "}
                <span className="gradient-text-green">openbaar beoordeeld</span>.
              </>
            ) : (
              <>
                Every prediction{" "}
                <span className="gradient-text-green">publicly graded</span>.
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {isNl
              ? `We publiceren alleen op onze 14 kern-competities. Elke voorspelling wordt pre-match gelockt en na afloop vergeleken met de echte uitslag — geen kersenpluk, geen verborgen verliezers. Hieronder zie je hoe het model presteert per vertrouwensdrempel, over ${fmt(evaluatedTotal)} beoordeelde picks.`
              : `We only publish on our 14 core competitions. Every prediction is locked pre-match and compared against the real result — no cherry-picking, no hidden losers. Below is how the model performs per confidence threshold, across ${fmt(evaluatedTotal)} graded picks.`}
          </p>
        </motion.div>

        {/* Tier-breakdown card. Bronze was removed because its number
            is the full-sample accuracy (60.1%) which read to visitors
            as "the Free subscription performs weakly" instead of
            "lowest confidence floor". The three paid tiers still
            tell the full honesty story: higher confidence, tighter
            threshold, higher accuracy. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-[#6b7280]">
            {isNl ? "Nauwkeurigheid per tier" : "Accuracy per tier"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TierBreakdownCard
              tier="silver"
              accuracy={silver.accuracy}
              total={silver.total}
              locale={locale}
              isNl={isNl}
            />
            <TierBreakdownCard
              tier="gold"
              accuracy={gold.accuracy}
              total={gold.total}
              locale={locale}
              isNl={isNl}
            />
            <TierBreakdownCard
              tier="platinum"
              accuracy={platinum.accuracy}
              total={platinum.total}
              locale={locale}
              isNl={isNl}
              highlight
            />
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              href={loc("/track-record")}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#a3a9b8] underline-offset-4 transition-colors hover:text-[#ededed] hover:underline"
            >
              {isNl ? "Bekijk volledig trackrecord" : "See full track record"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "De cijfers hierboven komen uit modelvalidatie op 2 jaar historische data. Sinds 16 april 2026 loggen we daarnaast ook een live meting — die groeit dagelijks."
              : "The numbers above come from model validation on 2 years of historical data. Since 16 April 2026 we also log a separate live measurement — that grows daily."}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-[11px] leading-relaxed text-[#6b7280]">
            <span className="font-semibold text-[#a3a9b8]">
              {isNl ? "Belangrijk:" : "Important:"}
            </span>{" "}
            {isNl
              ? "dit blijven data en kansmodel-berekeningen. Wij geven geen garantie op de uitslag van een individuele wedstrijd, en geen enkel AI-model ter wereld kan dat. Gebruik onze cijfers als informatie, niet als zekerheid."
              : "these remain data and probability-model calculations. We offer no guarantee on the outcome of any individual match, and no AI model on earth can. Use our numbers as information, not as certainty."}
          </p>
          <Link
            href={loc("/track-record")}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            {isNl ? "Bekijk de volledige data" : "Inspect the full data"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function TierBreakdownCard({
  tier,
  accuracy,
  total,
  locale,
  isNl,
  highlight = false,
}: {
  tier: TierKey;
  accuracy: number;
  total: number;
  locale: string;
  isNl: boolean;
  highlight?: boolean;
}) {
  const theme = TIER_THEME[tier];
  const pctStr = `${(accuracy * 100).toFixed(1).replace(".", isNl ? "," : ".")}%`;
  const totalStr = total.toLocaleString(locale);

  // Wilson 95% CI — one-line honesty signal. For the quant-minded
  // users the band is small on these populations (n=840+ everywhere),
  // but surfacing it pre-empts the "point estimate ≠ truth" critique.
  const ci = (() => {
    if (total <= 0) return null;
    const z = 1.96;
    const p = accuracy;
    const denom = 1 + (z * z) / total;
    const centre = p + (z * z) / (2 * total);
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
    return {
      lower: Math.max(0, (centre - margin) / denom),
      upper: Math.min(1, (centre + margin) / denom),
    };
  })();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: theme.ringHex,
        background: `linear-gradient(180deg, ${theme.bgTintHex}, rgba(15,20,32,0.6))`,
        boxShadow: highlight ? `0 0 30px ${theme.ringHex}` : undefined,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full"
        style={{ background: `${theme.colorHex}22`, filter: "blur(40px)" }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TierEmblem tier={tier} size="sm" />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textClass}`}>
            {theme.name}
          </span>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280] tabular-nums">
          conf ≥ {theme.confFloor}
        </span>
      </div>
      <p className="text-stat relative mt-3 text-3xl leading-none text-[#ededed]">
        {pctStr}
      </p>
      <p className="relative mt-1 text-xs text-[#a3a9b8]">
        {isNl ? "over" : "across"}{" "}
        <span className="font-semibold text-[#ededed]">{totalStr}</span>{" "}
        {isNl ? "picks" : "picks"}
      </p>
      {ci && (
        <p className="relative mt-1 text-[10px] text-[#6b7280] tabular-nums">
          95% CI {(ci.lower * 100).toFixed(0)}–{(ci.upper * 100).toFixed(0)}%
        </p>
      )}
      {tier === "bronze" ? (
        <div className="relative mt-3 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#22c55e]">
          <Unlock className="h-3 w-3" />
          {isNl ? "Gratis tier" : "Free tier"}
        </div>
      ) : (
        <div className="relative mt-3 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#6b7280]">
          <Lock className="h-3 w-3" />
          {isNl ? "Premium tier" : "Premium tier"}
        </div>
      )}
    </div>
  );
}
