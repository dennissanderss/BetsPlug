"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { ArrowRight } from "lucide-react";

interface RelatedLink {
  label: string;
  href: string;
  description: string;
  icon: React.ElementType;
}

interface RelatedLinksProps {
  title?: string;
  links: RelatedLink[];
}

export function RelatedLinks({ title, links }: RelatedLinksProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-bold text-slate-100 mb-3">
        {title ?? t("related.title")}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ label, href, description, icon: Icon }) => (
          <Link
            key={href}
            href={lHref(href)}
            className="group flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 transition-all hover:bg-white/[0.06] hover:border-emerald-500/20"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Icon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                {label}
                <ArrowRight className="h-3 w-3 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
