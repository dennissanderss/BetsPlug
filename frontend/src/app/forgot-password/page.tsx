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
  Loader2,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { api, ApiError } from "@/lib/api";
import { HexBadge } from "@/components/noct/hex-badge";

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

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/[0.04] px-4 py-3 pl-11 text-sm text-[#ededed] placeholder:text-[#6b7280] outline-none transition-all ${
      hasError
        ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.08] focus:border-[#4ade80]/60 focus:ring-2 focus:ring-[#4ade80]/20"
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-[#60a5fa]/[0.08] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-[#4ade80]/[0.06] blur-[160px]" />
      </div>

      <SiteNav />

      <main className="relative z-10 flex min-h-[70vh] items-center justify-center px-6 pt-32 pb-24 sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="card-neon-blue p-8 md:p-10">
            <div className="relative">
              {!sent && (
                <>
                  <div className="mb-6">
                    <div className="mb-5 flex items-center gap-3">
                      <HexBadge variant="blue" size="md">
                        <KeyRound className="h-5 w-5" />
                      </HexBadge>
                      <span className="section-label !mb-0">Password reset</span>
                    </div>
                    <h1 className="text-heading text-3xl text-[#ededed]">
                      Forgot your{" "}
                      <span className="gradient-text-cyan">password?</span>
                    </h1>
                    <p className="mt-3 text-sm text-[#a3a9b8]">
                      Enter the email address for your BetsPlug account and
                      we&apos;ll send you a link to reset your password.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    noValidate
                  >
                    {serverError && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        <p className="text-xs text-red-300">{serverError}</p>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="forgot-email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="you@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputCls(tried && !emailOk)}
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
                      className="btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-60"
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

                  <div className="mt-7 border-t border-white/[0.08] pt-5 text-center">
                    <Link
                      href={loc("/login")}
                      className="text-sm font-medium text-[#4ade80] transition-colors hover:text-[#86efac]"
                    >
                      ← Back to login
                    </Link>
                  </div>
                </>
              )}

              {sent && (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex justify-center">
                    <HexBadge variant="green" size="lg">
                      <CheckCircle2 className="h-7 w-7" />
                    </HexBadge>
                  </div>
                  <h1 className="text-heading text-2xl text-[#ededed]">
                    Check your inbox
                  </h1>
                  <p className="text-sm leading-relaxed text-[#a3a9b8]">
                    If an account with that email exists, we&apos;ve sent a
                    password reset link to it. It may take a minute to arrive —
                    don&apos;t forget to check your spam folder.
                  </p>
                  <div className="border-t border-white/[0.08] pt-5">
                    <Link
                      href={loc("/login")}
                      className="text-sm font-medium text-[#4ade80] transition-colors hover:text-[#86efac]"
                    >
                      ← Back to login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <BetsPlugFooter />
    </div>
  );
}
