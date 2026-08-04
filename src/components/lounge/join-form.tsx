"use client";

import { useActionState } from "react";

import { joinByCode, type LoungeFormState } from "@/app/(club)/lounges/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function JoinForm() {
  const [state, formAction] = useActionState<LoungeFormState, FormData>(
    joinByCode,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="초대코드"
        htmlFor="code"
        hint="라운지 호스트에게 받은 6자리 코드를 입력하세요."
      >
        <Input
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={10}
          placeholder="예: JAZZ42"
          className="text-center font-mono text-lg tracking-[0.3em] uppercase"
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="확인 중…">
        라운지 합류하기
      </SubmitButton>
    </form>
  );
}
