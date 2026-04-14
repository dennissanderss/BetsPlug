"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Star, Target, Zap, Trophy, FlaskConical } from "lucide-react";

interface QuickNavStripProps {
  liveCount: number;
}

export function QuickNavStrip({ liveCount }: QuickNavStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const items = [
    { label: t("dash.nav.botd"), href: "/bet-of-the-day", icon: Star },
    { label: t("dash.nav.predictions"), href: "/predictions", icon: Target },
    { label: t("dash.nav.live"), href: "/live", icon: Zap, badge: liveCount > 0 ? liveCount : null },
    { label: t("dash.nav.results"), href: "/results", icon: Trophy },
    { label: t("dash.nav.strategy"), href: "/strategy", icon: FlaskConical },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {items.map(({ label, href, icon: Icon, badge }) => (
        <Link
          key={href}
          href={lHref(href)}
          className="group flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-white/[0.08] hover:text-white"
        >
          <Icon className="h-4 w-4 text-emerald-400" />
          <span>{label}</span>
          {badge != null && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/20 px-1.5 text-[10px] font-bold tabular-nums text-emerald-400">
              {badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
