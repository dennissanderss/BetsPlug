"use client";

/**
 * Favorites page — NOCTURNE rebuild
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

const FAVORITES_KEY = "betsplug_favorites";

type FavoriteMatch = {
  id: string;
  added_at: string;
};

// ─── KPI card ──────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  hint,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  variant: "green" | "purple" | "blue";
}) {
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative flex items-start gap-4 p-5">
        <HexBadge variant={variant} size="md">
          {icon}
        </HexBadge>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
            {label}
          </p>
          <p className="text-stat mt-1 text-3xl text-[#ededed]">{value}</p>
          {hint && <p className="mt-1 text-xs text-[#a3a9b8]">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = React.useState<FavoriteMatch[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"matches" | "teams" | "leagues">(
    "matches"
  );

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const normalized: FavoriteMatch[] = parsed
            .map((item: unknown) => {
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
                  added_at:
                    typeof rec.added_at === "string" ? rec.added_at : "",
                };
              }
              return { id: "", added_at: "" };
            })
            .filter((f) => f.id);
          setFavorites(normalized);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const count = favorites.length;

  return (
    <div className="relative">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
        {/* Header */}
        <div>
          <span className="section-label mb-3">
            <Star className="h-3 w-3" />
            Favorites
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
              Favorites
            </h1>
            <Pill tone="active">{count}</Pill>
          </div>
          <p className="mt-2 text-sm text-[#a3a9b8]">
            The matches you&apos;ve starred for quick follow-up.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            icon={<Star className="h-5 w-5" />}
            label="Favorites"
            value={count}
            hint={
              count === 1 ? "1 match starred" : `${count} matches starred`
            }
            variant="green"
          />
          <KpiCard
            icon={<Calendar className="h-5 w-5" />}
            label="Upcoming"
            value={0}
            hint="Matches scheduled in the next 7 days"
            variant="purple"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Success rate"
            value="—"
            hint="Your prediction hit rate on favorites"
            variant="blue"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(["matches", "teams", "leagues"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="cursor-pointer"
            >
              <Pill tone={activeTab === tab ? "active" : "default"}>
                {tab === "matches"
                  ? "Matches"
                  : tab === "teams"
                  ? "Teams"
                  : "Leagues"}
              </Pill>
            </button>
          ))}
        </div>

        {/* Main card */}
        <div className="card-neon rounded-2xl">
          <div className="relative p-8">
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
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="relative">
        <HexBadge variant="purple" size="xl">
          <Star className="h-8 w-8" />
        </HexBadge>
        <div className="absolute -right-1 -top-1">
          <HexBadge variant="green" size="sm">
            <Sparkles className="h-3 w-3" />
          </HexBadge>
        </div>
      </div>
      <h2 className="mt-5 text-heading text-xl text-[#ededed]">
        No favorite matches yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-[#a3a9b8]">
        Add matches to your favorites by clicking the{" "}
        <span className="inline-flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 font-medium text-[#ededed]">
          <Star className="h-3 w-3" />
          icon
        </span>{" "}
        on the match details page. You&apos;ll see them here for quick access
        and track how your starred picks perform.
      </p>
      <button onClick={onBrowse} className="btn-primary mt-6">
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
      <div className="glass-panel flex items-start gap-3 rounded-xl px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#60a5fa]" />
        <div className="text-xs text-[#a3a9b8]">
          <p className="font-semibold text-[#ededed]">Sync coming soon</p>
          <p className="mt-0.5">
            Your favorites are stored locally on this device. We&apos;ll sync
            them across devices once the API is ready.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav, i) => {
          const variant = (["green", "purple", "blue"] as const)[i % 3];
          return (
            <div key={fav.id} className="card-neon rounded-xl">
              <div className="relative flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <HexBadge variant={variant} size="sm">
                    <Star className="h-4 w-4" />
                  </HexBadge>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#ededed]">
                      Match {fav.id}
                    </p>
                    {fav.added_at && (
                      <p className="text-[11px] text-[#a3a9b8]">
                        Added{" "}
                        {new Date(fav.added_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    window.location.href = `/matches/${fav.id}`;
                  }}
                  className="btn-ghost !px-3 !py-1.5 !text-xs"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end">
        <button onClick={onBrowse} className="btn-glass">
          Browse more matches
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
