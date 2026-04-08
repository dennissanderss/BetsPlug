"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Search,
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
  Globe,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, getStatusBadgeColor } from "@/lib/utils";
import type { SearchResult, SearchResultGroup } from "@/types/api";


// ─── Detail link resolver ───────────────────────────────────────────────────

function getHref(result: SearchResult): string {
  switch (result.type) {
    case "sport":
      return `/sports/${result.slug}`;
    case "league":
      return `/leagues/${result.slug ?? result.id}`;
    case "team":
      return `/teams/${result.slug ?? result.id}`;
    case "match":
      return `/matches/${result.id}`;
    default:
      return "#";
  }
}

// ─── Type config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; borderColor: string; iconBg: string; iconColor: string; badgeBg: string; badgeText: string; label: string }
> = {
  sport: {
    icon: Globe,
    borderColor: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
    label: "Sport",
  },
  league: {
    icon: BarChart3,
    borderColor: "border-l-purple-500",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    label: "League",
  },
  team: {
    icon: Target,
    borderColor: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    label: "Team",
  },
  match: {
    icon: Clock,
    borderColor: "border-l-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    label: "Match",
  },
};

function getTypeConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: Search,
      borderColor: "border-l-slate-500",
      iconBg: "bg-slate-500/10",
      iconColor: "text-slate-400",
      badgeBg: "bg-slate-500/15",
      badgeText: "text-slate-300",
      label: type,
    }
  );
}

// ─── Inline match subtitle ───────────────────────────────────────────────────

function MatchSubtitle({ subtitle }: { subtitle: string }) {
  const statusTokens = ["finished", "live", "scheduled", "postponed", "cancelled"];
  const lower = subtitle.toLowerCase();
  const detected = statusTokens.find((s) => lower.includes(s));

  if (!detected) return <>{subtitle}</>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize",
          getStatusBadgeColor(detected)
        )}
      >
        {detected}
      </span>
      <span>{subtitle.replace(new RegExp(detected, "i"), "").replace(/^[\s·\-]+/, "")}</span>
    </span>
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: SearchResult }) {
  const cfg = getTypeConfig(result.type);
  const Icon = cfg.icon;
  const isMatch = result.type === "match";

  return (
    <Link href={getHref(result)} className="block animate-slide-up">
      <div
        className={cn(
          "glass-card-hover group flex items-center gap-4 px-4 py-3.5",
          "border-l-2",
          cfg.borderColor
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            cfg.iconBg
          )}
        >
          <Icon className={cn("h-4 w-4", cfg.iconColor)} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">
            {result.name}
          </p>
          {result.subtitle && (
            <p className="truncate text-xs text-slate-400 mt-0.5">
              {isMatch ? (
                <MatchSubtitle subtitle={result.subtitle} />
              ) : (
                result.subtitle
              )}
            </p>
          )}
        </div>

        {/* Badge */}
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize hidden sm:inline-flex",
            cfg.badgeBg,
            cfg.badgeText
          )}
        >
          {cfg.label}
        </span>
      </div>
    </Link>
  );
}

// ─── Group content ────────────────────────────────────────────────────────────

function GroupContent({ items }: { items: SearchResult[] }) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No results in this category.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ResultCard key={`${item.type}-${item.id}`} result={item} />
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-3.5"
        >
          <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-32 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-pulse hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06]">
          <Search className="h-8 w-8 text-slate-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-100">Search the platform</p>
          <p className="mt-1.5 text-sm text-slate-400 max-w-xs mx-auto">
            Type at least 2 characters to search across all sports, leagues, teams, and matches
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { label: "Sports", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
            { label: "Leagues", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
            { label: "Teams", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
            { label: "Matches", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                color
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-100">No results found</p>
        <p className="mt-1.5 text-sm text-slate-400">
          Nothing matched{" "}
          <span className="font-semibold text-slate-200">&ldquo;{query}&rdquo;</span>. Try a
          different term.
        </p>
      </div>
    </div>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────

function TabPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-blue-600 text-white shadow-lg glow-blue-sm"
          : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]"
      )}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
            active ? "bg-white/20 text-white" : "bg-white/[0.08] text-slate-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Inner search page ────────────────────────────────────────────────────────

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [activeTab, setActiveTab] = useState("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce input → debouncedQ
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(inputValue.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  // Sync debouncedQ → URL param
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) {
      params.set("q", debouncedQ);
    } else {
      params.delete("q");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to "all" tab when query changes
  useEffect(() => {
    setActiveTab("all");
  }, [debouncedQ]);

  const enabled = debouncedQ.length >= 2;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debouncedQ],
    queryFn: () => api.search(debouncedQ),
    enabled,
    staleTime: 10_000,
  });

  const groups: SearchResultGroup[] = data?.groups ?? [];
  const totalResults = groups.reduce((acc, g) => acc + g.items.length, 0);

  const groupMap = new Map<string, SearchResult[]>(
    groups.map((g) => [g.type, g.items])
  );

  const tabConfig: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "sport", label: "Sports" },
    { key: "league", label: "Leagues" },
    { key: "team", label: "Teams" },
    { key: "match", label: "Matches" },
  ];

  const allItems = groups.flatMap((g) => g.items);

  const showSkeleton = enabled && (isLoading || isFetching);
  const showEmpty = !showSkeleton && enabled && totalResults === 0;
  const showResults = !showSkeleton && totalResults > 0;
  const showInitial = !enabled && !showSkeleton;

  const activeItems =
    activeTab === "all" ? allItems : (groupMap.get(activeTab) ?? []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 text-center pt-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Search</span>
        </h1>
        <p className="text-sm text-slate-400">
          Find sports, leagues, teams, and matches
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 z-10" />
        <input
          autoFocus
          type="search"
          placeholder="Search across all sports, leagues, teams, and matches…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={cn(
            "h-14 w-full rounded-full border border-white/[0.08] bg-white/[0.04] pl-12 pr-12 text-base text-slate-100",
            "placeholder:text-slate-500 backdrop-blur-md",
            "transition-all duration-200",
            "focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15),0_0_20px_rgba(59,130,246,0.08)]"
          )}
        />
        {(isLoading || isFetching) && enabled && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Result count */}
      {showResults && (
        <p className="text-xs text-slate-500 animate-fade-in">
          <span className="text-slate-300 font-semibold tabular-nums">{totalResults}</span>{" "}
          result{totalResults !== 1 ? "s" : ""} for{" "}
          <span className="text-slate-200 font-medium">&ldquo;{debouncedQ}&rdquo;</span>
        </p>
      )}

      {/* Content area */}
      {showInitial && <EmptyState query="" />}
      {showEmpty && <EmptyState query={debouncedQ} />}
      {showSkeleton && <SearchSkeleton />}

      {showResults && (
        <div className="space-y-4 animate-slide-up">
          {/* Tab pills */}
          <div className="flex flex-wrap gap-2">
            {tabConfig.map(({ key, label }) => {
              const count =
                key === "all" ? totalResults : (groupMap.get(key)?.length ?? 0);
              return (
                <TabPill
                  key={key}
                  label={label}
                  count={count}
                  active={activeTab === key}
                  onClick={() => setActiveTab(key)}
                />
              );
            })}
          </div>

          {/* Results */}
          <GroupContent items={activeItems} />
        </div>
      )}
    </div>
  );
}

// ─── Page export (Suspense boundary for useSearchParams) ──────────────────────

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2 text-center pt-2">
            <div className="mx-auto h-9 w-36 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="mx-auto h-4 w-56 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-14 w-full rounded-full bg-white/[0.04] animate-pulse" />
          <SearchSkeleton />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
