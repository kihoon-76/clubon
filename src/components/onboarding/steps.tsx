import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
  { key: "adult", label: "성인 확인" },
  { key: "consent", label: "동의" },
  { key: "profile", label: "프로필" },
] as const;

export type OnboardingStep = (typeof STEPS)[number]["key"];

/** 온보딩 3단계 진행 표시. 색상 외에 체크 아이콘·텍스트로도 상태를 전달합니다. */
export function OnboardingSteps({ current }: { current: OnboardingStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-2" aria-label="입장 준비 단계">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.6875rem]",
                done && "border-success/50 bg-success-dim text-success",
                active && "border-champagne bg-champagne/10 text-champagne",
                !done && !active && "border-line text-faint",
              )}
            >
              {done ? <Check aria-hidden className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs",
                active ? "text-ivory" : "text-faint",
              )}
            >
              {step.label}
              {done ? <span className="sr-only"> (완료)</span> : null}
            </span>
            {i < STEPS.length - 1 ? (
              <span aria-hidden className="h-px flex-1 bg-line" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
