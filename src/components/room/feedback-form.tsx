"use client";

import { useActionState } from "react";

import {
  submitFeedback,
  type FeedbackFormState,
} from "@/app/(club)/room/[sessionId]/actions";
import { Field, Fieldset, FormError, PillOption, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const VIBES = ["편안했어요", "즐거웠어요", "깊이 있었어요", "아쉬웠어요"];

export function FeedbackForm({ sessionId }: { sessionId: string }) {
  const [state, formAction] = useActionState<FeedbackFormState, FormData>(
    submitFeedback,
    {},
  );

  return (
    <form action={formAction} className="space-y-7">
      <input type="hidden" name="sessionId" value={sessionId} />
      <FormError message={state.error} />

      <Fieldset legend="이번 자리는 어땠나요?">
        <div className="flex flex-wrap gap-2.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <PillOption
              key={n}
              type="radio"
              name="rating"
              value={String(n)}
              label={`${n}점`}
              required={n === 1}
              defaultChecked={n === 4}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="분위기 (선택)">
        <div className="flex flex-wrap gap-2.5">
          {VIBES.map((v) => (
            <PillOption key={v} type="radio" name="vibe" value={v} label={v} />
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
        <span className="text-sm leading-relaxed text-ivory">
          이 라운지와 다시 만나고 싶어요.
        </span>
      </label>

      <Field label="남기고 싶은 말 (선택)" htmlFor="comment">
        <Textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={500}
          placeholder="운영에 참고할 의견을 남겨주세요."
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="보내는 중…">
        피드백 보내기
      </SubmitButton>
    </form>
  );
}
