"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart2,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Trophy,
  MapPin,
  Telescope,
  LineChart,
  Activity,
  Layers,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Pill } from "@/components/noct/pill";
import { useTier, type Tier } from "@/hooks/use-tier";
import { UpgradeLockModal } from "@/components/noct/upgrade-lock-modal";
import { useNavState } from "@/components/layout/nav-state-context";

interface NavItem {
  labelKey: string;
  fallback: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;
  /** Minimum tier needed to access. Lower tiers see a locked item. */
  requiredTier?: Tier;
  /** i18n key for the short one-liner shown in the upgrade modal. */
  lockBlurbKey?: string;
  /** i18n keys for the benefit checklist shown in the upgrade modal. */
  lockBenefitKeys?: string[];
}

interface NavSection {
  labelKey: string;
  fallbackLabel: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    labelKey: "sidebar.overview",
    fallbackLabel: "Overview",
    items: [
      { labelKey: "nav.jouwRoute", fallback: "How It Works", href: "/jouw-route", icon: MapPin, badge: "START" },
      { labelKey: "nav.dashboard", fallback: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "sidebar.predictions",
    fallbackLabel: "Predictions",
    items: [
      { labelKey: "nav.bet_of_the_day", fallback: "Pick of the Day", href: "/bet-of-the-day", icon: Trophy },
      { labelKey: "nav.predictions", fallback: "All Predictions", href: "/predictions", icon: Sparkles },
    ],
  },
  {
    labelKey: "sidebar.results",
    fallbackLabel: "Results",
    items: [
      { labelKey: "nav.results", fallback: "Results & Analysis", href: "/results", icon: Trophy },
      { labelKey: "nav.trackrecord", fallback: "Track Record", href: "/trackrecord", icon: ClipboardList },
      { labelKey: "nav.reports", fallback: "Reports", href: "/reports", icon: FileBarChart2 },
    ],
  },
  {
    labelKey: "sidebar.analyst",
    fallbackLabel: "Data Analyst",
    items: [
      {
        labelKey: "nav.analyst_hub",
        fallback: "Analyst Hub",
        href: "/analyst",
        icon: Layers,
        requiredTier: "gold",
        lockBlurbKey: "lock.analystHub.blurb",
        lockBenefitKeys: [
          "lock.analystHub.benefit1",
          "lock.analystHub.benefit2",
          "lock.analystHub.benefit3",
        ],
      },
      {
        labelKey: "nav.predictions_explorer",
        fallback: "Predictions Explorer",
        href: "/analyst/predictions",
        icon: Telescope,
        requiredTier: "gold",
        lockBlurbKey: "lock.predictionsExplorer.blurb",
        lockBenefitKeys: [
          "lock.predictionsExplorer.benefit1",
          "lock.predictionsExplorer.benefit2",
          "lock.predictionsExplorer.benefit3",
          "lock.predictionsExplorer.benefit4",
        ],
      },
      {
        labelKey: "nav.match_deep_dive",
        fallback: "Match Deep Dive",
        href: "/analyst/matches",
        icon: Activity,
        requiredTier: "silver", // Silver sees teaser preview, Gold+ full
        lockBlurbKey: "lock.matchDeepDive.blurb",
        lockBenefitKeys: [
          "lock.matchDeepDive.benefit1",
          "lock.matchDeepDive.benefit2",
          "lock.matchDeepDive.benefit3",
          "lock.matchDeepDive.benefit4",
        ],
      },
      {
        labelKey: "nav.engine_performance",
        fallback: "Engine Performance",
        href: "/analyst/engine-performance",
        icon: LineChart,
        requiredTier: "gold",
        lockBlurbKey: "lock.enginePerformance.blurb",
        lockBenefitKeys: [
          "lock.enginePerformance.benefit1",
          "lock.enginePerformance.benefit2",
          "lock.enginePerformance.benefit3",
          "lock.enginePerformance.benefit4",
        ],
      },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { labelKey: "nav.admin", fallback: "Admin", href: "/admin", icon: ShieldCheck },
];

type LockedFeature = {
  label: string;
  requiredTier: Exclude<Tier, "free">;
  blurb?: string;
  benefits?: string[];
};

/**
 * Sidebar — NOCTURNE glass-panel surface with ambient green glow.
 */
export function Sidebar() {
  const pathname = usePathname();
  // Drawer state lives in a shared context so the Header's hamburger
  // can open/close us. Falls back to a no-op provider when the tree
  // doesn't have one (e.g. storybook, tests).
  const { mobileOpen, setMobileOpen } = useNavState();
  const [lockedFeature, setLockedFeature] =
    React.useState<LockedFeature | null>(null);
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const { hasAccess, ready: tierReady } = useTier();

  const getLabel = (item: NavItem) => {
    const translated = t(item.labelKey as any);
    return translated === item.labelKey ? item.fallback : translated;
  };

  const getSectionLabel = (section: NavSection) => {
    const translated = t(section.labelKey as any);
    return translated === section.labelKey ? section.fallbackLabel : translated;
  };

  const openLockFor = (item: NavItem) => {
    if (!item.requiredTier || item.requiredTier === "free") return;
    // Translate blurb/benefit keys at open time so locale changes are
    // reflected without rebuilding the navSections array.
    const blurb = item.lockBlurbKey ? t(item.lockBlurbKey as any) : undefined;
    const benefits = item.lockBenefitKeys?.map((k) => t(k as any));
    setLockedFeature({
      label: getLabel(item),
      requiredTier: item.requiredTier as Exclude<Tier, "free">,
      blurb: blurb && blurb !== item.lockBlurbKey ? blurb : undefined,
      benefits,
    });
  };

  const renderItem = (item: NavItem) => {
    const localizedHref = loc(item.href);
    const isActive =
      pathname === item.href ||
      pathname.startsWith(item.href + "/") ||
      pathname === localizedHref ||
      pathname.startsWith(localizedHref + "/");
    const Icon = item.icon;

    if (item.comingSoon) {
      return (
        <div
          key={item.href}
          className="glass-panel group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6b7280] cursor-not-allowed opacity-70"
          title="Coming Soon"
        >
          <Icon className="h-4 w-4 shrink-0 text-[#6b7280]" />
          <span className="flex-1">{getLabel(item)}</span>
          <Pill tone="default" className="text-[9px]">SOON</Pill>
        </div>
      );
    }

    // Tier-locked item — only treat as locked once tier state has hydrated
    // so admins / paid users don't see a flash of lock icons on first paint.
    const locked =
      item.requiredTier &&
      item.requiredTier !== "free" &&
      tierReady &&
      !hasAccess(item.requiredTier);

    if (locked) {
      return (
        <button
          key={item.href}
          type="button"
          onClick={() => {
            setMobileOpen(false);
            openLockFor(item);
          }}
          className="nav-item group flex w-full items-center gap-3 text-sm font-medium text-[#6b7280] hover:text-[#a3a9b8]"
        >
          <Icon className="h-4 w-4 shrink-0 text-[#6b7280] group-hover:text-[#a3a9b8] transition-colors" />
          <span className="flex-1 text-left">{getLabel(item)}</span>
          <Lock className="h-3.5 w-3.5 text-[#6b7280] group-hover:text-[#a3a9b8]" />
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={localizedHref}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "nav-item group flex items-center gap-3 text-sm font-medium",
          isActive ? "nav-active" : "text-[#a3a9b8]"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-[#4ade80]" : "text-[#a3a9b8] group-hover:text-[#ededed]"
          )}
        />
        <span
          className={cn(
            "flex-1",
            isActive ? "text-[#4ade80]" : "group-hover:text-[#ededed]"
          )}
        >
          {getLabel(item)}
        </span>

        {item.badge === "START" && <Pill tone="active">START</Pill>}
        {item.badge === "HOT" && <Pill tone="loss">HOT</Pill>}

        {isActive && !item.badge && (
          <ChevronRight className="h-3.5 w-3.5 text-[#4ade80]/60" />
        )}
      </Link>
    );
  };

  const NavContent = () => (
    <div className="relative flex h-full flex-col">
      {/* Ambient glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-10 h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(74,222,128,0.18), transparent 70%)" }}
      />

      {/* Logo */}
      <div className="relative flex items-center px-4 py-3 border-b border-white/[0.06]">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.webp"
            alt="BetsPlug logo"
            width={200}
            height={80}
            className="h-12 md:h-16 lg:h-20 w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.35)]"
          />
        </Link>
      </div>

      <nav className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-3">
        {navSections.map((section, sIdx) => (
          <div key={section.labelKey}>
            {sIdx > 0 && <div className="mx-2 my-3 border-t border-white/[0.06]" />}

            <div className="px-2 pb-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                {getSectionLabel(section)}
              </span>
            </div>

            <div className="space-y-0.5">{section.items.map(renderItem)}</div>
          </div>
        ))}

        <div className="mx-2 my-3 border-t border-white/[0.06]" />
        <div className="px-2 pb-2 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            {(() => {
              const v = t("sidebar.system" as any);
              return v === "sidebar.system" ? "System" : v;
            })()}
          </span>
        </div>

        {bottomNavItems.map(renderItem)}
      </nav>

      {/* Footer */}
      <div className="relative mt-auto border-t border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="text-xs text-[#a3a9b8]">{t("common.all_systems" as any)}</span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#6b7280]">
          {t("phrase.educational_only" as any)} {t("phrase.no_financial_advice" as any)}
        </p>
      </div>
    </div>
  );

  const sidebarStyle: React.CSSProperties = {
    background:
      "linear-gradient(180deg, hsl(230 22% 8%) 0%, hsl(234 25% 5%) 100%)",
    borderRight: "1px solid rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col" style={sidebarStyle}>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-60 transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={sidebarStyle}
      >
        <NavContent />
      </aside>

      {/* Upgrade modal — shared between desktop + mobile drawer */}
      <UpgradeLockModal
        open={lockedFeature !== null}
        onOpenChange={(open) => {
          if (!open) setLockedFeature(null);
        }}
        feature={lockedFeature?.label ?? ""}
        requiredTier={lockedFeature?.requiredTier ?? "gold"}
        blurb={lockedFeature?.blurb}
        benefits={lockedFeature?.benefits}
      />
    </>
  );
}
