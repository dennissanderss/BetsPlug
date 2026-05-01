"use client";

/**
 * LockedLivePlaceholder — public-page stand-in for the two "live
 * measurement" surfaces (tier live + BOTD live).
 *
 * For anonymous visitors the real zero-from-day-one data would read
 * as "the product doesn't work", so we show a login gate instead.
 *
 * For signed-in users (token present in localStorage) we swap the
 * gate out for the actual live component — `LiveMeasurementSection`
 * for tier live, `BotdLiveTrackingSection` for BotD live — so the
 * /prestaties page shows the full live picture and the user doesn't
 * have to hop to /trackrecord just to see two numbers.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Activity, ArrowRight } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { useTier } from "@/hooks/use-tier";
import { LiveMeasurementSection } from "./live-measurement-section";
import { BotdLiveTrackingSection } from "./botd-live-tracking-section";

interface LockedLivePlaceholderProps {
  /** Visible section number (e.g. "2", "3", or "4"). */
  number: "2" | "3" | "4";
  /** Which data surface this placeholder replaces. */
  variant: "tier" | "botd";
  /** HTML anchor id for TOC links. */
  id: string;
}

export function LockedLivePlaceholder({
  number,
  variant,
  id,
}: LockedLivePlaceholderProps) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  // Auth + tier-aware: signed-in readers get the real live section
  // inline, but we respect the paywall. For the BOTD variant Silver
  // and Free tiers are BLOCKED (product rule: BOTD is Gold+ only, and
  // Gold/Platinum see the same stream), so they still see an upgrade
  // teaser here. Tier variant has no BOTD lock and just needs a
  // signed-in session.
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    try {
      setHasToken(Boolean(window.localStorage.getItem("betsplug_token")));
    } catch {
      setHasToken(false);
    }
  }, []);

  // useTier handles its own /subscriptions/me sync so the BOTD gate
  // immediately reflects upgrades the moment the API responds.
  const { hasAccess: hasTierAccess } = useTier();
  const tierHasBotdAccess = hasTierAccess("gold");

  if (hasToken) {
    if (variant === "tier") {
      return <LiveMeasurementSection />;
    }
    // BOTD variant: Gold+ only.
    if (tierHasBotdAccess) {
      return <BotdLiveTrackingSection />;
    }
    // Free/Silver signed-in → keep the lock screen but swap the copy
    // to an upgrade pitch (handled below via `variant === 'botd'` +
    // headline/body override).
  }

  const title =
    variant === "tier"
      ? t("locked.tierTitle", { number })
      : t("locked.botdTitle", { number });

  // For signed-in Free/Silver users hitting the BOTD variant we swap
  // the copy to an upgrade pitch (product rule: BOTD is Gold+ only).
  // For signed-out users we keep the original "sign in to view"
  // framing. Both flow into the same lock-card template below.
  const isBotdPaywallForSignedIn =
    hasToken && variant === "botd" && !tierHasBotdAccess;

  const headline = isBotdPaywallForSignedIn
    ? t("locked.botdPaywallHeadline")
    : t("locked.signInHeadline");

  const body = isBotdPaywallForSignedIn
    ? t("locked.botdPaywallBody")
    : variant === "tier"
      ? t("locked.tierBody")
      : t("locked.botdBody");

  const loginHref = loc("/login");
  const dashboardHref = loc("/trackrecord");

  return (
    <section
      id={id}
      className="relative overflow-hidden py-20 md:py-28 scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[440px] w-[440px] rounded-full"
        style={{
          background: "hsl(var(--accent-blue) / 0.08)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <span className="section-label">
            <Activity className="h-3 w-3" />
            {title}
          </span>
        </motion.div>

        {/* The locked card itself */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="card-neon card-neon-blue relative overflow-hidden rounded-3xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full"
            style={{
              background: "hsl(var(--accent-blue) / 0.18)",
              filter: "blur(120px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-20 h-[320px] w-[320px] rounded-full"
            style={{
              background: "hsl(var(--accent-green) / 0.12)",
              filter: "blur(120px)",
            }}
          />

          <div className="relative p-6 sm:p-10 md:p-14">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
              <div className="shrink-0">
                <HexBadge variant="blue" size="lg">
                  <Lock className="h-6 w-6" />
                </HexBadge>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-heading text-balance break-words text-2xl text-[#ededed] sm:text-3xl">
                  {headline}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
                  {body}
                </p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  {isBotdPaywallForSignedIn ? (
                    <>
                      <Link
                        href="https://betsplug.com/pricing"
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        {t("locked.upgradeGold")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={loc("/bet-of-the-day")}
                        className="btn-glass inline-flex items-center gap-2"
                      >
                        {t("locked.previewBotd")}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href={loginHref}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        {t("locked.signIn")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={dashboardHref}
                        className="btn-glass inline-flex items-center gap-2"
                      >
                        {t("locked.goToDashboard")}
                      </Link>
                    </>
                  )}
                </div>

                <p className="mt-6 text-[11px] leading-relaxed text-[#6b7280]">
                  {isBotdPaywallForSignedIn
                    ? t("locked.footnotePaywall")
                    : t("locked.footnoteSignedOut")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LockedLivePlaceholder;
