import type {
  ModerationCategory,
  ModerationStatus,
  Severity,
} from "@/lib/moderation/text";

/**
 * 라이브 룸 도메인 타입.
 *
 * 설계서 기준 Phase 2(실시간·화상 공급자 연동) 이전 단계이므로, 이 상태는
 * 프로세스 메모리에 유지됩니다. 화상 원본은 어디에도 저장하지 않습니다.
 */

export type SessionState = "live" | "paused" | "ended" | "locked";
export type VideoState = "ok" | "blurred" | "frozen" | "avatar";
export type ParticipantStatus =
  | "ok"
  | "warned"
  | "restricted"
  | "muted"
  | "removed";

export interface VideoSession {
  id: string;
  bookingId: string;
  tableAId: string;
  tableBId: string;
  /** 각 라운지의 방장. 그 라운지의 카메라·마이크를 맡는 사람입니다. */
  hostAUserId: string | null;
  hostBUserId: string | null;
  state: SessionState;
  /** 마지막으로 참가자가 최소 인원 아래로 떨어진 시각 (PAUSED 유예 판단) */
  pausedSince: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface Participant {
  sessionId: string;
  userId: string;
  tableId: string;
  nickname: string;
  micOn: boolean;
  camOn: boolean;
  videoState: VideoState;
  status: ParticipantStatus;
  /** 모더레이션 위반 누적 (30분 경과분은 감쇠) */
  strikes: number;
  lastStrikeAt: string | null;
  /** 데모용 시뮬레이션 참가자 (실제 접속자가 아님) */
  simulated: boolean;
  joinedAt: string;
  leftAt: string | null;
}

/**
 * 방 안의 메시지.
 *
 * 회원이 친 말은 `body`에 그대로 담기지만, 시스템·매니저가 남기는 안내는
 * **문장이 아니라 사전 키**(`bodyKey` + `bodyVars`)로 담깁니다. 한 방에
 * 서로 다른 언어를 쓰는 사람이 함께 있을 수 있어, 저장 시점에 한 언어로
 * 굳히면 나머지는 읽지 못하는 안내를 보게 됩니다. 문장은 뷰를 조립할 때
 * 보는 사람의 언어로 만듭니다(`buildRoomView`).
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string | null;
  /** 회원이 보낸 메시지의 발신자 이름. 시스템·매니저 메시지는 null입니다. */
  senderName: string | null;
  /** 시스템·매니저 메시지의 발신자 이름 키 */
  senderKey: string | null;
  kind: "user" | "system" | "waiter";
  /** 회원이 친 말. 시스템·매니저 메시지는 빈 문자열입니다. */
  body: string;
  /** 시스템·매니저 안내의 사전 키 */
  bodyKey: string | null;
  bodyVars: Record<string, string | number> | null;
  moderationStatus: ModerationStatus;
  /** blocked 메시지는 발신자에게만 사유와 함께 보입니다. */
  moderationReason: string | null;
  createdAt: string;
}

export interface ModerationEvent {
  id: string;
  sessionId: string | null;
  subjectUserId: string;
  context: "chat" | "video" | "behavior";
  contextRef: string | null;
  category: ModerationCategory | null;
  severity: Severity;
  actionTaken: string;
  source: "rule" | "ai" | "report" | "admin";
  detail: string;
  createdAt: string;
}

export interface Report {
  id: string;
  sessionId: string | null;
  reporterId: string;
  reportedUserId: string;
  category: string;
  description: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolvedBy: string | null;
  createdAt: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface SessionFeedback {
  sessionId: string;
  userId: string;
  rating: number;
  vibe: string | null;
  wouldRematch: boolean;
  comment: string | null;
  createdAt: string;
}
