import "server-only";

import { getDb } from "@/lib/db";
import * as room from "@/lib/runtime/store";
import type { MaskId, RevealState, SessionState } from "@/lib/runtime/types";

/**
 * 룸 화면이 쓰는 단일 뷰 모델. 서버 컴포넌트와 폴링 API가 같은 형태를
 * 반환하므로, 클라이언트는 한 가지 타입만 다루면 됩니다.
 */

export interface RoomParticipantView {
  userId: string;
  nickname: string;
  tableId: string;
  mask: MaskId;
  micOn: boolean;
  camOn: boolean;
  videoState: "ok" | "blurred" | "frozen" | "avatar";
  status: "ok" | "warned" | "restricted" | "muted" | "removed";
  present: boolean;
  simulated: boolean;
  isMe: boolean;
  /** 나와 이 참가자 사이의 공개 상태 */
  revealState: RevealState;
  /** 이 참가자가 나에게 공개를 요청했고, 내 응답을 기다리는 중 */
  awaitingMyReply: boolean;
  blockedByMe: boolean;
}

export interface RoomMessageView {
  id: string;
  senderId: string | null;
  senderName: string;
  kind: "user" | "system" | "waiter";
  body: string;
  moderationStatus: "allowed" | "flagged" | "blocked";
  moderationReason: string | null;
  createdAt: string;
  mine: boolean;
}

export interface RoomView {
  sessionId: string;
  state: SessionState;
  startedAt: string;
  endedAt: string | null;
  /** 나 자신 */
  me: RoomParticipantView;
  participants: RoomParticipantView[];
  messages: RoomMessageView[];
  /** 내가 이 라운지의 호스트인지 (세션 종료 권한) */
  isHost: boolean;
  waiterName: string | null;
}

/**
 * 룸 뷰를 조립합니다. 조립 전에 데모 참가자의 활동을 한 번 진행시킵니다
 * (폴링 시점 시뮬레이션 — 실제 참가자에게는 영향 없음).
 */
export async function buildRoomView(
  sessionId: string,
  viewerId: string,
): Promise<RoomView | null> {
  const session = room.getSession(sessionId);
  if (!session) return null;

  const db = getDb();
  const booking = await db.getBooking(session.bookingId);
  const waiterId = booking?.waiterId ?? null;

  room.simulateDemoActivity(sessionId, waiterId);

  const participants = room.getParticipants(sessionId);
  const meRaw = participants.find((p) => p.userId === viewerId);
  if (!meRaw) return null;

  const blocked = new Set(room.getBlockedIds(viewerId));
  const pairs = room.getRevealPairsFor(sessionId, viewerId);

  const toView = (p: (typeof participants)[number]): RoomParticipantView => {
    const pair = pairs.find(
      (x) => x.userAId === p.userId || x.userBId === p.userId,
    );
    const isMe = p.userId === viewerId;
    return {
      userId: p.userId,
      nickname: p.nickname,
      tableId: p.tableId,
      mask: p.mask,
      micOn: p.micOn,
      camOn: p.camOn,
      videoState: p.videoState,
      status: p.status,
      present: !p.leftAt && p.status !== "removed",
      simulated: p.simulated,
      isMe,
      revealState: isMe ? "MASKED" : (pair?.state ?? "MASKED"),
      awaitingMyReply:
        !isMe &&
        pair?.state === "REVEAL_REQUESTED" &&
        pair.requesterId === p.userId,
      blockedByMe: blocked.has(p.userId),
    };
  };

  const myTable = await db.getTable(meRaw.tableId);

  return {
    sessionId,
    state: session.state,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    me: toView(meRaw),
    participants: participants
      .filter((p) => !p.leftAt || p.userId === viewerId)
      .map(toView),
    messages: room.getVisibleMessages(sessionId, viewerId).map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      kind: m.kind,
      body: m.body,
      moderationStatus: m.moderationStatus,
      moderationReason: m.moderationReason,
      createdAt: m.createdAt,
      mine: m.senderId === viewerId,
    })),
    isHost: myTable?.hostUserId === viewerId,
    waiterName: null,
  };
}
