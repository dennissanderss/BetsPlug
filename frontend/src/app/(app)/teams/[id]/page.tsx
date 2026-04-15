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
import { cn, formatPercent, formatDate } from "@/lib/utils";
import type { Match, TeamDetail, TeamStatsData } from "@/types/api";

import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/common/data-table";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip } from "@/components/noct/pill";

// ─── Helpers ────────────────────────────────────────────────────────────────

function FormBadge({ result }: { result: string }) {
  const tone =
    result === "W" ? "win" : result === "D" ? "draw" : result === "L" ? "loss" : "default";
  return (
    <Pill tone={tone as any} className="!h-7 !w-7 !p-0 !text-xs !font-bold justify-center">
      {result}
    </Pill>
  );
}

function StatBar({
  label,
  value,
  max,
  color = "green",
}: {
  label: string;
  value: number;
  max: number;
  color?: "green" | "purple" | "red";
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const bg =
    color === "green"
      ? "#4ade80"
      : color === "purple"
      ? "#a855f7"
      : "#ef4444";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#a3a9b8]">{label}</span>
        <span className="font-semibold text-[#ededed]">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: bg }}
        />
      </div>
    </div>
  );
}

// ─── KPI tile ──────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  variant,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  variant: "green" | "purple" | "blue";
  icon: React.ReactNode;
}) {
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative flex items-center gap-4 p-5">
        <HexBadge variant={variant} size="md">
          {icon}
        </HexBadge>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
            {label}
          </p>
          <p className="text-stat mt-1 text-2xl text-[#ededed]">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────

function TeamHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-64 bg-white/[0.04]" />
      <div className="flex gap-4">
        <Skeleton className="h-5 w-32 bg-white/[0.04]" />
        <Skeleton className="h-5 w-24 bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─── Recent form card ──────────────────────────────────────────────────────

function RecentFormCard({ team }: { team: TeamDetail }) {
  const form = team.recent_form;
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative p-6">
        <div className="mb-4 flex items-center gap-3">
          <HexBadge variant="green" size="sm">
            <TrendingUp className="h-4 w-4" />
          </HexBadge>
          <div>
            <h3 className="text-heading text-base text-[#ededed]">
              Recent Form
            </h3>
            <p className="mt-0.5 text-xs text-[#a3a9b8]">
              Last 5 and last 10 results
            </p>
          </div>
        </div>

        {form ? (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                Last 5
              </p>
              <div className="flex flex-wrap gap-1.5">
                {form.last_5.length > 0 ? (
                  form.last_5.map((r, i) => <FormBadge key={i} result={r} />)
                ) : (
                  <span className="text-sm text-[#a3a9b8]">No data</span>
                )}
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                Last 10
              </p>
              <div className="flex flex-wrap gap-1.5">
                {form.last_10.length > 0 ? (
                  form.last_10.map((r, i) => <FormBadge key={i} result={r} />)
                ) : (
                  <span className="text-sm text-[#a3a9b8]">No data</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
              <div className="glass-panel rounded-lg p-3 text-center">
                <p className="text-stat text-xl text-[#4ade80]">{form.wins}</p>
                <p className="text-[11px] text-[#a3a9b8]">Wins</p>
              </div>
              <div className="glass-panel rounded-lg p-3 text-center">
                <p className="text-stat text-xl text-[#a3a9b8]">{form.draws}</p>
                <p className="text-[11px] text-[#a3a9b8]">Draws</p>
              </div>
              <div className="glass-panel rounded-lg p-3 text-center">
                <p className="text-stat text-xl text-[#fca5a5]">
                  {form.losses}
                </p>
                <p className="text-[11px] text-[#a3a9b8]">Losses</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-[#a3a9b8]">
            No form data available.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Season stats card ─────────────────────────────────────────────────────

function SeasonStatsCard({ stats }: { stats: TeamStatsData | null }) {
  const s = stats;
  const winRate = s && s.matches_played > 0 ? s.wins / s.matches_played : null;
  const drawRate =
    s && s.matches_played > 0 ? s.draws / s.matches_played : null;
  const gd = s ? s.goals_scored - s.goals_conceded : null;

  return (
    <div className="card-neon rounded-2xl">
      <div className="relative p-6">
        <div className="mb-4 flex items-center gap-3">
          <HexBadge variant="purple" size="sm">
            <Trophy className="h-4 w-4" />
          </HexBadge>
          <div>
            <h3 className="text-heading text-base text-[#ededed]">
              Season Stats
            </h3>
            <p className="mt-0.5 text-xs text-[#a3a9b8]">
              Full season record
            </p>
          </div>
        </div>

        {s ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-lg p-3 text-center">
                <p className="text-stat text-2xl text-[#ededed]">
                  {s.matches_played}
                </p>
                <p className="text-[11px] text-[#a3a9b8]">Played</p>
              </div>
              <div className="glass-panel rounded-lg p-3 text-center">
                <p
                  className={cn(
                    "text-stat text-2xl",
                    gd !== null && gd > 0
                      ? "text-[#4ade80]"
                      : gd !== null && gd < 0
                      ? "text-[#fca5a5]"
                      : "text-[#ededed]"
                  )}
                >
                  {gd !== null ? (gd > 0 ? `+${gd}` : gd) : "—"}
                </p>
                <p className="text-[11px] text-[#a3a9b8]">Goal Diff</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/[0.06] pt-4">
              <StatBar
                label="Wins"
                value={s.wins}
                max={s.matches_played}
                color="green"
              />
              <StatBar
                label="Draws"
                value={s.draws}
                max={s.matches_played}
                color="purple"
              />
              <StatBar
                label="Losses"
                value={s.losses}
                max={s.matches_played}
                color="red"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#a3a9b8]">Goals scored</span>
                <span className="font-semibold text-[#ededed]">
                  {s.goals_scored}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a3a9b8]">Conceded</span>
                <span className="font-semibold text-[#ededed]">
                  {s.goals_conceded}
                </span>
              </div>
              {s.avg_goals_scored !== null && (
                <div className="flex justify-between">
                  <span className="text-[#a3a9b8]">Avg scored</span>
                  <span className="font-semibold text-[#ededed]">
                    {s.avg_goals_scored.toFixed(2)}
                  </span>
                </div>
              )}
              {s.avg_goals_conceded !== null && (
                <div className="flex justify-between">
                  <span className="text-[#a3a9b8]">Avg conceded</span>
                  <span className="font-semibold text-[#ededed]">
                    {s.avg_goals_conceded.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {winRate !== null && (
              <div className="border-t border-white/[0.06] pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                  Win Rate
                </p>
                <p className="text-stat text-3xl text-[#ededed]">
                  {formatPercent(winRate)}
                </p>
                <p className="mt-1 text-xs text-[#a3a9b8]">
                  Draw {formatPercent(drawRate ?? 0)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-[#a3a9b8]">
            No season stats available.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Match result pill ─────────────────────────────────────────────────────

function matchResultPill(match: Match, teamId: string): React.ReactNode {
  if (!match.result) return <span className="text-xs text-[#a3a9b8]">—</span>;

  const isHome = match.home_team_id === teamId;
  const { winner } = match.result;

  let label = "D";
  let tone: "win" | "loss" | "draw" = "draw";

  if (winner === "draw") {
    label = "D";
    tone = "draw";
  } else if ((winner === "home" && isHome) || (winner === "away" && !isHome)) {
    label = "W";
    tone = "win";
  } else {
    label = "L";
    tone = "loss";
  }

  return <Pill tone={tone}>{label}</Pill>;
}

// ─── Matches card ──────────────────────────────────────────────────────────

function MatchesCard({
  matches,
  teamId,
}: {
  matches: Match[];
  teamId: string;
}) {
  const columns: Column<Match>[] = [
    {
      label: "Date",
      accessor: "scheduled_at",
      className: "whitespace-nowrap text-[#a3a9b8]",
      render: (v) => formatDate(String(v)),
    },
    {
      label: "Opponent",
      accessor: "home_team_name",
      render: (_, row) => {
        const isHome = row.home_team_id === teamId;
        const opponent = isHome ? row.away_team_name : row.home_team_name;
        return (
          <span className="font-medium text-[#ededed]">{opponent}</span>
        );
      },
    },
    {
      label: "Venue",
      accessor: "home_team_id",
      render: (_, row) => {
        const isHome = row.home_team_id === teamId;
        return (
          <Pill tone={isHome ? "info" : "default"}>{isHome ? "H" : "A"}</Pill>
        );
      },
    },
    {
      label: "Score",
      accessor: "result",
      render: (_, row) => {
        if (!row.result)
          return <span className="text-[#a3a9b8]">—</span>;
        return (
          <DataChip>
            {row.result.home_score}–{row.result.away_score}
          </DataChip>
        );
      },
    },
    {
      label: "Result",
      accessor: "id",
      render: (_, row) => matchResultPill(row, teamId),
    },
    {
      label: "Round",
      accessor: "round_name",
      className: "text-[#a3a9b8] text-xs",
      render: (v) => (v ? String(v) : "—"),
    },
  ];

  return (
    <div className="card-neon rounded-2xl">
      <div className="relative p-6">
        <div className="mb-4 flex items-center gap-3">
          <HexBadge variant="blue" size="sm">
            <Calendar className="h-4 w-4" />
          </HexBadge>
          <div>
            <h3 className="text-heading text-base text-[#ededed]">
              Recent matches
            </h3>
            <p className="mt-0.5 text-xs text-[#a3a9b8]">
              {matches.length} matches loaded
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={matches}
          emptyMessage="No matches found for this team."
          pageSize={10}
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = String(params.id);

  const {
    data: team,
    isLoading: teamLoading,
    error: teamError,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => api.getTeam(teamId),
    enabled: Boolean(teamId),
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["team-matches", teamId],
    queryFn: () => api.getTeamMatches(teamId, 50),
    enabled: Boolean(teamId),
  });

  const { data: stats } = useQuery({
    queryKey: ["team-stats", teamId],
    queryFn: () => api.getTeamStats(teamId),
    enabled: Boolean(teamId),
  });

  if (teamError) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
        <div className="card-neon rounded-2xl">
          <div className="relative flex h-64 flex-col items-center justify-center gap-3 p-6">
            <HexBadge variant="purple" size="md">
              <Shield className="h-5 w-5" />
            </HexBadge>
            <p className="text-sm font-medium text-[#ededed]">
              Failed to load team data.
            </p>
            <p className="text-xs text-[#a3a9b8]">
              {teamError instanceof Error ? teamError.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const s = stats ?? team?.stats ?? null;
  const goalDiff = s ? s.goals_scored - s.goals_conceded : null;
  const cleanSheets = s ? Math.max(0, s.matches_played - s.losses) : null; // best-effort
  const recentFormString = team?.recent_form?.last_5.join(" ") ?? "—";

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-green) / 0.1)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-60 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-purple) / 0.08)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
        {/* Header */}
        <div>
          {teamLoading ? (
            <TeamHeaderSkeleton />
          ) : team ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <HexBadge variant="green" size="xl">
                <Shield className="h-9 w-9" />
              </HexBadge>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="section-label mb-2">
                      <Shield className="h-3 w-3" />
                      Team profile
                    </span>
                    <h1 className="text-display text-3xl text-[#ededed] sm:text-4xl">
                      {team.name}
                    </h1>
                    {team.short_name && team.short_name !== team.name && (
                      <p className="mt-0.5 text-sm text-[#a3a9b8]">
                        {team.short_name}
                      </p>
                    )}
                  </div>
                  {team.league && (
                    <Pill tone="purple">
                      <Shield className="h-3 w-3" />
                      {team.league.name}
                    </Pill>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#a3a9b8]">
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
                  {team.league?.country &&
                    team.league.country !== team.country && (
                      <span className="flex items-center gap-1.5">
                        <Trophy className="h-4 w-4" />
                        {team.league.country}
                        {team.league.tier ? ` · Tier ${team.league.tier}` : ""}
                      </span>
                    )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Record"
            value={
              s ? `${s.wins}-${s.draws}-${s.losses}` : "—"
            }
            variant="green"
            icon={<Trophy className="h-5 w-5" />}
          />
          <KpiTile
            label="Goal diff"
            value={goalDiff !== null ? (goalDiff > 0 ? `+${goalDiff}` : goalDiff) : "—"}
            variant="purple"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KpiTile
            label="Clean sheets"
            value={cleanSheets ?? "—"}
            variant="blue"
            icon={<Shield className="h-5 w-5" />}
          />
          <KpiTile
            label="Form"
            value={recentFormString}
            variant="green"
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        {/* Overview */}
        <div className="grid gap-6 lg:grid-cols-2">
          {team && <RecentFormCard team={team} />}
          <SeasonStatsCard stats={s} />
        </div>

        {/* Matches list */}
        {matchesLoading ? (
          <div className="card-neon rounded-2xl">
            <div className="relative space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-10 w-full bg-white/[0.04]"
                />
              ))}
            </div>
          </div>
        ) : (
          <MatchesCard matches={matches ?? []} teamId={teamId} />
        )}
      </div>
    </div>
  );
}
