"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  FileBarChart2,
  ShieldCheck,
  Menu,
  X,
  TrendingUp,
  Radio,
  Sparkles,
  ChevronRight,
  FlaskConical,
  Settings,
  Gift,
  BookOpen,
  Trophy,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface NavItem {
  labelKey: string;
  fallback: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { labelKey: "nav.jouwRoute", fallback: "Jouw Route", href: "/jouw-route", icon: MapPin, badge: "START", badgeColor: "bg-emerald-500" },
  { labelKey: "nav.about",          fallback: "About",          href: "/about",          icon: BookOpen },
  { labelKey: "nav.dashboard",      fallback: "Dashboard",      href: "/dashboard",      icon: LayoutDashboard },
  { labelKey: "nav.search",         fallback: "Search",         href: "/search",         icon: Search },
  { labelKey: "nav.live_matches",   fallback: "Live Matches",   href: "/live",           icon: Radio,         badge: "LIVE" },
  { labelKey: "nav.bet_of_the_day", fallback: "Pick of the Day", href: "/bet-of-the-day", icon: Trophy,        badge: "HOT" },
  { labelKey: "nav.predictions",    fallback: "Predictions",    href: "/predictions",    icon: Sparkles },
  { labelKey: "nav.results",         fallback: "Results",         href: "/results",        icon: Trophy },
  { labelKey: "nav.weekly_report",  fallback: "Weekly Report",  href: "/weekly-report",  icon: FileBarChart2 },
  { labelKey: "nav.strategy_lab",   fallback: "Strategy Lab",   href: "/strategy",       icon: FlaskConical },
  { labelKey: "nav.trackrecord",    fallback: "Trackrecord",    href: "/trackrecord",    icon: ClipboardList },
  { labelKey: "nav.reports",        fallback: "Reports",        href: "/reports",        icon: FileBarChart2 },
  { labelKey: "nav.admin",          fallback: "Admin",          href: "/admin",          icon: ShieldCheck },
];

const bottomNavItems: NavItem[] = [
  { labelKey: "nav.settings", fallback: "Settings", href: "/settings", icon: Settings },
  { labelKey: "nav.deals",    fallback: "Deals",    href: "/deals",    icon: Gift,    badge: "NEW" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useTranslation();

  const getLabel = (item: NavItem) => {
    const translated = t(item.labelKey as any);
    return translated === item.labelKey ? item.fallback : translated;
  };

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className="flex items-center px-4 py-3 border-b border-white/[0.06]">
        <img src="/logo.webp" alt="BetsPlug" className="h-12 md:h-16 lg:h-20 w-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]" />
      </div>

      {/* ── Nav section label ── */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
          Navigation
        </span>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const isLive = item.badge === "LIVE";

          return (
            <Link
              key={item.href}
              href={item.href}
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

              {/* LIVE badge with pulsing dot */}
              {isLive && (
                <span className="flex items-center gap-1.5">
                  <span className="live-dot-red" />
                  <span className="text-[10px] font-bold text-red-400 tracking-wider">
                    LIVE
                  </span>
                </span>
              )}

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
              {isActive && !isLive && !item.badge && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-400/60" />
              )}
            </Link>
          );
        })}

        {/* ── Separator before Settings / Deals ── */}
        <div className="mx-2 my-2 border-t border-white/[0.06]" />

        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const isNew = item.badge === "NEW";

          return (
            <Link
              key={item.href}
              href={item.href}
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

              {/* NEW badge — blue gradient */}
              {isNew && (
                <span
                  className="text-[10px] font-bold tracking-wider text-white px-1.5 py-0.5 rounded"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    boxShadow: "0 0 8px rgba(59,130,246,0.45)",
                  }}
                >
                  NEW
                </span>
              )}

              {/* Active chevron */}
              {isActive && !isNew && (
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
