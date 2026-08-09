"use client";

import { useActionState } from "react";

import {
  submitFeedback,
  type FeedbackFormState,
} from "@/app/(club)/room/[sessionId]/actions";
import { Field, Fieldset, FormError, PillOption, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

/**
 * 분위기 선택지 — 값은 저장되므로 한국어 그대로 두고, 표기만 사전에서 찾습니다
 * (관심사·신고 사유와 같은 규칙).
 */
const VIBES: { value: string; key: string }[] = [
  { value: "편안했어요", key: "feedback.vibeRelaxed" },
  { value: "즐거웠어요", key: "feedback.vibeFun" },
  { value: "깊이 있었어요", key: "feedback.vibeDeep" },
  { value: "아쉬웠어요", key: "feedback.vibeDisappointing" },
];

export function FeedbackForm({ sessionId }: { sessionId: string }) {
  const t = useT();
  const [state, formAction] = useActionState<FeedbackFormState, FormData>(
    submitFeedback,
    {},
  );

  return (
    <form action={formAction} className="space-y-7">
      <input type="hidden" name="sessionId" value={sessionId} />
      <FormError message={state.error} />

      <Fieldset legend={t("feedback.ratingLegend")}>
        <div className="flex flex-wrap gap-2.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <PillOption
              key={n}
              type="radio"
              name="rating"
              value={String(n)}
              label={t("feedback.ratingPoint", { n })}
              required={n === 1}
              defaultChecked={n === 4}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("feedback.vibeLegend")}>
        <div className="flex flex-wrap gap-2.5">
          {VIBES.map((v) => (
            <PillOption
              key={v.value}
              type="radio"
              name="vibe"
              value={v.value}
              label={t(v.key)}
            />
          ))}
        </div>
      </Fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4 transition-colors has-[:checked]:border-champagne-dim">
        <input
          type="checkbox"
          name="wouldRematch"
          defaultChecked
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-champagne)]"
        />
        <span className="text-sm leading-relaxed break-keep text-ivory">
          {t("feedback.rematch")}
        </span>
      </label>

      <Field label={t("feedback.comment")} htmlFor="comment">
        <Textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={500}
          placeholder={t("feedback.commentPlaceholder")}
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel={t("feedback.pending")}>
        {t("feedback.submit")}
      </SubmitButton>
    </form>
  );
}
