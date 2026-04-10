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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  className?: string;
}

/**
 * Header — top navigation bar with search, notifications and a user menu.
 *
 * The user menu mirrors the nerdytips.com dropdown: My Account → Favorites →
 * Subscription → Settings → (Admin Panel, for admins) → Logout. Items close
 * the dropdown on click, and outside clicks dismiss it too (preserved from
 * the previous implementation).
 */
export function Header({ className }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = React.useState("");
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [tier, setTier] = React.useState<string | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Read the cached subscription tier from localStorage on mount so we can
  // show a plan pill next to the email. This is a best-effort display hint
  // and only a fallback — the /subscription page is the source of truth.
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
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const navigate = (path: string) => {
    setUserMenuOpen(false);
    router.push(path);
  };

  // We type `user` loosely because the auth context currently exposes
  // { email, name } while the admin/role check comes from a potentially
  // extended shape written by the Auth Core agent. Reading through a cast
  // keeps TypeScript happy without reaching into that owner's file.
  const authUser = user as (typeof user & { role?: string }) | null;
  const isAdmin = authUser?.role === "admin";

  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "";
  const initial = (displayName[0] ?? "G").toUpperCase();

  // Prettify the tier string for the pill ("platinum" → "Platinum").
  const tierLabel = tier
    ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
    : null;
  const isPlatinum = tier?.toLowerCase() === "platinum";

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-4 px-4 md:px-6",
        className
      )}
      style={{
        background: "rgba(10, 14, 26, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Live status indicator */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span className="live-dot" />
        <span className="text-xs font-semibold text-emerald-400 tracking-wide">Live</span>
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-sm ml-10 md:ml-0"
      >
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none transition-colors duration-150",
              searchFocused ? "text-blue-400" : "text-slate-500"
            )}
          />
          <Input
            type="search"
            placeholder="Search teams, matches, leagues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "pl-9 h-8 text-sm bg-white/[0.04] border-white/10 text-slate-200 placeholder:text-slate-600",
              "rounded-lg transition-all duration-200",
              searchFocused
                ? "border-blue-500/50 bg-white/[0.07] ring-2 ring-blue-500/20"
                : "hover:bg-white/[0.06] hover:border-white/15"
            )}
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            className="relative h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
          >
            <Bell className="h-4 w-4" />
            <span
              className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: "#3b82f6", boxShadow: "0 0 6px rgba(59,130,246,0.8)" }}
            />
          </Button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-xl p-3 z-50 animate-slide-up"
              style={{
                background: "rgba(17, 24, 39, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-200">Notifications</p>
                <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  2 new
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-300">Model training completed successfully.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-300">New match data available for 3 leagues.</p>
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
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150",
              "text-slate-300 hover:text-slate-100 hover:bg-white/[0.06]",
              userMenuOpen && "bg-white/[0.06]"
            )}
          >
            {/* Avatar */}
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 0 10px rgba(59,130,246,0.4)",
              }}
            >
              {initial}
            </div>
            <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-slate-500 transition-transform duration-150",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-[60] animate-slide-up"
              style={{
                background: "rgba(17, 24, 39, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)",
              }}
            >
              {/* User info block */}
              <div className="px-3.5 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      boxShadow: "0 0 12px rgba(59,130,246,0.45)",
                    }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {displayName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="truncate text-[11px] text-slate-500">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                </div>
                {tierLabel && (
                  <div className="mt-2 flex">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        isPlatinum
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                          : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                      )}
                    >
                      {isPlatinum && <Crown className="h-2.5 w-2.5" />}
                      {tierLabel} plan
                    </span>
                  </div>
                )}
              </div>

              {/* Primary actions */}
              <div className="py-1">
                <MenuItem
                  icon={UserIcon}
                  label="My Account"
                  onClick={() => navigate("/myaccount")}
                />
                <MenuItem
                  icon={Star}
                  label="Favorites"
                  onClick={() => navigate("/favorites")}
                />
                <MenuItem
                  icon={Crown}
                  label="Subscription"
                  onClick={() => navigate("/subscription")}
                  accent={isPlatinum ? "amber" : undefined}
                />
                <MenuItem
                  icon={Settings}
                  label="Settings"
                  onClick={() => navigate("/settings")}
                />
                {isAdmin && (
                  <MenuItem
                    icon={Shield}
                    label="Admin Panel"
                    onClick={() => navigate("/admin")}
                    accent="blue"
                  />
                )}
              </div>

              <div className="mx-2 h-px bg-white/[0.06]" />

              {/* Logout */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1 text-left font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * MenuItem — row inside the user-menu dropdown. Shows a left icon, a label
 * and a subtle right chevron. Hover brightens the row background.
 */
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
        : "text-slate-500 group-hover:text-slate-300";

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-slate-100"
    >
      <Icon className={cn("h-4 w-4 transition-colors", iconClass)} />
      <span className="flex-1 text-left font-medium">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
