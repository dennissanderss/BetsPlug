"use client";

/**
 * TrustFunnel — "honest funnel" transparency section for the homepage.
 *
 * Explains in plain language how we go from 55 000+ ingested matches
 * down to the ~1 650 Gold-tier graded predictions we actually advertise.
 * Designed to answer the visitor question: "you say 1 650 — but didn't
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
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

interface TrustData {
  goldAccuracy: number | null; // 0–1
  goldTotal: number | null;
  forecastsTotal: number | null; // /dashboard/metrics total_forecasts
  evaluatedTotal: number | null; // /dashboard/metrics evaluated_count
}

/** Manually reviewed fallback — update alongside potd-stats.ts refreshes. */
const FALLBACK = {
  matchesIngested: 55680,
  forecastsTotal: 3801,
  evaluatedTotal: 3763,
  goldTotal: 1650,
  goldAccuracy: 0.705,
  lastReviewed: "2026-04-18",
};

function useTrustData(): TrustData {
  const [data, setData] = useState<TrustData>({
    goldAccuracy: null,
    goldTotal: null,
    forecastsTotal: null,
    evaluatedTotal: null,
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    Promise.all([
      fetch(`${API}/trackrecord/summary?pick_tier=gold`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/dashboard/metrics`).then((r) => r.json()).catch(() => null),
    ]).then(([gold, dashboard]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = gold as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = dashboard as any;
      setData({
        goldAccuracy: typeof g?.accuracy === "number" && g.accuracy > 0 ? g.accuracy : null,
        goldTotal: typeof g?.total_predictions === "number" && g.total_predictions > 0 ? g.total_predictions : null,
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

  // Merge live with fallback — never render zero / dash in a marketing section
  const matchesIngested = FALLBACK.matchesIngested; // static (we don't expose a matches-count endpoint)
  const forecastsTotal = live.forecastsTotal ?? FALLBACK.forecastsTotal;
  const evaluatedTotal = live.evaluatedTotal ?? FALLBACK.evaluatedTotal;
  const goldTotal = live.goldTotal ?? FALLBACK.goldTotal;
  const goldAccuracy = live.goldAccuracy ?? FALLBACK.goldAccuracy;

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
        ? "Live ingeladen uit Football-Data en API-Football. Alle grote competities, meerdere seizoenen terug."
        : "Live ingested from Football-Data and API-Football. Every major league, multiple seasons back.",
      variant: "blue",
    },
    {
      icon: Brain,
      value: fmt(forecastsTotal),
      label: isNl
        ? "Voorspeld met ons huidige AI-model"
        : "Forecast with our current AI model",
      desc: isNl
        ? "Alleen voorspellingen gemaakt ná de v8.1 deploy (16 april 2026) — met de gecorrigeerde feature-pipeline. Oudere voorspellingen gebruikten een kapot model en zijn gearchiveerd, niet verstopt."
        : "Only predictions made after the v8.1 deploy (16 April 2026) — with the fixed feature pipeline. Older predictions used a broken model and are archived, not hidden.",
      variant: "purple",
    },
    {
      icon: ClipboardCheck,
      value: fmt(evaluatedTotal),
      label: isNl ? "Wedstrijden beoordeeld (uitslag bekend)" : "Matches graded (result in)",
      desc: isNl
        ? "Elke voorspelling wordt automatisch beoordeeld na het laatste fluitsignaal. Geen kersenpluk, geen stilletjes verwijderde verliezers."
        : "Every forecast is auto-graded after full time. No cherry-picking, no quietly removed losers.",
      variant: "green",
    },
    {
      icon: Crown,
      value: fmt(goldTotal),
      label: isNl ? "Daarvan in Gold-tier (betrouwbaarheid ≥ 70%)" : "Of those in Gold tier (confidence ≥ 70%)",
      desc: isNl
        ? "De meest betrouwbare slice: alleen voorspellingen waar ons model ten minste 70% vertrouwen had."
        : "The sharpest slice: only forecasts where the model had at least 70% confidence.",
      variant: "purple",
    },
    {
      icon: ShieldCheck,
      value: pct(goldAccuracy),
      label: isNl ? "Nauwkeurigheid — openbaar verifieerbaar" : "Accuracy — publicly verifiable",
      desc: isNl
        ? "Geen marketingbrochure. Download de CSV, tel ze zelf. De 3-weg voetbalvoorspelling (thuis/gelijkspel/uit) zit op ~50% als basisniveau — een willekeurige gok haalt ~37%."
        : "Not a marketing brochure. Download the CSV, count them yourself. Baseline 3-way match-outcome prediction sits at ~50% — a random guess hits ~37%.",
      variant: "green",
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
                <span className="gradient-text-green">{fmt(goldTotal)} eerlijke picks</span>
              </>
            ) : (
              <>
                From <span className="gradient-text-green">55 000+ matches</span> to{" "}
                <span className="gradient-text-green">{fmt(goldTotal)} honest picks</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "We tellen alleen wat ons huidige model echt heeft voorspeld. Geen opgepoetste all-time nummers, geen verborgen oude fouten. Dit is precies hoe de trechter werkt:"
              : "We only count what our current model actually predicted. No polished all-time numbers, no hidden old mistakes. Here's exactly how the funnel works:"}
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
