import type { Metadata } from "next";
import { Suspense } from "react";
import { WelcomeContent } from "./welcome-content";

export const metadata: Metadata = {
  title: "Welcome aboard — You're officially a BetsPlug member",
  description:
    "Your BetsPlug membership is active. Log in to see today's picks, track your ROI and start winning smarter — we've got your back.",
  alternates: {
    canonical: "/welcome",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060912]" />}>
      <WelcomeContent />
    </Suspense>
  );
}
