"use client";

/**
 * /verify-email — consumes the verification link emailed to
 * users after signup.
 *
 * Flow:
 *   1. Read `?token=XXX` from the URL.
 *   2. POST to /api/auth/verify-email — on success the backend
 *      returns an access token + user, so we can auto-log the
 *      user in and send them to the dashboard.
 *   3. If the link is expired or invalid we show an error
 *      state with a resend-verification form so the user can
 *      request a new link without leaving the page.
 *
 * Wrapped in <Suspense> at the page level because
 * `useSearchParams()` suspends on first render.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type VerifyState = "loading" | "success" | "error" | "missing-token";

function VerifyEmailInner() {
  const loc = useLocalizedHref();
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend form (only shown on error)
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    null | "success" | "error"
  >(null);

  const token = params?.get("token") || "";

  useEffect(() => {
    if (!token) {
      setState("missing-token");
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const res = await api.verifyEmail(token);
        if (cancelled) return;
        // Auto-login the user from the server response.
        auth.login(res.access_token, res.user);
        setState("success");
        // Brief pause so the success state is visible before
        // the redirect (nicer UX than an instant jump).
        setTimeout(() => {
          if (!cancelled) {
            router.push(loc("/dashboard"));
          }
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        setState("error");
        if (err instanceof ApiError) {
          setErrorMessage(
            err.detail === "invalid_token" || err.detail === "expired_token"
              ? "This verification link has expired or is invalid."
              : err.detail || "We couldn't verify your email."
          );
        } else {
          setErrorMessage("We couldn't verify your email.");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // We only want to run this on initial mount — the token
    // shouldn't change during the lifetime of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(resendEmail.trim())) {
      setResendStatus("error");
      return;
    }
    setResending(true);
    setResendStatus(null);
    try {
      await api.resendVerification(resendEmail.trim());
      setResendStatus("success");
    } catch {
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.05] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[160px]" />
      </div>

      <SiteNav />

      <main className="relative z-10 flex min-h-[70vh] items-center justify-center px-6 pt-32 pb-24 sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-green-500/[0.06] blur-[100px]" />

            {/* Loading */}
            {state === "loading" && (
              <div className="relative space-y-5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-50">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Verifying your email…
                </h1>
                <p className="text-sm text-slate-500">
                  Hang on a moment while we confirm your account.
                </p>
              </div>
            )}

            {/* Success */}
            {state === "success" && (
              <div className="relative space-y-5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-50">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Email verified!
                </h1>
                <p className="text-sm text-slate-500">
                  Your account is active. Taking you to your dashboard…
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Redirecting
                </div>
              </div>
            )}

            {/* Missing token */}
            {state === "missing-token" && (
              <div className="relative space-y-5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/[0.12]">
                  <AlertTriangle className="h-6 w-6 text-amber-300" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Verification link missing
                </h1>
                <p className="text-sm text-slate-500">
                  This page needs a verification token. Please use the link
                  from the email we sent you.
                </p>
                <Link
                  href={loc("/login")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-500"
                >
                  Back to login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Error */}
            {state === "error" && (
              <div className="relative space-y-5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/[0.12]">
                  <AlertTriangle className="h-6 w-6 text-red-300" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Link expired or invalid
                </h1>
                <p className="text-sm text-slate-500">
                  {errorMessage ||
                    "This verification link can no longer be used."}{" "}
                  Enter your email below and we&apos;ll send a new one.
                </p>

                <form
                  onSubmit={handleResend}
                  className="space-y-3 text-left"
                  noValidate
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-green-500/50 focus:bg-white focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resending}
                    className="btn-gradient group flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-60 text-white"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Send a new link
                      </>
                    )}
                  </button>
                  {resendStatus === "success" && (
                    <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Check your inbox.
                    </div>
                  )}
                  {resendStatus === "error" && (
                    <div className="text-center text-xs text-red-600">
                      We couldn&apos;t send the email. Please try again.
                    </div>
                  )}
                </form>

                <div className="border-t border-slate-200 pt-5">
                  <Link
                    href={loc("/login")}
                    className="text-sm font-bold text-green-600 transition-colors hover:text-green-500"
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background" />}
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
