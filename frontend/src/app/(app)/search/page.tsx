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
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-provider";
import type { SearchResult, SearchResultGroup } from "@/types/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

// ─── Detail link resolver ───────────────────────────────────────────────────

function getHref(result: SearchResult): string {
  switch (result.entity_type) {
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

type HexVariant = "green" | "purple" | "blue";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; variant: HexVariant; label: string }
> = {
  sport: { icon: Globe, variant: "blue", label: "Football" },
  league: { icon: BarChart3, variant: "purple", label: "League" },
  team: { icon: Target, variant: "green", label: "Team" },
  match: { icon: Clock, variant: "green", label: "Match" },
};

function getTypeConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: Search,
      variant: "purple" as HexVariant,
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

  const tone =
    detected === "live"
      ? "win"
      : detected === "finished"
      ? "default"
      : "info";

  return (
    <span className="inline-flex items-center gap-1.5">
      <Pill tone={tone as any} className="!text-[10px] capitalize">
        {detected}
      </Pill>
      <span>
        {subtitle
          .replace(new RegExp(detected, "i"), "")
          .replace(/^[\s·\-]+/, "")}
      </span>
    </span>
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────

const TYPE_LABEL_KEYS: Record<string, string> = {
  sport: "search.tagFootball",
  league: "search.typeLeague",
  team: "search.typeTeam",
  match: "search.typeMatch",
};

function ResultCard({ result }: { result: SearchResult }) {
  const { t } = useTranslations();
  const cfg = getTypeConfig(result.entity_type);
  const Icon = cfg.icon;
  const isMatch = result.entity_type === "match";
  const translatedLabel = TYPE_LABEL_KEYS[result.entity_type]
    ? t(TYPE_LABEL_KEYS[result.entity_type] as any)
    : cfg.label;

  return (
    <Link href={getHref(result)} className="block">
      <div className="card-neon rounded-xl">
        <div className="relative flex items-center gap-4 px-4 py-3.5">
          <HexBadge variant={cfg.variant} size="sm">
            <Icon className="h-4 w-4" />
          </HexBadge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#ededed]">
              {result.name}
            </p>
            {result.description && (
              <p className="mt-0.5 truncate text-xs text-[#a3a9b8]">
                {isMatch ? (
                  <MatchSubtitle subtitle={result.description} />
                ) : (
                  result.description
                )}
              </p>
            )}
          </div>
          <Pill
            tone={
              cfg.variant === "green"
                ? "win"
                : cfg.variant === "purple"
                ? "purple"
                : "info"
            }
            className="hidden !text-[10px] sm:inline-flex"
          >
            {translatedLabel}
          </Pill>
        </div>
      </div>
    </Link>
  );
}

// ─── Group content ────────────────────────────────────────────────────────────

function GroupContent({ items }: { items: SearchResult[] }) {
  const { t } = useTranslations();
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-[#a3a9b8]">
        {t("search.noResultsInCategory")}
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <ResultCard key={`${item.entity_type}-${item.id}`} result={item} />
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="glass-panel flex items-center gap-4 rounded-xl px-4 py-3.5"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded-md bg-white/[0.06]" />
            <div className="h-3 w-32 animate-pulse rounded-md bg-white/[0.04]" />
          </div>
          <div className="hidden h-5 w-16 animate-pulse rounded-full bg-white/[0.06] sm:block" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  const { t } = useTranslations();
  if (!query) {
    return (
      <div className="glass-panel rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-5 p-12 text-center">
          <HexBadge variant="purple" size="lg">
            <Search className="h-7 w-7" />
          </HexBadge>
          <div>
            <p className="text-heading text-base text-[#ededed]">
              {t("search.searchThePlatform")}
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#a3a9b8]">
              {t("search.typeAtLeast2Chars")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Pill tone="info">{t("search.tagFootball")}</Pill>
            <Pill tone="purple">{t("search.tagLeagues")}</Pill>
            <Pill tone="win">{t("search.tagTeams")}</Pill>
            <Pill tone="default">{t("search.tagMatches")}</Pill>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl">
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <HexBadge variant="purple" size="lg">
          <AlertTriangle className="h-7 w-7" />
        </HexBadge>
        <div>
          <p className="text-heading text-base text-[#ededed]">
            {t("search.noResultsFound")}
          </p>
          <p className="mt-1.5 text-sm text-[#a3a9b8]">
            {t("search.nothingMatched")}{" "}
            <span className="font-semibold text-[#ededed]">
              &ldquo;{query}&rdquo;
            </span>
            . {t("search.tryDifferentTerm")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Inner search page ────────────────────────────────────────────────────────

function SearchPageInner() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [activeTab, setActiveTab] = useState("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(inputValue.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) {
      params.set("q", debouncedQ);
    } else {
      params.delete("q");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps

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
    groups.map((g) => [g.entity_type, g.items])
  );

  const tabConfig: { key: string; label: string }[] = [
    { key: "all", label: t("search.tabAll") },
    { key: "sport", label: t("search.tagFootball") },
    { key: "league", label: t("search.tagLeagues") },
    { key: "team", label: t("search.tagTeams") },
    { key: "match", label: t("search.tagMatches") },
  ];

  const allItems = groups.flatMap((g) => g.items);

  const showSkeleton = enabled && (isLoading || isFetching);
  const showEmpty = !showSkeleton && enabled && totalResults === 0;
  const showResults = !showSkeleton && totalResults > 0;
  const showInitial = !enabled && !showSkeleton;

  const activeItems =
    activeTab === "all" ? allItems : (groupMap.get(activeTab) ?? []);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-green) / 0.1)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-60 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-purple) / 0.08)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <span className="section-label">
            <Search className="h-3 w-3" />
            {t("search.title")}
          </span>
          <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
            {t("search.title")}
          </h1>
          <p className="text-sm text-[#a3a9b8]">{t("search.subtitle")}</p>
        </div>

        {/* Search bar */}
        <div className="search-pill relative flex items-center gap-3 px-4">
          <Search className="h-5 w-5 shrink-0 text-[#a3a9b8]" />
          <input
            autoFocus
            type="search"
            placeholder={t("search.placeholder")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-transparent py-3.5 text-base text-[#ededed] outline-none placeholder:text-[#a3a9b8]"
          />
          {(isLoading || isFetching) && enabled && (
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#4ade80] border-t-transparent" />
          )}
        </div>

        {/* Result count */}
        {showResults && (
          <p className="text-xs text-[#a3a9b8]">
            <span className="font-semibold text-[#ededed] tabular-nums">
              {totalResults}
            </span>{" "}
            {totalResults !== 1 ? t("search.results") : t("search.result")}{" "}
            {t("search.for")}{" "}
            <span className="font-medium text-[#ededed]">
              &ldquo;{debouncedQ}&rdquo;
            </span>
          </p>
        )}

        {/* Content */}
        {showInitial && <EmptyState query="" />}
        {showEmpty && <EmptyState query={debouncedQ} />}
        {showSkeleton && <SearchSkeleton />}

        {showResults && (
          <div className="space-y-5">
            {/* Tab pills */}
            <div className="flex flex-wrap gap-2">
              {tabConfig.map(({ key, label }) => {
                const count =
                  key === "all"
                    ? totalResults
                    : (groupMap.get(key)?.length ?? 0);
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="cursor-pointer"
                  >
                    <Pill tone={activeTab === key ? "active" : "default"}>
                      {label}
                      {count > 0 && (
                        <span
                          className={cn(
                            "ml-1 rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                            activeTab === key
                              ? "bg-white/20 text-white"
                              : "bg-white/[0.08] text-[#a3a9b8]"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </Pill>
                  </button>
                );
              })}
            </div>

            <GroupContent items={activeItems} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page export (Suspense boundary for useSearchParams) ──────────────────────

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
          <div className="space-y-2">
            <div className="h-6 w-28 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-9 w-36 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-56 rounded-md bg-white/[0.04] animate-pulse" />
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
