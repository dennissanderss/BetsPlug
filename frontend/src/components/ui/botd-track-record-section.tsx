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
  CheckCircle2,
  XCircle,
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
  odds_used: number | null;
}

export function BotdTrackRecordSection() {
  const { locale } = useTranslations();
  const isNl = locale === "nl";
  const [agg, setAgg] = useState<BotdAggregate | null>(null);
  const [history, setHistory] = useState<BotdHistoryItem[] | null>(null);

  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // Integriteit-sprint: this section shows collected data (model
    // validation) — the live-measurement variant lives in
    // LiveMeasurementSection. The model-validation endpoint returns
    // the summary + row list in a single call.
    // Pull extra rows so the post-filter list (graded only) still
    // has enough history to look populated. The backend's `picks`
    // array is ordered newest-first and can include unfinished
    // fixtures (correct === null) because _build_botd_section does
    // not require_pre_match. We strip those here so a section
    // titled "historical backtest" never shows "Pending" rows for
    // matches that have not been played yet.
    fetch(`${API}/bet-of-the-day/model-validation?limit=50`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body) {
          setAgg(null);
          setHistory([]);
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
        const gradedOnly: BotdHistoryItem[] = (body.picks ?? []).filter(
          (p: BotdHistoryItem) => p.correct === true || p.correct === false
        );
        setHistory(gradedOnly.slice(0, 15));
      })
      .catch(() => {
        setAgg(null);
        setHistory([]);
      });
  }, []);

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
          <div className="mt-4">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/bet-of-the-day/export.csv`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15"
            >
              <Download className="h-3.5 w-3.5" />
              {isNl ? "Download CSV (Pick of the Day)" : "Download CSV (Pick of the Day)"}
            </a>
          </div>
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
            icon={Flame}
            variant="green"
            value={agg?.current_streak != null ? String(agg.current_streak) : "—"}
            label={isNl ? "Huidige reeks" : "Current streak"}
            note={
              agg
                ? `${isNl ? "Beste" : "Best"}: ${agg.best_streak}`
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

        {/* History table */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0d13]">
          <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            <span className="col-span-2">{isNl ? "Datum" : "Date"}</span>
            <span className="col-span-4">{isNl ? "Wedstrijd" : "Match"}</span>
            <span className="col-span-2">{isNl ? "Competitie" : "League"}</span>
            <span className="col-span-2 text-center">{isNl ? "Pick · conf." : "Pick · conf."}</span>
            <span className="col-span-1 text-center">{isNl ? "Uitslag" : "Score"}</span>
            <span className="col-span-1 text-center">{isNl ? "Resultaat" : "Result"}</span>
          </div>
          {history == null ? (
            <div className="px-4 py-8 text-center text-xs text-[#6b7280]">
              {isNl ? "Laden..." : "Loading..."}
            </div>
          ) : history.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#6b7280]">
              {isNl ? "Nog geen picks beschikbaar." : "No picks available yet."}
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
                <span className="col-span-4 font-semibold text-[#ededed] truncate">
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
                    <span className="text-[10px] text-[#6b7280]">
                      {isNl ? "Pending" : "Pending"}
                    </span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-[#6b7280]">
          {isNl
            ? "Inclusief voor Gold en Platinum. Elke pick staat met tijdstempel online voor aftrap."
            : "Included on Gold and Platinum. Every pick is timestamped online before kick-off."}
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
