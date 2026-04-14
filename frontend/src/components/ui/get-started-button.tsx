import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps {
  children?: ReactNode;
  className?: string;
}

export function GetStartedButton({ children = "GET STARTED", className }: GetStartedButtonProps) {
  const text = typeof children === "string" ? children.toUpperCase() : children;
  return (
    <span className={cn("btn-lime", className)}>
      {text}
      <span aria-hidden className="ml-1">→</span>
    </span>
  );
}
