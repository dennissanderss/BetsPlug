"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Shield,
  Globe,
  TrendingUp,
  Calendar,
  Trophy,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  cn,
  formatPercent,
  formatDate,
} from "@/lib/utils";
import type { Match, TeamDetail, TeamStatsData } from "@/types/api";

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
import { DataTable, type Column } from "@/components/common/data-table";

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

function StatBar({
  label,
  value,
  max,
  colorClass = "bg-primary",
}: {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton Screens ────────────────────────────────────────────────────────

function TeamHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  team,
  stats,
}: {
  team: TeamDetail;
  stats: TeamStatsData | null;
}) {
  const form = team.recent_form;
  const s = stats ?? team.stats;

  const winRate = s && s.matches_played > 0 ? s.wins / s.matches_played : null;
  const drawRate = s && s.matches_played > 0 ? s.draws / s.matches_played : null;
  const lossRate = s && s.matches_played > 0 ? s.losses / s.matches_played : null;
  const gd = s ? s.goals_scored - s.goals_conceded : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recent Form card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Form</CardTitle>
          <CardDescription>Last 5 and last 10 results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {form ? (
            <>
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
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Last 10
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {form.last_10.length > 0 ? (
                    form.last_10.map((r, i) => <FormBadge key={i} result={r} />)
                  ) : (
                    <span className="text-sm text-muted-foreground">No data</span>
                  )}
                </div>
              </div>
              <Separator />
              {/* Form summary mini-stats */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="rounded-md bg-green-50 p-3 text-center dark:bg-green-950/30">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {form.wins}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-500">Wins</p>
                </div>
                <div className="rounded-md bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {form.draws}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">Draws</p>
                </div>
                <div className="rounded-md bg-red-50 p-3 text-center dark:bg-red-950/30">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {form.losses}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-500">Losses</p>
                </div>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No form data available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Season Stats card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Season Stats</CardTitle>
          <CardDescription>Full season record</CardDescription>
        </CardHeader>
        <CardContent>
          {s ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Played */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{s.matches_played}</p>
                  <p className="text-xs text-muted-foreground">Played</p>
                </div>
                {/* Goal Diff */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      gd !== null && gd > 0
                        ? "text-green-600 dark:text-green-400"
                        : gd !== null && gd < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-foreground"
                    )}
                  >
                    {gd !== null ? (gd > 0 ? `+${gd}` : gd) : " - "}
                  </p>
                  <p className="text-xs text-muted-foreground">Goal Diff</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <StatBar
                  label="Wins"
                  value={s.wins}
                  max={s.matches_played}
                  colorClass="bg-green-500"
                />
                <StatBar
                  label="Draws"
                  value={s.draws}
                  max={s.matches_played}
                  colorClass="bg-amber-400"
                />
                <StatBar
                  label="Losses"
                  value={s.losses}
                  max={s.matches_played}
                  colorClass="bg-red-500"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals scored</span>
                  <span className="font-semibold">{s.goals_scored}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conceded</span>
                  <span className="font-semibold">{s.goals_conceded}</span>
                </div>
                {s.avg_goals_scored !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg scored</span>
                    <span className="font-semibold">{s.avg_goals_scored.toFixed(2)}</span>
                  </div>
                )}
                {s.avg_goals_conceded !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg conceded</span>
                    <span className="font-semibold">{s.avg_goals_conceded.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {winRate !== null && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Win Rate
                    </p>
                    <div className="flex h-5 w-full overflow-hidden rounded-full">
                      <div
                        className="flex items-center justify-center bg-green-500 text-[10px] font-bold text-white transition-all"
                        style={{ width: `${(winRate ?? 0) * 100}%` }}
                        title={`Win: ${formatPercent(winRate ?? 0)}`}
                      >
                        {(winRate ?? 0) * 100 >= 12 && formatPercent(winRate ?? 0)}
                      </div>
                      <div
                        className="flex items-center justify-center bg-amber-400 text-[10px] font-bold text-white transition-all"
                        style={{ width: `${(drawRate ?? 0) * 100}%` }}
                        title={`Draw: ${formatPercent(drawRate ?? 0)}`}
                      >
                        {(drawRate ?? 0) * 100 >= 12 && formatPercent(drawRate ?? 0)}
                      </div>
                      <div
                        className="flex-1 bg-red-500"
                        title={`Loss: ${formatPercent(lossRate ?? 0)}`}
                      />
                    </div>
                    <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm bg-green-500" />
                        W {formatPercent(winRate ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />
                        D {formatPercent(drawRate ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm bg-red-500" />
                        L {formatPercent(lossRate ?? 0)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No season stats available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Matches Tab ─────────────────────────────────────────────────────────────

function matchResultBadge(match: Match, teamId: string): React.ReactNode {
  if (!match.result) return <span className="text-xs text-muted-foreground"> - </span>;

  const isHome = match.home_team_id === teamId;
  const { winner } = match.result;

  let label = "D";
  let variant: "success" | "destructive" | "secondary" = "secondary";

  if (winner === "draw") {
    label = "D";
    variant = "secondary";
  } else if ((winner === "home" && isHome) || (winner === "away" && !isHome)) {
    label = "W";
    variant = "success";
  } else {
    label = "L";
    variant = "destructive";
  }

  return <Badge variant={variant}>{label}</Badge>;
}

function MatchesTab({ matches, teamId }: { matches: Match[]; teamId: string }) {
  const columns: Column<Match>[] = [
    {
      label: "Date",
      accessor: "scheduled_at",
      className: "whitespace-nowrap text-muted-foreground",
      render: (v) => formatDate(String(v)),
    },
    {
      label: "Opponent",
      accessor: "home_team_name",
      render: (_, row) => {
        const isHome = row.home_team_id === teamId;
        const opponent = isHome ? row.away_team_name : row.home_team_name;
        return <span className="font-medium text-foreground">{opponent}</span>;
      },
    },
    {
      label: "Venue",
      accessor: "home_team_id",
      render: (_, row) => {
        const isHome = row.home_team_id === teamId;
        return (
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-semibold",
              isHome
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {isHome ? "H" : "A"}
          </span>
        );
      },
    },
    {
      label: "Score",
      accessor: "result",
      render: (_, row) => {
        if (!row.result) return <span className="text-muted-foreground"> - </span>;
        return (
          <span className="font-mono font-semibold">
            {row.result.home_score}–{row.result.away_score}
          </span>
        );
      },
    },
    {
      label: "Result",
      accessor: "id",
      render: (_, row) => matchResultBadge(row, teamId),
    },
    {
      label: "Round",
      accessor: "round_name",
      className: "text-muted-foreground text-xs",
      render: (v) => (v ? String(v) : " - "),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">All Matches</CardTitle>
        <CardDescription>{matches.length} matches loaded</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTable
          columns={columns}
          data={matches}
          emptyMessage="No matches found for this team."
          pageSize={10}
          rowKey={(row) => row.id}
        />
      </CardContent>
    </Card>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: TeamStatsData | null }) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No detailed stats available for this team.
        </CardContent>
      </Card>
    );
  }

  const homeGames = stats.home_wins; // available directly
  const awayGames = stats.away_wins;
  const homeWinRate = stats.matches_played > 0 ? stats.home_wins / stats.matches_played : 0;
  const awayWinRate = stats.matches_played > 0 ? stats.away_wins / stats.matches_played : 0;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Home Record */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Home Record</CardTitle>
              <CardDescription className="text-xs">Performance at home</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Home Wins</span>
              <span className="font-bold text-green-600">{stats.home_wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Home Win Rate</span>
              <span className="font-bold">{formatPercent(homeWinRate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Away Record */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
              <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Away Record</CardTitle>
              <CardDescription className="text-xs">Performance on the road</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Away Wins</span>
              <span className="font-bold text-green-600">{stats.away_wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Away Win Rate</span>
              <span className="font-bold">{formatPercent(awayWinRate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Goals</CardTitle>
              <CardDescription className="text-xs">Scoring & conceding stats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Scored</span>
              <span className="font-bold text-green-600">{stats.goals_scored}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Conceded</span>
              <span className="font-bold text-red-600">{stats.goals_conceded}</span>
            </div>
            {stats.avg_goals_scored !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Scored / Match</span>
                <span className="font-bold">{stats.avg_goals_scored.toFixed(2)}</span>
              </div>
            )}
            {stats.avg_goals_conceded !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Conceded / Match</span>
                <span className="font-bold">{stats.avg_goals_conceded.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Season Summary */}
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Full Season Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Played", value: stats.matches_played },
              { label: "Wins", value: stats.wins, color: "text-green-600 dark:text-green-400" },
              { label: "Draws", value: stats.draws, color: "text-amber-600 dark:text-amber-400" },
              { label: "Losses", value: stats.losses, color: "text-red-600 dark:text-red-400" },
              { label: "Scored", value: stats.goals_scored, color: "text-blue-600 dark:text-blue-400" },
              { label: "Conceded", value: stats.goals_conceded, color: "text-slate-600 dark:text-slate-400" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-muted/30 p-4 text-center"
              >
                <p className={cn("text-3xl font-bold tabular-nums", color ?? "text-foreground")}>
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = String(params.id);

  const { data: team, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => api.getTeam(teamId),
    enabled: Boolean(teamId),
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["team-matches", teamId],
    queryFn: () => api.getTeamMatches(teamId, 50),
    enabled: Boolean(teamId),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["team-stats", teamId],
    queryFn: () => api.getTeamStats(teamId),
    enabled: Boolean(teamId),
  });

  if (teamError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5">
        <p className="text-sm font-medium text-destructive">Failed to load team data.</p>
        <p className="text-xs text-muted-foreground">
          {teamError instanceof Error ? teamError.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {teamLoading ? (
          <TeamHeaderSkeleton />
        ) : team ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {team.name}
                </h1>
                {team.short_name && team.short_name !== team.name && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{team.short_name}</p>
                )}
              </div>
              {team.league && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Shield className="mr-1.5 h-3.5 w-3.5" />
                  {team.league.name}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {team.country && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {team.country}
                </span>
              )}
              {team.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {team.venue}
                </span>
              )}
              {team.league?.country && team.league.country !== team.country && (
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" />
                  {team.league.country}
                  {team.league.tier ? ` · Tier ${team.league.tier}` : ""}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          {teamLoading || statsLoading ? (
            <OverviewSkeleton />
          ) : team ? (
            <OverviewTab team={team} stats={stats ?? null} />
          ) : null}
        </TabsContent>

        {/* Matches */}
        <TabsContent value="matches">
          {matchesLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <MatchesTab matches={matches ?? []} teamId={teamId} />
          )}
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats">
          {statsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-24" />
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StatsTab stats={stats ?? team?.stats ?? null} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
