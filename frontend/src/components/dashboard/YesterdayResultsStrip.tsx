"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Pill, DataChip } from "@/components/noct/pill";
import type { Fixture, FixturesResponse, PickTierSlug } from "@/types/api";
import { derivePickSide, pickLabel as computePickLabel } from "@/lib/prediction-pick";

// Tier initial + colour used as a compact per-row badge so users can see
// at a glance which tier each yesterday-pick belonged to.
const TIER_CHIP: Record<
  PickTierSlug,
  { letter: string; className: string; title: string }
> = {
  free: {
    letter: "F",
    className: "bg-[#b87333]/15 text-[#e8a864] border-[#b87333]/30",
    title: "Free / Bronze tier",
  },
  silver: {
    letter: "S",
    className: "bg-[#c0c0c0]/15 text-[#e5e4e2] border-[#c0c0c0]/30",
    title: "Silver tier",
  },
  gold: {
    letter: "G",
    className: "bg-[#d4af37]/15 text-[#f5d67a] border-[#d4af37]/30",
    title: "Gold tier",
  },
  platinum: {
    letter: "P",
    className: "bg-[#a8d8ea]/15 text-[#d9f0ff] border-[#a8d8ea]/35",
    title: "Platinum tier",
  },
};

interface YesterdayResultsStripProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
}

function pickLabel(prediction: Fixture["prediction"]): string {
  return computePickLabel(prediction);
}

function isCorrect(fixture: Fixture): boolean | null {
  if (!fixture.result || !fixture.prediction) return null;
  const side = derivePickSide(fixture.prediction);
  if (!side) return null;
  return side === fixture.result.winner;
}

function ResultRow({ fixture }: { fixture: Fixture }) {
  const correct = isCorrect(fixture);
  const pick = pickLabel(fixture.prediction);
  const tierSlug = fixture.prediction?.pick_tier ?? null;
  const tierChip = tierSlug ? TIER_CHIP[tierSlug] : null;

  const wrapperClass =
    correct === true
      ? "card-neon card-neon-green"
      : correct === false
        ? "card-neon"
        : "glass-panel";

  const redTint: React.CSSProperties =
    correct === false ? { boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.18)" } : {};

  return (
    <div className={`${wrapperClass} px-3 py-2`} style={redTint}>
      <div className="relative flex items-center gap-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} size={16} />
          <span className="text-xs font-semibold text-[#ededed] truncate">
            {fixture.home_team_name}
          </span>
        </div>

        <span className="text-sm font-bold tabular-nums text-[#ededed] shrink-0">
          {fixture.result?.home_score ?? 0} - {fixture.result?.away_score ?? 0}
        </span>

        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <span className="text-xs font-semibold text-[#ededed] truncate text-right">
            {fixture.away_team_name}
          </span>
          <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} size={16} />
        </div>

        {tierChip && (
          <span
            title={tierChip.title}
            className={`shrink-0 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border px-1 text-[10px] font-bold ${tierChip.className}`}
          >
            {tierChip.letter}
          </span>
        )}

        <DataChip
          tone={correct === true ? "win" : correct === false ? "loss" : "default"}
          className="shrink-0"
        >
          {pick}
        </DataChip>

        <div className="w-5 shrink-0 flex justify-center">
          {correct === true && <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />}
          {correct === false && <XCircle className="h-4 w-4 text-red-400" />}
          {correct === null && <span className="text-[10px] text-[#6b7280]">—</span>}
        </div>
      </div>
    </div>
  );
}

export function YesterdayResultsStrip({ data, isLoading }: YesterdayResultsStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  // Only surface finished matches we actually had a prediction for —
  // otherwise the strip filled up with "—/—" rows which users read as
  // "we got it wrong" when they really meant "no pick was ever made".
  const fixtures = (data?.fixtures ?? []).filter(
    (f) => f.status === "finished" && f.prediction != null,
  );
  const correctCount = fixtures.filter((f) => isCorrect(f) === true).length;
  const total = fixtures.length;
  const winRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="card-neon">
      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="section-label">{t("dash.yesterdayResults")}</span>
            {total > 0 && (
              <Pill tone="win">
                {correctCount}/{total} — {winRate}%
              </Pill>
            )}
          </div>
          <Link
            href={lHref("/results")}
            className="flex items-center gap-1 text-xs text-[#a3a9b8] transition-colors hover:text-[#4ade80]"
          >
            {t("dash.viewAll")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel h-9 animate-pulse"
                />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#6b7280]">
              {t("dash.noResultsYesterday")}
            </p>
          ) : (
            <div className="space-y-2">
              {fixtures.slice(0, 8).map((fixture) => (
                <ResultRow key={fixture.id} fixture={fixture} />
              ))}
              {fixtures.length > 8 && (
                <Link
                  href={lHref("/results")}
                  className="mt-2 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#a3a9b8] transition-colors hover:text-[#4ade80]"
                >
                  {t("dash.viewAllResults")} ({fixtures.length})
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
