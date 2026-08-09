"use client";

import { useActionState } from "react";

import { login, type AuthFormState } from "@/app/(auth)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, formAction] = useActionState<AuthFormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormError message={state.error} />

      <Field label={t("auth.email")} htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("auth.emailPlaceholder")}
        />
      </Field>

      <Field label={t("auth.password")} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder={t("auth.passwordPlaceholder")}
        />
      </Field>

      <SubmitButton
        className="w-full gold-glow"
        pendingLabel={t("auth.loginPending")}
      >
        {t("auth.loginSubmit")}
      </SubmitButton>
    </form>
  );
}
