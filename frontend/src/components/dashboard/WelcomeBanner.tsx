"use client";

import * as React from "react";
import Link from "next/link";
import { Brain, TrendingUp, Calculator, X, ArrowRight } from "lucide-react";
import { HexBadge, type HexVariant } from "@/components/noct/hex-badge";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";

const STORAGE_KEY = "betsplug.welcomeBanner.dismissed";

const STEP_VARIANTS: HexVariant[] = ["green", "purple", "blue"];

/**
 * WelcomeBanner — dismissible onboarding card shown on the Dashboard for
 * first-time users. Three NOCTURNE step-cards with a single "don't show
 * again" control. State lives in localStorage; returning users never see
 * it after their first dismiss. The inner <section>s mirror the STEP
 * treatment used on /jouw-route so the visual language carries over.
 */
export function WelcomeBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  // Start hidden until we've read localStorage on the client — avoids
  // flicker on hydration and makes the banner a no-op during SSR.
  const [ready, setReady] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
    setReady(true);
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!ready || !visible) return null;

  const steps = [
    { icon: Brain, title: t("welcomeBanner.step1Title"), desc: t("welcomeBanner.step1Desc") },
    { icon: TrendingUp, title: t("welcomeBanner.step2Title"), desc: t("welcomeBanner.step2Desc") },
    { icon: Calculator, title: t("welcomeBanner.step3Title"), desc: t("welcomeBanner.step3Desc") },
  ];

  return (
    <div className="card-neon card-neon-green halo-green relative overflow-hidden animate-fade-in">
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <span className="section-label">{t("welcomeBanner.label")}</span>
            <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-white">
              <span className="gradient-text-green">
                {t("welcomeBanner.title")}
              </span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
              {t("welcomeBanner.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t("welcomeBanner.dismiss")}
            className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3 step cards — compact horizontal layout on md+, stacked on mobile */}
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="glass-panel rounded-xl p-3.5 flex items-start gap-3"
              >
                <HexBadge variant={STEP_VARIANTS[i]} size="sm">
                  <Icon className="h-4 w-4" />
                </HexBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">
                    {t("welcomeBanner.stepPrefix")} {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {s.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href={loc("/jouw-route")}
            className="inline-flex items-center gap-1 font-medium text-[#4ade80] hover:gap-2 transition-all"
          >
            {t("welcomeBanner.exploreCta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {t("welcomeBanner.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;
