"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalizedHref } from "@/i18n/locale-provider";

export default function WeeklyReportPage() {
  const router = useRouter();
  const loc = useLocalizedHref();

  useEffect(() => {
    router.replace(loc("/results"));
  }, [router, loc]);

  return null;
}
