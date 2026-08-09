"use client";

import { useTransition } from "react";
import { Ban, Crown, Eye, Flag, Mic, MicOff } from "lucide-react";

import { blockParticipant } from "@/app/(club)/room/[sessionId]/actions";
import { LocalCamera } from "@/components/room/local-camera";
import { MaskAvatar, RevealedAvatar, maskLabel } from "@/components/room/mask-avatar";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";
import type { RoomParticipantView } from "@/lib/runtime/view";
import { cn } from "@/lib/utils";

const STATUS_KEY: Record<RoomParticipantView["status"], string | null> = {
  ok: null,
  warned: "room.statusWarned",
  restricted: "room.statusRestricted",
  muted: "room.statusMuted",
  removed: "room.statusRemoved",
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
  const t = useT();
  const [pending, startTransition] = useTransition();
  const p = participant;
  // 공개 여부는 방장끼리의 합의로 방 전체에 한꺼번에 적용됩니다(뷰에서 계산).
  const revealed = p.revealed;
  const statusKey = STATUS_KEY[p.status];

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
            // 공개된 뒤에는 내 얼굴도 화상 무대에 나오므로, 여기서 카메라를
            // 한 번 더 잡지 않습니다(같은 장치 이중 점유 방지).
            revealed ? (
              <RevealedAvatar nickname={p.nickname} className="max-w-28" />
            ) : p.camOn ? (
              <LocalCamera enabled={p.camOn} />
            ) : (
              <MaskAvatar mask={p.mask} t={t} className="max-w-32" />
            )
          ) : revealed ? (
            <RevealedAvatar nickname={p.nickname} className="max-w-28" />
          ) : (
            <MaskAvatar
              mask={p.mask}
              t={t}
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
          {p.isMe ? <Badge tone="gold">{t("room.me")}</Badge> : null}
          {p.isRoomHost ? (
            <Badge tone="gold">
              <Crown aria-hidden className="size-3" />
              {t("room.host")}
            </Badge>
          ) : null}
          {revealed ? (
            <Badge tone="success">
              <Eye aria-hidden className="size-3" />
              {t("room.revealedBadge")}
            </Badge>
          ) : null}
          {statusKey ? <Badge tone="danger">{t(statusKey)}</Badge> : null}
          {p.simulated ? <Badge tone="warn">{t("room.demo")}</Badge> : null}
        </div>

        {p.videoState === "blurred" ? (
          <p className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-[var(--radius-control)] bg-ink/80 px-3 py-2 text-center text-xs break-keep text-ivory">
            {t("room.blurredNote")}
          </p>
        ) : null}
      </div>

      {/* 정보 · 조작 */}
      <div className="space-y-3 border-t border-line/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-ivory">{p.nickname}</span>
            <span className="shrink-0 text-[0.6875rem] text-faint">
              {maskLabel(t, p.mask)}
            </span>
          </span>
          {p.micOn ? (
            <Mic
              aria-label={t("room.micIsOn")}
              className="size-4 shrink-0 text-success"
            />
          ) : (
            <MicOff
              aria-label={t("room.micIsOff")}
              className="size-4 shrink-0 text-faint"
            />
          )}
        </div>

        {p.isMe ? null : p.blockedByMe ? (
          <p className="text-xs text-faint">{t("room.blockedNote")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <TileButton pending={pending} onClick={() => onReport(p)} tone="danger">
              <Flag aria-hidden className="size-3.5" />
              {t("room.report")}
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
              {t("room.block")}
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
