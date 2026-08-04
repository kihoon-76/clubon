"use client";

import { useActionState } from "react";

import { confirmAdult, type OnboardingFormState } from "@/app/(onboarding)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function AdultCheckForm() {
  const [state, formAction] = useActionState<OnboardingFormState, FormData>(
    confirmAdult,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <Field
        label="출생 연도"
        htmlFor="birthYear"
        hint="연 단위만 확인하며, 생년월일 원본이나 신분증 이미지는 저장하지 않습니다."
      >
        <Input
          id="birthYear"
          name="birthYear"
          type="number"
          inputMode="numeric"
          required
          min={1900}
          max={new Date().getFullYear()}
          placeholder="예: 1994"
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4 transition-colors has-[:checked]:border-champagne-dim">
        <input
          type="checkbox"
          name="adultCheck"
          required
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-champagne)]"
        />
        <span className="text-sm leading-relaxed text-ivory">
          만 19세 이상이며, ClubOn이 성인 전용 서비스임을 이해했습니다.
        </span>
      </label>

      <SubmitButton className="w-full" pendingLabel="확인 중…">
        확인하고 다음 단계로
      </SubmitButton>
    </form>
  );
}
