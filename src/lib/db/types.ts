/**
 * DB 행(row) 타입 — Supabase 스키마(`supabase/migrations`)의 논리 모델을
 * 그대로 반영합니다. DevMemoryAdapter와 (추후) SupabaseAdapter가 동일한
 * 형태를 반환하도록 하는 단일 계약입니다.
 *
 * 타임스탬프는 ISO 문자열로 통일합니다(서버·클라이언트 직렬화 안전).
 */

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
  | "face_tracking"
  | "anti_recording"
  | "community_standards"
  | "mutual_face_reveal";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  adultConfirmedAt: string | null;
  birthYear: number | null;
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
  /** 공통점 근거 문구 */
  reasons: string[];
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
