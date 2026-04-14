import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#4ade80] text-[#050505] hover:bg-[#86efac]",
        destructive: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
        outline: "border border-[#4ade80] bg-transparent text-[#4ade80] hover:bg-[#4ade80] hover:text-[#050505]",
        secondary: "border border-white/10 bg-[#0e0e0e] text-[#ededed] hover:border-[#4ade80]/50 hover:text-white",
        ghost: "text-[#ededed] hover:bg-white/[0.05]",
        link: "text-[#4ade80] underline-offset-4 hover:underline normal-case font-bold tracking-normal",
        glow: "bg-[#4ade80] text-[#050505] font-black shadow-[0_8px_24px_rgba(74,222,128,0.3)] hover:bg-[#86efac] hover:shadow-[0_10px_32px_rgba(74,222,128,0.45)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
