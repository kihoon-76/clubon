import type {
  Booking,
  Club,
  ConversationEnergy,
  DesiredGender,
  OperatingHour,
  Profile,
  Table,
  TableMember,
  TablePreferences,
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

/**
 * 데이터 접근 계약. 앱 코드는 이 인터페이스에만 의존하며,
 * 환경에 따라 DevMemoryAdapter 또는 SupabaseAdapter로 교체됩니다.
 */
export interface DataAdapter {
  /** MVP는 단일 활성 클럽을 운영합니다. */
  getPrimaryClub(): Promise<Club>;
  getOperatingHours(clubId: string): Promise<OperatingHour[]>;

  getUser(id: string): Promise<User | null>;
  getProfile(userId: string): Promise<Profile | null>;

  /** 사용자가 현재 속한 활성 라운지(퇴장하지 않은 멤버십)를 반환합니다. */
  getActiveTableForUser(userId: string): Promise<Table | null>;
  getTable(id: string): Promise<Table | null>;
  /** 활성 멤버(퇴장하지 않은) 목록을 joined_at 순으로 반환합니다. */
  getActiveTableMembers(tableId: string): Promise<TableMember[]>;
  /** 라운지 활성 멤버들의 프로필 */
  getProfilesForTable(tableId: string): Promise<Profile[]>;
  getTablePreferences(tableId: string): Promise<TablePreferences | null>;

  /** 라운지 생성(호스트 입장). 이미 활성 라운지가 있으면 웨이터만 갱신해 반환. */
  createLounge(input: CreateLoungeInput): Promise<Table>;
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
}
