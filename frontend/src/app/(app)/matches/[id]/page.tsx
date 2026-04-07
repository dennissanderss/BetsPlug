"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  cn,
  formatPercent,
  formatDateTime,
  formatDate,
  getStatusBadgeColor,
} from "@/lib/utils";
import type {
  Match,
  MatchAnalysis,
  ForecastOutput,
  TeamForm,
} from "@/types/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisclaimerBanner } from "@/components/common/disclaimer-banner";
import { ProbabilityBar } from "@/components/charts/probability-bar";

// ─── Helpers ────────────────────────────────────────────────────────────────

function FormBadge({ result }: { result: string }) {
  const colorMap: Record<string, string> = {
    W: "bg-green-500 text-white border-green-500",
    D: "bg-amber-400 text-white border-amber-400",
    L: "bg-red-500 text-white border-red-500",
  };
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold",
        colorMap[result] ?? "bg-muted text-muted-foreground"
      )}
    >
      {result}
    </span>
  );
}

function StatusBadge({ status }: { status: Match["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        getStatusBadgeColor(status)
      )}
    >
      {status}
    </span>
  );
}

// ─── Skeleton Screens ────────────────────────────────────────────────────────

function MatchHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex items-center justify-center gap-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex justify-center gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-7 w-7 rounded-full" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Match Header ────────────────────────────────────────────────────────────

function MatchHeader({ match }: { match: Match }) {
  const isFinished = match.status === "finished";
  const hasScore = isFinished && match.result !== null;

  return (
    <div className="space-y-4">
      {/* Meta row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDateTime(match.scheduled_at)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {match.venue}
            </span>
          )}
          {match.round_name && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {match.round_name}
            </span>
          )}
        </div>
        <StatusBadge status={match.status} />
      </div>

      {/* Score / Fixture display */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {/* Home team */}
          <div className="flex-1 text-right">
            <p className="text-xl font-bold text-foreground sm:text-2xl">
              {match.home_team_name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Home</p>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 text-center">
            {hasScore ? (
              <div>
                <p className="text-4xl font-black tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {match.result!.home_score}
                  <span className="mx-1 text-muted-foreground">–</span>
                  {match.result!.away_score}
                </p>
                {match.result!.home_score_ht !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    HT: {match.result!.home_score_ht} – {match.result!.away_score_ht}
                  </p>
                )}
                {match.result!.winner && (
                  <div className="mt-2 flex justify-center">
                    <Badge
                      variant={
                        match.result!.winner === "home"
                          ? "success"
                          : match.result!.winner === "away"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {match.result!.winner === "draw"
                        ? "Draw"
                        : `${match.result!.winner} win`}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-3xl font-bold text-muted-foreground">vs</p>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 text-left">
            <p className="text-xl font-bold text-foreground sm:text-2xl">
              {match.away_team_name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Away</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analysis Tab ────────────────────────────────────────────────────────────

function TeamFormCard({
  teamName,
  form,
  side,
}: {
  teamName: string;
  form: TeamForm;
  side: "home" | "away";
}) {
  const accentColor = side === "home" ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400";
  const bgColor = side === "home" ? "bg-blue-50 dark:bg-blue-950/20" : "bg-orange-50 dark:bg-orange-950/20";

  const total = form.wins + form.draws + form.losses;
  const winRate = total > 0 ? form.wins / total : 0;
  const avgScored = total > 0 ? (form.goals_scored / total).toFixed(2) : "—";
  const avgConceded = total > 0 ? (form.goals_conceded / total).toFixed(2) : "—";

  return (
    <Card className={cn("border-t-4", side === "home" ? "border-t-blue-500" : "border-t-orange-500")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{teamName}</CardTitle>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              bgColor,
              accentColor
            )}
          >
            {side}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last 5 form */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Last 5
          </p>
          <div className="flex flex-wrap gap-1.5">
            {form.last_5.length > 0 ? (
              form.last_5.map((r, i) => <FormBadge key={i} result={r} />)
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>
        </div>

        <Separator />

        {/* W/D/L mini cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md bg-green-50 p-2 text-center dark:bg-green-950/30">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{form.wins}</p>
            <p className="text-xs text-green-700 dark:text-green-500">W</p>
          </div>
          <div className="rounded-md bg-amber-50 p-2 text-center dark:bg-amber-950/30">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{form.draws}</p>
            <p className="text-xs text-amber-700 dark:text-amber-500">D</p>
          </div>
          <div className="rounded-md bg-red-50 p-2 text-center dark:bg-red-950/30">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{form.losses}</p>
            <p className="text-xs text-red-700 dark:text-red-500">L</p>
          </div>
        </div>

        <Separator />

        {/* Key stats */}
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win rate</span>
            <span className="font-semibold">{formatPercent(winRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg scored / game</span>
            <span className="font-semibold">{avgScored}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg conceded / game</span>
            <span className="font-semibold">{avgConceded}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({
  label,
  homeValue,
  awayValue,
  homeRaw,
  awayRaw,
  higherIsBetter = true,
}: {
  label: string;
  homeValue: string;
  awayValue: string;
  homeRaw: number;
  awayRaw: number;
  higherIsBetter?: boolean;
}) {
  const homeWins = higherIsBetter ? homeRaw > awayRaw : homeRaw < awayRaw;
  const awayWins = higherIsBetter ? awayRaw > homeRaw : awayRaw < homeRaw;

  return (
    <div className="grid grid-cols-3 items-center gap-3 py-2.5 text-sm">
      <span
        className={cn(
          "text-right font-semibold",
          homeWins
            ? "text-blue-600 dark:text-blue-400"
            : "text-foreground"
        )}
      >
        {homeValue}
      </span>
      <span className="text-center text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-left font-semibold",
          awayWins
            ? "text-orange-600 dark:text-orange-400"
            : "text-foreground"
        )}
      >
        {awayValue}
      </span>
    </div>
  );
}

function AnalysisTab({ analysis }: { analysis: MatchAnalysis }) {
  const hf = analysis.home_team_form;
  const af = analysis.away_team_form;
  const hTotal = hf.wins + hf.draws + hf.losses || 1;
  const aTotal = af.wins + af.draws + af.losses || 1;

  return (
    <div className="space-y-6">
      {/* Form comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamFormCard
          teamName={analysis.match.home_team_name}
          form={analysis.home_team_form}
          side="home"
        />
        <TeamFormCard
          teamName={analysis.match.away_team_name}
          form={analysis.away_team_form}
          side="away"
        />
      </div>

      {/* Key stats comparison table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold">
            <span className="text-blue-600 dark:text-blue-400 truncate">
              {analysis.match.home_team_name}
            </span>
            <span className="text-muted-foreground">Comparison</span>
            <span className="text-orange-600 dark:text-orange-400 truncate">
              {analysis.match.away_team_name}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            <ComparisonRow
              label="Win Rate"
              homeValue={formatPercent(hf.wins / hTotal)}
              awayValue={formatPercent(af.wins / aTotal)}
              homeRaw={hf.wins / hTotal}
              awayRaw={af.wins / aTotal}
            />
            <ComparisonRow
              label="Avg Goals Scored"
              homeValue={(hf.goals_scored / hTotal).toFixed(2)}
              awayValue={(af.goals_scored / aTotal).toFixed(2)}
              homeRaw={hf.goals_scored / hTotal}
              awayRaw={af.goals_scored / aTotal}
            />
            <ComparisonRow
              label="Avg Goals Conceded"
              homeValue={(hf.goals_conceded / hTotal).toFixed(2)}
              awayValue={(af.goals_conceded / aTotal).toFixed(2)}
              homeRaw={hf.goals_conceded / hTotal}
              awayRaw={af.goals_conceded / aTotal}
              higherIsBetter={false}
            />
            <ComparisonRow
              label="Wins"
              homeValue={String(hf.wins)}
              awayValue={String(af.wins)}
              homeRaw={hf.wins}
              awayRaw={af.wins}
            />
            <ComparisonRow
              label="Draws"
              homeValue={String(hf.draws)}
              awayValue={String(af.draws)}
              homeRaw={hf.draws}
              awayRaw={af.draws}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Forecast Tab ────────────────────────────────────────────────────────────

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = confidence * 100;
  const color =
    pct >= 70
      ? "bg-green-500"
      : pct >= 50
      ? "bg-amber-400"
      : "bg-red-500";

  const label =
    pct >= 70 ? "High confidence" : pct >= 50 ? "Medium confidence" : "Low confidence";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Model Confidence</span>
        <span className="font-bold">{formatPercent(confidence)}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FactorList({
  title,
  factors,
  positive,
}: {
  title: string;
  factors: Record<string, number>;
  positive: boolean;
}) {
  const entries = Object.entries(factors).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

  if (entries.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {positive ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {entries.map(([factor, value]) => (
          <li key={factor} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">
              {factor.replace(/_/g, " ")}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                positive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {value > 0 ? "+" : ""}
              {(value * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ForecastTab({
  forecast,
  homeTeamName,
  awayTeamName,
}: {
  forecast: ForecastOutput;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const explanation = forecast.explanation;

  return (
    <div className="space-y-5">
      {/* Simulation disclaimer - always prominent */}
      <div className="rounded-md border-2 border-amber-400 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            This is a simulated model output for educational purposes only. Not financial or betting advice.
          </p>
        </div>
      </div>

      {/* Probability bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Win Probabilities</CardTitle>
          <CardDescription>Model output — simulated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProbabilityBar
            home={forecast.home_win_prob}
            draw={forecast.draw_prob ?? 0}
            away={forecast.away_win_prob}
            homeLabel={homeTeamName}
            awayLabel={awayTeamName}
          />
          <Separator />
          <ConfidenceMeter confidence={forecast.confidence} />
        </CardContent>
      </Card>

      {/* Predicted score */}
      {forecast.predicted_home_score !== null && forecast.predicted_away_score !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Predicted Score</CardTitle>
            <CardDescription>Expected scoreline range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{homeTeamName}</p>
                <p className="text-4xl font-black tabular-nums text-foreground">
                  {forecast.predicted_home_score.toFixed(0)}
                </p>
              </div>
              <Minus className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{awayTeamName}</p>
                <p className="text-4xl font-black tabular-nums text-foreground">
                  {forecast.predicted_away_score.toFixed(0)}
                </p>
              </div>
            </div>
            {forecast.confidence_interval_low !== null &&
              forecast.confidence_interval_high !== null && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Confidence interval:{" "}
                  {formatPercent(forecast.confidence_interval_low)} –{" "}
                  {formatPercent(forecast.confidence_interval_high)}
                </p>
              )}
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      {explanation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Model Explanation</CardTitle>
            <CardDescription>Key factors driving the forecast</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary text */}
            {explanation.summary && (
              <div className="rounded-md bg-muted/50 px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground">
                  {explanation.summary}
                </p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {Object.keys(explanation.top_factors_for).length > 0 && (
                <FactorList
                  title="Factors in favour"
                  factors={explanation.top_factors_for}
                  positive
                />
              )}
              {Object.keys(explanation.top_factors_against).length > 0 && (
                <FactorList
                  title="Factors against"
                  factors={explanation.top_factors_against}
                  positive={false}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model metadata */}
      <p className="text-center text-xs text-muted-foreground">
        Model: {forecast.model_name} v{forecast.model_version} · Predicted{" "}
        {formatDateTime(forecast.predicted_at)}
      </p>
    </div>
  );
}

// ─── Head-to-Head Tab ─────────────────────────────────────────────────────────

interface H2HData {
  total: number;
  home_wins: number;
  draws: number;
  away_wins: number;
  summary: string;
}

function HeadToHeadTab({
  h2h,
  homeTeamName,
  awayTeamName,
}: {
  h2h: H2HData;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const total = h2h.total || 1;
  const homeWinPct = h2h.home_wins / total;
  const drawPct = h2h.draws / total;
  const awayWinPct = h2h.away_wins / total;

  return (
    <div className="space-y-5">
      {/* H2H record */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">All-Time Record</CardTitle>
          <CardDescription>{h2h.total} meetings total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Three-way stat */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {h2h.home_wins}
              </p>
              <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-500 truncate">
                {homeTeamName}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                {formatPercent(homeWinPct)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-3xl font-black text-slate-600 dark:text-slate-400">
                {h2h.draws}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                Draws
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {formatPercent(drawPct)}
              </p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
              <p className="text-3xl font-black text-orange-600 dark:text-orange-400">
                {h2h.away_wins}
              </p>
              <p className="mt-1 text-xs font-medium text-orange-700 dark:text-orange-500 truncate">
                {awayTeamName}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">
                {formatPercent(awayWinPct)}
              </p>
            </div>
          </div>

          {/* H2H bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${homeWinPct * 100}%` }}
              title={`${homeTeamName}: ${formatPercent(homeWinPct)}`}
            />
            <div
              className="bg-slate-400 transition-all duration-500"
              style={{ width: `${drawPct * 100}%` }}
              title={`Draws: ${formatPercent(drawPct)}`}
            />
            <div
              className="flex-1 bg-orange-500 transition-all duration-500"
              title={`${awayTeamName}: ${formatPercent(awayWinPct)}`}
            />
          </div>

          {/* Summary */}
          {h2h.summary && (
            <div className="rounded-md bg-muted/50 px-4 py-3">
              <p className="text-sm text-foreground">{h2h.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {h2h.total === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <BarChart2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No head-to-head history found between these teams.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = String(params.id);

  const {
    data: match,
    isLoading: matchLoading,
    error: matchError,
  } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => api.getMatch(matchId),
    enabled: Boolean(matchId),
  });

  const {
    data: analysis,
    isLoading: analysisLoading,
  } = useQuery({
    queryKey: ["match-analysis", matchId],
    queryFn: () => api.getMatchAnalysis(matchId),
    enabled: Boolean(matchId),
  });

  const {
    data: forecast,
    isLoading: forecastLoading,
  } = useQuery({
    queryKey: ["match-forecast", matchId],
    queryFn: () => api.getMatchForecast(matchId),
    enabled: Boolean(matchId),
    retry: false, // forecast may not exist — don't spam
  });

  const hasForecast = !forecastLoading && forecast !== undefined;

  if (matchError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5">
        <p className="text-sm font-medium text-destructive">Failed to load match data.</p>
        <p className="text-xs text-muted-foreground">
          {matchError instanceof Error ? matchError.message : "Unknown error"}
        </p>
      </div>
    );
  }

  // Use analysis.match if available (richer), fall back to match
  const displayMatch = analysis?.match ?? match;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <DisclaimerBanner />

      {/* Match Header */}
      {matchLoading && !displayMatch ? (
        <MatchHeaderSkeleton />
      ) : displayMatch ? (
        <MatchHeader match={displayMatch} />
      ) : null}

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="analysis">
        <TabsList className="mb-2">
          <TabsTrigger value="analysis">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="forecast" disabled={!hasForecast && !forecastLoading}>
            <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
            Forecast
            {hasForecast && (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                AI
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="h2h">Head-to-Head</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          {analysisLoading ? (
            <AnalysisSkeleton />
          ) : analysis ? (
            <AnalysisTab analysis={analysis} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No analysis data available for this match.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast">
          {forecastLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : forecast && displayMatch ? (
            <ForecastTab
              forecast={forecast}
              homeTeamName={displayMatch.home_team_name}
              awayTeamName={displayMatch.away_team_name}
            />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <BarChart2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No forecast available for this match yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Head-to-Head Tab */}
        <TabsContent value="h2h">
          {analysisLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : analysis ? (
            <HeadToHeadTab
              h2h={analysis.head_to_head}
              homeTeamName={analysis.match.home_team_name}
              awayTeamName={analysis.match.away_team_name}
            />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No head-to-head data available.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
