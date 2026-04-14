"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTranslations } from "@/i18n/locale-provider";
import { QuickNavStrip } from "@/components/dashboard/QuickNavStrip";
import { HeroBotdCompact } from "@/components/dashboard/HeroBotdCompact";
import { LiveMatchesStrip } from "@/components/dashboard/LiveMatchesStrip";
import { TodayMatchesList } from "@/components/dashboard/TodayMatchesList";
import { YesterdayResultsStrip } from "@/components/dashboard/YesterdayResultsStrip";
import { SportsHubSidebar } from "@/components/dashboard/SportsHubSidebar";

export default function DashboardPage() {
  const { t } = useTranslations();

  // ── Hoisted queries (shared across components) ─────────────
  const { data: botd, isLoading: botdLoading } = useQuery({
    queryKey: ["botd-hub"],
    queryFn: () => api.getBetOfTheDay(),
  });

  const { data: liveFixtures, isLoading: liveLoading } = useQuery({
    queryKey: ["fixtures-live-hub"],
    queryFn: () => api.getFixturesLive(),
    refetchInterval: 60_000,
  });

  const { data: todayFixtures, isLoading: todayLoading } = useQuery({
    queryKey: ["fixtures-today-hub"],
    queryFn: () => api.getFixturesToday(),
  });

  const { data: yesterdayResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["fixtures-results-1"],
    queryFn: () => api.getFixtureResults(1),
  });

  const { data: weeklySummary, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-summary-hub"],
    queryFn: () => api.getWeeklySummary(7),
  });

  // Live count for nav strip badge
  const liveCount = (liveFixtures?.fixtures ?? []).filter(
    (f) => f.status === "live"
  ).length;

  // Next kickoff time for empty live state
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

  return (
    <div className="animate-fade-in">
      {/* ── Main grid: content + sidebar ────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-5">
          <QuickNavStrip liveCount={liveCount} />
          <HeroBotdCompact botd={botd} isLoading={botdLoading} />
          <LiveMatchesStrip
            data={liveFixtures}
            isLoading={liveLoading}
            nextKickoff={nextKickoff}
          />
          <TodayMatchesList data={todayFixtures} isLoading={todayLoading} />
          <YesterdayResultsStrip
            data={yesterdayResults}
            isLoading={resultsLoading}
          />
        </div>

        {/* Right sidebar — desktop */}
        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <SportsHubSidebar
              summary={weeklySummary}
              isLoading={weeklyLoading}
            />
          </div>
        </aside>
      </div>

      {/* Sidebar on mobile/tablet */}
      <div className="mt-6 xl:hidden">
        <SportsHubSidebar summary={weeklySummary} isLoading={weeklyLoading} />
      </div>
    </div>
  );
}
