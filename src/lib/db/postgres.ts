import postgres from "postgres";

import type {
  ConsentInput,
  CreateLoungeInput,
  CreateUserInput,
  Credentials,
  DataAdapter,
  JoinResult,
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
import { scoreCandidate } from "@/lib/match/score";

/**
 * Supabase(또는 임의의 PostgreSQL) 데이터 어댑터.
 * DATABASE_URL(Postgres 접속 문자열)이 설정되면 사용됩니다.
 *
 * 상태를 영구 DB에 저장하므로 서버리스/엣지 배포에서도 라운지·부킹이 유지됩니다.
 */

type Sql = ReturnType<typeof postgres>;
type Tx = postgres.TransactionSql;
const globalSql = globalThis as unknown as { __clubonSql?: Sql };

function client(): Sql {
  if (!globalSql.__clubonSql) {
    const url = process.env.DATABASE_URL as string;
    const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
    globalSql.__clubonSql = postgres(url, {
      ssl: isLocal ? false : "require",
      prepare: false, // Supabase 트랜잭션 풀러(pgbouncer) 호환
      max: 5,
      idle_timeout: 20,
    });
  }
  return globalSql.__clubonSql;
}

/* ------------------------------------------------------------------ mappers */

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}
function isoOrNull(v: unknown): string | null {
  if (v == null) return null;
  return iso(v);
}

type Row = Record<string, unknown>;

function mapClub(r: Row): Club {
  return {
    id: r.id as string,
    name: r.name as string,
    timezone: r.timezone as string,
    minTableSize: Number(r.min_table_size),
    maxTableSize: Number(r.max_table_size),
    minRoomParticipants: Number(r.min_room_participants),
    isActive: r.is_active as boolean,
  };
}

function mapOperatingHour(r: Row): OperatingHour {
  const t = (v: unknown) => String(v).slice(0, 5); // "18:00:00" -> "18:00"
  return {
    clubId: r.club_id as string,
    dayOfWeek: Number(r.day_of_week),
    opensAt: t(r.opens_at),
    closesAt: t(r.closes_at),
    closesNextDay: r.closes_next_day as boolean,
  };
}

function mapProfile(r: Row): Profile {
  return {
    userId: r.user_id as string,
    nickname: r.nickname as string,
    gender: r.gender as Profile["gender"],
    ageBand: r.age_band as string,
    region: (r.region as string) ?? null,
    languages: (r.languages as string[]) ?? [],
    interests: (r.interests as string[]) ?? [],
    conversationStyle: (r.conversation_style as string) ?? null,
    groupVibe: r.group_vibe as ConversationEnergy,
    music: (r.music as string[]) ?? [],
    travel: (r.travel as string[]) ?? [],
    hobbies: (r.hobbies as string[]) ?? [],
    availability: (r.availability as string[]) ?? [],
    reputationScore: Number(r.reputation_score),
    completedSessions: Number(r.completed_sessions),
    reportCount: Number(r.report_count),
  };
}

function mapTable(r: Row): Table {
  return {
    id: r.id as string,
    clubId: r.club_id as string,
    hostUserId: r.host_user_id as string,
    name: r.name as string,
    state: r.state as Table["state"],
    maxSize: Number(r.max_size),
    inviteCode: r.invite_code as string,
    waiterId: (r.waiter_id as string) ?? null,
    regionCode: (r.region_code as string) ?? null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    waitingSince: isoOrNull(r.waiting_since),
    closedAt: isoOrNull(r.closed_at),
  };
}

function mapMember(r: Row): TableMember {
  return {
    id: r.id as string,
    tableId: r.table_id as string,
    userId: r.user_id as string,
    role: r.role as TableMember["role"],
    joinedAt: iso(r.joined_at),
    leftAt: isoOrNull(r.left_at),
  };
}

function mapPrefs(r: Row): TablePreferences {
  return {
    tableId: r.table_id as string,
    desiredGender: r.desired_gender as TablePreferences["desiredGender"],
    ageBands: (r.age_bands as string[]) ?? [],
    languages: (r.languages as string[]) ?? [],
    interests: (r.interests as string[]) ?? [],
    energy: r.energy as ConversationEnergy,
    topicFocus: (r.topic_focus as string[]) ?? [],
    regionPreference: (r.region_preference as string) ?? null,
  };
}

function mapBooking(r: Row): Booking {
  return {
    id: r.id as string,
    requesterTableId: r.requester_table_id as string,
    matchedTableId: r.matched_table_id as string,
    waiterId: (r.waiter_id as string) ?? null,
    score: Number(r.score),
    reasons: (r.reasons as Booking["reasons"]) ?? [],
    state: r.state as Booking["state"],
    requesterResponse: r.requester_response as Booking["requesterResponse"],
    matchedResponse: r.matched_response as Booking["matchedResponse"],
    expiresAt: iso(r.expires_at),
    sessionId: (r.session_id as string) ?? null,
    createdAt: iso(r.created_at),
  };
}

function mapUser(r: Row): User {
  return {
    id: r.id as string,
    email: r.email as string,
    role: r.role as User["role"],
    status: r.status as User["status"],
    adultConfirmedAt: isoOrNull(r.adult_confirmed_at),
    birthYear: r.birth_year == null ? null : Number(r.birth_year),
    gender: (r.gender as User["gender"]) ?? null,
    onboardingCompletedAt: isoOrNull(r.onboarding_completed_at),
    consentCompletedAt: isoOrNull(r.consent_completed_at),
    createdAt: iso(r.created_at),
  };
}

function mapWallet(r: Row): PassWallet {
  return {
    userId: r.user_id as string,
    remainingMatches: Number(r.remaining_matches),
    totalPurchasedMatches: Number(r.total_purchased_matches),
    updatedAt: iso(r.updated_at),
  };
}

function mapPayment(r: Row): PaymentRecord {
  return {
    paymentId: r.payment_id as string,
    userId: r.user_id as string,
    productId: r.product_id as string,
    planCode: r.plan_code as string,
    amount: Number(r.amount),
    currency: r.currency as string,
    purchasedMatches: Number(r.purchased_matches),
    paymentStatus: r.payment_status as PaymentRecord["paymentStatus"],
    createdAt: iso(r.created_at),
    refundedAt: isoOrNull(r.refunded_at),
  };
}

function mapUsage(r: Row): LoungeUsage {
  return {
    sessionId: r.session_id as string,
    ownerUserId: r.user_id as string,
    roomId: r.room_id as string,
    startedAt: iso(r.started_at),
    expiresAt: iso(r.expires_at),
    endedAt: isoOrNull(r.ended_at),
    extendedMinutes: Number(r.extended_minutes ?? 0),
    sessionStatus: r.session_status as LoungeUsage["sessionStatus"],
  };
}

function mapConsent(r: Row): Consent {
  return {
    userId: r.user_id as string,
    consentType: r.consent_type as Consent["consentType"],
    version: r.version as string,
    granted: r.granted as boolean,
    grantedAt: isoOrNull(r.granted_at),
    revokedAt: isoOrNull(r.revoked_at),
  };
}

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function inviteCode(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += INVITE_ALPHABET[b % INVITE_ALPHABET.length];
  return code;
}

/**
 * 방의 만료 시각을 늘립니다. 결제 트랜잭션 안에서만 호출됩니다.
 *
 * 기준 시각은 `greatest(expires_at, now())`입니다. 아직 시간이 남아 있으면 그
 * 뒤에 이어 붙고, 이미 지났으면 지금부터 셉니다 — 결제 승인이 몇십 초 늦게
 * 도착해 그사이 만료된 경우에도 산 만큼을 온전히 받게 하려는 것입니다.
 * 그래서 만료(`expired`)된 방은 다시 `active`로 되살립니다.
 *
 * 다만 호스트가 **직접 끝낸 방(`ended`)은 되살리지 않습니다.** 이미 모두
 * 떠난 자리를 결제로 다시 열면 아무도 없는 방에 시간만 붙습니다.
 */
async function extendUsage(
  tx: Tx,
  extend: { sessionId: string; minutes: number },
): Promise<ExtendOutcome> {
  const rows = await tx`
    select session_status from public.lounge_usages
    where session_id = ${extend.sessionId} for update`;

  if (rows.length === 0) return { ok: false, reason: "not_found" };
  if (rows[0].session_status === "ended") {
    return { ok: false, reason: "closed" };
  }

  const updated = await tx`
    update public.lounge_usages set
      expires_at = greatest(expires_at, now())
        + (${extend.minutes} * interval '1 minute'),
      extended_minutes = extended_minutes + ${extend.minutes},
      session_status = 'active',
      ended_at = null
    where session_id = ${extend.sessionId}
    returning expires_at`;

  return { ok: true, expiresAt: iso(updated[0].expires_at) };
}

/* ------------------------------------------------------------------ adapter */

export class PostgresAdapter implements DataAdapter {
  private sql = client();

  async getPrimaryClub(): Promise<Club> {
    const rows = await this.sql`
      select * from public.clubs where is_active order by created_at limit 1`;
    if (rows.length === 0) throw new Error("활성 클럽이 없습니다.");
    return mapClub(rows[0]);
  }

  async getOperatingHours(clubId: string): Promise<OperatingHour[]> {
    const rows = await this.sql`
      select * from public.operating_hours where club_id = ${clubId} order by day_of_week`;
    return rows.map(mapOperatingHour);
  }

  /* ---------------------------------------------------------- 계정 · 인증 */

  async getUser(id: string): Promise<User | null> {
    const rows = await this.sql`select * from public.users where id = ${id} limit 1`;
    return rows.length ? mapUser(rows[0]) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.sql`
      select * from public.users where lower(email) = ${email.trim().toLowerCase()} limit 1`;
    return rows.length ? mapUser(rows[0]) : null;
  }

  async getUserByGoogleSub(sub: string): Promise<User | null> {
    const rows = await this.sql`
      select * from public.users where google_sub = ${sub} limit 1`;
    return rows.length ? mapUser(rows[0]) : null;
  }

  async linkGoogleAccount(userId: string, sub: string): Promise<void> {
    await this.sql`
      update public.users
      set google_sub = ${sub}, updated_at = now()
      where id = ${userId}`;
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    await this.sql`
      update public.users
      set email = ${email.trim().toLowerCase()}, updated_at = now()
      where id = ${userId}`;
  }

  async getCredentialsByEmail(email: string): Promise<Credentials | null> {
    const rows = await this.sql`
      select * from public.users where lower(email) = ${email.trim().toLowerCase()} limit 1`;
    if (rows.length === 0) return null;
    return {
      user: mapUser(rows[0]),
      passwordHash: (rows[0].password_hash as string) ?? null,
    };
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const rows = await this.sql`
      insert into public.users (email, password_hash, google_sub, gender)
      values (
        ${input.email.trim().toLowerCase()},
        ${input.passwordHash},
        ${input.googleSub ?? null},
        ${input.gender ?? null}
      )
      returning *`;
    return mapUser(rows[0]);
  }

  async setGenderIfUnset(userId: string, gender: Gender): Promise<void> {
    // `gender is null`이 조건에 있어야 덮어쓰기가 원천적으로 막힙니다.
    await this.sql`
      update public.users
      set gender = ${gender}::public.gender, updated_at = now()
      where id = ${userId} and gender is null`;
  }

  async confirmAdult(userId: string, birthYear: number): Promise<void> {
    await this.sql`
      update public.users
      set birth_year = ${birthYear}, adult_confirmed_at = now(), updated_at = now()
      where id = ${userId}`;
  }

  async saveConsents(
    userId: string,
    version: string,
    entries: ConsentInput[],
  ): Promise<void> {
    for (const entry of entries) {
      await this.sql`
        insert into public.consents (user_id, consent_type, version, granted, granted_at, revoked_at)
        values (
          ${userId}, ${entry.consentType}, ${version}, ${entry.granted},
          ${entry.granted ? this.sql`now()` : null},
          ${entry.granted ? null : this.sql`now()`}
        )
        on conflict (user_id, consent_type) do update set
          version = excluded.version,
          granted = excluded.granted,
          granted_at = excluded.granted_at,
          revoked_at = excluded.revoked_at`;
    }
  }

  async getConsents(userId: string): Promise<Consent[]> {
    const rows = await this.sql`
      select * from public.consents where user_id = ${userId}`;
    return rows.map(mapConsent);
  }

  async markConsentCompleted(userId: string): Promise<void> {
    await this.sql`
      update public.users set consent_completed_at = now(), updated_at = now()
      where id = ${userId}`;
  }

  async markOnboardingCompleted(userId: string): Promise<void> {
    await this.sql`
      update public.users set onboarding_completed_at = now(), updated_at = now()
      where id = ${userId}`;
  }

  /* -------------------------------------------------------------- 프로필 */

  async getProfile(userId: string): Promise<Profile | null> {
    const rows = await this.sql`
      select * from public.profiles where user_id = ${userId} limit 1`;
    return rows.length ? mapProfile(rows[0]) : null;
  }

  async upsertProfile(userId: string, input: ProfileInput): Promise<Profile> {
    const rows = await this.sql`
      insert into public.profiles
        (user_id, nickname, gender, age_band, region, languages, interests,
         conversation_style, group_vibe)
      values (
        ${userId}, ${input.nickname}, ${input.gender}, ${input.ageBand},
        ${input.region}, ${this.sql.array(input.languages)},
        ${this.sql.array(input.interests)}, ${input.conversationStyle},
        ${input.groupVibe}
      )
      on conflict (user_id) do update set
        nickname = excluded.nickname,
        gender = excluded.gender,
        age_band = excluded.age_band,
        region = excluded.region,
        languages = excluded.languages,
        interests = excluded.interests,
        conversation_style = excluded.conversation_style,
        group_vibe = excluded.group_vibe
      returning *`;
    return mapProfile(rows[0]);
  }

  async getActiveTableForUser(userId: string): Promise<Table | null> {
    const rows = await this.sql`
      select t.* from public.tables t
      join public.table_members m on m.table_id = t.id
      where m.user_id = ${userId} and m.left_at is null
      limit 1`;
    return rows.length ? mapTable(rows[0]) : null;
  }

  async getTable(id: string): Promise<Table | null> {
    const rows = await this.sql`select * from public.tables where id = ${id} limit 1`;
    return rows.length ? mapTable(rows[0]) : null;
  }

  async getActiveTableMembers(tableId: string): Promise<TableMember[]> {
    const rows = await this.sql`
      select * from public.table_members
      where table_id = ${tableId} and left_at is null
      order by joined_at`;
    return rows.map(mapMember);
  }

  async getProfilesForTable(tableId: string): Promise<Profile[]> {
    const rows = await this.sql`
      select p.* from public.profiles p
      join public.table_members m on m.user_id = p.user_id
      where m.table_id = ${tableId} and m.left_at is null
      order by m.joined_at`;
    return rows.map(mapProfile);
  }

  async getTablePreferences(tableId: string): Promise<TablePreferences | null> {
    const rows = await this.sql`
      select * from public.table_preferences where table_id = ${tableId} limit 1`;
    return rows.length ? mapPrefs(rows[0]) : null;
  }

  async createLounge(input: CreateLoungeInput): Promise<Table> {
    const existing = await this.getActiveTableForUser(input.userId);
    if (existing) {
      const rows = await this.sql`
        update public.tables set
          waiter_id = ${input.waiterId},
          region_code = ${input.regionCode},
          updated_at = now()
        where id = ${existing.id} returning *`;
      return mapTable(rows[0]);
    }

    let created: Table | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      try {
        const rows = await this.sql`
          insert into public.tables (
            club_id, host_user_id, name, state, max_size, invite_code,
            waiter_id, region_code
          )
          values (
            (select id from public.clubs where is_active order by created_at limit 1),
            ${input.userId}, ${input.name}, 'FORMING', 4, ${inviteCode()},
            ${input.waiterId}, ${input.regionCode}
          ) returning *`;
        created = mapTable(rows[0]);
      } catch (e) {
        // invite_code 유니크 충돌이면 재시도
        if (attempt === 4) throw e;
      }
    }
    const table = created as Table;

    await this.sql`
      insert into public.table_members (table_id, user_id, role)
      values (${table.id}, ${input.userId}, 'host')`;
    await this.sql`
      insert into public.table_preferences (table_id, desired_gender, energy)
      values (${table.id}, 'any', 'balanced')
      on conflict (table_id) do nothing`;

    return table;
  }

  async joinTableByCode(userId: string, code: string): Promise<JoinResult> {
    const rows = await this.sql`
      select * from public.tables where upper(invite_code) = ${code.trim().toUpperCase()} limit 1`;
    if (rows.length === 0) return { ok: false, reason: "not_found" };

    const table = mapTable(rows[0]);
    if (table.closedAt || table.state === "CLOSED") {
      return { ok: false, reason: "closed" };
    }

    const members = await this.getActiveTableMembers(table.id);
    if (members.some((m) => m.userId === userId)) {
      return { ok: false, reason: "already_member" };
    }
    if (await this.getActiveTableForUser(userId)) {
      return { ok: false, reason: "in_other" };
    }
    if (members.length >= table.maxSize) return { ok: false, reason: "full" };

    await this.sql`
      insert into public.table_members (table_id, user_id, role)
      values (${table.id}, ${userId}, 'member')`;

    const club = await this.getPrimaryClub();
    if (table.state === "FORMING" && members.length + 1 >= club.minTableSize) {
      await this.sql`
        update public.tables set state = 'READY', updated_at = now() where id = ${table.id}`;
      table.state = "READY";
    }
    return { ok: true, table };
  }

  async addMemberToTable(tableId: string, userId: string): Promise<void> {
    const table = await this.getTable(tableId);
    if (!table) return;

    const members = await this.getActiveTableMembers(tableId);
    if (members.length >= table.maxSize) return;
    if (members.some((m) => m.userId === userId)) return;
    if (await this.getActiveTableForUser(userId)) return;

    await this.sql`
      insert into public.table_members (table_id, user_id, role)
      values (${tableId}, ${userId}, 'member')`;

    const club = await this.getPrimaryClub();
    if (table.state === "FORMING" && members.length + 1 >= club.minTableSize) {
      await this.sql`
        update public.tables set state = 'READY', updated_at = now() where id = ${tableId}`;
    }
  }

  async leaveTable(userId: string, tableId: string): Promise<void> {
    const updated = await this.sql`
      update public.table_members set left_at = now()
      where table_id = ${tableId} and user_id = ${userId} and left_at is null
      returning id`;
    if (updated.length === 0) return;

    const remaining = await this.getActiveTableMembers(tableId);
    if (remaining.length === 0) {
      await this.sql`
        update public.tables set state = 'CLOSED', closed_at = now(), updated_at = now()
        where id = ${tableId}`;
      return;
    }

    const table = await this.getTable(tableId);
    if (table && table.hostUserId === userId) {
      // 호스트가 나가면 남은 최고참이 승계합니다.
      const heir = remaining[0];
      await this.sql`
        update public.tables set host_user_id = ${heir.userId}, updated_at = now()
        where id = ${tableId}`;
      await this.sql`
        update public.table_members set role = 'host' where id = ${heir.id}`;

      const club = await this.getPrimaryClub();
      if (table.state === "READY" && remaining.length < club.minTableSize) {
        await this.sql`
          update public.tables set state = 'FORMING', updated_at = now() where id = ${tableId}`;
      }
    }
  }

  async setTableState(tableId: string, state: TableState): Promise<void> {
    await this.sql`
      update public.tables
      set state = ${state}::public.table_state,
          waiting_since = case when ${state} = 'WAITING' then now() else waiting_since end,
          updated_at = now()
      where id = ${tableId}`;
  }

  async setMatchPreference(
    tableId: string,
    pref: MatchPreferenceInput,
  ): Promise<void> {
    await this.sql`
      insert into public.table_preferences
        (table_id, desired_gender, energy, interests, age_bands)
      values (
        ${tableId}, ${pref.desiredGender}, ${pref.energy},
        ${this.sql.array(pref.interests)}, ${this.sql.array(pref.ageBands)}
      )
      on conflict (table_id) do update set
        desired_gender = excluded.desired_gender,
        energy = excluded.energy,
        interests = excluded.interests,
        age_bands = excluded.age_bands,
        updated_at = now()`;

    await this.sql`
      update public.tables set state = 'WAITING', waiting_since = now(), updated_at = now()
      where id = ${tableId}`;
  }

  async findBestMatch(tableId: string): Promise<MatchCandidate | null> {
    const pref = await this.getTablePreferences(tableId);
    if (!pref) return null;

    const myMemberIds = new Set(
      (await this.getActiveTableMembers(tableId)).map((m) => m.userId),
    );

    // 매칭은 **같은 지역 안에서만** 이뤄집니다. 지역이 정해지지 않은 라운지는
    // (지역 선택이 생기기 전에 만들어진 것) 어느 쪽으로도 매칭되지 않습니다.
    const myRegion = (await this.getTable(tableId))?.regionCode ?? null;
    if (!myRegion) return null;

    const candidateTables = await this.sql`
      select * from public.tables
      where id <> ${tableId}
        and state in ('WAITING', 'READY')
        and closed_at is null
        and region_code = ${myRegion}`;

    let best: MatchCandidate | null = null;

    for (const row of candidateTables) {
      const table = mapTable(row);
      const profiles = await this.getProfilesForTable(table.id);
      if (profiles.length === 0) continue;
      if (profiles.some((p) => myMemberIds.has(p.userId))) continue;

      const candidatePrefs = await this.getTablePreferences(table.id);
      const { eligible, score, reasons } = scoreCandidate(
        {
          desiredGender: pref.desiredGender,
          energy: pref.energy,
          interests: pref.interests,
          ageBands: pref.ageBands,
        },
        profiles,
        candidatePrefs?.energy ?? null,
      );
      if (!eligible) continue;

      const candidate: MatchCandidate = { table, score, reasons, profiles };
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
    await this.sql`
      delete from public.bookings
      where requester_table_id = ${requesterTableId} and state = 'PENDING'`;
    const rows = await this.sql`
      insert into public.bookings
        (requester_table_id, matched_table_id, waiter_id, score, reasons, expires_at)
      values (
        ${requesterTableId}, ${candidate.table.id}, ${waiterId},
        ${candidate.score}, ${this.sql.json(candidate.reasons)},
        now() + interval '5 minutes'
      ) returning *`;
    await this.sql`
      update public.tables set state = 'MATCH_PROPOSED', updated_at = now()
      where id in (${requesterTableId}, ${candidate.table.id})`;
    return mapBooking(rows[0]);
  }

  /** 만료된 PENDING 제안을 정리합니다(읽기 시점 지연 평가). */
  private async expireStale(): Promise<void> {
    const expired = await this.sql`
      update public.bookings set state = 'EXPIRED'
      where state = 'PENDING' and expires_at <= now()
      returning requester_table_id, matched_table_id`;
    for (const row of expired) {
      await this.sql`
        update public.tables
        set state = 'WAITING', waiting_since = now(), updated_at = now()
        where id in (${row.requester_table_id as string}, ${row.matched_table_id as string})
          and state = 'MATCH_PROPOSED'`;
    }
  }

  async getBookingForTable(tableId: string): Promise<Booking | null> {
    await this.expireStale();
    const rows = await this.sql`
      select * from public.bookings
      where requester_table_id = ${tableId} or matched_table_id = ${tableId}
      order by created_at desc limit 1`;
    return rows.length ? mapBooking(rows[0]) : null;
  }

  async getBooking(id: string): Promise<Booking | null> {
    await this.expireStale();
    const rows = await this.sql`select * from public.bookings where id = ${id} limit 1`;
    return rows.length ? mapBooking(rows[0]) : null;
  }

  async respondToBooking(
    bookingId: string,
    side: "requester" | "matched",
    response: "accepted" | "declined",
  ): Promise<Booking | null> {
    await this.expireStale();
    const column =
      side === "requester" ? this.sql`requester_response` : this.sql`matched_response`;
    const rows = await this.sql`
      update public.bookings
      set ${column} = ${response}::public.booking_response
      where id = ${bookingId} and state = 'PENDING'
      returning *`;
    if (rows.length === 0) return this.getBooking(bookingId);

    const b = mapBooking(rows[0]);
    if (b.requesterResponse === "declined" || b.matchedResponse === "declined") {
      await this.sql`update public.bookings set state = 'DECLINED' where id = ${b.id}`;
      await this.sql`
        update public.tables
        set state = 'WAITING', waiting_since = now(), updated_at = now()
        where id in (${b.requesterTableId}, ${b.matchedTableId}) and state = 'MATCH_PROPOSED'`;
      b.state = "DECLINED";
    } else if (
      b.requesterResponse === "accepted" &&
      b.matchedResponse === "accepted"
    ) {
      await this.sql`update public.bookings set state = 'ACCEPTED' where id = ${b.id}`;
      await this.sql`
        update public.tables set state = 'MATCH_ACCEPTED', updated_at = now()
        where id in (${b.requesterTableId}, ${b.matchedTableId})`;
      b.state = "ACCEPTED";
    }
    return b;
  }

  async attachSessionToBooking(
    bookingId: string,
    sessionId: string,
  ): Promise<void> {
    const rows = await this.sql`
      update public.bookings set session_id = ${sessionId}
      where id = ${bookingId}
      returning requester_table_id, matched_table_id`;
    if (rows.length === 0) return;
    await this.sql`
      update public.tables set state = 'LIVE', updated_at = now()
      where id in (${rows[0].requester_table_id as string}, ${rows[0].matched_table_id as string})`;
  }

  /* --------------------------------------------------- 이용권 지갑 · 결제 */

  async getWallet(userId: string): Promise<PassWallet> {
    const rows = await this.sql`
      insert into public.pass_wallets (user_id) values (${userId})
      on conflict (user_id) do update set user_id = excluded.user_id
      returning *`;
    return mapWallet(rows[0]);
  }

  /**
   * 결제 기록과 매치 횟수 지급을 **한 트랜잭션**으로 처리합니다.
   *
   * 멱등의 핵심은 `on conflict (payment_id) do nothing`입니다. 웹훅이 동시에
   * 두 번 도착해도 삽입에 성공한 쪽만 반환 행을 받고, 나머지는 빈 결과라
   * 지갑을 건드리지 않습니다.
   */
  async recordPurchase(
    input: RecordPurchaseInput,
  ): Promise<RecordPurchaseResult> {
    return this.sql.begin(async (tx) => {
      const inserted = await tx`
        insert into public.payments (
          payment_id, user_id, product_id, plan_code,
          amount, currency, purchased_matches, payment_status
        ) values (
          ${input.paymentId}, ${input.userId}, ${input.productId}, ${input.planCode},
          ${input.amount}, ${input.currency}, ${input.purchasedMatches}, 'paid'
        )
        on conflict (payment_id) do nothing
        returning payment_id`;

      if (inserted.length === 0) return { applied: false, extend: null };

      // 시간 연장 상품은 횟수를 주는 대신 이 방의 만료 시각을 늘립니다.
      // 결제 기록 삽입과 같은 트랜잭션이라, 중복 웹훅으로 두 번 늘어나지
      // 않고 "기록은 남았는데 시간은 그대로"인 상태도 생기지 않습니다.
      let extend: ExtendOutcome | null = null;
      if (input.extend) {
        extend = await extendUsage(tx, input.extend);
      }

      await tx`
        insert into public.pass_wallets (
          user_id, remaining_matches, total_purchased_matches, updated_at
        ) values (
          ${input.userId}, ${input.purchasedMatches},
          ${input.purchasedMatches}, now()
        )
        on conflict (user_id) do update set
          remaining_matches =
            public.pass_wallets.remaining_matches + ${input.purchasedMatches},
          total_purchased_matches =
            public.pass_wallets.total_purchased_matches + ${input.purchasedMatches},
          updated_at = now()`;

      return { applied: true, extend };
    });
  }

  async refundPayment(
    paymentId: string,
  ): Promise<{ applied: boolean; reclaimed: number }> {
    return this.sql.begin(async (tx) => {
      // 아직 환불되지 않은 결제만 잡습니다(멱등).
      const marked = await tx`
        update public.payments
        set payment_status = 'refunded', refunded_at = now()
        where payment_id = ${paymentId} and payment_status <> 'refunded'
        returning user_id, purchased_matches`;

      if (marked.length === 0) return { applied: false, reclaimed: 0 };

      const userId = marked[0].user_id as string;
      const purchased = Number(marked[0].purchased_matches);
      if (purchased === 0) return { applied: true, reclaimed: 0 };

      // 이미 써 버린 횟수는 되돌릴 수 없으므로 **남은 만큼만** 회수합니다.
      // 잔액을 잠근 뒤 실제 회수량을 계산해, 음수로 내려가지 않게 합니다.
      const wallet = await tx`
        select remaining_matches from public.pass_wallets
        where user_id = ${userId} for update`;

      const remaining = Number(wallet[0]?.remaining_matches ?? 0);
      const reclaimed = Math.min(remaining, purchased);
      if (reclaimed === 0) return { applied: true, reclaimed: 0 };

      await tx`
        update public.pass_wallets
        set remaining_matches = remaining_matches - ${reclaimed}, updated_at = now()
        where user_id = ${userId}`;

      return { applied: true, reclaimed };
    });
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const rows = await this.sql`
      select * from public.payments where payment_id = ${paymentId} limit 1`;
    return rows.length ? mapPayment(rows[0]) : null;
  }

  async listPaymentsForUser(
    userId: string,
    limit = 50,
  ): Promise<PaymentRecord[]> {
    const rows = await this.sql`
      select * from public.payments
      where user_id = ${userId}
      order by created_at desc limit ${limit}`;
    return rows.map(mapPayment);
  }

  async adjustMatches(userId: string, delta: number): Promise<PassWallet> {
    const rows = await this.sql`
      insert into public.pass_wallets (user_id, remaining_matches, total_purchased_matches, updated_at)
      values (${userId}, ${Math.max(0, delta)}, ${Math.max(0, delta)}, now())
      on conflict (user_id) do update set
        remaining_matches = greatest(0, public.pass_wallets.remaining_matches + ${delta}),
        total_purchased_matches =
          public.pass_wallets.total_purchased_matches + ${Math.max(0, delta)},
        updated_at = now()
      returning *`;
    return mapWallet(rows[0]);
  }

  /* ------------------------------------------------------- 영상방 시간 기록 */

  /**
   * 매치 횟수 차감 + 방 시간 기록 확보를 한 트랜잭션으로 처리합니다.
   *
   * 두 가지가 서로 다른 단위로 움직입니다.
   *
   *   방의 시간   `lounge_usages` — 방 하나당 1행. 먼저 들어온 사람이 만들고
   *               뒤이어 들어오는 사람은 그 행을 그대로 씁니다.
   *   내 횟수     `session_match_uses` — (방, 사람)당 1행. 각자 1회씩.
   *
   * 잠금 순서는 "내 지갑 `for update` → 내 사용 기록 확인"입니다. 확인을 먼저
   * 하면 같은 사람의 동시 요청(새로고침 연타·다중 탭)이 둘 다 "기록 없음"을
   * 보고 진행해 뒤쪽이 기본키 충돌로 터집니다. 잠금을 먼저 잡으면 뒤쪽은
   * 앞쪽이 커밋한 기록을 보고 조용히 재입장으로 처리됩니다.
   */
  async startLoungeUsage(input: {
    sessionId: string;
    userId: string;
    ownerUserId: string;
    roomId: string;
    minutes: number;
  }): Promise<StartUsageResult> {
    return this.sql.begin(async (tx) => {
      await tx`
        insert into public.pass_wallets (user_id) values (${input.userId})
        on conflict (user_id) do nothing`;

      const wallet = await tx`
        select remaining_matches from public.pass_wallets
        where user_id = ${input.userId} for update`;

      // 잠금을 얻은 **뒤에** 읽어야 앞선 트랜잭션이 커밋한 행이 보입니다.
      // (READ COMMITTED에서 각 문장은 실행 시점의 스냅샷을 봅니다.)
      const used = await tx`
        select 1 from public.session_match_uses
        where session_id = ${input.sessionId} and user_id = ${input.userId}`;

      const alreadyUsed = used.length > 0;
      if (!alreadyUsed && Number(wallet[0]?.remaining_matches ?? 0) < 1) {
        return { ok: false, reason: "no_matches" as const };
      }

      if (!alreadyUsed) {
        await tx`
          update public.pass_wallets
          set remaining_matches = remaining_matches - 1, updated_at = now()
          where user_id = ${input.userId}`;
        await tx`
          insert into public.session_match_uses (session_id, user_id)
          values (${input.sessionId}, ${input.userId})`;
      }

      // 방의 시간 기록은 방 하나당 1행입니다. 동시에 두 명이 들어와도 한쪽만
      // 삽입에 성공하고, 실패한 쪽은 아래 조회로 같은 행을 받습니다.
      await tx`
        insert into public.lounge_usages (
          session_id, user_id, room_id, started_at, expires_at, session_status
        ) values (
          ${input.sessionId}, ${input.ownerUserId}, ${input.roomId},
          now(), now() + (${input.minutes} * interval '1 minute'), 'active'
        )
        on conflict (session_id) do nothing`;

      const usage = await tx`
        select * from public.lounge_usages
        where session_id = ${input.sessionId}`;

      return { ok: true, usage: mapUsage(usage[0]), charged: !alreadyUsed };
    });
  }

  async getLoungeUsage(sessionId: string): Promise<LoungeUsage | null> {
    const rows = await this.sql`
      select * from public.lounge_usages
      where session_id = ${sessionId} limit 1`;
    return rows.length ? mapUsage(rows[0]) : null;
  }

  /**
   * 이용 기록을 닫습니다.
   *
   * `expired`(시간 만료)는 진행 중인 방에만 찍습니다. `ended`(사람이 방을 닫음)는
   * 이미 만료된 방에도 찍을 수 있어야 합니다 — 시간이 끝난 뒤 호스트가 종료한
   * 방이 뒤늦은 연장 결제로 되살아나면 안 되기 때문입니다.
   */
  async endLoungeUsage(
    sessionId: string,
    status: LoungeSessionStatus,
  ): Promise<void> {
    await this.sql`
      update public.lounge_usages
      set session_status = ${status}::public.lounge_session_status, ended_at = now()
      where session_id = ${sessionId}
        and session_status <> 'ended'
        and (session_status = 'active' or ${status} = 'ended')`;
  }

  async listUsagesForUser(userId: string, limit = 50): Promise<LoungeUsage[]> {
    const rows = await this.sql`
      select * from public.lounge_usages
      where user_id = ${userId}
      order by started_at desc limit ${limit}`;
    return rows.map(mapUsage);
  }

  /* -------------------------------------------------------------- 관리자 */

  async listUsers(limit = 100): Promise<User[]> {
    const rows = await this.sql`
      select * from public.users order by created_at desc limit ${limit}`;
    return rows.map(mapUser);
  }

  async listPayments(limit = 200): Promise<PaymentRecord[]> {
    const rows = await this.sql`
      select * from public.payments order by created_at desc limit ${limit}`;
    return rows.map(mapPayment);
  }

  async listUsages(limit = 200): Promise<LoungeUsage[]> {
    const rows = await this.sql`
      select * from public.lounge_usages order by started_at desc limit ${limit}`;
    return rows.map(mapUsage);
  }

  async listWallets(limit = 200): Promise<PassWallet[]> {
    const rows = await this.sql`
      select * from public.pass_wallets order by updated_at desc limit ${limit}`;
    return rows.map(mapWallet);
  }

  async setUserStatus(userId: string, status: AccountStatus): Promise<void> {
    await this.sql`
      update public.users set status = ${status}::public.account_status, updated_at = now()
      where id = ${userId}`;
  }

  async listTables(limit = 100): Promise<Table[]> {
    const rows = await this.sql`
      select * from public.tables order by updated_at desc limit ${limit}`;
    return rows.map(mapTable);
  }

  async listBookings(limit = 100): Promise<Booking[]> {
    await this.expireStale();
    const rows = await this.sql`
      select * from public.bookings order by created_at desc limit ${limit}`;
    return rows.map(mapBooking);
  }
}
