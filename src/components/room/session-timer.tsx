"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Ticket } from "lucide-react";

import { ExtendControl } from "@/components/room/extend-control";
import { ButtonLink } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { LOUNGE_MINUTES } from "@/lib/payments/catalog";
import { cn } from "@/lib/utils";
import type { RoomExtensionView, RoomUsageView } from "@/lib/runtime/view";

/**
 * 이 방의 남은 시간.
 *
 * 남은 시간은 **서버가 저장한 `expiresAt`**에서만 계산합니다. 클라이언트는
 * 1초마다 "지금 시각과의 차이"를 다시 구할 뿐, 자체 카운터를 누적하지 않습니다.
 * 그래서 새로고침하거나 다른 기기에서 접속해도 시간이 되감기지 않습니다.
 *
 * 만료가 되면 `onExpire`로 알려 룸 쪽에서 영상 연결을 끊게 합니다.
 *
 * 연장 상품은 시간이 얼마 남지 않았을 때와 이미 끝났을 때만 꺼냅니다. 30분
 * 내내 결제 버튼을 띄워 두지 않습니다.
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
  sessionId,
  usage,
  remainingMatches,
  extensions,
  onExpire,
}: {
  sessionId: string;
  usage: RoomUsageView | null;
  /** 내 남은 방 매치 횟수 */
  remainingMatches: number;
  /** 지금 내가 살 수 있는 연장 상품 (없으면 연장 UI를 띄우지 않습니다) */
  extensions: RoomExtensionView[];
  /**
   * 시간이 다 됐음을 알립니다. 끝난 **만료 시각**을 함께 넘겨, 연장으로 시각이
   * 뒤로 밀리면 룸이 다시 이어 붙일 수 있게 합니다.
   */
  onExpire: (expiresAt: string) => void;
}) {
  const t = useT();
  const extendedMinutes = usage?.extendedMinutes ?? 0;
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
    if (expired && expiresAt) onExpire(expiresAt);
  }, [expired, expiresAt, onExpire]);

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
          {t("room.timeUp", { minutes: LOUNGE_MINUTES })}
        </p>
        <p className="mt-2 text-xs leading-relaxed break-keep text-muted">
          {remainingMatches > 0
            ? t("room.timeUpHasMatches", {
                count: remainingMatches,
                minutes: LOUNGE_MINUTES,
              })
            : t("room.timeUpNoMatches")}
        </p>
        {/* 연장은 아직 아무도 방을 닫지 않았다면 끝난 뒤에도 살 수 있습니다.
            산 시간은 결제가 확인된 시점부터 다시 흐릅니다. */}
        <ExtendControl sessionId={sessionId} options={extensions} />
        <div className="mt-4">
          <ButtonLink href="/entry" size="sm">
            <Ticket aria-hidden className="size-4" />
            {remainingMatches > 0
              ? t("room.newSeat")
              : t("room.topUpMatches")}
          </ButtonLink>
        </div>
      </section>
    );
  }

  const minutesLeft = left / 60_000;
  const warnLevel = WARN_MINUTES.find((m) => minutesLeft <= m) ?? null;

  return (
    <section
      aria-label={t("room.timerLabel")}
      className={cn(
        "rounded-[var(--radius-control)] border px-4 py-3",
        warnLevel === 1
          ? "border-danger/50 bg-danger-dim/40"
          : warnLevel === 5
            ? "border-warn/50 bg-warn-dim/40"
            : "border-line bg-surface-raised",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
          {t("room.timeLeft")}{" "}
          <span
            className="font-mono tabular-nums"
            // 매초 낭독되지 않도록, 경고 단계에서만 알립니다.
            aria-live={warnLevel ? "polite" : "off"}
          >
            {formatRemaining(left)}
          </span>
        </p>
        {extendedMinutes > 0 ? (
          <p className="text-xs text-champagne-dim">
            {t("room.extendedApplied", { minutes: extendedMinutes })}
          </p>
        ) : null}
        {warnLevel ? (
          <p className="text-xs break-keep text-muted">
            {warnLevel === 1 ? t("room.warn1") : t("room.warn5")}
          </p>
        ) : null}
      </div>

      {/* 아직 여유가 있을 때는 결제 버튼을 띄우지 않습니다. */}
      {warnLevel ? (
        <ExtendControl sessionId={sessionId} options={extensions} />
      ) : null}
    </section>
  );
}
