"use client";

/**
 * BotdLiveTrackingSection — strict "live meting" surface for the
 * Pick-of-the-Day feature, fetched from /bet-of-the-day/live-tracking.
 *
 * Only counts predictions produced by the real-time scheduler that
 * were locked strictly before kickoff and created on/after the
 * LIVE_BOTD_START cut-off. Starts empty and grows as matches are
 * graded by the evaluator cron — the counterpart to
 * LiveMeasurementSection but scoped to the daily BOTD pick.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Target,
  Trophy,
  Flame,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { useTranslations } from "@/i18n/locale-provider";

interface BotdSummary {
  total_picks: number;
  evaluated: number;
  correct: number;
  accuracy_pct: number;
  current_streak: number;
  best_streak: number;
  avg_confidence: number;
}

interface BotdHistoryItem {
  date: string;
  home_team: string;
  away_team: string;
  league: string;
  prediction: string;
  confidence: number;
  correct: boolean | null;
  home_score: number | null;
  away_score: number | null;
}

interface BotdLiveResponse {
  summary: BotdSummary;
  picks: BotdHistoryItem[];
}

export function BotdLiveTrackingSection() {
  const { locale } = useTranslations();
  const isNl = locale === "nl";
  const [data, setData] = useState<BotdLiveResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/live-tracking?limit=15`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        setData(body ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const agg = data?.summary;
  const history = data?.picks ?? null;
  const awaiting = !agg || (agg.evaluated ?? 0) === 0;

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(isNl ? "nl-NL" : "en-GB", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <section
      id="botd-live"
      className="relative overflow-hidden py-20 md:py-28 scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full"
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
            {isNl
              ? "4 · Pick van de Dag — live meting"
              : "4 · Pick of the Day — live measurement"}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
            {isNl ? (
              <>
                Alleen echte pre-match picks{" "}
                <span className="gradient-text-green">sinds 18 april 2026</span>
              </>
            ) : (
              <>
                Only real pre-match picks{" "}
                <span className="gradient-text-green">since 18 April 2026</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "De Pick van de Dag, maar alleen wanneer hij door de scheduler voor de aftrap werd vastgezet en daarna werd beoordeeld. Geen backtest, geen retroactieve rijen. Deze meting begint klein en groeit elke dag waarop een BOTD-wedstrijd wordt gespeeld."
              : "The Pick of the Day, but only when it was locked before kickoff by the live scheduler and graded afterwards. No backtest, no retroactive rows. This measurement starts small and grows every day a BOTD fixture is played."}
          </p>
        </motion.div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Target}
            variant="green"
            value={
              !awaiting && agg
                ? `${agg.accuracy_pct.toFixed(1).replace(".", isNl ? "," : ".")}%`
                : "—"
            }
            label={isNl ? "Nauwkeurigheid" : "Accuracy"}
            note={
              !awaiting && agg
                ? `${agg.correct} / ${agg.evaluated} ${isNl ? "correct" : "correct"}`
                : isNl
                  ? "Wacht op eerste beoordeelde BOTD"
                  : "Awaiting first graded BOTD"
            }
            awaiting={awaiting}
            isNl={isNl}
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
            awaiting={awaiting}
            isNl={isNl}
          />
          <KpiCard
            icon={Flame}
            variant="green"
            value={
              !awaiting && agg?.current_streak != null
                ? String(agg.current_streak)
                : "—"
            }
            label={isNl ? "Huidige reeks" : "Current streak"}
            note={
              !awaiting && agg
                ? `${isNl ? "Beste" : "Best"}: ${agg.best_streak}`
                : isNl
                  ? "Volgt zodra data binnen is"
                  : "Starts once data arrives"
            }
            awaiting={awaiting}
            isNl={isNl}
          />
          <KpiCard
            icon={ShieldCheck}
            variant="blue"
            value={
              agg?.avg_confidence != null && agg.total_picks > 0
                ? `${agg.avg_confidence.toFixed(1).replace(".", isNl ? "," : ".")}%`
                : "—"
            }
            label={isNl ? "Gem. betrouwbaarheid" : "Avg confidence"}
            note={
              isNl ? "Gemiddelde modelscore" : "Average model score"
            }
            awaiting={awaiting}
            isNl={isNl}
          />
        </div>

        {/* History table (only when at least one pick has been locked) */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0d13]">
          <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            <span className="col-span-2">{isNl ? "Datum" : "Date"}</span>
            <span className="col-span-4">{isNl ? "Wedstrijd" : "Match"}</span>
            <span className="col-span-2">{isNl ? "Competitie" : "League"}</span>
            <span className="col-span-2 text-center">
              {isNl ? "Pick · conf." : "Pick · conf."}
            </span>
            <span className="col-span-1 text-center">
              {isNl ? "Uitslag" : "Score"}
            </span>
            <span className="col-span-1 text-center">
              {isNl ? "Resultaat" : "Result"}
            </span>
          </div>
          {!loaded ? (
            <div className="px-4 py-8 text-center text-xs text-[#6b7280]">
              {isNl ? "Laden…" : "Loading…"}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-[#6b7280]">
              {isNl
                ? "Nog geen live-gelogde BOTD-picks. Eerste rij verschijnt zodra een BOTD-wedstrijd is gespeeld."
                : "No live-logged BOTD picks yet. The first row appears as soon as a BOTD fixture has been played."}
            </div>
          ) : (
            history.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-12 items-center gap-2 border-b border-white/[0.04] px-4 py-3 text-xs last:border-b-0"
                style={{
                  borderLeft: `3px solid ${
                    row.correct === true
                      ? "#10b981"
                      : row.correct === false
                        ? "#ef4444"
                        : "#334155"
                  }`,
                }}
              >
                <span className="col-span-2 tabular-nums text-[#a3a9b8]">
                  {fmtDate(row.date)}
                </span>
                <span className="col-span-4 truncate font-semibold text-[#ededed]">
                  {row.home_team} vs {row.away_team}
                </span>
                <span className="col-span-2 truncate text-[#a3a9b8]">
                  {row.league}
                </span>
                <span className="col-span-2 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-500/[0.06] px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    {row.prediction} · {row.confidence.toFixed(0)}%
                  </span>
                </span>
                <span className="col-span-1 text-center tabular-nums text-[#ededed]">
                  {row.home_score != null && row.away_score != null
                    ? `${row.home_score}-${row.away_score}`
                    : "—"}
                </span>
                <span className="col-span-1 flex justify-center">
                  {row.correct === true ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : row.correct === false ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-500" />
                  )}
                </span>
              </div>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[#6b7280]">
          {isNl
            ? "Gebruik deze sectie om te checken hoe de BOTD het doet op wedstrijden waarvoor de pick écht vóór de aftrap werd vastgezet. Voor de bredere backtest, zie sectie 3 hierboven."
            : "Use this section to judge how BOTD performs on matches where the pick was truly locked before kickoff. For the broader backtest, see section 3 above."}
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
  awaiting,
  isNl,
}: {
  icon: typeof Target;
  variant: "green" | "purple" | "blue";
  value: string;
  label: string;
  note: string;
  awaiting?: boolean;
  isNl: boolean;
}) {
  return (
    <div className={`card-neon card-neon-${variant} rounded-2xl`}>
      <div className="relative p-6">
        <div className="mb-4 flex items-center justify-between">
          <HexBadge variant={variant} size="md">
            <Icon className="h-5 w-5" />
          </HexBadge>
          {awaiting ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold text-slate-400">
              <Clock className="h-2.5 w-2.5" />
              {isNl ? "Wacht op data" : "Awaiting data"}
            </span>
          ) : null}
        </div>
        <div className="text-stat text-3xl text-[#ededed] sm:text-4xl">
          {value}
        </div>
        <p className="mt-2 text-sm font-semibold text-[#ededed]">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">{note}</p>
      </div>
    </div>
  );
}

export default BotdLiveTrackingSection;
