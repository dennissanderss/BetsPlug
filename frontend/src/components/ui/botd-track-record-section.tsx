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
  Target,
  ShieldCheck,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  FileCheck,
  Flame,
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
  worst_losing_streak: number;
  avg_confidence: number;
  last_updated: string;
}

interface BotdRow {
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
  const { t } = useTranslations();
  const [agg, setAgg] = useState<BotdAggregate | null>(null);
  const [rows, setRows] = useState<BotdRow[] | null>(null);
  const [onlyGraded, setOnlyGraded] = useState(true);

  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // Pull the full picks list (limit 1000) so the table below matches the
    // KPIs exactly — user asked "kan ik het narekenen?", en zonder de
    // volledige lijst is het antwoord nee.
    fetch(`${API}/bet-of-the-day/model-validation?limit=1000`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body) {
          setAgg(null);
          setRows(null);
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
          worst_losing_streak: s.worst_losing_streak ?? 0,
          avg_confidence: s.avg_confidence ?? 0,
          last_updated: "",
        });
        setRows(Array.isArray(body.picks) ? body.picks : []);
      })
      .catch(() => {
        setAgg(null);
        setRows(null);
      });
  }, []);

  const displayRows =
    rows == null
      ? null
      : onlyGraded
        ? rows.filter((r) => r.correct !== null)
        : rows;

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(t("botd.trackRecord.dateLocale"), {
        day: "2-digit",
        month: "short",
        year: "2-digit",
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
            {t("botd.trackRecord.sectionLabel")}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
            {t("botd.trackRecord.titleLine1")}{" "}
            <span className="gradient-text-green">{t("botd.trackRecord.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">
            {t("botd.trackRecord.lede")}
          </p>
        </motion.div>

        {/* KPI strip — 5 stats: accuracy, total, best win, worst loss, avg conf */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            icon={Target}
            variant="green"
            value={
              agg?.accuracy_pct != null && agg.evaluated > 0
                ? `${agg.accuracy_pct.toFixed(1).replace(".", t("botd.trackRecord.decimalSep"))}%`
                : "—"
            }
            label={t("botd.trackRecord.kpiAccuracyLabel")}
            note={
              agg && agg.evaluated > 0
                ? `${agg.correct} / ${agg.evaluated} ${t("botd.trackRecord.kpiAccuracyCorrect")}`
                : t("botd.trackRecord.kpiAccuracyEmpty")
            }
          />
          <KpiCard
            icon={Trophy}
            variant="purple"
            value={agg?.total_picks != null ? String(agg.total_picks) : "—"}
            label={t("botd.trackRecord.kpiTotalLabel")}
            note={
              agg
                ? `${agg.evaluated} ${t("botd.trackRecord.kpiTotalEvaluated")}`
                : "—"
            }
          />
          <KpiCard
            icon={Flame}
            variant="green"
            value={agg?.best_streak != null ? String(agg.best_streak) : "—"}
            label={t("botd.trackRecord.kpiBestStreakLabel")}
            note={
              agg
                ? `${t("botd.trackRecord.kpiBestStreakCurrent")}: ${agg.current_streak}`
                : "—"
            }
          />
          <KpiCard
            icon={XCircle}
            variant="purple"
            value={
              agg?.worst_losing_streak != null
                ? String(agg.worst_losing_streak)
                : "—"
            }
            label={t("botd.trackRecord.kpiWorstStreakLabel")}
            note={t("botd.trackRecord.kpiWorstStreakNote")}
          />
          <KpiCard
            icon={ShieldCheck}
            variant="blue"
            value={
              agg?.avg_confidence != null
                ? `${agg.avg_confidence.toFixed(1).replace(".", t("botd.trackRecord.decimalSep"))}%`
                : "—"
            }
            label={t("botd.trackRecord.kpiAvgConfLabel")}
            note={t("botd.trackRecord.kpiAvgConfNote")}
          />
        </div>

        {/* Methodology — uitleggen HOE backtest werkt zodat user het kan narekenen */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MethodCard
            icon={Lock}
            variant="blue"
            title={t("botd.trackRecord.methodLockedTitle")}
            body={t("botd.trackRecord.methodLockedBody")}
          />
          <MethodCard
            icon={Trophy}
            variant="purple"
            title={t("botd.trackRecord.methodConfidenceTitle")}
            body={t("botd.trackRecord.methodConfidenceBody")}
          />
          <MethodCard
            icon={FileCheck}
            variant="green"
            title={t("botd.trackRecord.methodGradedTitle")}
            body={t("botd.trackRecord.methodGradedBody")}
          />
        </div>

        {/* Volledige picks-tabel — laat alle rijen zien die in de KPI's
            worden meegeteld zodat gebruikers zelf kunnen narekenen. */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0d13]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#ededed]">
                {t("botd.trackRecord.tableAllPicks")}
                <span className="ml-2 text-[11px] font-normal text-[#6b7280]">
                  {displayRows == null
                    ? ""
                    : `${displayRows.length}${
                        rows && onlyGraded ? ` ${t("botd.trackRecord.tableOf")} ${rows.length}` : ""
                      }`}
                </span>
              </p>
              <p className="text-[11px] text-[#6b7280]">
                {t("botd.trackRecord.tableRawDataNote")}
              </p>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-[#a3a9b8] select-none">
              <input
                type="checkbox"
                checked={onlyGraded}
                onChange={(e) => setOnlyGraded(e.target.checked)}
                className="h-3.5 w-3.5 accent-emerald-500"
              />
              {t("botd.trackRecord.tableOnlyGraded")}
            </label>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 z-10 bg-[#0b0d13]/95 backdrop-blur">
                <tr className="border-b border-white/[0.08] text-left text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
                  <th className="px-3 py-2.5">{t("botd.trackRecord.colDate")}</th>
                  <th className="px-3 py-2.5">{t("botd.trackRecord.colLeague")}</th>
                  <th className="px-3 py-2.5">{t("botd.trackRecord.colMatch")}</th>
                  <th className="px-3 py-2.5 text-center">
                    {t("botd.trackRecord.colPick")}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {t("botd.trackRecord.colConf")}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {t("botd.trackRecord.colOdds")}
                  </th>
                  <th className="px-3 py-2.5 text-center">
                    {t("botd.trackRecord.colScore")}
                  </th>
                  <th className="px-3 py-2.5 text-center">
                    {t("botd.trackRecord.colResult")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows == null ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-[#6b7280]"
                    >
                      {t("botd.trackRecord.loading")}
                    </td>
                  </tr>
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-[#6b7280]"
                    >
                      {t("botd.trackRecord.tableEmpty")}
                    </td>
                  </tr>
                ) : (
                  displayRows.map((r, i) => (
                    <tr
                      key={`${r.date}-${i}`}
                      className="border-b border-white/[0.04]"
                      style={{
                        borderLeft: `3px solid ${
                          r.correct === true
                            ? "#10b981"
                            : r.correct === false
                              ? "#ef4444"
                              : "#334155"
                        }`,
                      }}
                    >
                      <td className="px-3 py-2 font-mono tabular-nums text-[#a3a9b8]">
                        {fmtDate(r.date)}
                      </td>
                      <td className="px-3 py-2 text-[#a3a9b8] truncate max-w-[140px]">
                        {r.league}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#ededed] truncate max-w-[260px]">
                        {r.home_team} <span className="text-[#6b7280]">vs</span>{" "}
                        {r.away_team}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded-md border border-emerald-400/20 bg-emerald-500/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                          {r.prediction}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[#ededed]">
                        {r.confidence.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[#a3a9b8]">
                        {r.odds_used != null ? r.odds_used.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-[#ededed]">
                        {r.home_score != null && r.away_score != null
                          ? `${r.home_score}-${r.away_score}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center">
                          {r.correct === true ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : r.correct === false ? (
                            <XCircle className="h-4 w-4 text-red-400" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verify-yourself panel */}
        <div className="mt-6 card-neon card-neon-green rounded-2xl">
          <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-8">
            <div className="shrink-0">
              <HexBadge variant="green" size="md">
                <Download className="h-5 w-5" />
              </HexBadge>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#ededed]">
                {t("botd.trackRecord.verifyTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">
                {t("botd.trackRecord.verifyBody")}
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/bet-of-the-day/export.csv`}
              className="btn-primary inline-flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
            >
              <Download className="h-4 w-4" />
              {t("botd.trackRecord.downloadCsv")}
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#6b7280]">
          {t("botd.trackRecord.footnote")}
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

function MethodCard({
  icon: Icon,
  variant,
  title,
  body,
}: {
  icon: typeof Trophy;
  variant: "green" | "purple" | "blue";
  title: string;
  body: string;
}) {
  return (
    <div className={`card-neon card-neon-${variant} rounded-2xl`}>
      <div className="relative flex flex-col gap-3 p-5">
        <HexBadge variant={variant} size="sm">
          <Icon className="h-4 w-4" />
        </HexBadge>
        <p className="text-sm font-semibold text-[#ededed]">{title}</p>
        <p className="text-[12px] leading-relaxed text-[#a3a9b8]">{body}</p>
      </div>
    </div>
  );
}

export default BotdTrackRecordSection;
