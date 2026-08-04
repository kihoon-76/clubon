import type {
  Club,
  OperatingHour,
  Profile,
  Table,
  TableMember,
  User,
} from "./types";

/**
 * 데이터 접근 계약. 앱 코드는 이 인터페이스에만 의존하며,
 * 환경에 따라 DevMemoryAdapter 또는 SupabaseAdapter로 교체됩니다.
 *
 * 메서드는 기능 구현이 진행되며 점진적으로 확장됩니다.
 */
export interface DataAdapter {
  /** MVP는 단일 활성 클럽을 운영합니다. */
  getPrimaryClub(): Promise<Club>;
  getOperatingHours(clubId: string): Promise<OperatingHour[]>;

  getUser(id: string): Promise<User | null>;
  getProfile(userId: string): Promise<Profile | null>;

  /** 사용자가 현재 속한 활성 테이블(퇴장하지 않은 멤버십)을 반환합니다. */
  getActiveTableForUser(userId: string): Promise<Table | null>;
  getTable(id: string): Promise<Table | null>;
  /** 활성 멤버(퇴장하지 않은) 목록을 joined_at 순으로 반환합니다. */
  getActiveTableMembers(tableId: string): Promise<TableMember[]>;
}
