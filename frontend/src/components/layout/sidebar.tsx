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
  Menu,
  X,
  Sparkles,
  ChevronRight,
  FlaskConical,
  Settings,
  Trophy,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";

interface NavItem {
  labelKey: string;
  fallback: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;  // v3: locks the link and shows "Coming Soon" badge
}

interface NavSection {
  labelKey: string;
  fallbackLabel: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    labelKey: "sidebar.gettingStarted",
    fallbackLabel: "Getting Started",
    items: [
      { labelKey: "nav.jouwRoute", fallback: "Your Route", href: "/jouw-route", icon: MapPin, badge: "START", badgeColor: "bg-emerald-500" },
      { labelKey: "nav.dashboard", fallback: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "sidebar.strategiesAndPicks",
    fallbackLabel: "Strategies & Picks",
    items: [
      { labelKey: "nav.strategy_lab", fallback: "Strategy Lab", href: "/strategy", icon: FlaskConical, comingSoon: true, badge: "SOON", badgeColor: "bg-slate-500" },
      { labelKey: "nav.bet_of_the_day", fallback: "Pick of the Day", href: "/bet-of-the-day", icon: Trophy },
      { labelKey: "nav.predictions", fallback: "Predictions", href: "/predictions", icon: Sparkles },
    ],
  },
  {
    labelKey: "sidebar.performance",
    fallbackLabel: "Performance",
    items: [
      { labelKey: "nav.results", fallback: "Results", href: "/results", icon: Trophy },
      { labelKey: "nav.weekly_report", fallback: "Weekly Report", href: "/weekly-report", icon: FileBarChart2 },
      { labelKey: "nav.trackrecord", fallback: "Trackrecord", href: "/trackrecord", icon: ClipboardList },
      { labelKey: "nav.reports", fallback: "Reports", href: "/reports", icon: FileBarChart2 },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { labelKey: "nav.admin",    fallback: "Admin",    href: "/admin",    icon: ShieldCheck },
  { labelKey: "nav.settings", fallback: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const getLabel = (item: NavItem) => {
    const translated = t(item.labelKey as any);
    return translated === item.labelKey ? item.fallback : translated;
  };

  const getSectionLabel = (section: NavSection) => {
    const translated = t(section.labelKey as any);
    return translated === section.labelKey ? section.fallbackLabel : translated;
  };

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className="flex items-center px-4 py-3 border-b border-white/[0.06]">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Image src="/logo.webp" alt="BetsPlug logo" width={200} height={80} className="h-12 md:h-16 lg:h-20 w-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]" />
        </Link>
      </div>

      {/* ── Nav sections ──
          min-h-0 is required so this flex child can shrink below its
          intrinsic content height. Without it, overflow-y-auto is a
          no-op on shorter viewports (tablet landscape, etc.) and the
          nav list cannot be scrolled. */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-3">
        {navSections.map((section, sIdx) => (
          <div key={section.labelKey}>
            {/* Section divider (not on first section) */}
            {sIdx > 0 && <div className="mx-2 my-3 border-t border-white/[0.06]" />}

            {/* Section label */}
            <div className="px-2 pb-2 pt-1">
              <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                {getSectionLabel(section)}
              </span>
            </div>

            {/* Section items */}
            <div className="space-y-0.5">
        {section.items.map((item) => {
          const localizedHref = loc(item.href);
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/") ||
            pathname === localizedHref || pathname.startsWith(localizedHref + "/");
          const Icon = item.icon;

          // v3: Coming Soon items are rendered as locked (not clickable)
          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                className="nav-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 cursor-not-allowed opacity-60"
                title="Coming Soon — we're collecting data to validate this feature"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-600" />
                <span className="flex-1">{getLabel(item)}</span>
                <span
                  className="text-[9px] font-bold tracking-wider text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/50"
                >
                  SOON
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={localizedHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "nav-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive
                  ? "nav-active"
                  : "text-slate-400"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className={cn("flex-1", isActive ? "text-blue-300" : "group-hover:text-slate-200")}>
                {getLabel(item)}
              </span>

              {/* START badge */}
              {item.badge === "START" && (
                <span
                  className="text-[10px] font-bold tracking-wider text-white px-1.5 py-0.5 rounded"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 0 8px rgba(16,185,129,0.45)",
                  }}
                >
                  START
                </span>
              )}

              {/* HOT badge */}
              {item.badge === "HOT" && (
                <span
                  className="text-[10px] font-bold tracking-wider text-white px-1.5 py-0.5 rounded"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                    boxShadow: "0 0 8px rgba(245,158,11,0.45)",
                  }}
                >
                  HOT
                </span>
              )}

              {/* Active chevron */}
              {isActive && !item.badge && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-400/60" />
              )}
            </Link>
          );
        })}
            </div>
          </div>
        ))}

        {/* ── Separator before Admin / Settings ── */}
        <div className="mx-2 my-3 border-t border-white/[0.06]" />
        <div className="px-2 pb-2 pt-1">
          <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
            {(() => { const v = t("sidebar.system" as any); return v === "sidebar.system" ? "System" : v; })()}
          </span>
        </div>

        {bottomNavItems.map((item) => {
          const localizedHref = loc(item.href);
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/") ||
            pathname === localizedHref || pathname.startsWith(localizedHref + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={localizedHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "nav-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive
                  ? "nav-active"
                  : "text-slate-400"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className={cn("flex-1", isActive ? "text-blue-300" : "group-hover:text-slate-200")}>
                {getLabel(item)}
              </span>

              {/* Active chevron */}
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="mt-auto border-t border-white/[0.06] px-5 py-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="text-xs text-slate-400">{t("common.all_systems" as any)}</span>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] leading-relaxed text-slate-600">
          {t("phrase.educational_only" as any)} {t("phrase.no_financial_advice" as any)}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col"
        style={{
          background: "rgba(10, 14, 26, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

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
        style={{
          background: "rgba(10, 14, 26, 0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <NavContent />
      </aside>
    </>
  );
}
