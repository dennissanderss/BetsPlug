"use client";

import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-green-500/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        {/* Icon */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15 shadow-[0_0_40px_rgba(74,222,128,0.25)]">
          <LifeBuoy className="h-8 w-8 text-green-400" />
        </div>

        {/* Badge */}
        <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
          Support
        </span>

        {/* Heading */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          We&apos;re here to <span className="gradient-text">help</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          This is the BetsPlug Support page. The full contact form, help
          center and live chat experience is being designed — check back soon.
        </p>

        {/* Back link */}
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-slate-300 backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-green-500/[0.06] hover:text-green-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
