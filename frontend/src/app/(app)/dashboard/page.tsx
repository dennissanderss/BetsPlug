"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { HeroBotdCompact } from "@/components/dashboard/HeroBotdCompact";
import { LiveMatchesStrip } from "@/components/dashboard/LiveMatchesStrip";
import { TodayMatchesList } from "@/components/dashboard/TodayMatchesList";
import { YesterdayResultsStrip } from "@/components/dashboard/YesterdayResultsStrip";
import { SportsHubSidebar } from "@/components/dashboard/SportsHubSidebar";
import { UpgradeNudgeCard } from "@/components/dashboard/UpgradeNudgeCard";
import { TelegramInviteCard } from "@/components/telegram/invite-card";
import { HexBadge } from "@/components/noct/hex-badge";
import { useTier } from "@/hooks/use-tier";
import type { Fixture, FixturesResponse } from "@/types/api";

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

function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

// Yesterday window in the user's local timezone — anything kicked off
// in the previous calendar day (00:00–24:00 local) counts.
function pickYesterdayFixtures(resp: FixturesResponse | undefined): FixturesResponse | undefined {
  if (!resp) return resp;
  const now = new Date();
  const yesterdayStart = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const todayStart = startOfDay(now);
  const fixtures = resp.fixtures.filter((f) => {
    const t = new Date(f.scheduled_at).getTime();
    return Number.isFinite(t) && t >= yesterdayStart && t < todayStart;
  });
  return { ...resp, fixtures };
}

export default function DashboardPage() {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();
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

  // Yesterday's results — pull last 48h of finished fixtures and trim
  // client-side to the previous calendar day. Two days of headroom
  // keeps the section populated even when it's still early morning
  // and yesterday's late kickoffs are the only finished matches.
  const { data: recentResults, isLoading: yesterdayLoading } = useQuery({
    queryKey: ["fixtures-results-yesterday"],
    queryFn: () => api.getFixtureResults(2),
    staleTime: 5 * 60_000,
  });
  const yesterdayFixtures = pickYesterdayFixtures(recentResults);

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

  // Pre-filter live matches at the page level so the entire Live Now
  // card is hidden when nothing is genuinely in-play. While loading we
  // keep the strip mounted so users see the skeleton instead of a
  // flash of nothing.
  const now = Date.now();
  const liveCount = (liveFixtures?.fixtures ?? []).filter((f) => isTrulyLive(f, now)).length;
  const showLiveSection = liveLoading || liveCount > 0;

  return (
    <div className="relative animate-fade-in mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 overflow-hidden">
      <div className="relative grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          {/* Section 1 — Pick of the Day prominent. BOTD is a Gold+
              feature; Free/Silver users see the upsell card below
              instead, never the BOTD preview itself. */}
          {(userTierSlug === "gold" || userTierSlug === "platinum") && (
            <HeroBotdCompact botd={botd} isLoading={botdLoading} />
          )}

          {/* Tier-specific upsell — Free/Silver only. Gold/Platinum
              see nothing. */}
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

          {/* Section 3 — Today's matches for the user's tier. */}
          <TodayMatchesList data={todayFixtures} isLoading={todayLoading} />

          {/* Section 4 — Live now. Hidden entirely when nothing is in
              play (the strip's own filter and the page filter agree on
              what counts as "truly live" — kickoff in the past, less
              than 2h ago). */}
          {showLiveSection && (
            <LiveMatchesStrip
              data={liveFixtures}
              isLoading={liveLoading}
              nextKickoff={nextKickoff}
            />
          )}

          {/* Section 5 — Yesterday's results summary. */}
          <YesterdayResultsStrip data={yesterdayFixtures} isLoading={yesterdayLoading} />

          {/* Section 6 — Slim quick link. Trackrecord only; everything
              else lives in the sidebar already. */}
          <Link
            href={lHref("/trackrecord")}
            className="glass-panel-lifted group flex items-center gap-3 px-4 py-3 transition-all"
          >
            <HexBadge variant="green" size="sm" noGlow>
              <ClipboardList className="h-3.5 w-3.5" />
            </HexBadge>
            <span className="flex-1 text-sm font-medium text-[#ededed]">
              {t("nav.trackrecord" as any)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#6b7280] transition-colors group-hover:text-[#4ade80]" />
          </Link>
        </div>

        {/* Section 2 — Tier accuracy widget. Right column on wide
            screens; pinned below content on narrow ones. */}
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
