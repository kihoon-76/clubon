"use client";

import { useActionState, useState } from "react";

import { saveConsents, type OnboardingFormState } from "@/app/(onboarding)/actions";
import { CONSENT_ITEMS, consentBody, consentTitle } from "@/lib/consent/items";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function ConsentForm({
  granted,
}: {
  /** 이미 동의한 항목 타입 — 재동의 시 기본값으로 채웁니다. */
  granted: string[];
}) {
  const t = useT();
  const [state, formAction] = useActionState<OnboardingFormState, FormData>(
    saveConsents,
    {},
  );
  const [checkedConsents, setCheckedConsents] = useState(
    () => new Set(granted),
  );
  const allChecked = CONSENT_ITEMS.every((item) =>
    checkedConsents.has(item.type),
  );

  function toggleAll(checked: boolean) {
    setCheckedConsents(
      checked ? new Set(CONSENT_ITEMS.map((item) => item.type)) : new Set(),
    );
  }

  function toggleConsent(type: (typeof CONSENT_ITEMS)[number]["type"], checked: boolean) {
    setCheckedConsents((current) => {
      const next = new Set(current);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-champagne-dim bg-surface-raised p-4">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(event) => toggleAll(event.target.checked)}
          className="size-4 shrink-0 accent-[var(--color-champagne)]"
        />
        <span className="text-sm font-medium text-ivory">
          {t("onboarding.consentAll")}
        </span>
      </label>

      <ul className="space-y-3">
        {CONSENT_ITEMS.map((item) => (
          <li key={item.type}>
            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4 transition-colors has-[:checked]:border-champagne-dim">
              <input
                type="checkbox"
                name={`consent:${item.type}`}
                required={item.required}
                checked={checkedConsents.has(item.type)}
                onChange={(event) =>
                  toggleConsent(item.type, event.target.checked)
                }
                className="mt-1 size-4 shrink-0 accent-[var(--color-champagne)]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ivory">
                    {consentTitle(t, item.type)}
                  </span>
                  <Badge tone={item.required ? "gold" : "neutral"}>
                    {item.required
                      ? t("onboarding.required")
                      : t("onboarding.optional")}
                  </Badge>
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed break-keep text-muted">
                  {consentBody(t, item.type)}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton
        className="w-full"
        pendingLabel={t("onboarding.consentPending")}
      >
        {t("onboarding.consentSubmit")}
      </SubmitButton>
    </form>
  );
}
