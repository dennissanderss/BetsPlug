"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  LogIn,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
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
      const res = await api.login(email.trim(), password, remember);
      auth.login(res.access_token, res.user);
      const next = params?.get("next");
      router.push(next || loc("/dashboard"));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.detail === "email_not_verified") {
          setNeedsVerification(true);
          setServerError(t("login.errorVerifyEmail"));
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

      {/* Slim auth header — just the logo, links back to the public
          marketing site at betsplug.com so a user who landed here by
          accident has a clear escape hatch. */}
      <header className="relative z-20 flex items-center justify-center px-6 pt-8 pb-4">
        <Link
          href="https://betsplug.com"
          className="inline-flex items-center"
          aria-label="BetsPlug home"
        >
          <Image
            src="/logo.webp"
            alt="BetsPlug"
            width={180}
            height={72}
            className="h-12 w-auto drop-shadow-[0_0_18px_rgba(74,222,128,0.35)]"
            priority
          />
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-200px)] items-start justify-center px-6 pt-6 pb-16 sm:pt-10">
        <section className="w-full max-w-md">
          <div>

            {/* Right: login card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="card-neon-green p-5 sm:p-8 md:p-10">
                <div className="relative">
                  {/* Slim auth headline — shown on every viewport now
                      the marketing promo column is gone. Keeps the
                      form recognisable as "the BetsPlug login" without
                      pulling in any sales copy. */}
                  <div className="mb-6">
                    <span className="section-label">
                      <LogIn className="h-3 w-3" />
                      {t("login.badge")}
                    </span>
                    <h1 className="text-heading mt-2 text-balance break-words text-2xl text-[#ededed] sm:text-3xl">
                      {t("login.title")}{" "}
                      <span className="gradient-text-green">
                        {t("login.titleHighlight")}
                      </span>
                    </h1>
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
                              {t("login.verifyEmailTitle")}
                            </p>
                            <p className="mt-0.5 text-xs text-amber-200/80">
                              {t("login.verifyEmailBody", { email: email.trim() })}
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
                            {t("login.resendVerification")}
                          </button>
                          {resendStatus === "success" && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#4ade80]">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("login.resendSent")}
                            </span>
                          )}
                          {resendStatus === "error" && (
                            <span className="text-xs text-red-400">
                              {t("login.resendTryAgain")}
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
                  {t("login.secureLogin")}
                </Pill>
                <Pill tone="purple">{t("login.encrypted")}</Pill>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Slim auth footer — minimal legal + escape hatch back to
          the marketing site. Marketing nav/footer is intentionally
          suppressed on auth routes; this single line keeps the
          page legally compliant without re-introducing site chrome. */}
      <footer className="relative z-10 border-t border-white/[0.04] py-6 text-center text-xs text-[#6b7280]">
        <p>
          © {new Date().getFullYear()} BetsPlug · Educational simulation
          only · 18+ · No financial advice ·{" "}
          <a
            href="https://betsplug.com"
            className="underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Back to public site
          </a>
        </p>
      </footer>
    </div>
  );
}

export default LoginContent;
