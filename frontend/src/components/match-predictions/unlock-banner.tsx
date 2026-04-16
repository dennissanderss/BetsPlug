"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Trophy,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * Primary unlock CTA banner — reused on every public
 * match-prediction page. Renders the "3 free, rest locked"
 * value-prop with benefit bullets, a stacked stat visual
 * and two checkout CTAs.
 */
export function UnlockBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const bullets = [
    t("matchPred.bannerBullet1"),
    t("matchPred.bannerBullet2"),
    t("matchPred.bannerBullet3"),
    t("matchPred.bannerBullet4"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card-neon-green relative overflow-hidden rounded-3xl p-6 sm:p-10"
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-[#4ade80]/[0.10] blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-[250px] w-[250px] rounded-full bg-[#34d399]/[0.08] blur-[100px]" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-400">
            <Lock className="h-3 w-3" />
            {t("matchPred.bannerBadge")}
          </div>
          <h2 className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("matchPred.bannerTitle")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
            {t("matchPred.bannerDesc")}
          </p>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-[#a3a9b8]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={loc("/checkout")}
              className="btn-primary group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold"
            >
              {t("matchPred.bannerCta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={loc("/checkout")}
              className="btn-glass inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
            >
              {t("matchPred.bannerCtaSecondary")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-[#6b7280]">
            {t("matchPred.bannerNote")}
          </p>
        </div>

        {/* Visual side — stacked stat cards */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs">
            <div className="card-neon absolute left-0 top-0 w-[85%] rotate-[-4deg] p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
                  Track record
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#ededed]">
                72.4<span className="text-lg text-[#6b7280]">%</span>
              </p>
              <p className="text-[10px] text-[#6b7280]">
                Rolling 30-day accuracy
              </p>
            </div>

            <div className="card-neon-green absolute right-0 top-[30%] w-[85%] rotate-[3deg] p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                  BetsPlug Pulse
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#ededed]">
                3<span className="text-lg text-[#6b7280]"> models</span>
              </p>
              <p className="text-[10px] text-[#6b7280]">
                Elo · Poisson · Logistic · XGBoost
              </p>
            </div>

            <div className="card-neon absolute bottom-0 left-[6%] w-[85%] rotate-[-2deg] p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
                  Live edge
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#ededed]">
                +8.2<span className="text-lg text-[#6b7280]">%</span>
              </p>
              <p className="text-[10px] text-[#6b7280]">
                Avg vs closing line
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
