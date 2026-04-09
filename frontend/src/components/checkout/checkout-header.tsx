"use client";

import Link from "next/link";
import { ArrowLeft, Lock, RefreshCw, Zap } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * CheckoutHeader — a slim, focused header used only on the checkout
 * page. Keeps the visitor in the flow (no main nav), shows the logo
 * on the left, a "back to site" link, and three trust USPs on the
 * right (secure payments, cancel anytime, instant access).
 */
export function CheckoutHeader() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080b14]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo + back-to-site */}
        <div className="flex items-center gap-6">
          <Link href={home} className="flex items-center">
            <img
              src="/logo.webp"
              alt="BetsPlug"
              className="h-10 w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)] sm:h-12"
            />
          </Link>
          <Link
            href={home}
            className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("checkout.backToSite")}
          </Link>
        </div>

        {/* USP row (desktop) */}
        <div className="hidden items-center gap-6 lg:flex">
          {usps.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/[0.08]">
                <Icon className="h-4 w-4 text-green-400" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-[11px] text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact USP strip (tablet) */}
        <div className="hidden items-center gap-4 md:flex lg:hidden">
          {usps.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex items-center gap-2 text-xs font-medium text-slate-300"
            >
              <Icon className="h-4 w-4 text-green-400" />
              {title}
            </div>
          ))}
        </div>

        {/* Mobile: just the lock icon + "secure" label */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 md:hidden">
          <Lock className="h-4 w-4 text-green-400" />
          {t("checkout.header.usp1Title")}
        </div>
      </div>
    </header>
  );
}

export default CheckoutHeader;
