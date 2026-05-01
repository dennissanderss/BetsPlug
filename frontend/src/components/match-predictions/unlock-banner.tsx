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
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

/**
 * UnlockBanner — premium upgrade CTA with colourful gradient
 * background, floating stat cards and ambient neon glows.
 * Matches the homepage hero visual energy.
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
      className="relative overflow-hidden rounded-3xl p-6 sm:p-10"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--accent-green) / 0.25) 0%, hsl(230 22% 9% / 0.9) 40%, hsl(var(--accent-purple) / 0.2) 100%)",
        border: "1px solid hsl(var(--accent-green) / 0.25)",
        boxShadow:
          "0 0 0 1px hsl(var(--accent-green) / 0.08) inset, 0 20px 60px rgba(0,0,0,0.5), 0 0 80px hsl(var(--accent-green) / 0.12)",
      }}
    >
      {/* Big ambient glow blobs for colour energy */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.3)", filter: "blur(130px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-24 h-[380px] w-[380px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.28)", filter: "blur(130px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[200px] w-[500px] -translate-x-1/2 rounded-full"
        style={{ background: "hsl(var(--accent-blue) / 0.14)", filter: "blur(100px)" }}
      />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        {/* Copy side */}
        <div>
          <Pill tone="active" className="mb-5">
            <Lock className="h-3 w-3" />
            {t("matchPred.bannerBadge")}
          </Pill>

          <h2 className="text-display text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("matchPred.bannerTitle")}
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#c8cdd6]">
            {t("matchPred.bannerDesc")}
          </p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-[#c8cdd6]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80]" strokeWidth={2.5} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={loc("/checkout")}
              className="btn-primary group inline-flex items-center justify-center gap-2"
            >
              {t("matchPred.bannerCta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="https://betsplug.com/pricing"
              className="btn-glass inline-flex items-center justify-center gap-2"
            >
              {t("matchPred.bannerCtaSecondary")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-[#6b7280]">
            {t("matchPred.bannerNote")}
          </p>
        </div>

        {/* Visual side — layered stat cards with colour halos */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs">
            {/* Card 1 — Track record (green glow) */}
            <div
              className="card-neon card-neon-green halo-green absolute left-0 top-0 w-[85%] rotate-[-4deg] p-5"
            >
              <div className="relative flex items-center gap-2.5">
                <HexBadge variant="green" size="sm" noGlow>
                  <Trophy className="h-3.5 w-3.5" />
                </HexBadge>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">
                  Track record
                </span>
              </div>
              <p className="relative mt-3 text-stat text-4xl text-[#ededed]">
                72.4<span className="text-lg text-[#6b7280]">%</span>
              </p>
              <p className="relative text-[10px] text-[#a3a9b8]">
                Rolling 30-day accuracy
              </p>
            </div>

            {/* Card 2 — BetsPlug Pulse (purple glow) */}
            <div
              className="card-neon card-neon-purple halo-purple absolute right-0 top-[30%] w-[85%] rotate-[3deg] p-5"
            >
              <div className="relative flex items-center gap-2.5">
                <HexBadge variant="purple" size="sm" noGlow>
                  <Activity className="h-3.5 w-3.5" />
                </HexBadge>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d8b4fe]">
                  BetsPlug Pulse
                </span>
              </div>
              <p className="relative mt-3 text-stat text-4xl text-[#ededed]">
                3<span className="text-lg text-[#a3a9b8]"> models</span>
              </p>
              <p className="relative text-[10px] text-[#a3a9b8]">
                Elo · Poisson · Logistic · XGBoost
              </p>
            </div>

            {/* Card 3 — Live edge (blue glow) */}
            <div
              className="card-neon card-neon-blue halo-blue absolute bottom-0 left-[6%] w-[85%] rotate-[-2deg] p-5"
            >
              <div className="relative flex items-center gap-2.5">
                <HexBadge variant="blue" size="sm" noGlow>
                  <TrendingUp className="h-3.5 w-3.5" />
                </HexBadge>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#93c5fd]">
                  Live edge
                </span>
              </div>
              <p className="relative mt-3 text-stat text-4xl text-[#ededed]">
                +8.2<span className="text-lg text-[#6b7280]">%</span>
              </p>
              <p className="relative text-[10px] text-[#a3a9b8]">
                Avg vs closing line
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
