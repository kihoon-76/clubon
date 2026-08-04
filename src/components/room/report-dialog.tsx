"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  reportParticipant,
  type ReportFormState,
} from "@/app/(club)/room/[sessionId]/actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { REPORT_CATEGORIES } from "@/lib/moderation/report-categories";
import type { RoomParticipantView } from "@/lib/runtime/view";

/**
 * 신고 모달. 네이티브 <dialog>를 써서 포커스 트랩·Esc 닫기·aria-modal을
 * 브라우저 기본 동작으로 확보합니다.
 */
export function ReportDialog({
  sessionId,
  target,
  onClose,
}: {
  sessionId: string;
  target: RoomParticipantView | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<ReportFormState, FormData>(
    reportParticipant,
    {},
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  useEffect(() => {
    if (state.done) onClose();
  }, [state.done, onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="report-title"
      className="w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-line bg-surface-overlay p-0 text-ivory backdrop:bg-ink/80 backdrop:backdrop-blur-sm"
    >
      {target ? (
        <form action={formAction} className="space-y-5 p-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="targetId" value={target.userId} />

          <div>
            <h2 id="report-title" className="font-display text-2xl">
              {target.nickname}님 신고
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              접수된 신고는 모더레이터가 검토합니다. 관련 대화 기록은 검토가
              끝날 때까지 보존됩니다.
            </p>
          </div>

          <FormError message={state.error} />

          <Field label="사유" htmlFor="report-category">
            <Select id="report-category" name="category" required defaultValue="">
              <option value="" disabled>
                사유를 선택하세요
              </option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="상세 설명 (선택)" htmlFor="report-description">
            <Textarea
              id="report-description"
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="어떤 일이 있었는지 알려주시면 검토에 도움이 됩니다."
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4">
            <input
              type="checkbox"
              name="block"
              defaultChecked
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-champagne)]"
            />
            <span className="text-sm leading-relaxed">
              이 회원을 차단합니다. 차단하면 상대의 메시지가 보이지 않고, 공개
              권한도 즉시 취소됩니다.
            </span>
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              취소
            </Button>
            <SubmitButton size="md" variant="danger" pendingLabel="접수 중…">
              신고 접수
            </SubmitButton>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
