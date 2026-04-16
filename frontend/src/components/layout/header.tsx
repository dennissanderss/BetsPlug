"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Star,
  Crown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { useAuth } from "@/lib/auth";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

interface HeaderProps {
  className?: string;
}

/**
 * Header — NOCTURNE glass bar with search, notifications and user menu.
 */
export function Header({ className }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [query, setQuery] = React.useState("");
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [tier, setTier] = React.useState<string | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      setTier(window.localStorage.getItem("betsplug_tier"));
    } catch {
      setTier(null);
    }
  }, [userMenuOpen]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`${loc("/search")}?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const navigate = (path: string) => {
    setUserMenuOpen(false);
    router.push(loc(path));
  };

  const authUser = user as (typeof user & { role?: string }) | null;
  const isAdmin = authUser?.role === "admin";

  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "";
  const initial = (displayName[0] ?? "G").toUpperCase();

  const tierLabel = tier
    ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
    : null;
  const isPlatinum = tier?.toLowerCase() === "platinum";

  return (
    <header
      className={cn(
        "relative z-50 flex h-14 shrink-0 items-center gap-4 px-4 md:px-6",
        className
      )}
      style={{
        background: "hsl(230 20% 7% / 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Live status pill */}
      <div className="hidden md:inline-flex shrink-0">
        <Pill tone="default" className="inline-flex items-center gap-1.5">
          <span className="live-dot" />
          {t("header.live" as any)}
        </Pill>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-sm ml-2 sm:ml-10 md:ml-0">
        <div
          className={cn(
            "search-pill flex items-center",
            searchFocused && "border-[#4ade80]/60"
          )}
        >
          <Search
            className={cn(
              "h-3.5 w-3.5 mr-2 transition-colors duration-150",
              searchFocused ? "text-[#4ade80]" : "text-[#6b7280]"
            )}
          />
          <input
            type="search"
            placeholder={t("header.searchPlaceholder" as any)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-sm text-[#ededed] placeholder:text-[#6b7280] outline-none"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            className="btn-ghost relative h-9 w-9 inline-flex items-center justify-center !px-0 !py-0 rounded-lg"
          >
            <Bell className="h-4 w-4" />
            <span
              className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
              style={{
                background: "#ef4444",
                boxShadow: "0 0 6px rgba(239,68,68,0.8)",
              }}
            />
          </button>

          {notifOpen && (
            <div className="glass-panel-raised absolute right-0 top-full mt-2 w-72 p-3 z-50 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <span className="section-label">{t("header.notifications" as any)}</span>
                <Pill tone="active">2 NEW</Pill>
              </div>
              <div className="space-y-2">
                <div className="glass-panel flex items-start gap-2.5 p-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#4ade80] mt-1.5 shrink-0" />
                  <p className="text-xs text-[#ededed]">
                    Model training completed successfully.
                  </p>
                </div>
                <div className="glass-panel flex items-start gap-2.5 p-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <p className="text-xs text-[#ededed]">
                    New match data available for 3 leagues.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-label="User menu"
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-150",
              "text-[#a3a9b8] hover:text-[#ededed] hover:bg-white/[0.06]",
              userMenuOpen && "bg-white/[0.06]"
            )}
          >
            <HexBadge variant="green" size="sm" noGlow>
              <span className="text-[10px] font-black text-[#050505]">{initial}</span>
            </HexBadge>
            <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[#6b7280] transition-transform duration-150",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="glass-panel-raised absolute right-0 top-full mt-2 w-64 overflow-hidden z-[60] animate-slide-up rounded-xl">
              {/* User info block */}
              <div className="px-3.5 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <HexBadge variant="green" size="md">
                    <span className="text-sm font-black text-[#050505]">{initial}</span>
                  </HexBadge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#ededed]">
                      {displayName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">
                      {displayEmail}
                    </p>
                  </div>
                </div>
                {tierLabel && (
                  <div className="mt-2.5 flex">
                    <Pill tone={isPlatinum ? "purple" : "active"} className="inline-flex items-center gap-1">
                      {isPlatinum && <Crown className="h-2.5 w-2.5" />}
                      {tierLabel} plan
                    </Pill>
                  </div>
                )}
              </div>

              <div className="py-1">
                <MenuItem
                  icon={UserIcon}
                  label={t("header.myAccount" as any)}
                  onClick={() => navigate("/myaccount")}
                />
                <MenuItem
                  icon={Star}
                  label={t("header.favorites" as any)}
                  onClick={() => navigate("/favorites")}
                />
                <MenuItem
                  icon={Crown}
                  label={t("header.subscription" as any)}
                  onClick={() => navigate("/subscription")}
                  accent={isPlatinum ? "amber" : undefined}
                />
                <MenuItem
                  icon={Settings}
                  label={t("header.settings" as any)}
                  onClick={() => navigate("/settings")}
                />
                {isAdmin && (
                  <MenuItem
                    icon={Shield}
                    label={t("header.adminPanel" as any)}
                    onClick={() => navigate("/admin")}
                    accent="blue"
                  />
                )}
              </div>

              <div className="mx-2 h-px bg-white/[0.06]" />

              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1 text-left font-medium">
                    {t("header.logout" as any)}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  accent?: "blue" | "amber";
}) {
  const iconClass =
    accent === "amber"
      ? "text-amber-300"
      : accent === "blue"
        ? "text-blue-400"
        : "text-[#6b7280] group-hover:text-[#ededed]";

  return (
    <button
      onClick={onClick}
      className="nav-item group flex w-full items-center gap-2.5 text-sm text-[#a3a9b8] hover:text-[#ededed]"
    >
      <Icon className={cn("h-4 w-4 transition-colors", iconClass)} />
      <span className="flex-1 text-left font-medium">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-[#6b7280] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
