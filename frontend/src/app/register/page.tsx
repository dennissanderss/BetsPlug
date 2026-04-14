"use client";

/**
 * /register — customer signup page for BetsPlug.
 *
 * Flow:
 *   1. User fills in email, username, optional full name and
 *      a password + confirmation.
 *   2. On submit we call POST /api/auth/register, which now
 *      returns an access_token + user object just like /auth/login.
 *      The account is created with email_verified = false but the
 *      user is logged in immediately and redirected to /dashboard.
 *   3. Email verification is still sent in the background, and the
 *      user is still required to verify their email before they
 *      can subscribe (the checkout endpoint returns 403 with
 *      detail="email_not_verified" until they click the link).
 *
 * Design matches login-content.tsx — same ambient background,
 * glass card, gradient headline, etc. All text is in English
 * because the shared i18n keys for this route don't exist yet;
 * the language switcher still works for the rest of the site.
 */

import Link from "next/link";
import { useState } from "react";
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
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  Loader2,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

export default function RegisterPage() {
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

  // ── Client-side validation ──────────────────────────────
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
      // The backend returns { access_token, user, message, ... }
      // now — register behaves like login + a status message. We
      // store the token, log the user in and redirect immediately
      // so the user lands in the app instead of bouncing between
      // /register → inbox → /login.
      const res = await api.register({
        email: email.trim(),
        username: username.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      auth.login(res.access_token, res.user);
      // After signup we send new users to /jouw-route ("Your
      // Route"), the intended onboarding hub with a START badge
      // in the sidebar. It's a friendlier landing than the old
      // /dashboard redirect and crucially avoids pushing people
      // straight into the subscription/checkout wizard — users
      // complained about landing in a paywall instead of a
      // welcome screen. If an explicit `?next=` query param was
      // provided (e.g. the user clicked Upgrade first and got
      // bounced through register), we honour it so upgrade flows
      // still work. We use router.replace so the Back button
      // doesn't take the user back to the register form.
      const next = params?.get("next");
      router.replace(next || loc("/jouw-route"));
    } catch (err) {
      if (err instanceof ApiError) {
        // Map common cases to friendlier copy — the backend may
        // return `email_taken`, `username_taken`, `weak_password`
        // etc. We fall back to `err.detail` for anything else.
        if (err.detail === "email_taken") {
          setServerError(
            "An account with that email already exists. Try logging in instead."
          );
        } else if (err.detail === "username_taken") {
          setServerError(
            "That username is already taken. Please pick another one."
          );
        } else if (err.detail === "weak_password") {
          setServerError(
            "Your password is too weak. Use at least 8 characters."
          );
        } else {
          setServerError(
            err.detail || "We couldn't create your account. Please try again."
          );
        }
      } else {
        setServerError(
          "We couldn't create your account. Please try again in a moment."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white ${
      hasError
        ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
        : "border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-slate-900">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.05] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <SiteNav />

      <main className="relative z-10 pt-32 pb-24 sm:pt-40">
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* Left: promo / trust column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden flex-col justify-center lg:flex"
            >
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-4 py-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
                  Join BetsPlug
                </span>
              </div>

              <h1 className="max-w-xl text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 xl:text-5xl">
                Create your{" "}
                <span className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 bg-clip-text text-transparent">
                  free account
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
                Start with zero risk. Get access to today&apos;s picks, track
                ROI and upgrade whenever you&apos;re ready.
              </p>

              <div className="mt-10 grid max-w-md grid-cols-1 gap-3">
                {[
                  { icon: ShieldCheck, label: "Bank-grade encryption" },
                  { icon: BadgeCheck, label: "No credit card required" },
                  { icon: RefreshCw, label: "Cancel or upgrade anytime" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-50">
                      <item.icon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: form card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/50 sm:p-9">
                <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-green-500/[0.06] blur-[100px]" />

                {/* Form */}
                {/* Mobile headline */}
                <div className="relative mb-6 lg:hidden">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-3 py-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-700">
                          Join BetsPlug
                        </span>
                      </div>
                      <h1 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                        Create your{" "}
                        <span className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 bg-clip-text text-transparent">
                          free account
                        </span>
                      </h1>
                      <p className="mt-3 text-sm text-slate-500">
                        Start with zero risk. No credit card required.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="relative space-y-5"
                      noValidate
                    >
                      {serverError && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <div>
                            <p className="text-xs font-bold text-red-700">
                              We couldn&apos;t create your account
                            </p>
                            <p className="mt-0.5 text-xs text-red-600">
                              {serverError}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="register-email"
                          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <input
                            id="register-email"
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

                      {/* Username */}
                      <div>
                        <label
                          htmlFor="register-username"
                          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          Username
                        </label>
                        <div className="relative">
                          <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <input
                            id="register-username"
                            type="text"
                            autoComplete="username"
                            placeholder="your-handle"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={inputCls(tried && !usernameOk)}
                          />
                        </div>
                        {tried && !usernameOk && (
                          <p className="mt-1.5 text-xs text-red-400">
                            3 to 32 characters; letters, digits, dot, dash,
                            underscore.
                          </p>
                        )}
                      </div>

                      {/* Full name (optional) */}
                      <div>
                        <label
                          htmlFor="register-name"
                          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          Full name{" "}
                          <span className="font-normal text-slate-400 normal-case">
                            (optional)
                          </span>
                        </label>
                        <div className="relative">
                          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <input
                            id="register-name"
                            type="text"
                            autoComplete="name"
                            placeholder="Jane Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={inputCls(false)}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label
                          htmlFor="register-password"
                          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <input
                            id="register-password"
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
                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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

                      {/* Confirm password */}
                      <div>
                        <label
                          htmlFor="register-confirm"
                          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <input
                            id="register-confirm"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repeat your password"
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
                            Creating account…
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Create account
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>

                      <p className="text-center text-[11px] leading-relaxed text-slate-500">
                        By creating an account you agree to our{" "}
                        <Link
                          href={loc("/terms")}
                          className="font-semibold text-slate-700 hover:text-green-600"
                        >
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link
                          href={loc("/privacy")}
                          className="font-semibold text-slate-700 hover:text-green-600"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </form>

                <div className="relative mt-7 border-t border-slate-200 pt-5 text-center">
                  <span className="text-sm text-slate-500">
                    Already have an account?{" "}
                  </span>
                  <Link
                    href={loc("/login")}
                    className="text-sm font-bold text-green-600 transition-colors hover:text-green-500"
                  >
                    Log in
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
