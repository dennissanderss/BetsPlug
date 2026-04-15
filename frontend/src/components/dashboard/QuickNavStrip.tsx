"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Star, Target, Zap, Trophy, FlaskConical, ArrowRight } from "lucide-react";
import { HexBadge, type HexVariant } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

interface QuickNavStripProps {
  liveCount: number;
}

const HEX_CYCLE: HexVariant[] = ["green", "purple", "blue", "green", "purple"];

export function QuickNavStrip({ liveCount }: QuickNavStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const items = [
    { label: t("dash.nav.botd"), description: t("dash.nav.botd"), href: "/bet-of-the-day", icon: Star, badge: null as number | null },
    { label: t("dash.nav.predictions"), description: t("dash.nav.predictions"), href: "/predictions", icon: Target, badge: null },
    { label: t("dash.nav.live"), description: t("dash.nav.live"), href: "/live", icon: Zap, badge: liveCount > 0 ? liveCount : null },
    { label: t("dash.nav.results"), description: t("dash.nav.results"), href: "/results", icon: Trophy, badge: null },
    { label: t("dash.nav.strategy"), description: t("dash.nav.strategy"), href: "/strategy", icon: FlaskConical, badge: null },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {items.map(({ label, href, icon: Icon, badge }, idx) => {
        const variant = HEX_CYCLE[idx % HEX_CYCLE.length];
        return (
          <Link
            key={href}
            href={lHref(href)}
            className="glass-panel-lifted group flex shrink-0 items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#ededed] transition-all"
          >
            <HexBadge variant={variant} size="sm" noGlow>
              <Icon className="h-4 w-4" />
            </HexBadge>
            <span className="whitespace-nowrap">{label}</span>
            {badge != null && <Pill tone="active">{badge}</Pill>}
            <ArrowRight className="h-3.5 w-3.5 text-[#6b7280] transition-colors group-hover:text-[#4ade80]" />
          </Link>
        );
      })}
    </div>
  );
}
