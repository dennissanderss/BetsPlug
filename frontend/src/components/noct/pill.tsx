import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pill / DataChip / TrustScore — small rounded chips used for
 * date tabs, odds/scores, win/loss states and trust ratings.
 *
 * Pill        = fully rounded glass chip for text labels + filter tabs.
 * DataChip    = square-ish rounded chip for tabular numbers (odds).
 * TrustScore  = solid-green 10/10 style rating pill.
 */

type PillTone = "default" | "active" | "win" | "loss" | "draw" | "info" | "purple";

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  children?: React.ReactNode;
}

const TONE_CLASS: Record<PillTone, string> = {
  default: "pill",
  active: "pill pill-active",
  win: "pill pill-win",
  loss: "pill pill-loss",
  draw: "pill pill-draw",
  info: "pill pill-info",
  purple: "pill pill-purple",
};

export function Pill({ tone = "default", className, children, ...rest }: PillProps) {
  return (
    <span className={cn(TONE_CLASS[tone], className)} {...rest}>
      {children}
    </span>
  );
}

interface DataChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "win" | "loss";
  children?: React.ReactNode;
}
export function DataChip({ tone = "default", className, children, ...rest }: DataChipProps) {
  const toneClass =
    tone === "win" ? "pill-data-win" : tone === "loss" ? "pill-data-loss" : "";
  return (
    <span className={cn("pill-data", toneClass, className)} {...rest}>
      {children}
    </span>
  );
}

interface TrustScoreProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  max?: number;
}
export function TrustScore({ value, max = 10, className, ...rest }: TrustScoreProps) {
  return (
    <span className={cn("pill-trust", className)} {...rest}>
      {value}/{max}
    </span>
  );
}

export default Pill;
