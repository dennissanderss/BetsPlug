"use client";

import { useTranslations } from "@/i18n/locale-provider";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import { HeroFeaturedMatch } from "@/components/dashboard/HeroFeaturedMatch";
import { MetricCardsRow } from "@/components/dashboard/MetricCardsRow";
import { RecentPredictionsTable } from "@/components/dashboard/RecentPredictionsTable";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RightSidebar } from "@/components/dashboard/RightSidebar";

export default function DashboardPage() {
  const { t } = useTranslations();

  return (
    <div className="animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text sm:text-4xl">
            {t("dash.title")}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">{t("dash.subtitle")}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm">
          <span className="live-dot" />
          <span>{t("dash.liveData")}</span>
        </div>
      </div>

      {/* ── Main grid: content + right sidebar ──────────────────── */}
      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        {/* Main content column */}
        <div className="space-y-8">
          <HeroFeaturedMatch />
          <MetricCardsRow />

          {/* Upsell */}
          <UpsellBanner
            targetTier="gold"
            headline={t("dash.upsellHeadline")}
            subtext={t("dash.upsellSubtext")}
            variant="banner"
          />

          <RecentPredictionsTable />
          <PerformanceChart />
        </div>

        {/* Right sidebar - desktop only, below content on mobile */}
        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <RightSidebar />
          </div>
        </aside>
      </div>

      {/* Right sidebar on mobile/tablet - shown below main content */}
      <div className="mt-8 xl:hidden">
        <RightSidebar />
      </div>
    </div>
  );
}
