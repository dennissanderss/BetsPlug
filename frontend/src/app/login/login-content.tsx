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
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  RefreshCw,
  LogIn,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginContent — customer login page for BetsPlug.
 *
 * Design brief:
 *   • Matches the rest of the marketing site (dark ambient bg,
 *     green accent gradient, SiteNav + BetsPlugFooter, motion
 *     reveals, rounded cards with border-white/[0.08] and
 *     backdrop-blur).
 *   • Two-column layout on desktop: promo/trust panel on the
 *     left, form card on the right. Stacks to single column
 *     on tablet/mobile.
 *   • Remember-this-device checkbox persists via localStorage
 *     under `betsplug.rememberDevice`. When checked, the page
 *     auto-fills the saved email on next visit so returning
 *     members can sign in in two clicks.
 *   • Demo only — the submit handler simulates a request and
 *     then redirects to the dashboard. A real auth integration
 *     can plug into `handleSubmit`.
 */
export function LoginContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  // Pre-fill the email when the user previously opted into
  // "remember this device". This is a progressive enhancement —
  // the page works fine without it.
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

  const emailOk = EMAIL_RE.test(email.trim());
  const passwordOk = password.length > 0;
  const formOk = emailOk && passwordOk;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    if (!formOk) return;

    setSubmitting(true);

    // Persist the "remember this device" preference.
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
      // Ignore storage failures (e.g. private browsing on Safari).
    }

    // Demo: simulate a short round-trip, then persist session
    // and redirect. A real integration can replace this
    // setTimeout with a fetch/auth call and surface any error
    // via setServerError.
    setTimeout(() => {
      // Persist the session so it survives page reloads.
      const demoToken = `demo_${Date.now()}`;
      auth.login(demoToken, {
        email: email.trim(),
        name: email.trim().split("@")[0],
      });

      const next = params?.get("next");
      router.push(next ?? loc("/jouw-route"));
    }, 900);
  };

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-3 pl-11 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:bg-white/[0.06] ${
      hasError
        ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.1] focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060912] text-white">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.08] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <SiteNav />

      <main className="relative z-10 pt-32 pb-24 sm:pt-40">
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* ─── Left: promo / trust column ────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden flex-col justify-center lg:flex"
            >
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-green-400" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
                  {t("login.badge")}
                </span>
              </div>

              <h1 className="max-w-xl text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">
                {t("login.title")}{" "}
                <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {t("login.titleHighlight")}
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
                {t("login.subtitle")}
              </p>

              {/* Trust row */}
              <div className="mt-10 grid max-w-md grid-cols-1 gap-3">
                {[
                  { icon: ShieldCheck, label: t("login.trust1") },
                  { icon: BadgeCheck, label: t("login.trust2") },
                  { icon: RefreshCw, label: t("login.trust3") },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/[0.08]">
                      <item.icon className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── Right: login form card ────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-7 backdrop-blur-xl sm:p-9">
                {/* Card glow */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-green-500/[0.12] blur-[100px]" />

                {/* Mobile headline (desktop has its own in the left column) */}
                <div className="relative mb-6 lg:hidden">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
                      {t("login.badge")}
                    </span>
                  </div>
                  <h1 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {t("login.title")}{" "}
                    <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                      {t("login.titleHighlight")}
                    </span>
                  </h1>
                  <p className="mt-3 text-sm text-slate-400">
                    {t("login.subtitle")}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="relative space-y-5"
                  noValidate
                >
                  {/* Server error banner */}
                  {serverError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 backdrop-blur-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs font-bold text-red-300">
                          {t("login.errorTitle")}
                        </p>
                        <p className="mt-0.5 text-xs text-red-200/80">
                          {serverError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="login-email"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {t("login.email")}
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
                        className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        {t("login.password")}
                      </label>
                      <Link
                        href={loc("/contact")}
                        className="text-xs font-semibold text-green-400 transition-colors hover:text-green-300"
                      >
                        {t("login.forgot")}
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
                        {t("login.passwordError")}
                      </p>
                    )}
                  </div>

                  {/* Remember device */}
                  <label
                    htmlFor="login-remember"
                    className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-green-500/20 hover:bg-green-500/[0.04]"
                  >
                    <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      <input
                        id="login-remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="flex h-5 w-5 items-center justify-center rounded-md border border-white/[0.15] bg-white/[0.04] transition-all peer-checked:border-green-400 peer-checked:bg-green-500">
                        {remember && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3 text-[#060912]"
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
                      <div className="text-sm font-semibold text-white">
                        {t("login.rememberDevice")}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {t("login.rememberHint")}
                      </p>
                    </div>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gradient group flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
                      {t("login.orDivider")}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.08]" />
                  </div>

                  {/* Social buttons (demo) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white"
                    >
                      <GoogleMark />
                      {t("login.google")}
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white"
                    >
                      <AppleMark />
                      {t("login.apple")}
                    </button>
                  </div>
                </form>

                {/* Footer of the card: signup link */}
                <div className="relative mt-7 border-t border-white/[0.06] pt-5 text-center">
                  <span className="text-sm text-slate-500">
                    {t("login.noAccount")}{" "}
                  </span>
                  <Link
                    href={loc("/checkout") + "?plan=gold"}
                    className="text-sm font-bold text-green-400 transition-colors hover:text-green-300"
                  >
                    {t("login.createAccount")}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BetsPlugFooter />
    </div>
  );
}

/* ── Tiny inline brand marks (no external assets) ────────────── */

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
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.26 3.05-.91.9-2.01 1.47-3.16 1.36-.12-1.09.43-2.22 1.21-3.04.85-.92 2.21-1.52 3.21-1.37zM20.4 17.14c-.57 1.28-.85 1.86-1.59 3-1.03 1.6-2.49 3.59-4.3 3.61-1.61.02-2.03-1.05-4.22-1.04-2.19.01-2.65 1.06-4.27 1.04-1.82-.02-3.19-1.82-4.23-3.41C.57 16.3.1 10.6 2.32 7.72c1.49-1.92 3.84-3.04 6.04-3.04 2.25 0 3.66 1.23 5.52 1.23 1.81 0 2.91-1.24 5.51-1.24 1.96 0 4.04 1.07 5.52 2.92-4.85 2.66-4.05 9.6-.51 9.55z" />
    </svg>
  );
}

export default LoginContent;
