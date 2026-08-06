import type {
  ConsentInput,
  CreateLoungeInput,
  CreateUserInput,
  Credentials,
  DataAdapter,
  JoinResult,
  MatchCandidate,
  MatchPreferenceInput,
  ProfileInput,
} from "./adapter";
import type {
  AccountStatus,
  Booking,
  Club,
  Consent,
  ConversationEnergy,
  Gender,
  Invitation,
  OperatingHour,
  Profile,
  Table,
  TableMember,
  TablePreferences,
  TableState,
  User,
} from "./types";
import { hashPassword } from "@/lib/auth/password";
import { scoreCandidate } from "@/lib/match/score";

/**
 * 로컬 개발/데모용 인메모리 어댑터.
 * DATABASE_URL이 없을 때 사용되며, 데이터는 프로세스 재시작 시 초기화됩니다.
 * 초기값은 `supabase/seed.sql`의 클럽·데모 유저와 동일한 ID를 사용합니다.
 */

const CLUB_ID = "11111111-1111-1111-1111-111111111111";

/** 데모 계정 공용 비밀번호 — 로그인 화면에 안내합니다. */
export const DEMO_PASSWORD = "clubon1234";

/** 매치 제안 유효 시간. 설계서의 45초는 데모 조작 시간이 부족해 5분으로 둡니다. */
const BOOKING_TTL_MS = 5 * 60 * 1000;

interface Store {
  club: Club;
  operatingHours: OperatingHour[];
  users: Map<string, User>;
  passwords: Map<string, string>;
  profiles: Map<string, Profile>;
  consents: Consent[];
  tables: Map<string, Table>;
  tableMembers: TableMember[];
  tablePreferences: Map<string, TablePreferences>;
  invitations: Map<string, Invitation>;
  bookings: Booking[];
  inviteCodes: Set<string>;
  demoPasswordsReady: boolean;
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

// 매칭 후보가 될 데모 상대 라운지.
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

/** 로그인 없이 둘러볼 때 기본으로 사용하는 데모 회원 (하나). */
export const DEFAULT_GUEST_USER_ID = "aaaaaaaa-0000-0000-0000-000000000003";

/** 헤더의 데모 회원 전환기에 노출할 계정 목록. */
export const DEMO_ACCOUNTS = DEMO_USERS.map((d) => ({
  id: d.id,
  nickname: d.nickname,
  role: d.role,
}));

/** 시드로 만들어진 데모 라운지인지 — 상대측 자동 응답(데모) 판단에 사용합니다. */
export function isSeededDemoLounge(tableId: string): boolean {
  return CANDIDATE_LOUNGES.some((c) => c.id === tableId);
}

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
      birthYear: 1994,
      onboardingCompletedAt: nowIso,
      consentCompletedAt: nowIso,
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
      minTableSize: 1,
      maxTableSize: 4,
      minRoomParticipants: 2,
      isActive: true,
    },
    operatingHours,
    users,
    passwords: new Map(),
    profiles,
    consents: [],
    tables,
    tableMembers,
    tablePreferences,
    invitations: new Map(),
    bookings: [],
    inviteCodes,
    demoPasswordsReady: false,
  };
}

const globalStore = globalThis as unknown as {
  __clubonStore?: Store;
  __clubonDemoPw?: Promise<void>;
};
function store(): Store {
  if (!globalStore.__clubonStore) globalStore.__clubonStore = seed();
  return globalStore.__clubonStore;
}

/** 데모 계정 비밀번호 해시를 최초 1회 계산합니다(scrypt는 비동기). */
async function withDemoPasswords(): Promise<Store> {
  const s = store();
  if (s.demoPasswordsReady) return s;
  globalStore.__clubonDemoPw ??= (async () => {
    const hash = await hashPassword(DEMO_PASSWORD);
    for (const d of DEMO_USERS) {
      if (!s.passwords.has(d.id)) s.passwords.set(d.id, hash);
    }
    s.demoPasswordsReady = true;
  })();
  await globalStore.__clubonDemoPw;
  return s;
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
  return `L${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

/** 만료된 PENDING 제안을 EXPIRED로 정리합니다(읽기 시점 지연 평가). */
function expireStaleBookings(s: Store): void {
  const nowMs = Date.now();
  for (const b of s.bookings) {
    if (b.state !== "PENDING") continue;
    if (Date.parse(b.expiresAt) > nowMs) continue;
    b.state = "EXPIRED";
    for (const id of [b.requesterTableId, b.matchedTableId]) {
      const t = s.tables.get(id);
      if (t && t.state === "MATCH_PROPOSED") {
        t.state = "WAITING";
        t.updatedAt = new Date().toISOString();
      }
    }
  }
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

  /* ---------------------------------------------------------- 계정 · 인증 */

  async getUser(id: string): Promise<User | null> {
    const u = store().users.get(id);
    return u ? { ...u } : null;
  }

  async getCredentialsByEmail(email: string): Promise<Credentials | null> {
    const s = await withDemoPasswords();
    const normalized = email.trim().toLowerCase();
    const user = [...s.users.values()].find(
      (u) => u.email.toLowerCase() === normalized,
    );
    if (!user) return null;
    return { user: { ...user }, passwordHash: s.passwords.get(user.id) ?? null };
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const s = store();
    const nowIso = new Date().toISOString();
    const user: User = {
      id: globalThis.crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      role: "user",
      status: "active",
      adultConfirmedAt: null,
      birthYear: null,
      onboardingCompletedAt: null,
      consentCompletedAt: null,
      createdAt: nowIso,
    };
    s.users.set(user.id, user);
    s.passwords.set(user.id, input.passwordHash);
    return { ...user };
  }

  async confirmAdult(userId: string, birthYear: number): Promise<void> {
    const u = store().users.get(userId);
    if (!u) return;
    u.birthYear = birthYear;
    u.adultConfirmedAt = new Date().toISOString();
  }

  async saveConsents(
    userId: string,
    version: string,
    entries: ConsentInput[],
  ): Promise<void> {
    const s = store();
    const nowIso = new Date().toISOString();
    for (const entry of entries) {
      const existing = s.consents.find(
        (c) => c.userId === userId && c.consentType === entry.consentType,
      );
      const next: Consent = {
        userId,
        consentType: entry.consentType,
        version,
        granted: entry.granted,
        grantedAt: entry.granted ? nowIso : null,
        revokedAt: entry.granted ? null : nowIso,
      };
      if (existing) Object.assign(existing, next);
      else s.consents.push(next);
    }
  }

  async getConsents(userId: string): Promise<Consent[]> {
    return store()
      .consents.filter((c) => c.userId === userId)
      .map((c) => ({ ...c }));
  }

  async markConsentCompleted(userId: string): Promise<void> {
    const u = store().users.get(userId);
    if (u) u.consentCompletedAt = new Date().toISOString();
  }

  async markOnboardingCompleted(userId: string): Promise<void> {
    const u = store().users.get(userId);
    if (u) u.onboardingCompletedAt = new Date().toISOString();
  }

  /* -------------------------------------------------------------- 프로필 */

  async getProfile(userId: string): Promise<Profile | null> {
    const p = store().profiles.get(userId);
    return p ? structuredClone(p) : null;
  }

  async upsertProfile(userId: string, input: ProfileInput): Promise<Profile> {
    const s = store();
    const prev = s.profiles.get(userId);
    const profile: Profile = {
      userId,
      nickname: input.nickname,
      gender: input.gender,
      ageBand: input.ageBand,
      region: input.region,
      languages: input.languages,
      interests: input.interests,
      conversationStyle: input.conversationStyle,
      groupVibe: input.groupVibe,
      music: prev?.music ?? [],
      travel: prev?.travel ?? [],
      hobbies: prev?.hobbies ?? [],
      availability: prev?.availability ?? [],
      reputationScore: prev?.reputationScore ?? 70,
      completedSessions: prev?.completedSessions ?? 0,
      reportCount: prev?.reportCount ?? 0,
    };
    s.profiles.set(userId, profile);
    return structuredClone(profile);
  }

  /* -------------------------------------------------------------- 라운지 */

  async getActiveTableForUser(userId: string): Promise<Table | null> {
    const s = store();
    const membership = s.tableMembers.find(
      (m) => m.userId === userId && m.leftAt === null,
    );
    if (!membership) return null;
    const table = s.tables.get(membership.tableId);
    if (!table || table.closedAt) return null;
    return { ...table };
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

    // 이미 활성 라운지가 있으면 라운지 매니저만 갱신해 재사용.
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

  async joinTableByCode(userId: string, code: string): Promise<JoinResult> {
    const s = store();
    const normalized = code.trim().toUpperCase();
    const table = [...s.tables.values()].find(
      (t) => t.inviteCode.toUpperCase() === normalized,
    );
    if (!table) return { ok: false, reason: "not_found" };
    if (table.closedAt || table.state === "CLOSED") {
      return { ok: false, reason: "closed" };
    }

    const members = await this.getActiveTableMembers(table.id);
    if (members.some((m) => m.userId === userId)) {
      return { ok: false, reason: "already_member" };
    }

    const other = await this.getActiveTableForUser(userId);
    if (other) return { ok: false, reason: "in_other" };

    if (members.length >= table.maxSize) return { ok: false, reason: "full" };

    const nowIso = new Date().toISOString();
    s.tableMembers.push({
      id: `tm-${table.id}-${userId}`,
      tableId: table.id,
      userId,
      role: "member",
      joinedAt: nowIso,
      leftAt: null,
    });

    // 최소 인원을 채우면 FORMING → READY.
    if (table.state === "FORMING" && members.length + 1 >= s.club.minTableSize) {
      table.state = "READY";
    }
    table.updatedAt = nowIso;
    return { ok: true, table: { ...table } };
  }

  async addMemberToTable(tableId: string, userId: string): Promise<void> {
    const s = store();
    const table = s.tables.get(tableId);
    if (!table) return;

    const members = await this.getActiveTableMembers(tableId);
    if (members.length >= table.maxSize) return;
    if (members.some((m) => m.userId === userId)) return;
    if (await this.getActiveTableForUser(userId)) return;

    const nowIso = new Date().toISOString();
    s.tableMembers.push({
      id: `tm-${tableId}-${userId}`,
      tableId,
      userId,
      role: "member",
      joinedAt: nowIso,
      leftAt: null,
    });
    if (table.state === "FORMING" && members.length + 1 >= s.club.minTableSize) {
      table.state = "READY";
    }
    table.updatedAt = nowIso;
  }

  async leaveTable(userId: string, tableId: string): Promise<void> {
    const s = store();
    const nowIso = new Date().toISOString();
    const membership = s.tableMembers.find(
      (m) => m.tableId === tableId && m.userId === userId && m.leftAt === null,
    );
    if (!membership) return;
    membership.leftAt = nowIso;

    const table = s.tables.get(tableId);
    if (!table) return;

    const remaining = s.tableMembers
      .filter((m) => m.tableId === tableId && m.leftAt === null)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

    if (remaining.length === 0) {
      table.state = "CLOSED";
      table.closedAt = nowIso;
    } else if (table.hostUserId === userId) {
      // 호스트가 나가면 남은 최고참이 승계합니다.
      table.hostUserId = remaining[0].userId;
      remaining[0].role = "host";
      if (table.state === "READY" && remaining.length < s.club.minTableSize) {
        table.state = "FORMING";
      }
    }
    table.updatedAt = nowIso;
  }

  async setTableState(tableId: string, state: TableState): Promise<void> {
    const t = store().tables.get(tableId);
    if (!t) return;
    t.state = state;
    t.updatedAt = new Date().toISOString();
    if (state === "WAITING") t.waitingSince = t.updatedAt;
  }

  /* -------------------------------------------------------------- 매칭 */

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

      const candidateEnergy = s.tablePreferences.get(table.id)?.energy ?? null;
      const { eligible, score, reasons } = scoreCandidate(
        {
          desiredGender: pref.desiredGender,
          energy: pref.energy,
          interests: pref.interests,
          ageBands: pref.ageBands,
        },
        profiles,
        candidateEnergy,
      );
      if (!eligible) continue;

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
      state: "PENDING",
      requesterResponse: "pending",
      matchedResponse: "pending",
      expiresAt: new Date(Date.now() + BOOKING_TTL_MS).toISOString(),
      sessionId: null,
      createdAt: nowIso,
    };
    // 같은 라운지의 아직 살아있는 이전 제안은 대체합니다.
    s.bookings = s.bookings.filter(
      (b) => !(b.requesterTableId === requesterTableId && b.state === "PENDING"),
    );
    s.bookings.push(booking);

    for (const id of [requesterTableId, candidate.table.id]) {
      const t = s.tables.get(id);
      if (t) {
        t.state = "MATCH_PROPOSED";
        t.updatedAt = nowIso;
      }
    }
    return { ...booking };
  }

  async getBookingForTable(tableId: string): Promise<Booking | null> {
    const s = store();
    expireStaleBookings(s);
    const b = s.bookings
      .filter(
        (x) => x.requesterTableId === tableId || x.matchedTableId === tableId,
      )
      .at(-1);
    return b ? structuredClone(b) : null;
  }

  async getBooking(id: string): Promise<Booking | null> {
    const s = store();
    expireStaleBookings(s);
    const b = s.bookings.find((x) => x.id === id);
    return b ? structuredClone(b) : null;
  }

  async respondToBooking(
    bookingId: string,
    side: "requester" | "matched",
    response: "accepted" | "declined",
  ): Promise<Booking | null> {
    const s = store();
    expireStaleBookings(s);
    const b = s.bookings.find((x) => x.id === bookingId);
    if (!b || b.state !== "PENDING") return b ? structuredClone(b) : null;

    if (side === "requester") b.requesterResponse = response;
    else b.matchedResponse = response;

    const nowIso = new Date().toISOString();

    if (b.requesterResponse === "declined" || b.matchedResponse === "declined") {
      b.state = "DECLINED";
      for (const id of [b.requesterTableId, b.matchedTableId]) {
        const t = s.tables.get(id);
        if (t && t.state === "MATCH_PROPOSED") {
          t.state = "WAITING";
          t.waitingSince = nowIso;
          t.updatedAt = nowIso;
        }
      }
    } else if (
      b.requesterResponse === "accepted" &&
      b.matchedResponse === "accepted"
    ) {
      b.state = "ACCEPTED";
      for (const id of [b.requesterTableId, b.matchedTableId]) {
        const t = s.tables.get(id);
        if (t) {
          t.state = "MATCH_ACCEPTED";
          t.updatedAt = nowIso;
        }
      }
    }

    return structuredClone(b);
  }

  async attachSessionToBooking(
    bookingId: string,
    sessionId: string,
  ): Promise<void> {
    const s = store();
    const b = s.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    b.sessionId = sessionId;
    for (const id of [b.requesterTableId, b.matchedTableId]) {
      const t = s.tables.get(id);
      if (t) {
        t.state = "LIVE";
        t.updatedAt = new Date().toISOString();
      }
    }
  }

  /* -------------------------------------------------------------- 관리자 */

  async listUsers(limit = 100): Promise<User[]> {
    return [...store().users.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((u) => ({ ...u }));
  }

  async setUserStatus(userId: string, status: AccountStatus): Promise<void> {
    const u = store().users.get(userId);
    if (u) u.status = status;
  }

  async listTables(limit = 100): Promise<Table[]> {
    return [...store().tables.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((t) => ({ ...t }));
  }

  async listBookings(limit = 100): Promise<Booking[]> {
    const s = store();
    expireStaleBookings(s);
    return s.bookings
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((b) => structuredClone(b));
  }
}
