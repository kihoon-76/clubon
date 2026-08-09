"use client";

import { useActionState } from "react";

import { confirmAdult, type OnboardingFormState } from "@/app/(onboarding)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function AdultCheckForm() {
  const t = useT();
  const [state, formAction] = useActionState<OnboardingFormState, FormData>(
    confirmAdult,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <Field
        label={t("onboarding.birthYear")}
        htmlFor="birthYear"
        hint={t("onboarding.birthYearHint")}
      >
        <Input
          id="birthYear"
          name="birthYear"
          type="number"
          inputMode="numeric"
          required
          min={1900}
          max={new Date().getFullYear()}
          placeholder={t("onboarding.birthYearPlaceholder")}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4 transition-colors has-[:checked]:border-champagne-dim">
        <input
          type="checkbox"
          name="adultCheck"
          required
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-champagne)]"
        />
        <span className="text-sm leading-relaxed break-keep text-ivory">
          {t("onboarding.adultCheckbox")}
        </span>
      </label>

      <SubmitButton className="w-full" pendingLabel={t("onboarding.adultPending")}>
        {t("onboarding.adultSubmit")}
      </SubmitButton>
    </form>
  );
}
