"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Trophy, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import type { Fixture, FixturesResponse } from "@/types/api";

interface YesterdayResultsStripProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
}

function pickLabel(prediction: Fixture["prediction"]): string {
  if (!prediction) return "—";
  const { home_win_prob, draw_prob, away_win_prob } = prediction;
  if (home_win_prob >= away_win_prob && home_win_prob >= (draw_prob ?? 0)) return "1";
  if ((draw_prob ?? 0) >= away_win_prob) return "X";
  return "2";
}

function isCorrect(fixture: Fixture): boolean | null {
  if (!fixture.result || !fixture.prediction) return null;
  const pick = pickLabel(fixture.prediction);
  const winner = fixture.result.winner;
  if (pick === "1" && winner === "home") return true;
  if (pick === "X" && winner === "draw") return true;
  if (pick === "2" && winner === "away") return true;
  return false;
}

function ResultRow({ fixture }: { fixture: Fixture }) {
  const correct = isCorrect(fixture);
  const pick = pickLabel(fixture.prediction);
  const borderColor = correct === true ? "border-l-emerald-500" : correct === false ? "border-l-red-500" : "border-l-slate-700";

  return (
    <div className={`flex items-center gap-3 border-l-4 ${borderColor} rounded-r-lg px-3 py-2 transition-colors hover:bg-white/[0.04]`}>
      {/* Home team */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {fixture.home_team_logo && (
          <Image src={fixture.home_team_logo} alt="" width={16} height={16} className="rounded-full shrink-0" />
        )}
        <span className="text-xs font-medium text-slate-200 truncate">
          {fixture.home_team_name}
        </span>
      </div>

      {/* Score */}
      <span className="text-sm font-bold tabular-nums text-white shrink-0">
        {fixture.result?.home_score ?? 0} - {fixture.result?.away_score ?? 0}
      </span>

      {/* Away team */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <span className="text-xs font-medium text-slate-200 truncate text-right">
          {fixture.away_team_name}
        </span>
        {fixture.away_team_logo && (
          <Image src={fixture.away_team_logo} alt="" width={16} height={16} className="rounded-full shrink-0" />
        )}
      </div>

      {/* Our pick */}
      <span className="w-6 shrink-0 rounded bg-white/[0.06] py-0.5 text-center text-[10px] font-bold text-slate-400">
        {pick}
      </span>

      {/* Result icon */}
      <div className="w-5 shrink-0">
        {correct === true && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {correct === false && <XCircle className="h-4 w-4 text-red-400" />}
        {correct === null && <span className="text-[10px] text-slate-600">—</span>}
      </div>
    </div>
  );
}

export function YesterdayResultsStrip({ data, isLoading }: YesterdayResultsStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const fixtures = (data?.fixtures ?? []).filter((f) => f.status === "finished");
  const withPredictions = fixtures.filter((f) => f.prediction != null);
  const correctCount = withPredictions.filter((f) => isCorrect(f) === true).length;
  const total = withPredictions.length;
  const winRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">{t("dash.yesterdayResults")}</h2>
          {total > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-400">
              {correctCount}/{total} — {winRate}%
            </span>
          )}
        </div>
        <Link
          href={lHref("/results")}
          className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-emerald-400"
        >
          {t("dash.viewAll")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            {t("dash.noResultsYesterday")}
          </p>
        ) : (
          <div className="space-y-1">
            {fixtures.slice(0, 8).map((fixture) => (
              <ResultRow key={fixture.id} fixture={fixture} />
            ))}
            {fixtures.length > 8 && (
              <Link
                href={lHref("/results")}
                className="mt-2 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-400"
              >
                {t("dash.viewAllResults")} ({fixtures.length})
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
