"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Star, Target, Trophy, ArrowRight } from "lucide-react";
import { HexBadge, type HexVariant } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

const HEX_CYCLE: HexVariant[] = ["green", "purple", "blue", "green", "purple"];

export function QuickNavStrip() {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const items = [
    { label: t("dash.nav.predictions"), description: t("dash.nav.predictions"), href: "/predictions", icon: Target, badge: null as number | null },
    { label: t("dash.nav.results"), description: t("dash.nav.results"), href: "/results", icon: Trophy, badge: null },
  ];

  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {items.map(({ label, href, icon: Icon, badge }, idx) => {
        const variant = HEX_CYCLE[idx % HEX_CYCLE.length];
        return (
          <Link
            key={href}
            href={lHref(href)}
            className="glass-panel-lifted group flex shrink-0 items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-[#ededed] transition-all"
          >
            <HexBadge variant={variant} size="sm" noGlow>
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </HexBadge>
            <span className="whitespace-nowrap">{label}</span>
            {badge != null && <Pill tone="active">{badge}</Pill>}
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#6b7280] transition-colors group-hover:text-[#4ade80]" />
          </Link>
        );
      })}
    </div>
  );
}
