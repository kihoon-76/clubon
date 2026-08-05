"use client";

import { useTransition } from "react";
import { Ban, Crown, Eye, Flag, Mic, MicOff } from "lucide-react";

import { blockParticipant } from "@/app/(club)/room/[sessionId]/actions";
import { LocalCamera } from "@/components/room/local-camera";
import { MASK_LABEL, MaskAvatar, RevealedAvatar } from "@/components/room/mask-avatar";
import { Badge } from "@/components/ui/badge";
import type { RoomParticipantView } from "@/lib/runtime/view";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<RoomParticipantView["status"], string | null> = {
  ok: null,
  warned: "경고",
  restricted: "영상 제한",
  muted: "음소거 조치",
  removed: "퇴장 조치",
};

export function ParticipantTile({
  sessionId,
  participant,
  onReport,
}: {
  sessionId: string;
  participant: RoomParticipantView;
  onReport: (target: RoomParticipantView) => void;
}) {
  const [pending, startTransition] = useTransition();
  const p = participant;
  // 공개 여부는 방장끼리의 합의로 방 전체에 한꺼번에 적용됩니다(뷰에서 계산).
  const revealed = p.revealed;
  const statusLabel = STATUS_LABEL[p.status];

  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border bg-surface-raised",
        revealed ? "border-champagne-dim" : "border-line",
        !p.present && "opacity-45",
      )}
    >
      {/* 영상 영역 */}
      <div className="relative aspect-4/3 bg-ink">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {p.isMe ? (
            p.camOn ? (
              <LocalCamera enabled={p.camOn} />
            ) : (
              <MaskAvatar mask={p.mask} className="max-w-32" />
            )
          ) : revealed ? (
            <RevealedAvatar nickname={p.nickname} className="max-w-28" />
          ) : (
            <MaskAvatar
              mask={p.mask}
              className="max-w-32"
              dimmed={p.videoState === "blurred" || !p.camOn}
            />
          )}
        </div>

        {/* 동적 워터마크 — 캡처 억제 표시 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-2 select-none text-center text-[0.5rem] tracking-[0.2em] text-ivory/15"
        >
          CLUBON · {sessionId.slice(0, 8)} · {p.userId.slice(0, 8)}
        </span>

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.isMe ? <Badge tone="gold">나</Badge> : null}
          {p.isRoomHost ? (
            <Badge tone="gold">
              <Crown aria-hidden className="size-3" />
              방장
            </Badge>
          ) : null}
          {revealed ? (
            <Badge tone="success">
              <Eye aria-hidden className="size-3" />
              공개됨
            </Badge>
          ) : null}
          {statusLabel ? <Badge tone="danger">{statusLabel}</Badge> : null}
          {p.simulated ? <Badge tone="warn">데모</Badge> : null}
        </div>

        {p.videoState === "blurred" ? (
          <p className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-[var(--radius-control)] bg-ink/80 px-3 py-2 text-center text-xs text-ivory">
            모더레이션 조치로 영상이 흐리게 표시됩니다.
          </p>
        ) : null}
      </div>

      {/* 정보 · 조작 */}
      <div className="space-y-3 border-t border-line/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-ivory">{p.nickname}</span>
            <span className="shrink-0 text-[0.6875rem] text-faint">
              {MASK_LABEL[p.mask]}
            </span>
          </span>
          {p.micOn ? (
            <Mic aria-label="마이크 켜짐" className="size-4 shrink-0 text-success" />
          ) : (
            <MicOff aria-label="마이크 꺼짐" className="size-4 shrink-0 text-faint" />
          )}
        </div>

        {p.isMe ? null : p.blockedByMe ? (
          <p className="text-xs text-faint">차단한 참가자입니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <TileButton pending={pending} onClick={() => onReport(p)} tone="danger">
              <Flag aria-hidden className="size-3.5" />
              신고
            </TileButton>
            <TileButton
              pending={pending}
              tone="danger"
              onClick={() =>
                startTransition(async () => {
                  await blockParticipant(sessionId, p.userId);
                })
              }
            >
              <Ban aria-hidden className="size-3.5" />
              차단
            </TileButton>
          </div>
        )}

      </div>
    </li>
  );
}

function TileButton({
  children,
  onClick,
  pending,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending: boolean;
  tone?: "neutral" | "accent" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-45",
        tone === "accent" && "border-champagne text-champagne hover:bg-champagne/10",
        tone === "danger" && "border-line text-muted hover:border-danger/50 hover:text-danger",
        tone === "neutral" && "border-line text-muted hover:border-champagne-dim hover:text-ivory",
      )}
    >
      {children}
    </button>
  );
}
