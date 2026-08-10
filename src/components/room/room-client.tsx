"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Camera,
  CameraOff,
  DoorOpen,
  Flag,
  Mic,
  MicOff,
  PhoneOff,
  Users,
} from "lucide-react";

import {
  endRoom,
  leaveRoom,
  toggleMedia,
} from "@/app/(club)/room/[sessionId]/actions";
import { ChatPanel } from "@/components/room/chat-panel";
import { DailyStage } from "@/components/room/daily-stage";
import { ParticipantTile } from "@/components/room/participant-tile";
import { ReportDialog } from "@/components/room/report-dialog";
import { SessionTimer } from "@/components/room/session-timer";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import type { RoomParticipantView, RoomView } from "@/lib/runtime/view";

const POLL_INTERVAL_MS = 2500;

/** 연장 결제가 실패했을 때 룸으로 되돌아오며 붙는 코드. */
const EXTEND_ERROR_CODES = new Set([
  "no_usage",
  "closed",
  "unavailable",
  "not_configured",
  "creem_error",
]);

/**
 * 라이브 대화방.
 *
 * 상태는 폴링으로 동기화합니다(Phase 2에서 Supabase Realtime으로 교체).
 * 음성·영상은 Daily Prebuilt가 담당하고, 그 아래 타일은 누가 자리에 있는지와
 * 신고·차단 같은 조작을 맡습니다.
 */
export function RoomClient({
  initial,
  extendPending = false,
  extendError = null,
}: {
  initial: RoomView;
  /** 연장 결제를 마치고 돌아온 직후인지 (웹훅 확인 전) */
  extendPending?: boolean;
  /** 연장 결제를 시작하지 못한 사유 코드 */
  extendError?: string | null;
}) {
  const t = useT();
  const [view, setView] = useState<RoomView>(initial);
  const [reportTarget, setReportTarget] = useState<RoomParticipantView | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [stageLive, setStageLive] = useState(false);

  // 시간이 끝나면 화상 프레임을 언마운트해 실제로 연결을 끊습니다.
  //
  // 끊긴 상태를 boolean이 아니라 **끝난 만료 시각**으로 기억합니다. 연장
  // 결제가 반영되면 만료 시각이 뒤로 밀리고, 그 순간 이 값이 더 이상 현재
  // 만료 시각과 같지 않으므로 화상이 저절로 다시 붙습니다.
  const [expiredAt, setExpiredAt] = useState<string | null>(null);
  const handleExpire = useCallback((at: string) => setExpiredAt(at), []);

  const expiresAt = view.usage?.expiresAt ?? null;
  const timeUp = expiredAt !== null && expiredAt === expiresAt;
  // 같은 기준으로 "결제 확인 중" 안내도 거둡니다 — 처음 받은 만료 시각과
  // 달라졌다면 연장이 실제로 적용된 것입니다.
  const extendApplied = expiresAt !== (initial.usage?.expiresAt ?? null);

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
  const chatDisabled = view.state !== "live" || me.status === "removed";

  // 화면은 사람이 아니라 **공간** 단위로 묶습니다. 한 라운지의 회원들은 한
  // 방에 함께 있고 통화에는 그 방의 기기 한 대만 들어오므로, 타일을 사람 수
  // 만큼 늘어놓으면 실제 구조와 어긋납니다.
  const myLounge = view.participants.filter((p) => p.tableId === me.tableId);
  const otherLounge = view.participants.filter((p) => p.tableId !== me.tableId);

  // 무대가 붙어 있으면 내 영상은 그 프레임이 내보내므로 타일에서 카메라를
  // 다시 열지 않습니다. 무대 자체가 없는 동안(Daily 미설정·연결 실패)에만
  // 내 타일이 미리보기를 대신합니다 — 방이 끝났거나 시간이 다 된 뒤에는
  // 무대를 언마운트한 것이므로 미리보기도 띄우지 않습니다.
  const stageMounted =
    view.state !== "ended" && me.status !== "removed" && !timeUp;
  const selfPreview = stageMounted && !stageLive;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={view.state === "live" ? "success" : "warn"}>
            {view.state === "live"
              ? t("room.stateLive")
              : view.state === "paused"
                ? t("room.statePaused")
                : view.state === "locked"
                  ? t("room.stateLocked")
                  : t("room.stateEnded")}
          </Badge>
          <span className="text-sm text-muted">
            {t("room.participantCount", {
              count: view.participants.filter((p) => p.present).length,
            })}
          </span>
          <MockBadge />
        </div>

        {view.state === "paused" ? (
          <p className="rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 px-4 py-3 text-sm break-keep text-ivory">
            {t("room.pausedNote")}
          </p>
        ) : null}

        {view.state === "ended" ? (
          <p className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
            {t("room.endedNote")}
          </p>
        ) : null}

        {extendError ? (
          <p className="rounded-[var(--radius-control)] border border-danger/40 bg-danger-dim/40 px-4 py-3 text-sm break-keep text-ivory">
            {EXTEND_ERROR_CODES.has(extendError)
              ? t(`room.extendErrors.${extendError}`)
              : t("room.extendFailed")}
          </p>
        ) : null}

        {extendPending && !extendApplied ? (
          <p
            role="status"
            className="rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-3 text-sm break-keep text-muted"
          >
            {t("room.extendChecking")}
          </p>
        ) : null}

        <SessionTimer
          sessionId={view.sessionId}
          usage={view.usage}
          remainingMatches={view.remainingMatches}
          extensions={view.extensions}
          onExpire={handleExpire}
        />

        {stageMounted ? (
          <DailyStage
            sessionId={view.sessionId}
            micOn={me.micOn && me.status !== "muted"}
            camOn={me.camOn}
            onLiveChange={setStageLive}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <LoungePanel
            sessionId={view.sessionId}
            name={view.myLoungeName}
            members={myLounge}
            mine
            selfPreview={selfPreview}
            onReport={setReportTarget}
          />
          <LoungePanel
            sessionId={view.sessionId}
            name={view.otherLoungeName}
            members={otherLounge}
            onReport={setReportTarget}
          />
        </div>

        {/* 미디어 · 퇴장 컨트롤 */}
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface-raised p-4">
          {/* 마이크·카메라는 이 라운지의 기기를 맡은 사람에게만 의미가 있습니다.
              나머지 회원의 기기는 통화에 들어와 있지 않습니다. */}
          {view.isLoungeCamera ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  pending || me.status === "muted" || view.state === "ended"
                }
                onClick={() =>
                  startTransition(async () => {
                    await toggleMedia(view.sessionId, { micOn: !me.micOn });
                    await refresh();
                  })
                }
              >
                {me.micOn ? (
                  <>
                    <Mic aria-hidden className="size-4" /> {t("room.micOff")}
                  </>
                ) : (
                  <>
                    <MicOff aria-hidden className="size-4" /> {t("room.micOn")}
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
                    <Camera aria-hidden className="size-4" /> {t("room.camOff")}
                  </>
                ) : (
                  <>
                    <CameraOff aria-hidden className="size-4" /> {t("room.camOn")}
                  </>
                )}
              </Button>
            </>
          ) : (
            <p className="flex items-start gap-2 text-xs leading-relaxed break-keep text-muted">
              <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
              {t("room.audienceControls")}
            </p>
          )}

          <div className="ml-auto flex flex-wrap gap-3">
            {view.isHost && view.state !== "ended" ? (
              <form action={endRoom.bind(null, view.sessionId)}>
                <Button type="submit" variant="danger">
                  <PhoneOff aria-hidden className="size-4" />
                  {t("room.endSession")}
                </Button>
              </form>
            ) : null}
            <form action={leaveRoom.bind(null, view.sessionId)}>
              <Button type="submit" variant="ghost">
                <DoorOpen aria-hidden className="size-4" />
                {t("room.leave")}
              </Button>
            </form>
          </div>

          {me.status === "muted" ? (
            <p className="w-full text-xs break-keep text-danger">
              {t("room.mutedNote")}
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

/**
 * 라운지 한 곳 = 화면 한 칸.
 *
 * 그 칸의 화면과 소리는 그 방의 기기 한 대(방장)가 맡습니다. 같은 방에 있는
 * 나머지 회원은 그 아래에 이름으로만 적습니다 — 각자의 영상이 따로 오지
 * 않기 때문입니다.
 */
function LoungePanel({
  sessionId,
  name,
  members,
  mine = false,
  selfPreview = false,
  onReport,
}: {
  sessionId: string;
  name: string;
  members: RoomParticipantView[];
  /** 내가 속한 라운지인지 */
  mine?: boolean;
  /** 무대가 없어 내 타일이 카메라 미리보기를 대신해야 하는지 */
  selfPreview?: boolean;
  onReport: (target: RoomParticipantView) => void;
}) {
  const t = useT();
  const camera = members.find((p) => p.isRoomHost) ?? members[0];
  // 인원은 지금 자리에 있는 사람만 셉니다 — 나갔거나 퇴장 조치된 회원까지
  // 세면 위쪽의 참가자 수와 어긋납니다.
  const here = members.filter((p) => p.present);
  const rest = here.filter((p) => p.userId !== camera?.userId);
  if (!camera) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-caps">
          {mine ? t("room.myLounge") : t("room.otherLoungeName")}
        </span>
        <span className="truncate text-sm text-ivory">{name}</span>
        <span className="text-xs text-faint">
          {t("room.participantCount", { count: here.length })}
        </span>
      </div>

      <ul>
        <ParticipantTile
          sessionId={sessionId}
          participant={camera}
          selfPreview={selfPreview}
          onReport={onReport}
        />
      </ul>

      {/* 영상이 따로 오지 않는 회원도 이름으로는 자리에 있습니다. 신고 버튼을
          함께 두는 이유는, 타일이 사라졌다고 해서 신고할 길까지 사라지면 안
          되기 때문입니다 — 카메라 뒤에 있는 사람도 목소리로 함께 있습니다. */}
      {rest.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[var(--radius-control)] border border-line bg-surface px-3.5 py-2.5 text-xs break-keep text-muted">
          <span className="text-faint">{t("room.alsoHere")}</span>
          {rest.map((p) => (
            <span key={p.userId} className="inline-flex items-center gap-1.5">
              <span className="text-ivory">{p.nickname}</span>
              {p.isMe ? (
                <span className="text-faint">({t("room.me")})</span>
              ) : p.blockedByMe ? (
                <span className="text-faint">{t("room.blockedTag")}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onReport(p)}
                  aria-label={`${p.nickname} · ${t("room.report")}`}
                  className="text-faint transition-colors hover:text-danger"
                >
                  <Flag aria-hidden className="size-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
