"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, RefreshCw, Zap } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * CheckoutHeader — a slim, focused header used only on the checkout
 * page. Keeps the visitor in the flow (no main nav), shows the logo
 * on the left, a "back to site" link, and three trust USPs on the
 * right (secure payments, cancel anytime, instant access).
 */
// After the marketing/app split (2026-05-01) "home" lives on the
// public Astro site at betsplug.com. The Next.js project never owns
// a homepage anymore — every logo / "back to site" link must go to
// the Astro origin so users always land in the marketing surface
// and never see a Next.js homepage flicker.
const PUBLIC_HOME = "https://betsplug.com";

export function CheckoutHeader() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  void loc; // kept for future locale-aware deeper links

  const usps = [
    {
      icon: Lock,
      title: t("checkout.header.usp1Title"),
      desc: t("checkout.header.usp1Desc"),
    },
    {
      icon: RefreshCw,
      title: t("checkout.header.usp2Title"),
      desc: t("checkout.header.usp2Desc"),
    },
    {
      icon: Zap,
      title: t("checkout.header.usp3Title"),
      desc: t("checkout.header.usp3Desc"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0a1220]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo + back-to-site */}
        <div className="flex items-center gap-6">
          <Link href={PUBLIC_HOME} className="flex items-center">
            <Image
              src="/logo.webp"
              alt="BetsPlug logo"
              width={120}
              height={48}
              className="h-10 w-auto sm:h-12"
            />
          </Link>
          <Link
            href={PUBLIC_HOME}
            className="hidden items-center gap-1.5 text-xs font-medium text-[#6b7280] transition-colors hover:text-[#ededed] sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("checkout.backToSite")}
          </Link>
        </div>

        {/* USP row (desktop) */}
        <div className="hidden items-center gap-6 lg:flex">
          {usps.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/[0.08]">
                <Icon className="h-4 w-4 text-green-400" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[#ededed]">{title}</div>
                <div className="text-[11px] text-[#6b7280]">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact USP strip (tablet) */}
        <div className="hidden items-center gap-4 md:flex lg:hidden">
          {usps.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex items-center gap-2 text-xs font-medium text-[#a3a9b8]"
            >
              <Icon className="h-4 w-4 text-green-400" />
              {title}
            </div>
          ))}
        </div>

        {/* Mobile: just the lock icon + "secure" label */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#a3a9b8] md:hidden">
          <Lock className="h-4 w-4 text-green-400" />
          {t("checkout.header.usp1Title")}
        </div>
      </div>
    </header>
  );
}

export default CheckoutHeader;
