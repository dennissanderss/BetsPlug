"use client";

/**
 * Telegram auto-poster admin tab.
 *
 * Single-stop dashboard for the @BetsPlug publisher:
 *   · top strip: bot/token health + per-channel stat cards
 *   · middle : queue preview + four operational buttons
 *   · bottom : recent post history table
 *
 * Every button hits `/api/admin/telegram/*` on the Railway backend
 * with the same bearer token the rest of the admin panel uses. No
 * DevTools Console workaround.
 */

import * as React from "react";
import {
  Send,
  RefreshCw,
  Activity,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";

import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

// ─── Types ────────────────────────────────────────────────────────────────

interface HealthResponse {
  configured: boolean;
  channel: string;
  bot: {
    id: number;
    username?: string;
    first_name?: string;
    is_bot?: boolean;
  } | null;
}

interface ChannelOverview {
  channel: string;
  tier: string;
  is_primary: boolean;
  is_test: boolean;
  total_posts: number;
  picks_posted: number;
  picks_with_result: number;
  picks_pending_result: number;
  summaries_posted: number;
  last_post_at: string | null;
  last_post_type: string | null;
  scheduled_slots_cet: string[];
  summary_slot_cet: string;
}

interface PostSummary {
  id: string;
  prediction_id: string | null;
  channel: string;
  telegram_message_id: number;
  post_type: string;
  posted_at: string;
  result_posted_at: string | null;
}

interface QueueItem {
  prediction_id: string;
  match_id: string;
  league: string | null;
  home: string | null;
  away: string | null;
  kickoff: string;
  pick: string | null;
  home_win_prob: number;
  draw_prob: number | null;
  away_win_prob: number;
  confidence: number;
}

// ─── API helper — bypasses `api.ts` because these endpoints aren't typed.
// Same bearer-token pattern so admin auth works without any extra setup.
async function adminCall<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<T> {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("betsplug_token")
      : null;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? (json as { detail?: unknown }).detail
        : json;
    throw new Error(
      typeof detail === "string" ? detail : `HTTP ${res.status}`,
    );
  }
  return json as T;
}

// ─── Small display bits ─────────────────────────────────────────────────

function formatDT(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PostTypePill({ type }: { type: string }) {
  const map: Record<string, { tone: "win" | "info" | "draw" | "default"; label: string }> = {
    pick: { tone: "win", label: "Pick" },
    result_update: { tone: "info", label: "Result" },
    daily_summary: { tone: "draw", label: "Summary" },
  };
  const cfg = map[type] ?? { tone: "default" as const, label: type };
  return (
    <Pill tone={cfg.tone} className="!text-[10px]">
      {cfg.label}
    </Pill>
  );
}

// ─── Channel card ───────────────────────────────────────────────────────

function ChannelCard({ ch }: { ch: ChannelOverview }) {
  const statusLabel = ch.is_primary
    ? "Primary"
    : ch.is_test
    ? "Test"
    : "Archived";
  const statusTone: "win" | "info" | "default" = ch.is_primary
    ? "win"
    : ch.is_test
    ? "info"
    : "default";

  const tierLabel = ch.tier === "free" ? "Bronze / Free" : ch.tier;
  const pendingTone = ch.picks_pending_result > 0 ? "text-amber-300" : "text-slate-400";

  return (
    <div className="glass-panel relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
            {tierLabel} tier
          </p>
          <p className="mt-0.5 truncate text-base font-bold text-[#ededed]">
            {ch.channel}
          </p>
        </div>
        <Pill tone={statusTone} className="!text-[10px]">
          {statusLabel}
        </Pill>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Total
          </p>
          <p className="mt-0.5 text-stat tabular-nums text-[#ededed]">
            {ch.total_posts}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Picks
          </p>
          <p className="mt-0.5 text-stat tabular-nums text-[#4ade80]">
            {ch.picks_posted}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            With result
          </p>
          <p className="mt-0.5 text-stat tabular-nums text-[#60a5fa]">
            {ch.picks_with_result}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Pending
          </p>
          <p className={`mt-0.5 text-stat tabular-nums ${pendingTone}`}>
            {ch.picks_pending_result}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-3 text-xs text-[#a3a9b8]">
        <div className="flex justify-between gap-3">
          <span>Last post</span>
          <span className="text-[#ededed]">
            {formatDT(ch.last_post_at)}
            {ch.last_post_type ? ` · ${ch.last_post_type}` : ""}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Summaries</span>
          <span className="text-[#ededed]">{ch.summaries_posted}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Schedule (CET)</span>
          <span className="text-[#ededed]">
            {ch.scheduled_slots_cet.join(" · ")} + {ch.summary_slot_cet}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Queue card ─────────────────────────────────────────────────────────

function QueueCard({ item }: { item: QueueItem | null }) {
  if (!item) {
    return (
      <div className="glass-panel p-5 text-center">
        <p className="text-sm text-[#a3a9b8]">
          Geen Free-tier pick klaar — scheduler zou deze slot overslaan.
        </p>
      </div>
    );
  }
  const maxProb = Math.max(
    item.home_win_prob,
    item.draw_prob ?? 0,
    item.away_win_prob,
  );
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
          Volgende pick
        </span>
        <Pill tone="info" className="!text-[10px]">
          {item.league ?? "—"}
        </Pill>
      </div>
      <p className="mt-2 text-base font-bold text-[#ededed]">
        {item.home ?? "—"} vs {item.away ?? "—"}
      </p>
      <p className="mt-1 text-xs text-[#a3a9b8]">
        {formatDT(item.kickoff)} · pick: <strong className="text-[#4ade80]">{item.pick ?? "—"}</strong> ·
        winkans {Math.round(maxProb * 100)}% · confidence {Math.round(item.confidence * 100)}%
      </p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────

export default function TelegramManager() {
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [channels, setChannels] = React.useState<ChannelOverview[]>([]);
  const [queue, setQueue] = React.useState<QueueItem | null>(null);
  const [history, setHistory] = React.useState<PostSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [h, c, q, hist] = await Promise.all([
        adminCall<HealthResponse>("/admin/telegram/health"),
        adminCall<ChannelOverview[]>("/admin/telegram/channels"),
        adminCall<QueueItem[]>("/admin/telegram/queue"),
        adminCall<PostSummary[]>("/admin/telegram/posts?limit=30"),
      ]);
      setHealth(h);
      setChannels(c);
      setQueue(q.length > 0 ? q[0] : null);
      setHistory(hist);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function runAction(
    tag: string,
    fn: () => Promise<unknown>,
    successMsg: (r: unknown) => string,
  ) {
    setBusyAction(tag);
    setActionMsg(null);
    setErr(null);
    try {
      const result = await fn();
      setActionMsg(successMsg(result));
      // Refresh overview so the action's effect is visible immediately.
      await refreshAll();
    } catch (e) {
      setErr(`${tag}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header strip — health + refresh */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <HexBadge variant={health?.bot ? "green" : "purple"} size="sm">
            <Send className="h-4 w-4" />
          </HexBadge>
          <div>
            <p className="section-label">@BetsPlug auto-poster</p>
            <p className="mt-0.5 text-sm text-[#ededed]">
              {health ? (
                health.bot ? (
                  <>
                    Verbonden als{" "}
                    <strong>@{health.bot.username ?? "?"}</strong> · {health.channel}
                  </>
                ) : health.configured ? (
                  <span className="text-amber-300">
                    Token configured but getMe failed — check bot lives.
                  </span>
                ) : (
                  <span className="text-red-300">
                    TELEGRAM_BOT_TOKEN is not set in Railway.
                  </span>
                )
              ) : loading ? (
                "Loading…"
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          disabled={loading}
          className="btn-glass inline-flex items-center gap-2 !text-xs disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {err && (
        <div className="glass-panel border border-red-500/30 bg-red-500/[0.06] p-3 text-xs text-red-300">
          <AlertTriangle className="mr-1.5 inline h-3 w-3" />
          {err}
        </div>
      )}
      {actionMsg && (
        <div className="glass-panel border border-[#4ade80]/30 bg-[#4ade80]/[0.06] p-3 text-xs text-[#4ade80]">
          <CheckCircle2 className="mr-1.5 inline h-3 w-3" />
          {actionMsg}
        </div>
      )}

      {/* Per-channel overview */}
      <div>
        <p className="section-label mb-3">
          <Activity className="h-3 w-3" /> Per kanaal
        </p>
        {channels.length === 0 ? (
          <div className="glass-panel p-5 text-sm text-[#a3a9b8]">
            Nog geen kanalen geconfigureerd (TELEGRAM_CHANNEL_FREE ontbreekt).
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch) => (
              <ChannelCard key={ch.channel} ch={ch} />
            ))}
          </div>
        )}
      </div>

      {/* Queue + actions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="section-label mb-3">
            <Clock className="h-3 w-3" /> Queue — volgende slot
          </p>
          <QueueCard item={queue} />
        </div>

        <div>
          <p className="section-label mb-3">
            <Zap className="h-3 w-3" /> Acties
          </p>
          <div className="glass-panel flex flex-col gap-2 p-3">
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                runAction(
                  "post-next",
                  () => adminCall<PostSummary>("/admin/telegram/post-next", "POST"),
                  (r) => {
                    const p = r as PostSummary | null;
                    return p
                      ? `Pick gepost · msg_id ${p.telegram_message_id}`
                      : "Geen eligible pick — slot overgeslagen.";
                  },
                )
              }
              className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {busyAction === "post-next" ? "Posting…" : "Post next pick"}
            </button>
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                runAction(
                  "summary",
                  () => adminCall<PostSummary>("/admin/telegram/post-summary", "POST", {}),
                  (r) => {
                    const p = r as PostSummary | null;
                    return p
                      ? `Daily summary gepost · msg_id ${p.telegram_message_id}`
                      : "Geen picks vandaag — summary overgeslagen.";
                  },
                )
              }
              className="btn-glass inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {busyAction === "summary" ? "Posting…" : "Post daily summary"}
            </button>
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                runAction(
                  "sweep",
                  () => adminCall<{ updated: number }>("/admin/telegram/update-results", "POST"),
                  (r) => {
                    const { updated } = r as { updated: number };
                    return updated > 0
                      ? `${updated} pick-post(s) bijgewerkt met uitslag.`
                      : "Geen pending picks met uitslag — niks te updaten.";
                  },
                )
              }
              className="btn-glass inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {busyAction === "sweep" ? "Running…" : "Run result sweep"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent history */}
      <div>
        <p className="section-label mb-3">
          <MessageSquare className="h-3 w-3" /> Recente posts (laatste 30)
        </p>
        {history.length === 0 ? (
          <div className="glass-panel p-5 text-sm text-[#a3a9b8]">
            Nog geen posts in de database.
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-[#6b7280]">
                    <th className="px-4 py-3 text-left">When</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Channel</th>
                    <th className="px-4 py-3 text-left">Msg id</th>
                    <th className="px-4 py-3 text-left">Result edit</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 text-[#ededed]">
                        {formatDT(p.posted_at)}
                      </td>
                      <td className="px-4 py-3">
                        <PostTypePill type={p.post_type} />
                      </td>
                      <td className="px-4 py-3 text-[#a3a9b8]">{p.channel}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#a3a9b8]">
                        {p.telegram_message_id}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#a3a9b8]">
                        {p.result_posted_at ? (
                          <span className="inline-flex items-center gap-1 text-[#4ade80]">
                            <CheckCircle2 className="h-3 w-3" />
                            {formatDT(p.result_posted_at)}
                          </span>
                        ) : p.post_type === "pick" ? (
                          <span className="text-amber-300">pending</span>
                        ) : (
                          <span className="text-[#6b7280]">n/a</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#6b7280]">
        Tip: de standalone pagina{" "}
        <a href="/admin/telegram" className="underline hover:text-[#4ade80]">
          /admin/telegram
        </a>{" "}
        bestaat nog met dezelfde endpoints voor diep debuggen.
      </p>
    </div>
  );
}
