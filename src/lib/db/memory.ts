import type {
  ConsentInput,
  CreateLoungeInput,
  CreateUserInput,
  Credentials,
  DataAdapter,
  MatchCandidate,
  MatchPreferenceInput,
  ExtendOutcome,
  ProfileInput,
  RecordPurchaseInput,
  RecordPurchaseResult,
  StartUsageResult,
} from "./adapter";
import type {
  AccountStatus,
  Booking,
  Club,
  Consent,
  ConversationEnergy,
  Gender,
  Invitation,
  LoungeSessionStatus,
  LoungeUsage,
  OperatingHour,
  PassWallet,
  PaymentRecord,
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
  /** userId → Google sub. 비밀번호와 마찬가지로 User 밖에 따로 둡니다. */
  googleSubs: Map<string, string>;
  profiles: Map<string, Profile>;
  consents: Consent[];
  tables: Map<string, Table>;
  tableMembers: TableMember[];
  tablePreferences: Map<string, TablePreferences>;
  invitations: Map<string, Invitation>;
  bookings: Booking[];
  inviteCodes: Set<string>;
  demoPasswordsReady: boolean;
  wallets: Map<string, PassWallet>;
  payments: Map<string, PaymentRecord>;
  /** sessionId → 방의 시간 기록 (방 하나당 1행) */
  usages: Map<string, LoungeUsage>;
  /** `${sessionId}:${userId}` — 매치 횟수를 쓴 사람. 사람마다 1회입니다. */
  matchUses: Set<string>;
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

/** 지갑이 없으면 0으로 채운 새 지갑을 만들어 돌려줍니다(참조를 그대로 반환). */
function ensureWallet(userId: string): PassWallet {
  const s = store();
  let w = s.wallets.get(userId);
  if (!w) {
    w = {
      userId,
      remainingMatches: 0,
      totalPurchasedMatches: 0,
      updatedAt: new Date().toISOString(),
    };
    s.wallets.set(userId, w);
  }
  return w;
}

/**
 * 방의 만료 시각을 늘립니다(Postgres 어댑터의 `extendUsage`와 같은 규칙).
 *
 * 기준은 "남은 시간이 있으면 그 뒤, 없으면 지금부터"입니다. 결제 승인이 늦게
 * 도착해 그사이 만료된 경우에도 산 시간을 온전히 받습니다. 호스트가 직접 끝낸
 * 방(`ended`)만은 되살리지 않습니다.
 */
function extendUsage(extend: {
  sessionId: string;
  minutes: number;
}): ExtendOutcome {
  const usage = store().usages.get(extend.sessionId);
  if (!usage) return { ok: false, reason: "not_found" };
  if (usage.sessionStatus === "ended") return { ok: false, reason: "closed" };

  const base = Math.max(Date.parse(usage.expiresAt), Date.now());
  usage.expiresAt = new Date(base + extend.minutes * 60_000).toISOString();
  usage.extendedMinutes += extend.minutes;
  usage.sessionStatus = "active";
  usage.endedAt = null;

  return { ok: true, expiresAt: usage.expiresAt };
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
      gender: d.gender,
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
    opensAt: "00:00",
    closesAt: "00:00",
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
      // 데모 라운지에는 지역을 두지 않습니다. 아래 findBestMatch가 시드
      // 라운지만 지역 필터에서 빼 주므로, 어느 지역을 골라도 데모가 돕니다.
      regionCode: null,
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

  // 데모 지갑 — 로그인 없이 둘러보는 미리보기 흐름이 결제 벽에 막히지 않도록
  // 시드 회원에게만 이용권을 넣어 둡니다. 데모 계정과 같은 성격의 시드
  // 데이터이며, DATABASE_URL이 연결된 실제 배포에는 존재하지 않습니다.
  // (결제를 우회하는 코드 경로가 아니라, 잔액이 채워진 상태로 시작할 뿐입니다.)
  const wallets = new Map<string, PassWallet>();
  for (const d of DEMO_USERS) {
    wallets.set(d.id, {
      userId: d.id,
      remainingMatches: 5,
      totalPurchasedMatches: 5,
      updatedAt: nowIso,
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
    googleSubs: new Map(),
    profiles,
    consents: [],
    tables,
    tableMembers,
    tablePreferences,
    invitations: new Map(),
    bookings: [],
    inviteCodes,
    demoPasswordsReady: false,
    wallets,
    payments: new Map(),
    usages: new Map(),
    matchUses: new Set(),
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

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const user = [...store().users.values()].find(
      (u) => u.email.toLowerCase() === normalized,
    );
    return user ? { ...user } : null;
  }

  async getUserByGoogleSub(sub: string): Promise<User | null> {
    const s = store();
    for (const [userId, stored] of s.googleSubs) {
      if (stored === sub) {
        const user = s.users.get(userId);
        return user ? { ...user } : null;
      }
    }
    return null;
  }

  async linkGoogleAccount(userId: string, sub: string): Promise<void> {
    store().googleSubs.set(userId, sub);
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    const u = store().users.get(userId);
    if (!u) return;
    u.email = email.trim().toLowerCase();
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

  async setGenderIfUnset(userId: string, gender: Gender): Promise<void> {
    const u = store().users.get(userId);
    if (u && u.gender === null) u.gender = gender;
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
      gender: input.gender ?? null,
      onboardingCompletedAt: null,
      consentCompletedAt: null,
      createdAt: nowIso,
    };
    s.users.set(user.id, user);
    // 비밀번호 없는 가입(Google 로그인)은 해시를 남기지 않습니다.
    // 이후 이메일/비밀번호 로그인 시도는 해시가 없어 자동으로 실패합니다.
    if (input.passwordHash) s.passwords.set(user.id, input.passwordHash);
    if (input.googleSub) s.googleSubs.set(user.id, input.googleSub);
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
      t.regionCode = input.regionCode;
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
      regionCode: input.regionCode,
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

    // 매칭은 같은 지역 안에서만 이뤄집니다.
    const myRegion = s.tables.get(tableId)?.regionCode ?? null;
    if (!myRegion) return null;

    let best: MatchCandidate | null = null;

    for (const table of s.tables.values()) {
      if (table.id === tableId) continue;
      if (table.state !== "WAITING" && table.state !== "READY") continue;
      if (table.closedAt) continue;
      // 시드 데모 라운지는 지역 필터에서 뺍니다 — 어느 지역을 고르든 혼자서
      // 전체 흐름을 확인할 수 있어야 하기 때문입니다(데모 전용).
      if (
        myRegion !== "global" &&
        table.regionCode !== "global" &&
        table.regionCode !== myRegion
      ) {
        continue;
      }

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

  /* --------------------------------------------------- 이용권 지갑 · 결제 */

  async getWallet(userId: string): Promise<PassWallet> {
    return { ...ensureWallet(userId) };
  }

  async recordPurchase(
    input: RecordPurchaseInput,
  ): Promise<RecordPurchaseResult> {
    const s = store();
    // 멱등: 같은 주문이 다시 들어오면 잔액도 시간도 건드리지 않습니다.
    if (s.payments.has(input.paymentId)) {
      return { applied: false, extend: null };
    }

    const nowIso = new Date().toISOString();
    s.payments.set(input.paymentId, {
      paymentId: input.paymentId,
      userId: input.userId,
      productId: input.productId,
      planCode: input.planCode,
      amount: input.amount,
      currency: input.currency,
      purchasedMatches: input.purchasedMatches,
      paymentStatus: "paid",
      createdAt: nowIso,
      refundedAt: null,
    });

    const w = ensureWallet(input.userId);
    w.remainingMatches += input.purchasedMatches;
    w.totalPurchasedMatches += input.purchasedMatches;
    w.updatedAt = nowIso;

    // 시간 연장 상품은 횟수 대신 이 방의 만료 시각을 늘립니다.
    const extend = input.extend ? extendUsage(input.extend) : null;

    return { applied: true, extend };
  }

  async refundPayment(
    paymentId: string,
  ): Promise<{ applied: boolean; reclaimed: number }> {
    const s = store();
    const payment = s.payments.get(paymentId);
    if (!payment || payment.paymentStatus === "refunded") {
      return { applied: false, reclaimed: 0 };
    }

    const nowIso = new Date().toISOString();
    payment.paymentStatus = "refunded";
    payment.refundedAt = nowIso;

    // 이미 써 버린 이용권은 되돌릴 수 없으므로 남은 만큼만 회수합니다.
    const w = ensureWallet(payment.userId);
    const reclaimed = Math.min(w.remainingMatches, payment.purchasedMatches);
    w.remainingMatches -= reclaimed;
    w.updatedAt = nowIso;

    return { applied: true, reclaimed };
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const p = store().payments.get(paymentId);
    return p ? { ...p } : null;
  }

  async listPaymentsForUser(
    userId: string,
    limit = 50,
  ): Promise<PaymentRecord[]> {
    return [...store().payments.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((p) => ({ ...p }));
  }

  async adjustMatches(userId: string, delta: number): Promise<PassWallet> {
    const w = ensureWallet(userId);
    w.remainingMatches = Math.max(0, w.remainingMatches + delta);
    if (delta > 0) w.totalPurchasedMatches += delta;
    w.updatedAt = new Date().toISOString();
    return { ...w };
  }

  /* ------------------------------------------------------- 영상방 시간 기록 */

  /**
   * 방의 시간은 방 하나당 1행, 매치 횟수 차감은 사람마다 1회입니다
   * (Postgres 어댑터와 같은 규칙).
   */
  async startLoungeUsage(input: {
    sessionId: string;
    userId: string;
    ownerUserId: string;
    roomId: string;
    minutes: number;
  }): Promise<StartUsageResult> {
    const s = store();

    // 멱등: 이 사람이 이 방에서 이미 썼다면 다시 빼지 않습니다(재접속).
    const useKey = `${input.sessionId}:${input.userId}`;
    const alreadyUsed = s.matchUses.has(useKey);

    const w = ensureWallet(input.userId);
    if (!alreadyUsed && w.remainingMatches < 1) {
      return { ok: false, reason: "no_matches" };
    }

    if (!alreadyUsed) {
      w.remainingMatches -= 1;
      w.updatedAt = new Date().toISOString();
      s.matchUses.add(useKey);
    }

    // 방의 시간 기록은 먼저 들어온 사람이 만들고 나머지는 그대로 씁니다.
    let usage = s.usages.get(input.sessionId);
    if (!usage) {
      const startedAt = new Date();
      usage = {
        sessionId: input.sessionId,
        ownerUserId: input.ownerUserId,
        roomId: input.roomId,
        startedAt: startedAt.toISOString(),
        expiresAt: new Date(
          startedAt.getTime() + input.minutes * 60_000,
        ).toISOString(),
        endedAt: null,
        extendedMinutes: 0,
        sessionStatus: "active",
      };
      s.usages.set(input.sessionId, usage);
    }

    return { ok: true, usage: { ...usage }, charged: !alreadyUsed };
  }

  async getLoungeUsage(sessionId: string): Promise<LoungeUsage | null> {
    const u = store().usages.get(sessionId);
    return u ? { ...u } : null;
  }

  /**
   * `expired`는 진행 중인 방에만, `ended`는 이미 만료된 방에도 찍습니다.
   * 시간이 끝난 뒤 호스트가 닫은 방이 뒤늦은 연장 결제로 되살아나지 않게
   * 하려는 것입니다(Postgres 어댑터와 같은 규칙).
   */
  async endLoungeUsage(
    sessionId: string,
    status: LoungeSessionStatus,
  ): Promise<void> {
    const u = store().usages.get(sessionId);
    if (!u || u.sessionStatus === "ended") return;
    if (u.sessionStatus !== "active" && status !== "ended") return;
    u.sessionStatus = status;
    u.endedAt = new Date().toISOString();
  }

  async listUsagesForUser(userId: string, limit = 50): Promise<LoungeUsage[]> {
    return [...store().usages.values()]
      .filter((u) => u.ownerUserId === userId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit)
      .map((u) => ({ ...u }));
  }

  /* -------------------------------------------------------------- 관리자 */

  async listUsers(limit = 100): Promise<User[]> {
    return [...store().users.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((u) => ({ ...u }));
  }

  async listPayments(limit = 200): Promise<PaymentRecord[]> {
    return [...store().payments.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((p) => ({ ...p }));
  }

  async listUsages(limit = 200): Promise<LoungeUsage[]> {
    return [...store().usages.values()]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit)
      .map((u) => ({ ...u }));
  }

  async listWallets(limit = 200): Promise<PassWallet[]> {
    return [...store().wallets.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((w) => ({ ...w }));
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
