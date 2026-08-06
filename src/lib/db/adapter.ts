import type {
  AccountStatus,
  Booking,
  Club,
  Consent,
  ConsentType,
  ConversationEnergy,
  DesiredGender,
  Gender,
  OperatingHour,
  Profile,
  Table,
  TableMember,
  TablePreferences,
  TableState,
  User,
} from "./types";

export interface CreateLoungeInput {
  userId: string;
  waiterId: string | null;
  name: string;
}

export interface MatchPreferenceInput {
  desiredGender: DesiredGender;
  energy: ConversationEnergy;
  interests: string[];
  ageBands: string[];
}

/** 매칭 후보 라운지 1건과 그 공통점 근거 */
export interface MatchCandidate {
  table: Table;
  score: number;
  reasons: string[];
  profiles: Profile[];
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

/** 로그인 검증용 — 비밀번호 해시는 이 경로 밖으로 나가지 않습니다. */
export interface Credentials {
  user: User;
  passwordHash: string | null;
}

export interface ProfileInput {
  nickname: string;
  gender: Gender;
  ageBand: string;
  region: string | null;
  languages: string[];
  interests: string[];
  groupVibe: ConversationEnergy;
  conversationStyle: string | null;
}

export interface ConsentInput {
  consentType: ConsentType;
  granted: boolean;
}

/** 초대코드 합류 결과 — 실패 사유를 UI가 구분해 안내합니다. */
export type JoinResult =
  | { ok: true; table: Table }
  | {
      ok: false;
      reason: "not_found" | "full" | "closed" | "already_member" | "in_other";
    };

/**
 * 데이터 접근 계약. 앱 코드는 이 인터페이스에만 의존하며,
 * 환경에 따라 DevMemoryAdapter 또는 PostgresAdapter로 교체됩니다.
 */
export interface DataAdapter {
  /** MVP는 단일 활성 클럽을 운영합니다. */
  getPrimaryClub(): Promise<Club>;
  getOperatingHours(clubId: string): Promise<OperatingHour[]>;

  /* ---------------------------------------------------------- 계정 · 인증 */
  getUser(id: string): Promise<User | null>;
  getCredentialsByEmail(email: string): Promise<Credentials | null>;
  createUser(input: CreateUserInput): Promise<User>;
  /** 성인 확인(생년) 기록. */
  confirmAdult(userId: string, birthYear: number): Promise<void>;
  saveConsents(
    userId: string,
    version: string,
    entries: ConsentInput[],
  ): Promise<void>;
  getConsents(userId: string): Promise<Consent[]>;
  /** 필수 동의를 모두 마쳤음을 기록. */
  markConsentCompleted(userId: string): Promise<void>;
  markOnboardingCompleted(userId: string): Promise<void>;

  /* -------------------------------------------------------------- 프로필 */
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(userId: string, input: ProfileInput): Promise<Profile>;

  /* -------------------------------------------------------------- 라운지 */
  /** 사용자가 현재 속한 활성 라운지(퇴장하지 않은 멤버십)를 반환합니다. */
  getActiveTableForUser(userId: string): Promise<Table | null>;
  getTable(id: string): Promise<Table | null>;
  /** 활성 멤버(퇴장하지 않은) 목록을 joined_at 순으로 반환합니다. */
  getActiveTableMembers(tableId: string): Promise<TableMember[]>;
  /** 라운지 활성 멤버들의 프로필 */
  getProfilesForTable(tableId: string): Promise<Profile[]>;
  getTablePreferences(tableId: string): Promise<TablePreferences | null>;

  /** 라운지 생성(호스트 입장). 이미 활성 라운지가 있으면 라운지 매니저만 갱신해 반환. */
  createLounge(input: CreateLoungeInput): Promise<Table>;
  /** 초대코드로 기존 라운지에 합류합니다. */
  joinTableByCode(userId: string, code: string): Promise<JoinResult>;
  /** 지정한 사용자를 라운지 멤버로 추가합니다(데모 동반자 등). */
  addMemberToTable(tableId: string, userId: string): Promise<void>;
  /** 라운지에서 나갑니다. 호스트가 나가면 남은 최고참 멤버가 승계합니다. */
  leaveTable(userId: string, tableId: string): Promise<void>;
  setTableState(tableId: string, state: TableState): Promise<void>;

  /* -------------------------------------------------------------- 매칭 */
  /** 원하는 상대 스타일(선호)을 저장하고 라운지를 매칭 대기 상태로 전환. */
  setMatchPreference(
    tableId: string,
    pref: MatchPreferenceInput,
  ): Promise<void>;
  /** 선호와 공통점이 가장 많은 상대 라운지를 찾습니다. */
  findBestMatch(tableId: string): Promise<MatchCandidate | null>;

  createBooking(
    requesterTableId: string,
    candidate: MatchCandidate,
    waiterId: string | null,
  ): Promise<Booking>;
  getBookingForTable(tableId: string): Promise<Booking | null>;
  getBooking(id: string): Promise<Booking | null>;
  /** 한쪽 라운지의 수락/거절을 기록하고 갱신된 제안을 반환합니다. */
  respondToBooking(
    bookingId: string,
    side: "requester" | "matched",
    response: "accepted" | "declined",
  ): Promise<Booking | null>;
  /** 양측 수락 후 개설된 화상 세션 id를 연결합니다. */
  attachSessionToBooking(bookingId: string, sessionId: string): Promise<void>;

  /* -------------------------------------------------------------- 관리자 */
  listUsers(limit?: number): Promise<User[]>;
  setUserStatus(userId: string, status: AccountStatus): Promise<void>;
  listTables(limit?: number): Promise<Table[]>;
  listBookings(limit?: number): Promise<Booking[]>;
}
