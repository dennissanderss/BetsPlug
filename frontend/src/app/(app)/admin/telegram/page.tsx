"use client";

/**
 * Admin UI for the @BetsPluggs Telegram auto-poster.
 *
 * Lives inside the authed `(app)` route group so `api.ts` already
 * attaches the admin bearer token automatically — no DevTools Console
 * workaround needed. Accessible at `/admin/telegram` after login.
 *
 * Provides buttons for the three things an operator actually needs:
 *   1. Verify bot token + channel configuration (Health).
 *   2. Force-post the next Free-tier pick right now (Post Next).
 *   3. Force-post the bilingual daily summary.
 *   4. Re-run the result-update sweep on already-posted picks.
 *
 * Plus a live list of recent Telegram posts so you can confirm the
 * scheduled jobs (11/15/19/23 CET) actually fired without SSH-ing
 * into Railway logs.
 */

import { useState } from "react";
import { api } from "@/lib/api";

type AnyJson = unknown;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#4ade80]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function JsonBlock({ data }: { data: AnyJson }) {
  if (data === null || data === undefined) return null;
  return (
    <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-snug text-[#a3a9b8]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ActionButton({
  label,
  onClick,
  busy,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  variant?: "primary" | "ghost";
}) {
  const base =
    variant === "primary" ? "btn-primary" : "btn-glass";
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`${base} inline-flex items-center gap-2 disabled:opacity-50`}
    >
      {busy ? "…" : label}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call<T = any>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
  // Bypass `api.request` because these endpoints aren't typed into the
  // api client and we want direct access to the admin-telegram router.
  // `api.request` reads the bearer token from localStorage and stamps
  // the Authorization header; we replicate that here with a minimal
  // private helper.
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const url = `${API_BASE}${path}`;
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("betsplug_token")
    : null;
  const res = await fetch(url, {
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
    const detail = (json && typeof json === "object" && "detail" in json) ? (json as {detail?: unknown}).detail : json;
    throw new Error(typeof detail === "string" ? detail : `HTTP ${res.status}`);
  }
  return json as T;
}

export default function TelegramAdminPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [health, setHealth] = useState<AnyJson>(null);
  const [queue, setQueue] = useState<AnyJson>(null);
  const [postResult, setPostResult] = useState<AnyJson>(null);
  const [summaryResult, setSummaryResult] = useState<AnyJson>(null);
  const [sweepResult, setSweepResult] = useState<AnyJson>(null);
  const [history, setHistory] = useState<AnyJson>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run<T>(tag: string, fn: () => Promise<T>, setter: (v: T) => void) {
    setBusy(tag);
    setErr(null);
    try {
      const v = await fn();
      setter(v);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(`${tag}: ${msg}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-heading text-3xl text-[#ededed]">
          Telegram · <span className="gradient-text-green">@BetsPluggsgs auto-poster</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#a3a9b8]">
          Test, force, en observeer de Telegram publisher. De scheduler draait
          automatisch op 11:00 / 15:00 / 19:00 / 23:00 CET + elke 15 min result-sweep.
        </p>
      </div>

      {err && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/[0.08] p-3 text-xs text-red-300">
          {err}
        </div>
      )}

      <Section title="1 · Health check">
        <p className="mb-3 text-sm text-[#a3a9b8]">
          Verifieert dat `TELEGRAM_BOT_TOKEN` in Railway staat én dat de
          bot bij Telegram leeft (`getMe`). Je wilt{" "}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[11px]">configured: true</code>{" "}
          én een gevuld{" "}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[11px]">bot</code> object zien.
        </p>
        <ActionButton
          label="Check health"
          busy={busy === "health"}
          onClick={() =>
            run("health", () => call("/admin/telegram/health"), setHealth)
          }
        />
        <JsonBlock data={health} />
      </Section>

      <Section title="2 · Queue — welke pick zou de scheduler nu sturen?">
        <p className="mb-3 text-sm text-[#a3a9b8]">
          Leeg = geen Free-tier pick binnen 48 uur die aan alle filters voldoet
          (conf 55-65%, LEAGUES_FREE, nog niet gepost). Prima, gewoon geen post deze slot.
        </p>
        <ActionButton
          label="Preview queue"
          busy={busy === "queue"}
          onClick={() =>
            run("queue", () => call("/admin/telegram/queue"), setQueue)
          }
        />
        <JsonBlock data={queue} />
      </Section>

      <Section title="3 · Force post — nu een Free pick naar @BetsPluggsgs sturen">
        <p className="mb-3 text-sm text-[#a3a9b8]">
          <strong className="text-amber-300">Let op:</strong> dit post écht naar het
          publieke kanaal. Gebruik eerst Health + Queue om te verifiëren dat alles klopt.
        </p>
        <ActionButton
          label="Post next free pick"
          busy={busy === "post"}
          onClick={() =>
            run("post", () => call("/admin/telegram/post-next", "POST"), setPostResult)
          }
        />
        <JsonBlock data={postResult} />
      </Section>

      <Section title="4 · Force daily summary">
        <p className="mb-3 text-sm text-[#a3a9b8]">
          Post de bilingual dagoverzicht voor vandaag (CET). Skipt als er geen
          picks vandaag zijn gepost.
        </p>
        <ActionButton
          label="Post daily summary"
          busy={busy === "summary"}
          onClick={() =>
            run(
              "summary",
              () => call("/admin/telegram/post-summary", "POST", {}),
              setSummaryResult,
            )
          }
        />
        <JsonBlock data={summaryResult} />
      </Section>

      <Section title="5 · Result sweep">
        <p className="mb-3 text-sm text-[#a3a9b8]">
          Loopt alle niet-afgeronde pick-posts langs en update berichten die
          inmiddels een uitslag hebben. Draait automatisch elke 15 min, hier
          kun je 'm handmatig triggeren.
        </p>
        <ActionButton
          label="Run result sweep"
          busy={busy === "sweep"}
          onClick={() =>
            run("sweep", () => call("/admin/telegram/update-results", "POST"), setSweepResult)
          }
        />
        <JsonBlock data={sweepResult} />
      </Section>

      <Section title="6 · Post history — laatste 50 berichten">
        <ActionButton
          label="Load history"
          variant="ghost"
          busy={busy === "history"}
          onClick={() =>
            run("history", () => call("/admin/telegram/posts?limit=50"), setHistory)
          }
        />
        <JsonBlock data={history} />
      </Section>
    </div>
  );
}
