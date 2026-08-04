import type {
  CreateLoungeInput,
  DataAdapter,
  MatchCandidate,
  MatchPreferenceInput,
} from "./adapter";
import type {
  Booking,
  Club,
  ConversationEnergy,
  Gender,
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
 * 초기값은 `supabase/seed.sql`의 클럽·데모 유저와 동일한 ID를 사용합니다.
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
  bookings: Booking[];
  inviteCodes: Set<string>;
}

interface DemoUser {
  id: string;
  email: string;
  nickname: string;
  role: User["role"];
  gender: Gender;
  interests: string[];
  vibe: ConversationEnergy;
  ageBand: string;
}

const DEMO_USERS: DemoUser[] = [
  { id: "aaaaaaaa-0000-0000-0000-000000000001", email: "admin@clubon.test", nickname: "관리자", role: "admin", gender: "male", interests: ["와인", "여행", "재즈"], vibe: "relaxed", ageBand: "30대 초반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000002", email: "mod@clubon.test", nickname: "모더레이터", role: "moderator", gender: "male", interests: ["영화", "게임", "음악"], vibe: "lively", ageBand: "30대 초반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000003", email: "hana@clubon.test", nickname: "하나", role: "user", gender: "female", interests: ["여행", "음악", "영화"], vibe: "balanced", ageBand: "20대 후반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000004", email: "doyun@clubon.test", nickname: "도윤", role: "user", gender: "male", interests: ["음악", "재즈", "책"], vibe: "relaxed", ageBand: "30대 초반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000005", email: "seoyeon@clubon.test", nickname: "서연", role: "user", gender: "female", interests: ["여행", "미식", "사진"], vibe: "balanced", ageBand: "20대 후반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000006", email: "jiho@clubon.test", nickname: "지호", role: "user", gender: "male", interests: ["음악", "영화", "러닝"], vibe: "relaxed", ageBand: "30대 초반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000007", email: "minseo@clubon.test", nickname: "민서", role: "user", gender: "female", interests: ["여행", "전시", "카페"], vibe: "balanced", ageBand: "20대 후반" },
  { id: "aaaaaaaa-0000-0000-0000-000000000008", email: "taeyang@clubon.test", nickname: "태양", role: "user", gender: "male", interests: ["운동", "게임", "영화"], vibe: "lively", ageBand: "30대 초반" },
];

// 매칭 후보가 될 데모 상대 라운지. (현재 유저 '하나'를 제외한 데모 유저로 구성)
const CANDIDATE_LOUNGES: {
  id: string;
  name: string;
  energy: ConversationEnergy;
  memberIds: string[];
  inviteCode: string;
}[] = [
  {
    id: "cccccccc-0000-0000-0000-000000000001",
    name: "재즈 & 북",
    energy: "relaxed",
    memberIds: [
      "aaaaaaaa-0000-0000-0000-000000000004", // 도윤
      "aaaaaaaa-0000-0000-0000-000000000006", // 지호
    ],
    inviteCode: "JAZZ42",
  },
  {
    id: "cccccccc-0000-0000-0000-000000000002",
    name: "주말 여행자",
    energy: "balanced",
    memberIds: [
      "aaaaaaaa-0000-0000-0000-000000000005", // 서연
      "aaaaaaaa-0000-0000-0000-000000000007", // 민서
    ],
    inviteCode: "TRIP88",
  },
  {
    id: "cccccccc-0000-0000-0000-000000000003",
    name: "심야 플레이",
    energy: "lively",
    memberIds: [
      "aaaaaaaa-0000-0000-0000-000000000008", // 태양
      "aaaaaaaa-0000-0000-0000-000000000002", // 모더레이터
    ],
    inviteCode: "PLAY07",
  },
];

function seed(): Store {
  const nowIso = new Date().toISOString();
  const users = new Map<string, User>();
  const profiles = new Map<string, Profile>();

  for (const d of DEMO_USERS) {
    users.set(d.id, {
      id: d.id,
      email: d.email,
      role: d.role,
      status: "active",
      adultConfirmedAt: nowIso,
      birthYear: null,
      onboardingCompletedAt: nowIso,
      createdAt: nowIso,
    });
    profiles.set(d.id, {
      userId: d.id,
      nickname: d.nickname,
      gender: d.gender,
      ageBand: d.ageBand,
      region: "서울",
      languages: ["한국어", "English"],
      interests: d.interests,
      conversationStyle: null,
      groupVibe: d.vibe,
      music: [],
      travel: [],
      hobbies: [],
      availability: [],
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

  const tables = new Map<string, Table>();
  const tableMembers: TableMember[] = [];
  const tablePreferences = new Map<string, TablePreferences>();
  const inviteCodes = new Set<string>();

  for (const c of CANDIDATE_LOUNGES) {
    tables.set(c.id, {
      id: c.id,
      clubId: CLUB_ID,
      hostUserId: c.memberIds[0],
      name: c.name,
      state: "WAITING",
      maxSize: 4,
      inviteCode: c.inviteCode,
      waiterId: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      waitingSince: nowIso,
      closedAt: null,
    });
    inviteCodes.add(c.inviteCode);
    c.memberIds.forEach((uid, i) => {
      tableMembers.push({
        id: `tm-${c.id}-${uid}`,
        tableId: c.id,
        userId: uid,
        role: i === 0 ? "host" : "member",
        joinedAt: nowIso,
        leftAt: null,
      });
    });
    // 후보 라운지의 스타일(선호) — 매칭 시 energy 비교에 사용
    tablePreferences.set(c.id, {
      tableId: c.id,
      desiredGender: "any",
      ageBands: [],
      languages: [],
      interests: [],
      energy: c.energy,
      topicFocus: [],
      regionPreference: null,
    });
  }

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
    tables,
    tableMembers,
    tablePreferences,
    invitations: new Map(),
    bookings: [],
    inviteCodes,
  };
}

const globalStore = globalThis as unknown as { __clubonStore?: Store };
function store(): Store {
  if (!globalStore.__clubonStore) globalStore.__clubonStore = seed();
  return globalStore.__clubonStore;
}

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateInviteCode(existing: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const bytes = new Uint8Array(6);
    globalThis.crypto.getRandomValues(bytes);
    let code = "";
    for (const b of bytes) code += INVITE_ALPHABET[b % INVITE_ALPHABET.length];
    if (!existing.has(code)) return code;
  }
  // 극히 드문 충돌 폴백
  return `L${Date.now().toString(36).toUpperCase().slice(-5)}`;
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

  async getProfilesForTable(tableId: string): Promise<Profile[]> {
    const members = await this.getActiveTableMembers(tableId);
    const s = store();
    return members
      .map((m) => s.profiles.get(m.userId))
      .filter((p): p is Profile => !!p)
      .map((p) => structuredClone(p));
  }

  async getTablePreferences(tableId: string): Promise<TablePreferences | null> {
    const p = store().tablePreferences.get(tableId);
    return p ? structuredClone(p) : null;
  }

  async createLounge(input: CreateLoungeInput): Promise<Table> {
    const s = store();
    const nowIso = new Date().toISOString();

    // 이미 활성 라운지가 있으면 웨이터만 갱신해 재사용.
    const existing = await this.getActiveTableForUser(input.userId);
    if (existing) {
      const t = s.tables.get(existing.id)!;
      t.waiterId = input.waiterId;
      t.updatedAt = nowIso;
      return { ...t };
    }

    const id = globalThis.crypto.randomUUID();
    const inviteCode = generateInviteCode(s.inviteCodes);
    s.inviteCodes.add(inviteCode);

    const table: Table = {
      id,
      clubId: CLUB_ID,
      hostUserId: input.userId,
      name: input.name,
      state: "FORMING",
      maxSize: 4,
      inviteCode,
      waiterId: input.waiterId,
      createdAt: nowIso,
      updatedAt: nowIso,
      waitingSince: null,
      closedAt: null,
    };
    s.tables.set(id, table);
    s.tableMembers.push({
      id: `tm-${id}-${input.userId}`,
      tableId: id,
      userId: input.userId,
      role: "host",
      joinedAt: nowIso,
      leftAt: null,
    });
    s.tablePreferences.set(id, {
      tableId: id,
      desiredGender: "any",
      ageBands: [],
      languages: [],
      interests: [],
      energy: "balanced",
      topicFocus: [],
      regionPreference: null,
    });
    return { ...table };
  }

  async setMatchPreference(
    tableId: string,
    pref: MatchPreferenceInput,
  ): Promise<void> {
    const s = store();
    const table = s.tables.get(tableId);
    if (!table) throw new Error("라운지를 찾을 수 없습니다.");

    const prev = s.tablePreferences.get(tableId);
    s.tablePreferences.set(tableId, {
      tableId,
      desiredGender: pref.desiredGender,
      ageBands: pref.ageBands,
      languages: prev?.languages ?? [],
      interests: pref.interests,
      energy: pref.energy,
      topicFocus: prev?.topicFocus ?? [],
      regionPreference: prev?.regionPreference ?? null,
    });

    table.state = "WAITING";
    table.waitingSince = new Date().toISOString();
    table.updatedAt = table.waitingSince;
  }

  async findBestMatch(tableId: string): Promise<MatchCandidate | null> {
    const s = store();
    const pref = s.tablePreferences.get(tableId);
    if (!pref) return null;

    const myMemberIds = new Set(
      s.tableMembers
        .filter((m) => m.tableId === tableId && m.leftAt === null)
        .map((m) => m.userId),
    );

    let best: MatchCandidate | null = null;

    for (const table of s.tables.values()) {
      if (table.id === tableId) continue;
      if (table.state !== "WAITING" && table.state !== "READY") continue;
      if (table.closedAt) continue;

      const profiles = await this.getProfilesForTable(table.id);
      if (profiles.length === 0) continue;
      // 내가 이미 속한 라운지 제외
      if (profiles.some((p) => myMemberIds.has(p.userId))) continue;

      const genders = new Set(profiles.map((p) => p.gender));
      // 성별 선호가 명확하면 해당 성별이 있는 라운지만 후보로.
      if (pref.desiredGender !== "any" && !genders.has(pref.desiredGender)) {
        continue;
      }

      const interests = new Set(profiles.flatMap((p) => p.interests));
      const ageBands = new Set(profiles.map((p) => p.ageBand));
      const candidateEnergy = s.tablePreferences.get(table.id)?.energy;

      let score = 0;
      const reasons: string[] = [];

      if (pref.desiredGender !== "any") {
        score += 3;
        reasons.push(
          `원하는 성별(${pref.desiredGender === "female" ? "여성" : "남성"}) 일치`,
        );
      }

      const commonInterests = pref.interests.filter((i) => interests.has(i));
      if (commonInterests.length > 0) {
        score += commonInterests.length * 2;
        reasons.push(`공통 관심사: ${commonInterests.join(", ")}`);
      }

      if (candidateEnergy && candidateEnergy === pref.energy) {
        score += 2;
        reasons.push("대화 분위기 일치");
      }

      const commonAges = pref.ageBands.filter((a) => ageBands.has(a));
      if (commonAges.length > 0) {
        score += commonAges.length;
        reasons.push(`연령대: ${commonAges.join(", ")}`);
      }

      if (score <= 0) continue;

      const candidate: MatchCandidate = {
        table: { ...table },
        score,
        reasons,
        profiles,
      };

      if (
        !best ||
        candidate.score > best.score ||
        (candidate.score === best.score &&
          (candidate.table.waitingSince ?? "") < (best.table.waitingSince ?? ""))
      ) {
        best = candidate;
      }
    }

    return best;
  }

  async createBooking(
    requesterTableId: string,
    candidate: MatchCandidate,
    waiterId: string | null,
  ): Promise<Booking> {
    const s = store();
    const nowIso = new Date().toISOString();
    const booking: Booking = {
      id: globalThis.crypto.randomUUID(),
      requesterTableId,
      matchedTableId: candidate.table.id,
      waiterId,
      score: candidate.score,
      reasons: candidate.reasons,
      createdAt: nowIso,
    };
    // 같은 라운지의 이전 부킹은 대체합니다.
    s.bookings = s.bookings.filter((b) => b.requesterTableId !== requesterTableId);
    s.bookings.push(booking);

    const table = s.tables.get(requesterTableId);
    if (table) {
      table.state = "MATCH_PROPOSED";
      table.updatedAt = nowIso;
    }
    return { ...booking };
  }

  async getBookingForTable(tableId: string): Promise<Booking | null> {
    const b = store()
      .bookings.filter((x) => x.requesterTableId === tableId)
      .at(-1);
    return b ? { ...b } : null;
  }
}
