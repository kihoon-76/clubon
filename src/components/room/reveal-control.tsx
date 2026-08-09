"use client";

import { useTransition } from "react";
import { Eye, EyeOff, ShieldAlert, Users } from "lucide-react";

import {
  remask,
  requestReveal,
  respondReveal,
} from "@/app/(club)/room/[sessionId]/actions";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n/types";
import type { RoomRevealView } from "@/lib/runtime/view";

/**
 * 방 전체의 얼굴 공개 합의 패널.
 *
 * 공개는 참가자 개인끼리가 아니라 **양쪽 라운지의 방장**이 결정합니다.
 * 한쪽 방장이 제안하고 반대쪽 방장이 수락하면 방 전체의 마스크가 한꺼번에
 * 벗겨지며, 어느 방장이든 되돌리면 전원 즉시 마스크로 복귀합니다.
 * 방장이 아닌 참가자에게는 현재 상태만 보이고 조작 버튼은 없습니다.
 */
export function RevealControl({
  sessionId,
  reveal,
  disabled,
  onChanged,
}: {
  sessionId: string;
  reveal: RoomRevealView;
  disabled: boolean;
  onChanged: () => void;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const busy = pending || disabled;

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      onChanged();
    });

  const revealed = reveal.state === "REVEALED";

  return (
    <section
      className={`rounded-[var(--radius-card)] border p-4 ${
        revealed
          ? "border-champagne-dim bg-champagne/5"
          : "border-line bg-surface-raised"
      }`}
      aria-label={t("room.revealLabel")}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {revealed ? (
          <Eye aria-hidden className="size-4 shrink-0 text-champagne" />
        ) : (
          <EyeOff aria-hidden className="size-4 shrink-0 text-muted" />
        )}
        <p className="text-sm break-keep text-ivory">{headline(t, reveal)}</p>

        <div className="ml-auto flex flex-wrap gap-2">
          {reveal.canDecide && reveal.awaitingMyResponse ? (
            <>
              <Button
                type="button"
                disabled={busy}
                onClick={() => run(() => respondReveal(sessionId, true))}
              >
                <Eye aria-hidden className="size-4" />
                {t("room.revealAccept")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => run(() => respondReveal(sessionId, false))}
              >
                {t("room.revealDecline")}
              </Button>
            </>
          ) : null}

          {reveal.canDecide && revealed ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => remask(sessionId))}
            >
              <EyeOff aria-hidden className="size-4" />
              {t("room.remask")}
            </Button>
          ) : null}

          {reveal.canDecide &&
          !revealed &&
          !reveal.awaitingMyResponse &&
          !reveal.awaitingOtherResponse ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => requestReveal(sessionId))}
            >
              <Eye aria-hidden className="size-4" />
              {t("room.proposeReveal")}
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs break-keep text-faint">
        {reveal.canDecide ? (
          <>
            <Users aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>{t("room.revealHostNote")}</span>
          </>
        ) : (
          <>
            <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>{t("room.revealGuestNote")}</span>
          </>
        )}
      </p>
    </section>
  );
}

function headline(t: Translate, reveal: RoomRevealView): string {
  switch (reveal.state) {
    case "REVEALED":
      return t("room.revealHeadRevealed");
    case "REVEAL_REQUESTED":
      if (reveal.awaitingMyResponse) {
        return t("room.revealHeadAsked", {
          name: reveal.requesterName ?? t("room.otherLounge"),
        });
      }
      if (reveal.awaitingOtherResponse) {
        return t("room.revealHeadWaiting");
      }
      return t("room.revealHeadDiscussing");
    case "REVEAL_CANCELLED":
      return t("room.revealHeadCancelled");
    case "REMASKED":
      return t("room.revealHeadRemasked");
    default:
      return t("room.revealHeadMasked");
  }
}
