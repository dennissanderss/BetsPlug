"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import {
  Trophy,
  Sparkles,
  ArrowRight,
  Brain,
  TrendingUp,
  Shield,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";

const STEP_VARIANTS = ["green", "purple", "blue"] as const;
const STEP_CARDS = ["card-neon-green", "card-neon-purple", "card-neon-blue"] as const;
const STEP_HALOS = ["halo-green", "halo-purple", "halo-blue"] as const;

export default function YourRoutePage() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const steps = [
    { icon: Brain, title: t("route.step1Title"), desc: t("route.step1Desc") },
    { icon: TrendingUp, title: t("route.step2Title"), desc: t("route.step2Desc") },
    { icon: Shield, title: t("route.step3Title"), desc: t("route.step3Desc") },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
      {/* ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-[#a855f7]/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="mb-10 text-center space-y-4 animate-fade-in">
        <p className="section-label">{t("route.subtitle")}</p>
        <h1 className="text-heading">
          <span className="gradient-text-green">{t("route.title")}</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
          {t("route.howTitle")}
        </p>
      </section>

      {/* Steps */}
      <section className="mb-12 space-y-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`card-neon ${STEP_CARDS[i]} ${STEP_HALOS[i]}`}>
              <div className="relative flex items-start gap-5 p-6">
                <HexBadge variant={STEP_VARIANTS[i]} size="lg">
                  <Icon className="h-6 w-6" />
                </HexBadge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="section-label">Step {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Two paths */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link href={loc("/bet-of-the-day")} className="card-neon card-neon-green halo-green group">
          <div className="relative p-6 space-y-3">
            <div className="flex items-center gap-3">
              <HexBadge variant="green" size="md">
                <Trophy className="h-5 w-5" />
              </HexBadge>
              <div>
                <h3 className="text-base font-semibold text-white">{t("route.botdTitle")}</h3>
                <p className="text-xs text-[#4ade80] font-medium">{t("route.botdBadge")}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{t("route.botdDesc")}</p>
            <div className="flex items-center gap-1 text-sm font-medium text-[#4ade80] group-hover:gap-2 transition-all">
              {t("route.botdCta")} <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link href={loc("/predictions")} className="card-neon card-neon-blue halo-blue group">
          <div className="relative p-6 space-y-3">
            <div className="flex items-center gap-3">
              <HexBadge variant="blue" size="md">
                <Sparkles className="h-5 w-5" />
              </HexBadge>
              <div>
                <h3 className="text-base font-semibold text-white">{t("route.allTitle")}</h3>
                <p className="text-xs text-[#60a5fa] font-medium">{t("route.allBadge")}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{t("route.allDesc")}</p>
            <div className="flex items-center gap-1 text-sm font-medium text-[#60a5fa] group-hover:gap-2 transition-all">
              {t("route.allCta")} <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* Also explore */}
      <section className="grid gap-3 sm:grid-cols-2 mb-10">
        <Link href={loc("/trackrecord")} className="card-neon card-neon-purple group">
          <div className="relative flex items-center gap-3 p-4">
            <HexBadge variant="purple" size="sm">
              <ClipboardList className="h-4 w-4" />
            </HexBadge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t("route.trackRecordTitle")}</p>
              <p className="text-xs text-slate-400">{t("route.trackRecordDesc")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-[#d8b4fe] transition-colors" />
          </div>
        </Link>
        <Link href={loc("/results")} className="card-neon card-neon-green group">
          <div className="relative flex items-center gap-3 p-4">
            <HexBadge variant="green" size="sm">
              <BarChart3 className="h-4 w-4" />
            </HexBadge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t("route.resultsTitle")}</p>
              <p className="text-xs text-slate-400">{t("route.resultsDesc")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-[#4ade80] transition-colors" />
          </div>
        </Link>
      </section>

      {/* Final CTA */}
      <section className="card-neon card-neon-green halo-green mb-8">
        <div className="relative p-6 sm:p-8 text-center space-y-4">
          <HexBadge variant="green" size="lg" className="mx-auto">
            <Sparkles className="h-6 w-6" />
          </HexBadge>
          <h3 className="text-xl font-semibold text-white">{t("route.botdCta")}</h3>
          <Link href={loc("/bet-of-the-day")} className="btn-primary inline-flex items-center gap-2">
            {t("route.botdCta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <p className="text-center text-[11px] text-slate-600">{t("route.disclaimer")}</p>
    </div>
  );
}
