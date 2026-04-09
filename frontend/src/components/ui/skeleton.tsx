import { cn } from "@/lib/utils";

/*
 * Skeleton — loading placeholder.
 *
 * Deliberately keeps a pulse (the whole point of a skeleton is to
 * communicate "content is loading") but uses the slower 3s
 * `animate-pulse-slow` utility from globals.css instead of the 2s
 * Tailwind default. Same visual meaning, ~33 % fewer opacity frames
 * across the board when many skeletons render at once.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse-slow rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
