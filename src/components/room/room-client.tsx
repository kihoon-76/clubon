"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Camera, CameraOff, DoorOpen, Mic, MicOff, PhoneOff } from "lucide-react";

import {
  endRoom,
  leaveRoom,
  toggleMedia,
} from "@/app/(club)/room/[sessionId]/actions";
import { ChatPanel } from "@/components/room/chat-panel";
import { ParticipantTile } from "@/components/room/participant-tile";
import { ReportDialog } from "@/components/room/report-dialog";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoomParticipantView, RoomView } from "@/lib/runtime/view";

const POLL_INTERVAL_MS = 2500;

/**
 * 라이브 마스크 대화방.
 *
 * 상태는 폴링으로 동기화합니다(Phase 2에서 Supabase Realtime으로 교체).
 * 실시간 화상 스트림 전송은 아직 연결되지 않았으며, 내 카메라 미리보기만
 * 로컬에서 표시됩니다.
 */
export function RoomClient({ initial }: { initial: RoomView }) {
  const [view, setView] = useState<RoomView>(initial);
  const [reportTarget, setReportTarget] = useState<RoomParticipantView | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${initial.sessionId}/state`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      setView((await res.json()) as RoomView);
    } catch {
      // 네트워크 순단은 다음 폴링에서 회복합니다.
    }
  }, [initial.sessionId]);

  useEffect(() => {
    if (view.state === "ended") return;
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh, view.state]);

  const { me } = view;
  const others = view.participants.filter((p) => !p.isMe);
  const chatDisabled = view.state !== "live" || me.status === "removed";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={view.state === "live" ? "success" : "warn"}>
            {view.state === "live"
              ? "대화 중"
              : view.state === "paused"
                ? "일시 정지"
                : view.state === "locked"
                  ? "잠금"
                  : "종료됨"}
          </Badge>
          <span className="text-sm text-muted">
            참가자 {view.participants.filter((p) => p.present).length}명
          </span>
          <MockBadge />
          <span className="text-xs text-faint">
            실시간 영상 전송은 아직 연결되지 않았습니다. 내 카메라만 로컬에서
            미리 보입니다.
          </span>
        </div>

        {view.state === "paused" ? (
          <p className="rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 px-4 py-3 text-sm text-ivory">
            참가자가 최소 인원(4명) 아래로 줄어 대화가 일시 정지되었습니다.
            인원이 회복되면 자동으로 재개됩니다.
          </p>
        ) : null}

        {view.state === "ended" ? (
          <p className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
            세션이 종료되었습니다.
          </p>
        ) : null}

        <ul className="grid gap-4 sm:grid-cols-2">
          <ParticipantTile
            sessionId={view.sessionId}
            participant={me}
            onReport={setReportTarget}
          />
          {others.map((p) => (
            <ParticipantTile
              key={p.userId}
              sessionId={view.sessionId}
              participant={p}
              onReport={setReportTarget}
            />
          ))}
        </ul>

        {/* 미디어 · 퇴장 컨트롤 */}
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface-raised p-4">
          <Button
            type="button"
            variant="secondary"
            disabled={pending || me.status === "muted" || view.state === "ended"}
            onClick={() =>
              startTransition(async () => {
                await toggleMedia(view.sessionId, { micOn: !me.micOn });
                await refresh();
              })
            }
          >
            {me.micOn ? (
              <>
                <Mic aria-hidden className="size-4" /> 마이크 끄기
              </>
            ) : (
              <>
                <MicOff aria-hidden className="size-4" /> 마이크 켜기
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={pending || view.state === "ended"}
            onClick={() =>
              startTransition(async () => {
                await toggleMedia(view.sessionId, { camOn: !me.camOn });
                await refresh();
              })
            }
          >
            {me.camOn ? (
              <>
                <Camera aria-hidden className="size-4" /> 카메라 끄기
              </>
            ) : (
              <>
                <CameraOff aria-hidden className="size-4" /> 카메라 켜기
              </>
            )}
          </Button>

          <div className="ml-auto flex flex-wrap gap-3">
            {view.isHost && view.state !== "ended" ? (
              <form action={endRoom.bind(null, view.sessionId)}>
                <Button type="submit" variant="danger">
                  <PhoneOff aria-hidden className="size-4" />
                  세션 종료
                </Button>
              </form>
            ) : null}
            <form action={leaveRoom.bind(null, view.sessionId)}>
              <Button type="submit" variant="ghost">
                <DoorOpen aria-hidden className="size-4" />
                나가기
              </Button>
            </form>
          </div>

          {me.status === "muted" ? (
            <p className="w-full text-xs text-danger">
              모더레이션 조치로 마이크가 잠겨 있습니다. 관리자 검토 후 해제됩니다.
            </p>
          ) : null}
        </div>
      </div>

      <div className="h-[32rem] min-h-0 lg:h-auto">
        <ChatPanel
          sessionId={view.sessionId}
          messages={view.messages}
          disabled={chatDisabled}
          onSent={refresh}
        />
      </div>

      <ReportDialog
        sessionId={view.sessionId}
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
}
