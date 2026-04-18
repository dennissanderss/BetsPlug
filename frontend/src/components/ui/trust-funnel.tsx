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
import { Database, Brain, ClipboardCheck, Crown, ShieldCheck, ArrowRight } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { TierEmblem } from "@/components/noct/tier-emblem";
import { TIER_THEME, type TierKey } from "@/components/noct/tier-theme";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

interface TierStat {
  accuracy: number | null;
  total: number | null;
}

interface TrustData {
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
  silver: { total: 1138, accuracy: 0.607 },
  gold: { total: 1650, accuracy: 0.705 },
  platinum: { total: 840, accuracy: 0.823 },
  lastReviewed: "2026-04-18",
};

function useTrustData(): TrustData {
  const [data, setData] = useState<TrustData>({
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
      fetch(`${API}/trackrecord/summary?pick_tier=silver`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/trackrecord/summary?pick_tier=gold`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/trackrecord/summary?pick_tier=platinum`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/dashboard/metrics`).then((r) => r.json()).catch(() => null),
    ]).then(([silver, gold, platinum, dashboard]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = dashboard as any;
      setData({
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
  const matchesIngested = FALLBACK.matchesIngested; // static (we don't expose a matches-count endpoint)
  const forecastsTotal = live.forecastsTotal ?? FALLBACK.forecastsTotal;
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
  const premiumTotal = silver.total + gold.total + platinum.total;

  const fmt = (n: number) => n.toLocaleString(locale);
  const pct = (n: number) =>
    `${(n * 100).toFixed(1).replace(".", isNl ? "," : ".")}%`;

  const steps: {
    icon: typeof Database;
    value: string;
    label: string;
    desc: string;
    variant: "green" | "blue" | "purple";
  }[] = [
    {
      icon: Database,
      value: `${fmt(matchesIngested)}+`,
      label: isNl ? "Gespeelde wedstrijden in onze database" : "Played matches in our database",
      desc: isNl
        ? "Verzameld via betaalde data-licenties. Alle grote competities, meerdere seizoenen terug."
        : "Collected through paid data licences. Every major league, multiple seasons back.",
      variant: "blue",
    },
    {
      icon: Brain,
      value: fmt(forecastsTotal),
      label: isNl
        ? "Voorspeld met ons huidige AI-model"
        : "Forecast with our current AI model",
      desc: isNl
        ? "Alleen voorspellingen van het model dat nu live staat. Oudere modelversies zijn gearchiveerd, niet verstopt, maar ook niet meegeteld in onze cijfers."
        : "Only predictions from the model that's currently live. Older model versions are archived, not hidden, but not counted in our stats either.",
      variant: "purple",
    },
    {
      icon: ClipboardCheck,
      value: fmt(evaluatedTotal),
      label: isNl ? "Wedstrijden beoordeeld (uitslag bekend)" : "Matches graded (result in)",
      desc: isNl
        ? "Elke voorspelling wordt automatisch beoordeeld zodra de wedstrijd afgelopen is. Geen kersenpluk, geen stilletjes verwijderde verliezers."
        : "Every forecast is automatically graded the moment the match ends. No cherry-picking, no quietly removed losers.",
      variant: "green",
    },
    {
      icon: Crown,
      value: fmt(premiumTotal),
      label: isNl
        ? "Verdeeld over drie premium tiers"
        : "Split across three premium tiers",
      desc: isNl
        ? "Elke voorspelling krijgt een tier op basis van hoe zeker het model is. Hoe hoger de drempel, hoe scherper de cijfers."
        : "Every forecast is tagged with a tier based on model confidence. The higher the threshold, the sharper the numbers.",
      variant: "purple",
    },
  ];

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
          className="mb-14 text-center"
        >
          <span className="section-label mx-auto">
            <ShieldCheck className="h-3 w-3" />
            {isNl ? "Hoe we aan onze cijfers komen" : "How we got to our numbers"}
          </span>
          <h2 className="text-heading mt-5 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {isNl ? (
              <>
                Van <span className="gradient-text-green">55.000+ wedstrijden</span> naar{" "}
                <span className="gradient-text-green">{fmt(premiumTotal)} eerlijke picks</span>
              </>
            ) : (
              <>
                From <span className="gradient-text-green">55 000+ matches</span> to{" "}
                <span className="gradient-text-green">{fmt(premiumTotal)} honest picks</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "We tellen alleen voorspellingen van ons huidige AI-model. Geen opgepoetste all-time cijfers, geen verborgen fouten. Zo komen we stap voor stap bij onze nauwkeurigheid:"
              : "We only count predictions from the AI model that's currently live. No polished all-time numbers, no hidden mistakes. Here's how we get to our accuracy, step by step:"}
          </p>
        </motion.div>

        {/* Funnel steps */}
        <div className="relative space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="relative"
              >
                <div
                  className={`card-neon card-neon-${step.variant} relative overflow-hidden rounded-2xl`}
                >
                  <div className="relative grid items-center gap-4 p-6 sm:grid-cols-[auto_auto_1fr] sm:gap-6">
                    {/* Icon */}
                    <HexBadge variant={step.variant} size="md">
                      <Icon className="h-5 w-5" />
                    </HexBadge>

                    {/* Big number */}
                    <div className="min-w-[160px]">
                      <p className="text-stat text-4xl leading-none text-[#ededed] sm:text-5xl">
                        {step.value}
                      </p>
                    </div>

                    {/* Label + description */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase tracking-wider text-[#ededed] sm:text-base">
                        {step.label}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connector arrow between steps */}
                {!isLast && (
                  <div
                    aria-hidden
                    className="pointer-events-none relative -mb-2 -mt-1 flex justify-center"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-[#0f1420]">
                      <ArrowRight className="h-3.5 w-3.5 rotate-90 text-[#4ade80]" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Tier-breakdown card, shows all 3 paid tiers side by side so
            visitors don't think we only measure 'Gold'. */}
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
          <div className="grid gap-3 sm:grid-cols-3">
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
              ? "Niet onze woorden. Elke voorspelling staat met tijdstempel online voordat de wedstrijd begint en wordt na afloop automatisch beoordeeld."
              : "Not our words. Every prediction is timestamped online before kickoff and auto-graded after full time."}
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
            {isNl ? "Bekijk elke voorspelling zelf" : "Inspect every prediction yourself"}
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
    </div>
  );
}
