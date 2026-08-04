"use client";

import { useActionState } from "react";

import { signup, type AuthFormState } from "@/app/(auth)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignupForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    signup,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field label="이메일" htmlFor="email">
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
        label="비밀번호"
        htmlFor="password"
        hint="8자 이상. 다른 서비스와 다른 비밀번호를 사용하세요."
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

      <Field label="비밀번호 확인" htmlFor="passwordConfirm">
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>

      <SubmitButton className="w-full gold-glow" pendingLabel="가입 중…">
        가입하고 성인 확인하기
      </SubmitButton>
    </form>
  );
}
