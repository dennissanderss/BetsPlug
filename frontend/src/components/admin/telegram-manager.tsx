"use client";

/**
 * Telegram auto-poster admin tab.
 *
 * Single-stop dashboard for the @BetsPluggs publisher:
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
  ClipboardList,
  Megaphone,
  Trash2,
  Sparkles,
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
  match_home: string | null;
  match_away: string | null;
  match_league: string | null;
  match_kickoff: string | null;
}

interface ScheduledSlot {
  slot_cet: string;            // "15:00"
  scheduled_at_utc: string;    // ISO
  minutes_until: number;
  post_type: string;           // "pick" | "daily_summary"
  day_label: string;           // "today" | "tomorrow" | ISO date
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
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Network / CORS failure — fetch rejects before we even get a status
    // code. Surface the raw error message so the operator sees e.g.
    // "Failed to fetch" instead of a generic "doesn't do anything".
    throw new Error(
      `Network error: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const text = await res.text();
  // Railway error pages and CDN 502s return HTML, which crashes
  // JSON.parse. Guard so the caller gets a legible error including the
  // status code + a body snippet instead of a cryptic SyntaxError.
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} (non-JSON): ${text.slice(0, 200)}`,
        );
      }
      // Successful response but not JSON — return the raw text so
      // typed callers can at least see something.
      return text as unknown as T;
    }
  }
  if (!res.ok) {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? (json as { detail?: unknown }).detail
        : json;
    throw new Error(
      typeof detail === "string"
        ? `HTTP ${res.status}: ${detail}`
        : `HTTP ${res.status}${detail ? `: ${JSON.stringify(detail).slice(0, 200)}` : ""}`,
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
    promo: { tone: "default", label: "Promo" },
    welcome: { tone: "info", label: "Welcome" },
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

// ─── Schedule list ──────────────────────────────────────────────────────

function ScheduleList({ slots }: { slots: ScheduledSlot[] }) {
  if (slots.length === 0) {
    return (
      <div className="glass-panel p-5 text-center">
        <p className="text-sm text-[#a3a9b8]">Planning onbekend.</p>
      </div>
    );
  }

  function humanDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}u` : `${h}u ${m}m`;
  }

  return (
    <div className="glass-panel divide-y divide-white/[0.04]">
      {slots.map((s, idx) => (
        <div
          key={`${s.scheduled_at_utc}-${idx}`}
          className="flex items-center justify-between gap-3 px-4 py-2.5"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-[#ededed]">
              {s.slot_cet}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#6b7280]">
              {s.day_label}
            </span>
            <Pill
              tone={s.post_type === "pick" ? "win" : "draw"}
              className="!text-[10px]"
            >
              {s.post_type === "pick" ? "Pick" : "Summary"}
            </Pill>
          </div>
          <span className="text-xs text-[#a3a9b8]">
            over {humanDuration(s.minutes_until)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Action button + explainer row ──────────────────────────────────────

function ActionRow({
  onClick,
  busy,
  anyBusy,
  icon,
  label,
  desc,
  variant = "glass",
}: {
  onClick: () => void;
  busy: boolean;
  anyBusy: boolean;
  icon: React.ReactNode;
  label: string;
  desc: string;
  variant?: "primary" | "glass";
}) {
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={anyBusy}
        onClick={onClick}
        className={`${
          variant === "primary" ? "btn-primary" : "btn-glass"
        } inline-flex w-full items-center justify-center gap-2 disabled:opacity-50`}
      >
        {icon}
        {busy ? "Bezig…" : label}
      </button>
      <p className="px-1 text-[11px] leading-snug text-[#6b7280]">{desc}</p>
    </div>
  );
}

// ─── Pending matches summary ───────────────────────────────────────────

function PendingMatches({ history }: { history: PostSummary[] }) {
  const pending = history.filter(
    (p) => p.post_type === "pick" && !p.result_posted_at,
  );

  if (pending.length === 0) {
    return (
      <div className="glass-panel flex items-center gap-2 p-4 text-sm text-[#a3a9b8]">
        <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />
        Geen pending picks — alle geposte wedstrijden hebben een uitslag.
      </div>
    );
  }

  return (
    <div>
      <p className="section-label mb-3">
        <AlertTriangle className="h-3 w-3" /> Pending — wachten op uitslag ({pending.length})
      </p>
      <div className="glass-panel divide-y divide-white/[0.04]">
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[#ededed]">
                {p.match_home && p.match_away
                  ? `${p.match_home} vs ${p.match_away}`
                  : `msg_id ${p.telegram_message_id}`}
              </div>
              <div className="text-[11px] text-[#6b7280]">
                {p.match_league ? `${p.match_league} · ` : ""}
                gepost {formatDT(p.posted_at)}
                {p.match_kickoff ? ` · aftrap ${formatDT(p.match_kickoff)}` : ""}
              </div>
            </div>
            <Pill tone="draw" className="!text-[10px]">
              Pending
            </Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────

export default function TelegramManager() {
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [channels, setChannels] = React.useState<ChannelOverview[]>([]);
  const [queue, setQueue] = React.useState<QueueItem | null>(null);
  const [schedule, setSchedule] = React.useState<ScheduledSlot[]>([]);
  const [history, setHistory] = React.useState<PostSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    // Use allSettled so one failing endpoint (e.g. a Railway redeploy
    // window, a stale JS bundle hitting an old URL, or a brief auth
    // blip) doesn't tank the whole tab. Each piece of UI gets whatever
    // data it can, and we surface a combined failure message only if
    // EVERY call failed.
    const results = await Promise.allSettled([
      adminCall<HealthResponse>("/admin/telegram/health"),
      adminCall<ChannelOverview[]>("/admin/telegram/channels"),
      adminCall<QueueItem[]>("/admin/telegram/queue"),
      adminCall<ScheduledSlot[]>("/admin/telegram/schedule?count=6"),
      adminCall<PostSummary[]>("/admin/telegram/posts?limit=30"),
    ]);

    const [h, c, q, sched, hist] = results;
    if (h.status === "fulfilled") setHealth(h.value);
    if (c.status === "fulfilled") setChannels(c.value);
    if (q.status === "fulfilled") setQueue(q.value.length > 0 ? q.value[0] : null);
    if (sched.status === "fulfilled") setSchedule(sched.value);
    if (hist.status === "fulfilled") setHistory(hist.value);

    const failures = results
      .map((r, i) => ({ r, name: ["health", "channels", "queue", "schedule", "posts"][i] }))
      .filter((x) => x.r.status === "rejected");
    if (failures.length === results.length) {
      // Everything failed — probably offline or backend down. Show loud error.
      const first = failures[0].r as PromiseRejectedResult;
      setErr(
        first.reason instanceof Error ? first.reason.message : String(first.reason),
      );
    } else if (failures.length > 0) {
      // Partial failure — soft notice so operator knows one section is stale.
      setErr(
        `Sommige endpoints faalden: ${failures.map((f) => f.name).join(", ")}`,
      );
    }
    setLoading(false);
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
            <p className="section-label">@BetsPluggs auto-poster</p>
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

      {/* Queue + schedule + actions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <div>
          <p className="section-label mb-3">
            <Clock className="h-3 w-3" /> Queue — volgende slot
          </p>
          <QueueCard item={queue} />
        </div>

        <div>
          <p className="section-label mb-3">
            <Clock className="h-3 w-3" /> Planning — komende slots
          </p>
          <ScheduleList slots={schedule} />
        </div>

        <div>
          <p className="section-label mb-3">
            <Zap className="h-3 w-3" /> Acties
          </p>
          <div className="glass-panel flex flex-col gap-3 p-3">
            <ActionRow
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
              busy={busyAction === "post-next"}
              anyBusy={busyAction !== null}
              icon={<Send className="h-3.5 w-3.5" />}
              label="Post next pick"
              variant="primary"
              desc="Plaatst nu de eerstvolgende Free-tier pick in @BetsPluggsgs, zonder te wachten op de 11/15/19 CET cron."
            />
            <ActionRow
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
              busy={busyAction === "summary"}
              anyBusy={busyAction !== null}
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              label="Post daily summary"
              desc="Post het NL/EN dagoverzicht van vandaag (scheduled 23:00 CET). Skipt als er nog geen picks van vandaag staan."
            />
            <ActionRow
              onClick={() =>
                runAction(
                  "welcome",
                  () => adminCall<PostSummary>("/admin/telegram/post-welcome", "POST"),
                  (r) => {
                    const p = r as PostSummary;
                    return `Welcome message gepost · msg_id ${p.telegram_message_id} · vergeet niet te pinnen in Telegram`;
                  },
                )
              }
              busy={busyAction === "welcome"}
              anyBusy={busyAction !== null}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Post welcome message"
              desc="Plaatst het intro/welkomstbericht van het kanaal. Vergeet niet 'm daarna te pinnen in Telegram (bot heeft geen pin-rechten)."
            />
            <ActionRow
              onClick={() =>
                runAction(
                  "promo",
                  () => adminCall<PostSummary>("/admin/telegram/post-promo", "POST"),
                  (r) => {
                    const p = r as PostSummary;
                    return `Tier-promo gepost · msg_id ${p.telegram_message_id}`;
                  },
                )
              }
              busy={busyAction === "promo"}
              anyBusy={busyAction !== null}
              icon={<Megaphone className="h-3.5 w-3.5" />}
              label="Post tier promo"
              desc="Plaatst een tier-upgrade promo (Silver/Gold/Platinum sell). Gebruik spaarzaam, ~1x per week."
            />
            <ActionRow
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
              busy={busyAction === "sweep"}
              anyBusy={busyAction !== null}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label="Run result sweep"
              desc="Loopt alle pending picks na en plaatst een ✅/❌ reply onder eerdere posts zodra de uitslag binnen is. Cron 15 min."
            />

            {/* Danger zone — visually separated so a slip of the finger
                doesn't nuke the channel. Double-confirm below. */}
            <div className="mt-2 space-y-1.5 border-t border-red-500/20 pt-3">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => {
                  const ok = window.confirm(
                    "DESTRUCTIVE — this deletes EVERY auto-posted message " +
                      "from @BetsPluggs and wipes the local post history.\n\n" +
                      "The Telegram bot needs 'Delete Messages' admin rights " +
                      "or some posts will remain.\n\n" +
                      "A fresh Free-tier pick will be published right after.\n\n" +
                      "Continue?",
                  );
                  if (!ok) return;
                  runAction(
                    "wipe",
                    () =>
                      adminCall<{
                        wipe: { deleted: number; missing: number; db_removed: number };
                        next_post: PostSummary | null;
                      }>("/admin/telegram/wipe?repost_next=true", "POST"),
                    (r) => {
                      const typed = r as {
                        wipe: { deleted: number; missing: number; db_removed: number };
                        next_post: PostSummary | null;
                      };
                      const parts = [
                        `${typed.wipe.deleted} verwijderd`,
                        typed.wipe.missing > 0 ? `${typed.wipe.missing} al weg` : null,
                        typed.next_post
                          ? `nieuwe pick msg_id ${typed.next_post.telegram_message_id}`
                          : "geen nieuwe pick (niks eligible)",
                      ].filter(Boolean);
                      return `Kanaal gereset · ${parts.join(" · ")}`;
                    },
                  );
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-500/70 hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {busyAction === "wipe" ? "Bezig…" : "Wipe channel + fresh post"}
              </button>
              <p className="px-1 text-[11px] leading-snug text-red-300/70">
                Verwijdert ALLE auto-berichten uit @BetsPluggs via de Bot API en wist de
                lokale geschiedenis. Post meteen de eerstvolgende Free-tier pick onder
                de nieuwe EN-only template. Onomkeerbaar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending matches — quick glance */}
      <PendingMatches history={history} />

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
                    <th className="px-4 py-3 text-left">Match</th>
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
                      <td className="px-4 py-3 text-xs text-[#a3a9b8]">
                        {p.match_home && p.match_away ? (
                          <div>
                            <div className="text-[#ededed]">
                              {p.match_home} <span className="text-[#6b7280]">vs</span> {p.match_away}
                            </div>
                            {p.match_league && (
                              <div className="text-[10px] text-[#6b7280]">
                                {p.match_league}
                                {p.match_kickoff ? ` · ${formatDT(p.match_kickoff)}` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6b7280]">—</span>
                        )}
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
