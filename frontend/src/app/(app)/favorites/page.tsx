"use client";

/**
 * Favorites page — V1 shell
 * ─────────────────────────
 * Inspired by nerdytips.com's Favorites tab. Shows three stat cards at the
 * top (Favorites, Upcoming, Success Rate) and a polished empty state below.
 *
 * Favorites are currently stored locally on this device under
 * `betsplug_favorites` as an array of match IDs. Backend sync will follow
 * in a later iteration.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Calendar, TrendingUp, Sparkles, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "betsplug_favorites";

type FavoriteMatch = {
  id: string;
  added_at: string;
};

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "blue" | "emerald" | "amber";
}) {
  const toneClass = {
    blue: {
      wrapper: "border-blue-500/15 bg-blue-500/[0.04]",
      icon: "bg-blue-500/10 text-blue-400",
      value: "text-blue-300",
    },
    emerald: {
      wrapper: "border-emerald-500/15 bg-emerald-500/[0.04]",
      icon: "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-300",
    },
    amber: {
      wrapper: "border-amber-500/15 bg-amber-500/[0.04]",
      icon: "bg-amber-500/10 text-amber-400",
      value: "text-amber-300",
    },
  }[tone];

  return (
    <div
      className={cn(
        "glass-card flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5",
        toneClass.wrapper
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            toneClass.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        <p className={cn("text-3xl font-bold tracking-tight", toneClass.value)}>
          {value}
        </p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = React.useState<FavoriteMatch[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Support both legacy shape (array of ids) and the richer shape.
          const normalized: FavoriteMatch[] = parsed.map((item: unknown) => {
            if (typeof item === "string") {
              return { id: item, added_at: "" };
            }
            if (
              item &&
              typeof item === "object" &&
              "id" in (item as Record<string, unknown>)
            ) {
              const rec = item as Record<string, unknown>;
              return {
                id: String(rec.id),
                added_at: typeof rec.added_at === "string" ? rec.added_at : "",
              };
            }
            return { id: "", added_at: "" };
          }).filter((f) => f.id);
          setFavorites(normalized);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const count = favorites.length;
  const upcoming = 0; // V1: no backend to know which favorites are upcoming
  const successRate = "—";

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">
          <span className="gradient-text">Favorites</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          The matches you&apos;ve starred for quick follow-up.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Star}
          label="Favorites"
          value={count}
          hint={count === 1 ? "1 match starred" : `${count} matches starred`}
          tone="blue"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming"
          value={upcoming}
          hint="Matches scheduled in the next 7 days"
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={successRate}
          hint="Your prediction hit rate on favorites"
          tone="amber"
        />
      </div>

      {/* Main card */}
      <div className="glass-card p-8 animate-slide-up">
        {hydrated && count === 0 ? (
          <EmptyState onBrowse={() => router.push("/matches")} />
        ) : (
          <HasFavoritesState
            favorites={favorites}
            onBrowse={() => router.push("/matches")}
          />
        )}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div
        className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 glow-blue-sm"
      >
        <Star className="h-9 w-9 text-blue-300" strokeWidth={1.75} />
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/15 text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-slate-100">
        No favorite matches yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Add matches to your favorites by clicking the{" "}
        <span className="inline-flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 font-medium text-slate-300">
          <Star className="h-3 w-3" />
          icon
        </span>{" "}
        on the match details page. You&apos;ll see them here for quick access
        and track how your starred picks perform.
      </p>
      <button
        onClick={onBrowse}
        className="btn-gradient mt-6 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg"
      >
        Browse matches
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Has favorites state ───────────────────────────────────────────────────

function HasFavoritesState({
  favorites,
  onBrowse,
}: {
  favorites: FavoriteMatch[];
  onBrowse: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <div className="text-xs text-blue-200/90">
          <p className="font-semibold text-blue-200">Sync coming soon</p>
          <p className="mt-0.5 text-blue-200/75">
            Your favorites are stored locally on this device. We&apos;ll sync
            them across devices once the API is ready.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
          <p className="text-sm font-semibold text-slate-200">
            Starred matches
          </p>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {favorites.length} total
          </span>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {favorites.map((fav) => (
            <li
              key={fav.id}
              className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Star className="h-4 w-4 text-amber-300" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">
                    Match {fav.id}
                  </p>
                  {fav.added_at && (
                    <p className="text-[11px] text-slate-500">
                      Added {new Date(fav.added_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  // Navigate to the match detail page. If the id isn't a
                  // valid UUID the page will 404 — that's fine, this is a
                  // best-effort V1 shell.
                  window.location.href = `/matches/${fav.id}`;
                }}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 opacity-0 transition-all hover:bg-white/[0.08] hover:text-slate-100 group-hover:opacity-100"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={onBrowse}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
        >
          Browse more matches
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
