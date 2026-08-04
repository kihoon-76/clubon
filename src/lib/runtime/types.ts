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

export type MaskId = "fox" | "cat" | "rabbit" | "bear" | "wolf";
export const MASK_IDS: MaskId[] = ["fox", "cat", "rabbit", "bear", "wolf"];

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
  mask: MaskId;
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

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string | null;
  senderName: string;
  kind: "user" | "system" | "waiter";
  body: string;
  moderationStatus: ModerationStatus;
  /** blocked 메시지는 발신자에게만 사유와 함께 보입니다. */
  moderationReason: string | null;
  createdAt: string;
}

export type RevealState =
  | "MASKED"
  | "REVEAL_REQUESTED"
  | "MUTUAL_REVEAL_PENDING"
  | "REVEALED"
  | "REMASKED"
  | "REVEAL_CANCELLED";

/** 쌍(pair) 단위 대칭 공개 권한. userAId < userBId로 정렬 저장합니다. */
export interface RevealPair {
  sessionId: string;
  userAId: string;
  userBId: string;
  state: RevealState;
  requesterId: string | null;
  updatedAt: string;
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
