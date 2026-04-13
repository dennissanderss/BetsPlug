"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalizedHref } from "@/i18n/locale-provider";

export default function YourRoutePage() {
  const router = useRouter();
  const loc = useLocalizedHref();

  useEffect(() => {
    router.replace(loc("/dashboard"));
  }, [router, loc]);

  return null;
}
