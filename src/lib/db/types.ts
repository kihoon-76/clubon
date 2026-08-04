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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  adultConfirmedAt: string | null;
  birthYear: number | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface Profile {
  userId: string;
  nickname: string;
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
  ageBands: string[];
  languages: string[];
  interests: string[];
  energy: ConversationEnergy;
  topicFocus: string[];
  regionPreference: string | null;
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
