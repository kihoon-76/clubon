import "server-only";

import { getDb } from "@/lib/db";
import * as room from "@/lib/runtime/store";
import type { LoungeSessionStatus } from "@/lib/db/types";
import {
  extensionsFor,
  formatUsd,
  type ExtensionCode,
} from "@/lib/payments/catalog";
import { purchasableCodes } from "@/lib/payments/creem";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/types";
import type { ChatMessage, SessionState } from "@/lib/runtime/types";

/**
 * 룸 화면이 쓰는 단일 뷰 모델. 서버 컴포넌트와 폴링 API가 같은 형태를
 * 반환하므로, 클라이언트는 한 가지 타입만 다루면 됩니다.
 */

export interface RoomParticipantView {
  userId: string;
  nickname: string;
  tableId: string;
  micOn: boolean;
  camOn: boolean;
  videoState: "ok" | "blurred" | "frozen" | "avatar";
  status: "ok" | "warned" | "restricted" | "muted" | "removed";
  present: boolean;
  simulated: boolean;
  isMe: boolean;
  /** 이 참가자가 이 라운지의 방장인지 */
  isRoomHost: boolean;
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
  /**
   * 내 기기가 이 라운지의 카메라·마이크인지.
   *
   * 라운지 하나는 통화에 **한 대만** 들어옵니다. 같은 라운지의 회원들은 한
   * 방에 함께 있어서, 회의실에 카메라와 마이크를 한 벌 두는 것과 같습니다.
   * 그 한 벌을 방장이 맡으므로 `isHost`와 같은 사람이지만, 하나는 세션을
   * 종료할 권한이고 이것은 기기의 역할이라 이름을 나눠 둡니다.
   */
  isLoungeCamera: boolean;
  /** 내 라운지 이름 — 통화에서 개인 대신 이 이름이 보입니다. */
  myLoungeName: string;
  /** 상대 라운지 이름 */
  otherLoungeName: string;
  waiterName: string | null;
  /**
   * 이 방의 시간 현황.
   *
   * 남은 시간은 **서버가 정한 expiresAt**만을 기준으로 계산합니다. 클라이언트
   * 타이머는 표시용일 뿐이라, 새로고침하거나 다른 기기로 붙어도 시간이
   * 처음부터 다시 흐르지 않습니다. 아직 영상에 입장하지 않았으면 null입니다.
   */
  usage: RoomUsageView | null;
  /** 내 남은 방 매치 횟수 — 시간이 끝났을 때 안내 문구가 참조합니다. */
  remainingMatches: number;
  /**
   * 이 방을 연 회원이 나인지.
   *
   * 방 시간은 모두가 함께 쓰므로, 연장은 방을 연 회원의 '연장'과 나머지
   * 참가자의 '선물'로 나뉩니다. 그 갈림을 이 값이 정합니다.
   */
  iAmRoomOwner: boolean;
  /**
   * 지금 내가 살 수 있는 시간 연장 상품.
   *
   * 방 전체의 시간을 늘리는 상품이라 목록은 서버가 정합니다 — 방을 연
   * 회원에게는 연장, 나머지 참가자에게는 선물이 보이고, Creem 상품이
   * 연결되지 않았으면 아무것도 보이지 않습니다.
   */
  extensions: RoomExtensionView[];
}

export interface RoomUsageView {
  startedAt: string;
  expiresAt: string;
  sessionStatus: LoungeSessionStatus;
  /** 이 방을 연 회원이 나인지 */
  openedByMe: boolean;
  /** 결제로 늘어난 시간의 누계(분) */
  extendedMinutes: number;
}

export interface RoomExtensionView {
  /**
   * 상품 코드. 표기는 여기 담지 않습니다 — 뷰는 서버에서 조립되고 문구는
   * 읽는 사람의 언어라, 코드만 내려보내고 화면에서 사전으로 옮깁니다.
   */
  code: ExtensionCode;
  minutes: number;
  /** 표시용 금액 ("$3.99") */
  price: string;
  /** 부담자 대신 사 주는 선물인지 */
  gift: boolean;
}

/**
 * 저장된 메시지를 보는 사람의 언어로 옮깁니다.
 *
 * 치환값 중 이름이 `Key`로 끝나는 것은 **값 자체가 사전 키**입니다(중첩된
 * 문구 — 매니저 이름, 종료 사유, 조치 이름). 먼저 그것부터 옮긴 뒤 접미사를
 * 뗀 이름으로 문장에 끼웁니다. 회원이 친 말에는 키가 없으므로 그대로 둡니다.
 */
function messageBody(t: Translate, m: ChatMessage): string {
  if (!m.bodyKey) return m.body;

  const vars: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(m.bodyVars ?? {})) {
    if (name.endsWith("Key") && typeof value === "string") {
      vars[name.slice(0, -3)] = t(value);
    } else {
      vars[name] = value;
    }
  }
  return t(m.bodyKey, vars);
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
  const t = await getT();
  const booking = await db.getBooking(session.bookingId);
  const waiterId = booking?.waiterId ?? null;

  room.simulateDemoActivity(sessionId, waiterId);

  const participants = room.getParticipants(sessionId);
  const meRaw = participants.find((p) => p.userId === viewerId);
  if (!meRaw) return null;

  const blocked = new Set(room.getBlockedIds(viewerId));
  const isHostOf = (userId: string) =>
    session.hostAUserId === userId || session.hostBUserId === userId;

  const toView = (p: (typeof participants)[number]): RoomParticipantView => {
    const isMe = p.userId === viewerId;
    // 통화에 들어와 있는 기기는 라운지당 한 대(방장)뿐입니다. 나머지 회원의
    // 기기는 애초에 통화에 없으므로 마이크·카메라도 켜져 있지 않습니다 —
    // 저장된 값이 무엇이든 화면에는 꺼진 것으로 보여야 사실과 맞습니다.
    const isCamera = isHostOf(p.userId);
    return {
      userId: p.userId,
      nickname: p.nickname,
      tableId: p.tableId,
      micOn: isCamera && p.micOn,
      camOn: isCamera && p.camOn,
      videoState: p.videoState,
      status: p.status,
      present: !p.leftAt && p.status !== "removed",
      simulated: p.simulated,
      isMe,
      isRoomHost: isHostOf(p.userId),
      blockedByMe: blocked.has(p.userId),
    };
  };

  // 두 라운지의 이름. 통화에서는 개인 대신 이 이름이 보입니다 — 화면 하나가
  // 사람 하나가 아니라 공간 하나를 가리키기 때문입니다.
  const otherTableId =
    session.tableAId === meRaw.tableId ? session.tableBId : session.tableAId;
  const [myTable, otherTable] = await Promise.all([
    db.getTable(meRaw.tableId),
    db.getTable(otherTableId),
  ]);
  const iAmHost = isHostOf(viewerId);

  // 횟수 현황은 조회만 합니다 — 차감은 영상 입장(/api/rooms/[id]/video)에서만.
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
  const iAmRoomOwner = room.roomOwnerId(sessionId) === viewerId;
  // 늘릴 시간이 실제로 있어야(= 영상이 시작되었고 방이 닫히지 않았어야) 팝니다.
  // 만료된 방은 결제로 되살아나므로 여기에 포함됩니다.
  const canExtend = Boolean(usage) && usage?.sessionStatus !== "ended";
  const sellable = canExtend ? purchasableCodes() : new Set<string>();

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
      senderName: m.senderKey ? t(m.senderKey) : (m.senderName ?? ""),
      kind: m.kind,
      body: messageBody(t, m),
      moderationStatus: m.moderationStatus,
      // 저장된 값은 사유의 사전 키입니다.
      moderationReason: m.moderationReason ? t(m.moderationReason) : null,
      createdAt: m.createdAt,
      mine: m.senderId === viewerId,
    })),
    isHost: myTable?.hostUserId === viewerId,
    // 카메라 역할은 **세션이 열릴 때 고정된 방장**을 따릅니다. 마이크·카메라
    // 조작(`store.setMedia`)과 참가자별 `isRoomHost`가 같은 값을 보므로, 토큰을
    // 받는 사람과 화면에서 카메라로 표시되는 사람이 어긋나지 않습니다.
    // (`isHost`는 세션 종료 권한이라 지금 시점의 라운지 방장을 봅니다 — 대화
    // 도중 방장이 바뀌면 둘이 갈릴 수 있고, 그래도 그게 맞습니다.)
    isLoungeCamera: iAmHost,
    myLoungeName: myTable?.name ?? t("room.myLounge"),
    otherLoungeName: otherTable?.name ?? t("room.otherLoungeName"),
    waiterName: null,
    usage: usage
      ? {
          startedAt: usage.startedAt,
          expiresAt: usage.expiresAt,
          sessionStatus: usage.sessionStatus,
          openedByMe: usage.ownerUserId === viewerId,
          extendedMinutes: usage.extendedMinutes,
        }
      : null,
    remainingMatches: wallet.remainingMatches,
    iAmRoomOwner,
    extensions: extensionsFor(iAmRoomOwner ? "payer" : "guest")
      .filter((addon) => sellable.has(addon.code))
      .map((addon) => ({
        code: addon.code,
        minutes: addon.extendMinutes,
        price: formatUsd(addon.priceCents),
        gift: addon.inRoomBuyer === "guest",
      })),
  };
}
