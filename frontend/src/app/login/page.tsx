import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "./login-content";

export const metadata: Metadata = {
  title: "Log in - BetsPlug",
  description:
    "Log in to your BetsPlug account to see today's picks, track your ROI and manage your subscription.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060912]" />}>
      <LoginContent />
    </Suspense>
  );
}
