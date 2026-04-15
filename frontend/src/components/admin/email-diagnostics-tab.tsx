"use client";

/**
 * EmailDiagnosticsTab — admin panel tab for debugging email delivery.
 *
 * Built because "forgot password" and "register" mails sometimes don't
 * arrive and the public endpoints silently return 200 to prevent account
 * enumeration. This tab gives admin four concrete tools:
 *
 *   1. Live SMTP config inspector — shows hostname/port/user/from and
 *      whether the password is set, without exposing the password itself.
 *
 *   2. Test email button — sends a real email SYNCHRONOUSLY to any
 *      address and displays the actual success/failure (with the SMTP
 *      exception type) instead of quietly logging it to Railway.
 *
 *   3. User finder — case-insensitive partial match on email and
 *      username so typos ("dennissanders" vs "dennissanderss") can be
 *      identified in 2 seconds.
 *
 *   4. Password-reset / verification link generators — issue a fresh
 *      token for a user and display the canonical URL, bypassing SMTP
 *      entirely. Admin can copy-paste this into chat/support when email
 *      delivery is broken.
 *
 * Everything uses the `@/lib/api` client so JWTs are attached automatically.
 */

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Search,
  Key,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Loader2,
  ShieldCheck,
  UserCheck,
  XCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

// ─── Small helpers ────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-neon rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API may be blocked on insecure origins; ignore.
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/[0.08] hover:text-slate-100 transition-colors"
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.04] py-2 text-xs first:border-t-0">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-mono text-slate-200 text-right max-w-[60%] break-all">
        {value}
      </span>
    </div>
  );
}

function formatError(err: unknown): string {
  if (err instanceof ApiError) return `${err.status} – ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

// ─── Sub-section 1: SMTP Config ────────────────────────────────────────────

function SmtpConfigCard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-smtp-config"],
    queryFn: () => api.getAdminSmtpConfig(),
    staleTime: 30_000,
  });

  return (
    <Section
      icon={Mail}
      title="SMTP configuration"
      description="Live values from the Railway backend. Never exposes the password itself."
    >
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading config…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          Failed to load: {formatError(error)}
        </div>
      )}
      {data && (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-4 py-1">
          <Row label="Host" value={data.smtp_host} />
          <Row label="Port" value={data.smtp_port} />
          <Row label="User" value={data.smtp_user} />
          <Row label="From" value={data.smtp_from} />
          <Row
            label="Mode"
            value={
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  data.effective_mode.startsWith("disabled")
                    ? "bg-red-500/15 text-red-300"
                    : "bg-emerald-500/15 text-emerald-300"
                )}
              >
                {data.effective_mode}
              </span>
            }
          />
          <Row
            label="Password set"
            value={
              data.password_set ? (
                <span className="text-emerald-400">yes</span>
              ) : (
                <span className="text-red-400">NO — check SMTP_PASSWORD env var</span>
              )
            }
          />
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/[0.08] hover:text-slate-100"
        >
          Refresh
        </button>
      </div>
    </Section>
  );
}

// ─── Sub-section 2: Test Email ─────────────────────────────────────────────

function TestEmailCard() {
  const [to, setTo] = React.useState("");
  const mutation = useMutation({
    mutationFn: (addr: string) => api.adminTestEmail(addr),
  });

  return (
    <Section
      icon={Send}
      title="Send a test email NOW"
      description="Synchronous send that returns the real SMTP result. Use this before anything else — if this fails, the problem is in your SMTP config, not in the app."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (to.trim()) mutation.mutate(to.trim());
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
          className="flex-1 rounded-lg border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          required
        />
        <button
          type="submit"
          disabled={mutation.isPending || !to.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" /> Send test
            </>
          )}
        </button>
      </form>

      {mutation.data && (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm",
            mutation.data.success
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          )}
        >
          <div className="flex items-start gap-2">
            {mutation.data.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-semibold",
                  mutation.data.success ? "text-emerald-300" : "text-red-300"
                )}
              >
                {mutation.data.success
                  ? `SMTP submission OK in ${mutation.data.duration_ms} ms`
                  : `SMTP submission FAILED in ${mutation.data.duration_ms} ms`}
              </p>
              {mutation.data.error_type && (
                <p className="mt-1 text-xs text-red-200 font-mono break-all">
                  {mutation.data.error_type}: {mutation.data.error_message}
                </p>
              )}
              {mutation.data.success && (
                <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-start gap-2 text-xs text-amber-200">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>
                      A successful SMTP submission does <strong>not</strong>{" "}
                      guarantee the message reaches the inbox. Gmail and
                      Outlook silently drop mail from domains without SPF /
                      DKIM records. If the test email never arrives, check
                      your sending domain's DNS records.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mutation.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          HTTP error: {formatError(mutation.error)}
        </div>
      )}
    </Section>
  );
}

// ─── Sub-section 3: Find users ─────────────────────────────────────────────

function FindUsersCard() {
  const [q, setQ] = React.useState("");
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  const { data, isFetching, error } = useQuery({
    queryKey: ["admin-find-users", submitted],
    queryFn: () => api.adminFindUsers(submitted || ""),
    enabled: !!submitted && submitted.length >= 2,
    staleTime: 10_000,
  });

  return (
    <Section
      icon={Search}
      title="Find users by partial email or username"
      description="Case-insensitive match on both email and username. Use this to catch typos like dennissanders vs dennissanderss."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2) setSubmitted(q.trim());
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. dennissan"
          minLength={2}
          className="flex-1 rounded-lg border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          required
        />
        <button
          type="submit"
          disabled={q.trim().length < 2}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-3.5 w-3.5" /> Search
        </button>
      </form>

      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          {formatError(error)}
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center text-xs text-slate-500">
          No users match <span className="font-mono">{submitted}</span>. That
          could explain the missing mail — try a shorter or different query.
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="text-left px-3 py-2 text-slate-500 font-medium">
                  Email
                </th>
                <th className="text-left px-3 py-2 text-slate-500 font-medium">
                  Username
                </th>
                <th className="text-left px-3 py-2 text-slate-500 font-medium">
                  Role
                </th>
                <th className="text-center px-3 py-2 text-slate-500 font-medium">
                  Verified
                </th>
                <th className="text-center px-3 py-2 text-slate-500 font-medium">
                  Active
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2 font-mono text-slate-200 break-all">
                    {u.email}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{u.username}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        u.role === "admin"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-slate-500/15 text-slate-400"
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {u.email_verified ? (
                      <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="inline h-3.5 w-3.5 text-amber-400" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {u.is_active ? (
                      <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="inline h-3.5 w-3.5 text-red-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ─── Sub-section 4: Password-reset link generator ──────────────────────────

function PasswordResetLinkCard() {
  const [email, setEmail] = React.useState("");
  const mutation = useMutation({
    mutationFn: (addr: string) => api.adminGetPasswordResetLink(addr),
  });

  return (
    <Section
      icon={Key}
      title="Generate a password-reset link"
      description="Bypasses SMTP entirely. Issues a fresh token (1 hour TTL) and returns the reset URL. Copy-paste this to the user."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) mutation.mutate(email.trim());
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 rounded-lg border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          required
        />
        <button
          type="submit"
          disabled={mutation.isPending || !email.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <LinkIcon className="h-3.5 w-3.5" /> Get reset link
            </>
          )}
        </button>
      </form>

      {mutation.data && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-semibold">
              Reset link issued for {mutation.data.email}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <code className="flex-1 rounded-md bg-black/40 px-2 py-1.5 text-[11px] font-mono text-emerald-200 break-all">
              {mutation.data.reset_url}
            </code>
            <CopyButton text={mutation.data.reset_url} />
          </div>
          <p className="text-[11px] text-slate-500">
            Expires:{" "}
            <span className="text-slate-400">
              {new Date(mutation.data.expires_at).toLocaleString()}
            </span>
          </p>
        </div>
      )}

      {mutation.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          {formatError(mutation.error)}
        </div>
      )}
    </Section>
  );
}

// ─── Sub-section 5: Verification link generator + force verify ─────────────

function VerificationHelperCard() {
  const [email, setEmail] = React.useState("");
  const linkMutation = useMutation({
    mutationFn: (addr: string) => api.adminGetVerificationLink(addr),
  });
  const forceMutation = useMutation({
    mutationFn: (addr: string) => api.adminForceVerifyUser(addr),
  });
  const resendMutation = useMutation({
    mutationFn: (addr: string) => api.adminResendVerification(addr),
  });

  return (
    <Section
      icon={ShieldCheck}
      title="Email verification helpers"
      description="Three escape hatches when a user can't receive the verification email: get the link directly, queue another send, or force-verify the account."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 rounded-lg border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => email.trim() && linkMutation.mutate(email.trim())}
          disabled={!email.trim() || linkMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
        >
          <LinkIcon className="h-3 w-3" /> Get verification link
        </button>
        <button
          type="button"
          onClick={() => email.trim() && resendMutation.mutate(email.trim())}
          disabled={!email.trim() || resendMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
        >
          <Send className="h-3 w-3" /> Re-send verification
        </button>
        <button
          type="button"
          onClick={() => {
            if (email.trim() && confirm(`Force-verify ${email}? This bypasses the email flow entirely.`)) {
              forceMutation.mutate(email.trim());
            }
          }}
          disabled={!email.trim() || forceMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <UserCheck className="h-3 w-3" /> Force verify
        </button>
      </div>

      {linkMutation.data && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-300">
            {linkMutation.data.email_verified
              ? "Already verified — no link needed."
              : "Verification link:"}
          </p>
          {linkMutation.data.verification_url && (
            <div className="flex items-start gap-2">
              <code className="flex-1 rounded-md bg-black/40 px-2 py-1.5 text-[11px] font-mono text-blue-200 break-all">
                {linkMutation.data.verification_url}
              </code>
              <CopyButton text={linkMutation.data.verification_url} />
            </div>
          )}
        </div>
      )}

      {resendMutation.data && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          {resendMutation.data.message}
        </div>
      )}

      {forceMutation.data && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-200">
          ✓ {forceMutation.data.email} is now verified.
        </div>
      )}

      {(linkMutation.error || resendMutation.error || forceMutation.error) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          {formatError(
            linkMutation.error || resendMutation.error || forceMutation.error
          )}
        </div>
      )}
    </Section>
  );
}

// ─── Provider setup guide ──────────────────────────────────────────────────

function ProviderSetupCard() {
  return (
    <Section
      icon={AlertTriangle}
      title="How to enable real email delivery"
      description="The backend currently runs in dev mode — it logs the verification / password-reset links to the server logs instead of sending them. Pick any SMTP provider below, set the env vars, and real mail will start flowing."
    >
      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
        <p>
          Any SMTP provider works — the backend is provider-agnostic. The
          code expects these five env vars on the backend:
        </p>
        <div className="rounded-md bg-black/40 px-3 py-2 font-mono text-[11px] text-emerald-200 break-all space-y-0.5">
          <div>SMTP_HOST=smtp.provider.com</div>
          <div>SMTP_PORT=465   # or 587</div>
          <div>SMTP_USER=...</div>
          <div>SMTP_PASSWORD=...</div>
          <div>SMTP_FROM="Your Brand &lt;noreply@yourdomain.com&gt;"</div>
        </div>

        <p className="mt-3">
          Recommended providers for transactional app mail (all have
          generous free tiers):
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>
            <a
              href="https://resend.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Resend
            </a>{" "}
            — 3000/month free, 5-minute setup, great Gmail deliverability
          </li>
          <li>
            <a
              href="https://www.mailgun.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Mailgun
            </a>{" "}
            — 5000/month free for 3 months, then 100/day
          </li>
          <li>
            <a
              href="https://postmarkapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Postmark
            </a>{" "}
            — 100/month free, best-in-class deliverability
          </li>
          <li>
            <a
              href="https://sendgrid.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              SendGrid
            </a>{" "}
            — 100/day free
          </li>
        </ul>

        <p className="mt-4 text-[11px] text-slate-500">
          Whatever provider you choose, they will ask you to add SPF and
          DKIM records to your sending domain's DNS. This is non-optional
          for reliable delivery to Gmail / Outlook. After the DNS
          propagates (usually within an hour), re-run the "Send test
          email" button above. You can independently verify the setup at{" "}
          <a
            href="https://www.mail-tester.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            mail-tester.com
          </a>
          .
        </p>
      </div>
    </Section>
  );
}

// ─── Root tab component ───────────────────────────────────────────────────

export default function EmailDiagnosticsTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SmtpConfigCard />
      <TestEmailCard />
      <FindUsersCard />
      <PasswordResetLinkCard />
      <VerificationHelperCard />
      <ProviderSetupCard />
    </div>
  );
}
