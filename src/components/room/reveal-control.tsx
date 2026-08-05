"use client";

import { useTransition } from "react";
import { Eye, EyeOff, ShieldAlert, Users } from "lucide-react";

import {
  remask,
  requestReveal,
  respondReveal,
} from "@/app/(club)/room/[sessionId]/actions";
import { Button } from "@/components/ui/button";
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
      aria-label="얼굴 공개"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {revealed ? (
          <Eye aria-hidden className="size-4 shrink-0 text-champagne" />
        ) : (
          <EyeOff aria-hidden className="size-4 shrink-0 text-muted" />
        )}
        <p className="text-sm text-ivory">{headline(reveal)}</p>

        <div className="ml-auto flex flex-wrap gap-2">
          {reveal.canDecide && reveal.awaitingMyResponse ? (
            <>
              <Button
                type="button"
                disabled={busy}
                onClick={() => run(() => respondReveal(sessionId, true))}
              >
                <Eye aria-hidden className="size-4" />
                수락 · 전원 공개
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => run(() => respondReveal(sessionId, false))}
              >
                거절
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
              다시 마스크
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
              상대 방장에게 공개 제안
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-faint">
        {reveal.canDecide ? (
          <>
            <Users aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              방장인 두 분이 모두 수락해야 공개되며, 공개는 방에 있는 모든
              참가자에게 함께 적용됩니다.
            </span>
          </>
        ) : (
          <>
            <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              얼굴 공개는 양쪽 라운지의 방장이 결정합니다. 공개 후에도 내가
              차단한 상대는 계속 마스크로 보입니다.
            </span>
          </>
        )}
      </p>
    </section>
  );
}

function headline(reveal: RoomRevealView): string {
  switch (reveal.state) {
    case "REVEALED":
      return "양쪽 방장이 수락해 방 전체가 얼굴을 공개했습니다.";
    case "REVEAL_REQUESTED":
      if (reveal.awaitingMyResponse) {
        return `${reveal.requesterName ?? "상대 라운지"} 방장이 얼굴 공개를 제안했습니다.`;
      }
      if (reveal.awaitingOtherResponse) {
        return "상대 라운지 방장의 응답을 기다리는 중입니다.";
      }
      return "두 방장이 얼굴 공개를 논의하고 있습니다.";
    case "REVEAL_CANCELLED":
      return "이번에는 공개하지 않기로 했습니다. 모두 마스크 상태입니다.";
    case "REMASKED":
      return "다시 마스크 상태로 돌아왔습니다.";
    default:
      return "모든 참가자가 마스크를 쓰고 있습니다.";
  }
}
