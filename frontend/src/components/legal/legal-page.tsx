"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";

/**
 * Shared layout for all legal pages (privacy, cookies, terms).
 * Uses the same dark/green design language as the rest of the site
 * but keeps the body content readable with a tight prose column.
 */
export function LegalPage({
  title,
  intro,
  lastUpdated,
  breadcrumb,
  children,
}: {
  title: string;
  intro: string;
  lastUpdated: string;
  breadcrumb: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#080b14] text-white">
      <SiteNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-green-500/[0.06] blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
            <FileText className="h-3 w-3" />
            Legal
          </span>

          <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
            {intro}
          </p>

          <nav
            aria-label="Breadcrumb"
            className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            <Link href="/" className="transition-colors hover:text-green-400">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">{breadcrumb}</span>
          </nav>

          <p className="mt-4 text-xs text-slate-500">
            Last updated: <span className="text-slate-300">{lastUpdated}</span>
          </p>
        </div>
      </section>

      {/* ── Body content ────────────────────────────────────────── */}
      <section className="relative pb-24">
        <div className="relative mx-auto max-w-3xl px-6">
          <article
            className="
              rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm md:p-12
              [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white first:[&_h2]:mt-0
              [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white
              [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-300
              [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-sm [&_ul]:text-slate-300
              [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol]:text-sm [&_ol]:text-slate-300
              [&_a]:font-semibold [&_a]:text-green-400 [&_a]:underline-offset-4 hover:[&_a]:underline
              [&_strong]:font-semibold [&_strong]:text-white
            "
          >
            {children}
          </article>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
