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
  const { locale } = useTranslations();
  const isNl = locale === "nl";
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
      return new Date(iso).toLocaleDateString(isNl ? "nl-NL" : "en-GB", {
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

        {/* KPI strip — 5 stats: accuracy, total, best win, worst loss, avg conf */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            value={agg?.best_streak != null ? String(agg.best_streak) : "—"}
            label={isNl ? "Beste reeks" : "Best streak"}
            note={
              agg
                ? `${isNl ? "Huidig" : "Current"}: ${agg.current_streak}`
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
            label={isNl ? "Slechtste reeks" : "Worst loss streak"}
            note={
              isNl
                ? "Max opeenvolgende fout"
                : "Max consecutive misses"
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
            label={isNl ? "Gem. conf." : "Avg conf."}
            note={
              isNl ? "Gemiddelde model-score" : "Average model score"
            }
          />
        </div>

        {/* Methodology — uitleggen HOE backtest werkt zodat user het kan narekenen */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MethodCard
            icon={Lock}
            variant="blue"
            title={
              isNl
                ? "1. Vooraf vastgelegd"
                : "1. Locked in advance"
            }
            body={
              isNl
                ? "Elke pick is één rij in de database met tijdstempel vóór de aftrap. Point-in-time features (Elo, vorm, H2H, standings) — nooit na-datum data."
                : "Each pick is one row in the database with a timestamp before kickoff. Point-in-time features (Elo, form, H2H, standings) — never post-hoc data."
            }
          />
          <MethodCard
            icon={Trophy}
            variant="purple"
            title={
              isNl
                ? "2. Hoogste confidence per dag"
                : "2. Highest-confidence per day"
            }
            body={
              isNl
                ? "Onze v8.1 engine (XGBoost + gekalibreerde logistiek) rankt alle matches van een dag. De pick met de hoogste waarschijnlijkheid in een Gold-tier competitie wint."
                : "Our v8.1 engine (XGBoost + calibrated logistic) ranks every match for a day. The pick with the highest probability in a Gold-tier league wins."
            }
          />
          <MethodCard
            icon={FileCheck}
            variant="green"
            title={
              isNl
                ? "3. Achteraf beoordeeld"
                : "3. Graded after the fact"
            }
            body={
              isNl
                ? "Zodra de uitslag binnenkomt wordt elke pick gelabeld ✅ of ❌. De cijfers hierboven zijn een simpele teller: correct / beoordeeld."
                : "Once the result arrives each pick is labelled ✅ or ❌. The numbers above are a simple tally: correct / evaluated."
            }
          />
        </div>

        {/* Volledige picks-tabel — laat alle rijen zien die in de KPI's
            worden meegeteld zodat gebruikers zelf kunnen narekenen. */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0d13]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#ededed]">
                {isNl ? "Alle picks" : "All picks"}
                <span className="ml-2 text-[11px] font-normal text-[#6b7280]">
                  {displayRows == null
                    ? ""
                    : `${displayRows.length}${
                        rows && onlyGraded ? ` ${isNl ? "van" : "of"} ${rows.length}` : ""
                      }`}
                </span>
              </p>
              <p className="text-[11px] text-[#6b7280]">
                {isNl
                  ? "Ruwe data achter de KPI's hierboven. Scroll om alles te zien."
                  : "Raw data behind the KPIs above. Scroll to see everything."}
              </p>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-[#a3a9b8] select-none">
              <input
                type="checkbox"
                checked={onlyGraded}
                onChange={(e) => setOnlyGraded(e.target.checked)}
                className="h-3.5 w-3.5 accent-emerald-500"
              />
              {isNl ? "Alleen beoordeelde" : "Only graded"}
            </label>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 z-10 bg-[#0b0d13]/95 backdrop-blur">
                <tr className="border-b border-white/[0.08] text-left text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
                  <th className="px-3 py-2.5">{isNl ? "Datum" : "Date"}</th>
                  <th className="px-3 py-2.5">{isNl ? "Competitie" : "League"}</th>
                  <th className="px-3 py-2.5">{isNl ? "Wedstrijd" : "Match"}</th>
                  <th className="px-3 py-2.5 text-center">
                    {isNl ? "Pick" : "Pick"}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {isNl ? "Conf." : "Conf."}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {isNl ? "Odds" : "Odds"}
                  </th>
                  <th className="px-3 py-2.5 text-center">
                    {isNl ? "Uitslag" : "Score"}
                  </th>
                  <th className="px-3 py-2.5 text-center">
                    {isNl ? "Resultaat" : "Result"}
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
                      {isNl ? "Laden…" : "Loading…"}
                    </td>
                  </tr>
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-[#6b7280]"
                    >
                      {isNl ? "Geen picks in de selectie." : "No picks in selection."}
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
