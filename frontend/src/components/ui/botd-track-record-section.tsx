"use client";

/**
 * BotdTrackRecordSection — Pick-of-the-Day specific track record surface
 * on the public /track-record page. Answers the question "what's the
 * accuracy of *that one* daily pick you advertise on the Gold + Platinum
 * tier cards?" — previously only visible to authenticated /bet-of-the-day
 * visitors.
 *
 * Backend sources (both anonymous-accessible):
 *   - GET /api/bet-of-the-day/track-record  → aggregate KPIs
 *   - GET /api/bet-of-the-day/history       → row list for the table
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Flame,
  Target,
  ShieldCheck,
  Download,
} from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { useTranslations } from "@/i18n/locale-provider";

interface BotdAggregate {
  total_picks: number;
  evaluated: number;
  correct: number;
  accuracy_pct: number;
  current_streak: number;
  best_streak: number;
  avg_confidence: number;
  last_updated: string;
}

export function BotdTrackRecordSection() {
  const { locale } = useTranslations();
  const isNl = locale === "nl";
  const [agg, setAgg] = useState<BotdAggregate | null>(null);

  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // Only the aggregate is consumed here — the row list was removed
    // because showing 15 of 414 picks made users ask "where is the
    // rest?". The CSV download below exposes the full dataset so the
    // four KPI numbers can be recomputed independently.
    fetch(`${API}/bet-of-the-day/model-validation?limit=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body) {
          setAgg(null);
          return;
        }
        const s = body.summary ?? {};
        setAgg({
          total_picks: s.total_picks ?? 0,
          evaluated: s.evaluated ?? 0,
          correct: s.correct ?? 0,
          accuracy_pct: s.accuracy_pct ?? 0,
          current_streak: s.current_streak ?? 0,
          best_streak: s.best_streak ?? 0,
          avg_confidence: s.avg_confidence ?? 0,
          last_updated: "",
        });
      })
      .catch(() => setAgg(null));
  }, []);

  return (
    <section
      id="model-validation"
      className="relative overflow-hidden py-20 md:py-28 scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full"
        style={{
          background: "hsl(var(--accent-green) / 0.1)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[380px] w-[380px] rounded-full"
        style={{
          background: "hsl(var(--accent-blue) / 0.08)",
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
            <ShieldCheck className="h-3 w-3" />
            {isNl
              ? "3 · Pick van de Dag — historische backtest"
              : "3 · Pick of the Day — historical backtest"}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
            {isNl ? (
              <>
                De dagelijkse topper, teruggerekend op{" "}
                <span className="gradient-text-green">recent afgelopen wedstrijden</span>
              </>
            ) : (
              <>
                The daily best pick, replayed on{" "}
                <span className="gradient-text-green">recently finished matches</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "Onze BOTD-methode (de hoogst-scorende pick per dag) toegepast op matches die inmiddels gespeeld zijn. Dit is backtest-data — een eerlijke proxy voor hoe de feature het in het verleden zou hebben gedaan. De strikt pre-match live versie staat in sectie 4 hieronder."
              : "Our BOTD method (the highest-confidence pick per day) applied to matches that have since finished. This is backtest data — an honest proxy for how the feature would have performed historically. The strict pre-match live version lives in section 4 below."}
          </p>
        </motion.div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Target}
            variant="green"
            value={
              agg?.accuracy_pct != null && agg.evaluated > 0
                ? `${agg.accuracy_pct.toFixed(1).replace(".", isNl ? "," : ".")}%`
                : "—"
            }
            label={isNl ? "Nauwkeurigheid" : "Accuracy"}
            note={
              agg && agg.evaluated > 0
                ? `${agg.correct} / ${agg.evaluated} ${isNl ? "correct" : "correct"}`
                : isNl
                ? "Wacht op eerste uitslagen"
                : "Awaiting first results"
            }
          />
          <KpiCard
            icon={Trophy}
            variant="purple"
            value={agg?.total_picks != null ? String(agg.total_picks) : "—"}
            label={isNl ? "Totaal picks" : "Total picks"}
            note={
              agg
                ? `${agg.evaluated} ${isNl ? "beoordeeld" : "evaluated"}`
                : "—"
            }
          />
          <KpiCard
            icon={ShieldCheck}
            variant="blue"
            value={
              agg?.avg_confidence != null
                ? `${agg.avg_confidence.toFixed(1).replace(".", isNl ? "," : ".")}%`
                : "—"
            }
            label={isNl ? "Gem. betrouwbaarheid" : "Avg confidence"}
            note={
              isNl ? "Gemiddelde model-score" : "Average model score"
            }
          />
        </div>

        {/* Verify-yourself panel — replaces the inline row list.
            Showing 15 graded rows out of 414 was misleading (users
            asked "waar is de rest?"), so we surface the full dataset
            as a single CSV download with a plain-language invitation
            to recompute the aggregate numbers. All four KPIs above
            are derived from the same file. */}
        <div className="mt-10 card-neon card-neon-green rounded-2xl">
          <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-8">
            <div className="shrink-0">
              <HexBadge variant="green" size="md">
                <Download className="h-5 w-5" />
              </HexBadge>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#ededed]">
                {isNl
                  ? "Wil je de volledige dataset zelf controleren?"
                  : "Want to verify the full dataset yourself?"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">
                {isNl
                  ? "De CSV bevat alle picks die in de vier KPI's hierboven worden meegeteld — met datum, wedstrijd, competitie, pick, betrouwbaarheid, uitslag en resultaat. Herbereken de nauwkeurigheid gerust zelf in Excel of Sheets."
                  : "The CSV contains every pick counted in the four KPIs above — with date, match, league, pick, confidence, score and outcome. Feel free to recompute the accuracy yourself in Excel or Sheets."}
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/bet-of-the-day/export.csv`}
              className="btn-primary inline-flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
            >
              <Download className="h-4 w-4" />
              {isNl ? "Download CSV" : "Download CSV"}
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#6b7280]">
          {isNl
            ? "Pick van de Dag is een feature voor Gold- en Platinum-abonnees — deze cijfers laten zien hoe die feature historisch zou hebben gepresteerd. Elke pick wordt in productie met tijdstempel vastgezet vóór de aftrap."
            : "Pick of the Day is a feature for Gold and Platinum subscribers — these numbers show how the feature would have performed historically. In production each pick is timestamped and locked before kick-off."}
        </p>
      </div>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  variant,
  value,
  label,
  note,
}: {
  icon: typeof Trophy;
  variant: "green" | "purple" | "blue";
  value: string;
  label: string;
  note: string;
}) {
  return (
    <div className={`card-neon card-neon-${variant} rounded-2xl`}>
      <div className="relative p-5">
        <HexBadge variant={variant} size="md" className="mb-3">
          <Icon className="h-5 w-5" />
        </HexBadge>
        <div className="text-stat text-3xl leading-none text-[#ededed]">
          {value}
        </div>
        <p className="mt-2 text-sm font-semibold text-[#ededed]">{label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#a3a9b8]">
          {note}
        </p>
      </div>
    </div>
  );
}

export default BotdTrackRecordSection;
