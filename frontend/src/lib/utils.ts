import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case "W":
      return "text-green-500";
    case "D":
      return "text-yellow-500";
    case "L":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "finished":
    case "completed":
    case "healthy":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "live":
    case "running":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "scheduled":
    case "pending":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    case "failed":
    case "degraded":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
