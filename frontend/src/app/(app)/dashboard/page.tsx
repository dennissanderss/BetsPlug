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
import { TierPerformanceCard } from "@/components/dashboard/TierPerformanceCard";
import { TierEmptyStateCard } from "@/components/dashboard/TierEmptyStateCard";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { UpgradeNudgeCard } from "@/components/dashboard/UpgradeNudgeCard";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { useTier } from "@/hooks/use-tier";

export default function DashboardPage() {
  const { t } = useTranslations();
  const { tier: userTierSlug } = useTier();

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

  // Sidebar shows two numbers: an all-time cumulative accuracy (the
  // number on the homepage the user actually paid for) and a small
  // "this week" line underneath for recent activity. The week-only
  // display we had before swung 30+ points week-to-week on Platinum
  // because the tier only produces ~11 picks in 7 days. Cumulative is
  // the stable headline, week is the secondary.
  const { data: weeklySummary, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-summary-hub", userTierSlug ?? "all"],
    queryFn: () => api.getWeeklySummary(7, userTierSlug ?? undefined),
  });

  // Backtest = model-validation dataset (historical, dominated by pre-v8.1
  // records). We fetch source="backtest" explicitly so the card headline is
  // honest about what the user is looking at; live picks have their own row.
  const { data: tierSummary, isLoading: tierSummaryLoading } = useQuery({
    queryKey: ["trackrecord-summary-hub", userTierSlug ?? "all"],
    queryFn: () =>
      api.getTrackrecordSummary({
        source: "backtest",
        ...(userTierSlug ? { pick_tier: userTierSlug } : {}),
      }),
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

  return (
    <div className="relative animate-fade-in mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 overflow-hidden">
      {/* Ambient glow blobs behind content */}
      <div className="relative grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <WelcomeBanner />
          <QuickNavStrip />
          {/* BOTD is a Gold+ feature. On the dashboard we used to leak the
              actual pick to Free/Silver users, who then saw the full page
              gated on click — confusing. Gate it here too. The inline
              variant of PaywallOverlay replaces the row with a compact
              upgrade CTA, matching the row's narrow visual footprint. */}
          <PaywallOverlay
            feature="pick_of_the_day"
            requiredTier="gold"
            variant="inline"
          >
            <HeroBotdCompact botd={botd} isLoading={botdLoading} />
          </PaywallOverlay>
          {/* Tier-specific "next step" trigger (null for Platinum). */}
          <UpgradeNudgeCard />
          {/* Contextual empty-state: renders only when the signed-in
              user's own tier has zero picks in the current v8.1
              window. Sits above TierPerformanceCard so the comparison
              table below reads as the answer to "what would upgrading
              get me?". */}
          <TierEmptyStateCard />
          {/* v8.1 — per-tier historical accuracy with upgrade nudges.
              Auto-hides when TIER_SYSTEM_ENABLED=false on backend. */}
          <TierPerformanceCard />
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
          userTierSlug={userTierSlug}
          tierSummary={tierSummary}
          tierSummaryLoading={tierSummaryLoading}
        />
      </div>
    </div>
  );
}
