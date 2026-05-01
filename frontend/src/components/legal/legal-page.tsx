"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { Pill } from "@/components/noct/pill";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * Shared layout for all legal pages (privacy, cookies, terms,
 * responsible-gambling). Uses the NOCTURNE dark glass language:
 * ambient radial glow, card-neon body, soft section-label eyebrow.
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
  const loc = useLocalizedHref();
  const { t } = useTranslations();
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-[#ededed]">

      {/* Hero */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[min(820px,100vw)] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.08] blur-[160px]" />
          <div className="absolute right-1/4 top-40 h-[320px] w-[min(480px,80vw)] rounded-full bg-[#a855f7]/[0.06] blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="section-label">
            <FileText className="h-3 w-3" />
            Legal
          </span>

          <h1 className="text-display mt-2 text-balance text-2xl text-[#ededed] sm:text-4xl md:text-5xl">
            {title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {intro}
          </p>

          <nav
            aria-label="Breadcrumb"
            className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-[#8a93a6]"
          >
            <Link href={loc("/")} className="transition-colors hover:text-[#4ade80]">
              {t("bc.home")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#cbd3e0]">{breadcrumb}</span>
          </nav>

          <div className="mt-5 flex items-center justify-center">
            <Pill>Last updated: {lastUpdated}</Pill>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="relative pb-24">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="card-neon p-5 sm:p-8 md:p-12">
            <div className="relative">
              <article
                className="
                  break-words
                  [&_h2]:text-heading [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:text-[#ededed] first:[&_h2]:mt-0 sm:[&_h2]:text-2xl
                  [&_h3]:text-heading [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:text-[#ededed] sm:[&_h3]:text-xl
                  [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#a3a9b8]
                  [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:text-[#a3a9b8] sm:[&_ul]:pl-6
                  [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:text-sm [&_ol]:text-[#a3a9b8] sm:[&_ol]:pl-6
                  [&_a]:font-medium [&_a]:text-[#4ade80] [&_a]:underline [&_a]:decoration-[#4ade80]/40 [&_a]:underline-offset-4 [&_a]:break-all hover:[&_a]:text-[#86efac]
                  [&_strong]:font-semibold [&_strong]:text-[#ededed]
                "
              >
                {children}
              </article>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
