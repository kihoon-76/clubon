"use client";

import { useTransition } from "react";
import { Ban, Crown, Flag, Mic, MicOff } from "lucide-react";

import { blockParticipant } from "@/app/(club)/room/[sessionId]/actions";
import { LocalCamera } from "@/components/room/local-camera";
import { MemberAvatar } from "@/components/room/member-avatar";
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
  selfPreview = false,
  onReport,
}: {
  sessionId: string;
  participant: RoomParticipantView;
  /**
   * 내 카메라를 이 타일에서 직접 열어도 되는지.
   *
   * 화상 무대가 살아 있으면 내 영상은 이미 그 프레임이 내보내고 있으므로
   * 여기서 같은 장치를 또 열지 않습니다(이중 점유). Daily 자격증명이 없는
   * 데모처럼 무대가 붙지 못한 때에만 미리보기를 대신 띄웁니다.
   */
  selfPreview?: boolean;
  onReport: (target: RoomParticipantView) => void;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const p = participant;
  const statusKey = STATUS_KEY[p.status];
  const showLocalCamera =
    selfPreview && p.isMe && p.camOn && p.videoState !== "blurred";

  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-raised",
        !p.present && "opacity-45",
      )}
    >
      {/* 영상 영역 */}
      <div className="relative aspect-4/3 bg-ink">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {showLocalCamera ? (
            <LocalCamera enabled />
          ) : (
            <MemberAvatar
              nickname={p.nickname}
              className="max-w-28"
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
