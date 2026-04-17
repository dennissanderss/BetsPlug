"use client";

import * as React from "react";
import { KeyRound, Mail, Shield } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";

/**
 * /settings — intentionally minimal.
 *
 * Dennis trimmed this page down on 2026-04-17: previous version had
 * followed-leagues pickers, notification toggles, display preferences
 * etc. that were all local state with no backend persistence. Confused
 * users more than it helped. Until any of that actually ships with
 * real wiring, the only thing a user can do here is trigger a password
 * reset email. Profile/subscription/account management lives on
 * /myaccount.
 */

type ResetState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function SettingsPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [state, setState] = React.useState<ResetState>({ kind: "idle" });

  const email = user?.email ?? "";
  const disabled = !email || state.kind === "sending" || state.kind === "sent";

  const handleSendReset = async () => {
    if (!email) return;
    setState({ kind: "sending" });
    try {
      await api.forgotPassword(email);
      setState({ kind: "sent" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error — please try again.";
      setState({ kind: "error", message });
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10 animate-fade-in">
      {/* ambient glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/3 -z-10 h-64 w-64 rounded-full bg-[#4ade80]/10 blur-3xl"
      />

      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <HexBadge variant="green" size="lg">
          <Shield className="h-6 w-6" />
        </HexBadge>
        <div>
          <span className="section-label">{t("settings.kicker")}</span>
          <h1 className="text-heading mt-3 gradient-text-green">
            {t("settings.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            {t("settings.subtitle")}
          </p>
        </div>
      </div>

      {/* Password card — the one thing this page does */}
      <div className="card-neon card-neon-green">
        <div className="relative p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <HexBadge variant="green" size="md">
              <KeyRound className="h-5 w-5" />
            </HexBadge>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-lg font-bold text-white">
                {t("settings.passwordTitle")}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t("settings.passwordBody")}
              </p>

              {email && (
                <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span className="tabular-nums">{email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendReset}
              disabled={disabled}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {state.kind === "sending"
                ? t("settings.passwordSending")
                : state.kind === "sent"
                  ? t("settings.passwordSent")
                  : t("settings.passwordCta")}
            </button>

            {state.kind === "sent" && (
              <p className="text-xs text-[#4ade80]">
                {t("settings.passwordSentHelp")}
              </p>
            )}
            {state.kind === "error" && (
              <p className="text-xs text-red-400">{state.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pointer to /myaccount for the rest */}
      <p className="mt-6 text-center text-xs text-slate-500">
        {t("settings.accountPointerPrefix")}{" "}
        <a
          href="/myaccount"
          className="text-[#4ade80] hover:underline"
        >
          {t("settings.accountPointerLink")}
        </a>
        .
      </p>
    </div>
  );
}
