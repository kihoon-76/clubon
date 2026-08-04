import type { DataAdapter } from "./adapter";
import type {
  Club,
  Invitation,
  OperatingHour,
  Profile,
  Table,
  TableMember,
  TablePreferences,
  User,
} from "./types";

/**
 * 로컬 개발/데모용 인메모리 어댑터.
 * Supabase 환경변수가 없을 때 사용되며, 데이터는 프로세스 재시작 시 초기화됩니다.
 * 초기값은 `supabase/seed.sql`과 동일한 ID·닉네임을 사용합니다.
 */

const CLUB_ID = "11111111-1111-1111-1111-111111111111";

interface Store {
  club: Club;
  operatingHours: OperatingHour[];
  users: Map<string, User>;
  profiles: Map<string, Profile>;
  tables: Map<string, Table>;
  tableMembers: TableMember[];
  tablePreferences: Map<string, TablePreferences>;
  invitations: Map<string, Invitation>;
}

const DEMO_USERS: {
  id: string;
  email: string;
  nickname: string;
  role: User["role"];
  birthYear: number;
}[] = [
  { id: "aaaaaaaa-0000-0000-0000-000000000001", email: "admin@clubon.test", nickname: "관리자", role: "admin", birthYear: 1988 },
  { id: "aaaaaaaa-0000-0000-0000-000000000002", email: "mod@clubon.test", nickname: "모더레이터", role: "moderator", birthYear: 1990 },
  { id: "aaaaaaaa-0000-0000-0000-000000000003", email: "hana@clubon.test", nickname: "하나", role: "user", birthYear: 1994 },
  { id: "aaaaaaaa-0000-0000-0000-000000000004", email: "doyun@clubon.test", nickname: "도윤", role: "user", birthYear: 1992 },
  { id: "aaaaaaaa-0000-0000-0000-000000000005", email: "seoyeon@clubon.test", nickname: "서연", role: "user", birthYear: 1996 },
  { id: "aaaaaaaa-0000-0000-0000-000000000006", email: "jiho@clubon.test", nickname: "지호", role: "user", birthYear: 1991 },
  { id: "aaaaaaaa-0000-0000-0000-000000000007", email: "minseo@clubon.test", nickname: "민서", role: "user", birthYear: 1995 },
  { id: "aaaaaaaa-0000-0000-0000-000000000008", email: "taeyang@clubon.test", nickname: "태양", role: "user", birthYear: 1989 },
];

function seed(): Store {
  const now = new Date().toISOString();
  const users = new Map<string, User>();
  const profiles = new Map<string, Profile>();

  for (const d of DEMO_USERS) {
    users.set(d.id, {
      id: d.id,
      email: d.email,
      role: d.role,
      status: "active",
      adultConfirmedAt: now,
      birthYear: d.birthYear,
      onboardingCompletedAt: now,
      createdAt: now,
    });
    profiles.set(d.id, {
      userId: d.id,
      nickname: d.nickname,
      ageBand: d.birthYear >= 1995 ? "20대 후반" : "30대 초반",
      region: "서울",
      languages: ["한국어", "English"],
      interests: ["여행", "음악", "영화"],
      conversationStyle: "차분하게 듣는 편",
      groupVibe: "balanced",
      music: ["재즈", "인디"],
      travel: ["도쿄", "리스본"],
      hobbies: ["러닝", "전시 관람"],
      availability: ["평일 저녁", "주말 밤"],
      reputationScore: 70,
      completedSessions: 0,
      reportCount: 0,
    });
  }

  const operatingHours: OperatingHour[] = Array.from({ length: 7 }, (_, day) => ({
    clubId: CLUB_ID,
    dayOfWeek: day,
    opensAt: "18:00",
    closesAt: "04:00",
    closesNextDay: true,
  }));

  return {
    club: {
      id: CLUB_ID,
      name: "ClubOn Seoul",
      timezone: "Asia/Seoul",
      minTableSize: 2,
      maxTableSize: 4,
      minRoomParticipants: 4,
      isActive: true,
    },
    operatingHours,
    users,
    profiles,
    tables: new Map(),
    tableMembers: [],
    tablePreferences: new Map(),
    invitations: new Map(),
  };
}

/**
 * dev 서버의 HMR로 모듈이 재평가돼도 상태가 유지되도록 globalThis에 보관합니다.
 */
const globalStore = globalThis as unknown as { __clubonStore?: Store };
function store(): Store {
  if (!globalStore.__clubonStore) globalStore.__clubonStore = seed();
  return globalStore.__clubonStore;
}

export class DevMemoryAdapter implements DataAdapter {
  async getPrimaryClub(): Promise<Club> {
    return structuredClone(store().club);
  }

  async getOperatingHours(clubId: string): Promise<OperatingHour[]> {
    return store()
      .operatingHours.filter((h) => h.clubId === clubId)
      .map((h) => ({ ...h }));
  }

  async getUser(id: string): Promise<User | null> {
    const u = store().users.get(id);
    return u ? { ...u } : null;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const p = store().profiles.get(userId);
    return p ? structuredClone(p) : null;
  }

  async getActiveTableForUser(userId: string): Promise<Table | null> {
    const membership = store().tableMembers.find(
      (m) => m.userId === userId && m.leftAt === null,
    );
    if (!membership) return null;
    return this.getTable(membership.tableId);
  }

  async getTable(id: string): Promise<Table | null> {
    const t = store().tables.get(id);
    return t ? { ...t } : null;
  }

  async getActiveTableMembers(tableId: string): Promise<TableMember[]> {
    return store()
      .tableMembers.filter((m) => m.tableId === tableId && m.leftAt === null)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
      .map((m) => ({ ...m }));
  }
}
