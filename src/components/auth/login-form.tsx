"use client";

import { useActionState } from "react";

import { login, type AuthFormState } from "@/app/(auth)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
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

      <Field label="비밀번호" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="8자 이상"
        />
      </Field>

      <SubmitButton className="w-full gold-glow" pendingLabel="입장 중…">
        입장하기
      </SubmitButton>
    </form>
  );
}
