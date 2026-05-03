/**
 * Mock predictions endpoint for the homepage live grid.
 *
 * Returns the shared HOMEPAGE_SAMPLE array. The live homepage avoids
 * fetching this endpoint at build time and imports the same module
 * directly — this endpoint exists so the 30s client-side polling
 * loop in LivePredictionsPreview has something to hit.
 *
 * TODO: replace with real API call to
 *   https://app.betsplug.com/api/predictions/today
 * Targets: ISR with revalidate=60s plus the existing client-side
 * polling cadence.
 */
import type { APIRoute } from "astro";
import { HOMEPAGE_SAMPLE } from "@/lib/predictions-mock";

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(HOMEPAGE_SAMPLE), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
};
