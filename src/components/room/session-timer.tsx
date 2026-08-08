"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Ticket } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomUsageView } from "@/lib/runtime/view";

/**
 * 30분 이용권 잔여 시간.
 *
 * 남은 시간은 **서버가 저장한 `expiresAt`**에서만 계산합니다. 클라이언트는
 * 1초마다 "지금 시각과의 차이"를 다시 구할 뿐, 자체 카운터를 누적하지 않습니다.
 * 그래서 새로고침하거나 다른 기기에서 접속해도 시간이 되감기지 않습니다.
 *
 * 만료가 되면 `onExpire`로 알려 룸 쪽에서 영상 연결을 끊게 합니다.
 */

/** 남은 시간이 이 값 아래로 내려가면 경고 단계로 넘어갑니다(분). */
const WARN_MINUTES = [5, 1];

function remainingMs(expiresAt: string): number {
  return Math.max(0, Date.parse(expiresAt) - Date.now());
}

function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionTimer({
  usage,
  remainingPasses,
  onExpire,
}: {
  usage: RoomUsageView | null;
  remainingPasses: number;
  onExpire: () => void;
}) {
  // 이용권은 방 하나당 1회이고 방을 연 회원이 부담합니다. 무료로 참여한
  // 사람에게 "이용권을 구매하세요"라고 하면 잘못된 안내가 됩니다.
  const paidByMe = usage?.paidByMe ?? false;
  const expiresAt = usage?.expiresAt ?? null;
  const [left, setLeft] = useState(() =>
    expiresAt ? remainingMs(expiresAt) : 0,
  );

  useEffect(() => {
    if (!expiresAt) return;

    // 서버 시각 기준으로 매초 다시 계산합니다(누적 카운터가 아닙니다).
    const tick = () => setLeft(remainingMs(expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // 만료 통지는 렌더 중이 아니라 효과에서 한 번만 보냅니다.
  const expired = Boolean(expiresAt) && left <= 0;
  useEffect(() => {
    if (expired) onExpire();
  }, [expired, onExpire]);

  // 아직 영상에 입장하지 않았으면 표시할 것이 없습니다.
  if (!expiresAt) return null;

  if (expired) {
    return (
      <section
        role="status"
        aria-live="assertive"
        className="rounded-[var(--radius-card)] border border-warn/50 bg-warn-dim/40 p-4"
      >
        <p className="flex items-center gap-2 text-sm text-ivory">
          <AlertTriangle aria-hidden className="size-4 shrink-0 text-warn" />
          30분 이용권이 모두 사용되어 영상 연결이 종료되었습니다.
        </p>
        <p className="mt-2 text-xs leading-relaxed break-keep text-muted">
          {!paidByMe
            ? "이 자리는 방을 연 회원의 이용권으로 진행되었습니다. 새 자리를 열려면 이용권이 필요합니다."
            : remainingPasses > 0
              ? `남은 이용권이 ${remainingPasses}회 있습니다. 새 라운지를 열면 다음 30분이 시작됩니다.`
              : "이용권을 추가로 구매하면 다시 라운지를 열 수 있습니다."}
        </p>
        <div className="mt-4">
          <ButtonLink href="/membership" size="sm">
            <Ticket aria-hidden className="size-4" />
            이용권 구매
          </ButtonLink>
        </div>
      </section>
    );
  }

  const minutesLeft = left / 60_000;
  const warnLevel = WARN_MINUTES.find((m) => minutesLeft <= m) ?? null;

  return (
    <section
      aria-label="라운지 남은 시간"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[var(--radius-control)] border px-4 py-3",
        warnLevel === 1
          ? "border-danger/50 bg-danger-dim/40"
          : warnLevel === 5
            ? "border-warn/50 bg-warn-dim/40"
            : "border-line bg-surface-raised",
      )}
    >
      <Clock
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          warnLevel === 1
            ? "text-danger"
            : warnLevel === 5
              ? "text-warn"
              : "text-champagne",
        )}
      />
      <p className="text-sm text-ivory">
        남은 시간{" "}
        <span
          className="font-mono tabular-nums"
          // 매초 낭독되지 않도록, 경고 단계에서만 알립니다.
          aria-live={warnLevel ? "polite" : "off"}
        >
          {formatRemaining(left)}
        </span>
      </p>
      {warnLevel ? (
        <p className="text-xs break-keep text-muted">
          {warnLevel === 1
            ? "1분 뒤 영상 연결이 종료됩니다."
            : "5분 뒤 영상 연결이 종료됩니다."}
        </p>
      ) : null}
    </section>
  );
}
