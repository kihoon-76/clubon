"use client";

import { useActionState } from "react";

import { saveConsents, type OnboardingFormState } from "@/app/(onboarding)/actions";
import { CONSENT_ITEMS } from "@/lib/consent/items";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ConsentForm({
  granted,
}: {
  /** 이미 동의한 항목 타입 — 재동의 시 기본값으로 채웁니다. */
  granted: string[];
}) {
  const [state, formAction] = useActionState<OnboardingFormState, FormData>(
    saveConsents,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <ul className="space-y-3">
        {CONSENT_ITEMS.map((item) => (
          <li key={item.type}>
            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4 transition-colors has-[:checked]:border-champagne-dim">
              <input
                type="checkbox"
                name={`consent:${item.type}`}
                required={item.required}
                defaultChecked={granted.includes(item.type)}
                className="mt-1 size-4 shrink-0 accent-[var(--color-champagne)]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ivory">{item.title}</span>
                  <Badge tone={item.required ? "gold" : "neutral"}>
                    {item.required ? "필수" : "선택"}
                  </Badge>
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                  {item.body}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton className="w-full" pendingLabel="저장 중…">
        동의하고 프로필 설정하기
      </SubmitButton>
    </form>
  );
}
