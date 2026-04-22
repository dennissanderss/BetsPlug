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
  Calendar,
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
  worst_losing_streak: number;
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
  const { t } = useTranslations();
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

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(t("botd.liveTracking.dateLocale"), {
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
            {t("botd.liveTracking.sectionLabel")}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
            {t("botd.liveTracking.titleLine1")}{" "}
            <span className="gradient-text-green">{t("botd.liveTracking.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">
            {t("botd.liveTracking.lede")}
          </p>
        </motion.div>

        {/* KPI strip — 5 stats: accuracy, total, best win, worst loss, avg conf */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            icon={Target}
            variant="green"
            value={
              !awaiting && agg
                ? `${agg.accuracy_pct.toFixed(1).replace(".", t("botd.liveTracking.decimalSep"))}%`
                : "—"
            }
            label={t("botd.liveTracking.kpiAccuracyLabel")}
            note={
              !awaiting && agg
                ? `${agg.correct} / ${agg.evaluated} ${t("botd.liveTracking.kpiAccuracyCorrect")}`
                : t("botd.liveTracking.kpiAccuracyEmpty")
            }
            awaiting={awaiting}
            awaitingLabel={t("botd.liveTracking.awaitingData")}
          />
          <KpiCard
            icon={Trophy}
            variant="purple"
            value={agg?.total_picks != null ? String(agg.total_picks) : "—"}
            label={t("botd.liveTracking.kpiTotalLabel")}
            note={
              agg
                ? `${agg.evaluated} ${t("botd.liveTracking.kpiTotalEvaluated")}`
                : "—"
            }
            awaiting={awaiting}
            awaitingLabel={t("botd.liveTracking.awaitingData")}
          />
          <KpiCard
            icon={Flame}
            variant="green"
            value={
              !awaiting && agg?.best_streak != null
                ? String(agg.best_streak)
                : "—"
            }
            label={t("botd.liveTracking.kpiBestStreakLabel")}
            note={
              !awaiting && agg
                ? `${t("botd.liveTracking.kpiBestStreakCurrent")}: ${agg.current_streak}`
                : t("botd.liveTracking.kpiBestStreakEmpty")
            }
            awaiting={awaiting}
            awaitingLabel={t("botd.liveTracking.awaitingData")}
          />
          <KpiCard
            icon={XCircle}
            variant="purple"
            value={
              !awaiting && agg?.worst_losing_streak != null
                ? String(agg.worst_losing_streak)
                : "—"
            }
            label={t("botd.liveTracking.kpiWorstStreakLabel")}
            note={t("botd.liveTracking.kpiWorstStreakNote")}
            awaiting={awaiting}
            awaitingLabel={t("botd.liveTracking.awaitingData")}
          />
          <KpiCard
            icon={ShieldCheck}
            variant="blue"
            value={
              agg?.avg_confidence != null && agg.total_picks > 0
                ? `${agg.avg_confidence.toFixed(1).replace(".", t("botd.liveTracking.decimalSep"))}%`
                : "—"
            }
            label={t("botd.liveTracking.kpiAvgConfLabel")}
            note={t("botd.liveTracking.kpiAvgConfNote")}
            awaiting={awaiting}
            awaitingLabel={t("botd.liveTracking.awaitingData")}
          />
        </div>

        {/* History table (only when at least one pick has been locked) */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0d13]">
          <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            <span className="col-span-2">{t("botd.liveTracking.colDate")}</span>
            <span className="col-span-4">{t("botd.liveTracking.colMatch")}</span>
            <span className="col-span-2">{t("botd.liveTracking.colLeague")}</span>
            <span className="col-span-2 text-center">
              {t("botd.liveTracking.colPickConf")}
            </span>
            <span className="col-span-1 text-center">
              {t("botd.liveTracking.colScore")}
            </span>
            <span className="col-span-1 text-center">
              {t("botd.liveTracking.colResult")}
            </span>
          </div>
          {!loaded ? (
            <div className="px-4 py-8 text-center text-xs text-[#6b7280]">
              {t("botd.liveTracking.loading")}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-[#6b7280]">
              {t("botd.liveTracking.emptyHistory")}
            </div>
          ) : (
            history.map((row, i) => {
              const matchDate = new Date(row.date);
              matchDate.setHours(0, 0, 0, 0);
              const isFuture = matchDate >= todayDate;
              return (
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
                  ) : isFuture ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-slate-500">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {t("botd.liveTracking.upcoming")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-500/80">
                      <Clock className="h-3 w-3 shrink-0" />
                      {t("botd.liveTracking.pending")}
                    </span>
                  )}
                </span>
              </div>
              );
            })
          )}
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[#6b7280]">
          {t("botd.liveTracking.footnote")}
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
  awaitingLabel,
}: {
  icon: typeof Target;
  variant: "green" | "purple" | "blue";
  value: string;
  label: string;
  note: string;
  awaiting?: boolean;
  awaitingLabel: string;
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
              {awaitingLabel}
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
