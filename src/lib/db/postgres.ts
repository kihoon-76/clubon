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
  ProfileInput,
  RecordPurchaseInput,
  StartUsageResult,
} from "./adapter";
import type {
  AccountStatus,
  Booking,
  Club,
  Consent,
  ConversationEnergy,
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
    reasons: (r.reasons as string[]) ?? [],
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
    onboardingCompletedAt: isoOrNull(r.onboarding_completed_at),
    consentCompletedAt: isoOrNull(r.consent_completed_at),
    createdAt: iso(r.created_at),
  };
}

function mapWallet(r: Row): PassWallet {
  return {
    userId: r.user_id as string,
    remainingPasses: Number(r.remaining_passes),
    membershipType: r.membership_type as PassWallet["membershipType"],
    priorityMatchingCredits: Number(r.priority_matching_credits),
    totalPurchasedPasses: Number(r.total_purchased_passes),
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
    purchasedPasses: Number(r.purchased_passes),
    paymentStatus: r.payment_status as PaymentRecord["paymentStatus"],
    createdAt: iso(r.created_at),
    refundedAt: isoOrNull(r.refunded_at),
  };
}

function mapUsage(r: Row): LoungeUsage {
  return {
    sessionId: r.session_id as string,
    payerUserId: r.user_id as string,
    roomId: r.room_id as string,
    startedAt: iso(r.started_at),
    expiresAt: iso(r.expires_at),
    endedAt: isoOrNull(r.ended_at),
    deductedPasses: Number(r.deducted_passes),
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
      insert into public.users (email, password_hash, google_sub)
      values (
        ${input.email.trim().toLowerCase()},
        ${input.passwordHash},
        ${input.googleSub ?? null}
      )
      returning *`;
    return mapUser(rows[0]);
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
        update public.tables set waiter_id = ${input.waiterId}, updated_at = now()
        where id = ${existing.id} returning *`;
      return mapTable(rows[0]);
    }

    let created: Table | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      try {
        const rows = await this.sql`
          insert into public.tables (club_id, host_user_id, name, state, max_size, invite_code, waiter_id)
          values (
            (select id from public.clubs where is_active order by created_at limit 1),
            ${input.userId}, ${input.name}, 'FORMING', 4, ${inviteCode()}, ${input.waiterId}
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

    const candidateTables = await this.sql`
      select * from public.tables
      where id <> ${tableId}
        and state in ('WAITING', 'READY')
        and closed_at is null`;

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
   * 결제 기록과 이용권 지급을 **한 트랜잭션**으로 처리합니다.
   *
   * 멱등의 핵심은 `on conflict (payment_id) do nothing`입니다. 웹훅이 동시에
   * 두 번 도착해도 삽입에 성공한 쪽만 반환 행을 받고, 나머지는 빈 결과라
   * 지갑을 건드리지 않습니다.
   */
  async recordPurchase(
    input: RecordPurchaseInput,
  ): Promise<{ applied: boolean }> {
    return this.sql.begin(async (tx) => {
      const inserted = await tx`
        insert into public.payments (
          payment_id, user_id, product_id, plan_code,
          amount, currency, purchased_passes, payment_status
        ) values (
          ${input.paymentId}, ${input.userId}, ${input.productId}, ${input.planCode},
          ${input.amount}, ${input.currency}, ${input.purchasedPasses}, 'paid'
        )
        on conflict (payment_id) do nothing
        returning payment_id`;

      if (inserted.length === 0) return { applied: false };

      await tx`
        insert into public.pass_wallets (
          user_id, remaining_passes, membership_type,
          priority_matching_credits, total_purchased_passes, updated_at
        ) values (
          ${input.userId}, ${input.purchasedPasses}, ${input.membershipType}::public.membership_type,
          ${input.priorityMatchingCredits}, ${input.purchasedPasses}, now()
        )
        on conflict (user_id) do update set
          remaining_passes =
            public.pass_wallets.remaining_passes + ${input.purchasedPasses},
          total_purchased_passes =
            public.pass_wallets.total_purchased_passes + ${input.purchasedPasses},
          priority_matching_credits =
            public.pass_wallets.priority_matching_credits + ${input.priorityMatchingCredits},
          -- 등급은 올리기만 합니다. 추가 구매로 VIP가 풀리면 안 됩니다.
          membership_type = case
            when ${input.membershipType} = 'vip' then 'vip'::public.membership_type
            else public.pass_wallets.membership_type
          end,
          updated_at = now()`;

      return { applied: true };
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
        returning user_id, purchased_passes`;

      if (marked.length === 0) return { applied: false, reclaimed: 0 };

      const userId = marked[0].user_id as string;
      const purchased = Number(marked[0].purchased_passes);
      if (purchased === 0) return { applied: true, reclaimed: 0 };

      // 이미 써 버린 이용권은 되돌릴 수 없으므로 **남은 만큼만** 회수합니다.
      // 잔액을 잠근 뒤 실제 회수량을 계산해, 음수로 내려가지 않게 합니다.
      const wallet = await tx`
        select remaining_passes from public.pass_wallets
        where user_id = ${userId} for update`;

      const remaining = Number(wallet[0]?.remaining_passes ?? 0);
      const reclaimed = Math.min(remaining, purchased);
      if (reclaimed === 0) return { applied: true, reclaimed: 0 };

      await tx`
        update public.pass_wallets
        set remaining_passes = remaining_passes - ${reclaimed}, updated_at = now()
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

  async adjustPasses(userId: string, delta: number): Promise<PassWallet> {
    const rows = await this.sql`
      insert into public.pass_wallets (user_id, remaining_passes, total_purchased_passes, updated_at)
      values (${userId}, ${Math.max(0, delta)}, ${Math.max(0, delta)}, now())
      on conflict (user_id) do update set
        remaining_passes = greatest(0, public.pass_wallets.remaining_passes + ${delta}),
        total_purchased_passes =
          public.pass_wallets.total_purchased_passes + ${Math.max(0, delta)},
        updated_at = now()
      returning *`;
    return mapWallet(rows[0]);
  }

  /* ------------------------------------------------------- 라운지 이용 기록 */

  /**
   * 이용권 차감 + 이용 기록 생성을 한 트랜잭션으로 처리합니다.
   *
   * 지갑 행을 `for update`로 잠가 같은 회원의 동시 요청을 직렬화합니다.
   * 이미 기록이 있으면(재접속) 잔액을 건드리지 않고 그대로 돌려줍니다.
   */
  async startLoungeUsage(input: {
    sessionId: string;
    payerUserId: string;
    roomId: string;
    minutes: number;
  }): Promise<StartUsageResult> {
    return this.sql.begin(async (tx) => {
      await tx`
        insert into public.pass_wallets (user_id) values (${input.payerUserId})
        on conflict (user_id) do nothing`;

      // 부담자의 지갑을 **먼저** 잠급니다.
      //
      // 순서가 중요합니다. 존재 확인을 잠금보다 먼저 하면, 한 방에 여러 명이
      // 동시에 입장할 때 두 트랜잭션이 모두 "기록 없음"을 보고 진행해 뒤쪽이
      // 기본키 충돌로 실패합니다(입장 자체가 에러가 됩니다). 잠금을 먼저 잡으면
      // 뒤쪽 트랜잭션은 앞쪽이 커밋한 기록을 보고 조용히 무료 입장 처리됩니다.
      const wallet = await tx`
        select remaining_passes from public.pass_wallets
        where user_id = ${input.payerUserId} for update`;

      // 잠금을 얻은 **뒤에** 읽어야 앞선 트랜잭션이 커밋한 행이 보입니다.
      // (READ COMMITTED에서 각 문장은 실행 시점의 스냅샷을 봅니다.)
      const existing = await tx`
        select * from public.lounge_usages
        where session_id = ${input.sessionId}`;
      if (existing.length > 0) {
        return { ok: true, usage: mapUsage(existing[0]), charged: false };
      }

      if (Number(wallet[0]?.remaining_passes ?? 0) < 1) {
        return { ok: false, reason: "no_passes" as const };
      }

      await tx`
        update public.pass_wallets
        set remaining_passes = remaining_passes - 1, updated_at = now()
        where user_id = ${input.payerUserId}`;

      const inserted = await tx`
        insert into public.lounge_usages (
          session_id, user_id, room_id, started_at, expires_at, deducted_passes, session_status
        ) values (
          ${input.sessionId}, ${input.payerUserId}, ${input.roomId},
          now(), now() + (${input.minutes} * interval '1 minute'), 1, 'active'
        )
        returning *`;

      return { ok: true, usage: mapUsage(inserted[0]), charged: true };
    });
  }

  async getLoungeUsage(sessionId: string): Promise<LoungeUsage | null> {
    const rows = await this.sql`
      select * from public.lounge_usages
      where session_id = ${sessionId} limit 1`;
    return rows.length ? mapUsage(rows[0]) : null;
  }

  async endLoungeUsage(
    sessionId: string,
    status: LoungeSessionStatus,
  ): Promise<void> {
    await this.sql`
      update public.lounge_usages
      set session_status = ${status}::public.lounge_session_status, ended_at = now()
      where session_id = ${sessionId} and session_status = 'active'`;
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
