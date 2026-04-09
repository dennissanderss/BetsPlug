import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutContent } from "./checkout-content";

export const metadata: Metadata = {
  title: "Checkout — Start your BetsPlug subscription",
  description:
    "Complete your BetsPlug subscription in three quick steps. 14-day money-back guarantee, SSL-encrypted checkout, cancel any time.",
  alternates: {
    canonical: "/checkout",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060912]" />}>
      <CheckoutContent />
    </Suspense>
  );
}
