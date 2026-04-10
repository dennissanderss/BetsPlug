"use client";

/**
 * /forgot-password — entry point for the password recovery
 * flow. The user enters their email address and we fire off a
 * POST /api/auth/forgot-password call. The backend always
 * returns 200 regardless of whether the email exists (to avoid
 * account enumeration), so we show the same confirmation
 * message in every case.
 */

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Mail,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { api, ApiError } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const loc = useLocalizedHref();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailOk = EMAIL_RE.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    if (!emailOk) return;

    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.detail || "Something went wrong. Please try again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060912] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.08] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-[160px]" />
      </div>

      <SiteNav />

      <main className="relative z-10 flex min-h-[70vh] items-center justify-center px-6 pt-32 pb-24 sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-7 backdrop-blur-xl sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-green-500/[0.12] blur-[100px]" />

            {!sent && (
              <>
                <div className="relative mb-6">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
                      Password reset
                    </span>
                  </div>
                  <h1 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight">
                    Forgot your{" "}
                    <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                      password?
                    </span>
                  </h1>
                  <p className="mt-3 text-sm text-slate-400">
                    Enter the email address for your BetsPlug account and
                    we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="relative space-y-5"
                  noValidate
                >
                  {serverError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 backdrop-blur-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <p className="text-xs text-red-200/80">{serverError}</p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 pl-11 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:bg-white/[0.06] ${
                          tried && !emailOk
                            ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                            : "border-white/[0.1] focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                        }`}
                      />
                    </div>
                    {tried && !emailOk && (
                      <p className="mt-1.5 text-xs text-red-400">
                        Please enter a valid email address.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gradient group flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Send reset link
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative mt-7 border-t border-white/[0.06] pt-5 text-center">
                  <Link
                    href={loc("/login")}
                    className="text-sm font-bold text-green-400 transition-colors hover:text-green-300"
                  >
                    ← Back to login
                  </Link>
                </div>
              </>
            )}

            {sent && (
              <div className="relative space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/[0.12]">
                  <CheckCircle2 className="h-7 w-7 text-green-300" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Check your inbox
                </h1>
                <p className="text-sm leading-relaxed text-slate-400">
                  If an account with that email exists, we&apos;ve sent a
                  password reset link to it. It may take a minute to arrive —
                  don&apos;t forget to check your spam folder.
                </p>
                <div className="border-t border-white/[0.06] pt-5">
                  <Link
                    href={loc("/login")}
                    className="text-sm font-bold text-green-400 transition-colors hover:text-green-300"
                  >
                    ← Back to login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <BetsPlugFooter />
    </div>
  );
}
