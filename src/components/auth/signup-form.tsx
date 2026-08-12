"use client";

import { useActionState } from "react";

import { signup, type AuthFormState } from "@/app/(auth)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";
import { latestEligibleBirthDate } from "@/lib/auth/age";

export function SignupForm() {
  const t = useT();
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    signup,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field label={t("auth.email")} htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field
        label={t("auth.password")}
        htmlFor="password"
        hint={t("auth.passwordHint")}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>

      <Field label={t("auth.passwordConfirm")} htmlFor="passwordConfirm">
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>

      <Field label={t("onboarding.birthYear")} htmlFor="birthDate" hint={t("onboarding.birthYearHint")}>
        <Input id="birthDate" name="birthDate" type="date" autoComplete="bday" required min="1900-01-01" max={latestEligibleBirthDate()} />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4 transition-colors has-[:checked]:border-champagne-dim">
        <input type="checkbox" name="adultCheck" required className="mt-0.5 size-4 shrink-0 accent-[var(--color-champagne)]" />
        <span className="text-sm leading-relaxed break-keep text-ivory">{t("onboarding.adultCheckbox")}</span>
      </label>

      {/* 성별은 매칭이 갈리는 기준이라 가입할 때 받습니다. 나중에 바꿀 수
          없으므로 그 사실을 미리 알립니다. */}
      <fieldset>
        <legend className="mb-2 block text-sm text-ivory">
          {t("auth.gender")}
        </legend>
        <div className="flex gap-2.5">
          {[
            { value: "female", label: t("auth.female") },
            { value: "male", label: t("auth.male") },
          ].map((o, i) => (
            <label
              key={o.value}
              className="flex-1 cursor-pointer select-none rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-3 text-center text-sm text-muted transition-colors has-[:checked]:border-champagne has-[:checked]:bg-champagne/10 has-[:checked]:text-champagne hover:border-champagne-dim/70"
            >
              <input
                type="radio"
                name="gender"
                value={o.value}
                required={i === 0}
                className="peer sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton
        className="w-full gold-glow"
        pendingLabel={t("auth.signupPending")}
      >
        {t("auth.signupSubmit")}
      </SubmitButton>
    </form>
  );
}
