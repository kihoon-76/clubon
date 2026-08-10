/**
 * DB 행(row) 타입 — Supabase 스키마(`supabase/migrations`)의 논리 모델을
 * 그대로 반영합니다. DevMemoryAdapter와 (추후) SupabaseAdapter가 동일한
 * 형태를 반환하도록 하는 단일 계약입니다.
 *
 * 타임스탬프는 ISO 문자열로 통일합니다(서버·클라이언트 직렬화 안전).
 */

import type { MatchReason } from "@/lib/match/score";

export type UserRole = "user" | "moderator" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";
export type ConversationEnergy = "relaxed" | "balanced" | "lively";
export type Gender = "female" | "male" | "other";
/** 매칭 시 원하는 상대 성별 (any = 상관없음) */
export type DesiredGender = "female" | "male" | "any";

export type TableState =
  | "FORMING"
  | "READY"
  | "WAITING"
  | "MATCH_PROPOSED"
  | "MATCH_ACCEPTED"
  | "LIVE"
  | "PAUSED"
  | "CLOSED"
  | "MODERATION_LOCKED";

export type TableMemberRole = "host" | "member";

export type ConsentType =
  | "terms_of_service"
  | "privacy_policy"
  | "adult_only"
  | "camera_microphone"
  | "ai_text_moderation"
  | "ai_video_moderation"
  | "anti_recording"
  | "community_standards";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  adultConfirmedAt: string | null;
  birthYear: number | null;
  /**
   * 가입할 때 선언한 성별. 진실의 원천이며 `Profile.gender`는 사본입니다.
   *
   * Google 로그인으로 처음 들어온 회원은 가입 폼을 거치지 않아 null이고,
   * 프로필 단계에서 한 번 물어봅니다.
   */
  gender: Gender | null;
  onboardingCompletedAt: string | null;
  /** 동의 플로우를 마친 시각 (필수 항목 전체 동의) */
  consentCompletedAt: string | null;
  createdAt: string;
}

export interface Consent {
  userId: string;
  consentType: ConsentType;
  version: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

export interface Profile {
  userId: string;
  nickname: string;
  gender: Gender;
  ageBand: string;
  region: string | null;
  languages: string[];
  interests: string[];
  conversationStyle: string | null;
  groupVibe: ConversationEnergy;
  music: string[];
  travel: string[];
  hobbies: string[];
  availability: string[];
  reputationScore: number;
  completedSessions: number;
  reportCount: number;
}

export interface Club {
  id: string;
  name: string;
  timezone: string;
  minTableSize: number;
  maxTableSize: number;
  minRoomParticipants: number;
  isActive: boolean;
}

export interface OperatingHour {
  clubId: string;
  /** 0 = 일요일 … 6 = 토요일 */
  dayOfWeek: number;
  /** "HH:MM" (24h) */
  opensAt: string;
  /** "HH:MM" (24h) */
  closesAt: string;
  /** 자정을 넘겨 닫는 경우 (예: 18:00 → 익일 04:00) */
  closesNextDay: boolean;
}

export interface Table {
  id: string;
  clubId: string;
  hostUserId: string;
  name: string;
  state: TableState;
  maxSize: number;
  inviteCode: string;
  /** 이 라운지를 안내하는 AI 라운지 매니저 (lib/waiters의 id) */
  waiterId: string | null;
  /**
   * 라운지 지역 코드 (`lib/regions`의 값). 매칭은 같은 지역 안에서만 이뤄집니다.
   *
   * 예전에 만들어진 라운지는 null일 수 있어, 지역이 없는 라운지는 매칭
   * 후보에서 빠집니다.
   */
  regionCode: string | null;
  createdAt: string;
  updatedAt: string;
  waitingSince: string | null;
  closedAt: string | null;
}

export interface TableMember {
  id: string;
  tableId: string;
  userId: string;
  role: TableMemberRole;
  joinedAt: string;
  leftAt: string | null;
}

export interface TablePreferences {
  tableId: string;
  /** 원하는 상대 성별 */
  desiredGender: DesiredGender;
  ageBands: string[];
  languages: string[];
  interests: string[];
  energy: ConversationEnergy;
  topicFocus: string[];
  regionPreference: string | null;
}

export type BookingState = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
export type BookingResponse = "pending" | "accepted" | "declined";

/** 라운지 매니저가 성사시킨 라운지↔라운지 부킹(매치 제안) */
export interface Booking {
  id: string;
  requesterTableId: string;
  matchedTableId: string;
  waiterId: string | null;
  score: number;
  /**
   * 공통점 근거 — 문장이 아니라 사실입니다(`describeReason`이 옮깁니다).
   *
   * 구조가 바뀌기 전에 저장된 부킹에는 문장이 그대로 들어 있어 문자열도
   * 허용합니다. 부킹은 만료되는 값이라 이 겸용은 오래 남지 않습니다.
   */
  reasons: (MatchReason | string)[];
  state: BookingState;
  /** 제안한 라운지의 응답 */
  requesterResponse: BookingResponse;
  /** 제안받은 라운지의 응답 */
  matchedResponse: BookingResponse;
  /** 이 시각이 지나면 EXPIRED로 간주 */
  expiresAt: string;
  /** 양측 수락 후 개설된 화상 세션 id */
  sessionId: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  tableId: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  revokedAt: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------ 이용권 결제 */

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type LoungeSessionStatus = "active" | "ended" | "expired";

/**
 * 회원별 매치 횟수 지갑.
 *
 * 남은 매치 횟수는 이 한 행이 진실의 원천입니다. 지급(결제 웹훅)과 차감(영상
 * 방 입장)은 각각 멱등 키를 갖고 이 행을 갱신합니다.
 */
export interface PassWallet {
  userId: string;
  /** 남은 방 매치 횟수 — 입장료로 5회, 추가 구매로 1회씩 */
  remainingMatches: number;
  /** 누적 구매 매치 횟수(환불로 회수된 분은 제외하지 않는 총 구매량) */
  totalPurchasedMatches: number;
  updatedAt: string;
}

/**
 * 결제 내역 1건.
 *
 * `paymentId`는 Creem이 발급한 주문 식별자를 그대로 씁니다. 웹훅이 중복
 * 도착해도 이 값이 기본키라 매치 횟수가 두 번 지급되지 않습니다.
 */
export interface PaymentRecord {
  paymentId: string;
  userId: string;
  /** Creem 상품 ID */
  productId: string;
  /** 카탈로그의 상품 코드 (entry_pass·match_1·extend_30 등) */
  planCode: string;
  /** 실제 결제 금액(최소 화폐 단위 정수). Creem이 알려준 값입니다. */
  amount: number;
  currency: string;
  /** 이 결제로 지급된 매치 횟수 (시간 연장 상품이면 0) */
  purchasedMatches: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  refundedAt: string | null;
}

/**
 * 영상방의 시간 기록. **방 하나당 1행**입니다.
 *
 * 이 행은 "이 방이 언제 열려 언제까지인지"만 답합니다. 누가 자기 매치 횟수를
 * 썼는지는 참가자별로 `session_match_uses`가 따로 들고 있습니다 — 입장료
 * 모델에서는 방 하나에 여러 명이 각자 1회씩 쓰기 때문입니다.
 */
export interface LoungeUsage {
  sessionId: string;
  /** 이 방을 연 회원 — 매칭을 요청한 라운지의 방장. 연장 부담자 판정에 씁니다. */
  ownerUserId: string;
  /** 화상 공급자(Daily) 쪽 방 이름 */
  roomId: string;
  startedAt: string;
  /** 서버가 정한 만료 시각. 클라이언트 타이머는 이 값을 기준으로만 계산합니다. */
  expiresAt: string;
  endedAt: string | null;
  /**
   * 결제로 늘어난 시간의 누계(분). 매치 횟수와 별개로 돈을 받은 시간이라,
   * 무엇을 얼마나 제공했는지가 이 값에 남습니다.
   */
  extendedMinutes: number;
  sessionStatus: LoungeSessionStatus;
}
