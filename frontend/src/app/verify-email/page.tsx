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
import { HexBadge } from "@/components/noct/hex-badge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type VerifyState = "loading" | "success" | "error" | "missing-token";

function VerifyEmailInner() {
  const loc = useLocalizedHref();
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        auth.login(res.access_token, res.user);
        setState("success");
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
          <div className="card-neon-blue p-5 text-center sm:p-8 md:p-10">
            <div className="relative">
              {state === "loading" && (
                <div className="space-y-5">
                  <div className="mx-auto flex justify-center">
                    <HexBadge variant="blue" size="lg">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </HexBadge>
                  </div>
                  <h1 className="text-heading text-balance break-words text-2xl text-[#ededed]">
                    Verifying your email…
                  </h1>
                  <p className="text-sm text-[#a3a9b8]">
                    Hang on a moment while we confirm your account.
                  </p>
                </div>
              )}

              {state === "success" && (
                <div className="space-y-5">
                  <div className="mx-auto flex justify-center">
                    <HexBadge variant="green" size="lg">
                      <CheckCircle2 className="h-7 w-7" />
                    </HexBadge>
                  </div>
                  <h1 className="text-heading text-balance break-words text-2xl text-[#ededed]">
                    Email verified!
                  </h1>
                  <p className="text-sm text-[#a3a9b8]">
                    Your account is active. Taking you to your dashboard…
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-[#8a93a6]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Redirecting
                  </div>
                </div>
              )}

              {state === "missing-token" && (
                <div className="space-y-5">
                  <div className="mx-auto flex justify-center">
                    <HexBadge variant="purple" size="lg">
                      <AlertTriangle className="h-6 w-6" />
                    </HexBadge>
                  </div>
                  <h1 className="text-heading text-balance break-words text-2xl text-[#ededed]">
                    Verification link missing
                  </h1>
                  <p className="text-sm text-[#a3a9b8]">
                    This page needs a verification token. Please use the link
                    from the email we sent you.
                  </p>
                  <Link
                    href={loc("/login")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#4ade80] hover:text-[#86efac]"
                  >
                    Back to login
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {state === "error" && (
                <div className="space-y-5">
                  <div className="mx-auto flex justify-center">
                    <HexBadge variant="purple" size="lg">
                      <AlertTriangle className="h-6 w-6" />
                    </HexBadge>
                  </div>
                  <h1 className="text-heading text-balance break-words text-2xl text-[#ededed]">
                    Link expired or invalid
                  </h1>
                  <p className="text-sm text-[#a3a9b8]">
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
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pl-11 text-sm text-[#ededed] placeholder:text-[#6b7280] outline-none transition-all focus:border-[#4ade80]/60 focus:ring-2 focus:ring-[#4ade80]/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resending}
                      className="btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-60"
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
                      <div className="flex items-center justify-center gap-1 text-xs text-[#4ade80]">
                        <CheckCircle2 className="h-3 w-3" />
                        Check your inbox.
                      </div>
                    )}
                    {resendStatus === "error" && (
                      <div className="text-center text-xs text-red-400">
                        We couldn&apos;t send the email. Please try again.
                      </div>
                    )}
                  </form>

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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background" />}
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
