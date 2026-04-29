"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTranslations } from "@/i18n/locale-provider";
import { HeroBotdCompact } from "@/components/dashboard/HeroBotdCompact";
import { LiveMatchesStrip } from "@/components/dashboard/LiveMatchesStrip";
import { TodayMatchesList } from "@/components/dashboard/TodayMatchesList";
import { SportsHubSidebar } from "@/components/dashboard/SportsHubSidebar";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { UpgradeNudgeCard } from "@/components/dashboard/UpgradeNudgeCard";
import { TelegramInviteCard } from "@/components/telegram/invite-card";
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

  // Model-validation dataset (all v8.1 evaluated picks for the selected tier).
  // We deliberately do NOT set source="backtest" here — that would exclude the
  // 19 k batch_local_fill rows (the bulk of historical evaluated data), which
  // caused the "0.0% (0/0)" bug on the dashboard sidebar. The Live-meting row
  // below uses its own endpoint (/trackrecord/live-measurement) so the two
  // surfaces stay cleanly separated.
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

  return (
    <div className="relative animate-fade-in mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 overflow-hidden">
      {/* Ambient glow blobs behind content */}
      <div className="relative grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <WelcomeBanner />
          {/* BOTD is a Gold+ feature. We used to wrap the preview in
              a PaywallOverlay that rendered a big "Upgrade to Gold"
              card for Free/Silver users — but that ended up stacked
              right on top of the UpgradeNudgeCard below, two upsells
              for the same outcome. We now render the BOTD preview
              ONLY for users who can actually click into it; Free/
              Silver visitors see a single, dismissible upsell via
              UpgradeNudgeCard underneath. PaywallOverlay still lives
              in components/ui/ — it's used by /bet-of-the-day,
              /results, /reports, /strategy and the sidebar. */}
          {(userTierSlug === "gold" || userTierSlug === "platinum") && (
            <HeroBotdCompact botd={botd} isLoading={botdLoading} />
          )}
          {/* Tier-specific "next step" trigger. Renders only for Free
              and Silver — Gold/Platinum users see nothing here. */}
          <UpgradeNudgeCard />
          {/* Personal Telegram invite link for paid-tier users. The
              card returns null for users without that tier (server
              gates the link by the active subscription), so this
              renders nothing for Free users — no UI noise. We pick
              the highest tier the user has access to so a Platinum
              subscriber sees the Platinum card, not the Silver one. */}
          {userTierSlug === "platinum" ? (
            <TelegramInviteCard tier="platinum" />
          ) : userTierSlug === "gold" ? (
            <TelegramInviteCard tier="gold" />
          ) : userTierSlug === "silver" ? (
            <TelegramInviteCard tier="silver" />
          ) : null}
          <LiveMatchesStrip
            data={liveFixtures}
            isLoading={liveLoading}
            nextKickoff={nextKickoff}
          />
          <TodayMatchesList data={todayFixtures} isLoading={todayLoading} />
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
