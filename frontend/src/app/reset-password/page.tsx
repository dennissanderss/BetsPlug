"use client";

/**
 * /reset-password — consumes the password-reset link emailed
 * to users. Reads `?token=XXX` from the URL, takes a new
 * password + confirmation, and POSTs to the backend. On
 * success the user is bounced back to the login page after a
 * short delay so they can sign in with their fresh password.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { api, ApiError } from "@/lib/api";

function ResetPasswordInner() {
  const loc = useLocalizedHref();
  const router = useRouter();
  const params = useSearchParams();

  const token = params?.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordOk = password.length >= 8;
  const confirmOk = confirm === password && confirm.length > 0;
  const formOk = passwordOk && confirmOk && token.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    if (!formOk) {
      if (!token) setServerError("This reset link is invalid or expired.");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push(loc("/login"));
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.status === 400 ||
          err.detail === "invalid_token" ||
          err.detail === "expired_token"
        ) {
          setServerError(
            "This reset link has expired or is invalid. Please request a new one."
          );
        } else {
          setServerError(
            err.detail || "We couldn't reset your password. Please try again."
          );
        }
      } else {
        setServerError("We couldn't reset your password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-3 pl-11 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:bg-white/[0.06] ${
      hasError
        ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.1] focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
    }`;

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

            {!success && (
              <>
                <div className="relative mb-6">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
                      Reset password
                    </span>
                  </div>
                  <h1 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight">
                    Choose a new{" "}
                    <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                      password
                    </span>
                  </h1>
                  <p className="mt-3 text-sm text-slate-400">
                    Pick something you haven&apos;t used before — at least 8
                    characters.
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

                  {/* New password */}
                  <div>
                    <label
                      htmlFor="reset-password"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputCls(tried && !passwordOk)} pr-12`}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {tried && !passwordOk && (
                      <p className="mt-1.5 text-xs text-red-400">
                        Password must be at least 8 characters long.
                      </p>
                    )}
                  </div>

                  {/* Confirm */}
                  <div>
                    <label
                      htmlFor="reset-confirm"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Confirm new password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="reset-confirm"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat your new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={inputCls(tried && !confirmOk)}
                      />
                    </div>
                    {tried && !confirmOk && (
                      <p className="mt-1.5 text-xs text-red-400">
                        Passwords do not match.
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
                        Updating…
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Reset password
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

            {success && (
              <div className="relative space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/[0.12]">
                  <CheckCircle2 className="h-7 w-7 text-green-300" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Password reset
                </h1>
                <p className="text-sm leading-relaxed text-slate-400">
                  Your password has been updated. Redirecting you to the
                  login page…
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Redirecting
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060912]" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
