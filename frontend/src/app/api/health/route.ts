import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Next.js App Router API route that reports the health of the Sports
 * Intelligence Platform.
 *
 * Behaviour
 * ---------
 * 1. Attempts to proxy the request to the backend health endpoint
 *    (``NEXT_PUBLIC_API_URL`` / ``BACKEND_URL`` + ``/health``).
 * 2. If the backend is unreachable or returns an error the route still
 *    responds — it just marks the backend check as degraded so callers
 *    always receive a valid JSON payload.
 *
 * Response shape
 * --------------
 * ```json
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "frontend": { "ok": true },
 *   "backend": {
 *     "ok": true,
 *     "status": "healthy",
 *     "latency_ms": 42
 *   },
 *   "timestamp": "2024-06-01T12:00:00.000Z"
 * }
 * ```
 */

// The internal URL used for server-side fetches.  Falls back to the public
// URL so the route works in both Docker (service-to-service) and local dev.
const BACKEND_INTERNAL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();

  // -------------------------------------------------------------------------
  // Probe the backend
  // -------------------------------------------------------------------------
  let backendOk = false;
  let backendStatus: string | null = null;
  let backendLatencyMs: number | null = null;
  let backendBody: Record<string, unknown> | null = null;

  try {
    const t0 = Date.now();
    const res = await fetch(`${BACKEND_INTERNAL}/health`, {
      // Keep the probe lightweight; abort after 5 s to avoid blocking Next.js
      signal: AbortSignal.timeout(5_000),
      // Do not cache health responses
      cache: "no-store",
    });
    backendLatencyMs = Date.now() - t0;

    if (res.ok) {
      backendBody = (await res.json()) as Record<string, unknown>;
      backendOk = true;
      backendStatus = (backendBody?.status as string) ?? "healthy";
    } else {
      backendStatus = "unhealthy";
    }
  } catch {
    // Network error, DNS failure, or timeout — backend is unreachable
    backendStatus = "unreachable";
  }

  // -------------------------------------------------------------------------
  // Determine overall status
  // -------------------------------------------------------------------------
  let overallStatus: "healthy" | "degraded" | "unhealthy";

  if (!backendOk) {
    overallStatus = "unhealthy";
  } else if (backendStatus !== "healthy") {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  // -------------------------------------------------------------------------
  // Build response
  // -------------------------------------------------------------------------
  const payload = {
    status: overallStatus,
    frontend: { ok: true },
    backend: {
      ok: backendOk,
      status: backendStatus,
      latency_ms: backendLatencyMs,
      ...(backendBody?.checks ? { checks: backendBody.checks } : {}),
    },
    timestamp,
  };

  // Use HTTP 200 for healthy/degraded so monitoring tools can read the body;
  // use 503 only when fully unhealthy.
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(payload, { status: httpStatus });
}
