import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "BetsPlug - AI-Powered Sports Analytics",
  description: "Premium AI-powered sports analytics. Data-driven predictions, live match tracking, and deep performance insights.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
