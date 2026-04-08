"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Twitter,
  Instagram,
  X,
  Send,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { GetStartedButton } from "@/components/ui/get-started-button";

export function BetsPlugFooter() {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // TODO: wire up to backend newsletter endpoint
    setTimeout(() => {
      setModalOpen(false);
      setSubmitted(false);
      setEmail("");
    }, 2000);
  };

  return (
    <>
      <footer className="relative mx-auto mt-10 max-w-7xl overflow-hidden rounded-t-full border border-white/[0.06] border-b-0 bg-gradient-to-b from-white/[0.02] to-transparent px-6 pb-8 pt-16 backdrop-blur-sm">
        {/* Background grid pattern with radial mask */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />

        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-green-500/[0.08] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-14 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
            {/* Brand column */}
            <div className="col-span-1 flex flex-col gap-6 md:col-span-5">
              <Link href="/" className="flex items-center">
                <img
                  src="/logo.webp"
                  alt="BetsPlug"
                  className="h-14 w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)] sm:h-16"
                />
              </Link>

              <p className="max-w-sm text-sm leading-relaxed text-slate-400">
                AI-driven sports predictions for serious analysts. Data, models, and insights
                — united in one platform built for your winning edge.
              </p>

              {/* Newsletter CTA trigger */}
              <div className="mt-2 max-w-sm rounded-full border border-green-500/20 bg-gradient-to-br from-green-500/[0.06] to-transparent p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
                    <Send className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Exclusive Telegram Tips</p>
                    <p className="text-xs text-slate-500">Free daily picks & insights</p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">
                  Join our newsletter to unlock premium tips shared{" "}
                  <span className="font-semibold text-green-400">only in our private Telegram</span>.
                </p>
                <button type="button" onClick={() => setModalOpen(true)} className="w-full">
                  <GetStartedButton className="w-full">Join Telegram</GetStartedButton>
                </button>
              </div>
            </div>

            {/* Link columns */}
            {[
              {
                title: "Platform",
                links: [
                  { label: "Predictions", href: "/predictions" },
                  { label: "Live Matches", href: "/live" },
                  { label: "Track Record", href: "/trackrecord" },
                  { label: "Bet of the Day", href: "/bet-of-the-day" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "/about" },
                  { label: "Pricing", href: "/subscriptions" },
                  { label: "Deals", href: "/deals" },
                  { label: "Contact", href: "#" },
                ],
              },
              {
                title: "Connect",
                links: [
                  { label: "Telegram", href: "#" },
                  { label: "Twitter / X", href: "#" },
                  { label: "Instagram", href: "#" },
                  { label: "Discord", href: "#" },
                ],
              },
            ].map((section) => (
              <div
                key={section.title}
                className="col-span-1 flex flex-col gap-4 md:col-span-2"
              >
                <h4 className="font-mono text-xs font-semibold uppercase tracking-widest text-white/70">
                  {section.title}
                </h4>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex w-fit items-center gap-2 text-sm text-slate-400 transition-colors hover:text-green-400"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600 transition-all duration-200 group-hover:w-4 group-hover:bg-green-400" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mb-6 rounded-full border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <p className="text-center text-xs leading-relaxed text-slate-500">
              <span className="font-semibold text-amber-400">Disclaimer:</span> BetsPlug is a data
              analytics platform. We calculate probabilities using statistical models. This is{" "}
              <span className="font-semibold text-slate-300">not gambling advice</span>. All
              outputs are simulated and hypothetical. Always make your own informed decisions.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 md:flex-row">
            <p className="font-mono text-xs text-slate-600">
              © {new Date().getFullYear()} BETSPLUG // ALL RIGHTS RESERVED
            </p>

            <div className="flex items-center gap-6">
              {/* Socials */}
              <div className="mr-2 flex gap-4 border-r border-white/10 pr-6">
                {[
                  { Icon: MessageCircle, href: "#", label: "Telegram" },
                  { Icon: Twitter, href: "#", label: "Twitter" },
                  { Icon: Instagram, href: "#", label: "Instagram" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="text-slate-600 transition-colors hover:text-green-400"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-green-400/80">
                  All Systems Normal
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════
          Newsletter Modal
         ═══════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-md animate-slide-up overflow-hidden rounded-full border border-green-500/20 bg-gradient-to-br from-[#0d1220] to-[#080b14] p-8 shadow-2xl">
            {/* Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-500/20 blur-[100px]" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px]" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {!submitted ? (
              <div className="relative">
                {/* Icon */}
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 shadow-[0_0_30px_rgba(74,222,128,0.25)]">
                  <Sparkles className="h-7 w-7 text-green-400" />
                </div>

                <h3 className="mb-3 text-2xl font-extrabold text-white">
                  Get Exclusive Tips on{" "}
                  <span className="gradient-text">Telegram</span>
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-400">
                  Sign up for our newsletter and unlock access to our{" "}
                  <span className="font-semibold text-white">private Telegram channel</span>{" "}
                  with exclusive daily picks, live insights, and premium content — all for free.
                </p>

                {/* Benefits */}
                <div className="mb-6 space-y-2">
                  {[
                    "Daily premium picks straight to your phone",
                    "Early access to Bet of the Day",
                    "Live analyst commentary during matches",
                  ].map((b) => (
                    <div key={b} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 backdrop-blur-sm transition-colors focus:border-green-500/60 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <button type="submit" className="w-full">
                    <GetStartedButton className="w-full">Join Telegram Channel</GetStartedButton>
                  </button>
                </form>

                <p className="mt-4 text-center text-[11px] text-slate-600">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            ) : (
              <div className="relative py-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 shadow-[0_0_40px_rgba(74,222,128,0.4)]">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="mb-2 text-2xl font-extrabold text-white">You&apos;re in!</h3>
                <p className="text-sm text-slate-400">
                  Check your inbox for the Telegram invite link.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
