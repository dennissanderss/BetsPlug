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

  const liveCount = (liveFixtures?.fixtures ?? []).filter(
    (f) => f.status === "live"
  ).length;

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
    <div className="relative animate-fade-in mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
      {/* Ambient glow blobs behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(74,222,128,0.22), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.20), transparent 70%)",
        }}
      />

      <div className="relative grid gap-6 xl:grid-cols-[1fr_300px]">
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

        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <SportsHubSidebar
              summary={weeklySummary}
              isLoading={weeklyLoading}
            />
          </div>
        </aside>
      </div>

      <div className="relative mt-6 xl:hidden">
        <SportsHubSidebar summary={weeklySummary} isLoading={weeklyLoading} />
      </div>
    </div>
  );
}
