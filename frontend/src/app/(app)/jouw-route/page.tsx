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
  Globe,
} from "lucide-react";
import { HexBadge, type HexVariant } from "@/components/noct/hex-badge";

const STEP_VARIANTS: HexVariant[] = ["green", "purple", "blue"];

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

      {/* Steps — hero visual (left) + 3 frosted cards (right) */}
      <section className="relative mb-12">
        {/* ── SVG network backdrop — subtle connection grid ───────── */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
          viewBox="0 0 600 500"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="netfade" cx="30%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="url(#netfade)" strokeWidth="0.5" fill="none">
            <path d="M50 80 L180 150 L120 260 L240 320 L90 400" />
            <path d="M180 150 L310 120 L400 220 L330 350 L240 320" />
            <path d="M310 120 L430 90 L520 200 L400 220" />
            <path d="M120 260 L240 320 L330 350 L290 440" />
            <path d="M520 200 L470 330 L380 420" />
          </g>
          <g fill="#4ade80" fillOpacity="0.7">
            <circle cx="50" cy="80" r="2" />
            <circle cx="180" cy="150" r="2.5" />
            <circle cx="310" cy="120" r="2" />
            <circle cx="430" cy="90" r="1.8" />
            <circle cx="520" cy="200" r="2" />
            <circle cx="120" cy="260" r="2" />
            <circle cx="240" cy="320" r="2.5" />
            <circle cx="400" cy="220" r="2" />
            <circle cx="330" cy="350" r="2" />
            <circle cx="470" cy="330" r="1.8" />
            <circle cx="90" cy="400" r="2" />
            <circle cx="290" cy="440" r="2" />
            <circle cx="380" cy="420" r="2" />
          </g>
        </svg>

        <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* ── Hero visual — hologram globe emblem (mirrors image #11) ── */}
          <div className="relative flex h-[380px] items-center justify-center md:h-[500px]">
            {/* Radial ambient glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(74,222,128,0.30) 0%, rgba(74,222,128,0.08) 35%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            {/* Concentric rings */}
            <div
              aria-hidden
              className="absolute h-[360px] w-[360px] rounded-full border border-[#4ade80]/15 animate-pulse-slow"
            />
            <div
              aria-hidden
              className="absolute h-[260px] w-[260px] rounded-full border border-[#4ade80]/25"
            />
            <div
              aria-hidden
              className="absolute h-[180px] w-[180px] rounded-full border border-[#4ade80]/35"
            />

            {/* Central emblem — Globe inside glowing disk */}
            <div
              className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full border border-[#4ade80]/50 bg-[#0a0f14]"
              style={{
                boxShadow:
                  "0 0 60px rgba(74,222,128,0.45), inset 0 0 30px rgba(74,222,128,0.15)",
              }}
            >
              <Globe className="h-16 w-16 text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
            </div>

            {/* Orbiting hex-badge chips — hint at the 3 steps */}
            <div className="absolute top-4 left-2 md:top-10 md:left-8 animate-pulse-slow">
              <HexBadge variant="green" size="sm">
                <Brain className="h-3.5 w-3.5" />
              </HexBadge>
            </div>
            <div className="absolute bottom-8 left-10 md:bottom-16 md:left-14">
              <HexBadge variant="purple" size="sm">
                <TrendingUp className="h-3.5 w-3.5" />
              </HexBadge>
            </div>
            <div className="absolute top-14 right-4 md:top-20 md:right-6 animate-pulse-slow">
              <HexBadge variant="blue" size="sm">
                <Shield className="h-3.5 w-3.5" />
              </HexBadge>
            </div>
          </div>

          {/* ── 3 frosted glass cards — mirrors the RHS of image #11 ── */}
          <div className="relative space-y-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const variant = STEP_VARIANTS[i];
              const kickerTone =
                variant === "green"
                  ? "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/[0.08]"
                  : variant === "purple"
                    ? "text-[#c084fc] border-[#c084fc]/30 bg-[#c084fc]/[0.08]"
                    : "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/[0.08]";
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-xl transition-all hover:border-white/[0.18] hover:bg-white/[0.06]"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* Top-left highlight sheen */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />

                  <div className="relative flex items-start gap-4 p-5 sm:p-6">
                    <div className="min-w-0 flex-1 space-y-2">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${kickerTone}`}
                      >
                        {t("welcomeBanner.stepPrefix")} {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-lg font-bold text-white sm:text-xl">
                        {s.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-300/90">
                        {s.desc}
                      </p>
                    </div>
                    <HexBadge variant={variant} size="md">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link href={loc("/combi-of-the-day")} className="card-neon card-neon-green halo-green group">
          <div className="relative p-6 space-y-3">
            <div className="flex items-center gap-3">
              <HexBadge variant="green" size="md">
                <Trophy className="h-5 w-5" />
              </HexBadge>
              <div>
                <h3 className="text-base font-semibold text-white">{t("route.comboTitle")}</h3>
                <p className="text-xs text-[#4ade80] font-medium">{t("route.comboBadge")}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{t("route.comboDesc")}</p>
            <div className="flex items-center gap-1 text-sm font-medium text-[#4ade80] group-hover:gap-2 transition-all">
              {t("route.comboCta")} <ArrowRight className="h-4 w-4" />
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
          <h3 className="text-xl font-semibold text-white">{t("route.comboCta")}</h3>
          <Link href={loc("/combi-of-the-day")} className="btn-primary inline-flex items-center gap-2">
            {t("route.comboCta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <p className="text-center text-[11px] text-slate-600">{t("route.disclaimer")}</p>
    </div>
  );
}
