"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiveMatchesStrip } from "@/components/dashboard/LiveMatchesStrip";
import { UpcomingPicksStrip } from "@/components/dashboard/UpcomingPicksStrip";
import { SportsHubSidebar } from "@/components/dashboard/SportsHubSidebar";
import { UpgradeNudgeCard } from "@/components/dashboard/UpgradeNudgeCard";
import { TodayKpiStrip } from "@/components/dashboard/TodayKpiStrip";
import { DashboardHeroBanner } from "@/components/dashboard/DashboardHeroBanner";
import { TodayLeagueBreakdown } from "@/components/dashboard/TodayLeagueBreakdown";
import { TelegramInviteCard } from "@/components/telegram/invite-card";
import { useTier } from "@/hooks/use-tier";
import { classifyPickTier, TIER_RANK } from "@/lib/pick-tier";
import type { Fixture, PickTierSlug } from "@/types/api";

// Same window as LiveMatchesStrip uses internally — kept in sync so the
// page-level "show the section?" check matches what the strip will
// actually render.
const LIVE_WINDOW_MS = 120 * 60 * 1000;

function isTrulyLive(f: Fixture, now: number): boolean {
  if (f.status !== "live") return false;
  const kickoff = new Date(f.scheduled_at).getTime();
  if (!Number.isFinite(kickoff)) return false;
  if (kickoff > now) return false;
  return now - kickoff <= LIVE_WINDOW_MS;
}

export default function DashboardPage() {
  const { tier: userTierSlug } = useTier();

  const { data: liveFixtures, isLoading: liveLoading } = useQuery({
    queryKey: ["fixtures-live-hub"],
    queryFn: () => api.getFixturesLive(),
    refetchInterval: 60_000,
  });

  const { data: todayFixtures, isLoading: todayLoading } = useQuery({
    queryKey: ["fixtures-today-hub"],
    queryFn: () => api.getFixturesToday(),
  });

  const { data: upcomingFixtures, isLoading: upcomingLoading } = useQuery({
    queryKey: ["fixtures-upcoming-hub"],
    queryFn: () => api.getFixturesUpcoming(7),
    staleTime: 5 * 60_000,
  });

  const { data: weeklySummary, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-summary-hub", userTierSlug ?? "all"],
    queryFn: () => api.getWeeklySummary(7, userTierSlug ?? undefined),
  });

  const { data: weeklySummary14, isLoading: weeklyLoading14 } = useQuery({
    queryKey: ["weekly-summary-hub-14", userTierSlug ?? "all"],
    queryFn: () => api.getWeeklySummary(14, userTierSlug ?? undefined),
  });

  const { data: tierSummary, isLoading: tierSummaryLoading } = useQuery({
    queryKey: ["trackrecord-summary-hub", userTierSlug ?? "all"],
    queryFn: () =>
      api.getTrackrecordSummary(
        userTierSlug ? { pick_tier: userTierSlug } : {},
      ),
    staleTime: 5 * 60_000,
  });

  const nextKickoff = (() => {
    const upcoming = (todayFixtures?.fixtures ?? []).find(
      (f) => f.status === "scheduled"
    );
    if (!upcoming) return null;
    try {
      return new Date(upcoming.scheduled_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  })();

  // Counts for the editorial top strip.
  const now = Date.now();
  const liveCount = (liveFixtures?.fixtures ?? []).filter((f) => isTrulyLive(f, now)).length;
  const showLiveSection = liveLoading || liveCount > 0;

  const userRank = userTierSlug
    ? TIER_RANK[userTierSlug as PickTierSlug] ?? 0
    : 0;
  const todayPickCount: number | null = todayLoading
    ? null
    : (todayFixtures?.fixtures ?? []).filter((f) => {
        if (!f.prediction || f.status !== "scheduled") return false;
        const tier: PickTierSlug | null =
          (f.prediction as any).pick_tier ??
          classifyPickTier({
            leagueId: (f as any).league_id ?? null,
            leagueName: f.league_name ?? null,
            confidence: f.prediction.confidence,
          });
        // Cumulative downwards: visible if pickRank <= userRank.
        return tier ? TIER_RANK[tier] <= userRank : false;
      }).length;

  // Week hit-rate from the weekly summary (cumulative tier scope).
  const weekHitRate = (() => {
    const ws: any = weeklySummary;
    if (!ws) return null;
    const total = ws.total_picks ?? ws.total ?? 0;
    const correct = ws.correct ?? ws.hits ?? 0;
    if (!total) return null;
    return (correct / total) * 100;
  })();

  return (
    <div className="relative animate-fade-in mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      {/* Ambient glow blobs behind the page — subtle brand colour
          wash so the editorial layout doesn't feel like a flat
          spreadsheet. Two blobs, very low opacity, fixed-position
          so they don't move when you scroll. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(74,222,128,0.18), transparent 65%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.10), transparent 70%)" }}
        />
      </div>

      {/* ── Photo-driven hero banner — soccer-action background +
          dark gradient overlay + tier-aware headline. Adds the
          "leven" the user explicitly asked for without slipping
          back into a SaaS greeting. */}
      <DashboardHeroBanner
        tier={userTierSlug}
        todayPickCount={todayPickCount}
      />

      {/* ── Editorial top strip — compact data row. Four cells:
          today's date, tier, picks-in-scope today, live-now count. */}
      <div className="mt-4">
        <TodayKpiStrip
          tier={userTierSlug}
          todayPickCount={todayPickCount}
          liveCount={liveCount}
          weekHitRate={weekHitRate}
        />
      </div>

      {/* ── Section heading — magazine-style, gradient underline. */}
      <div className="relative mt-8 mb-4 flex items-baseline justify-between gap-4 pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Today's edge
        </h2>
        <p className="text-[11px] text-slate-500">
          Engine v8.1 · {todayPickCount === 0 ? "no picks in your tier" : "select picks"}
        </p>
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--accent-green) / 0.5) 0%, hsl(0 0% 100% / 0.06) 30%, hsl(0 0% 100% / 0.06) 100%)",
          }}
        />
      </div>

      {/* ── Two-column editorial layout: upcoming on the left,
          tier-accuracy widget pinned right on xl+. ── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* Tier-specific upsell — Free/Silver only. */}
          <UpgradeNudgeCard />

          {/* Telegram invite for paid tiers (server gates the link). */}
          {userTierSlug === "platinum" ? (
            <TelegramInviteCard tier="platinum" />
          ) : userTierSlug === "gold" ? (
            <TelegramInviteCard tier="gold" />
          ) : userTierSlug === "silver" ? (
            <TelegramInviteCard tier="silver" />
          ) : null}

          {/* ── "Coming up" subhead before the upcoming-picks grid */}
          <div className="relative mt-2 flex items-baseline justify-between gap-4 pb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Coming up
            </h3>
            <p className="text-[11px] text-slate-500">Ranked by confidence, your tier and below</p>
            <div
              aria-hidden
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--accent-green) / 0.4) 0%, hsl(0 0% 100% / 0.04) 25%, hsl(0 0% 100% / 0.04) 100%)",
              }}
            />
          </div>

          <UpcomingPicksStrip
            data={upcomingFixtures}
            isLoading={upcomingLoading}
            userTier={userTierSlug}
          />

          {/* ── Today's leagues breakdown — tier-scoped competition
              list with pick count + avg/top confidence per league.
              Hidden when there are no in-scope picks today so
              empty days don't echo "0 picks" twice. */}
          <TodayLeagueBreakdown userTier={userTierSlug} />

          {/* Live now — only renders when something is genuinely in
              play. Hidden entirely on a quiet midweek afternoon. */}
          {showLiveSection && (
            <>
              <div className="relative mt-2 flex items-baseline justify-between gap-4 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 align-middle" />
                  Live right now
                </h3>
                <p className="text-[11px] text-slate-500">Pre-match pick · evaluated post-FT</p>
                <div
                  aria-hidden
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(248,113,113,0.5) 0%, hsl(0 0% 100% / 0.04) 25%, hsl(0 0% 100% / 0.04) 100%)",
                  }}
                />
              </div>
              <LiveMatchesStrip
                data={liveFixtures}
                isLoading={liveLoading}
                nextKickoff={nextKickoff}
              />
            </>
          )}
        </div>

        {/* ── Right rail — tier-accuracy widget pinned on xl+,
            otherwise stacks below the main column. */}
        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <SportsHubSidebar
              summary={weeklySummary}
              isLoading={weeklyLoading}
              summary14={weeklySummary14}
              isLoading14={weeklyLoading14}
              userTierSlug={userTierSlug}
              tierSummary={tierSummary}
              tierSummaryLoading={tierSummaryLoading}
            />
          </div>
        </aside>
      </div>

      <div className="relative mt-6 xl:hidden">
        <SportsHubSidebar
          summary={weeklySummary}
          isLoading={weeklyLoading}
          summary14={weeklySummary14}
          isLoading14={weeklyLoading14}
          userTierSlug={userTierSlug}
          tierSummary={tierSummary}
          tierSummaryLoading={tierSummaryLoading}
        />
      </div>
    </div>
  );
}
