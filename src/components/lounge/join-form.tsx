"use client";

import { useActionState } from "react";

import { joinByCode, type LoungeFormState } from "@/app/(club)/lounges/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function JoinForm() {
  const t = useT();
  const [state, formAction] = useActionState<LoungeFormState, FormData>(
    joinByCode,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label={t("lounge.inviteCode")}
        htmlFor="code"
        hint={t("join.codeHint")}
      >
        <Input
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={10}
          placeholder={t("join.codePlaceholder")}
          className="text-center font-mono text-lg tracking-[0.3em] uppercase"
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel={t("join.pending")}>
        {t("join.submit")}
      </SubmitButton>
    </form>
  );
}
