import "server-only";

import { getDb } from "@/lib/db";
import * as room from "@/lib/runtime/store";
import type { LoungeSessionStatus } from "@/lib/db/types";
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
  /** 이 참가자가 이 라운지의 방장인지 */
  isRoomHost: boolean;
  /** 지금 내 화면에서 이 참가자의 얼굴이 보이는지 */
  revealed: boolean;
  blockedByMe: boolean;
}

/**
 * 방 전체의 얼굴 공개 상태. 공개 여부는 참가자 개인이 아니라 양쪽 라운지의
 * 방장이 합의로 결정하며, 확정되면 모든 참가자에게 한꺼번에 적용됩니다.
 */
export interface RoomRevealView {
  state: RevealState;
  /** 내가 방장이라 공개를 요청·수락·철회할 수 있는지 */
  canDecide: boolean;
  /** 상대 라운지 방장이 제안했고 내 응답을 기다리는 중 */
  awaitingMyResponse: boolean;
  /** 내가 제안했고 상대 라운지 방장의 응답을 기다리는 중 */
  awaitingOtherResponse: boolean;
  /** 제안한 방장의 닉네임 */
  requesterName: string | null;
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
  reveal: RoomRevealView;
  waiterName: string | null;
  /**
   * 내 30분 이용권 사용 현황.
   *
   * 남은 시간은 **서버가 정한 expiresAt**만을 기준으로 계산합니다. 클라이언트
   * 타이머는 표시용일 뿐이라, 새로고침하거나 다른 기기로 붙어도 시간이
   * 처음부터 다시 흐르지 않습니다. 아직 영상에 입장하지 않았으면 null입니다.
   */
  usage: RoomUsageView | null;
  /** 내 잔여 이용권 — 만료 시 연장 안내 화면이 참조합니다. */
  remainingPasses: number;
  /**
   * 이 방의 이용권을 부담하는(또는 부담한) 회원이 나인지.
   *
   * 영상방 하나당 이용권 1회이므로, 잔액이 없어 영상이 열리지 않을 때
   * 안내 문구가 부담자와 나머지 참가자에게 서로 다르게 나가야 합니다.
   */
  iAmRoomPayer: boolean;
}

export interface RoomUsageView {
  startedAt: string;
  expiresAt: string;
  sessionStatus: LoungeSessionStatus;
  /** 이 방의 이용권을 부담한 회원이 나인지 */
  paidByMe: boolean;
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
  const agreement = room.getRevealAgreement(sessionId);
  const roomRevealed = agreement.state === "REVEALED";
  const isHostOf = (userId: string) =>
    session.hostAUserId === userId || session.hostBUserId === userId;

  const toView = (p: (typeof participants)[number]): RoomParticipantView => {
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
      isRoomHost: isHostOf(p.userId),
      // 방이 공개 상태여도 내가 차단한 상대와 모더레이션으로 영상이 제한된
      // 참가자는 계속 마스크로 보입니다.
      revealed:
        roomRevealed && !blocked.has(p.userId) && p.videoState !== "blurred",
      blockedByMe: blocked.has(p.userId),
    };
  };

  const myTable = await db.getTable(meRaw.tableId);
  const iAmHost = isHostOf(viewerId);

  // 이용권 현황은 조회만 합니다 — 차감은 영상 입장(/api/rooms/[id]/video)에서만.
  const [rawUsage, wallet] = await Promise.all([
    db.getLoungeUsage(sessionId),
    db.getWallet(viewerId),
  ]);

  // 룸 폴링이 만료를 쓸어 담습니다. 별도 크론 없이도 기록이 실제 상태와
  // 어긋나지 않고, 만료 이후에는 영상 토큰도 재발급되지 않습니다.
  let usage = rawUsage;
  if (
    usage &&
    usage.sessionStatus === "active" &&
    Date.parse(usage.expiresAt) <= Date.now()
  ) {
    await db.endLoungeUsage(sessionId, "expired");
    usage = { ...usage, sessionStatus: "expired" };
  }
  const requestPending = agreement.state === "REVEAL_REQUESTED";
  const iRequested = agreement.requesterTableId === meRaw.tableId;

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
    reveal: {
      state: agreement.state,
      canDecide: iAmHost,
      awaitingMyResponse: requestPending && iAmHost && !iRequested,
      awaitingOtherResponse: requestPending && iRequested,
      requesterName:
        participants.find((p) => p.userId === agreement.requesterId)?.nickname ??
        null,
    },
    waiterName: null,
    usage: usage
      ? {
          startedAt: usage.startedAt,
          expiresAt: usage.expiresAt,
          sessionStatus: usage.sessionStatus,
          paidByMe: usage.payerUserId === viewerId,
        }
      : null,
    remainingPasses: wallet.remainingPasses,
    iAmRoomPayer: room.roomOwnerId(sessionId) === viewerId,
  };
}
