import postgres from "postgres";

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
  OperatingHour,
  Profile,
  Table,
  TableMember,
  TablePreferences,
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
    createdAt: iso(r.created_at),
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

  async getUser(id: string) {
    const rows = await this.sql`select * from public.users where id = ${id} limit 1`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id as string,
      email: r.email as string,
      role: r.role as "user" | "moderator" | "admin",
      status: r.status as "active" | "suspended" | "banned",
      adultConfirmedAt: isoOrNull(r.adult_confirmed_at),
      birthYear: r.birth_year == null ? null : Number(r.birth_year),
      onboardingCompletedAt: isoOrNull(r.onboarding_completed_at),
      createdAt: iso(r.created_at),
    };
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const rows = await this.sql`
      select * from public.profiles where user_id = ${userId} limit 1`;
    return rows.length ? mapProfile(rows[0]) : null;
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
      delete from public.bookings where requester_table_id = ${requesterTableId}`;
    const rows = await this.sql`
      insert into public.bookings
        (requester_table_id, matched_table_id, waiter_id, score, reasons)
      values (
        ${requesterTableId}, ${candidate.table.id}, ${waiterId},
        ${candidate.score}, ${this.sql.json(candidate.reasons)}
      ) returning *`;
    await this.sql`
      update public.tables set state = 'MATCH_PROPOSED', updated_at = now()
      where id = ${requesterTableId}`;
    return mapBooking(rows[0]);
  }

  async getBookingForTable(tableId: string): Promise<Booking | null> {
    const rows = await this.sql`
      select * from public.bookings
      where requester_table_id = ${tableId}
      order by created_at desc limit 1`;
    return rows.length ? mapBooking(rows[0]) : null;
  }
}
