"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  RefreshCw,
  LogIn,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginContent — customer login page for BetsPlug, rebuilt in the
 * NOCTURNE UI language.
 */
export function LoginContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  const savedEmail = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("betsplug.rememberDevice");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { email?: string };
      return parsed.email ?? "";
    } catch {
      return "";
    }
  }, []);

  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(Boolean(savedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    null | "success" | "error"
  >(null);

  const emailOk = EMAIL_RE.test(email.trim());
  const passwordOk = password.length > 0;
  const formOk = emailOk && passwordOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    setNeedsVerification(false);
    setResendStatus(null);
    if (!formOk) return;

    setSubmitting(true);

    try {
      if (remember) {
        window.localStorage.setItem(
          "betsplug.rememberDevice",
          JSON.stringify({ email: email.trim(), savedAt: Date.now() })
        );
      } else {
        window.localStorage.removeItem("betsplug.rememberDevice");
      }
    } catch {
      /* noop */
    }

    try {
      const res = await api.login(email.trim(), password);
      auth.login(res.access_token, res.user);
      const next = params?.get("next");
      router.push(next || loc("/jouw-route"));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.detail === "email_not_verified") {
          setNeedsVerification(true);
          setServerError(
            "Please verify your email address before signing in."
          );
        } else if (err.status === 401 || err.status === 400) {
          setServerError(t("login.errorGeneric"));
        } else {
          setServerError(err.detail || t("login.errorGeneric"));
        }
      } else {
        setServerError(t("login.errorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!emailOk) return;
    setResending(true);
    setResendStatus(null);
    try {
      await api.resendVerification(email.trim());
      setResendStatus("success");
    } catch {
      setResendStatus("error");
    } finally {
      setResending(false);
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
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[540px] w-[540px] rounded-full bg-[#4ade80]/[0.09] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[540px] w-[540px] rounded-full bg-[#a855f7]/[0.07] blur-[160px]" />
      </div>

      <SiteNav />

      <main className="relative z-10 pt-40 pb-24 sm:pt-48">
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* Left: promo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden flex-col justify-center lg:flex"
            >
              <span className="section-label">
                <LogIn className="h-3 w-3" />
                {t("login.badge")}
              </span>

              <h1 className="text-display mt-3 max-w-xl text-balance break-words text-4xl text-[#ededed] xl:text-5xl">
                {t("login.title")}{" "}
                <span className="gradient-text-green">
                  {t("login.titleHighlight")}
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#a3a9b8]">
                {t("login.subtitle")}
              </p>

              <div className="mt-10 grid max-w-md grid-cols-1 gap-3">
                {[
                  { icon: ShieldCheck, label: t("login.trust1"), variant: "green" as const },
                  { icon: BadgeCheck, label: t("login.trust2"), variant: "purple" as const },
                  { icon: RefreshCw, label: t("login.trust3"), variant: "blue" as const },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="glass-panel flex items-center gap-3 px-4 py-3"
                  >
                    <HexBadge variant={item.variant} size="sm" noGlow>
                      <item.icon className="h-4 w-4" />
                    </HexBadge>
                    <span className="text-sm font-medium text-[#cbd3e0]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: login card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="card-neon-green p-5 sm:p-8 md:p-10">
                <div className="relative">
                  {/* Mobile headline */}
                  <div className="mb-6 lg:hidden">
                    <span className="section-label">
                      <LogIn className="h-3 w-3" />
                      {t("login.badge")}
                    </span>
                    <h1 className="text-heading mt-2 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
                      {t("login.title")}{" "}
                      <span className="gradient-text-green">
                        {t("login.titleHighlight")}
                      </span>
                    </h1>
                    <p className="mt-3 text-sm text-[#a3a9b8]">
                      {t("login.subtitle")}
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    noValidate
                  >
                    {serverError && !needsVerification && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        <div>
                          <p className="text-xs font-semibold text-red-300">
                            {t("login.errorTitle")}
                          </p>
                          <p className="mt-0.5 text-xs text-red-300/80">
                            {serverError}
                          </p>
                        </div>
                      </div>
                    )}

                    {needsVerification && (
                      <div className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-500/[0.08] px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-200">
                              Verify your email
                            </p>
                            <p className="mt-0.5 text-xs text-amber-200/80">
                              We sent a verification link to {email.trim()}.
                              Click it to finish activating your account.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resending || !emailOk}
                            className="btn-glass !py-1.5 !px-3 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {resending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Resend verification email
                          </button>
                          {resendStatus === "success" && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#4ade80]">
                              <CheckCircle2 className="h-3 w-3" />
                              Sent
                            </span>
                          )}
                          {resendStatus === "error" && (
                            <span className="text-xs text-red-400">
                              Try again
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="login-email"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        {t("login.email")}
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder={t("login.emailPh")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputCls(tried && !emailOk)}
                        />
                      </div>
                      {tried && !emailOk && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {t("login.emailError")}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="login-password"
                          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                        >
                          {t("login.password")}
                        </label>
                        <Link
                          href={loc("/forgot-password")}
                          className="text-xs font-medium text-[#4ade80] transition-colors hover:text-[#86efac]"
                        >
                          {t("login.forgot")}
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("login.passwordPh")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`${inputCls(
                            tried && !passwordOk
                          )} pr-12`}
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword
                              ? t("login.hidePassword")
                              : t("login.showPassword")
                          }
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-white/[0.04] hover:text-[#ededed]"
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
                          {t("login.passwordError")}
                        </p>
                      )}
                    </div>

                    {/* Remember device */}
                    <label
                      htmlFor="login-remember"
                      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-[#4ade80]/30 hover:bg-white/[0.05]"
                    >
                      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                        <input
                          id="login-remember"
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] transition-all peer-checked:border-[#4ade80] peer-checked:bg-[#4ade80]">
                          {remember && (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3 w-3 text-[#05130b]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#ededed]">
                          {t("login.rememberDevice")}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#a3a9b8]">
                          {t("login.rememberHint")}
                        </p>
                      </div>
                    </label>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("login.submitting")}
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          {t("login.submit")}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/[0.08]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a93a6]">
                        {t("login.orDivider")}
                      </span>
                      <div className="h-px flex-1 bg-white/[0.08]" />
                    </div>

                    {/* Social buttons */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button type="button" className="btn-glass">
                        <GoogleMark />
                        {t("login.google")}
                      </button>
                      <button type="button" className="btn-glass">
                        <AppleMark />
                        {t("login.apple")}
                      </button>
                    </div>
                  </form>

                  {/* Footer */}
                  <div className="mt-7 border-t border-white/[0.08] pt-5 text-center">
                    <span className="text-sm text-[#a3a9b8]">
                      {t("login.noAccount")}{" "}
                    </span>
                    <Link
                      href={loc("/register")}
                      className="text-sm font-semibold text-[#4ade80] transition-colors hover:text-[#86efac]"
                    >
                      {t("login.createAccount")}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Trust pills below card */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Pill>
                  <Lock className="h-3 w-3" />
                  Secure login
                </Pill>
                <Pill tone="purple">Encrypted</Pill>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BetsPlugFooter />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#ededed]" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.26 3.05-.91.9-2.01 1.47-3.16 1.36-.12-1.09.43-2.22 1.21-3.04.85-.92 2.21-1.52 3.21-1.37zM20.4 17.14c-.57 1.28-.85 1.86-1.59 3-1.03 1.6-2.49 3.59-4.3 3.61-1.61.02-2.03-1.05-4.22-1.04-2.19.01-2.65 1.06-4.27 1.04-1.82-.02-3.19-1.82-4.23-3.41C.57 16.3.1 10.6 2.32 7.72c1.49-1.92 3.84-3.04 6.04-3.04 2.25 0 3.66 1.23 5.52 1.23 1.81 0 2.91-1.24 5.51-1.24 1.96 0 4.04 1.07 5.52 2.92-4.85 2.66-4.05 9.6-.51 9.55z" />
    </svg>
  );
}

export default LoginContent;
