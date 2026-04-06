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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "About",        href: "/about",        icon: BookOpen },
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Search",       href: "/search",       icon: Search },
  { label: "Live Matches", href: "/live",         icon: Radio,         badge: "LIVE" },
  { label: "Predictions",  href: "/predictions",  icon: Sparkles },
  { label: "Strategy Lab", href: "/strategy",     icon: FlaskConical },
  { label: "Trackrecord",  href: "/trackrecord",  icon: ClipboardList },
  { label: "Reports",      href: "/reports",      icon: FileBarChart2 },
  { label: "Admin",        href: "/admin",        icon: ShieldCheck },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings",     href: "/settings",     icon: Settings },
  { label: "Deals",        href: "/deals",        icon: Gift,          badge: "NEW" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            boxShadow: "0 0 16px rgba(59,130,246,0.45), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-white">
            SIP
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">
            Sports Intelligence
          </span>
        </div>
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
                {item.label}
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

              {/* Active chevron */}
              {isActive && !isLive && (
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
                {item.label}
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
          <span className="text-xs text-slate-400">All systems operational</span>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] leading-relaxed text-slate-600">
          For analytical &amp; educational purposes only. Not financial advice.
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
