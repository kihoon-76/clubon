"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  reportParticipant,
  type ReportFormState,
} from "@/app/(club)/room/[sessionId]/actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";
import {
  REPORT_CATEGORIES,
  reportCategoryLabel,
} from "@/lib/moderation/report-categories";
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
  const t = useT();
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
              {t("room.reportTitle", { nickname: target.nickname })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed break-keep text-muted">
              {t("room.reportIntro")}
            </p>
          </div>

          <FormError message={state.error} />

          <Field label={t("room.reportReason")} htmlFor="report-category">
            <Select id="report-category" name="category" required defaultValue="">
              <option value="" disabled>
                {t("room.reportReasonPlaceholder")}
              </option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {reportCategoryLabel(t, c)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("room.reportDetail")} htmlFor="report-description">
            <Textarea
              id="report-description"
              name="description"
              rows={4}
              maxLength={1000}
              placeholder={t("room.reportDetailPlaceholder")}
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-4">
            <input
              type="checkbox"
              name="block"
              defaultChecked
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-champagne)]"
            />
            <span className="text-sm leading-relaxed break-keep">
              {t("room.reportBlockToo")}
            </span>
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              {t("room.reportCancel")}
            </Button>
            <SubmitButton
              size="md"
              variant="danger"
              pendingLabel={t("room.reportPending")}
            >
              {t("room.reportSubmit")}
            </SubmitButton>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
