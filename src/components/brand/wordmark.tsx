import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.15em]", className)}>
      <span className="font-display text-[1.375rem] leading-none tracking-[0.02em] text-ivory">
        Club
      </span>
      <span className="font-display text-[1.375rem] leading-none tracking-[0.02em] text-champagne">
        On
      </span>
    </span>
  );
}
