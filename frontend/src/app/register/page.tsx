"use client";

/**
 * /register — customer signup page for BetsPlug, rebuilt in the
 * NOCTURNE UI language.
 */

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  User as UserIcon,
  AtSign,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  Loader2,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { HexBadge } from "@/components/noct/hex-badge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

export default function RegisterPage() {
  // `useSearchParams` suspends on first render during static prerender,
  // which Next.js only permits inside a Suspense boundary. The inner
  // component holds all the form state so the boundary wraps it once.
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailOk = EMAIL_RE.test(email.trim());
  const usernameOk = USERNAME_RE.test(username.trim());
  const passwordOk = password.length >= 8;
  const confirmOk = confirm === password && confirm.length > 0;
  const formOk = emailOk && usernameOk && passwordOk && confirmOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    if (!formOk) return;

    setSubmitting(true);
    try {
      const res = await api.register({
        email: email.trim(),
        username: username.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      auth.login(res.access_token, res.user);
      const next = params?.get("next");
      router.replace(next || loc("/dashboard"));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.detail === "email_taken") {
          setServerError(t("register.errorEmailTaken"));
        } else if (err.detail === "username_taken") {
          setServerError(t("register.errorUsernameTaken"));
        } else if (err.detail === "weak_password") {
          setServerError(t("register.errorWeakPassword"));
        } else {
          setServerError(err.detail || t("register.errorGeneric"));
        }
      } else {
        setServerError(t("register.errorGenericRetry"));
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
        <div className="absolute -left-40 top-40 h-[540px] w-[540px] rounded-full bg-[#4ade80]/[0.09] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[540px] w-[540px] rounded-full bg-[#a855f7]/[0.07] blur-[160px]" />
      </div>


      <main className="relative z-10 pt-32 pb-24 sm:pt-40">
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* Left promo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden flex-col justify-center lg:flex"
            >
              <span className="section-label">
                <UserPlus className="h-3 w-3" />
                {t("register.badge")}
              </span>

              <h1 className="text-display mt-3 max-w-xl text-balance break-words text-4xl text-[#ededed] xl:text-5xl">
                {t("register.title")}{" "}
                <span className="gradient-text-green">{t("register.titleHighlight")}</span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#a3a9b8]">
                {t("register.subtitle")}
              </p>

              <div className="mt-10 grid max-w-md grid-cols-1 gap-3">
                {[
                  { icon: ShieldCheck, label: t("register.trust1"), variant: "green" as const },
                  { icon: BadgeCheck, label: t("register.trust2"), variant: "purple" as const },
                  { icon: RefreshCw, label: t("register.trust3"), variant: "blue" as const },
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

            {/* Right form */}
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
                      <UserPlus className="h-3 w-3" />
                      {t("register.badge")}
                    </span>
                    <h1 className="text-heading mt-2 text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
                      {t("register.title")}{" "}
                      <span className="gradient-text-green">{t("register.titleHighlight")}</span>
                    </h1>
                    <p className="mt-3 text-sm text-[#a3a9b8]">
                      {t("register.subtitleMobile")}
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
                        <div>
                          <p className="text-xs font-semibold text-red-300">
                            {t("register.errorTitle")}
                          </p>
                          <p className="mt-0.5 text-xs text-red-300/80">
                            {serverError}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="register-email"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        {t("register.emailLabel")}
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="register-email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder={t("register.emailPh")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputCls(tried && !emailOk)}
                        />
                      </div>
                      {tried && !emailOk && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {t("register.emailError")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="register-username"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        {t("register.usernameLabel")}
                      </label>
                      <div className="relative">
                        <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="register-username"
                          type="text"
                          autoComplete="username"
                          placeholder={t("register.usernamePh")}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={inputCls(tried && !usernameOk)}
                        />
                      </div>
                      {tried && !usernameOk && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {t("register.usernameError")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="register-name"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        {t("register.fullNameLabel")}{" "}
                        <span className="font-normal normal-case text-[#6b7280]">
                          {t("register.fullNameOptional")}
                        </span>
                      </label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="register-name"
                          type="text"
                          autoComplete="name"
                          placeholder={t("register.fullNamePh")}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={inputCls(false)}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="register-password"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        {t("register.passwordLabel")}
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={t("register.passwordPh")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`${inputCls(tried && !passwordOk)} pr-12`}
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword ? t("register.hidePassword") : t("register.showPassword")
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
                          {t("register.passwordError")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="register-confirm"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a93a6]"
                      >
                        {t("register.confirmLabel")}
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                        <input
                          id="register-confirm"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={t("register.confirmPh")}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className={inputCls(tried && !confirmOk)}
                        />
                      </div>
                      {tried && !confirmOk && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {t("register.confirmError")}
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
                          {t("register.submitting")}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          {t("register.submit")}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] leading-relaxed text-[#8a93a6]">
                      {t("register.termsPrefix")}{" "}
                      <Link
                        href="https://betsplug.com/terms"
                        target="_blank"
                        className="font-medium text-[#4ade80] hover:text-[#86efac]"
                      >
                        {t("register.termsLink")}
                      </Link>{" "}
                      {t("register.termsAnd")}{" "}
                      <Link
                        href="https://betsplug.com/privacy"
                        target="_blank"
                        className="font-medium text-[#4ade80] hover:text-[#86efac]"
                      >
                        {t("register.privacyLink")}
                      </Link>
                      {t("register.termsSuffix")}
                    </p>
                  </form>

                  <div className="mt-7 border-t border-white/[0.08] pt-5 text-center">
                    <span className="text-sm text-[#a3a9b8]">
                      {t("register.haveAccount")}{" "}
                    </span>
                    <Link
                      href={loc("/login")}
                      className="text-sm font-semibold text-[#4ade80] transition-colors hover:text-[#86efac]"
                    >
                      {t("register.logInLink")}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

    </div>
  );
}
