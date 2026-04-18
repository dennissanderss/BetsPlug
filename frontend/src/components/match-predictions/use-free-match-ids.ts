"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Single source of truth for which match IDs are designated as "free picks".
 *
 * Every page that shows free vs locked predictions MUST use this hook
 * to decide which fixtures to reveal. This guarantees users see the
 * exact same 3 free predictions across the homepage, /match-predictions,
 * league hubs, and bet-type hubs — never more than 3 total.
 *
 * The underlying data comes from `/homepage/free-picks` which returns
 * the top 3 upcoming matches by model confidence.
 *
 * `freePickConf` is a map of match_id → confidence (0–1) sourced
 * directly from the free-picks response. Use this for the avg-confidence
 * stat instead of reading `f.prediction?.confidence` from the fixtures
 * endpoint, which may return null for matches where the prediction tier
 * differs from the fixture-endpoint access scope.
 */
export function useFreeMatchIds() {
  const { data, isLoading } = useQuery({
    queryKey: ["global-free-pick-ids"],
    queryFn: () => api.getFreePicks(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const ids = new Set<string>();
  const freePickConf = new Map<string, number>();
  if (data) {
    for (const pick of data.today) {
      if (pick.match_id) {
        ids.add(pick.match_id);
        if (pick.confidence != null) freePickConf.set(pick.match_id, pick.confidence);
      }
    }
  }

  return { freeMatchIds: ids, freePickConf, isLoadingFreeIds: isLoading };
}
