import type { Metadata } from "next";
import { TrackRecordContent } from "./track-record-content";

/* ── Per-page SEO metadata ─────────────────────────────────────
   The track-record page is one of BetsPlug's highest-trust
   entry points, so it gets its own rich metadata — distinct
   title, description and canonical URL.                         */
export const metadata: Metadata = {
  title:
    "Track Record - Verified BetsPlug prediction performance",
  description:
    "Transparent, auditable results for every BetsPlug pick. See how our AI models turn raw match data into a measurable edge - documented weekly, never cherry-picked.",
  alternates: {
    canonical: "/track-record",
  },
  openGraph: {
    title: "BetsPlug Track Record - auditable, never cherry-picked",
    description:
      "58.3% hit rate. +14.6% ROI. 24,180 graded predictions. Every pick timestamped and logged to a public ledger.",
    type: "website",
  },
};

export default function TrackRecordPage() {
  return <TrackRecordContent />;
}
