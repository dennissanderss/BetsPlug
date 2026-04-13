import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface GetStartedButtonProps {
  children?: ReactNode;
  className?: string;
}

export function GetStartedButton({ children = "Get Started", className }: GetStartedButtonProps) {
  return (
    <Button variant="glow" size="lg" className={className}>
      {children}
      <ArrowRight className="ml-1.5 h-4 w-4" />
    </Button>
  );
}
