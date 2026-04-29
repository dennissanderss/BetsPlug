"use client";

/**
 * Per-tier Telegram invite card.
 *
 * Shows the calling user's personal single-use invite link for the
 * given paid tier. Used on:
 *   - /thank-you (post-Stripe-checkout)
 *   - /(app)/dashboard (logged-in subscribers, persistent reminder)
 *
 * The link is fetched from `/api/telegram/my-invite/<tier>` which
 * gates on the user's actual paid subscription (server-side). If the
 * user doesn't have access, this component renders nothing — it
 * never reveals a link the user shouldn't see.
 *
 * Visual is intentionally a single dense card with a copy-button +
 * a "do not share" warning. Links are single-use server-side, so
 * accidental sharing only loses one slot — but the warning sets the
 * right expectation up front.
 */

import * as React from "react";
import { Send, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";

type TierSlug = "silver" | "gold" | "platinum";

interface InviteResponse {
  tier: string;
  tier_label: string;
  invite_link: string;
  used_at: string | null;
  expire_date: string | null;
}

const TIER_ACCENT: Record<TierSlug, { ring: string; glow: string; emoji: string }> = {
  silver: {
    ring: "ring-slate-300/40",
    glow: "from-slate-300/15 via-slate-400/10 to-slate-200/15",
    emoji: "🥈",
  },
  gold: {
    ring: "ring-amber-400/40",
    glow: "from-amber-400/15 via-yellow-500/10 to-amber-300/15",
    emoji: "🥇",
  },
  platinum: {
    ring: "ring-emerald-400/40",
    glow: "from-emerald-400/15 via-teal-400/10 to-emerald-300/15",
    emoji: "💎",
  },
};

async function fetchInvite(tier: TierSlug): Promise<InviteResponse | null> {
  // Same bearer-token plumbing as the admin telegram-manager — direct
  // fetch with the locally-stored token. 401 / 403 / 409 are silent
  // (user without that tier, or channel not yet configured) so the
  // component just renders nothing in those cases.
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("betsplug_token")
      : null;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/telegram/my-invite/${tier}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as InviteResponse;
  } catch {
    return null;
  }
}

export function TelegramInviteCard({ tier }: { tier: TierSlug }) {
  const [data, setData] = React.useState<InviteResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInvite(tier).then((r) => {
      if (!cancelled) {
        setData(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tier]);

  if (loading) {
    return (
      <div className="glass-panel flex items-center gap-3 p-5 text-sm text-[#a3a9b8]">
        <Send className="h-4 w-4 animate-pulse" />
        Telegram invite ophalen…
      </div>
    );
  }

  if (!data) {
    // No access OR channel not configured — silent.
    return null;
  }

  const accent = TIER_ACCENT[tier];
  const usedAlready = data.used_at !== null;

  function copyLink() {
    if (!data) return;
    try {
      navigator.clipboard.writeText(data.invite_link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — user can still long-press the link
    }
  }

  return (
    <div
      className={`glass-panel relative overflow-hidden p-6 ring-1 ${accent.ring}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${accent.glow}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-2xl">
            {accent.emoji}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
              {data.tier_label} · Telegram
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-[#ededed]">
              Jouw persoonlijke invite link
            </h3>
          </div>
        </div>
        <Send className="h-5 w-5 text-[#4ade80]" />
      </div>

      <div className="mt-5 rounded-lg border border-white/[0.06] bg-black/30 p-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate text-xs text-[#ededed]">
            {data.invite_link}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-[#a3a9b8] transition hover:bg-white/[0.10] hover:text-[#ededed]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Gekopieerd
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Kopieer
              </>
            )}
          </button>
        </div>
      </div>

      <a
        href={data.invite_link}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        Open in Telegram
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>
          <strong>Deel deze link niet.</strong> Hij is persoonlijk en werkt
          maar één keer. Iemand anders die hem klikt vóór jou krijgt jouw
          plek in het kanaal — dan moet je via support een nieuwe link
          aanvragen.
        </span>
      </div>

      {usedAlready && (
        <p className="mt-3 text-[11px] text-[#6b7280]">
          Status: link gebruikt op{" "}
          {new Date(data.used_at as string).toLocaleString("nl-NL")} — je
          zit nu in het kanaal.
        </p>
      )}
    </div>
  );
}

export default TelegramInviteCard;
