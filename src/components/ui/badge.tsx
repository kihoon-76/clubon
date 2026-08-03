import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "gold" | "silver" | "success" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line text-muted",
  gold: "border-champagne-dim text-champagne",
  silver: "border-line-strong text-silver",
  success: "border-success/40 text-success bg-success-dim",
  warn: "border-warn/40 text-warn bg-warn-dim",
  danger: "border-danger/40 text-danger bg-danger-dim",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentPropsWithoutRef<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * 외부 서비스가 아직 연결되지 않은 모의 기능임을 명시적으로 표시합니다.
 * 기획 요구사항: "모의 기능은 명확히 라벨링할 것".
 */
export function MockBadge({ className }: { className?: string }) {
  return (
    <Badge
      tone="warn"
      className={className}
      title="이 기능은 데모용 모의 구현입니다. 실제 외부 서비스는 아직 연결되지 않았습니다."
    >
      모의 기능
    </Badge>
  );
}
