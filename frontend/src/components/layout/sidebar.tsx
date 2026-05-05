"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Trophy,
  Lock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Pill } from "@/components/noct/pill";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useAuth } from "@/lib/auth";
import { UpgradeLockModal } from "@/components/noct/upgrade-lock-modal";
import { ComingSoonModal } from "@/components/noct/coming-soon-modal";
import { useNavState } from "@/components/layout/nav-state-context";

interface NavItem {
  labelKey: string;
  fallback: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;
  /** i18n key for the modal headline shown when a coming-soon item is clicked. Defaults to the item label. */
  comingSoonTitleKey?: string;
  /** i18n key for the modal body shown when a coming-soon item is clicked. */
  comingSoonBodyKey?: string;
  /** i18n key for the small pill ("In development") shown in the modal. */
  comingSoonBadgeKey?: string;
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
      { labelKey: "nav.dashboard", fallback: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "START" },
    ],
  },
  {
    labelKey: "sidebar.predictions",
    fallbackLabel: "Predictions",
    items: [
      // Pick of the Day mirrors the PaywallOverlay tier on the page
      // itself (bet-of-the-day/page.tsx). Without this the nav item is
      // clickable for Free users and only paywalls on arrival —
      // inconsistent state between sidebar and page.
      { labelKey: "nav.bet_of_the_day", fallback: "Pick of the Day", href: "/bet-of-the-day", icon: Trophy, requiredTier: "gold" },
      // Combi van de Dag = Gold/Platinum only — multi-leg edge product,
      // not a Free/Silver feature.
      { labelKey: "nav.combo_of_the_day", fallback: "Combo of the Day", href: "/combi-of-the-day", icon: Layers, requiredTier: "gold" },
      { labelKey: "nav.predictions", fallback: "All Predictions", href: "/predictions", icon: Sparkles },
    ],
  },
  {
    labelKey: "sidebar.results",
    fallbackLabel: "Results",
    items: [
      { labelKey: "nav.results", fallback: "Results & Simulation", href: "/results", icon: Trophy },
      { labelKey: "nav.trackrecord", fallback: "Track Record", href: "/trackrecord", icon: ClipboardList },
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

type ComingSoonFeature = {
  label: string;
  body: string;
  badge?: string;
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
  const [comingSoonFeature, setComingSoonFeature] =
    React.useState<ComingSoonFeature | null>(null);
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const { hasAccess, ready: tierReady } = useTier();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  // Only admins see the Admin entry in the System section.
  const visibleBottomNavItems = isAdmin
    ? bottomNavItems
    : bottomNavItems.filter((item) => item.href !== "/admin");

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

  const openComingSoonFor = (item: NavItem) => {
    const titleKey = item.comingSoonTitleKey;
    const bodyKey = item.comingSoonBodyKey;
    const badgeKey = item.comingSoonBadgeKey;
    const title = titleKey ? t(titleKey as any) : undefined;
    const body = bodyKey ? t(bodyKey as any) : undefined;
    const badge = badgeKey ? t(badgeKey as any) : undefined;
    setComingSoonFeature({
      label: title && title !== titleKey ? title : getLabel(item),
      body: body && body !== bodyKey ? body : "",
      badge: badge && badge !== badgeKey ? badge : undefined,
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

    // Coming-soon items open a small teaser modal for regular users
    // explaining the feature is in development. Admins always get a
    // working link so they can QA in-development tools.
    if (item.comingSoon && !isAdmin) {
      return (
        <button
          key={item.href}
          type="button"
          onClick={() => {
            setMobileOpen(false);
            openComingSoonFor(item);
          }}
          className="sidebar-item w-full !text-[hsl(var(--text-muted))] hover:!text-[hsl(var(--text-secondary))]"
          title="Coming Soon"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{getLabel(item)}</span>
          <Lock className="h-3.5 w-3.5" />
          <Pill tone="default" className="!text-[9px]">SOON</Pill>
        </button>
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
          className="sidebar-item w-full !text-[hsl(var(--text-muted))] hover:!text-[hsl(var(--text-secondary))]"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{getLabel(item)}</span>
          <Lock className="h-3.5 w-3.5" />
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={localizedHref}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "sidebar-item",
          isActive && "sidebar-item-active"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{getLabel(item)}</span>

        {item.badge === "START" && <Pill tone="active" className="!text-[9px]">START</Pill>}
        {item.badge === "HOT" && <Pill tone="loss" className="!text-[9px]">HOT</Pill>}

        {isActive && !item.badge && (
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
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
        <Link href="https://betsplug.com" onClick={() => setMobileOpen(false)}>
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
            <div className="sidebar-section-label" style={{ marginTop: sIdx === 0 ? 0 : undefined }}>
              <span>
                {getSectionLabel(section)}
              </span>
            </div>

            <div className="space-y-0.5">{section.items.map(renderItem)}</div>
          </div>
        ))}

        {visibleBottomNavItems.length > 0 && (
          <>
            <div className="sidebar-section-label">
              <span>
                {(() => {
                  const v = t("sidebar.system" as any);
                  return v === "sidebar.system" ? "System" : v;
                })()}
              </span>
            </div>

            {visibleBottomNavItems.map(renderItem)}
          </>
        )}
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

      {/* Coming-soon teaser — fired by sidebar items flagged comingSoon */}
      <ComingSoonModal
        open={comingSoonFeature !== null}
        onOpenChange={(open) => {
          if (!open) setComingSoonFeature(null);
        }}
        feature={comingSoonFeature?.label ?? ""}
        body={comingSoonFeature?.body ?? ""}
        badge={comingSoonFeature?.badge}
        closeLabel={t("common.close" as any)}
      />
    </>
  );
}
